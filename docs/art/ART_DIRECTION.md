# 膨胀小队 · 美术方向 (ART_DIRECTION)

> 状态: 现行标准 · 本文是所有视觉决策的最高依据。
> 历史沿革见 `docs/V50_ART_STYLE.md`(V5.0 基线) 与 `docs/V42_PLAN.md`。
> V12 视觉升级在 V5.0 基础上做表现层精修, 不改变玩法与业务逻辑。

## 1. 一句话定位

**Premium Stylized 3D Cartoon** — 明快、干净、可读性优先的竖屏 3D 卡通射击。
所有资产服务于"战斗可读性": 任何时刻玩家都能在 0.3 秒内分辨敌我、体型、危险度。

## 2. 技术框架 (锁定, 不得随意变更)

| 项 | 值 | 说明 |
|---|---|---|
| 引擎 | three.js r149 (本地 `js/vendor/three.min.js`) | 禁止全局 CDN 依赖 |
| 色彩工作流 | raw-linear + 逐材质 `LinearTosRGB` 注入 | **全局 sRGBEncoding 禁令维持**(V3.6 教训: 洗白) |
| 材质 | 场景 Lambert(顶点色) / 角色 GLB Standard(PBR) | `preparePbr` 统一注入 |
| 光照 | 半球(天蓝→草绿 0.5) + 暖阳 0.72(随队移动阴影) + 冷补光 0.30 | `world.js _setupLights` |
| 天空 | V12: 渐变穹顶(BackSide 球, 16×256 Canvas), 雾色 0xC9E4F2 与地平线衔接 | `world.js _buildSky` |
| 阴影 | PCFSoft, 1024(中)/2048(高), 只随画质档开启 | |
| 画质档 | 0/1/2 三档 → pixelRatio 1/1.5/2, AA/阴影联动 | `world.js _detectQuality` |

## 3. 色彩契约 (Palette Contract)

| 角色 | 色值 | 使用处 |
|---|---|---|
| 天空顶 | #4FA3DF | 渐变穹顶顶部 |
| 天空地平线 | #EAF4FA / 雾 #C9E4F2 | 穹底与雾衔接 |
| 柏油路 | #7C8B96 (+4 条淡色带) | 路面 CanvasTexture |
| 车道虚线 | #F0EEF5 | |
| 路缘警示线 | #E3C26B(降饱和暖黄) + 暗衬边 | V12: 替代原 #F6CC59 纯黄 |
| 草地 | 0x719C80 ±16% 明暗修剪条纹 | 每 3u 交替 |
| 士兵主体 | 0x3B82F6 / 头盔 0x1E3A8A | GLB 贴图 |
| 僵尸系 | 绿系 0x8FBC5A 族 / 分裂紫 0xA583C9 / 自爆红 0xC94B4B | CONFIG.ZOMBIE |
| 子弹 | 白热弹头 + 金色尾迹(程序化 64×256) | combat.js |
| UI 主色 | 蓝 #1A6FD4 / 金 #FFC247 / 紫 #8454D6 / 红 #E8506A | style-v120.css 令牌 |
| 门稀有度 | 蓝(增援)/紫(强化)/金(倍增)/红(风险) | GATE_STYLES |

## 4. 轮廓与可读性规则

1. **剪影优先**: 每种敌人必须有独特剪影(盾/吐嘴/自爆红染/精英金染×2.5 体型/Boss 3.9)。
2. **特殊体型必须叠加身份标记**: 精英=贴地金环(`V42Art.createEliteAura`)+金染; 自爆尸=红染; Boss=出场弹跳+阶段染色+狂暴红光。
3. **地面痕迹代替血腥**: 击杀留下 2.2s 渐隐尸液 decal(程序化 128px), 保持卡通尺度。
4. **色彩不是唯一信号**(无障碍): 冰冻=染色+粒子, 暴击=更大+白芯描边数字, Boss=横幅+血条+体型三重信号。

## 5. 特效节奏 (V12 简明版)

- 反馈分层: 命中(星闪 0.16s) < 击杀(粒子爆+decal) < 自爆/Boss 死(白闪 flash 0.14s + 冲击波 + 大粒子)。
- 一切特效走对象池/InstancedMesh; 上限: 粒子 300 / 曳光 120 / 枪焰 24 / 飘字 20 / 冲击星 48 / decal 16 / 爆闪 8 / 精英光环 10。
- 热循环零分配: scratch Matrix4/Vector3 复用(`effects.js update`)。
- 闪烁上限: 大面积亮闪 ≤3 次/秒(photosensitivity)。

## 6. 禁止清单 (沿用 V5.0 + V12 增补)

- 全局 sRGBEncoding / toneMapping(会破坏既有逐材质校色)。
- 每帧 new 几何/材质/纹理; 未 dispose 的重建。
- 随机图片充当正式素材; 占位图当交付。
- 纯"换色式假升级"(V37 根因报告): 视觉变更必须伴随轮廓/层次/动效至少一项。
- 改动本文件"技术框架"表内任何锁定项前, 必须先跑 `npm run test:unit` + `tests/e2e/visual.js` 并更新本文。

## 7. 资产管线速查

- 角色: Blender 脚本生成(`tools/create-soldier.py` 等) → GLB 双 LOD → 启动只等关键集(士兵+normal/fast), 其余后台续载。
- 场景: 全程序化(CanvasTexture + 顶点色 + InstancedMesh), 无外部图片依赖。
- UI: SVG 图标(`assets/art-v1/ui/`) + CSS 令牌; 文字一律代码渲染(canvas/CSS), 禁止贴图字。
- 每个渲染对象挂 `userData.artSource` 标注来源 — 新增资产必须遵守。
