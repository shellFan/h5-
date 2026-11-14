# V5.0 微信小游戏发布报告（V50_WECHAT_RELEASE.md）

## 当前状态：适配层预留，未达可提交审核状态（如实标注，不伪造）

## 现有资产盘点
| 项 | 现状 |
|---|---|
| 平台检测 | ✅ `platform.js` 已含 wechat 分支（`typeof wx !== 'undefined' && wx.getSystemInfoSync`） |
| 广告适配器 | ⚠️ `js/ads/wechat-ad.js` 为 8 行空壳（继承 AdService，`_doIsAvailable` 恒 false）——明确"预留"，不伪造可用 |
| 存储适配 | ⚠️ wechat 分支使用 MemoryStorageAdapter（`platform.js:28`）——存档不持久；微信需补 WxStorageAdapter（wx.getStorageSync 同族 API，可参照 TtStorageAdapter 直接实现） |
| 音频 | ⚠️ V5.0 抖音分支走 tt.createInnerAudioContext；微信需同构实现（wx.createInnerAudioContext） |
| 构建 | ❌ 无 `tools/build-wechat.js`；但 V5.0 抖音 bundle 架构（环境模拟层+单文件 bundle+GLB FileSystemManager 读取）**完全可复用于微信**——微信与抖音小游戏 API 形态高度同源（tt.* ↔ wx.*） |

## 若要达到"可提交审核"需要的工程量（清单）
1. `tools/build-wechat.js`：复制 `build-douyin.js`，替换 tt→wx 调用（约 8 处），game.json 按微信规范（`deviceOrientation: portrait`）
2. `platform.js` wechat 分支：WxStorageAdapter（~30 行，参照 `storage-adapter.js:74-112` 的 TtStorageAdapter）
3. `audio-adapter.js`：`_platform === 'wechat'` 分支走 wx.createInnerAudioContext（复用 _synthWav）
4. `wechat-ad.js`：真实实现 wx.createRewardedVideoAd（结构参照 douyin-ad.js，~100 行）+ 广告位配置注入
5. 微信开发者工具真机验证（清单同 V50_DOUYIN_RELEASE.md 第 2 节）
6. 微信小游戏类目/版权/隐私资质（平台侧人工事项）

预计工程量：代码 1-2 天 + 真机调试验证。

## 为什么 V5.0 不直接交付微信构建
- 任务书优先级：P2（微信适配列于抖音/广告/性能之后）
- 无微信开发者工具/AppID/测试账号，无法验证任何一条真机链路——交付未经真机验证的构建产物违背"不得伪造平台验证"原则
- 抖音构建（V5.0 重写）已验证 bundle 架构可行性，微信复用路径清晰

## 结论
- **微信可提交审核**：❌（适配层预留，缺 4 项工程 + 平台资质）
- **微信已审核通过**：❌（未提交）
