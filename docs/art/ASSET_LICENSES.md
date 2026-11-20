# 资产授权记录 (ASSET_LICENSES)

> 原则: 每个随包发布的资产授权必须可追溯、与商业发布兼容; 授权信息随资产(而非文件名)记录。

## 1. 项目自有 (Project-original) — 100%

| 类别 | 内容 | 授权 |
|---|---|---|
| 3D 模型 | soldier.glb ×2、zombies ×12、bosses ×12 (含 LOD) | 项目自有(Blender 脚本生成), 无第三方组件 |
| 程序化纹理 | 道路/天空/曳光/枪焰/冲击星/尸液/爆闪/门玻璃/门文字 | 项目自有(运行时代码生成) |
| UI 素材 | assets/art-v1/ui/*.svg | 项目自有 |
| 代码 | js/**, tools/**, tests/** | 项目自有 |

## 2. 第三方组件

| 组件 | 版本 | 授权 | 用途 |
|---|---|---|---|
| three.js | r149 (`js/vendor/three.min.js`, 含 GLTFLoader) | MIT | 渲染引擎(本地固定版, 无 CDN) |
| playwright-core | ^1.65.0 (devDependencies) | Apache-2.0 | 仅测试工具链, 不随游戏包发布 |

## 3. 生成式 AI 声明

- 截至 V12: **全部随包资产均为脚本程序化生成或手工代码绘制, 无 AI 生成图像/模型**。
- 后续若引入 AI 生成资产, 必须逐件登记来源工具/prompts/人工修改历史, 并遵守对应平台披露要求。

## 4. 技能库引用 (不随包发布)

- `.agents/skills/`(GameDev Agent Skills, Apache-2.0) 为研发标准文档, 仅存在于仓库, 不进入 `dist/` 构建产物(见 tools/build-h5.js COPY_LIST 未包含)。

## 5. 发布前检查

- [ ] 新增资产已登记本文件与 ASSET_MANIFEST.md
- [ ] 构建产物(dist/)不含未授权素材与技能目录
- [ ] 授权信息未因打包/重命名丢失(不依赖文件名传递授权)
