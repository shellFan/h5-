// ===== VNext 职业系统 E2E: 四职业战斗差异/解锁/技能循环/医疗回复/减伤/技能门空池 =====
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8296;

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
  await page.goto('http://localhost:' + PORT + '/index.html?vcls=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  ok('游戏启动');

  // 1. 职业选择UI + 解锁门控
  var ui = await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
    V60UI.renderClassSelector(g);
    var cards = document.querySelectorAll('#v60-class-row .v60-class-card');
    var locked = document.querySelectorAll('#v60-class-row .v60-class-card.locked').length;
    var selected = document.querySelector('#v60-class-row .v60-class-card.selected');
    // 未解锁选择被拒
    var r1 = SoldierClass.select(g.profile, 'medic');
    // 解锁后可选
    g.profile.data.unlockedLevel = 7;
    var r2 = SoldierClass.select(g.profile, 'medic');
    var r3 = SoldierClass.select(g.profile, 'gunner');
    return { cards: cards.length, locked: locked, selectedName: selected ? selected.textContent.slice(0, 6) : '',
      rejectLocked: !r1.ok, acceptUnlocked: r2.ok, switchOk: r3.ok, classId: g.profile.data.classId };
  });
  assert(ui.cards === 4, '职业卡4张(' + ui.cards + ')');
  assert(ui.locked === 3, '新档3职业锁定(通关L2/L4/L6)' + '(locked=' + ui.locked + ')');
  assert(ui.selectedName.indexOf('枪械') >= 0, '默认选中枪械步兵(' + ui.selectedName + ')');
  assert(ui.rejectLocked, '未解锁职业被拒');
  assert(ui.acceptUnlocked && ui.switchOk, '解锁后可选/切换');
  assert(ui.classId === 'gunner', '职业存档(' + ui.classId + ')');

  // 2. 战斗差异: 三职业关键属性对比
  var stats = await page.evaluate(function() {
    var g = window.__game;
    var out = {};
    ['rifleman', 'gunner', 'marksman', 'medic'].forEach(function(cid) {
      g.profile.data.classId = cid;
      g.levelIndex = 0; g.start();
      out[cid] = { dmg: g.squad.getDamage(), rate: +g.squad.getFireRate().toFixed(2),
        pierce: g.squad.pierce, crit: +g.squad.critChance.toFixed(3),
        speed: g.squad._classBulletSpeed, dr: +g.squad._totalDr.toFixed(3) };
    });
    return out;
  });
  assert(stats.gunner.rate > stats.rifleman.rate, '机枪手射速更高(' + stats.gunner.rate + '>' + stats.rifleman.rate + ')');
  assert(stats.gunner.dmg < stats.rifleman.dmg, '机枪手单发更低(' + stats.gunner.dmg + '<' + stats.rifleman.dmg + ')');
  assert(stats.gunner.dr > 0 && stats.gunner.speed > 1, '机枪手减伤+弹速(' + stats.gunner.dr + '/' + stats.gunner.speed + ')');
  assert(stats.marksman.dmg > stats.rifleman.dmg && stats.marksman.rate < stats.rifleman.rate, '狙击高伤低速(' + stats.marksman.dmg + '/' + stats.marksman.rate + ')');
  assert(stats.marksman.pierce > stats.rifleman.pierce && stats.marksman.crit > 0, '狙击穿透+暴击(' + stats.marksman.pierce + '/' + stats.marksman.crit + ')');
  assert(stats.medic.dr > 0 && stats.medic.dmg < stats.rifleman.dmg, '军医减伤+低伤(' + stats.medic.dr + ')');

  // 3. 职业技能自动循环(机枪手弹幕: _evRateMul=2)
  var skillLoop = await page.evaluate(function() {
    var g = window.__game;
    g.profile.data.classId = 'gunner';
    g.start();
    RandomEvents._t = 9999;
    for (var f = 0; f < 60 * 10 && !(g.squad._evRateMul >= 2); f++) g._update(1/30); // 10秒内firstCd=8s必触发
    return { fired: g.squad._evRateMul >= 2, rateMul: g.squad._evRateMul, timerReset: g.squad._classSkillT > 20 };
  });
  assert(skillLoop.fired, '职业技能自动施放(射速×' + skillLoop.rateMul + ')');
  assert(skillLoop.timerReset, '技能冷却重置');

  // 4. 医疗战地回复: 杀5人 → 10秒后+2
  var regen = await page.evaluate(function() {
    var g = window.__game;
    g.profile.data.classId = 'medic';
    g.start();
    RandomEvents._t = 9999;
    g.squad.setCount(30);
    g.squad.killSoldiers(5, g.effects);
    var afterKill = g.squad.count; // 25
    for (var f = 0; f < 60 * 11; f++) g._update(1/30); // 11秒 → 至少1次回复
    return { afterKill: afterKill, after: g.squad.count, healed: g.squad.count > afterKill };
  });
  assert(regen.healed, '军医战地回复(' + regen.afterKill + '→' + regen.after + ')');

  // 5. 神射精英加成标记 + 行为(20人小队保证火力)
  var marks = await page.evaluate(function() {
    var g = window.__game;
    g.profile.data.classId = 'marksman';
    g.start();
    RandomEvents._t = 9999;
    g.squad.setCount(20);
    var has = g.squad._classEliteMul === 1.25;
    var elite = g.enemies.spawnEnemy('elite', 0, g.squad.z - 8, 100);
    var hp0 = elite.hp;
    for (var f = 0; f < 300 && elite.alive; f++) g._update(1/30);
    return { has: has, died: !elite.alive, dmgDealt: hp0 - Math.max(0, elite.hp) };
  });
  assert(marks.has, '狙击精英乘区挂载(×1.25)');
  assert(marks.died && marks.dmgDealt > 0, '精英被真实击杀(伤害' + Math.round(marks.dmgDealt) + ')');

  // 6. 伤害减免真实生效(非致命)
  var dr = await page.evaluate(function() {
    var g = window.__game;
    g.profile.data.classId = 'rifleman';
    g.start();
    RandomEvents._t = 9999;
    var lost = 0, trials = 30;
    for (var t = 0; t < trials; t++) {
      g.squad.setCount(100);
      g.squad._totalDr = 0.5;
      g.squad.killSoldiers(10, g.effects);
      lost += 100 - g.squad.count;
    }
    var avg = lost / trials; // 期望5(±随机)
    // 致命一击保留护盾: 有护盾时致命伤害被格挡
    g.squad.setCount(10);
    g.squad._skillShieldMax = 2; g.squad._skillShield = 2; g.squad._shieldCd = 0;
    g.squad._totalDr = 0.5;
    g.squad.killSoldiers(10, g.effects);
    var shieldBlocked = g.squad.count === 10 && g.squad._skillShield === 1;
    return { avg: avg, shieldBlocked: shieldBlocked };
  });
  assert(dr.avg >= 3.5 && dr.avg <= 6.5, '减伤期望≈5(实测' + dr.avg.toFixed(1) + ')');
  assert(dr.shieldBlocked, '致命一击仍触发护盾');

  // 7. 技能门空池 → 转人数门(不允许无效选项; L6有3个技能门)
  var gateFallback = await page.evaluate(function() {
    var g = window.__game;
    g.levelIndex = 5;
    g.start();
    // 全技能满级后, 重新加载关卡门(恢复 op:'skill'/value:'roll' 原始数据)再解析 — 等价于满级开局
    var all = {};
    for (var id in SKILL_DEFS) all[id] = SKILL_DEFS[id].maxLevel;
    g.squad._skills = all;
    Skills.checkCombos(g.squad);
    g.gates.loadFromLevel(LEVELS[5]);
    g.gates.resolveSkillGates(g.squad);
    var skillGates = g.gates.gates.filter(function(x) { return x.data && x.data.op === 'skill'; });
    var addpctGates = g.gates.gates.filter(function(x) { return x.data && x.data.op === 'addpct' && x.data.value === 30 && x.data.style === 'epic'; });
    return { skillLeft: skillGates.length, converted: addpctGates.length };
  });
  assert(gateFallback.skillLeft === 0 && gateFallback.converted > 0, '满级技能门转为+30%人数门(剩' + gateFallback.skillLeft + ' 转' + gateFallback.converted + ')');

  // 8. 职业持久化
  await page.evaluate(function() { SoldierClass.select(window.__game.profile, 'rifleman'); });
  var snap = await page.evaluate(function() { return window.__game.profile.data.classId; });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  var after = await page.evaluate(function() { return window.__game.profile.data.classId; });
  assert(snap === after && after === 'rifleman', '职业持久化(' + snap + '→' + after + ')');

  var realErrors = pageErrors.filter(function(e) { return e.indexOf('favicon') < 0; });
  if (!realErrors.length) ok('全程无页面JS错误');
  else for (var i = 0; i < realErrors.length; i++) bad('页面错误: ' + realErrors[i]);

  console.log('\n========================');
  console.log('职业系统E2E: 通过 ' + passCount + ' / 失败 ' + failCount);
  if (bugs.length) { console.log('\nBUG:'); for (var bi = 0; bi < bugs.length; bi++) console.log('  [BUG] ' + bugs[bi]); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(function(e) { console.error('[FATAL]', e.message); process.exit(1); });
