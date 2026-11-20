# 怪物设计规范 (MONSTER_DESIGN) — 僵尸/精英/Boss

> 模型: `assets/models/zombies|bosses/<style>/<style>[-lod].glb`, 12 体型 × 双 LOD。
> 渲染: `js/enemy-models.js`(EnemyModelLoader + EnemyArmyRenderer 五部件 InstancedMesh, 单类型 448 槽)。

## 1. 体型矩阵 (CONFIG.ZOMBIE, 数值=业务锁定禁改)

| 类型 | scale | 血量 | 视觉识别 |
|---|---|---|---|
| normal | 1.45 | 3 | 标准绿皮, 基准剪影 |
| fast | 1.18 | 2 | 瘦小+高频摆臂(相位速度 10) |
| shield | 1.60 | 10 | 正面圆盾(灰金属), 行进最慢 |
| split | 1.28 | 4 | 紫皮; 死亡分裂两只 0.6× 小体 |
| spitter | 1.38 | 4 | 绿嘴+嘴部发光(emissiveMap 技巧) |
| elite | 2.50 | 26 | 大体型; V12 金染(1.22,1.08,.72) + 贴地金环 |
| bomber | 1.32 | 6 | V12 红染(1.5,.55,.5) 复用 fast 模型; 死亡自爆 |
| boss | 3.90 | 200+ | 六 styles 轮换; 出场弹跳+阶段染色+狂暴发光 |

## 2. 识别三要素 (任何怪物改动必须保持)

1. **体型差**: 同屏最小(fast 1.18)与最大(boss 3.9)≥3×; 精英与普通≥1.7×。
2. **颜色染**: 每实例 `setColorAt` — 冻结蓝(0.50,0.85,1.35) / 受击白热(2.8,2.4,1.8) / Boss 阶段粉紫红 / V12 精英金与自爆红。冰冻与受击优先级高于身份染。
3. **地面标记**: 精英金环(共享几何, 上限 10 只) / 击杀尸液 decal / Boss 死亡金色爆闪。

## 3. 动画语言 (矩阵姿态, 非骨骼)

- 行走: 腿相位摆动(walk), 身体 z 轴摇摆 + 弹跳 bob; 摇头蹒跚(尸吊感)。
- 攻击: 前扑伸缩(rotation.x -0.16 + 正弦 0.13); 双臂攻击角 -0.65。
- 受击: 合并模型=膨胀回弹(×1.18); Group 模型=emissive 闪烁。
- 死亡: 后仰(rotX -1.4)+侧偏+缩收; Boss 0.8s / 小怪 0.46s。

## 4. Boss 六样式与阶段

- styles: bruiser/bulwark/spitking/hivelord/titan/overlord; spitking/hivelord/overlord/spitter 走嘴部发光管线(emissiveMap 涂黑+实例色驱动辉光)。
- 阶段 2/3: 实例染(1.12,0.85,1.2)/(1.35,0.72,0.75); 狂暴(<50%/overlord<33%): emissive 0x3A0000 + 红色 shockwave。
- Boss 护盾: 半透明蓝球(shieldMesh, ≤8)。
- 死亡: 三色粒子(红/金/白)+冲击波+金爆闪(flash 3.4)。

## 5. 变更守则

- 词缀(affixes.js)只改 scale/行为, 不改染管线的优先级顺序。
- 新怪物 = 新 GLB style + 配置行; 禁止改 EnemyArmyRenderer 的部件契约(PARTS 五件)。
- LOD 切换阈值(敌>40 或纵深>22; Boss>42)锁定 — 改动必须过 `test:v101` 性能矩阵。
