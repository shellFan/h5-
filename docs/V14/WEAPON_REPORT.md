# V14 · 武器升级报告 (WEAPON_REPORT)

## 3D 资产
8 型武器 GLB(rifle/shotgun/sniper/mg/flamethrower/rocket/freeze/tesla), 程序化生成
(tools/v14-weapon-glb.js), 双材质(枪体金属/配件聚合物), 解析法线, 自包含, 4-5KB/个。
管线踩坑与规范修正记录于 ASSET_PRODUCTION_STANDARD.md §2。

## 军械库展示
hero 位实时 3D 转台(摆动+悬浮), PMREM 环境反射 + Navy/Gold 布光; 切换武器即时换模;
微信/minidom 回退 SVG 图集(20/20 实证); 列表行保留 V13 卡通图集。

## 战斗辨识
弹道色 8 种(实例色), 重型武器(散弹/机枪/火焰/火箭)枪口火焰 1.38×。

## 未完成(如实)
士兵手持武器仍为烘焙单枪型; 武器升级等级外观差异(可经材质 tint, 待下轮)。
