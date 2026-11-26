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
        // V18.0: 深沉做旧军用战术沥青混凝土跑道 (压暗路面以突出子弹曳光、红圈预警与角色立体感)
        ctx.fillStyle = '#5F6870';
        ctx.fillRect(0, 0, 512, 512);
        // 4块混凝土板块细微明暗冷暖变化 (打破死板单色网格感)
        var slabTones = ['rgba(255,252,244,0.05)', 'rgba(30,38,44,0.05)', 'rgba(245,248,255,0.04)', 'rgba(42,38,32,0.05)'];
        for (var sb = 0; sb < 4; sb++) {
            ctx.fillStyle = slabTones[sb];
            ctx.fillRect(0, sb * 128, 512, 128);
        }
        // 大尺度风化斑驳油污/水渍
        for (var p = 0; p < 44; p++) {
            var px = (p * 131 + 29) % 512;
            var py = (p * 179 + 47) % 512;
            var pr = 18 + (p % 4) * 12;
            var gP = ctx.createRadialGradient(px, py, 2, px, py, pr);
            var darkPatch = (p % 2 === 0);
            gP.addColorStop(0, darkPatch ? 'rgba(34,40,46,0.11)' : 'rgba(225,222,210,0.09)');
            gP.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gP;
            ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
        }
        // 柔和渐变三车道车辙印 (边缘羽化, 告别硬矩形)
        var laneCenters = [100, 256, 412];
        for (var lc = 0; lc < laneCenters.length; lc++) {
            var cx = laneCenters[lc];
            var gLane = ctx.createLinearGradient(cx - 46, 0, cx + 46, 0);
            gLane.addColorStop(0, 'rgba(28,34,40,0)');
            gLane.addColorStop(0.28, 'rgba(28,34,40,0.13)');
            gLane.addColorStop(0.5, 'rgba(34,40,46,0.07)');
            gLane.addColorStop(0.72, 'rgba(28,34,40,0.13)');
            gLane.addColorStop(1, 'rgba(28,34,40,0)');
            ctx.fillStyle = gLane;
            ctx.fillRect(cx - 46, 0, 92, 512);
        }
        // 路边两侧沙尘积灰与凹陷阴影渐变 (自然衔接路肩泥土)
        var edgeL = ctx.createLinearGradient(0, 0, 58, 0);
        edgeL.addColorStop(0, 'rgba(92,82,62,0.44)');
        edgeL.addColorStop(0.45, 'rgba(54,52,44,0.18)');
        edgeL.addColorStop(1, 'rgba(24,32,38,0)');
        ctx.fillStyle = edgeL; ctx.fillRect(0, 0, 58, 512);
        var edgeR = ctx.createLinearGradient(454, 0, 512, 0);
        edgeR.addColorStop(0, 'rgba(24,32,38,0)');
        edgeR.addColorStop(0.55, 'rgba(54,52,44,0.18)');
        edgeR.addColorStop(1, 'rgba(92,82,62,0.44)');
        ctx.fillStyle = edgeR; ctx.fillRect(454, 0, 58, 512);
        // 细腻骨料砂砾与风化微颗粒
        for (var i = 0; i < 1400; i++) {
            var x = (i * 97 + (i % 7) * 13) % 512;
            var y = (i * 193 + (i % 5) * 11) % 512;
            ctx.fillStyle = (i % 3 === 0) ? 'rgba(255,252,240,0.07)' : ((i % 3 === 1) ? 'rgba(20,26,32,0.09)' : 'rgba(138,124,98,0.06)');
            ctx.fillRect(x, y, 2 + (i % 2), 2 + ((i + 1) % 2));
        }
        // 横向混凝土板块伸缩缝 + 真实沥青网状裂纹 + 战区跑道导引喷漆箭头 + 双轮胎花纹印
        for (var sy = 0; sy < 512; sy += 128) {
            ctx.fillStyle = 'rgba(18, 24, 30, 0.34)';
            ctx.fillRect(14, sy, 484, 3);
            ctx.fillStyle = 'rgba(235, 240, 245, 0.09)';
            ctx.fillRect(14, sy + 3, 484, 2);
            // 多分叉自然沥青裂纹与局部冷补沥青块
            ctx.fillStyle = 'rgba(24, 30, 38, 0.18)';
            ctx.beginPath();
            ctx.ellipse(90 + ((sy * 5) % 310), sy + 52, 26, 14, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(16, 22, 28, 0.30)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            var cx0 = 54 + ((sy * 3) % 350);
            ctx.moveTo(cx0, sy + 2);
            ctx.lineTo(cx0 + 16, sy + 18);
            ctx.lineTo(cx0 + 36, sy + 12);
            ctx.lineTo(cx0 + 54, sy + 30);
            ctx.moveTo(cx0 + 16, sy + 18);
            ctx.lineTo(cx0 + 6, sy + 38);
            ctx.stroke();
        }
        // 重型装甲车双轮辙印与横向胎纹残迹
        ctx.fillStyle = 'rgba(16, 20, 26, 0.13)';
        var tracksX = [74, 122, 230, 278, 386, 434];
        for (var ti = 0; ti < tracksX.length; ti++) {
            var tx = tracksX[ti];
            ctx.fillRect(tx, 0, 9, 512);
            for (var ty = (ti % 2) * 8; ty < 512; ty += 18) {
                ctx.fillRect(tx - 2, ty, 13, 4);
            }
        }
        // 中道军用跑道战术导引喷漆标识 (低对比度做旧白漆)
        ctx.fillStyle = 'rgba(226, 232, 240, 0.12)';
        ctx.beginPath();
        ctx.moveTo(256, 210); ctx.lineTo(282, 248); ctx.lineTo(268, 248); ctx.lineTo(256, 230); ctx.lineTo(244, 248); ctx.lineTo(230, 248);
        ctx.closePath(); ctx.fill();

        // 两侧降饱和做旧琥珀军用警戒边线 (告别刺眼亮黄)
        ctx.fillStyle = 'rgba(18, 24, 30, 0.48)';
        ctx.fillRect(12, 0, 14, 512);
        ctx.fillRect(486, 0, 14, 512);
        ctx.fillStyle = '#C99B3B';
        ctx.fillRect(14, 0, 9, 512);
        ctx.fillRect(489, 0, 9, 512);
        // 三跑道做旧战术灰白虚线分隔
        ctx.fillStyle = 'rgba(18, 24, 30, 0.28)';
        for (var ly0 = 16; ly0 < 512; ly0 += 85) {
            ctx.fillRect(165, ly0 + 2, 10, 46);
            ctx.fillRect(337, ly0 + 2, 10, 46);
        }
        ctx.fillStyle = 'rgba(218, 226, 234, 0.72)';
        for (var ly = 16; ly < 512; ly += 85) {
            ctx.fillRect(166, ly, 8, 46);
            ctx.fillRect(338, ly, 8, 46);
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
        // V18.0: 沉稳写实卡通军营橄榄绿地表 (降明度降饱和, 告别发白草皮感)
        ctx.fillStyle = '#92A57E';
        ctx.fillRect(0, 0, 512, 512);
        // 大尺度有机草地明暗、泥土色块 (彻底告别荧光绿塑料平面)
        for (var i = 0; i < 85; i++) {
            var px = (i * 173 + 37) % 512;
            var py = (i * 109 + 61) % 512;
            var rx = 26 + (i % 5) * 18;
            var ry = 20 + ((i + 2) % 4) * 15;
            var tone = i % 4;
            ctx.fillStyle = tone === 0 ? 'rgba(232,226,184,0.22)'
                : (tone === 1 ? 'rgba(48,76,40,0.16)'
                : (tone === 2 ? 'rgba(156,132,88,0.18)' : 'rgba(72,98,54,0.14)'));
            ctx.beginPath(); ctx.ellipse(px, py, rx, ry, (i % 6) * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        // 手绘卡通 V 形小草簇 (增加地表细节层次)
        ctx.lineWidth = 2;
        for (var g = 0; g < 220; g++) {
            var gx = (g * 97 + 19) % 512;
            var gy = (g * 191 + 43) % 512;
            var h = 6 + (g % 5);
            ctx.strokeStyle = (g % 3 === 0) ? 'rgba(42,68,34,0.30)' : ((g % 3 === 1) ? 'rgba(242,238,196,0.26)' : 'rgba(76,102,52,0.24)');
            ctx.beginPath();
            ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - h);
            ctx.moveTo(gx, gy); ctx.lineTo(gx + 1, gy - h - 2);
            ctx.moveTo(gx, gy); ctx.lineTo(gx + 4, gy - h + 1);
            ctx.stroke();
        }
        // 零星小碎石与沙土点缀
        for (var s = 0; s < 140; s++) {
            var sx = (s * 149 + 71) % 512;
            var sy = (s * 211 + 23) % 512;
            ctx.fillStyle = (s % 2 === 0) ? 'rgba(154,142,118,0.26)' : 'rgba(84,78,62,0.20)';
            ctx.beginPath(); ctx.arc(sx, sy, 1.5 + (s % 3) * 0.8, 0, Math.PI * 2); ctx.fill();
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
        // V19.1: 现代特种作战深枪铁蓝 + 战术青蓝光带 + 琥珀金徽标战旗 (告别旧版突兀大红旗, 与首页与要塞100%统一!)
        var bg = ctx.createLinearGradient(0, 0, 0, 192);
        bg.addColorStop(0, '#162A4A');
        bg.addColorStop(1, '#0B1528');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 128, 192);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 6;
        ctx.strokeRect(5, 5, 118, 182);
        // 顶部和底部琥珀金战术边带
        ctx.fillStyle = '#F5B82E';
        ctx.fillRect(0, 0, 128, 12);
        ctx.fillRect(0, 174, 128, 10);
        // 中央特种战术盾徽 + 金色星章
        ctx.fillStyle = 'rgba(56,189,248,0.22)';
        ctx.beginPath(); ctx.arc(64, 88, 36, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7DD3FC'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(64, 88, 34, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#FFE066';
        ctx.beginPath();
        for (var i = 0; i < 10; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 5;
            var r = (i % 2 === 0) ? 22 : 9.5;
            if (i === 0) ctx.moveTo(64 + Math.cos(a) * r, 88 + Math.sin(a) * r);
            else ctx.lineTo(64 + Math.cos(a) * r, 88 + Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
        // 底部双V战术臂章条
        ctx.strokeStyle = '#F5B82E'; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(32, 138); ctx.lineTo(64, 156); ctx.lineTo(96, 138);
        ctx.stroke();
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
            road: this._material('road', 0xffffff, { map: roadTex, roughness: .95, envMapIntensity: 0.12 }),
            shoulder: this._material('shoulder', 0x9E9172, { map: groundTex, roughness: .96, envMapIntensity: 0.12 }),
            ground: this._material('ground', 0x597D47, { map: groundTex, roughness: .96, envMapIntensity: 0.14 }),
            curbA: this._material('curb-a', 0x6A7582, { roughness: .74, metalness: .26, envMapIntensity: 0.35 }),
            curbB: this._material('curb-b', 0x3D4959, { roughness: .64, metalness: .42, envMapIntensity: 0.42 }),
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
        // 2b. V15-ART-006: 路边两侧沙砾泥土路肩过渡带 (消除混凝土与草地硬切边)
        this._add('shoulders', plane, this.materials.shoulder, this._repeat(function() {
            return [
                { x: -5.15, y: -.02, z: 0, sx: 2.1, sy: 1, sz: 24.14 },
                { x:  5.15, y: -.02, z: 0, sx: 2.1, sy: 1, sz: 24.14 }
            ];
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
        // 11. V15-ART-005: 异步加载 Blender 4.2 雕塑模块化军事基地 GLB 组件包, 就绪后无缝升级替换低模几何体!
        this._loadBlenderEnvPack();
    }

    _loadBlenderEnvPack() {
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return;
        var self = this;
        var url = 'assets/game/v15/env_military_pack.glb';
        if (typeof Platform === 'undefined' || Platform.id === 'h5') url += '?v=1910';
        new THREE.GLTFLoader().load(url, function(gltf) {
            try {
                var sharedMat = null;
                var geos = {};
                gltf.scene.traverse(function(o) {
                    if (o.isMesh && o.geometry) {
                        geos[o.name] = o.geometry;
                        if (!sharedMat && o.material) sharedMat = o.material;
                    }
                });
                if (!sharedMat || !geos.PineTree) return;
                // r149 linear-to-sRGB display transform matching Soldier/Enemy PBR pipeline
                sharedMat.onBeforeCompile = function(shader) {
                    shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <encodings_fragment>',
                        'gl_FragColor = LinearTosRGB( gl_FragColor );'
                    );
                };
                sharedMat.customProgramCacheKey = function() { return 'v19-envpack-pbr'; };
                sharedMat.needsUpdate = true;

                // V19.0: 隐藏所有被 10 类雕塑 GLB 全面替代的旧基础方块/圆球/圆锥几何体!
                var replacedNames = {
                    'military-watch-posts': 1, 'military-watch-decks': 1, 'military-watch-roofs': 1, 'military-watch-lamps': 1,
                    'military-tank-hulls': 1, 'military-tank-tracks': 1, 'military-tank-turrets': 1, 'military-tank-barrels': 1,
                    'military-tent-bodies': 1, 'military-tent-roofs': 1,
                    'military-tree-trunks': 1, 'military-tree-crowns-base': 1, 'military-tree-crowns-top': 1,
                    'military-hangars': 1, 'military-hangar-roofs': 1,
                    'military-crates': 1, 'military-oil-drums': 1, 'military-bushes': 1,
                    'military-fuel-tanks': 1, 'military-barriers': 1, 'military-far-hills': 1,
                    'military-sandbags': 1, 'military-blast-walls': 1
                };
                for (var mi = 0; mi < self._meshes.length; mi++) {
                    if (replacedNames[self._meshes[mi].name]) {
                        self._meshes[mi].visible = false;
                        self._meshes[mi].userData.v15Replaced = true;
                    }
                }

                // 1) 高山松树 + 阔叶树双树种自然混交林 (彻底告别单调圆锥/棒棒糖树!)
                if (geos.PineTree) {
                    self._add('glb-pines', geos.PineTree, sharedMat, self._repeat(function(seg) {
                        var s = seg % 2 ? -1 : 1;
                        return [
                            { x: s * 7.9, y: 0, z: 2.4, sx: 1.18, sy: 1.28, sz: 1.18, ry: seg * 0.9 },
                            { x: -s * 12.4, y: 0, z: 4.8, sx: 1.48, sy: 1.58, sz: 1.48, ry: seg * 1.1 },
                            { x: s * 14.5, y: 0, z: -9.5, sx: 1.62, sy: 1.72, sz: 1.62, ry: -seg * 0.8 }
                        ];
                    }), ['sunny', 'forest', 'city']);
                }
                if (geos.BroadTree) {
                    self._add('glb-broadtrees', geos.BroadTree, sharedMat, self._repeat(function(seg) {
                        var s = seg % 2 ? 1 : -1;
                        return [
                            { x: s * 8.6, y: 0, z: -8.6, sx: 1.12, sy: 1.16, sz: 1.12, ry: seg * 1.3 },
                            { x: -s * 11.2, y: 0, z: -6.8, sx: 1.32, sy: 1.38, sz: 1.32, ry: -seg * 0.6 }
                        ];
                    }), ['sunny', 'forest', 'city']);
                }
                // 1b) 岩石灌木簇 (替代旧圆球灌木)
                if (geos.TacticalBush) {
                    self._add('glb-bushes', geos.TacticalBush, sharedMat, self._repeat(function(seg) {
                        var s = seg % 2 ? 1 : -1;
                        return [
                            { x: s * 5.35, y: 0, z: -8.4, sx: 1.1, sy: 1.1, sz: 1.1, ry: seg * 0.8 },
                            { x: -s * 5.45, y: 0, z: 4.9, sx: 1.0, sy: 1.0, sz: 1.0, ry: -seg * 1.2 }
                        ];
                    }), ['sunny', 'forest', 'city']);
                }
                // 2) 现代钢架装甲瞭望哨塔 (含青色战术探照灯)
                if (geos.Watchtower) {
                    self._add('glb-watchtowers', geos.Watchtower, sharedMat, self._repeat(function(seg) {
                        if (seg % 2) return [];
                        return [
                            { x: -7.2, y: 0, z: 5.5, sx: 1.08, sy: 1.08, sz: 1.08, ry: 0.35 },
                            { x:  7.4, y: 0, z: -7.5, sx: 1.08, sy: 1.08, sz: 1.08, ry: -2.75 }
                        ];
                    }));
                }
                // 2b) 拱顶肋骨重装机库 (替代旧方块营房!)
                if (geos.ArmoredHangar) {
                    self._add('glb-hangars', geos.ArmoredHangar, sharedMat, self._repeat(function(seg) {
                        var side = seg % 2 ? 1 : -1;
                        return [{ x: side * 10.6, y: 0, z: -3.5, sx: 1.05, sy: 1.05, sz: 1.05, ry: 0 }];
                    }));
                }
                // 3) 现代步战坦克 (带装甲裙板与青色观瞄镜)
                if (geos.ToyTank) {
                    self._add('glb-tanks', geos.ToyTank, sharedMat, self._repeat(function(seg) {
                        var side = seg % 2 ? 1 : -1;
                        return [{ x: side * 6.8, y: 0, z: -11.0, sx: 0.98, sy: 0.98, sz: 0.98, ry: side * -0.45 }];
                    }), ['sunny', 'desert', 'city', 'forest']);
                }
                // 4) 肋骨战术指挥帐篷
                if (geos.MilitaryTent) {
                    self._add('glb-tents', geos.MilitaryTent, sharedMat, self._repeat(function(seg) {
                        var side = seg % 2 ? -1 : 1;
                        return [{ x: side * 9.9, y: 0, z: 3.6, sx: 1.04, sy: 1.04, sz: 1.04, ry: side > 0 ? -1.45 : 1.45 }];
                    }), ['sunny', 'forest', 'desert']);
                }
                // 5) 沙袋掩体 + 托盘物资油桶组 (替代旧方块木箱与圆柱油桶!)
                if (geos.SandbagBunker) {
                    self._add('glb-sandbags', geos.SandbagBunker, sharedMat, self._repeat(function(seg) {
                        var side = seg % 2 ? -1 : 1;
                        return [{ x: side * 5.55, y: 0, z: -5.8, sx: 1.02, sy: 1.02, sz: 1.02, ry: side * -0.35 }];
                    }));
                }
                if (geos.SupplyCluster) {
                    self._add('glb-supplies', geos.SupplyCluster, sharedMat, self._repeat(function(seg) {
                        var side = seg % 2 ? 1 : -1;
                        return [
                            { x: side * 5.45, y: 0, z: 3.4, sx: 1.0, sy: 1.0, sz: 1.0, ry: side * 0.25 },
                            { x: -side * 5.65, y: 0, z: -1.8, sx: 0.92, sy: 0.92, sz: 0.92, ry: -side * 0.4 }
                        ];
                    }));
                }
                // 6) 替换远景基地要塞大门为全新重装特种指挥要塞大门!
                if (geos.BunkerGate && self._horizonFortress) {
                    var gateMesh = new THREE.Mesh(geos.BunkerGate, sharedMat);
                    gateMesh.name = 'v15-glb-bunker-gate';
                    gateMesh.scale.setScalar(1.16);
                    // 隐藏旧方块门楼, 保留三层远景山脉
                    for (var ci = 0; ci < self._horizonFortress.children.length; ci++) {
                        var ch = self._horizonFortress.children[ci];
                        if (!ch.userData.v15Mountain) ch.visible = false;
                    }
                    self._horizonFortress.add(gateMesh);
                }
                // 立即刷新实例矩阵到当前 anchor
                var curZ = isFinite(self._anchor) ? self._anchor : 0;
                self._anchor = Infinity;
                self.update(curZ);
            } catch (e) {
                console.warn('[MilitaryArt] V15 env pack load fallback:', e);
            }
        });
    }

    _buildHorizonFortress() {
        var g = new THREE.Group();
        g.name = 'v15-horizon-fortress';
        var wallMat = this.materials.fortressStone;
        var roofMat = this.materials.roof;
        var darkMat = this.materials.dark;
        var goldMat = this.materials.accent;
        var hillMat = this.materials.hill;

        // V19.1: 三层非对称自然险峻岩峰与远景大气雾化雪山 (折线峭壁+山脊凹凸法线起伏+远景雾化融合!)
        var makeRidgeMesh = function(width, maxH, depth, seed, baseHex, midHex, peakHex, zPos) {
            var segs = 72;
            var shape = new THREE.Shape();
            shape.moveTo(-width * 0.5, -2);
            for (var i = 0; i <= segs; i++) {
                var t = i / segs;
                var x = (t - 0.5) * width;
                var env = Math.pow(Math.sin(t * Math.PI), 0.72);
                // 避免正弦波规则等距感: 叠加非公度多频折峰 + 中央峡谷豁口(突出基地要塞主视觉!)
                var valley = 1.0 - 0.34 * Math.exp(-Math.pow((t - 0.5) / 0.14, 2));
                var p1 = Math.pow(Math.abs(Math.sin(t * 9.7 + seed)), 1.35) * 0.52;
                var p2 = Math.pow(Math.abs(Math.cos(t * 21.3 + seed * 1.9)), 1.6) * 0.30;
                var p3 = Math.abs(Math.sin(t * 43.1 + seed * 3.1)) * 0.14;
                var asym = (t < 0.5 ? 1.08 : 0.94);
                var h = (0.16 + p1 + p2 + p3) * maxH * (0.38 + 0.62 * env) * valley * asym;
                shape.lineTo(x, Math.max(1.0, h));
            }
            shape.lineTo(width * 0.5, -2);
            shape.closePath();
            var geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.45, bevelThickness: 0.65, curveSegments: 2 });
            geo.translate(0, 0, -depth * 0.5);
            var pos = geo.attributes.position;
            var cols = new Float32Array(pos.count * 3);
            var cBase = new THREE.Color(baseHex);
            var cMid = new THREE.Color(midHex);
            var cPeak = new THREE.Color(peakHex);
            var cTmp = new THREE.Color();
            for (var vi = 0; vi < pos.count; vi++) {
                var vx = pos.getX(vi), vy = pos.getY(vi), vz = pos.getZ(vi);
                // 赋予山体前后岩壁凹凸起伏, 消除纸板拉伸感
                if (vy > 0.5) {
                    pos.setZ(vi, vz + Math.sin(vx * 0.23 + vy * 0.31 + seed) * 1.35);
                }
                var snowNoise = Math.sin(vx * 0.37 + seed * 2.0) * 0.08;
                var ht = Math.max(0, Math.min(1, (vy / maxH) + snowNoise));
                if (ht < 0.52) cTmp.copy(cBase).lerp(cMid, ht / 0.52);
                else cTmp.copy(cMid).lerp(cPeak, (ht - 0.52) / 0.48);
                cols[vi * 3] = cTmp.r; cols[vi * 3 + 1] = cTmp.g; cols[vi * 3 + 2] = cTmp.b;
            }
            geo.computeVertexNormals();
            geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
            var mat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, vertexColors: true, roughness: 0.94, metalness: 0.02, flatShading: true, fog: true, envMapIntensity: 0.18 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(0, -0.6, zPos);
            mesh.userData.v15Mountain = true;
            return mesh;
        };
        g.add(makeRidgeMesh(122, 12.5, 4.5, 0.8, 0x2A4338, 0x3F5E4E, 0x6A877B, -13));  // 近景苍翠林岩脊
        g.add(makeRidgeMesh(152, 20.5, 5.5, 2.4, 0x435B73, 0x68839C, 0xC8DDF0, -25));  // 中景冷蓝峭壁岩峰
        g.add(makeRidgeMesh(184, 28.5, 6.5, 4.3, 0x6D8DA8, 0x9BB8D1, 0xF4FAFF, -39));  // 远景大气雾化雪峰

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
            sunny:  { road: 0x929EA9, ground: 0x4A6E3E, shoulder: 0x82785E, structure: 0x8FA49E, roof: 0x2E4756, accent: 0xE6AD32, hill: 0x5B8650, curbB: 0x485668 },
            desert: { road: 0xACA292, ground: 0xB89158, shoulder: 0x9E7A48, structure: 0xB59A72, roof: 0x594C3C, accent: 0xDC842C, hill: 0xA87A44, curbB: 0x5C5246 },
            city:   { road: 0x8A96A2, ground: 0x627074, shoulder: 0x586368, structure: 0x7A8B94, roof: 0x334452, accent: 0xE6AE3C, hill: 0x586972, curbB: 0x435060 },
            forest: { road: 0x8E9A94, ground: 0x446B39, shoulder: 0x73674E, structure: 0x647D58, roof: 0x294232, accent: 0xD69C38, hill: 0x3F6639, curbB: 0x44524A },
            snow:   { road: 0x9CAAB6, ground: 0xBBD0DC, shoulder: 0x96A8B4, structure: 0x849CA8, roof: 0x385262, accent: 0xE8A23A, hill: 0xA4BECD, curbB: 0x4D5E70 }
        };
        var palette = palettes[biome];
        this.materials.road.color.setHex(palette.road);
        this.materials.ground.color.setHex(palette.ground);
        this.materials.shoulder.color.setHex(palette.shoulder || palette.ground);
        this.materials.structure.color.setHex(palette.structure);
        this.materials.roof.color.setHex(palette.roof);
        this.materials.accent.color.setHex(palette.accent);
        this.materials.hill.color.setHex(palette.hill);
        this.materials.curbB.color.setHex(palette.curbB);

        for (var i = 0; i < this._meshes.length; i++) {
            if (this._meshes[i].userData.v15Replaced) { this._meshes[i].visible = false; continue; }
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
