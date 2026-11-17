// ===== V6.0 UI 模块: 关卡地图 / 成就页 / 设置页 / 首页成长信息 =====
// 由 V42Art.installUI 后调用 V60UI.install(game) 装配; 全部数据来自 GameProfile。

var V60UI = {
    LEVEL_META: [
        { key: 'L1', name: '新兵训练营', icon: '🏕️', threat: '低' },
        { key: 'L2', name: '废弃街区', icon: '🏙️', threat: '中' },
        { key: 'L3', name: '变异实验室', icon: '🧪', threat: '中高' },
        { key: 'L4', name: '病毒隔离区', icon: '☣️', threat: '高' },
        { key: 'L5', name: '最终防线', icon: '🛡️', threat: '极高' },
        { key: 'L6', name: '末日核心', icon: '☢️', threat: '终局' }
    ],

    install: function(game) {
        this.game = game;
        if (typeof ChallengeDaily !== 'undefined') ChallengeDaily._gameRef = game;
        var container = document.getElementById('game-container');
        if (!container || document.getElementById('v60-map-page')) return;

        // —— 页面骨架(地图/成就/设置) ——
        container.insertAdjacentHTML('beforeend',
            '<div id="v60-daily-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">每日作战令</div>' +
                    '<h2 class="v60-page-title">每日任务</h2>' +
                    '<div id="v60-daily-list" class="v60-ach-list"></div>' +
                    '<button id="v60-daily-back" class="btn-primary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-map-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker">作战地图 · 六大防区</div>' +
                    '<h2 class="v60-page-title">关卡地图</h2>' +
                    '<div class="v60-map-stats" id="v60-map-stats"></div>' +
                    '<div id="v60-map-nodes" class="v60-map-nodes"></div>' +
                    '<button id="v60-map-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-ach-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">荣誉殿堂</div>' +
                    '<h2 class="v60-page-title">成就</h2>' +
                    '<div id="v60-ach-list" class="v60-ach-list"></div>' +
                    '<button id="v60-ach-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-settings-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker">系统</div>' +
                    '<h2 class="v60-page-title">设置</h2>' +
                    '<div class="v60-setting-row"><span>音效</span><button id="v60-set-sound" class="v60-toggle"></button></div>' +
                    '<div class="v60-setting-row"><span>画质</span><button id="v60-set-quality" class="v60-toggle"></button></div>' +
                    '<div class="v60-setting-row"><span>屏幕震动</span><button id="v60-set-shake" class="v60-toggle"></button></div>' +
                    '<div class="v60-saveinfo" id="v60-saveinfo"></div>' +
                    '<button id="v60-set-back" class="btn-primary">返回</button>' +
                '</div>' +
            '</div>');

        // —— 首页按钮组 ——
        var startPanel = document.querySelector('#start-screen .title-panel');
        if (startPanel && !document.getElementById('v60-home-nav')) {
            startPanel.insertAdjacentHTML('beforeend',
                '<div id="v60-home-nav" class="v60-home-nav">' +
                    '<button id="v60-btn-map" class="v60-nav-btn">🗺️ 作战地图</button>' +
                    '<button id="v60-btn-ach" class="v60-nav-btn">🏅 成就</button>' +
                    '<button id="v60-btn-daily" class="v60-nav-btn">📋 每日</button>' +
                    '<button id="v60-btn-set" class="v60-nav-btn">⚙️ 设置</button>' +
                '</div>' +
                '<div id="v60-home-growth" class="v60-home-growth"></div>');
        }

        // —— 事件 ——
        var self = this;
        document.getElementById('v60-btn-map').onclick = function() { game._sfx('click'); self.showPage('v60-map-page'); self.renderMap(game); };
        document.getElementById('v60-btn-ach').onclick = function() { game._sfx('click'); self.showPage('v60-ach-page'); self.renderAchievements(game); };
        document.getElementById('v60-btn-set').onclick = function() { game._sfx('click'); self.showPage('v60-settings-page'); self.renderSettings(game); };
        document.getElementById('v60-btn-daily').onclick = function() { game._sfx('click'); self.showPage('v60-daily-page'); self.renderDaily(game); };
        document.getElementById('v60-map-back').onclick = document.getElementById('v60-ach-back').onclick =
            function() { game._sfx('click'); self.hidePages(); };
        document.getElementById('v60-daily-back').onclick = function() { game._sfx('click'); self.hidePages(); };
        document.getElementById('v60-set-back').onclick = function() { game._sfx('click'); self.hidePages(); };
        document.getElementById('v60-set-sound').onclick = function() {
            if (typeof Platform !== 'undefined' && Platform.audio) {
                Platform.audio.setMuted(!Platform.audio.isMuted());
                game._updateSoundLabel();
                self.renderSettings(game);
            }
        };
        document.getElementById('v60-set-quality').onclick = function() {
            var cur = game.world.quality;
            var next = (cur + 1) % 3;
            try { localStorage.setItem('pz_quality', String(next)); } catch (e) {}
            location.reload();
        };
        document.getElementById('v60-set-shake').onclick = function() {
            game.world._shakeDisabled = !game.world._shakeDisabled;
            try { localStorage.setItem('pz_shake_off', game.world._shakeDisabled ? '1' : '0'); } catch (e) {}
            self.renderSettings(game);
        };

        // 启动时恢复设置
        try {
            if (localStorage.getItem('pz_shake_off') === '1') game.world._shakeDisabled = true;
        } catch (e) {}

        this.renderHomeGrowth(game);
    },

    /** 战斗事件上报(每帧或结算时调用) */
    reportProgress: function(game) {
        if (!game.profile || typeof ChallengeDaily === 'undefined') return;
        var d = game.profile.data;
        if (!d.daily || d.daily.date !== ChallengeDaily.today()) return;
        var kills = d.totalKills || 0;
        var daily = d.daily;
        daily.tasks.forEach(function(t) {
            if (t.type === 'kills' && !t.claimed) t.progress = Math.min(t.target, kills);
            if (t.type === 'squad' && !t.claimed) t.progress = Math.min(t.target, Math.max(t.progress, game.maxCount || 0));
            if (t.type === 'gates' && !t.claimed) t.progress = Math.min(t.target, g.gates.chosenRows.size);
            if (t.type === 'skills' && !t.claimed) t.progress = Math.min(t.target, Object.keys(g.squad._skills || {}).length);
            if (t.type === 'boss' && !t.claimed) t.progress = Math.min(t.target, g.enemies.bossKills || 0);
        });
        // wins 和 clear 只在胜利结算时更新
    },

    showPage: function(id) {
        this.hidePages();
        var el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    },

    hidePages: function() {
        ['v60-map-page', 'v60-ach-page', 'v60-settings-page'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    },

    renderHomeGrowth: function(game) {
        var el = document.getElementById('v60-home-growth');
        if (!el || !game.profile) return;
        var d = game.profile.data;
        var pl = typeof Progression !== 'undefined' ? Progression.levelFromXp(d.xp || 0) : { level: 1, nextNeed: 300 };
        var xpPrev = 0;
        for (var l = 1; l < pl.level; l++) xpPrev += (typeof XP_RULES !== 'undefined' ? XP_RULES.levelCurve(l) : 300);
        var pct = Math.min(100, Math.round(((d.xp || 0) - xpPrev) / Math.max(1, pl.nextNeed - xpPrev) * 100));
        var totalStars = 0;
        for (var k in d.stars) totalStars += d.stars[k] || 0;
        el.innerHTML =
            '<div class="v60-growth-row"><span class="v60-growth-lv">Lv.' + pl.level + '</span>' +
            '<div class="v60-xp-bar"><div class="v60-xp-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="v60-growth-xp">' + (d.xp || 0) + ' XP</span></div>' +
            '<div class="v60-growth-stats">⭐ ' + totalStars + ' · ⚔️ ' + (d.totalKills || 0) + ' · 🏆 ' + (d.totalWins || 0) + '</div>';
    },

    renderMap: function(game) {
        var nodesEl = document.getElementById('v60-map-nodes');
        var statsEl = document.getElementById('v60-map-stats');
        if (!nodesEl || !game.profile) return;
        var d = game.profile.data;
        var unlocked = d.unlockedLevel || 1;
        var totalStars = 0;
        for (var k in d.stars) totalStars += d.stars[k] || 0;
        if (statsEl) statsEl.innerHTML = '⭐ ' + totalStars + '/18 · 🏆 通关 ' + (d.totalWins || 0) + ' · ⚔️ ' + (d.totalKills || 0);
        nodesEl.innerHTML = '';
        var self = this;
        var metaTotal = this.LEVEL_META.length;
        this.LEVEL_META.forEach(function(meta, i) {
            var state = i < unlocked ? 'cleared' : (i === unlocked - 1 ? 'current' : 'locked');
            if (i === unlocked - 1 && d.stars[meta.key]) state = 'cleared';
            var stars = d.stars[meta.key] || 0;
            var node = document.createElement('div');
            node.className = 'v60-map-node ' + state;
            node.innerHTML =
                '<div class="v60-node-icon">' + (state === 'locked' ? '🔒' : meta.icon) + '</div>' +
                '<div class="v60-node-info"><div class="v60-node-name">' + (i + 1) + '. ' + meta.name + '</div>' +
                '<div class="v60-node-meta">威胁: ' + meta.threat + ' · 奖励 ' + (LEVELS[i] ? LEVELS[i].rewardCoins : 0) + '🪙</div>' +
                '<div class="v60-node-stars">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</div></div>' +
                (state === 'current' ? '<div class="v60-node-current">▶</div>' : '') +
                (state === 'cleared' ? '<div class="v60-node-medal">🎖️</div>' : '');
            if (i < unlocked) {
                node.onclick = function() {
                    self.game._sfx('click');
                    self.game.levelIndex = i;
                    self.game.start();
                    self.hidePages();
                };
                node.classList.add('clickable');
            }
            nodesEl.appendChild(node);
            if (i < metaTotal - 1) {
                var line = document.createElement('div');
                line.className = 'v60-map-line' + (i + 1 < unlocked ? ' done' : '');
                nodesEl.appendChild(line);
            }
        }, game);
    },

    renderAchievements: function(game) {
        var el = document.getElementById('v60-ach-list');
        if (!el || !game.profile || typeof ACHIEVEMENT_DEFS === 'undefined') return;
        var d = game.profile.data;
        el.innerHTML = '';
        var claimed = d.claimedRewards || {};
        ACHIEVEMENT_DEFS.forEach(function(def) {
            var got = !!claimed['ach:' + def.id];
            var row = document.createElement('div');
            row.className = 'v60-ach-row' + (got ? ' got' : '');
            row.innerHTML =
                '<div class="v60-ach-icon">' + def.icon + '</div>' +
                '<div class="v60-ach-info"><div class="v60-ach-name">' + def.name + '</div>' +
                '<div class="v60-ach-desc">' + def.desc + '</div></div>' +
                '<div class="v60-ach-reward">' + (got ? '✓' : '+' + def.reward + '🪙') + '</div>';
            el.appendChild(row);
        });
    },

    renderDaily: function(game) {
        var el = document.getElementById('v60-daily-list');
        if (!el || !game.profile || typeof ChallengeDaily === 'undefined') return;
        var daily = ChallengeDaily.ensureDaily(game.profile);
        el.innerHTML = '';
        daily.tasks.forEach(function(t, i) {
            var pct = Math.min(100, Math.round(t.progress / t.target * 100));
            var can = t.progress >= t.target && !t.claimed;
            var row = document.createElement('div');
            row.className = 'v60-ach-row' + (t.claimed ? ' got' : can ? ' ready' : '');
            row.innerHTML =
                '<div class="v60-ach-info"><div class="v60-ach-name">' + t.name + '</div>' +
                '<div class="v60-ach-bar"><div class="v60-ach-fill" style="width:' + pct + '%"></div></div></div>' +
                '<div class="v60-ach-reward">' + (t.claimed ? '✓' : '+' + t.reward + '🪙') + '</div>';
            if (can) row.onclick = function() { ChallengeDaily.claim(game.profile, i); game._sfx('gate'); self.renderDaily(game); game._refreshCoinDisplays(); };
            el.appendChild(row);
        });
    },

    renderSettings: function(game) {
        var soundBtn = document.getElementById('v60-set-sound');
        if (soundBtn && typeof Platform !== 'undefined' && Platform.audio) {
            soundBtn.textContent = Platform.audio.isMuted() ? '🔇 关' : '🔊 开';
        }
        var qualityBtn = document.getElementById('v60-set-quality');
        if (qualityBtn) {
            var names = ['低', '中', '高'];
            qualityBtn.textContent = names[game.world.quality] || '高';
        }
        var shakeBtn = document.getElementById('v60-set-shake');
        if (shakeBtn) shakeBtn.textContent = game.world._shakeDisabled ? '🚫 关' : '💥 开';
        var info = document.getElementById('v60-saveinfo');
        if (info && game.profile) {
            var d = game.profile.data;
            info.innerHTML = '存档 v' + d.profileVersion + ' · 金币 ' + d.coins + ' · 解锁 ' + d.unlockedLevel + '/6 关 · 击杀 ' + (d.totalKills || 0);
        }
    }
};
