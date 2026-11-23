# V13 · Three.js 美术规范 (THREEJS_ART_GUIDELINES)

> 锁定 **three.js r149**(js/vendor/three.min.js 本地化) — 禁止升级/CDN。
> 对齐技能: threejs-scene-setup / threejs-gltf-loading / threejs-materials-lighting。

## 1. 场景结构(world.js)

- 相机: PerspectiveCamera(FOV 55, 0.1-120), 跟随小队 + lookAhead; 震动经相机偏移(衰减可控);
- 天空: BackSide 球(r=88) + 16×256 Canvas 渐变(`_paintSky`), 跟随相机 XZ, fog:false, renderOrder -10;
- 雾: THREE.Fog 按主题(近 26-48 / 远 88-135); 雾色与天穹地平线衔接;
- 光照: HemisphereLight(天/地, ~0.5) + DirectionalLight 暖阳(0.42-0.78, PCFSoft 阴影 1024/2048 按档);
- 主题: `CONFIG.WORLD_THEMES` → `applyTheme` — 只改天穹/雾/灯光/环境实例染色(幂等, `__themeBaseHex`)。

## 2. 材质纪律

- 场景环境: Lambert + 顶点色(mergeGeometries 合并降 drawcall);
- 角色 GLB: MeshStandardMaterial(PBR), 经 `preparePbr` 注入 encodings_fragment→LinearTosRGB
  (逐材质, 全局 sRGBEncoding 禁令维持 — V3.6 洗白教训);
- 发光件: MeshBasicMaterial({toneMapped:false}) — 门光束/装饰/文字, 不受雾与色调映射;
- 玻璃: MeshPhysicalMaterial(clearcoat), transparent+depthWrite:false;
- 任何新材质必须复用或入池; 禁止逐实例创建永久材质。

## 3. 渲染性能契约

- InstancedMesh 优先: 敌人 5 刚体部件分批 bank / 士兵 hero+lod 双 bank / 子弹 / 粒子 / 曳光;
- DynamicDrawUsage + 前缀上传(updateRange.count = used*16);
- drawcall 预算: 战斗均值 ≤ 130(当前 97); 新增视觉件优先合并几何(参考门光束单 mesh);
- dispose: 逐局重建物(门/能源核心)必须 traverse dispose(几何/材质/纹理); 常驻复用物不释放;
- 阴影: 只随画质档开启(≥1), 阴影贴图 1024(中)/2048(高), 廉价材质不 castShadow。

## 4. GLB 加载(gltf-loading 技能要点)

- 路径: assets/models/**(自包含贴图); 加载: THREE.GLTFLoader.parse(微信经 MiniGLTFLoader
  readFile + 分包重试, H5 走标准 FileLoader);
- 校验: SoldierModelLoader._validate(部件/属性/索引/材质共享/贴图解码) — 新模型必须通过;
- 分级加载: P0(士兵+普通/快速)阻塞首局, 其余后台错峰续载(游戏中 1.5s/个);
- 失败策略: dispose 半成品 + 重试按钮, 未知体格 normal 回退。

## 5. 色彩工作流(最高优先级红线)

- 渲染器 **不设** outputEncoding/toneMapping(刻意); PBR 材质逐个注入 LinearTosRGB;
- Lambert/MeshBasic 顶点色为显示空间色, 直接可用;
- 主题染色以 Color.lerp 于材质层完成, 不引入后期处理链。
