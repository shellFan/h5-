# V4.0 移动手感专项报告 (Phase 1)

基线: 9e3800a | 完成: 97a6dec | 关联文件: js/movement.js(新) js/game.js js/squad.js js/gates.js js/config.js

## 一、修改前后对比

### 修改前(问题复现)
- 拖动 = 「累计30px阈值 → 瞬间跳一条道」, `startX` 跳道后重置 → 连续拖动连续跳道
- `SQUAD_LANE_LERP=10` 指数吸附(≈0.3s到位) → 位移突兀、无惯性
- 只有 -2/0/+2 三个落点; 门触发窗 `|dx|<1.0` 与门视觉半宽 0.9 不一致
- 阵型 7列×0.52 固定, 大人数时士兵边缘 3.56 > 路半宽 3.4 → 越界压到人行道
- 键盘 = 跳道; 500 人时几乎无法操作

### 修改后
| 参数 | 值 | 说明 |
|---|---|---|
| touchSensitivity | 0.65 | 拖过 65% 屏宽 = 横穿全部可玩范围(锚点相对映射, 落点连续) |
| followSmoothTime | 0.15s | 阻尼跟随(λ=20, 指数), 帧率无关 |
| gateMagnetDist | 0.55 | 仅已选边时轻微吸附跑道中心, **不代选** |
| gateMagnetLambda | 6.0 | 磁吸强度 |
| centerMargin/minCenterRange | 0.12/1.1 | 大人数包络优先, 门可达性由触发窗补偿 |
| keyStep | 1.2 | 键盘连续位移 |

全部参数集中于 `CONFIG.MOVE`(js/config.js), 事件处理零写死。

## 二、架构

- **js/movement.js**(新, 纯函数无THREE): dragTarget / keyTarget / centerBounds / clampCenter / followLambda / gateTriggerWindow — 可单测
- **输入**(game.js `_setupInput`): touch/mouse 统一锚点式连续拖动; 键盘连续位移
- **跟随**(squad.update): `x = damp(x, targetX, 3/0.15, dt)`, 目标与实际双向钳制在随阵型宽度变化的边界内
- **自适应阵型**(squad `_updateFormation`): 1/≤10/≤30/≤100/≤300/>300 分档列距, 队伍半宽≤2.3, 保留 V3.7 行交错+个体抖动
- **门磁吸+触发窗**(gates.update): 窗口 = 门半宽0.9 + min(队伍半宽×0.5, 0.7) → 左右门(间距4)触发区间永不重叠, 大人数边缘仍可达侧门

## 三、测试证据

- 单测 `03-movement.test.js` 13例: 灵敏度映射/锚点相对/超拖钳制/边界包络(500人边缘≤3.4)/30FPS vs 120FPS 阻尼收敛差<0.02/门窗口不重叠/大队伍侧门可达
- E2E 3例: 真实鼠标拖动127px → targetX 与公式差<0.15; 30ms采样最大跳变<0.45(平滑); 500人边缘不出路+侧门可达
- E2E 键盘: targetX 精确 = -keyStep(1.2)

## 四、验收对照 (Phase 12 操作项)

| 项 | 结果 |
|---|---|
| 左右移动平滑 | ✓ 阻尼跟随+连续映射 |
| 不会一碰就跳跃 | ✓ 无阈值跳道, 锚点式 |
| 不同FPS速度一致 | ✓ 指数阻尼, 单测证明 |
| 不会误选状态门 | ✓ 磁吸区±0.55 不重叠, 左右门触发区间有死区 |
| 500人不越界 | ✓ 包络钳制, 截图与E2E双重验证 |
