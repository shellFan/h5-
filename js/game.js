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
        // V5.1: 永久档案(金币/升级/解锁) — Squad 构造时注入以读取永久属性
        this.profile = (typeof GameProfile !== 'undefined' && Platform.storage)
            ? new GameProfile(Platform.storage, Platform.storageAdapter) : null;
        this.shop = (typeof UpgradeShop !== 'undefined') ? UpgradeShop : null;
        this.squad = new Squad(this.world.scene, this.profile);
        this.squad._gameRef = this; // V11.5修复: 原惰性挂到首帧squad.update — 启动前读取武器/职业/科技乘区全部静默失效
        this.gates = new GateSystem(this.world.scene);
        this.enemies = new EnemyManager(this.world.scene, this.effects);
        this.combat = new CombatSystem(this.world.scene, this.effects);
        // V4.0: 节奏控制器 — 分批刷怪/场上上限/Boss预警(替代整波同帧生成)
        this.pacing = new GamePacingController(this);
        this.pacing.spawnFn = function(type, x, z, hp) {
            // Enemy health depends on the encounter, never on the player's upgrades.
            if (type !== 'boss' && !hp) {
                var refHp = (CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal).hp;
                // V8.0: 越界防御 — 乘数缺失时用末档而不是静默回退基础血量
                var hpMul = CONFIG.ENEMY_HP_MULTIPLIER[Math.min(self.levelIndex, CONFIG.ENEMY_HP_MULTIPLIER.length - 1)] || 1.7;
                hp = Math.round(refHp * hpMul);
            }
            // V4.0: Boss血量按出场时队伍战力动态缩放 — 任何策略/养成水平都面临~8-12s Boss战
            if (type === 'boss') {
                // V5.1.3: Boss血量 = 人数×DPS双因子(人数=防御/竞速生存, DPS=输出) —
                // V8.0.1: 恢复在重构中丢失的双因子公式: hp = clamp(count×totalDPS×0.5, 关卡值×0.5, 关卡值×12)
                // 战斗时长 ≈ 0.5×count/(0.8×volley) ≈ 9-12s, 与养成水平无关。
                var base = hp || CONFIG.ZOMBIE.boss.hp;
                var bossDps = self.squad.count * self.squad.getDamage() * self.squad.getFireRate();
                var dualFactor = Math.max(base * 0.5, Math.min(self.squad.count * bossDps * 0.5, base * 12));
                hp = Math.round(dualFactor);
            }
            if(type==='boss' && self.enemies.bossStyle==='twinelite') {
                self.enemies.spawnEnemy(type,-1.1,z,hp/2,'elite');
                return self.enemies.spawnEnemy(type,1.1,z,hp/2,'elite');
            }
            return self.enemies.spawnEnemy(type, x, z, hp);
        };
        this.pacing.aliveCountFn = function() { return self.enemies.encounterOutstanding; };
        this.pacing.gateReadyFn = function(w, squad) {
            return self.gates.isRowChosen(w.requiredGateZ) && squad.z <= w.requiredGateZ - 1.5;
        };
        this.pacing.onWaveStart = function(w) {
            self._waveNoticeT=CONFIG.PACING.firstContactGrace;
            var el=document.getElementById('v42-wave-banner');
            if(el){el.textContent='怪潮接近 · 准备射击';el.classList.remove('hidden');}
        };
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

        // 待机画面: V5.0 首页军团展示 — 12人士兵方阵行进姿态(原1人被面板遮挡)
        this._setupIdleShowcase();

        this._setupInput();
        this._setupUI();
        this._setupDebugPanel(); // V3.7: ?debug=1 显示运行时美术/性能面板
        V42Art.installUI(this);
        this._bindHomeButtons(); // V10 QA: 动态首页按钮绑定(依赖 installUI 创建的 DOM)
        if (typeof V60UI !== 'undefined') V60UI.install(this);
        if (typeof ArtUI !== 'undefined') ArtUI.install(this);

        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    /** V5.0: 首页待机军团展示 — 小方阵置于镜头中上部, 不被首页面板遮挡 */
    _setupIdleShowcase() {
        this.squad.reset(12);
        for (var i = 0; i < this.squad.soldiers.length; i++) {
            this.squad.soldiers[i].spawnT = 1;
        }
        this.squad.z = -13;
        this.squad.update(0.001, 0);
        this.world.updateRoadScroll(this.squad.z);
        this.world.updateCamera(0, this.squad.z, 0.016, 12);
        this._refreshBestRecord();
    }

    /** V5.0: 刷新首页最高纪录(防御性: 元素可能不存在) */
    _refreshBestRecord() {
        try { this._updateBestRecord(); } catch (e) {}
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
            dragging = true; self._isDragging = true;
        }
        function onMove(x) {
            if (!dragging || self.state !== 'playing' || self.paused) return;
            self.squad.targetX = MovementMath.dragTarget(
                dragAnchorWX, x - dragAnchorPx, canvasWidth(),
                MovementMath.centerBounds(self.squad.getHalfWidth()));
        }
        function onUp() { dragging = false; self._isDragging = false; }

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
            btnSound: document.getElementById('btn-sound-toggle'),
            // V5.0: 首页元素
            homeSound: document.getElementById('btn-home-sound'),
            bestRecord: document.getElementById('v42-best-record')
        };

        // 进度节点数据(从关卡segments动态生成)
        this.progressNodes = [];

        // 按钮事件绑定(防御性: 元素可能不存在于测试页面)
        var btnStart = document.getElementById('btn-start');
        if (btnStart) btnStart.addEventListener('click', function() { self._sfx('click'); self.start(); });
        var btnRestartWin = document.getElementById('btn-restart-win');
        if (btnRestartWin) btnRestartWin.addEventListener('click', function() { self._sfx('click'); self.start(); });
        var btnRestartLose = document.getElementById('btn-restart-lose');
        if (btnRestartLose) btnRestartLose.addEventListener('click', function() { self._sfx('click'); self.start(); });
        // V5.0: 失败页返回首页入口(任务书9.5)
        var btnLoseMenu = document.getElementById('btn-lose-menu');
        if (btnLoseMenu) btnLoseMenu.addEventListener('click', function() { self._sfx('click'); self._backToMenu(); });
        var btnPause = document.getElementById('btn-pause');
        if (btnPause) btnPause.addEventListener('click', function() { self._sfx('click'); self._togglePause(); });
        var btnRevive = document.getElementById('btn-revive');
        if (btnRevive) btnRevive.addEventListener('click', function() { self._revive(); });
        // V3.4: 双倍结算 / 刷门 / 音效开关
        if (this.ui.btnDouble) this.ui.btnDouble.addEventListener('click', function() { self._doubleRewardViaAd(); });
        if (this.ui.btnRefreshGates) this.ui.btnRefreshGates.addEventListener('click', function() { self._refreshGatesViaAd(); });
        if (this.ui.btnSound) this.ui.btnSound.addEventListener('click', function() { self._toggleSound(); });
        // V5.0: 首页音效开关/免费补给/升级商店按钮由 V42Art.installUI 动态创建,
        // 必须在 installUI 之后绑定(此前在此处绑定时元素尚不存在, 监听从未挂上 → 死按钮)
        // V5.1.4: 胜利页商店入口(静态元素, 此处可绑)
        var btnShopWin = document.getElementById('btn-open-shop-win');
        if (btnShopWin) btnShopWin.addEventListener('click', function() { self._sfx('click'); self._openShop(); });
        // V5.1: 商店UI装配
        this._setupShopUI();
        this._refreshCoinDisplays();
        // V3.3: 下一关按钮
        if (this.ui.btnNextLevel) {
            this.ui.btnNextLevel.addEventListener('click', function() {
                if (self.levelIndex + 1 < LEVELS.length) {
                    self._sfx('click');
                    self.levelIndex++;
                    self.start();
                }
            });
        }
        // 暂停菜单按钮
        var btnResume = document.getElementById('btn-resume');
        if (btnResume) btnResume.addEventListener('click', function() { self._sfx('click'); self._togglePause(); });
        var btnPauseRestart = document.getElementById('btn-pause-restart');
        if (btnPauseRestart) btnPauseRestart.addEventListener('click', function() {
            self._sfx('click');
            if (self.ui.pauseScreen) self.ui.pauseScreen.classList.add('hidden');
            self.paused = false;
            self.start();
        });
        var btnPauseMenu = document.getElementById('btn-pause-menu');
        if (btnPauseMenu) btnPauseMenu.addEventListener('click', function() { self._sfx('click'); self._backToMenu(); });

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
            if(seg.type!=='boss' && (seg.type!=='wave' || level.segments.filter((s,index)=>index<=i&&s.type==='wave').length%2===0))continue;
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

    /** V6.0: 能源核心生成与清理 */
    _setupEnergyCore(level) {
        if (this.energyCore) { this.energyCore.destroy(this.world.scene); this.energyCore = null; }
        var seg = null;
        for (var i = 0; i < level.segments.length; i++) {
            if (level.segments[i].type === 'energy') { seg = level.segments[i]; break; }
        }
        if (!seg || typeof EnergyCore === 'undefined') return;
        this.energyCore = new EnergyCore(this.world.scene, 0, seg.z, seg.core || {}, this);
    }

    /** V6.0: 能源核心击破回调 */
    onCoreDestroyed() {
        if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z, '僵尸失去强化!', '#66FFB3', true);
    }

    /** V5.0: 统一音效入口(自动初始化 + 平台/静音守卫) */
    _sfx(type) {
        if (typeof Platform === 'undefined' || !Platform.audio) return;
        Platform.audio.play(type);
    }

    /** V4.0: Boss出场预警横幅(震动+音效, 预警结束由onBossSpawn隐藏) */
    /** V4.0: 短暂慢动作(0.35s, 时间流速0.35), 不打断操作 */
    _slowmo() {
        this._timeScale = 0.35;
        this._slowmoT = 0.35;
    }

    /** Game Feel: 轻量化命中顿帧(真实dt倒计时, 重叠调用取更强/更长, 绝不卡死输入) */
    triggerHitStop(duration, scale) {
        if (this.world && this.world._shakeDisabled) return;
        var dur = Math.min(0.08, Math.max(0.015, duration || 0.032));
        var sc = Math.max(0.08, Math.min(0.6, scale || 0.18));
        if (this._slowmoT > dur && this._timeScale <= sc) return;
        this._timeScale = sc;
        this._slowmoT = dur;
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
        if (this.ui.winScreen) this.ui.winScreen.classList.add('hidden');
        if (this.ui.loseScreen) this.ui.loseScreen.classList.add('hidden');
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        if (this.ui.startScreen) this.ui.startScreen.classList.remove('hidden');
        // V5.0: 恢复首页待机军团展示
        this._setupIdleShowcase();
        // V10 QA修复: 返回主页时销毁能源核心(原滞留场景)
        if (this.energyCore) { this.energyCore.destroy(this.world.scene); this.energyCore = null; }
        this.gates.clear();
        this.enemies.clear();
        this.pacing.clear();
        var ws = document.getElementById('win-stars'); if (ws) ws.classList.add('hidden');
            this._showBossWarning(false);
        this.combat.clear();
        this.effects.clear();
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
        // V8.0: 挑战模式复活 — 重新开启计分(基准重置, 只计复活后的增量)
        if (this._challenge) {
            this._challenge._scored = false;
            this._challenge._bossStart = this.enemies.bossKills || 0;
        }
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

    /** 双倍奖励发放回调(V5.1: 对本次结算的关卡奖励补发一次, 幂等) */
    _onDoubleReward() {
        this._doubleTaken = true;
        if (this._settlement && this._settlement.levelReward > 0 && !this._doubleApplied) {
            this._doubleApplied = true;
            this._settlement.doubled = true;
            this._settlement.total += this._settlement.levelReward;
            if (this.profile) this.profile.addCoins(this._settlement.levelReward);
        }
        if (this.ui.btnDouble) {
            this.ui.btnDouble.textContent = '✓ 已领取双倍';
            this.ui.btnDouble.disabled = true;
        }
        this._fillSettlementUI();
        if (this.effects) {
            this.effects.floatText(this.squad.x, 2.0, this.squad.z, '奖励×2!', '#FFC247', true);
        }
    }

    /** V5.1: 结算面板金币明细(金币飞入动画在CSS) */
    _fillSettlementUI() {
        var box = document.getElementById('win-coins');
        var st = this._settlement;
        if (box && st) {
            document.getElementById('wc-level').textContent = '+' + st.levelReward;
            document.getElementById('wc-kills').textContent = '+' + st.killReward;
            var dbl = document.getElementById('wc-double-row');
            if (dbl) dbl.classList.toggle('hidden', !st.doubled);
            if (st.doubled) document.getElementById('wc-double').textContent = '+' + st.levelReward;
            document.getElementById('wc-total').textContent = st.total;
            box.classList.remove('hidden');
            box.classList.remove('coin-in'); void box.offsetWidth; box.classList.add('coin-in');
        }
        var loseBox = document.getElementById('lose-coins');
        if (loseBox && st && this.state === 'lost') {
            document.getElementById('lc-kills-coin').textContent = '+' + st.killReward;
            var xpEl = document.getElementById('lc-xp');
            if (xpEl) xpEl.textContent = '+' + (this.enemies.killCount * ((typeof XP_RULES !== 'undefined' && XP_RULES.perKill) || 1)); // V10 QA修复: 与实际入账公式一致
            loseBox.classList.remove('hidden');
        }
        // VNext: 装备掉落展示(胜利/失败面板共用逻辑)
        this._renderSettlementDrops('win-coins', 'wc-drops-row', '📦 装备掉落');
        this._renderSettlementDrops('lose-coins', 'lc-drops-row', '📦 掉落');
        this._refreshCoinDisplays();
    }

    /** VNext: 结算面板掉落行(动态注入, 无掉落显示"无") */
    _renderSettlementDrops(boxId, rowId, label) {
        var box = document.getElementById(boxId);
        if (!box) return;
        var row = document.getElementById(rowId);
        if (!row) {
            row = document.createElement('div');
            row.id = rowId;
            row.className = 'wc-row';
            var total = box.querySelector('.wc-total') || box.lastElementChild;
            if (total) box.insertBefore(row, total); else box.appendChild(row);
        }
        var drops = this._drops || [];
        row.innerHTML = '<span>' + label + '</span><b>' +
            (drops.length ? drops.map(function(d) { return d.name; }).join('、') : '无') + '</b>';
    }

    /** V5.1: 每日免费补给(首页按钮 → 激励视频 → 下局生效) */
    _freeSupplyViaAd() {
        if (!this.adCoord || !this.adCoord.canShowAds() || !this.profile) return;
        var d = new Date();
        var key = 'supply:' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
        if (this.profile.hasClaimed(key)) { this._showSupplyTip('今日已领取补给, 明天再来!'); return; }
        var self = this;
        this.adCoord.requestFreeSupply().then(function(granted) {
            if (!granted) return;
            if (!self.profile.claimReward(key, 0)) return; // 幂等(防并发)
            var kinds = ['people', 'damage', 'firerate'];
            var kind = kinds[Math.floor(Math.random() * kinds.length)];
            self.profile.data.pendingSupply = kind;
            self.profile.save();
            var names = { people: '+15 补给兵(下局生效)', damage: '输出+2(下局生效)', firerate: '射速+20%(下局生效)' };
            self._showSupplyTip('🎁 ' + (names[kind] || '补给!'));
            self._refreshCoinDisplays();
        });
    }

    _showSupplyTip(text) {
        var tip = document.getElementById('supply-tip');
        if (!tip) return;
        tip.textContent = text;
        tip.classList.remove('hidden');
        clearTimeout(this._supplyTipT);
        this._supplyTipT = setTimeout(function() { tip.classList.add('hidden'); }, 2600);
    }

    /** V10 QA: 首页动态按钮绑定(V42Art.installUI 创建的元素, 原绑定时机过早成死按钮) */
    _bindHomeButtons() {
        var self = this;
        var btnOpen = document.getElementById('btn-open-shop');
        if (btnOpen) btnOpen.addEventListener('click', function() { self._sfx('click'); self._openShop(); });
        var btnSupply = document.getElementById('btn-free-supply');
        if (btnSupply) btnSupply.addEventListener('click', function() { self._sfx('click'); self._freeSupplyViaAd(); });
        var homeSound = document.getElementById('btn-home-sound');
        if (homeSound) {
            this.ui.homeSound = homeSound;
            homeSound.addEventListener('click', function() { self._toggleSound(); });
        }
        // 免费补给今日已领标签(原在 _setupUI 中查询时元素尚不存在)
        if (this.profile) {
            var d = new Date();
            var key = 'supply:' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
            if (btnSupply && this.profile.hasClaimed(key)) btnSupply.classList.add('claimed');
        }
    }

    /** V5.1: 升级商店UI(渲染/购买/刷新) */
    _setupShopUI() {
        var self = this;
        this.ui.shopCoins = document.getElementById('shop-coins-num');
        var listEl = document.getElementById('shop-list');
        var btnClose = document.getElementById('btn-close-shop');
        if (btnClose) btnClose.addEventListener('click', function() { self._sfx('click'); self._closeShop(); });
        this._shopRows = {};
        // V15-ART-009: 统一升级商店顶部导航栏 (返回 | 标题 | 实时金币) + 精准五项军工功能图标
        var shopPanel = document.querySelector('#shop-screen .title-panel');
        if (shopPanel && !document.getElementById('v15-shop-topbar')) {
            var sTop = document.createElement('div');
            sTop.id = 'v15-shop-topbar';
            sTop.className = 'v15-armory-topbar';
            sTop.innerHTML =
                '<button type="button" class="v15-page-back" id="v15-shop-back">‹ 返回</button>' +
                '<div class="v15-page-title-wrap"><span class="v15-page-kicker">SUPPLY DEPOT</span><strong>后勤升级商店</strong></div>' +
                '<div class="v15-page-coin"><img src="assets/game/ui/coin.png" alt=""><span id="v15-shop-top-coins">0</span></div>';
            shopPanel.insertBefore(sTop, shopPanel.firstChild);
            sTop.querySelector('#v15-shop-back').addEventListener('click', function() { self._sfx('click'); self._closeShop(); });
        }
        var svgRapid = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gBolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFF29A"/><stop offset="55%" stop-color="#FFA826"/><stop offset="100%" stop-color="#E05A12"/></linearGradient></defs><rect x="6" y="13" width="6" height="19" rx="2" fill="#D4A642" stroke="#523508" stroke-width="1.5"/><path d="M6 13 L9 6 L12 13 Z" fill="#F2D06B" stroke="#523508" stroke-width="1.2"/><rect x="14" y="15" width="6" height="17" rx="2" fill="#C49434" stroke="#523508" stroke-width="1.5"/><path d="M14 15 L17 8 L20 15 Z" fill="#F2D06B" stroke="#523508" stroke-width="1.2"/><path d="M26 5 L18 21 H25 L21 35 L35 17 H27 L31 5 Z" fill="url(#gBolt)" stroke="#4D2304" stroke-width="1.6" stroke-linejoin="round"/></svg>';
        var svgPierce = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gAP" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFE680"/><stop offset="60%" stop-color="#E09A24"/><stop offset="100%" stop-color="#8A4E0B"/></linearGradient></defs><path d="M24 7 L34 11 V22 C34 28 29 33 24 35 C19 33 14 28 14 22 V11 Z" fill="#4E6658" stroke="#98B8A2" stroke-width="1.8"/><path d="M24 12 L21 20 L27 21 L23 30" fill="none" stroke="#FFE478" stroke-width="2.2" stroke-linecap="round"/><path d="M4 25 L16 14 L22 20 L10 31 Z" fill="url(#gAP)" stroke="#472804" stroke-width="1.5"/><path d="M16 14 L27 9 L22 20 Z" fill="#FFF2B8" stroke="#472804" stroke-width="1.4"/></svg>';
        var svgAirstrike = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gAir" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFE070"/><stop offset="55%" stop-color="#FF7A24"/><stop offset="100%" stop-color="#C82818"/></linearGradient></defs><circle cx="20" cy="20" r="14" fill="none" stroke="#FF8C36" stroke-width="2" stroke-dasharray="4 3"/><path d="M27 7 L19 19 L25 22 L12 34 L17 21 L11 18 Z" fill="url(#gAir)" stroke="#4A1806" stroke-width="1.5" stroke-linejoin="round"/></svg>';
        var svgCryo = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gIce" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8FBFF"/><stop offset="55%" stop-color="#6CD8FF"/><stop offset="100%" stop-color="#1E7AD8"/></linearGradient></defs><path d="M20 5 V35 M7 12.5 L33 27.5 M33 12.5 L7 27.5" stroke="url(#gIce)" stroke-width="3.2" stroke-linecap="round"/><polygon points="20,12 27,16 27,24 20,28 13,24 13,16" fill="#B8F0FF" stroke="#164B8A" stroke-width="1.6"/></svg>';
        var svgOverdrive = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gOD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFF59A"/><stop offset="55%" stop-color="#FFB426"/><stop offset="100%" stop-color="#D94814"/></linearGradient></defs><circle cx="20" cy="20" r="14" fill="#3B2408" stroke="#F5C946" stroke-width="2"/><path d="M22 6 L11 22 H19 L16 34 L29 18 H21 Z" fill="url(#gOD)" stroke="#4A1A04" stroke-width="1.4" stroke-linejoin="round"/></svg>';
        var svgTornado = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gTorn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E6FFFF"/><stop offset="55%" stop-color="#38E8FF"/><stop offset="100%" stop-color="#0E88C8"/></linearGradient></defs><ellipse cx="20" cy="10" rx="13" ry="4" fill="none" stroke="url(#gTorn)" stroke-width="3"/><ellipse cx="20" cy="17" rx="10" ry="3.2" fill="none" stroke="url(#gTorn)" stroke-width="2.8"/><ellipse cx="20" cy="24" rx="7" ry="2.4" fill="none" stroke="url(#gTorn)" stroke-width="2.6"/><ellipse cx="20" cy="30" rx="4" ry="1.6" fill="none" stroke="#99F6FF" stroke-width="2.2"/><circle cx="20" cy="34.5" r="1.8" fill="#E6FFFF"/></svg>';
        var shopIconMap = {
            recruit: '<img class="v15-shop-icon-img" src="assets/game/characters/soldier_portrait.png" alt="新兵招募">',
            logistics: '<img class="v15-shop-icon-img" src="assets/game/ui/chest.png" alt="后勤补给">',
            gun: '<img class="v15-shop-icon-img" src="assets/game/weapons/rifle.png" alt="枪械强化">',
            rapid: svgRapid,
            pierce: svgPierce,
            skill_airstrike: svgAirstrike,
            skill_cryo: svgCryo,
            skill_overdrive: svgOverdrive,
            skill_tornado: svgTornado
        };
        this._skillSvgIcons = {
            skill_airstrike: svgAirstrike,
            skill_cryo: svgCryo,
            skill_overdrive: svgOverdrive,
            skill_tornado: svgTornado
        };
        this._initActiveSkillBar();
        if (listEl) {
            Object.keys(UPGRADE_DEFS).forEach(function(id) {
                var def = UPGRADE_DEFS[id];
                var row = document.createElement('div');
                row.className = 'shop-row';
                var iconHtml = shopIconMap[id] || def.icon;
                row.innerHTML =
                    '<div class="shop-icon">' + iconHtml + '</div>' +
                    '<div class="shop-info">' +
                    '<div class="v15-shop-head"><span class="shop-name">' + def.name + '</span><span class="v15-shop-lv" id="shop-lv-' + id + '">Lv.0</span></div>' +
                    '<div class="shop-desc">' + def.desc + '</div>' +
                    '<div class="v15-shop-bar"><i id="shop-bar-' + id + '"></i></div>' +
                    '<div class="shop-effect" id="shop-effect-' + id + '"></div></div>' +
                    '<button class="shop-buy" id="shop-buy-' + id + '"></button>';
                listEl.appendChild(row);
                self._shopRows[id] = row;
                row.querySelector('.shop-buy').addEventListener('click', function() { self._buyUpgrade(id); });
            });
        }
        this._refreshShop();
    }

    _openShop() {
        var el = document.getElementById('shop-screen');
        if (el) {
            el.classList.remove('hidden');
            this._refreshShop();
        }
    }

    _closeShop() {
        var el = document.getElementById('shop-screen');
        if (el) el.classList.add('hidden');
        this._refreshLevelSelect(); // 解锁状态可能因属性变化展示不同
    }

    _refreshShop() {
        if (!this.profile || !this._shopRows) return;
        var self = this;
        Object.keys(UPGRADE_DEFS).forEach(function(id) {
            var lv = UpgradeShop.levelOf(self.profile, id);
            var maxLv = UpgradeShop.maxLevel(id);
            var price = UpgradeShop.priceOf(id, lv);
            var row = self._shopRows[id];
            if (!row) return;
            var lvEl = row.querySelector('#shop-lv-' + id);
            if (lvEl) lvEl.textContent = 'Lv.' + lv + '/' + maxLv;
            var barEl = row.querySelector('#shop-bar-' + id);
            if (barEl) barEl.style.width = Math.round((lv / Math.max(1, maxLv)) * 100) + '%';
            var curText = UPGRADE_DEFS[id].effect(lv);
            var nextText = (price !== null) ? ' → ' + UPGRADE_DEFS[id].effect(lv + 1) : ' · 已满级';
            row.querySelector('.shop-effect').textContent = curText + nextText;
            var btn = row.querySelector('.shop-buy');
            if (price === null) {
                btn.textContent = 'MAX';
                btn.disabled = true;
                btn.classList.add('maxed');
            } else {
                var canBuy = self.profile.coins >= price;
                btn.innerHTML = '<img class="v15-btn-coin" src="assets/game/ui/coin.png" alt=""><span>' + price + '</span>' +
                    (canBuy ? '' : '<small>金币不足</small>');
                btn.disabled = !canBuy;
                btn.classList.toggle('affordable', canBuy);
            }
        });
        if (this.ui.shopCoins) this.ui.shopCoins.textContent = this.profile.coins;
        var topCoin = document.getElementById('v15-shop-top-coins');
        if (topCoin) topCoin.textContent = this.profile.coins;
    }

    _buyUpgrade(id) {
        var res = UpgradeShop.purchase(this.profile, id);
        if (res.ok) {
            this._sfx('gate');
            this._refreshShop();
            this._refreshCoinDisplays();
            this._showSupplyTip('✅ ' + UPGRADE_DEFS[id].name + ' Lv.' + res.level);
        } else if (res.reason === 'insufficient') {
            this._sfx('hit');
            this._showSupplyTip('🪙 金币不足, 需要 ' + res.need);
        } else {
            this._showSupplyTip('已达到最高等级');
        }
    }

    // ===== V15-GAMEPLAY-002 / V16.2: 战斗主动战术技能 (空袭 / 冰冻 / 超载 / 龙卷风) =====
    _initActiveSkillBar() {
        var self = this;
        this._activeSkillOrder = [
            { id: 'skill_airstrike', short: '空袭', key: '1' },
            { id: 'skill_cryo', short: '冰冻', key: '2' },
            { id: 'skill_overdrive', short: '超载', key: '3' },
            { id: 'skill_tornado', short: '龙卷风', key: '4' }
        ];
        this._activeSkillCd = { skill_airstrike: 0, skill_cryo: 0, skill_overdrive: 0, skill_tornado: 0 };
        this._activeSkillBtns = {};
        this._activeTornado = null;
        var hud = document.getElementById('hud');
        if (!hud || document.getElementById('v15-skill-bar')) return;
        var bar = document.createElement('div');
        bar.id = 'v15-skill-bar';
        bar.className = 'hidden';
        for (var i = 0; i < this._activeSkillOrder.length; i++) {
            (function(cfg) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.id = 'v15-btn-' + cfg.id;
                btn.className = 'v15-skill-btn hidden';
                var ico = (self._skillSvgIcons && self._skillSvgIcons[cfg.id]) || '';
                btn.innerHTML =
                    '<span class="v15-skill-lv" id="v15-lv-' + cfg.id + '">Lv.1</span>' +
                    ico +
                    '<span class="v15-skill-lbl">' + cfg.short + '</span>' +
                    '<span class="v15-skill-cd" id="v15-cd-' + cfg.id + '"></span>';
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.castActiveSkill(cfg.id);
                });
                bar.appendChild(btn);
                self._activeSkillBtns[cfg.id] = btn;
            })(this._activeSkillOrder[i]);
        }
        hud.appendChild(bar);
        this._activeSkillBar = bar;
        // 桌面端快捷键 1/2/3/4 释放主动技能
        if (typeof window !== 'undefined' && !window._v15SkillKeyBound) {
            window._v15SkillKeyBound = true;
            window.addEventListener('keydown', function(e) {
                if (!self || self.state !== 'playing' || self.paused) return;
                if (e.key === '1') self.castActiveSkill('skill_airstrike');
                else if (e.key === '2') self.castActiveSkill('skill_cryo');
                else if (e.key === '3') self.castActiveSkill('skill_overdrive');
                else if (e.key === '4') self.castActiveSkill('skill_tornado');
            });
        }
    }

    _ensureTornadoMesh() {
        if (this._tornadoGroup) return this._tornadoGroup;
        var sc = (this.world && this.world.scene) || this.scene;
        if (typeof THREE === 'undefined' || !sc) return null;
        var g = new THREE.Group();
        g.visible = false;
        g.userData.artSource = 'V16.2 pooled 3D tactical tornado VFX';
        // 外层半透明青白漏斗 (修长龙卷风廓形)
        var outerGeo = new THREE.CylinderGeometry(1.75, 0.36, 4.0, 20, 6, true);
        var outerMat = new THREE.MeshBasicMaterial({
            color: 0x3CE8FF, transparent: true, opacity: 0.32,
            side: THREE.DoubleSide, depthWrite: false
        });
        var outerMesh = new THREE.Mesh(outerGeo, outerMat);
        outerMesh.position.y = 2.0;
        g.add(outerMesh);
        // 内层高亮风核
        var coreGeo = new THREE.CylinderGeometry(0.82, 0.16, 3.9, 16, 4, true);
        var coreMat = new THREE.MeshBasicMaterial({
            color: 0xE6FFFF, transparent: true, opacity: 0.56,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
        });
        var coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.position.y = 1.95;
        g.add(coreMesh);
        // 3道高速旋转风环
        var rings = [];
        var ringHeights = [0.55, 1.65, 2.95];
        var ringRadii = [0.82, 1.32, 1.82];
        for (var r = 0; r < 3; r++) {
            var rGeo = new THREE.TorusGeometry(ringRadii[r], 0.085, 8, 24);
            var rMat = new THREE.MeshBasicMaterial({
                color: r === 1 ? 0xE6FFFF : 0x5CEEFF, transparent: true, opacity: 0.72,
                blending: THREE.AdditiveBlending, depthWrite: false
            });
            var rMesh = new THREE.Mesh(rGeo, rMat);
            rMesh.rotation.x = Math.PI * 0.5 + (r % 2 ? 0.18 : -0.18);
            rMesh.position.y = ringHeights[r];
            g.add(rMesh);
            rings.push(rMesh);
        }
        // 贴地风压尘环
        var baseGeo = new THREE.RingGeometry(0.6, 2.5, 24);
        baseGeo.rotateX(-Math.PI * 0.5);
        var baseMat = new THREE.MeshBasicMaterial({
            color: 0x7DF4FF, transparent: true, opacity: 0.48,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
        });
        var baseRing = new THREE.Mesh(baseGeo, baseMat);
        baseRing.position.y = 0.08;
        g.add(baseRing);

        g._outer = outerMesh;
        g._core = coreMesh;
        g._rings = rings;
        g._baseRing = baseRing;
        sc.add(g);
        this._tornadoGroup = g;
        return g;
    }

    _resetActiveSkills() {
        if (!this._activeSkillOrder) return;
        this._activeTornado = null;
        if (this._tornadoGroup) this._tornadoGroup.visible = false;
        var anyUnlocked = false;
        for (var i = 0; i < this._activeSkillOrder.length; i++) {
            var id = this._activeSkillOrder[i].id;
            var lv = (this.profile && typeof UpgradeShop !== 'undefined') ? UpgradeShop.levelOf(this.profile, id) : 0;
            this._activeSkillCd[id] = 0;
            var btn = this._activeSkillBtns && this._activeSkillBtns[id];
            if (btn) {
                btn.classList.toggle('hidden', lv <= 0);
                btn.classList.remove('is-cd');
                var lvEl = document.getElementById('v15-lv-' + id);
                if (lvEl) lvEl.textContent = 'Lv.' + lv;
            }
            if (lv > 0) anyUnlocked = true;
        }
        if (this._activeSkillBar) this._activeSkillBar.classList.toggle('hidden', !anyUnlocked);
    }

    _updateActiveSkills(dt) {
        if (!this._activeSkillOrder || !this._activeSkillCd) return;
        for (var i = 0; i < this._activeSkillOrder.length; i++) {
            var id = this._activeSkillOrder[i].id;
            var cd = this._activeSkillCd[id] || 0;
            if (cd > 0) {
                cd = Math.max(0, cd - dt);
                this._activeSkillCd[id] = cd;
                var btn = this._activeSkillBtns && this._activeSkillBtns[id];
                var cdEl = document.getElementById('v15-cd-' + id);
                if (btn) btn.classList.toggle('is-cd', cd > 0);
                if (cdEl) cdEl.textContent = cd > 0 ? Math.ceil(cd) + 's' : '';
            }
        }
        this._updateTornado(dt);
    }

    /** V16.2: 战术龙卷风每帧推进、3D旋风动画、聚怪牵引(上限30只)与0.25s周期绞杀 */
    _updateTornado(dt) {
        var t = this._activeTornado;
        var enemies = (this.enemies && this.enemies.enemies) ? this.enemies.enemies : [];
        if (!t) {
            if (this._tornadoGroup && this._tornadoGroup.visible) this._tornadoGroup.visible = false;
            for (var c = 0; c < enemies.length; c++) {
                var ec = enemies[c];
                if (ec._tornadoPulled) ec._tornadoPulled = false;
                if (!ec._vaulting && ec._liftY > 0) ec._liftY = Math.max(0, ec._liftY - dt * 4.5);
            }
            return;
        }
        t.remaining -= dt;
        t.spin += dt * 11.5;
        t.tickTimer += dt;
        // 相对小队保持前推(对地速度 = 小队行进速度 + 2.0m/s, 确保旋风始终稳步扫入前方怪潮)
        var advSpd = (this.squad && !this._bossEngaged) ? ((CONFIG.SQUAD_SPEED || 3.3) + 2.0) : t.speed;
        t.z -= advSpd * dt;
        t.x = clamp(t.baseX + Math.sin(t.spin * 0.22) * 0.65, -2.2, 2.2);

        // 3D 旋风网格实时动画
        var mesh = this._ensureTornadoMesh();
        if (mesh) {
            mesh.visible = true;
            mesh.position.set(t.x, 0, t.z);
            var fade = t.remaining < 0.45 ? Math.max(0.05, t.remaining / 0.45) : 1;
            var radScale = (t.radius / 2.8) * fade;
            mesh.scale.set(radScale, fade, radScale);
            if (mesh._outer) mesh._outer.rotation.y = t.spin;
            if (mesh._core) mesh._core.rotation.y = -t.spin * 1.45;
            if (mesh._baseRing) mesh._baseRing.rotation.z = t.spin * 0.8;
            if (mesh._rings) {
                for (var r = 0; r < mesh._rings.length; r++) {
                    mesh._rings[r].rotation.z = t.spin * (1.2 + r * 0.45);
                }
            }
        }
        if (this.effects && Math.random() < 0.45) {
            var ang = Math.random() * Math.PI * 2;
            var rr = Math.random() * t.radius * 0.75;
            this.effects.burst(t.x + Math.cos(ang) * rr, 0.35 + Math.random() * 1.8, t.z + Math.sin(ang) * rr, 0x7DF4FF, 2, 2.6, 0.32);
        }

        // 每 0.25s 结算一次范围绞杀伤害
        var doTickDmg = false;
        if (t.tickTimer >= 0.25) {
            t.tickTimer -= 0.25;
            doTickDmg = true;
        }
        var pulledCount = 0;
        var tickDmg = t.dps * 0.25;
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (!e.alive || e._vaulting) continue;
            var dx = t.x - e.x;
            var dz = t.z - e.z;
            var d = Math.hypot(dx, dz);
            if (d <= t.radius) {
                if (doTickDmg) {
                    var dmg = e.isBoss ? tickDmg * 0.25 : tickDmg;
                    if (e.takeDamage) e.takeDamage(dmg, this.effects);
                    else e.hp -= dmg;
                }
                if (!e.alive) continue;
                // Boss 免疫牵引, 精英 25% 牵引, 盾牌 50% 牵引, 其余 100%, 最多同时卷起 30 只
                if (!e.isBoss && pulledCount < 30) {
                    pulledCount++;
                    var pullStr = (e.type === 'elite') ? 0.25 : (e.type === 'shield' ? 0.5 : 1.0);
                    e._tornadoPulled = true;
                    var inv = 1 / Math.max(0.15, d);
                    var nx = dx * inv, nz = dz * inv;
                    // 向心吸引 + 切向旋转
                    var pullSpd = 5.4 * pullStr;
                    var swirlSpd = 3.8 * pullStr;
                    e.x = clamp(e.x + (nx * pullSpd - nz * swirlSpd) * dt, -3.2, 3.2);
                    e.z += (nz * pullSpd + nx * swirlSpd) * dt;
                    var targetLift = (e.type === 'elite' ? 0.25 : 0.85) * (1 - d / (t.radius * 1.15));
                    e._liftY = clamp((e._liftY || 0) + (Math.max(0.18, targetLift) - (e._liftY || 0)) * Math.min(1, dt * 8), 0, 1.1);
                } else {
                    e._tornadoPulled = false;
                }
            } else {
                if (e._tornadoPulled) e._tornadoPulled = false;
                if (e._liftY > 0) e._liftY = Math.max(0, e._liftY - dt * 4.5);
            }
        }
        t.pulledCount = pulledCount;

        if (t.remaining <= 0) {
            this._activeTornado = null;
            if (mesh) mesh.visible = false;
            for (var k = 0; k < enemies.length; k++) {
                var ek = enemies[k];
                ek._tornadoPulled = false;
                if (!ek._vaulting) ek._liftY = 0;
            }
        }
    }

    castActiveSkill(id) {
        if (this.state !== 'playing' || this.paused || !this.profile || !this.squad || this.squad.count <= 0) return false;
        var lv = (typeof UpgradeShop !== 'undefined') ? UpgradeShop.levelOf(this.profile, id) : 0;
        if (lv <= 0) return false;
        if ((this._activeSkillCd[id] || 0) > 0) return false;

        var enemies = (this.enemies && this.enemies.enemies) ? this.enemies.enemies : [];
        if (id === 'skill_airstrike') {
            var dmg = 35 + lv * 20;
            var cd = Math.max(10, 22 - lv * 1.5);
            this._activeSkillCd[id] = cd;
            for (var b = 0; b < 5; b++) {
                var bz = this.squad.z - 8 - b * 6;
                var bx = ((b % 3) - 1) * 1.8;
                if (this.effects) {
                    if (this.effects.shockwave) this.effects.shockwave(bx, 0.08, bz, 0xFF4422);
                    this.effects.burst(bx, 1.0, bz, 0xFF7A24, 18, 6.0, 0.55);
                    this.effects.burst(bx, 1.4, bz, 0x3A3A3A, 8, 3.2, 0.70);
                }
            }
            for (var i = 0; i < enemies.length; i++) {
                var e = enemies[i];
                if (!e.alive) continue;
                if (e.z <= this.squad.z + 2 && e.z >= this.squad.z - 42) {
                    if (e.takeDamage) e.takeDamage(dmg, this.effects);
                    else e.hp -= dmg;
                }
            }
            if (this.world) this.world.shake(0.32, 0.35);
            if (this.effects) this.effects.floatText(this.squad.x, 2.8, this.squad.z - 4, '战术空袭!', '#FF9E3D', true);
            this._sfx('gate');
        } else if (id === 'skill_cryo') {
            var freezeSec = 3.5 + lv * 0.6;
            var frostDmg = 2 + lv * 2;
            this._activeSkillCd[id] = Math.max(12, 24 - lv * 1.5);
            for (var j = 0; j < enemies.length; j++) {
                var ej = enemies[j];
                if (!ej.alive) continue;
                if (!ej.isBoss) ej.frozenT = Math.max(ej.frozenT || 0, freezeSec);
                if (ej.takeDamage) ej.takeDamage(frostDmg, this.effects);
                else ej.hp -= frostDmg;
            }
            if (this.effects) {
                if (this.effects.shockwave) this.effects.shockwave(this.squad.x, 0.08, this.squad.z - 12, 0x60E0FF);
                this.effects.burst(this.squad.x, 1.2, this.squad.z - 12, 0x70D8FF, 26, 6.5, 0.65);
                this.effects.floatText(this.squad.x, 2.8, this.squad.z - 4, '极寒冰冻!', '#70D8FF', true);
            }
            if (this.world) this.world.shake(0.18, 0.22);
            this._sfx('gate');
        } else if (id === 'skill_overdrive') {
            var dur = 6 + lv * 1.2;
            var mul = 1.6 + lv * 0.15;
            this._activeSkillCd[id] = Math.max(14, 26 - lv * 1.5);
            this.squad._evDmgMul = Math.max(this.squad._evDmgMul || 1, mul);
            this.squad._evDmgMulT = Math.max(this.squad._evDmgMulT || 0, dur);
            this.squad._evRateMul = Math.max(this.squad._evRateMul || 1, 1.35);
            this.squad._evRateMulT = Math.max(this.squad._evRateMulT || 0, dur);
            if (this.squad.grantMedicalShield) this.squad.grantMedicalShield(1, 8, this.effects);
            if (this.effects) {
                if (this.effects.shockwave) this.effects.shockwave(this.squad.x, 0.08, this.squad.z, 0xFFD84A);
                this.effects.burst(this.squad.x, 1.0, this.squad.z, 0xFFE066, 22, 5.0, 0.55);
                this.effects.floatText(this.squad.x, 2.8, this.squad.z - 2, '火力超载!', '#FFE066', true);
            }
            this._sfx('win');
        } else if (id === 'skill_tornado') {
            var tDur = 4.5 + lv * 0.5;
            var tDps = 3 + lv;
            var tRadius = 2.6 + lv * 0.2;
            var tCd = Math.max(24, 42 - lv * 2);
            this._activeSkillCd[id] = tCd;
            var startX = clamp(this.squad.x, -2.0, 2.0);
            var startZ = this.squad.z - 3.0;
            this._activeTornado = {
                x: startX, baseX: startX, z: startZ,
                lv: lv, dur: tDur, remaining: tDur,
                dps: tDps, radius: tRadius, speed: 2.2,
                tickTimer: 0, spin: 0, pulledCount: 0
            };
            var tMesh = this._ensureTornadoMesh();
            if (tMesh) {
                tMesh.visible = true;
                tMesh.position.set(startX, 0, startZ);
            }
            if (this.effects) {
                if (this.effects.shockwave) this.effects.shockwave(startX, 0.08, startZ, 0x3CE8FF);
                this.effects.burst(startX, 1.1, startZ, 0x7DF4FF, 22, 5.5, 0.55);
                this.effects.floatText(startX, 2.9, startZ - 1, '战术龙卷风!', '#5CEEFF', true);
            }
            if (this.world) this.world.shake(0.22, 0.25);
            this._sfx('gate');
        } else {
            return false;
        }
        var btn = this._activeSkillBtns && this._activeSkillBtns[id];
        var cdEl = document.getElementById('v15-cd-' + id);
        if (btn) btn.classList.add('is-cd');
        if (cdEl) cdEl.textContent = Math.ceil(this._activeSkillCd[id]) + 's';
        return true;
    }

    /** V5.1: 刷新所有金币显示(首页/商店/结算) */
    _refreshCoinDisplays() {
        var coins = this.profile ? this.profile.coins : 0;
        var els = document.querySelectorAll('[data-coin-display]');
        for (var i = 0; i < els.length; i++) {
            // V10.1: 数值变化时触发脉冲动画(视觉反馈)
            var el = els[i];
            if (el.textContent !== String(coins)) {
                el.textContent = coins;
                var pill = el.closest('.v51-coin-pill, .shop-coins, .v42-best-record');
                if (pill) {
                    pill.classList.remove('coin-pulse');
                    void pill.offsetWidth;
                    pill.classList.add('coin-pulse');
                }
            }
        }
        if (this.ui && this.ui.shopCoins) this.ui.shopCoins.textContent = coins;
    }

    /** V5.1: 消耗免费补给(广告每日奖励 → 本局生效) */
    _consumePendingSupply() {
        if (!this.profile || !this.profile.data.pendingSupply) return;
        var kind = this.profile.data.pendingSupply;
        this.profile.data.pendingSupply = null;
        this.profile.save();
        if (kind === 'people') this.squad.setCount(this.squad.count + 15);
        else if (kind === 'damage') this.squad.damageBuff = Math.min(99, this.squad.damageBuff + 2);
        else if (kind === 'firerate') this.squad.fireRateBuff = Math.min(0.5, this.squad.fireRateBuff + 0.2);
        if (this.effects) {
            var names = { people: '+15 补给兵!', damage: '补给: 输出+2!', firerate: '补给: 射速+20%!' };
            this.effects.floatText(this.squad.x, 2.0, this.squad.z, names[kind] || '补给!', '#75DFFF', true);
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
        if (typeof Platform === 'undefined') return;
        var muted = Platform.audio.isMuted();
        if (this.ui.btnSound) this.ui.btnSound.textContent = muted ? '🔇 音效: 关' : '🔊 音效: 开';
        // V5.0: 首页音效图标同步
        if (this.ui.homeSound) this.ui.homeSound.textContent = muted ? '🔇' : '🔊';
    }

    /** V5.0: 刷新首页最高纪录展示(读取关卡解锁进度) */
    _updateBestRecord() {
        if (!this.ui.bestRecord) return;
        var unlocked = this._loadProgress();
        this.ui.bestRecord.textContent = '🏆 最高纪录: 第' + unlocked + '关';
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
            modelPolicy: 'V4.1: assets/models/soldier/soldier.glb + soldier-lod.glb / embedded PBR atlas / rigid-part instancing',
            soldierModel: { status: SoldierModelLoader.status, loadMs: SoldierModelLoader.loadMs }
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
        this._debugPanelIv = setInterval(function() {
            if (!self._debugPanel) { clearInterval(self._debugPanelIv); return; } // V10 QA: 面板移除后停止轮询
            var p = self.getPerf();
            var src = [
                '士兵: GLB / PBR / 分部件实例化 / ' + (self.squad.count > 100 ? 'LOD' : '完整模型'),
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
            // V5.1: 永久升级应用 — 初始人数 = 关卡基础 + 新兵招募等级; 穿透初始等级
            var startCount = this.shop ? this.shop.startCount(this.profile, level.startCount) : level.startCount;
            this.squad.reset(Math.min(startCount, CONFIG.SQUAD_MAX_COUNT));
            if (this.shop && this.profile) {
                this.squad.pierce = Math.min(3, this.shop.pierceBonus(this.profile));
            }
            // V8.0: 武器+科技战斗属性
            this._weaponStats = (typeof WeaponSystem !== 'undefined' && this.profile) ? WeaponSystem.stats(this.profile) : {};
            this._techStats = (typeof TechTree !== 'undefined' && this.profile) ? TechTree.combatStats(this.profile) : {};
            if (this._techStats.startBonus) this.squad.setCount(this.squad.count + this._techStats.startBonus);
            // V10 QA: 科技"战术储备"开局金币接线(每关一次幂等发放, 防重开刷币)
            if (this._techStats.startCoins && this.profile) {
                this.profile.claimReward('startcoins:L' + this.levelIndex, this._techStats.startCoins);
            }
            if (this._techStats.pierceBonus) this.squad.pierce = Math.min(3, this.squad.pierce + this._techStats.pierceBonus);
            if (this._techStats.critBonus) this.squad.critChance = Math.min(0.5, this.squad.critChance + this._techStats.critBonus);
            if (this._techStats.explosive) this.squad.explosive = Math.max(this.squad.explosive, 1); // 爆炸弹头科技
            // V8.0.1: 武器特化效果接线(修复: 武器特殊属性此前未进入战斗)
            var ws = this._weaponStats || {};
            if (ws.pierceBonus) this.squad.pierce = Math.min(5, this.squad.pierce + ws.pierceBonus);
            if (ws.chain) this.squad.chain = Math.max(this.squad.chain, ws.chain);
            if (ws.slowMul) this.squad.freezeStacks = Math.max(this.squad.freezeStacks, Math.round((1 - ws.slowMul) * 10));
            if (ws.radius) this.squad.explosive = Math.max(this.squad.explosive, Math.round(ws.radius * 2));
            if (ws.critBonus) this.squad.critChance = Math.min(0.8, this.squad.critChance + ws.critBonus);
            // V10.1: 武器特殊属性接线(修复: pellets/burn/dualLane 此前定义后无消费者)
            this.squad._wpnPellets = ws.pellets || 1;   // 散弹枪: 每次射击多发弹丸扇形铺散
            this.squad._wpnBurn = !!ws.burn;            // 地狱火箭: 命中附加燃烧DoT
            this.squad._wpnDualLane = !!ws.dualLane;    // 风暴机枪: 平行双弹道
            // V8.0: 士兵成长属性(等级+装备)
            if (typeof SoldierGrowth !== 'undefined' && this.profile) {
                var solStats = SoldierGrowth.stats(this.profile);
                if (solStats.dmgBonus) this.squad.damageBuff = Math.min(99, this.squad.damageBuff + solStats.dmgBonus);
                if (solStats.critBonus) this.squad.critChance = Math.min(0.8, this.squad.critChance + solStats.critBonus);
                this._soldierStats = solStats;
            }
            // VNext: 职业系统 — 属性乘区+被动+技能循环
            if (typeof SoldierClass !== 'undefined' && this.profile) {
                this._classStats = SoldierClass.combat(this.profile);
                var cs = this._classStats;
                if (cs.critBonus) this.squad.critChance = Math.min(0.8, this.squad.critChance + cs.critBonus);
                if (cs.pierce) this.squad.pierce = Math.min(5, this.squad.pierce + cs.pierce);
                this.squad._classBulletSpeed = cs.bulletSpeed;
                if (cs.eliteDmgMul && cs.eliteDmgMul !== 1) this.squad._classEliteMul = cs.eliteDmgMul;
                else this.squad._classEliteMul = 0;
                // 总减伤 = 科技 + 职业 + 士兵成长/装备 (killSoldiers 消费, 上限60%)
                this.squad._totalDr = Math.min(0.6, (this._techStats.drBonus || 0) + (cs.dr || 0) + ((this._soldierStats && this._soldierStats.drBonus) || 0));
            } else {
                this._classStats = null;
                this.squad._totalDr = Math.min(0.6, this._techStats.drBonus || 0);
            }
            // V6.0: 关卡主题(末日核心等) + 能源核心生成
            if (this.world.applyTheme) this.world.applyTheme(level.theme);
            this._setupEnergyCore(level);
            this.gates.loadFromLevel(level);
            this.enemies.loadFromLevel(level, this.levelIndex);
            this.enemies.bossStyle=level.bossStyle;
            // V6.0: 波次计划加载(L1-L5吃boost, L6手授终稿)
            this.pacing.loadFromLevel(level, this.levelIndex, this.levelIndex < 5);
            this.gates.resolveSkillGates(this.squad); // V6.0: 技能门roll(需squad._skills已重置)
            this.gates.syncVisibility(this.pacing, 0, this.squad.z);
            this._showBossWarning(false);
            this.combat.clear();
            this.effects.clear();
            // V3.4: 每局重置广告次数 + 音频手势初始化
            if (this.adCoord) this.adCoord.startRun();
            this._doubleTaken = false;
            // V5.1: 消耗免费补给(首页广告获得, 本局生效)
            this._consumePendingSupply();
            if (typeof Platform !== 'undefined') Platform.audio.init();

            this.state = 'playing';
            this.paused = false;
            this.time = 0;
            this.elapsedTime = 0;
            this._waveNoticeT=0;
            var notice=document.getElementById('v42-wave-banner');if(notice)notice.classList.add('hidden');
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
            // V10.1: HUD脏检查缓存复位(新一局强制全量刷新)
            this._cachedBossActive = undefined; this._cachedProgress = undefined;
            this._cachedBadgeX = undefined; this._cachedBadgeY = undefined; this._cachedBadgeShown = undefined;
            this._cachedComboShown = undefined; this._cachedCombo = undefined; this._cachedComboHot = undefined;
            this._cachedStatCount = undefined; this._cachedStatDamage = undefined; this._cachedStatFr = undefined;
            this._cachedCountNum = undefined;
            for (var pn = 0; pn < this.progressNodes.length; pn++) this.progressNodes[pn]._lastCls = undefined;
            this._adBtnT = 0;

            // V8.0: 随机事件系统每局重置
            if (typeof RandomEvents !== 'undefined') RandomEvents.reset();
            // V15-GAMEPLAY-002: 战斗主动战术技能冷却与按钮刷新
            this._resetActiveSkills();
            // V8.0: 挑战模式竞技场装配(普通关卡为 null)
            if (this._pendingChallenge) {
                this._challenge = this._pendingChallenge;
                this._pendingChallenge = null;
                this._initChallengeArena();
            } else {
                this._challenge = null;
            }

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

    // ===== V8.0: 挑战模式(无尽生存 / Boss试炼) =====
    /** 进入挑战模式: 用最高解锁关作为竞技场, 失败即结算 */
    startChallengeMode(type) {
        if (typeof CHALLENGE_MODES === 'undefined' || !CHALLENGE_MODES[type]) return false;
        var unlocked = this.profile ? (this.profile.data.unlockedLevel || 1) : 1;
        this.levelIndex = Math.min(LEVELS.length - 1, Math.max(0, unlocked - 1));
        this._pendingChallenge = {
            type: type, cfg: CHALLENGE_MODES[type],
            wave: 0, waveT: 3, time: 0, holdZ: undefined,
            _bossStart: 0, _scored: false
        };
        this.start();
        if (this.ui.levelName) this.ui.levelName.textContent = CHALLENGE_MODES[type].name;
        if (this.ui.levelBadge) this.ui.levelBadge.textContent = '⚔️';
        return true;
    }

    /** 竞技场初始化: 记录驻守线与Boss击杀基准 */
    _initChallengeArena() {
        var c = this._challenge;
        if (!c) return;
        c.holdZ = this.squad.z - 14;
        c._bossStart = this.enemies.bossKills || 0;
        c._scored = false;
        c.time = 0;
        c.wave = 0;
        c.waveT = 3;
        if (this.effects) {
            this.effects.floatText(this.squad.x, 2.6, this.squad.z - 2, c.cfg.icon + ' ' + c.cfg.name + ' 开始!', '#FFC247', true);
        }
    }

    /** 挑战波次驱动: 生存=混合波(每5波Boss); Boss试炼=纯Boss连续 */
    _updateChallenge(dt) {
        var c = this._challenge;
        if (!c || c.holdZ === undefined) return;
        c.time += dt;
        c.waveT -= dt;
        if (c.waveT > 0) return;
        c.wave++;
        if (c.type === 'survival') {
            c.waveT = Math.max(7, 12 - c.wave * 0.3);
            if (c.wave % 5 === 0) {
                // 每5波Boss: HP按波次指数增长
                var bhp = Math.round(1200 * Math.pow(c.cfg.hpScale || 1.12, c.wave));
                this.enemies.spawnEnemy('boss', CONFIG.LANE_X[1], this.squad.z - 14, bhp);
                this._showBossWarning(true);
                if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z - 3, '⚔️ Boss来袭!', '#FF4444', true);
            } else {
                var count = Math.min(70, 16 + Math.round(c.wave * 5));
                for (var i = 0; i < count; i++) {
                    var lane = i % 3;
                    var type = (c.wave >= 3 && i % 9 === 8) ? 'elite' : (i % 5 === 4 ? 'fast' : 'normal');
                    var x = CONFIG.LANE_X[lane] + (Math.random() - 0.5) * 2.4;
                    this.enemies.spawnEnemy(type, x, this.squad.z - CONFIG.BULLET_RANGE * (0.75 + Math.random() * 0.25), 0);
                }
                if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z - 3, '第 ' + c.wave + ' 波', '#FF8844', true);
            }
        } else if (c.type === 'boss_rush') {
            c.waveT = 6;
            var bhp2 = Math.round(1000 * Math.pow(c.cfg.hpScale || 1.25, c.wave));
            this.enemies.spawnEnemy('boss', CONFIG.LANE_X[1], this.squad.z - 14, bhp2);
            this._showBossWarning(true);
            if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z - 3, '👑 第 ' + c.wave + ' 个Boss', '#FFC247', true);
        }
    }

    _loop(timestamp) {
        if (this._rafDisabled) return; // V10.1: 测试密闭化开关 — 停止实时循环, 帧推进改由外部 _update 驱动
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
            this._update(dt * ts); // V5.1: elapsedTime 移入 _update(手动步进与真实循环一致)
        } else if (this.state === 'idle') {
            // 待机: 相机轻微摆动展示场景
            this.time += dt;
            this.squad.update(dt, this.time, this.squad.z);
            this.world.updateCamera(Math.sin(this.time * 0.4) * 0.6, 0, dt, 1);
        } else if (this.state === 'won' || this.state === 'lost') {
            this.time += dt;
            this.squad.update(dt, this.time, this.squad.z);
            this.enemies.finishDeaths(dt,this.time,this.squad);
            this.effects.update(dt);
        }

        this.world.renderer.render(this.world.scene, this.world.camera);

        // 单帧计算耗时(含update+render提交, 不受rAF节流影响)
        this._workMs = this._workMs ? this._workMs * 0.9 + (performance.now() - workT0) * 0.1 : (performance.now() - workT0);
    }

    _update(dt) {
        try {
            if (this.state === 'playing' && !this.paused) this.elapsedTime += dt; // V5.1
            this._updateInner(dt);
        } catch (err) {
            this._showError('[update错误] ' + err.message + '\n' + (err.stack || ''));
            this.state = 'lost'; // 停止循环避免刷屏
        }
    }

    _updateInner(dt) {
        if(this._waveNoticeT>0){this._waveNoticeT=Math.max(0,this._waveNoticeT-dt);if(!this._waveNoticeT){var _wb=document.getElementById('v42-wave-banner');if(_wb)_wb.classList.add('hidden');}} // V12: 移除ES2020可选链
        // 核心系统更新
        // Boss存活时小队在Boss前方停下，击败Boss才能继续
        var stopZ = this.enemies.boss ? this.enemies.boss.z + 4.5 : null;
        var frontier = this.pacing.frontierStopZ();
        if (frontier !== null) stopZ = stopZ === null ? frontier : Math.max(stopZ, frontier);
        // V12修复: 挑战模式驻守固定阵地, 门停线不外推驻守点(门前停线曾使挑战模式小队滞留门前
        // 无法接敌 → 永不战败, v80 挑战失败判定/结算标记/失败原因三项回归)
        var gateStop = (this._challenge && this._challenge.holdZ !== undefined)
            ? null
            : this.gates.approachStopZ(this.pacing, this.enemies.encounterOutstanding, this.squad.z);
        if (gateStop !== null) stopZ = stopZ === null ? gateStop : Math.max(stopZ, gateStop);
        // V8.0: 挑战模式 — 小队驻守固定阵地
        if (this._challenge && this._challenge.holdZ !== undefined) {
            stopZ = stopZ === null ? this._challenge.holdZ : Math.max(stopZ, this._challenge.holdZ);
        }
        this.squad.update(dt, this.time, stopZ);
        // V5.1: 全屏爆炸门 — 对场上所有活敌 50%maxHp 结算
        if (this.squad.nukePending) {
            this.squad.nukePending = false;
            var nuked = 0;
            for (var ni = 0; ni < this.enemies.enemies.length; ni++) {
                var ne = this.enemies.enemies[ni];
                if (!ne.alive) continue;
                ne.takeDamage(Math.max(20, ne.maxHp * 0.5), this.effects, ne.x, false);
                nuked++;
            }
            // V14: tier3 分级爆炸(全屏爆炸门) + 既有金色飘字/震屏
            if (this.effects.explosion) this.effects.explosion(this.squad.x, 1.0, this.squad.z - 6, 3);
            if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('boom'); // V16: 全屏爆炸音效(原为静默)
            this.world.shake(0.5);
            this.effects.floatText(this.squad.x, 2.4, this.squad.z, '全屏爆炸!', '#FFC247', true);
        }
        this.gates.syncVisibility(this.pacing, this.enemies.encounterOutstanding, this.squad.z);
        this.gates.update(this.squad, this.effects, this.time, dt);
        // V4.0: 节奏控制器驱动分批刷怪/Boss预警
        this.pacing.update(dt, this.squad);
        this.enemies.update(dt, this.time, this.squad);
        if (this.energyCore) this.energyCore.update(dt, this.time, this.squad, this.enemies.enemies, this.effects);
        this.combat.update(dt, this.squad, this.enemies, this.energyCore);
        this.combat._syncInstances();
        this.effects.update(dt);

        // V10 QA: 每日任务进度轮询从每帧5次降为每0.5秒1次(原实现每帧5次全量profile.save ≈300次/s的localStorage写入)
        if (typeof ChallengeDaily !== 'undefined' && this.profile) {
            this._dailyPollT = (this._dailyPollT || 0) + dt;
            if (this._dailyPollT >= 0.5) {
                this._dailyPollT = 0;
                ChallengeDaily.report(this.profile, 'kills', 0);
                ChallengeDaily.report(this.profile, 'squad', 0);
                ChallengeDaily.report(this.profile, 'gates', 0);
                ChallengeDaily.report(this.profile, 'skills', 0);
                ChallengeDaily.report(this.profile, 'boss', 0);
            }
        }
        // V8.0: 随机事件 + 挑战模式波次驱动 + V15主动技能冷却
        if (typeof RandomEvents !== 'undefined') RandomEvents.update(dt, this);
        this._updateActiveSkills(dt);
        if (this._challenge) this._updateChallenge(dt);
        // V3.3: 连杀系统 — 击杀数增长时combo+1, 2秒无击杀清零
        var kc = this.enemies.killCount;
        if (kc > this._prevKillCount) {
            var newKills = kc - this._prevKillCount;
            var previousCombo = this.combo;
            this.combo += kc - this._prevKillCount;
            this.comboTimer = 3.0;
            this.world.shake(Math.min(.12, .045 + newKills * .009), .1);
            if (this.ui.comboBox) {
                this.ui.comboBox.classList.remove('combo-hit');
                void this.ui.comboBox.offsetWidth;
                this.ui.comboBox.classList.add('combo-hit');
            }
            // 连杀里程碑
            var milestones = [10, 30, 50, 100];
            for (var mi = 0; mi < milestones.length; mi++) {
                if (previousCombo < milestones[mi] && this.combo >= milestones[mi]) {
                    if (this._comboMilestone !== milestones[mi]) {
                        this._comboMilestone = milestones[mi];
                        this.effects.floatText(this.squad.x, 2.2, this.squad.z - 1, milestones[mi] + '连杀!', '#FFC247', true);
                        this.effects.shockwave(this.squad.x, 0.05, this.squad.z, 0xFFC247);
                        this.world.shake(0.22, 0.28);
                        if (milestones[mi] >= 30) this.triggerHitStop(0.035, 0.22);
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
        this.world.updateCamera(this.squad.x, this.squad.z, dt, this.squad.count,this.squad.getDepth());

        // UI刷新
        this._updateUI();

        // Boss血条
        if (this.enemies.boss) {
            this.bossSpawned = true;
            if (this.ui.bossBar) this.ui.bossBar.classList.remove('hidden');
            var bosses=this.enemies.enemies.filter(e=>e.isBoss&&e.alive);
            // V10 QA修复: Boss死亡瞬间 bosses 可为空数组 → 0/0=NaN 血条, 加空值守卫
            var hpSum=bosses.reduce((n,e)=>n+e.hp,0), maxSum=bosses.reduce((n,e)=>n+(e.maxHp||0),0);
            var ratio = maxSum>0 ? Math.max(0,hpSum/maxSum) : 0;
            var bossNameNode=document.getElementById('boss-name');
            // V10 QA修复: L9双Boss各自显示自己的title(按 artStyle 匹配段配置, 原固定读 BOSS_NAMES[levelIndex])
            var segBoss=(LEVELS[this.levelIndex].segments||[]).find(s=>s.type==='boss'&&s.boss&&s.boss.style===(this.enemies.boss&&this.enemies.boss.artStyle));
            var bossTitle=(segBoss&&segBoss.boss&&segBoss.boss.title)||CONFIG.BOSS_NAMES[this.levelIndex];
            if(bossNameNode){ // V12: 结构无关的文本更新(原依赖firstChild.nodeType===3, HTML结构变动即失效)
                var _bnTextNode=null;
                for(var _bnI=0;_bnI<bossNameNode.childNodes.length;_bnI++){if(bossNameNode.childNodes[_bnI].nodeType===3){_bnTextNode=bossNameNode.childNodes[_bnI];break;}}
                if(_bnTextNode)_bnTextNode.nodeValue=bossTitle;else bossNameNode.textContent=bossTitle;
            }
            var phaseLabel=document.getElementById('boss-phase');
            if(phaseLabel)phaseLabel.textContent='阶段 '+(this.enemies.boss.phaseIndex||1)+(this.enemies.boss.shieldT>0?' · 护盾':'');
            if (this.ui.bossFill) this.ui.bossFill.style.width = (ratio * 100) + '%';
            // V10 QA修复: Boss图鉴"遭遇过"标记(原 d.bossSeen 从未写入, 只靠fallback)
            if (this.profile && typeof this.profile.data.bossSeen === 'object') {
                var bk=(this.enemies.boss && this.enemies.boss.artStyle)||CONFIG.BOSS_NAMES[this.levelIndex];
                if (!this.profile.data.bossSeen[bk]) { this.profile.data.bossSeen[bk] = true; this.profile.save(); }
            }
        }

        // V5.1 胜利判定(阵地防守): 全部波次排空 + 场上无敌(含Boss已亡+召唤清完) → 通关
        // V8.0: 挑战模式无通关 — 由失败结算
        if (!this._challenge && this.pacing.isComplete() && this.enemies.encounterOutstanding === 0 && !this.enemies.boss) {
            this.bossDefeated = true; // 兼容旧标志(E2E引用)
            if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
            this._win();
            return;
        }
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

    /** V10.1: HUD刷新脏检查 — 原实现每帧 getElementById+无条件DOM写(剖析占17.3%主线程) */
    _updateUI() {
        var bossActive = !!this.enemies.boss && this.state === 'playing';
        if (this._containerEl === undefined) this._containerEl = document.getElementById('game-container'); // V11 QA: 只查一次, 容器缺失时不逐帧取null调用
        if (this._containerEl && this._cachedBossActive !== bossActive) {
            this._cachedBossActive = bossActive;
            this._containerEl.classList.toggle('boss-active', bossActive);
        }
        var level = LEVELS[this.levelIndex];
        var progress = clamp(-this.squad.z / -level.totalZ, 0, 1);
        var progPct = (progress * 100).toFixed(1);
        if (this._cachedProgress !== progPct) {
            this._cachedProgress = progPct;
            if (this.ui.progressFill) this.ui.progressFill.style.width = progPct + '%';
            if (this.ui.progressFlag) this.ui.progressFlag.style.left = progPct + '%';
            var pctText = document.getElementById('v15-progress-pct');
            if (pctText) pctText.textContent = Math.round(progress * 100) + '%';
        }
        // V15 顶栏右上角真实金币与人数绑定
        var v15Coins = (this.profile ? (this.profile.coins || 0) : 0) + (this.runCoins || 0);
        if (this._cachedV15Coins !== v15Coins) {
            this._cachedV15Coins = v15Coins;
            var coinEl = document.getElementById('v15-hud-coins');
            if (coinEl) coinEl.textContent = v15Coins.toLocaleString();
        }
        if (this._cachedV15Squad !== this.squad.count) {
            this._cachedV15Squad = this.squad.count;
            var sqEl = document.getElementById('v15-hud-squad');
            if (sqEl) sqEl.textContent = this.squad.count;
        }

        // 进度节点
        this._updateProgressNodes();

        // 人数气泡: 跟随小队头顶(V3.6: 3D投影定位,随队伍移动不遮挡弹道)
        if (this.ui.countBadge && this.state === 'playing') {
            var cam = this.world.camera;
            this._badgeV.set(this.squad.x, 1.42 * (this.squad._formationScale || 1) + .2, this.squad.z - .1).project(cam);
            if (this._badgeV.z < 1) {
                var cw = this.world.canvas.clientWidth || window.innerWidth;
                var ch = this.world.canvas.clientHeight || window.innerHeight;
                var sx = (this._badgeV.x * 0.5 + 0.5) * cw;
                var sy = (-this._badgeV.y * 0.5 + 0.5) * ch;
                // 屏幕内钳制: 避免压到HUD或飞出边界
                sx = clamp(sx, 46, cw - 46);
                sy = clamp(sy, 150, ch - 40);
                if (sy < 200 && sx < 145) sx = 145; // 避让左上属性面板
                var sxR = Math.round(sx), syR = Math.round(sy - 18);
                if (this._cachedBadgeX !== sxR || this._cachedBadgeY !== syR) {
                    this._cachedBadgeX = sxR; this._cachedBadgeY = syR;
                    // V11.6: transform 代替 left/top — 合成器路径, 不触发每帧布局
                    this.ui.countBadge.style.transform = 'translate3d(' + sxR + 'px,' + syR + 'px,0)';
                }
                if (this._cachedBadgeShown !== true) { this._cachedBadgeShown = true; this.ui.countBadge.style.display = 'flex'; }
            } else if (this._cachedBadgeShown !== false) {
                this._cachedBadgeShown = false;
                this.ui.countBadge.style.display = 'none';
            }
        }

        // 人数气泡(变化时触发弹出/抖动动画)
        if (this.ui.countNum) {
            // V11.6: 数值先行比较, 避免每帧 String 分配
            if (this._cachedCountNum !== this.squad.count) {
                var countStr = String(this.squad.count);
                this._cachedCountNum = this.squad.count;
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
            var comboShown = this.combo >= 5 && this.state === 'playing';
            if (this._cachedComboShown !== comboShown) {
                this._cachedComboShown = comboShown;
                this.ui.comboBox.classList.toggle('hidden', !comboShown);
            }
            if (comboShown && this.ui.comboNum) {
                if (this._cachedCombo !== this.combo) { this._cachedCombo = this.combo; this.ui.comboNum.textContent = this.combo; }
                var hot = this.combo >= 30;
                if (this._cachedComboHot !== hot) { this._cachedComboHot = hot; this.ui.comboBox.classList.toggle('hot', hot); }
            }
        }

        // V3.4: 刷门按钮状态刷新(战斗中, 0.5s一次)
        if (this.adCoord && this.state === 'playing') {
            this._adBtnT = (this._adBtnT || 0) - 1;
            if (this._adBtnT <= 0) { this._adBtnT = 15; this._updateAdButtons(); }
        }

        // 属性面板(带变化动画) — 数值脏检查后写DOM
        if (this.ui.statCount) {
            var cnt = this.squad.count;
            if (this._cachedStatCount !== cnt) {
                this._cachedStatCount = cnt;
                this.ui.statCount.textContent = cnt;
                if (this.ui.statRowCount && this.ui.countNum && String(cnt) !== this.ui.countNum.textContent) {
                    this.ui.statRowCount.classList.remove('bump');
                    void this.ui.statRowCount.offsetWidth;
                    this.ui.statRowCount.classList.add('bump');
                }
            }
            var curDmg = this.squad.getDamage();
            if (this._cachedStatDamage !== curDmg) {
                this._cachedStatDamage = curDmg;
                this.ui.statDamage.textContent = curDmg;
                if (curDmg !== this._prevDamage && this.ui.statRowDamage) {
                    this.ui.statRowDamage.classList.remove('flash');
                    void this.ui.statRowDamage.offsetWidth;
                    this.ui.statRowDamage.classList.add('flash');
                }
                this._prevDamage = curDmg;
            }
            var curFr = this.squad.getFireRate();
            var frStr = curFr.toFixed(1);
            if (this._cachedStatFr !== frStr) {
                this._cachedStatFr = frStr;
                this.ui.statFirerate.textContent = frStr;
                if (Math.abs(curFr - this._prevFireRate) > 0.01 && this.ui.statRowFirerate) {
                    this.ui.statRowFirerate.classList.remove('bump');
                    void this.ui.statRowFirerate.offsetWidth;
                    this.ui.statRowFirerate.classList.add('bump');
                }
                this._prevFireRate = curFr;
            }
        }
    }

    _win() {
        this.state = 'won';
        this._sfx('win'); // V5.0
        this.squad.setAnimationState('Victory');
        // V5.1: 金币结算(幂等入账) + 档案统计
        this._doubleApplied = false;
        this._settlement = this.profile ? settleRunEconomy(this.profile, LEVELS[this.levelIndex], this.levelIndex, this.enemies.killCount, true, false, (typeof Skills !== 'undefined' ? Skills.coinBonus(this.squad) : (this.squad._skillMagnet || 0))) : null;
        if (this.profile) {
            this._newUnlocked = this.profile.recordRun(this.levelIndex, this.enemies.killCount, this.maxCount, true, LEVELS.length);
            // V6.0: 星级/经验/成就/统计
            this._stars = typeof Progression !== 'undefined' ? Progression.computeStars(this.levelIndex, this.squad.count, this.enemies.killCount, true) : 0;
            var starKey = 'L' + (this.levelIndex + 1);
            var prevStars = this.profile.data.stars[starKey] || 0;
            this._newStars = Math.max(0, this._stars - prevStars);
            if (this._stars > prevStars) this.profile.data.stars[starKey] = this._stars;
            if (this.enemies.bossKills) this.profile.data.stats.bossKills = (this.profile.data.stats.bossKills || 0) + this.enemies.bossKills;
            // V10 QA: 科技"训练手册"经验加成接线(原 log_xp 购买后无效果)
            // V11.2: 实战经验技能 — XP ×(1+0.15×层) 叠乘
            var xpMul = ((this._techStats && this._techStats.xpMul) ? this._techStats.xpMul : 1) * (1 + 0.15 * (this.squad._skillFortune || 0));
            this.profile.data.xp = (this.profile.data.xp || 0) + (typeof Progression !== 'undefined' ? Math.round(Progression.computeXp(this.enemies.killCount, true, this.levelIndex, this._newStars) * xpMul) : 0);
            this.profile.data.playerLevel = Progression ? Progression.levelFromXp(this.profile.data.xp).level : this.profile.data.playerLevel;
            // V10 QA修复: 胜利上报每日任务(wins类型此前无任何调用方, 通关N关任务永远0进度)
            if (typeof ChallengeDaily !== 'undefined') ChallengeDaily.report(this.profile, 'wins', 1);
            // V10 QA修复: 科技点发放(原 grantTech 全库零调用 → 科研站永远0点, 科技树不可用)
            if (typeof TechTree !== 'undefined') TechTree.grantTech(this.profile, 1 + (this.enemies.bossKills || 0));
            this.profile.save();
            this._newAchievements = typeof Progression !== 'undefined' ? Progression.checkAchievements(this.profile) : [];
        }
        // VNext: 通关装备掉落(1件保底, 星级加成)
        this._drops = (typeof EquipmentLoot !== 'undefined' && this.profile)
            ? EquipmentLoot.rollOnWin(this.profile, this.levelIndex, this._stars || 0) : [];
        // VNext: 真实战绩入榜
        if (typeof Leaderboard !== 'undefined' && this.profile) {
            // V11.4: 职业专精计局
            if (typeof SoldierClass !== 'undefined') SoldierClass.recordGame(this.profile, this.profile.data.classId);
            Leaderboard.record(this.profile, {
                level: this.levelIndex + 1, win: true, kills: this.enemies.killCount,
                maxCount: this.maxCount, combo: this.maxCombo, time: this.elapsedTime,
                classId: this.profile.data.classId
            });
        }
        var starsEl = document.getElementById('win-stars');
        if (starsEl && this._stars !== undefined) {
            starsEl.innerHTML = '★'.repeat(this._stars) + '☆'.repeat(3 - this._stars);
            starsEl.classList.remove('hidden');
        }
        this._fillSettlementUI();
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
        this.lastLoseReason = reason; // V5.0: 供平衡模拟分析失败原因
        this._sfx('lose'); // V5.0
        // V5.1: 失败只给少量击杀金币(防故意失败刷钱)
        this._settlement = this.profile ? settleRunEconomy(this.profile, LEVELS[this.levelIndex], this.levelIndex, this.enemies.killCount, false, false, (typeof Skills !== 'undefined' ? Skills.coinBonus(this.squad) : (this.squad._skillMagnet || 0))) : null;
        if (this.profile) {
            this.profile.recordRun(this.levelIndex, this.enemies.killCount, this.maxCount, false, LEVELS.length);
            this.profile.data.xp = (this.profile.data.xp || 0) + this.enemies.killCount * (typeof XP_RULES !== 'undefined' ? XP_RULES.perKill : 1);
            this.profile.data.playerLevel = typeof Progression !== 'undefined' ? Progression.levelFromXp(this.profile.data.xp).level : this.profile.data.playerLevel;
            this._newAchievements = typeof Progression !== 'undefined' ? Progression.checkAchievements(this.profile) : [];
            this.profile.save();
        }
        // V8.0: 挑战模式结算 — 分数+奖励+最高纪录(幂等: _scored 防重复)
        // VNext: 失败也有25%概率掉落1件装备(保底参与感)
        this._drops = (typeof EquipmentLoot !== 'undefined' && this.profile)
            ? EquipmentLoot.rollOnLose(this.profile, this.levelIndex) : [];
        // VNext: 真实战绩入榜(失败也计)
        if (typeof Leaderboard !== 'undefined' && this.profile) {
            if (typeof SoldierClass !== 'undefined') SoldierClass.recordGame(this.profile, this.profile.data.classId);
            Leaderboard.record(this.profile, {
                level: this.levelIndex + 1, win: false, kills: this.enemies.killCount,
                maxCount: this.maxCount, combo: this.maxCombo, time: this.elapsedTime,
                classId: this.profile.data.classId,
                challenge: this._challenge ? this._challenge.type : null
            });
        }
        if (this._challenge && !this._challenge._scored) {
            this._challenge._scored = true;
            var cScore = this._challenge.type === 'survival'
                ? this.enemies.killCount
                : Math.max(0, (this.enemies.bossKills || 0) - (this._challenge._bossStart || 0));
            var cReward = this.profile ? Math.round(cScore * (this._challenge.type === 'survival' ? 0.5 : 1.2)) : 0;
            if (this.profile) {
                this.profile.addCoins(cReward);
                this.profile.data.xp = (this.profile.data.xp || 0) + Math.round(cScore * 2);
                this.profile.data.playerLevel = typeof Progression !== 'undefined' ? Progression.levelFromXp(this.profile.data.xp).level : this.profile.data.playerLevel;
                if (!this.profile.data.challengeBest) this.profile.data.challengeBest = {};
                var bestKey = this._challenge.type;
                if (cScore > (this.profile.data.challengeBest[bestKey] || 0)) {
                    this.profile.data.challengeBest[bestKey] = cScore;
                    this._challenge._newBest = true;
                }
                this.profile.save();
            }
            if (this.ui.loseReason) this._challenge._scoreText =
                (this._challenge.cfg ? this._challenge.cfg.name : '挑战') + ' · 得分 ' + cScore +
                (this._challenge._newBest ? ' 🎉新纪录!' : '') + ' · 奖励 ' + cReward + '🪙';
        }
        this._fillSettlementUI();
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        this._showBossWarning(false);
        // 填充结算数据
        if (this.ui.loseKills) this.ui.loseKills.textContent = this.enemies.killCount;
        if (this.ui.loseMax) this.ui.loseMax.textContent = this.maxCount;
        if (this.ui.loseCombo) this.ui.loseCombo.textContent = this.maxCombo || 0;
        // V3.3: 失败原因
        if (this.ui.loseReason) this.ui.loseReason.textContent = reason || '小队全灭';
        // V8.0: 挑战模式 — 失败原因替换为挑战得分(须在默认原因之后写入)
        if (this._challenge && this._challenge._scored && this._challenge._scoreText && this.ui.loseReason) {
            this.ui.loseReason.textContent = this._challenge._scoreText;
        }
        // V3.4: 复活按钮(每局限1次)
        this._updateAdButtons();
        if (this.ui.loseScreen) this.ui.loseScreen.classList.remove('hidden');
    }

    // ===== V3.3: 存档系统(关卡解锁进度) =====
    /** V5.1: 解锁进度迁移至 GameProfile 持久档(旧 pz_progress 已在建档时迁移) */
    _loadProgress() {
        if (this.profile) return clamp(this.profile.data.unlockedLevel, 1, LEVELS.length);
        try {
            var v = parseInt(window.localStorage.getItem('pz_progress')) || 1;
            return clamp(v, 1, LEVELS.length);
        } catch (e) { return 1; }
    }

    _saveProgress(unlocked) {
        if (this.profile) {
            if (unlocked > this.profile.data.unlockedLevel) {
                this.profile.data.unlockedLevel = unlocked;
                this.profile.save();
            }
            return;
        }
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
        this._refreshBestRecord(); // V5.0: 首页最高纪录同步
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

    // VNext: 启动加载界面(真实进度条, 由 index.html 的 __BootProgress 驱动)
    var loading = document.getElementById('boot-loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'boot-loading';
        loading.textContent = '正在整备绿色小队…';
        document.body.appendChild(loading);
    }
    var starting = false;
    function boot() {
        if (starting || window.__game) return;
        starting = true;
        loading.classList.remove('boot-hidden');
        var actions = document.getElementById('boot-actions');
        if (actions) actions.innerHTML = '';
        window.__BootProgress && window.__BootProgress.stage('整备绿色小队…', 2);
        var error = document.getElementById('error-display');
        if (error) error.remove();
        // V11.6: 关键资源优先启动 — 只等士兵+普通/快速僵尸(6 GLB), 其余20个模型战斗中后台补齐
        // (_bank 对未就绪体格有 normal 回退; Boss通常开局1-3分钟后才出场, 届时早已加载完成)
        Promise.all([SoldierModelLoader.load(), EnemyModelLoader.loadCritical()]).then(function() {
            window.__BootProgress && window.__BootProgress.stage('构建战场与渲染管线…', 99);
            // V11 QA修复[P3]: 构造失败(如WebGL上下文异常)不再走"重建"重试 —
            // 同canvas二次new Game()会重复注册输入监听; 此路径引导用户刷新页面整体重置
            try {
                if (!window.__game) window.__game = new Game();
                EnemyModelLoader.load(); // V11.6: 后台续载剩余模型(不阻塞进入游戏)
            } catch (e) {
                starting = false;
                showError('游戏初始化失败：' + e.message + '\n请刷新页面重试。');
                window.__BootProgress && window.__BootProgress.stage('初始化失败', 0);
                return;
            }
            window.__BootProgress && window.__BootProgress.done();
            window.__BootProgress && window.__BootProgress.stage('准备完毕!', 100);
            // V15修复: 就绪即隐藏(原260ms延迟窗口内后台续载事件会回写进度条,
            // 且使"100%后隐藏"成为竞态) — bar 宽度 .18s 过渡保留动画感
            loading.classList.add('boot-hidden');
        }).catch(function(err) {
            starting = false;
            showError('角色资源加载失败：' + err.message);
            window.__BootProgress && window.__BootProgress.stage('资源加载失败', 0);
            var retry = document.createElement('button');
            retry.id = 'btn-retry-model';
            retry.textContent = '重新加载小队';
            retry.onclick = boot;
            var actions = document.getElementById('boot-actions');
            if (actions) actions.appendChild(retry);
            else loading.appendChild(retry);
        });
    }
    boot();
})();
