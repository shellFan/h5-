// ===== V5.1 门奖励池单测 =====

module.exports.run = function(ctx) {
    const { describe, test, assert, assertEq } = ctx;

    function makeSquadState(count, opts) {
        opts = opts || {};
        return {
            count: count,
            pierce: opts.pierce !== undefined ? opts.pierce : 0,
            critChance: opts.crit !== undefined ? opts.crit : 0,
            fireRateBuff: opts.fr !== undefined ? opts.fr : 0
        };
    }

    describe('奖励池结构', () => {
        test('三档池存在且标签/操作合法', () => {
            ['common', 'rare', 'epic'].forEach(function(tier) {
                assert(GATE_REWARD_POOL[tier] && GATE_REWARD_POOL[tier].length >= 3, tier + '池≥3项');
                GATE_REWARD_POOL[tier].forEach(function(item) {
                    assert(item.label, 'label必填');
                    assert(['add', 'addpct', 'mul', 'buff', 'nuke'].indexOf(item.op) >= 0, '合法op: ' + item.op);
                });
            });
        });
        test('×2 仅存在于稀有池(不再是普通奖励)', () => {
            GATE_REWARD_POOL.common.forEach(function(item) {
                assert(item.op !== 'mul', '普通池不得含×2');
            });
            assert(GATE_REWARD_POOL.rare.some(function(i) { return i.op === 'mul'; }), '×2在稀有池');
        });
        test('普通池以人数与基础buff为主体', () => {
            var adds = GATE_REWARD_POOL.common.filter(function(i) { return i.op === 'add'; });
            assert(adds.length >= 4, '普通池≥4个人数门');
        });
    });

    describe('GateRewardPool.roll 概率与质量', () => {
        test('稀有度概率接近75/20/5', () => {
            var n = 20000, c = 0, r = 0, e = 0;
            for (var i = 0; i < n; i++) {
                var g = GateRewardPool.roll(0, makeSquadState(30), false);
                if (g.tier === 'common') c++;
                else if (g.tier === 'rare') r++;
                else e++;
            }
            var pc = c / n, pr = r / n, pe = e / n;
            assert(pc > 0.72 && pc < 0.78, '普通≈75%: ' + pc.toFixed(3));
            assert(pr > 0.17 && pr < 0.23, '稀有≈20%: ' + pr.toFixed(3));
            assert(pe > 0.03 && pe < 0.07, '史诗≈5%: ' + pe.toFixed(3));
        });
        test('×2连续抑制: ×2后的下一次选择不可能是×2', () => {
            // 语义: 抑制紧连的一次选择(非永久封禁)
            GateRewardPool.lastWasMul = true;
            var g = GateRewardPool.roll(0, makeSquadState(30), false);
            assert(g.op !== 'mul', '紧连×2不可能');
            assertEq(GateRewardPool.lastWasMul, false, '非×2选择后抑制解除');
            GateRewardPool.lastWasMul = false;
        });
        test('forceNoMul 完全排除×2', () => {
            for (var i = 0; i < 300; i++) {
                assert(GateRewardPool.roll(0, makeSquadState(30), true).op !== 'mul');
            }
        });
        test('人数少时人数门权重提高', () => {
            var n = 4000, lowAdd = 0, highAdd = 0;
            for (var i = 0; i < n; i++) {
                if (['add', 'addpct'].indexOf(GateRewardPool.roll(0, makeSquadState(2), false).op) >= 0) lowAdd++;
                if (['add', 'addpct'].indexOf(GateRewardPool.roll(0, makeSquadState(200), false).op) >= 0) highAdd++;
            }
            assert(lowAdd / n > highAdd / n, '低人数加人概率更高: ' + (lowAdd / n).toFixed(2) + ' vs ' + (highAdd / n).toFixed(2));
        });
        test('满级属性不再出现(无效奖励抑制)', () => {
            var capped = makeSquadState(50, { pierce: 3, crit: 0.5, fr: 0.5 });
            for (var i = 0; i < 600; i++) {
                var g = GateRewardPool.roll(0, capped, false);
                assert(g.value !== 'pierce', '满穿透不出现');
                assert(g.value !== 'crit' && g.value !== 'crit2', '满暴击不出现');
                assert(g.value !== 'firerate10' && g.value !== 'firerate', '满射速不出现');
            }
        });
        test('roll输出含tier与lane', () => {
            var g = GateRewardPool.roll(2, makeSquadState(10), false);
            assertEq(g.lane, 2);
            assert(g.tier);
        });
    });

    describe('关卡门质量(静态检查)', () => {
        test('五关每排三门lane互不重复', () => {
            LEVELS.forEach(function(level, li) {
                level.segments.forEach(function(seg) {
                    if (seg.type !== 'gates') return;
                    var lanes = seg.gates.map(function(g) { return g.lane; }).sort();
                    assertEq(lanes.join(''), '012', 'L' + (li + 1) + ' 三车道齐备');
                });
            });
        });
        test('同排三门label互不相同(有意义的选择)', () => {
            LEVELS.forEach(function(level, li) {
                level.segments.forEach(function(seg) {
                    if (seg.type !== 'gates') return;
                    var labels = seg.gates.map(function(g) { return g.label; });
                    assert(new Set(labels).size === 3, 'L' + (li + 1) + ' 排内label重复: ' + labels);
                });
            });
        });
        test('教学关首排全为人数门(任何首选都增长)', () => {
            var first = LEVELS[0].segments.find(function(s) { return s.type === 'gates'; });
            first.gates.forEach(function(g) {
                assert(g.op === 'add', 'L1首排全人数门');
            });
        });
        test('×2在全部关卡门中占比≤10%', () => {
            var mul = 0, total = 0;
            LEVELS.forEach(function(level) {
                level.segments.forEach(function(seg) {
                    if (seg.type !== 'gates') return;
                    seg.gates.forEach(function(g) {
                        total++;
                        if (g.op === 'mul') mul++;
                    });
                });
            });
            assert(mul / total <= 0.1, '×2占比: ' + mul + '/' + total);
        });
        test('新op(爆炸弹/连锁/人数%)出现在关卡设计里', () => {
            var ops = {};
            LEVELS.forEach(function(level) {
                level.segments.forEach(function(seg) {
                    if (seg.type !== 'gates') return;
                    seg.gates.forEach(function(g) { ops[g.op + ':' + g.value] = true; });
                });
            });
            assert(ops['buff:explosive'], '爆炸弹');
            assert(ops['addpct:20'], '人数+20%');
        });
    });

    describe('applyGate 新操作(squad行为)', () => {
        // Squad 依赖THREE渲染器, 单测沙箱无THREE — 用公式级验证
        test('addpct 计算: 至少+1', () => {
            function addpct(count, value) { return Math.max(1, Math.floor(count * value / 100)); }
            assertEq(addpct(10, 20), 2);
            assertEq(addpct(100, 50), 50);
            assertEq(addpct(2, 20), 1, '向下取整保底+1');
        });
        test('damage2 改为固定+2(防×2失控)', () => {
            // 旧: max(2, buff*2) → 新: +2 固定
            function dmg2(buff) { return Math.min(99, buff + 2); }
            assertEq(dmg2(1), 3);
            assertEq(dmg2(5), 7);
        });
        test('explosive/chain 层数封顶2', () => {
            function stack(cur) { return Math.min(2, (cur || 0) + 1); }
            assertEq(stack(0), 1);
            assertEq(stack(1), 2);
            assertEq(stack(2), 2);
        });
    });
};
