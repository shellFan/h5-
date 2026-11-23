# V14 · 视觉验收标准 (VISUAL_QA_STANDARD)

## 截图清单(每轮必拍, 全部实机)
01-home · 02-home-bottom · 03-battle-hud · 04-battle-mass · 05-boss-battle ·
06-gates · 07-skill-gates · 08-armory-3d · 08b-armory-list · 09-tech · 10-rank ·
11-map · 12-train · 13-codex · 14-challenge · 15-ach · 16-daily · 17-settings ·
18-victory · 19-defeat · 20-mobile-320x640-home · 21-mobile-320x640-battle ·
22-wechat-home/battle。
工具: node tools/v14-capture.js(自动采集 → docs/V14/screenshots/)。

## 逐项判定(截图必须逐张人工过目)
- 风格统一(与 Navy/Gold + 卡通3D 基调一致) · 小尺寸可辨识 · 无占位/错误贴图/
  紫色缺材质/透明异常 · 触控目标 ≥44px · HUD 不遮三跑道 · 文字清晰 ·
  弹窗可关 · 手机不溢出(320×640 起步)。

## 回归红线
- 全部既有测试套件必须绿(unit/e2e/combat-feedback/ui-v118/v51/v80/vnext/mobile/
  wechat/soak), 任何失败必须分析根因, 禁止改断言掩盖;
- 战斗/门/经济/刷新逻辑文件在视觉轮中的任何改动必须: (a)可复现实证缺陷,
  (b)定性为缺陷修复/契约恢复, (c)在 QA_REPORT 双登记。
