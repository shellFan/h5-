# V14 · 资产清单 (ASSET_MANIFEST)

> 生成: tools/v14-weapon-glb.js · 全部原创程序化生成, 无外部素材依赖, 许可=项目自有。

| ID | 名称 | 类型 | 用途 | 路径 | 格式 | 尺寸/面数 | 大小 | 来源 | 接入位置 | 验收截图 | 状态 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| W-GLB-rifle | 标准步枪 | 3D模型 | 军械库展示 | assets/models/weapons/rifle/rifle.glb | GLB 2.0 | ~66顶点/2材质 | 4.8KB | 程序化生成 | js/weapon-showcase.js → 军械库 hero | 08-armory-3d.png | ✅已接入 |
| W-GLB-shotgun | 散弹枪 | 3D模型 | 军械库展示 | assets/models/weapons/shotgun/shotgun.glb | GLB 2.0 | 同规格 | 4.0KB | 程序化生成 | 同上(切换即换) | 同上 | ✅已接入 |
| W-GLB-sniper | 狙击枪 | 3D模型 | 军械库展示 | assets/models/weapons/sniper/sniper.glb | GLB 2.0 | 同规格 | 5.0KB | 程序化生成 | 同上 | 同上 | ✅已接入 |
| W-GLB-mg | 机枪 | 3D模型 | 军械库展示 | assets/models/weapons/mg/mg.glb | GLB 2.0 | 同规格 | 4.8KB | 程序化生成 | 同上 | 同上 | ✅已接入 |
| W-GLB-flamethrower | 火焰喷射器 | 3D模型 | 军械库展示 | assets/models/weapons/flamethrower/flamethrower.glb | GLB 2.0 | 同规格 | 4.2KB | 程序化生成 | 同上 | 同上 | ✅已接入 |
| W-GLB-rocket | 火箭炮 | 3D模型 | 军械库展示 | assets/models/weapons/rocket/rocket.glb | GLB 2.0 | 同规格 | 4.4KB | 程序化生成 | 同上 | 同上 | ✅已接入 |
| W-GLB-freeze | 冰冻枪 | 3D模型 | 军械库展示 | assets/models/weapons/freeze/freeze.glb | GLB 2.0 | 同规格 | 4.6KB | 程序化生成 | 同上 | 同上 | ✅已接入 |
| W-GLB-tesla | 电磁枪 | 3D模型 | 军械库展示 | assets/models/weapons/tesla/tesla.glb | GLB 2.0 | 同规格 | 5.1KB | 程序化生成 | 同上 | 同上 | ✅已接入 |

## 非文件类表现层资产(代码内程序化, 不可文件化故以代码登记)

| ID | 类型 | 实现位置 | 说明 | 状态 |
|---|---|---|---|---|
| MON-VARIANT | 实例染色变体 | js/enemy-models.js VARIANT_TINTS | 5体型×2-5族确定性肤色变体(e.phase种子) | ✅已接入 |
| MON-SILHOUETTE | 轮廓变体 | js/enemy-models.js update() | 体宽±5%+前倾±9°(躯干/头/臂) | ✅已接入 |
| MON-ATTACH | 附件模型 | js/enemy-models.js _accGeometry/_accBank | 军盔(普通)/便帽(快速)/肩甲(盾·分裂), 头局部空间实例化 | ✅已接入 |
| MAP-CITYX | 城市加丰富道具 | js/art-v42.js cityx-* | 候车亭×6/广告牌×4/信号灯×4/消防栓×4(城市族) | ✅已接入 |
| MAP-APO | 末日道具 | js/art-v42.js apo-* | 坍塌楼板/瓦砾堆/烧毁车壳/余烬+枯树+远景废墟剪影 | ✅已接入 |
| MAP-CAVE | 洞穴道具 | js/art-v42.js cave-* | 崎岖巨岩走廊×14/石笋/发光晶体/荧光菌 | ✅已接入 |
| MAP-MECH | 机械道具 | js/art-v42.js mech-* | 管线/机甲残骸/能源塔+灯带/碎板+远景剪影 | ✅已接入 |
| MAP-FORT | 要塞道具 | js/art-v42.js fort-* | 防御墙/跨路拱门×4/瞭望塔/废弃坦克/沙袋+远景剪影 | ✅已接入 |
| GROUND-TEX | 地面纹理×5 | js/art-v42.js getGroundTexture | 柏油/龟裂/岩面/金属板/混凝土(含车道虚线) | ✅已接入 |
| VFX-EXPLOSION | 分级爆炸 | js/effects.js explosion() | 4档: 闪光+双冲击波+橙白火花+浮升烟尘 | ✅已接入 |
| VFX-TRACER | 分武器弹道 | js/combat.js TRACER_COLORS | 8色实例化弹道+中性曳光贴图+重型枪口火焰放大 | ✅已接入 |
| VFX-BOSS-ENTRANCE | Boss入场 | js/enemy-models.js 入场钩子 | 震屏+冲击波+爆闪+余烬一次性演出 | ✅已接入 |
| UI-NAV-ICONS | 宫格图标×10 | js/ui-v60.js V60_NAV_ICONS | 统一线宽原创SVG, 替换系统Emoji | ✅已接入 |

## 既有资产(V12/V13 交付, 本轮保留)

soldier.glb(+LOD) · zombies/{normal,fast,elite,shield,spitter,split}.glb(+LOD) ·
bosses/{bruiser,bulwark,hivelord,overlord,spitking,titan}.glb(+LOD+贴图) ·
assets/ui-v118/weapon-atlas.png(列表图集) · 全部 GLB 自包含无外部 URI。
