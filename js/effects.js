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
        this.particleMesh=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:0xffffff}),CONFIG.PARTICLE_MAX);
        this.particleMesh.count=0;this.particleMesh.frustumCulled=false;
        this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.particleMesh.userData.artSource='V42 instanced pooled sparks';scene.add(this.particleMesh);
        this._particleColor=new THREE.Color();
        this._flashPool=[];
        this._ringPool=[];
        for (let i = 0; i < CONFIG.PARTICLE_MAX; i++) {
            const m = new THREE.Object3D();
            m.material={color:new THREE.Color(),opacity:1};
            m.visible = false;
            m.userData.artSource = 'js/effects.js 程序化粒子池(共享SphereGeometry)';
            this.pool.push(m);
        }

        // 浮动文字纹理缓存
        this._textCache = {};
        this._floatTextCount = 0;
        this.impacts = [];
        this._impactPool = Array.from({ length: 48 }, function() { return new THREE.Object3D(); });
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        var ink = canvas.getContext('2d');
        ink.translate(64, 64);
        ink.fillStyle = '#FFFFFF';
        ink.beginPath();
        for (var ray = 0; ray < 16; ray++) {
            var angle = ray * Math.PI / 8;
            var radius = ray % 2 ? 12 : (ray % 4 ? 43 : 62);
            ink.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ink.closePath();
        ink.fill();
        var impactTex = new THREE.CanvasTexture(canvas);
        this.impactMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: impactTex, transparent: true, depthWrite: false, alphaTest: .05 }), 48);
        this.impactMesh.count = 0;
        this.impactMesh.frustumCulled = false;
        this.impactMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.impactMesh.userData.artSource = 'pooled-impact-starbursts';
        scene.add(this.impactMesh);
    }

    impact(x, y, z, critical, lethal) {
        var p = this._impactPool.pop();
        if (!p) return;
        p.position.set(x, y, z + .15);
        p.userData = { life: .16, maxLife: .16, size: lethal ? .9 : critical ? .78 : .48,
            color: critical ? 0xFF9C47 : 0xFFF0AF, angle: Math.random() * Math.PI };
        this.impacts.push(p);
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
        const damageNumber=/^\d+$/.test(String(text));
        // 限制同时显示数量
        if (this._floatTextCount > 20) return;
        this._floatTextCount++;

        const key = text + '_' + color + (big ? '_b' : '');
        let tex = this._textCache[key];
        if (!tex) {
            var keys=Object.keys(this._textCache);
            if(keys.length>=128) {
                var free=keys.find(k=>!this.floatTexts.some(ft=>ft.sprite.material.map===this._textCache[k]));
                if(free){this._textCache[free].dispose();delete this._textCache[free];}
            }
            tex = createTextTexture(text, {
                fontSize: big ? 110 : 80,
                fill: color,
                stroke: '#1a1a2e',
                strokeWidth: big ? 10 : 7
            });
            this._textCache[key] = tex;
        }

        // V10.1: Sprite/Material 池化 — 原实现每条飘字 new Sprite+Material(高频战斗GC尖峰)
        var sprite = this._floatPool && this._floatPool.pop();
        if (!sprite) {
            sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
            if (!this._floatPool) this._floatPool = [];
        }
        sprite.material.map = tex;
        sprite.material.needsUpdate = true;
        // V3.2: 分散出生点, 避免连续暴击文字完全重叠
        sprite.position.set(
            x + randRange(-0.5, 0.5),
            (damageNumber ? y * .55 : y) + randRange(0, damageNumber ? .08 : .35),
            z + randRange(-0.4, 0.4)
        );
        const sc = big ? (damageNumber ? .70 : .9) : .55;
        sprite.scale.set(sc, sc * 0.5, 1);
        sprite.renderOrder = 999;
        this.scene.add(sprite);
        this.floatTexts.push({
            sprite: sprite, life: 0.7, maxLife: 0.7,
            vy: damageNumber ? (big ? 1.35 : 1.1) : (big ? 3.2 : 2.5), vx: randRange(-0.5, 0.5)
        });
    }

    /** 生成穿门冲击波(扩散圆环) */
    shockwave(x, y, z, color) {
        const ring = this._ringPool.pop() || new THREE.Mesh(
            new THREE.RingGeometry(0.3, 0.45, 24),
            new THREE.MeshBasicMaterial({
                color: color || 0x6EE7B7,
                transparent: true, opacity: 0.8,
                side: THREE.DoubleSide
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.visible=true;ring.scale.setScalar(1);ring.material.color.setHex(color || 0x6ee7b7);ring.material.opacity=.8;
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
        if(this.flashes.length>=24)return;
        var flash = this._flashPool.pop() || new THREE.Sprite(new THREE.SpriteMaterial({
            map: this._muzzleTex,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        }));
        flash.position.set(x, y, z);
        flash.visible=true;flash.material.opacity=.95;
        flash.scale.set(0.48, 0.48, 1); // V3.7: 枪口火焰更醒目
        this.scene.add(flash);
        this.flashes.push({ mesh: flash, life: 0.07, maxLife: 0.07 });
    }

    clear() {
        for (var impact of this.impacts) this._impactPool.push(impact);
        this.impacts.length = 0;
        this.impactMesh.count = 0;
        for(var p of this.particles){p.visible=false;this.pool.push(p);}this.particles.length=0;
        for(var f of this.flashes){this.scene.remove(f.mesh);f.mesh.visible=false;this._flashPool.push(f.mesh);}this.flashes.length=0;
        for(var r of this.shockwaves){this.scene.remove(r.mesh);r.mesh.visible=false;this._ringPool.push(r.mesh);}this.shockwaves.length=0;
        // V10.1: clear 回收入池
        for(var ft of this.floatTexts){this.scene.remove(ft.sprite);if(this._floatPool.length<24)this._floatPool.push(ft.sprite);else ft.sprite.material.dispose();}
        this.floatTexts.length=0;this._floatTextCount=0;
        this.particleMesh.count=0;
    }

    update(dt) {
        var camera = this.scene.userData.camera;
        for (var ii = this.impacts.length - 1; ii >= 0; ii--) {
            var impact = this.impacts[ii], data = impact.userData;
            data.life -= dt;
            if (data.life <= 0) {
                this._impactPool.push(impact);
                this.impacts.splice(ii, 1);
                continue;
            }
            var progress = 1 - data.life / data.maxLife;
            if (camera) impact.quaternion.copy(camera.quaternion);
            impact.rotateZ(data.angle);
            impact.scale.setScalar(data.size * (.6 + progress * 1.25));
            impact.updateMatrix();
            this.impactMesh.setMatrixAt(ii, impact.matrix);
            this._particleColor.setHex(data.color).multiplyScalar(1 - progress * .55);
            this.impactMesh.setColorAt(ii, this._particleColor);
        }
        // Repack after expiry; splice must not leave a stale instance in a hole.
        this.impactMesh.count = this.impacts.length;
        for (var packed = 0; packed < this.impacts.length; packed++) {
            var item = this.impacts[packed];
            this.impactMesh.setMatrixAt(packed, item.matrix);
            this._particleColor.setHex(item.userData.color).multiplyScalar(.45 + .55 * item.userData.life / item.userData.maxLife);
            this.impactMesh.setColorAt(packed, this._particleColor);
        }
        this.impactMesh.instanceMatrix.needsUpdate = true;
        if (this.impactMesh.instanceColor) this.impactMesh.instanceColor.needsUpdate = true;
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
                // V10.1: 回收入池(材质复用, 仅换贴图)
                this.scene.remove(ft.sprite);
                if (this._floatPool.length < 24) this._floatPool.push(ft.sprite);
                else ft.sprite.material.dispose();
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
                sw.mesh.visible=false;
                this._ringPool.push(sw.mesh);
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
                f.mesh.visible=false;
                this._flashPool.push(f.mesh);
                this.flashes.splice(i, 1);
                continue;
            }
            const t = f.life / f.maxLife;
            f.mesh.material.opacity = t * 0.95;
            var sc = 0.48 + (1 - t) * 0.55; // V3.7
            f.mesh.scale.set(sc, sc, 1);
        }
        this.particleMesh.count=this.particles.length;
        for(var pi=0;pi<this.particles.length;pi++) {
            var particle=this.particles[pi];particle.updateMatrix();
            this.particleMesh.setMatrixAt(pi,particle.matrix);
            this._particleColor.copy(particle.material.color).multiplyScalar(.4+.6*particle.material.opacity);
            this.particleMesh.setColorAt(pi,this._particleColor);
        }
        this.particleMesh.instanceMatrix.needsUpdate=true;
        if(this.particleMesh.instanceColor)this.particleMesh.instanceColor.needsUpdate=true;
    }
}
