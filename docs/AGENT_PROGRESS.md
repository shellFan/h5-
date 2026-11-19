# 当前开发进度

> **V10.1 专项优化完成（2026-11-19, 专项指令）** —— 移动端十分辨率适配(19问题→0) + CDP剖析驱动性能优化(HUD脏检查/飘字池化/阴影分档, battle300 +17%FPS/特效+15%) + 统一设计令牌与触控反馈。报告: docs/V10_1_MOBILE_PERFORMANCE_UI_REPORT.md。工具: tools/v101-matrix-audit.js / v101-perf-probe.js / v101-soak.js + tests/e2e/v101-mobile.js(29断言)。回归全绿。

> **V10.1 遗留清零（2026-11-19, 用户指令）** —— 武器特殊属性接线实测(pellets/burn/dualLane) + v51 完全密闭化(种子+rAF停用, 5/5确定性全绿) + 死代码清除(models.js等11处, -1082行) + 空投recruitBonus接线。回归: unit92/e2e29/v51×3全39/v80 37/vnext 183/visual 32/soldier 11/model/v41 7+冒烟/双构建 全绿。

> **V10 全量QA完成（2026-11-19, 无人值守定时任务）** —— 静态审计49项发现 + 真实浏览器深度试玩 + P1×8/P2×7/P3×12修复 + 全量回归 + 30分钟长跑。报告: docs/QA/V10_FULL_QA_REPORT.md

> **VNext 追加交付完成（2026-11-19）** —— Boss多轮实战验证 + 四职业 + 装备掉落词条背包 + 真实加载进度条 + 本地排行榜；V8.0/V8.0.1 历史见下。

## VNext 检查点
- 文档: docs/VNEXT_REPORT.md (含Boss审计/四职业/装备/进度条/排行榜全记录)
- 新增: js/classes.js(四职业) / js/leaderboard.js(本地排行) / growth.js扩展(EquipmentLoot词条背包) / index.html启动进度条(26 GLB文件级真实进度)
- 修复: 技能门满级空池转人数门 / LEVELS门配置引用污染(重玩不随机) / drBonus从未消费(killSoldiers减免)
- 测试: 全旧套件绿 + VNext四套新E2E 183/183 (Boss124/职业23/装备20/排行+加载16) + 马拉松33/33 + 平衡L6-L10 15/15
- 截图: docs/screenshots/vnext/ (启动进度/首页职业卡/排行页/训练背包)
- 遗留: 职业专属外观/套装效果/平台排行真机 (见 VNEXT_REPORT §七)

## V8.0.1 检查点（2026-11-19, 历史保留）
- 文档: docs/V80_FINAL_REPORT.md / V80_SYSTEMS.md / V80_BALANCE.md / V80_TEST_REPORT.md / V80_RELEASE_CHECKLIST.md
- 战役: 10关(L7巢穴/L8废土/L9双Boss/L10终极), 每关首行门含人数门(防软锁)
- 修复: BOSS_NAMES未闭合吞关卡定义 / HP乘数L7+越界NaN / 武器dmgMul等属性未消费 / 双因子Boss血量恢复 / Boss火力优先 / _normalize白名单丢challengeBest·daily·soldier·equipment / L6乘数重标定
- 新增: skills组合10种+毒液DoT修复 / random-events.js 12事件 / 挑战模式(无尽+Boss快打) / ui-v60九页重写
- 测试: 94 unit + 29 e2e + 39 v51 + 37 v80(新) + 32 visual + 11 soldier + 7 v41 + h5/douyin build + 十关马拉松33/33
- 平衡: 自然预算 L6-L10 15/15胜(47-82s), 零养成对照L10 1/4(终局门槛); 工装 tools/v80-balance-sim.js(已修预算入账bug)
- 已知边界: 武器pellets由齐射曲线表达 / army_limit未接SQUAD_MAX_COUNT / L9血条固定首Boss名 / 真机手测待做

## V5.1 检查点（2026-11-15, 历史保留）
- 最新 SHA: 8add142（feat 防守模式 / feat 经济+商店+门池 / test 五关E2E / perf+docs 四批提交）
- 玩法: 阵地防守（standoff=9）、MAX_ALIVE [25,30,35,45,60]、五关 44/66/90/108/127 怪、L5 Boss 三阶段
- 经济: GameProfile(pz_squad_profile_v51)、首通 60/80/110/140/200 幂等、击杀币封顶、双倍/每日补给广告
- 商店: upgrades.js 五项升级集中配置；门池 75/20/5 ×2 抑制；新op 爆炸弹/连锁/全屏爆炸/军备
- 测试: 99 单测 + 29 e2e + 35 五关E2E + 32 visual + 11 soldier + 7 v41 + h5-build + douyin 全绿
- 模拟: docs/V51_SIM_RESULTS.json（L1 100%/L2 100%/L3 60%/L4 80%/L5 40%）
- 截图: docs/screenshots/v51/ 8 张
- 已知边界: L2/L4 胜率略超目标区间（安全侧）；模拟工装非密闭性（隔离运行权威）；生产H5无广告（诚实降级）
- 下一步候选: L2/L4 难度收紧实验、微信 build-wechat 复刻、真机触控复核

## 当前阶段

V4.1士兵背部/枪械精修；V4.2六种敌人、六种Boss GLB/LOD已接入实际实例渲染。状态门、15批次城市环境、响应式HUD已接通。Boss阶段、护盾、召唤、双精英、酸液投射物和死亡表现已实现。粒子、金色弹道实例化，枪口/冲击波复用池。

基线提交bca3e62；本次阶段提交SHA请查看`git log -3 --oneline`。当前提交属于开发快照，不等同于最终发布或美术验收。

## 已验证

- 基线50单元+29旧E2E+11士兵专项+构建启动，修改前全部通过。
- 新增12套模型/24个GLB二进制校验通过；新粒子池与移动/节奏单测通过。
- 10项V42实际浏览器功能测试通过，含缓存、行内唯一门奖励、实例受击隔离、最终Boss三阶段/护盾/召唤、双精英全部死亡、酸液朝向、装饰不影响移动、批处理和失败重试。
- 真实十关回放全部通关，最后一次时长约196–235秒；初轮超时记录保留在v42-simulation-initial/second.json。
- 390px中画质五负载完整战斗初测已记录，但不是最终四分辨率×三画质矩阵。

## 当前截图与评分

`docs/screenshots/v42/390-start.png`、`390-enemies.png`、`390-gates.png`、`boss-overlord.png`已由根代理读取图像审看。新指令要求的同时包含军团、混合怪物、精英/Boss、状态门、城市和弹道的`final-combat-390x844.png`正在准备。

视觉评分：尚未对最终主截图评分，不编造85分通过结论；当前视觉验收未通过。

## 必须继续的工作

1. 生成并实际读取390×844、430×932完整混合战斗主截图；按用户100分表记录证据、分项和修复轮次。
2. 新指令强调不能靠大量删除怪物降难度：重新审查此前波次预算收缩，改用生成/距离/速度/结构调优并重新完成十关回放。
3. 完整运行原有和新增测试；旧测试的固定800ms生成等待应依2秒准备期更新测试夹具，不能删除测试。独立Boss测试需要隔离前序波次。
4. 完整60负载性能矩阵和内存趋势；清楚报告50ms补充压力怪物的机制和实际在场均值，不能冒充手机成绩。
5. 补齐用户最新指定的视觉审计/交付/最终报告和原要求七份文档。模型目录当前为assets/models/enemies；评估按新指令整理为zombies/bosses并同步加载路径、目录、验证。
6. 完成代码审查、剩余质量问题修复，再非强制推送origin/master并核对SHA。

## 实用命令

`node tools/v42-sim.js`：真实Game固定步长十关回放，无强制胜利/无敌/传送。

`node tests/e2e/v42.js`；`node tests/unit/v42-assets.js`；`node tests/unit/v42-effects.js`；`node tests/unit/v42-gameplay.js`。

Blender：`D:/tools/blender-v41/blender-4.2.15-windows-x64/blender.exe`。脚本tools/create-soldier.py、create-enemies.py、blender_art_common.py。

## 2026-11-14 全量提交检查点

按用户“代码都提交一下”保存全部当前代码、模型目录迁移、截图与测试记录。该检查点是开发快照，不代表最终视觉或发布验收。

本次重新执行：基础单元测试50/50通过；V42十二套/24个GLB二进制资源校验通过；H5构建通过；git diff --check无空白错误。

已知失败：node tests/unit/v42-stream.js 报 Preparation/backpressure must not bank catch-up credit for an instant stream。准备期/人口上限等待期间emitTimer累计负值，需修复后重跑节奏测试与十关回放。完整性能矩阵与最终视觉验收仍待完成。本次不推送，避免将未通过测试的开发快照标记为发布结果。

此前进度条目属于历史记录：原始波次人数已恢复，并增加tests/fixtures/v42-original-waves.json；敌人资源已迁移至assets/models/zombies和assets/models/bosses，catalog保留在assets/models/enemies；最终主战斗截图已生成，但最终评分仍待图像审查确认。

---

# ===== V5.0 交付检查点（2026-11-15，GLM-5.3 流水线） =====

## 当前阶段
V5.0 全量交付完成，最终提交已推送 origin/master。

## 最新 Git SHA
见 `git log -4 --oneline`（batch1: 440076f / batch2: b486045 / batch3: 文档+stream修复+推送）。

## V5.0 已完成（勿重复）
1. 审计 docs/V50_CODE_AUDIT.md；2. 移动语义修复（越大越快/1.0满屏）；3. 广告四件套（30s超时/tt接线/__GAME_SETTINGS配置链/生产Mock隔离）；4. 抖音构建重写（单文件bundle+assets分包 主包0.98MB+MiniGLTFLoader+符号自检）；5. 抖音音频（tt.createInnerAudioContext+WAV合成）；6. UI两轮迭代（首页V5.0品牌/最高纪录/音效开关/待机军团、门文字前置+no-fog、云朵、失败页返回首页、音效全接线）；7. 平衡150局+3项数值修复（首排门全人数门/Boss击杀3→2/血量8→7s，docs/V50_SIM_RESULTS.json）；8. 性能5满战斗场景（docs/V50_PERFORMANCE.json，最重1.70ms/帧）；9. **修复V4.2遗留失败测试 v42-stream.js（emitTimer负信用结转→max(0,·)+interval）**；10. H5构建+冒烟PASS；11. 12份交付文档+最终报告。

## 测试快照（全绿）
unit 51/51 · e2e 29/29 · visual 32/32 · soldier 11/11 · v41 7/7 · v42-stream/v42-gameplay/v42-effects/soldier-runtime/v42-assets PASS · h5-build PASS

## 当前已知问题（非阻塞）
- 视觉自评 84/100（85 边缘，机器评审上限；建议人工复核 docs/screenshots/v50/）
- 模拟工装跨局非密闭性（粒子池→RNG 消耗计数泄漏），L3 balanced 临界翻转；隔离运行权威；非游戏缺陷
- 320 小屏进度节点略密（P2）

## 未完成任务（外部依赖）
抖音真机预览+AppID+广告位 / 微信工程化 / H5 公网部署 / 真机复核 —— 详见 docs/V50_FINAL_REPORT.md §12。

## V5.0 常用命令
`npm run capture`（21张截图）· `npm run sim`（150局）· `npm run perf` · `npm run test:h5-build` · `npm run build:douyin`

## 历史记录（V4.1/V4.2，保留）
