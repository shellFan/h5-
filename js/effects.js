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

        // V12视觉: 尸液/碎屑地面痕迹(pooled decals, 16上限) — 击杀反馈落地
        this._splatPool = Array.from({ length: 16 }, function() { return new THREE.Object3D(); });
        var splatCanvas = document.createElement('canvas');
        splatCanvas.width = splatCanvas.height = 128;
        var sc2 = splatCanvas.getContext('2d');
        sc2.translate(64, 64);
        var gooGrad = sc2.createRadialGradient(0, 0, 4, 0, 0, 56);
        gooGrad.addColorStop(0, 'rgba(46,74,40,0.92)');
        gooGrad.addColorStop(0.55, 'rgba(52,84,44,0.75)');
        gooGrad.addColorStop(0.85, 'rgba(60,96,48,0.28)');
        gooGrad.addColorStop(1, 'rgba(60,96,48,0)');
        sc2.fillStyle = gooGrad;
        sc2.beginPath();
        for (var sa = 0; sa < 26; sa++) {
            var ang = sa / 26 * Math.PI * 2;
            var wob = 40 + Math.sin(sa * 2.7) * 10 + Math.cos(sa * 5.1) * 6;
            sc2.lineTo(Math.cos(ang) * wob, Math.sin(ang) * wob);
        }
        sc2.closePath();
        sc2.fill();
        // 三滴飞溅卫星点
        for (var drop = 0; drop < 3; drop++) {
            var da = drop * 2.2 + 0.6;
            var dr = 46 + drop * 6;
            sc2.fillStyle = 'rgba(52,84,44,0.5)';
            sc2.beginPath();
            sc2.arc(Math.cos(da) * dr, Math.sin(da) * dr, 5 - drop, 0, Math.PI * 2);
            sc2.fill();
        }
        var splatTex = new THREE.CanvasTexture(splatCanvas);
        this.splatMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: splatTex, transparent: true, depthWrite: false }), 16);
        this.splatMesh.count = 0;
        this.splatMesh.frustumCulled = false;
        this.splatMesh.renderOrder = 1;
        this.splatMesh.userData.artSource = 'js/effects.js 程序化尸液decal(128px CanvasTexture)';
        scene.add(this.splatMesh);
        this.splats = [];
        this._splatQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

        // V16: 碎片粒子(四面体, 旋转+重力) — 死亡/爆炸的形状层次, 与球形火花区分
        this.shards = [];
        this._shardPool = Array.from({ length: 48 }, () => new THREE.Object3D());
        this._shardGeo = new THREE.TetrahedronGeometry(0.085, 0);
        this.shardMesh = new THREE.InstancedMesh(this._shardGeo,
            new THREE.MeshBasicMaterial({ color: 0xffffff }), 48);
        this.shardMesh.count = 0; this.shardMesh.frustumCulled = false;
        this.shardMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.shardMesh.userData.artSource = 'V16 pooled tetra shards (spinning body fragments)';
        scene.add(this.shardMesh);
        this._shardQuat = new THREE.Quaternion();
        this._shardEuler = new THREE.Euler();

        // V12视觉: 爆炸白闪(径向亮核, 8上限) — 自爆/Boss死亡/爆炸弹的瞬间亮度冲击
        this._boomPool = [];
        this.booms = [];
        if (!this._boomTex) {
            var bc = document.createElement('canvas');
            bc.width = bc.height = 128;
            var bctx = bc.getContext('2d');
            var bg = bctx.createRadialGradient(64, 64, 4, 64, 64, 62);
            bg.addColorStop(0, 'rgba(255,255,255,1)');
            bg.addColorStop(0.28, 'rgba(255,236,160,0.92)');
            bg.addColorStop(0.62, 'rgba(255,176,64,0.42)');
            bg.addColorStop(1, 'rgba(255,120,20,0)');
            bctx.fillStyle = bg;
            bctx.fillRect(0, 0, 128, 128);
            this._boomTex = new THREE.CanvasTexture(bc);
        }
        // Runtime PNGs are optional overlays on the existing procedural fallbacks.
        // One static loader/cache is shared across Effects instances; failed loads
        // leave the canvas textures and trigger logic untouched.
        var self = this;
        var texturePaths = {
            muzzle: 'assets/game/effects/muzzle.png', hit: 'assets/game/effects/hit.png',
            explosion: 'assets/game/effects/explosion.png', boss_explosion: 'assets/game/effects/boss_explosion.png',
            coins: 'assets/game/effects/coins.png', upgrade: 'assets/game/effects/upgrade.png',
            boss_entry: 'assets/game/effects/boss_entry.png', trail: 'assets/game/effects/trail.png'
        };
        Effects._combatTextures = Effects._combatTextures || {};
        Effects._textureLoader = Effects._textureLoader || new THREE.TextureLoader();
        this._combatTextures = Effects._combatTextures;
        Object.keys(texturePaths).forEach(function(key) {
            var cached = Effects._combatTextures[key];
            if (cached) {
                if (cached.ready) self._applyCombatTexture(key, cached.texture);
                else cached.waiters.push(function(tex) { self._applyCombatTexture(key, tex); });
                return;
            }
            var entry = Effects._combatTextures[key] = {ready:false, failed:false, texture:null, waiters:[]};
            entry.waiters.push(function(tex) { self._applyCombatTexture(key, tex); });
            entry.texture = Effects._textureLoader.load(texturePaths[key], function(tex) {
                tex.encoding = THREE.sRGBEncoding;
                entry.ready = true;
                for (var i = 0; i < entry.waiters.length; i++) entry.waiters[i](tex);
                entry.waiters.length = 0;
            }, undefined, function() {
                entry.failed = true;
                entry.waiters.length = 0;
            });
        });
    }

    _applyCombatTexture(key, texture) {
        if (key === 'hit' && this.impactMesh) {
            this.impactMesh.material.map = texture;
            this.impactMesh.material.needsUpdate = true;
        }
        if (key === 'muzzle') this._muzzleArtTex = texture;
    }

    _readyCombatTexture(key) {
        var entry = this._combatTextures && this._combatTextures[key];
        return entry && entry.ready ? entry.texture : null;
    }

    /** V12视觉: 地面尸液痕迹 (dieT期间淡出, 大体型更大) */
    splat(x, z, size) {
        var p = this._splatPool.pop();
        if (!p) return;
        p.position.set(x, 0.02 + Math.random() * 0.01, z);
        p.userData = { life: 2.2, maxLife: 2.2, size: (size || 1) * randRange(0.75, 1.05), roll: Math.random() * Math.PI * 2 };
        this.splats.push(p);
    }

    /** V12视觉: 爆炸白闪 (0.14s 亮核弹出) */
    flash(x, y, z, color, size, textureKey) {
        if (this.booms.length >= 8) return;
        var s = this._boomPool.pop() || new THREE.Sprite(new THREE.SpriteMaterial({ map: this._boomTex, transparent: true, depthWrite: false }));
        var artTexture = textureKey && this._readyCombatTexture(textureKey);
        s.material.map = artTexture || this._boomTex;
        s.material.needsUpdate = true;
        s.position.set(x, y, z);
        s.visible = true;
        s.material.opacity = 1;
        if (color) s.material.color.setHex(color); else s.material.color.setHex(0xFFFFFF);
        s.scale.setScalar((size || 1.6) * 0.55);
        this.scene.add(s);
        this.booms.push({ mesh: s, life: 0.14, maxLife: 0.14, size: size || 1.6 });
    }

    reinforcement(squad, source, added) {
        if (added <= 0) return;
        if (!(this._recruitNoticeT > 0)) this._recruitTotals = {};
        this._recruitTotals[source] = (this._recruitTotals[source] || 0) + added;
        this._recruitNoticeT = 2.8;
        var el = document.getElementById('reinforcement-notice');
        if (el) {
            el.textContent = Object.keys(this._recruitTotals).map(key => key + ' +' + this._recruitTotals[key] + '人').join(' · ');
            el.hidden = false;
        }
        // Kill-based healing can fire dozens of times a second: aggregate the
        // notice, and bound the expensive world effects to one pulse per 0.4s.
        if (!(this._recruitFxT > 0)) {
            this._recruitFxT = 0.4;
            // V16: 补员成长音效('grow' 音色既有但从未被调用)
            if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('grow');
            this.floatText(squad.x, 2.2, squad.z, source + ' +' + added + '人', '#75FFB5', true);
            this.shockwave(squad.x, 0.06, squad.z, 0x39D98A);
            this.burst(squad.x, 0.6, squad.z, 0x75FFB5, 10, 2.2, 0.6);
        }
    }

    impact(x, y, z, critical, lethal) {
        var p = this._impactPool.pop();
        if (!p) return;
        p.position.set(x, y, z + .16);
        p.userData = { life: .18, maxLife: .18, size: lethal ? 1.15 : critical ? .92 : .58,
            color: lethal ? 0xFFE066 : (critical ? 0xFF8C38 : 0x7DD3FC), angle: Math.random() * Math.PI };
        this.impacts.push(p);
        if (lethal) {
            this.explosionFlash(x, y + 0.1, z + 0.1, 1.35, 0xFFD166);
        }
    }

    /** V14: 分级爆炸组合器 — 闪光+冲击波+火花+烟尘按档位组合(tier 1小/2普/3大/4Boss)
     *  全部复用既有池(flash/shockwave/burst), 不新增材质/几何; 供自爆/Boss死亡/全屏爆炸接入 */
    explosion(x, y, z, tier) {
        var cfg = [
            { flash: 1.0, ring: 0, sparks: 10, speed: 3.0, smoke: 0 },
            { flash: 1.7, ring: 1, sparks: 16, speed: 4.2, smoke: 4 },
            { flash: 2.4, ring: 1, sparks: 24, speed: 5.5, smoke: 7 },
            { flash: 3.4, ring: 2, sparks: 34, speed: 7.0, smoke: 12 }
        ][Math.max(0, Math.min(3, (tier | 0) - 1))];
        if (!cfg) return;
        this.flash(x, y, z, 0xFFC26B, cfg.flash, tier >= 4 ? 'boss_explosion' : 'explosion');
        for (var r = 0; r < cfg.ring; r++) this.shockwave(x, Math.max(0.06, y - r * 0.12), z, r ? 0xFFB055 : 0xFFE1A0);
        // 火花: 橙芯+白热双层
        this.burst(x, y, z, 0xFFA03C, Math.ceil(cfg.sparks * 0.7), cfg.speed, 0.5);
        this.burst(x, y, z, 0xFFF3C0, Math.ceil(cfg.sparks * 0.3), cfg.speed * 0.7, 0.35);
        // 烟尘: 深灰慢速上飘(vy低+重力自然衰减), 落点略有散布
        for (var s = 0; s < cfg.smoke; s++) {
            var p = this.pool.pop();
            if (!p) break;
            p.visible = true;
            p.position.set(x + randRange(-0.4, 0.4), y + randRange(0, 0.5), z + randRange(-0.4, 0.4));
            p.material.color.setHex(0x3A3F46);
            p.material.opacity = 0.75;
            var ss = randRange(1.6, 2.6);
            p.scale.setScalar(ss);
            p.userData = {
                vx: randRange(-1, 1) * 0.9, vy: randRange(0.9, 1.8), vz: randRange(-1, 1) * 0.9,
                life: randRange(0.55, 0.85), maxLife: 0.8, s0: ss, smoke: true
            };
            this.particles.push(p);
        }
    }

    /** V16: 旋转碎片(死亡肢体残片/爆炸碎片) — 与球形火花形成形状层次 */
    spawnShards(x, y, z, color, count, speed, life) {
        count = count || 6;
        speed = speed || 3.4;
        life = life || 0.7;
        for (let i = 0; i < count; i++) {
            const p = this._shardPool.pop();
            if (!p) break;
            p.visible = true;
            p.position.set(x + randRange(-0.15, 0.15), y, z + randRange(-0.15, 0.15));
            p.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0);
            const s = randRange(0.7, 1.5);
            p.scale.setScalar(s);
            p.userData = {
                vx: randRange(-1, 1) * speed, vy: randRange(0.9, 2.4) * speed, vz: randRange(-1, 1) * speed,
                rx: randRange(-9, 9), rz: randRange(-9, 9),
                life: life * randRange(0.7, 1.15), maxLife: life, s0: s, color: color
            };
            this.shards.push(p);
        }
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
            tex = createTextTexture(text, damageNumber ? {
                // V12/V16.3 视觉: 纯数字伤害 — 高清白芯+彩色圆角描边
                fontSize: big ? 128 : 96,
                height: 160,
                fill: '#FFFFFF',
                stroke: color,
                strokeWidth: big ? 16 : 12
            } : {
                // V16.3: 技能/状态飘字高清渲染(200px高+厚描边, 杜绝模糊锯齿)
                fontSize: big ? 120 : 88,
                height: 200,
                fill: color,
                stroke: '#0E1726',
                strokeWidth: big ? 16 : 12
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
        // V16.3: 按纹理真实宽高比缩放, 彻底消除中文技能名横向压扁变形
        var texAsp = (tex && tex.image && tex.image.height) ? (tex.image.width / tex.image.height) : 2;
        var hSc = big ? (damageNumber ? 0.42 : 0.62) : 0.34;
        sprite.scale.set(hSc * texAsp, hSc, 1);
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

    /** V15-ART-005 商业级枪口火焰 (8角炽白金橙星芒爆发) */
    muzzleFlash(x, y, z, sizeMul) {
        if (!this._muzzleTex) {
            var c = document.createElement('canvas');
            c.width = 128; c.height = 128;
            var ctx = c.getContext('2d');
            var cx = 64, cy = 64;
            // 外层暖橙火焰光晕
            var glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 60);
            glow.addColorStop(0.0, 'rgba(255,255,230,1)');
            glow.addColorStop(0.32, 'rgba(255,205,65,0.92)');
            glow.addColorStop(0.68, 'rgba(255,120,20,0.45)');
            glow.addColorStop(1.0, 'rgba(255,80,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, 128, 128);
            // 8 尖角火焰星芒
            ctx.fillStyle = '#FFF6C8';
            ctx.beginPath();
            for (var r = 0; r < 16; r++) {
                var a = r * Math.PI / 8;
                var rad = (r % 2 === 0) ? (r % 4 === 0 ? 60 : 42) : 14;
                var px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
                if (r === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            // 中心炽白亮核
            var core = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
            core.addColorStop(0, '#FFFFFF');
            core.addColorStop(0.6, '#FFF3B0');
            core.addColorStop(1, 'rgba(255,200,60,0)');
            ctx.fillStyle = core;
            ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
            this._muzzleTex = new THREE.CanvasTexture(c);
        }
        if (this.flashes.length >= 36) return;
        var flash = this._flashPool.pop() || new THREE.Sprite(new THREE.SpriteMaterial({
            map: this._muzzleTex,
            transparent: true,
            opacity: 0.98,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));
        flash.material.map = this._muzzleTex;
        flash.material.needsUpdate = true;
        flash.position.set(x, y, z);
        flash.visible = true; flash.material.opacity = 0.98;
        flash.material.rotation = Math.random() * Math.PI;
        var mfScale = randRange(0.56, 0.74) * (sizeMul || 1);
        flash.scale.set(mfScale, mfScale, 1);
        flash.userData.baseScale = mfScale;
        this.scene.add(flash);
        this.flashes.push({ mesh: flash, life: 0.11, maxLife: 0.11 });
    }

    clear() {
        this._recruitTotals = {};
        this._recruitNoticeT = 0;
        this._recruitFxT = 0;
        var notice = document.getElementById('reinforcement-notice');
        if (notice) { notice.hidden = true; notice.textContent = ''; }
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
        // V12视觉: decals/爆闪回收
        for(var sp of this.splats) this._splatPool.push(sp);
        this.splats.length = 0;
        this.splatMesh.count = 0;
        // V16: 碎片回收
        for(var sh of this.shards) this._shardPool.push(sh);
        this.shards.length = 0;
        this.shardMesh.count = 0;
        for(var bm of this.booms){this.scene.remove(bm.mesh);bm.mesh.visible=false;this._boomPool.push(bm.mesh);}
        this.booms.length = 0;
    }

    update(dt) {
        this._recruitFxT = Math.max(0, (this._recruitFxT || 0) - dt);
        if (this._recruitNoticeT > 0) {
            this._recruitNoticeT = Math.max(0, this._recruitNoticeT - dt);
            if (!this._recruitNoticeT) {
                var notice = document.getElementById('reinforcement-notice');
                if (notice) notice.hidden = true;
                this._recruitTotals = {};
            }
        }
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
            // V14: 烟尘粒子 buoyancy(缓升缓散), 与火花(重力弹跳)区分
            u.vy -= (u.smoke ? -0.5 : 7) * dt;
            if (u.smoke) u.vx *= (1 - 0.8 * dt);
            p.position.x += u.vx * dt;
            p.position.y += u.vy * dt;
            p.position.z += u.vz * dt;
            if (p.position.y < 0.03 && !u.smoke) {
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
            const scale = 1 + easeOutCubic(t) * 5; // V14.3 节奏: 快出慢收(easeOut), 冲击感前置
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
            // V14.3 节奏修正: 枪口火焰=瞬时峰值→衰减(旧曲线出生最小→长大, 与闪光语义相反)
            var sc = (f.baseScale || 0.48) * (1.18 - t * 0.42);
            f.mesh.scale.set(sc, sc, 1);
        }

        // V12视觉: 尸液decal(淡出+首帧展开; 复用scratch矩阵/向量, 热循环零分配)
        if (!this._m4) { this._m4 = new THREE.Matrix4(); this._v3 = new THREE.Vector3(); }
        var liveSplats = 0;
        for (var si2 = this.splats.length - 1; si2 >= 0; si2--) {
            var sp = this.splats[si2];
            sp.userData.life -= dt;
            if (sp.userData.life <= 0) {
                this._splatPool.push(sp);
                this.splats.splice(si2, 1);
            }
        }
        for (var pk = 0; pk < this.splats.length; pk++) {
            var pkSp = this.splats[pk];
            var pkGrow = Math.min(1, (1 - pkSp.userData.life / pkSp.userData.maxLife) * 8); // 前0.125s快速展开
            this._v3.set(pkSp.userData.size * pkGrow, pkSp.userData.size * pkGrow, 1);
            this._m4.compose(pkSp.position, this._splatQuat, this._v3);
            this.splatMesh.setMatrixAt(pk, this._m4);
            liveSplats++;
        }
        this.splatMesh.count = liveSplats;
        this.splatMesh.instanceMatrix.needsUpdate = true;

        // V12视觉: 爆炸白闪(0.14s 弹出+淡出)
        for (var bi = this.booms.length - 1; bi >= 0; bi--) {
            var bm = this.booms[bi];
            bm.life -= dt;
            if (bm.life <= 0) {
                this.scene.remove(bm.mesh);
                bm.mesh.visible = false;
                this._boomPool.push(bm.mesh);
                this.booms.splice(bi, 1);
                continue;
            }
            var bt = bm.life / bm.maxLife;
            bm.mesh.material.opacity = bt;
            // V14.3 节奏: 白闪瞬时峰值(出生 1.25×)后收缩淡出
            bm.mesh.scale.setScalar(bm.size * (1.25 - bt * 0.38));
        }

        // V16: 碎片粒子(重力+自旋+落地反弹; 实例色+矩阵前缀上传)
        var liveShards = 0;
        for (var si3 = this.shards.length - 1; si3 >= 0; si3--) {
            var sh = this.shards[si3], su = sh.userData;
            su.life -= dt;
            if (su.life <= 0) { sh.visible = false; this._shardPool.push(sh); this.shards.splice(si3, 1); continue; }
            su.vy -= 9.5 * dt;
            sh.position.x += su.vx * dt; sh.position.y += su.vy * dt; sh.position.z += su.vz * dt;
            if (sh.position.y < 0.05) { sh.position.y = 0.05; su.vy *= -0.32; su.vx *= 0.6; su.vz *= 0.6; su.rx *= 0.5; su.rz *= 0.5; }
            sh.rotation.x += su.rx * dt; sh.rotation.z += su.rz * dt;
            var st = su.life / su.maxLife;
            sh.scale.setScalar(su.s0 * (0.35 + st * 0.65));
            sh.updateMatrix();
        }
        for (var spi = 0; spi < this.shards.length; spi++) {
            this.shardMesh.setMatrixAt(spi, this.shards[spi].matrix);
            this._particleColor.setHex(this.shards[spi].userData.color || 0xffffff);
            this.shardMesh.setColorAt(spi, this._particleColor);
            liveShards++;
        }
        this.shardMesh.count = liveShards;
        this.shardMesh.instanceMatrix.needsUpdate = true;
        if (this.shardMesh.instanceColor) this.shardMesh.instanceColor.needsUpdate = true;

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
