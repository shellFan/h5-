// ===== V17 新手教程 (新手指南弹窗) =====
// 触发时机: 首次通关第1关后 / 首次在第2关失败后(变强指南), 只弹一次, 标记持久化到档案
// 首页入口: #btn-tutorial "📖 新手指南" 随时重看
// 设计约束: 纯逻辑(触发判定/页内容/标记)与DOM分离 → 单测只测逻辑(tests/unit/suites/11-tutorial.test.js),
//           DOM懒装配(document可能不存在于单测沙箱)
// 延迟弹出: 结算界面先播完动画再叠弹窗(600ms); 若玩家已离开结算页(下一关/复活/重开)则取消

var TutorialUI = {
    _installed: false,
    _page: 0,
    _game: null,
    _pendingT: null,

    // —— 内容页(硬编码中文, 与全站字符串风格一致; 顺序即用户关心的优先级) ——
    PAGES: [
        {
            title: '开局人数 · 兵怎么加?',
            items: [
                { icon: '🎖️', head: '升级商店 · 新兵招募', text: '首页点「⬆ 升级商店」, 花🪙升「新兵招募」, 每升1级开局人数+1' },
                { icon: '🧪', head: '科研站 · 扩编科技', text: '首页「🧪 科技」页, 用科技点点「扩编」, 开局人数再+2' },
                { icon: '📐', head: '开局人数公式', text: '开局人数 = 1 + 新兵招募等级 + 扩编科技, 出战前先在首页攒兵' }
            ]
        },
        {
            title: '战斗中 · 人数怎么涨?',
            items: [
                { icon: '🚪', head: '人数门(主要兵源)', text: '蓝色「+N」门穿过直接加人; 红色「-N」门会减员, 看清颜色再冲' },
                { icon: '✖️', head: '倍增门', text: '金色「×2」门让人数瞬间翻倍, 决战前排的关键翻盘点' },
                { icon: '🎁', head: '免费补给', text: '首页每天可领1次广告补给, +15兵(下一局生效)' }
            ]
        },
        {
            title: '武器升级 · 火力怎么提?',
            items: [
                { icon: '🔫', head: '军械库 · 升级/进化', text: '首页「🔫 军械库」选武器, 花🪙升级(共5级), 满级可「⚡进化」变形' },
                { icon: '⬆', head: '升级商店 · 永久强化', text: '「枪械强化/快速射击/穿甲弹」三项永久提升伤害/射速/穿透' },
                { icon: '🔓', head: '解锁新武器', text: '通关指定关卡自动解锁新枪, 图鉴页可预览武器收藏' }
            ]
        },
        {
            title: '金币与生存技巧',
            items: [
                { icon: '🪙', head: '金币来源', text: '通关结算+击杀掉落, 失败也保留击杀金币; 结算页「📺双倍奖励」可翻倍' },
                { icon: '💀', head: '失败不亏', text: '失败页可看广告原地复活1次; 或回首页用金币升级后再战' },
                { icon: '👆', head: '基础操作', text: '左右拖动切换跑道: 躲弹幕、抢先冲对门' },
                { icon: '📖', head: '随时重看', text: '首页「❓ 新手指南」按钮可随时打开本教程' }
            ]
        }
    ],

    // —— 纯逻辑(单测覆盖) ——

    seen: function(profile) {
        return !!(profile && profile.data && profile.data.tutorialSeen);
    },

    /** 标记已阅并持久化(幂等) */
    markSeen: function(profile) {
        if (!profile || !profile.data) return false;
        profile.data.tutorialSeen = true;
        profile.save();
        return true;
    },

    /** 首次通关第1关 → 弹(无档案时不弹: 无处持久化已阅标记) */
    shouldShowOnWin: function(levelIndex, profile) {
        return !!profile && levelIndex === 0 && !this.seen(profile);
    },

    /** 首次在第2关失败 → 弹(变强指南) */
    shouldShowOnLose: function(levelIndex, profile) {
        return !!profile && levelIndex === 1 && !this.seen(profile);
    },

    // —— 触发接线(game.js 在 _win/_lose 尾部调用) ——

    maybeShowAfterWin: function(game) {
        this._maybeShow(game, 'won', this.shouldShowOnWin(game.levelIndex, game.profile));
    },

    maybeShowAfterLose: function(game) {
        this._maybeShow(game, 'lost', this.shouldShowOnLose(game.levelIndex, game.profile));
    },

    _maybeShow: function(game, expectedState, ok) {
        if (!ok) return;
        var self = this;
        clearTimeout(this._pendingT);
        // 600ms: 让胜利/失败结算动画先播完, 弹窗叠在结算页之上
        this._pendingT = setTimeout(function() {
            self._pendingT = null;
            if (game.state !== expectedState) return; // 玩家已离开结算页(下一关/复活/重开)
            if (self.seen(game.profile)) return;
            self.show(game);
            self.markSeen(game.profile); // 一经弹出即视为已阅, 不重复打扰
        }, 600);
    },

    /** 开始新一局时取消未决弹窗(防战斗中被延迟弹窗打断) */
    cancelPending: function() {
        if (this._pendingT) {
            clearTimeout(this._pendingT);
            this._pendingT = null;
        }
    },

    /** 首页入口: 重看不改已阅标记(本来就看过/没看过都不受影响) */
    openFromHome: function(game) {
        this.show(game);
    },

    // —— DOM(懒装配; 全防御式, 元素缺失时静默降级) ——

    install: function() {
        if (this._installed) return;
        if (typeof document === 'undefined') return;
        var container = document.getElementById('game-container');
        if (!container || document.getElementById('tutorial-overlay')) { this._installed = true; return; }
        container.insertAdjacentHTML('beforeend',
            '<div id="tutorial-overlay" class="hidden">' +
                '<div class="tutorial-mask"></div>' +
                '<div class="title-panel tutorial-panel">' +
                    '<div class="tutorial-kicker">新手指南</div>' +
                    '<div class="tutorial-page-title" id="tutorial-page-title"></div>' +
                    '<div class="tutorial-items" id="tutorial-items"></div>' +
                    '<div class="tutorial-dots" id="tutorial-dots"></div>' +
                    '<div class="tutorial-actions">' +
                        '<button id="tutorial-skip" class="btn-secondary">跳过</button>' +
                        '<button id="tutorial-next" class="btn-primary">下一步</button>' +
                    '</div>' +
                '</div>' +
            '</div>');
        var self = this;
        var btnSkip = document.getElementById('tutorial-skip');
        var btnNext = document.getElementById('tutorial-next');
        if (btnSkip) btnSkip.addEventListener('click', function() { self._close(); });
        if (btnNext) btnNext.addEventListener('click', function() { self._advance(); });
        this._installed = true;
    },

    show: function(game) {
        if (typeof document === 'undefined') return;
        if (game) this._game = game;
        this.install();
        var overlay = document.getElementById('tutorial-overlay');
        if (!overlay) return;
        this._page = 0;
        this._render();
        overlay.classList.remove('hidden');
    },

    _close: function() {
        var overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.add('hidden');
        if (this._game && this._game._sfx) this._game._sfx('click');
    },

    _advance: function() {
        if (this._page < this.PAGES.length - 1) {
            this._page++;
            this._render();
        } else {
            this._close();
        }
        if (this._game && this._game._sfx) this._game._sfx('click');
    },

    _render: function() {
        var page = this.PAGES[this._page];
        if (!page) return;
        var titleEl = document.getElementById('tutorial-page-title');
        var itemsEl = document.getElementById('tutorial-items');
        var dotsEl = document.getElementById('tutorial-dots');
        var btnNext = document.getElementById('tutorial-next');
        if (titleEl) titleEl.textContent = page.title;
        if (itemsEl) {
            var html = '';
            for (var i = 0; i < page.items.length; i++) {
                var it = page.items[i];
                html += '<div class="tutorial-item">' +
                    '<div class="ti-icon">' + it.icon + '</div>' +
                    '<div class="ti-body"><div class="ti-head">' + it.head + '</div>' +
                    '<div class="ti-text">' + it.text + '</div></div>' +
                    '</div>';
            }
            itemsEl.innerHTML = html;
        }
        if (dotsEl) {
            var dots = '';
            for (var d = 0; d < this.PAGES.length; d++) {
                dots += '<span class="t-dot' + (d === this._page ? ' on' : '') + '"></span>';
            }
            dotsEl.innerHTML = dots;
        }
        if (btnNext) btnNext.textContent = (this._page === this.PAGES.length - 1) ? '知道了' : '下一步';
    }
};
