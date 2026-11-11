// ===== 僵尸/Boss 系统 =====

class Enemy {
    constructor(type, x, z, scene, hpOverride) {
        this.type = type;
        this.cfg = CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal;
        this.hp = hpOverride || this.cfg.hp;   // V3.3: 关卡可覆盖Boss血量
        this.maxHp = this.hp;
        this.x = x;
        this.z = z;
        this.alive = true;
        this.attackTimer = 0;
        this.hitFlash = 0;
        this.knockback = 0;
        this.frozenT = 0;       // V3.3: 冰冻减速剩余时间
        this._frozenFx = false; // 冰冻粒子只播一次
        this.spitTimer = randRange(1, 2);
        this.phase = Math.random() * Math.PI * 2;
        this.isBoss = (type === 'boss');
        this.enraged = false;   // V3.2: Boss狂暴阶段标记
        this.speedMul = 1;      // 移速倍率
        this.attackMul = 1;     // 攻击间隔倍率
        this.dying = false;
        this.dieT = 0;
        this.deathHandled = false;
        this.removeReady = false;

        this.model = createZombieModel(type);
        this.model.position.set(x, 0, z);
        this.model.scale.setScalar(this.cfg.scale); // V2.2修复: 存活时应用类型scale
        this.visScale = this.cfg.scale; // 实际视觉scale(分裂僵尸会缩小)
        scene.add(this.model);

        // 收集可闪烁材质
        this.flashMats = [];
        this.model.traverse(function(obj) {
            if (obj.material && obj.material.emissive) {
                this.flashMats.push(obj.material);
            }
        }.bind(this));
    }

    takeDamage(dmg, effects, fromX, isCrit) {
        if (!this.alive) return false;
        this.hp -= dmg;
        this.hitFlash = 0.08;
        // 击退(非Boss)
        if (!this.isBoss) this.knockback = Math.min(this.knockback + 1.5, 3);
        // 命中火花
        if (effects) {
            effects.burst(this.x, 0.55, this.z, isCrit ? 0xFF8844 : 0xFFE066, 3, 2, 0.25);
            // 伤害数字 (V3.6: 降低概率避免大规模战斗时文字刷屏; V3.3: 暴击必显大字)
            if (isCrit) {
                effects.floatText(this.x, 1.0, this.z, String(dmg), '#FF8844', true);
            } else if (Math.random() < 0.12) {
                effects.floatText(this.x, 0.9, this.z, String(dmg), '#FFD700', false);
            }
        }
        if (this.hp <= 0) {
            this.die(effects);
            return true;
        }
        return false;
    }

    die(effects) {
        this.alive = false;
        this.dying = true;
        this.dieT = 0;
        if (effects) {
            // 卡通粒子爆开
            effects.burst(this.x, 0.5, this.z, this.cfg.color, 12, 3.5, 0.6);
            effects.burst(this.x, 0.5, this.z, 0xFFFFFF, 4, 2, 0.3);
            // 金色积分光点
            effects.burst(this.x, 0.7, this.z, 0xFFD700, 3, 2.2, 0.8);
        }
    }

    update(dt, time, squad, manager, effects) {
        // === 死亡动画: 后仰+缩小 ===
        if (this.dying) {
            this.dieT += dt;
            var dur = this.isBoss ? 0.8 : 0.35;
            var t = Math.min(1, this.dieT / dur);
            // 后仰
            this.model.rotation.x = -t * 1.4;
            // 缩小消失 (V2.2: 使用visScale避免分裂僵尸跳变)
            var s = this.visScale * (1 - easeOutCubic(t));
            this.model.scale.setScalar(Math.max(0.001, s));
            if (this.dieT >= dur) {
                this.removeReady = true;
            }
            return;
        }
        if (!this.alive) return;

        // V3.3: 冰冻减速
        if (this.frozenT > 0) this.frozenT -= dt;
        const frozen = this.frozenT > 0;

        const dz = squad.z - this.z;
        const dist = Math.abs(dz);
        const attackDist = CONFIG.ZOMBIE_ATTACK_DIST * (this.isBoss ? 2.5 : 1);

        // V3.2: Boss狂暴阶段 — 血量50%触发, 移速/攻击提升 + 红色氛围
        if (this.isBoss && !this.enraged && this.hp <= this.maxHp * 0.5) {
            this.enraged = true;
            this.speedMul = 1.5;
            this.attackMul = 0.65; // 攻击间隔缩短
            if (effects) {
                effects.floatText(this.x, 2.6, this.z, '狂暴!', '#FF4444', true);
                effects.shockwave(this.x, 0.05, this.z, 0xFF4444);
                effects.burst(this.x, 1.2, this.z, 0xFF3333, 18, 4, 0.7);
            }
            var self = this;
            this.model.traverse(function(obj) {
                if (obj.material && obj.material.emissive) obj.material.emissive.setHex(0x3A0000);
            });
        }

        // 吐痰僵尸: 远程攻击
        if (this.type === 'spitter' && dist > attackDist && dist < 10) {
            this.spitTimer -= dt;
            if (this.spitTimer <= 0) {
                this.spitTimer = randRange(1.8, 2.5);
                manager.spawnSpit(this.x, 0.5, this.z, squad);
            }
        }

        if (dist > attackDist) {
            // 向小队移动 (V3.3: 冰冻时减速70%)
            const spd = this.cfg.speed * (this.speedMul || 1) * (frozen ? 0.3 : 1);
            this.z += Math.sign(dz) * spd * dt;
            const dx = squad.x - this.x;
            this.x += clamp(dx, -1, 1) * spd * 0.4 * dt;
        } else {
            // 近战攻击 (V3.3: 冰冻时攻击间隔延长)
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.attackTimer = CONFIG.ZOMBIE_ATTACK_INTERVAL * (this.attackMul || 1) * (frozen ? 2 : 1);
                const kill = this.isBoss ? (this.enraged ? 5 : 3) : CONFIG.ZOMBIE_ATTACK_KILL;
                squad.killSoldiers(kill, effects);
                if (effects) {
                    effects.burst(squad.x, 0.5, squad.z, 0xFF4444, 5, 2, 0.3);
                }
            }
        }

        // 击退衰减
        if (this.knockback > 0.01) {
            this.z += this.knockback * dt * 3;
            this.knockback *= Math.pow(0.05, dt);
        }

        // 行走动画: 摇摆+弹跳
        const walkSpeed = this.isBoss ? 3 : 5;
        const sway = Math.sin(time * walkSpeed + this.phase) * 0.1;
        const bob = Math.abs(Math.sin(time * walkSpeed + this.phase)) * 0.06;
        this.model.position.set(this.x, bob, this.z);
        this.model.rotation.z = sway;
        // V3.2: 攻击时前扑啃咬动画(近战范围内身体前倾伸缩)
        if (dist <= attackDist) {
            this.model.rotation.x = -0.16 + Math.sin(time * 9 + this.phase) * 0.13;
        } else {
            this.model.rotation.x = Math.sin(time * walkSpeed + this.phase) * 0.05;
        }

        // 受击闪烁 (V3.6: 压低强度避免Boss被连续命中时刷成全白)
        if (this.hitFlash > 0) {
            this.hitFlash -= dt;
            const k = Math.max(0, this.hitFlash / 0.08) * 0.35;
            for (let i = 0; i < this.flashMats.length; i++) {
                this.flashMats[i].emissive.setRGB(k, k * 0.85, k * 0.6);
            }
        }
    }

    destroy(scene) {
        scene.remove(this.model);
        this.model.traverse(function(obj) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }
}

class EnemyManager {
    constructor(scene, effects) {
        this.scene = scene;
        this.effects = effects;
        this.enemies = [];
        this.spits = [];
        this.pendingSpawns = [];
        this.boss = null;
        this.splitQueue = [];
        this.killCount = 0;
    }

    loadFromLevel(level) {
        this.clear();
        for (const seg of level.segments) {
            if (seg.type === 'wave') {
                for (const e of seg.enemies) {
                    for (let i = 0; i < e.count; i++) {
                        const lane = Math.floor(Math.random() * 3);
                        this.pendingSpawns.push({
                            type: e.type,
                            x: CONFIG.LANE_X[lane] + randRange(-0.4, 0.4),
                            z: seg.z - randRange(0, 4),
                            triggerZ: seg.z + 14
                        });
                    }
                }
            } else if (seg.type === 'boss') {
                this.pendingSpawns.push({
                    type: 'boss', x: 0, z: seg.z,
                    hp: seg.boss && seg.boss.hp ? seg.boss.hp : null, // V3.3: 关卡血量覆盖
                    triggerZ: seg.z + 16, isBoss: true
                });
            }
        }
    }

    clear() {
        for (const e of this.enemies) e.destroy(this.scene);
        this.enemies = [];
        for (const s of this.spits) this.scene.remove(s.mesh);
        this.spits = [];
        this.pendingSpawns = [];
        this.boss = null;
        this.splitQueue = [];
        this.killCount = 0;
    }

    spawnSpit(x, y, z, squad) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0x44FF44 })
        );
        mesh.position.set(x, y, z);
        this.scene.add(mesh);
        this.spits.push({
            mesh: mesh,
            vx: (squad.x - x) * 0.8,
            vz: -8, // 向小队方向(-Z)
            life: 2.5
        });
    }

    update(dt, time, squad) {
        // 触发生成
        for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
            const ps = this.pendingSpawns[i];
            if (squad.z <= ps.triggerZ) {
                const e = new Enemy(ps.type, ps.x, ps.z, this.scene, ps.hp);
                this.enemies.push(e);
                if (ps.isBoss) this.boss = e;
                this.pendingSpawns.splice(i, 1);
            }
        }

        // 分裂僵尸死亡后产生小僵尸
        for (let i = this.splitQueue.length - 1; i >= 0; i--) {
            const sq = this.splitQueue[i];
            sq.delay -= dt;
            if (sq.delay <= 0) {
                const e = new Enemy('normal', sq.x + randRange(-0.5, 0.5), sq.z, this.scene);
                e.model.scale.multiplyScalar(0.6);
                e.visScale = e.cfg.scale * 0.6;
                e.hp = 2;
                this.enemies.push(e);
                this.splitQueue.splice(i, 1);
            }
        }

        // 更新僵尸
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt, time, squad, this, this.effects);
            // 刚死亡: 触发分裂/Boss爆炸(仅一次)
            if (!e.alive && !e.deathHandled) {
                e.deathHandled = true;
                this.killCount++;
                // 分裂僵尸: 死亡时排队分裂
                if (e.type === 'split') {
                    this.splitQueue.push({ x: e.x, z: e.z, delay: 0.2 });
                    this.splitQueue.push({ x: e.x, z: e.z, delay: 0.35 });
                }
                if (e === this.boss) {
                    this.boss = null;
                    // Boss死亡大爆炸 + 金色粒子
                    this.effects.burst(e.x, 1, e.z, 0xFF4444, 30, 5, 1);
                    this.effects.burst(e.x, 1, e.z, 0xFFD700, 20, 4, 0.8);
                    this.effects.burst(e.x, 1.2, e.z, 0xFFFFFF, 15, 3, 0.6);
                    // 冲击波
                    this.effects.shockwave(e.x, 0.05, e.z, 0xFFD700);
                }
            }
            // 死亡动画完成: 移除
            if (e.removeReady) {
                e.destroy(this.scene);
                this.enemies.splice(i, 1);
            }
        }

        // 更新吐痰弹
        for (let i = this.spits.length - 1; i >= 0; i--) {
            const s = this.spits[i];
            s.life -= dt;
            s.mesh.position.x += s.vx * dt;
            s.mesh.position.z += s.vz * dt;
            // 命中小队
            if (Math.abs(s.mesh.position.z - squad.z) < 0.8 &&
                Math.abs(s.mesh.position.x - squad.x) < 1.5) {
                squad.killSoldiers(1, this.effects);
                this.effects.burst(s.mesh.position.x, 0.5, s.mesh.position.z, 0x44FF44, 5, 2, 0.3);
                this.scene.remove(s.mesh);
                this.spits.splice(i, 1);
                continue;
            }
            if (s.life <= 0) {
                this.scene.remove(s.mesh);
                this.spits.splice(i, 1);
            }
        }
    }

    /** 获取最近的活僵尸(子弹追踪用) V3.1: 只瞄准前方(e.z更小)的敌人 */
    getNearest(x, z, maxDist) {
        let best = null;
        let bestDist = maxDist || 20;
        for (const e of this.enemies) {
            if (!e.alive) continue;
            if (e.z > z + 1) continue; // 身后的敌人不瞄准
            const d = Math.abs(e.z - z);
            if (d < bestDist) {
                bestDist = d;
                best = e;
            }
        }
        return best;
    }

    get aliveCount() {
        let n = 0;
        for (const e of this.enemies) if (e.alive) n++;
        return n;
    }
}