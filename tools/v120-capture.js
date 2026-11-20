// ===== V12 视觉升级 前后对比截图采集 =====
// 全部截图来自真实 Game/Three.js 渲染管线(复用 V5.0 采集逻辑, 增加成长页/排行榜/性能快照)。
// 用法: node tools/v120-capture.js   (V120_OUT=docs/screenshots/v120-before 可改输出目录)
//   docs/screenshots/<out>/
//     home-<w>.png / combat-<w>.png      响应式矩阵(320/360/390/430)
//     final-combat-390.png               军团+全敌型+精英+Boss+门+子弹+HUD
//     boss-390.png / gates-390.png       Boss战 / 四稀有度状态门
//     win-390.png / lose-390.png         结算
//     rank-390.png / armory-390.png / map-390.png / shop-390.png / pause-390.png
//     perf-390.json                      renderer.info 性能快照(calls/tris)

'use strict';

const fs = require('fs');
const path = require('path');
const {
    ROOT,
    createHarness,
    seededContext,
    waitForGameReady,
    watchPageErrors
} = require('./v42-browser');

const OUT = path.join(ROOT, process.env.V120_OUT || 'docs/screenshots/v120-before');
const PORT = Number(process.env.V120_CAPTURE_PORT || 8253);
const SEED = 0x50beeefd;

const VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 }
];

function mkdirp(dir) { fs.mkdirSync(dir, { recursive: true }); }

async function openPage(browser, baseUrl, viewport) {
    const context = await seededContext(browser, viewport, 2, SEED);
    const page = await context.newPage();
    const errors = watchPageErrors(page);
    await page.goto(`${baseUrl}/index.html?v120capture=1&quality=2`, {
        waitUntil: 'domcontentloaded', timeout: 30000
    });
    await waitForGameReady(page, 30000);
    return { context, page, errors };
}

async function shot(page, name, expected) {
    const out = path.join(OUT, name);
    await page.screenshot({ path: out });
    expected.push(out);
    console.log('captured ' + name);
}

/** 开始一局并注入真实战斗: 不暂停, 真实跑帧直到截帧 */
async function startRealCombat(page, opts) {
    const o = Object.assign({ count: 120, gates: true, enemies: true, boss: false, runFrames: 50 }, opts);
    await page.evaluate(o => {
        const game = window.__game;
        game.levelIndex = 0;
        game.start();
        if (game.pacing && game.pacing.clear) game.pacing.clear();
        if (game.enemies && game.enemies.clear) game.enemies.clear();
        game.squad.reset(o.count);
        game.squad.x = 0; game.squad.targetX = 0; game.squad.z = 0;
        game.state = 'playing'; game.paused = false;
        game.squad.critChance = 0.2;
        game.squad.freezeStacks = 1;
        game.squad.damageBuff = 2;
        if (o.gates) {
            game.gates.loadFromLevel({ segments: [{
                type: 'gates', z: -13, gates: [
                    { lane: 0, op: 'add', value: 20, label: '+20' },
                    { lane: 1, op: 'buff', value: 'freeze', label: '冰冻弹' },
                    { lane: 2, op: 'mul', value: 3, label: '×3' }
                ]
            }] });
        }
        if (o.enemies) {
            const roster = ['normal', 'fast', 'shield', 'split', 'spitter', 'normal', 'fast', 'elite', 'normal', 'shield', 'split', 'fast'];
            let i = 0;
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 3; col++) {
                    const type = roster[i % roster.length];
                    const x = (col - 1) * 2.1 + (row % 2 ? 0.35 : -0.35);
                    const z = -10.5 - row * 3.0;
                    game.enemies.spawnEnemy(type, x, z, type === 'elite' ? 900 : 400);
                    i++;
                }
            }
        }
        if (o.boss) {
            game.enemies.spawnEnemy('boss', 0, -27, 20000, 'overlord');
            game.enemies.boss.phaseIndex = 2;
        }
        for (let f = 0; f < o.runFrames; f++) {
            game._update(1 / 60);
        }
    }, o);
    await page.waitForTimeout(160);
}

/** 性能快照: draw calls / triangles / FPS 采样(与 v101 审计同口径) */
async function perfSnapshot(page, expected) {
    const data = await page.evaluate(async () => {
        const game = window.__game;
        const info = game.world.renderer.info;
        // 采样 120 帧真实帧时间
        const times = [];
        for (let i = 0; i < 120; i++) {
            const t0 = performance.now();
            game._update(1 / 60);
            game.world.renderer.render(game.world.scene, game.world.camera);
            times.push(performance.now() - t0);
        }
        times.sort((a, b) => a - b);
        return {
            calls: info.render.calls,
            tris: info.render.triangles,
            geoms: info.memory.geometries,
            textures: info.memory.textures,
            frameMsAvg: +(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
            frameMsP95: +times[Math.floor(times.length * 0.95)].toFixed(2),
            programs: info.programs ? info.programs.length : null
        };
    });
    const out = path.join(OUT, 'perf-390.json');
    fs.writeFileSync(out, JSON.stringify(data, null, 2));
    expected.push(out);
    console.log('perf: ' + JSON.stringify(data));
}

async function captureViewport(browser, baseUrl, viewport, expected) {
    const { context, page, errors } = await openPage(browser, baseUrl, viewport);
    const w = viewport.width;
    try {
        await page.waitForTimeout(400);
        await shot(page, `home-${w}.png`, expected);
        await startRealCombat(page, { count: 120 });
        await shot(page, `combat-${w}.png`, expected);
    } finally {
        await context.close();
    }
}

async function main() {
    mkdirp(OUT);
    const harness = await createHarness({ port: PORT }).start();
    const browser = harness.browser;
    const baseUrl = harness.baseUrl;
    const expected = [];
    try {
        // 响应式矩阵
        for (const viewport of VIEWPORTS) {
            await captureViewport(browser, baseUrl, viewport, expected);
        }

        // 390 全家桶
        const { context, page, errors } = await openPage(browser, baseUrl, { width: 390, height: 844 });
        try {
            await page.waitForTimeout(400);
            await startRealCombat(page, { count: 180, boss: true, runFrames: 32 });
            await shot(page, 'final-combat-390.png', expected);
            await perfSnapshot(page, expected);

            await startRealCombat(page, { count: 100, boss: true, enemies: false, runFrames: 30 });
            await page.evaluate(() => {
                document.getElementById('boss-warning').classList.remove('hidden');
            });
            await shot(page, 'boss-390.png', expected);

            await startRealCombat(page, { count: 40, enemies: false, runFrames: 20 });
            await page.evaluate(() => {
                const game = window.__game;
                game.gates.clear();
                const rows = [
                    { op: 'add', value: 20, label: '+20' },
                    { op: 'buff', value: 'crit', label: '暴击+10%' },
                    { op: 'mul', value: 3, label: '×3' },
                    { op: 'risk', value: 0, label: '-30% 输出+2' }
                ];
                const segments = rows.map((g, row) => ({
                    type: 'gates', z: -10 - row * 5,
                    gates: [0, 1, 2].map(lane => ({ ...g, lane }))
                }));
                game.gates.loadFromLevel({ segments });
                for (let f = 0; f < 20; f++) game._update(1 / 60);
            });
            await shot(page, 'gates-390.png', expected);

            await page.evaluate(() => {
                const game = window.__game;
                game.paused = false;
                game.winScreenHide = true;
                if (game.ui.winScreen) game.ui.winScreen.classList.add('hidden');
                if (game.ui.loseScreen) game.ui.loseScreen.classList.add('hidden');
                game.squad.setCount(233);
                game.enemies.killCount = 128;
                game.maxCombo = 47;
                game.elapsedTime = 96.4;
                game._win();
            });
            await page.waitForTimeout(900);
            await shot(page, 'win-390.png', expected);
            await page.evaluate(() => {
                const game = window.__game;
                if (game.ui.winScreen) game.ui.winScreen.classList.add('hidden');
                game._lose('被怪潮吞噬 · 人数不足');
            });
            await page.waitForTimeout(400);
            await shot(page, 'lose-390.png', expected);

            // 暂停
            await page.evaluate(() => {
                const game = window.__game;
                if (game.ui.loseScreen) game.ui.loseScreen.classList.add('hidden');
                if (game.ui.pauseScreen) game.ui.pauseScreen.classList.remove('hidden');
            });
            await page.waitForTimeout(200);
            await shot(page, 'pause-390.png', expected);
            await page.evaluate(() => {
                const game = window.__game;
                if (game.ui.pauseScreen) game.ui.pauseScreen.classList.add('hidden');
            });

            // 成长页: 排行 / 军械库 / 地图
            await page.evaluate(() => {
                const game = window.__game;
                if (game.ui.pauseScreen) game.ui.pauseScreen.classList.add('hidden');
                game.state = 'menu';
                V60UI.showPage('v60-rank-page');
                V60UI.renderRank(game);
            });
            await page.waitForTimeout(250);
            await shot(page, 'rank-390.png', expected);
            await page.evaluate(() => {
                V60UI.showPage('v60-armory-page');
                V60UI.renderArmory(window.__game);
            });
            await page.waitForTimeout(250);
            await shot(page, 'armory-390.png', expected);
            await page.evaluate(() => {
                V60UI.showPage('v60-map-page');
                V60UI.renderMap(window.__game);
            });
            await page.waitForTimeout(250);
            await shot(page, 'map-390.png', expected);

            // 升级商店
            await page.evaluate(() => {
                const game = window.__game;
                V60UI.hidePages();
                game._openShop();
            });
            await page.waitForTimeout(250);
            await shot(page, 'shop-390.png', expected);

            if (errors.length) throw new Error('browser errors: ' + errors.join(' | '));
        } finally {
            await context.close();
        }

        const missing = expected.filter(f => !fs.existsSync(f));
        if (missing.length) throw new Error('截图缺失: ' + missing.join(', '));
        console.log(`\nV120 capture complete: ${expected.length} screenshots → ${OUT}`);
    } finally {
        await harness.close();
    }
}

main().catch(err => { console.error('[v120-capture] FAILED:', err.message); process.exit(1); });
