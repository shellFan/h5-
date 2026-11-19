// ===== V10 全量QA: 士兵/武器/装备升级前后真实对比 =====
// 真实UI点击升级 → 同条件真实战斗DPS对比 → 刷新持久化
// 运行: node tools/qa-v10-progression.js  输出: docs/QA/v10-progression.json + 截图

'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'QA');
const SHOTS = path.join(OUT, 'screenshots');
const PORT = Number(process.env.QA_PORT || 8312);
const BASE = 'http://localhost:' + PORT;
fs.mkdirSync(SHOTS, { recursive: true });
const R = { soldier: {}, weapon: {}, equip: {}, errors: [] };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function combatDpsProbe(page, sec) {
    // 同条件真实战斗: 清场 → 生成1个标准敌人(已知HP) → 固定时间自由射击 → 结算伤害
    return page.evaluate(sec => new Promise(res => {
        const g = window.__game;
        g.levelIndex = 0; g.start(); // 每次探针强制重启: 重算 _weaponStats/_techStats(升级只在start时注入战斗)
        g.paused = false; g.state = 'playing';
        g.enemies.clear(); g.pacing.clear(); g.effects.clear();
        g.squad.setCount(30); g.squad.x = 0; g.squad.targetX = 0; g.squad.z = -2;
        g.squad.critChance = 0; g.squad.damageBuff = 1;
        if (g.squad._skillFocus) g.squad._skillFocus = 0;
        const e = g.enemies.spawnEnemy('normal', 0, g.squad.z - 9, 100000, null);
        const hp0 = e.hp;
        const t0 = Date.now();
        const iv = setInterval(() => {
            if (Date.now() - t0 >= sec * 1000) {
                clearInterval(iv);
                const dealt = hp0 - Math.max(0, e.hp);
                res({ dealt: Math.round(dealt), kills: e.hp <= 0 ? 1 : 0, hp0: Math.round(hp0) });
            }
        }, 100);
    }), sec);
}

async function main() {
    const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
        { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
    await sleep(1200);
    const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });
    try {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
        const page = await ctx.newPage();
        const errs = [];
        page.on('pageerror', e => errs.push(e.message.slice(0, 150)));
        await page.goto(BASE + '/index.html?qa-prog=' + Date.now(), { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });
        await page.evaluate(() => { window.__game.profile._storage.remove('profile_v51'); });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });

        // ============ 士兵升级 ============
        console.log('--- 士兵升级对比 ---');
        await page.evaluate(() => window.__game.profile.addCoins(3000));
        await page.evaluate(() => document.getElementById('v60-btn-train').click());
        await sleep(300);
        const sBefore = await page.evaluate(() => {
            const p = window.__game.profile;
            return { lv: SoldierGrowth.level(p), stats: SoldierGrowth.stats(p), dmg: window.__game.squad.getDamage(), rate: window.__game.squad.getFireRate(), coins: p.coins };
        });
        await combatDpsProbe(page, 5).then(r => { R.soldier.dpsBefore = r; });
        await page.screenshot({ path: SHOTS + '/soldier-train-before.png' });
        // 真实点击升级按钮×5(设计: 每5级+1伤害里程碑, Lv1→2仅+2生命不增伤)
        const up1 = await page.evaluate(() => {
            const b = document.getElementById('v60-train-upgrade');
            if (!b) return { ok: false, why: '按钮不存在' };
            let clicks = 0;
            for (let i = 0; i < 5; i++) {
                if (b.disabled) break;
                b.click(); clicks++;
            }
            return { ok: clicks > 0, clicks };
        });
        await sleep(400);
        const sAfter = await page.evaluate(() => {
            const p = window.__game.profile;
            return { lv: SoldierGrowth.level(p), stats: SoldierGrowth.stats(p), dmg: window.__game.squad.getDamage(), rate: window.__game.squad.getFireRate(), coins: p.coins };
        });
        R.soldier.before = sBefore; R.soldier.after = sAfter; R.soldier.click = up1;
        await combatDpsProbe(page, 5).then(r => { R.soldier.dpsAfter = r; });
        await page.screenshot({ path: SHOTS + '/soldier-train-after.png' });
        console.log(`等级 ${sBefore.lv}→${sAfter.lv} 伤害加成 ${sBefore.stats.dmgBonus}→${sAfter.stats.dmgBonus} getDamage ${sBefore.dmg}→${sAfter.dmg} 金币 ${sBefore.coins}→${sAfter.coins}`);
        console.log(`真实战斗5s伤害: 前=${R.soldier.dpsBefore.dealt} 后=${R.soldier.dpsAfter.dealt}`);
        if (sAfter.lv !== sBefore.lv + up1.clicks) R.errors.push('士兵升级后等级未+5: ' + sBefore.lv + '→' + sAfter.lv);
        if (sAfter.coins >= sBefore.coins) R.errors.push('士兵升级未扣费');
        if (R.soldier.dpsAfter.dealt <= R.soldier.dpsBefore.dealt) R.errors.push('士兵升级后真实战斗伤害未提升!');
        // 刷新持久化
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 60000 });
        const sPersist = await page.evaluate(() => SoldierGrowth.level(window.__game.profile));
        R.soldier.persistLv = sPersist;
        console.log('刷新后士兵等级: ' + sPersist + (sPersist === sAfter.lv ? ' ✓' : ' ✗'));
        if (sPersist !== sAfter.lv) R.errors.push('士兵等级刷新后丢失');

        // ============ 武器升级 ============
        console.log('--- 武器升级对比 ---');
        await page.evaluate(() => { window.__game.profile.addCoins(3000); document.getElementById('v60-btn-armory').click(); });
        await sleep(300);
        const wBefore = await page.evaluate(() => {
            const p = window.__game.profile;
            return { w: WeaponSystem.current(p), lv: WeaponSystem.level(p), stats: WeaponSystem.stats(p), dmg: window.__game.squad.getDamage(), rate: window.__game.squad.getFireRate() };
        });
        await combatDpsProbe(page, 5).then(r => { R.weapon.dpsBefore = r; });
        await page.screenshot({ path: SHOTS + '/weapon-armory-before.png' });
        const wUp = await page.evaluate(() => {
            const btn = document.querySelector('.v60-armory-row.equipped .v60-armory-btn.upgrade');
            if (!btn) return { ok: false, why: '升级按钮不存在' };
            const dis = btn.disabled; btn.click();
            return { ok: true, wasDisabled: dis };
        });
        await sleep(400);
        const wAfter = await page.evaluate(() => {
            const p = window.__game.profile;
            return { w: WeaponSystem.current(p), lv: WeaponSystem.level(p), stats: WeaponSystem.stats(p), dmg: window.__game.squad.getDamage(), rate: window.__game.squad.getFireRate(), coins: p.coins };
        });
        R.weapon.before = wBefore; R.weapon.after = wAfter; R.weapon.click = wUp;
        await combatDpsProbe(page, 5).then(r => { R.weapon.dpsAfter = r; });
        await page.screenshot({ path: SHOTS + '/weapon-armory-after.png' });
        console.log(`武器 ${wBefore.w} Lv${wBefore.lv}→Lv${wAfter.lv} 伤害×${wBefore.stats.dmgMul}→×${wAfter.stats.dmgMul} getDamage ${wBefore.dmg}→${wAfter.dmg}`);
        console.log(`真实战斗5s伤害: 前=${R.weapon.dpsBefore.dealt} 后=${R.weapon.dpsAfter.dealt}`);
        if (wAfter.lv !== wBefore.lv + 1) R.errors.push('武器升级后等级未+1');
        if (R.weapon.dpsAfter.dealt <= R.weapon.dpsBefore.dealt) R.errors.push('武器升级后真实战斗伤害未提升!');
        // 刷新持久化
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 60000 });
        const wPersist = await page.evaluate(() => ({ lv: WeaponSystem.level(window.__game.profile), w: WeaponSystem.current(window.__game.profile) }));
        R.weapon.persist = wPersist;
        console.log('刷新后武器: ' + wPersist.w + ' Lv' + wPersist.lv + (wPersist.lv === wAfter.lv ? ' ✓' : ' ✗'));
        if (wPersist.lv !== wAfter.lv) R.errors.push('武器等级刷新后丢失');

        // ============ 装备穿戴 ============
        console.log('--- 装备穿戴对比 ---');
        await page.evaluate(() => document.getElementById('v60-btn-train').click());
        await sleep(300);
        const eBefore = await page.evaluate(() => {
            const g = window.__game, p = g.profile;
            // 真实掉落链路生成一件装备(与通关掉落同一函数)
            if (typeof EquipmentLoot !== 'undefined') {
                const item = EquipmentLoot.rollOnWin(p, 0, 2)[0] || EquipmentLoot.rollOnWin(p, 0, 3)[0];
                p.data.bag = p.data.bag || [];
                p.data.bag.push(item);
                p.save && p.save();
                return { bagN: p.data.bag.length, item, dmg: g.squad.getDamage() };
            }
            return { bagN: 0, item: null };
        });
        R.equip.item = eBefore.item;
        console.log('生成掉落: ' + (eBefore.item ? eBefore.item.name + ' [' + (eBefore.item.affixLines || []).join(' / ') + ']' : 'FAIL'));
        if (!eBefore.item) R.errors.push('EquipmentLoot.roll 未生成装备');
        await page.evaluate(() => { if (typeof V60UI !== 'undefined') V60UI.renderTraining(window.__game); else if (window.__game.ui && window.__game.ui.renderTraining) window.__game.ui.renderTraining(window.__game); });
        await sleep(300);
        await page.screenshot({ path: SHOTS + '/equipment-bag.png' });
        const wearRes = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('.v60-bag-btn'));
            const wear = btns.find(b => b.textContent.includes('穿戴'));
            if (!wear) return { ok: false, why: '无穿戴按钮 bagBtns=' + btns.length };
            wear.click();
            return { ok: true };
        });
        await sleep(400);
        const eAfter = await page.evaluate(() => {
            const g = window.__game, p = g.profile;
            return { eq: p.data.equipment, dmg: g.squad.getDamage(), dr: SoldierGrowth.stats(p).drBonus, crit: SoldierGrowth.stats(p).critBonus };
        });
        R.equip.before = { dmg: eBefore.dmg }; R.equip.after = eAfter; R.equip.wear = wearRes;
        console.log('穿戴后: dmg ' + eBefore.dmg + '→' + eAfter.dmg + ' dr=' + eAfter.dr + ' crit=' + eAfter.crit);
        if (!wearRes.ok) R.errors.push('背包穿戴按钮点击失败: ' + wearRes.why);
        if (eAfter.dmg === eBefore.dmg && !eAfter.dr && !eAfter.crit) R.errors.push('装备穿戴后属性无变化(词条未生效?)');
        await page.screenshot({ path: SHOTS + '/equipment-worn.png' });
        // 持久化
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 60000 });
        const ePersist = await page.evaluate(() => ({ eq: !!window.__game.profile.data.equipment, bag: (window.__game.profile.data.bag || []).length }));
        R.equip.persist = ePersist;
        console.log('刷新后装备保留: eq=' + ePersist.eq + ' bag=' + ePersist.bag);
        if (!ePersist.eq) R.errors.push('装备穿戴刷新后丢失');
        R.pageErrors = errs;
        fs.writeFileSync(path.join(OUT, 'v10-progression.json'), JSON.stringify(R, null, 2));
        console.log('\n错误数: ' + R.errors.length);
        R.errors.forEach(e => console.log('  ✗ ' + e));
        if (errs.length) console.log('页面JS错误: ' + errs.slice(0, 5).join(' | '));
    } finally {
        await browser.close();
        cp.kill();
    }
}
main().catch(e => { console.error('失败:', e); process.exit(1); });
