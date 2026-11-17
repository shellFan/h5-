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

var Skills = {
    /** 应用技能层到 squad(叠加式, 幂等重算) */
    apply: function(squad, id) {
        if (!SKILL_DEFS[id]) return;
        if (!squad._skills) squad._skills = {};
        squad._skills[id] = Math.min(SKILL_DEFS[id].maxLevel, (squad._skills[id] || 0) + 1);
        SKILL_DEFS[id].apply(squad, squad._skills[id]);
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
