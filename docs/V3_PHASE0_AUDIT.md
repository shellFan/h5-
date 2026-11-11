# 《膨胀小队》Phase 0 仓库审计报告

日期: 2026-11-11 | 基线提交: 1a4fcfe (V2.2)

## 1. 项目结构

```
index.html          # 入口(单页), Three.js 0.149 CDN 加载
style.css           # V2.1 UI样式
js/
  config.js         # CONFIG + LEVELS(仅1关, totalZ=-150)
  utils.js          # damp/clamp/randRange/mergeGeometries/colorize/createTextTexture
  models.js         # 士兵合并几何体/僵尸Group(6型)/状态门(玻璃纹理+Sprite文字)
  world.js          # 场景/相机/灯光/道路纹理/环境装饰/城市天际线/云
  effects.js        # 粒子池/浮动文字/冲击波/枪口闪光
  squad.js          # InstancedMesh(500上限)/阵型/穿门buff
  gates.js          # 门加载/穿门检测/淡出
  enemies.js        # Enemy类/EnemyManager/吐痰弹/分裂/Boss
  combat.js         # 自动射击/子弹池(Sprite)/碰撞
  game.js           # 主循环/输入/HUD绑定/胜负
assets/art-v1/      # SVG素材(soldier/zombie avatar, bullet-glow, gate-panel) — 已被引用
tools/server.js     # 零依赖静态服务器 (node tools/server.js, 端口8080)
```

- 无 package.json、无构建、无测试框架 → 本阶段补齐。
- 运行方式: `node tools/server.js` → http://localhost:8080
- Three.js 通过 CDN(jsdelivr) 同步脚本加载, 有失败兜底提示。

## 2. 运行验证 (390×844, In-app Browser)

- 游戏启动无 JS 错误 (error-display 为空), WebGL 正常, canvas 390×844。
- 待机/开局/12人/100人/Boss战/失败结算 全流程可走通。
- 基线截图: `tests/screenshots/v2.2-baseline/01~06*.png`

## 3. 发现的问题清单 (对照 V3.0 验收)

| # | 级别 | 问题 | 位置 |
|---|------|------|------|
| A1 | P0 | 道路大面积浅白(#B8B4C8过亮), 不是灰紫沥青; 车道虚线过粗过亮 | world.js 道路纹理 |
| A2 | P0 | 100人阵型挤成一团穿模, 无军团感 | squad.js FORMATION_SPACING 0.52/0.46 过密 |
| A3 | P0 | 草地饱和纯绿 + 大色块, 廉价感 | world.js groundMat |
| A4 | P0 | Boss血条(top:108px)与左侧属性面板(top:70px起)重叠 | style.css |
| A5 | P1 | 僵尸与小队近战穿模混战, 无分离力 | enemies.js 近战逻辑 |
| A6 | P1 | Boss模型灰球堆, 轮廓不清 | models.js boss |
| A7 | P1 | 门玻璃偏淡, 内部符号语义不清(×/+ 图标) | models.js 玻璃纹理 |
| A8 | P1 | 雾太白(0xB8D8F0,30~80), 远景发灰 | world.js |
| A9 | P1 | 云朵过低(8~13), 出现在路面视野中 | world.js 云 |
| A10 | P2 | 仅有1关(LEVELS数组1项), 需求要求10关 | config.js |
| A11 | P2 | 无存档(localStorage), 刷新丢进度 | game.js |
| A12 | P2 | 复活无广告接口(直接复活), 无次数限制 | game.js _revive |
| A13 | P2 | 无音频系统 | 全局 |
| A14 | P2 | 无镜头震动/Boss阶段变化 | game.js/effects.js |

## 4. 环境准备记录

- Node.js 未安装 → 已安装便携版 v22.14.0 至 `C:\Users\fan\devtools\node`(不污染系统)。
- 端口8080存在旧会话遗留服务器(服务本项目, 可用)。
- 无 Python/Chocolatey; winget 安装超时已中止, 改用 ZIP 便携方案。

## 5. Phase 0 结论

代码基础可复用, 架构合理(InstancedMesh士兵/对象池子弹粒子)。V3.0 按"美术重制优先"路线推进:
Phase 1 修 A1/A2/A3/A6/A8/A9(场景美术) → Phase 2 修 A4/A7 + HUD/菜单/广告弹窗 → 视觉验收 → 后续玩法/广告/平台。
