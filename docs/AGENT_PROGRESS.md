# AGENT_PROGRESS — V4 通宵自主开发进度

> 新会话恢复: 先读本文件 + `git log --oneline -5`, 再继续"下一步"。

## 当前状态

- **阶段**: Phase 0✓ Phase 1✓ Phase 2✓ → Phase 3(美术重制)开始
- **最近提交**: 9e3800a(V3.7保全) → 本次提交: V4移动+节奏
- **测试状态**: 单测 50/50 ✓ | E2E 28/28 ✓
- **环境要点**: Node 在 `D:\hclaw\node`(需 export PATH); 服务器 8080 已常驻; Playwright 用系统 Edge

## ⚠️ 并发会话处理记录 (2026-11-12 01:58)

- Phase 0 期间检测到并发 V3.7 会话修改同一批文件 → 让路监控至静默, 以 9e3800a 保全提交其成果。
- 该会话后续仍间歇活跃: 02:13 发现本会话新建的 movement.js/pacing.js 并主动接线到 index.html(协作行为)。
- 本会话所有编辑前都重新读取目标文件, 每阶段尽快提交防冲突。

## 已完成任务

- [x] Phase 0: 仓库审计 + 基线截图(docs/screenshots/v4-before/) + docs/V4_BASELINE_AUDIT.md + 保全提交 9e3800a
- [x] Phase 1: 移动重构 — js/movement.js(纯数学: 拖动灵敏度0.65映射/中心边界/跟随λ/门窗口) + game.js输入(锚点连续拖动替代30px跳道, 键盘keyStep1.2) + squad.js(平滑跟随0.15s/自适应阵型V4宽度约束半宽≤2.3/getHalfWidth) + gates.js(磁吸0.55不代选+触发窗口随队伍宽度扩展封顶0.7保证左右门不重叠)
- [x] Phase 2: 节奏重构 — js/pacing.js(GamePacingController: 波次激活/批次0.8-1.5s×1-4只/maxAlive 10+关/纵深9散布/Boss预警1.6s+屏幕外出身/波清回调) + enemies.js(spawnEnemy工厂, 移除整波同帧pendingSpawns) + game.js接线 + Boss预警UI(#boss-warning+bwShake/bwPulse动画+bossWarn音效) + 僵尸速度重校准(快速2.55=1.5×普通1.7)
- [x] 测试: 单测新增03-movement(13例)+04-pacing(13例)=50全绿; E2E新增3例V4移动专项(拖动映射/平滑跟随/500人边界)=28全绿; 修正3个旧语义断言(键盘/收敛/Boss传送点)

## 下一步

Phase 3 美术重制: ①士兵头盔/身体比例修正(球阵问题根治: 减小头盔球径占比+背面轮廓层次) ②相机随人数动态拉远 ③门立体化(门柱基座/地面光斑) ④道路街景层次 ⑤僵尸细节强化; 每步截图对照验收。

## 未完成任务(按序)

- [ ] Phase 1: 移动重构(连续目标位置+damp跟随+门轻吸附+边界钳制) → js/game.js, js/squad.js, js/config.js
- [ ] Phase 2: GamePacingController(js/pacing.js) 分批刷怪+maxAlive+波次休息+Boss预警 → enemies.js/game.js/config.js
- [ ] Phase 3: 美术重制: 士兵比例修正+阵型自适应+相机动态拉远; 僵尸轮廓强化; 门立体化; 道路街景层次; (js/models.js, world.js, squad.js)
- [ ] Phase 4: UI 精修(style.css + index.html)
- [ ] Phase 5: 摄像机构图(并入 Phase 3 相机动态)
- [ ] Phase 6: 爽感(人数爆发/慢动作/弹幕增强/连杀)
- [ ] Phase 7: 功能回归(先跑 V3.5 测试套件再迭代)
- [ ] Phase 8: 测试扩展(移动帧率无关性/节奏参数单测; 视觉4分辨率; 性能实测)
- [ ] Phase 9: 抖音/广告回归(只测不改)
- [ ] Phase 11: 分阶段 Git 提交推送 origin/master
- [ ] Phase 13: 交付报告 V4_*.md ×8

## 已知问题(见 V4_BASELINE_AUDIT.md 第二节)

## 下一步

Phase 1: 实现 MOVE 配置(CONFIG.MOVE: touchSensitivity 0.65 / followSmoothTime 0.15 / laneTransitionTime 0.45 / 边界±2.6), 输入改连续 targetX, squad 阻尼跟随, 门轻吸附; 写移动单测; 真机模拟拖动 E2E; 提交。
