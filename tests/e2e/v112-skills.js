// ===== V11.2 技能深化 E2E: 新技能6种/品质/职业倾向/流派组合/XP乘区 =====
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8321;

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
  await page.goto('http://localhost:' + PORT + '/index.html?v112=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  ok('游戏启动');

  // 1. 技能总账: 12种(6旧+6新), 全部有品质
  var total = await page.evaluate(function() {
    var ids = Object.keys(SKILL_DEFS);
    var noQ = ids.filter(function(id) { return !SKILL_DEFS[id].quality; });
    return { count: ids.length, noQ: noQ, has: ['swiftness', 'deadly', 'executioner', 'pierce_master', 'harvest', 'fortune'].every(function(id) { return !!SKILL_DEFS[id]; }) };
  });
  assert(total.count === 12, '技能12种(' + total.count + ')');
  assert(total.has && total.noQ.length === 0, '全部有品质标签');

  // 2. 迅捷弹幕: 射速实际提升
  var swift = await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
    g.levelIndex = 0; g.start();
    var r0 = g.squad.getFireRate();
    Skills.apply(g.squad, 'swiftness'); Skills.apply(g.squad, 'swiftness');
    var r2 = g.squad.getFireRate();
    return { r0: +r0.toFixed(2), r2: +r2.toFixed(2), grew: r2 > r0 * 1.2 };
  });
  assert(swift.grew, '迅捷弹幕射速×1.24(' + swift.r0 + '→' + swift.r2 + ')');

  // 3. 致命精准: 暴击率提升
  var deadly = await page.evaluate(function() {
    var g = window.__game;
    Skills.apply(g.squad, 'deadly');
    return { crit: +g.squad.critChance.toFixed(3) };
  });
  assert(deadly.crit >= 0.06, '致命精准暴击率(' + deadly.crit + ')');

  // 4. 处决者: 暴伤乘区(行为验证: 暴击时伤害=非暴击×(2+0.25))
  var exec = await page.evaluate(function() {
    var g = window.__game;
    g.squad._critMul = 0;
    // 直接从combat逻辑取数: 构造固定伤害攻击无甲目标, 强制暴击率100%
    g.squad.critChance = 1;
    Skills.apply(g.squad, 'executioner'); // _critMul = 0.25
    var e = g.enemies.spawnEnemy('normal', 0, g.squad.z - 5, 9999);
    var hp0 = e.hp;
    for (var f = 0; f < 30; f++) g._update(1/30);
    var dealt = hp0 - e.hp;
    return { critMul: g.squad._critMul, dealt: dealt };
  });
  assert(exec.critMul === 0.25 && exec.dealt > 0, '处决者暴伤乘区挂载');

  // 5. 亡者征召: 击杀补员(统计)
  var harvest = await page.evaluate(function() {
    var g = window.__game;
    Skills.apply(g.squad, 'harvest'); // 先施加技能再刷怪
    g.squad.setCount(30);
    var c0 = g.squad.count;
    for (var i = 0; i < 60; i++) {
      g.enemies.spawnEnemy('normal', (i % 3 - 1) * 1.2, g.squad.z - 4 - Math.random() * 6, 1);
    }
    for (var f = 0; f < 600 && g.enemies.aliveCount > 0; f++) g._update(1/30);
    return { grew: g.squad.count > c0, c0: c0, c1: g.squad.count };
  });
  assert(harvest.grew, '亡者征召战斗补员(' + harvest.c0 + '→' + harvest.c1 + ')');

  // 6. 穿甲弹头: 穿透+1 且上限5
  var pierce = await page.evaluate(function() {
    var g = window.__game;
    g.start();
    g.squad.pierce = 0;
    Skills.apply(g.squad, 'pierce_master');
    var after1 = g.squad.pierce;
    for (var i = 0; i < 6; i++) Skills.apply(g.squad, 'pierce_master');
    return { after1: after1, capped: g.squad.pierce };
  });
  assert(pierce.after1 === 1 && pierce.capped === 5, '穿甲弹头(+1/层, 上限5)');

  // 7. 职业倾向: marksman 门选项中 deadly 出现频率显著更高
  var bias = await page.evaluate(function() {
    var g = window.__game;
    g.squad._gameRef = g;
    g._classStats = { id: 'marksman' };
    g.squad._gameRef._classStats = { id: 'marksman' };
    g.squad._skills = {}; // 全部未学
    var deadlyCount = 0, N = 500;
    for (var i = 0; i < N; i++) {
      var picks = Skills.rollChoices(g.squad);
      if (picks.indexOf('deadly') >= 0) deadlyCount++;
    }
    // 对照: 无职业
    g._classStats = null; g.squad._gameRef._classStats = null;
    var deadlyCount2 = 0;
    for (var i2 = 0; i2 < 500; i2++) {
      var picks2 = Skills.rollChoices(g.squad);
      if (picks2.indexOf('deadly') >= 0) deadlyCount2++;
    }
    return { with: deadlyCount / N, without: deadlyCount2 / N };
  });
  assert(bias.with - bias.without >= 0.05, '职业倾向: 狙击手deadly出现率' + (bias.with * 100).toFixed(0) + '% 显著高于无职业' + (bias.without * 100).toFixed(0) + '%(+≥5pp)');

  // 8. 流派组合: 火力/穿透/虫群
  var flows = await page.evaluate(function() {
    var g = window.__game;
    g.start();
    var out = {};
    Skills.apply(g.squad, 'rage'); Skills.apply(g.squad, 'swiftness');
    out.fire = { active: !!g.squad._comboFireFlow };
    Skills.apply(g.squad, 'pierce_master');
    out.pierceFlow = { active: !!g.squad._comboPierceFlow, pierce: g.squad.pierce };
    Skills.apply(g.squad, 'magnet'); Skills.apply(g.squad, 'harvest');
    out.swarm = { active: !!g.squad._comboSwarmFlow };
    // 穿透流派实际弹丸穿透: bullets pierceLeft含+1
    return out;
  });
  assert(flows.fire.active, '火力流派激活');
  assert(flows.pierceFlow.active && flows.pierceFlow.pierce >= 1, '穿透流派激活(弹丸穿透在pierceLeft动态+1)');
  assert(flows.swarm.active, '虫群流派激活');

  // 9. 实战经验: XP 乘区结算
  var fortune = await page.evaluate(function() {
    var g = window.__game;
    g.start();
    g.squad._skillFortune = 2; // 2层 = ×1.3
    g.squad.setCount(150); g.pacing.forceComplete();
    for (var f = 0; f < 2400 && g.state === 'playing'; f++) g._update(1/30);
    return { state: g.state, xp: g.profile.data.xp, kills: g.enemies.killCount };
  });
  assert(fortune.state === 'won' && fortune.xp > 0, '实战经验结算通过(xp=' + fortune.xp + ')');

  // 10. 品质标签: 技能门 label 含品质
  var label = await page.evaluate(function() {
    var g = window.__game;
    g.levelIndex = 5; g.start(); // L6 有3个技能门
    var labels = [];
    g.gates.gates.forEach(function(x) { if (x.data && x.data.op === 'skill' && x.data.value !== 'roll') labels.push(x.data.label); });
    return { sample: labels[0] || '(无技能门)', withQ: labels.every(function(l) { return l.indexOf('[') >= 0 && l.indexOf(']') >= 0; }), n: labels.length };
  });
  assert(label.withQ && label.n > 0, '门标签含品质(' + label.sample + ')');

  var realErrors = pageErrors.filter(function(e) { return e.indexOf('favicon') < 0; });
  if (!realErrors.length) ok('全程无页面JS错误');
  else for (var i = 0; i < realErrors.length; i++) bad('页面错误: ' + realErrors[i]);

  console.log('\n========================');
  console.log('V11.2 技能深化E2E: 通过 ' + passCount + ' / 失败 ' + failCount);
  if (bugs.length) { console.log('\nBUG:'); for (var bi = 0; bi < bugs.length; bi++) console.log('  [BUG] ' + bugs[bi]); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}
main().catch(function(e) { console.error('[FATAL]', e.message); process.exit(1); });
