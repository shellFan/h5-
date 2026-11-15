const { spawn } = require('child_process');
const path = require('path');
const ROOT = process.cwd();
const { chromium } = require('playwright-core');
(async () => {
  const cp = spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], { env: { ...process.env, PORT: '8202' }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8202/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });
  const out = await page.evaluate(() => {
    const g = window.__game;
    g.profile.data.upgrades.gun = 1;
    UpgradeShop.purchase(g.profile, 'recruit');
    g.profile.addCoins(0);
    g.levelIndex = 2; g.start();
    let maxAlive = 0, steps = 0, minDist = 99;
    const samples = [];
    const trace = [];
    while (g.state === 'playing' && steps < 60000) {
      // 贪心选门
      const gates = g.gates.gates;
      let rowZ = null;
      for (const gt of gates) if (!gt.triggered && !gt.passed && gt.z < g.squad.z - 1 && gt.z > g.squad.z - 16) { if (rowZ===null||gt.z>rowZ) rowZ = gt.z; }
      if (rowZ !== null) { let best=null,bs=-1; for (const gt of gates){ if(gt.z!==rowZ||gt.triggered||gt.passed)continue; const d=gt.data; let s=0; if(d.op==='mul')s=g.squad.count*(d.value-1); else if(d.op==='add')s=d.value; else if(d.op==='addpct')s=9; else s=5; if(s>bs){bs=s;best=gt;} } if(best){g.squad.targetX=best.x;g.squad.lane=best.data.lane;} }
      g._update(1/30); steps++;
      maxAlive = Math.max(maxAlive, g.enemies.aliveCount);
      if (steps % 150 === 0) {
        const e0 = g.enemies.enemies.find(e => e.alive);
        const w = g.pacing.activeWave;
        trace.push('t=' + g.elapsedTime.toFixed(0) + ' sqz=' + g.squad.z.toFixed(1) + ' alive=' + g.enemies.aliveCount + ' out=' + g.enemies.encounterOutstanding + ' wave=' + (w ? w.type + '/' + w.state : 'none') + ' pend=' + (w && w.pending ? w.pending.length : 0) + ' q=' + (w && w.queue ? w.queue.length : 0) + ' rest=' + (g.pacing.restTimer||0).toFixed(1) + ' cnt=' + g.squad.count + ' waves=[' + g.pacing.waves.map(x=>x.state[0]).join('') + ']');
      }
      if (g.enemies.aliveCount > 0 && g.enemies.aliveCount % 5 === 0) samples.push('hp1=' + (g.enemies.enemies.find(e=>e.alive)||{hp:0}).hp);
      if (steps % 15 === 0) samples.push(g.enemies.aliveCount);
      for (const e of g.enemies.enemies) if (e.alive) minDist = Math.min(minDist, Math.abs(e.z - g.squad.z));
    }
    return { state: g.state, t: g.elapsedTime.toFixed(0), maxAlive, trace: trace.slice(0, 24) };
  });
  console.log(JSON.stringify(out));
  await browser.close(); cp.kill();
})();
