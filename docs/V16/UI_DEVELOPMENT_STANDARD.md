# V16 · UI 开发标准 (UI_DEVELOPMENT_STANDARD)

延续 V13-V15 标准, 本轮确认:
- 图标: 宫格/顶栏 SVG(currentColor, 1.8-1.9 线宽) — Emoji 仅保留功能状态
  切换(音效开关 🔊/🔇)与低频语义位;
- 横屏: 触屏+横屏+矮屏三条件 JS 控制器; 提示浮层不阻断(旋转后自动消失);
  **实现坑**: 全局 .hidden 有 !important — 自定义显隐类不得与 .hidden 混用;
  head 里操作 DOM 必须 DOMContentLoaded 延迟;
- 视口: 320×640 起步 6 档全过 0 横向溢出(v15-audit 自动化)。
