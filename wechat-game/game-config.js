// ===== 微信小游戏平台配置 (构建生成, 上线前必查) =====
// 广告位ID获取: 微信公众平台 → 流量主 → 广告位管理 → 激励式视频广告
// 留空 = 广告功能如实降级不可用(按钮自动隐藏), 不伪造广告
window.__GAME_SETTINGS = {
    version: 'v11.3',
    platform: 'wechat',
    ads: {
        wechat: {
            rewardVideo: ''  // TODO(上线): 填入激励视频广告位ID
        }
    }
};
