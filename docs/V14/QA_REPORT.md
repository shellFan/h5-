# V14 · QA 报告 (QA_REPORT)

## 全量回归(同一代码状态, 本轮实测)
| 套件 | 结果 |
|---|---|
| unit | 102/102 |
| e2e 主流程 | 29/29 |
| combat-feedback-gates | 11/11 |
| ui-v118 | 7/7 |
| h5-build | PASS |
| v51 五关 | 39/39 |
| v80 | 37/37 |
| soldier | 11/11 |
| v111/v112/v113/v114 | 15/15/14/14 全绿 |
| vnext boss/class/equip/rank | 124/23/20/16 全绿 |
| v101 mobile | 29/29 |
| 微信构建 | 通过 |
| 微信模拟器 | **20/20**(修复后复跑) |
| soak 15min | 71 周期 / 0 页面错误 / 堆趋势判定平稳(logs/soak-run.log) |

## 本轮发现并修复的缺陷
1. **微信模拟器 17/20**(军械库图集三项失败): 根因 = 军械库 3D 展示在 minidom 环境
   把真实 canvas 节点挂入 minidom 树, 污染样式引擎(bg-image 全部不加载)。
   修复 = WeaponShowcase.available() 增加 `typeof wx` + `window.__minidom` 双守卫;
   顺带移除 minidom 不支持的 `:not(:empty)` CSS(改 JS 管理类)。修复后 20/20 复跑实证。
2. **H5 构建失败**(入口脚本未打包): js/weapon-showcase.js 漏登记 build-h5.js 清单, 已补。
3. 采集脚本两处 bug(挑战页 renderChallenges 函数名 / 移动端截图先 start 的状态污染)已修。

## 性能核对
- DrawCall: 主题道具按可见性切换(同时段 +4-6), 变体/弹道零新增(实例色), 附件按需可见;
- soak 堆 16.4→34.7MB(71 周期, 趋势判定通过);
- 软渲染环境 FPS 不能代表真机(如实记录, 真机未测)。

## 遗留问题
见 V14_MASTER_REPORT.md §4(5 项, 全部如实未伪装)。

## V14.2/V14.3 回归(第二三轮实测)

全部套件复跑全绿(unit 102 · e2e 29 · combat-feedback 11 · ui-v118 7 · v51 39 ·
vnext-boss 124 · mobile 29 · 微信 20/20 · H5/抖音构建通过)。
Boss GLB 异步续载与渲染回退的审计披露见 MONSTER_REPORT(测试探针已加入就绪等待)。
soak(最终轮)见 logs/soak-run.log。
