# V5.0 代码审计报告（V50_CODE_AUDIT.md）

- 审计基线：master @ `1f2730c`（"chore: save all V42 models runtime fixes and visual evidence checkpoint"）
- 审计时间：2026-11-15
- 审计人：V5.0 自动化开发流水线（GLM-5.3）
- 远端分支 `feature/art-overhaul-v2` 落后 master（约 5 万行为 master 独有），继续以 master 为开发基线。

## 1. 现状总评

仓库已到达 V4.2：士兵与全部敌人（normal/fast/shield/split/spitter/elite + 6 Boss 风格）均为 Blender 产出的 GLB（hero+lod 双 LOD），经"刚体分部件 InstancedMesh"管线渲染；状态门为 V42Art 圆角倒角 PBR 门；环境为 instanced 卡通城市；节奏/连杀/慢动作/存档/广告状态机均已具备。V5.0 的主要工作不是从零重做美术，而是：修复阻断上线缺陷（移动语义、抖音构建、广告链路）、截图驱动的视觉与 UI 精修、测试与性能验收。

## 2. 功能清单核对（对照任务书）

| 模块 | 状态 | 证据 |
|---|---|---|
| 游戏启动流程 | ✅ | `js/game.js:958-1003` GLB 加载完成后 boot，带失败重试 |
| Three.js 加载 | ✅ 本地 pinned r149 | `index.html:165` |
| GLB 加载 | ✅ | `js/soldier-loader.js` / `js/enemy-models.js`（hero+lod 共 28 个 GLB） |
| 士兵实例化 | ✅ 分部件实例化 | `js/soldier-renderer.js` |
| 僵尸渲染 | ✅ 全类型 GLB 实例化 | `js/enemy-models.js:66-133` |
| Boss 逻辑 | ✅ 6 风格 + 3 阶段 + 护盾/召唤/蓄力冲击 | `js/boss-v42.js` |
| 状态门 | ✅ V42 PBR 门（视觉达标，待截图验收） | `js/art-v42.js:256-364` |
| 关卡数据 | ✅ 10 关，程序化扩容为 3 周期长关卡 | `js/config.js:559-626` |
| 移动 | ⚠️ P0 语义缺陷（见 3.1） | `js/movement.js:14-21` |
| 刷怪 | ✅ 分批/上限/前置观察窗 | `js/pacing.js` |
| 战斗 | ✅ 追踪弹/暴击/穿透/冰冻/吸血 | `js/combat.js` |
| 存档 | ✅ 关卡解锁 + 广告账本 | `js/game.js:921-935` / `ad-service.js` |
| 暂停 | ✅ 手动暂停 + 页面隐藏 | `lifecycle-adapter.js` |
| 胜负结算 | ✅ 含失败原因/连杀统计 | `js/game.js:879-918` |
| 广告 | ⚠️ 状态机正确，但 4 个 P1（见 3.3） | `js/ads/*` |
| 音频 | ⚠️ H5 合成音效可用；抖音端必无声（见 3.4） | `js/platform/audio-adapter.js` |
| 平台生命周期 | ⚠️ hide 时未静音/暂停音频 | `platform.js:67-76` |
| H5 构建 | ✅ 复制式构建 + 自检 | `tools/build-h5.js` |
| 抖音构建 | ❌ P0 产物不可运行（见 3.2） | `tools/build-douyin.js` |
| 资源路径 | ✅ H5 构建无 404 缺口（48 项清单逐一核对） | — |
| 测试体系 | ⚠️ 单测可运行；e2e 因 node_modules 缺失全部不可运行 | `tests/` |

## 3. 缺陷清单

### 3.1 P0 — 移动公式语义反直觉（任务书 2.2 明确要求修复）

`js/movement.js:18`：
```js
worldPerPx = (maxX * 2) / (w * M.touchSensitivity)
```
现状语义：**touchSensitivity 越大 → 每像素位移越小 → 越慢**（0.65 = "拖 65% 屏宽横穿全范围"，实际换算后比"全屏横穿"还快 54%）。与直观语义（越大越灵敏）相反，且历史反馈"移动太快"。

**修复方案**：改为 `worldPerPx = (maxX * 2) * touchSensitivity / w`，`touchSensitivity=1.0` 定义为"拖满整屏 = 横穿全部可玩范围"。同步更新 config 注释、`tests/unit/suites/03-movement.test.js` 全部断言。默认值 1.0（等效于旧值降速 35%，直接回应"移动太快"反馈）。

### 3.2 P0 — 抖音构建产物结构性不可运行

`tools/build-douyin.js` 产物四项叠加缺陷（子代理逐一验证）：
1. 入口 `new Game()` 但 `GAME_SCRIPTS` 不含 `js/game.js`（类不可用）；
2. `three.min.js` 只复制不加载，`THREE` 必然 undefined；
3. require 路径错误（生成 `./config.js`，文件实际在 `./js/config.js`）；
4. 小游戏 CommonJS 每文件独立模块作用域，顶层 `const CONFIG`/`class Game` 跨文件不可见，"零改动 require"假设不成立。
另有 P1：缺失文件静默 warn 跳过（坏包无告警）；GLTFLoader/soldier/enemy 模型加载链全部缺失。

**修复方案**：重写为"单文件 IIFE bundle"——构建期按依赖顺序拼接源码进一个闭包（与 `tests/unit/run.js` 的 vm 拼接方案同构，但输出真实文件），game.js 入口 require 该 bundle；缺失文件 throw；产物 game.json 按抖音规范输出。

### 3.3 P1 — 广告系统 4 项缺陷

1. **抖音服务 `this.tt` 从未赋值**（`douyin-ad.js:25`）→ `_doInitialize` 必然抛错 → 即便配置广告位 ID，广告永远不可用。
2. **`showRewarded` 无超时兜底**（`ad-service.js:128-144`）→ 平台 onClose 丢失时游戏永久暂停（软锁死）。修复：30s 超时自动结算为 failed。
3. **广告位配置链路失效**：`build-douyin.js:55-60` 生成的 `game-config.js` 声明同名变量被 `douyin-ad.js:7` 的 `var DOUYIN_AD_UNITS` 覆盖/隔离。修复：改为读取 `Platform.settings`（由 game-config.js 注入），`douyin-ad.js` 从 `Platform.settings.ads.douyin.rewardVideo` 取值。
4. **H5 生产环境直接使用 Mock 测试广告**发放真实奖励，且 `?adtest=auto_complete` 可自动完成。修复：WebMock 仅在本地开发环境（localhost/127.0.0.1/文件协议）或显式 `?adtest=` 时装配；生产 H5 无真实广告 SDK → 广告功能如实降级不可用（按钮自动隐藏），不伪造商业广告。

### 3.4 P1 — 抖音端音频完全缺失

`audio-adapter.js` 注释宣称支持 `tt.createInnerAudioContext`，实现只有 WebAudio（`audio-adapter.js:15-27`）。抖音小游戏无 `window.AudioContext` → 全程静音。修复：增加抖音合成音频分支（`tt.createInnerAudioContext` + 预生成 WAV 数据 URI 由 WebAudio 合成逻辑导出），并保留 WebAudio 优先、tt 兜底的双通道。

### 3.5 P2 — 其他

| 问题 | 位置 | 处理 |
|---|---|---|
| `blur` 兜底监听器回调为空（死代码） | `lifecycle-adapter.js:21-24` | 移除 |
| hide 时未暂停音频 | `platform.js:74-76` | hide → `audio.suspend()` |
| `_interrupted` 死代码 | `douyin-ad.js:92-95` | 随 P1 修复一并清理 |
| 广告失败/中断也消耗每局次数 | `game-ad-coordinator.js:69/83/96` | 保留（防刷设计），在文档中明示 |
| wechat-ad 空壳 + 内存存储 | `wechat-ad.js` / `platform.js:28` | 保留现状，文档明示"预留，未达可提交状态" |
| H5 构建无压缩/指纹 | `build-h5.js` | V5.0 保持复制式（风险可控），版本参数统一由构建写入 |
| favicon 404 噪声 | — | 新增 favicon link 消除 |
| tools/ 40+ 一次性脚本 | `tools/` | 不清理（历史证据链），文档标注 |
| `world.js:_buildEnvironment` 与 `models.js` 旧僵尸工厂/旧门工厂为死代码 | `world.js:188-434`、`models.js:5-431`、`models.js:433-648` | 保留 models.js 中仍被引用的工具函数，移除确认无引用的死代码（见 V5.0 修改） |
| `server.js` 路径检查前缀绕过 | `tools/server.js:17` | 仅本地开发用，改为 path.relative 校验 |

## 4. 资源生命周期审查（任务书 2.3）

结论：整体健康，无 GPU 内存持续增长路径。

- **GLB 缓存**：`SoldierModelLoader` / `EnemyModelLoader` 单例 + Promise 缓存，load 失败释放场景并允许重试（`enemy-models.js:57`）；hero/lod 材质合并共享（`enemy-models.js:35-36`）。
- **实例化**：敌人经 `EnemyArmyRenderer` 固定容量(160/银行) InstancedMesh 渲染，模型 Group 只作锚点；僵尸死亡动画完成后仅移除锚点，几何/材质永共享不释放（`enemies.js:205-212` 判定 `merged` 跳过 dispose）——正确。
- **对象池**：子弹/粒子/ Spit 弹/枪口光/冲击波/浮动文字均有池；浮动文字纹理缓存上限 128 并淘汰未引用项（`effects.js:70-74`）。
- **门资源**：每局重建，clear/fadeRemove/refresh 均遍历 dispose 几何、材质、贴图（`gates.js:33-44,124-136,160-176`）。V42 门 `ownsResources=true` 与该约定一致。
- **广告暂停恢复**：协调器 pauseGame/resumeGame 钩子 + `AdService._onAppHide` 中断结算（`ad-service.js:176-182`）。
- **页面隐藏恢复**：`visibilitychange` → show 时 `audio.resume()`（iOS suspended 场景）；hide 侧缺音频暂停（3.5 表中修复）。
- **待修复**：`Enemy.update` 中狂暴 `traverse` 直改共享材质 emissive（`enemies.js:133-137`）——狂暴红色会永久写入共享材质影响后续实例；V5.0 改由实例色 instancing color 通道表达（`enemy-models.js` 已有 per-instance color 机制，phaseIndex≥3 已在用 1.35,0.72,0.75 红色调，直接复用即可）。

## 5. 修改计划（V5.0 执行序）

1. movement 语义修复 + 单测更新（P0）
2. 广告修复四件套：tt 接线 / 超时 / 配置链 / 生产隔离（P1）
3. 抖音构建重写为单文件 bundle + 缺失即 throw（P0）
4. 抖音音频分支 + hide 静音 + blur 死代码清理（P1/P2）
5. 狂暴共享材质污染修复（P2）
6. npm install 恢复 e2e；全量测试基线
7. 截图驱动视觉验收（≥85 分标准）→ 美术/UI 迭代
8. 平衡自动模拟（100+ 次 L1 + 全关卡）→ 数值调整
9. 性能矩阵测试（31/100/300/500 人战斗场景）
10. H5 构建 + 冒烟测试 + 部署文档；抖音构建产物人工检查清单
11. 交付文档 + 最终报告 + 提交推送

每阶段一个独立 git commit。
