# 微信小游戏 V1.0 — 双端架构说明 (V12)

> 目标：**一套游戏核心，两端运行** — H5 持续运营，微信小游戏首发。
> 原则：不重建、不删减玩法、不为适配分叉数值；平台差异全部收敛在适配层与入口。

---

## 1. 总体分层

```text
┌──────────────────────────────────────────────────────────┐
│                     游戏核心（100% 共用）                  │
│  js/game.js / combat / squad / enemies / gates / skills  │
│  pacing / weapons / growth / equipment / economy / save  │
│  world / effects / art-v42 / soldier-renderer / models   │
├──────────────────────────────────────────────────────────┤
│                   平台适配层 js/platform/*                │
│  Platform 门面(平台检测) → storage / lifecycle / audio   │
│  / share 适配器；生产代码只依赖 Platform.*               │
├────────────────────────────┬─────────────────────────────┤
│        H5 宿主             │      微信小游戏宿主           │
│  index.html + 浏览器 DOM   │  wechat-game/ 构建产物        │
│  (原生 DOM 渲染 UI)        │  game.js 入口 + minidom UI    │
│                            │  引擎(canvas 光栅化 UI)       │
├────────────────────────────┴─────────────────────────────┤
│                广告 js/ads/*（平台无关核心 + 平台实现）      │
│  AdService 状态机 + RewardLedger 防重账本 + 频控协调器     │
│  实现: WebMock / DouyinAd / WechatAd(激励视频)            │
└──────────────────────────────────────────────────────────┘
```

## 2. 微信端运行时（构建产物 `wechat-game/`）

| 文件 | 职责 |
|---|---|
| `game.js` | 入口：wx 环境装配 → minidom 运行时 → `__gameEnv` 全局环境表 → THREE 接线 → bundle 加载 → UI 纹理叠加 → 生命周期/触控桥接 |
| `minidom.js` | UI 引擎三模块拼接：html-parser（构建期+运行时 DOM 解析）、css-parser（级联/选择器/值解析）、minidom（虚拟 DOM/布局/光栅化/事件/滚动/动画/SVG） |
| `ui-dom.js` | 构建期由 index.html `<body>` 转出的 UI DOM 树 JSON |
| `ui-css.js` | 4 张样式表原文（运行时级联，保证视觉与 H5 同源） |
| `game-bundle.js` | 全部游戏脚本单作用域拼接（与 H5 同源，含 index.html 内联脚本保序） |
| `game-config.js` | 平台配置：广告位 ID（上线前必填）、版本号 |
| `game.json` | 竖屏、分包声明（assets/） |
| `project.config.json` | 开发者工具工程配置（appid 上线前必填） |
| `libs/three.min.js` | r149（与 H5 同一文件） |
| `assets/` | 分包：仅运行时 GLB + 头像 SVG（清单见 `assets-manifest.json`） |

## 3. 关键机制

### 3.1 全局语义注入（`__gameEnv` + 参数遮蔽）

游戏代码引用 `document/window/Image/Blob/URL/localStorage/rAF/…`。
- 微信真机：`GameGlobal` 可直写，入口把 minidom 的语义对象挂为全局；
- 浏览器模拟器（测试用）：`window.document` 不可重定义 → bundle 经
  `new Function('document','window',…, code)` **函数参数遮蔽**浏览器全局，
  语义与真机完全一致（`window.__gameEnv` 提供值）。

bundle 内 `window.X = X` 显式导出的模块（V42Art/GateCombos/SoldierModelLoader 等）
落在遮蔽 window 上，而 bundle 内裸标识符消费走真实全局链 —— 入口在 bundle 加载后
**回填真实全局**（`__game`/`__adService` 等异步赋值用 getter 活桥同步）。

### 3.2 minidom UI 渲染管线

1. **样式**：规则匹配（缓存）→ 级联（含 `!important`）→ 继承 → var() 替换；
2. **布局**：flex（含 wrap/justify/align/grow/shrink）、绝对定位、grid(2列退化)、
   文本折行/ellipsis、滚动容器、border-box；
3. **绘制**：圆角矩形/linear·radial 渐变/多层 box-shadow/边框/文字(间距·对齐·阴影·省略号)/
   内联 SVG 子集/img(contain 缩放)，z-index 排序；
4. **上屏**：整树光栅化到离屏 canvas → `THREE.CanvasTexture` → 正交相机叠加
   （`renderer.autoClear=false`，帧首手动清屏，主场景 → UI 场景两遍渲染）；
5. **脏检测**：DOM 版本号 + style 快照差分 + 动画驱动，仅在变更帧重绘。

### 3.3 输入桥接（触摸双通道）

`wx.onTouch*` → **minidom 命中测试**（遵循绘制顺序，`pointer-events` 语义与浏览器一致，
`pe:none` 的容器不拦截但其子元素可显式 `auto`）→ 命中 UI 元素则派发
`touchstart/touchmove/touchend/click`（冒泡）并消费；命中 3D 画布区域则转发给
游戏在主 canvas 上注册的处理器（拖动换跑道）。

### 3.4 资源加载（MiniGLTFLoader）

GLB 包内文件用 `wx.getFileSystemManager().readFile` 读 ArrayBuffer → `GLTFLoader.parse`；
assets 分包未就绪时 `wx.loadSubpackage` 后自动重试（最多 3 次）。
GLB 内嵌贴图经 Blob/URL shim → base64 data URI → `wx.createImage` 解码。
安装时机在 bundle 的 GLTFLoader 段之后、game.js 自启动之前（保证首批加载即走适配路径）。

### 3.5 生命周期

| 事件 | 行为 |
|---|---|
| `wx.onHide` | `Platform.lifecycle` → 广告中断结算(不发奖) + 音频挂起 + **战斗自动暂停** |
| `wx.onShow` | 音频恢复；保持暂停态由玩家手动继续（状态不丢失） |
| `wx.onWindowResize` | minidom 视口更新 + 游戏 resize |
| `wx.onError` | 全局错误捕获日志 |

### 3.6 存档（平台独立接口）

`GameProfile` → `Platform.storage(GameStorage)`：
- 微信：`WxStorageAdapter`（wx.getStorageSync 系列，JSON 语义对齐抖音适配器）；
- **V12 加固**：`setSafe/getSafe` 主档+.bak 双写、损坏自动回退备份、双份损坏镜像
  现场（`.corrupt`）不静默清零；
- H5 旧裸键（pz_quality/pz_shake_off/pz_progress）经 `getLegacy/setLegacy` 兼容迁移。

## 4. 广告（激励视频）

- `WechatAdService`（js/ads/wechat-ad.js）：`wx.createRewardedVideoAd`，
  仅 `onClose res.isEnded === true` 发奖；load/show 失败重试一次；dispose 竞态防护；
- 广告位 ID 从 `window.__GAME_SETTINGS.ads.wechat.rewardVideo` 读取（构建期注入
  game-config.js）；**未配置 → isAvailable()=false 如实降级，不伪造广告**；
- 发奖经 AdService 状态机幂等结算 + RewardLedger 事务账本（7 天过期）防重复领取；
- 广告位：复活 / 双倍结算 / 刷门 / 免费补给（频控见 game-ad-coordinator.js）。

## 5. 包体与分包

- 主包 1.51 MB（代码 + three.js + UI 树/CSS）< 4MB 平台上限 ✓
- 分包 `assets/` 3.37 MB（26 个运行时 GLB + 2 头像 SVG；源纹理/文档/未引用文件不进包）< 4MB ✓
- 整包 4.88 MB < 30MB ✓
- 首局资源优先级 P0（士兵+普通/快速僵尸，约 1.6MB）随主包逻辑首启即载；
  其余模型战斗中错峰续载（游戏中 1.5s/个）。

## 6. 测试策略

- **构建自检**（build-wechat.js）：bundle 段标记精确匹配（修抖音构建假阳性教训）、
  关键类/资源/包体预算硬校验；
- **模拟器 e2e**（tests/e2e/wechat-emulator.js）：浏览器内 wx 模拟层加载真实构建产物，
  playwright 驱动真实 WebGL + minidom，17 项断言（启动/UI/战斗/拖动/暂停/存档/
  生命周期/广告降级/帧率）；
- **单元测试**（tests/unit/suites/09-wechat-storage.test.js）：WxStorageAdapter、
  存档加固、旧键迁移、平台检测 10 项。
- **微信开发者工具/真机**：无法自动化的部分见 WECHAT_RELEASE_CHECKLIST.md 人工步骤。
