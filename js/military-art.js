// Runtime military-base presentation. The module is intentionally self-contained
// and only allocates during World construction/theme changes, never per frame.
var MilitaryArt = class MilitaryArt {
    constructor(world) {
        this.world = world;
        this.scene = world.scene;
        this.root = new THREE.Group();
        this.root.name = 'military-art-runtime';
        this.root.userData.artSource = 'programmatic layered military biomes; no concept screenshot';
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

    _material(key, color, options) {
        var material = new THREE.MeshStandardMaterial(Object.assign({
            color: color, roughness: .88, metalness: 0, flatShading: true
        }, options || {}));
        material.name = 'military-' + key;
        return material;
    }

    _add(name, geometry, material, records, biomes) {
        var mesh = new THREE.InstancedMesh(geometry, material, records.length);
        mesh.name = 'military-' + name;
        mesh.frustumCulled = false;
        mesh.castShadow = !!(this.world.quality >= 1 && material.metalness < .75);
        mesh.receiveShadow = name === 'road' || name === 'shoulders';
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
        var cylinder = new THREE.CylinderGeometry(.5, .5, 1, 8);
        var cone = new THREE.ConeGeometry(.5, 1, 8);

        this.materials = {
            road: this._material('road', 0x9a9b91),
            shoulder: this._material('shoulder', 0x6f765f),
            stripe: new THREE.MeshBasicMaterial({color: 0xf0e8c9}),
            ground: this._material('ground', 0x63864a),
            concrete: this._material('concrete', 0xa9a791),
            structure: this._material('structure', 0x53664c),
            roof: this._material('roof', 0x334839, {metalness: .18, roughness: .7}),
            wood: this._material('wood', 0x795a37),
            sandbag: this._material('sandbag', 0xa79462),
            accent: this._material('accent', 0xd59d3d, {metalness: .12, roughness: .62}),
            dark: this._material('dark', 0x2d3632, {metalness: .35, roughness: .58}),
            foliage: this._material('foliage', 0x315f35),
            snow: this._material('snow', 0xe5eff1, {roughness: .96}),
            rock: this._material('rock', 0x9b7148),
            city: this._material('city', 0x66727a, {metalness: .15, roughness: .72})
        };

        this._add('road', plane, this.materials.road, this._repeat(function() {
            return [{x: 0, y: .024, z: 0, sx: 7.9, sy: 1, sz: 23.8, rx: 0}];
        }));
        this._add('shoulders', box, this.materials.shoulder, this._repeat(function() {
            return [{x: -5.25, y: -.04, z: 0, sx: 2.5, sy: .08, sz: 23.8},
                {x: 5.25, y: -.04, z: 0, sx: 2.5, sy: .08, sz: 23.8}];
        }));
        this._add('lane-marks', box, this.materials.stripe, this._repeat(function(segment) {
            var rows = [];
            for (var z = -9; z <= 9; z += 6) {
                rows.push({x: -1.31, y: .045, z: z, sx: .075, sy: .022, sz: 2.3});
                rows.push({x: 1.31, y: .045, z: z, sx: .075, sy: .022, sz: 2.3});
            }
            return rows;
        }));
        this._add('road-joints', box, this.materials.dark, this._repeat(function() {
            return [{x: 0, y: .037, z: -11.8, sx: 7.7, sy: .012, sz: .045}];
        }));

        this._add('hangars', box, this.materials.structure, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{x: side * 9.4, y: 1.45, z: -4, sx: 5.8, sy: 2.9, sz: 6.5}];
        }));
        this._add('hangar-roofs', box, this.materials.roof, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{x: side * 9.4, y: 3.02, z: -4, sx: 6.15, sy: .28, sz: 6.9, rz: side * .025}];
        }));
        this._add('watch-posts', cylinder, this.materials.wood, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{x: -6.7, y: 1.25, z: 6, sx: .28, sy: 2.5, sz: .28},
                {x: 6.7, y: 1.25, z: -7, sx: .28, sy: 2.5, sz: .28}];
        }));
        this._add('watch-decks', box, this.materials.concrete, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{x: -6.7, y: 2.6, z: 6, sx: 1.75, sy: .18, sz: 1.75},
                {x: 6.7, y: 2.6, z: -7, sx: 1.75, sy: .18, sz: 1.75}];
        }));
        this._add('watch-roofs', cone, this.materials.roof, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{x: -6.7, y: 3.35, z: 6, sx: 1.5, sy: .75, sz: 1.5},
                {x: 6.7, y: 3.35, z: -7, sx: 1.5, sy: .75, sz: 1.5}];
        }));

        this._add('crates', box, this.materials.wood, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{x: side * 5.15, y: .42, z: 3, sx: .82, sy: .82, sz: .82, ry: segment * .51},
                {x: side * 5.7, y: .31, z: 4.1, sx: .62, sy: .62, sz: .62, ry: -segment * .37}];
        }));
        this._add('sandbags', box, this.materials.sandbag, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            var rows = [];
            for (var i = 0; i < 4; i++) rows.push({x: side * (4.9 + i * .42), y: .18, z: -7,
                sx: .48, sy: .28, sz: .32, ry: side * .16});
            return rows;
        }));
        this._add('barriers', box, this.materials.accent, this._repeat(function(segment) {
            if (segment % 3) return [];
            return [{x: -5.0, y: .42, z: 9, sx: 1.15, sy: .18, sz: .18, rz: -.22},
                {x: 5.0, y: .42, z: 9, sx: 1.15, sy: .18, sz: .18, rz: .22}];
        }));

        this._add('sunny-flags', box, this.materials.accent, this._repeat(function(segment) {
            return segment % 2 ? [] : [{x: -7.2, y: 3.9, z: 2, sx: .9, sy: .5, sz: .04},
                {x: 7.2, y: 3.9, z: -2, sx: .9, sy: .5, sz: .04}];
        }), ['sunny']);
        this._add('desert-rocks', new THREE.DodecahedronGeometry(.5, 0), this.materials.rock,
            this._repeat(function(segment) {
                return [{x: -7.4 - segment % 2, y: .35, z: 1, sx: 1.3, sy: .65, sz: 1},
                    {x: 7.8, y: .28, z: -8, sx: .9, sy: .55, sz: 1.3}];
            }), ['desert']);
        this._add('city-skyline', box, this.materials.city, this._repeat(function(segment) {
            var height = 5 + segment % 3 * 2;
            return [{x: -15, y: height / 2, z: -6, sx: 4.5, sy: height, sz: 5},
                {x: 15, y: (height + 2) / 2, z: 4, sx: 4.5, sy: height + 2, sz: 5}];
        }), ['city']);
        this._add('forest-trunks', cylinder, this.materials.wood, this._repeat(function(segment) {
            return [{x: -8.4, y: 1.8, z: -7, sx: .5, sy: 3.6, sz: .5},
                {x: 8.8, y: 1.6, z: 5, sx: .45, sy: 3.2, sz: .45}];
        }), ['forest']);
        this._add('forest-crowns', cone, this.materials.foliage, this._repeat(function(segment) {
            return [{x: -8.4, y: 4.3, z: -7, sx: 2.7, sy: 3.2, sz: 2.7},
                {x: 8.8, y: 3.9, z: 5, sx: 2.4, sy: 2.9, sz: 2.4}];
        }), ['forest']);
        this._add('snow-pines', cone, this.materials.snow, this._repeat(function(segment) {
            return [{x: -8.8, y: 2.4, z: -6, sx: 2.2, sy: 4.8, sz: 2.2},
                {x: 8.4, y: 2.0, z: 5, sx: 1.8, sy: 4.0, sz: 1.8}];
        }), ['snow']);
    }

    setTheme(themeName) {
        var themeToBiome = {
            dawn: 'sunny', noon: 'desert', overcast: 'city', sunset: 'forest', dusk: 'snow',
            default: 'sunny', apocalypse: 'desert', cave: 'forest', mechanical: 'city', fortress: 'snow'
        };
        var biome = themeToBiome[themeName] || 'sunny';
        var palettes = {
            sunny:  {road:0xa8a89d, shoulder:0x668c4d, structure:0x647a57, roof:0x344a3b, accent:0xe2b446, ground:0x668c4d},
            desert: {road:0xb0a78f, shoulder:0xa98958, structure:0x9b8057, roof:0x5d5546, accent:0xe08c35, ground:0xa98958},
            city:   {road:0x8c969a, shoulder:0x68736f, structure:0x6c7878, roof:0x39484c, accent:0xe8b34d, ground:0x68736f},
            forest: {road:0x92978a, shoulder:0x476b42, structure:0x536847, roof:0x2f4536, accent:0xd49b3f, ground:0x476b42},
            snow:   {road:0xb8c1c1, shoulder:0xd7e4e4, structure:0x64777a, roof:0x3f555a, accent:0xe8a94a, ground:0xd7e4e4}
        };
        var palette = palettes[biome];
        this.materials.road.color.setHex(palette.road);
        this.materials.shoulder.color.setHex(palette.shoulder);
        this.materials.structure.color.setHex(palette.structure);
        this.materials.roof.color.setHex(palette.roof);
        this.materials.accent.color.setHex(palette.accent);
        for (var i = 0; i < this._meshes.length; i++) {
            var allowed = this._meshes[i].userData.biomes;
            this._meshes[i].visible = !allowed || allowed.indexOf(biome) >= 0;
        }
        // The military presentation replaces both legacy roadside systems while
        // retaining their objects for rollback and avoiding disposal churn.
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
