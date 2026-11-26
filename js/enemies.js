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
        this.spitTimer = randRange(1, 2);
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

        // V3.5: 大众僵尸使用合并批处理模型(2 mesh/只), Boss/精英保留Group模型(细节动画+独立材质)
        this.artStyle = styleOverride || (this.isBoss ? 'bruiser' : type); // V12.1: bomber owns a distinct round hazard-canister silhouette
        this.model = new THREE.Group();
        this.model.userData.merged = true;
        this.model.userData.artSource = 'assets/models/'+(['normal','fast','shield','split','spitter','elite','bomber'].includes(this.artStyle)?'zombies':'bosses')+'/'+this.artStyle+'/'+this.artStyle+'.glb (instanced anchor)';
        this.model.position.set(x, 0, z);
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

        // 吐痰僵尸: 远程攻击
        // V5.1.3: 攻击间隔随场上吐痰怪数量摊薄(×3体量下24只齐射=12击杀/秒, 任何队伍都融化)
        if (this.type === 'spitter' && dist > attackDist && dist < 10) {
            this.spitTimer -= dt;
            if (this.spitTimer <= 0) {
                this.spitTimer = randRange(1.8, 2.5) * (1 + 0.3 * ((manager && manager._spitterCount) || 1));
                manager.spawnSpit(this.x, 0.5, this.z, squad);
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

        // 击退衰减
        if (this.knockback > 0.01) {
            this.z -= this.knockback * dt * 3;
            this.knockback *= Math.pow(0.05, dt);
        }

        // 行走动画: 摇摆+弹跳+V3.7左右摇头蹒跚(尸吊感)
        const walkSpeed = this.isBoss ? 3 : 5;
        const sway = Math.sin(time * walkSpeed + this.phase) * 0.1;
        const bob = Math.abs(Math.sin(time * walkSpeed + this.phase)) * 0.06;
        this.model.position.set(this.x, bob, this.z);
        this.model.rotation.z = sway;
        this.model.rotation.y = this._baseRotY + Math.sin(time * walkSpeed * 0.5 + this.phase) * 0.12;
        // V3.2: 攻击时前扑啃咬动画(近战范围内身体前倾伸缩)
        if (dist <= attackDist) {
            this.model.rotation.x = -0.16 + Math.sin(time * 9 + this.phase) * 0.13;
        } else {
            this.model.rotation.x = Math.sin(time * walkSpeed + this.phase) * 0.05;
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
        this._spitInstances=new THREE.InstancedMesh(new THREE.SphereGeometry(.11,8,6),new THREE.MeshBasicMaterial({color:0x9dff67}),64);
        this._spitInstances.count=0;this._spitInstances.frustumCulled=false;
        this._spitInstances.userData.artSource='V42 pooled acid projectiles';scene.add(this._spitInstances);
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
        this.pendingSpawns = [];
        this.boss = null;
        this.bossKills = 0; // V10 QA修复: 原漏复位导致Boss击杀数跨关卡累计重复入账
        this.splitQueue = [];
        this.killCount = 0;
        this.renderer.clear();this._spitInstances.count=0;
    }

    spawnSpit(x, y, z, squad) {
        var s=this._spitPool.pop();if(!s)return;
        s.mesh.position.set(x,y,z);
        var dx=squad.x-x,dz=squad.z-z, inv=8/Math.max(.01,Math.hypot(dx,dz));
        s.vx=dx*inv;s.vz=dz*inv;s.life=2.5;this.spits.push(s);
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
