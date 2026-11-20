# 特效设计规范 (VFX_DESIGN)

> 实现: `js/effects.js`(七通道) + `js/combat.js`(曳光/枪焰调用) + `js/enemies.js`(死亡/自爆/Boss)。
> 核心原则: **特效有层次有节奏, 不是堆粒子** — 每个事件按强度档取用通道组合。

## 1. 七通道预算表 (锁定上限)

| 通道 | 实现 | 上限 | 生命 |
|---|---|---|---|
| 粒子 burst | InstancedMesh Sphere(0.06) | 300 | 0.25-1.0s |
| 冲击星 impact | InstancedMesh Plane+16射线贴图 | 48 | 0.16s |
| 飘字 floatText | Sprite 池 + LRU 纹理缓存(≤128) | 20 | 0.7s |
| 冲击波 shockwave | Ring 池 | 动态 | 0.5s(×5 扩散) |
| 枪焰 muzzleFlash | Sprite 池 + 随机滚转 | 24 | 0.07s |
| 尸液 decal splat | InstancedMesh Plane(128px 程序化) | 16 | 2.2s |
| 爆闪 flash | Sprite 池(128px 径向) | 8 | 0.14s |

## 2. 事件强度档 (event tiers)

| 档 | 事件 | 组合 |
|---|---|---|
| S 小 | 命中 | 星闪 + 3 粒子 (+DoT 色粒子) |
| M 中 | 击杀 | 12 粒子(cfg 色) + 4 白粒子 + 3 金积分点 + decal |
| L 大 | 自爆 / 爆炸弹 | 白闪 flash(2.4/1.5) + 冲击波 + 16 粒子 |
| XL | Boss 死亡 | 金 flash(3.4) + 冲击波 + 65 三色粒子 + 狂暴红光收束 |
| 特殊 | 狂暴触发 | "狂暴!"大字 + 红 shockwave + 18 红粒子 |

规则: 档位映射不得跨档借用(小事件禁用 flash); 屏幕震动走 `world.shake`(0.3-0.45s, 尊重用户开关)。

## 3. 颜色语义 (与 UI_DESIGN_SYSTEM 对齐)

金=奖励/暴击/积分 · 红=危险/Boss/自爆 · 蓝=冰冻/护盾/连锁 · 绿=毒/回复 · 白=冲击核 · 橙=火焰/爆炸。

## 4. 性能纪律 (performance-optimization 技能落地)

- 热循环零分配: scratch `_m4/_v3/_particleColor` 复用; 新通道必须同样处理。
- 上传: `updateRange` 前缀上传(仅 V11.6 起的实例通道); 新 InstancedMesh 通道需实现同策略或证明上限小。
- 淡出重打包: splice 后必须重填实例槽(impact/splat 已实现), 防洞位残影。
- 闪烁安全: flash 全屏占比大但 ≤0.14s 且频率受限; 大面积亮闪事件 ≤3 次/秒。

## 5. 变更守则

- 新特效 = 新池通道或现有通道组合, 禁止每帧 new。
- 粒子重力/反弹参数(g 7, 弹性 0.25)为全局手感基准, 调整需过 30min soak + 移动端矩阵。
