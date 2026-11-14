# V5.0 美术风格规范（V50_ART_STYLE.md）

## 总体定位
Premium Stylized 3D Cartoon —— 竖屏 3D 卡通休闲射击手游。可爱、鲜艳、精致、清晰、轻松、爽快，达到商业手游可上线完成度。

## 渲染管线
- **引擎**：Three.js r149（本地 pinned `js/vendor/three.min.js`，无 CDN 依赖）
- **色彩**：raw-linear 工作流；角色 GLB 材质经 `preparePbr` 注入 `LinearTosRGB` 显示变换（`art-v42.js:68-81`），场景程序化件保持 Lambert 顶点色。禁止全局 sRGBEncoding（V3.6 实证会洗白路面）
- **光照**：半球光(天蓝→草绿 0.5) + 主方向光(暖白 0.72, 2048 阴影贴图, 随小队移动) + 冷色补光(0.30)
- **模型**：Blender 脚本化生产（`tools/create-soldier.py` / `create-enemies.py` / `blender_art_common.py`），全部 GLB 双 LOD（hero/lod），单材质内嵌 PBR 图集（baseColor+roughness）
- **实例化**：士兵/敌人按"刚体分部件 InstancedMesh"渲染（Head/Body/Arms/LegL/LegR 5 部件 × 每部件 1 个 InstancedMesh/风格/LOD）；环境按类别 InstancedMesh；子弹/粒子/酸弹全对象池 + Instanced

## 色彩系统
| 用途 | 色值 | 出处 |
|---|---|---|
| 天空/雾 | 0x87CEEB / 0xB8D8F0 | `config.js COLORS` |
| 路面/路缘/车道线 | 0xB8B4C8 / 0x9A94B0 / 0xF0EEF5 | 同上 |
| 士兵主体/头盔/马甲 | 0x3B82F6 / 0x1E3A8A / 0x1E40AF | 同上 |
| 门稀有度 | 蓝 0x2F6FE0 / 紫 0x7C3AED / 金 0xD97706 / 红 0xDC2626 | `GATE_RARITY` |
| 子弹 | 金 0xFFD700 + 白核 0xFFF3B0 | 同上 |
| UI 主色 | 蓝主色/金奖励/紫稀有/红危险 | `style.css`/`style-v42.css` 变量 |

## 角色规格（真实统计，GLB 解析实测）
- 统一五部件骨架：Body / Head / Arms / LegL / LegR，每模型 5 mesh、1 材质、2 贴图（内嵌 PNG 图集）
- 士兵 hero 13042 tris / lod 3908 tris（340/146 KB）
- 敌人 hero 3652-4600 tris / lod 1021-1285 tris（76-183 KB）
- Boss hero 3816-4600 tris / lod 1021-1232 tris
- 帧内动态姿态由部件矩阵合成（腿部摆动/手臂前举/头部晃动/Boss 蓄力膨胀），不是骨骼动画

## 镜头与军团
- FOV 53°，竖屏构图；相机随军团规模升高后移（sqrt 曲线）：1 人 5.6/8.4 → 500 人 8.7/10.4
- 阵型：1/12 人完整比例 → 100 人 6 列 0.86 缩放 → 300 人 11 列 0.55 → 500 人 13 列 0.50
- LOD 判定：士兵 >100 人切 lod；敌人 >40 只或纵深 >22 切 lod；Boss 纵深 >42 切 lod

## 特效规范
- 金色弹道 Sprite（bullet-glow.svg → CanvasTexture，失败有程序化兜底）
- 枪口四角星闪光（池 24）、命中火花/击杀爆裂/冲击波环/浮动伤害数字（池化 + 纹理缓存 128 上限）
- 乘法门慢动作 0.35s + 震屏；Boss 入场/狂暴/死亡各自粒子演出
- 全部特效走 Instanced/池化，禁止每帧新建几何体

## 禁止事项
- 精致 GLB 角色搭配简陋几何体（V4.2 起全角色 GLB 化，已消除）
- 每帧创建几何体/材质/纹理
- 未释放的场景重建资源（门每局重建必须 dispose——已实现并经审计确认）
- 只改颜色宣称美术重制
