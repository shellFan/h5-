# Awesome GameDev Agent Skills · 项目适用性评估

核查日期：2026-11-21。本轮只评估和整理参考，不执行安装、不引入运行时依赖、不修改代码。

后续状态：用户确认视觉稿后已另行授权 UI 实装；交付前同步的远端 V12 提交已包含 `.agents/skills/` 技能集合。本次 UI 工作保留该集合，没有重复安装。下面是初次评估时的选择依据与命令记录。

## 结论

**值得采用其中的视觉设计方法，但不是本次写设计书的前置依赖。后续制作资产时优先按需安装三个技能，不建议把全部引擎技能整包装入项目。**

这个仓库提供的是给 AI 使用的技能说明与部分辅助工具，不是怪物/枪械/地图素材包，也不会自动让现有游戏拥有新模型、新特效或联网排行榜。

## 已核对来源

- [GitHub 项目与 README](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)
- [在线技能目录](https://gamedev-skills.github.io/awesome-gamedev-agent-skills/)
- [安装说明](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/docs/INSTALLATION.md)
- 下表“优先参考”的三个技能正文，以及 create-game-assets 的 art-direction 参考文件。
- Three.js 材质/光照技能正文，用于核对示例版本和兼容性；未将其代码应用到本项目。

仓库 README 在核查时列出 79 个技能及一个 router，包含多个引擎。该数量是上游当时的说明，不代表项目需要加载或安装全部内容。

## 1. 优先参考的三个技能

| 技能 | 本项目的具体用途 | 本轮采纳的方法 |
|---|---|---|
| [create-game-assets](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/create-game-assets/SKILL.md) | 怪物、地图、武器、图标、贴图的一致性与交付规范 | 先检查已有资产，锁定视觉目标，按家族制作，记录来源/尺寸/锚点，真实尺寸和游戏背景验收 |
| [game-ui-ux](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/game-ui-ux/SKILL.md) | 首页、战斗 HUD、军械库和排行榜的布局/状态 | 手机参考尺寸、安全区、文字对比、按钮热区、长文案及空状态 |
| [game-feel](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/disciplines/game-feel/SKILL.md) | 攻击、命中、死亡、补兵和按钮的视觉反馈 | 对事件区分表现强弱，常规命中克制，重要收益可读，限制装饰遮挡 |

采用方法不等于接受技能中所有程序改动建议。本轮不增加事件系统、不改相机、不改击退/时间缩放、不实现新菜单；这些超出用户指定的纯设计职责。

## 2. 接入阶段才考虑的内容

| 技能/主题 | 用途 | 本轮处理 |
|---|---|---|
| threejs-gltf-loading | GLB 加载、材质/动画导入 | 仅目录级筛选，交给程序接入方后续核对版本 |
| [threejs-materials-lighting](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/web-engines/threejs-materials-lighting/SKILL.md) | 材质、灯光、阴影和色彩校验 | 已读正文；保留原则，不使用 r187 参数/API 直接替换 r149 |
| performance-optimization | 导入后检查性能成本 | 仅目录级筛选；不能用设计文档代替实际帧耗时测试 |
| game-docs | 后续维护游戏设计说明 | 仅目录级筛选；本轮沿用项目已有 docs 结构 |
| router | 安装较多技能后的任务分流 | 可选；即使安装也必须保留本轮“不改程序”的职责限制 |

Godot、Unity、Unreal、Roblox、Phaser 等引擎专用技能与当前项目无直接关系。本轮也不需要 FPS 射击参数、经济系统或关卡节奏技能来重写现有玩法。

## 3. 兼容性与许可

本地 `js/vendor/three.min.js` 的 `REVISION` 实际值为 **149**。上游 Three.js 技能以 **r187** 为示例基线，并说明 r155 之后照明规则发生变化。本项目还保留旧版文档中记录的定制色彩处理。因此：

- 可以借鉴“主体与背景分离、材质统一、限制阴影成本”等设计原则。
- 不能直接复制新版 `colorSpace`、光强、环境贴图或后处理示例；本轮不升级 Three.js。
- 概念图不等于可用 GLB；新模型需要匹配现有五部件、材质、比例、LOD 和移动端预算。
- 上游仓库标注 Apache-2.0。若未来复制技能、脚本或模板，要核对并保留相应 LICENSE/NOTICE；该许可不自动覆盖另外下载的模型、字体或素材。

## 4. 安装建议

当前不必安装即可完成设计方案。若后续开始稳定、长期的美术资产制作，可先查看列表，再只安装三个视觉相关技能。下列命令整理自上游安装说明，**本轮没有执行**：

```powershell
# 仅预览列表
npx skills add gamedev-skills/awesome-gamedev-agent-skills --list

# 按需安装视觉相关子集，不加全局 -g
npx skills add gamedev-skills/awesome-gamedev-agent-skills --skill create-game-assets --skill game-ui-ux --skill game-feel
```

上游安装器要求 Node.js 22.20 或更新版本。正式使用前检查 Node/npm/npx 是否可用；不为写本次设计书额外修改全局环境。安装完成后核对实际技能目录、资源文件及可发现状态，再按需考虑 router。

本项目当前已有相关设计/图像工具，新增这个技能库的主要价值是让美术生产的约束、批次和验收更完整，而不是替代具体的设计判断、建模或程序接入。

## 5. 后续工作如何使用

1. 以 [视觉改版设计书](VISUAL_REDESIGN.md) 为项目 brief，先出一张完整战斗关键视觉稿。
2. 建立资产清单，以同一基准角色/场景/图标派生家族，保持比例、光线和材质一致。
3. 2D 视觉稿交付源文件和透明素材；3D 概念经 DCC 整理后才交付模型。
4. 设计师只交付视觉资产与标注，接入方负责运行代码、加载/挂点、渲染和真实设备验证。
5. 验收时回看原尺寸游戏截图，逐项检查可读性、风格一致性和许可记录。未接入的素材不标记为“游戏内完成”。
