// Regression: blocked gates, shipped volley DPS budget, and visible automatic recruitment.
const assert = require('assert/strict');
const path = require('path');
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');
const PORT = 8395;

(async () => {
    const server = spawn(process.execPath, ['tools/server.js'], {
        cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
    });
    let browser, failures = 0;
    try {
        browser = await chromium.launch({ headless: true, channel: 'msedge' });
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://localhost:${PORT}/`);
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
        await page.evaluate(() => { window.__game._rafDisabled = true; });
        async function check(name, fn) {
            if (process.env.TEST_FILTER && !name.includes(process.env.TEST_FILTER)) return;
            try { await fn(); console.log('PASS ' + name); }
            catch (e) { failures++; console.error('FAIL ' + name + ': ' + e.message); }
        }

        for (const hz of [30, 60, 120]) await check(`L6 blocked gate waits then releases at ${hz}Hz`, async () => {
            const result = await page.evaluate(hz => {
                const g = window.__game;
                g.levelIndex = 5; g.start(); RandomEvents._t = 99999;
                g.gates.chosenRows.add(-8);
                g.squad.z = -34;
                g.combat.fireTimer = 99999;
                g.pacing.waves[0].state = 'clearing';
                g.pacing.activeWave = g.pacing.waves[0];
                g.enemies.spawnEnemy('normal', 0, -70, 100000);
                let minZ = g.squad.z, backwards = false, prevZ = g.squad.z;
                for (let i = 0; i < hz * 6; i++) {
                    g.time += 1 / hz; g._update(1 / hz);
                    backwards ||= g.squad.z > prevZ + 1e-8;
                    prevZ = g.squad.z; minZ = Math.min(minZ, prevZ);
                }
                const waiting = { minZ, backwards, chosen: g.gates.isRowChosen(-40),
                    futureSkillVisible: g.gates.gates.some(x => x.z === -86 && x.model.visible) };
                g.enemies.clear(); g.pacing.waves[0].state = 'done';
                g.pacing.activeWave = null; g.pacing.restTimer = 99999;
                for (let i = 0; i < hz * 4; i++) { g.time += 1 / hz; g._update(1 / hz); }
                return { waiting, chosenAfterClear: g.gates.isRowChosen(-40), state: g.state };
            }, hz);
            assert(result.waiting.minZ >= -35.001, JSON.stringify(result));
            assert(!result.waiting.backwards && !result.waiting.chosen, JSON.stringify(result));
            assert(!result.waiting.futureSkillVisible, 'future skill gates bypass encounter lock');
            assert(result.chosenAfterClear && result.state === 'playing', JSON.stringify(result));
        });

        await check('all authored gate rows remain reachable in L6–L10', async () => {
            const results = await page.evaluate(() => {
                const g = window.__game, results = [];
                for (let li = 5; li < 10; li++) {
                    g.levelIndex = li; g.start(); RandomEvents._t = 99999;
                    // Isolate route liveness from permanent upgrade balance.
                    g.squad.setCount(60); g.squad.damageBuff = 3; g.squad.invulnT = 9999;
                    const expected = LEVELS[li].segments.filter(s => s.type === 'gates').map(s => s.z);
                    for (let i = 0; i < 180 * 60 && g.state === 'playing' && !expected.every(z => g.gates.isRowChosen(z)); i++) {
                        g.time += 1 / 60; g._update(1 / 60);
                    }
                    results.push({ level: li + 1, expected, chosen: [...g.gates.chosenRows], state: g.state,
                        time: g.elapsedTime, z: g.squad.z, waves: g.pacing.summary(),
                        remaining: g.enemies.enemies.filter(e => e.alive).map(e => ({ type: e.type, z: e.z, hp: e.hp })) });
                }
                return results;
            });
            for (const r of results) {
                assert.deepEqual(r.chosen, r.expected, JSON.stringify(r));
                assert.notEqual(r.state, 'lost', JSON.stringify(r));
            }
        });

        // V13.1: 断言对齐当前交付契约(原断言写于共享分摊公式时代, 该口径下 v51 L3 稳定
        // lost, 已实证不可行)。锁定两件事防止无意漂移: 每发预算公式 max(1, round(DPS/rate))
        // 与 1–5 齐射弹道数。与"齐射分摊"理想契约的偏差登记于 docs/V13/QA_REPORT.md。
        await check('volley fires 1–5 positions on the shipped DPS budget per shot', async () => {
            const results = await page.evaluate(() => {
                const g = window.__game; g.levelIndex = 0; g.start(); RandomEvents._t = 99999;
                g.squad.critChance = 0; g.squad._evCritBonus = 0;
                const combat = g.combat, originalFire = combat._fire;
                const results = [];
                try {
                    for (const count of [1, 7, 31, 100, 500]) {
                        g.squad.setCount(count);
                        let damage = 0, shots = 0;
                        combat._fire = (pos, dmg) => { damage += dmg; shots++; };
                        combat.fireTimer = 0;
                        const visualRate = Math.min(2 + Math.sqrt(count) * 2.2, 30);
                        const volley = Math.min(5, 1 + Math.floor(Math.sqrt(count) / 2.3));
                        const perShot = Math.max(1, Math.round(count * g.squad.getDamage() * g.squad.getFireRate() / visualRate));
                        const expected = perShot * Math.min(volley, count);
                        combat.update(0.001, g.squad, g.enemies, null);
                        results.push({ count, damage, expected, shots, volley: Math.min(volley, count) });
                    }
                } finally { combat._fire = originalFire; }
                return results;
            });
            for (const r of results) {
                assert.equal(r.shots, r.volley, JSON.stringify(r));
                assert(Math.abs(r.damage - r.expected) < 1e-6, JSON.stringify(r));
            }
        });

        await check('fractional hit, splash, chain, burn and poison preserve their multipliers', async () => {
            const r = await page.evaluate(() => {
                const g = window.__game; g.levelIndex = 0; g.start(); g.enemies.clear(); g.combat.clear();
                g.squad.explosive = 1; g.squad.chain = 1; g.squad._wpnBurn = true;
                g.squad._skillVenom = 1; g.squad._classEliteMul = 1.25;
                const primary = g.enemies.spawnEnemy('elite', 0, -6, 100);
                const side = g.enemies.spawnEnemy('normal', 1, -6, 100);
                const primaryHp = primary.hp, sideHp = side.hp;
                g.combat.fireTimer = 99999; g.combat._squad = g.squad;
                g.combat._fire({ x: 0, y: 1, z: -5.9 }, 0.24, primary, false);
                g.combat.update(0.01, g.squad, g.enemies, null);
                return { primaryLoss: primaryHp - primary.hp, sideLoss: sideHp - side.hp,
                    burn: primary._burnDps, venom: primary._venomDps };
            });
            // Primary: 1.25x hit plus first half-second burn/poison ticks.
            assert(Math.abs(r.primaryLoss - (0.3 + 0.03 + 0.024)) < 1e-6, JSON.stringify(r));
            assert(Math.abs(r.sideLoss - (0.12 + 0.096)) < 1e-6, JSON.stringify(r));
            assert(Math.abs(r.burn - 0.06) < 1e-6 && Math.abs(r.venom - 0.048) < 1e-6, JSON.stringify(r));
        });

        await check('rear ambush can be cleared while waiting for a gate', async () => {
            const r = await page.evaluate(() => {
                const g = window.__game; g.levelIndex = 5; g.start(); RandomEvents._t = 99999;
                g.gates.chosenRows.add(-8); g.squad.z = -35;
                g.squad.setCount(1); g.squad.damageBuff = 20; g.squad.invulnT = 9999;
                g.pacing.waves[0].state = 'clearing'; g.pacing.activeWave = g.pacing.waves[0];
                RANDOM_EVENT_DEFS.find(x => x.id === 'ambush').apply(g);
                const ambushers = g.enemies.enemies.slice();
                for (let i = 0; i < 20 * 60 && !g.gates.isRowChosen(-40); i++) {
                    g.time += 1 / 60; g._update(1 / 60);
                }
                return { chosen: g.gates.isRowChosen(-40), alive: ambushers.filter(e => e.alive).length };
            });
            assert.equal(r.alive, 0, JSON.stringify(r)); assert(r.chosen, JSON.stringify(r));
        });

        await check('kill recruitment respects the technology-expanded squad cap', async () => {
            const r = await page.evaluate(() => {
                const g = window.__game; g.start(); g.enemies.clear(); g.combat.clear();
                g._techStats.limitBonus = 100; g.squad.setCount(501);
                g.squad.vampStacks = 1; g.squad._comboRecycle = 1; g.squad._skillHarvest = 1;
                const e = g.enemies.spawnEnemy('normal', 0, -6, 0.1);
                g.combat._squad = g.squad; g.combat.fireTimer = 99999;
                g.combat._fire({ x: 0, y: 1, z: -5.9 }, 1, e, false);
                const random = Math.random;
                try { Math.random = () => 0; g.combat.update(0.01, g.squad, g.enemies, null); }
                finally { Math.random = random; }
                return { count: g.squad.count, text: document.getElementById('reinforcement-notice').textContent };
            });
            assert.equal(r.count, 504, JSON.stringify(r));
            for (const source of ['吸血恢复', '回收无人机', '亡者征召']) assert(r.text.includes(source + ' +1人'), r.text);
        });

        await check('automatic recruitment reports actual capped gains and clears on restart', async () => {
            const result = await page.evaluate(() => {
                const g = window.__game; g.start(); RandomEvents._t = 99999;
                g.squad.setCount(10);
                RANDOM_EVENT_DEFS.find(x => x.id === 'airdrop').apply(g);
                const el = document.getElementById('reinforcement-notice');
                const airdrop = { count: g.squad.count, text: el && el.textContent, visible: el && !el.hidden };
                g.squad.setCount(g.squad._maxLimit() - 1);
                const added = g.squad.addReinforcements(15, '战地医疗', g.effects);
                const atCap = g.squad.addReinforcements(15, '战地医疗', g.effects);
                const cappedText = el.textContent;
                for (let i = 0; i < 20; i++) g.squad.addReinforcements(1, '亡者征召', g.effects);
                const rings = g.effects.shockwaves.length;
                g.effects.update(3);
                const expired = el.hidden;
                g.start();
                return { airdrop, added, atCap, cappedText, rings, expired, resetHidden: el.hidden };
            });
            assert.equal(result.airdrop.count, 25);
            assert(result.airdrop.visible && result.airdrop.text.includes('空投补给 +15人'), JSON.stringify(result));
            assert.equal(result.added, 1); assert.equal(result.atCap, 0);
            assert(result.cappedText.includes('战地医疗 +1人'), result.cappedText);
            assert(result.rings <= 2, 'recruit effects must be bounded');
            assert(result.expired, 'notice should expire after 2.8 seconds');
            assert(result.resetHidden, 'stale notice survives restart');
        });
        await check('repeated kill recruits aggregate without particle spam', async () => {
            const result = await page.evaluate(() => {
                const g = window.__game; g.start();
                g.squad.setCount(10);
                for (let i = 0; i < 20; i++) g.squad.addReinforcements(1, '亡者征召', g.effects);
                return { text: document.getElementById('reinforcement-notice').textContent,
                    rings: g.effects.shockwaves.length, floats: g.effects.floatTexts.length };
            });
            assert(result.text.includes('亡者征召 +20人'), result.text);
            assert.equal(result.rings, 1); assert.equal(result.floats, 1);
        });
        await check('no browser errors', () => assert.deepEqual(errors, []));
        if (process.env.CAPTURE_FEEDBACK) {
            await page.evaluate(() => {
                const g = window.__game; g.start(); g.squad.setCount(15);
                g.squad.addReinforcements(15, '空投补给', g.effects);
                for (let i = 0; i < 30; i++) { g.time += 1 / 60; g._update(1 / 60); }
                g.world.renderer.render(g.world.scene, g.world.camera);
            });
            await page.screenshot({ path: process.env.CAPTURE_FEEDBACK });
        }
    } finally {
        if (browser) await browser.close();
        server.kill();
    }
    process.exitCode = failures ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
