# V13 · 武器设计增量

> 基线: docs/art/WEAPON_DESIGN.md。

## V13: 武器剪影图标系统(军械库+图鉴)

- 8 类武器(步枪/霰弹/狙击/机枪/喷火/火箭/冰冻/电磁)程序化 SVG 剪影, 64x38 viewBox;
- 每类轮廓独立(弹鼓/瞄准镜/喷嘴/弹头/冰晶/电弧等特征件), 0.3s 可辨类型;
- 稀有度色阶: 未解锁灰阶 - Lv0-1 灰蓝 - Lv2-3 蓝 - Lv4 紫 - Lv5/进化 金+光晕;
- 替换原 emoji 图标(ui-v60 renderArmory/renderCodex), 数据与升级规则零改动;
- 交付形态: 内联 SVG(js/ui-v60.js weaponIconSvg), 无新增二进制文件, 零加载开销。

## 未做项

- 3D 枪械模型升级: 士兵 GLB 挂点枪械为模型内嵌件, 替换需重制 GLB — 列入后续(需 Blender 管线)。
