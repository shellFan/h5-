# V16 · 缺陷修复报告 (BUG_FIX_REPORT)

| ID | 缺陷 | 级别 | 根因 | 修复 | 验证 |
|---|---|---|---|---|---|
| V16-1 | 每次怪物死亡抛 "effects.shards is not a function" → 小队瞬间覆灭/L6-L10 门测试失败 | **P0** | Effects 实例数组 shards 遮蔽原型方法 shards() | 方法更名 spawnShards | combat-feedback 11/11 · v51 39/39 · vnext-boss 124/124 全绿 |
| V16-2 | 横屏无引导(布局可用但体验差) | P3 | 未实现 | 触屏+横屏+矮屏 JS 控制器+浮层 | landscape2 探针: 横屏 show / 竖屏 hidden |
| V16-3 | 自爆/全屏爆炸无音效; 补员音色 grow 定义后零调用 | P3 | 接线缺失 | boom 音色新增+接线; grow 接线 | 语法门+套件全绿 |
| 备注 | 审计工具侧(evaluate 单参/设置页 back ID)非游戏缺陷 | — | — | 工具修正 | 27/27 重采 |
