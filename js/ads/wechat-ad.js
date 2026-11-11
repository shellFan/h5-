// ===== 微信小游戏广告服务 (Phase 4 预留) =====
// 结构与 DouyinAdService 一致(wx.createRewardedVideoAd), 当前仅预留未启用
// 启用步骤: 实现 _adUnitId 配置 + 把 platform.js 中广告装配切换到 WechatAdService

class WechatAdService extends AdService {
    _doInitialize() { /* 预留: wx.createRewardedVideoAd({ adUnitId }) */ }
    _doIsAvailable() { return false; } // 明确不支持 → 上层降级, 不伪造
}
