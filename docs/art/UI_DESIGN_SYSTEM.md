# UI 设计系统 (UI_DESIGN_SYSTEM)

> V12 起所有 UI 视觉以本文为准。实现层: `style-v120.css`(设计令牌+组件精修)。
> 加载顺序: style.css → style-v42.css → style-v51.css → style-v60.css → style-v120.css。

## 1. 设计令牌 (唯一来源: style-v120.css `:root`)

| 令牌 | 值 | 用途 |
|---|---|---|
| `--v12-blue` | #1A6FD4 | 主行动色(按钮/进度/链接) |
| `--v12-blue-deep` | #173B79 | 文字主色(ink) |
| `--v12-blue-soft` | #4DA8FF | 高亮/最新徽标/焦点环 |
| `--v12-gold` / `-deep` | #FFC247 / #B07A12 | 奖励/金币/第一名 |
| `--v12-green` | #39D98A | 成功/回复/正收益 |
| `--v12-red` | #E8506A | 危险/失败/自爆 |
| `--v12-purple` | #8454D6 | 稀有/强化 |
| `--v12-radius(-sm/-lg)` | 10/14/20px | 圆角三档 |
| `--v12-shadow-sm/md/lg` | 蓝黑透明影 | 阴影三档 |

规则: 新 UI 一律引用令牌; 禁止在组件里写新的裸色值(稀有度色板除外)。

## 2. 组件规范

### 按钮 (btn-primary / btn-gold / btn-secondary)
- 主按钮: 垂直渐变(#3D8EFF→#1A6FD4→#155FCB) + `box-shadow: 0 4px 0 #114EA8`(立体按压底边)。
- 金色按钮: 同构(#FFD979→#FFC247→#EDA929, 底边 #C98F16)。
- 按压态: `translateY(2px)` + 底边减半 + brightness(0.97); 过渡 0.08s。
- 最小触控 44×44px(`#btn-pause`/`#btn-refresh-gates` 强制)。

### HUD
- 属性胶囊: 深蓝玻璃(渐变+inset 高光+backdrop-blur 6px), 数值 900 字重 + tabular-nums;
  颜色编码: 人数=浅蓝 / 输出=浅金 / 射速=浅绿(带图标双信号)。
- 进度条: 蓝渐变填充 + 顶部白色高光条(::after) + 0.25s ease-out 宽度过渡 + 外发光。
- Boss 血条: 红渐变(#FF8A7A→#C22840) + inset 暗槽 + 0.2s 过渡; 头像+名条+阶段标签(HTML 已有)。
- 连杀盒: v12ComboPop 弹跳入场(cubic-bezier 回弹)。

### 结算屏 (win/lose)
- 统计卡: 2 列 grid, 第 5 格(`:nth-child(5)`)通栏(通关时间不再孤行)。
- 数值 900 字重 + tabular-nums; 卡片浅蓝渐变 + 细描边。
- **静态 `#stars-row` 已隐藏(CSS)** — 它是恒显 3 星的假数据, 真实星级走动态 `#win-stars`(★☆ 字符)。
- 金币面板: 虚线分隔 + 总计行加粗放大。

### 排行榜 (renderRank + v60-rank-*)
- 前三甲: 🥇🥈🥉 圆形奖牌章(金/银/铜渐变) + 卡片底色分级(暖金/冷银/暖铜) + 描边。
- 其余名次: 蓝灰数字章。旧 `v60-rank-pos` 保留兼容但前三甲改用 `v60-rank-badge`。
- 职业徽章: `v60-rank-class-chip`(职业色底 + 图标+名)。
- 当前玩家: `v60-rank-row-me` — 蓝色 outline + 右上"最新"胶囊(本地榜=最新一条真实战绩)。

### 页面容器 (v60-page)
- 面板统一 `--v12-shadow-lg`; 页面底部留安全区。

## 3. 文案与数字

- 一切数字展示: `tabular-nums` 防跳动; 伤害数字(3D 飘字)白芯+彩色描边(`effects.js floatText`)。
- 图标语义: ⚔️击杀 👥人数 🔥连杀 🪙金币 📺广告 — 全项目统一, 不新造符号。

## 4. 无障碍底线

- 文字对比 ≥4.5:1(深底白字/白底深字); 玩法信息不得只靠颜色(图标/形状/文字三选一冗余)。
- `prefers-reduced-motion: reduce` 下关闭装饰动画(style-v120.css 已实现)。
- 大面积闪光 ≤3 次/秒。

## 5. 验收门槛

- 每次改动 UI 后必须: 320/360/390/430 四宽截图 + `docs/development/VISUAL_ACCEPTANCE.md` 检查单。
- 截图存 `docs/screenshots/`, 前后对照; 不得以"代码看起来对"代替画面验收。
