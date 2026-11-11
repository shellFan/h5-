// ===== V4.0 性能分层测试 =====
// deviceScaleFactor 1/1.5/2 → 画质0/1/2; 各档60s真实战斗采样(200兵+多波僵尸)
// 输出: FPS/P95帧耗时/DrawCall/三角形/内存 — 诚实标注环境为headless SwiftShader
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const PORT = 8197;
const BASE = 'http://localhost:' + PORT;
const SECONDS = 40;

function startServer() {
    return new Promise((resolve) => {
        const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
            env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore'
        });
        const t0 = Date.now();
        (function poll() {
            require('http').get(BASE + '/index.html', (res) => { res.resume(); resolve(cp); })
                .on('error', () => { if (Date.now() - t0 > 10000) { resolve(cp); return; } setTimeout(poll, 200); });
        })();
    });
}

(async () => {
    const server = await startServer();
    const results = [];
    const tiers = [
        { name: 'low(q0)', dsf: 1, viewport: { width: 360, height: 800 } },
        { name: 'mid(q1)', dsf: 1.5, viewport: { width: 390, height: 844 } },
        { name: 'high(q2)', dsf: 2, viewport: { width: 430, height: 932 } }
    ];

    for (const tier of tiers) {
        const browser = await chromium.launch({ headless: true, channel: 'msedge' });
        const ctx = await browser.newContext({
            viewport: tier.viewport,
            deviceScaleFactor: tier.dsf,
            hasTouch: true
        });
        const page = await ctx.newPage();
        page.on('pageerror', e => console.log('[' + tier.name + ' pageerror]', e.message.split('\n')[0]));
        await page.goto(BASE + '/index.html', { waitUntil: 'load' });
        await page.waitForTimeout(1200);
        await page.click('#btn-start');
        await page.waitForTimeout(400);
        // 注入战斗压力: 200兵 + 深入战场
        await page.evaluate(() => {
            const g = window.__game;
            g.squad.setCount(200);
            g.squad.z = -60;
        });
        // 战斗采样
        await page.waitForTimeout(SECONDS * 1000);
        const perf = await page.evaluate(() => window.__game.getPerf());
        const mem = await page.evaluate(() => performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : 0);
        results.push(Object.assign({ tier: tier.name, memMB: mem, dsf: tier.dsf }, perf));
        console.log(tier.name + ': fps ' + perf.fps + ' | work ' + perf.workMs + 'ms | p95 ' + perf.p95FrameMs +
            'ms | DC ' + perf.drawCalls + ' | tri ' + (perf.triangles / 1000).toFixed(0) + 'k | mem ' + mem + 'MB | 画质' + perf.quality);
        await browser.close();
    }

    fs.writeFileSync(path.join(ROOT, 'docs', 'V4_PERF_SAMPLES.json'), JSON.stringify({
        env: 'headless SwiftShader(软件渲染), 真机数据需实机补测',
        secondsPerTier: SECONDS,
        squadCount: 200,
        results
    }, null, 2));
    console.log('\n已保存 docs/V4_PERF_SAMPLES.json');
    server.kill();
})();
