// Toy military presentation. All balances, unlocks and rewards stay in existing systems.
var ArtUI = {
    version: 'military_v5',
    _game: null,
    image: function(path, label, css) {
        return '<img class="' + (css || 'art-icon') + '" src="assets/game/' + path + '" alt="' + label + '" draggable="false">';
    },
    icon: function(name) {
        var order = ['avatar','coin','diamond','settings','play','pause','trophy','chest','star','shield','medal'];
        var index = order.indexOf(name);
        return '<span class="art-nav-sprite" style="background-position:' + (-(index % 4) * 27) + 'px ' + (-Math.floor(index / 4) * 27) + 'px" aria-hidden="true"></span>';
    },
    install: function(game) {
        if (this._game) return;
        this._game = game;
        var self = this;
        var root = document.getElementById('game-container');
        root.classList.add('art-military');
        if (window.__minidom || typeof wx !== 'undefined') {
            root.classList.add('art-mini');
            var fit = function() {
                var w = window.innerWidth || 390, h = window.innerHeight || 844;
                root.style.width = w + 'px'; root.style.height = h + 'px';
                var screen = document.getElementById('start-screen');
                if (screen) screen.style.height = h + 'px';
                var p = screen && screen.querySelector('.title-panel');
                if (p) { p.style.width = (Math.min(w, 444) - 24) + 'px'; p.style.maxHeight = (h - 24) + 'px'; }
            };
            fit(); window.addEventListener('resize', fit);
        }
        var panel = document.querySelector('#start-screen .title-panel');
        var avatar = document.querySelector('.logo-badge img');
        if (avatar) { avatar.src = 'assets/game/ui/avatar.png?v=1901'; avatar.alt = '特种兵指挥官'; }
        var hudAvatar = document.querySelector('#avatar-box img');
        if (hudAvatar) hudAvatar.src = 'assets/game/ui/avatar.png?v=1901';
        if (panel) {
            // V15-ART-003: 真实美术资产驱动的商业级军事营地首页 (独立营地背景 + 金属徽章Logo + 统一3兵种主角团 + 单行关卡条 + 5格底栏)
            panel.classList.add('v15-home-lobby');
            var title = panel.querySelector('.game-title');
            if (title && !panel.querySelector('.v15-logo-img')) {
                title.innerHTML = '<img class="v15-logo-img" src="assets/game/v15/home_logo.png" alt="膨胀小队" draggable="false">';
            }
            var hero = document.createElement('div');
            hero.className = 'art-home-hero v15-camp-stage';
            hero.innerHTML =
                '<div class="v15-side-col v15-side-left">' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-map">' + this.icon('shield') + '<span>地图</span></button>' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-tech">' + this.icon('star') + '<span>科技</span></button>' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-daily">' + this.icon('coin') + '<span>每日</span></button>' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-challenge">' + this.icon('medal') + '<span>挑战</span></button>' +
                '</div>' +
                '<div class="v15-hero-center-wrap">' +
                    '<div class="v15-hero-shadow" style="display:none"></div>' +
                '</div>' +
                '<div class="v15-side-col v15-side-right">' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-ach">' + this.icon('trophy') + '<span>成就</span></button>' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-codex">' + this.icon('medal') + '<span>图鉴</span></button>' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-set">' + this.icon('settings') + '<span>设置</span></button>' +
                '</div>';
            if (title) title.insertAdjacentElement('afterend', hero);
            hero.addEventListener('click', function(ev) {
                var sb = ev.target.closest('.v15-side-btn');
                if (!sb) return;
                var tid = sb.getAttribute('data-trigger');
                var orig = tid && document.getElementById(tid);
                if (orig) orig.click();
            });

            // 精简单一当前关卡面板 (绑定真实 #level-select 关卡按钮, 不在首页堆叠10个数字方格!)
            var start = document.getElementById('btn-start');
            if (start && !document.getElementById('v15-stage-bar')) {
                var stageBar = document.createElement('div');
                stageBar.id = 'v15-stage-bar';
                stageBar.innerHTML =
                    '<img class="v15-stage-thumb" src="assets/game/v15/home_military_camp_bg.jpg?v=1901" alt="关卡预览" draggable="false">' +
                    '<div class="v15-stage-mid">' +
                        '<div class="v15-stage-kicker">TACTICAL MISSION · 当前战区</div>' +
                        '<div class="v15-stage-ctrl">' +
                            '<button type="button" class="v15-stage-arrow" id="v15-stage-prev" aria-label="上一关">◀</button>' +
                            '<span id="v15-stage-label">第 1 关</span>' +
                            '<button type="button" class="v15-stage-arrow" id="v15-stage-next" aria-label="下一关">▶</button>' +
                        '</div>' +
                    '</div>' +
                    '<button type="button" class="v15-stage-map-btn" id="v15-stage-map-open">' + this.icon('chest') + '<span>战区</span></button>';
                start.insertAdjacentElement('beforebegin', stageBar);

                var syncStageLabel = function() {
                    var sel = document.querySelector('#level-select button.selected');
                    var lbl = document.getElementById('v15-stage-label');
                    if (lbl && sel) lbl.textContent = '第 ' + sel.textContent.trim() + ' 关';
                };
                var stepStage = function(delta) {
                    var btns = Array.prototype.slice.call(document.querySelectorAll('#level-select button'));
                    if (!btns.length) return;
                    var idx = btns.findIndex(function(b) { return b.classList.contains('selected'); });
                    if (idx < 0) idx = 0;
                    var next = Math.max(0, Math.min(btns.length - 1, idx + delta));
                    if (btns[next] && !btns[next].disabled) btns[next].click();
                    setTimeout(syncStageLabel, 20);
                };
                document.getElementById('v15-stage-prev').onclick = function() { stepStage(-1); };
                document.getElementById('v15-stage-next').onclick = function() { stepStage(1); };
                document.getElementById('v15-stage-map-open').onclick = function() {
                    var mb = document.getElementById('v60-btn-map'); if (mb) mb.click();
                };
                setTimeout(syncStageLabel, 120);
            }

            if (start) start.innerHTML = '<svg class="v19-start-ico" viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><span>开始作战</span><span class="art-arrow">▸</span>';
            var growth = document.getElementById('v60-home-growth');
            if (growth && title) panel.insertBefore(growth, title);

            // 底部 5 格商业级现代战术主导航栏 (统一使用新版特种兵头像, 彻底消除旧绿头盔!)
            if (!document.getElementById('v15-bottom-dock')) {
                var dock = document.createElement('div');
                dock.id = 'v15-bottom-dock';
                dock.innerHTML =
                    '<button type="button" class="v15-dock-tab active" data-dock="home">' + this.icon('shield') + '<span>基地</span></button>' +
                    '<button type="button" class="v15-dock-tab" data-dock="train"><img class="v15-dock-gun-ico v19-dock-avatar" src="assets/game/ui/avatar.png?v=1901" alt="士兵" draggable="false"><span>特种兵</span></button>' +
                    '<button type="button" class="v15-dock-tab" data-dock="armory">' + this.image('weapons/rifle.png', '武器', 'v15-dock-gun-ico') + '<span>军械</span></button>' +
                    '<button type="button" class="v15-dock-tab" data-dock="shop">' + this.icon('coin') + '<span>补给站</span></button>' +
                    '<button type="button" class="v15-dock-tab" data-dock="rank">' + this.icon('trophy') + '<span>排行</span></button>';
                panel.appendChild(dock);
                dock.addEventListener('click', function(ev) {
                    var btn = ev.target.closest('.v15-dock-tab');
                    if (!btn) return;
                    var act = btn.getAttribute('data-dock');
                    if (act === 'train') { var t = document.getElementById('v60-btn-train'); if (t) t.click(); }
                    else if (act === 'armory') { var a = document.getElementById('v60-btn-armory'); if (a) a.click(); }
                    else if (act === 'shop') { var s = document.getElementById('btn-open-shop'); if (s) s.click(); }
                    else if (act === 'rank') { var r = document.getElementById('v60-btn-rank'); if (r) r.click(); }
                });
            }
        }
        var navArt = { map: 'shield', train: 'avatar', armory: 'chest', tech: 'star', codex: 'medal',
            challenge: 'shield', rank: 'trophy', ach: 'medal', daily: 'coin', set: 'settings' };
        var navNames = { map: '地图', train: '训练', armory: '军械库', tech: '科技', codex: '图鉴',
            challenge: '挑战', rank: '排行', ach: '成就', daily: '每日', set: '设置' };
        for (var key in navArt) {
            var btn = document.getElementById('v60-btn-' + key);
            if (btn) btn.innerHTML = this.icon(navArt[key]) + '<span>' + navNames[key] + '</span>';
        }
        // Decoration is independent of text and of the real input handlers.
        [['win-screen', 'trophy'], ['lose-screen', 'shield'], ['pause-screen', 'pause'], ['shop-screen', 'chest']].forEach(function(pair) {
            var p = document.querySelector('#' + pair[0] + ' .title-panel');
            if (p) p.insertAdjacentHTML('afterbegin', self.image('ui/' + pair[1] + '.png', '', 'art-panel-emblem'));
        });
        var pause = document.getElementById('btn-pause');
        if (pause) { pause.innerHTML = '<span class="v15-pause-bars"><i></i><i></i></span>'; pause.setAttribute('aria-label', '暂停游戏'); }
        // V15 战斗 HUD: 注入右上角「金币+士兵数」双军工胶囊与进度百分比/Boss骷髅徽标
        var topBar = document.getElementById('top-bar');
        if (topBar && !document.getElementById('v15-hud-right')) {
            var rightCol = document.createElement('div');
            rightCol.id = 'v15-hud-right';
            rightCol.innerHTML =
                '<div class="v15-pill v15-pill-coin">' + this.image('ui/coin.png', '', 'v15-pill-ico') + '<span id="v15-hud-coins">0</span></div>' +
                '<div class="v15-pill v15-pill-squad"><img class="v15-pill-ico v19-hud-avatar" src="assets/game/ui/avatar.png?v=1901" alt="" draggable="false"><span id="v15-hud-squad">1</span></div>';
            topBar.appendChild(rightCol);
        }
        var progBar = document.getElementById('progress-bar-container');
        if (progBar && !document.getElementById('v15-progress-pct')) {
            var pctEl = document.createElement('span');
            pctEl.id = 'v15-progress-pct';
            pctEl.textContent = '0%';
            progBar.appendChild(pctEl);
            var skullEl = document.createElement('span');
            skullEl.className = 'v15-boss-skull';
            skullEl.textContent = '☠';
            progBar.appendChild(skullEl);
        }
        this._wrap('renderArmory', function() { self.decorateWeapons(); });
        this._wrap('renderMap', function() { self.decorateMap(); });
        this._wrap('renderClassSelector', function() { self.decorateClasses(); });
        this._wrap('renderCodex', function() { self.decorateCodex(); });
        this._wrap('renderRank', function() { self.decorateRank(); });
        this._wrap('renderTraining', function() { self.decorateTraining(); });
        this._wrap('hidePages', function() {
            var gallery = document.getElementById('art-gallery-page');
            if (gallery) gallery.classList.add('hidden');
        });
        this.decorateClasses();
        this.refreshBadges(game);
    },
    refreshBadges: function(game) {
        if (!game || !game.profile) return;
        var coins = game.profile.coins || 0;
        var canTrain = typeof SoldierGrowth !== 'undefined' && SoldierGrowth.level(game.profile) < 50 && coins >= SoldierGrowth.upgradeCost(game.profile);
        var trainBtn = document.getElementById('v60-btn-train');
        if (trainBtn) trainBtn.classList.toggle('art-has-badge', !!canTrain);
        var canShop = false;
        if (game.shop && typeof UPGRADE_DEFS !== 'undefined') {
            for (var k in UPGRADE_DEFS) {
                var c = game.shop.nextCost ? game.shop.nextCost(game.profile, k) : null;
                if (c !== null && c !== undefined && coins >= c) { canShop = true; break; }
            }
        }
        var shopBtn = document.getElementById('btn-open-shop');
        if (shopBtn) shopBtn.classList.toggle('art-has-badge', !!canShop);
    },
    _wrap: function(name, after) {
        var original = V60UI[name];
        V60UI[name] = function() { var result = original.apply(this, arguments); after(); return result; };
    },
    decorateWeapons: function() {
        var map = { rifle: 'rifle', shotgun: 'shotgun', sniper: 'sniper', mg: 'mg',
            rocket: 'rocket', flamethrower: 'plasma', freeze: 'laser', tesla: 'railgun' };
        var nodes = document.querySelectorAll('.v118-weapon-art');
        for (var i = 0; i < nodes.length; i++) {
            var id = nodes[i].getAttribute('data-weapon');
            if (!map[id]) continue;
            nodes[i].classList.add('art-weapon-image');
            nodes[i].style.backgroundImage = 'url("assets/game/weapons/' + map[id] + '.png")';
            nodes[i].style.backgroundPosition = 'center';
            nodes[i].style.backgroundSize = 'contain';
        }
        // The remaining designs are cosmetic previews, not additional weapon mechanics.
        var hero = document.getElementById('v118-armory-hero');
        if (hero) hero.setAttribute('data-art-source', 'processed_weapon_crops');
    },
    decorateClasses: function() {
        var icons = document.querySelectorAll('.v60-class-icon');
        var names = ['rifle', 'energy', 'sniper', 'medic'];
        for (var i = 0; i < icons.length; i++) icons[i].innerHTML = this.image('characters/' + names[i % names.length] + '_portrait.png', '', 'art-class-portrait');
    },
    decorateMap: function() {
        var nodes = document.querySelectorAll('.v60-map-node');
        var maps = ['sunny', 'desert', 'city', 'forest', 'snow'];
        for (var i = 0; i < nodes.length; i++) {
            var icon = nodes[i].querySelector('.v60-node-icon');
            if (icon) icon.innerHTML = this.image('maps/' + maps[i % 5] + (typeof wx !== 'undefined' || typeof tt !== 'undefined' ? '.jpg' : '.webp'), '', 'art-map-preview');
        }
    },
    decorateRank: function() {
        var nodes = document.querySelectorAll('.v60-rank-pos');
        for (var i = 0; i < Math.min(3, nodes.length); i++) {
            nodes[i].innerHTML = this.image('ui/medal.png', '', 'art-rank-medal') + '<span>' + (i + 1) + '</span>';
        }
    },
    decorateTraining: function() {
        var panel = document.querySelector('#v60-train-page .title-panel');
        if (!panel || document.getElementById('art-train-showcase')) return;
        var box = document.createElement('div');
        box.id = 'art-train-showcase';
        box.className = 'art-train-showcase';
        box.innerHTML = this.image('characters/soldier_portrait.png', '绿色玩具士兵', 'art-train-soldier') +
            '<div class="art-train-copy"><span class="art-overline">SQUAD TRAINING</span>' +
            '<strong>绿色战术步兵团</strong><p>强化全队火力、生命与减伤属性</p></div>';
        var header = panel.querySelector('.v60-train-head') || panel.querySelector('.v60-page-title');
        if (header) header.insertAdjacentElement('afterend', box);
        else panel.insertBefore(box, panel.firstChild);
    },
    decorateCodex: function() {
        var page = document.querySelector('#v60-codex-page .title-panel');
        if (!page || document.getElementById('art-gallery-open')) return;
        var weapons = [['rifle','突击步枪'], ['smg','冲锋枪'], ['shotgun','霰弹枪'], ['sniper','狙击枪'],
            ['mg','重机枪'], ['rocket','火箭筒'], ['laser','激光枪'], ['plasma','等离子炮'], ['gatling','加特林'], ['railgun','电磁炮']];
        var collection = document.createElement('div');
        collection.className = 'art-weapon-collection';
        var html = '<h2 class="v60-page-title">武器外观档案</h2><p class="art-gallery-note">装备外观展示；军械库中查看可用武器与升级效果。</p><div class="art-weapon-grid">';
        for (var i = 0; i < weapons.length; i++) html += '<div class="art-weapon-tile">' +
            this.image('weapons/' + weapons[i][0] + '.png', weapons[i][1], 'art-collection-weapon') + '<span>' + weapons[i][1] + '</span></div>';
        html += '</div>'; collection.innerHTML = html;
        page.insertBefore(collection, document.getElementById('v60-codex-back'));
        var button = document.createElement('button');
        button.id = 'art-gallery-open'; button.className = 'btn-secondary'; button.textContent = '美术图鉴 · 设计参考';
        button.onclick = function() { ArtUI.openGallery(0); };
        var back = document.getElementById('v60-codex-back');
        page.insertBefore(button, back);
    },
    openGallery: function(pageIndex) {
        if (typeof wx !== 'undefined' && wx.loadSubpackage && !this._galleryReady) {
            if (this._galleryLoading) return;
            this._galleryLoading = true;
            var self = this;
            wx.loadSubpackage({ name: 'art_gallery', success: function() {
                self._galleryLoading = false; self._galleryReady = true; self.openGallery(pageIndex);
            }, fail: function() { self._galleryLoading = false; } });
            return;
        }
        var list = typeof ArtAssetCatalog !== 'undefined'
            ? (Array.isArray(ArtAssetCatalog) ? ArtAssetCatalog : (ArtAssetCatalog.entries || ArtAssetCatalog.assets || [])) : [];
        if (!Array.isArray(list)) return;
        V60UI.hidePages();
        var page = document.getElementById('art-gallery-page');
        if (!page) {
            page = document.createElement('div'); page.id = 'art-gallery-page'; page.className = 'v60-page';
            document.getElementById('game-container').appendChild(page);
        }
        var perPage = 6, pages = Math.max(1, Math.ceil(list.length / perPage));
        pageIndex = Math.max(0, Math.min(pages - 1, pageIndex));
        var html = '<div class="title-panel v60-panel"><h2 class="v60-page-title">美术图鉴</h2>' +
            '<p class="art-gallery-note">世界、角色与装备的设计参考。战斗中使用可活动的三维角色。</p><div class="art-gallery-grid">';
        for (var i = pageIndex * perPage; i < Math.min(list.length, (pageIndex + 1) * perPage); i++) {
            var a = list[i];
            var src = (typeof wx !== 'undefined' || typeof tt !== 'undefined') && a.fallbackPath ? a.fallbackPath : a.path;
            if (!src) continue;
            html += '<div class="art-gallery-card"><img src="' + src + '" alt="设计参考 ' + (i + 1) + '"><span>设计参考 ' + (i + 1) + '</span></div>';
        }
        html += '</div><div class="art-gallery-pager"><button id="art-gallery-prev" class="btn-secondary">上一页</button><span>' + (pageIndex + 1) + ' / ' + pages +
            '</span><button id="art-gallery-next" class="btn-secondary">下一页</button></div><button id="art-gallery-back" class="btn-primary">返回图鉴</button></div>';
        page.innerHTML = html; page.classList.remove('hidden');
        document.getElementById('art-gallery-prev').onclick = function() { ArtUI.openGallery(pageIndex - 1); };
        document.getElementById('art-gallery-next').onclick = function() { ArtUI.openGallery(pageIndex + 1); };
        document.getElementById('art-gallery-back').onclick = function() { page.classList.add('hidden'); V60UI.showPage('v60-codex-page'); V60UI.renderCodex(ArtUI._game); };
    }
};
