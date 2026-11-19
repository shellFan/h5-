// ===== V10.1 性能剖析: 多负载场景 FPS/帧时间/DrawCall/内存 =====
// 用法: node tools/v101-perf-probe.js [--out=docs/v101_perf_baseline.json] [--tag=before]
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const PORT = 8312;

const getArg = (k, d) => { const m = process.argv.find(a => a.startsWith('--' + k + '=')); return m ? m.split('=')[1] : d; };
const TAG = getArg('tag', 'run');
const OUT = getArg('out', null);
const THROTTLE = parseFloat(getArg('throttle', '1')); // CDP CPU降速倍率(4≈中端手机)
const DPR = parseFloat(getArg('dpr', '1'));           // 设备像素比模拟

async function sample(browser, scene) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR });
  const cdp = await page.context().newCDPSession(page);
  if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  await page.goto('http://localhost:' + PORT + '/index.html?p=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 40000 });
  await page.evaluate(() => {
    const g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
  });
  const r = await page.evaluate(async (cfg) => {
    const sceneName = cfg.scene;
    const g = window.__game;
    function settle() { return new Promise(res => requestAnimationFrame(res)); }
    // 场景装配
    if (sceneName === 'home') {
      // 首页静止
    } else if (sceneName === 'battle100' || sceneName === 'battle300' || sceneName === 'battle500') {
      g.levelIndex = 4; g.start();
      RandomEvents._t = 9999;
      g.pacing.waves = [];
      const n = { battle100: 100, battle300: 300, battle500: 500 }[sceneName];
      g.squad.setCount(n);
      // 大量怪物压力: alive target级别
      for (let i = 0; i < 120; i++) {
        const type = ['normal', 'fast', 'shield', 'split', 'spitter'][i % 5];
        g.enemies.spawnEnemy(type, (i % 3 - 1) * 1.5 + (Math.random() - .5), g.squad.z - 6 - Math.random() * 16, 0);
      }
    } else if (sceneName === 'boss') {
      g.levelIndex = 9; g.start();
      RandomEvents._t = 9999;
      g.pacing.waves = [];
      g.squad.setCount(200);
      g.pacing.spawnFn('boss', 0, g.squad.z - 10, 0);
      for (let i = 0; i < 40; i++) g.enemies.spawnEnemy('normal', (i % 3 - 1) * 1.5, g.squad.z - 8 - Math.random() * 10, 0);
    } else if (sceneName === 'effects') {
      g.levelIndex = 4; g.start();
      RandomEvents._t = 9999;
      g.pacing.waves = [];
      g.squad.setCount(200);
      for (let i = 0; i < 80; i++) g.enemies.spawnEnemy('normal', (i % 3 - 1) * 1.5, g.squad.z - 5 - Math.random() * 12, 0);
      // 特效风暴: 连续爆炸/飘字/冲击波
    }
    // 预热渲染管线
    for (let f = 0; f < 30; f++) { g._update(1 / 30); g.world.renderer.render(g.world.scene, g.world.camera); }
    // 特效风暴注入(战斗期间持续)
    const fx = sceneName === 'effects';
    // 采样: 120帧(约2s), 逐帧 _update + render
    let frames = 0, worst = 0, sum = 0, sumSq = 0;
    const t0 = performance.now();
    const mem0 = performance.memory ? performance.memory.usedJSHeapSize : 0;
    let lastInfo = null;
    for (let f = 0; f < 120; f++) {
      const ft0 = performance.now();
      g._update(1 / 30);
      if (fx && f % 3 === 0) {
        g.effects.burst(g.squad.x + (Math.random() - .5) * 3, 0.6, g.squad.z - Math.random() * 6, 0xFFC247, 8, 2.5, 0.4);
        g.effects.shockwave(g.squad.x, 0.05, g.squad.z - 2, 0xFFC247);
        g.effects.floatText(g.squad.x, 2, g.squad.z - 3, String(f), '#FFD700', f % 6 === 0);
      }
      g.world.renderer.render(g.world.scene, g.world.camera);
      const ft = performance.now() - ft0;
      frames++; sum += ft; sumSq += ft * ft; if (ft > worst) worst = ft;
      await settle();
    }
    const wall = performance.now() - t0;
    const mem1 = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const info = g.world.renderer.info.render;
    return {
      scene: sceneName, throttle: cfg.throttle, dpr: cfg.dpr, frames: frames,
      fps: +(1000 / (wall / frames)).toFixed(1),
      avgFrameMs: +(sum / frames).toFixed(2),
      p95FrameMs: +Math.sqrt(sumSq / frames + 0).toFixed(2),
      worstFrameMs: +worst.toFixed(2),
      drawCalls: info.calls,
      trisK: Math.round(info.triangles / 1000),
      geoms: g.world.renderer.info.memory.geometries,
      textures: g.world.renderer.info.memory.textures,
      squad: g.squad.count, enemies: g.enemies.aliveCount,
      heapMB: mem1 ? +(mem1 / 1048576).toFixed(1) : null,
      heapDeltaMB: mem0 ? +((mem1 - mem0) / 1048576).toFixed(1) : null
    };
  }, { scene: scene, throttle: THROTTLE, dpr: DPR });
  await page.close();
  return r;
}

async function main() {
  var cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
    { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const scenes = ['home', 'battle100', 'battle300', 'battle500', 'boss', 'effects'];
  const results = [];
  const tag2 = TAG + (THROTTLE > 1 ? '@cpu' + THROTTLE + 'x' : '') + (DPR > 1 ? '@dpr' + DPR : '');
  for (const s of scenes) {
    const r = await sample(browser, s);
    results.push(r);
    console.log('[' + tag2 + '][' + s + '] fps=' + r.fps + ' avg=' + r.avgFrameMs + 'ms worst=' + r.worstFrameMs +
      'ms dc=' + r.drawCalls + ' tris=' + r.trisK + 'k heap=' + r.heapMB + 'MB(Δ' + r.heapDeltaMB + ')' +
      ' squad=' + r.squad + ' enemies=' + r.enemies);
  }
  if (OUT) {
    fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), { recursive: true });
    fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify({ tag: TAG, date: new Date().toISOString(), results }, null, 1));
    console.log('saved → ' + OUT);
  }
  await browser.close();
  cp.kill();
}
main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
