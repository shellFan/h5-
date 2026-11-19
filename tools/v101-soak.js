// ===== V10.1 30分钟长跑: 反复开局/关卡切换/弹窗开关/Boss战, 采样内存与页面错误 =====
// 用法: node tools/v101-soak.js [--minutes=30]
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const PORT = 8319;

const getArg = (k, d) => { const m = process.argv.find(a => a.startsWith('--' + k + '=')); return m ? m.split('=')[1] : d; };
const MINUTES = parseFloat(getArg('minutes', '30'));
const OUT = path.join(ROOT, 'docs', 'v101_soak_log.json');

async function main() {
  var cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
    { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message.slice(0, 160)));
  await page.goto('http://localhost:' + PORT + '/index.html?soak=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 40000 });

  const samples = [];
  const t0 = Date.now();
  const endAt = t0 + MINUTES * 60 * 1000;
  let cycles = 0;
  let nextSample = t0 + 15000;

  console.log('soak start: ' + MINUTES + 'min');
  while (Date.now() < endAt) {
    cycles++;
    const cycleLog = await page.evaluate((cycle) => {
      const g = window.__game;
      const out = { cycle: cycle, actions: [] };
      // 1) 清档开局
      g.profile._storage.remove('profile_v51');
      g.profile = new GameProfile(g.profile._storage, g.profile._raw);
      g.squad.profile = g.profile;
      // 2) 随机关卡开局
      const li = cycle % LEVELS.length;
      g.levelIndex = li; g.start();
      out.actions.push('start L' + (li + 1));
      // 3) 快进40秒战斗
      let f = 0;
      while (g.state === 'playing' && f < 1200) { g._update(1/30); f++; }
      out.actions.push('sim ' + (f / 30).toFixed(0) + 's state=' + g.state);
      // 4) 胜利/失败结算后返回
      if (g.state === 'won' || g.state === 'lost') {
        if (g.state === 'won' && li + 1 < LEVELS.length) { g.levelIndex = li + 1; g.start(); }
        else g.start();
        out.actions.push('restart');
      }
      // 5) 弹窗开关×2
      V60UI.showPage('v60-train-page'); V60UI.renderTraining(g); V60UI.hidePages();
      V60UI.showPage('v60-rank-page'); V60UI.renderRank(g); V60UI.hidePages();
      out.actions.push('modals x2');
      // 6) 挑战模式快速进出
      g.startChallengeMode('survival');
      for (let f2 = 0; f2 < 300 && g.state === 'playing'; f2++) g._update(1/30);
      out.actions.push('challenge sim state=' + g.state);
      g.start();
      return out;
    }, cycles);
    // 内存采样
    const mem = await page.evaluate(() => performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null);
    const elapsedMin = +((Date.now() - t0) / 60000).toFixed(1);
    samples.push({ min: elapsedMin, cycle: cycles, heapMB: mem, errors: errors.length });
    if (errors.length && errors.length > (samples.filter(s => s.errors).length ? errors.length - 3 : 0)) {
      console.log('PAGEERR: ' + errors[errors.length - 1]);
    }
    console.log('[t+' + elapsedMin + 'min cycle' + cycles + '] heap=' + mem + 'MB errors=' + errors.length +
      ' | ' + cycleLog.actions.join(' / '));
    // 保存日志(每循环)
    fs.writeFileSync(OUT, JSON.stringify({ minutes: MINUTES, samples: samples, errors: errors }, null, 1));
    // 到下一个采样点前小睡
    const sleep = Math.max(200, nextSample - Date.now());
    nextSample = Math.max(nextSample + 15000, Date.now() + 200);
    await new Promise(r => setTimeout(r, Math.min(sleep, 12000)));
  }

  // 汇总
  const heaps = samples.map(s => s.heapMB).filter(x => x !== null);
  const trend = heaps.length > 4 ? heaps[heaps.length - 1] - heaps[0] : 0;
  console.log('\n==== 长跑汇总 ====');
  console.log('cycles=' + cycles + ' samples=' + samples.length + ' pageErrors=' + errors.length);
  console.log('heap: ' + heaps[0] + 'MB → ' + heaps[heaps.length - 1] + 'MB (trend ' + (trend > 0 ? '+' : '') + trend.toFixed(1) + 'MB)');
  console.log(trend < 30 && errors.length === 0 ? '✓ 内存平稳无泄漏趋势, 无页面错误' : '✗ 需关注: 内存趋势或页面错误');
  await browser.close();
  cp.kill();
  process.exit(errors.length === 0 && trend < 30 ? 0 : 1);
}
main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
