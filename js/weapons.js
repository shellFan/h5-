// ===== V8.0 武器系统 =====
// 8种武器 × 5级升级 × 进化路线。战斗效果真实注入 combat.js。
// 配置集中: WEAPON_DEFS / EVOLUTION_DEFS。应用: WeaponSystem。

var WEAPON_DEFS = {
    rifle: {
        name: '标准步枪', icon: '🔫', type: 'single',
        desc: '稳定单体伤害',
        unlockCondition: null,
        levels: [{ dmg: 1 }, { dmg: 1.3 }, { dmg: 1.6 }, { dmg: 2 }, { dmg: 2.5 }],
        effect: function(lv) { return { dmgMul: [1, 1.3, 1.6, 2, 2.5][lv] }; }
    },
    shotgun: {
        name: '散弹枪', icon: '💥', type: 'spread',
        desc: '多发弹丸扇形范围',
        unlockCondition: { type: 'clear', level: 1 },
        levels: [{ pellets: 3, dmg: 0.5 }, { pellets: 4, dmg: 0.6 }, { pellets: 5, dmg: 0.7 }, { pellets: 6, dmg: 0.8 }, { pellets: 7, dmg: 1 }],
        effect: function(lv) { return { pellets: [3,4,5,6,7][lv], dmgMul: [0.5,0.6,0.7,0.8,1][lv] }; }
    },
    sniper: {
        name: '狙击枪', icon: '🎯', type: 'pierce',
        desc: '高伤害+穿透1',
        unlockCondition: { type: 'clear', level: 1 },
        levels: [{ dmg: 3, pierce: 1 }, { dmg: 4, pierce: 1 }, { dmg: 5, pierce: 2 }, { dmg: 6, pierce: 2 }, { dmg: 8, pierce: 3 }],
        effect: function(lv) { return { dmgMul: [3,4,5,6,8][lv], pierceBonus: [1,1,2,2,3][lv] }; }
    },
    mg: {
        name: '机枪', icon: '🌀', type: 'rapid',
        desc: '射速×2.5',
        unlockCondition: { type: 'clear', level: 2 },
        levels: [{ rateMul: 2 }, { rateMul: 2.3 }, { rateMul: 2.6 }, { rateMul: 2.9 }, { rateMul: 3.2 }],
        effect: function(lv) { return { rateMul: [2,2.3,2.6,2.9,3.2][lv], dmgMul: 0.55 }; }
    },
    flamethrower: {
        name: '火焰喷射器', icon: '🔥', type: 'cone',
        desc: '持续范围燃烧',
        unlockCondition: { type: 'clear', level: 3 },
        levels: [{ dmg: 0.8, radius: 1.2 }, { dmg: 1, radius: 1.4 }, { dmg: 1.2, radius: 1.6 }, { dmg: 1.5, radius: 1.8 }, { dmg: 1.8, radius: 2 }],
        effect: function(lv) { return { dmgMul: [0.8,1,1.2,1.5,1.8][lv], radius: [1.2,1.4,1.6,1.8,2][lv] }; }
    },
    rocket: {
        name: '火箭炮', icon: '🚀', type: 'explosive',
        desc: '范围爆炸伤害',
        unlockCondition: { type: 'clear', level: 3 },
        levels: [{ dmg: 3, radius: 1.5 }, { dmg: 4, radius: 1.7 }, { dmg: 5, radius: 2 }, { dmg: 6, radius: 2.2 }, { dmg: 8, radius: 2.5 }],
        effect: function(lv) { return { dmgMul: [3,4,5,6,8][lv], radius: [1.5,1.7,2,2.2,2.5][lv] }; }
    },
    freeze: {
        name: '冰冻枪', icon: '❄️', type: 'freeze',
        desc: '命中减速+冻结',
        unlockCondition: { type: 'clear', level: 4 },
        levels: [{ slow: .4 }, { slow: .5 }, { slow: .6 }, { slow: .7 }, { slow: .8 }],
        effect: function(lv) { return { slowMul: [0.4,0.5,0.6,0.7,0.8][lv], dmgMul: 0.8 }; }
    },
    tesla: {
        name: '电磁枪', icon: '⚡', type: 'chain',
        desc: '连锁闪电攻击',
        unlockCondition: { type: 'clear', level: 4 },
        levels: [{ chain: 2 }, { chain: 3 }, { chain: 4 }, { chain: 5 }, { chain: 6 }],
        effect: function(lv) { return { chain: [2,3,4,5,6][lv], dmgMul: 0.7 }; }
    }
};

var EVOLUTION_DEFS = {
    storm_mg: {
        base: 'mg', req: { rapid: 2 },
        name: '风暴机枪', icon: '🌪️',
        desc: '射速×4 + 双弹道',
        effect: { rateMul: 4, dmgMul: 0.6, dualLane: true }
    },
    hell_rocket: {
        base: 'rocket', req: { explosive: 2 },
        name: '地狱火箭', icon: '🌋',
        desc: '爆炸半径×2 + 持续燃烧',
        effect: { dmgMul: 4, radius: 3.5, burn: true }
    },
    arctic_pierce: {
        base: 'freeze', req: { pierce: 2 },
        name: '极寒穿透炮', icon: '🧊',
        desc: '冰冻+穿透3+伤害提升',
        effect: { slowMul: 0.8, pierceBonus: 3, dmgMul: 1.5 }
    },
    thunder_chain: {
        base: 'tesla', req: { crit: 2 },
        name: '雷霆链式炮', icon: '⚡',
        desc: '连锁+暴击率+15%',
        effect: { chain: 8, critBonus: 0.15, dmgMul: 1 }
    }
};

var WeaponSystem = {
    /** 获取当前武器(存档持久化) */
    current: function(profile) { return profile.data.weapon || 'rifle'; },
    level: function(profile) { return profile.data.weaponLevel || 0; },
    evolved: function(profile) { return profile.data.weaponEvolved || null; },

    /** 解析当前武器战斗参数 */
    stats: function(profile) {
        var id = this.current(profile);
        var lv = this.level(profile);
        var def = WEAPON_DEFS[id];
        var evo = this.evolved(profile);
        var evoDef = evo ? EVOLUTION_DEFS[evo] : null;
        var base = def.effect(lv);
        if (evoDef) {
            var e = evoDef.effect;
            for (var k in e) base[k] = e[k];
            base.evolvedName = evoDef.name;
        }
        return base;
    },

    /** 解锁/切换/升级/进化 */
    canUnlock: function(profile, id) {
        var def = WEAPON_DEFS[id];
        if (!def || !def.unlockCondition) return false;
        var cond = def.unlockCondition;
        if (cond.type === 'clear') return (profile.data.unlockedLevel || 1) > cond.level;
        return false;
    },
    switchTo: function(profile, id) {
        if (WEAPON_DEFS[id]) { profile.data.weapon = id; profile.save(); return true; }
        return false;
    },
    upgradeCost: function(profile) {
        var lv = this.level(profile);
        return [200, 400, 700, 1100, 1600][lv] || null;
    },
    upgrade: function(profile) {
        var cost = this.upgradeCost(profile);
        if (cost === null) return { ok: false, reason: 'maxed' };
        if (profile.coins < cost) return { ok: false, reason: 'insufficient' };
        if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
        profile.data.weaponLevel = (profile.data.weaponLevel || 0) + 1;
        profile.save();
        return { ok: true, level: profile.data.weaponLevel };
    },
    /** 进化: 检查前置科技 */
    canEvolve: function(profile) {
        var id = this.current(profile);
        var evoId = null;
        for (var k in EVOLUTION_DEFS) { if (EVOLUTION_DEFS[k].base === id) { evoId = k; break; } }
        if (!evoId) return { ok: false, reason: 'no_evolution' };
        if (this.evolved(profile)) return { ok: false, reason: 'already_evolved' };
        var def = EVOLUTION_DEFS[evoId];
        if (!def.req) return { ok: true, evoId: evoId };
        for (var tech in def.req) {
            if ((profile.data.tech || {})[tech] < def.req[tech]) return { ok: false, reason: 'tech_required', tech: tech, need: def.req[tech] };
        }
        return { ok: true, evoId: evoId };
    },
    evolve: function(profile) {
        var check = this.canEvolve(profile);
        if (!check.ok) return check;
        profile.data.weaponEvolved = check.evoId;
        profile.save();
        return { ok: true, evolved: check.evoId };
    }
};
