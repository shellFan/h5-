// ===== V5.1 五关完整进程 E2E =====
// 真实游戏推进(固定步长快进) + 真实UI点击 + 经济/商店/Boss/失败重试全链路
// 运行: npm run test:v51

const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { chromium } = require('playwright-core');

const PORT = process.env.E2E_PORT || 8141;
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

/** 固定步长快进: 直到 won/lost 或超时(游戏秒) */
async function fastForward(page, maxGameSec, stepDt) {
    stepDt = stepDt || 1 / 30;
    return page.evaluate(({ maxGameSec, stepDt }) => {
        const g = window.__game;
        const t0 = g.elapsedTime;
        let steps = 0;
        while (g.state === 'playing' && (g.elapsedTime - t0) < maxGameSec && steps < 60000) {
            // 贪心选门: 前方未触发门排 → 评分 mul人数增量 > add > 高值buff
            const gates = g.gates.gates;
            let rowZ = null;
            for (let i = 0; i < gates.length; i++) {
                const gt = gates[i];
                if (!gt.triggered && !gt.passed && gt.z < g.squad.z - 1 && gt.z > g.squad.z - 16) {
                    if (rowZ === null || gt.z > rowZ) rowZ = gt.z; // 最近的一排(最大z)
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
        return { state: g.state, elapsed: +(g.elapsedTime - t0).toFixed(1), count: g.squad.count, kills: g.enemies.killCount };
    }, { maxGameSec, stepDt });
}

(async () => {
    const server = await startServer();
    const browser = await launch();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push('STACK>> ' + String(e.stack || e.message).split('\n').slice(0, 5).join(' || ')));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });

    // ===== 清档开局 =====
    await step('清档: 全新档案(0金币/1级解锁)', async () => {
        await page.evaluate(() => {
            const st = window.__game.profile._storage;
            st.remove('profile_v51');
            window.__game.profile = new GameProfile(window.__game.profile._storage, window.__game.profile._raw);
            window.__game.squad.profile = window.__game.profile; // 重接(升级属性读取同一档案)
            window.__game._refreshCoinDisplays();
        });
        const coins = await page.evaluate(() => window.__game.profile.coins);
        assert(coins === 0, '初始金币=0');
    });

    // ===== 第1关: 真实点击开始 → 快进 → 胜利金币 =====
    await step('第1关: 点击部署小队开始', async () => {
        await page.evaluate(() => document.getElementById('btn-start').click());
        await page.waitForTimeout(200);
        assert(await page.evaluate(() => window.__game.state) === 'playing', '进入playing');
    });
    await step('第1关: 防守战斗推进至胜利', async () => {
        const r = await fastForward(page, 400);
        assert(r.state === 'won', 'L1应胜利(实际' + r.state + ', t=' + r.elapsed + 's)');
        assert(r.kills >= 40, 'L1击杀≥40(实际' + r.kills + ')');
    });
    await step('第1关: 胜利金币入账(关卡60+击杀币)', async () => {
        const s = await page.evaluate(() => {
            const g = window.__game;
            return { coins: g.profile.coins, settlement: g._settlement, unlocked: g.profile.data.unlockedLevel,
                claimed: g.profile.hasClaimed('win:L0') };
        });
        assert(s.coins >= 60, '金币≥60(实际' + s.coins + ')');
        assert(s.settlement && s.settlement.levelReward === 60, '关卡奖励60');
        assert(s.claimed, 'win:L0 已标记幂等');
        assert(s.unlocked === 2, '解锁第2关');
        const shown = await page.evaluate(() => !document.getElementById('win-coins').classList.contains('hidden'));
        assert(shown, '胜利页金币明细可见');
    });
    await step('重复结算保护: 再开L1通关不加关卡奖励', async () => {
        await page.evaluate(() => { window.__game.levelIndex = 0; window.__game.start(); });
        const r = await fastForward(page, 400);
        assert(r.state === 'won');
        const s = await page.evaluate(() => ({ lr: window.__game._settlement.levelReward, total: window.__game._settlement.total }));
        assert(s.lr === 0, '重复通关无关卡奖励(实际' + s.lr + ')');
        assert(s.total <= 30, '仅击杀币(实际' + s.total + ')'); // L1击杀币上限=60×50%
    });

    // ===== 商店: 购买升级 =====
    await step('商店: 打开并购买枪械强化(余额足够)', async () => {
        await page.evaluate(() => { window.__game.profile.addCoins(400); window.__game._openShop(); });
        await page.waitForTimeout(150);
        const visible = await page.evaluate(() => !document.getElementById('shop-screen').classList.contains('hidden'));
        assert(visible, '商店页可见');
        const before = await page.evaluate(() => ({
            coins: window.__game.profile.coins,
            gun: window.__game.profile.data.upgrades.gun
        }));
        await page.evaluate(() => document.getElementById('shop-buy-gun').click());
        await page.waitForTimeout(150);
        const after = await page.evaluate(() => ({
            coins: window.__game.profile.coins,
            gun: window.__game.profile.data.upgrades.gun
        }));
        assert(after.gun === before.gun + 1, '枪械等级+1');
        assert(after.coins === before.coins - 120, '扣款120(实际' + (before.coins - after.coins) + ')');
        // 属性生效: 下一局基础伤害=2
        await page.evaluate(() => { window.__game.levelIndex = 1; window.__game.start(); });
        const dmg = await page.evaluate(() => window.__game.squad.getDamage());
        assert(dmg === 2, '升级后基础伤害=2(实际' + dmg + ')');
    });

    // ===== 第2关 + 失败重试(L3) =====
    await step('第2关: 通关并解锁第3关', async () => {
        const r = await fastForward(page, 400);
        assert(r.state === 'won', 'L2胜利');
        const unlocked = await page.evaluate(() => window.__game.profile.data.unlockedLevel);
        assert(unlocked === 3, '解锁L3');
    });
    await step('第3关: 失败 → 保留少量击杀币 → 重新挑战', async () => {
        await page.evaluate(() => { window.__game.levelIndex = 2; window.__game.start(); });
        await page.waitForTimeout(150);
        await page.evaluate(() => { window.__game.squad.setCount(0); }); // 阵亡
        await page.waitForTimeout(300);
        const state = await page.evaluate(() => window.__game.state);
        assert(state === 'lost', '进入失败界面');
        const s = await page.evaluate(() => ({ coins: window.__game.profile.coins, st: window.__game._settlement }));
        assert(s.st && s.st.levelReward === 0, '失败无关卡奖励');
        assert(s.st.killReward <= 15, '失败击杀币≤15(实际' + s.st.killReward + ')');
        const lcVisible = await page.evaluate(() => !document.getElementById('lose-coins').classList.contains('hidden'));
        assert(lcVisible, '失败页显示击杀金币');
        await page.evaluate(() => document.getElementById('btn-restart-lose').click());
        await page.waitForTimeout(200);
        assert(await page.evaluate(() => window.__game.state) === 'playing', '重新挑战进入playing');
    });

    // ===== 第3~5关推进 =====
    await step('第3关: 重试通关', async () => {
        const r = await fastForward(page, 500);
        assert(r.state === 'won', 'L3胜利(实际' + r.state + ')');
    });
    await step('第4关: 变异尸潮清场吞吐(60人清60只混合潮+解锁L5)', async () => {
        await page.evaluate(() => {
            const g = window.__game;
            g.levelIndex = 3; g.start();
            g.pacing.forceComplete(); // 组合式: 波次排空
            if (g.enemies.clear) g.enemies.clear();
            g.squad.reset(60); g.squad.z = 0; g.squad.x = 0; g.squad.targetX = 0;
            g.squad.damageBuff = 3; g.squad.critChance = 0.15;
            g.state = 'playing'; g.paused = false;
            const roster = ['split', 'fast', 'shield', 'normal', 'fast', 'split', 'normal', 'fast',
                            'shield', 'fast', 'split', 'normal', 'fast', 'split', 'shield', 'fast'];
            for (let i = 0; i < 60; i++) {
                const col = i % 3, row = Math.floor(i / 3);
                g.enemies.spawnEnemy(roster[i], (col - 1) * 2.1 + (row % 2 ? 0.35 : -0.35), -10 - row * 1.8, 25);
            }
        });
        const r = await fastForward(page, 120);
        assert(r.kills >= 50, 'L4清场击杀≥50(实际' + r.kills + ', 变异潮吞吐验证)');
        assert(r.count >= 30, '60人清场存活≥30(实际' + r.count + ')');
        // 胜利结算: forceComplete下清空即胜利 → 解锁L5
        const unlocked = await page.evaluate(() => window.__game.profile.data.unlockedLevel);
        assert(unlocked === 5, '解锁L5(实际' + unlocked + ')');
    });

    await step('第5关: Boss遭遇(Boss出场+血条+血量双因子)', async () => {
        await page.evaluate(() => {
            const g = window.__game;
            g.levelIndex = 4; g.start();
            g.pacing.forceComplete(); // 测试钩子: 波次视为排空(组合式Boss遭遇)
            if (g.enemies.clear) g.enemies.clear();
            g.squad.reset(80); g.squad.z = 0; g.squad.x = 0; g.squad.targetX = 0;
            g.state = 'playing'; g.paused = false;
            g.enemies.spawnEnemy('boss', 0, -14, 20000, 'overlord');
            for (let f = 0; f < 20; f++) g._update(1 / 60);
        });
        const boss = await page.evaluate(() => ({
            exists: !!window.__game.enemies.boss,
            bar: !document.getElementById('boss-bar-container').classList.contains('hidden'),
            hp: window.__game.enemies.boss ? window.__game.enemies.boss.hp : 0
        }));
        assert(boss.exists, 'Boss出场(overlord)');
        assert(boss.bar, 'Boss血条可见');
        assert(boss.hp > 0, 'Boss血量>0(' + boss.hp + ')');
    });

    await step('第5关: 击杀Boss → 胜利结算(奖励200+幂等)', async () => {
        await page.evaluate(() => {
            const g = window.__game;
            g.squad.setCount(120);
            g.enemies.boss.takeDamage(999999, g.effects);
            const dt = 1 / 30;
            let f = 0;
            while (g.state === 'playing' && f < 400) { g._update(dt); f++; }
        });
        const state = await page.evaluate(() => window.__game.state);
        assert(state === 'won', 'Boss击杀后胜利(实际' + state + ')');
        const s5 = await page.evaluate(() => ({
            lr: window.__game._settlement ? window.__game._settlement.levelReward : -1,
            claimed: window.__game.profile.hasClaimed('win:L4'),
            coins: window.__game.profile.coins
        }));
        assert(s5.lr === 200, 'L5关卡奖励200(实际' + s5.lr + ')');
        assert(s5.claimed, 'win:L4 幂等标记');
        assert(s5.coins >= 200, '累计金币≥200');
    });

    // ===== 双倍广告 + 持久化 =====
    await step('双倍奖励: 广告完成→金币翻倍入账(幂等)', async () => {
        const before = await page.evaluate(() => window.__game.profile.coins);
        await page.evaluate(() => { window.__game.adCoord._ads._scenario = 'auto_complete'; document.getElementById('btn-double-reward').click(); });
        await page.waitForTimeout(4600);
        const after = await page.evaluate(() => window.__game.profile.coins);
        const label = await page.evaluate(() => document.getElementById('btn-double-reward').textContent);
        assert(after >= before + 200, '补发关卡奖励(+' + (after - before) + ')');
        assert(label.indexOf('已领取') >= 0, '按钮变已领取');
    });
    await step('存档持久化: 刷新页面金币/升级/解锁全部保留', async () => {
        const snapshot = await page.evaluate(() => ({
            coins: window.__game.profile.coins,
            gun: window.__game.profile.data.upgrades.gun,
            unlocked: window.__game.profile.data.unlockedLevel
        }));
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });
        const after = await page.evaluate(() => ({
            coins: window.__game.profile.coins,
            gun: window.__game.profile.data.upgrades.gun,
            unlocked: window.__game.profile.data.unlockedLevel
        }));
        assert(after.coins === snapshot.coins, '金币保留(' + after.coins + ')');
        assert(after.gun === snapshot.gun, '升级保留');
        assert(after.unlocked === snapshot.unlocked, '解锁保留');
    });

    console.log('\n======================');
    console.log('V5.1 五关E2E 通过 ' + _passed + ' / 失败 ' + _failed);
    if (_failures.length) console.log('失败明细:\n  ' + _failures.join('\n  '));
    if (errors.length) console.log('[pageerrors]', errors.slice(0, 5).join(' | '));
    await browser.close();
    server.kill();
    process.exit(_failed ? 1 : (errors.length ? 1 : 0));
})().catch(e => { console.error('[v51-e2e] FAILED:', e.message); process.exit(1); });
