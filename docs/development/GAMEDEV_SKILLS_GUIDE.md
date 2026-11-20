# GameDev Skills 集成指南 (GAMEDEV_SKILLS_GUIDE)

> Awesome GameDev Agent Skills: https://github.com/gamedev-skills/awesome-gamedev-agent-skills
> 定位: 本项目长期可复用的游戏研发标准库 — 每个 Agent 会话开工前按 router 分派加载对应技能。

## 1. 已安装技能 (.agents/skills/, 共 8 个)

| 技能 | 用途 | 本项目落地场景 |
|---|---|---|
| router | 引擎/任务分派器 | 会话入口: 检测 three.js 引擎 → 派发 3 个 threejs + 相关 discipline |
| game-ui-ux | HUD/菜单布局·安全区·事件驱动 | 结算/排行榜/HUD 改造的规范来源 |
| create-game-assets | 资产风格统一·清单·授权·QA | 新增资产流程(ASSET_MANIFEST/LICENSES) |
| game-feel | 打击感(震动/顿帧/缓动) | 命中反馈链/VFX 档位(VFX_DESIGN.md) |
| performance-optimization | 测量→瓶颈→修复→复测 | perf 实测纪律(VISUAL_ACCEPTANCE §4) |
| threejs-scene-setup | 场景/相机/渲染循环 | world.js 渲染器配置审计 |
| threejs-gltf-loading | GLB 装载/LOD/动画 | soldier-loader/enemy-models 装载管线 |
| threejs-materials-lighting | 材质/光照/阴影/IBL | preparePbr/灯光配方的依据 |

## 2. 安装与验证记录 (V12)

- 环境: Node v22.23.2 / npm 10.9.8。
- 官方 CLI `npx skills add gamedev-skills/awesome-gamedev-agent-skills` 在本环境因 github.com 直连 443 超时失败(SKILLS_GIT_CLONE_FAILED; api.github.com 可用)。
- 等效落地: codeload.github.com tarball 下载 → 按技能目录复制 8 个技能到 `.agents/skills/<name>/SKILL.md` — 与 CLI 产物结构一致。
- 验证: 8/8 SKILL.md 存在且非空(9.2KB-26KB); `npx skills list` 显示项目级 0(该 CLI 只识别其自有 lockfile 结构, 以目录存在性为准); 各 Agent 通过 `.agents/skills/` 约定路径发现技能。

## 3. 会话工作流 (推荐给后续 Agent)

```
1. 读 .agents/skills/router/SKILL.md → 确认引擎(three.js r149)与任务类别
2. 按任务加载: UI 任务→game-ui-ux / 特效→game-feel / 资产→create-game-assets / 卡顿→performance-optimization / 3D→threejs-*
3. 先查 docs/art/* 对应规范(技能=通用方法论, docs/art=本项目实例化)
4. 完成后按 docs/development/VISUAL_ACCEPTANCE.md 验收
```

## 4. 维护约定

- 技能内容只读(上游 Apache-2.0, 更新走 `npx skills update` 或重新同步 tarball)。
- 本项目实例化规范(docX/art/**)可自由修订 — 冲突时以 docs/art 为准并回写技能注记。
- 新技能加入: 复制进 `.agents/skills/<name>/` + 本表登记 + 确认 SKILL.md 完整。
