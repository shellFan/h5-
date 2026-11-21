# V13 · 研发报告

## 交付范围(全部已接入并截图验收)

1. **关卡主题系统**: 10 关全覆盖(城市时段族 dawn/noon/overcast/sunset/dusk + apocalypse/cave/mechanical/fortress) — CONFIG.WORLD_THEMES + world.applyTheme/_paintSky; 主题截图 x10;
2. **状态门光束柱**: 稀有度色光束(合并单mesh) + 呼吸脉动;
3. **军械库/图鉴武器剪影**: 8 类程序化 SVG x 稀有度色阶 x 进化金晕(替换 emoji);
4. **科技树结构视觉**: 分支徽记 + 导轨 + 节点连线 + 等级点;
5. **排行榜状态完备**: 富空态/数据源错误态(不伪造数据);
6. **style-v130 动效层**: 动效令牌/页面进场/按压反馈/金币弹跳 + **减少动效开关**(设置页+系统偏好, H5/微信双端);
7. **可玩性回归修复**: L3 DPS 公式回滚(见 QA_REPORT) + 军械库 SVG 在三端渲染验证。

## 工程统计

- 修改文件: js/config.js, js/world.js, js/gates.js, js/art-v42.js, js/ui-v60.js, js/combat.js, index.html, tools/build-h5.js, tools/build-wechat.js
- 新增: style-v130.css, docs/V13/*(14 文档), tools/v13-*(补丁/审计脚本, 随仓库保留可复用)
- 新增二进制素材: 0(全部程序化); 删除素材: 0
- 三端构建: H5 5415KB / 抖音 5.20MB / 微信 4.91MB(红线内)

## 核心业务保护声明

- 战斗伤害/人数规则/门数值/刷新规则/移动攻击逻辑/Boss 数值/胜负判断/经济/金币/
  武器升级数值/技能效果/职业属性/存档结构/排行榜算法/广告结算/微信接口/状态机:
  **零修改**; 唯一例外为 L3 可玩性恢复(回滚并行会话未经授权的伤害公式改动),
  属恢复授权基线而非新增改动, 已在 QA_REPORT 与源码注释双处记录。
