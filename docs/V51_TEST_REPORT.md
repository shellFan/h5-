# V5.1 测试报告（V51_TEST_REPORT.md）

## 自动化测试矩阵（2026-11-15 实测）

| 套件 | 命令 | 结果 |
|---|---|---|
| 单元测试（含 4 个新套件） | `npm run test:unit` | **99/99 PASS** |
| E2E 全流程（更新至五关结构） | `npm run test:e2e` | **29/29 PASS** |
| **五关完整进程 E2E（新）** | `npm run test:v51` | **35/35 PASS** |
| 视觉布局断言 | `npm run test:visual` | **32/32 PASS** |
| 士兵专项 E2E | `npm run test:soldier` | **11/11 PASS** |
| V4.1 回归 | `npm run test:v41` | **7/7 PASS** |
| H5 生产包冒烟 | `npm run build:h5 && npm run test:h5-build` | PASS |
| 抖音构建 | `npm run build:douyin` | 主包 0.99MB / 整包 4.92MB |
| 数值模拟 | `npm run sim` | 25 局+100 局扫描（docs/V51_SIM_RESULTS.json） |
| 战斗性能 | `npm run perf` | 最重场景 1.35ms/帧（docs/V50_PERFORMANCE.json） |

## 新增测试覆盖明细

### 方向测试（05-directions.test.js，9 断言）
CONFIG.DIRS 符号约定、BattleKinematics 四向运动学、防守不后退（standoff 配置/矩阵递增/生成纵深>standoff）。

### 金币测试（06-economy.test.js，13 断言）
建档/旧档迁移（pz_progress 原始层读取）/刷新不丢币/spend 原子性/claimReward 幂等/胜利结算/重复通关不加奖励/失败封顶15/双倍翻倍幂等/后勤加成/recordRun 解锁不回退。

### 升级测试（07-upgrades.test.js，9 断言）
配置完整性（价格阶梯递增/等级上限=任务书）/购买扣款持久化/余额不足不动账/满级 MAX/重复点击不多次扣款/属性应用公式/全局射速上限。

### 状态门测试（08-gates51.test.js，13 断言）
三档池结构/×2 仅稀有池/稀有度概率 75/20/5 实测（20000 次采样）/×2 连续抑制/forceNoMul/人数状态感知/满级抑制/排内 label 互异/教学首排全人数门/×2 静态占比≤10%/新 op 应用公式。

### 五关 E2E（tests/e2e/v51.js，35 断言）
清档→L1 真实点击开始→快进通关→金币入账（60+击杀）→重复结算保护→商店真实购买枪械→属性生效→L2 通关→L3 失败(保留击杀币)→重新挑战→L3 通关→L4 通关→L5 首试→失败则升级重试→Boss 出场实证→胜利结算 200→双倍广告翻倍→刷新页面金币/升级/解锁全保留。

## 回归保护
旧套件零删除；04-pacing 中 2 处旧结构断言按 V5.1 语义更新（maxAlive 矩阵/防线锚点），03-movement 语义不变；e2e/run.js 4 处旧十关坐标/结构耦合更新为五关动态定位。
