// ===== 数值模拟驱动器 (V3.3) =====
// 确定性随机种子 + 固定时间步驱动真实游戏引擎, 模拟不同选门策略通关10关
// 输出: window.__simResults
(function() {
    // 可复现随机: LCG 替换 Math.random (模拟期间)
    var _origRandom = Math.random;
    var _seed = 1;
    function seededRandom() {
        _seed = (_seed * 1664525 + 1013904223) >>> 0;
        return _seed / 4294967296;
    }

    // 策略: 返回该次经过门排时应选的lane索引
    // 注意: gates.js的门包装对象结构为 { data: {lane, op, value}, z, x, ... }
    var STRATEGIES = {
        // 总是选最左门
        left: function(gates, squad) { return gates[0].data.lane; },
        // 总是选最右门
        right: function(gates, squad) { return gates[gates.length - 1].data.lane; },
        // 贪心: 优先乘法门 > 大额加法门 > buff门
        greedy: function(gates, squad) {
            var best = gates[0], bestScore = -1;
            for (var i = 0; i < gates.length; i++) {
                var g = gates[i].data;
                var score = 0;
                if (g.op === 'mul') score = squad.count * (g.value - 1);
                else if (g.op === 'add') score = g.value;
                else if (g.op === 'risk') score = -squad.count * 0.3 + 30;
                else if (g.value === 'damage2') score = squad.count > 12 ? 20 : 0;
                else score = squad.count > 8 ? 10 : 2;
                if (score > bestScore) { bestScore = score; best = g; }
            }
            return best.lane;
        },
        // 均衡: 轮流人数/输出/射速
        balanced: function(gates, squad) {
            var wantBuff = (squad.count > 20) && (squad.damageBuff < 3 || squad.fireRateBuff < 0.4);
            for (var i = 0; i < gates.length; i++) {
                var gd = gates[i].data;
                if (wantBuff && gd.op === 'buff') return gd.lane;
                if (!wantBuff && gd.op !== 'buff') return gd.lane;
            }
            return gates[0].data.lane;
        },
        // 随机(种子确定)
        random: function(gates, squad) {
            return gates[Math.floor(seededRandom() * gates.length)].data.lane;
        }
    };

    var DT = 0.033;
    var MAX_STEPS = 9000; // ~5分钟游戏时间上限

    function simulateRun(game, levelIndex, strategyName, seed) {
        _seed = seed;
        Math.random = seededRandom;
        game.levelIndex = levelIndex;
        game.start();
        game.paused = false;
        var g = game;
        var steps = 0;
        var targetLane = 1;
        var result = null;

        while (steps < MAX_STEPS) {
            // 策略: 检查前方最近的未触发门排, 决定目标lane
            var nearestGateRow = null;
            for (var i = 0; i < g.gates.gates.length; i++) {
                var gate = g.gates.gates[i];
                if (!gate.triggered && gate.z < g.squad.z - 1 && gate.z > g.squad.z - 14) {
                    if (!nearestGateRow || gate.z < nearestGateRow.z) nearestGateRow = gate;
                }
            }
            if (nearestGateRow && !nearestGateRow.decided) {
                // 同一排门: 找到同z的门集合
                var row = [nearestGateRow];
                for (var j = 0; j < g.gates.gates.length; j++) {
                    if (j !== i && Math.abs(g.gates.gates[j].z - nearestGateRow.z) < 1 && !g.gates.gates[j].triggered) {
                        row.push(g.gates.gates[j]);
                    }
                }
                var laneChoices = STRATEGIES[strategyName](row, g.squad);
                targetLane = laneChoices;
                nearestGateRow.decided = true;
            }
            g.squad.lane = targetLane;
            g.squad.targetX = CONFIG.LANE_X[targetLane];

            g._updateInner(DT);
            steps++;
            if (g.state === 'won' || g.state === 'lost') break;
        }

        Math.random = _origRandom;
        result = {
            level: levelIndex + 1,
            strategy: strategyName,
            win: g.state === 'won',
            time: +(steps * DT).toFixed(1),
            maxCount: g.maxCount,
            maxCombo: g.maxCombo,
            kills: g.enemies.killCount,
            endCount: g.squad.count,
            damageBuff: g.squad.damageBuff,
            fireRateBuff: +g.squad.fireRateBuff.toFixed(2),
            stepsCapped: steps >= MAX_STEPS
        };
        return result;
    }

    /** 运行完整模拟: 策略×关卡×种子 */
    function runFullSimulation() {
        var g = window.__game;
        if (!g) return { error: 'game not ready' };
        var strategies = ['left', 'right', 'greedy', 'balanced', 'random'];
        var results = [];
        for (var li = 0; li < LEVELS.length; li++) {
            for (var si = 0; si < strategies.length; si++) {
                var r = simulateRun(g, li, strategies[si], 12345 + li * 17 + si * 3);
                results.push(r);
            }
        }
        // 汇总
        var summary = {};
        strategies.forEach(function(s) {
            var rs = results.filter(function(r) { return r.strategy === s; });
            summary[s] = {
                wins: rs.filter(function(r) { return r.win; }).length + '/10',
                avgTime: +(rs.reduce(function(a, r) { return a + r.time; }, 0) / rs.length).toFixed(0),
                failAt: rs.filter(function(r) { return !r.win; }).map(function(r) { return 'L' + r.level; }).join(',')
            };
        });
        window.__simResults = { results: results, summary: summary };
        return window.__simResults;
    }

    window.__runSimulation = runFullSimulation;
    window.__simulateRun = simulateRun;
    var log = document.getElementById('log');
    if (log) log.textContent = '模拟驱动器就绪。调用 __runSimulation() 开始。';
})();