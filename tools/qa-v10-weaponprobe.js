// V10.1 武器特殊属性战斗探针(pellets/burn/dualLane)
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..');
(async () => {
  const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
    { env: { ...process.env, PORT: '8321' }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  await page.goto('http://localhost:8321/index.html?wpnprobe=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });
  await page.evaluate(() => { window.__game.profile._storage.remove('profile_v51'); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 60000 });

  async function probe(weaponId, weaponLevel, evolved) {
    return page.evaluate(({ weaponId, weaponLevel, evolved }) => new Promise(res => {
      const g = window.__game;
      g.profile.data.weapon = weaponId; g.profile.data.weaponLevel = weaponLevel; g.profile.data.weaponEvolved = evolved || null;
      g.profile.save();
      g.levelIndex = 0; g.start();
      g.paused = false; g.state = 'playing';
      g.enemies.clear(); g.pacing.clear();
      g.squad.setCount(40); g.squad.x = 0; g.squad.targetX = 0; g.squad.z = -2;
      g.squad.critChance = 0; g.squad.damageBuff = 1;
      g.enemies.spawnEnemy('normal', -1, g.squad.z - 9, 500000, null);
      g.enemies.spawnEnemy('normal', 0, g.squad.z - 9.5, 500000, null);
      g.enemies.spawnEnemy('normal', 1, g.squad.z - 10, 500000, null);
      const hp0 = g.enemies.enemies.reduce((n, e) => n + e.hp, 0);
      let burnTicks = 0, maxBullets = 0;
      const t0 = Date.now();
      const iv = setInterval(() => {
        maxBullets = Math.max(maxBullets, g.combat.bullets.length);
        for (const e of g.enemies.enemies) if (e._burnT > 0) burnTicks++;
        if (Date.now() - t0 >= 5000) {
          clearInterval(iv);
          const dealt = hp0 - g.enemies.enemies.reduce((n, e) => n + Math.max(0, e.hp), 0);
          res({ dealt: Math.round(dealt), maxBullets, burnSeen: burnTicks > 0, getDmg: +g.squad.getDamage().toFixed(2), pellets: g.squad._wpnPellets || 1, burn: !!g.squad._wpnBurn, dual: !!g.squad._wpnDualLane });
        }
      }, 100);
    }), { weaponId, weaponLevel, evolved });
  }
  const base = await probe('rifle', 0, null);
  console.log('步枪基线: dealt=' + base.dealt + ' dmg=' + base.getDmg);
  const sg = await probe('shotgun', 0, null);
  console.log('散弹枪(3弹丸×0.5): dealt=' + sg.dealt + ' pellets标志=' + sg.pellets + (sg.pellets === 3 && sg.dealt > base.dealt ? ' ✓扇形铺散生效' : ' ✗'));
  const mg = await probe('mg', 4, 'storm_mg');
  console.log('风暴机枪(双弹道): dealt=' + mg.dealt + ' 峰值弹丸=' + mg.maxBullets + ' dual=' + mg.dual + (mg.dual && mg.maxBullets > base.maxBullets && mg.dealt > base.dealt ? ' ✓双弹道生效' : ' ✗'));
  const rk = await probe('rocket', 4, 'hell_rocket');
  console.log('地狱火箭(燃烧DoT): dealt=' + rk.dealt + ' 燃烧目标=' + rk.burnSeen + ' burn=' + rk.burn + (rk.burn && rk.burnSeen && rk.dealt > base.dealt ? ' ✓燃烧生效' : ' ✗'));
  console.log('页面JS错误: ' + errs.length + (errs.length ? ' ' + errs[0] : ''));
  await browser.close(); cp.kill(); process.exit(errs.length ? 1 : 0);
})();
