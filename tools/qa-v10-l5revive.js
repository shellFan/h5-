// ===== V10 全量QA: L5升级后复测 + 失败复活专项 =====
// 运行: node tools/qa-v10-l5revive.js  输出: docs/QA/v10-l5revive.json

'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'QA');
const SHOTS = path.join(OUT, 'screenshots');
const PORT = Number(process.env.QA_PORT || 8319);
const BASE = 'http://localhost:' + PORT;
fs.mkdirSync(SHOTS, { recursive: true });
const R = { l5: {}, revive: {}, errors: [], pageErrors: [] };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const STEER = () => {
    if (window.__qaSteer) return;
    window.__qaSteer = setInterval(() => {
        const g = window.__game;
        if (!g || g.state !== 'playing' || g.paused) return;
        const gates = g.gates.gates; let rowZ = null;
        for (const gt of gates) if (!gt.triggered && !gt.passed && gt.z < g.squad.z - 0.5 && gt.z > g.squad.z - 18) { if (rowZ === null || gt.z > rowZ) rowZ = gt.z; }
        if (rowZ === null) return;
        let best = null, bs = -1;
        for (const gt of gates) {
            if (gt.z !== rowZ || gt.triggered || gt.passed) continue;
            const d = gt.data; let s = 0;
            if (d.op === 'mul') s = g.squad.count * (d.value - 1);
            else if (d.op === 'add') s = d.value;
            else if (d.op === 'addpct') s = Math.max(1, Math.floor(g.squad.count * d.value / 100));
            else if (d.op === 'skill') s = 10;
            else s = 6;
            if (s > bs) { bs = s; best = gt; }
        }
        if (best) { g.squad.targetX = best.x; g.squad.lane = best.data.lane; }
    }, 120);
};

async function fps(page, ms) {
    return page.evaluate(ms => new Promise(res => {
        let n = 0; const t0 = performance.now();
        (function t() { n++; if (performance.now() - t0 < ms) requestAnimationFrame(t); else res(+(n * 1000 / (performance.now() - t0)).toFixed(1)); })();
    }), ms);
}

async function main() {
    const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
        { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
    await sleep(1200);
    const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });
    try {
        const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
        page.on('pageerror', e => R.pageErrors.push(e.message.slice(0, 150)));
        await page.goto(BASE + '/index.html?qa-l5=' + Date.now(), { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });
        await page.evaluate(() => { window.__game.profile._storage.remove('profile_v51'); });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 60000 });

        // ===== L5: 按真实玩家路径升级后复测 =====
        console.log('--- L5 升级后复测(真实玩家路径) ---');
        // 等价真实收益: L1-L4通关金币 + 击杀币 ≈ 2000+, 用于升级商店真实购买
        await page.evaluate(() => {
            const g = window.__game;
            g.profile.addCoins(1800); // L1-L4自然通关收益等值(首通60/80/110/140/200+击杀币)
            document.getElementById('v60-btn-armory').click();
        });
        await sleep(300);
        const buy = await page.evaluate(() => {
            // 真实UI: 连续点武器升级 + 商店升级(枪械/射速/招募)
            let n = 0;
            const arm = document.querySelector('.v60-armory-row.equipped .v60-armory-btn.upgrade');
            while (arm && !arm.disabled && n < 3) { arm.click(); n++; }
            document.getElementById('v60-armory-back').click();
            return { weaponUp: n };
        });
        await sleep(200);
        await page.evaluate(() => {
            const g = window.__game;
            document.getElementById('btn-open-shop').click();
        });
        await sleep(300);
        const buy2 = await page.evaluate(() => {
            let bought = [];
            ['gun', 'rapid', 'recruit', 'gun', 'gun'].forEach(id => {
                const b = document.getElementById('shop-buy-' + id);
                if (b && !b.disabled) { b.click(); bought.push(id); }
            });
            document.getElementById('btn-close-shop').click();
            return { shopBought: bought };
        });
        await sleep(200);
        console.log('真实购买: 武器×' + buy.weaponUp + ' 商店' + JSON.stringify(buy2.shopBought));
        // L5 实时试玩
        await page.evaluate(() => { window.__game.levelIndex = 4; window.__game.start(); });
        await page.evaluate(STEER);
        let bossShot = false;
        const t0 = Date.now();
        let final = null;
        while (Date.now() - t0 < 420000) {
            const st = await page.evaluate(() => {
                const g = window.__game;
                return { state: g.state, t: +g.elapsedTime.toFixed(1), cnt: g.squad.count, kills: g.enemies.killCount, boss: !!(g.enemies.boss && g.enemies.boss.hp > 0), bossHp: g.enemies.boss ? g.enemies.boss.hp : 0, enemies: g.enemies.enemies.length };
            });
            if (st.boss && !bossShot) { await page.screenshot({ path: SHOTS + '/boss-L5-realtime.png' }); bossShot = true; console.log('L5 Boss出现 hp=' + st.bossHp); }
            if (st.state !== 'playing') { final = st; break; }
            await sleep(500);
        }
        if (!final) final = { state: 'timeout' };
        await sleep(600);
        await page.screenshot({ path: SHOTS + (final.state === 'won' ? '/settle-win-L5.png' : '/settle-lose-L5.png') });
        R.l5 = final;
        console.log('L5结果: ' + final.state + ' t=' + (final.t || '-') + 's kills=' + (final.kills || 0) + ' cnt=' + (final.cnt || 0));

        // ===== 复活专项(在L5战场继续) =====
        console.log('--- 失败/复活专项 ---');
        if (final.state !== 'lost') {
            // 回到L5(最高难度)制造失败: 无转向AI(直线中道), 小队5人 → 自然团灭
            await page.evaluate(() => { window.__game.levelIndex = 4; window.__game.start(); });
        }
        // 压到小队全灭(无转向, 直线前进硬吃尸潮)
        await page.evaluate(() => { window.__game.squad.setCount(5); window.__game.maxCount = 5; window.__game.squad.targetX = 0; });
        let waited = 0, lost = false;
        while (waited < 150000) {
            const st = await page.evaluate(() => window.__game.state);
            if (st === 'lost') { lost = true; break; }
            if (st === 'won') { console.log('(意外胜利, 重来)'); await page.evaluate(() => { window.__game.levelIndex = 4; window.__game.start(); }); await sleep(500); await page.evaluate(() => { window.__game.squad.setCount(5); window.__game.maxCount = 5; window.__game.squad.targetX = 0; }); }
            await sleep(500); waited += 500;
        }
        R.revive.lostTriggered = lost;
        if (lost) {
            await sleep(600);
            await page.screenshot({ path: SHOTS + '/revive-lose-screen.png' });
            const vis = await page.evaluate(() => { const b = document.getElementById('btn-revive'); return b && !b.classList.contains('hidden') && b.offsetParent !== null; });
            R.revive.buttonVisible = vis;
            console.log('复活按钮可见: ' + vis);
            if (vis) {
                const coinsBefore = await page.evaluate(() => window.__game.profile.coins);
                await page.evaluate(() => document.getElementById('btn-revive').click());
                // Mock广告(手动模式)→ 点击"模拟完整观看"
                await sleep(800);
                const mockVisible = await page.evaluate(() => { const o = document.getElementById('mock-ad-overlay'); return o && getComputedStyle(o).display !== 'none'; });
                R.revive.mockAdShown = mockVisible;
                if (mockVisible) await page.evaluate(() => document.getElementById('mock-ad-finish').click());
                await page.waitForFunction(() => window.__game.state === 'playing', { timeout: 15000 });
                const after = await page.evaluate(() => ({ cnt: window.__game.squad.count, coins: window.__game.profile.coins, invuln: window.__game.squad.invulnT }));
                R.revive.applied = after;
                R.revive.coinDelta = after.coins - coinsBefore;
                await page.screenshot({ path: SHOTS + '/revive-after.png' });
                console.log(`复活成功: 人数=${after.cnt}(期望≥10) 金币变动=${R.revive.coinDelta}(期望0) 无敌=${after.invuln}s Mock广告=${mockVisible}`);
                // V10设计契约(单测): 复活人数=失败前最大人数×50%, 下限5 — 非固定10
                if (after.cnt < 5) R.errors.push('复活人数<5: ' + after.cnt);
                if (R.revive.coinDelta !== 0) R.errors.push('复活发放金币: ' + R.revive.coinDelta);
                // 二次死亡 → 复活按钮隐藏
                await page.evaluate(() => { window.__game.squad.setCount(3); window.__game.maxCount = 3; });
                let waited2 = 0, lost2 = false;
                while (waited2 < 120000) {
                    const st = await page.evaluate(() => window.__game.state);
                    if (st === 'lost') { lost2 = true; break; }
                    await sleep(500); waited2 += 500;
                }
                if (lost2) {
                    const vis2 = await page.evaluate(() => { const b = document.getElementById('btn-revive'); return b && !b.classList.contains('hidden') && b.offsetParent !== null; });
                    R.revive.secondTimeHidden = !vis2;
                    console.log('二次死亡复活按钮隐藏(每局限1次): ' + !vis2);
                    if (vis2) R.errors.push('复活可重复使用!');
                    await page.evaluate(() => document.getElementById('btn-lose-menu').click());
                    await sleep(600);
                    R.revive.backHome = await page.evaluate(() => !document.getElementById('start-screen').classList.contains('hidden'));
                    console.log('返回首页: ' + R.revive.backHome);
                }
            }
        } else {
            R.errors.push('复活专项: 120s内未能自然触发失败');
        }
        fs.writeFileSync(path.join(OUT, 'v10-l5revive.json'), JSON.stringify(R, null, 2));
        console.log('\n错误数: ' + R.errors.length);
        R.errors.forEach(e => console.log('  ✗ ' + e));
    } finally {
        await browser.close();
        cp.kill();
    }
}
main().catch(e => { console.error('失败:', e); process.exit(1); });
