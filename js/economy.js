// ===== V5.1 金币经济与永久档案 =====
// 存档: 经 Platform.storage(GameStorage 前缀 pz_squad_) 持久化, H5 localStorage / 小游戏 tt 存储通吃。
// 铁律:
//  - 胜利奖励每关只发一次(claimedRewards 幂等), 刷新/重进/重复通关都不再入账
//  - 击杀金币局终一次性入账(失败也给, 但上限低, 不鼓励故意失败刷钱)
//  - 旧存档(pz_progress 解锁进度)自动迁移, 不清空

var ECONOMY_RULES = {
    PROFILE_KEY: 'profile_v51',
    PROFILE_VERSION: 1,
    KILL_COIN_RATE: 0.8,          // V5.1.5: 每击杀 0.8 金币(超级尸潮下升级资金需求提升)
    KILL_COIN_WIN_CAP_RATIO: 0.5, // V5.1.5: 胜利局击杀币上限 = 关卡奖励×50%
    KILL_COIN_LOSE_CAP: 70,       // V5.1.5: 失败保底=胜利上限(超级尸潮下防软锁; 赢仍2倍+首通奖励优于刷)
    LEGACY_PROGRESS_KEY: 'pz_progress' // V3.3 旧解锁进度键(迁移源)
};

class GameProfile {
    /**
     * @param storage GameStorage(带前缀) — 档案主存储
     * @param rawAdapter 原始存储适配器(读旧版 pz_progress 迁移键, 无前缀)
     */
    constructor(storage, rawAdapter) {
        this._storage = storage;
        this._raw = rawAdapter || null;
        this._data = this._load();
    }

    _load() {
        var raw = null;
        try { raw = this._storage.get(ECONOMY_RULES.PROFILE_KEY, null); } catch (e) {}
        if (raw && typeof raw === 'object') {
            // 版本迁移钩子: 当前 v1; 未来版本在此做字段合并(不得清空旧字段)
            if ((raw.profileVersion || 0) <= ECONOMY_RULES.PROFILE_VERSION) {
                return this._normalize(raw);
            }
        }
        // 首次建档: 迁移旧版解锁进度(旧键在原始存储层, 无前缀)
        var legacyUnlocked = 1;
        try {
            var legacy = null;
            if (this._raw && this._raw.get) legacy = this._raw.get(ECONOMY_RULES.LEGACY_PROGRESS_KEY, null);
            if (typeof legacy === 'number') legacyUnlocked = legacy;
            else if (typeof legacy === 'string' && /^\d+$/.test(legacy)) legacyUnlocked = parseInt(legacy);
        } catch (e) {}
        return this._normalize({
            profileVersion: ECONOMY_RULES.PROFILE_VERSION,
            coins: 0,
            unlockedLevel: Math.max(1, legacyUnlocked || 1),
            upgrades: { recruit: 0, logistics: 0, gun: 0, rapid: 0, pierce: 0 },
            totalKills: 0,
            totalWins: 0,
            bestSquadCount: 0,
            claimedRewards: {}
        });
    }

    _normalize(d) {
        return {
            profileVersion: ECONOMY_RULES.PROFILE_VERSION,
            coins: Math.max(0, Math.floor(d.coins || 0)),
            unlockedLevel: Math.max(1, Math.floor(d.unlockedLevel || 1)),
            upgrades: {
                recruit: Math.max(0, Math.floor((d.upgrades && d.upgrades.recruit) || 0)),
                logistics: Math.max(0, Math.floor((d.upgrades && d.upgrades.logistics) || 0)),
                gun: Math.max(0, Math.floor((d.upgrades && d.upgrades.gun) || 0)),
                rapid: Math.max(0, Math.floor((d.upgrades && d.upgrades.rapid) || 0)),
                pierce: Math.max(0, Math.floor((d.upgrades && d.upgrades.pierce) || 0))
            },
            totalKills: Math.max(0, Math.floor(d.totalKills || 0)),
            totalWins: Math.max(0, Math.floor(d.totalWins || 0)),
            bestSquadCount: Math.max(0, Math.floor(d.bestSquadCount || 0)),
            claimedRewards: d.claimedRewards || {}
        };
    }

    save() { try { this._storage.set(ECONOMY_RULES.PROFILE_KEY, this._data); } catch (e) {} }
    get data() { return this._data; }
    get coins() { return this._data.coins; }

    /** 原子入账(金币只增不减经由 spend), 返回新余额 */
    addCoins(n) {
        this._data.coins = Math.max(0, this._data.coins + Math.floor(n));
        this.save();
        return this._data.coins;
    }

    /** 消费: 余额不足返回 false 且不动账(防重复扣款) */
    spend(n) {
        n = Math.floor(n);
        if (n < 0 || this._data.coins < n) return false;
        this._data.coins -= n;
        this.save();
        return true;
    }

    /** 幂等奖励键: 已领返回 false, 未领标记并入账 */
    claimReward(key, coins) {
        if (this._data.claimedRewards[key]) return false;
        this._data.claimedRewards[key] = { t: Date.now(), coins: Math.floor(coins) };
        if (coins) this._data.coins += Math.floor(coins);
        this.save();
        return true;
    }

    hasClaimed(key) { return !!this._data.claimedRewards[key]; }

    /** 记录一局统计; won=true 时解锁下一关(返回是否新解锁) */
    recordRun(levelIndex, kills, maxSquad, won, levelCount) {
        this._data.totalKills += Math.max(0, Math.floor(kills));
        var newUnlocked = false;
        if (won) {
            this._data.totalWins += 1;
            var next = Math.min((levelCount || 5), levelIndex + 2);
            if (next > this._data.unlockedLevel) {
                this._data.unlockedLevel = next;
                newUnlocked = true;
            }
        }
        if (maxSquad > this._data.bestSquadCount) this._data.bestSquadCount = maxSquad;
        this.save();
        return newUnlocked;
    }
}

/**
 * 一局结算(唯一入账入口, 幂等):
 * @returns {levelReward, killReward, doubled, total} — total 为本局实际入账金币
 */
function settleRunEconomy(profile, level, levelIndex, kills, won, useDoubleAd) {
    var reward = level.rewardCoins || 60;
    var levelReward = 0;
    if (won) {
        // 胜利奖励每关一次(幂等键), 后勤加成只作用于首次发放
        var gain = Math.round(reward * (1 + 0.10 * (profile.data.upgrades.logistics || 0)));
        if (profile.claimReward('win:L' + levelIndex, 0)) {
            levelReward = gain; // 先记账, 金币在下方统一入账
        }
    }
    var cap = won
        ? Math.round(reward * ECONOMY_RULES.KILL_COIN_WIN_CAP_RATIO)
        : ECONOMY_RULES.KILL_COIN_LOSE_CAP;
    var killReward = Math.min(cap, Math.floor(kills * ECONOMY_RULES.KILL_COIN_RATE));
    var base = levelReward + killReward;
    var total = base;
    if (won && useDoubleAd && levelReward > 0) {
        // 双倍广告: 仅对本次结算的关卡奖励生效(击杀币不翻倍)
        total = levelReward * 2 + killReward;
    }
    if (total > 0) profile.addCoins(total);
    // 确保胜利奖励键已标记(即使经双倍路径)
    if (won && !profile.hasClaimed('win:L' + levelIndex)) {
        profile.claimReward('win:L' + levelIndex, 0);
    }
    return { levelReward: levelReward, killReward: killReward, doubled: !!(won && useDoubleAd && levelReward > 0), total: total };
}
