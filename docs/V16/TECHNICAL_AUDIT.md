# V16 · 技术审计 (TECHNICAL_AUDIT)

本轮新增代码的技术核对:
- soldier-renderer.js: 实例染色(color upload 段含 updateRange 前缀) + 附件库
  (hero 银行限定) — 内存: 每银行 capacity=600 槽 InstancedMesh ×3 职业 = 常驻
  3 组缓冲(几何共享), 可接受; 附件几何静态缓存单例 ✓;
- effects.js: shard 池 48(独立于粒子池) + 实例色上传前缀 ✓; **命名冲突教训**:
  实例属性与原型方法不可同名(本轮实际发生并被回归捕获, 见 MASTER_REPORT);
- audio-adapter.js: boom 音色 + minGap 限流登记 ✓;
- orientation 控制器: resize/orientationchange 双监听 + DOMContentLoaded 延迟 ✓;
- 兼容红线复查: 新代码无 minidom 不安全构造(无 :not/:empty/真实节点混入) ✓。
