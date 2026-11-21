# V13 · 美术方向增量 (ART_DIRECTION — V13 Delta)

> 最高依据仍是 `docs/art/ART_DIRECTION.md`（ Premium Stylized 3D Cartoon + 蓝色科技战场）。
> 本文只记录 **V13 在其上的增量**，两者冲突时以 docs/art 为准再行修订。

## V13 新增：关卡视觉主题系统

10 个关卡全部具备可辨识的场景氛围（此前仅 L6/L10 有末日主题，L7-L9 的 theme 声明落空）。
数据驱动：`CONFIG.WORLD_THEMES`（js/config.js）→ `world.applyTheme/_paintSky`（js/world.js）。

| 关卡 | 主题键 | 氛围 | 天穹渐变(顶→地平线) | 雾 | 阳光 |
|---|---|---|---|---|---|
| L1 新兵训练 | dawn | 柔和晨光 | #5E9FD8→#93C4E8→#D8E8F2→#F2F0EA | 0xDCEAF2 | 暖晨 0.68 |
| L2 快速尸潮 | noon | 明快正午 | #3E96DE→#7FC4EE→#CFE9F8→#EAF6FB | 0xD8ECF6 | 亮白 0.78 |
| L3 盾牌军团 | overcast | 阴云灰蓝 | #5E7E9E→#8FA9C2→#C2D2DE→#DDE6EC | 0xC2D2DE | 冷白 0.62 |
| L4 变异尸潮 | sunset | 暖橙天际 | #7E86C2→#D8A678→#F2CFA0→#F8E4C2 | 0xE8D2B2 | 橙阳 0.66 |
| L5 终局Boss | dusk | 暮色紫灰 | #4E5E9E→#8E7EA8→#C8A2B2→#E2C8C2 | 0xD2BCC2 | 橙红 0.58 |
| L6 末日核心 | apocalypse | 末日红(兼容原值) | #6E4050→#8A5060→#A86870→#C8A0A0 | 0x5A3040 | 0xFFB0A0 0.55 |
| L7 地下巢穴 | cave | 洞穴深蓝绿 | #0E2430→#16323C→#1E424A→#2A545C | 0x142E38 | 冷青 0.42 |
| L8 机械废土 | mechanical | 铁灰锈橙 | #4E5258→#6E7076→#8E8C86→#A8A096 | 0x8E8C86 | 0xFFE2C0 0.60 |
| L9 最终防线 | fortress | 冷钢蓝 | #2E4E7E→#4E6E9E→#7E9EC2→#B2C8DC | 0x8AA2B8 | 0xE2F0FF 0.62 |
| L10 终极末日 | apocalypse | 同 L6 | 同上 | 同上 | 同上 |

约束（全部满足）：
- 仅表现层 —— 刷怪/路径/胜负/经济零改动；三跑道轮廓与可读性在所有主题下保持
  （门/士兵/僵尸的稀有度色与敌我色不受主题染色影响）。
- 天穹仍为 16×256 单纹理 BackSide 球，**单 drawCall 不变**；
- 环境实例染色幂等（`__themeBaseHex` 记录初始色，主题切换可逆）；
- 'apocalypse' 与旧 APOCALYPSE_THEME 视觉值逐项一致（回归保障）。

## V13 新增：稀有度色阶扩展（军械库/图鉴武器）

| 等级 | 色阶 |
|---|---|
| 未解锁 | #8FA8C2 灰度化 |
| Lv0-1 | #8FA8C2 |
| Lv2-3 | #4A8FE0 |
| Lv4 | #9A6EE0 |
| Lv5 | #FFC247 |
| 进化态 | #FFC247 + 金色光晕（剪影外圈 glow） |

## 交付物

- 关卡主题截图：`docs/V13/screenshots/v13-theme-*.png`（10 关）
- 武器剪影：程序化 SVG（内联，无新增二进制文件）
