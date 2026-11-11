# V3 广告变现系统设计文档 (Phase 4)

## 1. 架构

```
Game UI(复活/双倍/刷门按钮)
      │ requestXxx()
GameAdCoordinator          ← 游戏规则层(次数限制/暂停恢复/发奖路由)
      │ showRewarded(placement)
AdService(门面+幂等状态机)  ← js/ads/ad-service.js
      │ _doShow()
┌─────┼──────────────┐
WebMockAdService   DouyinAdService   WechatAdService(预留)
(H5测试模拟器)      (tt.createRewardedVideoAd)
```

- **AdService** 状态机: `idle → requesting → showing → idle`,唯一结算出口 `_settle()`,重复回调幂等。
- **RewardLedger**: `transactionId` 持久化账本(存 localStorage/tt storage),跨页面刷新防重复发放;7天自动清理。
- **请求ID**: 每次展示生成 `req_*` / `txn_*` 唯一ID,可追溯。

## 2. 激励场景与规则

| 场景 | placement | 次数限制 | 奖励 | 发奖条件 |
|------|-----------|---------|------|---------|
| 4.1 复活 | `revive` | 每局1次 | 恢复 max(5, 失败前最大人数×50%) + 无敌2.5s | 完整观看 |
| 4.2 双倍结算 | `double_reward` | 每次通关1次 | 结算奖励×2 | 完整观看 |
| 4.3 刷门 | `refresh_gates` | 每局2次 | 重新生成前方未触发门(旧门奖励作废重随) | 完整观看 |

## 3. 可靠性矩阵(全部有单测覆盖, tests/unit/suites/02-ads.test.js)

| 场景 | 行为 |
|------|------|
| 广告未加载/不支持 | `failed(NOT_AVAILABLE)`, UI按钮置灰, 游戏正常进行 |
| 展示失败 | 二次load重试一次(Douyin), 仍失败 `failed(SHOW_FAILED)` 不发奖 |
| 用户提前关闭 | `abandoned` 不发奖 |
| 完整观看 | `completed` + transactionId, grantReward 幂等发奖 |
| 多次点击 | BUSY 保护, 第二次立即失败不发起展示 |
| 重复回调 | 状态机 idle 后忽略; completed 只生成一次事务ID |
| 网络中断 | 走 onError → failed |
| 切后台 | LifecycleAdapter onHide → 中断(INTERRUPTED) 不发奖 |
| 恢复前台 | onShow → 状态机已归位可再次展示 |
| 重复发放 | Ledger.has(transactionId) 拦截 |

## 4. 平台接入状态

| 平台 | 实现 | 状态 |
|------|------|------|
| H5 | WebMockAdService — 明确标注"测试广告模拟器 TEST AD"浮层 | ✅ 完成(不接真实广告) |
| 抖音 | DouyinAdService — `tt.createRewardedVideoAd`,`isEnded===true` 才发奖 | ✅ 代码完成,**广告位ID待配置**(game-config.js / DOUYIN_AD_UNITS.rewardVideo), 真机验证待办 |
| 微信 | WechatAdService — 空实现明确返回 NOT_AVAILABLE | ⏸ 预留 |

## 5. 反作弊/合规红线

1. 绝不伪造广告完成回调(H5模拟器需要用户真实点击"模拟完整观看")
2. 不在用户无明确操作时弹出激励视频(仅按钮触发)
3. 广告播放期间游戏逻辑暂停(`paused=true`), 关闭后恢复
4. 奖励发放走事务账本, 服务端校验预留(transactionId 可上报)

## 6. 上线检查单

- [ ] `DOUYIN_AD_UNITS.rewardVideo` 填入平台分配的真实广告位ID
- [ ] 抖音开发者工具验证: 加载/展示/提前关闭/完整观看四条路径
- [ ] 真机验证: 中途来电/切后台不发奖
- [ ] 复活/双倍/刷门三入口在广告不可用时正确降级(按钮隐藏或置灰)
