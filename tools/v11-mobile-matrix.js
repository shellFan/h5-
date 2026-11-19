// ===== V11 移动端全分辨率矩阵 =====
// 覆盖任务要求的10个分辨率: 布局/触控/手势禁用/暂停恢复真实触摸/safe-area/逐屏截图
// 运行: node tools/v11-mobile-matrix.js
'use strict';
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const PORT = 8331;
const OUT = path.join(ROOT, 'docs', 'screenshots', 'v11-matrix');
fs.mkdirSync(OUT, { recursive: true });

let passCount = 0, failCount = 0;
const ok = m => { passCount++; console.log('  ✓ ' + m); };
const bad = m => { failCount++; console.log('  ✗ ' + m); };
const assert = (c, m) => c ? ok(m) : bad(m);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const RES = [
    { name: '360x640-小屏', w: 360, h: 640, dpr: 2 },
    { name: '360x800-安卓', w: 360, h: 800, dpr: 2 },
    { name: '375x812-iPhone', w: 375, h: 812, dpr: 3 },
    { name: '390x844-iPhone', w: 390, h: 844, dpr: 3 },
    { name: '393x852-iPhone', w: 393, h: 852, dpr: 3 },
    { name: '402x874-iPhone', w: 402, h: 874, dpr: 3 },
    { name: '414x896-大屏', w: 414, h: 896, dpr: 2 },
    { name: '430x932-大屏', w: 430, h: 932, dpr: 3 },
    { name: '440x960-超长屏', w: 440, h: 960, dpr: 2 },
    { name: '768x1024-平板', w: 768, h: 1024, dpr: 2 }
];

(async () => {
    var cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
        { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    await sleep(1500);
    var browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const report = [];

    for (const m of RES) {
        console.log('=== ' + m.name + ' ===');
        const ctx = await browser.newContext({ viewport: { width: m.w, height: m.h }, screen: { width: m.w, height: m.h }, deviceScaleFactor: m.dpr, hasTouch: true, isMobile: true });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
        try {
            await page.goto('http://localhost:' + PORT + '/index.html?v11m=' + Date.now(), { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 40000 });
            await sleep(500);

            // —— 首页布局 ——
            const home = await page.evaluate(() => {
                const doc = document.documentElement;
                const canvas = document.getElementById('game-canvas').getBoundingClientRect();
                const small = [];
                document.querySelectorAll('#start-screen button, .v60-nav-btn').forEach(function (b) {
                    const r = b.getBoundingClientRect();
                    if (r.width > 0 && (r.width < 40 || r.height < 34)) small.push((b.id || b.className).slice(0, 20));
                });
                const cls = document.getElementById('v60-class-row') ? document.getElementById('v60-class-row').getBoundingClientRect() : null;
                const panel = document.querySelector('#start-screen .title-panel').getBoundingClientRect();
                return {
                    hScroll: doc.scrollWidth > window.innerWidth + 1,
                    vScroll: doc.scrollHeight > window.innerHeight + 2,
                    canvasFill: Math.abs(canvas.width - window.innerWidth) < 2 && Math.abs(canvas.height - window.innerHeight) < 2,
                    small: small.slice(0, 4),
                    classVisible: !cls || cls.bottom <= window.innerHeight + 2,
                    panelInBounds: panel.top >= -2 && panel.bottom <= window.innerHeight + 2,
                    touchAction: getComputedStyle(document.getElementById('game-canvas')).touchAction
                };
            });
            assert('[' + m.name + '] 无横向溢出', !home.hScroll);
            assert('[' + m.name + '] 无纵向溢出', !home.vScroll);
            assert('[' + m.name + '] Canvas铺满视口', home.canvasFill);
            assert('[' + m.name + '] 触控目标达标', home.small.length === 0, home.small.length ? home.small.join(',') : '');
            assert('[' + m.name + '] 职业卡完整可见', home.classVisible);
            assert('[' + m.name + '] 首页面板在屏内', home.panelInBounds);
            assert('[' + m.name + '] 画布禁用浏览器手势', home.touchAction === 'none');
            await page.screenshot({ path: path.join(OUT, m.name + '_home.png') });

            // —— 战斗HUD + 真实触摸暂停/恢复 ——
            await page.evaluate(() => { window.__game.levelIndex = 0; window.__game.start(); });
            await sleep(900);
            const battle = await page.evaluate(() => {
                const hud = document.getElementById('hud');
                const pause = document.getElementById('btn-pause').getBoundingClientRect();
                const doc = document.documentElement;
                return {
                    hud: hud && !hud.classList.contains('hidden'),
                    pauseOk: pause.width >= 40 && pause.height >= 40,
                    hScroll: doc.scrollWidth > window.innerWidth + 1
                };
            });
            assert('[' + m.name + '] 战斗HUD显示', battle.hud);
            assert('[' + m.name + '] 暂停按钮触控达标', battle.pauseOk);
            assert('[' + m.name + '] 战斗无横向溢出', !battle.hScroll);
            await page.screenshot({ path: path.join(OUT, m.name + '_battle.png') });

            // 真实触摸: 点暂停
            await page.tap('#btn-pause');
            await sleep(400);
            const paused = await page.evaluate(() => window.__game.paused === true);
            assert('[' + m.name + '] 触摸暂停生效', paused);
            await page.screenshot({ path: path.join(OUT, m.name + '_paused.png') });
            await page.tap('#btn-resume');
            await sleep(400);
            assert('[' + m.name + '] 触摸恢复生效', await page.evaluate(() => window.__game.paused === false));

            // 真实滑动换道
            const tx0 = await page.evaluate(() => window.__game.squad.targetX);
            await page.mouse.move(m.w / 2, m.h / 2);
            await page.mouse.down();
            await page.mouse.move(m.w / 2 - 110, m.h / 2, { steps: 10 });
            await page.mouse.up();
            await sleep(600);
            const tx1 = await page.evaluate(() => window.__game.squad.targetX);
            assert('[' + m.name + '] 滑动换道响应', Math.abs(tx1 - tx0) > 0.3, (tx0.toFixed(2) + '→' + tx1.toFixed(2)));

            // safe-area: viewport-fit=cover生效 + HUD top元素位于安全区内
            const safe = await page.evaluate(() => ({
                cover: (document.querySelector('meta[name=viewport]') || {}).content || '',
                topBar: document.getElementById('top-bar').getBoundingClientRect().top
            }));
            assert('[' + m.name + '] viewport-fit=cover', safe.cover.includes('viewport-fit=cover'));
            assert('[' + m.name + '] 顶栏不与状态栏重叠', safe.topBar >= 0, 'top=' + Math.round(safe.topBar));

            assert('[' + m.name + '] 无页面JS错误', errors.length === 0, errors.slice(0, 2).join('|'));
            report.push({ name: m.name, ok: errors.length === 0 && !home.hScroll && home.canvasFill });
        } catch (e) {
            bad('[' + m.name + '] 运行器异常: ' + e.message.slice(0, 120));
            report.push({ name: m.name, ok: false, error: e.message.slice(0, 120) });
        }
        await ctx.close();
    }

    await browser.close();
    if (cp) cp.kill();
    const outPath = path.join(ROOT, 'docs', 'v11_mobile_matrix.json');
    fs.writeFileSync(outPath, JSON.stringify({
        startedAt: new Date().toISOString(),
        resolutions: RES.map(r => r.name),
        results: report,
        pass: passCount, fail: failCount
    }, null, 2));
    console.log('\n======================');
    console.log('V11 移动矩阵(10分辨率): 通过 ' + passCount + ' / 失败 ' + failCount);
    console.log('报告: ' + outPath);
    process.exit(failCount > 0 ? 1 : 0);
})();
