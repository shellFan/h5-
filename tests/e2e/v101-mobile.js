// ===== V10.1 移动端适配 + 性能门槛 E2E =====
// 布局: 3代表分辨率(canvas铺满/触控目标/无横向溢出/面板不越界)
// 性能: 4xCPU节流+DPR2 下 battle300 帧率门槛(模拟中端手机)
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8318;

let passCount = 0, failCount = 0, bugs = [];
const ok = m => { passCount++; console.log('  ✓ ' + m); };
const bad = m => { failCount++; bugs.push(m); console.log('  ✗ ' + m); };
const assert = (c, m) => c ? ok(m) : bad(m);

const RES = [
  { name: '360x640', w: 360, h: 640 },
  { name: '390x844', w: 390, h: 844 },
  { name: '768x1024', w: 768, h: 1024 }
];

async function main() {
  var cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
    { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  var browser = await chromium.launch({ headless: true, channel: 'msedge' });

  // —— 布局矩阵(代表分辨率) ——
  for (const m of RES) {
    const page = await browser.newPage({ viewport: { width: m.w, height: m.h }, hasTouch: true, isMobile: true });
    await page.goto('http://localhost:' + PORT + '/index.html?m101=' + Date.now(), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 40000 });
    await page.waitForTimeout(400);
    const home = await page.evaluate(() => {
      const doc = document.documentElement;
      const canvas = document.getElementById('game-canvas').getBoundingClientRect();
      const small = [];
      document.querySelectorAll('#start-screen button, .v60-nav-btn').forEach(function(b) {
        const r = b.getBoundingClientRect();
        if (r.width > 0 && (r.width < 40 || r.height < 34)) small.push((b.id || b.className).slice(0, 20));
      });
      const cls = document.getElementById('v60-class-row').getBoundingClientRect();
      const panel = document.querySelector('#start-screen .title-panel').getBoundingClientRect();
      const ta = getComputedStyle(document.getElementById('game-canvas')).touchAction;
      return {
        hScroll: doc.scrollWidth > window.innerWidth + 1,
        canvasFill: Math.abs(canvas.width - window.innerWidth) < 2 && Math.abs(canvas.height - window.innerHeight) < 2,
        small: small.slice(0, 4),
        classVisible: cls.bottom <= window.innerHeight + 2,
        panelInBounds: panel.top >= -2 && panel.bottom <= window.innerHeight + 2,
        canvasTouchAction: ta
      };
    });
    assert(!home.hScroll, '[' + m.name + '] 无横向溢出');
    assert(home.canvasFill, '[' + m.name + '] Canvas铺满视口');
    assert(home.small.length === 0, '[' + m.name + '] 触控目标达标' + (home.small.length ? '(' + home.small.join(',') + ')' : ''));
    assert(home.classVisible, '[' + m.name + '] 职业卡完整可见');
    assert(home.panelInBounds, '[' + m.name + '] 首页面板在屏内');
    assert(home.canvasTouchAction === 'none', '[' + m.name + '] 画布禁用浏览器手势');

    // 战斗HUD
    await page.evaluate(() => { window.__game.levelIndex = 0; window.__game.start(); });
    await page.waitForTimeout(900);
    const battle = await page.evaluate(() => {
      const hud = document.getElementById('hud');
      const pause = document.getElementById('btn-pause').getBoundingClientRect();
      const doc = document.documentElement;
      return {
        hud: hud && !hud.classList.contains('hidden'),
        pauseOk: pause.width >= 40 && pause.height >= 40,
        hScroll: doc.scrollWidth > window.innerWidth + 1
      };
    });
    assert(battle.hud, '[' + m.name + '] 战斗HUD显示');
    assert(battle.pauseOk, '[' + m.name + '] 暂停按钮触控达标');
    assert(!battle.hScroll, '[' + m.name + '] 战斗无横向溢出');
    await page.close();
  }

  // —— 性能门槛: 4xCPU节流 + DPR2 (近似中端手机) battle300 ——
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('http://localhost:' + PORT + '/index.html?perf101=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 40000 });
  const perf = await page.evaluate(() => new Promise(resolve => {
    const g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
    g.levelIndex = 4; g.start();
    RandomEvents._t = 9999; g.pacing.waves = [];
    g.squad.setCount(300);
    for (let i = 0; i < 120; i++) {
      const type = ['normal', 'fast', 'shield', 'split', 'spitter'][i % 5];
      g.enemies.spawnEnemy(type, (i % 3 - 1) * 1.5 + (Math.random() - .5), g.squad.z - 6 - Math.random() * 16, 0);
    }
    for (let f = 0; f < 60; f++) { g._update(1/30); g.world.renderer.render(g.world.scene, g.world.camera); }
    let frames = 0, sum = 0, worst = 0;
    const t0 = performance.now();
    (function loop() {
      const ft0 = performance.now();
      g._update(1/30); g.world.renderer.render(g.world.scene, g.world.camera);
      const ft = performance.now() - ft0;
      frames++; sum += ft; if (ft > worst) worst = ft;
      if (frames < 120) requestAnimationFrame(loop);
      else resolve({ fps: +(1000 / ((performance.now() - t0) / frames)).toFixed(1), avg: +(sum / frames).toFixed(2), worst: +worst.toFixed(1) });
    })();
  }));
  console.log('  [perf] battle300@4xThrottle/DPR2: fps=' + perf.fps + ' avg=' + perf.avg + 'ms worst=' + perf.worst + 'ms');
  assert(perf.fps >= 45, '节流战斗300帧率≥45(实测' + perf.fps + ')');
  assert(perf.avg <= 10, '平均帧时≤10ms(实测' + perf.avg + 'ms)');
  await page.close();

  console.log('\n========================');
  console.log('V10.1 移动端+性能E2E: 通过 ' + passCount + ' / 失败 ' + failCount);
  if (bugs.length) { console.log('\nBUG:'); for (const b of bugs) console.log('  [BUG] ' + b); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}
main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
