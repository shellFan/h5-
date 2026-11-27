// Isolate soldier CPU work from draw submission/driver variance. Alternate A/B order.
const fs = require('fs');
const { execFileSync } = require('child_process');
const { createHarness, seededContext } = require('./v42-browser');
(async () => {
    const h = createHarness({ port: 8476 }); await h.start();
    try {
        const context = await seededContext(h.browser, { width: 390, height: 844 });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await page.goto(h.baseUrl);
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
        await page.evaluate(() => { window.__game._rafDisabled = true; });
        const baseline = execFileSync('git', ['-c', 'core.commitGraph=false', 'show', 'e9a0731:js/soldier-renderer.js'], { encoding: 'utf8' });
        const results = await page.evaluate(source => {
            const Current = SoldierRenderer;
            const Original = new Function(source + ';return SoldierRenderer;')();
            window.SoldierRenderer = Current;
            const renderers = { before: new Original(new THREE.Scene()), after: new Current(new THREE.Scene()) };
            const clocks = { before: 0, after: 0 }, results = [];
            const squad = window.__game.squad;
            for (let round = 0; round < 3; round++) {
                for (const count of [100, 300, 500]) {
                    squad.setCount(count); squad.soldiers.forEach(s => { s.spawnT = 1; });
                    for (const variant of round % 2 ? ['after', 'before'] : ['before', 'after']) {
                        const times = [], renderer = renderers[variant];
                        for (let i = 0; i < 192; i++) {
                            clocks[variant] += 1 / 60;
                            const t = performance.now();
                            renderer.update(1 / 60, clocks[variant], squad, true, .1, 0);
                            if (i >= 64) times.push(performance.now() - t);
                        }
                        times.sort((a,b)=>a-b);
                        results.push({ round, count, variant, meanMs: times.reduce((a,b)=>a+b,0)/times.length, p95Ms: times[Math.floor(times.length*.95)] });
                    }
                }
            }
            return results;
        }, baseline);
        const report = { baseline: 'e9a0731', cpuThrottle: 4, samples: '64 warmup +128 update-only calls per condition; no GPU render', results };
        fs.mkdirSync('docs/performance', { recursive: true });
        fs.writeFileSync('docs/performance/soldier-update-ab.json', JSON.stringify(report, null, 2) + '\n');
        console.log(JSON.stringify(results));
        await context.close();
    } finally { await h.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
