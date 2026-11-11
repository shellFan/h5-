# V3.7 美术未生效根因报告

> 调查日期: 2026-11-12 · 分支: master · 基线 commit: 1e8973b

## 一、结论(先说答案)

**仓库中不存在任何可直接使用的角色 3D 模型资源。** "美术没有生效"的根因不是"加载失败/被旧模型遮挡/路径错误",而是:

1. **assets/art-v1/ 实际只包含 4 个 SVG 文件**(子弹光晕、士兵头像、僵尸头像、门面板概念图),用户大纲中描述的 `characters/`、`zombies/`、`boss/`、`gates/`、`environments/`、`textures/` 目录**从未存在**。
2. 因此游戏角色一直是程序化建模(Three.js 基础几何体组合)。按大纲第 1.3/四节的优先级判定:无 GLB/GLTF 可优先、无 Blender 可用 → **程序化建模是合法路径**,但必须达到细节品质。
3. 此前版本程序化模型的**细节密度不足**,造成"蓝色球阵/简单胶囊"观感(具体差距见第三节)。
4. 另发现并修复了两处真实工程问题:浏览器缓存旧脚本(已加 `?v=37` 破缓存)、并发会话新增的 `js/movement.js`/`js/pacing.js` 未加入 index.html 加载序列导致启动崩溃(已修复加载顺序)。

## 二、证据链

### 2.1 资产目录完整扫描(非假设)

```
assets/art-v1/
├── README.md                     (2行, 无素材清单)
├── effects/bullet-glow.svg       (弹道光晕纹理 64×192)
├── ui/gate-panel.svg             (门面板概念图)
├── ui/soldier-avatar.svg         (士兵头像)
└── ui/zombie-avatar.svg          (僵尸头像)
```

`characters/ zombies/ boss/ gates/ environments/ textures/` — **目录不存在,无 GLB/GLTF,无透明 PNG 角色图,无 Sprite Sheet**。

### 2.2 运行时资源追踪报告(非猜测)

游戏内置了运行时溯源工具(`window.__game.artReport()`,?debug=1 有实时面板),通过遍历 Three.js Scene 收集每个渲染对象的 `userData.artSource` 标签。完整数据见 [V37_RUNTIME_ART_REPORT.json](V37_RUNTIME_ART_REPORT.json),要点:

| 渲染对象 | 模型来源 | 状态 |
|---|---|---|
| 士兵×N | `models.js:createSoldierBodyGeometry+createSoldierLegGeometry` (3×InstancedMesh) | 实际渲染 |
| 僵尸(普通/快速/盾/分裂/远程) | `models.js:createZombieMerged(type)` (20mesh→2mesh批处理) | 实际渲染 |
| 精英/Boss | `models.js:createZombieModel(type)` (Group细节模型) | 实际渲染 |
| 状态门 | `models.js:createGateModel(op)` + `createGateGlassTexture`(参考gate-panel.svg) | 实际渲染 |
| 弹道 | 纹理 `assets/art-v1/effects/bullet-glow.svg` | LOADED |
| 道路 | `world.js:_buildRoad()` CanvasTexture(柏油+车辙+车道线) | 实际渲染 |
| 建筑/道具/云 | `world.js:_buildCitySkyline()/_buildEnvironment()` 程序化 | 实际渲染 |

外部资产加载状态: 4 个 SVG 全部 LOADED、全部被使用(soldier-avatar×2 处、zombie-avatar、bullet-glow)。

### 2.3 "是否仍在用旧模型"排查清单逐项核销

| 排查项 | 结论 |
|---|---|
| 是否只用 SphereGeometry 拼角色 | 士兵=13类几何体组合(含五角星ShapeGeometry),僵尸=20+部件组合;已消除"裸球"观感 |
| 是否存在新旧两套模型系统 | 无。僵尸单一入口(大众型走批处理,Boss/精英走Group),士兵单一InstancedMesh×3入口 |
| 是否只换头像没换3D模型 | 否,头像仅用于HUD(本就该如此);3D模型持续在迭代 |
| 资源路径错误 | 无(bullet-glow.svg 加载成功,失败有程序化兜底) |
| 加载了但没进Scene | 无此情况(溯源报告全部标VISIBLE) |
| 缩放比例错误 | V3.7已修正(僵尸整体+15%,Boss 3.9) |
| 摄像机导致细节不可见 | V3.7相机抬高(6.1/7.8/FOV53),前后排均可读 |
| 浏览器缓存旧代码 | **真实问题**,已加 `?v=37` 破缓存 |
| 实例化渲染引用旧Geometry | 否,士兵几何随V3.7重制重建 |

## 三、V3.7 针对性重制(本次已落地)

| 用户不满 | 根因 | V3.7修复 |
|---|---|---|
| 100人=蓝色球阵 | 固定7列×0.52间距,头盔互相重叠 | 分层阵型策略(1-10单排/11-30八列/31-100九列/101-300十一列/301-500十二列)+行交错+个体微抖动 |
| 看不清枪和背包 | 枪在身前,背面视角不可见;包太小 | 枪械加大加长+枪托外露;背包+bedroll+双肩背带;双手持枪姿态 |
| 无跑步动作 | 单一合并几何无法做肢体动画 | **分体实例化**:身体/左腿/右腿 3×InstancedMesh,腿绕髋部X轴交替摆动(共用材质,仍只3次DrawCall) |
| 僵尸太小/无威胁 | scale 1.3偏小 | 全类型放大(normal 1.45/fast 1.18/shield 1.6/split 1.28/spitter 1.38/elite 2.5/boss 3.9)+蹒跚摇头动画 |
| 门=简单方框 | 薄板框+平面玻璃 | 立体柱础/柱头/纹章板+四边发光内沿+地面投影环+玻璃后退产生厚度 |
| 弹道=几个光点 | visualRate上限16/齐射4 | 弹频22/齐射5/枪口火焰加大(全部池内复用,120上限) |
| 道路单调 | 纯色+虚线 | 加车辙印+沥青补丁噪块 |
| 镜头军团过大 | 相机过低过近 | Y6.1/Z7.8/lookahead-8.5/FOV53 |
| Boss无存在感 | scale 3.6+白色受击闪烁 | 3.9+受击闪烁限幅0.35(不再刷白) |

## 四、遗留说明(诚实标注)

- 大纲中的 `characters/` 等目录若后续真实入库 GLB/PNG,`createSoldierGeometry()` 旧接口与批处理烘焙管线已支持替换(模型工厂单入口)。
- 本环境的 IAB(应用内浏览器)后台节流会导致 rAF 测帧失真,性能数据采用"同步驱动帧+单帧workMs"法(见 V37_PERFORMANCE.md)。
- 1080×1920 分辨率下截图管线偶发捕获到未合成帧(游戏本体渲染正常,360/390/430 无此问题),已在 V37_TEST_REPORT.md 记录。
