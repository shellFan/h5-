// ===== 视觉回归测试 (Phase 7) =====
// 4种分辨率 × 7个关键状态 截图 + 程序化布局检查(投影可见性/裁切/遮挡)
// 截图保存: tests/screenshots/v3-visual/
// 注意: 自动截图存在不代表画面合格, 需配合人工/视觉审查
// 运行: node tests/e2e/visual.js

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'tests', 'screenshots', 'v3-visual');

const PORT = process.env.E2E_PORT || 8124;
const BASE = 'http://localhost:' + PORT;
const HEADLESS = process.env.E2E_HEADED !== '1';

const RESOLUTIONS = [
    { name: '390x844', w: 390, h: 844 },   // iPhone 14
    { name: '430x932', w: 430, h: 932 },   // iPhone 15 Pro Max
    { name: '360x800', w: 360, h: 800 },   // 安卓中端
    { name: '1080x1920', w: 1080, h: 1920 } // 高清竖屏
];

let _pass = 0, _fail = 0;
const _failures = [];
function ok(n) { _pass++; console.log('  ✓ ' + n); }
function bad(n, e) { _fail++; console.log('  ✗ ' + n + ' — ' + (e && e.message || e).split('\n')[0]); _failures.push({ name: n, error: String(e && e.message || e).split('\n')[0] }); }
async function check(name, fn) { try { await fn(); ok(name); } catch (e) { bad(name, e); } }
function assert(cond, msg) { if (!cond) throw new Error(msg || '视觉检查断言失败'); }

function startServer() {
    return new Promise((resolve) => {
        const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
            env: Object.assign({}, process.env, { PORT: String(PORT), PATH: process.env.PATH }),
            stdio: 'ignore'
        });
        const t0 = Date.now();
        (function poll() {
            require('http').get(BASE + '/index.html', (res) => { res.resume(); resolve(cp); })
                .on('error', () => { if (Date.now() - t0 > 10000) { resolve(cp); return; } setTimeout(poll, 200); });
        })();
    });
}

async function launchBrowser() {
    const candidates = [{ channel: 'msedge' }, { channel: 'chrome' },
        { executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
        { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' }];
    for (const opt of candidates) {
        try { return await chromium.launch(Object.assign({ headless: HEADLESS }, opt)); }
        catch (e) {}
    }
    throw new Error('未找到系统浏览器');
}

/**
 * 页面内投影检查: 世界坐标 → 屏幕百分比
 * 返回 {x%, y%, visible}
 */
const PROJ_FN = `(function(){
    function makeProj() {
        const g = window.__game;
        const cam = g.world.camera;
        return function(x, y, z) {
            const v = new THREE.Vector3(x, y, z).project(cam);
            return { sx: (v.x*0.5+0.5)*100, sy: (-v.y*0.5+0.5)*100, visible: v.z < 1 && Math.abs(v.x) <= 1.01 && Math.abs(v.y) <= 1.01 };
        };
    }
    return makeProj();
})()`;

/**
 * 关键状态布局断言(投影法)
 * @param page Playwright页面
 * @param state 状态名
 */
async function assertLayout(page, state) {
    const checks = await page.evaluate(`(function(){
        const proj = ${PROJ_FN};
        const g = window.__game;
        const res = { issues: [] };
        const warn = (m) => res.issues.push(m);

        // 1. 小队可见性: 首个士兵与最后士兵(阵型后缘)
        if (g.squad && g.squad.count > 0) {
            const front = proj(g.squad.x, 1.2, g.squad.z);
            if (!front.visible) warn('小队中心不可见');
            // 底部裁切: 士兵脚部y不能超出屏幕(>100%)
            const foot = proj(g.squad.x, 0, g.squad.z);
            if (foot.sy > 99) warn('士兵脚部被底部裁切 y=' + foot.sy.toFixed(1) + '%');
            // 阵型尾部(向-Z延伸, 大军团时检查可见性)
            const cols = Math.min(10, Math.max(1, g.squad.count));
            const rows = Math.ceil(g.squad.count / cols);
            const tail = proj(g.squad.x, 0, g.squad.z - Math.min(rows * 0.55, 12));
            if (tail.sy > 100) warn('阵型尾部超出屏幕底部 y=' + tail.sy.toFixed(1) + '%');
        }

        // 2. 状态门可见性: 决策窗口(≥12单位)的门必须完整在屏内
        //    <12单位属于"通过中", 侧门滑出屏幕属类型游戏标准行为, 不判失败
        for (const gate of (g.gates ? g.gates.gates : [])) {
            if (gate.triggered) continue;
            const dist = g.squad.z - gate.z;
            if (dist < 12 || dist > 45) continue;
            // 门宽1.8/高2.0, 检查四角(含3%边框发光容差)
            const corners = [
                proj(gate.x - 0.95, 0.1, gate.z),
                proj(gate.x + 0.95, 0.1, gate.z),
                proj(gate.x - 0.95, 2.1, gate.z),
                proj(gate.x + 0.95, 2.1, gate.z)
            ];
            const leftX = Math.min(corners[0].sx, corners[2].sx);
            const rightX = Math.max(corners[1].sx, corners[3].sx);
            const topY = Math.min(corners[2].sy, corners[3].sy);
            const botY = Math.max(corners[0].sy, corners[1].sy);
            if (leftX < -3 || rightX > 103 || topY < -3 || botY > 103) {
                warn('决策窗口门(' + gate.data.label + ',距离' + dist.toFixed(0) + ')超出屏幕: x=' + leftX.toFixed(0) + '%~' + rightX.toFixed(0) + '% y=' + topY.toFixed(0) + '%~' + botY.toFixed(0) + '%');
            }
        }

        // 3. Boss可见性
        if (g.enemies && g.enemies.boss) {
            const b = proj(g.enemies.boss.x, 2, g.enemies.boss.z);
            if (!b.visible) warn('Boss主体不可见');
        }

        // 4. HUD元素无溢出(视口内)
        const ids = ['top-bar', 'stats-panel'];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (!el || el.classList.contains('hidden')) continue;
            const r = el.getBoundingClientRect();
            if (r.left < -2 || r.right > innerWidth + 2 || r.top < -2) warn(id + ' 溢出视口: ' + JSON.stringify(r));
        }

        // 5. 关键文字无溢出(结算面板)
        const panel = document.querySelector('#win-screen:not(.hidden) .title-panel, #lose-screen:not(.hidden) .title-panel');
        if (panel) {
            const r = panel.getBoundingClientRect();
            if (r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight) {
                warn('结算面板被裁切: ' + JSON.stringify(r));
            }
        }

        return res;
    })()`);
    if (checks.issues && checks.issues.length) {
        throw new Error(state + ' 布局问题: ' + checks.issues.join(' | '));
    }
}

/** 各状态搭建(传送后冻结前进速度, 保证截图时构图稳定) */
const STATE_SETUPS = {
    'start':        async (page) => { await page.evaluate(() => { if (window.__game.state !== 'idle') location.reload(); }); },
    '1soldier':     async (page) => { await page.evaluate(() => { CONFIG.SQUAD_SPEED = 0; window.__game.start(); }); },
    '12soldiers':   async (page) => { await page.evaluate(() => { CONFIG.SQUAD_SPEED = 0; window.__game.squad.setCount(12); window.__game.squad.z = -20; }); },
    '31soldiers':   async (page) => { await page.evaluate(() => { CONFIG.SQUAD_SPEED = 0; window.__game.squad.setCount(31); window.__game.squad.z = -24; }); },
    '100soldiers':  async (page) => { await page.evaluate(() => { CONFIG.SQUAD_SPEED = 0; window.__game.squad.setCount(100); window.__game.squad.z = -50; }); },
    'threegates':   async (page) => {
        // 停在第一组门前方, 三条跑道的门可见
        await page.evaluate(() => { CONFIG.SQUAD_SPEED = 0; window.__game.squad.setCount(31); window.__game.squad.z = -7; window.__game.squad.x = 0; window.__game.squad.lane = 1; window.__game.squad.targetX = 0; });
    },
    'bossbattle':   async (page) => { await page.evaluate(() => { CONFIG.SQUAD_SPEED = 0; window.__game.squad.setCount(40); window.__game.squad.z = -132; }); },
    'result':       async (page) => { await page.evaluate(() => { window.__game.squad.setCount(0); }); }
};

(async () => {
    let server, browser;
    try {
        fs.mkdirSync(OUT_DIR, { recursive: true });
        server = await startServer();
        browser = await launchBrowser();

        for (const res of RESOLUTIONS) {
            console.log('\n=== ' + res.name + ' ===');
            const ctx = await browser.newContext({ viewport: { width: res.w, height: res.h }, deviceScaleFactor: 2 });
            const page = await ctx.newPage();
            await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => !!window.__game, { timeout: 8000 });
            await page.waitForTimeout(800);

            for (const stateName of Object.keys(STATE_SETUPS)) {
                // 每个状态重新加载, 保证从干净状态搭建(首页除外)
                if (stateName !== 'start') {
                    await page.reload({ waitUntil: 'domcontentloaded' });
                    await page.waitForFunction(() => !!window.__game, { timeout: 8000 });
                    await page.evaluate(() => window.__game.start());
                }
                await STATE_SETUPS[stateName](page);
                await page.waitForTimeout(stateName === 'start' ? 600 : 1300);

                // 布局检查(首页无队伍, 结算面板检查在assertLayout内)
                if (stateName !== 'start') {
                    await check(res.name + ' ' + stateName + ' 布局检查', async () => {
                        await assertLayout(page, stateName);
                    });
                } else {
                    ok(res.name + ' ' + stateName + ' (仅截图)');
                }

                // 截图
                const file = path.join(OUT_DIR, res.name + '_' + stateName + '.png');
                const bytes = await page.screenshot();
                fs.writeFileSync(file, bytes);
            }
            await ctx.close();
        }
    } catch (e) {
        bad('视觉回归运行器', e);
    } finally {
        if (browser) await browser.close().catch(() => {});
        if (server) server.kill();
    }
    console.log('\n======================');
    console.log(`视觉检查 通过 ${_pass} / 失败 ${_fail}`);
    if (_failures.length) _failures.forEach(f => console.log('  ' + f.name + ': ' + f.error));
    process.exit(_fail > 0 ? 1 : 0);
})();
