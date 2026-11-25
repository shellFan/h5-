// ===== V4.0 节奏控制器 (P0: 独立于帧率的战斗节奏) =====
// 职责: 波次激活 → 分批生成(间隔0.8-1.5s, 每批1-4只) → 场上活敌上限 → 波次结束 → Boss预警 → Boss出场
// 所有时间均为真实游戏秒(dt驱动), 与渲染帧率无关
// 纯逻辑: 敌人生成通过注入的spawnFn完成, 便于单测

class GamePacingController {
    constructor(game) {
        this.game = game || null;
        this.waves = [];
        this.spawnFn = null;        // function(type, x, z, hp) → Enemy
        this.onWaveStart = null;    // function(wave)
        this.onWaveClear = null;    // function(wave)
        this.onBossWarning = null;  // function(wave) — 预警开始
        this.onBossSpawn = null;    // function(wave)
        this.maxAliveFn = null;     // function() → 当前场上活敌数
        this.aliveCountFn = null;   // function() → 活敌数(判断波清)
        this.gateReadyFn = null;
    }

    /** 从关卡数据构建波次计划 */
    loadFromLevel(level, levelIndex, runtimeHordeBoost) {
        // V10 QA: 移除每关生产路径 console.log
        this.clear();
        var P = CONFIG.PACING;
        this.levelIndex = levelIndex || 0;
        this.runtimeHordeBoost = !!runtimeHordeBoost;
        var waveMultiplier = this.runtimeHordeBoost ? (CONFIG.ENEMY_WAVE_MULTIPLIER || 1) : 1;
        var previousGateZ = null;
        // V5.1.4: 标记最后一个波段(末波清尾驻停用)
        var lastWaveIdx = -1;
        for (var wi = 0; wi < level.segments.length; wi++) {
            if (level.segments[wi].type === 'wave') lastWaveIdx = wi;
        }
        for (var i = 0; i < level.segments.length; i++) {
            var seg = level.segments[i];
            if (seg.type === 'wave') {
                var queue = [];
                for (var j = 0; j < seg.enemies.length; j++) {
                    for (var k = 0; k < seg.enemies[j].count * waveMultiplier; k++) {
                        queue.push(seg.enemies[j].type);
                    }
                }
                // Mix roles through the horde instead of spawning every shield
                // or splitter first. The authored roster is retained exactly.
                for (var qi = queue.length - 1; qi > 0; qi--) {
                    var swap = Math.floor(Math.random() * (qi + 1));
                    var held = queue[qi]; queue[qi] = queue[swap]; queue[swap] = held;
                }
                this.waves.push({
                    type: 'wave', z: seg.z,
                    requiredGateZ: previousGateZ,
                    index: this.waves.filter(function(w) { return w.type === 'wave'; }).length,
                    isFinal: i === lastWaveIdx,
                    triggerZ: seg.z + P.waveTriggerAhead,
                    queue: queue,
                    state: 'idle',          // idle|spawning|clearing|done
                    batchTimer: P.firstContactGrace,
                    total: queue.length,
                    pending: [],
                    emitTimer: 0,
                    spawned: 0
                });
            } else if (seg.type === 'boss') {
                this.waves.push({
                    type: 'boss', z: seg.z,
                    requiredGateZ: previousGateZ,
                    triggerZ: seg.z + P.bossTriggerAhead,
                    hp: seg.boss && seg.boss.hp ? seg.boss.hp : null,
                    state: 'idle',          // idle|warning|done
                    warnTimer: P.bossWarningTime
                });
            } else if (seg.type === 'gates') {
                previousGateZ = seg.z;
            }
        }
    }

    clear() {
        this.waves = [];
        this.restTimer = 0;
        this.activeWave = null;
    }

    /** V5.1: 当前关卡场上活敌上限(尸潮矩阵 CONFIG.MAX_ALIVE) */
    _maxAlive() {
        var matrix = CONFIG.MAX_ALIVE;
        var li = this.levelIndex || 0;
        if (matrix && matrix.length) {
            var base = matrix[Math.min(li, matrix.length - 1)];
            return Math.round(base * (this.runtimeHordeBoost ? (CONFIG.ENEMY_MAX_ALIVE_MULTIPLIER || 1) : 1));
        }
        var P = CONFIG.PACING;
        return Math.min(20, 10 + li);
    }

    /** V5.1.1: 批次规模加大(尸潮成堆涌现, 玩家反馈"怪物太少") */
    _batchSize(wave, aliveTarget) {
        var P = CONFIG.PACING;
        if(wave) {
            // V5.1.5: 批次≥目标活敌×1.25 — 一批就能把 alive 填到目标(旧按波总量/1.5切批,
            // 批间真空期被击杀清空, alive 永远只有批大小)
            var maxBatch = this.runtimeHordeBoost ? Math.max(144, P.batchSizeMax) : P.batchSizeMax;
            var ceiling=Math.min(maxBatch,Math.max(P.batchSizeBase,
                Math.ceil(wave.total/1.5), Math.ceil((aliveTarget||30)*1.25)));
            var floor=Math.max(P.batchSizeBase,ceiling-4);
            return floor+Math.floor(Math.random()*(ceiling-floor+1));
        }
        var effMax = Math.min(P.batchSizeMax, 2 + Math.floor((this.levelIndex || 0) / 2));
        return P.batchSizeBase + Math.floor(Math.random() * (effMax - P.batchSizeBase + 1));
    }

    _emit(w, squad) {
        if (!this.spawnFn || !w.pending.length) return false;
        // V15-GAMEPLAY-002: 真实对局(runtimeHordeBoost)沿整条远景跑道纵深铺满尸潮长河(直至基地大门前), 告别后半段路面空洞!
        var maxSlots = this.runtimeHordeBoost ? 156 : 48;
        var rowStep = this.runtimeHordeBoost ? 1.85 : 0.95;
        var slot = w.spawned % maxSlots;
        var col = slot % 6, row = Math.floor(slot / 6);
        var x = (col - 2.5) * 1.08 + randRange(-.16, .16);
        var frontZ = Math.min(w.z - 1.5, squad.z - (CONFIG.PACING.spawnDistance || 14));
        var z = frontZ - row * rowStep - randRange(0, 0.55);
        var enemy = this.spawnFn(w.pending[0], x, z, null);
        if (enemy === false || enemy === null) return false;
        w.pending.shift();
        w.spawned++;
        return true;
    }

    /** 波次内部推进: 返回true表示有状态变化(供测试断言) */
    _updateWave(w, dt, squad) {
        var P = CONFIG.PACING;

        if (w.state === 'idle') {
            if (w.requiredGateZ !== null && this.gateReadyFn && !this.gateReadyFn(w, squad)) return false;
            if (squad.z <= w.triggerZ) {
                w.startedAt=this.game ? this.game.elapsedTime : null;
                if (w.type === 'boss') {
                    w.state = 'warning';
                    if (this.onBossWarning) this.onBossWarning(w);
                } else {
                    w.state = 'spawning';
                    w.batchTimer = P.firstContactGrace;
                    if (this.onWaveStart) this.onWaveStart(w);
                }
                return true;
            }
            return false;
        }

        if (w.state === 'warning') {
            w.warnTimer -= dt;
            if (w.warnTimer <= 0) {
                // Boss从波点再向屏幕外后退出生(禁止贴脸刷新), 出场后自行走近
                var bz = Math.min(w.z + P.bossSpawnSetback, squad.z - 11);
                if (this.spawnFn) this.spawnFn('boss', 0, bz, w.hp);
                w.state = 'done';
                if (this._onBossSpawnFx) this._onBossSpawnFx(); // V4.0: 入场震屏
                if (this.onBossSpawn) this.onBossSpawn(w);
                return true;
            }
            return false;
        }

        if (w.state === 'spawning') {
            w.batchTimer -= dt;
            w.emitTimer -= dt;
            var aliveTargetNow = Math.min(this._maxAlive(), Math.max(32, Math.round((squad.count || 1) * 1.4 + 15)));
            if(!w.pending.length && w.batchTimer<=0 && w.queue.length) {
                // Atomic ownership transfer: backpressure never discards a
                // queued actor; it remains in pending until it really spawns.
                w.pending=w.queue.splice(0,Math.min(this._batchSize(w, aliveTargetNow),w.queue.length));
                // V5.1.1: 同波后续批次密接(0.25-0.4s) — 批与批间alive持续堆积成墙
                w.batchTimer = w.spawned > 0
                    ? randRange(P.batchGapMin, P.batchGapMax)
                    : randRange(P.spawnIntervalMin, P.spawnIntervalMax);
            }
            // V5.1.2(玩家反馈"来超级多的"): 活敌目标控制器(填充-涓流反馈) —
            //   alive < ALIVE_TARGET → 快速填充(~30只/秒) 尸潮墙成形
            //   alive ≥ ALIVE_TARGET → 涓流(≈4.5只/秒) 缓慢逼近硬上限, 持续施压
            // Little定律(alive=spawn×TTK)下TTK随血量缩放平方增长, 速率公式不可解析 — 反馈控制最鲁棒。
            var alive = this.aliveCountFn ? this.aliveCountFn() : 0;
            // V5.1.5: 目标活敌随队伍规模自适应(count×1.4+15) × 波次进度因子(首波0.55温和开场, 末波1.0成墙)
            var cap = this._maxAlive();
            var targetCeiling = CONFIG.ALIVE_TARGET[Math.min(this.levelIndex || 0, CONFIG.ALIVE_TARGET.length - 1)];
            if (this.runtimeHordeBoost) targetCeiling = Math.round(targetCeiling * (CONFIG.ENEMY_ALIVE_TARGET_MULTIPLIER || 1));
            var targetFormula = Math.round(((squad.count || 1) * 1.5 + (this.runtimeHordeBoost ? 48 : 14)) *
                (this.runtimeHordeBoost ? (CONFIG.ENEMY_ALIVE_TARGET_MULTIPLIER || 1) : 1));
            var aliveTarget = Math.min(cap, targetCeiling, Math.max(this.runtimeHordeBoost ? 96 : 32, targetFormula));
            // V5.1.5 / V15-GAMEPLAY-002 双相出怪: 填充相迅速沿整条跑道铺满纵深尸潮长河
            if (alive < aliveTarget) {
                var creditCap = this.runtimeHordeBoost ? 10 : 3;
                w.fillCredit = Math.min(creditCap, (w.fillCredit || 0) + dt / P.fillFrameInterval);
                var budget = Math.floor(w.fillCredit);
                var emitted = 0;
                while (w.pending.length && emitted < budget && alive < aliveTarget) {
                    if (!this._emit(w, squad)) break;
                    emitted++; alive++; w.fillCredit--;
                }
                w.emitTimer = P.trickleInterval;
            } else if (w.pending.length && w.emitTimer <= 0 && alive < this._maxAlive()) {
                // V5.1.5: 涓流速率 = 小队对该类型怪的击杀速率 ×1.15(缓慢渗漏逼近硬上限) —
                // 怪墙保持在枪线内被逐层瓦解, 到达近战的怪≈击杀×15% → 压力与火力自动平衡
                this._emit(w, squad);
                w.emitTimer = P.trickleInterval;
            }
            if (w.queue.length === 0 && w.pending.length === 0) {
                w.state = 'clearing';
                w.spawnFinishedAt=this.game ? this.game.elapsedTime : null;
                return true;
            }
            return false;
        }

        if (w.state === 'clearing') {
            var remain = this.aliveCountFn ? this.aliveCountFn() : 0;
            if (remain === 0) {
                w.state = 'done';
                w.clearedAt=this.game ? this.game.elapsedTime : null;
                if (this.onWaveClear) this.onWaveClear(w);
                return true;
            }
        }
        return false;
    }

    update(dt, squad) {
        if (this.restTimer > 0) {
            this.restTimer = Math.max(0, this.restTimer - dt);
            return;
        }
        // Admit exactly one encounter. Boss summons belong to the encounter,
        // not another pacing wave; all timers use game seconds and reset.
        for (var i = 0; i < this.waves.length; i++) {
            var w = this.waves[i];
            if (w.state === 'done') continue;
            this.activeWave = w;
            this._updateWave(w, dt, squad);
            if (w.state === 'done') {
                this.activeWave = null;
                if (w.type === 'wave') this.restTimer = randRange(CONFIG.PACING.waveRestMin, CONFIG.PACING.waveRestMax);
            }
            break;
        }
    }

    /** V5.1.1(玩家反馈): 军团持续推进模式 — 波次期间不再停驻
     *  (停驻+怪物朝镜头涌来在视觉上等同"人物向后走/撤退", 用户实测否定)
     *  现在: 军团始终前进穿越尸潮, 怪群迎面而来, 相向运动产生"推进感"。
     *  Boss warning 保留停驻(决战前蓄势)。
     *  返回 null 表示不停(继续推进) */
    frontierStopZ() {
        var w = this.activeWave;
        if (this.runtimeHordeBoost && w && w.type === 'wave' &&
            (w.state === 'spawning' || w.state === 'clearing')) return w.z + 2;
        if (w && w.type === 'boss' && w.state === 'warning') return w.triggerZ - 1;
        // V5.1.4: 末波清尾驻停 — 全部涌出后(clearing)停驻清完残余, 进度条到头=清完=结算(用户反馈"进度条到头怪还在")
        if (w && w.type === 'wave' && w.isFinal && w.state === 'clearing') return w.z + 2;
        return null;
    }

    canChooseGate(z) {
        return this.waves.every(function(w) { return w.z < z || w.state === 'done'; });
    }

    /** V5.1.5 测试钩子: 强制所有波次完成(E2E组合式Boss遭遇用) */
    forceComplete() {
        for (var i = 0; i < this.waves.length; i++) this.waves[i].state = 'done';
        this.activeWave = null;
    }

    /** V5.1: 全部波次(含Boss)是否都已排空完成 */
    isComplete() {
        for (var i = 0; i < this.waves.length; i++) {
            if (this.waves[i].state !== 'done') return false;
        }
        return this.waves.length > 0;
    }

    /** 调试/测试: 当前波次状态摘要 */
    summary() {
        return this.waves.map(function(w) {
            return { type: w.type, z: w.z, state: w.state, queued: w.queue ? w.queue.length : 0, pending:w.pending?w.pending.length:0, spawned: w.spawned || 0,startedAt:w.startedAt,spawnFinishedAt:w.spawnFinishedAt,clearedAt:w.clearedAt };
        });
    }
}
