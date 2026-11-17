// ===== V6.0 病毒能源核心 (第6关特殊玩法) =====
// 独立生命值/受击反馈/发光/伤害数字/击破动画与奖励。
// 存活时周期性强化半径内僵尸(移速+35%/攻速+25%/绿色感染染色)；击破后周围僵尸失去强化。
// 由 Game 在含 energy 段的关卡生成；战斗系统通过 takeBulletHit 注入伤害。

class EnergyCore {
    constructor(scene, x, z, cfg, game) {
        this.scene = scene;
        this.game = game;
        this.x = x; this.z = z;
        this.hp = cfg.hp || 900;
        this.maxHp = this.hp;
        this.radius = cfg.buffRadius || 9;
        this.buffInterval = cfg.buffInterval || 4.5;
        this._buffTimer = 1.2; // 首次强化较快, 让玩家立刻感知机制
        this.alive = true;
        this.dying = false;
        this._spin = 0;

        var group = new THREE.Group();
        // 核心球体(发光绿)
        var coreMat = new THREE.MeshStandardMaterial({
            color: 0x39D98A, emissive: 0x1F8F55, emissiveIntensity: 1.4,
            roughness: 0.35, metalness: 0.2
        });
        this.coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), coreMat);
        this.coreMesh.position.y = 2.6;
        this.coreMesh.castShadow = true;
        group.add(this.coreMesh);
        // 旋转环(双色)
        var ringMat = new THREE.MeshBasicMaterial({ color: 0x9CFFC4, transparent: true, opacity: 0.75 });
        this.ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.09, 8, 40), ringMat);
        this.ringMesh.position.y = 2.6;
        group.add(this.ringMesh);
        var ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 8, 32),
            new THREE.MeshBasicMaterial({ color: 0x2FA868, transparent: true, opacity: 0.85 }));
        ring2.position.y = 2.6;
        ring2.rotation.x = Math.PI / 2.6;
        group.add(ring2);
        this._ring2 = ring2;
        // 基座(能源塔)
        var baseMat = new THREE.MeshStandardMaterial({ color: 0x37474F, roughness: 0.8, metalness: 0.4 });
        var base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 1.6, 8), baseMat);
        base.position.y = 0.8;
        base.castShadow = true;
        group.add(base);
        // 点光源(绿)
        this.light = new THREE.PointLight(0x39D98A, 1.6, this.radius * 2.4);
        this.light.position.y = 2.8;
        group.add(this.light);
        // 强化半径圈(地面)
        var aura = new THREE.Mesh(new THREE.RingGeometry(this.radius - 0.35, this.radius, 48),
            new THREE.MeshBasicMaterial({ color: 0x39D98A, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
        aura.rotation.x = -Math.PI / 2;
        aura.position.y = 0.06;
        group.add(aura);
        this.auraMesh = aura;
        // 血条(双色平面, 面向相机由 update 处理)
        var barBg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.3),
            new THREE.MeshBasicMaterial({ color: 0x101820, transparent: true, opacity: 0.72, depthWrite: false }));
        barBg.position.y = 4.6;
        group.add(barBg);
        this.barBg = barBg;
        this.barFill = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.2),
            new THREE.MeshBasicMaterial({ color: 0x39D98A, depthWrite: false }));
        this.barFill.position.y = 4.6;
        this.barFill.position.z = 0.01;
        group.add(this.barFill);

        group.position.set(x, 0, z);
        group.userData.artSource = 'V6 energy-core (procedural)';
        scene.add(group);
        this.model = group;

        // 相机朝向的血条(每帧对齐)
        this._hpQuad = new THREE.Object3D();
    }

    /** 战斗系统注入伤害; 返回是否击破 */
    takeBulletHit(dmg, effects) {
        if (!this.alive || this.dying) return false;
        this.hp -= dmg;
        if (effects) {
            effects.impact(this.x, 2.6, this.z, false, false);
            if (Math.random() < 0.3) effects.floatText(this.x + randRange(-0.6, 0.6), 3.2, this.z, String(dmg), '#66FFB3', false);
            effects.burst(this.x, 2.6, this.z, 0x66FFB3, 4, 2.2, 0.3);
        }
        if (this.hp <= 0) {
            this.destroyed(effects);
            return true;
        }
        return false;
    }

    destroyed(effects) {
        this.alive = false;
        this.dying = true;
        this._dieT = 0;
        if (effects) {
            effects.burst(this.x, 2.6, this.z, 0x66FFB3, 26, 5, 0.8);
            effects.burst(this.x, 2.6, this.z, 0xFFFFFF, 14, 4, 0.5);
            effects.shockwave(this.x, 0.08, this.z, 0x39D98A);
            effects.floatText(this.x, 4.2, this.z, '能源核心击破!', '#66FFB3', true);
        }
        if (this.game && this.game.world) this.game.world.shake(0.45);
        // 击破奖励(一次性, 幂等由关卡结算外的即时金币承担, 数值固定)
        if (this.game && this.game.profile) this.game.profile.addCoins(60);
        if (effects) effects.floatText(this.x, 3.4, this.z, '+60', '#FFC247', true);
        if (this.game) this.game.onCoreDestroyed && this.game.onCoreDestroyed();
    }

    update(dt, time, squad, enemies, effects) {
        if (this.dying) {
            this._dieT += dt;
            var k = Math.max(0.001, 1 - this._dieT / 0.7);
            this.model.scale.setScalar(k);
            this.coreMesh.material.emissiveIntensity = 1.4 * k + Math.random() * 0.6;
            if (this._dieT >= 0.7) {
                this.scene.remove(this.model);
                this.dying = false; this.removed = true;
            }
            return;
        }
        if (!this.alive) return;
        // 旋转/呼吸/脉动
        this._spin += dt * 1.6;
        this.coreMesh.rotation.y = this._spin;
        this.ringMesh.rotation.z = this._spin * 1.3;
        this._ring2.rotation.z = -this._spin * 0.9;
        this.coreMesh.position.y = 2.6 + Math.sin(time * 2.2) * 0.12;
        this.light.intensity = 1.4 + Math.sin(time * 3.1) * 0.35;
        this.auraMesh.material.opacity = 0.13 + Math.sin(time * 2.4) * 0.05;
        // 血条对齐相机
        var cam = this.scene.userData.camera;
        if (cam) {
            this.barBg.quaternion.copy(cam.quaternion);
            this.barFill.quaternion.copy(cam.quaternion);
            var ratio = Math.max(0, this.hp / this.maxHp);
            this.barFill.scale.x = ratio;
            this.barFill.position.x = -1.25 * (1 - ratio);
            this.barFill.material.color.setHex(ratio > 0.5 ? 0x39D98A : ratio > 0.25 ? 0xFFC247 : 0xE45B68);
        }
        // 周期强化半径内僵尸
        this._buffTimer -= dt;
        if (this._buffTimer <= 0) {
            this._buffTimer = this.buffInterval;
            var buffed = 0;
            for (var i = 0; i < enemies.length; i++) {
                var e = enemies[i];
                if (!e.alive || e.isBoss) continue;
                var dx = e.x - this.x, dz = e.z - this.z;
                if (dx * dx + dz * dz < this.radius * this.radius) {
                    e.speedMul = Math.max(e.speedMul || 1, 1.35);
                    e.attackMul = Math.min(e.attackMul || 1, 0.75);
                    e._coreBuffed = true;
                    buffed++;
                }
            }
            if (buffed > 0 && effects) {
                effects.floatText(this.x, 4.0, this.z, '能源强化 ×' + buffed, '#66FFB3', false);
                effects.shockwave(this.x, 0.06, this.z, 0x39D98A);
            }
        }
        // 失去强化的僵尸恢复(每帧扫描, 数量可控)
        for (var j = 0; j < enemies.length; j++) {
            var m = enemies[j];
            if (!m._coreBuffed) continue;
            var mdx = m.x - this.x, mdz = m.z - this.z;
            if (!this.alive || mdx * mdx + mdz * mdz > this.radius * this.radius * 1.25) {
                m.speedMul = 1; m.attackMul = 1; m._coreBuffed = false;
            }
        }
    }

    destroy(scene) {
        scene.remove(this.model);
        this.model.traverse(function(o) {
            if (o.geometry) o.geometry.dispose();
            if (o.material && o.material.dispose) o.material.dispose();
        });
    }
}
