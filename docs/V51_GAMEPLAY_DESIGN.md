# V5.1 玩法设计文档（V51_GAMEPLAY_DESIGN.md）

## 核心循环
推进 → 抵达防守锚点 → 军团列阵 → 怪潮从正前方涌来 → 自动射击固守 → 清波 → 状态门三选一 → 推进至下一阵地 → … → 最终 Boss。

## 人物后退问题根因与修复（§1.1）
| 根因 | 修复 |
|---|---|
| `pacing.frontierStopZ` 返回 `w.z - combatAdvance(25)` — 队伍跑过波点 25 单位深入怪区再停 | **阵地防守 standoff**: 停在 `w.z + defenseStandoff(9)`，波点即敌区前沿 |
| 相机 `offZ` 直接加未平滑的 `formationDepth` — 人数每次增减（阵亡/吸血/穿门）相机前后跳 | `world.updateCamera` 引入 `_depthSmooth`（damp 2.5/s） |
| 移动中交火模式本身造成持续漂移感 | 防守期 z 完全锁定；站立姿态 lean 0.02→0 |
| 手动步进不计 elapsedTime（结算时长失真） | `elapsedTime` 统一计入 `_update` |

## 坐标方向约定（§1.3）
`CONFIG.DIRS`（config.js 顶部，唯一事实来源）：
- `FORWARD_SIGN=-1` 玩家前进（-Z 屏幕深处）
- `ENEMY_ADVANCE_SIGN=+1` 怪物追击（+Z 朝防线）
- `SHOOT_SIGN=-1` 射击
- `GATE_PASS_SIGN=-1` 穿门
- `CAMERA_SIDE=+1` 相机在防线后

辅助 `BattleKinematics`（utils.js）：`advanceZ / enemyApproachZ / bulletZ / atDefenseLine`。
`squad.update / enemies.update / combat.bullet` 全部改走运动学辅助，方向单测：`tests/unit/suites/05-directions.test.js`。

## 阵地防守（§1.2/1.4）
- 波激活 → `frontierStopZ() = 波点 + defenseStandoff`；Boss 预警线同旧。
- 防守期怪物从防线前方 `squad.z - 11 ~ -(11+spawnDepth 12)` 涌来（分批 stream，永不在身后/镜头近处生成）。
- 胜利判定统一为：`pacing.isComplete() && encounterOutstanding===0 && !boss`（含 Boss 与召唤全清）。

## 军团阵型与射击（§2）
- 阵型沿用 GLB 分部件实例化 + 错列网格（1→500 人自适应扩列），站位统一面向怪群（-Z）。
- 射击目标选择：`getNearest` 优先**最近**敌人（z 最大者先打），Boss/精英因距离近自然优先——近处怪开火不再被无视。
- 玩家拖动仅在防线横向（±X），永不被怪推后。

## 尸潮（§3）
- 场上上限矩阵 `CONFIG.MAX_ALIVE = [25,30,35,45,60]`；单关总量 44/66/90/108/127。
- 分批：batch 2-14、stream 0.1s/只、首波 2s 观察窗、防贴脸（≥11 单位）。
- 类型机制保留：普通近战/快速突进/盾吸收/分裂×2/远程酸弹/精英/Boss 三阶段。

## 五关与 Boss（§4）
L1 新兵训练(44) → L2 快速尸潮(66) → L3 盾牌军团(90) → L4 变异尸潮(108) → L5 终局Boss(127+Boss)。
L5 Boss overlord：阶段1普攻/阶段2召唤/阶段3狂暴，预警横幅+血条+阶段标签+技能提示+死亡演出+胜利结算。
后续扩展规则：每五关一个最终 Boss。
