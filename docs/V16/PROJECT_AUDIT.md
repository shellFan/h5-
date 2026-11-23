# V16 · 项目审计 (PROJECT_AUDIT)

基线: V15 (a910263) · 扫描范围: js 31 模块 / assets 95 文件 / tests 20 套件 /
tools 14 脚本 / wechat-game 全包 / 5 平台 Adapter / 7 CSS。

## 技术栈确认(未变动)
Three.js r149(本地 vendor) · 原生 JS 无构建依赖 · Playwright-core E2E ·
WebAudio 合成音效 · H5/抖音/微信三端构建管线。

## 架构健康度
- 渲染: 士兵/怪物五部件实例化 + Boss 独立 GLB + 环境全实例化 + 单材质弹道 —
  DrawCall 预算内(99-103)。
- 加载: 关键集优先(6 GLB)+后台续载+BootProgress 闩锁(V15 修复)。
- 存档: profile 单键持久化, 刷新保留(audit 步验证)。
- 音频: WebAudio 合成 11 音色(本轮 +boom), 按类型限流防叠加。
- 测试: 20 套件全绿; 综合审计探针(v15-audit)27 步。

## 技术债清单(如實)
1. ui-v60.js 单文件 800+ 行(多页面渲染集中) — 可拆分, 非紧急;
2. style 文件 7 个叠层加载(v42-v130) — 历史版本层, 构建已合并;
3. 设置页返回键命名 v60-set-back 与约定不一致(功能正常)。
