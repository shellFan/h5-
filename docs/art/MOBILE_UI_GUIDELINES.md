# 手机端 UI 适配规范 (MOBILE_UI_GUIDELINES)

> 目标: 320px-430px 全宽度可用, 刘海屏安全区合规, 无遮挡/无溢出/无不可点按钮。
> 实现: style-v120.css 手机适配段; 测试: `tests/e2e/v101-mobile.js` + `tools/v120-capture.js` 响应式矩阵。

## 1. 视口矩阵 (必测)

| 宽×高 | 代表设备 | 关注点 |
|---|---|---|
| 320×568 | iPhone SE1 / 最小 Android | HUD 不溢出、按钮可用 |
| 360×800 | 主流 Android | 基准密度 |
| 390×844 | iPhone 12-14 | 基准构图 |
| 430×932 | iPhone Pro Max | 大屏不空旷 |

DPR: 1 / 1.5 / 2 / 3 各验一轮(渲染 pixelRatio 按画质档 1/1.5/2 封顶)。

## 2. 安全区 (刘海屏)

- `#hud` 左右 padding: `calc(env(safe-area-inset-*) + 10px)`; `#top-bar` 顶部 margin 走 inset-top。
- `v60-page` 底部: `calc(env(safe-area-inset-bottom) + 12px)` — 手势条不压按钮。
- viewport 已锁定 `viewport-fit=cover`(index.html)。
- 装饰性画面(3D 场景)可出血到安全区外; 交互元素必须内收。

## 3. 触控

- 一切可点元素 ≥44×44px(style-v120.css 对 btn-pause/btn-refresh-gates 强制; 其余按钮逐个核查)。
- 点按热区不跨屏幕边缘; 相邻可点间距 ≥8px。
- 按压反馈: transform 位移 ≤2px, 不改变布局。

## 4. 文本与数字

- 最小正文字号 10px(小屏 meta 行), 主数值 ≥14px + tabular-nums。
- 禁止文本截断承载关键信息(战报/奖励明细) — 卡片换行优先于省略号。
- 语言: 中文为主(现有文案体系), 数字英文单位可混排。

## 5. 布局纪律

- 竖屏锁定; 禁止横向滚动(`html,body overflow-x hidden` 由前层保证)。
- 全屏页(v60-page)内容 flex-fill 滚动, 列表项高度自适应(前层 V11.6 已建立)。
- 弹层(暂停/结算/商店)居中卡片, 宽度 ≤屏宽-32px, 内边距 ≥16px。
- 320px 专用密度档: HUD 胶囊缩排、人数气泡 scale 0.92、排行徽章缩小(style-v120.css @media max-width:360px)。

## 6. 微信小游戏/抖音构建注意

- 包体: 主包 <4MB, assets 走分包(tools/build-douyin.js 已实现); 新增大文件素材前先跑构建测包体。
- 无 DOM 滚动条样式依赖(小游戏 canvas 环境) — v60 页面在构建链路的适配以 `npm run build:douyin` + 现有 E2E 为准。
- 环境无 localStorage → 一律走 `Platform.storage`(world.js shake 偏好已示范)。

## 7. 验收检查单 (每次 UI 改动)

- [ ] 320/360/390/430 四宽截图无遮挡/溢出/截断
- [ ] 安全区: 顶部 HUD、底部按钮不压刘海/手势条
- [ ] 一切按钮 ≥44px 且可点(模拟触控)
- [ ] 横向溢出检查: `document.documentElement.scrollWidth === clientWidth`
- [ ] DPR 2/3 下文字清晰(无模糊/锯齿异常)
- [ ] 控制台零错误(tools/v120-capture.js 自带 watchPageErrors)
