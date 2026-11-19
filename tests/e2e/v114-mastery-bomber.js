// ===== V11.4/V11.5 E2E: 职业专精成长 + 爆炸僵尸 =====
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8323;

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
  await page.goto('http://localhost:' + PORT + '/index.html?v114=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  ok('游戏启动');

  // 1. 职业专精: 6场 → 2级, 伤害乘区生效
  var mastery = await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
    g.profile.data.classId = 'rifleman';
    var m0 = SoldierClass.masteryOf(g.profile, 'rifleman');
    var d0;
    g.levelIndex = 0; g.start();
    g.squad.damageBuff = 10; // 放大基数使×1.03可见(getDamage保留1位小数)
    d0 = g.squad.getDamage();
    for (var i = 0; i < 6; i++) SoldierClass.recordGame(g.profile, 'rifleman');
    var m1 = SoldierClass.masteryOf(g.profile, 'rifleman');
    g.start();
    g.squad.damageBuff = 10;
    var d1 = g.squad.getDamage();
    return { level0: m0.level, level1: m1.level, games: m1.games, d0: d0, d1: d1, grew: d1 > d0 };
  });
  assert(mastery.level0 === 0 && mastery.level1 === 2 && mastery.games === 6, '专精6场→2级');
  assert(mastery.grew, '专精伤害乘区生效(' + mastery.d0 + '→' + mastery.d1 + ')');

  // 2. 职业卡显示专精
  var ui = await page.evaluate(function() {
    var g = window.__game;
    V60UI.renderClassSelector(g);
    var txt = document.getElementById('v60-class-row').textContent;
    return { has: txt.indexOf('专精') >= 0, lv: txt.indexOf('Lv.2') >= 0 };
  });
  assert(ui.has && ui.lv, '职业卡显示专精Lv');

  // 3. 专精持久化
  var snap = await page.evaluate(function() { return JSON.stringify(window.__game.profile.data.classMastery); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  var after = await page.evaluate(function() { return JSON.stringify(window.__game.profile.data.classMastery); });
  assert(snap === after && snap.indexOf('rifleman') >= 0, '专精持久化');

  // 4. 爆炸僵尸: 靠近小队被击杀 → 自爆-2人
  var bomber = await page.evaluate(function() {
    var g = window.__game;
    g.levelIndex = 3; g.start(); // L4(含bomber波)
    RandomEvents._t = 9999;
    g.pacing.waves = [];      // 隔离: 只留bomber(原生波次/踩门补员会污染计数)
    g.gates.gates = [];
    g.squad.setCount(50);
    var b = g.enemies.spawnEnemy('bomber', g.squad.x, g.squad.z - 2, 1);
    var shockBefore = g.effects.shockwaves.length;
    // 强制快速击杀(贴脸)
    for (var f = 0; f < 300; f++) {
      g._update(1/30);
      if (!b.alive && b.deathHandled) break; // 死亡结算(自爆)在manager下一帧处理 — 必须等结算后再计数
    }
    var lost = 50 - g.squad.count;
    return { died: !b.alive, lost: lost, shockFired: g.effects.shockwaves.length >= shockBefore,
      cfgHp: CONFIG.ZOMBIE.bomber.hp, speed: CONFIG.ZOMBIE.bomber.speed };
  });
  assert(bomber.died && bomber.lost >= 1 && bomber.lost <= 3, '爆炸僵尸自爆波及(损失' + bomber.lost + ')');
  assert(bomber.shockFired, '自爆红色冲击反馈');

  // 5. 配置: L10波次含bomber + 模型复用
  var cfg = await page.evaluate(function() {
    var found = 0;
    LEVELS.forEach(function(lv) {
      lv.segments.forEach(function(seg) {
        if (seg.type === 'wave') seg.enemies.forEach(function(e) { if (e.type === 'bomber') found++; });
      });
    });
    var g = window.__game;
    var b = g.enemies.spawnEnemy('bomber', 0, g.squad.z - 8, 0);
    var style = b.artStyle;
    b.die(g.effects); // 清理
    return { waves: found, style: style };
  });
  assert(cfg.waves >= 3, '波次配置含爆炸僵尸(' + cfg.waves + '处)');
  assert(cfg.style === 'fast', 'bomber复用fast模型(无新资源)');

  var realErrors = pageErrors.filter(function(e) { return e.indexOf('favicon') < 0; });
  if (!realErrors.length) ok('全程无页面JS错误');
  else for (var i = 0; i < realErrors.length; i++) bad('页面错误: ' + realErrors[i]);

  console.log('\n========================');
  console.log('V11.4/5 E2E: 通过 ' + passCount + ' / 失败 ' + failCount);
  if (bugs.length) { console.log('\nBUG:'); for (var bi = 0; bi < bugs.length; bi++) console.log('  [BUG] ' + bugs[bi]); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}
main().catch(function(e) { console.error('[FATAL]', e.message); process.exit(1); });
