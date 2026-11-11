// ===== 广告服务核心 (Phase 4) =====
// 统一激励视频接口 + 幂等状态机 + 奖励事务账本
// 生产代码只依赖 AdService 门面; 平台实现见 web-mock-ad.js / douyin-ad.js / wechat-ad.js
//
// 铁律:
// 1. 只有平台回调确认"完整观看"才发奖 (抖音 isEnded=true / 模拟器点击"完成观看")
// 2. 每笔奖励有唯一 transactionId, 发奖前查 RewardLedger 防重复
// 3. 广告期间游戏必须暂停; 关闭/失败/中断都要恢复
// 4. 绝不伪造广告完成回调

/** 广告错误码 */
var AdError = {
    NOT_INITIALIZED: 'not_initialized',   // 未调用 initialize()
    NOT_AVAILABLE:   'not_available',     // 无可用广告位/平台不支持
    LOAD_FAILED:     'load_failed',       // 加载失败(网络等)
    SHOW_FAILED:     'show_failed',       // 展示失败
    ABANDONED:       'abandoned',         // 用户提前关闭(不发奖)
    INTERRUPTED:     'interrupted',       // 切后台/来电中断(不发奖)
    BUSY:            'busy'               // 已有广告流程进行中(防连点)
};

/** 广告场景(激励视频) */
var AdPlacement = {
    REVIVE:        'revive',         // 4.1 复活
    DOUBLE_REWARD: 'double_reward',  // 4.2 双倍结算
    REFRESH_GATES: 'refresh_gates'   // 4.3 状态门刷新
};

/**
 * 奖励事务账本: 持久化已发奖的 transactionId, 跨页面刷新防重复发放
 */
class RewardLedger {
    constructor(storage) {
        this._storage = storage;
        this._granted = storage.get('ad_reward_ledger', {});
        // 清理7天前的旧事务(防止无限膨胀)
        var cutoff = Date.now() - 7 * 24 * 3600 * 1000;
        var changed = false;
        for (var id in this._granted) {
            if (this._granted[id].t < cutoff) { delete this._granted[id]; changed = true; }
        }
        if (changed) this._save();
    }
    _save() { this._storage.set('ad_reward_ledger', this._granted); }
    /** 是否已发放过 */
    has(transactionId) { return !!this._granted[transactionId]; }
    /** 标记发放 */
    mark(transactionId, meta) {
        if (this.has(transactionId)) return false;
        this._granted[transactionId] = { t: Date.now(), meta: meta || null };
        this._save();
        return true;
    }
}

/**
 * 广告服务门面(基类)
 * 平台实现子类需覆写: _doInitialize / _doIsAvailable / _doPreload / _doShow
 * _doShow(opts) 约定:
 *   opts.placement     广告场景
 *   opts.onComplete()  完整观看(唯一发奖入口)
 *   opts.onAbandon()   提前关闭
 *   opts.onError(err)  加载/展示失败
 *   opts.onInterrupt() 中断(切后台)
 */
class AdService {
    constructor(storage, lifecycle) {
        this._storage = storage;
        this._lifecycle = lifecycle;
        this._ledger = new RewardLedger(storage);
        // 状态机: idle -> requesting -> showing -> (settling) -> idle
        this._state = 'idle';
        this._requestId = null;
        this._pendingShow = null; // 进行中的 {resolve} 防连点
        this._initialized = false;
        this._rewardDelivered = false; // 本次展示是否已确认发奖(防平台重复回调)
    }

    /** 初始化(幂等) */
    initialize() {
        if (this._initialized) return;
        this._initialized = true;
        this._doInitialize();
        // 切后台中断当前广告
        if (this._lifecycle) {
            var self = this;
            this._lifecycle.on('hide', function() { self._onAppHide(); });
        }
    }

    /** 广告是否可用(平台支持且已配置广告位) */
    isAvailable() {
        if (!this._initialized) return false;
        return this._doIsAvailable();
    }

    /** 预加载(尽力而为, 失败静默) */
    preload() {
        if (!this._initialized || !this.isAvailable()) return Promise.resolve(false);
        return Promise.resolve(this._doPreload()).catch(function() { return false; });
    }

    /**
     * 展示激励视频
     * @param {string} placement AdPlacement
     * @returns {Promise<{status:'completed'|'abandoned'|'failed', reason?:string, transactionId?:string}>}
     *  - completed: 完整观看, transactionId 可发奖(调用方还需 ledger.mark 防重)
     *  - abandoned: 提前关闭, 不发奖
     *  - failed:    加载/展示失败/不支持/中断, 不发奖
     */
    showRewarded(placement) {
        var self = this;
        // 防连点/防重入
        if (this._state !== 'idle') {
            return Promise.resolve({ status: 'failed', reason: AdError.BUSY });
        }
        if (!this._initialized) {
            return Promise.resolve({ status: 'failed', reason: AdError.NOT_INITIALIZED });
        }
        if (!this.isAvailable()) {
            return Promise.resolve({ status: 'failed', reason: AdError.NOT_AVAILABLE });
        }

        this._state = 'requesting';
        this._requestId = 'req_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
        this._rewardDelivered = false;

        return new Promise(function(resolve) {
            self._pendingShow = { resolve: resolve, placement: placement, requestId: self._requestId };
            self._state = 'showing';
            try {
                self._doShow({
                    placement: placement,
                    requestId: self._requestId,
                    onComplete: function() { self._settle('completed'); },
                    onAbandon:  function() { self._settle('abandoned'); },
                    onError:    function(code) { self._settle('failed', code); },
                    onInterrupt:function() { self._settle('failed', AdError.INTERRUPTED); }
                });
            } catch (e) {
                self._settle('failed', AdError.SHOW_FAILED);
            }
        });
    }

    dispose() {
        this._state = 'idle';
        this._pendingShow = null;
        this._doDispose();
    }

    // ---- 内部 ----

    /** 统一结算入口(状态机唯一出口, 幂等) */
    _settle(status, reason) {
        if (this._state === 'idle') return; // 已结算过(重复回调防护)
        var pending = this._pendingShow;
        this._state = 'idle';
        this._pendingShow = null;

        var result = { status: status, reason: reason || null };
        if (status === 'completed') {
            // 完整观看: 生成奖励事务ID(即使重复回调, transactionId 只生成一次)
            if (!this._rewardDelivered) {
                this._rewardDelivered = true;
                result.transactionId = 'txn_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
            } else {
                // 平台重复的完成回调: 不再发新事务
                result.status = 'failed';
                result.reason = 'duplicate_callback';
            }
        }
        if (pending) pending.resolve(result);
    }

    /** 切后台: 中断当前展示(不发奖) */
    _onAppHide() {
        if (this._state === 'showing' || this._state === 'requesting') {
            this._doInterrupt();
            this._settle('failed', AdError.INTERRUPTED);
        }
    }

    /** 发奖防护门: 调用方在拿到 completed+transactionId 后调用 */
    grantReward(transactionId, grantFn) {
        if (!transactionId) return false;
        if (this._ledger.has(transactionId)) return false;
        grantFn();
        this._ledger.mark(transactionId, {});
        return true;
    }

    // ---- 平台子类覆写 ----
    _doInitialize() {}
    _doIsAvailable() { return false; }
    _doPreload() {}
    _doShow(opts) { if (opts.onError) opts.onError(AdError.NOT_AVAILABLE); }
    _doInterrupt() {}
    _doDispose() {}
}
