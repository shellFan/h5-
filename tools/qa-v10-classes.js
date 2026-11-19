// ===== V10 全量QA: 四职业真实战斗差异对比 =====
// 每职业: 首页真实选择 → 真实战斗5s采样(单发伤害/射速/减伤/回复) → 解锁门控 → 持久化
// 运行: node tools/qa-v10-classes.js  输出: docs/QA/v10-classes.json + 截图

'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'QA');
const SHOTS = path.join(OUT, 'screenshots');
const PORT = Number(process.env.QA_PORT || 8313);
const BASE = 'http://localhost:' + PORT;
fs.mkdirSync(SHOTS, { recursive: true });
const R = { classes: {}, errors: [], pageErrors: [] };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function combatProbe(page, sec) {
    return page.evaluate(sec => new Promise(res => {
        const g = window.__game;
        if (g.state !== 'playing') { g.levelIndex = 0; g.start(); }
        g.paused = false; g.state = 'playing';
        g.enemies.clear(); g.pacing.clear(); g.effects.clear();
        g.squad.setCount(30); g.squad.x = 0; g.squad.targetX = 0; g.squad.z = -2;
        g.squad.critChance = 0; g.squad.damageBuff = 1;
        const e = g.enemies.spawnEnemy('normal', 0, g.squad.z - 9, 1000000, null);
        const hp0 = e.hp;
        const cnt0 = g.squad.count;
        const t0 = Date.now();
        let castSeen = false;
        // 监控职业技能自动施放标记(任一 _skill 开关被点亮)
        const iv = setInterval(() => {
            const g2 = window.__game;
            if (g2.squad._skillFocus > 0 || g2.squad._skillBarrage > 0 || g2.squad._skillPierce > 0 || g2.squad._skillRally > 0) castSeen = true;
            if (Date.now() - t0 >= sec * 1000) {
                clearInterval(iv);
                res({
                    dealt: Math.round(hp0 - Math.max(0, e.hp)),
                    dmg: +g2.squad.getDamage().toFixed(2),
                    rate: +g2.squad.getFireRate().toFixed(2),
                    dr: +(g2.squad._totalDr || 0).toFixed(3),
                    cntEnd: g2.squad.count, cntStart: cnt0,
                    skillCast: castSeen,
                    pierce: g2.squad.pierceBonus || 0
                });
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
        for (const cid of ['rifleman', 'gunner', 'marksman', 'medic']) {
            const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
            const page = await ctx.newPage();
            page.on('pageerror', e => R.pageErrors.push(e.message.slice(0, 150)));
            await page.goto(BASE + '/index.html?qa-cls=' + cid + '&' + Date.now(), { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });
            await page.evaluate(() => { window.__game.profile._storage.remove('profile_v51'); });
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });
            // 解锁门控: 清档下 gunner/marksman/medic 应锁定
            const gate = await page.evaluate(cid => {
                const cards = Array.from(document.querySelectorAll('.v60-class-card'));
                const names = Array.from(document.querySelectorAll('.v60-class-name')).map(x => x.textContent);
                const idx = names.findIndex(n => CLASS_DEFS[cid] && n.includes(CLASS_DEFS[cid].name));
                if (idx < 0) return { found: false };
                return { found: true, locked: cards[idx].classList.contains('locked') };
            }, cid);
            // 真实选择职业(点击职业卡)
            const sel = await page.evaluate(cid => {
                const cards = Array.from(document.querySelectorAll('.v60-class-card'));
                const names = Array.from(document.querySelectorAll('.v60-class-name')).map(x => x.textContent);
                const idx = names.findIndex(n => n.includes(CLASS_DEFS[cid].name));
                if (idx < 0) return { ok: false };
                cards[idx].click();
                return { ok: true, classId: window.__game.profile.data.classId };
            }, cid);
            await sleep(400);
            await page.screenshot({ path: SHOTS + '/class-' + cid + '-home.png' });
            // 锁定职业: 解锁后重试(模拟通关解锁)
            if (gate.found && gate.locked && cid !== 'rifleman') {
                await page.evaluate(() => { const p = window.__game.profile; p.data.unlockedLevel = 7; p.save && p.save(); });
                await page.reload({ waitUntil: 'domcontentloaded' });
                await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 60000 });
                const sel2 = await page.evaluate(cid => {
                    const cards = Array.from(document.querySelectorAll('.v60-class-card'));
                    const names = Array.from(document.querySelectorAll('.v60-class-name')).map(x => x.textContent);
                    const idx = names.findIndex(n => n.includes(CLASS_DEFS[cid].name));
                    cards[idx].click();
                    return window.__game.profile.data.classId;
                }, cid);
                sel.classId = sel2;
            }
            // 真实战斗采样
            await page.evaluate(() => { window.__game.profile.addCoins(0); });
            const probe = await combatProbe(page, 6);
            R.classes[cid] = { gate, sel, probe };
            await page.screenshot({ path: SHOTS + '/class-' + cid + '-combat.png' });
            console.log(`${cid}: sel=${sel.classId} 单发=${probe.dmg} 射速=${probe.rate} 减伤=${probe.dr} 穿透=${probe.pierce} 5s伤害=${probe.dealt} 技能释放=${probe.skillCast} 人数${probe.cntStart}→${probe.cntEnd}`);
            // 持久化
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 60000 });
            const persisted = await page.evaluate(() => window.__game.profile.data.classId);
            R.classes[cid].persisted = persisted;
            if (persisted !== cid) R.errors.push(cid + ' 职业选择刷新后丢失: ' + persisted);
            await ctx.close();
        }
        // 差异断言
        const c = R.classes;
        if (c.rifleman && c.gunner) {
            if (!(c.gunner.probe.rate > c.rifleman.probe.rate)) R.errors.push('机枪手射速未高于步兵');
            if (!(c.gunner.probe.dmg < c.rifleman.probe.dmg)) R.errors.push('机枪手单发未低于步兵');
            if (!(c.gunner.probe.dr > c.rifleman.probe.dr)) R.errors.push('机枪手减伤未高于步兵');
        }
        if (c.rifleman && c.marksman) {
            if (!(c.marksman.probe.dmg > c.rifleman.probe.dmg)) R.errors.push('狙击单发未高于步兵');
            if (!(c.marksman.probe.rate < c.rifleman.probe.rate)) R.errors.push('狙击射速未低于步兵');
        }
        if (c.rifleman && c.medic) {
            if (!(c.medic.probe.dr > c.rifleman.probe.dr)) R.errors.push('军医减伤未高于步兵');
        }
        console.log('\n四职业差异断言: ' + (R.errors.length ? '存在失败' : '全部通过'));
        fs.writeFileSync(path.join(OUT, 'v10-classes.json'), JSON.stringify(R, null, 2));
        R.errors.forEach(e => console.log('  ✗ ' + e));
        if (R.pageErrors.length) console.log('页面JS错误: ' + R.pageErrors.slice(0, 5).join(' | '));
    } finally {
        await browser.close();
        cp.kill();
    }
}
main().catch(e => { console.error('失败:', e); process.exit(1); });
