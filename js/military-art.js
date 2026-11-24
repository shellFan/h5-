// Runtime military-base presentation (V5.1 visual upgrade).
// Self-contained instanced 3D cartoon military base; allocates once at init, never per frame.
var MilitaryArt = class MilitaryArt {
    constructor(world) {
        this.world = world;
        this.scene = world.scene;
        this.root = new THREE.Group();
        this.root.name = 'military-art-runtime';
        this.root.userData.artSource = 'programmatic layered military biomes; procedural cartoon PBR textures';
        this.scene.add(this.root);
        this._meshes = [];
        this._anchor = Infinity;
        this._scratch = new THREE.Object3D();
        this._segmentLength = 24;
        this._segmentCount = 7;
        this._build();
        this.setTheme(world._themeApplied || 'dawn');
        this.update(0);
    }

    _makeRoadTexture() {
        var cv = document.createElement('canvas');
        cv.width = 512; cv.height = 512;
        var ctx = cv.getContext('2d');
        // V15: 高对比度军用混凝土底色(微深冷灰, 让军绿士兵、紫色怪兽、发光门和子弹更突出)
        ctx.fillStyle = '#808890';
        ctx.fillRect(0, 0, 512, 512);
        // 路边两侧轻微阴影渐变(增强道路立体凹陷感)
        var edgeL = ctx.createLinearGradient(0, 0, 48, 0);
        edgeL.addColorStop(0, 'rgba(24,32,38,0.28)');
        edgeL.addColorStop(1, 'rgba(24,32,38,0)');
        ctx.fillStyle = edgeL; ctx.fillRect(0, 0, 48, 512);
        var edgeR = ctx.createLinearGradient(464, 0, 512, 0);
        edgeR.addColorStop(0, 'rgba(24,32,38,0)');
        edgeR.addColorStop(1, 'rgba(24,32,38,0.28)');
        ctx.fillStyle = edgeR; ctx.fillRect(464, 0, 48, 512);
        // 三条车辙压痕带
        ctx.fillStyle = 'rgba(32, 40, 46, 0.12)';
        ctx.fillRect(68, 0, 64, 512);
        ctx.fillRect(224, 0, 64, 512);
        ctx.fillRect(380, 0, 64, 512);
        // 细腻混凝土颗粒质感
        for (var i = 0; i < 800; i++) {
            var x = (i * 97) % 512;
            var y = (i * 193) % 512;
            ctx.fillStyle = (i % 2) ? 'rgba(255,255,255,0.06)' : 'rgba(22,28,34,0.07)';
            ctx.fillRect(x, y, 3, 3);
        }
        // 横向混凝土分块伸缩缝
        for (var sy = 0; sy < 512; sy += 128) {
            ctx.fillStyle = 'rgba(30, 36, 42, 0.30)';
            ctx.fillRect(14, sy, 484, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.14)';
            ctx.fillRect(14, sy + 3, 484, 2);
        }
        // 两侧明快暖黄实边线(带深色衬边)
        ctx.fillStyle = 'rgba(30, 34, 28, 0.45)';
        ctx.fillRect(12, 0, 14, 512);
        ctx.fillRect(486, 0, 14, 512);
        ctx.fillStyle = '#F4C946';
        ctx.fillRect(14, 0, 10, 512);
        ctx.fillRect(488, 0, 10, 512);
        // 三跑道高对比度白色虚线分隔(对齐三车道)
        ctx.fillStyle = 'rgba(26, 32, 38, 0.25)';
        for (var ly0 = 16; ly0 < 512; ly0 += 85) {
            ctx.fillRect(165, ly0 + 2, 12, 50);
            ctx.fillRect(335, ly0 + 2, 12, 50);
        }
        ctx.fillStyle = '#FAFCF8';
        for (var ly = 16; ly < 512; ly += 85) {
            ctx.fillRect(166, ly, 10, 50);
            ctx.fillRect(336, ly, 10, 50);
        }
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 2);
        tex.anisotropy = 4;
        return tex;
    }

    _makeGroundTexture() {
        var cv = document.createElement('canvas');
        cv.width = 512; cv.height = 512;
        var ctx = cv.getContext('2d');
        // V15-ART-002: 彻底取消规则棋盘条纹! 改为自然阳光草地+泥土斑驳+草簇肌理
        ctx.fillStyle = '#DAE8CE';
        ctx.fillRect(0, 0, 512, 512);
        // 大尺度柔和阳光草地与林荫色块 (确定性伪随机, 无缝自然)
        for (var i = 0; i < 65; i++) {
            var px = (i * 173 + 37) % 512;
            var py = (i * 109 + 61) % 512;
            var rx = 28 + (i % 5) * 16;
            var ry = 22 + ((i + 2) % 4) * 14;
            var tone = i % 3;
            ctx.fillStyle = tone === 0 ? 'rgba(255,250,210,0.16)' : (tone === 1 ? 'rgba(42,74,36,0.10)' : 'rgba(166,144,96,0.12)');
            ctx.beginPath(); ctx.ellipse(px, py, rx, ry, (i % 6) * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        // 细腻小草簇与沙土颗粒
        for (var g = 0; g < 320; g++) {
            var gx = (g * 97 + 19) % 512;
            var gy = (g * 191 + 43) % 512;
            ctx.fillStyle = (g % 3 === 0) ? 'rgba(38,68,32,0.18)' : 'rgba(255,255,230,0.14)';
            ctx.fillRect(gx, gy, 3 + (g % 3), 2 + (g % 4));
        }
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(5, 2);
        return tex;
    }

    _makeBuildingTexture() {
        var cv = document.createElement('canvas');
        cv.width = 256; cv.height = 256;
        var ctx = cv.getContext('2d');
        // 瓦楞金属军营墙体底色(浅灰白, 由 material.color 按主题染色)
        ctx.fillStyle = '#E4EAE0';
        ctx.fillRect(0, 0, 256, 256);
        for (var x = 0; x < 256; x += 16) {
            ctx.fillStyle = (x % 32 === 0) ? 'rgba(255,255,255,0.16)' : 'rgba(25,38,30,0.08)';
            ctx.fillRect(x, 0, 8, 256);
        }
        // 顶部檐口阴影带
        ctx.fillStyle = 'rgba(20, 32, 26, 0.28)';
        ctx.fillRect(0, 0, 256, 20);
        // 战术亮窗(两排简洁卡通蓝窗)
        for (var wx = 26; wx <= 186; wx += 78) {
            ctx.fillStyle = '#2A3B48';
            ctx.fillRect(wx - 4, 40, 52, 40);
            ctx.fillStyle = '#78C8F0';
            ctx.fillRect(wx, 44, 44, 32);
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.fillRect(wx + 4, 48, 14, 10);
        }
        // 中下机库卷帘大门
        ctx.fillStyle = '#33424A';
        ctx.fillRect(68, 118, 120, 114);
        ctx.fillStyle = '#4B5E68';
        for (var gy = 126; gy < 226; gy += 14) {
            ctx.fillRect(74, gy, 108, 9);
        }
        // 底部黄黑战术防撞警示条
        ctx.fillStyle = '#F2C037';
        ctx.fillRect(0, 232, 256, 24);
        ctx.fillStyle = '#2B3136';
        for (var hx = -24; hx < 280; hx += 32) {
            ctx.beginPath();
            ctx.moveTo(hx, 256); ctx.lineTo(hx + 16, 256); ctx.lineTo(hx + 28, 232); ctx.lineTo(hx + 12, 232);
            ctx.closePath(); ctx.fill();
        }
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    }

    _makeBannerTexture() {
        var cv = document.createElement('canvas');
        cv.width = 128; cv.height = 192;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#C9342C';
        ctx.fillRect(0, 0, 128, 192);
        // 顶部和底部金边
        ctx.fillStyle = '#F5C946';
        ctx.fillRect(0, 0, 128, 12);
        ctx.fillRect(0, 168, 128, 10);
        // 中央金色圆形五角星徽章
        ctx.fillStyle = '#FFE072';
        ctx.beginPath(); ctx.arc(64, 88, 34, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#B82820';
        ctx.beginPath(); ctx.arc(64, 88, 28, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFE47A';
        ctx.beginPath();
        for (var i = 0; i < 10; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 5;
            var r = (i % 2 === 0) ? 22 : 9.5;
            if (i === 0) ctx.moveTo(64 + Math.cos(a) * r, 88 + Math.sin(a) * r);
            else ctx.lineTo(64 + Math.cos(a) * r, 88 + Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
        return new THREE.CanvasTexture(cv);
    }

    _makeCrateTexture() {
        var cv = document.createElement('canvas');
        cv.width = 128; cv.height = 128;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#C99B63';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#7A552C';
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, 114, 114);
        ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(14, 14); ctx.lineTo(114, 114); ctx.stroke();
        ctx.fillStyle = '#E8C468';
        ctx.fillRect(48, 52, 32, 24);
        var tex = new THREE.CanvasTexture(cv);
        return tex;
    }

    _material(key, color, options) {
        var material = new THREE.MeshStandardMaterial(Object.assign({
            color: color, roughness: .84, metalness: 0, flatShading: false
        }, options || {}));
        material.name = 'military-' + key;
        return material;
    }

    _add(name, geometry, material, records, biomes) {
        var mesh = new THREE.InstancedMesh(geometry, material, records.length);
        mesh.name = 'military-' + name;
        mesh.frustumCulled = false;
        mesh.castShadow = !!(this.world.quality >= 1 && material.metalness < .75 && name !== 'road' && name !== 'ground-wide' && name !== 'shoulders');
        mesh.receiveShadow = name === 'road' || name === 'shoulders' || name === 'ground-wide';
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.userData.artSource = 'MilitaryArt reusable instanced geometry';
        mesh.userData.records = records;
        mesh.userData.biomes = biomes || null;
        this.root.add(mesh);
        this._meshes.push(mesh);
        return mesh;
    }

    _repeat(factory) {
        var records = [];
        for (var segment = 0; segment < this._segmentCount; segment++) {
            var local = factory(segment);
            for (var i = 0; i < local.length; i++) {
                local[i].segment = segment;
                records.push(local[i]);
            }
        }
        return records;
    }

    _build() {
        var box = new THREE.BoxGeometry(1, 1, 1);
        var plane = new THREE.PlaneGeometry(1, 1);
        plane.rotateX(-Math.PI / 2);
        var cylinder = new THREE.CylinderGeometry(.5, .5, 1, 10);
        var cone = new THREE.ConeGeometry(.55, 1, 10);
        var sphere = new THREE.SphereGeometry(.55, 10, 8);
        var hill = new THREE.DodecahedronGeometry(1, 1);

        var roadTex = this._makeRoadTexture();
        var groundTex = this._makeGroundTexture();
        var bldgTex = this._makeBuildingTexture();
        var crateTex = this._makeCrateTexture();

        this.materials = {
            road: this._material('road', 0xffffff, { map: roadTex, roughness: .88 }),
            shoulder: this._material('shoulder', 0x76a353, { map: groundTex, roughness: .92 }),
            ground: this._material('ground', 0x6ea04c, { map: groundTex, roughness: .94 }),
            curbA: this._material('curb-a', 0xF3F0DF, { roughness: .78 }),
            curbB: this._material('curb-b', 0xE6A93B, { roughness: .78 }),
            concrete: this._material('concrete', 0xb6b5a4, { roughness: .85 }),
            structure: this._material('structure', 0x8ea381, { map: bldgTex, roughness: .76 }),
            roof: this._material('roof', 0x3b5944, { metalness: .16, roughness: .64 }),
            wood: this._material('wood', 0xffffff, { map: crateTex, roughness: .82 }),
            trunk: this._material('trunk', 0x7b5434, { roughness: .9 }),
            sandbag: this._material('sandbag', 0xc9b37c, { roughness: .92 }),
            accent: this._material('accent', 0xf0b434, { metalness: .1, roughness: .55 }),
            dark: this._material('dark', 0x354046, { metalness: .35, roughness: .55 }),
            foliage: this._material('foliage', 0x459445, { roughness: .82 }),
            foliageLight: this._material('foliage-light', 0x67b854, { roughness: .82 }),
            hill: this._material('hill', 0x628E76, { roughness: .96 }),
            snow: this._material('snow', 0xeaf4f8, { roughness: .94 }),
            rock: this._material('rock', 0xb48454, { roughness: .9 }),
            city: this._material('city', 0x7c8a94, { map: bldgTex, metalness: .12, roughness: .72 }),
            tankOlive: this._material('tank-olive', 0x5A7342, { metalness: .18, roughness: .56 }),
            tankTrack: this._material('tank-track', 0x262C30, { metalness: .28, roughness: .72 }),
            tentCanvas: this._material('tent-canvas', 0x5D7B47, { roughness: .88 }),
            bannerRed: this._material('banner-red', 0xFFFFFF, { map: this._makeBannerTexture(), roughness: .68 }),
            fortressStone: this._material('fortress-stone', 0x7B8C80, { roughness: .84 }),
            drumRed: this._material('drum-red', 0xB83D32, { metalness: .32, roughness: .48 }),
            bush: this._material('bush', 0x4A8C42, { roughness: .88 }),
            lamp: new THREE.MeshBasicMaterial({ color: 0xFFF3B0 })
        };

        // 1. 全景超宽大地形(宽120m, 彻底告别悬空纸带感!)
        this._add('ground-wide', plane, this.materials.ground, this._repeat(function() {
            return [{ x: 0, y: -.08, z: 0, sx: 120, sy: 1, sz: 24.2 }];
        }));
        // 2. 三跑道军事混凝土主路(sz=24.12 轻微重叠彻底消除接缝漏蓝天!)
        this._add('road', plane, this.materials.road, this._repeat(function() {
            return [{ x: 0, y: .02, z: 0, sx: 8.0, sy: 1, sz: 24.12 }];
        }));
        // 3. 左右立体混凝土/黄黑防撞护栏 (V15: 加厚立体防撞墩, 强军事通道纵深)
        this._add('curb-a', box, this.materials.curbA, this._repeat(function() {
            var rows = [];
            for (var z = -10.5; z <= 10.5; z += 4) {
                rows.push({ x: -4.22, y: .22, z: z, sx: .42, sy: .44, sz: 1.88 });
                rows.push({ x:  4.22, y: .22, z: z, sx: .42, sy: .44, sz: 1.88 });
            }
            return rows;
        }));
        this._add('curb-b', box, this.materials.curbB, this._repeat(function() {
            var rows = [];
            for (var z = -8.5; z <= 11.5; z += 4) {
                rows.push({ x: -4.22, y: .22, z: z, sx: .42, sy: .44, sz: 1.88 });
                rows.push({ x:  4.22, y: .22, z: z, sx: .42, sy: .44, sz: 1.88 });
            }
            return rows;
        }));

        // 4. 军事基地营房与军用帆布帐篷
        this._add('hangars', box, this.materials.structure, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 10.2, y: 1.8, z: -3.5, sx: 6.2, sy: 3.6, sz: 7.4 }];
        }));
        this._add('hangar-roofs', box, this.materials.roof, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 10.2, y: 3.74, z: -3.5, sx: 6.7, sy: .38, sz: 7.9, rz: side * .03 }];
        }));
        // V15: 军用橄榄绿帆布帐篷 (对侧交替, 丰富中景军事营地)
        this._add('tent-bodies', box, this.materials.tentCanvas, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [{ x: side * 9.8, y: 1.05, z: 3.8, sx: 4.4, sy: 2.1, sz: 5.2 }];
        }), ['sunny', 'forest', 'desert']);
        this._add('tent-roofs', cone, this.materials.roof, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [{ x: side * 9.8, y: 2.65, z: 3.8, sx: 4.9, sy: 1.35, sz: 5.7, ry: Math.PI * 0.25 }];
        }), ['sunny', 'forest', 'desert']);

        // V15: 路边停放军绿玩具坦克 (更贴近中景道路两侧, 清晰呈现军事基地氛围!)
        this._add('tank-hulls', box, this.materials.tankOlive, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 6.5, y: .72, z: -11.5, sx: 2.3, sy: .78, sz: 3.4, ry: side * -.28 }];
        }), ['sunny', 'desert', 'city', 'forest']);
        this._add('tank-tracks', box, this.materials.tankTrack, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [
                { x: side * 6.5 - 1.05, y: .42, z: -11.3, sx: .52, sy: .68, sz: 3.6, ry: side * -.28 },
                { x: side * 6.5 + 1.05, y: .42, z: -11.7, sx: .52, sy: .68, sz: 3.6, ry: side * -.28 }
            ];
        }), ['sunny', 'desert', 'city', 'forest']);
        this._add('tank-turrets', box, this.materials.tankOlive, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 6.5, y: 1.38, z: -11.6, sx: 1.5, sy: .66, sz: 1.8, ry: side * -.42 }];
        }), ['sunny', 'desert', 'city', 'forest']);
        this._add('tank-barrels', cylinder, this.materials.dark, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 5.6, y: 1.46, z: -10.8, sx: .22, sy: 2.4, sz: .22, rx: Math.PI * 0.48, rz: side * .48 }];
        }), ['sunny', 'desert', 'city', 'forest']);

        // 5. V15 四柱木质/钢架瞭望哨塔 + 哨亭主体 + 坡顶 + 探照灯
        this._add('watch-posts', cylinder, this.materials.trunk, this._repeat(function(segment) {
            if (segment % 2) return [];
            var posts = [];
            var centers = [{ x: -6.8, z: 6.5 }, { x: 6.8, z: -7.5 }];
            for (var c = 0; c < centers.length; c++) {
                var cx = centers[c].x, cz = centers[c].z;
                posts.push({ x: cx - .72, y: 1.85, z: cz - .72, sx: .2, sy: 3.7, sz: .2 });
                posts.push({ x: cx + .72, y: 1.85, z: cz - .72, sx: .2, sy: 3.7, sz: .2 });
                posts.push({ x: cx - .72, y: 1.85, z: cz + .72, sx: .2, sy: 3.7, sz: .2 });
                posts.push({ x: cx + .72, y: 1.85, z: cz + .72, sx: .2, sy: 3.7, sz: .2 });
            }
            return posts;
        }));
        this._add('watch-decks', box, this.materials.concrete, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -6.8, y: 3.18, z: 6.5, sx: 2.3, sy: .65, sz: 2.3 },
                { x: 6.8, y: 3.18, z: -7.5, sx: 2.3, sy: .65, sz: 2.3 }];
        }));
        this._add('watch-roofs', cone, this.materials.roof, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -6.8, y: 4.18, z: 6.5, sx: 2.6, sy: 1.0, sz: 2.6, ry: Math.PI * 0.25 },
                { x: 6.8, y: 4.18, z: -7.5, sx: 2.6, sy: 1.0, sz: 2.6, ry: Math.PI * 0.25 }];
        }));
        this._add('watch-lamps', sphere, this.materials.lamp, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -5.85, y: 3.65, z: 6.5, sx: .32, sy: .32, sz: .32 },
                { x: 5.85, y: 3.65, z: -7.5, sx: .32, sy: .32, sz: .32 }];
        }));

        // V15: 路侧红星战旗 (提升军事基地氛围与暖色点缀)
        this._add('banner-poles', cylinder, this.materials.dark, this._repeat(function(segment) {
            return [
                { x: -5.05, y: 1.9, z: -10.0, sx: .12, sy: 3.8, sz: .12 },
                { x:  5.05, y: 1.9, z:   1.5, sx: .12, sy: 3.8, sz: .12 }
            ];
        }), ['sunny', 'forest', 'city']);
        this._add('banner-cloth', box, this.materials.bannerRed, this._repeat(function(segment) {
            return [
                { x: -5.05, y: 2.95, z: -9.92, sx: .76, sy: 1.35, sz: .06 },
                { x:  5.05, y: 2.95, z:  1.58, sx: .76, sy: 1.35, sz: .06 }
            ];
        }), ['sunny', 'forest', 'city']);

        // 5.5 军事基地要塞细节: 雷达通信塔 + 双联军用储油罐 + 混凝土防爆墙
        this._add('radar-posts', cylinder, this.materials.dark, this._repeat(function(segment) {
            if (segment % 2 === 0) return [];
            return [{ x: -11.4, y: 2.1, z: 5.5, sx: .28, sy: 4.2, sz: .28 },
                { x: 11.4, y: 2.1, z: -5.5, sx: .28, sy: 4.2, sz: .28 }];
        }));
        this._add('radar-dishes', cone, this.materials.concrete, this._repeat(function(segment) {
            if (segment % 2 === 0) return [];
            return [{ x: -11.1, y: 4.35, z: 5.5, sx: 1.5, sy: .55, sz: 1.5, rx: .5, rz: -.45 },
                { x: 11.1, y: 4.35, z: -5.5, sx: 1.5, sy: .55, sz: 1.5, rx: -.5, rz: .45 }];
        }));
        this._add('fuel-tanks', cylinder, this.materials.roof, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [
                { x: side * 10.6, y: .72, z: 2.2, sx: 1.2, sy: 2.6, sz: 1.2, rx: Math.PI / 2 },
                { x: side * 12.1, y: .72, z: 2.2, sx: 1.2, sy: 2.6, sz: 1.2, rx: Math.PI / 2 }
            ];
        }));
        this._add('blast-walls', box, this.materials.concrete, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [
                { x: side * 6.2, y: .55, z: -2.5, sx: .38, sy: 1.1, sz: 2.8 },
                { x: side * 6.2, y: .55, z: 0.7, sx: .38, sy: 1.1, sz: 2.8 }
            ];
        }));

        // 6. 卡通多层树木(让道路两侧生机勃勃, 不再荒凉)
        this._add('tree-trunks', cylinder, this.materials.trunk, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [
                { x: side * 7.6, y: .95, z: 2.0, sx: .42, sy: 1.9, sz: .42 },
                { x: -side * 8.6, y: 1.1, z: -8.5, sx: .46, sy: 2.2, sz: .46 }
            ];
        }), ['sunny', 'forest', 'city']);
        this._add('tree-crowns-base', sphere, this.materials.foliage, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [
                { x: side * 7.6, y: 2.35, z: 2.0, sx: 2.2, sy: 1.85, sz: 2.2 },
                { x: -side * 8.6, y: 2.7, z: -8.5, sx: 2.5, sy: 2.1, sz: 2.5 }
            ];
        }), ['sunny', 'forest', 'city']);
        this._add('tree-crowns-top', sphere, this.materials.foliageLight, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [
                { x: side * 7.4, y: 3.25, z: 1.9, sx: 1.45, sy: 1.35, sz: 1.45 },
                { x: -side * 8.4, y: 3.7, z: -8.4, sx: 1.65, sy: 1.45, sz: 1.65 }
            ];
        }), ['sunny', 'forest', 'city']);

        // 7. 路边军事工事: 木纹弹药箱、沙袋掩体、防撞路障
        this._add('crates', box, this.materials.wood, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [
                { x: side * 5.25, y: .46, z: 3.2, sx: .92, sy: .92, sz: .92, ry: segment * .45 },
                { x: side * 5.95, y: .34, z: 4.3, sx: .68, sy: .68, sz: .68, ry: -segment * .35 },
                { x: side * 5.45, y: 1.18, z: 3.4, sx: .56, sy: .56, sz: .56, ry: .25 }
            ];
        }));
        this._add('sandbags', box, this.materials.sandbag, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            var rows = [];
            for (var i = 0; i < 4; i++) {
                rows.push({ x: side * (5.0 + i * .46), y: .22, z: -6.8, sx: .56, sy: .34, sz: .38, ry: side * .12 });
            }
            rows.push({ x: side * 5.45, y: .52, z: -6.8, sx: .56, sy: .32, sz: .36, ry: -side * .08 });
            rows.push({ x: side * 5.95, y: .52, z: -6.8, sx: .56, sy: .32, sz: .36, ry: side * .08 });
            return rows;
        }));
        this._add('barriers', box, this.materials.accent, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -5.1, y: .44, z: 9.2, sx: 1.25, sy: .22, sz: .22, rz: -.16 },
                { x: 5.1, y: .44, z: 9.2, sx: 1.25, sy: .22, sz: .22, rz: .16 }];
        }));
        // V15-ART-002: 路侧红色军用油桶与自然灌木丛 (非对称分布, 打破镜像感)
        this._add('oil-drums', cylinder, this.materials.drumRed, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [
                { x: side * 5.4, y: .48, z: -4.2, sx: .58, sy: .96, sz: .58 },
                { x: side * 6.05, y: .48, z: -4.5, sx: .58, sy: .96, sz: .58 },
                { x: -side * 5.7, y: .48, z: 7.4, sx: .58, sy: .96, sz: .58 }
            ];
        }));
        this._add('bushes', sphere, this.materials.bush, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [
                { x: side * 5.3, y: .45, z: -8.6, sx: 1.35, sy: .95, sz: 1.25 },
                { x: side * 6.2, y: .38, z: -9.3, sx: 1.05, sy: .78, sz: 1.05 },
                { x: -side * 5.5, y: .42, z: 4.8, sx: 1.25, sy: .88, sz: 1.15 }
            ];
        }), ['sunny', 'forest', 'city']);

        // 8. 远景连绵山丘剪影(构筑地平线层次, 彻底摆脱单调平坦感)
        this._add('far-hills', hill, this.materials.hill, this._repeat(function(segment) {
            var hL = 3.8 + (segment % 3) * 1.4;
            var hR = 4.2 + ((segment + 1) % 3) * 1.5;
            return [
                { x: -24 - (segment % 2) * 4, y: hL * 0.35, z: -4, sx: 12, sy: hL, sz: 14, ry: segment * .7 },
                { x:  24 + (segment % 2) * 4, y: hR * 0.35, z:  6, sx: 12, sy: hR, sz: 14, ry: -segment * .6 }
            ];
        }));

        // 9. 主题专属装饰
        this._add('sunny-flags', box, this.materials.accent, this._repeat(function(segment) {
            return segment % 2 ? [] : [{ x: -7.2, y: 4.35, z: 6.5, sx: 1.0, sy: .52, sz: .05 },
                { x: 7.2, y: 4.35, z: -7.5, sx: 1.0, sy: .52, sz: .05 }];
        }), ['sunny']);
        this._add('desert-rocks', hill, this.materials.rock, this._repeat(function(segment) {
            return [{ x: -8.0 - (segment % 2) * 1.5, y: .6, z: 1.2, sx: 1.6, sy: .95, sz: 1.3 },
                { x: 8.4, y: .5, z: -8.2, sx: 1.2, sy: .8, sz: 1.5 }];
        }), ['desert']);
        this._add('city-skyline', box, this.materials.city, this._repeat(function(segment) {
            var height = 6 + (segment % 3) * 2.5;
            return [{ x: -16.5, y: height / 2, z: -6, sx: 5.0, sy: height, sz: 5.5 },
                { x: 16.5, y: (height + 2) / 2, z: 4, sx: 5.0, sy: height + 2, sz: 5.5 }];
        }), ['city']);
        this._add('snow-pines', cone, this.materials.snow, this._repeat(function(segment) {
            return [{ x: -8.6, y: 2.5, z: -6, sx: 2.4, sy: 5.0, sz: 2.4 },
                { x: 8.4, y: 2.1, z: 5, sx: 2.0, sy: 4.2, sz: 2.0 }];
        }), ['snow']);

        // 10. V15: 远景阳光军事基地要塞大门 (跟随地平线, 彻底消除道路尽头空旷感!)
        this._buildHorizonFortress();
    }

    _buildHorizonFortress() {
        var g = new THREE.Group();
        g.name = 'v15-horizon-fortress';
        var wallMat = this.materials.fortressStone;
        var roofMat = this.materials.roof;
        var darkMat = this.materials.dark;
        var goldMat = this.materials.accent;
        var hillMat = this.materials.hill;

        // 两侧远景绵延山脉(围绕基地大门)
        var mtns = [
            [-30, 5.5, -14, 22, 11, 14], [30, 6.0, -14, 24, 12, 14],
            [-14, 4.2, -22, 18, 8.5, 12], [14, 4.6, -22, 18, 9.2, 12],
            [0, 5.2, -26, 26, 10.5, 14]
        ];
        var mtnGeo = new THREE.DodecahedronGeometry(1, 1);
        for (var mi = 0; mi < mtns.length; mi++) {
            var m = mtns[mi];
            var mm = new THREE.Mesh(mtnGeo, hillMat);
            mm.position.set(m[0], m[1], m[2]);
            mm.scale.set(m[3], m[4], m[5]);
            g.add(mm);
        }

        // 要塞主城墙(左右两翼 + 跨路门楼)
        var leftWall = new THREE.Mesh(new THREE.BoxGeometry(16, 6.2, 3.2), wallMat);
        leftWall.position.set(-14.5, 3.1, 0); g.add(leftWall);
        var rightWall = new THREE.Mesh(new THREE.BoxGeometry(16, 6.2, 3.2), wallMat);
        rightWall.position.set(14.5, 3.1, 0); g.add(rightWall);

        // 跨路门楼顶梁 + 门洞阴影
        var archTop = new THREE.Mesh(new THREE.BoxGeometry(13.6, 3.8, 3.8), wallMat);
        archTop.position.set(0, 7.6, 0); g.add(archTop);
        var archRoof = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.7, 4.4), roofMat);
        archRoof.position.set(0, 9.8, 0); g.add(archRoof);
        var gateVoid = new THREE.Mesh(new THREE.BoxGeometry(8.6, 5.8, 2.2), darkMat);
        gateVoid.position.set(0, 2.9, -0.4); g.add(gateVoid);

        // 左右门楼双碉堡塔
        for (var s = -1; s <= 1; s += 2) {
            var tower = new THREE.Mesh(new THREE.BoxGeometry(4.4, 10.8, 4.6), wallMat);
            tower.position.set(s * 6.4, 5.4, 0.3); g.add(tower);
            var cap = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.9, 5.2), roofMat);
            cap.position.set(s * 6.4, 11.1, 0.3); g.add(cap);
            // 碉堡高光警示条
            var band = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.45, 4.7), goldMat);
            band.position.set(s * 6.4, 9.6, 0.3); g.add(band);
        }

        // 门楼正中军工金星徽章
        var emblemBg = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.35, 16), roofMat);
        emblemBg.rotation.x = Math.PI * 0.5;
        emblemBg.position.set(0, 7.6, 2.0); g.add(emblemBg);
        var emblemStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.92, 0), goldMat);
        emblemStar.scale.set(1, 1, 0.35);
        emblemStar.position.set(0, 7.6, 2.25); g.add(emblemStar);

        g.scale.setScalar(0.68);
        g.position.set(0, 0, -74);
        this.root.add(g);
        this._horizonFortress = g;
    }

    setTheme(themeName) {
        var themeToBiome = {
            dawn: 'sunny', noon: 'desert', overcast: 'city', sunset: 'forest', dusk: 'snow',
            default: 'sunny', apocalypse: 'desert', cave: 'forest', mechanical: 'city', fortress: 'snow'
        };
        var biome = themeToBiome[themeName] || 'sunny';
        var palettes = {
            sunny:  { road: 0xf4f6f0, ground: 0x6ca64b, structure: 0x9bb089, roof: 0x35543e, accent: 0xf0b636, hill: 0x73a860, curbB: 0xe8a838 },
            desert: { road: 0xf2ead9, ground: 0xc9a062, structure: 0xc2a478, roof: 0x6b5b47, accent: 0xe6882e, hill: 0xb8864b, curbB: 0xd97d2b },
            city:   { road: 0xdce2e6, ground: 0x738282, structure: 0x86979e, roof: 0x3c4d57, accent: 0xeeb544, hill: 0x64757c, curbB: 0xe3a83b },
            forest: { road: 0xe5ebe0, ground: 0x4f7d43, structure: 0x6c855c, roof: 0x2d4834, accent: 0xdca03c, hill: 0x456e3e, curbB: 0xd99e36 },
            snow:   { road: 0xeef3f6, ground: 0xd2e5ee, structure: 0x8ea6b0, roof: 0x3f5b69, accent: 0xf0a63e, hill: 0xb4cedb, curbB: 0xe89438 }
        };
        var palette = palettes[biome];
        this.materials.road.color.setHex(palette.road);
        this.materials.ground.color.setHex(palette.ground);
        this.materials.shoulder.color.setHex(palette.ground);
        this.materials.structure.color.setHex(palette.structure);
        this.materials.roof.color.setHex(palette.roof);
        this.materials.accent.color.setHex(palette.accent);
        this.materials.hill.color.setHex(palette.hill);
        this.materials.curbB.color.setHex(palette.curbB);

        for (var i = 0; i < this._meshes.length; i++) {
            var allowed = this._meshes[i].userData.biomes;
            this._meshes[i].visible = !allowed || allowed.indexOf(biome) >= 0;
        }
        if (this.world._v42Environment && this.world._v42Environment.root) this.world._v42Environment.root.visible = false;
        if (this.world.roadGroup) this.world.roadGroup.visible = false;
        if (this.world._v121Scenery) {
            for (var key in this.world._v121Scenery.groups) this.world._v121Scenery.groups[key].visible = false;
            if (this.world._v121Scenery.active) this.world._v121Scenery.active.visible = false;
        }
        this.biome = biome;
        this.themeName = themeName;
    }

    update(squadZ) {
        if (this._horizonFortress) {
            this._horizonFortress.position.z = (squadZ || 0) - 74;
        }
        var anchor = Math.floor((squadZ || 0) / this._segmentLength) * this._segmentLength;
        if (anchor === this._anchor) return;
        this._anchor = anchor;
        var scratch = this._scratch;
        for (var m = 0; m < this._meshes.length; m++) {
            var mesh = this._meshes[m];
            var records = mesh.userData.records;
            for (var i = 0; i < records.length; i++) {
                var item = records[i];
                scratch.position.set(item.x, item.y, anchor + 24 - item.segment * this._segmentLength + item.z);
                scratch.rotation.set(item.rx || 0, item.ry || 0, item.rz || 0);
                scratch.scale.set(item.sx || 1, item.sy || 1, item.sz || 1);
                scratch.updateMatrix();
                mesh.setMatrixAt(i, scratch.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
};
