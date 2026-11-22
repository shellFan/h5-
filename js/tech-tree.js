// ===== V8.0 科技树 =====
// 三方向(火力/军团/后勤), 前置解锁, 科技点消耗。配置集中: TECH_DEFS。

var TECH_CURRENCY = 'tech'; // 科技点

var TECH_DEFS = {
    // —— 火力科技 ——
    fire_dmg:   { branch: 'fire', name: '弹药强化', icon: '💢', desc: '全队伤害 +1', cost: 100, req: null, max: 3 },
    fire_rate:  { branch: 'fire', name: '射速优化', icon: '⚡', desc: '射速 +8%', cost: 120, req: 'fire_dmg', max: 3 },
    fire_crit:  { branch: 'fire', name: '弱点分析', icon: '🎯', desc: '暴击率 +5%', cost: 200, req: 'fire_rate', max: 3 },
    fire_pierce:{ branch: 'fire', name: '穿甲技术', icon: '🔩', desc: '穿透 +1', cost: 300, req: 'fire_crit', max: 2 },
    fire_explo: { branch: 'fire', name: '爆炸弹头', icon: '💣', desc: '子弹爆炸', cost: 400, req: 'fire_pierce', max: 1 },
    // —— 军团科技 ——
    army_size:  { branch: 'army', name: '扩编', icon: '👥', desc: '初始人数 +2', cost: 100, req: null, max: 3 },
    army_limit: { branch: 'army', name: '军团上限', icon: '🏛️', desc: '最大人数 +50', cost: 250, req: 'army_size', max: 2 },
    army_regen: { branch: 'army', name: '战地医疗', icon: '🏥', desc: '每10秒恢复1人', cost: 200, req: 'army_limit', max: 2 },
    army_shield:{ branch: 'army', name: '防弹装甲', icon: '🛡️', desc: '伤害减免 8%', cost: 300, req: 'army_regen', max: 2 },
    // —— 后勤科技 ——
    log_coin:   { branch: 'logi', name: '战利品回收', icon: '🪙', desc: '金币 +15%', cost: 100, req: null, max: 3 },
    log_xp:     { branch: 'logi', name: '训练手册', icon: '📚', desc: '经验 +20%', cost: 120, req: 'log_coin', max: 3 },
    log_supply: { branch: 'logi', name: '后勤补给', icon: '📦', desc: '击杀金币 +0.3', cost: 200, req: 'log_xp', max: 2 },
    log_start:  { branch: 'logi', name: '战术储备', icon: '🎖️', desc: '开局金币 +150', cost: 300, req: 'log_supply', max: 1 }
};

var TechTree = {
    /** 获取科技等级 */
    levelOf: function(profile, id) {
        return (profile.data.tech && profile.data.tech[id]) || 0;
    },
    /** 是否可升级(前置+上限) */
    canUpgrade: function(profile, id) {
        var def = TECH_DEFS[id];
        if (!def) return { ok: false, reason: 'invalid' };
        var lv = this.levelOf(profile, id);
        if (lv >= def.max) return { ok: false, reason: 'maxed' };
        if (def.req && this.levelOf(profile, def.req) < 1) return { ok: false, reason: 'locked' };
        return { ok: true, lv: lv, cost: def.cost };
    },
    /** 升级(原子) — 消耗科技点(techPoints), 与金币(profile.spend)无关 */
    upgrade: function(profile, id) {
        var check = this.canUpgrade(profile, id);
        if (!check.ok) return check;
        var tp = profile.data.techPoints || 0;
        if (tp < check.cost) return { ok: false, reason: 'insufficient' };
        profile.data.techPoints = tp - check.cost;
        if (!profile.data.tech) profile.data.tech = {};
        profile.data.tech[id] = (profile.data.tech[id] || 0) + 1;
        profile.save();
        return { ok: true, id: id, lv: profile.data.tech[id] };
    },
    /** 战斗属性汇总(供 combat/squad 读取) */
    combatStats: function(profile) {
        var d = profile.data;
        var t = d.tech || {};
        return {
            dmgBonus: this.levelOf(profile, 'fire_dmg'),
            rateBonus: 0.08 * this.levelOf(profile, 'fire_rate'),
            critBonus: 0.05 * this.levelOf(profile, 'fire_crit'),
            pierceBonus: this.levelOf(profile, 'fire_pierce'),
            explosive: this.levelOf(profile, 'fire_explo') > 0,
            startBonus: 2 * this.levelOf(profile, 'army_size'),
            limitBonus: 50 * this.levelOf(profile, 'army_limit'),
            regen: this.levelOf(profile, 'army_regen'),
            drBonus: 0.08 * this.levelOf(profile, 'army_shield'),
            coinMul: 1 + 0.15 * this.levelOf(profile, 'log_coin'),
            xpMul: 1 + 0.2 * this.levelOf(profile, 'log_xp'),
            coinPerKill: 0.3 * this.levelOf(profile, 'log_supply'),
            startCoins: 150 * this.levelOf(profile, 'log_start')
        };
    },
    /** 授予科技点(结算时) */
    grantTech: function(profile, amount) {
        if (!profile.data.techPoints) profile.data.techPoints = 0;
        profile.data.techPoints += Math.floor(amount);
        profile.save();
    }
};
