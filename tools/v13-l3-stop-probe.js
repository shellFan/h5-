// L3 停线来源诊断
const { spawn } = require('child_process');
const { chromium } = require('playwright-core');
const server = spawn('node', ['tools/server.js'], { cwd: 'G:/h5', env: Object.assign({}, process.env, { PORT: '8135' }) });
(async () => {
    await new Promise(r => setTimeout(r, 1200));
    const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('http://127.0.0.1:8135/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('window.__game', { timeout: 40000 });
    const out = await page.evaluate(() => {
        var g = window.__game;
        g.levelIndex = 2; g.start();
        RandomEvents._t = 9999;
        var log = [];
        for (var f = 0; f < 2400 && g.state === 'playing'; f++) {
            g._update(1/30);
            if (f % 200 === 0) {
                var gs = g.gates;
                log.push('t' + Math.round(f/30) + 's sq=' + g.squad.count + ' z=' + Math.round(g.squad.z) +
                    ' alive=' + g.enemies.enemies.filter(e => e.alive).length +
                    ' gateStop=' + JSON.stringify(gs.approachStopZ(g.pacing, g.enemies.encounterOutstanding, g.squad.z)) +
                    ' frontier=' + JSON.stringify(g.pacing.frontierStopZ()) +
                    ' chosen=' + gs.chosenRows.size);
            }
        }
        log.push('END state=' + g.state + ' sq=' + g.squad.count);
        return log.join('\n');
    });
    console.log(out);
    await browser.close(); server.kill(); process.exit(0);
})();
