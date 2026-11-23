# V15 · 资产审计 (ASSET_AUDIT)

> 数据源: tools/v15-asset-audit.js → docs/V15/logs/asset-audit.json

## 总量
95 文件 / 5,351KB。全部有引用或成对存在(LOD/贴图)。

## 检查结果
- 重复模型/贴图: 无(6 Boss + 6 僵尸 + 士兵 + 8 武器 GLB 均独立; 贴图一一配对)
- 未引用文件: **0**(art-v1 的 4 个 SVG 均被 game.js/gates.js/index.html 引用)
- 过大图片: weapon-atlas.png **1,276KB**(唯一 >400KB) — 军械库列表图集,
  **优化建议**(不删): 可转 WebP 或 8-色量化, 预计 -60%; 需回归军械库视觉, 列入下轮
- 不必要高分辨率纹理: 无(Boss 贴图 512-1024 级别合理)
- 外部网络依赖: **0**(全部本地, h5-build 门断言"无外部请求")
- 无法解析 GLB: 0(全部被 GLTFLoader 实际加载验证)
- 许可证: 全部原创程序化生成或项目自有(ASSET_MANIFEST 登记完整)
- LOD 配对: 士兵/僵尸/Boss 全部 hero+lod 双份; 武器无 LOD(展示台单模型, 合理)

## 删除操作
**无**(无可删项; 遵守"不删计划用途资产"红线)。
