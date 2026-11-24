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
        if (avatar) { avatar.src = 'assets/game/ui/avatar.png'; avatar.alt = '绿色头盔指挥官'; }
        var hudAvatar = document.querySelector('#avatar-box img');
        if (hudAvatar) hudAvatar.src = 'assets/game/ui/avatar.png';
        if (panel) {
            var hero = document.createElement('div');
            hero.className = 'art-home-hero';
            hero.innerHTML = '<div class="art-hero-copy"><span class="art-overline">TOY ARMY · READY</span>' +
                '<h2>小小军团<br>大大火力</h2><p>集合出发，守住每一条跑道。</p></div>' +
                this.image('characters/soldier_portrait.png', '绿色玩具步兵', 'art-hero-soldier');
            var title = panel.querySelector('.game-title');
            if (title) title.insertAdjacentElement('afterend', hero);
            var start = document.getElementById('btn-start');
            if (start) start.innerHTML = this.image('ui/play.png', '', 'art-button-icon') + '<span>开始行动</span><span class="art-arrow">➜</span>';
            var growth = document.getElementById('v60-home-growth');
            if (growth) panel.insertBefore(growth, hero);
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
        if (pause) { pause.innerHTML = this.image('ui/pause.png', '', 'art-control-icon'); pause.setAttribute('aria-label', '暂停游戏'); }
        this._wrap('renderArmory', function() { self.decorateWeapons(); });
        this._wrap('renderMap', function() { self.decorateMap(); });
        this._wrap('renderClassSelector', function() { self.decorateClasses(); });
        this._wrap('renderCodex', function() { self.decorateCodex(); });
        this._wrap('renderRank', function() { self.decorateRank(); });
        this._wrap('hidePages', function() {
            var gallery = document.getElementById('art-gallery-page');
            if (gallery) gallery.classList.add('hidden');
        });
        this.decorateClasses();
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
