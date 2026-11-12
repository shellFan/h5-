// ===== 小队系统: 实例化渲染/阵型/膨胀动画 =====

class Squad {
    constructor(scene) {
        this.scene = scene;
        this.x = 0;
        this.z = 0;
        this.lane = 1;
        this.targetX = CONFIG.LANE_X[1];
        this.count = 0;
        this.damageBuff = 0;
        this.fireRateBuff = 0;
        // V3.3: 扩展Buff体系
        this.pierce = 0;        // 穿透层数(0-3)
        this.critChance = 0;    // 暴击率(0-0.5)
        this.freezeStacks = 0;  // 冰冻弹(命中减速)
        this.vampStacks = 0;    // 吸血(击杀回复)
        this.alive = true;

        // 士兵数据数组
        this.soldiers = [];

        // V4.1: loaded rigid GLB parts, shared by hero/LOD instance banks.
        this.renderer = new SoldierRenderer(scene);
        this.mesh = this.renderer.mesh;       // compatibility aliases used by tests/debug UI
        this.legMeshL = this.renderer.legMeshL;
        this.legMeshR = this.renderer.legMeshR;
        this._legMeshes = [this.legMeshL, this.legMeshR];
        this._moving = false;
        this._lean = 0;
        this._tilt = 0;
    }

    /** 设置小队人数(自动处理增减与弹出动画) */
    setCount(n) {
        n = clamp(Math.floor(n), 0, CONFIG.SQUAD_MAX_COUNT);
        const old = this.count;
        this.count = n;

        if (n > old) {
            // 新增士兵: 从中心弹出 (V3.7: 附带固定个体微抖动, 打破网格僵硬感)
            for (let i = old; i < n; i++) {
                this.soldiers.push({
                    fx: 0, fz: 0,
                    x: randRange(-0.15, 0.15),
                    z: randRange(-0.15, 0.15),
                    spawnT: 0,
                    phase: Math.random() * Math.PI * 2,
                    rotY: randRange(-0.18, 0.18),
                    jx: randRange(-0.07, 0.07),
                    jz: randRange(-0.05, 0.05)
                });
            }
        } else if (n < old) {
            this.soldiers.length = n;
        }

        this.alive = n > 0;
        this._updateFormation();
    }

    /** Balanced compact ranks. Adjacent rows differ by at most one soldier. */
    _updateFormation() {
        const n = this.count;
        let preferredCols, sx, sz, scale;
        if (n <= 1)        { preferredCols = 1;  sx = 0.72; sz = 0.72; scale = 1; }
        else if (n <= 12)  { preferredCols = Math.ceil(Math.sqrt(n)); sx = 0.70; sz = 0.72; scale = 1; }
        else if (n <= 100) { preferredCols = 7;  sx = 0.63; sz = 0.66; scale = 0.86; }
        else if (n <= 300) { preferredCols = 11; sx = 0.37; sz = 0.50; scale = 0.55; }
        else               { preferredCols = 13; sx = 0.33; sz = 0.46; scale = 0.50; }

        const rows = n > 0 ? Math.ceil(n / preferredCols) : 0;
        const shortRow = rows ? Math.floor(n / rows) : 0;
        let longRows = rows ? n % rows : 0;
        const rowLengths = [];
        // Spread longer rows through the formation rather than leaving one
        // visibly incomplete tail row.
        for (let row = 0; row < rows; row++) {
            const remainingRows = rows - row;
            const makeLong = longRows > 0 && (row % 2 === 0 || longRows === remainingRows);
            rowLengths.push(shortRow + (makeLong ? 1 : 0));
            if (makeLong) longRows--;
        }
        this._formationCols = rowLengths.length ? Math.max.apply(Math, rowLengths) : 1;
        this._formationSpacingX = sx;
        this._formationScale = scale;
        let soldierIndex = 0;
        let maxAbsX = 0;
        for (let row = 0; row < rowLengths.length; row++) {
            const rowCount = rowLengths[row];
            for (let col = 0; col < rowCount; col++) {
                const s = this.soldiers[soldierIndex++];
                const staggerAmount = sx * (n <= 100 ? 0.10 : 0.16);
                const stagger = row % 2 ? staggerAmount : -staggerAmount;
                s.fx = (col - (rowCount - 1) / 2) * sx + (n > 1 ? stagger : 0) + s.jx * 0.45;
                s.fz = -row * sz + s.jz * 0.5 + Math.abs(col - (rowCount - 1) / 2) * 0.055;
                maxAbsX = Math.max(maxAbsX, Math.abs(s.fx));
            }
        }
        // Model shoulder envelope is ~0.72 wide at scale 1.
        this._halfWidth = maxAbsX + 0.36 * scale;
    }

    /** 队伍半宽(含单兵半径+交错余量) — 移动边界钳制与门触发窗口共用 */
    getHalfWidth() {
        return this._halfWidth || 0.36;
    }

    /** 僵尸击杀士兵 (V3.3: 复活无敌期间免疫) */
    killSoldiers(n, effects) {
        if (this.invulnT > 0) return; // 复活无敌
        const before = this.count;
        var removed = Math.min(before, Math.max(0, Math.floor(n)));
        var removedStart = before - removed;
        if (removed > 0) this.renderer.captureDeaths(removedStart, before, this);
        // V2.2修复: 先保存被杀士兵位置，再截断数组(原代码先截断再读取导致undefined)
        var deathPos = [];
        if (effects && n > 0) {
            var startIdx = removedStart;
            for (let i = startIdx; i < Math.min(before, startIdx + 3); i++) {
                if (this.soldiers[i]) {
                    deathPos.push({ x: this.soldiers[i].x, z: this.soldiers[i].z });
                }
            }
        }
        this.setCount(this.count - n);
        if (this.count > 0 && removed > 0) this.renderer.triggerHit();
        // 在被杀士兵位置生成蓝色死亡粒子
        if (effects && deathPos.length > 0) {
            for (let i = 0; i < deathPos.length; i++) {
                effects.burst(
                    this.x + deathPos[i].x, 0.5, this.z + deathPos[i].z,
                    0x4A90D9, 5, 2.5, 0.4
                );
            }
        }
    }

    /** 应用状态门效果 (V3.3: 完整Buff体系) */
    applyGate(gate, effects) {
        var added = 0;
        if (gate.op === 'add') {
            added = gate.value;
            this.setCount(this.count + gate.value);
        } else if (gate.op === 'mul') {
            added = this.count * (gate.value - 1);
            this.setCount(this.count * gate.value);
        } else if (gate.op === 'risk') {
            // V3.3: 风险门 — 红色, 人数-30%换输出+2
            var lost = Math.floor(this.count * 0.3);
            this.setCount(Math.max(1, this.count - lost));
            this.damageBuff = Math.min(99, this.damageBuff + 2);
            added = -lost;
        } else if (gate.op === 'buff') {
            switch (gate.value) {
                case 'damage':  this.damageBuff = Math.min(99, this.damageBuff + 1); break;
                case 'damage2': this.damageBuff = Math.min(99, Math.max(2, this.damageBuff * 2)); break;
                case 'firerate': this.fireRateBuff = Math.min(0.5, this.fireRateBuff + 0.2); break; // 上限3.0射速
                case 'pierce':  this.pierce = Math.min(3, this.pierce + 1); break;
                case 'crit':    this.critChance = Math.min(0.5, this.critChance + 0.1); break;
                case 'freeze':  this.freezeStacks = Math.min(2, this.freezeStacks + 1); break;
                case 'vamp':    this.vampStacks = Math.min(2, this.vampStacks + 1); break;
            }
        }
        // 穿门反馈: 冲击波 + 膨胀文字 + 粒子
        if (effects) {
            var isMul = gate.op === 'mul';
            var isRisk = gate.op === 'risk';
            var isBuff = gate.op === 'buff';
            // 冲击波(乘法门更大/风险门红色)
            effects.shockwave(this.x, 0.05, this.z, isRisk ? 0xFF5B58 : (isMul ? 0xFFC247 : 0x75DFFF));
            if (isMul) effects.shockwave(this.x, 0.05, this.z, 0x75DFFF);
            // 人数变化文字
            if (added > 0) {
                effects.floatText(this.x, 1.6, this.z, '+' + added, '#75DFFF', isMul);
            } else if (added < 0) {
                effects.floatText(this.x, 1.6, this.z, String(added), '#FF5B58', true);
            }
            // Buff文字(按类型配色)
            if (isBuff || isRisk) {
                var texts = {
                    damage:  ['输出+1', '#FFE66D'],
                    damage2: ['输出×2', '#FFE66D'],
                    firerate:['射速+20%', '#66D68F'],
                    pierce:  ['穿透+1', '#75DFFF'],
                    crit:    ['暴击+10%', '#FFC247'],
                    freeze:  ['冰冻弹', '#9AD8FF'],
                    vamp:    ['吸血', '#66D68F'],
                    risk:    ['输出+2', '#FF5B58']
                };
                var t = texts[gate.value] || ['BUFF', '#A14DFF'];
                effects.floatText(this.x, 1.7, this.z, t[0], t[1], true);
                var burstCol = gate.value === 'crit' ? 0xFFC247 :
                    gate.value === 'freeze' ? 0x9AD8FF :
                    gate.value === 'vamp' ? 0x66D68F : 0xA14DFF;
                effects.burst(this.x, 0.6, this.z, burstCol, 10, 3, 0.5);
            }
            // 蓝色粒子扩散(人数增加时)
            if (added > 0) {
                var pCount = Math.min(12, 4 + Math.floor(added / 5));
                effects.burst(this.x, 0.5, this.z, 0x75DFFF, pCount, 3.5, 0.6);
            }
        }
    }

    update(dt, time, stopZ) {
        // V3.3: 复活无敌倒计时
        if (this.invulnT > 0) this.invulnT -= dt;
        // 前进 (Boss战时在Boss前方停下，击败Boss后继续)
        var moving = (stopZ === undefined || stopZ === null || this.z > stopZ);
        if (moving) {
            this.z -= CONFIG.SQUAD_SPEED * dt;
        }

        // V4.0: 连续目标位置 + 帧率无关平滑跟随(替代旧跳道急吸附)
        // 目标与实际位置都钳制在随队伍宽度变化的可移动边界内
        var bound = MovementMath.centerBounds(this.getHalfWidth());
        this.targetX = MovementMath.clampCenter(this.targetX, bound);
        this.x = MovementMath.clampCenter(
            damp(this.x, this.targetX, MovementMath.followLambda(), dt), bound);
        // V3.2: 换道倾斜(速度感) + 跑动前倾
        const tilt = clamp((this.x - this.targetX) * 0.28, -0.28, 0.28);
        const lean = moving ? 0.1 : 0.02;

        this._moving = moving;
        this._lean = lean;
        this._tilt = tilt;
        // Logical positions remain independent from GLB rendering.
        for (let i = 0; i < this.count; i++) {
            const s = this.soldiers[i];

            // 弹出动画进度
            if (s.spawnT < 1) {
                s.spawnT = Math.min(1, s.spawnT + dt * 3.2);
            }

            // 平滑移向阵型位置
            s.x = damp(s.x, s.fx, 9, dt);
            s.z = damp(s.z, s.fz, 9, dt);

        }
        this.renderer.update(dt, time, this, moving, lean, tilt);
        this.mesh = this.renderer.mesh;
        this.legMeshL = this.renderer.legMeshL;
        this.legMeshR = this.renderer.legMeshR;
        this._legMeshes[0] = this.legMeshL;
        this._legMeshes[1] = this.legMeshR;
    }

    /** 获取随机士兵世界位置(射击出弹点) */
    getRandomSoldierPos() {
        if (this.count === 0) return null;
        const i = Math.floor(Math.random() * this.count);
        const p = this.renderer.getMuzzlePosition(i, this);
        return { x: p.x, y: p.y, z: p.z, shooterIndex: i };
    }

    /** 获取多个射击点(分散取) */
    getShootPositions(n) {
        const positions = [];
        if (this.count === 0) return positions;
        n = Math.min(n, this.count);
        const step = this.count / n;
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(i * step + Math.random() * step) % this.count;
            this.renderer.triggerShoot(idx);
            const p = this.renderer.getMuzzlePosition(idx, this);
            positions.push({ x: p.x, y: p.y, z: p.z, shooterIndex: idx });
        }
        return positions;
    }

    /** 获取伤害值(含buff) V3.3: 上限99 */
    getDamage() {
        return Math.min(99, CONFIG.BULLET_DAMAGE_BASE + this.damageBuff);
    }

    /** 获取射速(含buff) V3.3: 上限3.0 */
    getFireRate() {
        return Math.min(3.0, CONFIG.BULLET_FIRE_RATE_BASE * (1 + this.fireRateBuff));
    }

    setAnimationState(name) {
        this.renderer.setState(name);
    }

    reset(startCount) {
        this.renderer.clearGhosts();
        this.renderer.setState(null);
        this.renderer._shootT.fill(0);
        this.renderer._hitT = 0;
        this.x = 0;
        this.z = 0;
        this.lane = 1;
        this.targetX = CONFIG.LANE_X[1];
        this.damageBuff = 0;
        this.fireRateBuff = 0;
        this.pierce = 0;
        this.critChance = 0;
        this.freezeStacks = 0;
        this.vampStacks = 0;
        this.alive = true;
        this.soldiers = [];
        this.count = 0; // 必须重置count, 否则setCount认为人数未变不补充士兵
        this.setCount(startCount);
    }
}
