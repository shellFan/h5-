// ===== V6.0 肉鸽技能系统 =====
// 技能门(op:'skill')三选一; 技能有等级(重复选择升层), 立即生效。
// 配置集中: SKILL_DEFS。应用入口: Skills.apply(squad, id)。

var SKILL_DEFS = {
    rage: {
        name: '狂暴射击', icon: '🔥', maxLevel: 3, quality: 'epic',
        desc: '伤害 ×(1+0.35×层), 全局持续',
        apply: function(squad, lv) { squad._skillRage = lv; }
    },
    drone: {
        name: '支援无人机', icon: '🛰️', maxLevel: 3, quality: 'epic',
        desc: '每层射速 +15%(火力全开组合 +25%/层)', // V10.1: 文案对齐实现(射速乘区, 无独立僚机实体)
        apply: function(squad, lv) { squad._skillDrones = lv; }
    },
    venom: {
        name: '毒液弹头', icon: '🧫', maxLevel: 3, quality: 'rare',
        desc: '命中附加中毒, 每层每秒造成 20% 伤害持续2秒',
        apply: function(squad, lv) { squad._skillVenom = lv; }
    },
    shield: {
        name: '能量护盾', icon: '🔵', maxLevel: 3, quality: 'rare',
        desc: '每层抵挡 2 次致命伤害(受击后冷却6秒恢复)',
        apply: function(squad, lv) { squad._skillShieldMax = lv * 2; if (!squad._skillShield) squad._skillShield = squad._skillShieldMax; }
    },
    magnet: {
        name: '磁力吸附', icon: '🧲', maxLevel: 2, quality: 'common',
        desc: '击杀金币获取 ×(1+0.5×层)',
        apply: function(squad, lv) { squad._skillMagnet = lv; }
    },
    berserk: {
        name: '背水一战', icon: '⚔️', maxLevel: 2, quality: 'rare',
        desc: '人数低于一半时伤害 ×(1+0.5×层)',
        apply: function(squad, lv) { squad._skillBerserk = lv; }
    },
    // ===== V11.2: 分类补缺(攻击/防御/人数/经济; 与既有6技能不重复) =====
    swiftness: {
        name: '迅捷弹幕', icon: '💨', maxLevel: 3, quality: 'common',
        desc: '攻速 +12% 每层',
        apply: function(squad, lv) { squad._skillSwiftness = lv; }
    },
    deadly: {
        name: '致命精准', icon: '🎖️', maxLevel: 3, quality: 'rare',
        desc: '暴击率 +6% 每层',
        apply: function(squad, lv) { squad._skillDeadly = lv; squad.critChance = Math.min(0.8, squad.critChance + 0.06); }
    },
    executioner: {
        name: '处决者', icon: '🗡️', maxLevel: 3, quality: 'epic',
        desc: '暴击伤害 +25% 每层',
        apply: function(squad, lv) { squad._critMul = 0.25 * lv; }
    },
    pierce_master: {
        name: '穿甲弹头', icon: '🔩', maxLevel: 2, quality: 'rare',
        desc: '穿透 +1 每层(上限5)',
        apply: function(squad, lv) { squad.pierce = Math.min(5, squad.pierce + 1); }
    },
    harvest: {
        name: '亡者征召', icon: '🕯️', maxLevel: 2, quality: 'epic',
        desc: '击杀 5% 概率补充1名士兵 每层',
        apply: function(squad, lv) { squad._skillHarvest = lv; }
    },
    fortune: {
        name: '实战经验', icon: '📖', maxLevel: 2, quality: 'common',
        desc: '结算经验 +15% 每层',
        apply: function(squad, lv) { squad._skillFortune = lv; }
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
      desc: '护盾可用时伤害 +25%', apply: function(s) { s._comboGuardianFury = 1; } },
    // ===== V11.2: 流派组合 =====
    { id: 'fire_flow', name: '火力流派', icon: '☄️', req: { rage: 1, swiftness: 1 },
      desc: '伤害 +15% & 射速 +10%', apply: function(s) { s._comboFireFlow = 1; } },
    { id: 'pierce_flow', name: '穿透流派', icon: '➤', req: { pierce_master: 1, swiftness: 1 },
      desc: '弹丸穿透 +1', apply: function(s) { s._comboPierceFlow = 1; } },
    { id: 'swarm_flow', name: '虫群流派', icon: '🐜', req: { harvest: 1, magnet: 1 },
      desc: '征召概率 ×1.5', apply: function(s) { s._comboSwarmFlow = 1; } }
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
        squad._comboFireFlow = 0; squad._comboPierceFlow = 0; squad._comboSwarmFlow = 0;
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

    /** 技能品质标签(普通/稀有/史诗) V11.2 */
    qualityOf: function(id) {
        var def = SKILL_DEFS[id];
        return def && def.quality ? def.quality : 'common';
    },
    qualityName: function(id) {
        var q = this.qualityOf(id);
        return q === 'epic' ? '史诗' : q === 'rare' ? '稀有' : '普通';
    },
    /** V11.2: 职业倾向 — 偏好技能加权(副本进候选), 不排除其它技能 */
    CLASS_SKILL_BIAS: {
        rifleman: [],
        gunner: ['swiftness', 'swiftness', 'drone'],
        marksman: ['deadly', 'executioner', 'pierce_master'],
        medic: ['shield', 'harvest', 'magnet']
    },
    /** 门数据工厂: 未满级技能池按职业倾向加权随机3个不重复 */
    rollChoices: function(squad) {
        var pool = [];
        for (var id in SKILL_DEFS) {
            var lv = squad._skills ? (squad._skills[id] || 0) : 0;
            if (lv < SKILL_DEFS[id].maxLevel) pool.push(id);
        }
        if (!pool.length) return null;
        var weighted = pool.slice();
        var bias = (squad._gameRef && squad._gameRef._classStats && this.CLASS_SKILL_BIAS[squad._gameRef._classStats.id]) || [];
        for (var b = 0; b < bias.length; b++) {
            if (pool.indexOf(bias[b]) >= 0) weighted.push(bias[b]);
        }
        var picks = [];
        while (picks.length < 3 && weighted.length) {
            var pick = weighted.splice(Math.floor(Math.random() * weighted.length), 1)[0];
            if (picks.indexOf(pick) < 0) picks.push(pick);
        }
        return picks;
    }
};
