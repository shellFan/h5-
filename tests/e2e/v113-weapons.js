// ===== V11.3 武器深化 E2E: 四新进化/词条掉落/重roll/真实战斗接线/UI展示 =====
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8322;

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
  await page.goto('http://localhost:' + PORT + '/index.html?v113=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  ok('游戏启动');

  // 1. 四条新进化存在且可被 canEvolve 识别(装科技前置)
  var evos = await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
    var names = ['twin_rifle', 'storm_shotgun', 'phantom_sniper', 'inferno_thrower'];
    var found = names.every(function(id) { return !!EVOLUTION_DEFS[id] && EVOLUTION_DEFS[id].base; });
    // 步枪+科技pierce1 → 可进化
    g.profile.data.tech = { fire_pierce: 1 };
    g.profile.data.weaponLevel = 3;
    WeaponSystem.switchTo(g.profile, 'rifle');
    var check = WeaponSystem.canEvolve(g.profile);
    return { found: found, checkOk: check.ok, evoId: check.evoId || null };
  });
  assert(evos.found, '四条新进化已定义');
  assert(evos.checkOk && evos.evoId === 'twin_rifle', '双管步枪满足前置可进化');

  // 2. 词条: 升到3级掉落, stats合并, 换武器不串
  var affix = await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
    g.profile.addCoins(5000);
    WeaponSystem.switchTo(g.profile, 'rifle');
    var stats0 = WeaponSystem.stats(g.profile).dmgMul;
    var affixGot = null;
    for (var i = 0; i < 3; i++) {
      var r = WeaponSystem.upgrade(g.profile);
      if (r.affix) affixGot = r.affix;
    }
    var st = WeaponSystem.stats(g.profile);
    return { affixGot: affixGot, stored: g.profile.data.weaponAffix, affixName: st.affixName,
      dmgMul: +st.dmgMul.toFixed(2), stats0: stats0 };
  });
  assert(!!affix.affixGot && !!affix.stored, '3级掉落词条(' + (affix.stored && affix.stored.name) + ')');
  assert(affix.affixName, 'stats暴露词条名');
  assert(affix.dmgMul > 1.0 || affix.stored.k !== 'dmg', '词条合并进stats(dmgMul=' + affix.dmgMul + ')');

  // 3. 词条真实战斗: dmg词条 → squad.getDamage 提升
  var combat = await page.evaluate(function() {
    var g = window.__game;
    g.profile.data.weaponAffix = { k: 'dmg', v: 0.10, name: '伤害 +10%' };
    g.profile.save();
    g.start();
    var d1 = g.squad.getDamage();
    g.profile.data.weaponAffix = null;
    g.start();
    var d0 = g.squad.getDamage();
    return { with: d1, without: d0, grew: d1 > d0 };
  });
  assert(combat.grew, '词条真实战斗(伤害' + combat.without + '→' + combat.with + ')');

  // 4. 幻影狙击: 进化后暴击+20%进入战斗
  var phantom = await page.evaluate(function() {
    var g = window.__game;
    g.profile.data.tech = { fire_crit: 2 };
    g.profile.data.weaponLevel = 3;
    WeaponSystem.switchTo(g.profile, 'sniper');
    var check = WeaponSystem.canEvolve(g.profile);
    var r = check.ok ? WeaponSystem.evolve(g.profile) : { ok: false };
    var st = WeaponSystem.stats(g.profile);
    g.start();
    return { evolved: r.ok && r.evolved === 'phantom_sniper', critBonus: st.critBonus,
      rerolled: !!g.profile.data.weaponAffix, inBattle: g.squad.critChance >= 0.2,
      pierce: st.pierceBonus };
  });
  assert(phantom.evolved, '幻影狙击进化');
  assert(phantom.critBonus >= 0.2, '进化暴击加值(' + phantom.critBonus + ')');
  assert(phantom.rerolled, '进化重roll词条');
  assert(phantom.inBattle, '暴击进入战斗');

  // 5. UI: 军械库显示词条行
  var ui = await page.evaluate(function() {
    var g = window.__game;
    V60UI.showPage('v60-armory-page'); V60UI.renderArmory(g);
    var txt = document.getElementById('v118-armory-hero').textContent;
    return { affix: txt.indexOf('词条') >= 0, evolved: txt.indexOf('已进化') >= 0 };
  });
  assert(ui.affix && ui.evolved, '军械库显示词条/进化');

  // 6. 持久化
  var snap = await page.evaluate(function() {
    return JSON.stringify({ w: window.__game.profile.data.weapon, evo: window.__game.profile.data.weaponEvolved, ax: window.__game.profile.data.weaponAffix });
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  var after = await page.evaluate(function() {
    return JSON.stringify({ w: window.__game.profile.data.weapon, evo: window.__game.profile.data.weaponEvolved, ax: window.__game.profile.data.weaponAffix });
  });
  assert(snap === after, '武器/进化/词条持久化');

  var realErrors = pageErrors.filter(function(e) { return e.indexOf('favicon') < 0; });
  if (!realErrors.length) ok('全程无页面JS错误');
  else for (var i = 0; i < realErrors.length; i++) bad('页面错误: ' + realErrors[i]);

  console.log('\n========================');
  console.log('V11.3 武器深化E2E: 通过 ' + passCount + ' / 失败 ' + failCount);
  if (bugs.length) { console.log('\nBUG:'); for (var bi = 0; bi < bugs.length; bi++) console.log('  [BUG] ' + bugs[bi]); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}
main().catch(function(e) { console.error('[FATAL]', e.message); process.exit(1); });
