# V12 全项目代码审计 (CODEBASE_AUDIT)

> 审计方式：三路并行深读（平台层/广告/构建/入口；游戏核心/主循环/战斗；成长/存档/UI/美术），
> 全部结论带行号证据。状态标记：✅已完成 · 🟡部分完成 · ❌未完成 · 🐛存在缺陷 · ⚡需优化 · 🧪已测试

## 1. 模块状态总表

| 模块 | 状态 | 说明 |
|---|---|---|
| 入口/启动 (index.html + game.js boot) | ✅🧪 | 关键资源优先（6 GLB 先行），后台错峰续载 |
| 主循环 (game.js `_loop/_updateInner`) | ✅🧪 | dt 钳制、FPS EMA、P95 采样、异常兜底 |
| 3D 场景 (world.js) | ✅🧪 | 画质三档、DPR 上限、阴影按档、几何合并(9→3) |
| 士兵系统 (squad/soldier-renderer/loader) | ✅🧪 | InstancedMesh 双 bank(hero/lod)、程序化姿态 |
| 僵尸系统 (enemies/enemy-models) | ✅🧪 | 7 体格 + LOD 分批加载 + normal 回退 |
| Boss 系统 (boss-v42/enemies) | ✅🧪 | 狂暴阈值、双 Boss、10 关 bossStyle 矩阵 |
| 战斗 (combat.js) | ✅🧪 | 对象池/暴击/狂暴/穿透/连锁；V12 修复逐发冗余矩阵上传 ⚡→✅ |
| 子弹/碰撞 | ✅🧪 | 池化 + 视觉弹道 30Hz 上限；最坏 O(N×M) 可接受 ⚡(空间分桶列为后续项) |
| 三跑道状态门 (gates.js) | ✅🧪 | 三选一/稀有度 75-20-5/组合系统；V12 修复 ×2 抑制跨局残留 🐛→✅ |
| 肉鸽技能 (skills.js) | ✅🧪 | 12 技能 13 组合、职业加权；"背水"文案与实现对齐(见 QA) |
| 四职业 (classes.js) | ✅🧪 | 4 职业 + 专精等级 |
| 士兵升级 (growth.js) | ✅🧪 | 1-50 级 5 阶段 |
| 武器升级 (weapons.js) | ✅🧪 | 8 武器 5 级 + 进化 + 词条 |
| 装备系统 (growth.js EquipmentLoot) | ✅🧪 | 6 槽位/背包 30/穿戴互换/分解 |
| 军械库 (ui-v60) | ✅🧪 | — |
| 训练中心 (ui-v60) | ✅🧪 | — |
| 科技树 (tech-tree.js) | ✅🧪 | 13 节点 3 分支，combatStats 入战斗 |
| 任务和成就 (challenge/progression) | ✅🧪 | 每日 8 选 3、40 成就、签到 |
| 关卡和地图 (config LEVELS/gen-levels) | ✅🧪 | 10 关 + 星级 |
| 存档 (economy/storage-adapter) | ✅🧪 | V12 加固：.bak 双写/损坏回退/现场保留/旧键迁移 |
| 广告 (ads/*) | ✅🧪 | 三平台装配 + 幂等账本；微信激励视频 V12 实装 |
| UI (ui-v60/art-v42) | ✅🧪 | 24 屏；微信端经 minidom 渲染 |
| 美术资源 (assets/models) | ✅🧪 | GLB 自包含 PBR；DRACO/KTX2 未使用 ⚡(列为后续优化) |
| 性能模块 | ✅🧪 | 对象池/实例化/LOD/脏检查 UI/节流存档 |
| 构建脚本 (build-h5/douyin/wechat) | ✅🧪 | douyin 3 缺陷 V12 修复；wechat 新增 |

## 2. V12 修复清单（全部带回归）

| ID | 级别 | 缺陷 | 修复 | 回归 |
|---|---|---|---|---|
| V12-001 | P0 | build-douyin GAME_SCRIPTS 缺 js/game.js（产物必抛 Game 未定义） | 补齐 + 段标记自检 | 构建自检 ✓ |
| V12-002 | P1 | build-douyin 自检 'class Game' 前缀假阳性 | 改 `[[ js/game.js ]]` 段检查 | 构建自检 ✓ |
| V12-003 | P1 | build-douyin 入口漏载 game-config.js（广告位永远读不到） | require 前移 | 构建自检 ✓ |
| V12-004 | P2 | squad.reset 未复位 invulnT（复活无敌残留跨局） | 复位 | e2e 全绿 |
| V12-005 | P2 | GateRewardPool.lastWasMul ×2 抑制跨局残留 | loadFromLevel 复位 | v111 15/15 |
| V12-006 | P2 | 存档无备份/损坏即静默清零 | GameStorage setSafe/getSafe + .corrupt 现场保留 | 新单测 10 项 ✓ |
| V12-007 | P2 | pz_quality 画质设置只写不读（设置页形同虚设） | world._detectQuality 读取偏好 | e2e ✓ |
| V12-008 | P2 | pz_shake_off/pz_quality/pz_progress 裸 localStorage 绕过适配层（微信端失效） | Platform.storage getLegacy/setLegacy | 新单测 ✓ |
| V12-009 | P3 | game.js 可选链 `?.`（低版本 JS 引擎语法风险） | 改 ES5 等价 | e2e ✓ |
| V12-010 | P3 | boss-name 更新依赖 firstChild.nodeType 结构 | 结构无关遍历 | e2e ✓ |
| V12-011 | P3 | 逐发子弹冗余 _syncInstances（高频开火双倍矩阵上传） | 帧内统一同步 | mobile 4.66ms ✓ |
| V12-012 | P3 | enemy-models 后台续载并发无去重 | 在途 Promise 复用 | e2e ✓ |
| V12-013 | P2 | 抖音端品牌栏版本号缺失 | 构建期解析 index.html 注入 | 构建自检 ✓ |

## 3. 重点复核历史性能优化（不重复实现）

- 6155371：InstancedMesh 前缀上传(updateRange)、关键资源优先启动 —— 已确认存在且有效 ✓
- 01f7bb0：flex-fill 列表/矮屏密度 —— CSS 已适配，minidom 支持 flex/媒体查询求值 ✓
- 5a419dc：广告幂等/启动守卫/布局守卫 —— 确认有效 ✓
- 3bb3570：每日任务轮询节流(0.5s) —— 确认有效 ✓
- 未使用项：DRACO/KTX2（全库 0 命中）—— 记录为后续优化而非缺陷

## 4. 未完成/后续项（如实记录）

- 开放数据域好友排行榜（leaderboard 适配点已预留 Platform.leaderboard）
- DRACO/KTX2 压缩（主包/分包均在限内，暂无必要）
- 战斗碰撞空间分桶（当前规模无需）
- emoji 图标图集化（跨设备字体长尾风险）
- 战斗内技能选择为 3D 门实现，微信端复用同一机制（无需独立弹窗页）
