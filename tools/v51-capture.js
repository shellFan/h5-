// ===== V5.1 真实游戏截图采集 =====
// docs/screenshots/v51/: 首页/升级商店/L1战斗/L3尸潮/L5 Boss/胜利(金币结算)/失败
// 全部来自真实 Game 渲染管线 + 固定种子 + 真实UI。运行: npm run capture51

'use strict';

const fs = require('fs');
const path = require('path');
const {
    ROOT,
    createHarness,
    seededContext,
    waitForGameReady,
    watchPageErrors
} = require('./v42-browser');

const OUT = path.join(ROOT, 'docs', 'screenshots', 'v51');
const PORT = Number(process.env.V51_CAPTURE_PORT || 8252);
const SEED = 0x51f00dc0;

function mkdirp(dir) { fs.mkdirSync(dir, { recursive: true }); }

async function openPage(browser, baseUrl, viewport) {
    const context = await seededContext(browser, viewport, 2, SEED);
    const page = await context.newPage();
    const errors = watchPageErrors(page);
    await page.goto(`${baseUrl}/index.html?v51capture=1&quality=2`, {
        waitUntil: 'domcontentloaded', timeout: 30000
    });
    await waitForGameReady(page, 30000);
    return { context, page, errors };
}

async function shot(page, name, expected) {
    const out = path.join(OUT, name);
    await page.screenshot({ path: out });
    expected.push(out);
    console.log('captured ' + name);
}

/** 贪心选门 + 固定步长快进真实游戏 */
async function runLevel(page, levelIndex, opts) {
    const o = Object.assign({ levelIndex: levelIndex, maxSec: 400, stopAtBoss: false, framesAfter: 30, stopAfterSec: 0 }, opts);
    return page.evaluate(o => {
        const g = window.__game;
        g.levelIndex = o.levelIndex;
        g.start();
        const dt = 1 / 30;
        let steps = 0;
        const t0 = g.elapsedTime;
        let bossSeen = false;
        while (g.state === 'playing' && (g.elapsedTime - t0) < o.maxSec && steps < 60000) {
            // 贪心选门
            const gates = g.gates.gates;
            let rowZ = null;
            for (const gt of gates) if (!gt.triggered && !gt.passed && gt.z < g.squad.z - 1 && gt.z > g.squad.z - 16) { if (rowZ === null || gt.z > rowZ) rowZ = gt.z; }
            if (rowZ !== null) {
                let best = null, bestScore = -1;
                for (const gt of gates) {
                    if (gt.z !== rowZ || gt.triggered || gt.passed) continue;
                    const d = gt.data;
                    let s = 0;
                    if (d.op === 'mul') s = g.squad.count * (d.value - 1);
                    else if (d.op === 'add') s = d.value;
                    else if (d.op === 'addpct') s = Math.max(1, Math.floor(g.squad.count * d.value / 100));
                    else if (d.op === 'nuke') s = 15;
                    else s = (d.value === 'damage2' || d.value === 'arsenal') ? 12 : 4;
                    if (s > bestScore) { bestScore = s; best = gt; }
                }
                if (best) { g.squad.targetX = best.x; g.squad.lane = best.data.lane; }
            }
            g._update(dt);
            steps++;
            if (o.stopAtBoss && g.enemies.boss && !bossSeen) { bossSeen = true; break; }
            if (o.stopAfterSec > 0 && (g.elapsedTime - t0) >= o.stopAfterSec) break;
        }
        return { state: g.state, count: g.squad.count, kills: g.enemies.killCount, bossSeen: bossSeen || !!g.enemies.boss };
    }, o);
}

(async () => {
    mkdirp(OUT);
    const harness = await createHarness({ port: PORT }).start();
    const expected = [];
    try {
        const { context, page, errors } = await openPage(harness.browser, harness.baseUrl, { width: 390, height: 844 });

        // 清档后截首页(0金币新档)
        await page.evaluate(() => {
            const st = window.__game.profile._storage;
            st.remove('profile_v51');
            window.__game.profile = new GameProfile(window.__game.profile._storage, window.__game.profile._raw);
            window.__game.squad.profile = window.__game.profile;
            window.__game._refreshCoinDisplays();
        });
        await page.waitForTimeout(500);
        await shot(page, 'home-390x844.png', expected);

        // 升级商店
        await page.evaluate(() => { window.__game.profile.addCoins(850); window.__game._refreshCoinDisplays(); window.__game._openShop(); });
        await page.waitForTimeout(250);
        await shot(page, 'shop-390x844.png', expected);
        await page.evaluate(() => { window.__game._closeShop(); window.__game.profile.data.upgrades.gun = 1; window.__game.profile.save(); });

        // 第1关战斗(防守阵地+首波尸潮)
        const l1 = await runLevel(page, 0, { maxSec: 400, stopAfterSec: 36 });
        console.log('L1 mid-capture state:', JSON.stringify(l1));
        await shot(page, 'combat-L1-390x844.png', expected);

        // 第3关尸潮(打到中段截帧)
        await runLevel(page, 1, { maxSec: 400 });
        const l3 = await runLevel(page, 2, { maxSec: 500, stopAfterSec: 50 });
        console.log('L3 mid-capture state:', JSON.stringify(l3));
        await shot(page, 'horde-L3-390x844.png', expected);

        // 先走完 L3/L4 积累金币, 再打 L5 至 Boss
        await runLevel(page, 2, { maxSec: 500 });
        await runLevel(page, 3, { maxSec: 500 });
        const l5 = await runLevel(page, 4, { maxSec: 400, stopAtBoss: true });
        console.log('L5 boss state:', JSON.stringify(l5));
        await shot(page, 'boss-L5-390x844.png', expected);

        // 打完 L5 → 胜利+金币结算
        await page.evaluate(() => {
            const g = window.__game;
            const dt = 1 / 30;
            let steps = 0;
            while (g.state === 'playing' && steps < 20000) { g._update(dt); steps++; }
        });
        const l5end = await page.evaluate(() => window.__game.state);
        console.log('L5 final:', l5end);
        await shot(page, 'win-coins-390x844.png', expected);

        // 双倍广告(Mock auto) → 金币入账后结算页
        await page.evaluate(() => {
            const g = window.__game;
            if (g.adCoord && g.adCoord._ads && g.adCoord._ads.setScenario) g.adCoord._ads.setScenario('auto_complete');
            const b = document.getElementById('btn-double-reward');
            if (b && !b.classList.contains('hidden')) b.click();
        });
        await page.waitForTimeout(1200);
        await shot(page, 'win-coins-doubled-390x844.png', expected);

        // 失败页(L5开局即死)
        await page.evaluate(() => { window.__game.levelIndex = 4; window.__game.start(); window.__game.squad.setCount(0); });
        await page.waitForTimeout(400);
        await shot(page, 'lose-390x844.png', expected);

        if (errors.length) throw new Error('browser errors: ' + errors.join(' | '));
    } finally {
        await harness.close();
    }
    const missing = expected.filter(f => !fs.existsSync(f));
    if (missing.length) throw new Error('截图缺失: ' + missing.join(', '));
    console.log('\nV5.1 capture complete: ' + expected.length + ' screenshots → docs/screenshots/v51/');
})().catch(e => { console.error('[v51-capture] FAILED:', e.message); process.exit(1); });
