// ===== 游戏广告协调器 (Phase 4) =====
// 把 AdService 接到游戏规则上:
//   4.1 复活: 每局最多1次; 发奖后恢复50%人数(至少5人), 短暂无敌2.5s
//   4.2 双倍结算: 每次通关最多领1次双倍
//   4.3 状态门刷新: 每局有限次数(默认2次); 刷新后重新生成当前段三选一门, 不重复发旧门奖励
// 所有奖励走 ledger 幂等; 广告展示前后由外部回调暂停/恢复游戏

var AD_RULES = {
    REVIVE_MAX_PER_RUN: 1,
    DOUBLE_MAX_PER_RUN: 1,
    GATE_REFRESH_MAX_PER_RUN: 2,
    REVIVE_RATIO: 0.5,        // 复活恢复比例(相对失败前最大人数)
    REVIVE_MIN: 5,
    REVIVE_INVINCIBLE_SEC: 2.5
};

class GameAdCoordinator {
    /**
     * @param adService AdService 实例
     * @param hooks { pauseGame(), resumeGame(), onReviveReward(count, invincibleSec), onDoubleReward(), onGatesRefresh(), canRefreshGates() }
     */
    constructor(adService, hooks) {
        this._ads = adService;
        this._hooks = hooks || {};
        // 每局计数器(startRun时重置)
        this._runCounters = { revive: 0, double: 0, gateRefresh: 0 };
        // 进行中标记(防UI连点)
        this._busy = false;
    }

    /** 新一局开始: 重置次数限制 */
    startRun() {
        this._runCounters = { revive: 0, double: 0, gateRefresh: 0 };
        this._busy = false;
    }

    // ---- 能力查询(UI按钮置灰用) ----
    canShowAds() { return this._ads && this._ads.isAvailable(); }
    canRevive() { return this.canShowAds() && this._runCounters.revive < AD_RULES.REVIVE_MAX_PER_RUN; }
    canDoubleReward() { return this.canShowAds() && this._runCounters.double < AD_RULES.DOUBLE_MAX_PER_RUN; }
    canRefreshGates() { return this.canShowAds() && this._runCounters.gateRefresh < AD_RULES.GATE_REFRESH_MAX_PER_RUN; }
    getGateRefreshLeft() { return Math.max(0, AD_RULES.GATE_REFRESH_MAX_PER_RUN - this._runCounters.gateRefresh); }

    /**
     * 通用展示流程: 暂停游戏 → 展示 → 结算(幂等发奖) → 恢复游戏
     * @returns {Promise<boolean>} 是否发放了奖励
     */
    _showAndGrant(placement, grantFn) {
        var self = this;
        if (this._busy) return Promise.resolve(false);
        if (!this._ads.isAvailable()) return Promise.resolve(false);
        this._busy = true;
        if (this._hooks.pauseGame) this._hooks.pauseGame();
        return this._ads.showRewarded(placement).then(function(result) {
            var granted = false;
            if (result.status === 'completed' && result.transactionId) {
                granted = self._ads.grantReward(result.transactionId, grantFn);
            }
            if (self._hooks.resumeGame) self._hooks.resumeGame();
            self._busy = false;
            return granted;
        });
    }

    /** 4.1 激励视频复活(失败界面按钮) V3.5: 次数在请求时消耗(防授奖竞态), 奖励仍由幂等账本保证 */
    requestRevive(maxCountBeforeDeath) {
        var self = this;
        if (!this.canRevive()) return Promise.resolve(false);
        this._runCounters.revive++;
        return this._showAndGrant(AdPlacement.REVIVE, function() {
            var reviveCount = Math.max(AD_RULES.REVIVE_MIN,
                Math.floor((maxCountBeforeDeath || 10) * AD_RULES.REVIVE_RATIO));
            if (self._hooks.onReviveReward) {
                self._hooks.onReviveReward(reviveCount, AD_RULES.REVIVE_INVINCIBLE_SEC);
            }
        });
    }

    /** 4.2 双倍结算(胜利界面按钮) */
    requestDoubleReward() {
        var self = this;
        if (!this.canDoubleReward()) return Promise.resolve(false);
        this._runCounters.double++;
        return this._showAndGrant(AdPlacement.DOUBLE_REWARD, function() {
            if (self._hooks.onDoubleReward) self._hooks.onDoubleReward();
        });
    }

    /** 4.3 状态门刷新(战斗中按钮) */
    requestGateRefresh() {
        var self = this;
        if (!this.canRefreshGates()) return Promise.resolve(false);
        if (this._hooks.canRefreshGates && !this._hooks.canRefreshGates()) {
            return Promise.resolve(false); // 当前无未触发的门可刷新
        }
        this._runCounters.gateRefresh++;
        return this._showAndGrant(AdPlacement.REFRESH_GATES, function() {
            if (self._hooks.onGatesRefresh) self._hooks.onGatesRefresh();
        });
    }
}

/**
 * 广告服务装配: 按平台选择实现(H5=测试模拟器 / 抖音=真实SDK / 微信=预留)
 * 供 Platform.initialize() 调用
 */
function setupAdService() {
    var svc;
    if (Platform.id === 'douyin') {
        svc = new DouyinAdService(Platform.storage, Platform.lifecycle);
    } else if (Platform.id === 'wechat') {
        svc = new WechatAdService(Platform.storage, Platform.lifecycle);
    } else {
        // H5: 明确标注的测试广告模拟器
        svc = new WebMockAdService(Platform.storage, Platform.lifecycle, {
            scenario: (typeof window !== 'undefined' && window.__AD_TEST_SCENARIO) || 'normal'
        });
    }
    svc.initialize();
    Platform.ads = svc;
    return svc;
}
