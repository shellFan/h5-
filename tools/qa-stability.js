// Isolated sustained-fire probe and 15-minute lifecycle soak. Never uses the user's browser profile.
const fs = require('fs');
const { createHarness, seededContext } = require('./v42-browser');
const out = process.env.QA_OUT || 'docs/qa/2026-11-29/stability.json';
const minutes = Number(process.env.QA_MINUTES || 15);
(async () => {
    const h = createHarness({ port: 8482 });
    const report = { minutes, cpuThrottle: 4, frameMetric: 'CPU update + render submission, not GPU completion or device FPS', performance: [], samples: [], errors: [] };
    await h.start();
    try {
        const context = await seededContext(h.browser, { width: 390, height: 844 }, 1);
        const page = await context.newPage();
        page.on('pageerror', e => report.errors.push(e.message));
        await page.goto(h.baseUrl);
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
        await page.evaluate(async () => { window.__game._rafDisabled = true; await EnemyModelLoader.load(); await window.__game.world._militaryArt.ready; });
        const cd = await context.newCDPSession(page);
        await cd.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        for (let round = 0; round < 3; round++) for (const count of [100, 300, 500]) {
            const result = await page.evaluate(count => {
                const g = window.__game; g.levelIndex = 0; g.start();
                g.pacing.clear(); g.gates.clear(); g.enemies.clear(); RandomEvents._t = 999999;
                g.squad.setCount(count); g.squad.invulnT = 999999;
                for (let i = 0; i < 40; i++) g.enemies.spawnEnemy('normal', (i % 5 - 2) * 1.2, -8 - Math.floor(i / 5) * 2, 99999999);
                const samples = [];
                for (let i = 0; i < 240; i++) {
                    const t = performance.now(); g.time += 1 / 60; g._update(1 / 60);
                    g.world.renderer.render(g.world.scene, g.world.camera);
                    if (i >= 60) samples.push(performance.now() - t);
                }
                const sorted = samples.slice().sort((a,b) => a-b);
                const error = document.getElementById('error-display');
                return { count, meanMs: samples.reduce((a,b) => a+b,0)/samples.length, p95Ms: sorted[Math.floor(sorted.length * .95)], state: g.state, runtimeError: error && error.textContent, bullets: g.combat.bullets.length, calls: g.world.renderer.info.render.calls };
            }, count);
            report.performance.push({ round, ...result });
            console.log('PERF ' + JSON.stringify({ round, ...result }));
        }
        await cd.send('Emulation.setCPUThrottlingRate', { rate: 1 });
        const start = Date.now();
        let cycle = 0;
        while (Date.now() - start < minutes * 60000) {
            const sample = await page.evaluate(cycle => {
                const g = window.__game; g.levelIndex = cycle % LEVELS.length; g.start();
                for (let f = 0; f < 1200 && g.state === 'playing'; f++) { g.time += 1 / 30; g._update(1 / 30); }
                const result = g.state;
                for (const [name, render] of [['train','renderTraining'],['rank','renderRank'],['armory','renderArmory']]) {
                    V60UI.showPage('v60-' + name + '-page'); V60UI[render](g); V60UI.hidePages();
                }
                g.startChallengeMode('survival');
                for (let f = 0; f < 300 && g.state === 'playing'; f++) { g.time += 1 / 30; g._update(1 / 30); }
                g.start(); g.world.renderer.render(g.world.scene, g.world.camera);
                const error = document.getElementById('error-display');
                return { level: g.levelIndex + 1, result, heapMB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null, geometries: g.world.renderer.info.memory.geometries, textures: g.world.renderer.info.memory.textures, runtimeError: error && error.textContent };
            }, cycle++);
            report.samples.push({ elapsedSec: (Date.now() - start)/1000, cycle, ...sample });
            fs.writeFileSync(out, JSON.stringify(report,null,2)+'\n');
            console.log('SOAK ' + JSON.stringify(report.samples[report.samples.length-1]));
            if (sample.runtimeError || report.errors.length) throw new Error('Runtime error during soak');
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
        report.completed = true;
        report.elapsedSec = (Date.now() - start)/1000;
        fs.writeFileSync(out, JSON.stringify(report,null,2)+'\n');
        console.log('COMPLETE ' + report.elapsedSec.toFixed(1) + 's, cycles=' + cycle + ', pageErrors=' + report.errors.length);
        await context.close();
    } finally { await h.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
