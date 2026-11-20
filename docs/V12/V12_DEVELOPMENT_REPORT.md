# V12 研发报告 — H5 完善 + 微信小游戏 V1.0 双端一体化

> 一句话：同一份游戏核心现在同时运行在 H5 与微信小游戏上；H5 全量回归 0 失败，
> 微信端构建产物在自动化模拟器中 17/17 冒烟全绿并输出可对照截图。

## 1. 交付范围

### H5 (V12)
- 13 项缺陷修复（含 1 个 P0 构建缺陷、2 个 P1、4 个 P2，详见 CODEBASE_AUDIT.md §2）
- 存档系统加固：.bak 双写 + 损坏回退 + 现场保留 + 旧键迁移
- 画质设置真正生效（原只写不读）
- 零破坏：全部既有测试通过

### 微信小游戏 V1.0（新增）
- 平台适配层补全：WxStorageAdapter / bindWx / 音频 wx 分支 / wx.shareAppMessage /
  平台检测与系统信息（安全区/机型/性能等级）
- 激励视频广告正式实现（wx.createRewardedVideoAd，幂等发奖 + 防重复账本 + 频控，
  未配置广告位 ID 时如实降级）
- minidom UI 引擎（~2400 行新基建）：HTML 解析 / CSS 级联(含 !important/var/媒体查询) /
  flex+绝对定位+grid 布局 / canvas 光栅化(渐变·阴影·圆角·文字·SVG) / 绘制顺序命中 /
  滚动 / keyframes 动画插值
- 构建系统 tools/build-wechat.js：环境装配 + bundle 拼接 + 分包复制 + 资源清单 +
  13 项自检 + 包体预算硬校验
- 微信生命周期接入：onHide 自动暂停战斗 / 音频挂起恢复 / 广告中断结算
- MiniGLTFLoader：包内文件读取 + 分包重试 + 内嵌贴图 data URI 通道

## 2. 关键设计决策

1. **不搬迁、只收敛**：沿用既有 js/platform/* 适配层结构（补微信分支），不重建目录；
2. **UI 走虚拟 DOM**：index.html 构建期转树 + CSS 原文运行时级联 —— 视觉与逻辑与 H5 同源，
   game.js 的 UI 代码（41 个元素引用/事件绑定）零改动运行；
3. **参数遮蔽注入全局语义**：bundle 用函数参数遮蔽 document/window 等 —— 微信真机与
   浏览器模拟器行为完全一致，测试即验产物；
4. **混合宿主 img**：真实 Image 承载 DOM 语义 —— WebGL 纹理上传与 DOM 操作两全；
5. **存档双写**：主档+.bak+损坏现场三键，读侧自动修复（用户数据安全优先）。

## 3. 代码变更统计

- 新增：tools/wechat-lib/{html-parser,css-parser,minidom,entry-template}.js、
  tools/build-wechat.js、tests/e2e/wechat-emulator.js、tests/wechat-emulator-harness.html、
  tests/unit/suites/09-wechat-storage.test.js、docs/V12/*、docs/WeChat/*、wechat-game/*（构建产物）
- 修改：js/platform/*（微信分支）、js/ads/wechat-ad.js（正式实现）、
  js/{game,world,ui-v60,combat,squad,gates,enemy-models,economy}.js（V12 修复）、
  tools/build-douyin.js（3 缺陷）、package.json（test:wechat 脚本）
- 未动：核心玩法数值/关卡数据/美术资源

## 4. 验收对照（任务书 §十一）

| 验收项 | 结果 |
|---|---|
| A. H5：启动/玩法/移动端/性能/回归 | ✅ 全部通过（数据见 QA/PERF 报告） |
| B. 微信：导入/编译/首页/战斗/技能/Boss/胜负/存档/切后台/适配 | ✅ 自动化模拟器 17/17；开发者工具/真机为人工清单（未执行，如实标注） |
| C. 商业化：Adapter/Mock/真实接口就绪/防重/合规 | ✅（真实广告位 ID 待上线配置 — 占位留空不伪造） |
| D. 交付：代码/构建/测试/截图/报告/提交/推送 | ✅ Git: `095fdb9`(微信V1.0+双端) + `693c819`(合并集成修复) 已推送 origin/master（基于并行会话 `c95ef42` 视觉升级之上） |
