# V16 · 移动端优化标准 (MOBILE_OPTIMIZATION_STANDARD)

- 视口矩阵: 320×640 起步 6 档(v15-audit 自动化检测, 阈值 2px);
- 触控: ≥44×44 CSS 像素(ui-v118 门);
- 横屏: 引导而非崩溃(本轮新增浮层); 竖屏为主体验;
- LOD 纪律: 大编制自动降(附件隐藏/阴影关闭/LOD 模型);
- 减少动态: prefers-reduced-motion + 游戏内开关双通道(横屏提示动画亦遵守);
- 安全区: env(safe-area-inset) 既有接线保持。
