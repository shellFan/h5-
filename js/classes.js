// ===== VNext 职业系统 =====
// 四职业 = 小队编制原型(不替换现有士兵/武器/技能, 叠加生效)。
// 职业差异全部进入真实战斗: 伤害乘区/射速/穿透/暴击/减伤/弹速/精英伤害/战地回复。
// 职业技能为自动循环 buff(复用 squad 事件buff通道), 强度随士兵阶段(tier 0-4)成长。

var CLASS_DEFS = {
    rifleman: {
        id: 'rifleman', name: '枪械步兵', icon: '🎖️', color: '#4DA8FF',
        desc: '均衡输出的标准战线, 无短板',
        unlock: null, unlockText: '初始解锁',
        mods: { dmgMul: 1.0, rateMul: 1.0, critBonus: 0, pierce: 0, dr: 0, bulletSpeed: 1.0, eliteDmgMul: 1.0, regenN: 0 },
        skill: { name: '聚焦射击', icon: '🎯', cd: 26, firstCd: 10,
            desc: '全员伤害 ×1.5, 持续5秒',
            apply: function(s, tier) { s._evDmgMul = 1.5 + tier * 0.25; s._evDmgMulT = 5; } }
    },
    gunner: {
        id: 'gunner', name: '重装机枪手', icon: '🌀', color: '#FF8844',
        desc: '高射速压制: 射速×1.3 弹速+25% 减伤+8%, 单发×0.8',
        unlock: { clear: 2 }, unlockText: '通关第2关解锁',
        mods: { dmgMul: 0.8, rateMul: 1.3, critBonus: 0, pierce: 0, dr: 0.08, bulletSpeed: 1.25, eliteDmgMul: 1.0, regenN: 0 },
        skill: { name: '弹幕全开', icon: '💥', cd: 24, firstCd: 8,
            desc: '射速 ×2, 持续3秒',
            apply: function(s, tier) { s._evRateMul = 2 + tier * 0.25; s._evRateMulT = 3; } }
    },
    marksman: {
        id: 'marksman', name: '神射狙击', icon: '🎯', color: '#9C4DFF',
        desc: '单发×1.5 暴击+10% 穿透+1, 对精英/Boss ×1.25, 射速×0.75',
        unlock: { clear: 4 }, unlockText: '通关第4关解锁',
        mods: { dmgMul: 1.5, rateMul: 0.75, critBonus: 0.1, pierce: 1, dr: 0, bulletSpeed: 1.0, eliteDmgMul: 1.25, regenN: 0 },
        skill: { name: '穿甲弹匣', icon: '🔩', cd: 30, firstCd: 12,
            desc: '穿透 +2, 持续6秒',
            apply: function(s, tier) { s._evPierce = 2 + tier; s._evPierceT = 6; } }
    },
    medic: {
        id: 'medic', name: '战地军医', icon: '💉', color: '#39D98A',
        desc: '每10秒恢复2人, 减伤+10%, 单发×0.85',
        unlock: { clear: 6 }, unlockText: '通关第6关解锁',
        mods: { dmgMul: 0.85, rateMul: 1.0, critBonus: 0, pierce: 0, dr: 0.1, bulletSpeed: 1.0, eliteDmgMul: 1.0, regenN: 2, regenInterval: 10 },
        skill: { name: '战斗激励', icon: '🚑', cd: 28, firstCd: 14,
            desc: '全员暴击率 +15%, 持续6秒',
            apply: function(s, tier) { s._evCritBonus = 0.15 + tier * 0.05; s._evCritT = 6; } }
    }
};

var SoldierClass = {
    /** 当前职业配置(未选择默认步兵) */
    def: function(profile) {
        return CLASS_DEFS[(profile && profile.data && profile.data.classId)] || CLASS_DEFS.rifleman;
    },
    /** 是否可选(解锁条件) */
    canSelect: function(profile, id) {
        var def = CLASS_DEFS[id];
        if (!def) return { ok: false, reason: 'invalid' };
        if (!def.unlock) return { ok: true };
        if (!profile) return { ok: false, reason: 'no_profile' };
        if ((profile.data.unlockedLevel || 1) > def.unlock.clear) return { ok: true };
        return { ok: false, reason: 'locked', need: def.unlock.clear };
    },
    /** 选择职业(存档持久化) */
    select: function(profile, id) {
        var check = this.canSelect(profile, id);
        if (!check.ok) return check;
        profile.data.classId = id;
        profile.save();
        return { ok: true, id: id };
    },
    /** 技能强化档位(随士兵阶段 0-4): 新兵0/精锐1/特种2/王牌3/传奇4 */
    tier: function(profile) {
        if (typeof SoldierGrowth === 'undefined') return 0;
        var lv = SoldierGrowth.level(profile);
        return Math.min(4, Math.floor(lv / 10));
    },
    /** 战斗装配(每局 start() 调用一次) */
    combat: function(profile) {
        var def = this.def(profile);
        var m = def.mods;
        return {
            id: def.id, name: def.name, icon: def.icon, color: def.color,
            dmgMul: m.dmgMul, rateMul: m.rateMul, critBonus: m.critBonus, pierce: m.pierce,
            dr: m.dr, bulletSpeed: m.bulletSpeed, eliteDmgMul: m.eliteDmgMul,
            regenN: m.regenN, regenInterval: m.regenInterval || 10,
            skill: def.skill, tier: this.tier(profile)
        };
    }
};
