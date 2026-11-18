// ===== VNext 本地排行榜 =====
// 真实对局数据入库(结算时写入), 无任何伪造排名。平台排行(抖音/微信)预留适配点:
// Platform.leaderboard 可被平台适配器覆写 report/fetchTop; H5 默认实现=本地存档。

var LEADERBOARD_CAP = 20;

var Leaderboard = {
    /** 结算分: 击杀为主, 人数/连杀/通关加权 */
    scoreOf: function(run) {
        return Math.round((run.kills || 0) * 10 + (run.maxCount || 0) * 5 +
            (run.combo || 0) * 2 + (run.win ? 500 + (run.level || 0) * 100 : 0));
    },
    /** 写入一条真实战绩(结算调用; 保留前N名) */
    record: function(profile, run) {
        if (!profile) return null;
        var entry = {
            score: this.scoreOf(run),
            level: run.level || 0,
            win: !!run.win,
            kills: run.kills || 0,
            maxCount: run.maxCount || 0,
            combo: run.combo || 0,
            time: Math.round((run.time || 0) * 10) / 10,
            classId: run.classId || 'rifleman',
            challenge: run.challenge || null,
            ts: Date.now()
        };
        if (!profile.data.records) profile.data.records = [];
        profile.data.records.push(entry);
        profile.data.records.sort(function(a, b) { return b.score - a.score; });
        if (profile.data.records.length > LEADERBOARD_CAP) profile.data.records.length = LEADERBOARD_CAP;
        profile.save();
        // 平台排行上报(适配器可覆写; H5默认no-op本地已存)
        if (typeof Platform !== 'undefined') {
            if (!Platform.leaderboard) {
                Platform.leaderboard = {
                    report: function() { /* 本地已由 record 持久化 */ },
                    fetchTop: function(p, n) { return Leaderboard.top(p, n); }
                };
            }
            if (Platform.leaderboard.report) {
                try { Platform.leaderboard.report(entry); } catch (e) {}
            }
        }
        return entry;
    },
    /** 本地榜单(降序) */
    top: function(profile, n) {
        var list = (profile && profile.data.records) || [];
        return list.slice(0, n || LEADERBOARD_CAP);
    },
    /** 日期格式化(排名时间展示) */
    fmtDate: function(ts) {
        var d = new Date(ts);
        return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
            ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
};
