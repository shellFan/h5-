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
    _batchSize(wave, aliveTarget) {
        var P = CONFIG.PACING;
        if(wave) {
            // V5.1.5: 批次≥目标活敌×1.25 — 一批就能把 alive 填到目标(旧按波总量/1.5切批,
            // 批间真空期被击杀清空, alive 永远只有批大小)
            var ceiling=Math.min(P.batchSizeMax,Math.max(P.batchSizeBase,
                Math.ceil(wave.total/1.5), Math.ceil((aliveTarget||30)*1.25)));
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
            var aliveTargetNow = Math.min(this._maxAlive(), Math.max(14, Math.round((squad.count || 1) * 1.4 + 15)));
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
            var waveCount = this.waves.filter(function(w) { return w.type === 'wave'; }).length || 1;
            var progressFactor = 0.55 + 0.45 * Math.min(1, (w.index || 0) / Math.max(1, waveCount - 1));
            // V5.1.5: 关卡压力系数 — L1温和(0.75)→L5全力(1.0), 教学关不被超级尸潮碾碎
            var levelFactor = 0.55 + 0.45 * Math.min(1, (this.levelIndex || 0) / 4); // V5.1.5: L1 0.55(教学)→L5 1.0(全力)
            // V5.1.5: 目标随队伍火力自适应 — 火力弱(dps<150)自动降怪量保生存, 火力强(>375)尸潮墙
            var dpsNowT = (this.game && this.game.squad) ? this.game.squad.count * this.game.squad.getDamage() * this.game.squad.getFireRate() : 150;
            var dpsFactor = Math.max(0.55, Math.min(2.2, dpsNowT / 120));
            var aliveTarget = Math.min(cap, Math.max(12, Math.round(((squad.count || 1) * 0.6 * dpsFactor + 6) * progressFactor * levelFactor)));
            // V5.1.5 双相出怪(用户反馈"来超级多的"):
            //   填充相: alive < 目标 → 帧预算突发 ceil(dt/0.008)≈4只/帧(120-240只/s) 尸潮墙成形
            //   涓流相: alive ≥ 目标 → 1只/0.15s(6.7只/s) 持续施压逼近硬上限
            // 弱队伍击杀慢 → alive 高于目标时间更长 → 涓流为主自动降速; 强队伍击杀快 → 填充为主屏满尸潮。
            var alive = this.aliveCountFn ? this.aliveCountFn() : 0;
            if (alive < aliveTarget) {
                var budget = Math.max(1, Math.round(dt / P.fillFrameInterval));
                var emitted = 0;
                while (w.pending.length && emitted < budget && alive < this._maxAlive()) {
                    var type=w.pending[0],lane=Math.floor(Math.random()*3);
                    var x=CONFIG.LANE_X[lane]+randRange(-.9,.9);
                    var z=squad.z-randRange(11,11+P.spawnDepth);
                    if(this.spawnFn)this.spawnFn(type,x,z,null);
                    w.pending.shift();w.spawned++;emitted++;alive++;
                }
            } else if (w.pending.length && w.emitTimer <= 0 && alive < this._maxAlive()) {
                // V5.1.5: 涓流速率 = 小队对该类型怪的击杀速率 ×1.15(缓慢渗漏逼近硬上限) —
                // 怪墙保持在枪线内被逐层瓦解, 到达近战的怪≈击杀×15% → 压力与火力自动平衡
                var type2=w.pending[0],lane2=Math.floor(Math.random()*3);
                var x2=CONFIG.LANE_X[lane2]+randRange(-.9,.9);
                var z2=squad.z-randRange(11,11+P.spawnDepth);
                if(this.spawnFn)this.spawnFn(type2,x2,z2,null);
                w.pending.shift();w.spawned++;
                var refHp2 = (CONFIG.ZOMBIE[type2] || CONFIG.ZOMBIE.normal).hp || 3;
                var killRate = Math.max(4, 55 / refHp2); // hpMul∝dps → 击杀速率≈55/refHp(不变量)
                w.emitTimer = Math.max(0.05, 1 / (killRate * 1.05)); // V5.1.5: 渗漏1.05(净+5%/s, 陡增会压垮中后期build)
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
