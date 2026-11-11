// 拖动映射调试探针
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const PORT = 8191;
const BASE = 'http://localhost:' + PORT;

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
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(BASE + '/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    await page.click('#btn-start');
    await page.waitForTimeout(400);

    const probe = await page.evaluate(() => {
        const c = document.getElementById('game-canvas');
        const r = c.getBoundingClientRect();
        return { cw: c.clientWidth, rectLeft: r.left, rectTop: r.top, state: window.__game.state, dpr: window.devicePixelRatio };
    });
    console.log('probe:', JSON.stringify(probe));

    await page.evaluate(() => { const g = window.__game; g.squad.targetX = 0; g.squad.x = 0; });
    await page.mouse.move(195, 400);
    await page.mouse.down();
    // 逐步移动并采样
    for (let i = 1; i <= 8; i++) {
        await page.mouse.move(195 + Math.round(127 * i / 8), 400);
        const t = await page.evaluate(() => window.__game.squad.targetX);
        console.log('step', i, 'targetX=', t.toFixed(3));
    }
    await page.waitForTimeout(100);
    await page.mouse.up();
    const final = await page.evaluate(() => ({ tx: window.__game.squad.targetX, x: window.__game.squad.x, half: window.__game.squad.getHalfWidth() }));
    console.log('final:', JSON.stringify(final));
    await browser.close();
    server.kill();
})();
