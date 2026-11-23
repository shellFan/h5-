# V16 · 视觉 QA 标准 (VISUAL_QA_STANDARD)

- 每轮必跑: tools/v15-audit.js(27 步) + tools/v14-capture.js(24 图) +
  wechat-emulator(20 项);
- 新增视觉特性必须: 单特性实机截图 + 该路径回归(本轮职业辨识四型截图 +
  combat-feedback 门回归捕获 shard 崩溃即为范例);
- 命名冲突类缺陷由套件捕获 — 禁止只靠目测;
- 溢出检测: scrollWidth-clientWidth 阈值 2px, document 级+容器级双检。
