// ===== 微信小游戏激励视频服务 (V12 正式实现) =====
// 使用官方 wx.createRewardedVideoAd — 结构与 DouyinAdService 一致
// 铁律: 仅 onClose 回调 res.isEnded === true (或 res.isEnded === 1) 才算完整观看并发放奖励
// 广告位ID从平台配置读取(构建期由 tools/build-wechat.js 注入 window.__GAME_SETTINGS.ads.wechat);
// 未配置 → isAvailable()=false, 上层如实降级, 不伪造广告, 不用 Mock 冒充正式广告
// 合规: 奖励发放经 AdService 状态机幂等结算 + RewardLedger 唯一事务ID防重复(grantReward),
//       切后台由 AdService._onAppHide 统一结算为 interrupted(不发奖)

class WechatAdService extends AdService {
    constructor(storage, lifecycle) {
        super(storage, lifecycle);
        // wx 句柄由 Platform 门面注入(平台检测时捕获), 小游戏环境兜底直接读全局
        this.wx = (typeof Platform !== 'undefined' && Platform.wx) ? Platform.wx
            : (typeof wx !== 'undefined' ? wx : null);
        this._rewardAd = null;
        this._loadError = null;
        this._showing = false;
    }

    /** 广告位ID: 优先构建期注入配置(window.__GAME_SETTINGS.ads.wechat.rewardVideo), 未配置返回空 */
    _adUnitId() {
        try {
            var s = (typeof window !== 'undefined' && window.__GAME_SETTINGS) || null;
            var units = s && s.ads && s.ads.wechat;
            return (units && units.rewardVideo) || '';
        } catch (e) { return ''; }
    }

    _doInitialize() {
        var self = this;
        if (!this.wx || !this._adUnitId()) return; // 无平台句柄/未配置广告位: 保持不可用
        try {
            this._rewardAd = this.wx.createRewardedVideoAd({ adUnitId: this._adUnitId() });
            // 平台错误(加载失败等): 记录并结算展示中的请求
            this._rewardAd.onError(function(err) {
                self._loadError = err || true;
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
                    // 用户中途关闭 → 不发奖
                    if (cur.opts.onAbandon) cur.opts.onAbandon();
                }
                // 预加载下一次
                self._doPreload();
            });
        } catch (e) {
            console.error('[WechatAd] 初始化失败', e);
            this._rewardAd = null;
        }
    }

    _doIsAvailable() {
        return !!(this.wx && this._adUnitId() && this._rewardAd);
    }

    _doPreload() {
        var self = this;
        if (!this._rewardAd || !this._rewardAd.load) return Promise.resolve(false);
        return new Promise(function(resolve) {
            self._loadError = null;
            try {
                var p = self._rewardAd.load();
                if (p && p.then) {
                    p.then(function() { resolve(true); })
                     .catch(function(err) { self._loadError = err; resolve(false); });
                } else {
                    resolve(false);
                }
            } catch (e) {
                self._loadError = e;
                resolve(false);
            }
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
        // 捕获广告实例引用 — 防 dispose 竞态(与抖音 V11 修复同构)
        var ad = this._rewardAd;
        try {
            var p = ad.show();
            if (p && p.catch) {
                p.catch(function(err) {
                    // 展示失败: 尝试二次 load 后重试一次
                    var lp = ad.load && ad.load();
                    var loadP = (lp && lp.then) ? lp : Promise.resolve();
                    loadP.then(function() { return ad.show(); })
                        .catch(function() {
                            self._showing = false;
                            self._current = null;
                            opts.onError(AdError.SHOW_FAILED);
                        });
                });
            }
        } catch (e) {
            self._showing = false;
            self._current = null;
            opts.onError(AdError.SHOW_FAILED);
        }
    }

    _doInterrupt() {
        // 微信切后台由系统接管视频; AdService._onAppHide 已统一结算为 interrupted(不发奖),
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
