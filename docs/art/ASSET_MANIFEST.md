# 资产清单 (ASSET_MANIFEST)

> 规则: 每个正式资产必须有 明确用途/尺寸/格式/来源/授权; 新增资产先登记后使用。
> 运行时对应物: 每个渲染对象 `userData.artSource`(代码内溯源)。

## 1. 3D 模型 (GLB, 双 LOD, Blender 程序化生成 — 自有, 无外部来源)

| 资产 | 用途 | 面数(hero/lod) | 来源 |
|---|---|---|---|
| assets/models/soldier/soldier[-lod].glb | 士兵(唯一兵模) | 13042/3908 | tools/create-soldier.py |
| assets/models/zombies/{normal,fast,shield,split,spitter,elite}/…glb | 6 普通系僵尸 | 3652-4600/~1021-1285 | tools/create-enemies.py |
| assets/models/bosses/{bruiser,bulwark,spitking,hivelord,titan,overlord}/…glb | 6 Boss | 同上量级 | tools/create-enemies.py |
| assets/models/enemies/ | 兼容占位(小体) | — | — |

约束: PBR 单材质+内嵌贴图; 五部件命名契约(Body/Head/Arms/LegL/LegR); 装载校验失败即报错不降级。

## 2. 程序化纹理 (运行时生成, 无文件, 零授权风险)

| 纹理 | 尺寸 | 生成处 |
|---|---|---|
| 柏油路 | 256×512 | world.js _buildRoad |
| 天空穹顶渐变 | 16×256 | world.js _buildSky (V12) |
| 曳光弹 | 64×256 | combat.js _makeTracerTexture (V12) |
| 枪焰星 | 64×64 | effects.js muzzleFlash |
| 冲击星 | 128×128 | effects.js constructor |
| 尸液 decal | 128×128 | effects.js constructor (V12) |
| 爆闪 flash | 128×128 | effects.js constructor (V12) |
| 门玻璃/文字 | 动态 | art-v42.js makeGateGlassTexture/makeGateTextTexture |

## 3. UI 素材 (SVG, assets/art-v1/ui/)

| 资产 | 用途 | 来源 |
|---|---|---|
| soldier-avatar.svg | 头像/Logo | 项目自有 |
| zombie-avatar.svg | Boss 血条头像 | 项目自有 |
| effects/bullet-glow.svg | (遗留)旧弹道参考 — V12 起弹道改程序化贴图, 文件保留不引用 | 项目自有 |

## 4. 字体

- 系统 UI 字体栈(PingFang SC / Microsoft YaHei / sans-serif) — 无内嵌字体文件, 无授权负担。
- 飘字/门文字: canvas 绘制, 同字体栈。

## 5. 新增资产流程

1. 明确用途与预算(尺寸/格式/加载时机)。
2. 来源与授权登记到本文 + `ASSET_LICENSES.md`。
3. 代码内挂 `userData.artSource`。
4. 过 `docs/development/VISUAL_ACCEPTANCE.md` 检查单(真实画面验收)。

> 禁止: 随机图片充当正式素材; 占位图当交付; 未登记的外部素材。
