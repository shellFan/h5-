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
        this._bulletMat = new THREE.SpriteMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 1,
            depthWrite: false
        });

        // 弹道对象池 (Sprite + bullet-glow纹理)
        this.pool = [];
        for (var i = 0; i < CONFIG.BULLET_MAX_VISIBLE; i++) {
            var sprite = new THREE.Sprite(this._bulletMat);
            sprite.visible = false;
            sprite.scale.set(0.3, 0.9, 1);
            scene.add(sprite);
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

    update(dt, squad, enemyManager) {
        this._squad = squad; // V3.3: 供_fire读取穿透层数
        // === 射击逻辑 ===
        if (squad.count > 0 && squad.alive) {
            this.fireTimer -= dt;
            if (this.fireTimer <= 0) {
                var count = squad.count;
                // 视觉弹道频率: 随人数增长但有上限(性能保护)
                var visualRate = Math.min(2 + Math.sqrt(count) * 1.6, 16);
                this.fireTimer = 1 / visualRate;

                // 每发子弹伤害 = 总DPS / 视觉弹道频率
                var totalDPS = count * squad.getDamage() * squad.getFireRate();
                var dmg = Math.max(1, Math.round(totalDPS / visualRate));

                // 齐射数量: 1~4发(人数越多越多)
                var volley = Math.min(4, 1 + Math.floor(Math.sqrt(count) / 3));
                var positions = squad.getShootPositions(volley);
                for (var k = 0; k < positions.length; k++) {
                    // V3.1: 每发子弹瞄准前方最近敌人(修复阵型散布导致5/7子弹打不中Boss的问题)
                    var target = enemyManager.getNearest(positions[k].x, positions[k].z, CONFIG.BULLET_RANGE);
                    // V3.3: 暴击判定(开火时掷骰, 伤害×2)
                    var dmgFinal = dmg;
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
            var newZ = oldZ - CONFIG.BULLET_SPEED * dt;
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

            // 超射程或命中: 回收
            if (hit || b.life <= 0 || newZ < squad.z - CONFIG.BULLET_RANGE) {
                b.mesh.visible = false;
                this.pool.push(b.mesh);
                this.bullets.splice(i, 1);
            }
        }
    }

    _fire(pos, damage, target, isCrit) {
        var mesh = this.pool.pop();
        if (!mesh) return;
        mesh.visible = true;
        var spreadX = randRange(-0.15, 0.15);
        mesh.position.set(pos.x + spreadX, pos.y + randRange(-0.05, 0.05), pos.z);
        // Sprite scale: 金黄发光弹道 (V3.6: 加大尺寸保证清晰可见; V3.3: 暴击弹更大)
        if (isCrit) mesh.scale.set(0.4, 1.15, 1);
        else mesh.scale.set(0.3, 0.9, 1);
        this.bullets.push({
            mesh: mesh, damage: damage, life: 1.2,
            target: target || null,
            crit: !!isCrit,
            pierceLeft: this._squad ? this._squad.pierce : 0,
            hitSet: null
        });

        // 枪口闪光
        this.effects.muzzleFlash(pos.x + spreadX, pos.y, pos.z - 0.05);
    }

    clear() {
        for (var i = 0; i < this.bullets.length; i++) {
            this.bullets[i].mesh.visible = false;
            this.pool.push(this.bullets[i].mesh);
        }
        this.bullets = [];
        this.fireTimer = 0;
    }
}