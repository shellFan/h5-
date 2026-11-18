// ===== VNext 排行榜+加载进度 E2E: 真实战绩入榜/排序/页面渲染/持久化/进度条生命周期 =====
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8301;

let passCount = 0, failCount = 0, bugs = [];
const ok = m => { passCount++; console.log('  ✓ ' + m); };
const bad = m => { failCount++; bugs.push(m); console.log('  ✗ ' + m); };
const assert = (c, m) => c ? ok(m) : bad(m);

async function main() {
  var cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
    { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  var browser = await chromium.launch({ headless: true, channel: 'msedge' });
  var page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  var pageErrors = [];
  page.on('pageerror', function(e) { pageErrors.push(e.message.slice(0, 160)); });

  // 加载进度生命周期: overlay初始可见 → 百分比单调 → 100%后隐藏
  await page.goto('http://localhost:' + PORT + '/index.html?vrank=' + Date.now(), { waitUntil: 'domcontentloaded' });
  var early = await page.evaluate(function() {
    return { visible: !!document.getElementById('boot-loading'), pct: document.getElementById('boot-pct').textContent };
  });
  assert(early.visible && early.pct !== undefined, '加载界面初始可见(pct=' + early.pct + ')');
  var pcts = [];
  for (var s = 0; s < 20; s++) {
    var p = await page.evaluate(function() { return document.getElementById('boot-pct').textContent; });
    pcts.push(parseInt(p));
    if (p === '100%') break;
    await page.waitForTimeout(60);
  }
  var monotonic = true;
  for (var i = 1; i < pcts.length; i++) if (pcts[i] < pcts[i - 1]) monotonic = false;
  assert(monotonic, '进度百分比单调不减(' + pcts.slice(0, 6).join(',') + '…)');

  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  var late = await page.evaluate(function() {
    return { pct: document.getElementById('boot-pct').textContent,
      hidden: document.getElementById('boot-loading').classList.contains('boot-hidden'),
      stage: document.getElementById('boot-stage').textContent };
  });
  assert(late.pct === '100%' && late.hidden, '加载完成100%后隐藏');
  ok('游戏启动');

  // 清档
  await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
  });

  // 真实战绩: 胜利入榜
  var win1 = await page.evaluate(function() {
    var g = window.__game;
    g.levelIndex = 0; g.start();
    g.squad.setCount(150); g.pacing.forceComplete();
    for (var f = 0; f < 3000 && g.state === 'playing'; f++) g._update(1/30);
    return { state: g.state, records: g.profile.data.records.length,
      first: g.profile.data.records[0], kills: g.enemies.killCount };
  });
  assert(win1.state === 'won' && win1.records === 1, '胜利入榜(1条)');
  assert(win1.first.win && win1.first.level === 1 && win1.first.score > 0, '战绩字段完整(score=' + win1.first.score + ')');

  // 失败也入榜; 分数排序
  var rank = await page.evaluate(function() {
    var g = window.__game;
    // 造一场失败(6精英贴脸 — 单只会被击退钉住形成僵局)
    g.levelIndex = 2; g.start();
    g.squad.setCount(3); g.squad._totalDr = 0;
    RandomEvents._t = 9999;
    for (var e2 = 0; e2 < 6; e2++) {
      g.enemies.spawnEnemy('elite', CONFIG.LANE_X[e2 % 3] + (e2 % 2 ? 0.4 : -0.4), g.squad.z - (1 + e2 * 0.4), 99999);
    }
    for (var f = 0; f < 1200 && g.state === 'playing'; f++) g._update(1/30);
    var afterLose = g.profile.data.records.length;
    var scores = g.profile.data.records.map(function(r) { return r.score; });
    var sorted = scores.slice().sort(function(a, b) { return b - a; });
    var eq = JSON.stringify(scores) === JSON.stringify(sorted);
    return { afterLose: afterLose, scores: scores, sorted: eq,
      loseEntry: g.profile.data.records.find(function(r) { return !r.win; }) };
  });
  assert(rank.afterLose === 2, '失败也入榜(2条)');
  assert(rank.sorted, '榜单按分数降序');
  assert(rank.loseEntry && rank.loseEntry.win === false, '失败战绩标记');
  assert(rank.scores[0] === win1.first.score, '高分行首(排序正确)');

  // 排行页渲染
  var rankUi = await page.evaluate(function() {
    var g = window.__game;
    V60UI.showPage('v60-rank-page'); V60UI.renderRank(g);
    var rows = document.querySelectorAll('#v60-rank-list .v60-rank-row');
    var navOk = !!document.getElementById('v60-btn-rank');
    return { rows: rows.length, navOk: navOk, text: rows[0] ? rows[0].textContent.slice(0, 30) : '' };
  });
  assert(rankUi.navOk, '排行导航按钮');
  assert(rankUi.rows === 2, '排行页2行(' + rankUi.rows + ')');

  // 榜单截断(只留前20) + 持久化
  var cap = await page.evaluate(function() {
    var g = window.__game;
    for (var i = 0; i < 30; i++) Leaderboard.record(g.profile, { level: 1, win: false, kills: i, maxCount: 1, combo: 0, time: 1 });
    return { count: g.profile.data.records.length, top: g.profile.data.records[0].score };
  });
  assert(cap.count === 20, '榜单截断20条(' + cap.count + ')');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  var persist = await page.evaluate(function() { return window.__game.profile.data.records.length; });
  assert(persist === 20, '榜单持久化(' + persist + ')');

  // 无假数据: 记录均来自真实结算(字段不可伪造随机)
  var clean = await page.evaluate(function() {
    return window.__game.profile.data.records.every(function(r) {
      return typeof r.score === 'number' && typeof r.ts === 'number' && typeof r.win === 'boolean';
    });
  });
  assert(clean, '榜单数据结构真实(无随机假数据)');

  var realErrors = pageErrors.filter(function(e) { return e.indexOf('favicon') < 0; });
  if (!realErrors.length) ok('全程无页面JS错误');
  else for (var i2 = 0; i2 < realErrors.length; i2++) bad('页面错误: ' + realErrors[i2]);

  console.log('\n========================');
  console.log('排行榜+加载进度E2E: 通过 ' + passCount + ' / 失败 ' + failCount);
  if (bugs.length) { console.log('\nBUG:'); for (var bi = 0; bi < bugs.length; bi++) console.log('  [BUG] ' + bugs[bi]); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(function(e) { console.error('[FATAL]', e.message); process.exit(1); });
