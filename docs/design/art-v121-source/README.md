# 世界材质来源

生成工具：本会话 image_gen；时间：2026-11-21。新生成素材，没有下载第三方纹理。
用途：离线生成并随包发布的地图漫反射图集；不在游戏运行时生成。
AI 来源标记保留在资产清单。按项目生成素材使用，无第三方署名要求；发布平台如要求 AI 内容申报，应包含此图集。

world-materials.png 为工具原始输出。tools/prepare-world-art-v121.py 使用 Blender 4.2.15 确定性缩放为 assets/art-v121/world-materials.jpg，1024×512、RGB、81298字节。
运行时按4列2行裁成8张256×256材质，并生成道路标线。图集为不透明表面素材。
生成纹理的接缝不保证数学周期连续，已在实际重复道路和场景中检查。

## 原始提示词

```text
Use case: stylized-concept. Create a production DIFFUSE MATERIAL ATLAS for an actual stylized 3D cartoon game environment, not a concept sheet or screenshot. Exactly FOUR equally wide columns by TWO equally tall rows, eight perfectly rectangular square texture cells aligned edge-to-edge with zero margins or gutters. Each square cell is a top-down orthographic flat surface texture, no perspective, no 3D objects, no cast shadows, no lighting gradients, no text or labels or borders. Wide 2:1 canvas. Row1 left to right: (1) mid-grey-blue worn asphalt with a few broad repaired patches and subtle large cracks, NO painted road lines; (2) sandy warm grey chipped concrete with large clean slab breakup, no letters; (3) dark blue-grey industrial metal with broad riveted rectangular plates and modest orange rust along edges; (4) dark charcoal-violet cave rock with broad faceted layered cracks. Row2 left to right: (5) dark muted purple organic hive surface with soft broad root veins and a few low-intensity violet nodules; (6) warm muted ochre dusty earth with a few pebble clusters; (7) military blue-grey painted metal with worn yellow hazard-band fragments, no symbols or words; (8) weathered warm stone blocks for fortress walls, broad clean cartoon bevel shading only. Art direction polished hand-painted cartoon game textures, broad stylized shapes, low fine-noise, readable simple material differences, medium-low contrast so the blue squad and green monsters remain visually dominant, cohesive value and detail scale. Each cell should tile seamlessly on all sides within itself, all eight cells fully opaque and flat, no UI and no characters. Actual material artwork suitable for UV mapping on 3D roadside props and ground.
```

