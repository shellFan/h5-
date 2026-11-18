# V8.0 系统总览 — 《膨胀小队》十级战役完整版

> V8.0.1 (2026-11-19): 修复十关平衡性后追加的补丁版本号。本文档描述 V8.0 + V8.0.1 的全部系统。

## 一、战役结构 (10 关)

| 关 | 名称 | 主题 | 特色机制 | Boss |
|---|---|---|---|---|
| 1 | 新兵训练 | training | 教学关 | 铁拳队长 |
| 2 | 快速尸潮 | street | 快速尸潮 | 赤拳突击者 |
| 3 | 盾牌军团 | lab | 盾牌兵 | 钢盾领主 |
| 4 | 变异尸潮 | zone | 变异+分裂 | 裂变母巢 |
| 5 | 终局Boss | defense | 竞速Boss | 终焉核心 |
| 6 | 末日核心 | apocalypse | 能源核心(独立HP+光环buff) | 末日吞噬者 |
| 7 | 地下巢穴 | cave | 高密度精英 | 巢穴之母 |
| 8 | 机械废土 | mechanical | 能源核心+盾墙 | 机械巨尸(titan, -15%伤害) |
| 9 | 最终防线 | fortress | 双Boss | 钢盾领主+裂变母巢 |
| 10 | 终极末日 | apocalypse | 全机制+终极波 | 末日主宰(overlord) |

- L1-L5 波次量 ×3 (runtimeHordeBoost), L6-L10 按 authored 数量直出。
- 每关首行门保证至少一个人数门 (防软锁)。
- 敌人 HP 乘数: `[1.7, 2.2, 2.8, 3.4, 4.0, 4.6, 2.2, 2.5, 2.8, 2.6]` — L7-L10 以数量为难度主轴。

## 二、养成系统

### 1. 永久升级 (upgrades.js)
gun / rapid / recruit / pierce 四项, 金币购买, 原子扣款。

### 2. 武器系统 (weapons.js)
- 8 种武器: 步枪/散弹/狙击/机枪/火焰/火箭/冰冻/电磁。
- 5 级升级, 成本 `[200,400,700,1100,1600]`。
- 4 条进化路线 (storm_mg / hell_rocket / arctic_pierce / thunder_chain), 需求科技等级前置。
- **战斗接线 (V8.0.1 修复)**: dmgMul → squad.getDamage(); rateMul → getFireRate(); pierceBonus → squad.pierce; chain → squad.chain; slowMul → freezeStacks; radius → explosive 溅射; critBonus → critChance。

### 3. 科技树 (tech-tree.js)
3 分支 13 节点 (火力/军团/后勤), 前置链 + 科技点 (techPoints)。
combatStats() 输出 dmgBonus/rateBonus/critBonus/pierceBonus/explosive/startBonus/limitBonus/regen/drBonus/coinMul/xpMul/coinPerKill/startCoins。

### 4. 士兵成长 (growth.js)
- 士兵等级 1-50, 5 阶段 (新兵→传奇), 每级 dmgBonus/hpBonus/rateBonus/critBonus/drBonus/recruitBonus。
- 6 槽装备 × 5 品质, 穿戴/强化。
- SoldierGrowth.stats() 合并进战斗: dmgBonus→damageBuff, critBonus→critChance。

## 三、局内系统

### 1. 技能系统 + 技能组合 (skills.js)
6 技能 (rage/drone/venom/shield/magnet/berserk) + **10 组合** (V8.0):

| 组合 | 需求 | 效果 |
|---|---|---|
| 瘟疫狂怒 | rage+venom | 毒液伤害×2 |
| 绝境锋芒 | rage+berserk | 背水触发线 50%→60% |
| 毒雾僚机 | drone+venom | 射速+8%×毒液层 |
| 不灭意志 | shield+berserk | 护盾冷却 6s→3s |
| 贪婪火力 | magnet+rage | 击杀金币+1层磁力 |
| 回收无人机 | drone+magnet | 击杀3%概率补员 |
| 毒性护盾 | venom+shield | 格挡时毒化周围敌人 |
| 火力全开 | rage+drone | 僚机射速 15%→25%/层 |
| 剧毒赏金 | venom+magnet | 击杀金币+0.2/只 |
| 守护之怒 | shield+rage | 护盾可用时伤害+25% |

- **毒液 DoT 修复 (V8.0.1)**: 原实现从未在命中时挂载 `_venomT/_venomDps`, 技能完全无效。现在命中即挂载, DoT 每帧结算。
- `Skills.coinBonus(squad)` 统一结算金币加成。

### 2. 随机事件 (random-events.js, V8.0 新增)
12 种事件 (8 良性/4 恶性), 15-25s 首触发, 之后每 18-32s。
良性: 空投补给+15 / 金币雨+40 / 狂热时刻(伤害×2, 10s) / 弹药补给(射速×1.5, 12s) / 援军空降+30% / 战地医疗+10% / 弱点洞察(暴击+20%, 10s) / 冰冻时间(全场冻3s)。
恶性: 尸潮暴动(增援波) / 精英来袭(2精英) / 毒雾弥漫(-4%编制) / 地道伏击(7只背袭)。
横幅复用 `v42-wave-banner` + 飘字 + 震屏。

### 3. 挑战模式 (game.js + ui-v60.js, V8.0 新增)
- **无尽尸潮** (survival): 驻守阵地, 每 7-12s 一波递增, 每 5 波 Boss; 得分=击杀。
- **Boss试炼** (boss_rush): 连续 Boss, HP ×1.25^波; 得分=Boss击杀数。
- 入口: 首页 ⚔️挑战 (无尽需通关 L3, Boss试炼需通关 L5)。
- 失败结算: 金币 (0.5/1.2×得分) + XP (×2) + 最高纪录 challengeBest, 幂等 (_scored)。
- 复活后重新计分 (基准重置)。

## 四、Boss 系统

- **双因子血量 (V8.0.1 恢复)**: `hp = clamp(count × totalDPS × 0.5, 关卡值×0.5, 关卡值×12)` — Boss 战时长 ≈ 0.5×count/(0.8×volley) ≈ 9-12s, 与养成水平解耦。
- **火力优先 (V8.0.1)**: Boss 存活时全部弹道锁定 Boss — 修复杂兵吸引弹道导致 Boss 输出饥饿。

## 五、存档 (profile v3)

migration 链 v1→v2(stars/xp)→v3(weapons/tech/signin)。字段: coins/upgrades/unlockedLevel/stars/xp/weapon/weaponLevel/weaponEvolved/tech/techPoints/soldier/equipment/daily/signin/challengeBest/stats/claimedRewards。

## 六、UI 页面 (ui-v60.js, V8.0 全量重写)

九宫格导航: 地图 / 训练 / 军械库 / 科技 / 图鉴 / 挑战 / 成就 / 每日 / 设置。
- 训练中心: 士兵等级/阶段/属性/装备栏/升级。
- 军械库: 8 武器切换/升级/进化状态。
- 科研站: 3 分支科技树 + 科技点。
- 战场图鉴: Boss 图鉴 (按解锁渐进) + 武器收藏。
- 挑战: 两模式入口 + 最高纪录。
- 每日: 7 天签到条 + 3 任务。
- V8.0.1 修复: renderTraining/renderArmory 缺失导致按钮崩溃; hidePages 漏页; reportProgress 引用未定义 `g`; 地图从 6 关扩展到 10 关 (名称实时取自 LEVELS[i].name)。
