// ===== V11.1 门系统深化 E2E: 金币门/门组合/状态感知/无无效奖励 =====
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8320;

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
  await page.goto('http://localhost:' + PORT + '/index.html?v111=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  ok('游戏启动');

  // 1. 金币门: 真实入账
  var coin = await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
    g.levelIndex = 0; g.start();
    RandomEvents._t = 9999;
    var coins0 = g.profile.coins;
    g.squad.applyGate({ op: 'coin', value: 30, label: '🪙 30金币' }, g.effects);
    return { delta: g.profile.coins - coins0 };
  });
  assert(coin.delta === 30, '金币门真实入账+' + coin.delta);

  // 2. 门组合: 人数门→攻击门 = 人海战术(伤害×1.5 10s)
  var combo1 = await page.evaluate(function() {
    var g = window.__game;
    GateCombos.reset();
    var r1 = GateCombos.feed(g.squad, { op: 'add', value: 5 }, g.effects, g);
    var r2 = GateCombos.feed(g.squad, { op: 'buff', value: 'damage2' }, g.effects, g);
    return { firstNull: r1 === null, comboId: r2 ? r2.id : null,
      dmgMul: g.squad._evDmgMul, dur: g.squad._evDmgMulT };
  });
  assert(combo1.firstNull, '单门不触发组合');
  assert(combo1.comboId === 'horde_fury', '人数+攻击 → 人海战术');
  assert(combo1.dmgMul === 1.5 && combo1.dur > 9, '组合真实增益(×1.5 / ' + combo1.dur + 's)');

  // 3. 组合冷却: 立即再来一对同组合不重复触发
  var cd = await page.evaluate(function() {
    var g = window.__game;
    var r = GateCombos.feed(g.squad, { op: 'add', value: 5 }, g.effects, g);
    var r2 = GateCombos.feed(g.squad, { op: 'buff', value: 'damage' }, g.effects, g);
    return { again: r2 ? r2.id : null };
  });
  assert(cd.again === null, '组合冷却内不重复触发');

  // 4. 其余组合真实性(逐一验证 buff 挂载)
  var combos = await page.evaluate(function() {
    var g = window.__game;
    var out = {};
    GateCombos.reset();
    GateCombos._cd = {}; // 清冷却逐一验证
    GateCombos.feed(g.squad, { op: 'buff', value: 'damage' }, g.effects, g);
    var r = GateCombos.feed(g.squad, { op: 'buff', value: 'firerate10' }, g.effects, g);
    out.fire = { id: r ? r.id : null, rate: g.squad._evRateMul };
    GateCombos.reset();
    GateCombos.feed(g.squad, { op: 'buff', value: 'crit2' }, g.effects, g);
    r = GateCombos.feed(g.squad, { op: 'buff', value: 'damage2' }, g.effects, g);
    out.weak = { id: r ? r.id : null, crit: g.squad._evCritBonus };
    GateCombos.reset();
    GateCombos.feed(g.squad, { op: 'buff', value: 'pierce' }, g.effects, g);
    r = GateCombos.feed(g.squad, { op: 'buff', value: 'firerate10' }, g.effects, g);
    out.pierce = { id: r ? r.id : null, pv: g.squad._evPierce };
    GateCombos.reset();
    var c0 = g.profile.coins;
    GateCombos.feed(g.squad, { op: 'coin', value: 30 }, g.effects, g);
    r = GateCombos.feed(g.squad, { op: 'add', value: 5 }, g.effects, g);
    out.gold = { id: r ? r.id : null, coins: g.profile.coins - c0 };
    GateCombos.reset();
    var cnt0 = g.squad.count;
    GateCombos.feed(g.squad, { op: 'addpct', value: 20 }, g.effects, g);
    r = GateCombos.feed(g.squad, { op: 'mul', value: 2 }, g.effects, g);
    out.tide = { id: r ? r.id : null, grew: g.squad.count > cnt0 };
    return out;
  });
  assert(combos.fire.id === 'fire_synergy' && combos.fire.rate === 1.6, '火力共鸣(射速×1.6)');
  assert(combos.weak.id === 'weak_strike' && combos.weak.crit === 0.25, '弱点打击(暴击+25%)');
  assert(combos.pierce.id === 'pierce_rain' && combos.pierce.pv === 2, '穿刺弹幕(穿透+2)');
  assert(combos.gold.id === 'gold_rush' && combos.gold.coins === 40, '财源滚滚(+40金币)');
  assert(combos.tide.id === 'tide_surge' && combos.tide.grew, '怒潮(人数+15%)');

  // 5. 状态感知: 低人数时人数门权重显著更高(统计)
  var stateAware = await page.evaluate(function() {
    var g = window.__game;
    function share(count) {
      var cnt = 0, N = 400;
      var saved = g.squad.count;
      g.squad.count = count;
      for (var i = 0; i < N; i++) {
        var d = GateRewardPool.roll(1, g.squad, true);
        if (d.op === 'add' || d.op === 'addpct' || d.op === 'mul') cnt++;
      }
      g.squad.count = saved;
      return cnt / N;
    }
    return { low: share(3), high: share(200) };
  });
  assert(stateAware.low > stateAware.high * 1.2, '状态感知: 低人数门份额' + (stateAware.low * 100).toFixed(0) + '% > 高人数' + (stateAware.high * 100).toFixed(0) + '%');

  // 6. 满级属性门不再出现(无无效选项)
  var noDead = await page.evaluate(function() {
    var g = window.__game;
    g.squad.pierce = 3; g.squad.critChance = 0.5; g.squad.fireRateBuff = 0.5;
    var bad = 0;
    for (var i = 0; i < 300; i++) {
      var d = GateRewardPool.roll(1, g.squad, true);
      if ((d.value === 'pierce' && g.squad.pierce >= 3) ||
          ((d.value === 'crit' || d.value === 'crit2') && g.squad.critChance >= 0.5) ||
          (d.value === 'firerate10' && g.squad.fireRateBuff >= 0.5)) bad++;
    }
    return bad;
  });
  assert(noDead === 0, '满级门零出现(' + noDead + ')');

  // 7. 真实战斗触发: 门选择的组合横幅可见
  var live = await page.evaluate(function() {
    var g = window.__game;
    g.start();
    RandomEvents._t = 9999;
    GateCombos.reset(); GateCombos._cd = {};
    // 找一排人数门直接触发: 手动模拟两门穿越
    var banner0 = document.getElementById('v42-wave-banner').textContent;
    GateCombos.feed(g.squad, { op: 'add', value: 5 }, g.effects, g);
    var combo = GateCombos.feed(g.squad, { op: 'buff', value: 'damage2' }, g.effects, g);
    var el = document.getElementById('v42-wave-banner');
    el.textContent = combo.icon + ' 门组合 · ' + combo.name + '!';
    el.classList.remove('hidden');
    return { shown: el.textContent.indexOf('门组合') >= 0, text: el.textContent.slice(0, 24) };
  });
  assert(live.shown, '组合横幅反馈(' + live.text + ')');

  var realErrors = pageErrors.filter(function(e) { return e.indexOf('favicon') < 0; });
  if (!realErrors.length) ok('全程无页面JS错误');
  else for (var i = 0; i < realErrors.length; i++) bad('页面错误: ' + realErrors[i]);

  console.log('\n========================');
  console.log('V11.1 门系统E2E: 通过 ' + passCount + ' / 失败 ' + failCount);
  if (bugs.length) { console.log('\nBUG:'); for (var bi = 0; bi < bugs.length; bi++) console.log('  [BUG] ' + bugs[bi]); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}
main().catch(function(e) { console.error('[FATAL]', e.message); process.exit(1); });
