# V13 · GameDev Agent Skills 集成报告

> 结论：8 项技能**已在本仓库安装且经本会话逐一核验内容**（并行会话于 V12 期间安装，
> 按"已安装则检查、不重复安装"原则未重装）。V13 全程按技能规范执行。

## 1. 安装核验

| 技能 | 路径 | 内容核验 |
|---|---|---|
| router | `.agents/skills/router/` | SKILL.md + agents/ + references/ 完整 |
| create-game-assets | `.agents/skills/create-game-assets/` | SKILL.md + agents/ + assets/ + references/ |
| game-ui-ux | `.agents/skills/game-ui-ux/` | SKILL.md + references/ |
| game-feel | `.agents/skills/game-feel/` | SKILL.md + references/ |
| performance-optimization | `.agents/skills/performance-optimization/` | SKILL.md + references/ |
| threejs-scene-setup | `.agents/skills/threejs-scene-setup/` | SKILL.md + references/ |
| threejs-gltf-loading | `.agents/skills/threejs-gltf-loading/` | SKILL.md + references/ |
| threejs-materials-lighting | `.agents/skills/threejs-materials-lighting/` | SKILL.md + references/ |

- Agent 识别：ZCode(Claude 系) — 项目级技能目录 `.agents/skills/` 已在会话技能列表可见并可直接调用（本会话技能清单含全部 8 项）。
- 技能库来源：github.com/gamedev-skills/awesome-gamedev-agent-skills（V12 期间 `npx skills add` 安装）。
- Three.js 版本纪律：项目锁定 **r149**（`js/vendor/three.min.js`），三件 threejs-* 技能按 r149 语义使用，未升级版本。

## 2. V13 技能使用记录（逐项落到实际产出）

| 技能 | 本轮实际应用 | 产出 |
|---|---|---|
| router | 任务路由：视觉重构主链路 → game-ui-ux + create-game-assets + game-feel + performance-optimization + threejs-* | 本文档 §2 的执行序列 |
| create-game-assets | 素材生产规范（剪影优先/统一色板/登记制度/质量检查） | 武器剪影 SVG ×8 类（军械库+图鉴）、关卡主题色板 ×10、ASSET_MANIFEST 登记 |
| game-ui-ux | HUD 层级/安全区/触控目标/空-加载-错误三态 | 科技树导轨+连线+等级点、排行榜富空态+错误态、设置页"减少动效"开关、style-v130 层 |
| game-feel | 命中/穿过/进出场反馈节奏（0.12/0.22/0.34s 三档缓动） | style-v130 动效令牌与统一按压/进场动画、门光束呼吸脉动 |
| performance-optimization | DrawCall 预算/对象池纪律 | 门光束合并单 mesh(+1 call/门)；实测战斗均值 **97 calls**（低于 V12 基线 104-118）；三档画质纪律复核 |
| threejs-scene-setup | r149 场景/背景/雾语义 | 主题系统：天穹 16×256 渐变重绘 + Fog 参数 + 半球/阳光调节（`world.js _paintSky/applyTheme`） |
| threejs-gltf-loading | GLB 自包含校验（26 个模型内嵌贴图，无外部 URI） | 资产对账确认，未新增模型 |
| threejs-materials-lighting | 材质染色幂等（`__themeBaseHex` 基色记录） | 主题环境染色（草地/建筑实例 lerp 0.55，主题切换可逆） |

## 3. 长期复用约定

1. 视觉决策一律先查 `docs/art/ART_DIRECTION.md`（最高依据）+ 本目录 V13 增量；
2. 新增素材必须走 create-game-assets 流程（登记 + 检查 + 预览）；
3. 动效新增必须使用 style-v130 的时长/缓动令牌，禁止散落魔法数字；
4. 性能红线：战斗均值 DrawCall ≤ 130，粒子/曳光/飘字上限沿用 V12 池纪律。
