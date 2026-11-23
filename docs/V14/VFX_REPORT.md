# V14 · 特效升级报告 (VFX_REPORT)

| 特效 | 实现 | 触发点 |
|---|---|---|
| 分级爆炸 tier1-4 | effects.explosion(): 闪光+1-2冲击波+橙白双层火花+浮升烟尘(buoyancy) | 自爆t2 · Boss死亡t4 · 全屏爆炸门t3 |
| 枪口火焰分级 | 重型武器 1.38×(rifle/mg/散弹/火焰/火箭) + 随机滚转 | combat._fire |
| 分武器弹道 | 8 色实例色 + 中性曳光贴图 | combat._syncInstances |
| Boss入场 | 震屏+冲击波+爆闪+余烬一次性钩子 | EnemyArmyRenderer(spawnT完成) |

全部特效复用既有池(particles/booms/rings/impacts), 零新增材质;
烟尘粒子独立浮升物理(不影响火花重力弹跳); 粒子上限/画质降级沿用既有系统。

## V14.3 补充(第三轮: 节奏)

- 闪光类曲线语义修正: 枪口火焰/爆炸白闪 = 瞬时峰值→衰减(原为出生最小→长大,
  与闪光语义相反); 冲击波 easeOutCubic 快出慢收; 全部池化复用不变。
