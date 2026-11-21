# V13 · UI 设计系统增量 (UI_DESIGN_SYSTEM — V13 Delta)

> 基线：`docs/art/UI_DESIGN_SYSTEM.md` + `style-v120.css` 设计令牌。
> V13 以 **style-v130.css**（末层）追加，不覆盖前层规则。

## 1. 动效令牌（全页面统一节奏，参照 game-feel 技能）

| 令牌 | 值 | 用途 |
|---|---|---|
| --v13-dur-fast | 0.12s | 按压反馈 |
| --v13-dur | 0.22s | 行内状态变化 |
| --v13-dur-slow | 0.34s | 页面/弹窗进出场 |
| --v13-ease | cubic-bezier(0.34,1.3,0.64,1) | 轻回弹 |

应用：`.v60-page` 切换淡入 + `v13-panel-in` 面板进场 + 卡片/列表行按压 scale(0.985)
+ 金币行 `v13-coin-pop` 获得感弹跳。所有新动效必须使用令牌。

## 2. 减少动效（无障碍）

- 尊重系统 `prefers-reduced-motion`；
- 设置页新增「减少动效」开关（`v60-set-motion`），持久化到 Platform.storage
  （`motion_reduced`），H5 作用于 `html.v13-reduced-motion`，微信端同步
  minidom body 类 —— 两端行为一致。

## 3. 科技树视觉结构（节点关系/升级规则零改动）

- 分支标题徽记（⚔️火力/🛡️军团/🔧后勤）+ 左侧垂直导轨（`.v13-tech-rail`）；
- 每节点左侧连接线（`.v13-tech-connector`，locked 态降灰）；
- 节点内等级点（`.v13-tech-pips`，点亮进度一目了然）。

## 4. 排行榜状态完备（数据源不变，不伪造数据）

| 状态 | 实现 |
|---|---|
| 有数据 | v120 颁奖台徽章 + 名次行（沿用），当前局高亮（沿用） |
| 空态 | 富空态：🥈🥇🥉 图组 + 引导文案（`.v13-rank-empty-rich`） |
| 数据源异常 | try/catch → 「⚠️ 排行数据加载失败」错误态（`.v13-rank-error`），不伪造排名 |
| 加载态 | 本地榜为同步读取，无网络加载窗口（如实记录：不适用） |

## 5. 军械库/图鉴武器图标

emoji → 程序化 SVG 剪影（`.v13-wicon`）：8 类武器轮廓各异（步枪/霰弹/狙击/机枪/
喷火/火箭/冰冻/电磁），稀有度色阶随等级（见 ART_DIRECTION V13 增量 §2），
未解锁灰阶降透明，装备+进化态金晕。图鉴页同一系统。

## 6. 微信端一致性

style-v130.css 已注册进 `tools/build-wechat.js` CSS 清单 —— minidom CSS 引擎
按同一份规则渲染（flex/pips/连接线均为 minidom 支持子集）；动效在 minidom
的 keyframes 插值通道（opacity/transform）同样生效，`v13-reduced-motion`
body 类同步降级。
