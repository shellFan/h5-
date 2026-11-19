# V10.1 专项优化报告 — 移动端适配 + 性能 + UI 美术 (2026-11-19)

> 基线: VNext 交付后工作树 (HEAD 87d7bc6) · 全部增量修改, 无重写/无删除功能/无迁移引擎。

## 1. 移动端适配

### 修改前问题 (tools/v101-matrix-audit.js 十分辨率实测, 共19项)
1. **关卡选择按钮 36×36** — 全部分辨率低于 44px 触控最小目标 (历史QA曾从29提升到36, 仍不足)。
2. **360×640** 首页面板内容裁切需滚动、导航按钮越界、职业卡越界、训练弹窗内容裁切。
3. **393×852 / 402×874** 首页面板顶部被裁出屏幕 (紧凑断点只覆盖到 ≤844px 高)。
4. **768×1024 平板 Canvas 只铺 576px** (`max-width: calc(100vh*9/16)` 信箱化规则在竖屏平板误伤)。
5. **缺失 `viewport-fit=cover`** — 刘海屏 `env(safe-area-inset-*)` 全部返回 0 (HUD 顶部/底部安全区实际无效)。
6. 无全局触摸卫生 (双击缩放/长按选中/点击高亮/滚动穿透风险)。

### 修改方案与文件
| 文件 | 修改 |
|---|---|
| index.html | viewport 增加 `viewport-fit=cover` |
| style.css | `#game-container` 信箱化只在 `@media (orientation: landscape)` 生效 (竖屏含平板铺满全宽); 全局触摸卫生 (`touch-action: manipulation` / `user-select: none` / tap-highlight 去除 / overscroll-behavior) |
| style-v42.css | 关卡按钮 36→42px(+1px边框=44 触控达标) |
| style-v60.css | ① 常驻面板安全边界 (max-height + 内部滚动, 任何屏高不越界) ② 连续 clamp() 缩放取代离散断点 (logo/标题/任务卡/导航随视口高度收缩) ③ 首页信息架构紧凑化 (导航10钮2行×5列 44px、顶栏单行化 34→40px) ④ ≤740px 矮屏档 (隐藏副标题/压缩职业卡) ⑤ ≤660px 极矮屏档 (隐藏品牌行/操作提示/任务文案, 面板padding收紧) — **360×640 全内容零滚动完整可见** |

### 测试结果 (修改后)
**10/10 分辨率 0 问题** (360×640, 360×800, 375×812, 390×844, 393×852, 402×874, 414×896, 430×932, 440×960, 768×1024):
无横向溢出 / Canvas 铺满 / 触控目标达标 / 职业卡可见 / 面板在屏内 / 战斗 HUD 正常 / 暂停按钮达标。
弹窗本体永不越界 (内容内部滚动=移动端标准模式)。
数据: docs/v101_matrix_audit.json · 截图: docs/screenshots/v101-matrix/ (10分辨率×首页+战斗=20张)。

### 触摸操作
- 画布 `touch-action:none` + `passive:false` (已有, 验证保留); 全局按钮 `touch-action:manipulation` 防双击缩放。
- 主要按钮 (部署/导航/关卡/暂停) 全部 ≥40px, 主按钮 44px+。
- 弹窗/列表 `touch-action: pan-y` + `overscroll-behavior: contain` 防滚动穿透。
- 竖屏体验优先; 横屏下画面信箱化居中仍可操作。

## 2. 性能优化

### 剖析方法
Playwright + CDP `Emulation.setCPUThrottlingRate(4×)` + `deviceScaleFactor 2` 模拟中端手机;
CDP Profiler 采样定位热点 (battle300 场景, 120敌人)。

### 热点定位 (剖析实测)
| 热点 | 占比 | 根因 |
|---|---|---|
| `game.js _updateUI` | **17.3%** | 每帧 `getElementById` + 无条件 DOM 写 (进度条/属性面板/连杀/气泡) |
| native (program/GC) | 20.2% | 每帧对象分配 (Boss血条 filter×2 / 飘字 Sprite+Material / 进度节点 className 重写) |
| 每日任务上报 | 每帧×5 | `kills` 进度高频变化 → 近乎每帧全量 profile JSON 序列化落盘 |

### 优化措施 (全部按数据针对性实施)
1. `_updateUI` 脏检查重构: 进度条/属性面板/连杀/气泡/容器类名全部缓存比对, 仅变化时写 DOM; `getElementById` 缓存; `getDamage/getFireRate` 每帧由4次降为2次。
2. `_updateProgressNodes`: 全部节点 className 每帧重写 → 脏检查。
3. Boss 血条: 每帧 `filter+reduce` 双数组分配 → 单循环累加。
4. `effects.floatText`: Sprite+Material 池化复用 (原每条飘字新建)。
5. 每日任务上报: 0.5s 轮询 (保留 V10 QA 的变化才落盘)。
6. 广告按钮刷新降频至 0.5s。
7. 阴影贴图按画质分档: 中画质(多数手机) 2048→1024 (GPU 负担减半), 高画质保持 2048。

### 前后对比 (同环境: msedge headless, 4×CPU 节流 + DPR2, battle300/120敌)
| 场景 | FPS 前→后 | 平均帧时 前→后 | 最差帧 前→后 |
|---|---|---|---|
| 首页 | 227.7 → 227.1 (持平) | 1.7 → 1.7ms | 4.0 → 4.3ms |
| battle100 | 61.7 → **68.5** (+11%) | 4.85 → 4.21ms | 17.4 → 18.5ms |
| battle300 | 64.8 → **75.6** (+17%) | 5.67 → **4.84ms** | 33.8 → **18.5ms** |
| battle500 | 61.5 → **69.2** (+13%) | 6.03 → **5.72ms** | 19.7 → 53.5*(setCount尖峰) |
| Boss战 | 61.1 → **70.5** (+15%) | 6.27 → **5.26ms** | 23.1 → **16.7ms** |
| 特效风暴 | 69.3 → **79.7** (+15%) | 5.84 → **5.07ms** | 16.7 → **11.5ms** |

DrawCall 稳定 44-121; 三角数 battle100 1338k→467k (视锥剔除受益); 堆内存 13-26MB 无泄漏趋势。
基线/复测数据: docs/v101_perf_mobile_before.json / docs/v101_perf_mobile_after.json (桌面无节流对照: docs/v101_perf_before.json)。
质量分档 (高/中/低自动检测 + URL ?quality= 覆盖) 沿用现有体系, 渲染分辨率上限 1/1.5/2 DPR, 数值与胜负不受画质影响。

## 3. UI 美术优化

统一设计令牌 (`--v-blue/--v-gold/--v-card-bg/--v-radius`...) + 全组件按压反馈 (:active scale) +
金币变化脉冲动画 (coin-pulse) + 面板滚动条美化。视觉延续蓝色科技风, 零功能改动。

| 页面 | 状态 |
|---|---|
| 启动加载 | VNext 已实现真实进度; 本轮验证 3 分辨率适配 |
| 首页 | 紧凑化重构 (10分辨率全适配), 职业四卡/导航十宫格完整可见 |
| 战斗 HUD | 脏检查重构 (性能) + 既有 safe-area 验证保留 |
| 技能三选一 | 3D门内嵌实现 (既有), 矩阵验证无越界 |
| 训练/装备背包 | 背包卡片令牌化 + 按压反馈 (截图 vnext/training-bag) |
| 军械库/科技/图鉴 | 卡片阴影/圆角统一令牌 |
| 排行榜 | 名次配色/行卡片 (截图 vnext/rank-page) |
| 结算 | 胜金/败红渐变差异 (既有) + 掉落行 |
| Boss战 | 血条/预警/阶段 (既有, Boss E2E 124/124) |

## 4. Git 交付

- 分支: master (推送至 origin/master + feature/v8.0-full-game)
- 提交: 按模块分批 (fix/perf/style/test/docs), SHA 见 git log
- 回归: 92 unit + 29 e2e + 39 v51 + 37 v80 + 183 vnext + 32 visual + 11 soldier + 7 v41 + h5/douyin 构建 + 十关马拉松 33/33 + 移动端/性能 E2E 29/29 — 全绿
- **30 分钟长跑 (tools/v101-soak.js)**: 143 循环(反复开局/关卡切换/弹窗开关/挑战模式), **0 页面错误**, 堆 18.4→33.1MB(前段缓存填充, 后 20 分钟稳定 31-34MB 平台, 无泄漏趋势) — docs/v101_soak_log.json

## 5. 遗留问题

- **未实测真机**: 全部数据来自 CDP 节流仿真 (4×CPU+DPR2); 真机 (iOS Safari/WKWebView, 安卓 Chrome) 需实测验证 env() 安全区数值、WebGL 性能与触摸跟手性。
- **battle500 单帧 53ms 尖峰**: setCount(500) 初始化帧 (数组扩容+GPU上传), 稳态后消失; 如需彻底消除需分帧生成 (改动开局表现, 未做)。
- **(program) GC 20%**: 已降低分配源 (飘字/血条/进度节点), 但 three.js 每帧矩阵对象仍有基础开销; 进一步需深入 three.js 内部, 收益有限未做。
- **768×1024 平板帧时 3.4ms**: 面积更大渲染成本更高, 属预期; 平板画质自动检测已覆盖。
- **无法实测的设备**: 指令矩阵中的具体物理设备 (iPhone 393×852 等) 以视口仿真覆盖, 物理像素/DPR 组合未逐一实测。
