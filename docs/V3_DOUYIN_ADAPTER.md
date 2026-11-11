# V3 抖音小游戏适配文档 (Phase 5)

## 1. 平台抽象层(js/platform/)

| 适配器 | H5 实现 | 抖音实现 | 说明 |
|--------|---------|----------|------|
| StorageAdapter | localStorage(探测+内存降级) | tt.getStorageSync/setStorageSync | GameStorage 统一 `pz_squad_` 前缀 |
| LifecycleAdapter | visibilitychange | tt.onAppHide/onAppShow | 切后台中断广告/暂停游戏 |
| AudioAdapter | WebAudio 合成音效(无资源) | 降级: AudioContext 不可用则静默 | iOS suspend 由 onShow 恢复 |
| ShareAdapter | navigator.share 降级 | tt.shareAppMessage | 失败静默不阻塞游戏 |
| AdsAdapter | WebMockAdService | DouyinAdService | 见 V3_AD_MONETIZATION.md |
| InputAdapter | touch+mouse+keyboard | tt.onTouchStart/Move/End 桥接 canvas | 见构建入口 game.js |
| PlatformAdapter | — | — | 门面单例 `Platform`, 运行时 `detectPlatform()` |

生产代码只依赖 `Platform.*`, 不直接触碰 `window/tt/wx`。

## 2. 构建

```
npm run build:h5      → dist/h5/      纯静态部署
npm run build:douyin  → dist/douyin/  抖音开发者工具直接打开
```

抖音构建产物:
- `game.js` — 入口: DOM/Canvas 模拟层(document/window/触控桥接) + 按序 require 游戏脚本 + 启动
- `game.json` — portrait 方向等基础配置
- `game-config.js` — 广告位ID等平台配置(**上线前必填**)
- 游戏逻辑与 H5 **共用同一份 js/**, 零改动

## 3. DOM 模拟层覆盖范围(仅游戏实际用到的 API)

| 模拟对象 | 覆盖点 |
|----------|--------|
| mainCanvas | tt.createCanvas 首屏画布; parentElement/clientWidth 供 World.resize |
| document.createElement('canvas') | 纹理绘制(道路/文字/玻璃/枪口闪光) |
| document.createElement('img') | 立即触发 onerror → combat.js 走程序化兜底纹理; UI avatar 由 index.html 加载, 小游戏无此层(不影响玩法) |
| document.getElementById | 'game-canvas' 返回主画布; UI 元素返回 null(game.js 全部判空) |
| window.resize/键盘 | no-op |
| 裸 requestAnimationFrame / Image | 已补全局 shim |
| 触控 | tt.onTouchStart/Move/End → canvas listener 桥接(队形切换) |

## 4. 环境兼容性审计结论

- **Three.js r149**: UMD 构建在 tt canvas WebGL 上可运行(WebGL2 优先自动回退); CanvasTexture 接受 tt canvas。⚠️ 需开发者工具实测(见检查单)
- **音频**: 小游戏无 AudioContext 需 `tt.createInnerAudioContext`; 当前游戏用 WebAudio 合成音效 → 抖音端静默降级(不影响玩法), 音效接入列为后续任务
- **存储**: TtStorageAdapter JSON 兼容层已处理 tt 原生字符串存取
- **前后台**: tt.onAppHide → LifecycleAdapter → 广告中断/游戏暂停恢复
- **DPR**: tt.getSystemInfoSync().pixelRatio 用于 renderer.setPixelRatio

## 5. 包体优化(按官方要求)

- Three.js 本地化(608KB) — 必须包含在首包
- 游戏全部程序化生成(无外部图片/音频/模型文件), 首包预计 <1.5MB ✅
- assets/art-v1/*.svg 仅用于H5 UI头像; 小游戏端 UI 为 DOM 层缺失, 不加载 → 可从首包剔除(构建已复制, 如超包体限制可移除)

## 6. 验证状态(诚实记录)

| 项目 | 状态 |
|------|------|
| 构建产物生成 | ✅ 已验证(node tools/build-douyin.js) |
| 开发者工具启动/Canvas/WebGL/触控/存档 | ⏸ **未验证 — 本机未安装抖音开发者工具** |
| 真机广告/分享/前后台 | ⏸ **未验证 — 无真机与平台账号** |
| 性能达标 | ⏸ 待真机 |

安装抖音开发者工具后验证步骤:
1. 打开开发者工具 → 导入 `dist/douyin` 目录(测试号)
2. 检查 Console 无报错, 画面渲染, 触控切道
3. 填入真实广告位ID后验证四条广告路径
4. 真机预览 + 性能面板(FPS/内存)
