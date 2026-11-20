// ===== V11 真实触摸(CDP)滚动验证 =====
'use strict';
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 8365;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const srv = spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    await sleep(1500);
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto('http://localhost:' + PORT + '/index.html?touchscroll=' + Date.now(), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 40000 });
    await sleep(600);
    const cdp = await ctx.newCDPSession(page);

    const pages = [
        { btn: 'v60-btn-armory', list: '.v60-armory-list', name: 'armory' },
        { btn: 'v60-btn-tech', list: '.v60-tech-list', name: 'tech' },
        { btn: 'v60-btn-codex', list: '.v60-codex-list', name: 'codex' },
        { btn: 'v60-btn-ach', list: '.v60-ach-list', name: 'ach' }
    ];
    for (const p of pages) {
        await page.evaluate(sel => document.getElementById(sel).click(), p.btn);
        await sleep(400);
        const info = await page.evaluate(sel => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
                st: el.scrollTop, sh: el.scrollHeight, ch: el.clientHeight,
                x: Math.round((r.left + r.right) / 2), y: Math.round((r.top + r.bottom) / 2),
                visibleBottom: Math.round(Math.min(r.bottom, innerHeight)),
                touchAction: getComputedStyle(el).touchAction,
                parentTouchAction: getComputedStyle(el.parentElement || el).touchAction
            };
        }, p.list);
        if (!info) { console.log('[' + p.name + '] 列表元素未找到'); continue; }
        // CDP 真实触摸滑动: 从列表中心向上滑 160px
        for (let step = 0; step < 10; step++) {
            await cdp.send('Input.dispatchTouchEvent', {
                type: step === 0 ? 'touchStart' : 'touchMove',
                touchPoints: [{ x: info.x, y: info.y + 80 - step * 16, id: 1 }]
            });
            await sleep(16);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await sleep(500);
        const after = await page.evaluate(sel => {
            const el = document.querySelector(sel);
            return el ? el.scrollTop : -1;
        }, p.list);
        console.log('[' + p.name + '] CDP触摸滚动: scrollTop ' + info.st + '→' + after + ' (scrollH=' + info.sh + '/clientH=' + info.ch + ' touchAction=' + info.touchAction + '/' + info.parentTouchAction + ')' + (after > info.st ? ' ✓' : ' ✗滚不动'));
        await page.evaluate(sel => document.getElementById(sel).click(), p.btn);
        await sleep(300);
    }
    await browser.close();
    if (srv) srv.kill();
})();
