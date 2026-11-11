// ===== V4.0 移动手感单测 =====
// 覆盖: 拖动映射/灵敏度/边界钳制/帧率无关阻尼/门触发窗口不重叠

module.exports.run = function(ctx) {
    const { describe, test, assert, assertEq } = ctx;

    describe('MovementMath 拖动映射', () => {
        test('灵敏度: 拖过65%屏幕宽度 = 横穿全可玩范围', () => {
            var maxX = 2.6, cw = 390;
            var full = MovementMath.dragTarget(0, cw * CONFIG.MOVE.touchSensitivity, cw, maxX);
            assertEq(Math.round(full * 100) / 100, maxX, '整幅灵敏度拖动应恰好到达maxX');
        });
        test('锚点相对映射: 起点世界坐标 + 像素位移×worldPerPx', () => {
            var maxX = 2.6, cw = 390;
            var wpp = (maxX * 2) / (cw * CONFIG.MOVE.touchSensitivity);
            var t = MovementMath.dragTarget(-1.0, 100, cw, maxX);
            assertEq(Math.round(t * 1000) / 1000, Math.round((-1.0 + 100 * wpp) * 1000) / 1000, '映射公式一致');
        });
        test('反向拖动为负位移', () => {
            var t = MovementMath.dragTarget(0, -50, 390, 2.6);
            assert(t < 0, '向左拖动目标应为负');
        });
        test('目标钳制在±maxX内(超长拖动不越界)', () => {
            var t = MovementMath.dragTarget(0, 10000, 390, 2.6);
            assertEq(t, 2.6, '超长拖动钳制到maxX');
            var t2 = MovementMath.dragTarget(0, -10000, 390, 2.6);
            assertEq(t2, -2.6, '反向超长拖动钳制到-maxX');
        });
    });

    describe('MovementMath 键盘', () => {
        test('单步移动距离=keyStep', () => {
            var t = MovementMath.keyTarget(0, 1, 2.6);
            assertEq(t, CONFIG.MOVE.keyStep);
        });
        test('边界钳制', () => {
            var t = MovementMath.keyTarget(2.5, 1, 2.6);
            assert(t <= 2.6, '右移不超界');
        });
    });

    describe('MovementMath 中心边界(队伍宽度约束)', () => {
        test('小队伍全路自由移动', () => {
            var b = MovementMath.centerBounds(0.74);
            assertEq(Math.round(b * 100) / 100, Math.round((3.4 - 0.12 - 0.74) * 100) / 100, 'raw边界');
        });
        test('大队伍: 人群边缘不出路(包络优先)', () => {
            var crowd = 2.32; // 500人阵型半宽
            var b = MovementMath.centerBounds(crowd);
            assert(b >= 0.1, '边界为正');
            assert(b + crowd <= 3.4, '人群边缘不得超出路半宽: ' + (b + crowd) + ' vs 3.4');
        });
        test('大队伍边界不高于minCenterRange', () => {
            var b = MovementMath.centerBounds(2.32);
            assert(b <= CONFIG.MOVE.minCenterRange + 0.001, '包络上限');
        });
    });

    describe('帧率无关阻尼(damp)', () => {
        test('30FPS与120FPS同样总时长收敛结果一致', () => {
            var lambda = MovementMath.followLambda();
            function sim(dt, steps) {
                var x = 0;
                for (var i = 0; i < steps; i++) x = damp(x, 2.0, lambda, dt);
                return x;
            }
            var x30 = sim(1 / 30, 30);
            var x120 = sim(1 / 120, 120);
            var x60 = sim(1 / 60, 60);
            assert(Math.abs(x30 - x120) < 0.02, '30/120FPS收敛差: ' + Math.abs(x30 - x120).toFixed(4));
            assert(Math.abs(x30 - x60) < 0.02, '30/60FPS收敛差: ' + Math.abs(x30 - x60).toFixed(4));
            assert(x30 > 1.8, '1秒后应接近目标(95%): ' + x30.toFixed(3));
        });
        test('followLambda由配置推导', () => {
            assertEq(Math.round(MovementMath.followLambda() * 100) / 100, Math.round((3 / CONFIG.MOVE.followSmoothTime) * 100) / 100);
        });
    });

    describe('门触发窗口(队伍宽度补偿)', () => {
        test('窗口=门半宽+队伍半宽补偿(封顶0.7)', () => {
            assertEq(MovementMath.gateTriggerWindow(0.9, 0), 0.9);
            assertEq(MovementMath.gateTriggerWindow(0.9, 2.32), 1.6, '封顶0.7');
            assertEq(MovementMath.gateTriggerWindow(0.9, 0.5), 1.15, '半额补偿');
        });
        test('左右门(间距4)触发区间永不重叠', () => {
            var win = MovementMath.gateTriggerWindow(0.9, 2.32); // 最坏情况: 最大窗口
            var leftRange = [-2 - win, -2 + win];
            var rightRange = [2 - win, 2 + win];
            assert(leftRange[1] < rightRange[0], '左门上界' + leftRange[1] + ' < 右门下界' + rightRange[0] + ' (存在死区)');
        });
        test('大队伍(中心±1.03)仍可达侧门(±2)', () => {
            var crowd = 2.32;
            var bound = MovementMath.centerBounds(crowd);
            var win = MovementMath.gateTriggerWindow(0.9, crowd);
            assert(Math.abs(bound) + win > 2, '边界处可触发侧门: ' + (Math.abs(bound) + win).toFixed(2));
        });
    });
};
