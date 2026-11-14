// ===== 抖音小游戏激励视频服务 (Phase 4 / V5.0 修复) =====
// 使用官方 tt.createRewardedVideoAd
// 铁律: 仅 onClose 回调 res.isEnded === true (或 res.isEnded 布尔真) 才算完整观看
// 广告位ID从平台配置读取(构建期由 tools/build-douyin.js 注入 window.__GAME_SETTINGS.ads.douyin);
// 未配置 → isAvailable()=false, 不伪造广告

class DouyinAdService extends AdService {
    constructor(storage, lifecycle) {
        super(storage, lifecycle);
        // V5.0修复: 旧代码引用从未赋值的this.tt导致初始化必然抛错(广告永不可用)。
        // tt 句柄由 Platform 门面注入(平台检测时捕获), 小游戏环境兜底直接读全局。
        this.tt = (typeof Platform !== 'undefined' && Platform.tt) ? Platform.tt
            : (typeof tt !== 'undefined' ? tt : null);
        this._rewardAd = null;
        this._loadError = null;
        this._showing = false;
    }

    /** 广告位ID: 优先构建期注入配置(window.__GAME_SETTINGS.ads.douyin.rewardVideo), 未配置返回空 */
    _adUnitId() {
        try {
            var s = (typeof window !== 'undefined' && window.__GAME_SETTINGS) || null;
            var units = s && s.ads && s.ads.douyin;
            return (units && units.rewardVideo) || '';
        } catch (e) { return ''; }
    }

    _doInitialize() {
        var self = this;
        if (!this.tt || !this._adUnitId()) return; // 无平台句柄/未配置广告位: 保持不可用
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
        // 抖音切后台由系统接管视频; AdService._onAppHide 已统一结算为 interrupted(不发奖),
        // onClose 若仍回调 isEnded=true 会被状态机幂等拦截(_settle 二次调用直接 return)。
        this._showing = false;
    }

    _doDispose() {
        if (this._rewardAd && this._rewardAd.destroy) {
            try { this._rewardAd.destroy(); } catch (e) {}
        }
        this._rewardAd = null;
    }
}
