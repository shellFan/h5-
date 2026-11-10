// ===== 场景/相机/灯光/道路 =====

class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.COLORS.sky);
        this.scene.fog = new THREE.Fog(CONFIG.COLORS.fog, 25, 60);

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // 相机
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

        this._setupLights();
        this._buildRoad();
        this._buildEnvironment();

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    _setupLights() {
        // 半球光: 天空蓝 -> 地面绿
        const hemi = new THREE.HemisphereLight(0xB0DFFF, 0x8FBC8F, 0.75);
        this.scene.add(hemi);

        // 主方向光 (暖白色, 产生阴影)
        const dir = new THREE.DirectionalLight(0xFFF4E0, 0.85);
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
        const fill = new THREE.DirectionalLight(0xC8E0FF, 0.25);
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

        // 道路纹理(浅灰带车道线)
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 256;
        roadCanvas.height = 512;
        const rctx = roadCanvas.getContext('2d');
        // 底色
        rctx.fillStyle = '#C8CDD4';
        rctx.fillRect(0, 0, 256, 512);
        // 微噪点
        for (let i = 0; i < 200; i++) {
            rctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.03) + ')';
            rctx.fillRect(Math.random() * 256, Math.random() * 512, 3, 3);
        }
        // 车道分隔线(白色虚线)
        rctx.fillStyle = '#E8ECF0';
        for (let y = 0; y < 512; y += 48) {
            rctx.fillRect(84, y, 4, 28);
            rctx.fillRect(168, y, 4, 28);
        }
        const roadTex = new THREE.CanvasTexture(roadCanvas);
        roadTex.wrapS = THREE.RepeatWrapping;
        roadTex.wrapT = THREE.RepeatWrapping;

        const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
        const edgeMat = new THREE.MeshLambertMaterial({ color: C.roadEdge });
        const grassMat = new THREE.MeshLambertMaterial({ color: C.grass });

        for (let i = 0; i < SEG_COUNT; i++) {
            const seg = new THREE.Group();

            // 道路面
            const road = new THREE.Mesh(new THREE.PlaneGeometry(6.8, SEG_LEN), roadMat);
            road.rotation.x = -Math.PI / 2;
            road.receiveShadow = true;
            seg.add(road);

            // 左右路缘(蓝白色)
            const edgeGeo = new THREE.BoxGeometry(0.3, 0.12, SEG_LEN);
            const edgeL = new THREE.Mesh(edgeGeo, edgeMat);
            edgeL.position.set(-3.55, 0.06, 0);
            edgeL.receiveShadow = true;
            seg.add(edgeL);
            const edgeR = edgeL.clone();
            edgeR.position.x = 3.55;
            seg.add(edgeR);

            // 左右草地
            const grassGeo = new THREE.PlaneGeometry(8, SEG_LEN);
            const grassL = new THREE.Mesh(grassGeo, grassMat);
            grassL.rotation.x = -Math.PI / 2;
            grassL.position.set(-8, -0.01, 0);
            grassL.receiveShadow = true;
            seg.add(grassL);
            const grassR = grassL.clone();
            grassR.position.x = 8;
            seg.add(grassR);

            seg.position.z = -i * SEG_LEN + SEG_LEN;
            this.scene.add(seg);
            this.roadSegments.push({ group: seg, length: SEG_LEN });
        }

        // 起点线(白色横条)
        const startLine = new THREE.Mesh(
            new THREE.PlaneGeometry(6.8, 0.3),
            new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
        );
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.set(0, 0.01, 0.5);
        this.scene.add(startLine);
    }

    _buildEnvironment() {
        // 简洁几何装饰: 低多边形树 + 云
        this.decoItems = [];
        const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        const leafMats = [
            new THREE.MeshLambertMaterial({ color: 0x5CB85C }),
            new THREE.MeshLambertMaterial({ color: 0x4CAF50 }),
            new THREE.MeshLambertMaterial({ color: 0x66BB6A })
        ];

        for (let i = 0; i < 30; i++) {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.6, 6), treeTrunkMat);
            trunk.position.y = 0.3;
            trunk.castShadow = true;
            tree.add(trunk);
            const leafMat = leafMats[i % 3];
            const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 7), leafMat);
            leaf.position.y = 1.1;
            leaf.castShadow = true;
            tree.add(leaf);
            const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 7), leafMat);
            leaf2.position.y = 1.6;
            tree.add(leaf2);

            const side = i % 2 === 0 ? -1 : 1;
            tree.position.set(
                side * randRange(5.0, 9.5),
                0,
                -i * 5 - randRange(2, 6)
            );
            const s = randRange(0.7, 1.3);
            tree.scale.setScalar(s);
            this.scene.add(tree);
            this.decoItems.push(tree);
        }

        // 云朵 (白色低多边形球组)
        this.clouds = [];
        const cloudMat = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF, transparent: true, opacity: 0.85
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

    /** 道路无限滚动: 将身后路段移到前方 */
    updateRoadScroll(squadZ) {
        const SEG_LEN = 12;
        for (const seg of this.roadSegments) {
            if (seg.group.position.z > squadZ + SEG_LEN * 2) {
                seg.group.position.z -= SEG_LEN * this.roadSegments.length;
            }
        }
        for (const tree of this.decoItems) {
            if (tree.position.z > squadZ + 15) {
                tree.position.z -= 160;
            }
        }
        for (const cloud of this.clouds) {
            if (cloud.position.z > squadZ + 20) {
                cloud.position.z -= 110;
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