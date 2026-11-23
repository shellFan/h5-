# V13 · 地图设计增量

> 基线: docs/art/MAP_DESIGN.md(路面/街道/雾效规范)。

## V13 核心: 10 关主题氛围(详见 ART_DIRECTION V13 增量)

- 实现机制: CONFIG.WORLD_THEMES + world.applyTheme/_paintSky — 天穹渐变重绘/雾距/阳光/半球光/环境染色;
- 路面纹理与三跑道轮廓不变(可读性红线); 地面细节沿用 V12 柏油带+修剪草地;
- 建筑剪影沿用 art-v42 环境实例, 经主题色染出城市时段族(晨-午-阴-暮)与
  洞穴/机械/要塞的色调差;
- 截图验收: docs/V13/screenshots/v13-theme-*.png(10 关);
- 主题切换幂等可逆(__themeBaseHex), 重玩/换关无残留。
