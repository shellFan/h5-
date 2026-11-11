// ===== 游戏主控制器: 循环/输入/UI/胜负 =====

class Game {
    constructor() {
        var self = this;
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
        // V4.0: 节奏控制器 — 分批刷怪/场上上限/Boss预警(替代整波同帧生成)
        this.pacing = new GamePacingController(this);
        var self = this;
        this.pacing.spawnFn = function(type, x, z, hp) {
            // V4.0: Boss血量按出场时队伍战力动态缩放 — 任何策略/养成水平都面临~8-12s Boss战
            if (type === 'boss') {
                var base = hp || CONFIG.ZOMBIE.boss.hp;
                var dpsNow = self.squad.count * self.squad.getDamage() * self.squad.getFireRate();
                hp = Math.round((base + dpsNow * 8) / 50) * 50;
            }
            return self.enemies.spawnEnemy(type, x, z, hp);
        };
        this.pacing.aliveCountFn = function() { return self.enemies.aliveCount; };
        this.pacing.onWaveStart = function(w) { /* 波次激活(怪物尚在屏幕外涌入) */ };
        this.pacing.onWaveClear = function(w) {
            if (self.effects && self.state === 'playing') {
                self.effects.floatText(self.squad.x, 2.2, self.squad.z - 1.5, '波次清除!', '#66D68F', false);
            }
        };
        this.pacing.onBossWarning = function(w) { self._showBossWarning(true); };
        // V4.0 爽感: 乘法门慢动作+震屏 / Boss入场爆发
        this.gates.onMul = function(g) { self._slowmo(); self.world.shake(0.22); };
        this.pacing._onBossSpawnFx = function() { self.world.shake(0.5); };
        this.pacing.onBossSpawn = function(w) { self._showBossWarning(false); };
        // V3.4: 广告协调器(复活/双倍/刷门; Platform.ads已在页面引导装配)
        this.adCoord = (typeof GameAdCoordinator !== 'undefined' && window.__adService)
            ? new GameAdCoordinator(window.__adService, {
                pauseGame: function() { self.paused = true; },
                resumeGame: function() { self.paused = false; },
                onReviveReward: function(count, invSec) { self._applyRevive(count, invSec); },
                onDoubleReward: function() { self._onDoubleReward(); },
                onGatesRefresh: function() { self._onGatesRefreshed(); },
                canRefreshGates: function() { return self._hasRerollableGates(); }
            })
            : null;
        this._doubleTaken = false;

        this.state = 'idle'; // idle | playing | won | lost
        // V4.0: 慢动作(乘法门/Boss击杀) — dt缩放, UI与输入不受影响
        this._timeScale = 1;
        this._slowmoT = 0;
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
        // V3.3: 连杀系统
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this._prevKillCount = 0;
        this._comboMilestone = 0;
        // 性能统计
        this._fpsEma = 0;
        this._frameTimes = [];
        // 属性变化追踪(触发动画)
        this._prevDamage = 1;
        this._prevFireRate = 2.2;
        // 人数气泡3D投影用临时向量
        this._badgeV = new THREE.Vector3();

        // 待机画面: 1个士兵站在起点(跳过弹出动画直接显示)
        this.squad.reset(1);
        for (var i = 0; i < this.squad.soldiers.length; i++) {
            this.squad.soldiers[i].spawnT = 1;
        }
        this.squad.update(0.001, 0);
        this.world.updateCamera(0, 0, 0.016, 1);

        this._setupInput();
        this._setupUI();
        this._setupDebugPanel(); // V3.7: ?debug=1 显示运行时美术/性能面板

        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    _setupInput() {
        var self = this;
        // V4.0: 连续拖动 → 目标位置(锚点相对映射, 无阈值跳道), 队伍经阻尼平滑跟随
        var dragAnchorPx = 0;
        var dragAnchorWX = 0;
        var dragging = false;

        function canvasWidth() { return self.canvas.clientWidth || window.innerWidth; }
        function onDown(x) {
            if (self.state !== 'playing' || self.paused) return;
            dragAnchorPx = x;
            dragAnchorWX = self.squad.targetX;
            dragging = true;
        }
        function onMove(x) {
            if (!dragging || self.state !== 'playing' || self.paused) return;
            self.squad.targetX = MovementMath.dragTarget(
                dragAnchorWX, x - dragAnchorPx, canvasWidth(),
                MovementMath.centerBounds(self.squad.getHalfWidth()));
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

        // 键盘 (方向键/AD) — 连续位移(不吸附固定跑道)
        window.addEventListener('keydown', function(e) {
            if (self.state !== 'playing' || self.paused) return;
            var maxX = MovementMath.centerBounds(self.squad.getHalfWidth());
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                self.squad.targetX = MovementMath.keyTarget(self.squad.targetX, -1, maxX);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                self.squad.targetX = MovementMath.keyTarget(self.squad.targetX, 1, maxX);
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
            winCombo: document.getElementById('win-combo'),
            loseKills: document.getElementById('lose-kills'),
            loseMax: document.getElementById('lose-max'),
            loseCombo: document.getElementById('lose-combo'),
            loseReason: document.getElementById('lose-reason'),
            comboBox: document.getElementById('combo-box'),
            comboNum: document.getElementById('combo-num'),
            levelSelect: document.getElementById('level-select'),
            btnNextLevel: document.getElementById('btn-next-level'),
            // V3.4: 广告入口
            btnRevive: document.getElementById('btn-revive'),
            btnDouble: document.getElementById('btn-double-reward'),
            btnRefreshGates: document.getElementById('btn-refresh-gates'),
            rgCount: document.getElementById('rg-count'),
            btnSound: document.getElementById('btn-sound-toggle')
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
        // V3.4: 双倍结算 / 刷门 / 音效开关
        if (this.ui.btnDouble) this.ui.btnDouble.addEventListener('click', function() { self._doubleRewardViaAd(); });
        if (this.ui.btnRefreshGates) this.ui.btnRefreshGates.addEventListener('click', function() { self._refreshGatesViaAd(); });
        if (this.ui.btnSound) this.ui.btnSound.addEventListener('click', function() { self._toggleSound(); });
        // V3.3: 下一关按钮
        if (this.ui.btnNextLevel) {
            this.ui.btnNextLevel.addEventListener('click', function() {
                if (self.levelIndex + 1 < LEVELS.length) {
                    self.levelIndex++;
                    self.start();
                }
            });
        }
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

        // V3.3: 生成关卡选择按钮
        if (this.ui.levelSelect) {
            for (var i = 0; i < LEVELS.length; i++) {
                var b = document.createElement('button');
                b.textContent = String(i + 1);
                this.ui.levelSelect.appendChild(b);
            }
        }
        this._refreshLevelSelect();
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

    /** V4.0: Boss出场预警横幅(震动+音效, 预警结束由onBossSpawn隐藏) */
    /** V4.0: 短暂慢动作(0.35s, 时间流速0.35), 不打断操作 */
    _slowmo() {
        this._timeScale = 0.35;
        this._slowmoT = 0.35;
    }

    _showBossWarning(show) {
        var el = document.getElementById('boss-warning');
        if (!el) return;
        if (show) {
            el.classList.remove('hidden');
            // 强制重启动画
            void el.offsetWidth;
            el.classList.add('warning-anim');
            if (typeof Platform !== 'undefined' && Platform.audio) {
                Platform.audio.init();
                Platform.audio.play('bossWarn');
            }
        } else {
            el.classList.add('hidden');
            el.classList.remove('warning-anim');
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
        this.pacing.clear();
        this._showBossWarning(false);
        this.combat.clear();
        // V3.3: 刷新关卡选择解锁状态
        this._refreshLevelSelect();
    }

    _revive() {
        // V3.4: 复活必须通过激励视频(每局最多1次, 平台确认完整观看才发奖)
        if (!this.adCoord || !this.adCoord.canRevive()) {
            // 无广告环境/次数用尽: 按钮已隐藏, 此处兜底不复活
            return;
        }
        var maxBefore = Math.max(this.maxCount, 10);
        this.adCoord.requestRevive(maxBefore).then(function(granted) {
            if (!granted) {
                // 提前关闭/展示失败: 保持失败界面, 用户可重试或重新挑战
            }
        });
    }

    /** 实际复活执行(由广告协调器发奖回调) */
    _applyRevive(count, invSec) {
        this.state = 'playing';
        this.squad.alive = true;
        this.squad.setCount(count);
        this.squad.invulnT = invSec || 2.0;
        if (this.ui.loseScreen) this.ui.loseScreen.classList.add('hidden');
        if (this.ui.hud) this.ui.hud.classList.remove('hidden');
        // 复活反馈
        if (this.effects) {
            this.effects.floatText(this.squad.x, 2.2, this.squad.z, '复活!', '#75DFFF', true);
            this.effects.shockwave(this.squad.x, 0.05, this.squad.z, 0x75DFFF);
        }
    }

    /** V3.4: 双倍结算(胜利界面按钮 → 激励视频) */
    _doubleRewardViaAd() {
        if (!this.adCoord || this._doubleTaken) return;
        var self = this;
        this.adCoord.requestDoubleReward().then(function(granted) {
            if (!granted && self.state === 'won') {
                // 提前关闭: 按钮恢复可点, 用户可重试
                if (self.ui.btnDouble) self.ui.btnDouble.disabled = false;
            }
        });
    }

    /** 双倍奖励发放回调 */
    _onDoubleReward() {
        this._doubleTaken = true;
        if (this.ui.btnDouble) {
            this.ui.btnDouble.textContent = '✓ 已领取双倍';
            this.ui.btnDouble.disabled = true;
        }
        if (this.effects) {
            this.effects.floatText(this.squad.x, 2.0, this.squad.z, '奖励×2!', '#FFC247', true);
        }
    }

    /** V3.4: 广告刷门(HUD按钮 → 激励视频) */
    _refreshGatesViaAd() {
        if (!this.adCoord || !this.adCoord.canRefreshGates() || !this._hasRerollableGates()) return;
        this.adCoord.requestGateRefresh().then(function(granted) { /* 发奖回调 _onGatesRefreshed */ });
    }

    /** 当前是否有"前方未触发且可重随"的门 */
    _hasRerollableGates() {
        if (!this.gates || this.state !== 'playing') return false;
        for (var i = 0; i < this.gates.gates.length; i++) {
            var g = this.gates.gates[i];
            if (!g.triggered && g.z < this.squad.z) return true;
        }
        return false;
    }

    /** 刷门发奖回调: 重随前方门 */
    _onGatesRefreshed() {
        if (!this.gates) return;
        var n = this.gates.refreshAhead(this.squad.z);
        if (n > 0 && this.effects) {
            this.effects.floatText(this.squad.x, 2.4, this.squad.z, '状态门刷新!', '#A14DFF', true);
            this.effects.shockwave(this.squad.x, 0.05, this.squad.z, 0xA14DFF);
        }
        this._updateAdButtons();
    }

    /** V3.4: 音效开关(暂停菜单) */
    _toggleSound() {
        if (typeof Platform === 'undefined') return;
        Platform.audio.init(); // 用户手势触发初始化
        var muted = !Platform.audio.isMuted();
        Platform.audio.setMuted(muted);
        this._updateSoundLabel();
        Platform.audio.play('click');
    }

    _updateSoundLabel() {
        if (!this.ui.btnSound || typeof Platform === 'undefined') return;
        this.ui.btnSound.textContent = Platform.audio.isMuted() ? '🔇 音效: 关' : '🔊 音效: 开';
    }

    /** V3.4: 广告入口按钮可见性(随状态/次数刷新) */
    _updateAdButtons() {
        var coord = this.adCoord;
        // 复活按钮: 失败界面 && 尚有次数
        if (this.ui.btnRevive) {
            var canRevive = !!(coord && coord.canRevive());
            this.ui.btnRevive.classList.toggle('hidden', !canRevive);
        }
        // 双倍按钮: 胜利界面 && 尚有次数 && 未领取
        if (this.ui.btnDouble) {
            var canDouble = !!(coord && coord.canDoubleReward()) && !this._doubleTaken;
            this.ui.btnDouble.classList.toggle('hidden', !canDouble);
            if (canDouble) { this.ui.btnDouble.textContent = '📺 双倍奖励'; this.ui.btnDouble.disabled = false; }
        }
        // 刷门按钮: 战斗中 && 尚有次数 && 有可刷的门
        if (this.ui.btnRefreshGates) {
            var canRefresh = !!(coord && coord.canRefreshGates()) && this._hasRerollableGates();
            this.ui.btnRefreshGates.classList.toggle('hidden', !canRefresh);
            if (coord && this.ui.rgCount) this.ui.rgCount.textContent = coord.getGateRefreshLeft();
        }
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

    /** 性能报告: FPS/P95帧耗时/DrawCall/三角形 (V3.6测试用) */
    getPerf() {
        var ft = (this._frameTimes || []).slice().sort(function(a, b) { return a - b; });
        var p95 = ft.length ? ft[Math.floor(ft.length * 0.95)] : 0;
        var r = this.world.renderer.info;
        return {
            fps: Math.round(this._fpsEma),
            workMs: +(this._workMs || 0).toFixed(2),
            p95FrameMs: +p95.toFixed(2),
            drawCalls: r.render.calls,
            triangles: r.render.triangles,
            geometries: r.memory.geometries,
            textures: r.memory.textures,
            squadCount: this.squad.count,
            enemyCount: this.enemies.enemies.length,
            quality: this.world.quality
        };
    }

    /** V3.7 运行时美术资源追踪报告: 证明实际渲染场景使用的模型/材质/纹理来源 */
    artReport() {
        var self = this;
        var provenance = {};   // artSource标签 -> {objects, meshes}
        var untaggedMeshes = 0;
        var sceneObjs = 0;
        this.world.scene.traverse(function(node) {
            sceneObjs++;
            var src = node.userData && node.userData.artSource;
            if (node.isMesh || node.isSprite || node.isInstancedMesh) {
                if (src) {
                    if (!provenance[src]) provenance[src] = { objects: 0, visible: 0 };
                    provenance[src].objects++;
                    if (node.visible) provenance[src].visible++;
                } else if (node.parent && !(node.parent.userData && node.parent.userData.artSource)) {
                    untaggedMeshes++;
                }
            }
        });
        // 归组: 带标签的Group/InstancedMesh自身记1, 其子mesh跟随标签(上面parent逻辑会跳过计数, 但要并入)
        // 简化: 重新遍历, 子对象继承最近祖先标签; Sprite继承共享材质标签
        var grouped = {};
        this.world.scene.traverse(function(node) {
            var src = null;
            var n = node;
            while (n) {
                if (n.userData && n.userData.artSource) { src = n.userData.artSource; break; }
                n = n.parent;
            }
            if (!src && node.material && node.material.userData && node.material.userData.artSource) {
                src = node.material.userData.artSource;
            }
            if (!src) return;
            if (!node.visible) return; // 隐藏对象(如粒子池)不计入实际渲染
            if (!grouped[src]) grouped[src] = { objects: 0, visible: 0 };
            grouped[src].objects++;
            grouped[src].visible++;
        });

        // 外部资产加载状态
        var assetStatus = [];
        var imgs = document.images;
        for (var i = 0; i < imgs.length; i++) {
            assetStatus.push({
                src: imgs[i].src.split('/').slice(-2).join('/'),
                status: imgs[i].complete && imgs[i].naturalWidth > 0 ? 'LOADED' : 'FAILED',
                used: 'UI/' + (imgs[i].alt || 'img')
            });
        }
        var bulletTexLoaded = !!(this.combat && this.combat._bulletTex);
        assetStatus.push({
            src: 'assets/art-v1/effects/bullet-glow.svg',
            status: bulletTexLoaded ? 'LOADED' : (this.combat && this.combat._bulletMat && this.combat._bulletMat.map ? 'FALLBACK(程序化兜底)' : 'LOADING'),
            used: '弹道Sprite纹理'
        });

        var perf = this.getPerf();
        return {
            timestamp: new Date().toISOString(),
            sceneObjects: sceneObjs,
            provenance: grouped,
            untaggedRenderables: untaggedMeshes,
            assets: assetStatus,
            perf: perf,
            camera: {
                pos: this.world.camera.position.toArray().map(function(x) { return +x.toFixed(2); }),
                fov: this.world.camera.fov
            },
            modelPolicy: 'assets/art-v1/仅含4个SVG(bullet-glow/双头像/gate-panel) — 无GLB/无角色PNG; 角色按大纲优先级3程序化建模'
        };
    }

    /** V3.7 调试面板(?debug=1): FPS/DrawCall/模型来源 实时显示 */
    _setupDebugPanel() {
        if (location.search.indexOf('debug') === -1) return;
        var self = this;
        var div = document.createElement('div');
        div.id = 'art-debug-panel';
        div.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99998;background:rgba(10,20,40,0.82);color:#7FE0FF;font:11px/1.5 monospace;padding:8px 10px;border-radius:8px;pointer-events:none;white-space:pre;max-width:46vw;';
        document.body.appendChild(div);
        this._debugPanel = div;
        setInterval(function() {
            if (!self._debugPanel) return;
            var p = self.getPerf();
            var src = [
                '士兵: ' + (self.squad.mesh && self.squad.mesh.userData.artSource ? 'createSoldierBodyGeometry+Leg(实例化x3)' : '?'),
                '僵尸: ' + (self.enemies.enemies.length ? (self.enemies.enemies[0].model.userData.artSource || '?') : '场景无僵尸'),
                'Boss: ' + (self.enemies.boss ? (self.enemies.boss.model.userData.artSource || '?') : '未出现')
            ].join('\n');
            self._debugPanel.textContent =
                'FPS ' + p.fps + ' | work ' + p.workMs + 'ms | DC ' + p.drawCalls + ' | Tri ' + (p.triangles / 1000).toFixed(0) + 'k\n' +
                '兵 ' + p.squadCount + ' | 敌 ' + p.enemyCount + ' | 画质 ' + p.quality + '\n' + src;
        }, 500);
    }

    start() {
        try {
            var level = LEVELS[this.levelIndex];
            this.squad.reset(level.startCount);
            this.gates.loadFromLevel(level);
            this.enemies.loadFromLevel(level);
            // V4.0: 波次计划移交节奏控制器(分批生成)
            this.pacing.loadFromLevel(level, this.levelIndex);
            this._showBossWarning(false);
            this.combat.clear();
            // V3.4: 每局重置广告次数 + 音频手势初始化
            if (this.adCoord) this.adCoord.startRun();
            this._doubleTaken = false;
            if (typeof Platform !== 'undefined') Platform.audio.init();

            this.state = 'playing';
            this.paused = false;
            this.time = 0;
            this.elapsedTime = 0;
            this.kills = 0;
            this.maxCount = level.startCount;
            this.bossSpawned = false;
            this.bossDefeated = false;
            // V3.3: 重置连杀
            this.combo = 0;
            this.comboTimer = 0;
            this.maxCombo = 0;
            this._prevKillCount = 0;
            this._comboMilestone = 0;
            if (this.ui.comboBox) this.ui.comboBox.classList.add('hidden');
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
            // V3.4: 刷新广告按钮可见性
            this._updateAdButtons();
            this._updateSoundLabel();
            this._updateUI();
        } catch (err) {
            this._showError('[start错误] ' + err.message + '\n' + (err.stack || ''));
        }
    }

    _loop(timestamp) {
        requestAnimationFrame(this._loop);
        var workT0 = performance.now();
        if (this.lastTime === 0) { this.lastTime = timestamp; return; }
        var dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        // 性能采样: FPS指数移动平均 + P95帧耗时统计 (V3.6)
        this._fpsEma = this._fpsEma ? this._fpsEma * 0.95 + (1 / Math.max(dt, 0.0001)) * 0.05 : 1 / Math.max(dt, 0.0001);
        this._frameMs = dt * 1000;
        if (!this._frameTimes) this._frameTimes = [];
        this._frameTimes.push(this._frameMs);
        if (this._frameTimes.length > 300) this._frameTimes.shift();

        if (this.state === 'playing' && !this.paused) {
            // V4.0: 慢动作缩放游戏时间(输入/UI仍用真实dt)
            if (this._slowmoT > 0) {
                this._slowmoT -= dt;
            } else {
                this._timeScale = 1;
            }
            var ts = this._timeScale;
            this.time += dt * ts;
            this.elapsedTime += dt;
            this._update(dt * ts);
        } else if (this.state === 'idle') {
            // 待机: 相机轻微摆动展示场景
            this.time += dt;
            this.world.updateCamera(Math.sin(this.time * 0.4) * 0.6, 0, dt, 1);
        }

        this.world.renderer.render(this.world.scene, this.world.camera);

        // 单帧计算耗时(含update+render提交, 不受rAF节流影响)
        this._workMs = this._workMs ? this._workMs * 0.9 + (performance.now() - workT0) * 0.1 : (performance.now() - workT0);
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
        this.gates.update(this.squad, this.effects, this.time, dt);
        // V4.0: 节奏控制器驱动分批刷怪/Boss预警
        this.pacing.update(dt, this.squad);
        this.enemies.update(dt, this.time, this.squad);
        this.combat.update(dt, this.squad, this.enemies);
        this.effects.update(dt);

        // V3.3: 连杀系统 — 击杀数增长时combo+1, 2秒无击杀清零
        var kc = this.enemies.killCount;
        if (kc > this._prevKillCount) {
            this.combo += kc - this._prevKillCount;
            this.comboTimer = 2.0;
            // 连杀里程碑
            var milestones = [10, 30, 50, 100];
            for (var mi = 0; mi < milestones.length; mi++) {
                if (this.combo >= milestones[mi] && this._prevKillCount < milestones[mi] && kc - this._prevKillCount <= milestones[mi] - this._prevKillCount) {
                    if (this._comboMilestone !== milestones[mi]) {
                        this._comboMilestone = milestones[mi];
                        this.effects.floatText(this.squad.x, 2.2, this.squad.z - 1, milestones[mi] + '连杀!', '#FFC247', true);
                        this.effects.shockwave(this.squad.x, 0.05, this.squad.z, 0xFFC247);
                    }
                }
            }
            this.maxCombo = Math.max(this.maxCombo || 0, this.combo);
        }
        this._prevKillCount = kc;
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) { this.combo = 0; this._comboMilestone = 0; }
        }

        // 场景跟随
        this.world.updateRoadScroll(this.squad.z);
        this.world.updateCamera(this.squad.x, this.squad.z, dt, this.squad.count);

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
        if (!this.squad.alive || this.squad.count <= 0) {
            // V3.3: 失败原因追踪
            var reason = '小队全灭';
            if (this.enemies.boss) reason = 'Boss战失利 · 输出不足';
            else if (this.enemies.aliveCount > 8) reason = '被怪潮吞噬 · 人数不足';
            else reason = '阵亡于残敌 · 火力分散';
            this._lose(reason);
            return;
        }
    }

    _updateUI() {
        var level = LEVELS[this.levelIndex];
        var progress = clamp(-this.squad.z / -level.totalZ, 0, 1);
        if (this.ui.progressFill) this.ui.progressFill.style.width = (progress * 100) + '%';
        if (this.ui.progressFlag) this.ui.progressFlag.style.left = (progress * 100) + '%';

        // 进度节点
        this._updateProgressNodes();

        // 人数气泡: 跟随小队头顶(V3.6: 3D投影定位,随队伍移动不遮挡弹道)
        if (this.ui.countBadge && this.state === 'playing') {
            var cam = this.world.camera;
            this._badgeV.set(this.squad.x, 2.0, this.squad.z - 0.3).project(cam);
            if (this._badgeV.z < 1) {
                var cw = this.world.canvas.clientWidth || window.innerWidth;
                var ch = this.world.canvas.clientHeight || window.innerHeight;
                var sx = (this._badgeV.x * 0.5 + 0.5) * cw;
                var sy = (-this._badgeV.y * 0.5 + 0.5) * ch;
                // 屏幕内钳制: 避免压到HUD或飞出边界
                sx = clamp(sx, 46, cw - 46);
                sy = clamp(sy, 150, ch - 40);
                if (sy < 200 && sx < 145) sx = 145; // 避让左上属性面板
                this.ui.countBadge.style.left = sx + 'px';
                this.ui.countBadge.style.top = (sy - 40) + 'px';
                this.ui.countBadge.style.display = 'flex';
            } else {
                this.ui.countBadge.style.display = 'none';
            }
        }

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

        // V3.3: 连杀HUD (combo>=5时显示)
        if (this.ui.comboBox) {
            if (this.combo >= 5 && this.state === 'playing') {
                this.ui.comboBox.classList.remove('hidden');
                if (this.ui.comboNum) this.ui.comboNum.textContent = this.combo;
                this.ui.comboBox.classList.toggle('hot', this.combo >= 30);
            } else {
                this.ui.comboBox.classList.add('hidden');
            }
        }

        // V3.4: 刷门按钮状态刷新(战斗中)
        if (this.adCoord && this.state === 'playing') {
            this._updateAdButtons();
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
        this._showBossWarning(false);
        // 填充结算数据
        if (this.ui.winCount) this.ui.winCount.textContent = this.squad.count;
        if (this.ui.winKills) this.ui.winKills.textContent = this.enemies.killCount;
        if (this.ui.winMax) this.ui.winMax.textContent = this.maxCount;
        if (this.ui.winTime) this.ui.winTime.textContent = this.elapsedTime.toFixed(1) + 's';
        // V3.3: 连杀统计
        if (this.ui.winCombo) this.ui.winCombo.textContent = this.maxCombo || 0;
        // V3.3: 通关存档 — 解锁下一关
        this._saveProgress(Math.min(LEVELS.length, this.levelIndex + 2));
        // V3.4: 双倍按钮(每通关限1次)
        this._updateAdButtons();
        if (this.ui.winScreen) this.ui.winScreen.classList.remove('hidden');
        // V3.3: 胜利→下一关按钮
        var hasNext = this.levelIndex + 1 < LEVELS.length;
        if (this.ui.btnNextLevel) {
            this.ui.btnNextLevel.classList.toggle('hidden', !hasNext);
        }
    }

    _lose(reason) {
        this.state = 'lost';
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        this._showBossWarning(false);
        // 填充结算数据
        if (this.ui.loseKills) this.ui.loseKills.textContent = this.enemies.killCount;
        if (this.ui.loseMax) this.ui.loseMax.textContent = this.maxCount;
        if (this.ui.loseCombo) this.ui.loseCombo.textContent = this.maxCombo || 0;
        // V3.3: 失败原因
        if (this.ui.loseReason) this.ui.loseReason.textContent = reason || '小队全灭';
        // V3.4: 复活按钮(每局限1次)
        this._updateAdButtons();
        if (this.ui.loseScreen) this.ui.loseScreen.classList.remove('hidden');
    }

    // ===== V3.3: 存档系统(关卡解锁进度) =====
    _loadProgress() {
        try {
            var v = parseInt(window.localStorage.getItem('pz_progress')) || 1;
            return clamp(v, 1, LEVELS.length);
        } catch (e) { return 1; }
    }

    _saveProgress(unlocked) {
        try {
            var cur = this._loadProgress();
            if (unlocked > cur) {
                window.localStorage.setItem('pz_progress', String(unlocked));
            }
        } catch (e) { /* 存储不可用则跳过 */ }
    }

    /** 刷新关卡选择按钮(解锁状态) */
    _refreshLevelSelect() {
        if (!this.ui.levelSelect) return;
        var unlocked = this._loadProgress();
        var self = this;
        var btns = this.ui.levelSelect.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
            (function(idx, btn) {
                var isUnlocked = idx < unlocked;
                btn.className = 'lv-btn' + (isUnlocked ? ' unlocked' : ' locked') + (idx + 1 === unlocked ? ' current' : '');
                btn.disabled = !isUnlocked;
                btn.onclick = function() {
                    self.levelIndex = idx;
                    self.start();
                };
            })(i, btns[i]);
        }
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