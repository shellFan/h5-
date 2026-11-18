// ===== VNext 装备系统 E2E: 掉落/词条/穿戴/强化/分解/战斗关联/持久化/结算展示 =====
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8299;

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
  await page.goto('http://localhost:' + PORT + '/index.html?veq=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  ok('游戏启动');

  // 1. 掉落生成: 词条池合法/uid唯一/品质范围
  var drops = await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
    var made = [];
    for (var i = 0; i < 40; i++) made.push(EquipmentLoot._makeItem(i % 10, i % 5));
    var uids = {};
    var dup = false, badSlot = 0, badQ = 0, noAffix = 0, badAffix = 0;
    made.forEach(function(it) {
      if (uids[it.uid]) dup = true; uids[it.uid] = 1;
      if (EQUIP_SLOTS.indexOf(it.slot) < 0) badSlot++;
      if (it.quality < 0 || it.quality > 4) badQ++;
      var keys = Object.keys(it.affixes);
      if (!keys.length) noAffix++;
      for (var k in it.affixes) {
        var inPool = EQUIP_AFFIX_POOL.some(function(p) { return p.k === k; });
        if (!inPool) badAffix++;
      }
    });
    return { count: made.length, dup: dup, badSlot: badSlot, badQ: badQ, noAffix: noAffix, badAffix: badAffix,
      sample: made[0], highQAffix: made.filter(function(x) { return x.quality === 4; })[0] };
  });
  assert(drops.count === 40 && !drops.dup, '掉落40件uid唯一');
  assert(!drops.badSlot && !drops.badQ && !drops.noAffix && !drops.badAffix, '槽位/品质/词条全部合法');
  assert(drops.highQAffix && Object.keys(drops.highQAffix.affixes).length === 3, '传说装3词条');

  // 2. 入包+穿戴+战斗关联(stats与实际伤害)
  var combat = await page.evaluate(function() {
    var g = window.__game;
    g.profile.data.bag = [];
    var item = EquipmentLoot._makeItem(5, 3); // 强词条
    item.slot = 'helmet';
    item.affixes = { dmgBonus: 4, critBonus: 0.06 };
    item.affixLines = ['伤害 +4', '暴击率 +6%'];
    EquipmentLoot._store(g.profile, [item]);
    var bagCount = g.profile.data.bag.length;
    var dmgBefore = SoldierGrowth.stats(g.profile).dmgBonus || 0;
    var critBefore = SoldierGrowth.stats(g.profile).critBonus || 0;
    var r = EquipmentLoot.equipFromBag(g.profile, item.uid);
    g.levelIndex = 0; g.start();
    var dmgAfter = SoldierGrowth.stats(g.profile).dmgBonus || 0;
    var inBattle = g.squad.getDamage();
    return { bagCount: bagCount, equipOk: r.ok, dmgBefore: dmgBefore, dmgAfter: dmgAfter,
      critAfter: +SoldierGrowth.stats(g.profile).critBonus.toFixed(3), inBattle: inBattle };
  });
  assert(combat.bagCount === 1, '装备入包');
  assert(combat.equipOk, '穿戴成功');
  assert(combat.dmgAfter === combat.dmgBefore + 4, '词条进stats(+4伤害)');
  assert(combat.inBattle >= 1 + 4, '战斗伤害真实生效(输出' + combat.inBattle + ')');

  // 3. 同槽互换: 旧装备回背包
  var swap = await page.evaluate(function() {
    var g = window.__game;
    var item2 = EquipmentLoot._makeItem(5, 2);
    item2.slot = 'helmet'; item2.affixes = { dmgBonus: 2 }; item2.affixLines = ['伤害 +2'];
    EquipmentLoot._store(g.profile, [item2]);
    var bagBefore = g.profile.data.bag.length;
    EquipmentLoot.equipFromBag(g.profile, item2.uid);
    var bagAfter = g.profile.data.bag.length;
    var swapped = g.profile.data.equipment.helmet.uid === item2.uid;
    var oldBack = g.profile.data.bag.some(function(x) { return x.uid !== item2.uid && x.affixes && x.affixes.dmgBonus === 4; });
    var statsDropped = SoldierGrowth.stats(g.profile).dmgBonus === 2;
    return { bagBefore: bagBefore, bagAfter: bagAfter, swapped: swapped, oldBack: oldBack, statsDropped: statsDropped };
  });
  assert(swap.swapped && swap.bagAfter === swap.bagBefore, '同槽互换(新装上槽)');
  assert(swap.oldBack && swap.statsDropped, '旧装回包+属性切换(' + swap.bagBefore + '→' + swap.bagAfter + ')');

  // 4. 强化: 等级+1/扣币/属性放大(强化背包中dmg4件→穿戴→验证4×2=8)
  var enhance = await page.evaluate(function() {
    var g = window.__game;
    g.profile.addCoins(3000);
    var it = g.profile.data.bag[0]; // 旧装(dmgBonus 4)
    var r = EquipmentLoot.upgradeBagEquip(g.profile, it.uid);
    var equipR = EquipmentLoot.equipFromBag(g.profile, it.uid);
    var dmg1 = SoldierGrowth.stats(g.profile).dmgBonus; // = 4×2 = 8
    return { ok: r.ok, level: r.level, equipOk: equipR.ok, dmg1: dmg1, coins: g.profile.coins < 3000 };
  });
  assert(enhance.ok && enhance.level === 2 && enhance.equipOk, '强化+1并穿戴(等级' + enhance.level + ')');
  assert(enhance.dmg1 === 8, '强化词条放大(4×2=' + enhance.dmg1 + ')');
  assert(enhance.coins, '强化扣费');

  // 5. 分解: 出包+入账
  var sell = await page.evaluate(function() {
    var g = window.__game;
    var it = g.profile.data.bag[0];
    var coins0 = g.profile.coins;
    var r = EquipmentLoot.sellEquip(g.profile, it.uid);
    return { ok: r.ok, value: r.value, coins: g.profile.coins - coins0, bagLen: g.profile.data.bag.length };
  });
  assert(sell.ok && sell.coins === sell.value && sell.value > 0, '分解入账+' + sell.value);

  // 6. 通关掉落 → 结算面板展示
  var winDrop = await page.evaluate(function() {
    var g = window.__game;
    g.profile.data.bag = [];
    g.profile.save();
    g.levelIndex = 0; g.start();
    // 直接推到胜利
    g.squad.setCount(150); g.pacing.forceComplete();
    for (var f = 0; f < 2400 && g.state === 'playing'; f++) g._update(1/30);
    var bagNow = g.profile.data.bag.length;
    var row = document.getElementById('wc-drops-row');
    return { state: g.state, bagNow: bagNow, rowText: row ? row.textContent : '', drops: (g._drops || []).length };
  });
  assert(winDrop.state === 'won', 'L1胜利(掉落链路)');
  assert(winDrop.bagNow >= 1 && winDrop.drops >= 1, '胜利掉落' + winDrop.bagNow + '件');
  assert(winDrop.rowText.indexOf('装备掉落') >= 0, '结算面板掉落行(' + winDrop.rowText.slice(0, 40) + ')');

  // 7. 持久化
  var snap = await page.evaluate(function() {
    var b = window.__game.profile.data.bag;
    return JSON.stringify({ n: b.length, first: b[0] && b[0].uid, eq: !!window.__game.profile.data.equipment.helmet });
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  var after = await page.evaluate(function() {
    var b = window.__game.profile.data.bag;
    return JSON.stringify({ n: b.length, first: b[0] && b[0].uid, eq: !!window.__game.profile.data.equipment.helmet });
  });
  assert(snap === after, '背包/穿戴持久化(' + snap + '→' + after + ')');

  // 8. 训练中心背包UI渲染
  var bagUi = await page.evaluate(function() {
    var g = window.__game;
    V60UI.showPage('v60-train-page'); V60UI.renderTraining(g);
    var items = document.querySelectorAll('#v60-train-bag .v60-bag-item');
    var buttons = document.querySelectorAll('#v60-train-bag .v60-bag-btn');
    return { items: items.length, buttons: buttons.length };
  });
  assert(bagUi.items >= 1 && bagUi.buttons >= bagUi.items * 3, '背包UI渲染(件' + bagUi.items + ' 按钮' + bagUi.buttons + ')');

  var realErrors = pageErrors.filter(function(e) { return e.indexOf('favicon') < 0; });
  if (!realErrors.length) ok('全程无页面JS错误');
  else for (var i = 0; i < realErrors.length; i++) bad('页面错误: ' + realErrors[i]);

  console.log('\n========================');
  console.log('装备系统E2E: 通过 ' + passCount + ' / 失败 ' + failCount);
  if (bugs.length) { console.log('\nBUG:'); for (var bi = 0; bi < bugs.length; bi++) console.log('  [BUG] ' + bugs[bi]); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(function(e) { console.error('[FATAL]', e.message); process.exit(1); });
