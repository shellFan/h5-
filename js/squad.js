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

        // V3.7: 分体实例化 — 身体/左腿/右腿 3个InstancedMesh(共3次DrawCall)
        // 腿独立渲染支持绕髋部摆动的跑步动画
        const bodyGeo = createSoldierBodyGeometry();
        const legGeoL = createSoldierLegGeometry(-1);
        const legGeoR = createSoldierLegGeometry(1);
        const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
        this.mesh = new THREE.InstancedMesh(bodyGeo, mat, CONFIG.SQUAD_MAX_COUNT);
        this.mesh.castShadow = true;
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.mesh.count = 0;
        scene.add(this.mesh);
        this.mesh.userData.artSource = 'js/models.js:createSoldierBodyGeometry+createSoldierLegGeometry (InstancedMesh x3)';
        this.legMeshL = new THREE.InstancedMesh(legGeoL, mat, CONFIG.SQUAD_MAX_COUNT);
        this.legMeshL.castShadow = true;
        this.legMeshL.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.legMeshL.count = 0;
        scene.add(this.legMeshL);
        this.legMeshR = new THREE.InstancedMesh(legGeoR, mat, CONFIG.SQUAD_MAX_COUNT);
        this.legMeshR.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(this.legMeshR);
        this._legMeshes = [this.legMeshL, this.legMeshR];

        // 临时变量避免GC
        this._m = new THREE.Matrix4();
        this._mBody = new THREE.Matrix4();     // V3.7: 身体基准矩阵(腿矩阵由此派生)
        this._p = new THREE.Vector3();
        this._q = new THREE.Quaternion();
        this._s = new THREE.Vector3();
        this._e = new THREE.Euler();  // V3.2: 姿态欧拉角
        this._axisY = new THREE.Vector3(0, 1, 0);
        // V3.7: 腿部摆动矩阵缓存
        this._hipL = new THREE.Matrix4().makeTranslation(-0.09, 0.3, 0);
        this._hipR = new THREE.Matrix4().makeTranslation(0.09, 0.3, 0);
        this._rSwing = new THREE.Matrix4();
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

        if (n === 0) this.alive = false;
        this._updateFormation();
    }

    /** 重新计算阵型目标位置 (V3.7分层阵型 + V4.0宽度约束)
     *  1-10人: 单排全展(sx按人数自适应, 保证不出路)
     *  11-30: 紧凑小队(8列) / 31-100: 自然军团(9列) / 101-300: 密集(11列) / 301-500: 军团纵深(13列)
     *  V4.0约束: 队伍半宽≤2.3 — 边界钳制下保留±1.0中心移动范围, 侧门经触发窗口扩展可达
     */
    _updateFormation() {
        const n = this.count;
        let cols, sx, sz;
        if (n <= 1)        { cols = 1;  sx = 0.72; sz = 0.66; }
        else if (n <= 10)  { cols = n;  sx = Math.min(0.72, 4.3 / (n - 1)); sz = 0.66; }
        else if (n <= 30)  { cols = 8;  sx = 0.56; sz = 0.56; }
        else if (n <= 100) { cols = 9;  sx = 0.50; sz = 0.52; }
        else if (n <= 300) { cols = 11; sx = 0.40; sz = 0.47; }
        else               { cols = 13; sx = 0.34; sz = 0.40; }
        this._formationCols = cols;
        this._formationSpacingX = sx;

        for (let i = 0; i < n; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const s = this.soldiers[i];
            // 行交错: 奇数行右移半格(蜂窝感, 打破矩形队列)
            const stagger = (row % 2 === 1) ? sx * 0.5 : 0;
            s.fx = (col - (cols - 1) / 2) * sx + stagger + s.jx;
            s.fz = -row * sz + s.jz;
        }
    }

    /** 队伍半宽(含单兵半径+交错余量) — 移动边界钳制与门触发窗口共用 */
    getHalfWidth() {
        var cols = this._formationCols || CONFIG.FORMATION_COLS;
        var sx = this._formationSpacingX || CONFIG.FORMATION_SPACING_X;
        return ((cols - 1) / 2) * sx + sx * 0.25 + 0.2;
    }

    /** 僵尸击杀士兵 (V3.3: 复活无敌期间免疫) */
    killSoldiers(n, effects) {
        if (this.invulnT > 0) return; // 复活无敌
        const before = this.count;
        // V2.2修复: 先保存被杀士兵位置，再截断数组(原代码先截断再读取导致undefined)
        var deathPos = [];
        if (effects && n > 0) {
            var startIdx = Math.max(0, before - n);
            for (let i = startIdx; i < Math.min(before, startIdx + 3); i++) {
                if (this.soldiers[i]) {
                    deathPos.push({ x: this.soldiers[i].x, z: this.soldiers[i].z });
                }
            }
        }
        this.setCount(this.count - n);
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

        // 更新每个士兵
        for (let i = 0; i < this.count; i++) {
            const s = this.soldiers[i];

            // 弹出动画进度
            if (s.spawnT < 1) {
                s.spawnT = Math.min(1, s.spawnT + dt * 3.2);
            }

            // 平滑移向阵型位置
            s.x = damp(s.x, s.fx, 9, dt);
            s.z = damp(s.z, s.fz, 9, dt);

            // V3.7: 跑动弹跳幅度降低(腿部摆动接管动感), 待机呼吸保留
            const bob = moving ? Math.abs(Math.sin(time * 8 + s.phase)) * 0.05 : Math.sin(time * 2 + s.phase) * 0.02;

            // 弹出缩放 (easeOutBack 有回弹效果)
            const scale = easeOutBack(s.spawnT);

            this._p.set(this.x + s.x, bob, this.z + s.z);
            // V3.2: 组合旋转(前倾 + 换道侧倾 + 个体朝向)
            this._e.set(lean, s.rotY, tilt, 'YXZ');
            this._q.setFromEuler(this._e);
            this._s.setScalar(Math.max(0.001, scale));
            this._mBody.compose(this._p, this._q, this._s);
            this.mesh.setMatrixAt(i, this._mBody);

            // V3.7: 腿部绕髋部X轴交替摆动(跑步循环), 待机时静止
            var swingL = 0, swingR = 0;
            if (moving) {
                const ph = time * 8 + s.phase;
                swingL = Math.sin(ph) * 0.62;
                swingR = Math.sin(ph + Math.PI) * 0.62;
            }
            // 左腿 = bodyM * hipL * Rx(swingL)
            this._rSwing.makeRotationX(swingL);
            this._m.copy(this._mBody).multiply(this._hipL).multiply(this._rSwing);
            this.legMeshL.setMatrixAt(i, this._m);
            // 右腿 = bodyM * hipR * Rx(swingR)
            this._rSwing.makeRotationX(swingR);
            this._m.copy(this._mBody).multiply(this._hipR).multiply(this._rSwing);
            this.legMeshR.setMatrixAt(i, this._m);
        }

        this.mesh.count = this.count;
        this.mesh.instanceMatrix.needsUpdate = true;
        this.legMeshL.count = this.count;
        this.legMeshL.instanceMatrix.needsUpdate = true;
        this.legMeshR.count = this.count;
        this.legMeshR.instanceMatrix.needsUpdate = true;
    }

    /** 获取随机士兵世界位置(射击出弹点) */
    getRandomSoldierPos() {
        if (this.count === 0) return null;
        const i = Math.floor(Math.random() * this.count);
        const s = this.soldiers[i];
        return {
            x: this.x + s.x,
            y: 0.52,
            z: this.z + s.z - 0.25
        };
    }

    /** 获取多个射击点(分散取) */
    getShootPositions(n) {
        const positions = [];
        if (this.count === 0) return positions;
        n = Math.min(n, this.count);
        const step = this.count / n;
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(i * step + Math.random() * step) % this.count;
            const s = this.soldiers[idx];
            positions.push({
                x: this.x + s.x,
                y: 0.52,
                z: this.z + s.z - 0.25
            });
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

    reset(startCount) {
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