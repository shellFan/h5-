# 《膨胀小队》V15-ART-005 商业级战斗地图重制、多怪物家族与相机/护盾/特效专项报告

## 1. 核心问题全部清零（逐条对应 ART-004 六大缺陷）
1. **彻底修复 Boss 普通状态回退小怪模型异常 (`js/enemy-models.js`)**：
   - 将 `EnemyModelLoader.loadCritical()` 启动预载集扩展为 `['normal', 'fast', 'shield', 'elite', 'bruiser', 'overlord']`，确保铁拳队长在**普通状态与护盾状态**下 100% 使用独立机械重装 Boss 模型，不再出现异步加载滞后回退。
2. **Blender 4.2 模块化军事基地 3D 环境包 (`tools/art-pipeline/blender/v15_env_pack.py` → `assets/game/v15/env_military_pack.glb`, 131 KB, 3,358 tris)**：
   - 用共享单材质 PBR 图集制作并导出 6 大雕塑倒角组件：`PineTree`（三层松树）、`Watchtower`（木质 X 交叉支撑瞭望塔）、`ToyTank`（带负重轮/斜装甲/炮口制退器玩具坦克）、`MilitaryTent`（双坡帆布帐篷）、`BunkerGate`（垛口碉堡+立体金星+红旗要塞大门）、`SandbagBunker`（圆润沙袋掩体+军绿弹药箱）。
   - 已无缝接入 `js/military-art.js`（单 InstancedMesh / 类，仅增 6 DrawCalls，保留低模兜底），战斗地图终于与 82 分首页军事营地实现风格统一！
3. **基础士兵哑光材质精修 (`tools/art-pipeline/blender/v15_soldier.py`)**：
   - 头盔切换为柔和哑光军绿（`roughness 0.58, metalness 0.05`），消除塑料反光斑；拉大布料（0.86）、帆布（0.84）、皮革（0.68）、黄铜/枪铁（0.26~0.30, metal 0.70~0.80）PBR 质感层次。
4. **多怪物家族差异化 GLB (`tools/art-pipeline/blender/v15_monster_boss.py`)**：
   - `normal.glb`（3,904 / 1,402 tris）：圆润紫色双角尖牙怪
   - `fast.glb`（1,426 / 538 tris）：纤瘦前倾橘红背鳍疾跑怪
   - `shield.glb` / `elite.glb`（1,648 / 588 tris）：宽肩厚钢甲重装怪
   - 独立机械铁拳队长 Boss（6,888 / 2,406 tris）：圆球肩甲全面替换为**多层倒角钢甲肩护 + 金边 + 双钢刺 + 红警示灯**。
5. **半透明六边形蜂巢 Boss 能量护盾 (`js/enemy-models.js`)**：
   - 程序化绘制 256×128 六边形网格发光能量盾贴图（AdditiveBlending），护盾开启时 Boss 紫色躯干与重装钢甲清晰可见。
6. **投影包围盒自适应战斗相机 & 8 角星芒枪口火焰 (`js/world.js`, `js/effects.js`, `js/enemies.js`)**：
   - 移除历史 `+0.6` X 偏移导致的左侧士兵裁切 Bug；按实际队伍宽与视锥水平角动态求距，36 人小队左右完整居中、底部比例协调。
   - 升级 8 角炽白金橙星芒枪口火焰（128px 贴图、上限 36）与击杀卡通爆炸闪光。

## 2. 自动化测试与构建验证
- 单元测试 (`node tests/unit/run.js`)：`通过 102 / 失败 0 / 共 102`
- GLB 契约验收 (`node tests/unit/soldier-asset.js`)：`PASS`（`hero: 9500, lod: 2656`）
- H5 生产构建 (`node tools/build-h5.js`)：`PASS` → `dist/h5/ (14184 KB)`
- 控制台报错：`0`
