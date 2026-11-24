# 战斗美术运行时集成

日期：2026-11-23。此文档只记录已接入运行时的战斗美术，不把概念 JPG、展示图或静态 UI 图标写成 3D 成果。

## 角色模型

- `tools/build-military-models.py` 从 `assets/models` 的 28 个原始 GLB 生成 `assets/game/models` 对应路径的运行时变体。
- 原始 GLB 不改动；`tests/unit/military-models.js` 固定校验 28 个源文件 SHA-256。
- 变体只替换材质引用的嵌入 base-color PNG。节点、五个刚性部件、网格、accessor、材质接线、ORM 图和非图像 bufferView 保持一致。
- 士兵的头盔、制服、裤装、背包、翻盖和绑带使用多层军绿色；面部、眼睛、金属、皮革细节没有整图单色覆盖。
- 13 个敌人键保持原顺序和加载行为：`normal fast shield split spitter elite bomber bruiser bulwark spitking hivelord titan overlord`。普通怪使用紫、红、蓝、酸绿、橙等选择性皮肤/衣物/强调色；六个 Boss 使用枪灰、钢色和高饱和能源强调色。
- 两套 LOD 与 hero 使用相同配色规则。生成后 28 个变体共约 2.74 MiB，低于约 2.80 MiB 的源 GLB 总量。
- 动画仍由 `soldier-renderer.js` 和 `enemy-models.js` 对 `Body/Head/Arms/LegL/LegR` 实例矩阵驱动，没有把静态图片冒充动画或蒙皮。

### 真实缺口

- 现有 8 个武器 GLB 仅用于军械库转台展示；战斗士兵的枪属于 `Arms` 合并网格，不能在不重做 Arms 网格/武器挂点的情况下安全换成 8/10 种独立枪型。本次没有把武器头像当作战斗 3D 枪械，也没有用重叠网格伪装替换。战斗中仍是原步枪轮廓，武器差异继续由既有弹道颜色、数值和特效表达。
- Boss 的五部件网格和刚性动画被刻意保留。已有运行时 `plates/horns/sacs` 可复用附件继续生效；本次以金属材质配色强化机械感，没有虚构新的骨骼、蒙皮、天线动画或独立 Boss rig。

## 五种军事场景

`js/military-art.js` 的全局类 `MilitaryArt` 在 World 完成旧场景创建后初始化。它使用可复用 `InstancedMesh` 组成远景、中景、三车道路面和前景道具，不加载整张战斗概念截图。

| 关卡主题 | 军事表现 | 主要区别 |
|---|---|---|
| dawn | sunny | 绿色基地、旗帜、岗楼、暖色标识 |
| noon | desert | 沙色路肩、岩石、土黄设施 |
| overcast | city | 灰色基地、高楼远景、冷色混凝土 |
| sunset | forest | 深绿林地、树干和树冠层 |
| dusk | snow | 雪白路肩、雪松、冷灰设施 |

道路段、机库、岗楼、木箱、沙袋和路障按 24 单位段循环复用；只有跨段时更新实例矩阵。主题切换只改现有材质颜色和组可见性，不为每个主题重建材质。新场景显示时旧 `roadGroup`、`_v42Environment` 和 `_v121Scenery` 仅隐藏，不销毁，便于回滚并避免切关分配抖动。

模块本身最多 19 个实例批次；每个主题只显示通用批次加该主题专属批次，保持在 30–40 个额外 draw call 预算以内。

## 门与特效

- 状态门仍由原 `V42Art.createGateModel` 创建，碰撞、奖励和触发逻辑未变。创建后只重写其顶点色：人数门绿、火力/技能门蓝、金币门金。
- `Effects` 使用一个静态 `TextureLoader` 和共享缓存加载 `assets/game/effects`。命中、枪口、普通爆炸和 Boss 爆炸沿用既有池、数量上限和生命周期，只替换池化材质的贴图。
- 贴图 404/解码失败时，原 Canvas 枪口、命中星芒和径向爆炸继续工作。没有在帧循环中创建纹理或材质。
- `coins.png`、`upgrade.png`、`boss_entry.png` 和 `trail.png` 已进入共享缓存与资源合同，但当前对应业务触发分别位于经济/UI、Boss 节奏和 `CombatSystem`，未在本切片跨模块改写触发逻辑；其中弹道仍使用原单 draw-call 程序化 tracer。资源存在不等于这些四项已经替换运行时视觉。

## 验证

- `node tests/unit/military-models.js`：源哈希、28 个变体、GLB 结构、非图像 bytes、ORM、选择性调色、PNG RGBA 特效合同。
- `npm run test:unit`：玩法单元回归。
- `npm run build`：H5 构建与资源引用。
- 本地浏览器实机渲染检查：绿色士兵、多色怪物、浅色三车道军事基地可同时显示；旧深色破损道路已被新路面替代。

