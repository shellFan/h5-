// Alternating HUD baseline/current comparison; includes browser layout through the next frame.
const fs = require('fs');
const { execFileSync } = require('child_process');
const { createHarness, seededContext } = require('./v42-browser');
const source = execFileSync('git', ['-c','core.commitGraph=false','show','ce5b366:js/game.js'], {encoding:'utf8'});
const method = source.slice(source.indexOf('    _updateUI() {'), source.indexOf('\n    _win() {')).trim().replace('_updateUI()', 'function()');
(async () => {
    const h = createHarness({ port: 8478 }); await h.start();
    const report = { cpuThrottle: 4, viewport: '390x844 DPR1', baseline: 'ce5b366', note: 'HUD only, 90 animation frames per sample; full browser LayoutDuration includes deferred layout, excludes 3D rendering', samples: [] };
    try {
        const context = await seededContext(h.browser, {width:390,height:844});
        const page = await context.newPage(); await page.goto(h.baseUrl);
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
        await page.evaluate(async baseline => {
            const g = window.__game; g._rafDisabled = true;
            await EnemyModelLoader.load(); await g.world._militaryArt.ready;
            g.start(); g._updateUI(); g._baselineHud = (0, eval)('(' + baseline + ')');
        }, method);
        const cd = await context.newCDPSession(page);
        await cd.send('Emulation.setCPUThrottlingRate', {rate:4}); await cd.send('Performance.enable');
        for (const round of [0,1,2]) for (const variant of round%2 ? ['current','baseline'] : ['baseline','current']) {
            await page.evaluate(() => { const g=window.__game;g.squad.z=0;g._updateUI(); });
            const before = Object.fromEntries((await cd.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
            const timing = await page.evaluate(async variant => {
                const g=window.__game, fn=variant==='baseline'?g._baselineHud:g._updateUI;
                const samples=[];
                for(let i=0;i<90;i++) {
                    await new Promise(resolve=>requestAnimationFrame(resolve));
                    g.squad.z-=.11;
                    const start=performance.now();fn.call(g);samples.push(performance.now()-start);
                }
                await new Promise(resolve=>requestAnimationFrame(resolve));
                const sorted=samples.slice().sort((a,b)=>a-b);
                return {meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95Ms:sorted[Math.floor(sorted.length*.95)]};
            },variant);
            const after=Object.fromEntries((await cd.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
            const sample={round,variant,...timing,layouts:after.LayoutCount-before.LayoutCount,layoutMs:(after.LayoutDuration-before.LayoutDuration)*1000};
            report.samples.push(sample);console.log(JSON.stringify(sample));
        }
        fs.writeFileSync('docs/performance/hud-layout-ab.json',JSON.stringify(report,null,2)+'\n');
        await context.close();
    } finally { await h.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
