// ===== V5.1 坐标方向单测 =====
// 验证 CONFIG.DIRS 唯一事实来源 + 运动学辅助 + 防守不后退

module.exports.run = function(ctx) {
    const { describe, test, assert, assertEq } = ctx;

    describe('CONFIG.DIRS 方向约定', () => {
        test('玩家前进为-Z, 怪物追击为+Z, 射击为-Z', () => {
            assertEq(CONFIG.DIRS.FORWARD_SIGN, -1, '玩家前进-Z');
            assertEq(CONFIG.DIRS.ENEMY_ADVANCE_SIGN, 1, '怪物追击+Z');
            assertEq(CONFIG.DIRS.SHOOT_SIGN, -1, '子弹-Z');
            assertEq(CONFIG.DIRS.GATE_PASS_SIGN, -1, '穿门-Z');
            assertEq(CONFIG.DIRS.CAMERA_SIDE, 1, '相机在防线+Z后方');
        });
        test('BattleKinematics.advanceZ: 前进使z递减', () => {
            assertEq(BattleKinematics.advanceZ(0, 3.3, 1), -3.3);
            assertEq(BattleKinematics.advanceZ(-10, 3.3, 0.5), -11.65);
        });
        test('BattleKinematics.enemyApproachZ: 怪物向防线(z增大)移动', () => {
            assertEq(BattleKinematics.enemyApproachZ(-20, 1.7, 1), -18.3);
            assert(BattleKinematics.enemyApproachZ(-20, 1.7, 5) > -20, '怪物z单调增(接近防线)');
        });
        test('BattleKinematics.bulletZ: 子弹z递减(射向前方怪群)', () => {
            assertEq(BattleKinematics.bulletZ(-9, 28, 0.1), -11.8);
        });
        test('atDefenseLine 判定', () => {
            assert(BattleKinematics.atDefenseLine(-11, -20, 9), 'z=-11 ≤ -20+9 → 抵达');
            assert(!BattleKinematics.atDefenseLine(-10.5, -20, 9), 'z=-10.5 > -11 → 未抵达');
        });
    });

    describe('V5.1 防守不后退', () => {
        test('PACING使用defenseStandoff(无combatAdvance)', () => {
            assert(CONFIG.PACING.defenseStandoff > 0, 'defenseStandoff配置存在');
            assertEq(CONFIG.PACING.combatAdvance, undefined, '旧combatAdvance已移除');
        });
        test('防线在波点前方(玩家不深入怪区)', () => {
            var waveZ = -50;
            var stopZ = waveZ + CONFIG.PACING.defenseStandoff;
            assert(stopZ > waveZ, '防线z大于波点z(波点更深入敌区)');
            assert(Math.abs(stopZ - waveZ) < CONFIG.PACING.waveTriggerAhead, 'standoff小于激活提前量');
        });
        test('MAX_ALIVE尸潮矩阵覆盖五关且递增', () => {
            assertEq(CONFIG.MAX_ALIVE.length, 5, '五关');
            for (var i = 1; i < CONFIG.MAX_ALIVE.length; i++) {
                assert(CONFIG.MAX_ALIVE[i] > CONFIG.MAX_ALIVE[i - 1], 'L' + (i + 1) + '上限递增');
            }
        });
        test('spawnDepth > defenseStandoff(怪从防线前方纵深出现)', () => {
            assert(CONFIG.PACING.spawnDepth > CONFIG.PACING.defenseStandoff, '怪群在防线前方生成');
        });
    });
};
