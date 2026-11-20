# 微信运行时兼容性清单 (V12)

> 结论先行：现有技术栈（Three.js r149 + GLTFLoader + WebGL + 本地 GLB）在微信小游戏
> 运行时可完整运行，兼容点已全部落进入口适配层与 minidom，**游戏核心零改动**。

## 1. API 依赖审计结论（逐项）

| 依赖 | H5 中的用法 | 微信端方案 | 状态 |
|---|---|---|---|
| WebGL | THREE.WebGLRenderer(mainCanvas) | wx.createCanvas() 首次调用即上屏画布，getContext('webgl') 原生支持 | ✅ |
| requestAnimationFrame | 主循环 | 小游戏 GameGlobal 原生提供 | ✅ |
| performance.now | 帧计时 | 原生提供 + 入口兜底 | ✅ |
| document.getElementById / createElement / body | game.js/ui-v60/art-v42 UI 操作 | minidom 虚拟 DOM（index.html 构建期转树 + CSS 级联 + canvas 光栅化） | ✅ |
| document.createElement('canvas') | 程序化纹理(路面/门牌/文字贴图) | 第 2+ 次 wx.createCanvas() 返回离屏画布，2D API 全可用 | ✅ |
| Image / createElementNS('img') | three ImageLoader、UI 头像 | wx.createImage 混合宿主（真实图源可进 WebGL/drawImage，同时承载 DOM 语义） | ✅ |
| fetch / XMLHttpRequest | three FileLoader | 未走该路径：GLB 用 FileSystemManager.readFile + parse（MiniGLTFLoader） | ✅ 绕开 |
| TextDecoder | GLTFLoader JSON 解码 | 微信 iOS/Android JSCore 现行基础库可用；如遇老旧基础库需 polyfill（清单内无其它使用） | ⚠️ 见 §3 |
| Blob / URL.createObjectURL | GLTFLoader 内嵌贴图 | minidom shim：注册表 + base64 data URI 换入 wx.createImage | ✅ |
| localStorage | 存档/设置 | 无此全局 → WxStorageAdapter（同步存储）；旧裸键 getLegacy 兼容 | ✅ |
| AudioContext / InnerAudioContext | 合成音效 | wx.createWebAudioContext 优先（振荡器 API 同 H5），回退 InnerAudioContext + 合成 WAV | ✅ |
| 触摸事件 | canvas touchstart/move/end | wx.onTouch* → UI 命中分流 → 游戏画布处理器转发 | ✅ |
| PointerEvent / mousemove / keydown | 桌面调试用 | 微信端为移动优先输入，window 监听空实现 | ✅ 无需 |
| navigator.share / location.reload | 分享/画质设置 | wx.shareAppMessage；画质写入偏好+提示重启 | ✅ |
| createImageBitmap | three 图像解码分支 | 未提供 → 自动落 TextureLoader 路径（与真机一致） | ✅ 绕开 |
| ES 语法 | var/ES5 为主 | 已移除唯一的 ES2020 可选链（V12-008）；bundle 关闭 es6 编译按原样执行 | ✅ |

## 2. 纹理与模型

- 所有 GLB 自包含（内嵌 basecolor/ORM），无外部纹理 URI；
- PBR 材质的 LinearTosRGB 显示补丁（onBeforeCompile + customProgramCacheKey）
  在微信 WebGL 上下文行为一致（纯 shader 文本替换）；
- ORM 共用一张 metalnessMap/roughnessMap，InstancedMesh + DynamicDrawUsage 正常。

## 3. 已知风险与缓解

| 风险 | 说明 | 缓解 |
|---|---|---|
| 低版本基础库 TextDecoder | 个别 iOS 老基础库缺失 | GLTFLoader 2 处使用；如遇可注入 Uint8Array 手写解码 polyfill（入口一处即可）；上线前用最低支持基础库真机回归 |
| emoji 图标跨设备字体 | HUD/页面图标大量使用 emoji | iOS/Android 系统均有 emoji 字体；极老机型可能缺字 → 后续版本可图集化（已记录 UI_REVIEW） |
| canvas 2D getImageData | enemy-models 派生自发光贴图使用 | 微信离屏 canvas 支持 ImageData；低功耗设备性能点已错峰加载 |
| 分包加载时序 | 首次进战 P2 资源未就绪 | loadSubpackage 自动重试 + 未知体格 normal 回退（原有 V11.6 机制） |

## 4. 与 H5 的数值/玩法一致性

双端共用同一份 `js/*.js`（构建仅做拼接，不做改写）——战斗数值、门奖励池、
技能/武器/装备/成长、存档结构（profileVersion 3）完全一致，不存在分叉。
