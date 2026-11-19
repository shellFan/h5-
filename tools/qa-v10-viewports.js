// ===== V10 全量QA: 移动端视口矩阵适配 =====
// 6 分辨率 × (首页/战斗/技能弹窗页) 截图 + 溢出/小按钮/安全区检查
// 运行: node tools/qa-v10-viewports.js  输出: docs/QA/v10-viewports.json + 截图

'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'QA');
const SHOTS = path.join(OUT, 'screenshots');
const PORT = Number(process.env.QA_PORT || 8314);
const BASE = 'http://localhost:' + PORT;
fs.mkdirSync(SHOTS, { recursive: true });
const VIEWPORTS = [
    { width: 360, height: 800, tag: '360x800' },
    { width: 375, height: 812, tag: '375x812' },
    { width: 390, height: 844, tag: '390x844' },
    { width: 414, height: 896, tag: '414x896' },
    { width: 430, height: 932, tag: '430x932' },
    { width: 1920, height: 1080, tag: '1920x1080' }
];
const R = { viewports: {}, errors: [] };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
        { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
    await sleep(1200);
    const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });
    try {
        for (const vp of VIEWPORTS) {
            const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: vp.width < 800, hasTouch: vp.width < 800 });
            const page = await ctx.newPage();
            const errs = [];
            page.on('pageerror', e => errs.push(e.message.slice(0, 150)));
            await page.goto(BASE + '/index.html?qa-vp=' + vp.tag + '&' + Date.now(), { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });
            await page.evaluate(() => { window.__game.profile._storage.remove('profile_v51'); });
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 60000 });
            await sleep(600);
            const rec = { vp: vp.tag, errs: [] };
            // 首页检查: 横向/纵向溢出 + 按钮尺寸
            rec.home = await page.evaluate(() => {
                const de = document.documentElement;
                const overflowX = de.scrollWidth > window.innerWidth + 1;
                const overflowY = de.scrollHeight > window.innerHeight + 1;
                const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null);
                const tiny = btns.filter(b => (b.offsetWidth < 32 || b.offsetHeight < 24) && b.offsetParent !== null).map(b => b.id || b.className || b.textContent.slice(0, 10));
                const title = document.querySelector('.game-title');
                const titleRect = title ? title.getBoundingClientRect() : null;
                return { overflowX, overflowY, sw: de.scrollWidth, iw: window.innerWidth, sh: de.scrollHeight, ih: window.innerHeight, btnCount: btns.length, tiny, titleVisible: !!titleRect && titleRect.width > 0 };
            });
            await page.screenshot({ path: SHOTS + '/vp-' + vp.tag + '-home.png' });
            // 战斗HUD
            await page.evaluate(() => { window.__game.levelIndex = 0; window.__game.start(); });
            await sleep(3500);
            rec.combat = await page.evaluate(() => {
                const de = document.documentElement;
                const hud = document.getElementById('hud');
                const hudRect = hud ? hud.getBoundingClientRect() : null;
                const cnt = document.getElementById('stat-count');
                const coins = document.querySelector('[data-coin-display]');
                return {
                    overflowX: de.scrollWidth > window.innerWidth + 1,
                    hudVisible: hud && !hud.classList.contains('hidden'),
                    hudInBounds: hudRect ? (hudRect.top >= 0 && hudRect.left >= 0 && hudRect.right <= window.innerWidth) : false,
                    countText: cnt ? cnt.textContent : null,
                    safeTop: (document.getElementById('top-bar') || {}).offsetTop
                };
            });
            await page.screenshot({ path: SHOTS + '/vp-' + vp.tag + '-combat.png' });
            // 升级弹窗(训练页)
            await page.evaluate(() => { window.__game._backToMenu(); document.getElementById('v60-btn-train').click(); });
            await sleep(400);
            rec.trainPage = await page.evaluate(() => {
                const pg = document.querySelector('.v60-page:not(.hidden)');
                const r = pg ? pg.getBoundingClientRect() : null;
                return { open: pg ? pg.id : null, inBounds: r ? (r.left >= 0 && r.right <= window.innerWidth) : false };
            });
            await page.screenshot({ path: SHOTS + '/vp-' + vp.tag + '-train.png' });
            rec.errs = errs;
            R.viewports[vp.tag] = rec;
            const bad = rec.home.overflowX || rec.combat.overflowX || !rec.combat.hudInBounds || (rec.home.tiny && rec.home.tiny.length > 0);
            console.log(`${vp.tag}: 溢出X=${rec.home.overflowX}/${rec.combat.overflowX} HUD界内=${rec.combat.hudInBounds} 小按钮=${rec.home.tiny.length} ${bad ? '⚠' : '✓'}`);
            if (rec.home.overflowX) R.errors.push(vp.tag + ' 首页横向溢出');
            if (rec.combat.overflowX) R.errors.push(vp.tag + ' 战斗横向溢出');
            if (!rec.combat.hudInBounds) R.errors.push(vp.tag + ' 战斗HUD越界');
            if (rec.home.tiny.length) R.errors.push(vp.tag + ' 过小按钮: ' + rec.home.tiny.join(','));
            if (errs.length) R.errors.push(vp.tag + ' 页面JS错误: ' + errs[0]);
            await ctx.close();
        }
        fs.writeFileSync(path.join(OUT, 'v10-viewports.json'), JSON.stringify(R, null, 2));
        console.log('\n错误数: ' + R.errors.length);
        R.errors.forEach(e => console.log('  ✗ ' + e));
    } finally {
        await browser.close();
        cp.kill();
    }
}
main().catch(e => { console.error('失败:', e); process.exit(1); });
