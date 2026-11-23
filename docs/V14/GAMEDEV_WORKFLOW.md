# V14 · GameDev 工作流 (GAMEDEV_WORKFLOW)

> 本轮验证过的端到端流程, 后续开发按此路由。

## 技能路由(实际执行记录)
| 任务 | 路由 | 落地 |
|---|---|---|
| 怪物变体 | router → create-game-assets → performance-optimization | 实例染色/轮廓/附件三通道(见 ASSET_PRODUCTION_STANDARD §3) |
| 地图道具 | router → create-game-assets → threejs-scene-setup → performance-optimization | 主题道具包+实例化+可见性切换(§4) |
| 武器 GLB | router → create-game-assets → threejs-gltf-loading → threejs-materials-lighting | 程序化 GLB 管线+PMREM 展示台(§2) |
| 战斗 VFX | router → game-feel → performance-optimization | 事件分级(explosion tier1-4)+全部池化 |
| UI 图标 | router → game-ui-ux | 统一 SVG 图标集替换 Emoji |
| 微信适配 | router → performance-optimization | minidom 兼容红线(§5, 三条实测案例) |

## 事件分级(game-feel 落地)
- Boss 入场: shake(0.5) + shockwave + flash + 双 burst — 一次性, spawnT 完成时触发;
- 自爆/爆炸: explosion(tier) 组合器, 按事件等级取档;
- 枪口火焰: 武器级分级(重武器 1.38×) + 随机滚转防重复;
- 全部池化复用(粒子/爆闪/冲击波/烟尘共享池), 禁止每事件 new 材质。

## 性能纪律(performance-optimization 落地)
- 视觉升级三原则: 实例色 > 合并几何 > 新增类别; 同时段新增 draw call ≤ 6;
- 每模块完成即核对 draw call 与堆内存(soak 全程采样);
- 尊重三档画质(world.quality)与减少动态(prefers-reduced-motion + 游戏内开关)。

## 已知限制(下轮候选)
- 士兵手持武器分型(需士兵 GLB 变体管线) · 怪物专属动画骨骼(现刚性部件动画) ·
  微信端 3D 展示(minidom 无 WebGL) · 真机性能实测(需设备)。
