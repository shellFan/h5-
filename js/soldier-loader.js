// ===== V4.1 soldier GLB loading, validation and shared render data =====

var SoldierModelLoader = class SoldierModelLoader {
    static load() {
        if (SoldierModelLoader._data) return SoldierModelLoader._promise;
        if (SoldierModelLoader._promise) return SoldierModelLoader._promise;
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader !== 'function') {
            return Promise.reject(new Error('SoldierModelLoader requires THREE.GLTFLoader'));
        }

        var started = performance.now();
        var partial = [];
        SoldierModelLoader.status = 'loading';
        SoldierModelLoader.loadMs = 0;
        var loader = new THREE.GLTFLoader();
        function one(url, label) {
            return new Promise(function(resolve, reject) {
                loader.load(url, function(gltf) {
                    try {
                        SoldierModelLoader._validate(gltf, label);
                        partial.push(gltf);
                        resolve(gltf);
                    } catch (err) {
                        SoldierModelLoader._disposeScene(gltf && gltf.scene);
                        reject(err);
                    }
                }, undefined, function(err) {
                    reject(new Error('Failed to load ' + label + ': ' + (err && err.message ? err.message : err)));
                });
            });
        }

        SoldierModelLoader._promise = Promise.allSettled([
            one('assets/models/soldier/soldier.glb', 'hero soldier'),
            one('assets/models/soldier/soldier-lod.glb', 'LOD soldier')
        ]).then(function(results) {
            // Wait for both requests before cleanup: a slow sibling must not
            // allocate textures after an early failed request has been disposed.
            var failed = results.find(function(r) { return r.status === 'rejected'; });
            if (failed) throw failed.reason;
            var loaded = results.map(function(r) { return r.value; });
            var hero = SoldierModelLoader._extract(loaded[0], 'hero');
            var lod = SoldierModelLoader._extract(loaded[1], 'lod');
            // Existing scenery was authored for legacy linear-output Lambert shading.
            // glTF PBR is linear-lit and must receive an sRGB display transform.
            // Apply it to this material only, preserving the established scenery palette.
            hero.material.onBeforeCompile = function(shader) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <encodings_fragment>',
                    'gl_FragColor = LinearTosRGB( gl_FragColor );'
                );
            };
            hero.material.customProgramCacheKey = function() { return 'v41-gltf-srgb-display'; };
            var duplicateLodMaterial = lod.material;
            for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
                lod.nodes[SoldierModelLoader.PARTS[i]].material = hero.material;
            }
            lod.material = hero.material;
            if (duplicateLodMaterial !== hero.material) {
                SoldierModelLoader._disposeMaterial(duplicateLodMaterial);
            }

            // Derive the attachment from world transforms so exported parent
            // rotations/scales remain correct even when Blender changes them.
            hero.scene.updateMatrixWorld(true);
            var inverseArms = new THREE.Matrix4().copy(hero.nodes.Arms.matrixWorld).invert();
            var muzzleMatrix = inverseArms.multiply(hero.muzzle.matrixWorld);
            var data = {
                version: 1,
                parts: SoldierModelLoader.PARTS.slice(),
                banks: {
                    hero: SoldierModelLoader._bankData(hero),
                    lod: SoldierModelLoader._bankData(lod)
                },
                material: hero.material,
                muzzleMatrix: muzzleMatrix.clone(),
                muzzlePosition: new THREE.Vector3().setFromMatrixPosition(muzzleMatrix),
                urls: {
                    hero: 'assets/models/soldier/soldier.glb',
                    lod: 'assets/models/soldier/soldier-lod.glb'
                }
            };
            SoldierModelLoader._data = data;
            SoldierModelLoader.status = 'loaded';
            SoldierModelLoader.loadMs = performance.now() - started;
            return data;
        }).catch(function(err) {
            for (var i = 0; i < partial.length; i++) {
                SoldierModelLoader._disposeScene(partial[i] && partial[i].scene);
            }
            SoldierModelLoader._data = null;
            SoldierModelLoader._promise = null;
            SoldierModelLoader.status = 'failed';
            SoldierModelLoader.loadMs = performance.now() - started;
            throw err;
        });
        return SoldierModelLoader._promise;
    }

    static get() {
        return SoldierModelLoader._data;
    }

    static _validate(gltf, label) {
        if (!gltf || !gltf.scene) throw new Error(label + ' has no scene');
        var shared = null;
        for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
            var name = SoldierModelLoader.PARTS[i];
            var node = gltf.scene.getObjectByName(name);
            if (!node || !node.isMesh) throw new Error(label + ' missing mesh ' + name);
            if (!node.geometry || !node.geometry.getAttribute('position') ||
                !node.geometry.getAttribute('normal') || !node.geometry.getAttribute('uv')) {
                throw new Error(label + ' ' + name + ' requires position, normal and UV attributes');
            }
            if (!node.geometry.index) throw new Error(label + ' ' + name + ' requires indexed geometry');
            if (Array.isArray(node.material) || !node.material || !node.material.isMeshStandardMaterial) {
                throw new Error(label + ' ' + name + ' requires one MeshStandardMaterial');
            }
            if (!shared) shared = node.material;
            if (node.material !== shared) throw new Error(label + ' parts must share one material');
        }
        var muzzle = gltf.scene.getObjectByName('Muzzle');
        var arms = gltf.scene.getObjectByName('Arms');
        if (!muzzle || muzzle.parent !== arms) throw new Error(label + ' Muzzle must be a direct Arms child');
        if (!shared.map || !shared.metalnessMap || !shared.roughnessMap) {
            throw new Error(label + ' material requires decoded base-color and ORM textures');
        }
        SoldierModelLoader._validateImage(shared.map.image, label + ' base-color');
        SoldierModelLoader._validateImage(shared.metalnessMap.image, label + ' ORM');
        if (shared.metalnessMap !== shared.roughnessMap) {
            throw new Error(label + ' ORM texture must be shared by metalness and roughness');
        }
    }

    static _validateImage(image, label) {
        var width = image && (image.width || image.videoWidth || image.naturalWidth);
        var height = image && (image.height || image.videoHeight || image.naturalHeight);
        if (!width || !height) throw new Error(label + ' image did not decode');
    }

    static _extract(gltf, label) {
        var nodes = {};
        for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
            var name = SoldierModelLoader.PARTS[i];
            nodes[name] = gltf.scene.getObjectByName(name);
            nodes[name].updateMatrix();
        }
        return {
            label: label,
            scene: gltf.scene,
            nodes: nodes,
            material: nodes.Body.material,
            muzzle: gltf.scene.getObjectByName('Muzzle')
        };
    }

    static _bankData(extracted) {
        var geometries = {};
        var restMatrices = {};
        for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
            var name = SoldierModelLoader.PARTS[i];
            geometries[name] = extracted.nodes[name].geometry;
            restMatrices[name] = extracted.nodes[name].matrix.clone();
        }
        return {
            name: extracted.label,
            geometries: geometries,
            restMatrices: restMatrices,
            material: extracted.material
        };
    }

    static _disposeScene(scene) {
        if (!scene) return;
        var geometries = [];
        var materials = [];
        scene.traverse(function(obj) {
            if (obj.geometry && geometries.indexOf(obj.geometry) < 0) geometries.push(obj.geometry);
            if (obj.material) {
                var list = Array.isArray(obj.material) ? obj.material : [obj.material];
                for (var i = 0; i < list.length; i++) {
                    if (materials.indexOf(list[i]) < 0) materials.push(list[i]);
                }
            }
        });
        for (var i = 0; i < geometries.length; i++) geometries[i].dispose();
        for (var j = 0; j < materials.length; j++) SoldierModelLoader._disposeMaterial(materials[j]);
    }

    static _disposeMaterial(material) {
        if (!material) return;
        var textures = [];
        for (var key in material) {
            var value = material[key];
            if (value && value.isTexture && textures.indexOf(value) < 0) textures.push(value);
        }
        for (var i = 0; i < textures.length; i++) textures[i].dispose();
        material.dispose();
    }
};

SoldierModelLoader.PARTS = ['Body', 'Head', 'Arms', 'LegL', 'LegR'];
SoldierModelLoader._promise = null;
SoldierModelLoader._data = null;
SoldierModelLoader.status = 'idle';
SoldierModelLoader.loadMs = 0;
if (typeof window !== 'undefined') window.SoldierModelLoader = SoldierModelLoader;
