# 视觉验收规范 (VISUAL_ACCEPTANCE)

> 原则: **不能用构建成功代替画面验收** — 一切视觉改动必须以真实渲染画面为准。
> 工具: `npm run dev`(8080) + `node tools/v120-shot.js <mode>`(单场景快照) + `node tools/v120-capture.js`(全量矩阵+性能)。

## 1. 验收流程

1. 基线: 改动前跑 `V120_OUT=docs/screenshots/v120-before node tools/v120-capture.js`。
2. 改动后同口径跑 `V120_OUT=docs/screenshots/v120-after`。
3. 对照检查单逐项过; 逐场景看图(v120-shot 快速迭代)。
4. 差异与结论写入当版报告(docs/V120_*.md), 引用截图路径。

## 2. 截图矩阵 (v120-capture 自动产出)

- 响应式: home/combat × 320/360/390/430。
- 场景: final-combat(军团+全敌型+Boss+门) / boss(血条+预警) / gates(四稀有度) / win / lose / pause。
- 成长页: rank(排行榜) / armory(军械库) / map(地图) / shop(升级商店)。
- 性能: perf-390.json(draw calls/tris/帧时间采样)。

## 3. 检查单 (逐屏)

### 战斗画面
- [ ] 敌我/体型/危险度一眼可辨(MONSTER_DESIGN 三要素)
- [ ] 曳光弹头朝敌方、枪焰在枪口、命中星在命中点
- [ ] 伤害数字白芯描边可读; decal 不闪烁不压角色
- [ ] HUD 数值醒目、无遮挡; Boss 条渐变平滑
- [ ] 天空渐变自然、雾与地平线衔接、无穿帮(fog 与穹顶色一致)

### 界面
- [ ] 令牌一致(颜色/圆角/阴影三档) — 无裸色值新成员
- [ ] 排行榜前三甲样式 + "最新"高亮正确
- [ ] 结算无重复星星(静态 #stars-row 隐藏)、第 5 格通栏
- [ ] 按钮: 立体渐变 + 按压态; 触控 ≥44px

### 手机矩阵
- [ ] MOBILE_UI_GUIDELINES §7 全项

## 4. 性能门槛 (与画面验收同权重)

- `npm run test:unit` 通过(回归保底)。
- perf-390.json: **结构性** draw calls 增量 ≤4(V12: 穹顶 1 + decal 通道 1 + 精英光环 ≤2, 基线 114 → 118);
  总 calls 波动另受随机数流偏移影响(活跃枪焰/飘字数量), 以结构项为准; tris 增量 ≤1%。
- 帧时间: quality=2 桌面 p95 不得高于基线(V12: 1.8ms→1.5ms); 移动矩阵按 `npm run test:mobile` 门槛。
- 结论必须引用数字, 禁止"看起来流畅"式描述。

## 5. 通过标准

- 全部检查单通过 + 性能不回归 + 控制台零错误(watchPageErrors) → 视觉验收 PASS。
- 任一 FAIL: 回滚该改动或修复后重跑全矩阵(不允许只修不验)。
