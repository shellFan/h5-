// ===== 分享适配器 (Phase 5) =====
// 抖音: tt.shareAppMessage | H5: 无系统分享时静默降级(不报错)

class ShareAdapter {
    constructor(platformId) {
        this._platform = platformId;
        this._tt = (typeof tt !== 'undefined') ? tt : null;
    }

    /**
     * 分享游戏
     * @returns {Promise<boolean>} true=已调起分享 false=平台不支持/失败(静默降级)
     */
    share(opts) {
        opts = opts || {};
        if (this._platform === 'douyin' && this._tt && this._tt.shareAppMessage) {
            try {
                this._tt.shareAppMessage({
                    title: opts.title || '膨胀小队 - 招兵买马·火力全开',
                    desc: opts.desc || '带你的小队冲穿状态门，击败僵尸Boss！',
                    success: function() {},
                    fail: function() {}
                });
                return Promise.resolve(true);
            } catch (e) {
                return Promise.resolve(false);
            }
        }
        // H5: 尝试 navigator.share, 不支持则降级
        if (navigator.share) {
            return navigator.share({
                title: opts.title || '膨胀小队',
                text: opts.desc || '带你的小队冲穿状态门，击败僵尸Boss！',
                url: opts.url || location.href
            }).then(function() { return true; }).catch(function() { return false; });
        }
        return Promise.resolve(false);
    }
}
