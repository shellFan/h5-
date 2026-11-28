// ===== V17 新手教程 E2E =====
// 验证: L1首次通关后弹窗 / L2首次死亡后弹窗 / 只弹一次(持久化) / 分页导航 / 首页入口
// 运行: npm run test:tutorial

const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { chromium } = require('playwright-core');

const PORT = process.env.E2E_PORT || 8177;
const BASE = 'http://localhost:' + PORT;

let _passed = 0, _failed = 0;
const _failures = [];
function assert(cond, msg) {
    if (cond) { _passed++; console.log('  ✓ ' + msg); }
    else { _failed++; _failures.push(msg); console.log('  ✗ ' + msg); }
}
async function step(name, fn) {
    console.log('▶ ' + name);
    try { await fn(); } catch (e) { _failed++; _failures.push(name + ': ' + e.message.split('\n')[0]); console.log('  ✗ [异常] ' + e.message.split('\n')[0]); }
}

function startServer() {
    return new Promise((resolve) => {
        const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
            env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore'
        });
        const t0 = Date.now();
        (function poll() {
            require('http').get(BASE + '/index.html', (r) => { r.resume(); resolve(cp); })
                .on('error', () => { if (Date.now() - t0 > 10000) { resolve(cp); return; } setTimeout(poll, 200); });
        })();
    });
}

async function launch() {
    for (const opt of [{ channel: 'msedge' }, { channel: 'chrome' }]) {
        try { return await chromium.launch({ headless: true, ...opt }); } catch (e) {}
    }
    throw new Error('未找到系统浏览器');
}

/** 固定步长快进(v51同款): 直到 won/lost 或超时(游戏秒) */
async function fastForward(page, maxGameSec, stepDt) {
    stepDt = stepDt || 1 / 30;
    return page.evaluate(({ maxGameSec, stepDt }) => {
        const g = window.__game;
        const t0 = g.elapsedTime;
        let steps = 0;
        while (g.state === 'playing' && (g.elapsedTime - t0) < maxGameSec && steps < 60000) {
            const gates = g.gates.gates;
            let rowZ = null;
            for (let i = 0; i < gates.length; i++) {
                const gt = gates[i];
                if (!gt.triggered && !gt.passed && gt.z < g.squad.z - 1 && gt.z > g.squad.z - 16) {
                    if (rowZ === null || gt.z > rowZ) rowZ = gt.z;
                }
            }
            if (rowZ !== null) {
                let best = null, bestScore = -1;
                for (let i = 0; i < gates.length; i++) {
                    const gt = gates[i];
                    if (gt.z !== rowZ || gt.triggered || gt.passed) continue;
                    const d = gt.data;
                    let score = 0;
                    if (d.op === 'mul') score = g.squad.count * (d.value - 1);
                    else if (d.op === 'add') score = d.value;
                    else if (d.op === 'addpct') score = Math.max(1, Math.floor(g.squad.count * d.value / 100));
                    else if (d.op === 'nuke') score = 15;
                    else score = (d.value === 'damage2' || d.value === 'arsenal') ? 12 : 4;
                    if (score > bestScore) { bestScore = score; best = gt; }
                }
                if (best) { g.squad.targetX = best.x; g.squad.lane = best.data.lane; }
            }
            g._update(stepDt);
            steps++;
        }
        return { state: g.state, count: g.squad.count, kills: g.enemies.killCount };
    }, { maxGameSec, stepDt });
}

async function bootFresh(page) {
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });
    await page.evaluate(() => { window.__game._rafDisabled = true; window.__game.paused = false; });
}

/** 清档重建全新档案(v51同款) */
async function resetProfile(page) {
    await page.evaluate(() => {
        const st = window.__game.profile._storage;
        st.remove('profile_v51');
        window.__game.profile = new GameProfile(window.__game.profile._storage, window.__game.profile._raw);
        window.__game.squad.profile = window.__game.profile;
        window.__game.levelIndex = 0;
        window.__game._refreshCoinDisplays();
    });
}

// 空安全: 弹窗DOM是懒装配的, 600ms延迟窗口内元素尚不存在, 谓词抛异常会被waitForFunction立刻上抛
const overlayVisible = () => {
    const el = document.getElementById('tutorial-overlay');
    return !!el && !el.classList.contains('hidden');
};

(async () => {
    const server = await startServer();
    const browser = await launch();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(function(seed) {
        let state = seed >>> 0;
        Math.random = function() {
            state += 0x6D2B79F5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    }, 0x17cafe);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('STACK>> ' + String(e.stack || e.message).split('\n').slice(0, 5).join(' || ')));

    // ===== 场景A: 首次通关第1关 → 教程弹出 =====
    await step('清档开局: 全新档案(未看过教程)', async () => {
        await bootFresh(page);
        await resetProfile(page);
        assert(await page.evaluate(() => window.__game.profile.data.tutorialSeen) === false, 'tutorialSeen=false');
        assert(await page.evaluate(() => !!document.getElementById('btn-tutorial')), '首页存在📖新手指南按钮');
    });
    await step('第1关: 通关', async () => {
        await page.evaluate(() => document.getElementById('btn-start').click());
        await page.waitForTimeout(200);
        const r = await fastForward(page, 400);
        assert(r.state === 'won', 'L1胜利(实际' + r.state + ')');
    });
    await step('教程弹出: 胜利结算后延迟出现(600ms窗口)', async () => {
        await page.waitForFunction(overlayVisible, null, { timeout: 3000 });
        assert(true, '教程弹窗出现');
        const title = await page.evaluate(() => document.getElementById('tutorial-page-title').textContent);
        assert(title.length > 0, '第1页标题渲染(' + title + ')');
    });
    await step('跳过 → 关闭 + 已阅标记持久化', async () => {
        await page.evaluate(() => document.getElementById('tutorial-skip').click());
        await page.waitForTimeout(100);
        assert(await page.evaluate(overlayVisible) === false, '弹窗关闭');
        assert(await page.evaluate(() => window.__game.profile.data.tutorialSeen) === true, 'profile.tutorialSeen=true');
        assert(await page.evaluate(() => !!window.__game.profile._storage.getSafe('profile_v51')), '存档已落盘');
    });

    // ===== 场景B: 刷新后再次通关第1关 → 不再弹 =====
    await step('刷新页面: tutorialSeen 跨会话保留', async () => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });
        await page.evaluate(() => { window.__game._rafDisabled = true; window.__game.paused = false; });
        assert(await page.evaluate(() => window.__game.profile.data.tutorialSeen) === true, '刷新后仍为已阅');
    });
    await step('再次通关第1关 → 教程不再弹出', async () => {
        await page.evaluate(() => { window.__game.levelIndex = 0; document.getElementById('btn-start').click(); });
        await page.waitForTimeout(200);
        const r = await fastForward(page, 400);
        assert(r.state === 'won', 'L1再次胜利');
        await page.waitForTimeout(1200); // 越过600ms延迟窗口+余量
        assert(await page.evaluate(overlayVisible) === false, '弹窗未出现(已阅不再打扰)');
    });

    // ===== 场景C: 清档后第2关死亡 → 变强指南弹出 =====
    await step('清档后直接打第2关并阵亡', async () => {
        await resetProfile(page);
        await page.evaluate(() => { window.__game.levelIndex = 1; window.__game.start(); });
        await page.waitForTimeout(200);
        await page.evaluate(() => { window.__game.squad.setCount(0); });
        await page.evaluate(() => { const g = window.__game; for (let i = 0; i < 10 && g.state === 'playing'; i++) g._update(1/30); });
        assert(await page.evaluate(() => window.__game.state) === 'lost', '进入失败界面');
    });
    await step('教程弹出: 失败页之上出现变强指南', async () => {
        await page.waitForFunction(overlayVisible, null, { timeout: 3000 });
        const loseShown = await page.evaluate(() => !document.getElementById('lose-screen').classList.contains('hidden'));
        assert(loseShown, '失败结算页同时在场(弹窗叠加其上)');
    });
    await step('分页导航: 下一步×3 → 末页「知道了」→ 关闭', async () => {
        const pageCount = await page.evaluate(() => window.TutorialUI ? TutorialUI.PAGES.length : 0);
        assert(pageCount >= 4, '教程≥4页(实际' + pageCount + ')');
        const titles = [];
        for (let i = 0; i < pageCount - 1; i++) {
            titles.push(await page.evaluate(() => document.getElementById('tutorial-page-title').textContent));
            await page.evaluate(() => document.getElementById('tutorial-next').click());
            await page.waitForTimeout(60);
        }
        titles.push(await page.evaluate(() => document.getElementById('tutorial-page-title').textContent));
        assert(new Set(titles).size === pageCount, '每页标题不同(共' + new Set(titles).size + '页)');
        const lastLabel = await page.evaluate(() => document.getElementById('tutorial-next').textContent);
        assert(lastLabel === '知道了', '末页按钮变「知道了」(实际' + lastLabel + ')');
        await page.evaluate(() => document.getElementById('tutorial-next').click());
        await page.waitForTimeout(100);
        assert(await page.evaluate(overlayVisible) === false, '末页点击后关闭');
    });

    // ===== 场景D: 首页入口随时重看 =====
    await step('首页入口: 📖新手指南按钮 → 重看弹窗', async () => {
        await page.evaluate(() => document.getElementById('btn-lose-menu').click());
        await page.waitForTimeout(200);
        await page.evaluate(() => document.getElementById('btn-tutorial').click());
        await page.waitForTimeout(100);
        assert(await page.evaluate(overlayVisible), '弹窗重新打开');
        await page.evaluate(() => document.getElementById('tutorial-skip').click());
        assert(await page.evaluate(overlayVisible) === false, '再次关闭');
    });

    console.log('\n======================');
    console.log('V17 新手教程E2E 通过 ' + _passed + ' / 失败 ' + _failed);
    if (_failures.length) console.log('失败明细:\n  ' + _failures.join('\n  '));
    if (errors.length) console.log('[pageerrors]', errors.slice(0, 5).join(' | '));
    await browser.close();
    server.kill();
    process.exit(_failed ? 1 : (errors.length ? 1 : 0));
})().catch(e => { console.error('[tutorial-e2e] FAILED:', e.message); process.exit(1); });
