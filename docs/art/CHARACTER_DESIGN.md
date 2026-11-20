# 角色设计规范 (CHARACTER_DESIGN) — 士兵

> 模型: `assets/models/soldier/soldier.glb`(hero 13042 tris) + `soldier-lod.glb`(3908 tris)。
> 渲染: `js/soldier-loader.js`(装载) + `js/soldier-renderer.js`(InstancedMesh 五部件批渲染)。

## 1. 五部件刚体骨架 (锁定)

Body / Head / Arms / LegL / LegR — 无骨骼动画, 姿态=矩阵合成:
`_poseFor()` (soldier-renderer.js) 生成 run/idle/shoot-recoil/hit/victory。
理由: 单兵成本极低, 军团 500 人同屏仍稳 60fps; 增加骨骼属重写级变更, 禁止。

## 2. 形象语言

- 大头小身(Q 版比例 ~1:1.2), 圆肩圆盔, 无尖锐边 — 与"可爱军团"定位一致。
- 色块分离: 亮蓝军服(#3B82F6) / 深藏青头盔(#1E3A8A) / 棕色背带(#2C3E60 裤) — 俯视背面也能区分头/身。
- 脸部: 简单五官贴图, 不做表情帧(情绪由姿态传递)。

## 3. 军团规模呈现

- 池容量: `SQUAD_MAX_COUNT` + 科技加成 + 16 死亡幽灵位; >100 切 LOD bank。
- 死亡表现: 幽灵槽(`captureDeaths`)原地倒地渐隐, 不再产生实体。
- 枪口: GLB `Muzzle` 节点权威(挂于 Arms), 曳光/枪焰从真实枪口发射。

## 4. 变更守则

- 改贴图/配色必须重跑 `npm run test:model`(GLB 结构与面数校验)。
- 改比例必须同步相机构图(`world.js updateCamera` 的人数→高度曲线)。
- 新兵种视觉 = 现有五部件 + 染色/配件, 不新增部件(保持批渲染合并度)。
