# V5.0 模型目录（V50_MODEL_CATALOG.md）

统计为 V5.0 交付时对 GLB 文件二进制解析的实测值（三角形/网格数/材质/内嵌贴图/文件大小）。

## 士兵（玩家军团）

| 模型 | 路径 | 三角形 | 网格 | 材质/贴图 | 大小 |
|---|---|---|---|---|---|
| 士兵 hero | `assets/models/soldier/soldier.glb` | 13042 | 5 | 1/2 | 340 KB |
| 士兵 lod | `assets/models/soldier/soldier-lod.glb` | 3908 | 5 | 1/2 | 146 KB |

- 五部件：Body/Head/Arms/LegL/LegR；蓝色军服+深藏青头盔+白色五角星+枪械+背包
- 动作：跑步（腿部对摆+手臂摆）、射击（右臂抬举）、受击（群体后仰）、死亡（倒地幽灵）、胜利（Victory 状态）
- 渲染：`js/soldier-renderer.js` 分部件实例化；>100 人自动切 lod

## 敌人（僵尸族谱，`assets/models/zombies/`）

| 类型 | hero tris | lod tris | 大小(hero/lod) | 特征 | 接入 |
|---|---|---|---|---|---|
| normal | 3676 | 1054 | 153/76 KB | 绿皮黄眼破衣，摇晃步 | `EnemyArmyRenderer` |
| fast | 3744 | 1076 | 157/79 KB | 瘦小前倾快速跑 | 同上 |
| shield | 4468 | 1285 | 174/84 KB | 金属大盾+重甲，防御体格 | 同上 |
| split | 4184 | 1202 | 166/81 KB | 紫色变异，死亡分裂×2 | 同上 + `splitQueue` |
| spitter | 3920 | 1126 | 159/79 KB | 绿色发光嘴，远程酸弹（自发光图集处理） | 同上 + 酸弹池 |
| elite | 3652 | 1048 | 161/79 KB | 巨拳+厚重肩甲，体型优势 | 同上 |

## Boss（`assets/models/bosses/`，一关一风格）

| 风格 | hero tris | lod tris | 大小(hero/lod) | 技能 | 对应关卡 |
|---|---|---|---|---|---|
| bruiser 铁拳队长 | 4532 | 1212 | 177/81 KB | 蓄力冲击 | L1/L2 |
| bulwark 钢盾领主 | 4600 | 1232 | 183/83 KB | 能量护盾 | L3 |
| hivelord 裂变母巢 | 4204 | 1125 | 166/79 KB | 召唤小怪 | L4/L7 |
| spitking 毒雾之王 | 4348 | 1160 | 171/79 KB | 三向酸弹 | L5 |
| titan 重装巨尸 | 3816 | 1021 | 165/78 KB | 蓄力冲击+减伤85% | L8/L9 |
| overlord 终焉核心 | 4276 | 1146 | 168/80 KB | 三阶段+护盾+召唤 | L10 |

- Boss 战斗逻辑：`js/boss-v42.js`（阶段切换/狂暴/技能提示/受击/死亡演出）
- L6 双生精英(twinelite)：两半血 elite 风格 Boss 同场（`game.js pacing.spawnFn` 分体逻辑）

## 渲染接入证明
- 全部 14 个模型对（28 个 GLB）由 `EnemyModelLoader`/`SoldierModelLoader` 加载并校验（部件完整性/PBR 贴图解码失败即启动失败带重试）
- 实际渲染经 `EnemyArmyRenderer`/`SoldierRenderer` InstancedMesh；`?debug=1` 面板实时显示每个模型的 artSource 溯源
- 资产校验测试：`tests/unit/v42-assets.js`（GLB 结构/PNG 图集/预算/包围盒目录校验）——当前通过
- 士兵资产测试：`tests/unit/soldier-asset.js`（结构/嵌入 PNG/PBR/UV/部件/共享材质/三角形预算）——当前通过

## 生产工具
- `tools/create-soldier.py` / `tools/create-enemies.py`（Blender Python，可复现建模）
- `tools/blender_art_common.py`（公共建模库：五部件骨架/图集烘焙/GLB 导出）

**注**：本环境无 Blender 运行时，V5.0 未重建模型本体；模型均为 V4.2 已交付资产（V5.0 校验接入正确性与统计）。
