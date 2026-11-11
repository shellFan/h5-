// ===== 性能实测脚本 (Phase 6) =====
// 真实浏览器运行, 采集 getPerf(): FPS/帧耗时/DrawCall/三角形/内存趋势
// 人数矩阵: 1 / 12 / 31 / 100 / 300 / 500
// 输出: tests/screenshots/perf-report.json + 控制台表格
// 运行: node tests/e2e/perf.js

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..', '..');
const OUT_JSON = path.join(ROOT, 'tests', 'screenshots', 'perf-report.json');

const PORT = process.env.E2E_PORT || 8125;
const BASE = 'http://localhost:' + PORT;
const HEADLESS = process.env.E2E_HEADED !== '1';
const COUNTS = [1, 12, 31, 100, 300, 500];
const SAMPLE_MS = 3500; // 每档采样时长

function startServer() {
    return new Promise((resolve) => {
        const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
            env: Object.assign({}, process.env, { PORT: String(PORT), PATH: process.env.PATH }),
            stdio: 'ignore'
        });
        const t0 = Date.now();
        (function poll() {
            require('http').get(BASE + '/index.html', (r) => { r.resume(); resolve(cp); })
                .on('error', () => { if (Date.now() - t0 > 10000) { resolve(cp); return; } setTimeout(poll, 200); });
        })();
    });
}

async function launchBrowser() {
    const candidates = [{ channel: 'msedge' }, { channel: 'chrome' }];
    for (const opt of candidates) {
        try { return await chromium.launch(Object.assign({ headless: HEADLESS }, opt)); }
        catch (e) {}
    }
    throw new Error('未找到系统浏览器');
}

(async () => {
    const server = await startServer();
    const browser = await launchBrowser();
    const results = [];

    try {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
        const page = await ctx.newPage();
        await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.__game, { timeout: 8000 });

        for (const count of COUNTS) {
            // 每档重新加载(干净状态), 开局后设置人数
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => !!window.__game, { timeout: 8000 });
            await page.evaluate((n) => {
                window.__game.start();
                window.__game.squad.setCount(n);
                window.__game.squad.z = -60; // 中段场景(有环境/道路内容)
            }, count);
            await page.waitForTimeout(1200); // 收敛

            // 采样: 每500ms读一次getPerf, 取最后3次均值
            const samples = [];
            const t0 = Date.now();
            while (Date.now() - t0 < SAMPLE_MS) {
                await page.waitForTimeout(500);
                const p = await page.evaluate(() => window.__game.getPerf());
                samples.push(p);
            }
            const last = samples.slice(-3);
            const avg = (k) => Math.round(last.reduce((s, x) => s + (x[k] || 0), 0) / last.length * 10) / 10;
            const rec = {
                count,
                fps: avg('fps'),
                workMs: avg('workMs'),
                p95FrameMs: avg('p95FrameMs'),
                drawCalls: avg('drawCalls'),
                triangles: avg('triangles'),
                geometries: last[last.length - 1].geometries,
                textures: last[last.length - 1].textures,
                quality: last[last.length - 1].quality,
                enemyCount: avg('enemyCount')
            };
            results.push(rec);
            console.log(`${String(count).padStart(4)}人 | FPS=${rec.fps} | 帧耗时=${rec.workMs}ms | P95=${rec.p95FrameMs}ms | DC=${rec.drawCalls} | 三角形=${rec.triangles} | 质量=${rec.quality}`);
        }

        // 内存趋势(500人持续10s)
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !!window.__game, { timeout: 8000 });
        await page.evaluate(() => { window.__game.start(); window.__game.squad.setCount(500); });
        const mem = [];
        for (let i = 0; i < 10; i++) {
            await page.waitForTimeout(1000);
            const m = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
            mem.push(m);
        }
        const trend = {
            startMB: Math.round(mem[0] / 1048576 * 10) / 10,
            endMB: Math.round(mem[mem.length - 1] / 1048576 * 10) / 10,
            growthMB: Math.round((mem[mem.length - 1] - mem[0]) / 1048576 * 10) / 10,
            note: '10秒500人持续运行'
        };
        console.log(`内存趋势(500人10s): ${trend.startMB}MB → ${trend.endMB}MB (增长${trend.growthMB}MB)`);

        fs.writeFileSync(OUT_JSON, JSON.stringify({ device: 'headless-msedge/390x844@dpr2', samples: results, memTrend: trend, time: new Date().toISOString() }, null, 2));
        console.log('\n报告 → ' + OUT_JSON);
    } finally {
        await browser.close().catch(() => {});
        server.kill();
    }
})();
