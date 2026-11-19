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
    });

    describe('V5.1 防守不后退', () => {
        test('V5.1.1持续推进: 无combatAdvance/无停驻字段(行进中交火)', () => {
            assertEq(CONFIG.PACING.combatAdvance, undefined, '旧combatAdvance已移除');
            assertEq(CONFIG.PACING.defenseStandoff, undefined, '停驻字段已移除(玩家反馈后退感)');
        });
        test('怪群在军团前方涌现且成堆(纵深收紧)', () => {
            assert(CONFIG.PACING.spawnDepth >= 6 && CONFIG.PACING.spawnDepth <= 8, '纵深6-8: 团块感');
            assert(CONFIG.PACING.batchSizeBase >= 4, '批量≥4成堆涌现');
            
        });
        test('MAX_ALIVE尸潮矩阵覆盖十关且非递减(V5.1.5: L1=70; V10 QA: 随V8扩关补齐L6-L10)', () => {
            assertEq(CONFIG.MAX_ALIVE[0], 70, 'L1=70');
            assertEq(CONFIG.MAX_ALIVE[4], 240, 'L5=240(Boss关竞速校准, ≤L4的260)');
            assertEq(CONFIG.MAX_ALIVE.length, LEVELS.length, '覆盖全部关卡(原5项靠钳制使L6-L10复用L5)');
            for (var i = 1; i < CONFIG.MAX_ALIVE.length; i++) {
                if (i === 4) continue; // L4=260→L5=240 Boss关竞速校准特例(V5.1.5)
                assert(CONFIG.MAX_ALIVE[i] >= CONFIG.MAX_ALIVE[i - 1], 'L' + (i + 1) + '上限非递减');
            }
        });
        test('怪群生成于军团前方(行进中迎面相遇)', () => {
            // spawn点=squad.z-11..-(11+spawnDepth): 始终在前进方向前方
            assert(CONFIG.PACING.spawnDepth >= 6, '迎面涌现纵深');
            assert(CONFIG.PACING.fillFrameInterval <= 0.01 && CONFIG.PACING.fillFrameInterval > 0, '填充预算有效');
            assert(CONFIG.PACING.trickleInterval >= 0.12, '涓流施压有效');
        });
    });
};
