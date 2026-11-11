// ===== V4 最终交付截图 =====
// 全状态存档 → docs/screenshots/v4-final/ (390x844主分辨率 + 1080x1920两张关键帧)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots', 'v4-final');
const PORT = 8199;
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

async function launch() {
    const candidates = [
        { channel: 'msedge' }, { channel: 'chrome' },
        { executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
        { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' }
    ];
    for (const c of candidates) {
        try { return await chromium.launch(Object.assign({ headless: true }, c)); } catch (e) { /* next */ }
    }
    throw new Error('无可用浏览器');
}

async function captureAll(page, tag) {
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(OUT, tag + '-01-start.png') });
    await page.click('#btn-start');
    await page.waitForTimeout(700);

    for (const n of [1, 12, 31, 100, 300, 500]) {
        await page.evaluate((cnt) => { window.__game.squad.setCount(cnt); }, n);
        await page.waitForTimeout(650);
        await page.screenshot({ path: path.join(OUT, tag + '-squad-' + n + '.png') });
    }

    // 门区
    await page.evaluate(() => { const g = window.__game; g.squad.setCount(31); g.squad.z = -6; g.squad.x = -2; g.squad.targetX = -2; });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, tag + '-gates.png') });

    // Boss预警横幅(触发预警后0.7s截图)
    await page.evaluate(() => {
        const g = window.__game;
        const b = LEVELS[0].segments.find(s => s.type === 'boss');
        g.squad.z = b.z + CONFIG.PACING.bossTriggerAhead - 1;
        g.squad.setCount(150);
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, tag + '-boss-warning.png') });
    // Boss战
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, tag + '-boss-fight.png') });

    // 胜利/失败
    await page.evaluate(() => { const g = window.__game; g.squad.setCount(233); g.enemies.killCount = 128; g.maxCombo = 47; g._win(); });
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(OUT, tag + '-win.png') });
    await page.evaluate(() => { const g = window.__game; g._lose('被怪潮吞噬 · 人数不足'); });
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(OUT, tag + '-lose.png') });
}

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const server = await startServer();
    const browser = await launch();

    // 主分辨率 390x844
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    page.on('pageerror', e => console.log('[pageerror]', e.message.split('\n')[0]));
    await page.goto(BASE + '/index.html', { waitUntil: 'load' });
    await captureAll(page, '390');
    console.log('✓ 390x844 全状态');
    await page.close();

    // 高清 1080x1920 关键帧
    const page2 = await browser.newPage({ viewport: { width: 1080, height: 1920 }, hasTouch: true });
    await page2.goto(BASE + '/index.html', { waitUntil: 'load' });
    await page2.waitForTimeout(1200);
    await page2.click('#btn-start');
    await page2.waitForTimeout(600);
    await page2.evaluate(() => { window.__game.squad.setCount(100); window.__game.squad.z = -12; });
    await page2.waitForTimeout(700);
    await page2.screenshot({ path: path.join(OUT, '1080-squad-100.png') });
    await page2.evaluate(() => { window.__game.squad.setCount(1); });
    await page2.waitForTimeout(600);
    await page2.screenshot({ path: path.join(OUT, '1080-01-start-game.png') });
    console.log('✓ 1080x1920 关键帧');

    const perf = await page2.evaluate(() => window.__game ? window.__game.getPerf() : null).catch(() => null);
    console.log('perf:', JSON.stringify(perf));

    await browser.close();
    server.kill();
    console.log('DONE → ' + OUT);
})();
