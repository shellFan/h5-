# V15 · 功能审计明细 (FUNCTIONAL_AUDIT)

> 数据源: docs/V15/logs/audit-result.json (tools/v15-audit.js 真实点击审计)

## 审计方法
按钮 → 事件 → 状态 → 最终结果 四步追踪; 页面操作全部使用 Playwright 真实点击
(玩家路径), 禁止 evaluate 直调内部函数替代操作。

## 试玩步骤结果: **27/27 通过, 0 缺陷, 0 页面错误**

| # | 步骤 | 结果 | 关键证据 |
|---|---|---|---|
| 1 | 资源加载: 关键模型就绪 | ✅ | EnemyModelLoader=loaded(等待就绪后评级) |
| 2 | 首页: 开始按钮存在 | ✅ | btn-start |
| 3 | 首页: 10 个功能入口齐全 | ✅ | map/train/armory/tech/codex/challenge/rank/ach/daily/set |
| 4-13 | 逐页开合(开→验→关→验关闭) | ✅×10 | 每页 ~600ms 开合; 关闭态全部 hidden ✓ |
| 14 | 军械库: 8 行 + 3D 展示 + 操作钮 | ✅ | rows=8, hero3d 挂载, 动作按钮存在 |
| 15 | 军械库: 切换武器真实生效 | ✅ | 散弹枪行切换 → WeaponSystem.current=shotgun |
| 16 | 设置: 开关齐全 | ✅ | 音效/画质/震动 + 存档信息 |
| 17 | 排行榜: 真实本机数据/来源标识 | ✅ | "仅记录此设备上的真实对局" |
| 18 | 战斗: 点击开始进入 playing | ✅ | 真实点击 btn-start |
| 19 | 战斗: HUD 人数更新 | ✅ | squad-count-num 非空 |
| 20 | 状态门: 可选窗口出现 | ✅ | nextRowZ + encounterOutstanding=0 窗口 |
| 21 | 战斗: 自然游玩持续 | ✅ | state=playing 持续(60s 观察窗) |
| 22 | 结算: 胜利界面+下一关按钮 | ✅ | win-screen + btn-next-level |
| 23 | 结算: 下一关真实进入 | ✅ | playing + level 2 |
| 24 | 结算: 失败界面可达 | ✅ | 真实击溃小队 → lose-screen |
| 25 | 失败: 重开流程 | ✅ | restart 后回到对局 |
| 26 | 存档: 刷新后金币/武器/解锁保留 | ✅ | coins 持平 + weapon=shotgun + unlocked=2 |
| 27 | UI: 六视口无横向溢出 | ✅ | 320/360/375/390/414/430 × 11 页面检测 |

## 页面开合明细(每页耗时)
map 636ms · train 591ms · armory 659ms · tech 612ms · codex 582ms · challenge 597ms ·
rank 581ms · ach 625ms · daily 592ms · settings 596ms — 全部开→验→关→验关闭。
