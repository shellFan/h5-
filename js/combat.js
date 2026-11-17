// ===== 自动射击与弹道系统 =====

class CombatSystem {
    constructor(scene, effects) {
        this.scene = scene;
        this.effects = effects;
        this.bullets = [];
        this.fireTimer = 0;

        // 弹道纹理: 加载 assets/art-v1/effects/bullet-glow.svg
        this._bulletTex = null;
        this._loadBulletTexture();

        // 共享Sprite材质(所有子弹共用，减少DrawCall)
        // V3.6修复: 改用Normal混合(Additive在浅色路面上会加成纯白,弹道完全不可见)
        this._bulletMat = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 1,
            depthWrite: false
        });
        this._bulletInstances=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),this._bulletMat,CONFIG.BULLET_MAX_VISIBLE);
        this._bulletInstances.count=0;this._bulletInstances.frustumCulled=false;
        this._bulletInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this._bulletInstances.userData.artSource='V42 instanced golden trails / pooled bullet anchors';
        scene.add(this._bulletInstances);
        this._bulletMat.userData = { artSource: 'assets/art-v1/effects/bullet-glow.svg (CanvasTexture)' };

        // 弹道对象池 (Sprite + bullet-glow纹理)
        this.pool = [];
        for (var i = 0; i < CONFIG.BULLET_MAX_VISIBLE; i++) {
            var sprite = new THREE.Object3D();
            sprite.visible = false;
            sprite.scale.set(0.3, 0.9, 1);
            this.pool.push(sprite);
        }
    }

    /** 加载bullet-glow.svg作为弹道纹理 */
    _loadBulletTexture() {
        var self = this;
        var img = new Image();
        img.onload = function() {
            try {
                var c = document.createElement('canvas');
                c.width = 64; c.height = 192;
                var ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0, 64, 192);
                self._bulletTex = new THREE.CanvasTexture(c);
                if (self._bulletMat) {
                    self._bulletMat.map = self._bulletTex;
                    self._bulletMat.needsUpdate = true;
                }
            } catch (e) {
                self._makeFallbackTex();
            }
        };
        img.onerror = function() {
            self._makeFallbackTex();
        };
        img.src = 'assets/art-v1/effects/bullet-glow.svg';
    }

    /** SVG加载失败时的程序化兜底纹理(模拟bullet-glow.svg风格) */
    _makeFallbackTex() {
        var c = document.createElement('canvas');
        c.width = 64; c.height = 192;
        var ctx = c.getContext('2d');
        // 径向光晕(弹头)
        var g = ctx.createRadialGradient(32, 36, 0, 32, 36, 30);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(0.2, '#FFF6A2');
        g.addColorStop(0.48, '#FFBC2B');
        g.addColorStop(1, 'rgba(255,122,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 72);
        // 尾焰(向下渐隐)
        var t = ctx.createLinearGradient(0, 23, 0, 192);
        t.addColorStop(0, '#FFFAD1');
        t.addColorStop(0.3, 'rgba(255,194,51,0.75)');
        t.addColorStop(1, 'rgba(255,139,17,0)');
        ctx.fillStyle = t;
        ctx.beginPath();
        ctx.moveTo(32, 23);
        ctx.quadraticCurveTo(43, 35, 41, 63);
        ctx.lineTo(32, 192);
        ctx.lineTo(23, 63);
        ctx.quadraticCurveTo(21, 35, 32, 23);
        ctx.closePath();
        ctx.fill();
        // 亮核
        ctx.fillStyle = '#FFF9CF';
        ctx.beginPath();
        ctx.ellipse(32, 35, 9, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        this._bulletTex = new THREE.CanvasTexture(c);
        if (this._bulletMat) {
            this._bulletMat.map = this._bulletTex;
            this._bulletMat.needsUpdate = true;
        }
    }

    update(dt, squad, enemyManager, energyCore) {
        this._squad = squad; // V3.3: 供_fire读取穿透层数
        // === 射击逻辑 ===
        if (squad.count > 0 && squad.alive) {
            this.fireTimer -= dt;
            if (this.fireTimer <= 0) {
                var count = squad.count;
                // 视觉弹道频率: 随人数增长但有上限(性能保护)
                var visualRate = Math.min(2 + Math.sqrt(count) * 1.8, 22); // V3.7: 弹幕更壮观(池120容量内)
                this.fireTimer = 1 / visualRate;

                // 每发子弹伤害 = 总DPS / 视觉弹道频率
                var totalDPS = count * squad.getDamage() * squad.getFireRate();
                var dmg = Math.max(1, Math.round(totalDPS / visualRate));

                // 齐射数量: 1~4发(人数越多越多)
                var volley = Math.min(5, 1 + Math.floor(Math.sqrt(count) / 2.6)); // V3.7: 齐射最多5发
                var positions = squad.getShootPositions(volley);
                if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('shoot'); // V5.0: 齐射音效(适配器内部限流)
                for (var k = 0; k < positions.length; k++) {
                    // V3.1: 每发子弹瞄准前方最近敌人(修复阵型散布导致5/7子弹打不中Boss的问题)
                    var target = enemyManager.getNearest(positions[k].x, positions[k].z, CONFIG.BULLET_RANGE);
                    // V3.3: 暴击判定(开火时掷骰, 伤害×2)
                    var dmgFinal = dmg;
                    // V6.0: 狂暴技能伤害乘区
                    if (squad._skillRage) dmgFinal = Math.round(dmgFinal * (1 + 0.35 * squad._skillRage));
                    // V6.0: 背水一战 — 人数低于一半时增伤
                    if (squad._skillBerserk && squad.count > 0 && squad._halfCount && squad.count <= squad._halfCount) {
                        dmgFinal = Math.round(dmgFinal * (1 + 0.5 * squad._skillBerserk));
                    }
                    var isCrit = Math.random() < squad.critChance;
                    if (isCrit) dmgFinal = dmg * 2;
                    this._fire(positions[k], dmgFinal, target, isCrit);
                }
            }
        }

        // === 弹道更新与碰撞 ===
        for (var i = this.bullets.length - 1; i >= 0; i--) {
            var b = this.bullets[i];
            var oldZ = b.mesh.position.z;
            var newZ = BattleKinematics.bulletZ(oldZ, CONFIG.BULLET_SPEED, dt); // V5.1: SHOOT_SIGN=-Z
            b.mesh.position.z = newZ;
            b.life -= dt;

            // V3.1: 弹道向目标x收敛(轻微追踪, 保证视觉上弹道汇聚到敌人身上)
            if (b.target && b.target.alive) {
                b.mesh.position.x = damp(b.mesh.position.x, b.target.x, 10, dt);
            }

            // 碰撞检测: 检查是否穿越僵尸Z面
            var hit = false;
            var enemies = enemyManager.enemies;
            for (var j = 0; j < enemies.length; j++) {
                var e = enemies[j];
                if (!e.alive) continue;
                // V3.3: 穿透弹不重复命中同一目标
                if (b.hitSet && b.hitSet.indexOf(e) >= 0) continue;
                // 子弹从前往后穿越僵尸位置
                if (oldZ >= e.z - 0.2 && newZ <= e.z + 0.4) {
                    // V3.1: 命中窗加宽(0.7→0.9), Boss等大体型敌人按体型放大判定
                    var winX = e.isBoss ? 1.4 : 0.9;
                    if (Math.abs(b.mesh.position.x - e.x) < winX) {
                        // V3.3: 冰冻弹 — 命中减速
                        if (squad.freezeStacks > 0 && !e.isBoss) {
                            e.frozenT = 0.9 + 0.45 * squad.freezeStacks;
                            if (!e._frozenFx) {
                                this.effects.burst(e.x, 0.5, e.z, 0x9AD8FF, 4, 1.8, 0.35);
                                e._frozenFx = true;
                            }
                        }
                        var died = e.takeDamage(b.damage, this.effects, b.mesh.position.x, b.crit);
                        // V5.1: 爆炸弹 — 命中溅射(半径1.7, 50%伤害, 最多4个邻近目标)
                        if (squad.explosive > 0) {
                            var splashR = 1.2 + 0.5 * squad.explosive;
                            var splashN = 0;
                            for (var si = 0; si < enemies.length && splashN < 4; si++) {
                                var se = enemies[si];
                                if (se === e || !se.alive) continue;
                                var sdx = se.x - e.x, sdz = se.z - e.z;
                                if (sdx * sdx + sdz * sdz < splashR * splashR) {
                                    se.takeDamage(Math.max(1, Math.round(b.damage * 0.5)), this.effects, se.x, false);
                                    splashN++;
                                }
                            }
                            this.effects.burst(e.x, 0.6, e.z, 0xFF8833, 6, 2.5, 0.3);
                        }
                        // V5.1: 连锁闪电 — 跳至最近(最多1+chain层)邻敌, 各受40%伤害
                        if (squad.chain > 0) {
                            var hops = squad.chain, last = e;
                            for (var hi = 0; hi < hops; hi++) {
                                var best = null, bestD = 9;
                                for (var ci = 0; ci < enemies.length; ci++) {
                                    var ce = enemies[ci];
                                    if (!ce.alive || ce === last || ce === e) continue;
                                    var cdx = ce.x - last.x, cdz = ce.z - last.z;
                                    var cd = Math.sqrt(cdx * cdx + cdz * cdz);
                                    if (cd < bestD) { bestD = cd; best = ce; }
                                }
                                if (!best) break;
                                best.takeDamage(Math.max(1, Math.round(b.damage * 0.4)), this.effects, best.x, false);
                                this.effects.burst(best.x, 1.0, best.z, 0x66D9FF, 4, 2, 0.25);
                                last = best;
                            }
                        }
                        // 暴击/击杀反馈
                        if (died) {
                            if (b.crit) {
                                this.effects.floatText(e.x, 1.2, e.z, '暴击!', '#FF4444', true);
                            }
                            // V3.3: 吸血 — 击杀按层数概率回复1人
                            if (squad.vampStacks > 0 && squad.count > 0 && squad.count < CONFIG.SQUAD_MAX_COUNT) {
                                var vampProb = 0.12 * squad.vampStacks;
                                if (Math.random() < vampProb) {
                                    squad.setCount(squad.count + 1);
                                    this.effects.floatText(squad.x, 1.4, squad.z, '+1', '#66D68F', false);
                                }
                            }
                        }
                        hit = true;
                        // V3.3: 穿透 — 命中后不消失, 继续飞行
                        if (b.pierceLeft > 0) {
                            b.pierceLeft--;
                            if (!b.hitSet) b.hitSet = [];
                            b.hitSet.push(e);
                            hit = false; // 继续存在
                        }
                        break;
                    }
                }
            }

            // V6.0: 能源核心命中(穿越核心z面且横向命中)
            if (!hit && energyCore && energyCore.alive &&
                oldZ >= energyCore.z - 0.4 && newZ <= energyCore.z + 0.4 &&
                Math.abs(b.mesh.position.x - energyCore.x) < 1.6) {
                energyCore.takeBulletHit(b.damage, this.effects);
                hit = true;
            }

            // 超射程或命中: 回收
            if (hit || b.life <= 0 || newZ < squad.z - CONFIG.BULLET_RANGE) {
                b.mesh.visible = false;
                this.pool.push(b.mesh);
                this.bullets.splice(i, 1);
            }
        }

        // V6.0: 毒液DoT结算(每帧)
        if (enemyManager && enemyManager.enemies) {
            for (var vi = enemyManager.enemies.length - 1; vi >= 0; vi--) {
                var ve = enemyManager.enemies[vi];
                if (!ve.alive || !ve._venomT) continue;
                ve._venomT -= dt;
                ve._venomTick = (ve._venomTick || 0) - dt;
                if (ve._venomTick <= 0) {
                    ve._venomTick = 0.5;
                    ve.takeDamage(Math.max(1, Math.round(ve._venomDps * 0.5)), this.effects, ve.x, false);
                    if (this.effects) this.effects.burst(ve.x, 1, ve.z, 0x66DD44, 2, 1.5, 0.25);
                }
                if (ve._venomT <= 0) { ve._venomT = 0; ve._venomStacks = 0; }
            }
        }
    }

    _syncInstances() {
        this._bulletInstances.count=this.bullets.length;
        var camera=this.scene.userData.camera;
        for(var i=0;i<this.bullets.length;i++) {
            var anchor=this.bullets[i].mesh;
            if(camera)anchor.quaternion.copy(camera.quaternion);
            anchor.updateMatrix();this._bulletInstances.setMatrixAt(i,anchor.matrix);
        }
        this._bulletInstances.instanceMatrix.needsUpdate=true;
    }

    _fire(pos, damage, target, isCrit) {
        var mesh = this.pool.pop();
        if (!mesh) return;
        mesh.visible = true;
        // GLB Muzzle is authoritative. Target convergence supplies trajectory
        // variation after launch; random origin offsets detached shots from guns.
        mesh.position.set(pos.x, pos.y, pos.z);
        // Sprite scale: 金黄发光弹道 (V3.6: 加大尺寸保证清晰可见; V3.3: 暴击弹更大)
        if (isCrit) mesh.scale.set(0.28, 1.45, 1);
        else mesh.scale.set(0.20, 1.25, 1);
        this.bullets.push({
            mesh: mesh, damage: damage, life: 1.2,
            target: target || null,
            crit: !!isCrit,
            pierceLeft: 1 + (this._squad ? this._squad.pierce : 0),
            hitSet: null
        });

        // 枪口闪光
        this.effects.muzzleFlash(pos.x, pos.y, pos.z);
        this._syncInstances();
    }

    clear() {
        for (var i = 0; i < this.bullets.length; i++) {
            this.bullets[i].mesh.visible = false;
            this.pool.push(this.bullets[i].mesh);
        }
        this.bullets = [];
        this.fireTimer = 0;
        this._bulletInstances.count=0;
    }
}
