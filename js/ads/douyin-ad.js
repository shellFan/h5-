// ===== 抖音小游戏激励视频服务 (Phase 4) =====
// 使用官方 tt.createRewardedVideoAd
// 铁律: 仅 onClose 回调 res.isEnded === true (或 res.isEnded 布尔真) 才算完整观看
// 广告位ID从配置读取; 未配置 → isAvailable()=false, 不伪造广告

// 广告位ID配置(抖音平台分配后填入; 为空时广告功能降级不可用)
var DOUYIN_AD_UNITS = {
    rewardVideo: ''  // TODO: 上线时填入抖音分配的激励视频广告位ID
};

class DouyinAdService extends AdService {
    constructor(storage, lifecycle) {
        super(storage, lifecycle);
        this._rewardAd = null;
        this._loadError = null;
        this._showing = false;
    }

    _adUnitId() { return DOUYIN_AD_UNITS.rewardVideo; }

    _doInitialize() {
        var self = this;
        if (!this._adUnitId()) return; // 未配置广告位: 保持不可用
        try {
            this._rewardAd = this.tt.createRewardedVideoAd({ adUnitId: this._adUnitId() });
            // 平台错误(加载失败等)
            this._rewardAd.onError(function(err) {
                self._loadError = err || true;
                // 展示中出错 → 结算为失败
                if (self._showing && self._current) {
                    self._showing = false;
                    if (self._current.opts.onError) self._current.opts.onError(AdError.SHOW_FAILED);
                }
            });
            // 关闭回调(唯一发奖判定点)
            this._rewardAd.onClose(function(res) {
                self._showing = false;
                var cur = self._current;
                if (!cur) return;
                self._current = null;
                if (res && (res.isEnded === true || res.isEnded === 1)) {
                    if (cur.opts.onComplete) cur.opts.onComplete();
                } else {
                    // 提前关闭
                    if (cur.opts.onAbandon) cur.opts.onAbandon();
                }
                // 预加载下一次
                self._doPreload();
            });
        } catch (e) {
            console.error('[DouyinAd] 初始化失败', e);
            this._rewardAd = null;
        }
    }

    _doIsAvailable() {
        return !!(this.tt && this._adUnitId() && this._rewardAd);
    }

    _doPreload() {
        var self = this;
        if (!this._rewardAd) return Promise.resolve(false);
        return new Promise(function(resolve) {
            self._loadError = null;
            self._rewardAd.load()
                .then(function() { resolve(true); })
                .catch(function(err) { self._loadError = err; resolve(false); });
        });
    }

    _doShow(opts) {
        var self = this;
        if (!this._rewardAd) {
            opts.onError(AdError.NOT_AVAILABLE);
            return;
        }
        this._current = { opts: opts };
        this._showing = true;
        this._rewardAd.show()
            .catch(function(err) {
                // 展示失败: 尝试二次load后重试一次
                self._rewardAd.load()
                    .then(function() { return self._rewardAd.show(); })
                    .catch(function() {
                        self._showing = false;
                        self._current = null;
                        opts.onError(AdError.SHOW_FAILED);
                    });
            });
    }

    _doInterrupt() {
        // 抖音切后台由系统接管视频; 标记中断, onClose若仍回调isEnded需防护
        if (this._showing) this._interrupted = true;
    }

    _doDispose() {
        if (this._rewardAd && this._rewardAd.destroy) {
            try { this._rewardAd.destroy(); } catch (e) {}
        }
        this._rewardAd = null;
    }
}
