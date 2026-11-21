# V13 · 视觉研发标准 (VISUAL_DEVELOPMENT_STANDARD)

> 本文是《膨胀小队》视觉研发的**流程标准**: 任何 Agent/开发者做视觉工作前必读。
> 设计依据: docs/art/ART_DIRECTION.md(最高) + docs/V13/ART_DIRECTION.md(V13 增量)。

## 1. 工作流(必须按序)

```text
1. 对账   — 查 docs/art + docs/V13 + ASSET_MANIFEST, 不重复制作
2. 技能   — 读 .agents/skills/ 相关技能(改 UI 读 game-ui-ux, 加素材读 create-game-assets,
            加反馈读 game-feel, 3D 读 threejs-* 三件, 性能读 performance-optimization)
3. 样板   — 先做 1 个代表件进真实游戏验证, 通过后再批量
4. 实现   — 走 ASSET_PIPELINE.md 管线; 业务逻辑红线见下 §3
5. 验收   — 真实运行截图(VISUAL_ACCEPTANCE) + 全量回归测试 + 性能复核
6. 登记   — ASSET_MANIFEST / ASSET_LICENSES 追加; 报告更新
```

## 2. 三端一致性

| 端 | UI 渲染 | 资源 |
|---|---|---|
| H5 | 浏览器 DOM + 4+1 张 CSS(v42→v130 顺序追加) | assets/ 直读 |
| 微信 | minidom 虚拟 DOM(canvas 光栅), 同一份 index.html 树 + CSS 原文 | wechat-game/assets 分包 |
| 抖音 | 与微信同构 | dist/douyin |

规则: **样式变更必须同时注册到三端构建**(index.html + build-h5.js + build-wechat.js CSS_FILES);
微信端只支持 CSS 子集(见 docs/WeChat/WECHAT_COMPATIBILITY.md), 新增样式需两端截图验收。

## 3. 业务逻辑红线(禁止改写)

战斗伤害计算 / 人数增减规则 / 状态门数值 / 刷新规则 / 怪物移动攻击 / Boss 数值 /
胜负判断 / 经济与金币 / 武器升级数值 / 技能效果 / 职业属性 / 存档结构 / 排行榜算法 /
广告结算 / 微信平台接口 / 核心状态机。

表现层可改(HTML/CSS/SVG/材质/灯光/粒子/UI 渲染/资源管理); 无法用表现层实现的需求 →
记录原因, 不擅自突破。历史上两次教训已登记: 挑战驻守点与 L3 伤害公式(见 QA_REPORT)。

## 4. 性能红线(视觉升级不可破坏)

| 指标 | 预算 |
|---|---|
| 战斗均值 DrawCall | ≤ 130 |
| 粒子/曳光/飘字/枪焰/冲击星/decal | 300/120/20/24/48/16 池上限 |
| 新增材质 | 必须复用或入池 |
| 帧率 | 中端真机 ≥ 30, 高端 ≈ 60 |
| 包体(微信) | 主包 ≤ 4MB, 分包 ≤ 4MB, 整包 ≤ 30MB |

## 5. 验收标准(每轮必做)

- 全量回归测试 0 失败(套件清单见 QA_REPORT);
- 10 档分辨率矩阵 + 微信模拟器断言通过;
- 每个关键页面真实运行截图(VISUAL_ACCEPTANCE 更新);
- 无占位图 / 无紫缺失材质 / 无透明异常 / 无性能回退。
