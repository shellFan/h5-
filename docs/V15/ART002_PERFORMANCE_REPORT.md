# 《膨胀小队》V15-ART-002 性能与测试报告 (PERFORMANCE & TEST REPORT)

## 1. 自动化测试与构建
- **单元测试 (`node tests/unit/run.js`)**：`通过 102 / 失败 0 / 共 102`
- **GLB 结构验收 (`node tests/unit/soldier-asset.js`)**：`PASS`（hero 13,042 tris / lod 3,908 tris）
- **H5 生产构建 (`node tools/build-h5.js`)**：`PASS` → `dist/h5/ (12176 KB)`
- **运行期控制台异常**：`0`

## 2. 性能遥测对比（Headless Chromium / SwiftShader，390×844 @ DPR 2）
> 说明：无头 SwiftShader 为 CPU 软件光栅化环境，绝对 FPS 仅用于同机回归对比，真机手机 GPU 帧率（目标中端机 30+ FPS）仍标记为「待真机实测验证」。

| 士兵人数 | Draw Calls (ART001 → ART002) | 三角形数 (ART002) | 纹理数 | JS 堆内存 |
|---:|---:|---:|---:|---:|
| 1 | 111 → 121 | 96,788 | 45 | 17.9 MB |
| 10 | 104 → 122 | 204,994 | 46 | 17.5 MB |
| 30 | 107 → 117 | 467,008 | 46 | 17.9 MB |
| 50 | 123 → 118 | 729,076 | 46 | 17.0 MB |
| 100 | 118 → 135 | 1,393,896 | 51 | 17.7 MB |
| 200 (LOD) | 121 → 133 | 867,522 | 55 | 18.0 MB |

## 3. 实机截图目录
- 改造前：`docs/V15/screenshots/before/`
- ART-001：`docs/V15/screenshots/after/`
- ART-002：`docs/V15/screenshots/art002/`（含首页 `01-home.png`、综合战斗 `00-v15-hero-battle.png`、Boss 弹幕战 `08-boss-battle.png`、单兵/10/36/100 人、360×800 与 430×932 适配截图）
