// ===== V4.0 节奏控制器单测 =====
// 覆盖: 波次激活/分批生成间隔/场上上限/波次清除/Boss预警与延迟出场/关卡缩放

module.exports.run = function(ctx) {
    const { describe, test, assert, assertEq } = ctx;

    function makeLevel() {
        return {
            segments: [
                { type: 'wave', z: -38, enemies: [ { type: 'normal', count: 6 }, { type: 'fast', count: 3 } ] },
                { type: 'wave', z: -66, enemies: [ { type: 'shield', count: 2 } ] },
                { type: 'boss', z: -140, boss: { type: 'boss', hp: 300 } }
            ]
        };
    }

    function makeCtl(levelIndex) {
        var p = new GamePacingController(null);
        p.loadFromLevel(makeLevel(), levelIndex || 0);
        var spawned = [];
        p.spawnFn = function(type, x, z, hp) { spawned.push({ type: type, x: x, z: z, hp: hp }); return {}; };
        p.aliveCountFn = function() { return p._aliveOverride !== undefined ? p._aliveOverride : spawned.length; };
        return { p: p, spawned: spawned };
    }

    describe('GamePacingController 波次构建', () => {
        test('从关卡segments生成波次计划', () => {
            var { p } = makeCtl(0);
            assertEq(p.waves.length, 3, '2波+1boss');
            assertEq(p.waves[0].queue.length, 9, '6普通+3快速');
            assertEq(p.waves[0].triggerZ, -38 + CONFIG.PACING.waveTriggerAhead);
            assertEq(p.waves[2].triggerZ, -140 + CONFIG.PACING.bossTriggerAhead);
            assertEq(p.waves[2].hp, 300, 'Boss血量覆盖');
        });
        test('clear清空', () => {
            var { p } = makeCtl(0);
            p.clear();
            assertEq(p.waves.length, 0);
        });
    });

    describe('波次激活与分批生成', () => {
        test('未到triggerZ不激活', () => {
            var { p, spawned } = makeCtl(0);
            var squad = { z: -20 }; // trigger=-24
            for (var i = 0; i < 20; i++) p.update(0.1, squad);
            assertEq(spawned.length, 0, '不应生成');
            assertEq(p.waves[0].state, 'idle');
        });
        test('到达triggerZ激活, 首批延迟firstContactGrace后生成1-4只', () => {
            var { p, spawned } = makeCtl(0);
            var squad = { z: -24 };
            p.update(0.1, squad);
            assertEq(p.waves[0].state, 'spawning', '已激活');
            assertEq(spawned.length, 0, '激活帧不生成(观察窗口)');
            p.update(CONFIG.PACING.firstContactGrace + 0.01, squad);
            assert(spawned.length >= 1 && spawned.length <= CONFIG.PACING.batchSizeMax, '首批1-4只: ' + spawned.length);
        });
        test('批次间隔≥spawnIntervalMin', () => {
            var { p, spawned } = makeCtl(0);
            var squad = { z: -24 };
            p.update(0.1, squad);                                    // 激活帧
            p.update(CONFIG.PACING.firstContactGrace + 0.01, squad); // 首批
            var afterFirst = spawned.length;
            var queuedAfterFirst = p.waves[0].queue.length;
            var pendingAfterFirst = p.waves[0].pending.length;
            assert(afterFirst >= 1, '首批已生成');
            p.update(CONFIG.PACING.spawnIntervalMin - 0.05, squad); // 不足间隔
            // V4.2 members of the admitted batch stream over time. The main
            // queue must not admit another batch before the configured gap.
            assertEq(p.waves[0].queue.length, queuedAfterFirst, '间隔内不能从主队列生成新批');
            assert(spawned.length <= afterFirst + pendingAfterFirst, '只能释放上一批待出场成员');
        });
        test('场上活敌达上限时暂停生成', () => {
            var { p, spawned } = makeCtl(0);
            p._aliveOverride = CONFIG.MAX_ALIVE[0]; // V5.1: 25只活敌(L1上限)
            var squad = { z: -24 };
            p.update(CONFIG.PACING.firstContactGrace + 0.5, squad);
            p.update(CONFIG.PACING.spawnIntervalMax + 0.1, squad);
            assertEq(spawned.length, 0, '达到上限不生成');
        });
        test('队列耗尽→clearing→alive归零→done+回调', () => {
            var { p, spawned } = makeCtl(0);
            var cleared = 0;
            p.onWaveClear = function() { cleared++; };
            var squad = { z: -24 };
            p._aliveOverride = 0;
            // 大步推进直到队列清空
            for (var i = 0; i < 60 && p.waves[0].state !== 'clearing'; i++) p.update(0.5, squad);
            assertEq(p.waves[0].state, 'clearing', '队列耗尽进入clearing');
            assertEq(spawned.length, 9, '全部生成');
            p.update(0.1, squad);
            assertEq(p.waves[0].state, 'done');
            assertEq(cleared, 1, '波清回调触发');
        });
        test('生成位置在队伍前方屏幕外(11~11+纵深)', () => {
            var { p, spawned } = makeCtl(0);
            var squad = { z: -24 };
            p.update(CONFIG.PACING.firstContactGrace + 0.5, squad);
            for (var i = 0; i < spawned.length; i++) {
                assert(spawned[i].z <= -35 && spawned[i].z >= -35 - CONFIG.PACING.spawnDepth,
                    'z=' + spawned[i].z + ' 应在队伍前方屏幕外');
                assert(Math.abs(spawned[i].x) <= 2.4 + 0.4, 'x在跑道附近');
            }
        });
    });

    describe('Boss节奏', () => {
        test('bossTriggerAhead触发预警→bossWarningTime延迟→屏幕外出生', () => {
            var { p, spawned } = makeCtl(0);
            // 隔离前序波次(它们的位置触发在boss之前会先行激活)
            p.waves[0].state = 'done';
            p.waves[1].state = 'done';
            var warned = 0, spawnCb = 0;
            p.onBossWarning = function() { warned++; };
            p.onBossSpawn = function() { spawnCb++; };
            var squad = { z: -140 + CONFIG.PACING.bossTriggerAhead }; // 恰好触发
            p.update(0.05, squad);
            assertEq(warned, 1, '预警回调');
            assertEq(spawned.length, 0, '预警期不生成');
            assertEq(p.waves[2].state, 'warning');
            p.update(CONFIG.PACING.bossWarningTime + 0.05, squad);
            assertEq(spawnCb, 1, '出场回调');
            assertEq(spawned.length, 1, 'Boss生成');
            assertEq(spawned[0].type, 'boss');
            assertEq(spawned[0].hp, 300, '血量传入');
            assertEq(spawned[0].z, -140 + CONFIG.PACING.bossSpawnSetback, '出生点向屏幕外后退');
            assertEq(p.waves[2].state, 'done');
        });
    });

    describe('关卡缩放', () => {
        test('maxAlive按V5.1尸潮矩阵逐关取值(越界取末档)', () => {
            var { p } = makeCtl(0);
            assertEq(p._maxAlive(), CONFIG.MAX_ALIVE[0], 'L1=25');
            var p5 = makeCtl(4).p;
            assertEq(p5._maxAlive(), CONFIG.MAX_ALIVE[4], 'L5=60');
            var p9 = makeCtl(8).p;
            assertEq(p9._maxAlive(), CONFIG.MAX_ALIVE[CONFIG.MAX_ALIVE.length - 1], '越界取末档60');
        });
        test('V5.1防线锚点: 激活波次后stopZ=波点+defenseStandoff', () => {
            var { p } = makeCtl(0);
            p.update(0.05, { z: -25 }); // 越过triggerZ(-24)激活首波
            assertEq(p.frontierStopZ(), p.waves[0].z + CONFIG.PACING.defenseStandoff, '防线在波点前方9单位');
        });
        test('批次规模不超过有效上限', () => {
            var { p } = makeCtl(9);
            for (var i = 0; i < 30; i++) {
                var b = p._batchSize();
                assert(b >= 1 && b <= CONFIG.PACING.batchSizeMax, '批次' + b);
            }
        });
        test('时间驱动与帧率无关(0.5s×2步 == 1.0s×1步激活状态)', () => {
            var a = makeCtl(0), b2 = makeCtl(0);
            var squad = { z: -24 };
            a.p.update(0.5, squad); a.p.update(0.5, squad);
            b2.p.update(1.0, squad);
            assertEq(a.p.waves[0].state, b2.p.waves[0].state, '状态一致');
        });
    });
};
