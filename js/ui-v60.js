// ===== V6.0/V8.0 UI 模块: 关卡地图 / 训练中心 / 军械库 / 科技树 / 图鉴 / 挑战 / 成就 / 每日 / 设置 =====
// 由 V42Art.installUI 后调用 V60UI.install(game) 装配; 全部数据来自 GameProfile。

// V14: 首页功能宫格统一 SVG 图标(24x24, stroke=currentColor, 线宽1.8) — 替换系统Emoji占位
var V60_NAV_ICONS = (function () {
    var A = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    function svg(paths) { return '<svg ' + A + '>' + paths + '</svg>'; }
    return {
        map: svg('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
        train: svg('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.6"/><path d="M12 5V2.5M12 21.5V19M5 12H2.5M21.5 12H19"/>'),
        armory: svg('<path d="M14.7 6.3a4.5 4.5 0 0 0-5.9 5.9L3 18l3 3 5.8-5.8a4.5 4.5 0 0 0 5.9-5.9l-2.6 2.6-2.3-2.3 2.9-3.3z"/>'),
        tech: svg('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>'),
        codex: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>'),
        challenge: svg('<path d="M4 4l7 7M20 4l-7 7M4 20l6-6M20 20l-6-6"/><path d="M3 4h2M19 4h2M3 20h3M18 20h3"/>'),
        rank: svg('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 14v3M9 21h6M10 18h4v3h-4z"/>'),
        ach: svg('<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>'),
        daily: svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3v3M15 3v3M8.5 12l2.2 2.2L15.5 9.5"/>'),
        set: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>')
    };
})();

var V60UI = {
    // V8.0: 十关元数据(名称取自 LEVELS[i].name, 去掉"第 X 关 "前缀)
    LEVEL_META: [
        { icon: '🏕️', threat: '低' },
        { icon: '🏙️', threat: '中' },
        { icon: '🧪', threat: '中高' },
        { icon: '☣️', threat: '高' },
        { icon: '🛡️', threat: '极高' },
        { icon: '☢️', threat: '终局' },
        { icon: '🕳️', threat: '高危' },
        { icon: '⚙️', threat: '极危' },
        { icon: '🏰', threat: '要塞' },
        { icon: '💀', threat: '末日' }
    ],

    install: function(game) {
        this.game = game;
        if (typeof ChallengeDaily !== 'undefined') ChallengeDaily._gameRef = game;
        var container = document.getElementById('game-container');
        if (!container || document.getElementById('v60-map-page')) return;

        // —— 页面骨架(全部页面) ——
        container.insertAdjacentHTML('beforeend',
            '<div id="v60-daily-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">每日作战令</div>' +
                    '<h2 class="v60-page-title">每日任务</h2>' +
                    '<div id="v60-signin-strip" class="v60-signin-strip"></div>' +
                    '<button id="v60-signin-btn" class="btn-primary">签到</button>' +
                    '<div id="v60-daily-list" class="v60-ach-list"></div>' +
                    '<button id="v60-daily-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-train-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">军团训练中心</div>' +
                    '<div class="v60-train-header" id="v60-train-header"></div>' +
                    '<div class="v60-train-stats" id="v60-train-stats"></div>' +
                    '<div class="v60-train-equip" id="v60-train-equip"></div>' +
                    '<div class="v60-equip-title" style="margin-top:10px">背包 · 掉落装备</div>' +
                    '<div id="v60-train-bag" class="v60-bag-list"></div>' +
                    '<button id="v60-train-upgrade" class="btn-primary">升级士兵</button>' +
                    '<div class="v60-train-cost" id="v60-train-cost"></div>' +
                    '<button id="v60-train-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-armory-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">装备整备</div>' +
                    '<h2 class="v60-page-title">军械库</h2>' +
                    '<div id="v118-armory-hero" class="v118-armory-hero"></div>' +
                    '<div id="v60-armory-list" class="v60-armory-list"></div>' +
                    '<button id="v60-armory-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-tech-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">科研站</div>' +
                    '<div id="v60-tech-points" class="v60-tech-points"></div>' +
                    '<div id="v60-tech-list" class="v60-tech-list"></div>' +
                    '<button id="v60-tech-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-codex-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">战场图鉴</div>' +
                    '<h2 class="v60-page-title">Boss图鉴</h2>' +
                    '<div id="v60-codex-bosses" class="v60-codex-list"></div>' +
                    '<h2 class="v60-page-title">武器收藏</h2>' +
                    '<div id="v60-codex-weapons" class="v60-codex-list"></div>' +
                    '<button id="v60-codex-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-challenge-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">极限挑战</div>' +
                    '<h2 class="v60-page-title">挑战模式</h2>' +
                    '<div id="v60-challenge-list" class="v60-challenge-list"></div>' +
                    '<button id="v60-challenge-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-rank-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">名人堂</div>' +
                    '<h2 class="v60-page-title">本机战绩榜</h2>' +
                    '<div class="v118-rank-source">仅记录此设备上的真实对局</div>' +
                    '<div id="v60-rank-list" class="v60-rank-list"></div>' +
                    '<button id="v60-rank-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-map-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker">作战地图 · 十大防区</div>' +
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

        // —— 首页按钮组(V8.0: 九宫格导航) ——
        var startScreen = document.getElementById('start-screen');
        var startPanel = startScreen ? startScreen.querySelector('.title-panel') : null;
        if (startPanel && !document.getElementById('v60-home-nav')) {
            startPanel.insertAdjacentHTML('beforeend',
                '<div id="v60-home-nav" class="v60-home-nav">' +
                    '<button id="v60-btn-map" class="v60-nav-btn">' + V60_NAV_ICONS.map + ' 地图</button>' +
                    '<button id="v60-btn-train" class="v60-nav-btn">' + V60_NAV_ICONS.train + ' 训练</button>' +
                    '<button id="v60-btn-armory" class="v60-nav-btn">' + V60_NAV_ICONS.armory + ' 军械库</button>' +
                    '<button id="v60-btn-tech" class="v60-nav-btn">' + V60_NAV_ICONS.tech + ' 科技</button>' +
                    '<button id="v60-btn-codex" class="v60-nav-btn">' + V60_NAV_ICONS.codex + ' 图鉴</button>' +
                    '<button id="v60-btn-challenge" class="v60-nav-btn">' + V60_NAV_ICONS.challenge + ' 挑战</button>' +
                    '<button id="v60-btn-rank" class="v60-nav-btn">' + V60_NAV_ICONS.rank + ' 排行</button>' +
                    '<button id="v60-btn-ach" class="v60-nav-btn">' + V60_NAV_ICONS.ach + ' 成就</button>' +
                    '<button id="v60-btn-daily" class="v60-nav-btn">' + V60_NAV_ICONS.daily + ' 每日</button>' +
                    '<button id="v60-btn-set" class="v60-nav-btn">' + V60_NAV_ICONS.set + ' 设置</button>' +
                '</div>' +
                '<div id="v60-class-row" class="v60-class-row"></div>' +
                '<div id="v60-home-growth" class="v60-home-growth"></div>');
        }

        // —— 事件(全量防御) ——
        var self = this;
        var bind = function(id, fn) {
            var el = document.getElementById(id);
            if (el) el.onclick = function() { game._sfx('click'); fn(); };
        };
        bind('v60-btn-map', function() { self.showPage('v60-map-page'); self.renderMap(game); });
        bind('v60-btn-ach', function() { self.showPage('v60-ach-page'); self.renderAchievements(game); });
        bind('v60-btn-set', function() { self.showPage('v60-settings-page'); self.renderSettings(game); });
        bind('v60-btn-daily', function() { self.showPage('v60-daily-page'); self.renderDaily(game); });
        bind('v60-btn-train', function() { self.showPage('v60-train-page'); self.renderTraining(game); });
        bind('v60-btn-armory', function() { self.showPage('v60-armory-page'); self.renderArmory(game); });
        bind('v60-btn-tech', function() { self.showPage('v60-tech-page'); self.renderTech(game); });
        bind('v60-btn-codex', function() { self.showPage('v60-codex-page'); self.renderCodex(game); });
        bind('v60-btn-challenge', function() { self.showPage('v60-challenge-page'); self.renderChallenges(game); });
        bind('v60-btn-rank', function() { self.showPage('v60-rank-page'); self.renderRank(game); });
        bind('v60-rank-back', function() { self.hidePages(); });
        bind('v60-map-back', function() { self.hidePages(); });
        bind('v60-ach-back', function() { self.hidePages(); });
        bind('v60-daily-back', function() { self.hidePages(); });
        bind('v60-set-back', function() { self.hidePages(); });
        bind('v60-train-back', function() { self.hidePages(); });
        bind('v60-armory-back', function() { self.hidePages(); });
        bind('v60-tech-back', function() { self.hidePages(); });
        bind('v60-codex-back', function() { self.hidePages(); });
        bind('v60-challenge-back', function() { self.hidePages(); });
        bind('v60-signin-btn', function() {
            if (typeof SignInSystem === 'undefined' || !game.profile) return;
            var r = SignInSystem.sign(game.profile);
            if (r) {
                game._sfx('win');
                game._refreshCoinDisplays();
                self.renderDaily(game);
            } else {
                var btn = document.getElementById('v60-signin-btn');
                if (btn) btn.textContent = '今日已签';
            }
        });
        bind('v60-set-sound', function() {
            if (typeof Platform !== 'undefined' && Platform.audio) {
                Platform.audio.setMuted(!Platform.audio.isMuted());
                game._updateSoundLabel();
                self.renderSettings(game);
            }
        });
        bind('v60-set-quality', function() {
            var cur = game.world.quality;
            var next = (cur + 1) % 3;
            // V12: 画质偏好走 Platform.storage(旧裸键 pz_quality 只写不读已修复; 微信端无 localStorage)
            if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.setLegacy) {
                Platform.storage.setLegacy('pz_quality', String(next));
            } else {
                try { localStorage.setItem('pz_quality', String(next)); } catch (e) {}
            }
            location.reload();
        });
        bind('v60-set-shake', function() {
            game.world._shakeDisabled = !game.world._shakeDisabled;
            if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.setLegacy) {
                Platform.storage.setLegacy('pz_shake_off', game.world._shakeDisabled ? '1' : '0');
            } else {
                try { localStorage.setItem('pz_shake_off', game.world._shakeDisabled ? '1' : '0'); } catch (e) {}
            }
            self.renderSettings(game);
        });

        // 启动时恢复设置
        if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
            if (Platform.storage.getLegacy('pz_shake_off', '0') === '1') game.world._shakeDisabled = true;
        } else {
            try {
                if (localStorage.getItem('pz_shake_off') === '1') game.world._shakeDisabled = true;
            } catch (e) {}
        }
        // V13: 启动恢复"减少动效"偏好
        try {
            var motionOn0 = Platform.storage.get('motion_reduced', 'false') === 'true';
            var htmlRoot0 = document.documentElement;
            if (htmlRoot0 && htmlRoot0.classList) htmlRoot0.classList.toggle('v13-reduced-motion', motionOn0);
            if (window.__minidom && window.__minidom.body) window.__minidom.body.classList.toggle('v13-reduced-motion', motionOn0);
        } catch (e) {}

        this.renderHomeGrowth(game);
        this.renderClassSelector(game);
    },

    // ===== VNext: 职业选择(首页四卡) =====
    renderClassSelector: function(game) {
        var row = document.getElementById('v60-class-row');
        if (!row || !game.profile || typeof SoldierClass === 'undefined') return;
        var current = SoldierClass.def(game.profile).id;
        row.innerHTML = '';
        for (var id in CLASS_DEFS) {
            var def = CLASS_DEFS[id];
            var check = SoldierClass.canSelect(game.profile, id);
            var card = document.createElement('button');
            card.className = 'v60-class-card' + (id === current ? ' selected' : '') + (check.ok ? '' : ' locked');
            card.innerHTML =
                '<div class="v60-class-icon">' + def.icon + '</div>' +
                '<div class="v60-class-name">' + def.name + '</div>' +
                '<div class="v60-class-desc">' + (check.ok
                    ? def.desc + '<br>专精 Lv.' + SoldierClass.masteryOf(game.profile, id).level + ' (' + SoldierClass.masteryOf(game.profile, id).games + '场)'
                    : def.unlockText) + '</div>';
            card.onclick = function(cid) { return function() {
                var r = SoldierClass.select(game.profile, cid);
                if (r.ok) { game._sfx('gate'); V60UI.renderClassSelector(game); }
                else { game._sfx('click'); }
            }; }(id);
            row.appendChild(card);
        }
    },


    showPage: function(id) {
        this.hidePages();
        var el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    },

    /** V8.0修复: 全部页面隐藏(旧实现漏掉 daily/train/armory/tech/codex/challenge) */
    hidePages: function() {
        ['v60-map-page', 'v60-ach-page', 'v60-settings-page', 'v60-daily-page',
         'v60-train-page', 'v60-armory-page', 'v60-tech-page', 'v60-codex-page',
         'v60-challenge-page', 'v60-rank-page'].forEach(function(id) {
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
        var starTotal = LEVELS.length * 3;
        if (statsEl) statsEl.innerHTML = '⭐ ' + totalStars + '/' + starTotal + ' · 🏆 通关 ' + (d.totalWins || 0) + ' · ⚔️ ' + (d.totalKills || 0);
        nodesEl.innerHTML = '';
        var self = this;
        var metaTotal = this.LEVEL_META.length;
        this.LEVEL_META.forEach(function(meta, i) {
            if (i >= LEVELS.length) return;
            var rawName = (LEVELS[i].name || ('关卡 ' + (i + 1))).replace(/^第\s*\d+\s*关\s*/, '');
            var state = i + 1 < unlocked ? 'cleared' : (i === unlocked - 1 ? 'current' : 'locked');
            if (i === unlocked - 1 && d.stars['L' + (i + 1)]) state = 'cleared';
            var stars = d.stars['L' + (i + 1)] || 0;
            var node = document.createElement('div');
            node.className = 'v60-map-node ' + state;
            node.innerHTML =
                '<div class="v60-node-icon">' + (state === 'locked' ? '🔒' : meta.icon) + '</div>' +
                '<div class="v60-node-info"><div class="v60-node-name">' + (i + 1) + '. ' + rawName + '</div>' +
                '<div class="v60-node-meta">威胁: ' + meta.threat + ' · 奖励 ' + (LEVELS[i].rewardCoins || 0) + '🪙</div>' +
                '<div class="v60-node-stars">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</div></div>' +
                (state === 'current' ? '<div class="v60-node-current">▶</div>' : '') +
                (state === 'cleared' ? '<div class="v60-node-medal">🎖️</div>' : '');
            if (i + 1 <= unlocked) {
                node.onclick = function() {
                    self.game._sfx('click');
                    self.game.levelIndex = i;
                    self.game.start();
                    self.hidePages();
                };
                node.classList.add('clickable');
            }
            nodesEl.appendChild(node);
            if (i < metaTotal - 1 && i < LEVELS.length - 1) {
                var line = document.createElement('div');
                line.className = 'v60-map-line' + (i + 2 <= unlocked ? ' done' : '');
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
        var gotCount = 0;
        ACHIEVEMENT_DEFS.forEach(function(def) {
            var got = !!claimed['ach:' + def.id];
            if (got) gotCount++;
            var row = document.createElement('div');
            row.className = 'v60-ach-row' + (got ? ' got' : '');
            row.innerHTML =
                '<div class="v60-ach-icon">' + def.icon + '</div>' +
                '<div class="v60-ach-info"><div class="v60-ach-name">' + def.name + '</div>' +
                '<div class="v60-ach-desc">' + def.desc + '</div></div>' +
                '<div class="v60-ach-reward">' + (got ? '✓' : '+' + def.reward + '🪙') + '</div>';
            el.appendChild(row);
        });
        var header = el.parentNode.querySelector('.v60-ach-progress');
        if (!header) {
            header = document.createElement('div');
            header.className = 'v60-ach-progress';
            el.parentNode.insertBefore(header, el);
        }
        header.textContent = '进度: ' + gotCount + ' / ' + ACHIEVEMENT_DEFS.length;
    },

    renderDaily: function(game) {
        var self = this;
        // —— 签到条(V8.0: 7天循环) ——
        var strip = document.getElementById('v60-signin-strip');
        var signBtn = document.getElementById('v60-signin-btn');
        if (strip && game.profile && typeof SignInSystem !== 'undefined') {
            var si = SignInSystem.ensure(game.profile);
            var curDay = si.streak % 7; // 今日待签的第几天(0起)
            var html = '';
            for (var d = 0; d < 7; d++) {
                var done = d < curDay;
                var reward = SIGNIN_REWARDS[d];
                html += '<div class="v60-signin-day' + (done ? ' done' : d === curDay ? ' today' : '') + '">' +
                    '<span class="v60-signin-day-num">D' + (d + 1) + '</span>' +
                    '<span class="v60-signin-day-r">' + (done ? '✓' : reward + '🪙') + '</span></div>';
            }
            strip.innerHTML = html;
            if (signBtn) signBtn.textContent = SignInSystem.canSign(game.profile)
                ? '签到 (+' + SIGNIN_REWARDS[curDay] + '🪙)' : '今日已签';
        }
        // —— 每日任务 ——
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

    // ===== V8.0: 军团训练中心(士兵等级+装备) =====
    renderTraining: function(game) {
        var self = this;
        var header = document.getElementById('v60-train-header');
        var statsEl = document.getElementById('v60-train-stats');
        var equipEl = document.getElementById('v60-train-equip');
        var upBtn = document.getElementById('v60-train-upgrade');
        var costEl = document.getElementById('v60-train-cost');
        if (!header || !game.profile || typeof SoldierGrowth === 'undefined') return;
        var lv = SoldierGrowth.level(game.profile);
        var tier = SoldierGrowth.tierName(game.profile);
        var stats = SoldierGrowth.stats(game.profile);
        var cost = SoldierGrowth.upgradeCost(game.profile);
        if (header) header.innerHTML =
            '<span class="v60-train-level">Lv.' + lv + '</span>' +
            '<span class="v60-train-tier" style="color:' + tier.color + '">' + tier.name + '</span>' +
            '<span class="v60-train-coins">🪙 ' + game.profile.coins + '</span>';
        if (statsEl) statsEl.innerHTML =
            '<div class="v60-stat-row"><span>伤害加成</span><b>+' + (stats.dmgBonus || 0) + '</b></div>' +
            '<div class="v60-stat-row"><span>生命加成</span><b>+' + (stats.hpBonus || 0) + '</b></div>' +
            '<div class="v60-stat-row"><span>暴击率</span><b>+' + ((stats.critBonus || 0) * 100).toFixed(1) + '%</b></div>' +
            '<div class="v60-stat-row"><span>伤害减免</span><b>' + ((stats.drBonus || 0) * 100).toFixed(1) + '%</b></div>' +
            '<div class="v60-stat-row"><span>招募效率</span><b>+' + (stats.recruitBonus || 0) + '</b></div>';
        if (equipEl) {
            var eq = game.profile.data.equipment || {};
            var equipHtml = '<div class="v60-equip-title">装备栏</div>';
            for (var si = 0; si < EQUIP_SLOTS.length; si++) {
                var slot = EQUIP_SLOTS[si];
                var piece = eq[slot];
                var qName = piece ? EQUIP_QUALITY[piece.quality] : '空';
                var qColor = piece ? EQUIP_QUALITY_COLORS[piece.quality] : '#666';
                var eName = piece ? (piece.name || (EQUIPMENT_DEFS[piece.id] ? EQUIPMENT_DEFS[piece.id].name : piece.id)) : '未装备';
                equipHtml += '<div class="v60-equip-row"><span class="v60-equip-slot">' + EQUIP_SLOT_NAMES[slot] + '</span>' +
                    '<span class="v60-equip-name" style="color:' + qColor + '">' + eName + '</span>' +
                    '<span class="v60-equip-quality">' + qName + (piece ? ' +' + (piece.level - 1) : '') + '</span></div>';
            }
            equipEl.innerHTML = equipHtml;
        }
        // VNext: 背包(掉落装备 穿戴/强化/分解)
        var bagEl = document.getElementById('v60-train-bag');
        if (bagEl) {
            var bag = game.profile.data.bag || [];
            bagEl.innerHTML = '';
            if (!bag.length) {
                bagEl.innerHTML = '<div class="v60-rank-empty">暂无掉落装备 · 通关战斗获取</div>';
            } else if (typeof EquipmentLoot !== 'undefined' && EquipmentLoot.equipFromBag) {
                var autoBtn = document.createElement('button');
                autoBtn.id = 'v60-auto-equip-btn';
                autoBtn.className = 'btn-secondary v60-auto-equip-btn';
                autoBtn.textContent = '⚡ 一键穿戴最强装备';
                autoBtn.onclick = function() {
                    var eqNow = game.profile.data.equipment || {};
                    var curBag = (game.profile.data.bag || []).slice();
                    var bestBySlot = {};
                    for (var k = 0; k < curBag.length; k++) {
                        var cand = curBag[k];
                        if (!cand || !cand.slot) continue;
                        var score = (cand.quality || 0) * 100 + (cand.level || 1);
                        if (!bestBySlot[cand.slot] || score > bestBySlot[cand.slot].score) {
                            bestBySlot[cand.slot] = { uid: cand.uid, score: score };
                        }
                    }
                    var changed = 0;
                    for (var sKey in bestBySlot) {
                        var cur = eqNow[sKey];
                        var curScore = cur ? ((cur.quality || 0) * 100 + (cur.level || 1)) : -1;
                        if (bestBySlot[sKey].score > curScore) {
                            var res = EquipmentLoot.equipFromBag(game.profile, bestBySlot[sKey].uid);
                            if (res && res.ok) changed++;
                        }
                    }
                    if (changed > 0) {
                        game._sfx('gate');
                        game._refreshCoinDisplays();
                        self.renderTraining(game);
                    }
                };
                bagEl.appendChild(autoBtn);
            }
            for (var bi = 0; bi < bag.length; bi++) {
                (function(item) {
                    var it = document.createElement('div');
                    it.className = 'v60-bag-item';
                    it.innerHTML =
                        '<div class="v60-bag-main"><div class="v60-bag-name v60-quality-' + item.quality + '">' +
                        (item.isNew ? '<span style="color:#FF4444">新!</span> ' : '') + item.name +
                        ' <i style="font-style:normal;font-size:10px">Q' + EQUIP_QUALITY[item.quality] + ' +' + (item.level - 1) + '</i></div>' +
                        '<div class="v60-bag-affix">' + (item.affixLines || []).join(' · ') + '</div></div>';
                    var actions = document.createElement('div');
                    actions.className = 'v60-bag-actions';
                    var wearBtn = document.createElement('button');
                    wearBtn.className = 'v60-bag-btn';
                    wearBtn.textContent = '穿戴';
                    wearBtn.onclick = function() {
                        // V11 QA修复[P3]: 原守卫判的是SoldierGrowth却调用EquipmentLoot, 守卫与被调对象不一致
                        var r = EquipmentLoot ? EquipmentLoot.equipFromBag(game.profile, item.uid) : { ok: false };
                        if (r.ok) { game._sfx('gate'); game._refreshCoinDisplays(); self.renderTraining(game); }
                    };
                    actions.appendChild(wearBtn);
                    var upBtn = document.createElement('button');
                    upBtn.className = 'v60-bag-btn up';
                    var upCost = item.level >= 10 ? null : EQUIP_UPGRADE_COST(item.quality, item.level);
                    upBtn.textContent = upCost === null ? 'MAX' : '强化🪙' + upCost;
                    upBtn.disabled = upCost === null || game.profile.coins < upCost;
                    upBtn.onclick = function() {
                        var r = EquipmentLoot.upgradeBagEquip(game.profile, item.uid);
                        if (r.ok) { game._sfx('gate'); game._refreshCoinDisplays(); self.renderTraining(game); }
                    };
                    actions.appendChild(upBtn);
                    var sellBtn = document.createElement('button');
                    sellBtn.className = 'v60-bag-btn sell';
                    sellBtn.textContent = '分解';
                    sellBtn.onclick = function() {
                        var r = EquipmentLoot.sellEquip(game.profile, item.uid);
                        if (r.ok) { game._sfx('coin'); game._refreshCoinDisplays(); self.renderTraining(game); }
                    };
                    actions.appendChild(sellBtn);
                    it.appendChild(actions);
                    bagEl.appendChild(it);
                })(bag[bi]);
            }
        }
        var maxed = lv >= 50;
        if (upBtn) {
            upBtn.textContent = maxed ? 'MAX' : '升级 (🪙' + cost + ')';
            upBtn.disabled = maxed || game.profile.coins < cost;
            upBtn.onclick = function() {
                var r = SoldierGrowth.upgrade(game.profile);
                if (r.ok) {
                    game._sfx('gate');
                    game._refreshCoinDisplays();
                    self.renderTraining(game);
                    if (r.milestone && costEl) costEl.innerHTML = '<b style="color:#FFC247">🎉 解锁: ' + r.milestone.unlock + '</b>';
                } else if (costEl) {
                    costEl.textContent = r.reason === 'insufficient' ? '金币不足 (需要🪙' + r.cost + ')' : '已满级';
                }
            };
        }
    },

    // ===== V8.0: 军械库(WeaponSystem 8种武器) =====
    renderArmory: function(game) {
        var el = document.getElementById('v60-armory-list');
        var hero = document.getElementById('v118-armory-hero');
        if (!el || !hero || !game.profile || typeof WeaponSystem === 'undefined') return;
        el.innerHTML = '';
        var current = WeaponSystem.current(game.profile);
        var wLv = WeaponSystem.level(game.profile);
        var wStats = WeaponSystem.stats(game.profile);
        var upCost = WeaponSystem.upgradeCost(game.profile);
        var canEvo = WeaponSystem.canEvolve(game.profile);
        var self = this;
        var weaponOrder = ['rifle', 'shotgun', 'sniper', 'mg', 'flamethrower', 'rocket', 'freeze', 'tesla'];
        var statTextOf = function(st) {
            return '伤害 ×' + (st.dmgMul || 1) +
                (st.rateMul ? ' · 射速 ×' + st.rateMul : '') +
                (st.pellets ? ' · 弹丸 ×' + st.pellets : '') +
                (st.pierceBonus ? ' · 穿透 +' + st.pierceBonus : '') +
                (st.radius ? ' · 半径 ' + st.radius : '') +
                (st.chain ? ' · 链式 ×' + st.chain : '') +
                (st.slowMul ? ' · 减速 ' + Math.round((1 - st.slowMul) * 100) + '%' : '') +
                (st.critBonus ? ' · 暴击 +' + Math.round(st.critBonus * 100) + '%' : '');
        };
        var currentIndex = weaponOrder.indexOf(current);
        var currentDef = WEAPON_DEFS[current];
        if (currentDef && currentIndex >= 0) {
            hero.innerHTML =
                '<div class="v14-weapon-3d" id="v14-weapon-3d"></div>' +
                '<div class="v118-weapon-art" role="img" aria-label="' + currentDef.name + '" data-weapon="' + current + '"' +
                ' data-atlas-cols="4" data-atlas-rows="2" data-atlas-col="' + (currentIndex % 4) + '" data-atlas-row="' + Math.floor(currentIndex / 4) + '"' +
                ' style="--weapon-col:' + (currentIndex % 4) + ';--weapon-row:' + Math.floor(currentIndex / 4) + '"></div>' +
                '<div class="v118-armory-hero-info"><div class="v118-armory-current">当前装备</div>' +
                '<div class="v118-armory-hero-name">' + currentDef.icon + ' ' + currentDef.name + '</div>' +
                '<div class="v118-armory-hero-level">强化等级 Lv.' + wLv + '</div>' +
                '<div class="v118-armory-hero-stats">' + statTextOf(wStats) + '</div></div>';
            // V14: 3D 武器展示台(H5; 微信/minidom 自动回退 SVG 图集)
            var v14host = hero.querySelector('#v14-weapon-3d');
            if (v14host && typeof WeaponShowcase !== 'undefined' && WeaponShowcase.mount(v14host, current)) {
                hero.classList.add('v14-3d-ready');
                v14host.classList.add('v14-active');
            }
        } else {
            hero.innerHTML = '';
        }
        for (var wi = 0; wi < weaponOrder.length; wi++) {
            var id = weaponOrder[wi];
            var def = WEAPON_DEFS[id];
            if (!def) continue;
            var isCurrent = id === current;
            var canUnlock = WeaponSystem.canUnlock(game.profile, id);
            var unlockedNow = !def.unlockCondition || isCurrent || canUnlock ||
                (def.unlockCondition.type === 'clear' && (game.profile.data.unlockedLevel || 1) > def.unlockCondition.level);
            var st = def.effect(wLv);
            var row = document.createElement('div');
            row.className = 'v60-armory-row' + (isCurrent ? ' equipped' : unlockedNow ? ' owned' : ' locked');
            row.setAttribute('data-weapon', id);
            var evoLine = '';
            if (isCurrent) {
                if (wStats.evolvedName) evoLine = '<div class="v60-armory-evo">✅ 已进化: ' + wStats.evolvedName + '</div>';
                else if (canEvo.ok) evoLine = '<div class="v60-armory-evo">⚡ 可进化: ' + EVOLUTION_DEFS[canEvo.evoId].name + '</div>';
                else if (canEvo.reason === 'tech_required') evoLine = '<div class="v60-armory-evo">🔒 进化需科技: ' + canEvo.tech + ' ×' + canEvo.need + '</div>';
                // V11.3: 武器词条行
                if (wStats.affixName) evoLine += '<div class="v60-armory-evo" style="color:#FFC247">📝 词条: ' + wStats.affixName + '</div>';
            }
            var statText = statTextOf(st);
            row.innerHTML =
                '<div class="v118-weapon-art" role="img" aria-label="' + def.name + '" data-weapon="' + id + '"' +
                ' data-atlas-cols="4" data-atlas-rows="2" data-atlas-col="' + (wi % 4) + '" data-atlas-row="' + Math.floor(wi / 4) + '"' +
                ' style="--weapon-col:' + (wi % 4) + ';--weapon-row:' + Math.floor(wi / 4) + '"></div>' +
                '<div class="v60-armory-head"><span class="v60-armory-icon">' + def.icon + '</span>' +
                '<span class="v60-armory-name">' + def.name + (isCurrent ? ' ✓' : '') + '</span>' +
                '<span class="v60-armory-lv">Lv.' + wLv + '/5</span></div>' +
                '<div class="v60-armory-stats">' + statText + '</div>' +
                evoLine + '<div class="v60-armory-actions"></div>';
            var actions = row.querySelector('.v60-armory-actions');
            if (!unlockedNow) {
                actions.innerHTML = '<span class="v60-locked">通关第 ' + def.unlockCondition.level + ' 关解锁</span>';
            } else if (isCurrent) {
                var upBtn = document.createElement('button');
                upBtn.className = 'v60-armory-btn upgrade';
                upBtn.textContent = upCost !== null ? '升级 🪙' + upCost : 'MAX';
                upBtn.disabled = upCost === null || game.profile.coins < upCost;
                upBtn.onclick = function() {
                    var r = WeaponSystem.upgrade(game.profile);
                    if (r.ok) { game._sfx('gate'); game._refreshCoinDisplays(); self.renderArmory(game); }
                };
                actions.appendChild(upBtn);
                if (canEvo.ok) {
                    var evoBtn = document.createElement('button');
                    evoBtn.className = 'v60-armory-btn evolve';
                    evoBtn.textContent = '⚡进化';
                    evoBtn.onclick = function() {
                        var r = WeaponSystem.evolve(game.profile);
                        if (r.ok) { game._sfx('win'); self.renderArmory(game); }
                    };
                    actions.appendChild(evoBtn);
                }
            } else {
                var swBtn = document.createElement('button');
                swBtn.className = 'v60-armory-btn';
                swBtn.textContent = '切换';
                swBtn.onclick = function(wid) { return function() { WeaponSystem.switchTo(game.profile, wid); game._sfx('gate'); self.renderArmory(game); }; }(id);
                actions.appendChild(swBtn);
            }
            el.appendChild(row);
        }
    },

    // ===== V8.0: 科研站(科技树) =====
    renderTech: function(game) {
        var ptsEl = document.getElementById('v60-tech-points');
        var listEl = document.getElementById('v60-tech-list');
        if (!listEl || !game.profile || typeof TechTree === 'undefined') return;
        var tp = game.profile.data.techPoints || 0;
        if (ptsEl) ptsEl.innerHTML = '<b>🔬 科技点: ' + tp + '</b><span class="v60-tech-tip">通关与成就获取科技点</span>';
        listEl.innerHTML = '';
        var self = this;
        var branches = { fire: '火力科技', army: '军团科技', logi: '后勤科技' };
        var BRANCH_ICONS = { fire: '⚔️', army: '🛡️', logi: '🔧' }; // V13: 分支徽记
        for (var branch in branches) {
            var title = document.createElement('div');
            title.className = 'v60-tech-branch v13-tech-branch';
            title.innerHTML = '<span class="v13-tech-rail" aria-hidden="true"></span><span class="v13-tech-branch-badge">' + BRANCH_ICONS[branch] + '</span>' + branches[branch];
            listEl.appendChild(title);
            for (var id in TECH_DEFS) {
                var def = TECH_DEFS[id];
                if (def.branch !== branch) continue;
                var lv = TechTree.levelOf(game.profile, id);
                var check = TechTree.canUpgrade(game.profile, id);
                var row = document.createElement('div');
                row.className = 'v60-tech-row v13-tech-node' + (lv >= def.max ? ' maxed' : check.ok && tp >= check.cost ? ' ready' : check.ok ? '' : ' locked');
                var pips = '<span class="v13-tech-pips" aria-hidden="true">';
                for (var pi = 0; pi < def.max; pi++) pips += '<i class="' + (pi < lv ? 'on' : '') + '"></i>';
                pips += '</span>';
                row.innerHTML =
                    '<span class="v13-tech-connector" aria-hidden="true"></span>' +
                    '<div class="v60-ach-info"><div class="v60-ach-name">' + def.icon + ' ' + def.name + ' <i>Lv.' + lv + '/' + def.max + '</i>' + pips + '</div>' +
                    '<div class="v60-ach-desc">' + def.desc + (def.req && lv < def.max ? ' · 前置: ' + TECH_DEFS[def.req].name : '') + '</div></div>' +
                    '<div class="v60-ach-reward">' + (lv >= def.max ? 'MAX' : def.cost + '🔬') + '</div>';
                if (check.ok) {
                    row.onclick = function(tid) { return function() {
                        var r = TechTree.upgrade(game.profile, tid);
                        if (r.ok) { game._sfx('gate'); self.renderTech(game); }
                    }; }(id);
                    row.classList.add('clickable');
                }
                listEl.appendChild(row);
            }
        }
    },

    // ===== V8.0: 战场图鉴(Boss+武器收藏) =====
    /** V13: 武器剪影图标(程序化 SVG, 按 type 区分轮廓, tier 决定色阶, evolved 金色发光)
     *  剪影设计遵循 ART_DIRECTION「剪影优先」规则: 0.3s 内可分辨武器类型。
     *  军械库主视图使用 v118 武器图集(hero 大图); 本剪影服务于图鉴等小尺寸列表场景。 */
    weaponIconSvg: function(type, tier, evolved) {
        var TIER_COLORS = ['#8FA8C2', '#8FA8C2', '#4A8FE0', '#4A8FE0', '#9A6EE0', '#FFC247'];
        var base = evolved ? '#FFC247' : (TIER_COLORS[tier] || '#8FA8C2');
        var dark = evolved ? '#B8860B' : '#2E4A6E';
        var lite = evolved ? '#FFE9A8' : '#B8D4F0';
        var glow = evolved ? '<circle cx="10" cy="9" r="7.2" fill="#FFC247" opacity=".25"/><circle cx="10" cy="9" r="4.6" fill="#FFE9A8" opacity=".4"/>' : '';
        var P = {
            single: { body: 'M10 18h30l2-3h14v6h-8l-2 3H18l-2 4h-5l1-4h-3z', extra: '<rect x="24" y="24" width="6" height="10" rx="1.5" transform="rotate(-14 27 29)" fill="' + dark + '"/><rect x="12" y="14" width="4" height="4" fill="' + dark + '"/>' },
            spread: { body: 'M8 17h14l3-4h8v5h-6l-2 3H12z M33 15h18v8h-6l-2 4h-8z', extra: '<rect x="20" y="23" width="10" height="4" rx="2" fill="' + dark + '"/><rect x="36" y="14" width="3" height="10" fill="' + dark + '"/>' },
            pierce: { body: 'M6 19h10l2-2h40v5h-14l-3 4h-9l-2-3H12z', extra: '<rect x="30" y="11" width="14" height="5" rx="2.4" fill="' + dark + '"/><circle cx="37" cy="13.5" r="2" fill="' + lite + '"/><rect x="16" y="22" width="5" height="8" rx="1.5" transform="rotate(-16 18 26)" fill="' + dark + '"/>' },
            rapid: { body: 'M8 16h12l2-2h26v7h-9l-2 4h-8l-2-3H12z', extra: '<circle cx="22" cy="28" r="6" fill="' + dark + '"/><circle cx="22" cy="28" r="3" fill="' + lite + '"/><rect x="44" y="15" width="8" height="3" fill="' + dark + '"/>' },
            cone: { body: 'M8 17h10l3-3h10v10h-8l-2 3h-9z', extra: '<circle cx="34" cy="19" r="7.5" fill="' + dark + '"/><circle cx="34" cy="19" r="4" fill="' + lite + '"/><path d="M43 19l8-4-2 4 2 4z" fill="#FF8844"/>' },
            explosive: { body: 'M6 16h14l3-3h20v10h-8l-3 4h-10l-2-3H10z', extra: '<path d="M43 14l10 5-10 5z" fill="#FF8844"/><rect x="18" y="25" width="8" height="4" rx="2" fill="' + dark + '"/>' },
            freeze: { body: 'M8 16h12l2-2h18v9h-8l-2 3h-8l-2-3H12z', extra: '<rect x="40" y="13" width="9" height="12" rx="3" fill="#BFEFFF"/><path d="M50 19h6M53 16l-3 3 3 3" stroke="#7FD4FF" stroke-width="2" fill="none"/><circle cx="35" cy="25" r="3" fill="#7FD4FF"/>' },
            chain: { body: 'M8 18h12l2-2h16v8h-9l-2 3h-9l-2-3H12z', extra: '<rect x="38" y="13" width="5" height="12" rx="1.5" fill="' + dark + '"/><rect x="44" y="14" width="4" height="10" rx="1.5" fill="' + lite + '"/><path d="M52 15l4 2-1 3 3 2-4 2" stroke="#B8E0FF" stroke-width="2" fill="none"/>' }
        };
        var d = P[type] || P.single;
        return '<svg class="v13-wicon" viewBox="0 0 64 38" width="46" height="27" aria-hidden="true">' + glow +
            '<path d="' + d.body + '" fill="' + base + '" stroke="' + dark + '" stroke-width="1.2" stroke-linejoin="round"/>' +
            d.extra + '</svg>';
    },

    renderCodex: function(game) {
        var bossesEl = document.getElementById('v60-codex-bosses');
        var weaponsEl = document.getElementById('v60-codex-weapons');
        if (!bossesEl || !weaponsEl || !game.profile) return;
        var d = game.profile.data;
        // —— Boss图鉴 ——
        bossesEl.innerHTML = '';
        var bossSeen = d.bossSeen || {};
        for (var i = 0; i < LEVELS.length && i < CONFIG.BOSS_NAMES.length; i++) {
            var name = CONFIG.BOSS_NAMES[i];
            var style = LEVELS[i].bossStyle || 'bruiser';
            var seen = !!bossSeen[style] || (d.stats && d.stats.bossKills > 0 && i + 1 <= (d.unlockedLevel || 1));
            var killed = d.stars && d.stars['L' + (i + 1)] > 0;
            var card = document.createElement('div');
            card.className = 'v60-codex-card' + (seen ? '' : ' unknown');
            card.innerHTML =
                '<div class="v60-codex-icon">' + (seen ? '👹' : '❓') + '</div>' +
                '<div class="v60-ach-info"><div class="v60-ach-name">' + (seen ? name : '???') + '</div>' +
                '<div class="v60-ach-desc">' + (seen ? '第' + (i + 1) + '关 · 体格: ' + style : '通关后解锁') + '</div></div>' +
                '<div class="v60-ach-reward">' + (killed ? '🎖️已讨伐' : seen ? '遭遇过' : '') + '</div>';
            bossesEl.appendChild(card);
        }
        // —— 武器收藏 ——
        // V11 QA修复[P3]: renderCodex 补 WeaponSystem 守卫(与 renderArmory 等处一致)
        if (typeof WeaponSystem === 'undefined') return;
        weaponsEl.innerHTML = '';
        var wLv = WeaponSystem.level(game.profile);
        var wStats = WeaponSystem.stats(game.profile);
        for (var wid in WEAPON_DEFS) {
            var def = WEAPON_DEFS[wid];
            var cond = def.unlockCondition;
            var got = !cond || (game.profile.data.unlockedLevel || 1) > cond.level;
            var wcard = document.createElement('div');
            wcard.className = 'v60-codex-card' + (got ? '' : ' unknown');
            wcard.innerHTML =
                '<div class="v60-codex-icon">' + (got ? this.weaponIconSvg(def.type, 3, false) : '🔒') + '</div>' +
                '<div class="v60-ach-info"><div class="v60-ach-name">' + (got ? def.name : '???') + '</div>' +
                '<div class="v60-ach-desc">' + (got ? def.desc : '通关第 ' + cond.level + ' 关解锁') + '</div></div>' +
                '<div class="v60-ach-reward">' + (wStats.weaponId === wid && wStats.evolvedName ? '⚡' : got ? '已装备档案' : '') + '</div>';
            weaponsEl.appendChild(wcard);
        }
    },

    // ===== V8.0: 挑战模式入口 =====
    renderChallenges: function(game) {
        var el = document.getElementById('v60-challenge-list');
        if (!el || !game.profile || typeof CHALLENGE_MODES === 'undefined') return;
        var d = game.profile.data;
        var best = d.challengeBest || {};
        var unlockedLv = d.unlockedLevel || 1;
        el.innerHTML = '';
        var self = this;
        for (var type in CHALLENGE_MODES) {
            var cfg = CHALLENGE_MODES[type];
            // 无尽生存需通关L3; Boss试炼需通关L5
            var need = type === 'survival' ? 4 : 6;
            var open = unlockedLv >= need;
            var card = document.createElement('div');
            card.className = 'v60-challenge-card' + (open ? '' : ' locked');
            card.innerHTML =
                '<div class="v60-ach-info"><div class="v60-ach-name">' + cfg.icon + ' ' + cfg.name + '</div>' +
                '<div class="v60-ach-desc">' + cfg.desc + '</div>' +
                '<div class="v60-ach-desc">最高纪录: ' + (best[type] || 0) + '</div></div>' +
                '<div class="v60-ach-reward">' + (open ? '▶' : '🔒 通关L' + (need - 1)) + '</div>';
            if (open) {
                card.onclick = function(mode) { return function() {
                    game._sfx('gate');
                    self.hidePages();
                    game.startChallengeMode(mode);
                }; }(type);
                card.classList.add('clickable');
            }
            el.appendChild(card);
        }
    },

    // ===== VNext: 战绩排行(真实结算数据, 无假排名) =====
    // V12视觉: 前三甲奖牌徽章 + 职业徽章 + 最新战绩高亮(docs/art/UI_DESIGN_SYSTEM.md)
    renderRank: function(game) {
        var el = document.getElementById('v60-rank-list');
        if (!el || !game.profile || typeof Leaderboard === 'undefined') return;
        var list = [];
        try {
            list = Leaderboard.top(game.profile, LEADERBOARD_CAP);
        } catch (e) {
            // V13: 数据源异常态(本地榜读取失败) — 如实呈现, 不伪造数据
            el.innerHTML = '<div class="v60-rank-empty v13-rank-error">⚠️ 排行数据加载失败<br><span class="v13-rank-error-tip">请返回后重试</span></div>';
            return;
        }
        el.innerHTML = '';
        if (!list.length) {
            el.innerHTML = '<div class="v60-rank-empty v13-rank-empty-rich">' +
                '<div class="v13-rank-empty-medals" aria-hidden="true"><span>🥈</span><span class="gold">🥇</span><span>🥉</span></div>' +
                '暂无战绩 · 完成一局战斗后进入排行</div>';
            return;
        }
        var latestTs = 0;
        for (var mi = 0; mi < list.length; mi++) latestTs = Math.max(latestTs, list[mi].ts || 0);
        var podium = document.createElement('div');
        podium.className = 'v118-rank-podium';
        el.appendChild(podium);
        for (var i = 0; i < list.length; i++) {
            var r = list[i];
            var clsDef = (typeof CLASS_DEFS !== 'undefined' && CLASS_DEFS[r.classId]) ? CLASS_DEFS[r.classId] : null;
            var row = document.createElement('div');
            row.className = 'v60-rank-row' + (i < 3 ? ' top' + (i + 1) : '') + (r.ts === latestTs ? ' v60-rank-row-me' : '');
            row.setAttribute('data-rank', i + 1);
            row.setAttribute('aria-label', '第' + (i + 1) + '名，得分' + r.score);
            var classText = clsDef ? clsDef.icon + clsDef.name : (r.classId || '未记录职业');
            var elapsed = Number(r.time);
            var timeText = isFinite(elapsed) ? ' · ⏱️' + (elapsed % 1 ? elapsed.toFixed(1) : elapsed.toFixed(0)) + '秒' : '';
            var resultText = r.challenge
                ? '⚔️ ' + r.challenge + ' · L' + r.level + (r.win ? '完成' : '失利')
                : (r.win ? '🏆 通关L' + r.level : '💀 L' + r.level + '失利');
            var detailText = '⚔️' + r.kills + ' · 👥' + r.maxCount + ' · 🔥' + (r.combo || 0) + timeText;
            var metadata = i < 3
                ? '<div class="v118-rank-date">' + Leaderboard.fmtDate(r.ts) + '</div>' +
                    '<details class="v118-rank-details"><summary>战绩详情</summary><div class="v60-rank-meta">' + detailText + '</div></details>'
                : '<div class="v60-rank-meta">' + detailText + ' · ' + Leaderboard.fmtDate(r.ts) + '</div>';
            row.innerHTML =
                '<div class="v60-rank-pos">' + (i + 1) + '</div>' +
                '<div class="v60-rank-info"><div class="v60-rank-name">' +
                resultText +
                ' <span class="v118-rank-class"' + (clsDef ? ' style="color:' + clsDef.color + '"' : '') + '>' + classText + '</span></div>' +
                metadata + '</div>' +
                '<div class="v60-rank-score">' + r.score + '</div>';
            (i < 3 ? podium : el).appendChild(row);
        }
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
            info.innerHTML = '存档 v' + d.profileVersion + ' · 金币 ' + d.coins + ' · 解锁 ' + d.unlockedLevel + '/' + LEVELS.length + ' 关 · 击杀 ' + (d.totalKills || 0);
        }
    }
};
