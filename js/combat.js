// ===== 自动射击与弹道系统 =====

class CombatSystem {
    constructor(scene, effects) {
        this.scene = scene;
        this.effects = effects;
        this.bullets = [];
        this.fireTimer = 0;

        // 弹道对象池 (金黄色发光弹)
        this.pool = [];
        var geo = new THREE.SphereGeometry(0.07, 6, 4);
        for (var i = 0; i < CONFIG.BULLET_MAX_VISIBLE; i++) {
            var mat = new THREE.MeshBasicMaterial({
                color: 0xFFD700, transparent: true, opacity: 0.95
            });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            scene.add(mesh);
            this.pool.push(mesh);
        }
    }

    update(dt, squad, enemyManager) {
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
                    this._fire(positions[k], dmg);
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

            // 碰撞检测: 检查是否穿越僵尸Z面
            var hit = false;
            var enemies = enemyManager.enemies;
            for (var j = 0; j < enemies.length; j++) {
                var e = enemies[j];
                if (!e.alive) continue;
                // 子弹从前往后穿越僵尸位置
                if (oldZ >= e.z - 0.2 && newZ <= e.z + 0.4) {
                    if (Math.abs(b.mesh.position.x - e.x) < 0.7) {
                        var died = e.takeDamage(b.damage, this.effects, b.mesh.position.x);
                        // 暴击数字
                        if (died && b.damage >= 5) {
                            this.effects.floatText(e.x, 1.1, e.z, '暴击!', '#FF4444', true);
                        }
                        hit = true;
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

    _fire(pos, damage) {
        var mesh = this.pool.pop();
        if (!mesh) return; // 弹道预算已满
        mesh.visible = true;
        // 轻微随机散射
        var spreadX = randRange(-0.15, 0.15);
        mesh.position.set(pos.x + spreadX, pos.y + randRange(-0.05, 0.05), pos.z);
        mesh.material.color.setHex(0xFFD700);
        mesh.material.opacity = 0.95;
        // Z方向拉长形成弹道尾焰感
        mesh.scale.set(1, 1, 3);
        this.bullets.push({ mesh: mesh, damage: damage, life: 1.2 });

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