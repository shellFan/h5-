// ===== V10.1 分辨率矩阵审计: 10视口 × 首页/战斗/弹窗, 布局越界与触控目标量化 =====
// 用法: node tools/v101-matrix-audit.js [--shots=1]
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const PORT = 8310;

const MATRIX = [
  { name: '360x640', w: 360, h: 640 },
  { name: '360x800', w: 360, h: 800 },
  { name: '375x812', w: 375, h: 812 },
  { name: '390x844', w: 390, h: 844 },
  { name: '393x852', w: 393, h: 852 },
  { name: '402x874', w: 402, h: 874 },
  { name: '414x896', w: 414, h: 896 },
  { name: '430x932', w: 430, h: 932 },
  { name: '440x960', w: 440, h: 960 },
  { name: '768x1024', w: 768, h: 1024 }
];

const getArg = (k, d) => { const m = process.argv.find(a => a.startsWith('--' + k + '=')); return m ? m.split('=')[1] : d; };
const SHOTS = getArg('shots', '1') === '1';
const SHOT_DIR = path.join(ROOT, 'docs', 'screenshots', 'v101-matrix');

async function auditView(browser, m) {
  const page = await browser.newPage({ viewport: { width: m.w, height: m.h }, hasTouch: true, isMobile: true });
  const report = { name: m.name, issues: [] };
  const bad = (msg) => report.issues.push(msg);

  await page.goto('http://localhost:' + PORT + '/index.html?m=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 40000 });
  await page.waitForTimeout(500);

  // —— 首页审计 ——
  const home = await page.evaluate(() => {
    const out = {};
    const doc = document.documentElement;
    out.hScroll = doc.scrollWidth > window.innerWidth + 1;
    out.vOverflowBody = doc.scrollHeight > window.innerHeight + 2 && document.body.style.overflow !== 'hidden';
    const canvas = document.getElementById('game-canvas');
    const cr = canvas.getBoundingClientRect();
    out.canvasRect = { w: Math.round(cr.width), h: Math.round(cr.height), cssMatchesViewport: Math.abs(cr.width - window.innerWidth) < 2 && Math.abs(cr.height - window.innerHeight) < 2 };
    const panel = document.querySelector('#start-screen .title-panel');
    if (panel) {
      const pr = panel.getBoundingClientRect();
      out.panel = { top: Math.round(pr.top), bottom: Math.round(pr.bottom), vh: window.innerHeight,
        overflowsBottom: pr.bottom > window.innerHeight + 2, overflowsTop: pr.top < -2,
        scrollNeeded: panel.scrollHeight > panel.clientHeight + 4 };
    }
    // 触控目标
    const small = [];
    document.querySelectorAll('#start-screen button, .v60-nav-btn, .v60-class-card').forEach(function(b) {
      const r = b.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 34)) {
        small.push((b.id || b.className).toString().slice(0, 24) + ':' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
    });
    out.smallTargets = small.slice(0, 6);
    // 职业卡/导航是否完整可见
    const nav = document.getElementById('v60-home-nav');
    if (nav) { const nr = nav.getBoundingClientRect(); out.navVisible = nr.bottom <= window.innerHeight && nr.top >= 0; }
    const cls = document.getElementById('v60-class-row');
    if (cls) { const kr = cls.getBoundingClientRect(); out.classVisible = kr.bottom <= window.innerHeight + 2; }
    return out;
  });
  if (home.hScroll) bad('首页横向溢出');
  if (!home.canvasRect.cssMatchesViewport) bad('Canvas未铺满视口(' + JSON.stringify(home.canvasRect) + ')');
  if (home.panel && home.panel.overflowsBottom) bad('首页面板超出底部(bottom=' + home.panel.bottom + ' vh=' + home.panel.vh + ')');
  if (home.panel && home.panel.overflowsTop) bad('首页面板超出顶部');
  if (home.panel && home.panel.scrollNeeded && m.h <= 700) bad('小屏首页面板内容被裁切(需滚动)');
  if (home.smallTargets.length) bad('触控目标过小: ' + home.smallTargets.join(' | '));
  if (home.navVisible === false) bad('导航按钮越界');
  if (home.classVisible === false) bad('职业选择卡越界');
  if (SHOTS) await page.screenshot({ path: path.join(SHOT_DIR, m.name + '_home.png') });

  // —— 打开训练页(弹窗代表) ——
  await page.click('#v60-btn-train');
  await page.waitForTimeout(700);
  const modal = await page.evaluate(() => {
    const p = document.querySelector('#v60-train-page .v60-panel');
    if (!p) return { missing: true };
    const r = p.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight,
      overflows: r.bottom > window.innerHeight + 2 || r.top < -2,
      scrollNeeded: p.scrollHeight > p.clientHeight + 4, width: Math.round(r.width) };
  });
  if (modal.missing) bad('训练页未打开');
  else {
    // V10.1: 弹窗本体不得越界; 内容内部滚动是移动端标准模式(不判失败)
    if (modal.overflows) bad('训练弹窗超出屏幕(' + JSON.stringify(modal) + ')');
  }
  await page.click('#v60-train-back');
  await page.waitForTimeout(300);

  // —— 战斗审计 ——
  await page.evaluate(() => { window.__game.levelIndex = 0; window.__game.start(); });
  await page.waitForTimeout(1200);
  const battle = await page.evaluate(() => {
    const out = {};
    const doc = document.documentElement;
    out.hScroll = doc.scrollWidth > window.innerWidth + 1;
    const hud = document.getElementById('hud');
    out.hudVisible = hud && !hud.classList.contains('hidden');
    const topbar = document.getElementById('top-bar');
    if (topbar) { const r = topbar.getBoundingClientRect(); out.topbar = { top: Math.round(r.top), w: Math.round(r.width) }; }
    // 人数气泡投影在屏内
    const badge = document.getElementById('squad-count-badge');
    if (badge) {
      const s = badge.style;
      out.badgePos = { left: s.left, top: s.top, display: s.display };
    }
    // 暂停按钮触控面积
    const pause = document.getElementById('btn-pause');
    if (pause) { const r = pause.getBoundingClientRect(); out.pauseBtn = Math.round(r.width) + 'x' + Math.round(r.height); }
    // 进度条
    const prog = document.getElementById('progress-bar-container');
    if (prog) { const r = prog.getBoundingClientRect(); out.progW = Math.round(r.width); }
    // 底部广告按钮区(如显示)不越界
    out.vh = window.innerHeight;
    return out;
  });
  if (battle.hScroll) bad('战斗横向溢出');
  if (!battle.hudVisible) bad('战斗HUD未显示');
  if (battle.pauseBtn) { const mm = battle.pauseBtn.match(/(\d+)x(\d+)/); if (mm && (+mm[1] < 40 || +mm[2] < 40)) bad('暂停按钮过小(' + battle.pauseBtn + ')'); }
  if (SHOTS) await page.screenshot({ path: path.join(SHOT_DIR, m.name + '_battle.png') });

  // —— Boss战帧率采样(顺带) ——
  const perf = await page.evaluate(() => {
    const g = window.__game;
    g.squad.setCount(100);
    g.pacing.forceComplete();
    const boss = g.pacing.spawnFn('boss', 0, g.squad.z - 12, 0);
    for (let f = 0; f < 60; f++) g._update(1 / 30);
    // 采样30帧真实渲染耗时
    const t0 = performance.now();
    for (let f = 0; f < 30; f++) { g._update(1 / 30); g.world.renderer.render(g.world.scene, g.world.camera); }
    const ms = (performance.now() - t0) / 30;
    const info = g.world.renderer.info;
    return { frameMs: +ms.toFixed(2), calls: info.render.calls, tris: info.render.triangles, geoms: info.memory.geometries, tex: info.memory.textures };
  });
  report.perf = perf;
  if (perf.frameMs > 33) bad('Boss战单帧' + perf.frameMs + 'ms(>33ms)');

  await page.close();
  return report;
}

async function main() {
  if (SHOTS) fs.mkdirSync(SHOT_DIR, { recursive: true });
  var cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
    { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const all = [];
  for (const m of MATRIX) {
    const r = await auditView(browser, m);
    all.push(r);
    console.log('[' + r.name + '] ' + (r.issues.length ? '✗ ' + r.issues.join(' ; ') : '✓ 无问题') +
      ' | frame=' + r.perf.frameMs + 'ms calls=' + r.perf.calls + ' tris=' + Math.round(r.perf.tris / 1000) + 'k');
  }
  fs.writeFileSync(path.join(ROOT, 'docs', 'v101_matrix_audit.json'), JSON.stringify(all, null, 1));
  const totalIssues = all.reduce((n, r) => n + r.issues.length, 0);
  console.log('\n总问题数: ' + totalIssues + ' (详情 docs/v101_matrix_audit.json)');
  await browser.close();
  cp.kill();
}
main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
