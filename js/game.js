// ===== 游戏主控制器: 循环/输入/UI/胜负 =====

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.world = new World(this.canvas);
        // 按画质等级调整池大小
        var q = this.world.quality;
        if (q === 0) {
            CONFIG.BULLET_MAX_VISIBLE = 50;
            CONFIG.PARTICLE_MAX = 120;
        } else if (q === 1) {
            CONFIG.BULLET_MAX_VISIBLE = 90;
            CONFIG.PARTICLE_MAX = 220;
        }
        this.effects = new Effects(this.world.scene);
        this.squad = new Squad(this.world.scene);
        this.gates = new GateSystem(this.world.scene);
        this.enemies = new EnemyManager(this.world.scene, this.effects);
        this.combat = new CombatSystem(this.world.scene, this.effects);

        this.state = 'idle'; // idle | playing | won | lost
        this.levelIndex = 0;
        this.time = 0;
        this.lastTime = 0;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.paused = false;
        // 统计
        this.kills = 0;
        this.maxCount = 0;
        this.elapsedTime = 0;
        // 属性变化追踪(触发动画)
        this._prevDamage = 1;
        this._prevFireRate = 2.2;

        // 待机画面: 1个士兵站在起点(跳过弹出动画直接显示)
        this.squad.reset(1);
        for (var i = 0; i < this.squad.soldiers.length; i++) {
            this.squad.soldiers[i].spawnT = 1;
        }
        this.squad.update(0.001, 0);
        this.world.updateCamera(0, 0, 0.016);

        this._setupInput();
        this._setupUI();

        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    _setupInput() {
        var self = this;
        var startX = 0;
        var dragging = false;

        function onDown(x) { startX = x; dragging = true; }
        function onMove(x) {
            if (!dragging || self.state !== 'playing' || self.paused) return;
            var dx = x - startX;
            if (Math.abs(dx) > 30) {
                var dir = dx > 0 ? 1 : -1;
                self.squad.lane = clamp(self.squad.lane + dir, 0, 2);
                self.squad.targetX = CONFIG.LANE_X[self.squad.lane];
                startX = x;
            }
        }
        function onUp() { dragging = false; }

        // 触摸
        this.canvas.addEventListener('touchstart', function(e) {
            e.preventDefault(); onDown(e.touches[0].clientX);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', function(e) {
            e.preventDefault(); onMove(e.touches[0].clientX);
        }, { passive: false });
        this.canvas.addEventListener('touchend', onUp);

        // 鼠标
        this.canvas.addEventListener('mousedown', function(e) { onDown(e.clientX); });
        window.addEventListener('mousemove', function(e) { onMove(e.clientX); });
        window.addEventListener('mouseup', onUp);

        // 键盘 (方向键/AD)
        window.addEventListener('keydown', function(e) {
            if (self.state !== 'playing' || self.paused) return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                self.squad.lane = Math.max(0, self.squad.lane - 1);
                self.squad.targetX = CONFIG.LANE_X[self.squad.lane];
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                self.squad.lane = Math.min(2, self.squad.lane + 1);
                self.squad.targetX = CONFIG.LANE_X[self.squad.lane];
            }
        });
    }

    _setupUI() {
        var self = this;
        this.ui = {
            hud: document.getElementById('hud'),
            levelName: document.getElementById('level-name'),
            levelBadge: document.getElementById('level-badge'),
            progressFill: document.getElementById('progress-bar-fill'),
            progressFlag: document.getElementById('progress-flag'),
            progressNodes: document.getElementById('progress-nodes'),
            countNum: document.getElementById('squad-count-num'),
            countBadge: document.getElementById('squad-count-badge'),
            statCount: document.getElementById('stat-count'),
            statDamage: document.getElementById('stat-damage'),
            statFirerate: document.getElementById('stat-firerate'),
            statRowCount: document.getElementById('stat-row-count'),
            statRowDamage: document.getElementById('stat-row-damage'),
            statRowFirerate: document.getElementById('stat-row-firerate'),
            bossBar: document.getElementById('boss-bar-container'),
            bossFill: document.getElementById('boss-bar-fill'),
            startScreen: document.getElementById('start-screen'),
            winScreen: document.getElementById('win-screen'),
            loseScreen: document.getElementById('lose-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            winCount: document.getElementById('win-count'),
            winKills: document.getElementById('win-kills'),
            winMax: document.getElementById('win-max'),
            winTime: document.getElementById('win-time'),
            loseKills: document.getElementById('lose-kills'),
            loseMax: document.getElementById('lose-max')
        };

        // 进度节点数据(从关卡segments动态生成)
        this.progressNodes = [];

        // 按钮事件绑定(防御性: 元素可能不存在于测试页面)
        var btnStart = document.getElementById('btn-start');
        if (btnStart) btnStart.addEventListener('click', function() { self.start(); });
        var btnRestartWin = document.getElementById('btn-restart-win');
        if (btnRestartWin) btnRestartWin.addEventListener('click', function() { self.start(); });
        var btnRestartLose = document.getElementById('btn-restart-lose');
        if (btnRestartLose) btnRestartLose.addEventListener('click', function() { self.start(); });
        var btnPause = document.getElementById('btn-pause');
        if (btnPause) btnPause.addEventListener('click', function() { self._togglePause(); });
        var btnRevive = document.getElementById('btn-revive');
        if (btnRevive) btnRevive.addEventListener('click', function() { self._revive(); });
        // 暂停菜单按钮
        var btnResume = document.getElementById('btn-resume');
        if (btnResume) btnResume.addEventListener('click', function() { self._togglePause(); });
        var btnPauseRestart = document.getElementById('btn-pause-restart');
        if (btnPauseRestart) btnPauseRestart.addEventListener('click', function() {
            if (self.ui.pauseScreen) self.ui.pauseScreen.classList.add('hidden');
            self.paused = false;
            self.start();
        });
        var btnPauseMenu = document.getElementById('btn-pause-menu');
        if (btnPauseMenu) btnPauseMenu.addEventListener('click', function() { self._backToMenu(); });
    }

    /** 构建进度条节点(基于关卡segments) */
    _buildProgressNodes(level) {
        if (!this.ui.progressNodes) return;
        this.ui.progressNodes.innerHTML = '';
        this.progressNodes = [];
        for (var i = 0; i < level.segments.length; i++) {
            var seg = level.segments[i];
            var nodePos = clamp(seg.z / level.totalZ, 0, 1) * 100;
            var el = document.createElement('div');
            el.className = 'pnode';
            if (seg.type === 'boss') el.classList.add('boss-node');
            el.style.left = nodePos + '%';
            this.ui.progressNodes.appendChild(el);
            this.progressNodes.push({ z: seg.z, el: el, type: seg.type });
        }
    }

    /** 更新进度节点状态(基于小队当前位置) */
    _updateProgressNodes() {
        for (var i = 0; i < this.progressNodes.length; i++) {
            var n = this.progressNodes[i];
            if (!n.el) continue;
            // 已通过的节点: 小队z已越过节点z(更负)
            if (this.squad.z < n.z - 2) {
                n.el.className = n.type === 'boss' ? 'pnode boss-node done' : 'pnode done';
            }
            // 当前节点: 小队接近节点
            else if (Math.abs(this.squad.z - n.z) < 8) {
                n.el.className = n.type === 'boss' ? 'pnode boss-node current' : 'pnode current';
            }
            // 未到达
            else {
                n.el.className = n.type === 'boss' ? 'pnode boss-node' : 'pnode';
            }
        }
    }

    _togglePause() {
        if (this.state !== 'playing') return;
        this.paused = !this.paused;
        if (this.paused) {
            if (this.ui.pauseScreen) this.ui.pauseScreen.classList.remove('hidden');
        } else {
            if (this.ui.pauseScreen) this.ui.pauseScreen.classList.add('hidden');
        }
    }

    _backToMenu() {
        this.paused = false;
        this.state = 'idle';
        if (this.ui.pauseScreen) this.ui.pauseScreen.classList.add('hidden');
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        if (this.ui.startScreen) this.ui.startScreen.classList.remove('hidden');
        // 重置待机士兵
        this.squad.reset(1);
        for (var i = 0; i < this.squad.soldiers.length; i++) {
            this.squad.soldiers[i].spawnT = 1;
        }
        this.gates.clear();
        this.enemies.clear();
        this.combat.clear();
    }

    _revive() {
        // 复活: 恢复10人继续游戏
        this.state = 'playing';
        this.squad.alive = true;
        this.squad.setCount(10);
        if (this.ui.loseScreen) this.ui.loseScreen.classList.add('hidden');
        if (this.ui.hud) this.ui.hud.classList.remove('hidden');
    }

    _showError(msg) {
        var div = document.getElementById('error-display');
        if (!div) {
            div = document.createElement('div');
            div.id = 'error-display';
            div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC0000;color:#fff;padding:10px 14px;font-size:13px;font-family:monospace;white-space:pre-wrap;pointer-events:none;';
            document.body.appendChild(div);
        }
        div.textContent = msg;
        console.error(msg);
    }

    start() {
        try {
            var level = LEVELS[this.levelIndex];
            this.squad.reset(level.startCount);
            this.gates.loadFromLevel(level);
            this.enemies.loadFromLevel(level);
            this.combat.clear();

            this.state = 'playing';
            this.paused = false;
            this.time = 0;
            this.elapsedTime = 0;
            this.kills = 0;
            this.maxCount = level.startCount;
            this.bossSpawned = false;
            this.bossDefeated = false;
            this._prevDamage = this.squad.getDamage();
            this._prevFireRate = this.squad.getFireRate();

            // 更新关卡名和等级徽章
            if (this.ui.levelName) this.ui.levelName.textContent = level.name;
            if (this.ui.levelBadge) this.ui.levelBadge.textContent = 'Lv.' + (this.levelIndex + 1);

            // 构建进度节点
            this._buildProgressNodes(level);

            if (this.ui.startScreen) this.ui.startScreen.classList.add('hidden');
            if (this.ui.winScreen) this.ui.winScreen.classList.add('hidden');
            if (this.ui.loseScreen) this.ui.loseScreen.classList.add('hidden');
            if (this.ui.pauseScreen) this.ui.pauseScreen.classList.add('hidden');
            if (this.ui.hud) this.ui.hud.classList.remove('hidden');
            if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
            this._updateUI();
        } catch (err) {
            this._showError('[start错误] ' + err.message + '\n' + (err.stack || ''));
        }
    }

    _loop(timestamp) {
        requestAnimationFrame(this._loop);
        if (this.lastTime === 0) { this.lastTime = timestamp; return; }
        var dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        if (this.state === 'playing' && !this.paused) {
            this.time += dt;
            this.elapsedTime += dt;
            this._update(dt);
        } else if (this.state === 'idle') {
            // 待机: 相机轻微摆动展示场景
            this.time += dt;
            this.world.updateCamera(Math.sin(this.time * 0.4) * 0.6, 0, dt);
        }

        this.world.renderer.render(this.world.scene, this.world.camera);
    }

    _update(dt) {
        try {
            this._updateInner(dt);
        } catch (err) {
            this._showError('[update错误] ' + err.message + '\n' + (err.stack || ''));
            this.state = 'lost'; // 停止循环避免刷屏
        }
    }

    _updateInner(dt) {
        // 核心系统更新
        // Boss存活时小队在Boss前方停下，击败Boss才能继续
        var stopZ = this.enemies.boss ? this.enemies.boss.z + 4.5 : null;
        this.squad.update(dt, this.time, stopZ);
        this.gates.update(this.squad, this.effects, this.time);
        this.enemies.update(dt, this.time, this.squad);
        this.combat.update(dt, this.squad, this.enemies);
        this.effects.update(dt);

        // 场景跟随
        this.world.updateRoadScroll(this.squad.z);
        this.world.updateCamera(this.squad.x, this.squad.z, dt);

        // UI刷新
        this._updateUI();

        // Boss血条
        if (this.enemies.boss) {
            this.bossSpawned = true;
            if (this.ui.bossBar) this.ui.bossBar.classList.remove('hidden');
            var ratio = Math.max(0, this.enemies.boss.hp / this.enemies.boss.maxHp);
            if (this.ui.bossFill) this.ui.bossFill.style.width = (ratio * 100) + '%';
        } else if (this.bossSpawned && !this.bossDefeated) {
            this.bossDefeated = true;
            if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        }

        // 胜负判定
        if (this.bossDefeated) { this._win(); return; }
        if (!this.squad.alive || this.squad.count <= 0) { this._lose(); return; }
    }

    _updateUI() {
        var level = LEVELS[this.levelIndex];
        var progress = clamp(-this.squad.z / -level.totalZ, 0, 1);
        if (this.ui.progressFill) this.ui.progressFill.style.width = (progress * 100) + '%';
        if (this.ui.progressFlag) this.ui.progressFlag.style.left = (progress * 100) + '%';

        // 进度节点
        this._updateProgressNodes();

        // 人数气泡(变化时触发弹出/抖动动画)
        if (this.ui.countNum) {
            var countStr = String(this.squad.count);
            if (this.ui.countNum.textContent !== countStr) {
                var prevCount = parseInt(this.ui.countNum.textContent) || 0;
                this.ui.countNum.textContent = countStr;
                var animClass = this.squad.count > prevCount ? 'pop' : 'shake';
                if (this.ui.countBadge) {
                    this.ui.countBadge.classList.remove('pop', 'shake');
                    void this.ui.countBadge.offsetWidth;
                    this.ui.countBadge.classList.add(animClass);
                }
            }
        }

        // 追踪最大人数
        if (this.squad.count > this.maxCount) {
            this.maxCount = this.squad.count;
        }

        // 属性面板(带变化动画)
        if (this.ui.statCount) {
            this.ui.statCount.textContent = this.squad.count;
            this.ui.statDamage.textContent = this.squad.getDamage();
            this.ui.statFirerate.textContent = this.squad.getFireRate().toFixed(1);

            // 输出变化: 闪光
            var curDmg = this.squad.getDamage();
            if (curDmg !== this._prevDamage && this.ui.statRowDamage) {
                this.ui.statRowDamage.classList.remove('flash');
                void this.ui.statRowDamage.offsetWidth;
                this.ui.statRowDamage.classList.add('flash');
                this._prevDamage = curDmg;
            }
            // 射速变化: 加速反馈
            var curFr = this.squad.getFireRate();
            if (Math.abs(curFr - this._prevFireRate) > 0.01 && this.ui.statRowFirerate) {
                this.ui.statRowFirerate.classList.remove('bump');
                void this.ui.statRowFirerate.offsetWidth;
                this.ui.statRowFirerate.classList.add('bump');
                this._prevFireRate = curFr;
            }
            // 人数变化: 跳动
            if (this.ui.statRowCount && this.ui.countNum &&
                this.ui.statCount.textContent !== this.ui.countNum.textContent) {
                this.ui.statRowCount.classList.remove('bump');
                void this.ui.statRowCount.offsetWidth;
                this.ui.statRowCount.classList.add('bump');
            }
        }
    }

    _win() {
        this.state = 'won';
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        // 填充结算数据
        if (this.ui.winCount) this.ui.winCount.textContent = this.squad.count;
        if (this.ui.winKills) this.ui.winKills.textContent = this.enemies.killCount;
        if (this.ui.winMax) this.ui.winMax.textContent = this.maxCount;
        if (this.ui.winTime) this.ui.winTime.textContent = this.elapsedTime.toFixed(1) + 's';
        if (this.ui.winScreen) this.ui.winScreen.classList.remove('hidden');
    }

    _lose() {
        this.state = 'lost';
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        // 填充结算数据
        if (this.ui.loseKills) this.ui.loseKills.textContent = this.enemies.killCount;
        if (this.ui.loseMax) this.ui.loseMax.textContent = this.maxCount;
        if (this.ui.loseScreen) this.ui.loseScreen.classList.remove('hidden');
    }
}

// 启动 (脚本在body底部, DOM已就绪, Three.js已同步加载完成)
(function() {
    function showError(msg) {
        var div = document.getElementById('error-display');
        if (!div) {
            div = document.createElement('div');
            div.id = 'error-display';
            div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC0000;color:#fff;padding:10px 14px;font-size:13px;font-family:monospace;white-space:pre-wrap;pointer-events:none;';
            document.body.appendChild(div);
        }
        div.textContent = msg;
    }

    if (typeof THREE === 'undefined') {
        showError('[致命错误] Three.js 未加载成功!\n请检查网络连接后刷新页面重试。');
        return;
    }

    try {
        window.__game = new Game(); // 暴露实例供调试/测试
    } catch (err) {
        showError('[启动错误] ' + err.message + '\n' + (err.stack || '无堆栈信息'));
    }
})();