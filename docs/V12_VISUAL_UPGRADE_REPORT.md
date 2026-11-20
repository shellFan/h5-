# V12 视觉升级报告 (Visual Quality Upgrade Report)

> 日期: 2026-11-21 · 范围: 表现层视觉品质升级(不改变任何玩法/数值/机制)
> 标准依据: `.agents/skills/`(8 个 GameDev Agent Skills) + `docs/art/*`(实例化规范)
> 前提: 本报告所述改动全部通过 `docs/development/VISUAL_ACCEPTANCE.md` 验收流程。

## 0. 执行摘要

在 V11.3 稳定版基础上完成六大视觉系统升级: 渐变天空/道路草地精修(地图)、贴地曳光弹道(枪械)、
爆炸白闪+尸液 decal+伤害数字重绘(特效)、精英金环+特殊体型染色(怪物)、
设计令牌+HUD 玻璃化+排行榜前三甲(UI)、安全区+小屏密度档(手机适配)。
回归测试全绿(单测 92/92, 主 E2E 29/29, 移动矩阵 29/29, H5 构建校验 PASS),
性能: 结构性 draw calls +4(114→118), tris +0.24%, 帧时间 p95 1.8ms→1.5ms(改善)。

## 1. 技能安装及识别报告

- 详见 `docs/development/GAMEDEV_SKILLS_GUIDE.md` §2。
- 结论: 官方 CLI 在本环境因 github.com 直连超时不可用, 通过 codeload tarball 等效安装;
  8/8 技能(router/game-ui-ux/create-game-assets/game-feel/performance-optimization/threejs×3)
  位于 `.agents/skills/<name>/SKILL.md`, 逐个验证存在且内容完整。
- 技能方法论已实例化进 docs/art 十篇规范, 后续会话按 router 分派加载。

## 2. 项目目录集成报告

```
.agents/skills/           8 技能(SKILL.md + references/scripts)
docs/art/                 10 篇美术规范(ART_DIRECTION/UI_DESIGN_SYSTEM/CHARACTER_DESIGN/
                          MONSTER_DESIGN/MAP_DESIGN/WEAPON_DESIGN/VFX_DESIGN/
                          ASSET_MANIFEST/ASSET_LICENSES/MOBILE_UI_GUIDELINES)
docs/development/         GAMEDEV_SKILLS_GUIDE.md + VISUAL_ACCEPTANCE.md
style-v120.css            V12 UI 升级层(设计令牌+组件精修)
tools/v120-shot.js        单场景快速截图工具
tools/v120-capture.js     全量前后对照采集+性能快照工具
docs/screenshots/v120-before|after|iter/   前后对照证据(19+19+迭代张)
```

## 3. UI 视觉升级报告 (style-v120.css + ui-v60.js renderRank + index.html)

| 项 | Before | After |
|---|---|---|
| 设计令牌 | 分散裸色值 | `:root` 唯一令牌源(色/圆角/阴影三档) |
| 主按钮 | 平面渐变 | 立体渐变+按压底边(0 4px 0)+active 下沉反馈 |
| HUD 属性胶囊 | 半透明平涂 | 深蓝玻璃(blur+inset 高光)+900 字重 tabular-nums+三色语义 |
| 进度条 | 单色填充 | 蓝渐变+顶部高光条+外发光+平滑过渡 |
| Boss 血条 | 平涂红 | 三段红渐变+暗槽+外发光 |
| 连杀盒 | 直接出现 | 弹跳入场(reduced-motion 时关闭) |
| 结算星星 | 静态假星(恒3星)+动态星重复 | 静态 `#stars-row` 隐藏(CSS), 仅留真实星级 |
| 结算第 5 格 | 通关时间孤行 | 通栏(:nth-child(5) grid-column 1/-1) |
| 排行榜 | 纯文本行+数字排名 | 🥇🥈🥉奖牌章+金银铜卡底+职业徽章chip+"最新"高亮(蓝 outline) |
| 手机适配 | 无安全区 | HUD/页面 safe-area inset + 44px 触控保底 + ≤360px 密度档 |

## 4. 怪物和 Boss 美术报告

- 精英怪: 新增贴地金环身份标记(`V42Art.createEliteAura`, 共享几何防泄漏, ≤10 只) + 金色实例染(1.22,1.08,0.72)。
- 自爆僵尸(bomber): 红染(1.5,0.55,0.5) — 兑现 V11.5"红染"设计意图, 与 fast 模型视觉分离。
- 击杀反馈: 尸液 decal(2.2s 渐隐, 池上限 16); Boss 死亡金色爆闪(3.4)+自爆橙色爆闪(2.4)。
- Boss: 沿用阶段染色+狂暴红光(既有), 死亡爆闪补足终局反馈; 六 Boss 造型/阶段机制未动。
- 识别三要素(体型/染色/地面标记)成文于 `docs/art/MONSTER_DESIGN.md`。

## 5. 地图和背景报告

- 天空: 纯色 → 渐变穹顶(BackSide 球, 顶 #4FA3DF→地平线 #EAF4FA+太阳光晕), 跟随相机 XZ; 雾色改 #C9E4F2 与地平线衔接, 远景建筑自然融入天际。
- 道路: 底色去紫味(#788792→#7C8B96)+4 条宽幅淡色带; 黄边线降饱和(#F6CC59→#E3C26B)+暗衬边, 不再抢全画面注意力。
- 草地: 单色 → 明暗修剪条纹(每 3u 交替, ±16%)+偶发淡草斑。
- 关卡/跑道布局、滚动算法、装饰实例结构全部未动(约束见 `docs/art/MAP_DESIGN.md` §4)。

## 6. 枪械和特效报告

- 曳光弹: 相机公告牌"水滴"→ 贴地掠过曳光(弹头朝敌方+尾部微抬, 暴击更粗更长 0.34×2.8); 程序化 64×256 白热弹头+双层尾迹贴图(替代旧 SVG 水滴)。
- 枪口火焰: 4 角星保留, 新增随机滚转+尺度抖动(0.42-0.52), 齐射不重复。
- 伤害数字: 彩字黑边 → 白芯+彩色描边(88/120px), 远看醒目近看不糊。
- 新增通道: 尸液 decal / 爆闪 flash — 均池化+上限声明+热循环零分配(scratch M4/V3 复用)。
- 节奏分层(S/M/L/XL 档位)成文于 `docs/art/VFX_DESIGN.md`; 未增加任何粒子数量上限。

## 7. 手机适配报告

- 320/360/390/430 四宽截图全通过(combat/home 无溢出无遮挡, 见 v120-after)。
- 刘海屏: HUD 左右+顶部 safe-area, v60 页面底部 safe-area(手势条不压按钮)。
- 触控: btn-pause/btn-refresh-gates 强制 44×44px。
- 小屏: ≤360px 密度档(胶囊缩排/气泡 0.92/徽章缩小)。
- `npm run test:mobile` 29/29 PASS; 4×CPU 节流+DPR2 战斗实测 78.1fps / avg 4.02ms。
- 微信/抖音构建: `npm run build:douyin` PASS(主包 1.25MB/整包 5.18MB); WeChat 构建链路属另一进行中任务, 本任务未触碰(见 §10)。

## 8. 性能测试报告 (实测数字)

同场景同注入同种子, 桌面 quality=2 (playwright 无头):

| 指标 | 基线(改动前) | V12(改动后) | 结论 |
|---|---|---|---|
| draw calls(结构项) | 114 | 118 (+4: 穹顶1+decal通道1+精英光环2) | 预算内 |
| draw calls(总, 含RNG流偏移波动) | 114 | 128 | 非结构性(见下) |
| triangles | 550,442 | 551,750 (+0.24%) | 可忽略 |
| 帧时间 avg | 1.05ms | 0.93ms | 改善 |
| 帧时间 p95 | 1.8ms | 1.5ms | 改善 |
| 移动 4×节流 300 兵 | — | 78.1fps / 4.02ms | 达标 |

说明: 总 calls 波动源于枪焰随机滚转消耗随机数流 → 活跃特效数量分布不同, 属测量噪声;
结构性成本以"同对象清单 diff"确认为 +4。V12 未引入每帧分配(热循环 scratch 复用)。

## 9. 修改文件清单 (本任务)

**新增**: `.agents/skills/*`(8), `docs/art/*`(10), `docs/development/*`(2), `style-v120.css`,
`tools/v120-shot.js`, `tools/v120-capture.js`, `docs/screenshots/v120-{before,after,iter}/`, 本报告。

**修改**(表现层, 全部通过三单元回归):
- `index.html` — 引入 style-v120.css(+注释)
- `js/world.js` — 渐变天空穹顶/道路纹理/草地条纹/雾色/主题穹顶适配
- `js/combat.js` — 曳光贴图与朝向/弹体尺寸/爆炸弹白闪
- `js/effects.js` — 伤害数字重绘/splat/flash 通道/枪焰滚转/clear+update 集成
- `js/enemies.js` — 死亡 splat/自爆+Boss 爆闪/精英光环接入/光环计数生命周期
- `js/enemy-models.js` — 精英金染/自爆红染(实例色)
- `js/art-v42.js` — 门面板对比度/精英光环工厂
- `js/ui-v60.js` — renderRank 奖牌章/职业chip/最新高亮
- `tools/build-h5.js` — COPY_LIST 注册 style-v120.css

**未完成/未触碰**(原因):
- 版本号未升位(`__GAME_VERSION=v11.3` 保留) — 避免与进行中的另一 V12 任务(WeChat 适配)版本管理冲突。
- 微信小游戏构建链路(tools/build-wechat.js 等) — 另一任务正在开发中, 本任务零触碰。
- AI 生成素材/新贴图资产 — 全部采用程序化生成(零授权风险), 无需求。
- 真机(物理手机)测试 — 本环境无设备, 以 4×节流移动矩阵+多视口模拟替代, 真机项留待人工。

## 10. 并行任务隔离说明

工作区存在另一 Agent 的进行中未提交修改(WeChat 适配: js/ads/**, js/platform/**, js/game.js,
js/economy.js, js/gates.js, js/squad.js, tools/build-douyin.js, tools/build-wechat.js,
tests/e2e/wechat-emulator.js 等)。本任务遵守"不覆盖/不抢先合并"约束:

- 编辑前对共享文件快照(`.v120-wip/`, 提交后删除), 全程保留其未提交内容。
- 提交采用"增量隔离": 新文件直接入库; 双方都改过的 4 个文件(js/combat.js, js/world.js,
  js/enemy-models.js, js/ui-v60.js)以 编辑前快照→当前 做三方合并, 仅提交本任务增量,
  对方 WIP 保持未提交状态。

## 11. 前后截图索引

- Before: `docs/screenshots/v120-before/`(19 张, 含 perf-390.json)
- After: `docs/screenshots/v120-after/`(19 张, 含 perf-390.json)
- 迭代过程: `docs/screenshots/v120-iter/`(弹道方向调试/单发停帧特写等)
- 重点对照: final-combat / combat-320 / gates / win(星星去重) / rank(排行榜) / home。
