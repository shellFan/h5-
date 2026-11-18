// V8.0 十关平衡性模拟器: 每关按三档养成预算模拟真实战斗, 输出胜率/存活曲线
// 用法: node tools/v80-balance-sim.js [--levels=0-9] [--runs=2] [--budget=normal]
const { chromium } = require('playwright-core');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 8272;

const args = process.argv.slice(2);
const getArg = (k, d) => { const m = args.find(a => a.startsWith('--' + k + '=')); return m ? m.split('=')[1] : d; };
const LEVEL_RANGE = getArg('levels', '0-9');
const RUNS = parseInt(getArg('runs', '2'), 10);
const BUDGET_MODE = getArg('budget', 'normal');

// 每关预期累计养成预算(金币): 按前一关奖励+日常推导的"自然成长"曲线
const NATURAL_BUDGET = [0, 200, 450, 750, 1100, 1600, 2200, 2900, 3700, 4600];
const RICH_BUDGET = NATURAL_BUDGET.map(c => Math.round(c * 2.2));

function budgetsFor(li) {
  if (BUDGET_MODE === 'natural') return [NATURAL_BUDGET[li]];
  if (BUDGET_MODE === 'rich') return [RICH_BUDGET[li]];
  if (BUDGET_MODE === 'zero') return [0];
  return [NATURAL_BUDGET[li], RICH_BUDGET[li]]; // normal: 两档
}

async function main() {
  const [lo, hi] = LEVEL_RANGE.split('-').map(Number);
  var cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
    { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1200));
  var browser = await chromium.launch({ headless: true, channel: 'msedge' });
  var page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => console.log('[PAGEERR]', e.message.slice(0, 160)));
  await page.goto('http://localhost:' + PORT + '/index.html?bal=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });

  console.log('=== V8.0 平衡模拟 budget=' + BUDGET_MODE + ' runs=' + RUNS + ' levels=L' + (lo + 1) + '-L' + (hi + 1) + ' ===');

  for (var li = lo; li <= hi; li++) {
    const budgets = budgetsFor(li);
    for (var bi = 0; bi < budgets.length; bi++) {
      var budget = budgets[bi];
      var wins = 0, totalKills = 0, totalTime = 0, minCount = 999, peaks = 0;
      for (var run = 0; run < RUNS; run++) {
        var r = await page.evaluate(function(payload) {
          var g = window.__game;
          g.profile._storage.remove('profile_v51');
          g.profile = new GameProfile(g.profile._storage, g.profile._raw);
          g.squad.profile = g.profile;
          // 按预算购买养成: 先入账预算, 再按优先级消费
          g.profile.addCoins(payload.budget);
          var left = payload.budget;
          var spent = 0;
          function tryBuy(fn) { var before = g.profile.coins; if (fn()) { spent += before - g.profile.coins; return true; } return false; }
          var guard = 0;
          while (left - spent > 0 && guard++ < 120) {
            var gunLv = UpgradeShop.levelOf(g.profile, 'gun');
            var recLv = UpgradeShop.levelOf(g.profile, 'recruit');
            var bought = false;
            if (gunLv < 4) bought = tryBuy(function() { return UpgradeShop.purchase(g.profile, 'gun').ok; });
            else if (recLv < 8) bought = tryBuy(function() { return UpgradeShop.purchase(g.profile, 'recruit').ok; });
            else if (WeaponSystem.level(g.profile) < 3) bought = tryBuy(function() { return WeaponSystem.upgrade(g.profile).ok; });
            else if (SoldierGrowth.level(g.profile) < 10) bought = tryBuy(function() { return SoldierGrowth.upgrade(g.profile).ok; });
            else if (recLv < 12) bought = tryBuy(function() { return UpgradeShop.purchase(g.profile, 'recruit').ok; });
            else if (WeaponSystem.level(g.profile) < 4) bought = tryBuy(function() { return WeaponSystem.upgrade(g.profile).ok; });
            else if (SoldierGrowth.level(g.profile) < 25) bought = tryBuy(function() { return SoldierGrowth.upgrade(g.profile).ok; });
            else if (recLv < 16) bought = tryBuy(function() { return UpgradeShop.purchase(g.profile, 'recruit').ok; });
            else bought = tryBuy(function() { return UpgradeShop.purchase(g.profile, 'gun').ok; }) ||
                          tryBuy(function() { return UpgradeShop.purchase(g.profile, 'recruit').ok; });
            if (!bought) break;
          }
          g.levelIndex = payload.li;
          g.start();
          var t0 = g.elapsedTime;
          var steps = 0, minC = 999, peak = 0;
          while (g.state === 'playing' && (g.elapsedTime - t0) < payload.maxSec && steps < 90000) {
            // 门选择AI: 人数优先
            var gates = g.gates.gates, rowZ = null, i;
            for (i = 0; i < gates.length; i++) {
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
                var d = gt2.data, s = 0;
                if (d.op === 'mul') s = g.squad.count * (d.value - 1);
                else if (d.op === 'add') s = d.value;
                else if (d.op === 'addpct') s = Math.max(1, Math.floor(g.squad.count * d.value / 100));
                else if (d.op === 'skill') s = 10;
                else s = 4;
                if (s > bs) { bs = s; best = gt2; }
              }
              if (best) { g.squad.targetX = best.x; g.squad.lane = best.data.lane; }
            }
            g._update(1/30);
            steps++;
            if (g.squad.count < minC) minC = g.squad.count;
            if (g.squad.count > peak) peak = g.squad.count;
          }
          return { state: g.state, kills: g.enemies.killCount, t: +(g.elapsedTime - t0).toFixed(0),
            min: minC, peak: peak, reason: g.lastLoseReason || '' };
        }, { li: li, budget: budget, maxSec: 600 });
        if (r.state === 'won') wins++;
        totalKills += r.kills;
        totalTime += r.t;
        if (r.min < minCount || r.min === 999) { if (r.min < minCount) minCount = r.min; }
        peaks += r.peak;
        if (bi === budgets.length - 1 && run === 0) {
          console.log('  L' + (li + 1) + ' 🪙' + budget + ' run1: ' + r.state + ' kills=' + r.kills +
            ' t=' + r.t + 's peak=' + r.peak + (r.reason ? ' [' + r.reason + ']' : ''));
        }
      }
      var tag = budgets.length > 1 ? (bi === 0 ? '自然' : '富裕') : '预算' + budget;
      console.log('L' + (li + 1) + ' [' + tag + '] 胜率 ' + wins + '/' + RUNS +
        ' · 平均击杀 ' + Math.round(totalKills / RUNS) + ' · 平均用时 ' + Math.round(totalTime / RUNS) + 's' +
        ' · 最低存活 ' + (minCount === 999 ? '-' : minCount) + ' · 平均峰值 ' + Math.round(peaks / RUNS));
    }
  }
  console.log('=== 完成 ===');
  await browser.close();
  cp.kill();
}
main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
