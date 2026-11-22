# V16 · GameDev 工作流 (GAMEDEV_WORKFLOW)

延续 V14/V15 标准(ASSET_PRODUCTION_STANDARD.md 等), 本轮新增两条实战经验:

## 职业/阵营视觉辨识管线(士兵侧)
1. 染色: 实例色乘法(≤±25% 偏移)对齐设计系统身份色(CLASS_DEFS.color);
2. 附件: 程序化几何挂 Body 局部空间(肩甲/背包/帽), InstancedMesh 按职业可见;
3. LOD: 大编制(>100)隐藏附件保 draw call; 死亡幽灵同步染色;
4. 验收: 每职业实机截图对照 CLASS_DEFS 色。

## 命名冲突防线(本轮真实事故)
- Effects 类中实例数组 `shards` 与原型方法 `shards()` 同名 → 方法被属性遮蔽,
  运行时 "not a function" → 全体怪物死亡路径崩溃。
- 规则: **实例状态属性一律加复数/状态后缀(如 shardList), 方法用动词开头
  (spawnShards)**; 新增方法后必须跑 combat-feedback 门(死亡路径覆盖)。

## 音效补齐流程
音色定义(audio-adapter SOUNDS 表) + minGap 限流登记 + 调用点接线 +
`node -e "new Function(...)"` 语法门 — 四步缺一不可。
