# 膨胀小队 · 美术方向 (ART_DIRECTION · V14.1 现行最高标准)

> **状态**：现行最高标准（V14.1 全面取代 V5.0/V12/V13 蓝色科技走廊旧基线）。  
> **历史参考**：`docs/V13/ART_DIRECTION.md`、`docs/V13/UI_DESIGN_SYSTEM.md` 仅作历史增量与动效令牌参考；与本文冲突时一律以本文及 `docs/art-assets/ART_ASSET_INTEGRATION_PROMPT.md` 为准。

---

## 1. 一句话视觉定位

**Premium Stylized 3D Toy Military Cartoon（高品质 3D 卡通玩具战争风）**  
绿色玩具士兵、高辨识度彩色卡通怪物、巨型机械装甲 Boss、阳光军事基地与五大生态战场、立体三跑道混凝土道路、绿/蓝/金高饱和能量增益门、深军绿暖金立体手游 UI。  
*严禁回退至蓝紫色赛博朋克走廊或低对比便签式表单界面。*

---

## 2. 技术框架（锁定，不得破坏）

| 项 | 现行锁定规范 | 说明 |
| :--- | :--- | :--- |
| 引擎 | Three.js r149（本地 `js/vendor/three.min.js`） | H5 与微信小游戏同源，禁止外链 CDN |
| 色彩工作流 | `raw-linear` + 逐材质 `LinearTosRGB` 注入 | **维持全局 `sRGBEncoding` 禁令**（防路面/肤色洗白） |
| 角色资产 | `assets/game/models/`（28 个军事涂装 GLB + LOD） | 保留原骨骼/刚体部件与程序动画契约，源目录 `assets/models/` 只读不可变 |
| 场景渲染 | `js/military-art.js` 全 `InstancedMesh` + 程序化 512px PBR 贴图 | 零每帧分配，单帧 Draw Call 受控 |
| 光照 | 半球光（天蓝→草绿 0.5）+ 暖阳主光 0.72 + 冷补光 0.30 | `js/world.js _setupLights` |
| 天空与雾 | 16×256 渐变天空穹顶 BackSide 球 + 主题匹配线性雾 | 远景山丘与天际自然融合 |
| 阴影与画质 | 0/1/2 三档自适应（pixelRatio 1 / 1.5 / 2，PCFSoft 1024/2048） | 中低端机自动降档保帧率 |

---

## 3. 统一色彩契约（V14.1 Toy Military Palette）

| 视觉角色 | 主色值 | 辅色 / 阴影 | 使用处 |
| :--- | :--- | :--- | :--- |
| **绿色玩具士兵** | `#456B2F` / `#567D35` | `#21391F` / `#364B27` | `assets/game/models/soldier/*.glb`（4×4 PBR Atlas） |
| **彩色卡通怪物** | 紫 `#8C55C7` / 红 `#ED6658` / 盾蓝 `#4EA6D8` / 酸绿 `#94CF3D` / 橙爆 `#F28535` | 深暗底色 + 暖黄高光 | `assets/game/models/zombies/*/*.glb` |
| **巨型机械 Boss** | 暗钢 `#505960` / 铁青 `#425D68` / 熔核橙 `#FF8841` / 能量青 `#37E5D1` | 重甲金属灰 `#293C48` | `assets/game/models/bosses/*/*.glb` |
| **阳光军事三跑道** | 水泥灰 `#9EA49F`（伸缩缝 + 颗粒） | 双黄边线 `#F2C94C` + 白虚线 `#F7F8F2` + 白金路缘石 | `js/military-art.js` |
| **五大生态主题** | 阳光草坪 `#6CA64B` / 沙漠 `#C9A062` / 废城 `#738282` / 森林 `#4F7D43` / 雪地 `#D2E5EE` | 配套营房/远山/树木换色 | `MilitaryArt.setTheme()` |
| **三种核心增益门** | **人数绿 `#22C56A`** / **火力蓝 `#2692FF`** / **金币金 `#F5A623`**（倍增紫 `#A84DFF` / 高危红 `#EB3B4E`） | 工业钢柱 `#455264` + 暖橙警示灯 `#FFB830` | `js/art-v42.js` + `js/gates.js` |
| **商业手游 UI 令牌** | 面板深军绿 `#182D20`~`#243F2D` / 主 CTA 琥珀金 `#F7AD1E` / 强调金 `#FFD24C` | 文本纯白 `#F2F6EC` / 柔和绿灰 `#B7CCB9` / 描边 `#6B9158` | `style-art-military.css` |

---

## 4. 轮廓、动画与特效规范

1. **0.3 秒敌我识别**：绿色士兵方阵 + 暖金弹道 vs 彩色高饱和怪物 + 巨型机械 Boss；严禁角色被路面或杂物吞没。
2. **增益门可读性**：工业双柱 + 暖橙顶灯 + 高饱和发光光幕（无悬空杂线）+ 512×384 上下分区大字标签（双行间距 ≥ 130px，杜绝叠字）。
3. **战斗特效对象池**：枪口火焰、金色曳光弹尾、击中星闪、死亡爆炸与地面贴花、Boss 登场冲击波与警告横幅、金币爆散、士兵增援/火力升级光环全部走 `js/effects.js` 对象池与热循环零分配。
4. **UI 交互铁律**：
   - 所有数字、标题、按钮文案由 DOM / `minidom` 动态绘制，禁止用整张 AI 截图冒充界面。
   - 覆盖 `320 / 360 / 375 / 390 / 414 / 430 CSS px` 竖屏宽度与微信小游戏右上角胶囊安全区，零横向溢出、零主控件裁切。
   - 动效沿用 `style-v130.css` 时长令牌并支持 `prefers-reduced-motion` 及游戏内「减少动效」开关。

---

## 5. 资产管线与不可替代项管理

* 原始 90 张素材归档于 `assets/art-source/original/`（去重后 86 份唯一原图）并记录于 `manifest.json` / `manifest.csv`，**严禁进入 H5/微信运行时包体**。
* 运行时加工素材统一输出至 `assets/game/`（H5 打包进 `dist/h5/assets/game/`；微信小游戏分包至 `wechat-game/art/` 与 `wechat-game/assets/game/models/`）。
* 需要独立 3D 建模或全新绘制的缺失素材统一登记于 `docs/art-assets/art-generation-queue.json`，在获得图像/建模工具前使用现有 GLB 变体与程序化资产兼容，严禁假资源占位。
