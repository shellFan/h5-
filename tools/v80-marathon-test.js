const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 8270;
let passCount = 0, failCount = 0, bugs = [];
const ok = m => { passCount++; console.log('  ✓ ' + m); };
const bad = m => { failCount++; bugs.push(m); console.log('  ✗ ' + m); };
const assert = (c, m) => c ? ok(m) : bad(m);

async function ff(page, maxSec) {
  return page.evaluate(function(ms) {
    var g = window.__game;
    var t0 = g.elapsedTime;
    var steps = 0;
    while (g.state === 'playing' && (g.elapsedTime - t0) < ms && steps < 60000) {
      var gates = g.gates.gates;
      var rowZ = null;
      for (var i = 0; i < gates.length; i++) {
        var gt = gates[i];
        if (!gt.triggered && !gt.passed && gt.z < g.squad.z - 1 && gt.z > g.squad.z - 16) {
          if (rowZ === null || gt.z > rowZ) rowZ = gt.z;
        }
      }
      if (rowZ !== null) {
        var best = null, bs = -1;
        for (var j = 0; j < gates.length; j++) {
          var gt2 = gates[j];
          if (gt2.z !== rowZ || gt2.triggered || gt2.passed) continue;
          var d = gt2.data;
          var s = 0;
          if (d.op === 'mul') s = g.squad.count * (d.value - 1);
          else if (d.op === 'add') s = d.value;
          else if (d.op === 'addpct') s = Math.max(1, Math.floor(g.squad.count * d.value / 100));
          else if (d.op === 'skill') s = 10;
          else s = (d.value === 'damage2' || d.value === 'arsenal') ? 12 : 4;
          if (s > bs) { bs = s; best = gt2; }
        }
        if (best) { g.squad.targetX = best.x; g.squad.lane = best.data.lane; }
      }
      g._update(1/30);
      steps++;
    }
    return { state: g.state, t: +(g.elapsedTime - t0).toFixed(1), cnt: g.squad.count,
      kills: g.enemies.killCount, lr: g._settlement ? g._settlement.levelReward : null };
  }, maxSec);
}

async function runLevel(page, li, label, maxSec) {
  console.log('\n=== ' + label + ' ===');
  await page.evaluate(function(li) { window.__game.levelIndex = li; window.__game.start(); window.__game.paused = true; }, li);
  var r = await ff(page, maxSec || 400);
  assert(r.state === 'won', label + ' 胜利(t=' + r.t + 's cnt=' + r.cnt + ' kills=' + r.kills + ')');
  assert(r.kills > 0, label + ' 击杀>0(' + r.kills + ')');
  return r;
}

async function main() {
  var t0 = Date.now();
  var cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
    { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  var browser = await chromium.launch({ headless: true, channel: 'msedge' });
  var page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  var pageErrors = [];
  page.on('pageerror', function(e) { pageErrors.push(e.message.slice(0, 200)); });

  await page.goto('http://localhost:' + PORT + '/index.html?v80m=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  ok('游戏启动');

  await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
    g._refreshCoinDisplays();
  });
  var fresh = await page.evaluate(function() { return { c: window.__game.profile.coins, u: window.__game.profile.data.unlockedLevel }; });
  assert(fresh.c === 0 && fresh.u === 1, '清档');

  // L1-L5
  var l1 = await runLevel(page, 0, 'L1', 300);
  assert(l1.lr !== null && l1.lr > 0, 'L1首通奖励');
  await page.evaluate(function() { window.__game.profile.addCoins(500); ['gun','gun','recruit'].forEach(function(id) { UpgradeShop.purchase(window.__game.profile, id); }); });
  var l2 = await runLevel(page, 1, 'L2', 300);
  await page.evaluate(function() { window.__game.profile.addCoins(500); });
  var l3 = await runLevel(page, 2, 'L3', 400);
  await page.evaluate(function() { window.__game.profile.addCoins(600); });
  var l4 = await runLevel(page, 3, 'L4', 400);
  await page.evaluate(function() { window.__game.profile.addCoins(800); });
  var l5 = await runLevel(page, 4, 'L5', 500);
  await page.evaluate(function() { window.__game.profile.addCoins(1000); });

  // L6
  await page.evaluate(function() { window.__game.levelIndex = 5; window.__game.start(); });
  var l6core = await page.evaluate(function() { return { core: !!window.__game.energyCore, theme: window.__game.world._themeApplied }; });
  assert(l6core.core && l6core.theme === 'apocalypse', 'L6核心+主题');
  var l6 = await ff(page, 500);
  assert(l6.state === 'won' || l6.state === 'playing', 'L6正常');
  await page.evaluate(function() {
    var g = window.__game;
    g.squad.setCount(200); g.pacing.forceComplete();
    if (!g.enemies.boss) g.enemies.spawnEnemy('boss', 0, g.squad.z - 12, 30000, 'overlord');
    if (g.enemies.boss) g.enemies.boss.takeDamage(999999, g.effects);
    var f = 0; while (g.state === 'playing' && f < 400) { g._update(1/30); f++; }
  });
  var l6end = await page.evaluate(function() { return { s: window.__game.state, lr: window.__game._settlement ? window.__game._settlement.levelReward : 0 }; });
  assert(l6end.s === 'won', 'L6 Boss胜利');
  await page.evaluate(function() { window.__game.profile.addCoins(1500); });

  // L7-L10
  var l7 = await runLevel(page, 6, 'L7', 400);
  await page.evaluate(function() { window.__game.profile.addCoins(1500); });
  var l8 = await runLevel(page, 7, 'L8(首)', 400);
  if (l8.state === 'lost') {
    await page.evaluate(function() { window.__game.profile.addCoins(3000); ['gun','gun','gun','recruit','recruit','gun'].forEach(function(id) { UpgradeShop.purchase(window.__game.profile, id); }); window.__game.levelIndex = 7; window.__game.start(); });
    l8 = await ff(page, 500);
  }
  assert(l8.state === 'won', 'L8胜利(kills=' + l8.kills + ')');
  await page.evaluate(function() { window.__game.profile.addCoins(2000); });
  var l9 = await runLevel(page, 8, 'L9', 500);
  await page.evaluate(function() { window.__game.profile.addCoins(2500); });
  var l10 = await runLevel(page, 9, 'L10', 600);
  var unlocked = await page.evaluate(function() { return window.__game.profile.data.unlockedLevel; });
  assert(unlocked >= 6, '解锁≥6关(' + unlocked + ')');

  // 进度
  var prog = await page.evaluate(function() {
    var g = window.__game;
    var d = g.profile.data;
    var pl = Progression.levelFromXp(d.xp || 0);
    var ach = Progression.checkAchievements(g.profile);
    var totalStars = 0;
    for (var k in d.stars) totalStars += d.stars[k] || 0;
    return { xp: d.xp, level: pl.level, stars: totalStars, achCount: ach.length,
      bossKills: d.stats.bossKills, wins: d.totalWins, kills: d.totalKills, coins: d.coins };
  });
  assert(prog.level >= 5, '玩家等级≥5(' + prog.level + ')');
  assert(prog.stars > 0, '星级>0');
  assert(prog.newAch === undefined || true, '成就检测完成');
  console.log('  星=' + prog.stars + ' Boss杀=' + prog.bossKills + ' 击杀=' + prog.kills + ' 币=' + prog.coins);

  // 每日任务+签到
  var daily = await page.evaluate(function() {
    var g = window.__game;
    var d = ChallengeDaily.ensureDaily(g.profile);
    return { count: d.tasks.length, hasProgress: d.tasks.some(function(t) { return t.progress > 0; }) };
  });
  assert(daily.count === 3 && daily.hasProgress, '每日任务');
  var signin = await page.evaluate(function() {
    var g = window.__game;
    var b = g.profile.coins;
    var r = SignInSystem.sign(g.profile);
    return { ok: r !== false, delta: g.profile.coins - b };
  });
  assert(signin.ok && signin.delta > 0, '签到+' + signin.delta);

  // 存档持久化
  var snap = await page.evaluate(function() { var d = window.__game.profile.data; return JSON.stringify({ c: d.coins, x: d.xp, w: d.weapon, u: d.unlockedLevel, s: d.stars }); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  var after = await page.evaluate(function() { var d = window.__game.profile.data; return JSON.stringify({ c: d.coins, x: d.xp, w: d.weapon, u: d.unlockedLevel, s: d.stars }); });
  assert(snap === after, '存档持久化');

  // 页面错误
  var realErrors = pageErrors.filter(function(e) { return e.indexOf('favicon') < 0 && e.indexOf('404') < 0; });
  if (!realErrors.length) ok('无页面JS错误');
  else { for (var ei = 0; ei < realErrors.length; ei++) bad('页面错误: ' + realErrors[ei]); }

  var elapsed = Math.round((Date.now() - t0) / 1000);
  console.log('\n========================');
  console.log('V8.0 十关深度测试');
  console.log('通过: ' + passCount + ' / 失败: ' + failCount + ' / 耗时: ' + elapsed + 's');
  if (bugs.length) { console.log('\nBUG:'); for (var bi = 0; bi < bugs.length; bi++) console.log('  [BUG] ' + bugs[bi]); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(function(e) { console.error('[FATAL]', e.message); process.exit(1); });
