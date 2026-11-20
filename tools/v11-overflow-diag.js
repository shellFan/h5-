// ===== V11 手机端内容溢出诊断 =====
// 逐页测量: 面板内容 scrollHeight vs clientHeight、被裁切元素、可滚动性
// 运行: node tools/v11-overflow-diag.js
'use strict';
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 8361;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    const srv = spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    await sleep(1500);
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });

    for (const vp of [{ w: 360, h: 640, tag: '360x640' }, { w: 390, h: 844, tag: '390x844' }]) {
        console.log('════════ ' + vp.tag + ' ════════');
        const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
        const page = await ctx.newPage();
        await page.goto('http://localhost:' + PORT + '/index.html?diag=' + Date.now(), { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 40000 });
        await sleep(600);

        // 首页(开始界面)
        const home = await page.evaluate(() => {
            const panel = document.querySelector('#start-screen .title-panel');
            const r = panel.getBoundingClientRect();
            const clipped = [];
            panel.querySelectorAll('*').forEach(el => {
                const er = el.getBoundingClientRect();
                if (er.height > 0 && er.bottom > r.bottom + 1) clipped.push((el.className || el.tagName).toString().slice(0, 30));
            });
            return {
                panelTop: Math.round(r.top), panelBottom: Math.round(r.bottom), viewport: innerHeight,
                beyond: Math.round(r.bottom - innerHeight),
                scrollH: panel.scrollHeight, clientH: panel.clientHeight,
                overflowY: getComputedStyle(panel).overflowY,
                clipped: clipped.slice(0, 8)
            };
        });
        console.log('首页: bottom=' + home.panelBottom + '/' + home.viewport + ' 超出=' + home.beyond + 'px scrollH=' + home.scrollH + '/clientH=' + home.clientH + ' overflowY=' + home.overflowY);
        if (home.clipped.length) console.log('  被裁切元素: ' + home.clipped.join(', '));

        // 逐个打开v60页面测量
        const pages = [
            { btn: 'v60-btn-map', el: 'v60-map-page', name: '关卡地图' },
            { btn: 'v60-btn-train', el: 'v60-train-page', name: '训练中心' },
            { btn: 'v60-btn-armory', el: 'v60-armory-page', name: '军械库' },
            { btn: 'v60-btn-tech', el: 'v60-tech-page', name: '科技树' },
            { btn: 'v60-btn-codex', el: 'v60-codex-page', name: 'Boss图鉴' },
            { btn: 'v60-btn-challenge', el: 'v60-challenge-page', name: '挑战模式' },
            { btn: 'v60-btn-rank', el: 'v60-rank-page', name: '排行榜' },
            { btn: 'v60-btn-ach', el: 'v60-ach-page', name: '成就' },
            { btn: 'v60-btn-daily', el: 'v60-daily-page', name: '每日任务' }
        ];
        for (const p of pages) {
            const opened = await page.evaluate(sel => {
                const b = document.querySelector('#' + sel + ', [data-nav="' + sel.replace('v60-nav-', '') + '"]');
                if (!b) return false;
                b.click();
                return true;
            }, p.btn);
            await sleep(350);
            const m = await page.evaluate(id => {
                const pg = document.getElementById(id);
                if (!pg || pg.classList.contains('hidden')) return null;
                const panel = pg.querySelector('.v60-panel') || pg;
                const r = panel.getBoundingClientRect();
                const clipped = [];
                panel.querySelectorAll('*').forEach(el => {
                    const er = el.getBoundingClientRect();
                    // 元素底部超出面板可视底(且面板不可滚动到它 = overflow hidden 或元素超出scrollH)
                    if (er.height > 0 && er.bottom > r.bottom + 1 && panel.scrollHeight <= panel.clientHeight + 2) {
                        clipped.push((el.className || el.tagName).toString().slice(0, 28));
                    }
                });
                return {
                    scrollH: panel.scrollHeight, clientH: panel.clientHeight,
                    overflowY: getComputedStyle(panel).overflowY,
                    clipped: clipped.slice(0, 5)
                };
            }, p.el);
            if (m === null) { console.log('[' + p.name + '] 未打开或隐藏'); continue; }
            const flag = (m.scrollH > m.clientH + 4 && m.overflowY !== 'auto' && m.overflowY !== 'scroll') ? ' ←不可滚动溢出!' :
                (m.clipped.length ? ' ←内容被裁切!' : '');
            console.log('[' + p.name + '] scrollH=' + m.scrollH + '/clientH=' + m.clientH + ' overflowY=' + m.overflowY + flag);
            if (m.clipped.length) console.log('  裁切: ' + m.clipped.join(', '));
            // 关闭页面
            await page.evaluate(id => {
                const pg = document.getElementById(id);
                const close = pg && pg.querySelector('.v60-close, [data-close], .v60-page-close');
                if (close) close.click();
                else if (pg) {
                    // 通用: 点导航按钮切换
                    const b = document.querySelector('#v60-nav-' + id.replace('v60-', '').replace('-page', ''));
                    if (b) b.click();
                }
            }, p.el);
            await sleep(250);
        }

        // 升级商店
        await page.evaluate(() => { if (window.__game._openShop) window.__game._openShop(); });
        await sleep(350);
        const shop = await page.evaluate(() => {
            const pg = document.getElementById('shop-screen');
            const list = document.getElementById('shop-list');
            const r = pg.getBoundingClientRect();
            return {
                pgBottom: Math.round(r.bottom), viewport: innerHeight,
                listScrollH: list.scrollHeight, listClientH: list.clientHeight,
                listOverflowY: getComputedStyle(list).overflowY,
                pgOverflowY: getComputedStyle(pg).overflowY
            };
        });
        console.log('[升级商店] screenBottom=' + shop.pgBottom + '/' + shop.viewport + ' listScrollH=' + shop.listScrollH + '/' + shop.listClientH + ' overflowY=' + shop.listOverflowY + '/' + shop.pgOverflowY);
        await ctx.close();
    }
    await browser.close();
    if (srv) srv.kill();
})();
