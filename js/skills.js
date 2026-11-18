// ===== V6.0 肉鸽技能系统 =====
// 技能门(op:'skill')三选一; 技能有等级(重复选择升层), 立即生效。
// 配置集中: SKILL_DEFS。应用入口: Skills.apply(squad, id)。

var SKILL_DEFS = {
    rage: {
        name: '狂暴射击', icon: '🔥', maxLevel: 3,
        desc: '伤害 ×(1+0.35×层), 全局持续',
        apply: function(squad, lv) { squad._skillRage = lv; }
    },
    drone: {
        name: '支援无人机', icon: '🛰️', maxLevel: 3,
        desc: '每层获得1架自动僚机(独立射击)',
        apply: function(squad, lv) { squad._skillDrones = lv; }
    },
    venom: {
        name: '毒液弹头', icon: '🧫', maxLevel: 3,
        desc: '命中附加中毒, 每层每秒造成 20% 伤害持续2秒',
        apply: function(squad, lv) { squad._skillVenom = lv; }
    },
    shield: {
        name: '能量护盾', icon: '🔵', maxLevel: 3,
        desc: '每层抵挡 2 次致命伤害(受击后冷却6秒恢复)',
        apply: function(squad, lv) { squad._skillShieldMax = lv * 2; if (!squad._skillShield) squad._skillShield = squad._skillShieldMax; }
    },
    magnet: {
        name: '磁力吸附', icon: '🧲', maxLevel: 2,
        desc: '击杀金币获取 ×(1+0.5×层)',
        apply: function(squad, lv) { squad._skillMagnet = lv; }
    },
    berserk: {
        name: '背水一战', icon: '⚔️', maxLevel: 2,
        desc: '人数低于一半时伤害 ×(1+0.5×层)',
        apply: function(squad, lv) { squad._skillBerserk = lv; }
    }
};

// ===== V8.0 技能组合 (同时持有特定技能时触发协同效果) =====
var SKILL_COMBOS = [
    { id: 'plague_fury',   name: '瘟疫狂怒', icon: '☠️', req: { rage: 1, venom: 1 },
      desc: '毒液伤害 ×2', apply: function(s) { s._comboPlagueFury = 1; } },
    { id: 'desperate_edge', name: '绝境锋芒', icon: '🗡️', req: { rage: 1, berserk: 1 },
      desc: '背水触发线提升至最大编制的60%', apply: function(s) { s._comboDesperate = 1; } },
    { id: 'swarm_venom',   name: '毒雾僚机', icon: '☣️', req: { drone: 1, venom: 1 },
      desc: '射速额外 +8%×毒液层', apply: function(s) { s._comboSwarmVenom = 1; } },
    { id: 'undying_will',  name: '不灭意志', icon: '🛡️', req: { shield: 1, berserk: 1 },
      desc: '护盾恢复冷却 6s → 3s', apply: function(s) { s._comboUndying = 1; } },
    { id: 'greed_fire',    name: '贪婪火力', icon: '💰', req: { magnet: 1, rage: 1 },
      desc: '击杀金币额外 +1 层磁力', apply: function(s) { s._comboGreedFire = 1; } },
    { id: 'recycle_drone', name: '回收无人机', icon: '♻️', req: { drone: 1, magnet: 1 },
      desc: '击杀 3% 概率补充1名士兵', apply: function(s) { s._comboRecycle = 1; } },
    { id: 'toxic_ward',    name: '毒性护盾', icon: '🧪', req: { venom: 1, shield: 1 },
      desc: '护盾格挡时毒化周围敌人', apply: function(s) { s._comboToxicWard = 1; } },
    { id: 'full_barrage',  name: '火力全开', icon: '🌪️', req: { rage: 1, drone: 1 },
      desc: '僚机射速加成 15% → 25% 每层', apply: function(s) { s._comboFullBarrage = 1; } },
    { id: 'venom_bounty',  name: '剧毒赏金', icon: '🪙', req: { venom: 1, magnet: 1 },
      desc: '击杀金币 +0.2/只', apply: function(s) { s._comboVenomBounty = 1; } },
    { id: 'guardian_fury', name: '守护之怒', icon: '⚔️', req: { shield: 1, rage: 1 },
      desc: '护盾可用时伤害 +25%', apply: function(s) { s._comboGuardianFury = 1; } }
];

var Skills = {
    /** 应用技能层到 squad(叠加式, 幂等重算) */
    apply: function(squad, id) {
        if (!SKILL_DEFS[id]) return;
        if (!squad._skills) squad._skills = {};
        squad._skills[id] = Math.min(SKILL_DEFS[id].maxLevel, (squad._skills[id] || 0) + 1);
        SKILL_DEFS[id].apply(squad, squad._skills[id]);
        this.checkCombos(squad);
    },

    /** V8.0: 重算全部组合(技能变化后调用, 幂等) */
    checkCombos: function(squad) {
        if (!squad._skills) return [];
        squad._comboPlagueFury = 0; squad._comboDesperate = 0; squad._comboSwarmVenom = 0;
        squad._comboUndying = 0; squad._comboGreedFire = 0; squad._comboRecycle = 0;
        squad._comboToxicWard = 0; squad._comboFullBarrage = 0; squad._comboVenomBounty = 0;
        squad._comboGuardianFury = 0;
        var active = [];
        for (var i = 0; i < SKILL_COMBOS.length; i++) {
            var c = SKILL_COMBOS[i], ok = true;
            for (var id in c.req) {
                if ((squad._skills[id] || 0) < c.req[id]) { ok = false; break; }
            }
            if (ok) { c.apply(squad); active.push(c); }
        }
        return active;
    },

    /** 击杀金币加成汇总(magnet技能+组合), 供结算读取 */
    coinBonus: function(squad) {
        var bonus = squad._skillMagnet || 0;
        if (squad._comboGreedFire) bonus += 1;
        if (squad._comboVenomBounty) bonus += 0.2;
        return bonus;
    },

    /** 门数据工厂: 从未满级技能池随机3个不重复 */
    rollChoices: function(squad) {
        var pool = [];
        for (var id in SKILL_DEFS) {
            var lv = squad._skills ? (squad._skills[id] || 0) : 0;
            if (lv < SKILL_DEFS[id].maxLevel) pool.push(id);
        }
        if (!pool.length) return null;
        var picks = [];
        var copy = pool.slice();
        while (picks.length < 3 && copy.length) {
            picks.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
        }
        return picks;
    },

    /** 技能门三选一 UI(3D门模型复用+技能标签) */
    createSkillGateModels: function(laneChoices, squad, z) {
        // 返回3个门数据(由 GateSystem.loadSkillChoice 生成)
        return laneChoices.map(function(id, lane) {
            var def = SKILL_DEFS[id];
            var lv = squad._skills ? (squad._skills[id] || 0) : 0;
            return { lane: lane, op: 'skill', value: id,
                label: def.icon + def.name + (lv > 0 ? ' Lv.' + (lv + 1) : ''), style: 'epic' };
        });
    }
};
