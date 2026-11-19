// ===== V6.0 挑战模式 + 每日任务 =====
// 挑战: 狂暴生存(无尽波次) / Boss试炼(连续Boss rush)
// 每日: 3个任务按日期种子从池中选出, 进度持久化, 奖励幂等

var CHALLENGE_MODES = {
    survival: {
        name: '无尽尸潮', icon: '🌊',
        desc: '无限波次，生存越久分越高',
        baseHp: 4, hpScale: 1.12, spawnRateMul: 1.2
    },
    boss_rush: {
        name: 'Boss试炼', icon: '👑',
        desc: '连续挑战强化Boss，击杀数=得分',
        baseHp: 6, hpScale: 1.25
    }
};

var DAILY_TASK_POOL_V2 = [
    { id: 'kill_100',  name: '消灭100只僵尸', target: 100, type: 'kills', reward: 60 },
    { id: 'kill_300',  name: '消灭300只僵尸', target: 300, type: 'kills', reward: 150 },
    { id: 'kill_500',  name: '消灭500只僵尸', target: 500, type: 'kills', reward: 250 },
    { id: 'clear_2',   name: '通关2个关卡',   target: 2,  type: 'wins',  reward: 100 },
    { id: 'clear_4',   name: '通关4个关卡',   target: 4,  type: 'wins',  reward: 200 },
    { id: 'clear_6',   name: '通关6个关卡',   target: 6,  type: 'wins',  reward: 300 },
    { id: 'squad_50',  name: '单局人数达50',  target: 50, type: 'squad', reward: 80 },
    { id: 'squad_100', name: '单局人数达100', target: 100, type: 'squad', reward: 150 },
    { id: 'squad_200', name: '单局人数达200', target: 200, type: 'squad', reward: 250 },
    { id: 'boss_1',    name: '击败1个Boss',   target: 1,  type: 'boss',  reward: 120 },
    { id: 'boss_3',    name: '击败3个Boss',   target: 3,  type: 'boss',  reward: 280 },
    { id: 'gate_5',    name: '穿过5扇状态门',  target: 5,  type: 'gates', reward: 60 },
    { id: 'gate_10',   name: '穿过10扇状态门', target: 10, type: 'gates', reward: 120 },
    { id: 'skill_2',   name: '选择2个技能',   target: 2,  type: 'skills', reward: 50 },
    { id: 'skill_4',   name: '选择4个技能',   target: 4,  type: 'skills', reward: 100 }
];

var DAILY_TASK_POOL = [
    { id: 'kill_100',  name: '消灭100只僵尸', target: 100, type: 'kills', reward: 60 },
    { id: 'kill_300',  name: '消灭300只僵尸', target: 300, type: 'kills', reward: 150 },
    { id: 'clear_2',   name: '通关2个关卡',   target: 2,  type: 'wins',  reward: 100 },
    { id: 'clear_4',   name: '通关4个关卡',   target: 4,  type: 'wins',  reward: 200 },
    { id: 'squad_50',  name: '单局人数达50',  target: 50, type: 'squad', reward: 80 },
    { id: 'boss_1',    name: '击败1个Boss',   target: 1,  type: 'boss',  reward: 120 },
    { id: 'gate_5',    name: '穿过5扇状态门',  target: 5,  type: 'gates', reward: 60 },
    { id: 'skill_2',   name: '选择2个技能',   target: 2,  type: 'skills', reward: 50 }
];

var ChallengeDaily = {
    _gameRef: null,
    /** 今日日期字符串(时区安全) */
    today: function() {
        var d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },

    /** 获取或初始化今日任务(种子随机选3个不重复) */
    ensureDaily: function(profile) {
        var today = this.today();
        var d = profile.data;
        if (d.daily && d.daily.date === today) return d.daily;
        var seed = today.split('-').reduce(function(a, b) { return (a * 31 + parseInt(b) || 0) >>> 0; }, 7);
        var pool = DAILY_TASK_POOL.slice();
        var picked = [];
        while (picked.length < 3 && pool.length) {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            picked.push(pool.splice(seed % pool.length, 1)[0]);
        }
        d.daily = {
            date: today,
            tasks: picked.map(function(t) { return { id: t.id, name: t.name, target: t.target, type: t.type, reward: t.reward, progress: 0, claimed: false }; })
        };
        profile.save();
        return d.daily;
    },

    /** 战斗内进度上报(V10 QA: 仅在进度实际变化时落盘, 原实现每次调用无条件save) */
    report: function(profile, type, amount) {
        var daily = this.ensureDaily(profile);
        var g = this._gameRef;
        var dirty = false;
        daily.tasks.forEach(function(t) {
            if (t.claimed) return;
            var before = t.progress;
            if (t.type === 'kills' && type === 'kills') t.progress = Math.min(t.target, g ? (g.enemies ? g.enemies.killCount : t.progress) : t.progress + amount);
            else if (t.type === 'squad' && type === 'squad' && g) t.progress = Math.min(t.target, Math.max(t.progress, g.maxCount || 0));
            else if (t.type === 'gates' && type === 'gates' && g) t.progress = Math.min(t.target, g.gates.chosenRows.size);
            else if (t.type === 'skills' && type === 'skills' && g) t.progress = Math.min(t.target, Object.keys(g.squad._skills || {}).length);
            else if (t.type === 'boss' && type === 'boss' && g) t.progress = Math.min(t.target, g.enemies.bossKills || 0);
            else if (t.type === 'wins' && type === 'wins') t.progress = Math.min(t.target, t.progress + amount);
            else if (t.type === 'clear' && type === 'wins') t.progress = Math.min(t.target, t.progress + amount);
            if (t.progress !== before) dirty = true;
        });
        if (dirty) profile.save();
    },

    /** 领取奖励(幂等) */
    claim: function(profile, index) {
        var daily = this.ensureDaily(profile);
        var t = daily.tasks[index];
        if (!t || t.claimed || t.progress < t.target) return false;
        t.claimed = true;
        profile.addCoins(t.reward);
        profile.save();
        return true;
    },

    /** 挑战模式开始: 返回配置 */
    startChallenge: function(type, levelIndex) {
        var cfg = CHALLENGE_MODES[type];
        if (!cfg) return null;
        return {
            type: type, name: cfg.name,
            hpMul: cfg.baseHp * Math.pow(cfg.hpScale || 1, levelIndex),
            waveMul: cfg.spawnRateMul || 1,
            kills: 0, waves: 0, time: 0
        };
    }
};

// ===== V8.0: 7天循环签到 =====
var SIGNIN_REWARDS = [80, 120, 150, 200, 250, 300, 500];

var SignInSystem = {
    /** 获取或初始化签到状态 */
    ensure: function(profile) {
        var d = profile.data;
        if (!d.signin) d.signin = { lastDate: '', streak: 0, totalDays: 0 };
        return d.signin;
    },
    today: function() {
        var d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },
    /** 今日是否可签(上次签到不是今天) */
    canSign: function(profile) {
        var si = this.ensure(profile);
        return si.lastDate !== this.today();
    },
    /** 签到(幂等: 同一天不重复) */
    sign: function(profile) {
        var si = this.ensure(profile);
        var today = this.today();
        if (si.lastDate === today) return false;
        si.streak = (si.streak % 7) + 1;
        si.totalDays++;
        si.lastDate = today;
        var reward = SIGNIN_REWARDS[(si.streak - 1) % 7];
        profile.addCoins(reward);
        profile.save();
        return { streak: si.streak, reward: reward };
    }
};
