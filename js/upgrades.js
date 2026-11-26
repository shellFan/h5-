// ===== V5.1 永久升级商店 (全部价格/上限/效果集中配置) =====

var UPGRADE_DEFS = {
    recruit: {
        id: 'recruit',
        name: '新兵招募',
        icon: '🎖️',
        desc: '每级初始人数 +1',
        levels: [100, 180, 300, 450, 650, 900, 1200, 1600, 2100, 2700],
        effect: function(lv) { return '初始人数 ' + (1 + lv); }
    },
    logistics: {
        id: 'logistics',
        name: '后勤补给',
        icon: '📦',
        desc: '每级金币收益 +10%',
        levels: [150, 300, 500, 800, 1200],
        effect: function(lv) { return '金币收益 +' + (lv * 10) + '%'; }
    },
    gun: {
        id: 'gun',
        name: '枪械强化',
        icon: '🔫',
        desc: '每级基础伤害 +1',
        levels: [120, 220, 360, 550, 800, 1100, 1500, 2000],
        effect: function(lv) { return '基础伤害 ' + (1 + lv); }
    },
    rapid: {
        id: 'rapid',
        name: '快速射击',
        icon: '⚡',
        desc: '每级射速 +5%（全局射速上限不变）',
        levels: [120, 240, 400, 650, 950],
        effect: function(lv) { return '射速 +' + (lv * 5) + '%'; }
    },
    pierce: {
        id: 'pierce',
        name: '穿甲弹',
        icon: '🛡️',
        desc: '每级子弹穿透 +1',
        levels: [250, 500, 900],
        effect: function(lv) { return '穿透 +' + lv; }
    },
    // ===== V15-GAMEPLAY-002 / 004: 可升级主动战术技能 (前中期即可解锁体验, 后期持续强化) =====
    skill_airstrike: {
        id: 'skill_airstrike',
        name: '战术空袭',
        icon: '🚀',
        desc: '【主动技】Lv.1解锁 · 前方跑道5连环轰炸清潮',
        levels: [150, 350, 650, 1100, 1700],
        effect: function(lv) { return lv <= 0 ? '未解锁' : ('范围伤害 ' + (35 + lv * 20) + ' · 冷却 ' + (22 - lv * 1.5).toFixed(1) + 's'); }
    },
    skill_cryo: {
        id: 'skill_cryo',
        name: '极寒冰冻',
        icon: '❄️',
        desc: '【主动技】Lv.1解锁 · 冻结全屏怪潮并造成冰霜伤害',
        levels: [200, 420, 750, 1200, 1800],
        effect: function(lv) { return lv <= 0 ? '未解锁' : ('冻结 ' + (3.5 + lv * 0.6).toFixed(1) + 's · 冷却 ' + (24 - lv * 1.5).toFixed(1) + 's'); }
    },
    skill_overdrive: {
        id: 'skill_overdrive',
        name: '火力超载',
        icon: '⚡',
        desc: '【主动技】Lv.1解锁 · 短时间大幅提升火力/射速并获护盾',
        levels: [250, 500, 850, 1350, 2000],
        effect: function(lv) { return lv <= 0 ? '未解锁' : ('伤害×' + (1.6 + lv * 0.15).toFixed(2) + ' · 持续 ' + (6 + lv * 1.2).toFixed(1) + 's'); }
    },
    skill_tornado: {
        id: 'skill_tornado',
        name: '战术龙卷风',
        icon: '🌪️',
        desc: '【主动技】Lv.1解锁 · 释放推进旋风卷起怪潮并持续绞杀',
        levels: [300, 450, 700, 1000, 1500],
        effect: function(lv) { return lv <= 0 ? '未解锁' : ('持续 ' + (4.5 + lv * 0.5).toFixed(1) + 's · 半径 ' + (2.6 + lv * 0.2).toFixed(1) + 'm · 冷却 ' + (42 - lv * 2) + 's'); }
    }
};

var UpgradeShop = {
    /** 升级当前等级(0起) */
    levelOf: function(profile, id) {
        return (profile.data.upgrades && profile.data.upgrades[id]) || 0;
    },
    maxLevel: function(id) { return UPGRADE_DEFS[id].levels.length; },
    priceOf: function(id, lv) {
        var def = UPGRADE_DEFS[id];
        return (lv >= def.levels.length) ? null : def.levels[lv];
    },
    /**
     * 购买(原子): 余额检查→扣款→升级→保存。
     * @returns {ok:boolean, reason?:'insufficient'|'maxed', coins?:number}
     */
    purchase: function(profile, id) {
        var lv = this.levelOf(profile, id);
        var price = this.priceOf(id, lv);
        if (price === null) return { ok: false, reason: 'maxed' };
        if (profile.coins < price) return { ok: false, reason: 'insufficient', need: price };
        if (!profile.spend(price)) return { ok: false, reason: 'insufficient', need: price }; // 原子扣款失败
        profile.data.upgrades[id] = lv + 1;
        profile.save();
        return { ok: true, coins: profile.coins, level: lv + 1 };
    },
    /** 战斗内应用(与门 buff 叠加规则见 squad) */
    startCount: function(profile, levelStart) {
        return levelStart + this.levelOf(profile, 'recruit');
    },
    damageBonus: function(profile) { return this.levelOf(profile, 'gun'); },
    fireRateMul: function(profile) { return 1 + 0.05 * this.levelOf(profile, 'rapid'); },
    pierceBonus: function(profile) { return this.levelOf(profile, 'pierce'); }
}; // V10.1: 移除无调用的 coinMul(后勤金币加成在 settleRunEconomy 直接读 upgrades.logistics)
