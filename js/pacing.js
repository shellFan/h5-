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
    }

    /** 从关卡数据构建波次计划 */
    loadFromLevel(level, levelIndex) {
        this.clear();
        var P = CONFIG.PACING;
        this.levelIndex = levelIndex || 0;
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
                    for (var k = 0; k < seg.enemies[j].count; k++) {
                        queue.push(seg.enemies[j].type);
                    }
                }
                this.waves.push({
                    type: 'wave', z: seg.z,
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
                    triggerZ: seg.z + P.bossTriggerAhead,
                    hp: seg.boss && seg.boss.hp ? seg.boss.hp : null,
                    state: 'idle',          // idle|warning|done
                    warnTimer: P.bossWarningTime
                });
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
        if (matrix && matrix.length) return matrix[Math.min(li, matrix.length - 1)];
        var P = CONFIG.PACING;
        return Math.min(20, 10 + li);
    }

    /** V5.1.1: 批次规模加大(尸潮成堆涌现, 玩家反馈"怪物太少") */
    _batchSize(wave) {
        var P = CONFIG.PACING;
        if(wave) {
            // V5.1.1: 整波成墙 — 批次≈波总量/1.5(10-16只), 连续批次间alive持续堆积
            var ceiling=Math.min(P.batchSizeMax,Math.max(P.batchSizeBase,Math.ceil(wave.total/1.5)));
            var floor=Math.max(P.batchSizeBase,ceiling-4);
            return floor+Math.floor(Math.random()*(ceiling-floor+1));
        }
        var effMax = Math.min(P.batchSizeMax, 2 + Math.floor((this.levelIndex || 0) / 2));
        return P.batchSizeBase + Math.floor(Math.random() * (effMax - P.batchSizeBase + 1));
    }

    /** 波次内部推进: 返回true表示有状态变化(供测试断言) */
    _updateWave(w, dt, squad) {
        var P = CONFIG.PACING;

        if (w.state === 'idle') {
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
            if(!w.pending.length && w.batchTimer<=0 && w.queue.length) {
                // Atomic ownership transfer: backpressure never discards a
                // queued actor; it remains in pending until it really spawns.
                w.pending=w.queue.splice(0,Math.min(this._batchSize(w),w.queue.length));
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
            // V5.1.2: 目标活敌随队伍规模自适应(13人队≈18只, 100人队≈70只, 500人队=硬上限)
            // 固定常数会让弱build被填墙秒杀 / 强build无尸潮感
            // V5.1.3: ×波次进度因子 — 首波0.55温和开场, 末波1.0成墙(×3体量下首波即墙=必死)
            var cap = this._maxAlive();
            var waveCount = this.waves.filter(function(w) { return w.type === 'wave'; }).length || 1;
            var progressFactor = 0.55 + 0.45 * Math.min(1, (w.index || 0) / Math.max(1, waveCount - 1));
            var aliveTarget = Math.min(cap, Math.max(8, Math.round(((squad.count || 1) * 0.9 + 4) * progressFactor)));
            var interval = alive < aliveTarget ? Math.max(P.streamInterval, 0.04) : 0.3;
            if(w.pending.length && w.emitTimer<=0 && alive<this._maxAlive()) {
                var type=w.pending[0],lane=Math.floor(Math.random()*3);
                var x=CONFIG.LANE_X[lane]+randRange(-.9,.9);
                var z=squad.z-randRange(11,11+P.spawnDepth);
                if(this.spawnFn)this.spawnFn(type,x,z,null);
                w.pending.shift();w.spawned++;
                w.emitTimer=dt>.1?interval:Math.max(0,w.emitTimer)+interval;
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
        if (w && w.type === 'boss' && w.state === 'warning') return w.triggerZ - 1;
        // V5.1.4: 末波清尾驻停 — 全部涌出后(clearing)停驻清完残余, 进度条到头=清完=结算(用户反馈"进度条到头怪还在")
        if (w && w.type === 'wave' && w.isFinal && w.state === 'clearing') return w.z + 2;
        return null;
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
