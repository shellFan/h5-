# 微信小游戏 V1.0 — 测试报告 (V12)

> 测试环境：Windows 10 x64 / Node 22 / playwright-core 1.65 + 系统 Edge（Chromium 130+）
> 构建产物：wechat-game/（tools/build-wechat.js，主包 1.51MB / 分包 3.37MB / 整包 4.88MB）

## 1. 自动化测试结果总览

| 套件 | 结果 |
|---|---|
| 构建自检（build-wechat.js） | ✅ 13/13（bundle 段/关键类/BootProgress/GLTF 适配/入口/__gameEnv/UI 树/P0 资源/包体预算） |
| 模拟器冒烟（tests/e2e/wechat-emulator.js） | ✅ **17/17** |
| 微信存储单元（tests/unit/suites/09） | ✅ 10/10 |
| H5 全量回归（同一次代码变更后） | ✅ unit 102/102 · e2e 29/29 · v51 39 · v80 37 · v111 15 · v112 15 · v113 14 · v114 10 · mobile 29 · soldier 11 · vnext 183 — **全部 0 失败** |

### 模拟器冒烟 17 项明细（tests/e2e/wechat-emulator.js）

| # | 断言 | 结果 |
|---|---|---|
| 1 | 微信入口启动：window.__game 就绪 | ✅ |
| 2 | minidom UI 纹理挂接（3D 叠加） | ✅ |
| 3 | UI DOM 节点构建（341 节点 / 506 规则 / 17 keyframes） | ✅ |
| 4 | 首页开始按钮布局（居中 195,162） | ✅ |
| 5 | 点击开始进入战斗（state=playing） | ✅ |
| 6 | 战斗 HUD 人数渲染（=7） | ✅ |
| 7 | 战斗状态持续 | ✅ |
| 8 | 拖动输入桥接（队伍 x: 0 → -2.05） | ✅ |
| 9 | 暂停按钮生效 | ✅ |
| 10 | 恢复按钮生效 | ✅ |
| 11 | 存档写入 wx 存储（profile + .bak 双份） | ✅ |
| 12 | 切后台自动暂停战斗 | ✅ |
| 13 | 广告服务装配（wechat 分支） | ✅ |
| 14 | 未配置广告位 ID 时如实不可用（不伪造） | ✅ |
| 15 | 战斗帧率采样 103 FPS（软件渲染模拟器） | ✅ |
| 16 | 无致命运行时错误 | ✅ |
| 17 | 平台检测为 wechat | ✅ |

## 2. 视觉验证（截图，docs/WeChat/screenshots/）

- `wechat-home.png`：首页（蓝色科技风标题栏/部署按钮/关卡选择/提示文案）
- `wechat-battle.png`：战斗（3D 城市公路 + GLB 士兵小队 + 弹道 + HUD 全套：
  Lv 徽章/关卡进度条/暂停按钮/三属性胶囊数值 7·1·2.2）
- `wechat-pause.png`：暂停界面
- `h5-ref-home.png` / `h5-ref-battle.png`：H5 参照（同 viewport 390×844）

对照结论：布局结构、配色主题、HUD 信息架构与 H5 一致；差异项记录在
V12_UI_REVIEW.md（见 docs/V12/）。

## 3. 修复过程中发现并解决的引擎缺陷（均带回归）

| 缺陷 | 修复 |
|---|---|
| bundle 缺 js/game.js（沿袭自抖音构建的 P0） | GAME_SCRIPTS 补齐 + 精确段标记自检 |
| GLTFLoader 纹理 fetch 路径 | MiniGLTFLoader 包内读取 + 安装时机前移到 game.js 自启动前 |
| ImageLoader addEventListener('load') 未派发 | img 混合宿主事件派发 |
| texture.image 非真实图源无法上传 GPU | 真实 Image 承载 DOM 语义（混合宿主） |
| window.document 不可重定义（模拟器） | __gameEnv + bundle 函数参数遮蔽 |
| bundle 显式导出落遮蔽 window | 全局回填 + __game/__adService 活桥 |
| `var basis` 迭代残留（progress 0% 泄漏给 pause → w=0） | 每迭代重置 |
| measureFlexChildMain 容器分支不写 _measMain → 文本宽 0 | 布局期回退实测 |
| 列向 flex 累加宽度当高度（progress-area h=1050） | 列向累加主轴 |
| pe:none 父元素整树剪枝（HUD 内按钮不可点） | 仅剪自身保留子树 |
| 深度优先命中让先绘制装饰拦截按钮 | 遵循绘制顺序命中 |
| 0×0 边框三角元素命中所有点 | 退化 quad 拒绝 |
| 渲染器第二遍 UI 渲染清掉主场景（黑屏） | autoClear=false + 帧首手动清屏 |
| UI 层把容器天空色盖在 3D 上 | 画布祖先链跳过背景绘制 |

## 4. 微信开发者工具验证（人工，未执行 — 如实标注）

**本机未安装微信开发者工具，且无真实 AppID/广告位 ID** —— 以下步骤无法在本环境执行，
**不标记 PASS**，作为发布前人工清单（详见 WECHAT_RELEASE_CHECKLIST.md）：

- [ ] 工具导入 wechat-game/ + 测试号编译启动
- [ ] 模拟器完整通关前 5 关（含技能门/Boss/胜负结算）
- [ ] 真机预览（iOS + Android 各一台）：触控/音频/帧率/发热
- [ ] 切后台恢复 / 存档跨会话恢复
- [ ] 配置真实广告位 ID 后激励视频全流程（完整观看/中途关闭/加载失败）
