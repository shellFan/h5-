// ===== V14: 军械库 3D 武器展示 =====
// 表现层组件: 小型转台渲染器, 懒加载 assets/models/weapons/<id>/<id>.glb。
// - 仅 H5 端启用(THREE/GLTFLoader 存在时); 微信 minidom 端自动回退 SVG 图集(渲染函数不挂载)。
// - 画布从 DOM 断开时 RAF 自停(renderArmory 重建 innerHTML 即自动回收), 无泄漏。
// - 只读展示, 不触碰武器数值/业务逻辑。
var WeaponShowcase = {
    _cache: {},        // id -> gltf.scene (geometry 复用, 材质独立克隆以便稀有度调色)
    _loading: {},      // id -> Promise
    _active: null,     // { renderer, scene, camera, mesh, raf, canvas, id }

    available: function() {
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader || typeof document === 'undefined') return false;
        // V14.1: 小游戏运行时(真机 wx / 模拟器 minidom)禁止挂载 — 真实 canvas 节点混入
        // minidom 树会污染其样式引擎(bg-image 全部不再加载)。H5 端 SVG 图集保持回退。
        if (typeof wx !== 'undefined') return false;
        if (typeof window !== 'undefined' && window.__minidom) return false;
        try {
            var probe = document.createElement('canvas');
            return !!(probe.getContext && probe.getContext('webgl'));
        } catch (e) { return false; }
    },

    _load: function(id) {
        if (this._cache[id]) return Promise.resolve(this._cache[id]);
        if (this._loading[id]) return this._loading[id];
        var loader = new THREE.GLTFLoader();
        var self = this;
        this._loading[id] = new Promise(function(resolve, reject) {
            loader.load('assets/models/weapons/' + id + '/' + id + '.glb?v=145', function(g) {
                g.scene.updateMatrixWorld(true);
                var mesh = null;
                g.scene.traverse(function(o) { if (o.isMesh && !mesh) mesh = o; });
                if (!mesh) { reject(new Error('no mesh in ' + id + '.glb')); return; }
                var box = new THREE.Box3().setFromObject(g.scene);
                var size = box.getSize(new THREE.Vector3());
                var center = box.getCenter(new THREE.Vector3());
                var model = { mesh: mesh, size: size, center: center };
                self._cache[id] = model;
                delete self._loading[id];
                resolve(model);
            }, undefined, function(e) {
                delete self._loading[id];
                reject(e);
            });
        });
        return this._loading[id];
    },

    /** 挂载展示台: container 为空 div; weaponId 为 WEAPON_DEFS 键 */
    mount: function(container, weaponId, opts) {
        if (!container || !this.available()) return false;
        this.stop();
        try { return this._mountInner(container, weaponId); } catch (e) { return false; }
    },

    _mountInner: function(container, weaponId) {
        var self = this;
        var canvas = document.createElement('canvas');
        canvas.className = 'v14-weapon-canvas';
        container.appendChild(canvas);
        var w = container.clientWidth || 150, h = container.clientHeight || 110;
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputEncoding = THREE.sRGBEncoding; // 独立展示台用正确PBR响应(战斗场景因整体美术风格保持Linear)
        renderer.setSize(w, h, false);
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(32, w / h, 0.05, 10);
        // 三点布光: 主光暖白 + 冷色补光 + 金色轮辋光(呼应 Navy/Gold 设计系统)
        var key = new THREE.DirectionalLight(0xFFF2DC, 1.05); key.position.set(1.5, 2.2, 1.6); scene.add(key);
        var fill = new THREE.DirectionalLight(0x9EC3E8, 0.5); fill.position.set(-2.2, 0.2, 1.4); scene.add(fill);
        var up = new THREE.DirectionalLight(0xFFE2B0, 0.35); up.position.set(0, -1.6, 0.8); scene.add(up);
        var rim = new THREE.DirectionalLight(0xFFC247, 0.8); rim.position.set(-0.6, 1.6, -2.4); scene.add(rim);
        scene.add(new THREE.AmbientLight(0x55627E, 0.55));

        // V14: PMREM 渐变环境 — metalness 材质无 envMap 会渲染成死黑, 这一步让枪体金属真正反光
        if (!WeaponShowcase._envTex) {
            var envScene = new THREE.Scene();
            var eg = new THREE.SphereGeometry(6, 20, 14);
            var epos = eg.attributes.position, ecol = new Float32Array(epos.count * 3);
            for (var vi = 0; vi < epos.count; vi++) {
                var ny = epos.getY(vi) / 6;
                var r2, g2, b2;
                if (ny > 0.25) { r2 = 0.60; g2 = 0.68; b2 = 0.82; }            // 顶部暖天光
                else if (ny > -0.15) { r2 = 0.30; g2 = 0.36; b2 = 0.50; }     // 中层海军蓝
                else { r2 = 0.07; g2 = 0.09; b2 = 0.14; }                      // 底部暗
                ecol[vi * 3] = r2; ecol[vi * 3 + 1] = g2; ecol[vi * 3 + 2] = b2;
            }
            eg.setAttribute('color', new THREE.BufferAttribute(ecol, 3));
            envScene.add(new THREE.Mesh(eg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
            var pmrem = new THREE.PMREMGenerator(renderer);
            WeaponShowcase._envTex = pmrem.fromScene(envScene, 0.05).texture;
            pmrem.dispose();
        }
        scene.environment = WeaponShowcase._envTex;
        var state = { renderer: renderer, scene: scene, camera: camera, canvas: canvas, id: weaponId, mesh: null, t: 0 };
        this._active = state;
        this._load(weaponId).then(function(model) {
            if (self._active !== state || !state.canvas.isConnected) return;
            var clone = model.mesh.clone();
            clone.material = model.mesh.material; // 共享材质(GLB 自带), 不逐实例复制
            clone.material.envMapIntensity = 0.45; // 环境反射降档防曝白
            var group = new THREE.Group();
            // 归一化: 居中 + 按最长边缩放到 ~1.4 单位, 枪口朝向镜头左前(经典展示角)
            var maxDim = Math.max(model.size.x, model.size.y, model.size.z) || 1;
            var s = 1.72 / maxDim;
            clone.position.set(-model.center.x, -model.center.y, -model.center.z);
            group.add(clone);
            group.scale.setScalar(s);
            group.rotation.set(0.0, -0.95, 0);
            state.mesh = group;
            scene.add(group);
            var dist = 2.15;
            camera.position.set(1.3, 0.95, dist);
            camera.lookAt(0, -0.04, 0);
            var loop = function() {
                if (!state.canvas.isConnected || self._active !== state) return; // 断开即停
                state.t += 0.016;
                if (state.mesh) {
                    state.mesh.rotation.y = -0.95 + Math.sin(state.t * 0.8) * 0.38; // 缓慢摆动展示
                    state.mesh.position.y = Math.sin(state.t * 1.3) * 0.035;        // 悬浮呼吸
                }
                renderer.render(scene, camera);
                state.raf = requestAnimationFrame(loop);
            };
            loop();
        }).catch(function() {
            // GLB 加载失败: 保持容器空, SVG 回退由 CSS 兜底(容器隐藏时显示图集)
            if (state.canvas.isConnected) state.canvas.style.display = 'none';
        });
        return true;
    },

    stop: function() {
        var a = this._active;
        if (!a) return;
        if (a.raf) cancelAnimationFrame(a.raf);
        a.renderer.dispose();
        this._active = null;
    }
};
if (typeof window !== 'undefined') window.WeaponShowcase = WeaponShowcase;
