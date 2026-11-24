# 《膨胀小队》V15-ART-002 实施报告 (IMPLEMENTATION REPORT)

## 1. 概述
基于 ChatGPT 美术总监在 V15-ART-001 验收中指出的 8 大核心瓶颈以及独立发布的「02 游戏首页竖屏设计稿（膨胀小队：军事基地出击）」，本轮完成角色/怪物/Boss 3D 轮廓与护甲升级、36 人交错队形与全队弹幕特效、自然草地/军事基地道具与 ACES 光照升级、Boss 血条精简，以及开放式阳光军营首页全面重构。

## 2. 模块改动明细
- **3D 怪物与 Boss 重装资产 (`js/enemy-models.js`)**：
  - 修复历史缺陷：将 Boss 附件管线正式接入 `EnemyArmyRenderer.update()`。
  - 为铁拳队长等重装 Boss 构建贴合比例的独立重装机械套装：宽大钢灰肩甲 + 金边与尖刺 + 红色警示灯 + 厚重胸甲与发光红橙反应堆核心 + 随手臂挥动的巨型机械拳套 + 头部双巨角皇冠。
  - 为普通/快速/重装紫色怪兽装配差异化轮廓附件（双角与尖耳 `monsterHorns` / 尖刺背鳍 `fastSpikes` / 尖刺重甲护肩 `pauldron`），告别纯方块僵尸感。
  - 新增单 DrawCall 怪物与 Boss 柔和接地阴影 (`shadowMesh`)。
- **士兵背部细节与接地阴影 (`js/soldier-renderer.js`)**：
  - 新增 `tacticalpack` 贴背细节（战术扣带、白星背包徽章、金属腰包）与单 DrawCall 全队柔和接地阴影 (`_shadowMesh`)。
- **队形交错与全队火力弹幕 (`js/squad.js`, `js/world.js`, `js/combat.js`)**：
  - 优化 13~100 人阵型（7 列交错、`scale 0.76`、自然微随机抖动）并微调镜距与俯角，彻底解决 36 人头盔互相遮挡与占屏过大问题。
  - 在 `CombatSystem` 新增纯视觉全队扇面弹幕与交错枪口火焰（`decorative: true, damage: 0`，零数值改动、不重复结算伤害），彻底解决大编制只有中央少量弹道的视觉短板。
- **自然地形、道具与光照 (`js/military-art.js`, `js/world.js`)**：
  - 取消规则棋盘草地条纹，重绘自然斑驳阳光草地与草簇纹理；山体调整为柔和大气透视蓝绿山脊。
  - 新增非对称路侧红色军用油桶与灌木丛；启用 `ACESFilmicToneMapping (exposure 1.06)` 增强立体明暗层次。
- **Boss 血条与开放式首页重构 (`js/art-ui.js`, `style-art-military.css`)**：
  - 精简 Boss 血条至 `270px` 紧凑胶囊并上提至 `top: 60px`，战斗中自动隐藏次级属性条，彻底避免遮挡 Boss 头部。
  - 参照 ChatGPT 02 正式首页设计稿，拆除厚重暗绿网页大卡片，打造全屏开放式 3D 阳光军营大厅：立体金属金橙 `膨胀小队 / INFLATING SQUAD` Logo、3 兵种核心主角站位、巨型金橙立体 `◎ 开始战斗 »` 按钮、底部 5 格商业级军事主导航栏，修复首页金币暗字可读性。
