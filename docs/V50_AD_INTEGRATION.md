# V5.0 广告系统接入报告（V50_AD_INTEGRATION.md）

## 架构（沿用 + V5.0 修复）
```
游戏入口(index.html / game.js)
  └─ setupAdService()                    js/ads/game-ad-coordinator.js
       ├─ douyin → DouyinAdService        js/ads/douyin-ad.js   (tt.createRewardedVideoAd)
       ├─ wechat → WechatAdService        js/ads/wechat-ad.js   (预留空壳, isAvailable=false)
       └─ h5    → WebMockAdService        js/ads/web-mock-ad.js (仅开发/测试环境!)
             或 null                      生产 H5 无真实SDK → 广告如实降级不可用
  └─ AdService 基类状态机                js/ads/ad-service.js
       └─ RewardLedger 幂等账本(7天清理)
```

## 发奖铁律（状态机保证，全自动化测试覆盖）
1. 只有平台确认**完整观看**才生成 transactionId（抖音 `res.isEnded===true`；Mock 需点击"模拟完整观看"或 auto_complete 场景）
2. 发奖前经 `RewardLedger` 幂等账本（跨刷新防重）
3. 提前关闭 → abandoned 不发奖；切后台/来电 → interrupted 不发奖；加载/展示失败 → failed 不发奖
4. 平台重复完成回调被 `_settle` 幂等拦截（`ad-service.js:156`）
5. 广告期间游戏暂停，任何结算路径都恢复

## 每局规则
| 场景 | 次数 | 发放 | 按钮 |
|---|---|---|---|
| 复活 | 1 | 50% 人数（≥5）+ 2.5s 无敌 | 失败页 |
| 双倍结算 | 1 | 奖励×2 标记 | 胜利页 |
| 刷新状态门 | 2 | 前方未触发门重随 | HUD |

## V5.0 修复（审计 P0/P1）
1. **抖音服务 `this.tt` 从未赋值** → 构造器从 Platform 门面/全局取 tt（修复前抖音广告初始化必抛错，配置了广告位也永远不可用）
2. **`showRewarded` 30s 超时兜底**（`AdError.TIMEOUT`）→ 平台 onClose 丢失时不再永久暂停（软锁死）
3. **广告位配置链修复**：`douyin-ad.js` 不再读被覆盖的同名全局，改为读 `window.__GAME_SETTINGS.ads.douyin.rewardVideo`（由 `tools/build-douyin.js` 生成 `dist/douyin/game-config.js` 注入）
4. **H5 生产 Mock 隔离**：`setupAdService` 仅在 localhost/127.0.0.1/::1/file 协议或显式 `?adtest=` 时装配 WebMock；生产 H5 无真实广告 SDK → 返回 null → 复活/双倍/刷门按钮自动隐藏，不伪造商业广告

## 测试场景隔离
- `?adtest=auto_complete|auto_abandon|error` 仅供 E2E 注入（`index.html:212`），生产 H5 在非 localhost 下即使带该参数也会因服务未装配而无效
- Mock 覆盖层明确标注「测试广告模拟器 · TEST AD」

## 平台审核注意（文案/合规）
- 广告按钮文案：📺 观看广告复活 / 📺 双倍奖励 / ⟳ 刷门 —— 无诱导性措辞
- 提前关闭明确提示"不发奖"；按钮失败后恢复可点
- 未做：激励视频以外的插屏/横幅（当前玩法不需要）

## 上线前人工步骤（不可自动化，未完成前广告不可用）
1. 抖音流量主后台申请激励视频广告位 → 填入 `dist/douyin/game-config.js` 的 `rewardVideo`
2. 抖音开发者工具真机预览验证 `isEnded` 回调链路
3. 微信端：`wechat-ad.js` 为预留空壳（8 行，isAvailable 恒 false）——接入微信广告需另行开发，当前状态如实标注为"不可用"，不伪造

## 测试覆盖
- 单测 `tests/unit/suites/02-ads.test.js`（17 项）：状态机/幂等/账本/次数/中断不发奖
- e2e：auto_complete 复活→二次死亡按钮隐藏；双倍限 1 次；auto_abandon 提前关闭不复活
