const { spawn } = require('child_process');
const path = require('path');
const ROOT = process.cwd();
const { chromium } = require('playwright-core');
(async () => {
  const cp = spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], { env: { ...process.env, PORT: '8199' }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8199/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });
  const out = await page.evaluate(() => {
    const g = window.__game;
    g.profile.addCoins(600);
    UpgradeShop.purchase(g.profile, 'gun'); // dmg+1
    UpgradeShop.purchase(g.profile, 'recruit'); // +1人
    g.levelIndex = 4; g.start();
    const log = [];
    let lastWave = -1, steps = 0;
    const dt = 1/30;
    function greedy() {
      const gates = g.gates.gates;
      let rowZ = null;
      for (const gt of gates) if (!gt.triggered && !gt.passed && gt.z < g.squad.z - 1 && gt.z > g.squad.z - 16) { if (rowZ===null||gt.z>rowZ) rowZ = gt.z; }
      if (rowZ !== null) {
        let best=null,bestScore=-1;
        for (const gt of gates) {
          if (gt.z!==rowZ||gt.triggered||gt.passed) continue;
          const d=gt.data; let s=0;
          if (d.op==='mul') s=g.squad.count*(d.value-1);
          else if (d.op==='add') s=d.value;
          else if (d.op==='addpct') s=Math.max(1,Math.floor(g.squad.count*d.value/100));
          else if (d.op==='nuke') s=15;
          else s=(d.value==='damage2'||d.value==='arsenal')?12:4;
          if (s>bestScore){bestScore=s;best=gt;}
        }
        if (best) { g.squad.targetX = best.x; g.squad.lane = best.data.lane; }
      }
    }
    while (g.state === 'playing' && steps < 20000) {
      greedy();
      g._update(dt); steps++;
      const wi = g.pacing.activeWave ? g.pacing.waves.indexOf(g.pacing.activeWave) : -1;
      if (wi !== lastWave && wi >= 0) { lastWave = wi; log.push('wave' + wi + ' t=' + g.elapsedTime.toFixed(0) + ' count=' + g.squad.count + ' dmg=' + g.squad.getDamage()); }
      if (g.enemies.boss && lastWave !== 'boss') { lastWave = 'boss'; log.push('BOSS t=' + g.elapsedTime.toFixed(0) + ' count=' + g.squad.count + ' bossHp=' + g.enemies.boss.hp); }
    }
    log.push('END state=' + g.state + ' t=' + g.elapsedTime.toFixed(0) + ' count=' + g.squad.count + ' kills=' + g.enemies.killCount + ' reason=' + (g.lastLoseReason||''));
    return log;
  });
  console.log(out.join('\n'));
  await browser.close(); cp.kill();
})();
