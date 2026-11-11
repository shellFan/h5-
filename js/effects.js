// ===== 特效系统: 粒子/浮动数字/冲击波/枪口闪光 =====

class Effects {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.floatTexts = [];
        this.shockwaves = [];
        this.flashes = [];

        // 粒子池 (共享几何体, 独立材质)
        this.pool = [];
        const geo = new THREE.SphereGeometry(0.06, 6, 4);
        for (let i = 0; i < CONFIG.PARTICLE_MAX; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF, transparent: true, opacity: 1
            });
            const m = new THREE.Mesh(geo, mat);
            m.visible = false;
            scene.add(m);
            this.pool.push(m);
        }

        // 浮动文字纹理缓存
        this._textCache = {};
        this._floatTextCount = 0;
    }

    /** 生成粒子爆发 */
    burst(x, y, z, color, count, speed, life) {
        count = count || 8;
        speed = speed || 3;
        life = life || 0.5;
        for (let i = 0; i < count; i++) {
            const p = this.pool.pop();
            if (!p) break;
            p.visible = true;
            p.position.set(x, y, z);
            p.material.color.setHex(color);
            p.material.opacity = 1;
            const s = randRange(0.5, 1.3);
            p.scale.setScalar(s);
            p.userData = {
                vx: randRange(-1, 1) * speed,
                vy: randRange(0.8, 2.2) * speed,
                vz: randRange(-1, 1) * speed,
                life: life * randRange(0.7, 1.2),
                maxLife: life,
                s0: s
            };
            this.particles.push(p);
        }
    }

    /** 生成浮动文字(伤害/暴击) */
    floatText(x, y, z, text, color, big) {
        // 限制同时显示数量
        if (this._floatTextCount > 20) return;
        this._floatTextCount++;

        const key = text + '_' + color + (big ? '_b' : '');
        let tex = this._textCache[key];
        if (!tex) {
            tex = createTextTexture(text, {
                fontSize: big ? 110 : 80,
                fill: color,
                stroke: '#1a1a2e',
                strokeWidth: big ? 10 : 7
            });
            this._textCache[key] = tex;
        }

        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: tex, transparent: true, depthTest: false
        }));
        sprite.position.set(x + randRange(-0.2, 0.2), y, z);
        const sc = big ? 0.9 : 0.55;
        sprite.scale.set(sc, sc * 0.5, 1);
        sprite.renderOrder = 999;
        this.scene.add(sprite);
        this.floatTexts.push({
            sprite: sprite, life: 0.7, maxLife: 0.7,
            vy: big ? 3.2 : 2.5, vx: randRange(-0.5, 0.5)
        });
    }

    /** 生成穿门冲击波(扩散圆环) */
    shockwave(x, y, z, color) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.3, 0.45, 24),
            new THREE.MeshBasicMaterial({
                color: color || 0x6EE7B7,
                transparent: true, opacity: 0.8,
                side: THREE.DoubleSide
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, y, z);
        this.scene.add(ring);
        this.shockwaves.push({ mesh: ring, life: 0.5, maxLife: 0.5 });
    }

    /** 枪口闪光 (星形+加法混合发光) */
    muzzleFlash(x, y, z) {
        // 惰性创建星形闪光纹理
        if (!this._muzzleTex) {
            var c = document.createElement('canvas');
            c.width = 64; c.height = 64;
            var ctx = c.getContext('2d');
            // 四角星形
            var cx = 32, cy = 32;
            ctx.fillStyle = '#FFF8DC';
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.quadraticCurveTo(cx + 4, cy - 4, 64, cy);
            ctx.quadraticCurveTo(cx + 4, cy + 4, cx, 64);
            ctx.quadraticCurveTo(cx - 4, cy + 4, 0, cy);
            ctx.quadraticCurveTo(cx - 4, cy - 4, cx, 0);
            ctx.closePath();
            ctx.fill();
            // 中心亮核
            var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.4, '#FFE066');
            grad.addColorStop(1, 'rgba(255,160,40,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
            this._muzzleTex = new THREE.CanvasTexture(c);
        }
        var flash = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this._muzzleTex,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        }));
        flash.position.set(x, y, z);
        flash.scale.set(0.35, 0.35, 1);
        this.scene.add(flash);
        this.flashes.push({ mesh: flash, life: 0.07, maxLife: 0.07 });
    }

    update(dt) {
        // 粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const u = p.userData;
            u.life -= dt;
            if (u.life <= 0) {
                p.visible = false;
                this.pool.push(p);
                this.particles.splice(i, 1);
                continue;
            }
            u.vy -= 7 * dt;
            p.position.x += u.vx * dt;
            p.position.y += u.vy * dt;
            p.position.z += u.vz * dt;
            if (p.position.y < 0.03) {
                p.position.y = 0.03;
                u.vy *= -0.25;
                u.vx *= 0.7;
                u.vz *= 0.7;
            }
            const t = u.life / u.maxLife;
            p.material.opacity = t;
            p.scale.setScalar(u.s0 * (0.3 + t * 0.7));
        }

        // 浮动文字
        for (let i = this.floatTexts.length - 1; i >= 0; i--) {
            const ft = this.floatTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
                this.scene.remove(ft.sprite);
                ft.sprite.material.dispose();
                this.floatTexts.splice(i, 1);
                this._floatTextCount--;
                continue;
            }
            ft.sprite.position.y += ft.vy * dt;
            ft.sprite.position.x += ft.vx * dt;
            const t = ft.life / ft.maxLife;
            ft.sprite.material.opacity = Math.min(1, t * 2);
            if (t < 0.5) {
                const s = 0.55 * (0.5 + t);
                ft.sprite.scale.set(s, s * 0.5, 1);
            }
        }

        // 冲击波
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.life -= dt;
            if (sw.life <= 0) {
                this.scene.remove(sw.mesh);
                sw.mesh.geometry.dispose();
                sw.mesh.material.dispose();
                this.shockwaves.splice(i, 1);
                continue;
            }
            const t = 1 - sw.life / sw.maxLife;
            const scale = 1 + t * 5;
            sw.mesh.scale.setScalar(scale);
            sw.mesh.material.opacity = 0.8 * (1 - t);
        }

        // 枪口闪光
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            const f = this.flashes[i];
            f.life -= dt;
            if (f.life <= 0) {
                this.scene.remove(f.mesh);
                // Sprite共享内部几何体不可dispose; Mesh需dispose
                if (f.mesh.isMesh && f.mesh.geometry) f.mesh.geometry.dispose();
                if (f.mesh.material) f.mesh.material.dispose();
                this.flashes.splice(i, 1);
                continue;
            }
            const t = f.life / f.maxLife;
            f.mesh.material.opacity = t * 0.95;
            var sc = 0.35 + (1 - t) * 0.5;
            f.mesh.scale.set(sc, sc, 1);
        }
    }
}