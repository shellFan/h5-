// Sustained-fire CPU profile. Fixed steps include render submission, not GPU completion.
const { createHarness, seededContext } = require('./v42-browser');
const fs = require('fs');
(async () => {
    const h = createHarness({ port: 8476 });
    await h.start();
    try {
        const context = await seededContext(h.browser, { width: 390, height: 844 });
        const page = await context.newPage();
        await page.goto(h.baseUrl);
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
        await page.evaluate(async () => {
            window.__game._rafDisabled = true;
            await EnemyModelLoader.load();
            await window.__game.world._militaryArt.ready;
        });
        const cd = await context.newCDPSession(page);
        await cd.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await cd.send('Profiler.enable');
        await cd.send('Profiler.start');
        const result = await page.evaluate(() => {
            const g = window.__game;
            g.start(); g.pacing.clear(); g.gates.clear(); g.enemies.clear();
            RandomEvents._t = 999999;
            g.squad.setCount(300); g.squad.invulnT = 999999;
            for (let i = 0; i < 40; i++) {
                g.enemies.spawnEnemy('normal', (i % 5 - 2) * 1.2, -8 - Math.floor(i / 5) * 2, 99999999);
            }
            const times = {}, originals = [];
            for (const [key, obj] of Object.entries({ squad: g.squad, enemies: g.enemies, combat: g.combat, effects: g.effects })) {
                const original = obj.update;
                originals.push([obj, original]);
                obj.update = function(...args) {
                    const t = performance.now();
                    const r = original.apply(this, args);
                    times[key] = (times[key] || 0) + performance.now() - t;
                    return r;
                };
            }
            try {
                for (let i = 0; i < 420; i++) {
                    g.time += 1 / 60; g._update(1 / 60);
                    g.world.renderer.render(g.world.scene, g.world.camera);
                }
                return { times, state: g.state, bullets: g.combat.bullets.length, impacts: g.effects.impacts.length, calls: g.world.renderer.info.render.calls };
            } finally { for (const [obj, original] of originals) obj.update = original; }
        });
        const { profile } = await cd.send('Profiler.stop');
        const nodes = new Map(profile.nodes.map(n => [n.id, n.callFrame]));
        const costs = {};
        for (let i = 0; i < (profile.samples || []).length; i++) {
            const n = nodes.get(profile.samples[i]);
            const key = n.functionName + ' ' + n.url.split('/').pop() + ':' + n.lineNumber;
            costs[key] = (costs[key] || 0) + (profile.timeDeltas[i] || 0) / 1000;
        }
        result.profile = Object.entries(costs).sort((a, b) => b[1] - a[1]).slice(0, 30);
        console.log(JSON.stringify(result, null, 2));
        fs.writeFileSync(process.env.PERF_OUT || 'docs/performance/combat-profile-latest.json', JSON.stringify(result, null, 2) + '\n');
        await context.close();
    } finally { await h.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
