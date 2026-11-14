const { spawn } = require('child_process');
const path = require('path');
const ROOT = process.cwd();
const { chromium } = require('playwright-core');
(async () => {
  const cp = spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], { env: { ...process.env, PORT: '8198' }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8198/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });
  const r = await page.evaluate(() => {
    const g = window.__game;
    g.profile.data.upgrades.gun = 3;
    g.profile.data.upgrades.rapid = 2;
    g.profile.data.upgrades.pierce = 2;
    g.levelIndex = 0; g.start();
    return { dmg: g.squad.getDamage(), rate: +g.squad.getFireRate().toFixed(2), pierce: g.squad.pierce,
             squadProfileNull: g.squad.profile === null, gameProfile: !!g.profile };
  });
  console.log(JSON.stringify(r));
  await browser.close(); cp.kill();
})();
