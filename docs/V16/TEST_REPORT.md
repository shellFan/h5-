# V16 · 测试报告 (TEST_REPORT)

## 全量回归(V16.1 代码状态, 实测)
unit 102/102 · e2e 29/29 · combat-feedback 11/11 · ui-v118 7/7 · h5-build PASS ·
v51 39/39 · v80 37/37 · soldier 11/11 · v111 15 · v112 15 · v113 14 · v114 10 ·
vnext-boss 124 · vnext-class 23 · vnext-equip 20 · vnext-rank 16(含加载进度门,
V15 竞态修复后 4 连跑稳定) · mobile 29/29 · 微信模拟器 20/20 · soak 30min(logs)。

## 本轮捕获的缺陷
- shard 命名冲突(P0): combat-feedback 门 2 项失败当轮暴露 → 修复 → 全绿。
  (证明"新特性必须过死亡路径回归"流程有效)
