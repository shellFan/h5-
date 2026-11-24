# V15-ART-007 商业级全屏UI重构、独立3D场景资产与战场精修 交付报告

## 本轮完成项（直攻 85–88/100 商业验收线）

1. **全屏独立业务页面架构（`style-art-military.css`）**
   - 彻底取消「首页上覆盖巨大绿色弹窗」模式，将 **武器军械库 (`#v60-armory-page`)、升级商店 (`#shop-screen`)、士兵训练中心 (`#v60-train-page`)、排行榜 (`#v60-rank-page`)** 全部升级为 100% 全屏独立功能页（`inset: 0`，安全区适配，独立场景背景，独立顶栏/滚动区）。
2. **Blender 4.2 Cycles 独立 3D 灯光场景背景资产（`tools/art-pipeline/blender/v15_ui_bgs.py`）**
   - 使用 Blender 4.2.3 LTS + Cycles + OpenImageDenoise + AgX 渲染 3 套独立竖屏商业场景背景：
     - `assets/game/v15/bg_armory.jpg`（武器军械室：装甲立柱、金饰腰线、枪架墙板、弹药箱与暖光环形武器展示台）
     - `assets/game/v15/bg_shop.jpg`（后勤补给站：军营木架、补给箱、金色物资箱与暖光营灯）
     - `assets/game/v15/bg_train.jpg`（战术训练营：军徽背景墙、沙袋掩体与聚光展示台）
3. **武器军械库彻底重构（`js/ui-v60.js` + `style-art-military.css`）**
   - 独立顶栏（`‹ 返回` | `ARSENAL 武器军械库` | 实时金币徽章），移除底部冗余返回按钮。
   - 放大武器主展示台至 `196×176`（带暖金聚光投影），彻底清除武器名称旁廉价水枪 Emoji (`🔫`)。
   - 新增「下一级属性预览」（如 `下一级 Lv.1：伤害 ×1.3`），武器卡片改为紧凑高信息密度 2 列网格。
4. **升级商店彻底重构（`js/game.js` + `style-art-military.css`）**
   - 全部 5 项永久升级（新兵招募、后勤补给、枪械强化、快速射击、穿甲弹）的网页 Emoji 图标全部替换为项目独立 3D 透明 PNG 图标（`soldier_portrait.png`、`chest.png`、`rifle.png`、`star.png`、`shield.png`）。
   - 每项新增等级徽章（`Lv.0/10`）、绿金进度条、当前→下一级数值对比（如 `初始人数 1 → 初始人数 2`）。
   - 彻底清除灰白默认禁用按钮，改为深军绿铜金描边低亮度商业不可购买态（配独立金币 PNG 与「金币不足」清晰标签）。
5. **战场地图与士兵比例最终精修（`js/military-art.js` + `tools/art-pipeline/blender/v15_soldier.py`）**
   - 彻底移除低模尖三角形 `ConeGeometry` 山脉，重构为三层平滑谐波曲线远景山脊（近景苍翠丘陵 `0x567E4D` → 中景林岩山脉 `0x6A8E7D` → 远景淡蓝大气山脊 `0x8BAEC2`），无缝衔接首页美术世界观。
   - 在 Blender 4.2 中精修士兵头盔与肩甲比例（头盔半径收窄 ~14%，战术背心与肩甲适度加宽），36人阵型下装甲肩部、卡其军包五角星与突击步枪轮廓清晰可辨。

## 自动化验证与性能数据（390×844 Chromium SwiftShader 软件渲染实测）

- **单元测试**：`node tests/unit/run.js` → **102 / 102 PASS**
- **GLB 契约验证**：`node tests/unit/soldier-asset.js` → **PASS** (`hero: 9500 tris, lod: 2656 tris`)
- **H5 打包构建**：`node tools/build-h5.js` → **PASS** (`dist/h5/ 14317 KB`)
- **Console / Page Errors**：**0**（`loadMs: 1771ms`）
- **渲染指标（`docs/V15/screenshots/art007/metrics.json`）**：
  - 10 兵：Draw Calls `102`，Triangles `183,550`，JS Heap `17.6 MB`
  - 30 兵：Draw Calls `119`，Triangles `380,202`，JS Heap `19.2 MB`
  - 100 兵：Draw Calls `117`，Triangles `1,049,008`，JS Heap `18.6 MB`（较 ART-006 再降 7 Draw Calls）
  - 200 兵（自动 LOD）：Draw Calls `119`，Triangles `627,906`，JS Heap `18.5 MB`（较 ART-006 再降 15 Draw Calls）
- **实机/微信说明**：本轮实测数据采集自桌面 Chromium SwiftShader 软件渲染环境，非真实手机 GPU FPS；微信小游戏真机性能与 30 局/60 分钟人工长跑待真机环境补测。
