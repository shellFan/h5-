# V13 · 素材清单 (ASSET_MANIFEST)

> V13 新增素材全部为**程序化生成**(代码内联, 零二进制新增), 登记如下。
> 现有二进制资产(26 GLB + SVG)清单沿用 docs/art/ASSET_MANIFEST.md。

| 资产 | 类型 | 用途 | 路径/位置 | 尺寸 | 来源 | 接入 | 预览 |
|---|---|---|---|---|---|---|---|
| 关卡主题色板 x10 | 数据 | 天穹/雾/灯光/环境染色 | js/config.js WORLD_THEMES | — | 原创 | world.applyTheme | v13-theme-*.png 通过 |
| 天穹渐变重绘器 | 代码纹理 | 主题天空 | js/world.js _paintSky | 16x256 | 原创 | 已接入(10关) | 同上 通过 |
| 武器剪影 SVG x8 | 内联SVG | 军械库/图鉴图标 | js/ui-v60.js weaponIconSvg | 64x38 | 原创 | 已接入(军械库+图鉴) | 09-armory.png 通过 |
| 科技树导轨/连线/等级点 | CSS | 科技树结构视觉 | style-v130.css | — | 原创 | 已接入 | 10-tech.png 通过 |
| 排行榜富空态/错误态 | CSS/结构 | 排行榜状态 | style-v130.css + ui-v60.js | — | 原创 | 已接入 | 13-rank.png 通过 |
| 门稀有度光束柱 | 程序化几何 | 门可读性 | js/art-v42.js + js/gates.js | 0.09x2.5u | 原创 | 已接入(全部门) | v13-theme-cave.png 通过 |
| 动效令牌/页面动效/减少动效 | CSS | 全 UI 反馈 | style-v130.css | — | 原创 | 已接入(三端) | 16-settings.png 通过 |

检查结论: SVG 无透明异常; 主题色板无超出色域; 程序化纹理无接缝(单渐变)。
