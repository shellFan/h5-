# V15 · 微信小游戏专项 (WECHAT_QA)

## 构建与自动化验收
- node tools/build-wechat.js: **通过**(主包+分包+资源清单)
- wechat-emulator(20 项): **20/20**(本轮 style-v60 修复后复验)
  覆盖: 首页渲染/开始/战斗 HUD/触摸移动/存档/军械库图集/结算/切换后台/恢复

## 本轮修复
- style-v60.css 地图列表 overflow 修复同步进微信包(ui-css 打包), 模拟器复验通过;
- DEF-2 加载屏修复(game.js 闩锁+隐藏)重建后模拟器复验 **20/20**。

## 兼容红线执行情况(V14.2 标准)
- CSS: 无 :not(:empty) 等 minidom 不支持伪类 ✓
- DOM: 无真实节点混入 minidom(WeaponShowcase wx/__minidom 双守卫) ✓
- 新 js 四处登记(index/h5/wechat/douyin 构建) ✓

## 人工验证限制(如实记录)
- **微信开发者工具/真机预览: 本环境不可用, 未执行** — 以下项目待人工验证:
  广告位真实拉起 · 分享接口真机回执 · iOS/Android 真机帧率 · 分包在开发者工具的
  体积复核 · 触摸生命周期真机边界。清单见 docs/WeChat/WECHAT_RELEASE_CHECKLIST.md。
- 不将模拟器结果伪装成真机验收。
