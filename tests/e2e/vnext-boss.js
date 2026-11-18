// ===== VNext Boss 实战 E2E: 六种Boss体格 × 2轮完整战斗 =====
// 覆盖: 预警/出场动画/血条同步/技能真实伤害/阶段切换/护盾/召唤/吐液/跳劈/死亡结算/防重复死亡
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PORT = 8295;

let passCount = 0, failCount = 0, bugs = [];
const ok = m => { passCount++; console.log('  ✓ ' + m); };
const bad = m => { failCount++; bugs.push(m); console.log('  ✗ ' + m); };
const assert = (c, m) => c ? ok(m) : bad(m);

const STYLES = ['bruiser', 'bulwark', 'hivelord', 'overlord', 'titan', 'spitking'];
const ROUNDS = 2;

async function main() {
  var cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
    { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  var browser = await chromium.launch({ headless: true, channel: 'msedge' });
  var page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  var pageErrors = [];
  page.on('pageerror', function(e) { pageErrors.push(e.message.slice(0, 160)); });
  await page.goto('http://localhost:' + PORT + '/index.html?vboss=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(function() { return window.__game && window.__game.squad.renderer; }, { timeout: 30000 });
  ok('游戏启动');

  // 一次性清档
  await page.evaluate(function() {
    var g = window.__game;
    g.profile._storage.remove('profile_v51');
    g.profile = new GameProfile(g.profile._storage, g.profile._raw);
    g.squad.profile = g.profile;
  });

  for (var si = 0; si < STYLES.length; si++) {
    var style = STYLES[si];
    for (var round = 1; round <= ROUNDS; round++) {
      var r = await page.evaluate(function(payload) {
        var g = window.__game;
        g.start(); // 重置战场
        RandomEvents._t = 9999; // 隔离随机事件(战地医疗回填人数, 干扰伤亡断言)
        g.enemies.bossStyle = payload.style;
        g.squad.setCount(20); // 弱火力小队: Boss存活足够久展示全部技能
        g.pacing.waves = []; // 只测Boss单挑
        var warning = document.getElementById('boss-warning');
        g._showBossWarning(true);
        var warningShown = warning && !warning.classList.contains('hidden');
        var boss = g.pacing.spawnFn('boss', CONFIG.LANE_X[1], g.squad.z - 14, 0);
        var out = { warningShown: warningShown, spawnT0: boss.spawnT, style: boss.artStyle };
        var observations = {
          spawnAnimDone: false, hpBarSynced: false, soldierLost: false,
          phaseSeen: 1, shieldSeen: false, summonSeen: false, spitSeen: false,
          slamSeen: false, died: false, repeatDamageBlocked: false,
          corpseRemoved: false, bossRefCleared: false
        };
        var lastFill = null, fillChanged = false, count0 = g.squad.count;
        var f = 0;
        for (f = 0; f < 3600 && boss.alive; f++) {
          g._update(1/30);
          if (boss.spawnT >= 1) observations.spawnAnimDone = true;
          // 阶段: overlord 5秒压血到30%强制终局阶段(三阶段链路), 其余自然过渡
          if (f === 150 && payload.style === 'overlord') boss.hp = Math.min(boss.hp, boss.maxHp * 0.3);
          if (boss.phaseIndex > observations.phaseSeen) observations.phaseSeen = boss.phaseIndex;
          if (boss.shieldT > 0) observations.shieldSeen = true;
          if (g.enemies.aliveCount > 1) observations.summonSeen = true;
          if (g.enemies.spits.length > 0) observations.spitSeen = true;
          if (boss.pendingAttack) observations.slamSeen = true;
          if (g.squad.count < count0) observations.soldierLost = true;
          var bar = document.getElementById('boss-bar-fill');
          if (bar) {
            var w = bar.style.width;
            if (lastFill !== null && w !== lastFill) fillChanged = true;
            lastFill = w;
          }
        }
        observations.fightFrames = f;
        // Boss战期间士兵必须掉过(真实伤害)
        observations.hpBarSynced = fillChanged;
        if (boss.alive) {
          // 兜底击杀: 验证死亡链路
          boss.takeDamage(999999, g.effects, boss.x, false);
          for (var k = 0; k < 90 && boss.alive; k++) g._update(1/30);
        }
        observations.died = !boss.alive;
        observations.repeatDamageBlocked = boss.takeDamage(999999, g.effects, boss.x, false) === false;
        for (var k2 = 0; k2 < 120 && !boss.removeReady; k2++) g._update(1/30);
        // bossKills 在 manager.update 死亡处理中结算 — 必须在尸体流程后读取
        observations.corpseRemoved = !!boss.removeReady;
        observations.bossRefCleared = g.enemies.boss === null;
        observations.bossKills = g.enemies.bossKills || 0;
        out.obs = observations;
        out.squadEnd = g.squad.count;
        out.count0 = count0;
        return out;
      }, { style: style });

      var label = style + ' R' + round;
      assert(r.warningShown, label + ' 预警横幅');
      assert(r.obs.spawnAnimDone, label + ' 出场动画完成');
      assert(r.obs.hpBarSynced, label + ' 血条同步变化');
      assert(r.obs.soldierLost, label + ' Boss造成真实士兵伤亡(' + r.count0 + '→' + r.squadEnd + ')');
      assert(r.obs.died, label + ' 死亡(' + r.obs.fightFrames + '帧)');
      assert(r.obs.repeatDamageBlocked, label + ' 尸体不可重复受伤');
      assert(r.obs.corpseRemoved, label + ' 尸体动画后移除');
      assert(r.obs.bossRefCleared, label + ' boss引用清空');
      assert(r.obs.bossKills >= round, label + ' bossKills计数(' + r.obs.bossKills + ')');
      // 体格特征
      if (style === 'bulwark' || style === 'overlord') assert(r.obs.shieldSeen, label + ' 护盾技能');
      if (style === 'hivelord') assert(r.obs.summonSeen, label + ' 召唤技能');
      if (style === 'spitking') assert(r.obs.spitSeen, label + ' 吐液技能');
      if (style === 'bruiser' || style === 'titan') assert(r.obs.slamSeen, label + ' 跳劈预警');
      if (style === 'overlord') assert(r.obs.phaseSeen >= 3, label + ' 三阶段推进(至P' + r.obs.phaseSeen + ')');
    }
  }

  var realErrors = pageErrors.filter(function(e) { return e.indexOf('favicon') < 0; });
  if (!realErrors.length) ok('全程无页面JS错误');
  else for (var i = 0; i < realErrors.length; i++) bad('页面错误: ' + realErrors[i]);

  console.log('\n========================');
  console.log('Boss实战E2E: 通过 ' + passCount + ' / 失败 ' + failCount);
  if (bugs.length) { console.log('\nBUG:'); for (var bi = 0; bi < bugs.length; bi++) console.log('  [BUG] ' + bugs[bi]); }
  await browser.close();
  cp.kill();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(function(e) { console.error('[FATAL]', e.message); process.exit(1); });
