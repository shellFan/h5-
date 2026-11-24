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
        // 温暖干净的军事混凝土底色
        ctx.fillStyle = '#9EA49F';
        ctx.fillRect(0, 0, 512, 512);
        // 柔和纵向压痕与车道微色调
        ctx.fillStyle = 'rgba(42, 50, 48, 0.08)';
        ctx.fillRect(72, 0, 60, 512);
        ctx.fillRect(226, 0, 60, 512);
        ctx.fillRect(380, 0, 60, 512);
        // 细腻颗粒质感(非凌乱脏点)
        for (var i = 0; i < 650; i++) {
            var x = (i * 97) % 512;
            var y = (i * 193) % 512;
            ctx.fillStyle = (i % 2) ? 'rgba(255,255,255,0.05)' : 'rgba(30,38,36,0.055)';
            ctx.fillRect(x, y, 3, 3);
        }
        // 横向混凝土分块伸缩缝
        ctx.fillStyle = 'rgba(45, 52, 48, 0.24)';
        for (var sy = 0; sy < 512; sy += 128) {
            ctx.fillRect(14, sy, 484, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(14, sy + 3, 484, 2);
            ctx.fillStyle = 'rgba(45, 52, 48, 0.24)';
        }
        // 两侧明快暖黄实边线(带深色衬边提升清晰度)
        ctx.fillStyle = 'rgba(48, 52, 44, 0.35)';
        ctx.fillRect(12, 0, 14, 512);
        ctx.fillRect(486, 0, 14, 512);
        ctx.fillStyle = '#F2C94C';
        ctx.fillRect(14, 0, 10, 512);
        ctx.fillRect(488, 0, 10, 512);
        // 三跑道清晰白色虚线分隔(对齐三车道)
        ctx.fillStyle = '#F7F8F2';
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
        // 卡通修剪草坪/基地地面条纹(白色基准, 颜色由 material.color 按五大主题动态着色)
        ctx.fillStyle = '#E8EFE2';
        ctx.fillRect(0, 0, 512, 512);
        for (var y = 0; y < 512; y += 64) {
            ctx.fillStyle = ((y / 64) % 2 === 0) ? '#F3F8EE' : '#DDE8D4';
            ctx.fillRect(0, y, 512, 64);
        }
        // 柔和地面色块与草斑
        for (var i = 0; i < 40; i++) {
            var px = (i * 131 + 23) % 512;
            var py = (i * 89 + 41) % 512;
            var r = 14 + (i % 4) * 8;
            ctx.fillStyle = (i % 2 === 0) ? 'rgba(255,255,255,0.16)' : 'rgba(30,50,25,0.06)';
            ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
        }
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(6, 2);
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
            hill: this._material('hill', 0x76a564, { roughness: .95 }),
            snow: this._material('snow', 0xeaf4f8, { roughness: .94 }),
            rock: this._material('rock', 0xb48454, { roughness: .9 }),
            city: this._material('city', 0x7c8a94, { map: bldgTex, metalness: .12, roughness: .72 }),
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
        // 3. 左右立体路缘石(白/暖金交替, 强空间纵深引导)
        this._add('curb-a', box, this.materials.curbA, this._repeat(function() {
            var rows = [];
            for (var z = -10.5; z <= 10.5; z += 4) {
                rows.push({ x: -4.16, y: .09, z: z, sx: .32, sy: .18, sz: 1.92 });
                rows.push({ x:  4.16, y: .09, z: z, sx: .32, sy: .18, sz: 1.92 });
            }
            return rows;
        }));
        this._add('curb-b', box, this.materials.curbB, this._repeat(function() {
            var rows = [];
            for (var z = -8.5; z <= 11.5; z += 4) {
                rows.push({ x: -4.16, y: .09, z: z, sx: .32, sy: .18, sz: 1.92 });
                rows.push({ x:  4.16, y: .09, z: z, sx: .32, sy: .18, sz: 1.92 });
            }
            return rows;
        }));

        // 4. 军事基地营房与坡屋顶(带瓦楞墙/窗户/大门/警示底边贴图)
        this._add('hangars', box, this.materials.structure, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 10.2, y: 1.75, z: -3.5, sx: 6.2, sy: 3.5, sz: 7.2 }];
        }));
        this._add('hangar-roofs', box, this.materials.roof, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 10.2, y: 3.66, z: -3.5, sx: 6.7, sy: .36, sz: 7.7, rz: side * .03 }];
        }));

        // 5. 瞭望哨塔 + 发光探照灯
        this._add('watch-posts', cylinder, this.materials.trunk, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -6.8, y: 1.4, z: 6.5, sx: .34, sy: 2.8, sz: .34 },
                { x: 6.8, y: 1.4, z: -7.5, sx: .34, sy: 2.8, sz: .34 }];
        }));
        this._add('watch-decks', box, this.materials.concrete, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -6.8, y: 2.9, z: 6.5, sx: 2.0, sy: .24, sz: 2.0 },
                { x: 6.8, y: 2.9, z: -7.5, sx: 2.0, sy: .24, sz: 2.0 }];
        }));
        this._add('watch-roofs', cone, this.materials.roof, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -6.8, y: 3.72, z: 6.5, sx: 2.1, sy: .95, sz: 2.1 },
                { x: 6.8, y: 3.72, z: -7.5, sx: 2.1, sy: .95, sz: 2.1 }];
        }));
        this._add('watch-lamps', sphere, this.materials.lamp, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -6.0, y: 3.15, z: 6.5, sx: .28, sy: .28, sz: .28 },
                { x: 6.0, y: 3.15, z: -7.5, sx: .28, sy: .28, sz: .28 }];
        }));

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
