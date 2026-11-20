// ===== V11 手机端页面滚动行为验证 =====
// 模拟真实触摸滚动 .v60-armory-list 等, 验证内容可达性; 截图目检
'use strict';
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const PORT = 8362;
const OUT = path.join(ROOT, 'docs', 'screenshots', 'v11-overflow');
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const srv = spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    await sleep(1500);
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto('http://localhost:' + PORT + '/index.html?scrollchk=' + Date.now(), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 40000 });
    await sleep(600);

    const pages = [
        { btn: 'v60-btn-armory', el: 'v60-armory-page', list: '.v60-armory-list', name: 'armory' },
        { btn: 'v60-btn-tech', el: 'v60-tech-page', list: '.v60-tech-list', name: 'tech' },
        { btn: 'v60-btn-codex', el: 'v60-codex-page', list: '.v60-codex-list', name: 'codex' },
        { btn: 'v60-btn-ach', el: 'v60-ach-page', list: '.v60-ach-list', name: 'ach' }
    ];
    for (const p of pages) {
        await page.evaluate(sel => document.getElementById(sel).click(), p.btn);
        await sleep(400);
        const before = await page.evaluate(sel => {
            const el = document.querySelector(sel);
            return { st: el ? el.scrollTop : -1, sh: el ? el.scrollHeight : -1, ch: el ? el.clientHeight : -1 };
        }, p.list);
        // 真实触摸滑动列表区域
        const center = await page.evaluate(sel => {
            const el = document.querySelector(sel);
            const r = el.getBoundingClientRect();
            return { x: (r.left + r.right) / 2, y: (r.top + Math.min(r.bottom, innerHeight - 30)) / 2 };
        }, p.list);
        await page.mouse.move(center.x, center.y);
        await page.mouse.down();
        await page.mouse.move(center.x, center.y - 150, { steps: 10 });
        await page.mouse.up();
        await sleep(500);
        const after = await page.evaluate(sel => {
            const el = document.querySelector(sel);
            return { st: el ? el.scrollTop : -1 };
        }, p.list);
        const scrollable = after.st > before.st;
        console.log('[' + p.name + '] touch滚动: scrollTop ' + before.st + '→' + after.st + ' (scrollH=' + before.sh + '/clientH=' + before.ch + ')' + (scrollable ? ' ✓可达' : ' ✗滚不动!'));
        await page.screenshot({ path: path.join(OUT, 'scrollchk_' + p.name + '_360.png') });
        // 关闭页面
        await page.evaluate(sel => document.getElementById(sel).click(), p.btn);
        await sleep(300);
    }
    await browser.close();
    if (srv) srv.kill();
})();
