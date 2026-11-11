# V3.7 美术资源使用清单

> 生成方式: 目录扫描 + 运行时 `artReport()` 溯源(数据见 V37_RUNTIME_ART_REPORT.json)

## 一、仓库现有素材 → 游戏用途映射(真实路径)

| 素材 | 路径 | 格式/尺寸 | 游戏用途 | 状态 |
|---|---|---|---|---|
| 士兵头像 | `assets/art-v1/ui/soldier-avatar.svg` | SVG | HUD左上头像框 + 开始界面logo | LOADED+USED(2处) |
| 僵尸头像 | `assets/art-v1/ui/zombie-avatar.svg` | SVG | Boss血条头像 | LOADED+USED |
| 门面板概念图 | `assets/art-v1/ui/gate-panel.svg` | SVG | 3D门玻璃CanvasTexture的绘制规范来源(渐变/高光弧/立柱) | USED(参考实现) |
| 弹道光晕 | `assets/art-v1/effects/bullet-glow.svg` | SVG 64×192 | 所有弹道Sprite纹理(CanvasTexture加载,失败自动程序化兜底) | LOADED+USED |

**素材使用率: 4/4 = 100%,加载成功率: 4/4 = 100%**(运行时 `artReport().assets` 实测)。

## 二、不存在资源的处理记录

大纲提到的 `characters/ zombies/ boss/ gates/ environments/ textures/` 目录扫描结果:**不存在**。
无 GLB/GLTF、无透明角色 PNG、无 Sprite Sheet、无环境贴图。

按大纲处理规则执行:
1. "不允许仅把宣传图片加载为 Texture 就宣布角色美术完成" → 角色全部程序化建模,SVG 仅按其本来的用途使用(UI头像/弹道光晕)。
2. gate-panel.svg 是概念图 → 未整图贴到 3D 场景,而是按其设计语言(渐变玻璃+白色高光弧+左右立柱)重绘为 `createGateGlassTexture()` Canvas 纹理。
3. 无第三方模型引入,无许可证风险(所有几何体为代码生成,见 V3_LICENSES.md)。

## 三、程序化模型注册表(实际渲染 provenance)

| 对象 | 函数 | 结构 | DrawCall |
|---|---|---|---|
| 蓝色士兵 | `createSoldierBodyGeometry` + `createSoldierLegGeometry(±1)` | 身体30件+单腿3件,顶点色合并 | 全队3次(3×InstancedMesh) |
| 普通/快速/盾/分裂/远程僵尸 | `createZombieMerged(type)` | 每类型烘焙为≤2个合并mesh,全类型共享2材质 | 每只≤2次 |
| 精英/Boss | `createZombieModel('elite'/'boss')` | Group细节模型(头盔/角/肩甲/胸甲/拳) | 每只~20次 |
| 状态门 | `createGateModel` | 立体柱+发光沿+玻璃+投影环+数字Sprite | 每扇~21次 |
| 道路 | `_buildRoad()` | 12段×3mesh(路面/护栏/草地)+Canvas纹理 | ~36次 |
| 城市 | `_buildCitySkyline()` | 24栋低多边形建筑(窗户合并) | ~24次 |
| 道具 | `_buildEnvironment()` | 树/灯/锥/车/路障/箱交替布置 | ~40次 |
| 粒子/浮动文字/冲击波 | `effects.js` | 300池+Sprite | 按需 |

## 四、验证命令

浏览器控制台:
```js
__game.artReport()          // 完整溯源JSON
__game.getPerf()            // FPS/workMs/DrawCall/三角形
// URL 加 ?debug=1 → 左下角实时面板(模型来源+性能)
```
