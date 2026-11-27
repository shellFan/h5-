// Repeatable cold-start and uncapped CPU/render-submit measurements. No FPS cap masking.
const fs = require('fs');
const path = require('path');
const { createHarness, seededContext } = require('./v42-browser');
const out = process.env.PERF_OUT || 'docs/performance/runtime-after.json';
const rate = Number(process.env.PERF_CPU || 4);
const runs = Number(process.env.PERF_RUNS || 3);
(async () => {
    const h = createHarness({ port: 8472 });
    const report = { cpuThrottle: rate, viewport: '390x844, DPR1', metric: 'CPU + render submission; excludes asynchronous GPU completion', runs: [] };
    await h.start();
    try {
        for (let run = 0; run < runs; run++) {
            const context = await seededContext(h.browser, { width: 390, height: 844 }, 1);
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', e => errors.push(e.message));
            const cdp = await context.newCDPSession(page);
            await cdp.send('Emulation.setCPUThrottlingRate', { rate });
            await cdp.send('Network.enable');
            await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
            await page.addInitScript(() => {
                window.__longTasks = [];
                new PerformanceObserver(list => list.getEntries().forEach(e => window.__longTasks.push({ start: e.startTime, ms: e.duration }))).observe({ type: 'longtask', buffered: true });
            });
            await cdp.send('Profiler.enable');
            await cdp.send('Profiler.start');
            await page.goto(h.baseUrl + '/index.html', { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(() => window.__game && window.__game.squad.renderer, null, { timeout: 60000 });
            const boot = await page.evaluate(() => {
                window.__game._rafDisabled = true;
                return { readyMs: performance.now(), soldierMs: SoldierModelLoader.loadMs, enemiesMs: EnemyModelLoader.loadMs,
                    enemyStyles: Object.keys(EnemyModelLoader.get().styles).length,
                    requests: performance.getEntriesByType('resource').filter(e => /\.glb/.test(e.name)).map(e => ({ url: e.name.split('/assets/')[1], ms: e.duration, bytes: e.encodedBodySize })) };
            });
            const { profile } = await cdp.send('Profiler.stop');
            const costs = new Map();
            const nodes = new Map(profile.nodes.map(n => [n.id, n.callFrame.functionName || '(anonymous)']));
            for (let i = 0; i < (profile.samples || []).length; i++) {
                const name = nodes.get(profile.samples[i]);
                costs.set(name, (costs.get(name) || 0) + (profile.timeDeltas[i] || 0) / 1000);
            }
            boot.profileSelfMs = [...costs].sort((a, b) => b[1] - a[1]).slice(0, 22);
            await page.waitForFunction(() => window.__game.world.scene.getObjectByName('military-v15-glb-pines') || window.__game.world.scene.getObjectByName('v15-glb-bunker-gate'), null, { timeout: 30000 });
            const sceneReadyMs = await page.evaluate(() => performance.now());
            await page.evaluate(async () => { await EnemyModelLoader.load(); });
            const battle = await page.evaluate(() => {
                const g = window.__game;
                const results = [];
                for (const count of [31, 100, 300, 500]) {
                    g.levelIndex = 0; g.start(); g.pacing.clear(); g.gates.clear(); g.enemies.clear();
                    RandomEvents._t = 99999; g.squad.setCount(count); g.squad.invulnT = 99999;
                    g.combat.fireTimer = 99999; g.world._shakeT = 0;
                    for (const soldier of g.squad.soldiers) soldier.spawnT = 1;
                    for (let i = 0; i < 40; i++) g.enemies.spawnEnemy(['normal', 'fast', 'shield', 'spitter'][i % 4], (i % 5 - 2) * 1.2, -10 - Math.floor(i / 5) * 2, 999999);
                    const frames = [], update = [], render = [], soldiers = [];
                    const original = g.squad.renderer.update;
                    let soldierMs = 0;
                    g.squad.renderer.update = function(...args) { const t = performance.now(); const r = original.apply(this, args); soldierMs += performance.now() - t; return r; };
                    for (let i = 0; i < 180; i++) {
                        const t = performance.now(); soldierMs = 0;
                        g.time += 1 / 60; g._update(1 / 60);
                        const afterUpdate = performance.now();
                        g.world.renderer.render(g.world.scene, g.world.camera);
                        const end = performance.now();
                        if (i >= 60) { frames.push(end - t); update.push(afterUpdate - t); render.push(end - afterUpdate); soldiers.push(soldierMs); }
                    }
                    g.squad.renderer.update = original;
                    const stats = xs => { const sorted = xs.slice().sort((a,b)=>a-b); return { mean: xs.reduce((a,b)=>a+b,0)/xs.length, p95: sorted[Math.floor(sorted.length*.95)] }; };
                    results.push({ count, frameMs: stats(frames), updateMs: stats(update), renderSubmitMs: stats(render), soldiersMs: stats(soldiers), drawCalls: g.world.renderer.info.render.calls, triangles: g.world.renderer.info.render.triangles });
                }
                return results;
            });
            const longTasks = await page.evaluate(() => window.__longTasks);
            report.runs.push({ boot, sceneReadyMs, battle, longTasks, errors });
            console.log(JSON.stringify({ run, readyMs: boot.readyMs, sceneReadyMs, battle }));
            await context.close();
        }
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
    } finally { await h.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
