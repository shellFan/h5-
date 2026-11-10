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
        this.alive = true;

        // 士兵数据数组
        this.soldiers = [];

        // InstancedMesh (单次绘制调用渲染全部士兵)
        const geo = createSoldierGeometry();
        const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
        this.mesh = new THREE.InstancedMesh(geo, mat, CONFIG.SQUAD_MAX_COUNT);
        this.mesh.castShadow = true;
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.mesh.count = 0;
        scene.add(this.mesh);

        // 临时变量避免GC
        this._m = new THREE.Matrix4();
        this._p = new THREE.Vector3();
        this._q = new THREE.Quaternion();
        this._s = new THREE.Vector3();
        this._axisY = new THREE.Vector3(0, 1, 0);
    }

    /** 设置小队人数(自动处理增减与弹出动画) */
    setCount(n) {
        n = clamp(Math.floor(n), 0, CONFIG.SQUAD_MAX_COUNT);
        const old = this.count;
        this.count = n;

        if (n > old) {
            // 新增士兵: 从中心弹出
            for (let i = old; i < n; i++) {
                this.soldiers.push({
                    fx: 0, fz: 0,
                    x: randRange(-0.15, 0.15),
                    z: randRange(-0.15, 0.15),
                    spawnT: 0,
                    phase: Math.random() * Math.PI * 2,
                    rotY: randRange(-0.2, 0.2)
                });
            }
        } else if (n < old) {
            this.soldiers.length = n;
        }

        if (n === 0) this.alive = false;
        this._updateFormation();
    }

    /** 重新计算阵型目标位置 */
    _updateFormation() {
        const cols = Math.min(this.count, CONFIG.FORMATION_COLS);
        const sx = CONFIG.FORMATION_SPACING_X;
        const sz = CONFIG.FORMATION_SPACING_Z;

        for (let i = 0; i < this.count; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const s = this.soldiers[i];
            s.fx = (col - (cols - 1) / 2) * sx;
            s.fz = -row * sz;
        }
    }

    /** 僵尸击杀士兵 */
    killSoldiers(n, effects) {
        const before = this.count;
        this.setCount(this.count - n);
        // 在被杀士兵位置生成蓝色死亡粒子
        if (effects && before > this.count) {
            for (let i = this.count; i < Math.min(before, this.count + 3); i++) {
                if (this.soldiers[i]) {
                    effects.burst(
                        this.x + this.soldiers[i].x, 0.5, this.z + this.soldiers[i].z,
                        0x4A90D9, 5, 2.5, 0.4
                    );
                }
            }
        }
    }

    /** 应用状态门效果 */
    applyGate(gate, effects) {
        if (gate.op === 'add') {
            this.setCount(this.count + gate.value);
        } else if (gate.op === 'mul') {
            this.setCount(this.count * gate.value);
        } else if (gate.op === 'buff') {
            if (gate.value === 'damage') this.damageBuff += 1;
            else if (gate.value === 'firerate') this.fireRateBuff += 0.2;
        }
        // 穿门冲击波
        if (effects) {
            effects.shockwave(this.x, 0.05, this.z, 0x6EE7B7);
        }
    }

    update(dt, time, stopZ) {
        // 前进 (Boss战时在Boss前方停下，击败Boss后继续)
        if (stopZ === undefined || stopZ === null || this.z > stopZ) {
            this.z -= CONFIG.SQUAD_SPEED * dt;
        }

        // 跑道平滑切换
        this.x = damp(this.x, this.targetX, CONFIG.SQUAD_LANE_LERP, dt);

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

            // 跑动弹跳 (绝对值保证不穿地)
            const bob = Math.abs(Math.sin(time * 7 + s.phase)) * 0.09;

            // 弹出缩放 (easeOutBack 有回弹效果)
            const scale = easeOutBack(s.spawnT);

            this._p.set(this.x + s.x, bob, this.z + s.z);
            this._q.setFromAxisAngle(this._axisY, s.rotY);
            this._s.setScalar(Math.max(0.001, scale));
            this._m.compose(this._p, this._q, this._s);
            this.mesh.setMatrixAt(i, this._m);
        }

        this.mesh.count = this.count;
        this.mesh.instanceMatrix.needsUpdate = true;
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

    /** 获取伤害值(含buff) */
    getDamage() {
        return CONFIG.BULLET_DAMAGE_BASE + this.damageBuff;
    }

    /** 获取射速(含buff) */
    getFireRate() {
        return CONFIG.BULLET_FIRE_RATE_BASE * (1 + this.fireRateBuff);
    }

    reset(startCount) {
        this.x = 0;
        this.z = 0;
        this.lane = 1;
        this.targetX = CONFIG.LANE_X[1];
        this.damageBuff = 0;
        this.fireRateBuff = 0;
        this.alive = true;
        this.soldiers = [];
        this.count = 0; // 必须重置count, 否则setCount认为人数未变不补充士兵
        this.setCount(startCount);
    }
}