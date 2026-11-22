# V14 · 美术管线指南 (ART_PIPELINE_GUIDE)

## 生成武器 GLB
node tools/v14-weapon-glb.js
→ assets/models/weapons/<id>/<id>.glb (8 型, 4-5KB, 自包含)
→ 新武器: 在 WEAPONS 表加参数化件(box/cyl 组合, 枪口 -Z), 重跑生成器。
注意: 材质因子必须写 pbrMetallicRoughness 嵌套; 必须输出 NORMAL; 单文件 ≤8KB。

## 展示台(军械库)
js/weapon-showcase.js — mount(容器, weaponId); PMREM 环境+三点布光已内置;
H5 自动启用, wx/__minidom 自动回退; 新 GLB 加载 URL 版本参数需手动 bump。

## 截图验收
node tools/v14-capture.js → docs/V14/screenshots/(24 张, 覆盖任务书 20 画面清单)。

## 微信构建
node tools/build-wechat.js → wechat-game/ → node tests/e2e/wechat-emulator.js(20 项)。
新 js 文件四处登记: index.html / build-h5 / build-wechat / build-douyin。

## 主题道具
js/art-v42.js buildEnvironment 内 THEME 分区: cityx-* / apo-* / cave-* / mech-* /
fort-*; addInstancedCategory(..., { themes: [...] }); ground 纹理经
CONFIG.WORLD_THEMES[theme].ground 切换; 发光材质打 __noThemeTint。
