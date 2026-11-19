// ===== V10 全量QA: 真实浏览器深度试玩 =====
// 真实启动 → 首页全导航 → L1-L5 连续实时通关 → Boss多轮 → 失败复活 → 存档一致性
// 真实 rAF 帧驱动 + 页面内转向AI(等价玩家拖动) + FPS/内存采样 + 全程截图
// 运行: node tools/qa-v10-play.js  输出: docs/QA/v10-play-results.json + docs/QA/screenshots/

'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'QA');
const SHOTS = path.join(OUT, 'screenshots');
const PORT = Number(process.env.QA_PORT || 8311);
const BASE = 'http://localhost:' + PORT;

fs.mkdirSync(SHOTS, { recursive: true });
const R = { boot: {}, home: {}, levels: [], bossRounds: [], revive: {}, save: {}, perf: {}, errors: [], notes: [] };
let pageErrors = [];

function stamp() { return new Date().toISOString().slice(11, 19); }
async function shot(page, name) {
    const p = path.join(SHOTS, name);
    await page.screenshot({ path: p });
    console.log(`[${stamp()}] 📷 ${name}`);
    return name;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fpsSample(page, ms) {
    return page.evaluate(ms => new Promise(res => {
        let n = 0; const t0 = performance.now();
        function tick() { n++; if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(+(n * 1000 / (performance.now() - t0)).toFixed(1)); }
        requestAnimationFrame(tick);
    }), ms);
}
async function mem(page) {
    return page.evaluate(() => (performance.memory ? {
        heap: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1),
        limit: +(performance.memory.jsHeapSizeLimit / 1048576).toFixed(0)
    } : null));
}
// 页面内转向AI: 每帧扫描前方门排, 选择收益最高门(等价玩家观察+拖动)
const STEER_FN = () => {
    if (window.__qaSteer) return;
    window.__qaSteer = setInterval(() => {
        const g = window.__game;
        if (!g || g.state !== 'playing' || g.paused) return;
        const gates = g.gates.gates; let rowZ = null;
        for (const gt of gates) {
            if (!gt.triggered && !gt.passed && gt.z < g.squad.z - 0.5 && gt.z > g.squad.z - 18) {
                if (rowZ === null || gt.z > rowZ) rowZ = gt.z;
            }
        }
        if (rowZ === null) return;
        let best = null, bs = -1;
        for (const gt of gates) {
            if (gt.z !== rowZ || gt.triggered || gt.passed) continue;
            const d = gt.data; let s = 0;
            if (d.op === 'mul') s = g.squad.count * (d.value - 1);
            else if (d.op === 'add') s = d.value;
            else if (d.op === 'addpct') s = Math.max(1, Math.floor(g.squad.count * d.value / 100));
            else if (d.op === 'skill') s = 10; // 技能门: 真实选择
            else s = (d.value === 'damage2' || d.value === 'arsenal') ? 12 : 4;
            if (s > bs) { bs = s; best = gt; }
        }
        if (best) { g.squad.targetX = best.x; g.squad.lane = best.data.lane; }
    }, 120);
};

async function startServer() {
    const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
        { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
    const t0 = Date.now();
    await new Promise(res => {
        (function poll() {
            require('http').get(BASE + '/index.html', r => { r.resume(); res(); }).on('error', () => {
                if (Date.now() - t0 > 10000) res(); else setTimeout(poll, 200);
            });
        })();
    });
    return cp;
}

async function bootFresh(browser, viewport, tag) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const failed = [];
    page.on('pageerror', e => pageErrors.push('[pageerror] ' + e.message.slice(0, 200)));
    page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) pageErrors.push('[console] ' + m.text().slice(0, 200)); });
    page.on('requestfailed', rq => { if (!rq.url().includes('favicon')) failed.push(rq.url().split('/').pop()); });
    page.on('response', rs => { if (rs.status() >= 400 && !rs.url().includes('favicon')) failed.push(rs.status() + ' ' + rs.url().split('/').pop()); });
    const t0 = Date.now();
    await page.goto(BASE + '/index.html?qa=' + (tag || Date.now()), { waitUntil: 'domcontentloaded', timeout: 30000 });
    // 启动进度条: 真实GLB加载
    try {
        await page.waitForSelector('#boot-loading', { state: 'visible', timeout: 5000 });
        await page.waitForFunction(() => {
            const pct = document.getElementById('boot-pct');
            return pct && parseInt(pct.textContent) >= 30;
        }, null, { timeout: 8000 });
        await shot(page, `boot-loading-${tag || 'mid'}.png`);
    } catch (e) { R.notes.push('boot进度条采样: ' + e.message.split('\n')[0]); }
    await page.waitForFunction(() => !window.__game || (window.__game && window.__game.squad && window.__game.squad.renderer), { timeout: 60000 });
    const bootMs = Date.now() - t0;
    const bootHidden = await page.evaluate(() => {
        const el = document.getElementById('boot-loading');
        return !el || el.classList.contains('hidden') || getComputedStyle(el).display === 'none';
    });
    return { ctx, page, bootMs, bootHidden, failed };
}

async function startLevel(page, li) {
    await page.evaluate(li => { window.__game.levelIndex = li; window.__game.start(); }, li);
    await page.waitForFunction(() => window.__game.state === 'playing', { timeout: 8000 });
}

// 实时试玩一关(不加速): 转向AI + 采样 + 等待胜负
async function playLevelRealtime(page, li, label, maxSec, opts) {
    const o = Object.assign({ shots: true }, opts || {});
    const rec = { level: li + 1, label, t0: Date.now(), startCoin: null, endCoin: null };
    rec.startCoin = await page.evaluate(() => window.__game.profile.coins);
    rec.startCount = await page.evaluate(() => window.__game.squad.count);
    rec.skillsBefore = await page.evaluate(() => JSON.stringify(window.__game.squad.skills || {}));
    const t0 = Date.now();
    let bossShotDone = false, hordeShotDone = false, gateShotDone = false, midShotDone = false;
    let bossSeen = false, skillGatePassed = 0;
    while (Date.now() - t0 < maxSec * 1000) {
        const st = await page.evaluate(() => {
            const g = window.__game;
            return {
                state: g.state, t: +g.elapsedTime.toFixed(1), cnt: g.squad.count,
                kills: g.enemies.killCount, boss: !!(g.enemies.boss && g.enemies.boss.alive !== false && g.enemies.boss.hp > 0),
                bossName: g.enemies.boss ? (g.enemies.boss.defKey || g.enemies.boss.name || 'boss') : null,
                bossHp: g.enemies.boss ? g.enemies.boss.hp : 0, bossMax: g.enemies.boss ? (g.enemies.boss.maxHp || g.enemies.boss.hp) : 0,
                enemies: g.enemies.enemies.length, bullets: g.combat.bullets.length,
                coins: g.profile.coins, skills: g.squad.skills || {}, lr: g._settlement ? g._settlement.levelReward : null,
                gateEvents: g.gates.passLog ? g.gates.passLog.length : 0
            };
        });
        if (st.boss) bossSeen = true;
        if (st.state !== 'playing') {
            rec.end = st; rec.durSec = +((Date.now() - t0) / 1000).toFixed(1);
            rec.endCoin = st.coins; rec.bossSeen = bossSeen;
            rec.coinGain = rec.endCoin - rec.startCoin;
            rec.kills = st.kills; rec.finalCount = st.cnt;
            rec.result = st.state;
            if (st.state === 'won' || st.state === 'lost') {
                await sleep(600);
                await shot(page, (st.state === 'won' ? `settle-win-L${li + 1}.png` : `settle-lose-L${li + 1}.png`));
            }
            return rec;
        }
        // 事件截图
        if (o.shots) {
            if (!midShotDone && st.t > 4) { await shot(page, `combat-L${li + 1}-early.png`); midShotDone = true; }
            if (!gateShotDone && st.cnt > rec.startCount && st.enemies > 0) { await shot(page, `combat-L${li + 1}-gates.png`); gateShotDone = true; }
            if (!hordeShotDone && st.enemies >= 22) { await shot(page, `combat-L${li + 1}-horde.png`); hordeShotDone = true; }
            if (!bossShotDone && st.boss) { await shot(page, `boss-L${li + 1}.png`); bossShotDone = true; }
        }
        // FPS 采样点
        if (!rec.fpsCombat && st.t > 3) rec.fpsCombat = await fpsSample(page, 1200);
        if (!rec.fpsHorde && st.enemies >= 22) rec.fpsHorde = await fpsSample(page, 1200);
        if (!rec.fpsBoss && st.boss) rec.fpsBoss = await fpsSample(page, 1200);
        if (!rec.memPeak) rec.memPeak = await mem(page);
        const m2 = await mem(page); if (m2 && (!rec.memPeak || m2.heap > rec.memPeak.heap)) rec.memPeak = m2;
        await sleep(400);
    }
    rec.result = 'timeout'; rec.durSec = maxSec;
    return rec;
}

async function main() {
    console.log('===== V10 QA 深度试玩 开始 =====');
    const server = await startServer();
    const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });
    try {
        // ============ A. 启动测试 ============
        console.log('\n--- A. 启动/加载 ---');
        const vp390 = { width: 390, height: 844 };
        const boot = await bootFresh(browser, vp390, '390');
        const page = boot.page;
        R.boot.bootMs = boot.bootMs;
        R.boot.progressHidden = boot.bootHidden;
        R.boot.failedRequests = boot.failed;
        console.log(`启动耗时 ${boot.bootMs}ms, 进度条隐藏=${boot.bootHidden}, 失败资源=${boot.failed.length}`);
        await page.evaluate(() => { // 清档: 测试浏览器上下文隔离, 非用户真实存档
            const st = window.__game.profile._storage;
            st.remove('profile_v51');
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });
        const fresh = await page.evaluate(() => ({ coins: window.__game.profile.coins, ul: window.__game.profile.data.unlockedLevel }));
        R.boot.freshProfile = fresh;
        console.log('清档后: coins=' + fresh.coins + ' unlockedLevel=' + fresh.ul);
        await sleep(800);
        await shot(page, 'home-390.png');
        R.perf.fpsHome = await fpsSample(page, 1500);
        R.perf.memHome = await mem(page);

        // ============ B. 首页全导航 ============
        console.log('\n--- B. 首页导航 ---');
        const navBtns = ['map', 'train', 'armory', 'tech', 'codex', 'challenge', 'rank', 'ach', 'daily', 'set'];
        R.home.pages = {};
        for (const b of navBtns) {
            const r = await page.evaluate(btn => {
                const btn1 = document.getElementById('v60-btn-' + btn);
                if (!btn1) return { found: false };
                btn1.click();
                const pg = document.querySelector('.v60-page:not(.hidden)');
                return { found: true, page: pg ? pg.id : null };
            }, b);
            await sleep(250);
            const back = await page.evaluate(() => {
                const pg = document.querySelector('.v60-page:not(.hidden)');
                const backBtn = pg && pg.querySelector('[id$="-back"]');
                if (backBtn) backBtn.click();
                return pg ? pg.id : null;
            });
            await sleep(150);
            const homeBack = await page.evaluate(() => {
                const s = document.getElementById('start-screen');
                return s && !s.classList.contains('hidden');
            });
            R.home.pages[b] = { open: r.page, backToHome: homeBack };
            const good = r.found && r.page && homeBack;
            console.log(`${good ? '✓' : '✗'} ${b} → ${r.page} → 返回首页=${homeBack}`);
            if (!good) R.errors.push('首页导航异常: ' + b + ' ' + JSON.stringify(r));
        }
        await shot(page, 'rank-page.png');
        // 职业卡: 四职业存在 + 可选择
        const cls = await page.evaluate(() => {
            const row = document.getElementById('v60-class-row');
            const cards = row ? row.querySelectorAll('.v60-class-card') : [];
            return { n: cards.length, names: Array.from(cards).map(c => c.querySelector('.v60-class-name') ? c.querySelector('.v60-class-name').textContent : '') };
        });
        R.home.classes = cls;
        console.log(`职业卡: ${cls.n} 张 [${cls.names.join(',')}]`);
        if (cls.n !== 4) R.errors.push('首页职业卡数量异常: ' + cls.n);
        await shot(page, 'home-class-cards.png');

        // ============ C-E. L1-L5 实时连续通关 + L1 Boss 三轮 ============
        console.log('\n--- C. L1-L5 实时试玩 ---');
        await page.evaluate(() => { window.__game.profile.data.unlockedLevel = 5; window.__game.profile.save && window.__game.profile.save(); });
        // Boss三轮(先测L1): round1 = 第一轮L1
        for (let round = 1; round <= 3; round++) {
            await startLevel(page, 0);
            await page.evaluate(STEER_FN);
            const rec = await playLevelRealtime(page, 0, `L1-BossRound${round}`, 240);
            R.bossRounds.push(rec);
            console.log(`L1 Boss第${round}轮: ${rec.result} ${rec.durSec}s kills=${rec.kills} cnt=${rec.finalCount} coin+${rec.coinGain} boss见=${rec.bossSeen} fps战=${rec.fpsCombat}`);
            if (rec.result !== 'won') R.errors.push(`L1 Boss第${round}轮未胜利: ${rec.result}`);
            if (round < 3) {
                await page.evaluate(() => document.getElementById('btn-restart-win') && document.getElementById('btn-restart-win').click());
                await sleep(800);
            } else {
                await page.evaluate(() => document.getElementById('btn-next-level') && document.getElementById('btn-next-level').click());
                await sleep(800);
            }
        }
        // L2-L5 连续实时通关(真实下一关入口)
        for (let li = 1; li <= 4; li++) {
            await startLevel(page, li);
            await page.evaluate(STEER_FN);
            const rec = await playLevelRealtime(page, li, 'L' + (li + 1), 300);
            R.levels.push(rec);
            console.log(`L${li + 1}: ${rec.result} ${rec.durSec}s kills=${rec.kills} cnt=${rec.finalCount} coin+${rec.coinGain} fps战=${rec.fpsCombat}/群=${rec.fpsHorde}/Boss=${rec.fpsBoss}`);
            if (rec.result !== 'won') R.errors.push(`L${li + 1}未胜利: ${rec.result}`);
            if (li < 4) {
                const nextOk = await page.evaluate(() => {
                    const b = document.getElementById('btn-next-level');
                    if (b && !b.classList.contains('hidden')) { b.click(); return true; }
                    return false;
                });
                if (!nextOk) R.errors.push('L' + (li + 1) + ' 下一关按钮不可用');
                await sleep(1000);
            }
        }

        // ============ F. 失败与复活 ============
        console.log('\n--- F. 失败/复活 ---');
        await startLevel(page, 2);
        await page.evaluate(STEER_FN);
        await page.evaluate(() => { window.__game.squad.setCount(6); window.__game.maxCount = 6; });
        let waited = 0, lost = false;
        while (waited < 90000) {
            const st = await page.evaluate(() => window.__game.state);
            if (st === 'lost') { lost = true; break; }
            if (st === 'won') break;
            await sleep(500); waited += 500;
        }
        if (lost) {
            await sleep(600);
            await shot(page, 'settle-lose-forced.png');
            const reviveVisible = await page.evaluate(() => {
                const b = document.getElementById('btn-revive');
                return b && !b.classList.contains('hidden') && b.offsetParent !== null;
            });
            R.revive.buttonVisible = reviveVisible;
            console.log('复活按钮可见: ' + reviveVisible);
            if (reviveVisible) {
                const coinsBefore = await page.evaluate(() => window.__game.profile.coins);
                await page.evaluate(() => document.getElementById('btn-revive').click());
                // Mock广告自动完成
                await page.waitForFunction(() => window.__game.state === 'playing', { timeout: 15000 });
                const after = await page.evaluate(() => ({ cnt: window.__game.squad.count, coins: window.__game.profile.coins, invuln: window.__game.squad.invulnT }));
                R.revive.applied = after;
                R.revive.coinDelta = after.coins - coinsBefore;
                console.log(`复活成功: cnt=${after.cnt} 金币变动=${R.revive.coinDelta} 无敌=${after.invuln}s`);
                if (R.revive.coinDelta !== 0) R.errors.push('复活发放了金币? ' + R.revive.coinDelta);
                await shot(page, 'revive-after.png');
                // 再次死亡 → 复活按钮应隐藏(每局1次)
                await page.evaluate(() => { window.__game.squad.setCount(4); });
                let waited2 = 0, lost2 = false;
                while (waited2 < 90000) {
                    const st = await page.evaluate(() => window.__game.state);
                    if (st === 'lost') { lost2 = true; break; }
                    if (st === 'won') break;
                    await sleep(500); waited2 += 500;
                }
                if (lost2) {
                    const revive2 = await page.evaluate(() => {
                        const b = document.getElementById('btn-revive');
                        return b && !b.classList.contains('hidden') && b.offsetParent !== null;
                    });
                    R.revive.secondTimeHidden = !revive2;
                    console.log('二次死亡复活按钮隐藏(每局1次): ' + !revive2);
                    if (revive2) R.errors.push('复活可重复使用!');
                    const backHome = await page.evaluate(() => { document.getElementById('btn-lose-menu').click(); return true; });
                    await sleep(600);
                    const homeShown = await page.evaluate(() => !document.getElementById('start-screen').classList.contains('hidden'));
                    R.revive.backHome = homeShown;
                    console.log('失败页返回首页: ' + homeShown);
                }
            }
        } else {
            R.notes.push('失败/复活: 未能自然触发失败(队伍存活)');
        }

        // ============ G. 存档一致性 ============
        console.log('\n--- G. 存档一致性 ---');
        const snap1 = await page.evaluate(() => {
            const p = window.__game.profile;
            return { coins: p.coins, ul: p.data.unlockedLevel, lv: p.data.level, xp: p.data.xp };
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });
        const snap2 = await page.evaluate(() => {
            const p = window.__game.profile;
            return { coins: p.coins, ul: p.data.unlockedLevel, lv: p.data.level, xp: p.data.xp };
        });
        R.save.afterReload = { before: snap1, after: snap2, match: JSON.stringify(snap1) === JSON.stringify(snap2) };
        console.log('刷新存档对比: ' + JSON.stringify(snap1) + ' → ' + JSON.stringify(snap2) + ' match=' + R.save.afterReload.match);
        if (!R.save.afterReload.match) R.errors.push('刷新后存档不一致!');
        // 中途退出: L2进行中刷新 → 金币保留/关卡不回退
        await startLevel(page, 1);
        await page.evaluate(STEER_FN);
        await sleep(6000);
        const midSnap = await page.evaluate(() => ({ coins: window.__game.profile.coins, ul: window.__game.profile.data.unlockedLevel, state: window.__game.state }));
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });
        const postSnap = await page.evaluate(() => ({ coins: window.__game.profile.coins, ul: window.__game.profile.data.unlockedLevel, state: window.__game.state }));
        R.save.midBattleQuit = { mid: midSnap, post: postSnap };
        console.log('战斗中退出: 金币 ' + midSnap.coins + '→' + postSnap.coins + ' 解锁 ' + midSnap.ul + '→' + postSnap.ul + ' 状态 ' + midSnap.state + '→' + postSnap.state);
        if (postSnap.ul < midSnap.ul) R.errors.push('中途退出导致关卡解锁回退!');
        if (postSnap.coins > midSnap.coins + 1) R.errors.push('中途退出金币异常增加!');

        R.perf.fpsFinal = await fpsSample(page, 1500);
        R.perf.memFinal = await mem(page);

        // ============ 汇总 ============
        R.errors.total = R.errors.length;
        fs.writeFileSync(path.join(OUT, 'v10-play-results.json'), JSON.stringify(R, null, 2));
        console.log('\n===== 试玩结束 =====');
        console.log('错误数: ' + R.errors.length);
        console.log('FPS: home=' + R.perf.fpsHome + ' final=' + R.perf.fpsFinal);
        console.log('内存: home=' + JSON.stringify(R.perf.memHome) + ' final=' + JSON.stringify(R.perf.memFinal));
        if (pageErrors.length) { console.log('页面JS错误 ' + pageErrors.length + ' 条:'); pageErrors.slice(0, 10).forEach(e => console.log('  ' + e)); }
        R.pageErrors = pageErrors;
        fs.writeFileSync(path.join(OUT, 'v10-play-results.json'), JSON.stringify(R, null, 2));
    } finally {
        await browser.close();
        server.kill();
    }
}

main().catch(e => { console.error('试玩脚本失败:', e); process.exit(1); });
