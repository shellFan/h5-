# Blue Vanguard / 蓝色先锋兵

Original character for 《膨胀小队》V4.1, authored with Blender 4.2.15 LTS by the repository generator. No third-party character mesh or concept image is included.

Rebuild from repository root:

```powershell
& <blender-4.2.15>/blender.exe --background --python tools/create-soldier.py
node tests/unit/soldier-asset.js
```

`soldier.glb`: full-detail rigid character. `soldier-lod.glb`: offline decimated dense-rank LOD. Both contain complete base-color and packed roughness/metallic PNGs. `textures/*.png` are editable source copies; the game needs no external texture URI. Base color uses sRGB; packed G roughness / B metallic uses non-color data. One shared PBR atlas material and one primitive per part.

The generator creates custom elliptical loft profiles for the face, helmet and clothing, bevelled equipment and hand-authored facial details. Texture cell colors encode cloth, painted metal, skin, leather and steel with distinct roughness/metallicity. This is an actual 3D surface model, not a billboard.

Coordinates: metres/game units, Y up, -Z forward, ground at Y=0. Model height 1.42. Rigid part origins: Body at ground; Head at `(0,.78,0)`; Arms at `(0,.67,0)`; LegL/R at `(±.12,.38,0)`. Rifle/hands are joined into Arms; rucksack into Body. `Muzzle` is parented to Arms, world rest position `(.16,.64,-.78)`.

Six procedural animation states are provided in `js/soldier-renderer.js`, rather than exported skeletal clips. Runtime uses shared geometry/material instancing. See `model-stats.json` for generated triangle counts. No original user reference image was present in the workspace: stylistic comparison to that specific image needs the original and user review.
