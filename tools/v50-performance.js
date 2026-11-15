// ===== V5.0 战斗性能实测 =====
// 任务书场景: 满战斗(人数+怪物+特效)而非空场采样:
//   31人+20怪 / 100人+40怪 / 300人+60怪 / 500人+100怪 / Boss+小怪+特效洪峰
// 采集 getPerf(): FPS / P95帧耗时 / DrawCall / 三角形 / 纹理 / 内存趋势
// 输出: docs/V50_PERFORMANCE.json + 控制台表格
// 运行: node tools/v50-performance.js

'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'V50_PERFORMANCE.json');
const PORT = Number(process.env.V50_PERF_PORT || 8253);

const { createHarness } = require('./v42-browser');

const SCENARIOS = [
    { name: '31人+20怪', squad: 31, enemies: 20 },
    { name: '100人+40怪', squad: 100, enemies: 40 },
    { name: '300人+60怪', squad: 300, enemies: 60 },
    { name: '500人+100怪', squad: 500, enemies: 100 },
    { name: 'Boss+小怪+特效洪峰', squad: 220, enemies: 34, boss: true, bulletRain: true },
    { name: '超级尸潮500人+170怪', squad: 500, enemies: 170 }
];

const SAMPLE_MS = 5000;

async function setupScenario(page, s) {
    await page.evaluate(s => {
        const game = window.__game;
        game.levelIndex = 0;
        game.start();
        if (game.pacing && game.pacing.clear) game.pacing.clear();
        if (game.enemies && game.enemies.clear) game.enemies.clear();
        game.squad.reset(s.squad);
        game.squad.x = 0; game.squad.targetX = 0; game.squad.z = 0;
        game.state = 'playing'; game.paused = false;
        game.squad.critChance = 0.3;
        game.squad.freezeStacks = 1;
        game.squad.vampStacks = 1;
        // 怪群: 持续补怪(被杀后重建), 保持"满战斗"
        game.__perfScenario = s;
        game.__perfRefill = function() {
            var want = s.enemies, types = ['normal', 'fast', 'shield', 'split', 'spitter'];
            var alive = game.enemies.aliveCount;
            for (var i = alive; i < want; i++) {
                var t = types[i % types.length];
                game.enemies.spawnEnemy(t, (i % 3 - 1) * 2.1, -11 - (i % 9) * 1.7, t === 'spitter' ? 300 : 160);
            }
            if (s.boss && !game.enemies.boss) {
                game.enemies.spawnEnemy('boss', 0, -22, 200000, 'overlord');
            }
        };
        game.__perfRefill();
        // 原生update外包一层: 每帧补怪+弹雨压力(特效洪峰)
        if (!game.__perfWrapped) {
            game.__perfWrapped = true;
            var origUpdate = game._updateInner.bind(game);
            game._updateInner = function(dt) {
                if (game.__perfScenario && game.__perfScenario.bulletRain && Math.random() < 0.5) {
                    game.effects.burst((Math.random() - 0.5) * 6, 0.6 + Math.random(), game.squad.z - 6 - Math.random() * 8, 0xFFC247, 4, 3, 0.4);
                }
                origUpdate(dt);
                if (game.__perfRefill) game.__perfRefill();
            };
        }
        game.__perfRefill();
    }, s);
}

(async () => {
    const harness = await createHarness({ port: PORT }).start();
    const results = [];
    try {
        const context = await harness.browser.newContext({
            viewport: { width: 390, height: 844 }, deviceScaleFactor: 2
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(harness.baseUrl + '/index.html?quality=2', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 30000 });
        await page.waitForTimeout(600);

        for (const s of SCENARIOS) {
            await setupScenario(page, s);
            await page.waitForTimeout(400); // 预热(着色器编译)
            const sample = await page.evaluate(ms => new Promise(resolve => {
                const perf = window.__game.getPerf();
                const start = performance.now();
                const frames0 = perf.fps;
                setTimeout(function() {
                    const p = window.__game.getPerf();
                    var mem = (performance.memory && performance.memory.usedJSHeapSize) || null;
                    resolve({
                        fps: p.fps, workMs: p.workMs, p95FrameMs: p.p95FrameMs,
                        drawCalls: p.drawCalls, triangles: p.triangles,
                        geometries: p.geometries, textures: p.textures,
                        squadCount: p.squadCount, enemyCount: p.enemyCount,
                        heapMB: mem ? +(mem / 1048576).toFixed(1) : null
                    });
                }, ms);
            }), SAMPLE_MS);
            results.push(Object.assign({ scenario: s.name }, sample));
            console.log(
                s.name.padEnd(14) +
                ' FPS ' + String(sample.fps).padStart(3) +
                ' | work ' + sample.workMs + 'ms' +
                ' | P95帧 ' + sample.p95FrameMs + 'ms' +
                ' | DC ' + sample.drawCalls +
                ' | Tri ' + (sample.triangles / 1000).toFixed(0) + 'k' +
                ' | 兵 ' + sample.squadCount + ' 敌 ' + sample.enemyCount +
                (sample.heapMB ? ' | 堆 ' + sample.heapMB + 'MB' : '')
            );
        }

        if (errors.length) console.warn('[pageerrors]', errors.slice(0, 3).join(' | '));
        const report = {
            timestamp: new Date().toISOString(),
            userAgent: await page.evaluate(() => navigator.userAgent),
            viewport: '390x844@2x',
            quality: await page.evaluate(() => window.__game.world.quality),
            scenarios: results,
            pageErrors: errors,
            targets: {
                midHigh: '中高端稳定60FPS(桌面集显/真机中高端参考)',
                lowEnd: '低端30FPS(quality=0自动降级)',
                note: '本表为桌面浏览器实测; 真机表现需以实际设备为准'
            }
        };
        fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
        console.log('\n已保存 ' + OUT);

        // 自动降档检查: quality=0 下 500人+100怪 是否≥30FPS
        const page2 = await context.newPage();
        await page2.goto(harness.baseUrl + '/index.html?quality=0', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page2.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });
        await setupScenario(page2, SCENARIOS[3]);
        await page2.waitForTimeout(400);
        const lowQ = await page2.evaluate(ms => new Promise(resolve => {
            setTimeout(function() { resolve(window.__game.getPerf()); }, ms);
        }), SAMPLE_MS);
        report.lowQuality500 = { fps: lowQ.fps, drawCalls: lowQ.drawCalls, triangles: lowQ.triangles, quality: 0 };
        fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
        console.log('低画质(quality=0) 500人+100怪: FPS ' + lowQ.fps + ' | DC ' + lowQ.drawCalls);
    } finally {
        await harness.close();
    }
})().catch(e => { console.error('[v50-performance] FAILED:', e.message); process.exit(1); });
