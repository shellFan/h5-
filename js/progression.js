// ===== V6.0 进度系统: 星级 / 玩家经验等级 / 成就 / 存档迁移 v2 =====
// 依赖 economy.js 的 GameProfile(存档)。所有奖励发放幂等(claimedRewards 账本)。

var STAR_RULES = {
    // 每关二星=通关且结算人数≥star2Count; 三星=二星且击杀≥star3Kills
    L1: { star2Count: 25, star3Kills: 80 },
    L2: { star2Count: 40, star3Kills: 130 },
    L3: { star2Count: 45, star3Kills: 200 },
    L4: { star2Count: 60, star3Kills: 260 },
    L5: { star2Count: 90, star3Kills: 350 },
    L6: { star2Count: 110, star3Kills: 500 }
};

var XP_RULES = {
    basePerWin: 120,        // 通关基础经验
    perKill: 1,             // 每击杀经验
    perStar: 80,            // 每颗星经验(首获)
    firstClearBonus: 200,   // 首次通关额外
    levelCurve: function(level) { return Math.round(300 * Math.pow(level, 1.35)); } // 升到 level+1 需要的累计经验
};

var ACHIEVEMENT_DEFS = [
    { id: 'first_blood',  name: '初战告捷',   icon: '🩸', desc: '完成第一关',        reward: 50 },
    { id: 'squad_100',    name: '百人军团',   icon: '🎖️', desc: '单局人数达到100',   reward: 80 },
    { id: 'squad_300',    name: '三百勇士',   icon: '🏅', desc: '单局人数达到300',   reward: 150 },
    { id: 'squad_500',    name: '五百膨胀',   icon: '🏆', desc: '单局人数达到500',   reward: 260 },
    { id: 'kills_500',    name: '屠戮者',     icon: '⚔️', desc: '累计击杀500只僵尸',  reward: 80 },
    { id: 'kills_2000',   name: '尸潮收割机', icon: '💀', desc: '累计击杀2000只僵尸', reward: 180 },
    { id: 'kills_5000',   name: '末日清道夫', icon: '☠️', desc: '累计击杀5000只僵尸', reward: 320 },
    { id: 'boss_first',   name: '弑君者',     icon: '👑', desc: '首次击败Boss',      reward: 120 },
    { id: 'boss_5',       name: 'Boss猎人',   icon: '🗡️', desc: '累计击败5个Boss',    reward: 240 },
    { id: 'clear_l3',     name: '破盾者',     icon: '🛡️', desc: '通过第3关盾牌军团',   reward: 100 },
    { id: 'clear_l5',     name: '终焉突破',   icon: '🔮', desc: '通过第5关',         reward: 160 },
    { id: 'clear_l6',     name: '末日终结者', icon: '🌟', desc: '通过第6关末日核心',   reward: 300 },
    { id: 'perfect_l1',   name: '新兵模范',   icon: '⭐', desc: '第1关获得三星',      reward: 100 },
    { id: 'perfect_l6',   name: '传奇指挥官', icon: '✨', desc: '第6关获得三星',      reward: 500 },
    { id: 'stars_9',      name: '星尘收藏家', icon: '🌠', desc: '累计获得9颗星',      reward: 150 },
    { id: 'stars_15',     name: '银河战星',   icon: '🌌', desc: '累计获得15颗星',     reward: 280 },
    { id: 'wins_10',      name: '常胜将军',   icon: '🎉', desc: '累计通关10次',      reward: 140 },
    { id: 'upgrades_10',  name: '军火大亨',   icon: '🏭', desc: '永久升级总等级达10', reward: 160 },
    { id: 'rich_2000',    name: '战地富豪',   icon: '💰', desc: '同时持有2000金币',   reward: 120 },
    { id: 'player_10',    name: '身经百战',   icon: '📈', desc: '玩家等级达到10级',   reward: 200 },
    { id: 'player_20',    name: '战场老兵',   icon: '🎖️', desc: '玩家等级达到20级',   reward: 400 },
    { id: 'clear_l7',     name: '巢穴猎人',   icon: '🕳️', desc: '通过第7关地下巢穴',   reward: 350 },
    { id: 'clear_l8',     name: '机械终结',   icon: '🤖', desc: '通过第8关机械废土',   reward: 400 },
    { id: 'clear_l9',     name: '防线突破',   icon: '🏰', desc: '通过第9关最终防线',   reward: 450 },
    { id: 'clear_l10',    name: '末日降临',   icon: '🌍', desc: '通过第10关终极末日',   reward: 600 },
    { id: 'perfect_l5',   name: '防线守护',   icon: '🌟', desc: '第5关获得三星',      reward: 250 },
    { id: 'perfect_l2',   name: '街区清理',   icon: '⭐', desc: '第2关获得三星',      reward: 100 },
    { id: 'perfect_l3',   name: '实验突破',   icon: '⭐', desc: '第3关获得三星',      reward: 120 },
    { id: 'perfect_l4',   name: '工业毁灭',   icon: '⭐', desc: '第4关获得三星',      reward: 140 },
    { id: 'boss_10',      name: '屠君者',     icon: '🔪', desc: '累计击败10个Boss',   reward: 350 },
    { id: 'boss_20',      name: 'Boss终结者', icon: '💀', desc: '累计击败20个Boss',   reward: 500 },
    { id: 'elite_50',     name: '精英猎手',   icon: '🎯', desc: '累计击杀50个精英',   reward: 200 },
    { id: 'elite_100',    name: '精英屠戮',   icon: '⚔️', desc: '累计击杀100个精英',  reward: 350 },
    { id: 'kills_10000',  name: '僵尸末日',   icon: '💀', desc: '累计击杀10000只僵尸', reward: 500 },
    { id: 'wins_25',      name: '胜利之师',   icon: '🎊', desc: '累计通关25次',      reward: 280 },
    { id: 'rich_5000',    name: '战争财阀',   icon: '💎', desc: '同时持有5000金币',   reward: 200 },
    { id: 'weapon_evo',   name: '武器大师',   icon: '🔧', desc: '进化一把武器',      reward: 200 },
    { id: 'tech_5',       name: '科学家',     icon: '🔬', desc: '科技树升级5次',     reward: 180 },
    { id: 'upgrades_20',  name: '军备竞赛',   icon: '🏭', desc: '永久升级总等级达20', reward: 300 },
    { id: 'sign_7',       name: '七日忠诚',   icon: '📅', desc: '连续签到7天',      reward: 250 }
];

var Progression = {
    /** V5.1.5→V6.0 存档迁移: 补默认字段, 不动旧数据 */
    migrate: function(data) {
        if ((data.profileVersion || 0) >= 2) return data;
        data.profileVersion = 2;
        if (!data.stars) data.stars = {};
        if (data.xp === undefined) data.xp = 0;
        if (data.playerLevel === undefined) data.playerLevel = 1;
        if (!data.achievements) data.achievements = {};
        if (!data.stats) data.stats = { bossKills: 0, eliteKills: 0, playTime: 0 };
        if (data.totalWins === undefined) data.totalWins = 0;
        if (data.totalKills === undefined) data.totalKills = 0;
        if (data.bestSquadCount === undefined) data.bestSquadCount = 0;
        return data;
    },

    /** 星级评定: win + 人数/击杀门槛 → 0-3 */
    computeStars: function(level, endCount, kills, won) {
        if (!won) return 0;
        var rule = STAR_RULES['L' + (level + 1)] || STAR_RULES.L1;
        var stars = 1;
        if (endCount >= rule.star2Count) stars = 2;
        if (stars === 2 && kills >= rule.star3Kills) stars = 3;
        return stars;
    },

    /** 经验→等级(累计经验制) */
    levelFromXp: function(xp) {
        var level = 1, need = 0;
        while (level < 99) {
            need += XP_RULES.levelCurve(level);
            if (xp < need) break;
            level++;
        }
        return { level: level, nextNeed: need };
    },

    /** 结算经验(幂等由调用方保证: 首通/星级奖励走 claimedRewards) */
    computeXp: function(kills, won, levelIndex, newStars) {
        var xp = kills * XP_RULES.perKill;
        if (won) xp += XP_RULES.basePerWin + levelIndex * 30;
        if (newStars > 0) xp += newStars * XP_RULES.perStar;
        return xp;
    },

    /** 成就检测: 返回新解锁的成就列表(自动入账claimedRewards发奖金) */
    checkAchievements: function(profile) {
        var d = profile.data;
        var totalStars = 0;
        for (var k in d.stars) totalStars += d.stars[k] || 0;
        var upgradeTotal = 0;
        for (var u in d.upgrades) upgradeTotal += d.upgrades[u] || 0;
        var pl = Progression.levelFromXp(d.xp || 0).level;
        var conditions = {
            first_blood: (d.unlockedLevel || 1) >= 2,
            squad_100: (d.bestSquadCount || 0) >= 100,
            squad_300: (d.bestSquadCount || 0) >= 300,
            squad_500: (d.bestSquadCount || 0) >= 500,
            kills_500: (d.totalKills || 0) >= 500,
            kills_2000: (d.totalKills || 0) >= 2000,
            kills_5000: (d.totalKills || 0) >= 5000,
            boss_first: (d.stats && d.stats.bossKills || 0) >= 1,
            boss_5: (d.stats && d.stats.bossKills || 0) >= 5,
            clear_l3: (d.unlockedLevel || 1) >= 4,
            clear_l5: (d.unlockedLevel || 1) >= 6,
            clear_l6: !!d.achievements_meta && d.achievements_meta.clear_l6,
            perfect_l1: (d.stars && d.stars.L1) === 3,
            perfect_l6: (d.stars && d.stars.L6) === 3,
            stars_9: totalStars >= 9,
            stars_15: totalStars >= 15,
            wins_10: (d.totalWins || 0) >= 10,
            upgrades_10: upgradeTotal >= 10,
            rich_2000: (d.coins || 0) >= 2000,
            player_10: pl >= 10,
            player_20: pl >= 20,
            clear_l7: (d.unlockedLevel || 1) >= 8,
            clear_l8: (d.unlockedLevel || 1) >= 9,
            clear_l9: (d.unlockedLevel || 1) >= 10,
            clear_l10: !!d.achievements_meta && d.achievements_meta.clear_l10,
            perfect_l5: (d.stars && d.stars.L5) === 3,
            perfect_l2: (d.stars && d.stars.L2) === 3,
            perfect_l3: (d.stars && d.stars.L3) === 3,
            perfect_l4: (d.stars && d.stars.L4) === 3,
            boss_10: (d.stats && d.stats.bossKills || 0) >= 10,
            boss_20: (d.stats && d.stats.bossKills || 0) >= 20,
            elite_50: (d.stats && d.stats.eliteKills || 0) >= 50,
            elite_100: (d.stats && d.stats.eliteKills || 0) >= 100,
            kills_10000: (d.totalKills || 0) >= 10000,
            wins_25: (d.totalWins || 0) >= 25,
            rich_5000: (d.coins || 0) >= 5000,
            weapon_evo: !!(d.weaponEvolved),
            tech_5: (function() { var t = d.tech || {}; var total = 0; for (var k in t) total += t[k]; return total >= 5; })(),
            upgrades_20: (function() { var t = d.upgrades || {}; var total = 0; for (var k in t) total += t[k]; return total >= 20; })(),
            sign_7: (d.signin && d.signin.streak || 0) >= 7
        };
        var newly = [];
        for (var i = 0; i < ACHIEVEMENT_DEFS.length; i++) {
            var def = ACHIEVEMENT_DEFS[i];
            if (conditions[def.id] && !profile.hasClaimed('ach:' + def.id)) {
                profile.claimReward('ach:' + def.id, def.reward);
                newly.push(def);
            }
        }
        return newly;
    }
};
