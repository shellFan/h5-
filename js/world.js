// ===== 场景/相机/灯光/道路 =====

class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.COLORS.sky);
        this.scene.fog = new THREE.Fog(CONFIG.COLORS.fog, 45, 130);

        // 画质自动检测 (0=低 1=中 2=高)
        this.quality = this._detectQuality();

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: this.quality >= 1,
            powerPreference: 'high-performance'
        });
        var maxRatio = this.quality === 0 ? 1 : (this.quality === 1 ? 1.5 : 2);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxRatio));
        this.renderer.shadowMap.enabled = this.quality >= 1;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // V3.6修复: 移除sRGBEncoding(会把所有颜色洗白成粉彩,导致路面过曝/僵尸肤色失真)

        // 相机 (V2.2: FOV 55° 竖屏构图)
        this.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA_FOV || 55, 1, 0.1, 120);

        this._setupLights();
        this._buildRoad();
        this._buildEnvironment();

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    _setupLights() {
        // V3.1: 灯光再平衡。旧参数合计~1.85x导致Lambert钳制发白(路面/草地洗成白蓝)。
        // raw-linear工作流下, 水平面有效光照 ≈ 0.7*0.85 + 0.5*0.6 + 0.15 ≈ 1.1, 保留少量高光余量。
        // 半球光: 天空蓝 -> 地面绿
        const hemi = new THREE.HemisphereLight(0xB0DFFF, 0x8FBC8F, 0.5);
        this.scene.add(hemi);

        // 主方向光 (暖白色, 产生阴影)
        const dir = new THREE.DirectionalLight(0xFFF4E0, 0.72);
        dir.position.set(4, 12, 6);
        dir.castShadow = true;
        dir.shadow.mapSize.set(2048, 2048);
        dir.shadow.camera.left = -8;
        dir.shadow.camera.right = 8;
        dir.shadow.camera.top = 12;
        dir.shadow.camera.bottom = -12;
        dir.shadow.camera.near = 1;
        dir.shadow.camera.far = 35;
        dir.shadow.bias = -0.001;
        this.scene.add(dir);
        this.scene.add(dir.target); // target必须加入场景才能正确更新matrixWorld
        this.sunLight = dir;

        // 补光 (淡蓝色, 从前方照射)
        const fill = new THREE.DirectionalLight(0xC8E0FF, 0.15);
        fill.position.set(-3, 6, -8);
        this.scene.add(fill);
    }

    _buildRoad() {
        const C = CONFIG.COLORS;
        const roadGroup = new THREE.Group();
        this.roadGroup = roadGroup;
        this.roadSegments = [];

        const SEG_LEN = 12;
        const SEG_COUNT = 12;

        // 道路纹理(浅灰紫柏油 + 噪点 + 车道线)
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 256;
        roadCanvas.height = 512;
        const rctx = roadCanvas.getContext('2d');
        // 底色: 灰紫柏油(V3.6: 加深一档,对抗雾色保证路面可读)
        rctx.fillStyle = '#A6A0B8';
        rctx.fillRect(0, 0, 256, 512);
        // 柏油噪点纹理
        for (let i = 0; i < 400; i++) {
            var v = Math.random();
            rctx.fillStyle = v < 0.5 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
            rctx.fillRect(Math.random() * 256, Math.random() * 512, 2 + Math.random() * 3, 2 + Math.random() * 3);
        }
        // 路面裂缝(细微线条)
        rctx.strokeStyle = 'rgba(0,0,0,0.06)';
        rctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            rctx.beginPath();
            var sx = Math.random() * 256;
            var sy = Math.random() * 512;
            rctx.moveTo(sx, sy);
            rctx.lineTo(sx + randRange(-20, 20), sy + randRange(10, 40));
            rctx.stroke();
        }
        // 车道分隔线(白色虚线 - 对齐实际车道边界 X=±1)
        rctx.fillStyle = '#F0EEF5';
        for (let y = 0; y < 512; y += 48) {
            rctx.fillRect(88, y, 5, 30);
            rctx.fillRect(163, y, 5, 30);
        }
        // 路边实线(黄色警示边线)
        rctx.fillStyle = '#E8C840';
        rctx.fillRect(4, 0, 5, 512);
        rctx.fillRect(247, 0, 5, 512);
        const roadTex = new THREE.CanvasTexture(roadCanvas);
        roadTex.wrapS = THREE.RepeatWrapping;
        roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.anisotropy = 4;

        const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });

        // V3.5: 每段合并为3个mesh(路面/路侧结构/草地) — 原9个, drawCalls 108→36
        for (let i = 0; i < SEG_COUNT; i++) {
            const seg = new THREE.Group();

            // 道路面(带纹理)
            const road = new THREE.Mesh(new THREE.PlaneGeometry(6.8, SEG_LEN), roadMat);
            road.rotation.x = -Math.PI / 2;
            road.receiveShadow = true;
            seg.add(road);

            // 路侧结构合并: 人行道×2 + 护栏×2 + 顶盖×2 (顶点色单材质)
            var structGeos = [
                { g: new THREE.BoxGeometry(0.8, 0.1, SEG_LEN), x: -3.8, y: 0.05, z: 0, c: 0xC8C4D0 },
                { g: new THREE.BoxGeometry(0.8, 0.1, SEG_LEN), x: 3.8, y: 0.05, z: 0, c: 0xC8C4D0 },
                { g: new THREE.BoxGeometry(0.25, 0.35, SEG_LEN), x: -4.35, y: 0.17, z: 0, c: 0x8E8AA0 },
                { g: new THREE.BoxGeometry(0.25, 0.35, SEG_LEN), x: 4.35, y: 0.17, z: 0, c: 0x8E8AA0 },
                { g: new THREE.BoxGeometry(0.3, 0.06, SEG_LEN), x: -4.35, y: 0.37, z: 0, c: 0xA8A4B8 },
                { g: new THREE.BoxGeometry(0.3, 0.06, SEG_LEN), x: 4.35, y: 0.37, z: 0, c: 0xA8A4B8 }
            ].map(function(item) {
                item.g.translate(item.x, item.y, item.z);
                return colorize(item.g, item.c);
            });
            var structMesh = new THREE.Mesh(mergeGeometries(structGeos),
                new THREE.MeshLambertMaterial({ vertexColors: true }));
            structMesh.castShadow = true;
            structMesh.receiveShadow = true;
            seg.add(structMesh);

            // 草地(两侧合并)
            var gL = new THREE.PlaneGeometry(20, SEG_LEN);
            gL.rotateX(-Math.PI / 2);
            gL.translate(-14, -0.02, 0);
            var gR = new THREE.PlaneGeometry(20, SEG_LEN);
            gR.rotateX(-Math.PI / 2);
            gR.translate(14, -0.02, 0);
            var groundMesh = new THREE.Mesh(mergeGeometries([colorize(gL, C.grass), colorize(gR, C.grass)]),
                new THREE.MeshLambertMaterial({ vertexColors: true }));
            groundMesh.receiveShadow = true;
            seg.add(groundMesh);

            seg.position.z = -i * SEG_LEN + SEG_LEN;
            this.scene.add(seg);
            this.roadSegments.push({ group: seg, length: SEG_LEN });
        }

        // 起点线(斑马线样式 - 白色横条合并为单mesh)
        var stripeGeos = [];
        for (var si = 0; si < 5; si++) {
            var sg = new THREE.PlaneGeometry(1.0, 0.25);
            sg.rotateX(-Math.PI / 2);
            sg.translate(-2.8 + si * 1.4, 0.012, 0.5);
            stripeGeos.push(colorize(sg, 0xFFFFFF));
        }
        this.scene.add(new THREE.Mesh(mergeGeometries(stripeGeos),
            new THREE.MeshBasicMaterial({ vertexColors: true })));
    }

    _buildEnvironment() {
        this.decoItems = [];   // 可滚动装饰(树/灯/路障等)
        this.buildings = [];   // 远景建筑

        // === 远景城市建筑(低多边形盒子 + 窗户纹理) ===
        this._buildCitySkyline();

        // === 共享材质 ===
        const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x7A5C30 });
        const leafMats = [
            new THREE.MeshLambertMaterial({ color: 0x5CB85C }),
            new THREE.MeshLambertMaterial({ color: 0x4CAF50 }),
            new THREE.MeshLambertMaterial({ color: 0x66BB6A })
        ];
        const lampPoleMat = new THREE.MeshLambertMaterial({ color: 0x4A4A5A });
        const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xFFF8DC });
        const coneMat = new THREE.MeshLambertMaterial({ color: 0xE86020 });
        const coneBaseMat = new THREE.MeshLambertMaterial({ color: 0xD05010 });
        const carBodyMats = [
            new THREE.MeshLambertMaterial({ color: 0xC0392B }),
            new THREE.MeshLambertMaterial({ color: 0x2980B9 }),
            new THREE.MeshLambertMaterial({ color: 0xF1C40F }),
            new THREE.MeshLambertMaterial({ color: 0x7F8C8D })
        ];
        const carGlassMat = new THREE.MeshLambertMaterial({ color: 0x3A4A5A });
        const barrierMat = new THREE.MeshLambertMaterial({ color: 0xE8B020 });
        const barrierStripeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });

        // === 装饰生成函数 ===
        const self = this;

        function makeTree() {
            var tree = new THREE.Group();
            var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.7, 6), treeTrunkMat);
            trunk.position.y = 0.35;
            trunk.castShadow = true;
            tree.add(trunk);
            var lm = leafMats[Math.floor(Math.random() * 3)];
            var leaf = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), lm);
            leaf.position.y = 1.05;
            leaf.scale.y = 1.3;
            leaf.castShadow = true;
            tree.add(leaf);
            var leaf2 = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 6), lm);
            leaf2.position.y = 1.45;
            leaf2.scale.y = 1.2;
            tree.add(leaf2);
            return tree;
        }

        function makeLamp() {
            var lamp = new THREE.Group();
            var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.2, 6), lampPoleMat);
            pole.position.y = 1.1;
            pole.castShadow = true;
            lamp.add(pole);
            var arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.05), lampPoleMat);
            arm.position.set(0.15, 2.15, 0);
            lamp.add(arm);
            var head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.12), lampHeadMat);
            head.position.set(0.3, 2.1, 0);
            lamp.add(head);
            return lamp;
        }

        function makeCone() {
            var cone = new THREE.Group();
            var base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.3), coneBaseMat);
            base.position.y = 0.02;
            cone.add(base);
            var body = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 8), coneMat);
            body.position.y = 0.22;
            body.castShadow = true;
            cone.add(body);
            var stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.06, 8), coneBaseMat);
            stripe.position.y = 0.24;
            cone.add(stripe);
            return cone;
        }

        function makeCar() {
            var car = new THREE.Group();
            var bm = carBodyMats[Math.floor(Math.random() * 4)];
            var body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 1.6), bm);
            body.position.y = 0.3;
            body.castShadow = true;
            car.add(body);
            var cabin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.8), bm);
            cabin.position.set(0, 0.55, -0.1);
            cabin.castShadow = true;
            car.add(cabin);
            var glass = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.18, 0.82), carGlassMat);
            glass.position.set(0, 0.57, -0.1);
            car.add(glass);
            // 轮子
            var wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8);
            var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var wpos = [[-0.45, 0.12, 0.5], [0.45, 0.12, 0.5], [-0.45, 0.12, -0.5], [0.45, 0.12, -0.5]];
            for (var wi = 0; wi < 4; wi++) {
                var wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(wpos[wi][0], wpos[wi][1], wpos[wi][2]);
                car.add(wheel);
            }
            return car;
        }

        function makeBarrier() {
            var barrier = new THREE.Group();
            var body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.15), barrierMat);
            body.position.y = 0.35;
            body.castShadow = true;
            barrier.add(body);
            // 条纹
            for (var si = 0; si < 3; si++) {
                var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.16), barrierStripeMat);
                stripe.position.set(-0.3 + si * 0.3, 0.35, 0);
                barrier.add(stripe);
            }
            // 支腿
            var legGeo = new THREE.BoxGeometry(0.08, 0.2, 0.12);
            var legL = new THREE.Mesh(legGeo, barrierMat);
            legL.position.set(-0.35, 0.1, 0);
            barrier.add(legL);
            var legR = legL.clone();
            legR.position.x = 0.35;
            barrier.add(legR);
            return barrier;
        }

        function makeCrate() {
            var crate = new THREE.Group();
            var box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), crateMat);
            box.position.y = 0.25;
            box.castShadow = true;
            crate.add(box);
            // 边框
            var frameMat = new THREE.MeshLambertMaterial({ color: 0x6B4F20 });
            var f1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.55), frameMat);
            f1.position.y = 0.25;
            crate.add(f1);
            var f2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.55), frameMat);
            f2.position.y = 0.25;
            crate.add(f2);
            return crate;
        }

        // === 沿路布置装饰(两侧交替) ===
        var z = -3;
        var typeIdx = 0;
        var makers = [makeTree, makeLamp, makeCone, makeCar, makeBarrier, makeCrate, makeTree];
        while (z > -170) {
            var side = (typeIdx % 2 === 0) ? -1 : 1;
            var maker = makers[typeIdx % makers.length];
            var item = maker();
            // 位置: 护栏外侧(4.8~7.5)，不遮挡跑道
            var x = side * randRange(4.9, 7.0);
            // 汽车稍远且旋转随机角度
            if (maker === makeCar) {
                x = side * randRange(5.2, 6.5);
                item.rotation.y = randRange(-0.3, 0.3);
            }
            item.position.set(x, 0, z + randRange(-1.5, 1.5));
            var sc = randRange(0.85, 1.15);
            item.scale.setScalar(sc);
            this.scene.add(item);
            this.decoItems.push(item);
            z -= randRange(4, 7);
            typeIdx++;
        }

        // === 云朵 ===
        this.clouds = [];
        const cloudMat = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF, transparent: true, opacity: 0.88
        });
        for (let i = 0; i < 8; i++) {
            const cloud = new THREE.Group();
            for (let j = 0; j < 4; j++) {
                const puff = new THREE.Mesh(
                    new THREE.SphereGeometry(randRange(0.5, 0.9), 8, 6), cloudMat);
                puff.position.set(j * 0.7 - 1, randRange(-0.1, 0.2), randRange(-0.2, 0.2));
                cloud.add(puff);
            }
            cloud.position.set(randRange(-10, 10), randRange(8, 13), -i * 12 - 5);
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
    }

    /** 远景城市天际线(低多边形建筑群) V3.5: 窗户合并为单mesh降低drawCalls */
    _buildCitySkyline() {
        var buildingMats = [
            new THREE.MeshLambertMaterial({ color: 0x8A94A8 }),
            new THREE.MeshLambertMaterial({ color: 0x7A8498 }),
            new THREE.MeshLambertMaterial({ color: 0x9AA4B8 }),
            new THREE.MeshLambertMaterial({ color: 0x6A7488 })
        ];
        var windowMat = new THREE.MeshLambertMaterial({ color: 0xFFF8C8, emissive: 0x888040, emissiveIntensity: 0.35 });

        for (var side = -1; side <= 1; side += 2) {
            for (var i = 0; i < 12; i++) {
                var b = new THREE.Group();
                var w = randRange(1.5, 3.0);
                var h = randRange(3, 8);
                var d = randRange(1.5, 2.5);
                var mat = buildingMats[i % 4];
                var box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
                box.position.y = h / 2;
                b.add(box);
                // 屋顶细节
                var roofMat = new THREE.MeshLambertMaterial({ color: 0x5A6478 });
                var roof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 0.3, d * 0.6), roofMat);
                roof.position.y = h + 0.15;
                b.add(roof);
                // 窗户(V3.5: 收集到数组, 合并为单个mesh — 原每建筑10-30个独立面片)
                var rows = Math.floor(h / 1.2);
                var cols = Math.floor(w / 0.6);
                var winGeos = [];
                for (var r = 0; r < rows; r++) {
                    for (var c = 0; c < cols; c++) {
                        if (Math.random() < 0.4) continue; // 部分窗户亮
                        var wg = new THREE.PlaneGeometry(0.2, 0.3);
                        wg.translate(
                            (c - (cols - 1) / 2) * 0.55,
                            0.8 + r * 1.1,
                            d / 2 + 0.01
                        );
                        winGeos.push(wg);
                    }
                }
                if (winGeos.length) {
                    b.add(new THREE.Mesh(mergeGeometries(winGeos), windowMat));
                }
                // 位置: 远景两侧(距离建筑群)
                var bx = side * randRange(10, 16);
                var bz = -i * 14 - randRange(2, 8);
                b.position.set(bx, 0, bz);
                this.scene.add(b);
                this.buildings.push(b);
            }
        }
    }

    /**
     * 道路/装饰无限滚动 (V3.1: 无状态平铺)
     * 旧实现只在 z > squadZ+阈值 时向后跳一格, 重开(squad回0)后所有段滞留远处,
     * 玩家踩空100+单位 → 大面积空白。改为按 squadZ 直接计算每段归属位置,
     * 重开/复活/传送自动正确。
     */
    updateRoadScroll(squadZ) {
        const SEG_LEN = 12;
        // 路段: 覆盖 [squadZ+18, squadZ-114], 共12段
        const base = Math.ceil((squadZ + SEG_LEN * 1.5) / SEG_LEN) * SEG_LEN;
        for (let i = 0; i < this.roadSegments.length; i++) {
            this.roadSegments[i].group.position.z = base - i * SEG_LEN;
        }

        // 装饰/建筑/云: 双向折返进窗口 [squadZ-170, squadZ+15]
        const span = 170;
        for (const item of this.decoItems) {
            if (item.position.z > squadZ + 15) {
                item.position.z -= span * Math.ceil((item.position.z - (squadZ + 15)) / span);
            } else if (item.position.z < squadZ - (span - 15)) {
                item.position.z += span * Math.ceil((squadZ - (span - 15) - item.position.z) / span);
            }
        }
        for (const building of this.buildings) {
            if (building.position.z > squadZ + 20) {
                building.position.z -= span * Math.ceil((building.position.z - (squadZ + 20)) / span);
            } else if (building.position.z < squadZ - (span - 20)) {
                building.position.z += span * Math.ceil((squadZ - (span - 20) - building.position.z) / span);
            }
        }
        for (const cloud of this.clouds) {
            const cSpan = 110;
            if (cloud.position.z > squadZ + 20) {
                cloud.position.z -= cSpan * Math.ceil((cloud.position.z - (squadZ + 20)) / cSpan);
            } else if (cloud.position.z < squadZ - (cSpan - 20)) {
                cloud.position.z += cSpan * Math.ceil((squadZ - (cSpan - 20) - cloud.position.z) / cSpan);
            }
        }
    }

    /** 相机跟随小队 */
    updateCamera(squadX, squadZ, dt) {
        const cam = this.camera;
        const targetX = squadX * CONFIG.CAMERA_FOLLOW_X;
        const targetPos = new THREE.Vector3(
            targetX,
            squadZ * 0 + CONFIG.CAMERA_OFFSET_Y,
            squadZ + CONFIG.CAMERA_OFFSET_Z
        );
        cam.position.x = damp(cam.position.x, targetPos.x, 6, dt);
        cam.position.y = targetPos.y;
        cam.position.z = damp(cam.position.z, targetPos.z, 8, dt);
        cam.lookAt(targetX * 0.5, 0, squadZ + CONFIG.CAMERA_LOOK_AHEAD);

        // 阴影相机跟随
        this.sunLight.position.set(squadX + 4, 12, squadZ + 6);
        this.sunLight.target.position.set(squadX, 0, squadZ - 2);
        this.sunLight.target.updateMatrixWorld();
    }

    _detectQuality() {
        var dpr = window.devicePixelRatio || 1;
        var area = window.innerWidth * window.innerHeight;
        // 移动端小屏 + 低DPR → 低画质
        if (dpr <= 1 && area < 500000) return 0;
        // 中等设备 → 中画质
        if (dpr <= 1.5 || area < 800000) return 1;
        // 高端设备 → 高画质
        return 2;
    }

    resize() {
        const container = this.canvas.parentElement;
        const w = container.clientWidth;
        const h = container.clientHeight;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}