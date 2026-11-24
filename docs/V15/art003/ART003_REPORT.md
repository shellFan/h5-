# 《膨胀小队》V15-ART-003 真实美术资产驱动升级报告

## 1. 新增独立商业级美术资产 (`assets/game/v15/`)
| 资产文件 | 用途与引用位置 | 透明通道 | 状态 |
|---|---|---|---|
| `assets/game/v15/home_military_camp_bg.jpg` | 首页独立阳光军事营地背景（`style-art-military.css` `#start-screen` + `js/art-ui.js` 关卡预览缩略图），彻底告别复用低模战斗三跑道 | 否（全屏背景） | VERIFIED |
| `assets/game/v15/home_squad_hero.png` | 首页统一卡通玩具风格 3 兵种主角团（居中步枪兵+左侧重装加特林+右侧火箭兵），边缘泛洪透明抠图并配呼吸动画与接触阴影（`js/art-ui.js`） | 是（RGBA 透明 PNG） | VERIFIED |
| `assets/game/v15/home_logo.png` | 独立立体金属军工盾徽 Logo（`膨胀小队 / INFLATING SQUAD`，`js/art-ui.js`） | 是（RGBA 透明 PNG） | VERIFIED |

## 2. 首页与战斗核心修复
- **首页精简重构 (`js/art-ui.js`, `style-art-military.css`)**：
  - 彻底移除首页 10 格数字关卡按钮堆叠，替换为单行精致金属关卡栏（缩略图 + `◀ 第 1 关 ▶` + `选关` 宝箱入口，绑定真实 `#level-select` 逻辑）。
  - 两侧悬浮精简功能图标栏（左：地图/科技/每日/挑战；右：成就/图鉴/设置），移除首页 4 张厚重兵种卡堆叠，底部保留 5 格商业级军事主导航栏（首页/士兵/武器/商店/排行榜）。
- **战斗光照回归修复 (`js/world.js`)**：移除 r149 linear 工作流下导致画面发灰发暗的 `ACESFilmicToneMapping`，恢复通透蓝天与明快阳光色彩。
- **黄金镜距回调 (`js/world.js`)**：将 36 人小队稳定控制在屏幕下部 70%~92% 区域，消除底部大片空白道路，同时完整露出三跑道增益门与怪兽潮。
- **锐利曳光弹重绘 (`js/combat.js`)**：由钝黄色水滴升级为炽白高亮细长弹芯 + 金橙渐变尾迹。

## 3. 尚未完成/待后续专项推进项（如实登记）
- 士兵/普通怪物/铁拳队长 Boss 仍基于现有 64 个 GLB 资产 + 运行时重装机械附件（因本机无 Blender GUI/CLI 环境，未能从零重制全新外部 Blender GLB 网格）；若需彻底替换底层 GLB 拓扑，后续需在装有 Blender 的环境执行 `tools/create-soldier.py` / `tools/create-enemies.py` 重烘。

## 4. 自动化测试与性能
- 单元测试 `102/102` 通过；GLB 结构验收 `PASS`；H5 构建 `dist/h5/ (13742 KB)` 成功；控制台报错 `0`。
- Draw Calls 118~136，JS 堆内存 17.5~18.5 MB，200 人自动 LOD 降面至 852K tris（真机帧率待真机验证）。
