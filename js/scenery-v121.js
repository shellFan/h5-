// Generated diffuse materials + real reusable roadside geometry. Visuals only.
var SceneryV121 = class SceneryV121 {
    constructor(world) {
        this.world = world;
        this.groups = {};
        this.active = null;
        this.materials = {};
        this.tiles = [];
        this._matrix = new THREE.Object3D();
        this._lastZ = Infinity;
        this.geometries = {
            box: new THREE.BoxGeometry(1, 1, 1),
            rock: new THREE.IcosahedronGeometry(1, 1),
            orb: new THREE.IcosahedronGeometry(1, 2),
            cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
            cone: new THREE.ConeGeometry(1, 1, 10),
            ring: new THREE.TorusGeometry(1, .16, 5, 16),
            arch: new THREE.TorusGeometry(1, .16, 5, 16, Math.PI)
        };
        var colors = { asphalt: 0x72818a, stone: 0xb4a38b, metal: 0x798794,
            rock: 0x81768d, organic: 0x715074, ground: 0x9b794f,
            armor: 0x7c8b95, fortress: 0xb6a58d, rubber: 0x253241,
            glass: 0x70bdcc, orange: 0xd88a48, blue: 0x597ba0,
            red: 0x9b4754, stem: 0x87789d };
        for (var key in colors) this.materials[key] = new THREE.MeshLambertMaterial({ color: colors[key] });
        this.materials.cyan = new THREE.MeshBasicMaterial({ color: 0x68e6e2 });
        this.materials.purple = new THREE.MeshBasicMaterial({ color: 0xc18ae7 });
        this.materials.light = new THREE.MeshBasicMaterial({ color: 0xffd68b });
        this._road = world._v121RoadMaterial;
        this._originalRoad = this._road && this._road.map;
        this._roadSides = [];
        world.roadGroup.traverse(o => {
            if (o.isMesh && o.material !== this._road && !this._roadSides.some(x => x.material === o.material)) {
                this._roadSides.push({ material: o.material, color: o.material.color.clone() });
            }
        });
        this.setTheme('default');
        this.ready = new Promise((resolve, reject) => {
            var atlasUrl = 'assets/art-v121/world-materials.jpg';
            if (typeof Platform === 'undefined' || Platform.id === 'h5') atlasUrl += '?v=121';
            new THREE.TextureLoader().load(atlasUrl, texture => {
                try {
                var image = texture.image._impl || texture.image;
                var names = ['asphalt', 'stone', 'metal', 'rock', 'organic', 'ground', 'armor', 'fortress'];
                for (var i = 0; i < names.length; i++) {
                    var canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
                    canvas.getContext('2d').drawImage(image, (i % 4) * image.width / 4, Math.floor(i / 4) * image.height / 2,
                        image.width / 4, image.height / 2, 0, 0, 256, 256);
                    var tile = new THREE.CanvasTexture(canvas);
                    tile.wrapS = tile.wrapT = THREE.RepeatWrapping;
                    tile.anisotropy = 2;
                    this.tiles.push(tile);
                    this.materials[names[i]].map = tile;
                    this.materials[names[i]].color.setHex(0xffffff);
                    this.materials[names[i]].needsUpdate = true;
                }
                texture.dispose();
                this._applyRoad(this.theme);
                resolve(this);
                } catch (error) { texture.dispose(); reject(error); }
            }, undefined, error => reject(Error('World material atlas failed: ' + (error.message || error))));
        });
        // Loading failure leaves the readable material-color fallback in place.
        this.ready.catch(error => console.warn(error.message));
    }

    _bucket(group, shape, material, x, y, z, sx, sy, sz, rx, ry, rz) {
        var key = shape + ':' + material;
        var buckets = group.userData.buckets;
        (buckets[key] || (buckets[key] = { shape, material, records: [] })).records.push({
            x, y, z, sx, sy, sz, rx: rx || 0, ry: ry || 0, rz: rz || 0
        });
    }

    _build(theme) {
        var group = new THREE.Group();
        group.name = 'scenery-v121-' + theme;
        group.userData = { artSource: 'js/scenery-v121.js + assets/art-v121/world-materials.jpg',
            collidable: false, buckets: {}, entries: [] };
        var add = this._bucket.bind(this, group);
        for (var i = 0; i < 16; i++) {
            var side = i % 2 ? 1 : -1;
            var z = 12 - Math.floor(i / 2) * 21;
            var x = side * 4.7;
            var ground = { default: 'stone', cave: 'rock', mechanical: 'ground', fortress: 'stone', apocalypse: 'organic' }[theme];
            add('box', ground, side * 14, -.04, z, 19.6, .08, 21.2);
            if (theme === 'default') {
                // Actual cars have separate tires, cabin, glass and body volumes.
                if (i % 4 < 2) {
                    add('box', i % 3 ? 'orange' : 'blue', x + side * .2, .58, z, 1.35, .6, 2.5, 0, side * .08);
                    add('box', 'metal', x + side * .2, .98, z - .18, 1.2, .48, 1.3);
                    add('box', 'glass', x - side * .42, 1.03, z - .18, .025, .3, 1.08);
                    add('box', 'glass', x + side * .2, 1.04, z + .49, 1.06, .3, .035);
                    for (var axle of [-.78, .78]) for (var wheel of [-.65, .65])
                        add('cylinder', 'rubber', x + side * .2 + wheel, .32, z + axle, .29, .18, .29, 0, 0, Math.PI / 2);
                    add('box', 'light', x + side * .2, .58, z + 1.27, .8, .12, .03);
                } else {
                    for (var b = 0; b < 4; b++) add('orb', 'ground', side * 5.1, .3 + (b % 2) * .25, z - .8 + b * .45, .48, .18, .27);
                }
                add('box', 'stone', side * 6.0, .25, z - 4, 1.3, .45, 1.1, 0, i * .4);
                add('box', 'metal', side * 6.0, .5, z - 4, .9, .13, .85, 0, i * .4);
                add('cone', 'orange', side * 3.9, .28, z - 2.4, .16, .5, .16);
            } else if (theme === 'cave') {
                add('rock', 'rock', side * 8.8, 2.8, z, 2.5, 4.1, 5.2, .12, i * .7, side * .12);
                add('rock', 'rock', side * 5.2, .7, z - 4, 1.15, 1.3, 2.5, .2, i);
                add('cylinder', 'stem', x, .55, z - 1.6, .13, 1.1, .13, 0, 0, side * .2);
                add('cone', 'cyan', x, 1.17, z - 1.6, .65, .3, .65);
                add('orb', 'organic', side * 5.3, 1.2, z + 3, .95, 1.4, 1.0);
                add('orb', 'purple', side * 4.8, 1.6, z + 3.6, .32, .38, .23);
                add('rock', 'rock', side * 7.8, 7.5, z, 4, 1.7, 10, 0, i * .3);
                if (side === 1) add('arch', 'rock', 0, 2.4, z, 6.3, 4.3, 1.1);
            } else if (theme === 'mechanical') {
                add('cylinder', 'metal', side * 7.0, 3.1, z, 1.45, 6.2, 1.45);
                add('ring', 'armor', side * 7.0, 4.7, z, 1.48, 1.48, .7, Math.PI / 2);
                add('box', 'armor', side * 5.3, 2.7, z - 3.8, .6, 5.4, .7);
                add('box', 'metal', side * 6.3, .5, z + 3, 2.2, .9, 2.4);
                add('ring', 'metal', side * 6.2, 1.4, z - 6.2, 1.25, 1.25, .75, 0, Math.PI / 2);
                for (var tooth = 0; tooth < 10; tooth++) {
                    var a = tooth * Math.PI / 5;
                    add('box', 'armor', side * 6.2, 1.4 + Math.cos(a) * 1.23, z - 6.2 + Math.sin(a) * 1.23, .5, .35, .35, a, 0, 0);
                }
            } else if (theme === 'fortress') {
                add('box', 'fortress', side * 6.0, 2.25, z, 2.2, 4.5, 21.2);
                for (var crenel = 0; crenel < 7; crenel++) add('box', 'fortress', side * 6.0, 4.85, z - 8.4 + crenel * 2.8, 2.2, .8, 1.3);
                add('cylinder', 'stone', side * 7.0, 3.4, z + 6.0, 2, 6.8, 2);
                add('ring', 'armor', side * 7.0, 6.4, z + 6.0, 2.05, 2.05, .7, Math.PI / 2);
                add('cylinder', 'metal', side * 4.6, 2.5, z - 2, .06, 4.9, .06);
                add('box', i % 4 ? 'blue' : 'red', side * 4.5, 3.4, z - 2, .045, 1.8, .85);
            } else {
                add('orb', 'organic', side * 6.0, 2, z, 2.4, 2.6, 3.0, 0, i * .5);
                add('ring', 'organic', side * 5.2, 2.0, z + .8, 1.6, 2.0, .9, 0, side * .7);
                add('orb', 'cyan', side * 4.9, 2.15, z + 1.35, .6, .8, .36);
                add('cone', 'rock', side * 4.6, 1.1, z - 4.5, .5, 2.2, .6, 0, 0, side * -.3);
                add('cone', 'purple', side * 7.0, 4.2, z - 3, .8, 4.1, .8, 0, 0, side * -.16);
                add('cylinder', 'organic', side * 5.2, .3, z - 3, .26, 4.1, .26, Math.PI / 2, 0, side * .25);
                add('box', 'metal', side * 8.0, 3.2, z - 6.7, 1.5, 6.4, 1.5, 0, 0, side * .12);
                add('box', 'cyan', side * 7.7, 3.5, z - 6.7, .08, 3.5, .55);
            }
        }
        for (var key in group.userData.buckets) {
            var b = group.userData.buckets[key];
            var mesh = new THREE.InstancedMesh(this.geometries[b.shape], this.materials[b.material], b.records.length);
            mesh.name = 'v121-' + theme + '-' + key;
            mesh.userData = { artSource: group.userData.artSource, collidable: false };
            mesh.frustumCulled = false;
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.receiveShadow = true;
            for (var ri = 0; ri < b.records.length; ri++) this._setMatrix(mesh, ri, b.records[ri]);
            group.add(mesh);
            group.userData.entries.push({ mesh, records: b.records });
        }
        this.world.scene.add(group);
        this.groups[theme] = group;
        return group;
    }

    _setMatrix(mesh, i, r) {
        var o = this._matrix;
        o.position.set(r.x, r.y, r.z); o.scale.set(r.sx, r.sy, r.sz);
        o.rotation.set(r.rx, r.ry, r.rz); o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
    }

    setTheme(name) {
        var theme = ['cave', 'mechanical', 'fortress', 'apocalypse'].indexOf(name) >= 0 ? name : 'default';
        for (var key in this.groups) this.groups[key].visible = false;
        this.active = this.groups[theme] || this._build(theme);
        this.active.visible = true; this.theme = theme; this._lastZ = Infinity;
        var w = this.world;
        if (w._v42Environment) {
            w._v42Environment.root.visible = theme === 'default';
        }
        var palettes = {
            default: [0xbfd9e6, 0xfff0d3, 0xffffff], cave: [0x252239, 0x9eb8ed, 0x88729c],
            mechanical: [0x7d8f9d, 0xffcf98, 0xb3a08a], fortress: [0xaeb6be, 0xffe0ad, 0xc0b49f],
            apocalypse: [0x4c3557, 0xc1bded, 0x90749d]
        };
        var palette = palettes[theme];
        if (theme !== 'default') {
        w.scene.fog.color.setHex(palette[0]); w.scene.fog.near = theme === 'cave' ? 22 : 38; w.scene.fog.far = theme === 'cave' ? 80 : 110;
        w.scene.background = new THREE.Color(palette[0]);
        w.sunLight.color.setHex(palette[1]); w.sunLight.intensity = theme === 'cave' ? .65 : .78;
        if (w._skyDome) w._skyDome.material.color.setHex(palette[2]);
        }
        if (w._skyDome) w._skyDome.visible = theme !== 'cave';
        for (var side of this._roadSides) side.material.color.copy(side.color).multiply(new THREE.Color(palette[2]));
        this._applyRoad(theme);
        this.update(w._v42Environment && isFinite(w._v42Environment.lastSquadZ) ? w._v42Environment.lastSquadZ : 0);
    }

    _applyRoad(theme) {
        if (!this._road || !this.tiles.length) return;
        if (!this._roadMaps) this._roadMaps = {};
        if (!this._roadMaps[theme]) {
            var tile = { default: 0, cave: 3, mechanical: 2, fortress: 7, apocalypse: 4 }[theme];
            var canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 512;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(this.tiles[tile].image, 0, 0, 256, 512);
            // Lane markings are decorative and preserve the existing road width.
            ctx.fillStyle = theme === 'mechanical' ? '#d7c79b' : '#dce1df';
            for (var x of [85, 171]) for (var y = 4; y < 512; y += 112) ctx.fillRect(x - 1.5, y, 3, 54);
            ctx.fillStyle = theme === 'cave' ? '#797b93' : '#b8aa78';
            ctx.fillRect(3, 0, 2, 512); ctx.fillRect(251, 0, 2, 512);
            var map = new THREE.CanvasTexture(canvas); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 2;
            this._roadMaps[theme] = map;
        }
        this._road.map = this._roadMaps[theme]; this._road.needsUpdate = true;
    }

    update(squadZ) {
        if (!this.active || Math.abs(squadZ - this._lastZ) < .2) return;
        this._lastZ = squadZ;
        // Large props behind the squad can enter the camera's near field and
        // obscure the lane. Recycle them before they reach that camera corridor.
        var front = squadZ + 3, back = front - 168;
        for (var entry of this.active.userData.entries) {
            var changed = false;
            for (var i = 0; i < entry.records.length; i++) {
                var r = entry.records[i], old = r.z;
                if (r.z > front) r.z -= 168 * Math.ceil((r.z - front) / 168);
                else if (r.z < back) r.z += 168 * Math.ceil((back - r.z) / 168);
                if (r.z !== old) { this._setMatrix(entry.mesh, i, r); changed = true; }
            }
            if (changed) entry.mesh.instanceMatrix.needsUpdate = true;
        }
    }
};
