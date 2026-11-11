// ===== V4 基线截图脚本 =====
// 捕捉改造前关键状态截图, 存档到 docs/screenshots/v4-after-p12/
// 运行: node tools/v4-baseline.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots', 'v4-after-p3');

const PORT = process.env.E2E_PORT || 8194;
const BASE = 'http://localhost:' + PORT;

function startServer() {
    return new Promise((resolve) => {
        const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
            env: Object.assign({}, process.env, { PORT: String(PORT) }),
            stdio: 'ignore'
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
        { channel: 'msedge' },
        { channel: 'chrome' },
        { executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
        { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' }
    ];
    for (const c of candidates) {
        try { return await chromium.launch(Object.assign({ headless: true }, c)); } catch (e) { /* next */ }
    }
    throw new Error('无可用浏览器');
}

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const server = await startServer();
    const browser = await launch();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', e => console.log('  [pageerror]', e.message.split('\n')[0]));

    await page.goto(BASE + '/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, '01-start.png') });
    console.log('✓ 01-start');

    // 开始游戏
    await page.click('#btn-start');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, '02-game-initial.png') });
    console.log('✓ 02-game-initial');

    // 各人数状态
    const counts = [12, 31, 100, 300, 500];
    for (const n of counts) {
        await page.evaluate((cnt) => {
            const g = window.__game;
            g.squad.setCount(cnt);
        }, n);
        await page.waitForTimeout(700);
        await page.screenshot({ path: path.join(OUT, '03-squad-' + n + '.png') });
        console.log('✓ 03-squad-' + n);
    }

    // 状态门场景(推进到第一个门附近)
    await page.evaluate(() => {
        const g = window.__game;
        g.squad.setCount(31);
        g.squad.z = -6; g.squad.targetX = -2; g.squad.x = -2;
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '04-gates.png') });
    console.log('✓ 04-gates');

    // 僵尸潮(手动布怪)
    await page.evaluate(() => {
        const g = window.__game;
        g.squad.z = -30; g.squad.x = 0;
        for (let i = 0; i < 14; i++) {
            const type = ['normal', 'normal', 'fast', 'shield', 'spitter', 'split'][i % 6];
            const lane = CONFIG.LANE_X[i % 3] + (Math.random() - 0.5);
            g.enemies.enemies.push(new Enemy(type, lane, g.squad.z - 6 - Math.random() * 8, g.world.scene));
        }
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, '05-zombie-wave.png') });
    console.log('✓ 05-zombie-wave');

    // Boss
    await page.evaluate(() => {
        const g = window.__game;
        g.enemies.clear();
        g.squad.z = -100; g.squad.setCount(200);
        g.enemies.enemies.push(new Enemy('boss', 0, g.squad.z - 8, g.world.scene, 600));
        g.enemies.boss = g.enemies.enemies[0];
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, '06-boss.png') });
    console.log('✓ 06-boss');

    // 暂停界面
    await page.evaluate(() => { window.__game._togglePause(); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '07-pause.png') });
    console.log('✓ 07-pause');
    await page.evaluate(() => { window.__game._togglePause(); });

    // 胜利界面
    await page.evaluate(() => { const g = window.__game; g.squad.setCount(88); g.enemies.killCount = 57; g._win(); });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '08-win.png') });
    console.log('✓ 08-win');

    // 失败界面
    await page.evaluate(() => { const g = window.__game; g._lose('被怪潮吞噬 · 人数不足'); });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '09-lose.png') });
    console.log('✓ 09-lose');

    // 性能快照
    const perf = await page.evaluate(() => { const g = window.__game; g.start(); return g.getPerf(); });
    console.log('perf:', JSON.stringify(perf));

    await browser.close();
    server.kill();
    console.log('DONE → ' + OUT);
})();
