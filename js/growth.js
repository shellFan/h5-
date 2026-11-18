// ===== V8.0 士兵成长 + 装备 + 军团训练中心 =====
// SoldierProgressionManager / SoldierEquipmentManager / GrowthSaveManager
// 全部属性统一进入 profile.soldier / profile.equipment

// —— 士兵等级配置 (1-50, 每10级一个阶段) ——
var SOLDIER_TIERS = [
    { max: 10,  name: '新兵',   color: '#4DA8FF' },
    { max: 20,  name: '精锐',   color: '#39D98A' },
    { max: 30,  name: '特种兵', color: '#FFC247' },
    { max: 40,  name: '王牌',   color: '#FF8844' },
    { max: 50,  name: '传奇',   color: '#FF4444' }
];

var SOLDIER_LEVEL_COST = function(lv) { return Math.round(50 * Math.pow(1.15, lv - 1)); };

// 每级属性成长
var SOLDIER_LEVEL_STATS = function(lv) {
    return {
        dmgBonus: Math.floor(lv / 5),           // 每5级+1伤害
        hpBonus: lv * 2,                        // 每级+2生命
        rateBonus: lv * 0.008,                  // 每级+0.8%射速
        critBonus: Math.min(0.25, lv * 0.005),  // 每级+0.5%暴击(上限25%)
        drBonus: Math.min(0.3, lv * 0.006),     // 每级+0.6%减伤(上限30%)
        recruitBonus: Math.floor(lv / 10)       // 每10级+1初始人数
    };
};

// 阶段里程碑解锁
var SOLDIER_MILESTONES = {
    10: { unlock: '精锐外观', desc: '士兵头盔换为精锐蓝' },
    20: { unlock: '装备槽扩展', desc: '解锁战术装备栏' },
    30: { unlock: '特殊射击', desc: '子弹拖尾加长' },
    40: { unlock: '精英视觉', desc: '金色边框+专属徽章' },
    50: { unlock: '传奇外观', desc: '传奇红色外观+专属徽章' }
};

// —— 装备系统 ——
var EQUIP_SLOTS = ['helmet', 'vest', 'weapon', 'backpack', 'tactical', 'badge'];
var EQUIP_SLOT_NAMES = { helmet: '头盔', vest: '防弹衣', weapon: '主武器', backpack: '背包', tactical: '战术装备', badge: '军团徽章' };
var EQUIP_QUALITY = ['普通', '优秀', '稀有', '史诗', '传说'];
var EQUIP_QUALITY_COLORS = ['#B0B0B0', '#4DA8FF', '#9C4DFF', '#FFC247', '#FF4444'];

var EQUIPMENT_DEFS = {
    helmet_starter:  { slot: 'helmet',  name: '训练头盔',   quality: 0, attrs: { hpBonus: 5 } },
    helmet_ace:      { slot: 'helmet',  name: '王牌头盔',   quality: 3, attrs: { hpBonus: 30, drBonus: 0.05 }, unlock: { level: 30 } },
    vest_starter:    { slot: 'vest',    name: '训练防弹衣', quality: 0, attrs: { hpBonus: 8 } },
    vest_ace:        { slot: 'vest',    name: '王牌防弹衣', quality: 3, attrs: { hpBonus: 40, drBonus: 0.08 }, unlock: { level: 30 } },
    wpn_starter:     { slot: 'weapon',  name: '标准步枪',   quality: 0, attrs: { dmgBonus: 1 } },
    wpn_veteran:     { slot: 'weapon',  name: '老兵步枪',   quality: 2, attrs: { dmgBonus: 3, rateBonus: 0.05 }, unlock: { level: 15 } },
    pack_starter:    { slot: 'backpack',name: '标准背包',   quality: 0, attrs: { recruitBonus: 1 } },
    pack_elite:      { slot: 'backpack',name: '精锐背包',   quality: 2, attrs: { recruitBonus: 3, hpBonus: 10 }, unlock: { level: 20 } },
    tac_starter:     { slot: 'tactical',name: '基础战术装', quality: 0, attrs: { rateBonus: 0.03 } },
    tac_special:     { slot: 'tactical',name: '特种战术装', quality: 3, attrs: { rateBonus: 0.1, critBonus: 0.05 }, unlock: { level: 25 } },
    badge_starter:   { slot: 'badge',   name: '新兵徽章',   quality: 0, attrs: { critBonus: 0.02 } },
    badge_legend:    { slot: 'badge',   name: '传奇徽章',   quality: 4, attrs: { dmgBonus: 5, hpBonus: 25, critBonus: 0.08 }, unlock: { level: 45 } }
};

// 装备强化成本
var EQUIP_UPGRADE_COST = function(quality, level) {
    return Math.round(80 * Math.pow(1.3, level) * (1 + quality * 0.4));
};

var SoldierGrowth = {
    /** 士兵等级 */
    level: function(profile) { return (profile.data.soldier && profile.data.soldier.level) || 1; },
    xp: function(profile) { return (profile.data.soldier && profile.data.soldier.xp) || 0; },

    /** 升级所需金币 */
    upgradeCost: function(profile) {
        return SOLDIER_LEVEL_COST(this.level(profile));
    },

    /** 升级士兵(事务性: 失败不扣钱) */
    upgrade: function(profile) {
        var lv = this.level(profile);
        if (lv >= 50) return { ok: false, reason: 'maxed' };
        var cost = this.upgradeCost(profile);
        if (profile.coins < cost) return { ok: false, reason: 'insufficient', cost: cost };
        if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
        if (!profile.data.soldier) profile.data.soldier = { level: 1, xp: 0 };
        profile.data.soldier.level = lv + 1;
        profile.save();
        var milestone = SOLDIER_MILESTONES[lv + 1];
        return { ok: true, level: lv + 1, cost: cost, milestone: milestone || null };
    },

    /** 士兵属性汇总(等级+装备+科技合并) */
    stats: function(profile) {
        var lv = this.level(profile);
        var base = SOLDIER_LEVEL_STATS(lv);
        // 装备加成
        var eq = profile.data.equipment || {};
        for (var slot in eq) {
            var piece = eq[slot];
            if (!piece || !piece.attrs) continue;
            for (var k in piece.attrs) {
                base[k] = (base[k] || 0) + piece.attrs[k] * (piece.level || 1);
            }
        }
        return base;
    },

    /** 阶段名称 */
    tierName: function(profile) {
        var lv = this.level(profile);
        for (var i = SOLDIER_TIERS.length - 1; i >= 0; i--) {
            if (lv >= SOLDIER_TIERS[i].max - 9) return SOLDIER_TIERS[i];
        }
        return SOLDIER_TIERS[0];
    },

    /** 装备穿戴(替换或卸下) */
    equip: function(profile, slot, equipId) {
        if (!profile.data.equipment) profile.data.equipment = {};
        var def = EQUIPMENT_DEFS[equipId];
        if (!def || def.slot !== slot) return { ok: false, reason: 'invalid' };
        // 解锁条件检查
        if (def.unlock && def.unlock.level > this.level(profile)) {
            return { ok: false, reason: 'locked', need: def.unlock.level };
        }
        profile.data.equipment[slot] = { id: equipId, quality: def.quality, level: 1, attrs: def.attrs };
        profile.save();
        return { ok: true, slot: slot, equipId: equipId };
    },

    /** 装备强化(等级+1, 属性放大) */
    upgradeEquip: function(profile, slot) {
        var eq = profile.data.equipment;
        if (!eq || !eq[slot]) return { ok: false, reason: 'empty' };
        var piece = eq[slot];
        var cost = EQUIP_UPGRADE_COST(piece.quality, piece.level);
        if (profile.coins < cost) return { ok: false, reason: 'insufficient', cost: cost };
        if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
        piece.level++;
        profile.save();
        return { ok: true, slot: slot, level: piece.level, cost: cost };
    }
};

// —— 武器扩展 (6种武器 × 20级 × 4种进化) ——
var ARSENAL_DEFS = {
    assault:   { name: '突击步枪', icon: '🔫', type: 'single',   unlockLevel: 1,
        desc: '稳定单发', baseDmg: 1, baseRate: 2.2, basePierce: 0,
        dmgPerLv: 0.15, ratePerLv: 0.03, piercePer5: 1 },
    minigun:   { name: '加特林', icon: '🌀', type: 'rapid',    unlockLevel: 8,
        desc: '高速持续射击', baseDmg: 0.5, baseRate: 5.0, basePierce: 0,
        dmgPerLv: 0.08, ratePerLv: 0.12, piercePer5: 0 },
    shotgun:   { name: '霰弹枪', icon: '💥', type: 'spread',   unlockLevel: 12,
        desc: '多弹丸散射', baseDmg: 0.6, baseRate: 1.5, basePierce: 0, pellets: 4,
        dmgPerLv: 0.1, ratePerLv: 0.02, piercePer5: 0 },
    rocket:    { name: '火箭炮', icon: '🚀', type: 'explosive', unlockLevel: 16,
        desc: '范围爆炸', baseDmg: 2.5, baseRate: 0.8, basePierce: 0, blastRadius: 1.8,
        dmgPerLv: 0.4, ratePerLv: 0.015, piercePer5: 0 },
    freeze:    { name: '冰冻枪', icon: '❄️', type: 'freeze',   unlockLevel: 20,
        desc: '减速冻结', baseDmg: 0.8, baseRate: 1.8, basePierce: 0,
        dmgPerLv: 0.1, ratePerLv: 0.025, piercePer5: 0 },
    tesla:     { name: '电磁枪', icon: '⚡', type: 'chain',    unlockLevel: 24,
        desc: '链式攻击', baseDmg: 0.7, baseRate: 1.6, basePierce: 0,
        dmgPerLv: 0.12, ratePerLv: 0.02, piercePer5: 1 }
};

var EVOLUTIONS = {
    assault_piercing: { base: 'assault', name: '穿甲步枪', icon: '🎯', reqLv: 15,
        effect: { pierceBonus: 2, dmgMul: 1.5 }, desc: '高穿透+伤害提升' },
    minigun_storm:    { base: 'minigun', name: '风暴加特林', icon: '🌪️', reqLv: 18,
        effect: { rateMul: 1.4, dmgMul: 1.3 }, desc: '射速暴增' },
    rocket_hell:      { base: 'rocket', name: '地狱火箭', icon: '🌋', reqLv: 20,
        effect: { blastMul: 2, burnDmg: 3 }, desc: '爆炸范围翻倍+燃烧' },
    tesla_thunder:    { base: 'tesla', name: '雷霆电磁炮', icon: '⚡', reqLv: 20,
        effect: { chainMul: 2, dmgMul: 1.8 }, desc: '链式翻倍+伤害提升' }
};

var Arsenal = {
    /** 武器是否解锁 */
    unlocked: function(profile, id) {
        var def = ARSENAL_DEFS[id];
        if (!def) return false;
        if (id === 'assault') return true; // 默认武器
        var wl = profile.data.arsenal || {};
        return !!wl[id];
    },
    /** 武器等级 */
    level: function(profile, id) {
        var wl = profile.data.arsenal || {};
        return (wl[id] && wl[id].level) || 1;
    },
    /** 武器升级成本 */
    upgradeCost: function(profile, id) {
        var lv = this.level(profile, id);
        if (lv >= 20) return null;
        return Math.round(150 * Math.pow(1.12, lv - 1));
    },
    /** 武器升级 */
    upgrade: function(profile, id) {
        var cost = this.upgradeCost(profile, id);
        if (cost === null) return { ok: false, reason: 'maxed' };
        if (profile.coins < cost) return { ok: false, reason: 'insufficient', cost: cost };
        if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
        if (!profile.data.arsenal) profile.data.arsenal = {};
        if (!profile.data.arsenal[id]) profile.data.arsenal[id] = { unlocked: true, level: 1 };
        profile.data.arsenal[id].level++;
        profile.save();
        return { ok: true, id: id, level: profile.data.arsenal[id].level };
    },
    /** 解锁武器 */
    unlock: function(profile, id) {
        var def = ARSENAL_DEFS[id];
        if (!def) return { ok: false, reason: 'invalid' };
        if (this.unlocked(profile, id)) return { ok: false, reason: 'already' };
        var solLv = SoldierGrowth.level(profile);
        if (solLv < def.unlockLevel) return { ok: false, reason: 'level', need: def.unlockLevel };
        if (!profile.data.arsenal) profile.data.arsenal = {};
        profile.data.arsenal[id] = { unlocked: true, level: 1 };
        profile.save();
        return { ok: true, id: id };
    },
    /** 进化检查 */
    canEvolve: function(profile, id) {
        var def = ARSENAL_DEFS[id];
        if (!def) return { ok: false };
        for (var evoId in EVOLUTIONS) {
            var evo = EVOLUTIONS[evoId];
            if (evo.base !== id) continue;
            if (this.level(profile, id) >= evo.reqLv) {
                var wl = profile.data.arsenal || {};
                if (wl[id] && wl[id].evolved) return { ok: false, reason: 'already' };
                return { ok: true, evoId: evoId };
            }
        }
        return { ok: false, reason: 'level' };
    },
    /** 进化 */
    evolve: function(profile, id) {
        var check = this.canEvolve(profile, id);
        if (!check.ok) return check;
        if (!profile.data.arsenal) profile.data.arsenal = {};
        profile.data.arsenal[id].evolved = check.evoId;
        profile.save();
        return { ok: true, evolved: check.evoId };
    },
    /** 武器战斗属性 */
    stats: function(profile, id) {
        var def = ARSENAL_DEFS[id];
        if (!def) return null;
        var lv = this.level(profile, id);
        var wl = profile.data.arsenal || {};
        var evoId = (wl[id] && wl[id].evolved) || null;
        var evo = evoId ? EVOLUTIONS[evoId] : null;
        return {
            dmg: def.baseDmg + def.dmgPerLv * (lv - 1),
            rate: def.baseRate + def.ratePerLv * (lv - 1),
            pierce: def.basePierce + Math.floor(lv / 5) * (def.piercePer5 || 0),
            pellets: def.pellets || 1,
            blastRadius: def.blastRadius || 0,
            evolved: !!evo,
            evoName: evo ? evo.name : null,
            evoEffect: evo ? evo.effect : null
        };
    },
    /** 当前装备武器ID */
    equipped: function(profile) {
        return profile.data.equippedWeapon || 'assault';
    },
    /** 切换武器 */
    switchTo: function(profile, id) {
        if (!this.unlocked(profile, id)) return false;
        profile.data.equippedWeapon = id;
        profile.save();
        return true;
    }
};

// ===== VNext: 装备掉落 + 随机词条 + 背包 =====
// 掉落物为独立实例(词条随机), 与固定装备(EQUIPMENT_DEFS)共存:
// stats() 同时合并 piece.attrs(固定) 与 piece.affixes(随机词条), 全部真实进战斗。

var EQUIP_AFFIX_POOL = [
    { k: 'dmgBonus',     name: '伤害',      perQ: 1,    fmt: function(v) { return '+' + v; } },
    { k: 'hpBonus',      name: '生命',      perQ: 8,    fmt: function(v) { return '+' + v; } },
    { k: 'rateBonus',    name: '射速',      perQ: 0.02, fmt: function(v) { return '+' + Math.round(v * 100) + '%'; } },
    { k: 'critBonus',    name: '暴击率',    perQ: 0.02, fmt: function(v) { return '+' + Math.round(v * 100) + '%'; } },
    { k: 'drBonus',      name: '减伤',      perQ: 0.015, fmt: function(v) { return '+' + Math.round(v * 100) + '%'; } },
    { k: 'recruitBonus', name: '招募',      perQ: 0.6,  fmt: function(v) { return '+' + Math.max(1, Math.round(v)); } }
];
var EQUIP_AFFIX_MAX = 3; // 词条条数上限(按品质 1-3)
var EQUIP_NAME_PREFIX = ['哨兵', '猎手', '暴怒', '坚壁', '疾风', '掠夺', '王牌', '铁血'];
var EQUIP_BAG_CAP = 30;
var EQUIP_SELL_VALUE = function(quality, level) { return Math.round(40 * (1 + quality * 0.8) * (1 + (level - 1) * 0.3)); };

var EquipmentLoot = {
    _uid: 0,
    /** 生成一件掉落装备 */
    _makeItem: function(levelIndex, quality) {
        this._uid++;
        var slots = EQUIP_SLOTS;
        var slot = slots[Math.floor(Math.random() * slots.length)];
        // 词条数: 品质0→1条, 品质4→3条
        var affixCount = 1 + Math.min(EQUIP_AFFIX_MAX - 1, quality);
        var affixes = {};
        var poolCopy = EQUIP_AFFIX_POOL.slice();
        var lines = [];
        for (var i = 0; i < affixCount && poolCopy.length; i++) {
            var pool2 = poolCopy.splice(Math.floor(Math.random() * poolCopy.length), 1)[0];
            var scale = (1 + quality * 0.5) * (1 + Math.min(9, levelIndex) * 0.12);
            var raw = pool2.perQ * (0.7 + Math.random() * 0.6) * scale;
            var v = (pool2.k === 'rateBonus' || pool2.k === 'critBonus' || pool2.k === 'drBonus')
                ? Math.round(raw * 1000) / 1000 : Math.max(1, Math.round(raw));
            affixes[pool2.k] = v;
            lines.push(pool2.name + ' ' + pool2.fmt(v));
        }
        var prefix = EQUIP_NAME_PREFIX[Math.floor(Math.random() * EQUIP_NAME_PREFIX.length)];
        return {
            uid: Date.now().toString(36) + '_' + this._uid,
            slot: slot, name: prefix + EQUIP_SLOT_NAMES[slot],
            quality: quality, affixes: affixes, affixLines: lines,
            level: 1, ts: Date.now(), isNew: true
        };
    },
    /** 通关掉落: 1件保底 + 星级加成 */
    rollOnWin: function(profile, levelIndex, stars) {
        var drops = [];
        var count = 1 + (stars >= 2 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0);
        for (var i = 0; i < count; i++) {
            var q = this._rollQuality(levelIndex, true);
            drops.push(this._makeItem(levelIndex, q));
        }
        return this._store(profile, drops);
    },
    /** 失败掉落: 25%概率1件(保底参与感) */
    rollOnLose: function(profile, levelIndex) {
        if (Math.random() >= 0.25) return [];
        return this._store(profile, [this._makeItem(levelIndex, this._rollQuality(levelIndex, false))]);
    },
    _rollQuality: function(levelIndex, win) {
        // 品质权重随关卡推进右移: 普通/优秀/稀有/史诗/传说
        var r = Math.random() * 100;
        var shift = Math.min(20, levelIndex * 2.2) + (win ? 4 : 0);
        if (r > 97 - shift * 0.3) return 4;
        if (r > 88 - shift * 0.4) return 3;
        if (r > 70 - shift * 0.5) return 2;
        if (r > 42 - shift * 0.3) return 1;
        return 0;
    },
    _store: function(profile, drops) {
        if (!profile || !drops.length) return [];
        if (!profile.data.bag) profile.data.bag = [];
        var bag = profile.data.bag;
        for (var i = 0; i < drops.length && bag.length < EQUIP_BAG_CAP; i++) bag.push(drops[i]);
        profile.save();
        return drops;
    },
    /** 背包穿装(同槽互换: 旧装备回背包) */
    equipFromBag: function(profile, uid) {
        var bag = profile.data.bag || [];
        var idx = -1;
        for (var i = 0; i < bag.length; i++) if (bag[i].uid === uid) { idx = i; break; }
        if (idx < 0) return { ok: false, reason: 'missing' };
        var item = bag.splice(idx, 1)[0];
        if (!profile.data.equipment) profile.data.equipment = {};
        var old = profile.data.equipment[item.slot];
        profile.data.equipment[item.slot] = item;
        if (old && old.uid) bag.push(old); // 掉落装备互换回背包; 固定新手装被替换即退役
        profile.save();
        return { ok: true, slot: item.slot, replaced: !!(old && old.uid) };
    },
    /** 分解 → 金币 */
    sellEquip: function(profile, uid) {
        var bag = profile.data.bag || [];
        for (var i = 0; i < bag.length; i++) {
            if (bag[i].uid === uid) {
                var it = bag[i];
                var value = EQUIP_SELL_VALUE(it.quality, it.level);
                bag.splice(i, 1);
                profile.addCoins(value);
                return { ok: true, value: value };
            }
        }
        return { ok: false, reason: 'missing' };
    },
    /** 背包装备强化(词条×等级成长) */
    upgradeBagEquip: function(profile, uid) {
        var bag = profile.data.bag || [];
        for (var i = 0; i < bag.length; i++) {
            if (bag[i].uid === uid) {
                var it = bag[i];
                if (it.level >= 10) return { ok: false, reason: 'maxed' };
                var cost = EQUIP_UPGRADE_COST(it.quality, it.level);
                if (profile.coins < cost) return { ok: false, reason: 'insufficient', cost: cost };
                if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
                it.level++;
                it.isNew = false;
                profile.save();
                return { ok: true, level: it.level };
            }
        }
        return { ok: false, reason: 'missing' };
    }
};

// VNext: SoldierGrowth.stats 合并随机词条(×等级成长, 与固定装备一致)
// (原 stats 已遍历 eq[slot].attrs — 此处扩展读取 affixes)
(function() {
    var baseStats = SoldierGrowth.stats;
    SoldierGrowth.stats = function(profile) {
        var out = baseStats.call(SoldierGrowth, profile);
        var eq = profile.data.equipment || {};
        for (var slot in eq) {
            var piece = eq[slot];
            if (!piece || !piece.affixes) continue;
            var mul = piece.level || 1;
            for (var k in piece.affixes) {
                out[k] = (out[k] || 0) + piece.affixes[k] * mul;
            }
        }
        return out;
    };
})();
