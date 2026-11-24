# 《膨胀小队》V15.0 美术资产审计报告 (ART ASSET AUDIT)

## 1. 审计范围与安全策略
- 源压缩包：`《膨胀小队》H5全套美术资产库.zip`（安全解压至独立临时目录进行审计，未覆盖项目 `assets/`）。
- 详细逐文件清单已生成：`docs/V15/ART_ASSET_MANIFEST.json`。

## 2. 资产统计总览
- **压缩包总文件数**：90 个图像文件
- **去重后唯一文件数**：86 个（检测到 4 个 SHA-256 完全重复文件）
- **含真实透明通道 (Alpha)**：0 个（全部为不透明底图/图集，直接贴 UI 会出现矩形底色，需抠图切片或仅作参考）
- **项目中已有引用记录**：88 个（此前已在 `assets/art-source/` 及 `assets/game/catalog.js` 中建立归档索引）
- **现有运行时 3D GLB 模型**：64 个（含 `soldier.glb` + `soldier-lod.glb`，7 类僵尸 × 2 LOD，6 类 Boss × 2 LOD，8 类武器 GLB，以及微信小游戏同步副本）

## 3. 分类分布
| 分类 | 数量 | 使用建议 |
|---|---|---|
| 士兵 | 18 | 仅作 3D 建模/配色参考（严禁替代 `soldier.glb`） |
| 武器 | 13 | 部分已裁剪至 `assets/game/weapons/`，其余作军械库/建模参考 |
| UI | 12 | 多为整页/整表图集且无透明通道，作 V15 UI 风格参考或单元素切片 |
| 地图 | 10 | 仅作 3D 场景配色/构图参考与关卡缩略图，严禁当战斗静态背景 |
| 场景道具 | 8 | 作 3D 军事基地组件（沙袋/坦克/铁丝网/增益门）造型参考 |
| 特效 | 8 | 无透明通道，需混合模式或程序化粒子纹理替代 |
| 怪物 | 7 | 作 3D 紫色怪兽与 Boss 配色/轮廓参考 |
| 完整设计稿 | 7 | 仅作视觉验收基准，禁止直接当界面 |
| 重复素材 | 4 | 忽略，不入运行包 |
| 图标 | 3 | 已提取常用图标至 `assets/game/ui/ui-atlas.png` |

## 4. 关键审计结论
1. **已有高质量 3D 运行期基础**：绿色玩具士兵 `soldier.glb` 与紫色怪兽 `normal.glb` 等 64 个 GLB 已稳定跑通 InstancedMesh + LOD，应直接保留并围绕它们升级光照、材质、场景和 UI。
2. **历史 CSS 级联覆盖问题**：`index.html` 依次加载了 8 份 CSS（`style.css` → `style-v42.css` → `style-v51.css` → `style-v60.css` → `style-v120.css` → `style-v118.css` → `style-v130.css` → `style-art-military.css`）。其中 `style-v120.css:60` 使用 `#game-container.v42-ui #stats-panel .stat-row`（优先级 2 ID + 2 Class），直接覆盖了 `style-art-military.css:422`（1 ID + 2 Class），导致战斗 HUD 仍残留蓝紫旧风！
3. **启动屏文案残留**：`index.html:23` 仍显示 `SQUAD INFLATE · 蓝色科技战线`，需同步替换为 V15 玩具军事风格文案。
