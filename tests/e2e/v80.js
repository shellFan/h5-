// ===== V8.0 功能 E2E: 技能组合/随机事件/挑战模式/九页UI/签到/武器接线 =====
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8291;

let passCount = 0, failCount = 0, bugs = [];
const ok = m => { passCount++; console.log('  ✓ ' + m); };
const bad = m => { failCount++; bugs.push(m); console.log('  ✗ ' + m); };
const assert = (c, m) => c ? ok(m) : bad(m);

async function main() {
  var t0 = Date.now();
  var cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
    { env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
  cp.stderr && cp.stderr.on('data', function(d) { console.log('[SRV]', String(d).slice(0, 120)); });
  // 轮询等待端口就绪(最长10s)
  var up = false;
  for (var attempt = 0; attempt < 40 && !up; attempt++) {
    await new Promise(r => setTimeout(r, 250));
    up = await new Promise(function(resolve) {
      var net = require('net');
      var sock = net.connect(PORT, '127.0.0.1');
      sock.once('connect', function() { sock.destroy(); resolve(true); });
      sock.once('error', function() { resolve(false); });
    });
  }
  if (!up) { console.error('[FATAL] 服务器未启动'); process.exit(1); }
  var browser = await chromium.launch({ headless: true, channel: 'msedge' });
  var page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  var pageErrors = [];
  page.on('pageerror', function(e) { pageErrors.push(e.message.slice(0, 200)); });

  await page.goto('http://localhost:' + PORT + '/index.html?v80=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  ok('游戏启动');

  // 清档
  await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
    g.profile.addCoins(5000);
    g._refreshCoinDisplays();
  });

  // ===== 1. 技能组合 =====
  var combo = await page.evaluate(function() {
    var g = window.__game;
    g.levelIndex = 0; g.start(); g.paused = true;
    var s = g.squad;
    Skills.apply(s, 'rage'); Skills.apply(s, 'venom'); Skills.apply(s, 'magnet'); Skills.apply(s, 'shield');
    var active = Skills.checkCombos(s);
    return {
      ids: active.map(function(c) { return c.id; }),
      plague: !!s._comboPlagueFury, guardian: !!s._comboGuardianFury,
      greed: !!s._comboGreedFire, bounty: !!s._comboVenomBounty,
      coinBonus: Skills.coinBonus(s), count: active.length
    };
  });
  assert(combo.count >= 4, '技能组合触发数≥4(' + combo.count + ')');
  assert(combo.plague && combo.guardian && combo.greed && combo.bounty, '瘟疫狂怒/守护之怒/贪婪火力/剧毒赏金生效');
  assert(combo.coinBonus > 1, '金币加成汇总>1(' + combo.coinBonus + ')');

  // 组合清理(重开一局)
  var reset = await page.evaluate(function() {
    var g = window.__game; g.start();
    var s = g.squad;
    return { plague: s._comboPlagueFury || 0, shield: s._skillShieldMax || 0 };
  });
  assert(reset.plague === 0 && reset.shield === 0, '重开一局组合/技能复位');

  // ===== 2. 毒液DoT真实生效 =====
  var venom = await page.evaluate(function() {
    var g = window.__game;
    g.start(); g.paused = true;
    Skills.apply(g.squad, 'venom');
    g.paused = false;
    // 等敌人出现并射击
    for (var f = 0; f < 300 && g.enemies.aliveCount < 3; f++) g._update(1/30);
    var poisoned = 0;
    for (var f2 = 0; f2 < 240; f2++) {
      g._update(1/30);
      if (f2 % 60 === 59) {
        poisoned = g.enemies.enemies.filter(function(e) { return e.alive && e._venomT > 0; }).length;
        if (poisoned > 0) break;
      }
    }
    return { poisoned: poisoned, kills: g.enemies.killCount };
  });
  assert(venom.poisoned > 0, '毒液DoT挂载(命中后中毒数=' + venom.poisoned + ')');

  // ===== 3. 随机事件 =====
  var events = await page.evaluate(function() {
    var g = window.__game;
    g.start();
    // 铺一些敌人(冰冻时间需要场上目标)
    for (var e0 = 0; e0 < 5; e0++) g.enemies.spawnEnemy('normal', CONFIG.LANE_X[e0 % 3], g.squad.z - 8, 10);
    var fired = [];
    for (var i = 0; i < RANDOM_EVENT_DEFS.length; i++) {
      var def = RANDOM_EVENT_DEFS[i];
      var r = def.apply(g);
      fired.push({ id: def.id, ok: r !== false });
    }
    return { total: RANDOM_EVENT_DEFS.length, applied: fired.filter(function(f) { return f.ok; }).length,
      frenzy: g.squad._evDmgMul === 2, rate: g.squad._evRateMul === 1.5, crit: g.squad._evCritBonus === 0.2 };
  });
  assert(events.total === 12, '随机事件12种(' + events.total + ')');
  assert(events.applied === 12, '全部事件可执行(' + events.applied + '/12)');
  assert(events.frenzy && events.rate && events.crit, '狂热/弹药/洞察buff挂载');

  // 事件调度器真实触发
  var scheduler = await page.evaluate(function() {
    var g = window.__game;
    g.start();
    RandomEvents.reset();
    RandomEvents._t = 0.1; // 立即触发
    var bannerBefore = document.getElementById('v42-wave-banner').textContent;
    for (var f = 0; f < 10; f++) g._update(1/30);
    var bannerAfter = document.getElementById('v42-wave-banner').textContent;
    return { fired: bannerAfter !== bannerBefore || bannerAfter.indexOf('随机事件') >= 0, banner: bannerAfter.slice(0, 30), nextT: RandomEvents._t > 10 };
  });
  assert(scheduler.fired && scheduler.nextT, '事件调度器触发+横幅显示(' + scheduler.banner + ')');

  // ===== 4. 挑战模式 =====
  var surv = await page.evaluate(function() {
    var g = window.__game;
    g.profile.data.unlockedLevel = 10; g.profile.save();
    var okStart = g.startChallengeMode('survival');
    var c = g._challenge;
    var t0 = g.elapsedTime;
    for (var f = 0; f < 900 && g.state === 'playing'; f++) g._update(1/30); // 30s
    return { okStart: okStart, type: c && c.type, holdZ: c && c.holdZ !== undefined,
      waves: c && c.wave, alive: g.enemies.aliveCount, kills: g.enemies.killCount, state: g.state,
      squadZ: +g.squad.z.toFixed(1), holdAt: c ? +c.holdZ.toFixed(1) : null };
  });
  assert(surv.okStart && surv.type === 'survival', '无尽尸潮启动');
  assert(surv.holdZ && surv.waves >= 2, '波次驱动运行(第' + surv.waves + '波)');
  assert(surv.kills > 0 || surv.alive > 0, '挑战模式有战斗');
  assert(surv.squadZ >= surv.holdAt - 0.5, '小队驻守阵地(z=' + surv.squadZ + ' ≥ ' + surv.holdAt + ')');

  var rush = await page.evaluate(function() {
    var g = window.__game;
    var okStart = g.startChallengeMode('boss_rush');
    for (var f = 0; f < 600 && g.state === 'playing'; f++) g._update(1/30);
    var bossAlive = g.enemies.enemies.some(function(e) { return e.isBoss && e.alive; });
    return { okStart: okStart, type: g._challenge && g._challenge.type, wave: g._challenge && g._challenge.wave, bossAlive: bossAlive, bossKills: g.enemies.bossKills || 0 };
  });
  assert(rush.okStart && rush.type === 'boss_rush', 'Boss试炼启动');
  assert(rush.bossAlive || rush.bossKills > 0, 'Boss生成(第' + rush.wave + '个)');

  // 挑战失败结算
  var settle = await page.evaluate(function() {
    var g = window.__game;
    g.startChallengeMode('survival');
    RandomEvents._t = 9999; // 屏蔽随机事件干扰
    g._challenge.waveT = 9999; // 屏蔽波次增援
    g.squad.setCount(10);
    var coinsBefore = g.profile.coins;
    // V12: 10只低血精英贴脸 — 单只精英会被子弹击退钉住(V12击退+侧翼包抄机制下的平衡态),
    // 压倒性近战数量才能构成必然死亡(考察挑战失败结算链路, 非平衡性)
    for (var ei = 0; ei < 10; ei++) {
      g.enemies.spawnEnemy('elite', CONFIG.LANE_X[ei % 3] + (ei % 2 ? 0.5 : -0.5), g.squad.z - (0.8 + ei * 0.25), 80);
    }
    for (var f = 0; f < 600 && g.state === 'playing'; f++) g._update(1/30);
    return { state: g.state, scored: g._challenge ? g._challenge._scored : false,
      delta: g.profile.coins - coinsBefore, reason: document.getElementById('lose-reason') ? document.getElementById('lose-reason').textContent : '' };
  });
  assert(settle.state === 'lost', '挑战模式失败判定');
  assert(settle.scored, '挑战结算标记');
  assert(settle.delta >= 0, '挑战奖励入账(+' + settle.delta + ')');
  assert(settle.reason.indexOf('得分') >= 0, '失败原因显示得分(' + settle.reason.slice(0, 40) + ')');

  // ===== 5. 九页UI =====
  var pages = await page.evaluate(function() {
    var game = window.__game;
    var ui = V60UI;
    var navIds = ['v60-btn-map', 'v60-btn-train', 'v60-btn-armory', 'v60-btn-tech', 'v60-btn-codex',
      'v60-btn-challenge', 'v60-btn-ach', 'v60-btn-daily', 'v60-btn-set'];
    var navOk = navIds.every(function(id) { return !!document.getElementById(id); });
    var pageIds = ['v60-map-page', 'v60-train-page', 'v60-armory-page', 'v60-tech-page', 'v60-codex-page',
      'v60-challenge-page', 'v60-ach-page', 'v60-daily-page', 'v60-settings-page'];
    var pagesOk = pageIds.every(function(id) { return !!document.getElementById(id); });
    // 逐页打开并检查渲染
    var results = {};
    ui.showPage('v60-map-page'); ui.renderMap(game);
    results.map = document.getElementById('v60-map-nodes').children.length;
    ui.showPage('v60-train-page'); ui.renderTraining(game);
    results.train = document.getElementById('v60-train-header').textContent.length > 0;
    ui.showPage('v60-armory-page'); ui.renderArmory(game);
    results.armory = document.getElementById('v60-armory-list').children.length;
    ui.showPage('v60-tech-page'); ui.renderTech(game);
    results.tech = document.getElementById('v60-tech-list').children.length;
    ui.showPage('v60-codex-page'); ui.renderCodex(game);
    results.codex = document.getElementById('v60-codex-bosses').children.length;
    ui.showPage('v60-challenge-page'); ui.renderChallenges(game);
    results.challenge = document.getElementById('v60-challenge-list').children.length;
    ui.showPage('v60-daily-page'); ui.renderDaily(game);
    results.daily = document.getElementById('v60-signin-strip').children.length;
    ui.showPage('v60-ach-page'); ui.renderAchievements(game);
    results.ach = document.getElementById('v60-ach-list').children.length;
    ui.hidePages();
    var hiddenOk = pageIds.every(function(id) { return document.getElementById(id).classList.contains('hidden'); });
    return { navOk: navOk, pagesOk: pagesOk, hiddenOk: hiddenOk, results: results };
  });
  assert(pages.navOk, '九宫格导航按钮齐全');
  assert(pages.pagesOk, '九个页面骨架齐全');
  assert(pages.results.map === 19, '地图十节点+九连线(' + pages.results.map + ')');
  assert(pages.results.train, '训练中心渲染');
  assert(pages.results.armory === 8, '军械库8武器(' + pages.results.armory + ')');
  assert(pages.results.tech === 16, '科技树13节点+3分支头(' + pages.results.tech + ')');
  assert(pages.results.codex === 10, 'Boss图鉴10项(' + pages.results.codex + ')');
  assert(pages.results.challenge === 2, '挑战2模式(' + pages.results.challenge + ')');
  assert(pages.results.daily === 7, '签到条7天(' + pages.results.daily + ')');
  assert(pages.results.ach === 40, '成就40项(' + pages.results.ach + ')');
  assert(pages.hiddenOk, 'hidePages全部隐藏(V8.0.1修复)');

  // 武器接线: 买武器→开局→伤害变化(_weaponStats 在 start() 时装配)
  var weaponWire = await page.evaluate(function() {
    var g = window.__game;
    g.profile.addCoins(2000);
    g.start();
    var d0 = g.squad.getDamage();
    WeaponSystem.upgrade(g.profile);
    WeaponSystem.upgrade(g.profile);
    g.start(); // 重开一局刷新 _weaponStats
    var d1 = g.squad.getDamage();
    WeaponSystem.switchTo(g.profile, 'sniper');
    g.start();
    var d2 = g.squad.getDamage();
    var w = WeaponSystem.stats(g.profile);
    return { d0: d0, d1: d1, d2: d2, grew: d1 > d0, pierce: w.pierceBonus, id: w.weaponId, lv: w.weaponLevel };
  });
  assert(weaponWire.grew, '武器升级伤害生效(' + weaponWire.d0 + '→' + weaponWire.d1 + ')');
  assert(weaponWire.pierce > 0 && weaponWire.id === 'sniper', '狙击穿透属性暴露');

  // ===== 6. 签到 =====
  var signin = await page.evaluate(function() {
    var g = window.__game;
    var b = g.profile.coins;
    var r = SignInSystem.sign(g.profile);
    var r2 = SignInSystem.sign(g.profile);
    return { first: r !== false, reward: r && r.reward, dup: r2 === false, delta: g.profile.coins - b };
  });
  assert(signin.first && signin.reward > 0, '签到+奖励(' + signin.reward + ')');
  assert(signin.dup, '同日重复签到被拒');

  // ===== 7. 存档: 新字段持久化(对比战斗相关稳定字段) =====
  var save = await page.evaluate(function() {
    var g = window.__game;
    return JSON.stringify({ w: g.profile.data.weapon, wl: g.profile.data.weaponLevel, cb: g.profile.data.challengeBest, si: g.profile.data.signin && g.profile.data.signin.streak });
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  var after = await page.evaluate(function() {
    var g = window.__game;
    return JSON.stringify({ w: g.profile.data.weapon, wl: g.profile.data.weaponLevel, cb: g.profile.data.challengeBest, si: g.profile.data.signin && g.profile.data.signin.streak });
  });
  assert(save === after, '武器/挑战纪录/签到持久化(' + save + ' → ' + after + ')');

  // 页面错误
  var realErrors = pageErrors.filter(function(e) { return e.indexOf('favicon') < 0; });
  if (!realErrors.length) ok('无页面JS错误');
  else for (var i = 0; i < realErrors.length; i++) bad('页面错误: ' + realErrors[i]);

  var elapsed = Math.round((Date.now() - t0) / 1000);
  console.log('\n========================');
  console.log('V8.0 功能E2E: 通过 ' + passCount + ' / 失败 ' + failCount + ' / 耗时 ' + elapsed + 's');
  if (bugs.length) { console.log('\nBUG:'); for (var bi = 0; bi < bugs.length; bi++) console.log('  [BUG] ' + bugs[bi]); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(function(e) { console.error('[FATAL]', e.message); process.exit(1); });
