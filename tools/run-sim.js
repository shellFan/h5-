// ===== V4.0 数值模拟运行器: 5策略×10关 驱动真实引擎(含V4节奏/移动) =====
// 前置: sim.html 需加载 movement.js/pacing.js(V4新增)
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const PORT = 8195;
const BASE = 'http://localhost:' + PORT;

function startServer() {
    return new Promise((resolve) => {
        const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
            env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore'
        });
        const t0 = Date.now();
        (function poll() {
            require('http').get(BASE + '/test/sim.html', (res) => { res.resume(); resolve(cp); })
                .on('error', () => { if (Date.now() - t0 > 10000) { resolve(cp); return; } setTimeout(poll, 200); });
        })();
    });
}

(async () => {
    const server = await startServer();
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', e => console.log('[pageerror]', e.message.split('\n')[0]));
    await page.goto(BASE + '/test/sim.html', { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const driver = require('fs').readFileSync(path.join(ROOT, 'tools', 'sim-driver.js'), 'utf8');
    await page.evaluate(driver);
    console.log('驱动器注入完成');

    const t0 = Date.now();
    const res = await page.evaluate(() => {
        try { return window.__runSimulation(); }
        catch (e) { return { error: e.message + '\n' + (e.stack || '') }; }
    });
    console.log('模拟耗时', ((Date.now() - t0) / 1000).toFixed(1) + 's');

    if (res.error) { console.error('模拟失败:', res.error); }
    else {
        console.log('\n=== V4 数值模拟汇总 (5策略×10关, 种子确定性) ===');
        console.log(JSON.stringify(res.summary, null, 2));
        // 每关通关明细(检查有无必败关卡)
        const fs = require('fs');
        const lines = res.results.map(r =>
            (r.win ? '✓' : '✗') + ' L' + r.level + ' ' + r.strategy +
            ' t=' + r.time + 's max=' + r.maxCount + ' kills=' + r.kills + (r.stepsCapped ? ' [步数封顶]' : ''));
        console.log('\n' + lines.join('\n'));
        fs.writeFileSync(path.join(ROOT, 'docs', 'V4_SIM_RESULTS.json'), JSON.stringify(res, null, 2));
        console.log('\n已保存 docs/V4_SIM_RESULTS.json');
    }

    await browser.close();
    server.kill();
})();
