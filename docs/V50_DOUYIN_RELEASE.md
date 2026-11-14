# V5.0 抖音小游戏发布报告（V50_DOUYIN_RELEASE.md）

## 构建产物
```bash
npm run build:douyin    # 产出 dist/douyin/  主包 0.98MB / 整包 4.92MB
```
- **主包 0.98MB**（< 抖音 4MB 上限）；assets（4.2MB 全部 GLB）置于分包 `assets/`（`game.json subpackages`）
- 产物结构：`game.js`（入口）+ `game-bundle.js`（单一模块作用域拼接包）+ `game.json` + `game-config.js`（广告位配置）+ `libs/three.min.js` + `assets/`（分包）
- 构建自检：13 个关键符号存在性校验（Game/Squad/Platform/ loaders/GLTFLoader 接线/V42Art），缺失即 throw；主包超 4MB 直接构建失败

## V5.0 架构重写（修复 V4.x 产物不可运行的 P0）
抖音小游戏 CommonJS 每文件独立模块作用域，H5 顶层声明跨文件不可见。V5.0 改为**单文件 bundle**：
- 按 index.html 加载顺序拼接全部 27 个游戏脚本 → `game-bundle.js`（含 index.html 内联引导的等价移植）
- 入口 `game.js`：小游戏环境模拟层（document/window/canvas/Image/Blob/URL/URLSearchParams/location）→ `require('./libs/three.min.js')`（UMD→CJS）→ GLTFLoader 接线 → require bundle → 启动
- **GLB 加载适配**：THREE.FileLoader 依赖 XHR（小游戏无）→ `MiniGLTFLoader` 包装：`tt.getFileSystemManager().readFile` 读 ArrayBuffer → `GLTFLoader.parse`
- **分包加载适配**：readFile 失败（分包未就绪）自动 `tt.loadSubpackage({name:'assets'})` 后重试一次
- **贴图路径适配**：GLTFLoader 内嵌贴图走 Blob→URL.createObjectURL → shim 转换为 data URI（`tt.arrayBufferToBase64`），Image 外观层拦截 blob: URL

## 平台层适配状态
| 能力 | 状态 | 实现 |
|---|---|---|
| Canvas/WebGL | ✅ 代码就绪 | tt.createCanvas（首屏主画布）+ World 渲染器 |
| 触摸 | ✅ 代码就绪 | tt.onTouchStart/Move/End/Cancel → canvas 事件桥接（含多点 touches 映射） |
| 屏幕/DPR | ✅ 代码就绪 | getSystemInfoSync → 主画布尺寸/resize 模拟层 |
| 生命周期 | ✅ 代码就绪 | tt.onAppHide/onAppShow → LifecycleAdapter（暂停/音频/广告中断） |
| 存储 | ✅ 代码就绪 | TtStorageAdapter（get/set/removeStorageSync + JSON 兼容） |
| 音频 | ✅ 代码就绪（V5.0 新增） | tt.createInnerAudioContext + 运行时合成 WAV data URI（8bit 8kHz 包络振荡） |
| 分享 | ✅ 代码就绪 | ShareAdapter（tt.shareAppMessage） |
| 激励视频 | ✅ 代码就绪 / ⚠️ 待真机 | DouyinAdService（isEnded 判定/失败重载重试/超时兜底）——**需先配置广告位 ID** |

## 上线前必须完成的人工步骤（本环境无法完成，如实保留待办）
1. **抖音开发者工具导入** `dist/douyin` → 真机预览（本环境无该工具，未执行）
2. 需真机验证清单（代码就绪但未经真机执行）：
   - GLB 分包加载时序（loadSubpackage → readFile 重试链路）
   - GLB 内嵌 PNG 贴图在 tt.createImage data URI 的解码
   - tt 音频播放音量/延迟/并发限制
   - 激励视频 onClose/isEnded 真实回调时序
   - 触摸滑动跟手性（事件频率与 H5 差异）
   - 主画布 WebGL 上下文兼容性（个别安卓机型）
3. **AppID 与账号**：无抖音开放平台账号/AppID —— 未创建小游戏项目、未配置广告位
4. `game-config.js` 填入激励视频广告位 ID（留空则广告功能如实降级不可用）
5. 提审前自检：包体（已合规）/ 无外链请求 / 隐私权限说明 / 年龄适配

## 交付状态（不混淆）
- **代码适配**：完成（构建产物结构自检通过）
- **抖音可提交审核**：❌ 未达——需真机预览通过 + AppID + 广告位配置（人工步骤）
- **抖音已审核通过**：❌ 未提交

## 运行验证（本环境能力范围）
- 构建命令 exit 0，产物完整性与符号自检通过
- 主包/整包体积合规
- 无法执行：抖音开发者工具预览/真机调试（无工具与账号）——**不伪造平台验证**
