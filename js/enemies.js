// ===== 僵尸/Boss 系统 =====

class Enemy {
    constructor(type, x, z, scene, hpOverride, styleOverride) {
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
        this.spitTimer = randRange(1.2, 2.4);
        this.throwTimer = randRange(1.4, 2.6); // V16.2: 投弹怪初始投掷倒计时
        this._liftY = 0;                       // V16.2: 跃栏/龙卷风浮空高度
        this._tornadoPulled = false;           // V16.2: 被龙卷风牵引标记(暂停近战攻击)
        this.phase = Math.random() * Math.PI * 2;
        this.isBoss = (type === 'boss');
        this.enraged = false;   // V3.2: Boss狂暴阶段标记
        this.speedMul = 1;      // 移速倍率
        this._returningToFront = false;
        this.attackMul = 1;     // 攻击间隔倍率
        this.dying = false;
        this.dieT = 0;
        this.deathHandled = false;
        this.removeReady = false;
        this.spawnT = this.isBoss ? 0 : 1; // V4.0: Boss弹性入场动画

        // V16.2: 路边伏击怪 flanker 从道路护栏外侧(x=±5.2)翻越跃入战场
        if (type === 'flanker') {
            this._vaultSide = (x >= 0) ? 1 : -1;
            this._vaultStartX = this._vaultSide * 5.2;
            this._vaultEndX = this._vaultSide * randRange(2.05, 2.85);
            this.x = this._vaultStartX;
            this._vaultT = 0;
            this._vaultDur = 0.72;
            this._vaulting = true;
            this._homeX = this._vaultEndX;
            this._spreadX = clamp((this._homeX / 3.2) * 1.35, -1.45, 1.45);
        }

        // V3.5 / V16.2: thrower 复用 bomber 罐装轮廓+橙琥珀染色, flanker 复用 fast 敏捷轮廓+青蓝染色
        var mappedStyle = (type === 'thrower') ? 'bomber' : (type === 'flanker' ? 'fast' : type);
        this.artStyle = styleOverride || (this.isBoss ? 'bruiser' : mappedStyle);
        this.model = new THREE.Group();
        this.model.userData.merged = true;
        this.model.userData.artSource = 'assets/models/'+(['normal','fast','shield','split','spitter','elite','bomber'].includes(this.artStyle)?'zombies':'bosses')+'/'+this.artStyle+'/'+this.artStyle+'.glb (instanced anchor)';
        this.model.position.set(this.x, 0, this.z);
        this.model.scale.setScalar(this.cfg.scale); // V2.2修复: 存活时应用类型scale
        this.visScale = this.cfg.scale; // 实际视觉scale(分裂僵尸会缩小)
        if(this.isBoss && this.artStyle==='elite') {this.visScale=2.25;this.model.scale.setScalar(this.visScale);}
        scene.add(this.model);
        this._baseRotY = this.model.rotation.y; // V3.7: 行走摇摆基准朝向(合并模型0 / Group模型PI)

        // 收集可闪烁材质(合并模型无独立材质 → 用缩放冲击代替闪烁)
        this.flashMats = [];
        this.model.traverse(function(obj) {
            if (obj.material && obj.material.emissive) {
                this.flashMats.push(obj.material);
            }
        }.bind(this));
    }

    takeDamage(dmg, effects, fromX, isCrit) {
        if (!this.alive) return false;
        var actualDamage = this.shieldT > 0 ? dmg * .3 : dmg;
        if(this.artStyle==='titan')actualDamage*=.85;
        this.hp -= actualDamage;
        this.hitFlash = 0.13;
        this._deathSide = clamp((this.x - (fromX === undefined ? this.x : fromX)) * 2, -1.4, 1.4);
        // 击退(非Boss)
        if (!this.isBoss) this.knockback = Math.min(this.knockback + (isCrit ? 2.35 : 1.5), isCrit ? 3.8 : 3.0);
        // 命中火花
        if (effects) {
            effects.burst(this.x, 0.65, this.z, isCrit ? 0xFF8844 : 0xFFE066, isCrit ? 6 : 3, 2.5, .25);
            if (effects.impact) effects.impact(this.x, .85, this.z, isCrit, this.hp <= 0);
            // 伤害数字 (V3.6: 降低概率避免大规模战斗时文字刷屏; V3.3: 暴击必显大字)
            if (isCrit) {
                effects.floatText(this.x, 1.0, this.z, String(Math.round(dmg * 100) / 100), '#FF8844', true);
            } else if (Math.random() < 0.12) {
                effects.floatText(this.x, 0.9, this.z, String(Math.round(dmg * 100) / 100), '#FFD700', false);
            }
        }
        if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('hit');
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
            // V16: 身体碎片(旋转四面体, 大体型更多; 池上限48自动限流)
            if (effects.spawnShards) effects.spawnShards(this.x, 0.55, this.z, this.cfg.color, this.isBoss ? 14 : 6, this.isBoss ? 4.6 : 3.4, 0.75);
            effects.burst(this.x, 0.5, this.z, 0xFFFFFF, 4, 2, 0.3);
            // 金色积分光点 + V15 卡通小爆炸闪光(Boss大爆炸)
            effects.burst(this.x, 0.7, this.z, 0xFFD700, 4, 2.5, 0.8);
            if (effects.boom) effects.boom(this.x, 0.65, this.z, this.isBoss ? 2.4 : 0.92);
            // V12视觉: 地面尸液痕迹(大体型更大; decal池内自动限流)
            if (effects.splat) effects.splat(this.x, this.z, this.visScale * (this.isBoss ? 1.6 : 0.9));
        }
    }

    update(dt, time, squad, manager, effects) {
        // === 死亡动画: 后仰+缩小 ===
        if (this.dying) {
            this.dieT += dt;
            var dur = this.isBoss ? 0.8 : 0.46;
            var t = Math.min(1, this.dieT / dur);
            // 后仰
            this.model.rotation.x = -t * 1.4;
            this.model.rotation.z += (this._deathSide || .35) * dt * 2.5;
            this.model.position.y = Math.sin(t * Math.PI) * (this.isBoss ? .25 : .65);
            this.model.position.z = this.z - t * (this.isBoss ? .25 : 1.35);
            this.model.position.x = this.x + (this._deathSide || .25) * t;
            // 缩小消失 (V2.2: 使用visScale避免分裂僵尸跳变)
            var s = this.visScale * (1 - t * t);
            this.model.scale.setScalar(Math.max(0.001, s));
            if (this.dieT >= dur) {
                this.removeReady = true;
            }
            return;
        }
        if (!this.alive) return;
        this.attackT=Math.max(0,(this.attackT||0)-dt*3);

        // V4.0: Boss入场弹性缩放(0.5s, 期间不移动不攻击)
        if (this.spawnT < 1) {
            this.spawnT = Math.min(1, this.spawnT + dt * 2);
            this.model.scale.setScalar(this.visScale * Math.max(0.05, easeOutBack(this.spawnT)));
            if (this.spawnT < 1) return;
        }
        // V16.2: 路边伏击怪 flanker 0.72s 翻越护栏抛物线入场 (空中无接触伤害)
        if (this._vaulting) {
            this._vaultT += dt / (this._vaultDur || 0.72);
            var vt = Math.min(1, this._vaultT);
            this.x = this._vaultStartX + (this._vaultEndX - this._vaultStartX) * vt;
            this._liftY = Math.sin(vt * Math.PI) * 1.45;
            this.z = BattleKinematics.enemyApproachZ(this.z, this.cfg.speed * 0.45, dt);
            this.model.position.set(this.x, this._liftY, this.z);
            this.model.rotation.z = -this._vaultSide * (1 - vt) * 0.45;
            this.model.rotation.x = 0.25 * Math.sin(vt * Math.PI);
            if (vt >= 1) {
                this._vaulting = false;
                this._liftY = 0;
                if (effects) effects.burst(this.x, 0.2, this.z, 0x22D3EE, 6, 2.2, 0.3);
            }
            return;
        }
        if(this.isBoss)V42BossController.update(this,dt,squad,manager,effects);

        // V3.3: 冰冻减速
        if (this.frozenT > 0) this.frozenT -= dt;
        const frozen = this.frozenT > 0;

        const dz = squad.z - this.z;
        const dist = Math.abs(dz);
        const attackDist = CONFIG.ZOMBIE_ATTACK_DIST * (this.isBoss ? 2.5 : 1);

        // V3.2: Boss狂暴阶段 — 血量50%触发, 移速/攻击提升 + 红色氛围
        if (this.isBoss && !this.enraged && this.hp <= this.maxHp * (this.artStyle==='overlord'?.33:.5)) {
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

        // V16.2: 酸液远程怪 spitter (8-9.5m射程, 3.8s间隔, 5m/s非追踪酸液弹, 最多6只同时齐射)
        if (this.type === 'spitter' && !frozen && !this._tornadoPulled && dist > attackDist && dist < 9.5) {
            this.spitTimer -= dt;
            if (this.spitTimer <= 0) {
                var spitScale = Math.max(1, ((manager && manager._spitterCount) || 1) / 6);
                this.spitTimer = randRange(3.4, 4.2) * spitScale;
                if (manager && manager.spits && manager.spits.length < 10) {
                    this.attackT = 1;
                    manager.spawnSpit(this.x, 0.6, this.z, squad);
                }
            }
        }

        // V16.2: 抛物线投弹怪 thrower (9-10.5m射程, 5.5s间隔, 1.3s地面红圈预警, 场上最多3枚炸弹)
        if (this.type === 'thrower' && !frozen && !this._tornadoPulled && dist > attackDist + 1.2 && dist < 10.5) {
            this.throwTimer -= dt;
            if (this.throwTimer <= 0) {
                this.throwTimer = randRange(5.0, 6.0);
                if (manager && manager.spawnBomb && (!manager.bombs || manager.bombs.length < 3)) {
                    this.attackT = 1;
                    manager.spawnBomb(this.x, 1.0, this.z, squad.x, squad.z);
                }
            }
        }

        // Rear ambushes must finish flanking into the forward firing line.
        // Stopping at melee distance behind a lone soldier left them untargetable
        // forever, which also held the next gate's encounter lock forever.
        if (dz < 0) this._returningToFront = true;
        if (this.z <= squad.z - attackDist) this._returningToFront = false;
        if (dist > attackDist || this._returningToFront) {
            // V5.1.1 / V15-GAMEPLAY-004: 保持宽阵型全路推进, 绝不早早缩成一条直线!
            // 仅在近距离(dist < 6.5m)才带各自扇形偏移(_spreadX)包抄小队前排
            if (this._homeX === undefined) {
                this._homeX = clamp(this.x, -3.2, 3.2);
                this._spreadX = clamp((this._homeX / 3.2) * 1.35, -1.45, 1.45);
            }
            const behind = this._returningToFront;
            const spd = this.cfg.speed * (this.speedMul || 1) * (frozen ? 0.3 : 1) * (behind ? 2.5 : 1);
            if (behind) this.z = Math.max(squad.z - attackDist, this.z - spd * dt);
            else this.z = BattleKinematics.enemyApproachZ(this.z, spd, dt);
            var desiredX = this._homeX + Math.sin(time * 1.4 + this.phase) * 0.18;
            if (dist < 6.5 || this.isBoss) {
                var blend = this.isBoss ? 1.0 : clamp((6.5 - dist) / 4.5, 0, 1);
                var closeX = clamp(squad.x + (this.isBoss ? 0 : this._spreadX), -3.2, 3.2);
                desiredX = desiredX * (1 - blend) + closeX * blend;
            }
            const dx = desiredX - this.x;
            this.x = clamp(this.x + clamp(dx, -1, 1) * spd * 0.45 * dt, -3.35, 3.35);
        } else if (Math.abs(this.x - squad.x) > (squad.getHalfWidth ? squad.getHalfWidth() : 1) + (this.isBoss ? 1.2 : .45)) {
            this.x += Math.sign(squad.x - this.x) * this.cfg.speed * dt;
        } else {
            // Melee requires horizontal contact too, not just a matching Z.
            // V16.2: 被龙卷风卷起的普通/特殊怪暂停近战攻击(Boss/精英除外)
            if (this._tornadoPulled && !this.isBoss && this.type !== 'elite') {
                this.attackTimer = Math.max(this.attackTimer, 0.25);
            } else {
                this.attackTimer -= dt;
                if (this.attackTimer <= 0) {
                    // V5.1.4: Boss攻击间隔×2(挥击1.6s, 磨损0.625/s) — Boss竞速与召唤磨损平衡
                    this.attackTimer = CONFIG.ZOMBIE_ATTACK_INTERVAL * (this.attackMul || 1) * (frozen ? 2 : 1) * (this.isBoss ? 2 : 1);
                    this.attackT=1;
                    const kill = this.isBoss ? (this.enraged ? 3 : 1) : CONFIG.ZOMBIE_ATTACK_KILL; // 非狂暴1/狂暴3
                    squad.killSoldiers(kill, effects);
                    if (effects) {
                        effects.burst(squad.x, 0.5, squad.z, 0xFF4444, 5, 2, 0.3);
                    }
                }
            }
        }

        // 击退衰减
        if (this.knockback > 0.01) {
            this.z -= this.knockback * dt * 3;
            this.knockback *= Math.pow(0.05, dt);
        }

        // 行走动画: 摇摆+弹跳+V3.7左右摇头蹒跚(尸吊感) + V16.2浮空高度(_liftY)
        const walkSpeed = this.isBoss ? 3 : 5;
        const sway = Math.sin(time * walkSpeed + this.phase) * 0.1;
        const bob = Math.abs(Math.sin(time * walkSpeed + this.phase)) * 0.06;
        this.model.position.set(this.x, bob + (this._liftY || 0), this.z);
        this.model.rotation.z = sway;
        this.model.rotation.y = this._baseRotY + Math.sin(time * walkSpeed * 0.5 + this.phase) * 0.12;
        // V16.1: 受击轻微后仰与弹性受击缩放反馈 + 自然体型微差
        if (this._scaleVar === undefined) this._scaleVar = this.isBoss ? 1.0 : randRange(0.91, 1.11);
        var hitRatio = clamp((this.hitFlash || 0) / 0.13, 0, 1);
        if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
        this.model.scale.setScalar(this.visScale * this._scaleVar * (1 + hitRatio * 0.12));
        // V3.2: 攻击时前扑啃咬动画 + 受击后仰
        if (dist <= attackDist) {
            this.model.rotation.x = -0.16 + Math.sin(time * 9 + this.phase) * 0.13 + hitRatio * 0.32;
        } else {
            this.model.rotation.x = Math.sin(time * walkSpeed + this.phase) * 0.05 + hitRatio * 0.34;
        }

        // 受击反馈 (V3.5: 合并模型用缩放冲击, Group模型用emissive闪烁)
        if (this.hitFlash > 0) {
            this.hitFlash -= dt;
            const k = Math.max(0, this.hitFlash / 0.13);
            if (this.model.userData.merged) {
                // Game Feel: 挤压拉伸(横向鼓胀 + 纵向压缩)强化受击打击感
                var sx = this.visScale * (1 + k * 0.22);
                var sy = this.visScale * (1 - k * 0.15);
                this.model.scale.set(sx, sy, sx);
            } else {
                const f = k * 0.35;
                for (let i = 0; i < this.flashMats.length; i++) {
                    this.flashMats[i].emissive.setRGB(f, f * 0.85, f * 0.6);
                }
            }
        } else if (this.spawnT >= 1 && this.model.userData.merged) {
            this.model.scale.setScalar(this.visScale);
        }
    }

    destroy(scene) {
        scene.remove(this.model);
        var merged = !!this.model.userData.merged; // V4.0: 合并僵尸几何为全类型共享缓存, 不可dispose
        this.model.traverse(function(obj) {
            if (obj.geometry && !merged) obj.geometry.dispose();
            if (obj.material && !merged) obj.material.dispose();
        });
    }
}

class EnemyManager {
    constructor(scene, effects) {
        this.scene = scene;
        this._levelIndex = 0;
        this.effects = effects;
        this.enemies = [];
        this.spits = [];
        this.pendingSpawns = [];
        this.boss = null;
        this.splitQueue = [];
        this.killCount = 0;
        this.bossStyle='bruiser';
        this.renderer=new EnemyArmyRenderer(scene);
        this._spitPool=Array.from({length:64},()=>({mesh:new THREE.Object3D(),life:0,vx:0,vz:0}));
        this._spitInstances=new THREE.InstancedMesh(new THREE.SphereGeometry(.14,8,6),new THREE.MeshBasicMaterial({color:0x7CFF48}),64);
        this._spitInstances.count=0;this._spitInstances.frustumCulled=false;
        this._spitInstances.userData.artSource='V42 pooled acid projectiles';scene.add(this._spitInstances);
        // V16.2: 抛物线投弹怪炸弹 + 1.3s 地面红色预警圈 (对象池, 场上最多3枚)
        this.bombs = [];
        this._bombPool = Array.from({length: 8}, () => ({ sx:0, sy:1, sz:0, tx:0, tz:0, t:0, dur:1.3 }));
        this._bombMat4 = new THREE.Matrix4();
        this._bombInstances = new THREE.InstancedMesh(
            new THREE.SphereGeometry(0.24, 10, 8),
            new THREE.MeshBasicMaterial({ color: 0xFF6B1A }),
            8
        );
        this._bombInstances.count = 0; this._bombInstances.frustumCulled = false;
        this._bombInstances.userData.artSource = 'V16.2 pooled parabolic bombs';
        scene.add(this._bombInstances);
        var ringGeo = new THREE.RingGeometry(0.85, 1.32, 24);
        ringGeo.rotateX(-Math.PI * 0.5);
        this._bombRingInstances = new THREE.InstancedMesh(
            ringGeo,
            new THREE.MeshBasicMaterial({ color: 0xFF2828, transparent: true, opacity: 0.78, side: THREE.DoubleSide, depthWrite: false }),
            8
        );
        this._bombRingInstances.count = 0; this._bombRingInstances.frustumCulled = false;
        this._bombRingInstances.renderOrder = 3;
        this._bombRingInstances.userData.artSource = 'V16.2 bomb ground telegraph rings';
        scene.add(this._bombRingInstances);
    }

    /** V4.0: loadFromLevel 只负责清场; 波次计划移交 GamePacingController 分批驱动 */
    loadFromLevel(level, levelIndex) {
        this.clear();
        this._levelIndex = levelIndex || 0;
    }

    /** V4.0: 统一出生入口(供节奏控制器/分裂/E2E注入调用) */
    spawnEnemy(type, x, z, hp, style) {
        const e = new Enemy(type, x, z, this.scene, hp || null, style || (type==='boss' ? this.bossStyle : null));
        // V6.0: 精英词缀
        if (type === 'elite' && typeof AffixSystem !== 'undefined') {
            AffixSystem.roll(e, this._levelIndex || 0);
            if (e.affixNames) e.model.userData.affixTag = e.affixNames;
        }
        // V12视觉: 精英身份光环(贴地金环, 随锚点移动; >10只精英时省略保护drawcall)
        if (type === 'elite' && this._eliteAuraCount === undefined) this._eliteAuraCount = 0;
        if (type === 'elite' && this._eliteAuraCount < 10 && typeof V42Art !== 'undefined' && V42Art.createEliteAura) {
            var aura = V42Art.createEliteAura();
            aura.position.y = 0.04;
            e.model.add(aura);
            e._eliteAura = aura;
            this._eliteAuraCount++;
        }
        this.enemies.push(e);
        if (type === 'boss') { this.boss = e; this.bossKills = this.bossKills || 0; }
        return e;
    }

    clear() {
        for (const e of this.enemies) e.destroy(this.scene);
        this.enemies = [];
        this._eliteAuraCount = 0; // V12视觉: 光环配额重置(共享几何/材质不dispose, 无泄漏)
        for (const s of this.spits) this._spitPool.push(s);
        this.spits = [];
        if (this.bombs) {
            for (const b of this.bombs) this._bombPool.push(b);
            this.bombs = [];
        }
        this.pendingSpawns = [];
        this.boss = null;
        this.bossKills = 0; // V10 QA修复: 原漏复位导致Boss击杀数跨关卡累计重复入账
        this.splitQueue = [];
        this.killCount = 0;
        this.renderer.clear();
        this._spitInstances.count=0;
        if (this._bombInstances) this._bombInstances.count = 0;
        if (this._bombRingInstances) this._bombRingInstances.count = 0;
    }

    spawnSpit(x, y, z, squad) {
        var s=this._spitPool.pop();if(!s)return;
        s.mesh.position.set(x,y,z);
        // V16.2: 5 m/s 非追踪直线酸液弹(玩家可左右走位清晰躲避)
        var dx=squad.x-x,dz=squad.z-z, inv=5.0/Math.max(.01,Math.hypot(dx,dz));
        s.vx=dx*inv;s.vz=dz*inv;s.life=2.8;this.spits.push(s);
    }

    /** V16.2: 投弹怪抛物线炸弹(锁定投掷瞬间玩家位置 + 1.3s地面红圈预警) */
    spawnBomb(x, y, z, targetX, targetZ) {
        if (!this.bombs || this.bombs.length >= 3) return;
        var b = this._bombPool.pop();
        if (!b) return;
        b.sx = x; b.sy = y; b.sz = z;
        b.tx = clamp(targetX, -3.1, 3.1);
        b.tz = targetZ;
        b.t = 0;
        b.dur = 1.3;
        this.bombs.push(b);
    }

    update(dt, time, squad) {
        // V4.0: 生成由 GamePacingController 驱动(分批+上限), 此处不再整波触发

        // 分裂僵尸死亡后产生小僵尸
        // V5.1.3: 小体受活敌门控 — 超上限时延迟分裂(否则×3体量下小体洪流无视控制器团灭小队)
        // V5.1.3: 分裂门控基准=目标活敌×1.5(随队伍规模缩放; 旧MAX_ALIVE×1.3基准过松导致小体洪流)
        var splitCap = Math.max(20, Math.round((squad.count || 1) * 0.9 + 4) * 1.5);
        var splitEmitted = 0;
        for (let i = this.splitQueue.length - 1; i >= 0; i--) {
            const sq = this.splitQueue[i];
            sq.delay -= dt;
            if (sq.delay <= 0) {
                if (splitEmitted >= 1 || this.aliveCount >= splitCap) { sq.delay = 0.15; continue; } // 每帧至多1只, 超限延后
                const e = new Enemy('normal', sq.x + randRange(-0.5, 0.5), sq.z, this.scene);
                e.model.scale.multiplyScalar(0.6);
                e.visScale = e.cfg.scale * 0.6;
                e.hp = 2;
                this.enemies.push(e);
                this.splitQueue.splice(i, 1);
                splitEmitted++;
            }
        }

        // V5.1.3: 统计场上吐痰怪数(供攻击间隔摊薄)
        this._spitterCount = 0;
        for (const e of this.enemies) if (e.alive && e.type === 'spitter') this._spitterCount++;

        // 更新僵尸
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (typeof AffixSystem !== 'undefined') AffixSystem.update(e, dt, squad, this, this.effects);
            e.update(dt, time, squad, this, this.effects);
            // 刚死亡: 触发分裂/Boss爆炸(仅一次)
            if (!e.alive && !e.deathHandled) {
                e.deathHandled = true;
                this.killCount++;
                // V5.0: 击杀音效(适配器内部限流70ms) / Boss死亡低音轰鸣
                if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play(e.isBoss ? 'bossDie' : 'kill');
                // 分裂僵尸: 死亡时排队分裂
                if (e.type === 'split') {
                    this.splitQueue.push({ x: e.x, z: e.z, delay: 0.2 });
                    this.splitQueue.push({ x: e.x, z: e.z, delay: 0.35 });
                }
                // V11.5: 爆炸僵尸 — 死亡自爆, 半径2.2内波及小队-2人 + 红色冲击
                if (e.type === 'bomber' && squad) {
                    if (Math.abs(e.z - squad.z) < 3.0 && squad.alive) { // V11.5: 半径3.0(击退漂移容忍)
                        squad.killSoldiers(2, this.effects);
                    }
                    if (this.effects) {
                        // V14: 分级爆炸组合(闪光+双冲击波+橙白火花+烟尘), 保留红色自爆身份
                        if (this.effects.explosion) this.effects.explosion(e.x, 0.6, e.z, 2);
                        this.effects.burst(e.x, 0.6, e.z, 0xFF5A4B, 14, 4.0, 0.55);
                        // V16: 自爆爆炸音效(原为静默)
                        if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('boom');
                    }
                }
                // V6.0: 分裂词缀
                if (e.affixes && typeof AffixSystem !== 'undefined') AffixSystem.onDeath(e, this);
                // V10 QA修复: 按 isBoss 标记计数(原判定 e===this.boss 在多Boss并存时, 先生成新Boss后旧Boss被击杀会漏记)
                if (e.isBoss) {
                    this.bossKills = (this.bossKills || 0) + 1;
                    this.boss = this.enemies.find(other=>other!==e && other.isBoss && other.alive) || null;
                    // V14: Boss死亡 — tier4 分级爆炸(白闪+双冲击波+橙白火花+烟尘)
                    if (this.effects.explosion) this.effects.explosion(e.x, 1.0, e.z, 4);
                    // 金色身份粒子 + 红色余烬(与既有配色一致)
                    this.effects.burst(e.x, 1, e.z, 0xFFD700, 20, 4, 0.8);
                    this.effects.burst(e.x, 1.2, e.z, 0xFFFFFF, 15, 3, 0.6);
                }
            }
            // 死亡动画完成: 移除
            if (e.removeReady) {
                if (e._eliteAura) this._eliteAuraCount--;
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
                this._spitPool.push(s);
                this.spits.splice(i, 1);
                continue;
            }
            if (s.life <= 0) {
                this.scene.remove(s.mesh);
                this._spitPool.push(s);
                this.spits.splice(i, 1);
            }
        }
        this._spitInstances.count=this.spits.length;
        for(var si=0;si<this.spits.length;si++) {
            this.spits[si].mesh.updateMatrix();
            this._spitInstances.setMatrixAt(si,this.spits[si].mesh.matrix);
        }
        this._spitInstances.instanceMatrix.needsUpdate=true;

        // V16.2: 更新投弹怪抛物线炸弹 + 地面红色预警圈
        if (this.bombs && this._bombInstances && this._bombRingInstances) {
            for (var bi = this.bombs.length - 1; bi >= 0; bi--) {
                var b = this.bombs[bi];
                b.t += dt;
                var p = Math.min(1, b.t / b.dur);
                if (p >= 1) {
                    // 落地引爆: 半径1.3m, 最多伤害3名士兵(走现有减员/护盾逻辑)
                    var hitDist = Math.hypot(squad.x - b.tx, squad.z - b.tz);
                    var hitRadius = 1.3 + (squad.getHalfWidth ? squad.getHalfWidth() * 0.45 : 0.45);
                    if (hitDist <= hitRadius && squad.alive) {
                        var dmgCount = hitDist <= 0.85 ? 3 : 2;
                        squad.killSoldiers(dmgCount, this.effects);
                    }
                    if (this.effects) {
                        if (this.effects.shockwave) this.effects.shockwave(b.tx, 0.08, b.tz, 0xFF4422);
                        this.effects.burst(b.tx, 0.55, b.tz, 0xFF7A24, 14, 4.2, 0.5);
                        this.effects.burst(b.tx, 0.35, b.tz, 0x3A3A3A, 6, 2.2, 0.6);
                    }
                    if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('boom');
                    this._bombPool.push(b);
                    this.bombs.splice(bi, 1);
                }
            }
            this._bombInstances.count = this.bombs.length;
            this._bombRingInstances.count = this.bombs.length;
            for (var bj = 0; bj < this.bombs.length; bj++) {
                var bb = this.bombs[bj];
                var bp = Math.min(1, bb.t / bb.dur);
                var bx = bb.sx + (bb.tx - bb.sx) * bp;
                var bz = bb.sz + (bb.tz - bb.sz) * bp;
                var by = bb.sy * (1 - bp) + Math.sin(bp * Math.PI) * 3.1;
                var bScale = 1.0 + Math.sin(bp * Math.PI * 10) * 0.14;
                this._bombMat4.makeScale(bScale, bScale, bScale);
                this._bombMat4.setPosition(bx, by, bz);
                this._bombInstances.setMatrixAt(bj, this._bombMat4);
                var rScale = 0.88 + 0.18 * Math.sin(bp * Math.PI * 8);
                this._bombMat4.makeScale(rScale, 1, rScale);
                this._bombMat4.setPosition(bb.tx, 0.07, bb.tz);
                this._bombRingInstances.setMatrixAt(bj, this._bombMat4);
            }
            this._bombInstances.instanceMatrix.needsUpdate = true;
            this._bombRingInstances.instanceMatrix.needsUpdate = true;
        }
        this.renderer.update(dt,time,this.enemies,squad.z);
    }

    finishDeaths(dt,time,squad) {
        for(var i=this.enemies.length-1;i>=0;i--) {
            var e=this.enemies[i];if(!e.dying)continue;
            e.update(dt,time,squad,this,this.effects);
            if(e.removeReady){
                if (e._eliteAura) this._eliteAuraCount--;
                e.destroy(this.scene);this.enemies.splice(i,1);
            }
        }
        this.renderer.update(dt,time,this.enemies,squad.z);
    }

    /** 获取最近的活僵尸(子弹追踪用) V3.1: 只瞄准前方(e.z更小)的敌人 */
    getNearest(x, z, maxDist, exclude) {
        let best = null;
        let bestDist = maxDist || 20;
        for (const e of this.enemies) {
            if (!e.alive) continue;
            if (exclude && exclude.indexOf(e) >= 0) continue; // V10.1: 散弹pellets扇形多目标排除已瞄准者
            if (e.z > z + 1) continue; // 身后的敌人不瞄准
            const d = Math.hypot(e.z - z, (e.x - x) * .85);
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

    get encounterOutstanding() {
        return this.aliveCount + this.splitQueue.length + this.enemies.filter(e=>e.type==='split' && !e.alive && !e.deathHandled).length*2;
    }
}
