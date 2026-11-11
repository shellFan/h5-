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
                    triggerZ: seg.z + P.waveTriggerAhead,
                    queue: queue,
                    state: 'idle',          // idle|spawning|clearing|done
                    batchTimer: P.firstContactGrace,
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
    }

    /** 当前关卡允许的场上活敌上限(随关卡推进+1, 封顶) */
    _maxAlive() {
        var P = CONFIG.PACING;
        return Math.min(P.maxAliveCap, P.maxAliveBase + (this.levelIndex || 0));
    }

    /** 批次规模: 随关卡推进逐渐提高(1-4只) */
    _batchSize() {
        var P = CONFIG.PACING;
        var effMax = Math.min(P.batchSizeMax, 2 + Math.floor((this.levelIndex || 0) / 2));
        return P.batchSizeBase + Math.floor(Math.random() * (effMax - P.batchSizeBase + 1));
    }

    /** 波次内部推进: 返回true表示有状态变化(供测试断言) */
    _updateWave(w, dt, squad) {
        var P = CONFIG.PACING;

        if (w.state === 'idle') {
            if (squad.z <= w.triggerZ) {
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
                var bz = w.z + P.bossSpawnSetback;
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
            if (w.batchTimer <= 0 && w.queue.length > 0) {
                var alive = this.aliveCountFn ? this.aliveCountFn() : 0;
                var cap = this._maxAlive();
                if (alive < cap) {
                    var batch = Math.min(this._batchSize(), w.queue.length, cap - alive);
                    for (var i = 0; i < batch; i++) {
                        var type = w.queue.shift();
                        var lane = Math.floor(Math.random() * 3);
                        var x = CONFIG.LANE_X[lane] + randRange(-0.4, 0.4);
                        var z = w.z - randRange(0, P.spawnDepth);   // 纵深散布, 屏幕外逐步涌入
                        if (this.spawnFn) this.spawnFn(type, x, z, null);
                        w.spawned++;
                    }
                }
                w.batchTimer = randRange(P.spawnIntervalMin, P.spawnIntervalMax);
                return true;
            }
            if (w.queue.length === 0) {
                w.state = 'clearing';
                return true;
            }
            return false;
        }

        if (w.state === 'clearing') {
            var remain = this.aliveCountFn ? this.aliveCountFn() : 0;
            if (remain === 0) {
                w.state = 'done';
                if (this.onWaveClear) this.onWaveClear(w);
                return true;
            }
        }
        return false;
    }

    update(dt, squad) {
        // 波次按各自位置触发独立激活(允许重叠, maxAlive上限兜底压力)
        for (var i = 0; i < this.waves.length; i++) {
            var w = this.waves[i];
            if (w.state === 'done') continue;
            this._updateWave(w, dt, squad);
        }
    }

    /** 调试/测试: 当前波次状态摘要 */
    summary() {
        return this.waves.map(function(w) {
            return { type: w.type, z: w.z, state: w.state, queued: w.queue ? w.queue.length : 0, spawned: w.spawned || 0 };
        });
    }
}
