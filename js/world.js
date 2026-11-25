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
        // V15-ART-003: 移除导致 r149 linear 工作流发灰发暗的 ACESFilmicToneMapping, 恢复通透晴朗的阳光色彩
        this.renderer.toneMapping = THREE.NoToneMapping;

        // 相机 (V2.2: FOV 55° 竖屏构图)
        this.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA_FOV || 55, 1, 0.1, 120);
        this.scene.userData.camera=this.camera;

        this._setupLights();
        if (typeof MilitaryArt !== 'undefined') {
            this.roadGroup = new THREE.Group();
            this.roadGroup.visible = false;
            this.roadSegments = [];
            this.decoItems = [];
            this.buildings = [];
            this.clouds = [];
            this._buildSky();
            if (typeof SceneryV121 !== 'undefined') this._v121Scenery = new SceneryV121(this);
            this._militaryArt = new MilitaryArt(this);
        } else {
            this._buildRoad();
            V42Art.buildEnvironment(this);
            this._buildSky();
            if (typeof SceneryV121 !== 'undefined') this._v121Scenery = new SceneryV121(this);
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    _setupLights() {
        // V3.1: 灯光再平衡。旧参数合计~1.85x导致Lambert钳制发白(路面/草地洗成白蓝)。
        // raw-linear工作流下, 水平面有效光照 ≈ 0.7*0.85 + 0.5*0.6 + 0.15 ≈ 1.1, 保留少量高光余量。
        // 半球光: 晴空天蓝 -> 军绿草地反光 (V15 阳光军事基地)
        const hemi = new THREE.HemisphereLight(0xB8E4FF, 0x6A9650, 0.56);
        this.scene.add(hemi);
        this.hemiLight = hemi; // V13: 主题系统需要调整半球光色/强度

        // 主方向光 (暖阳日光, 清晰立体投影)
        const dir = new THREE.DirectionalLight(0xFFF3D4, 0.92);
        dir.position.set(5, 14, 7);
        dir.castShadow = true;
        // V10.1: 阴影贴图按画质分档 — 中画质(多数手机)2048→1024, GPU负担减半
        var shadowRes = this.quality >= 2 ? 2048 : 1024;
        dir.shadow.mapSize.set(shadowRes, shadowRes);
        dir.shadow.camera.left = -10;
        dir.shadow.camera.right = 10;
        dir.shadow.camera.top = 16;
        dir.shadow.camera.bottom = -14;
        dir.shadow.camera.near = 1;
        dir.shadow.camera.far = 42;
        dir.shadow.bias = -0.0008;
        this.scene.add(dir);
        this.scene.add(dir.target); // target必须加入场景才能正确更新matrixWorld
        this.sunLight = dir;

        // 补光 (晴空冷蓝轮廓补光, 增强玩具模型立体感)
        const fill = new THREE.DirectionalLight(0xC2E4FF, 0.34);
        fill.position.set(-4, 7, -9);
        this.scene.add(fill);
    }

    /** V12视觉: 渐变天空穹顶 — 替代纯色背景, 一张Canvas渐变+BackSide球, 单drawCall, 无光照成本 */
    _buildSky() {
        const cv = document.createElement('canvas');
        cv.width = 16; cv.height = 256;
        const ctx = cv.getContext('2d');
        this._skyCanvas = cv; // V13: 主题系统重绘渐变用
        var g = ctx.createLinearGradient(0, 0, 0, 256);
        // 顶:饱和天蓝 → 中:晴空蓝 → 地平线:暖白(与雾色衔接, 远景建筑融入天际)
        g.addColorStop(0.00, '#4FA3DF');
        g.addColorStop(0.45, '#87CEEB');
        g.addColorStop(0.80, '#C9E6F5');
        g.addColorStop(1.00, '#EAF4FA');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 16, 256);
        // 顶部淡光晕(太阳方位感)
        var sun = ctx.createRadialGradient(8, 36, 2, 8, 36, 90);
        sun.addColorStop(0, 'rgba(255,246,214,0.35)');
        sun.addColorStop(1, 'rgba(255,246,214,0)');
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, 16, 256);
        var tex = new THREE.CanvasTexture(cv);
        var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
        var dome = new THREE.Mesh(new THREE.SphereGeometry(96, 24, 16), mat);
        dome.renderOrder = -10;
        dome.userData.artSource = 'js/world.js:_buildSky() V15 阳光晴空穹顶 16x256';
        this.scene.add(dome);
        this._skyDome = dome;

        // V15: 立体卡通蓬松白云群 (单 InstancedMesh, 1 drawCall, 跟随相机地平线, 清晰可见于远景山脉与要塞上方)
        var cloudSpecs = [
            [-22, 13.5, -62, 4.4, 2.0, 2.8], [-18.2, 14.8, -61.5, 3.6, 2.3, 2.6], [-25.5, 13.2, -62.2, 3.0, 1.7, 2.3],
            [20, 14.0, -64, 4.8, 2.2, 3.0], [24.2, 15.2, -63.5, 3.7, 2.2, 2.6], [16.2, 13.5, -64.2, 3.2, 1.8, 2.4],
            [-4, 15.6, -66, 5.2, 2.2, 3.0], [0.4, 16.6, -65.5, 3.8, 2.4, 2.6], [-8.2, 15.1, -66.2, 3.3, 1.9, 2.4],
            [9, 12.6, -58, 3.2, 1.6, 2.2], [11.8, 13.4, -57.8, 2.5, 1.7, 2.0],
            [-32, 12.2, -56, 3.8, 1.8, 2.4], [32, 12.8, -58, 4.0, 1.9, 2.6]
        ];
        var cloudGeo = new THREE.SphereGeometry(1, 10, 8);
        var cloudMat = new THREE.MeshBasicMaterial({ color: 0xF8FCFF, fog: false, transparent: true, opacity: 0.94 });
        var cloudMesh = new THREE.InstancedMesh(cloudGeo, cloudMat, cloudSpecs.length);
        cloudMesh.frustumCulled = false;
        cloudMesh.renderOrder = -5;
        var dummy = new THREE.Object3D();
        for (var ci = 0; ci < cloudSpecs.length; ci++) {
            var cs = cloudSpecs[ci];
            dummy.position.set(cs[0], cs[1], cs[2]);
            dummy.scale.set(cs[3], cs[4], cs[5]);
            dummy.updateMatrix();
            cloudMesh.setMatrixAt(ci, dummy.matrix);
        }
        cloudMesh.instanceMatrix.needsUpdate = true;
        cloudMesh.userData.artSource = 'js/world.js:_buildSky() V15 卡通蓬松白云群';
        this.scene.add(cloudMesh);
        this._skyClouds = cloudMesh;

        // 雾色向地平线色靠拢(V13: 雾色统一由主题预设决定, 与 applyTheme 一致)
        var T0 = (CONFIG.WORLD_THEMES && (CONFIG.WORLD_THEMES[this._themeApplied || 'default'])) || CONFIG.WORLD_THEMES.default;
        this.scene.fog.color.setHex(T0.fog);
    }

    _buildRoad() {
        const C = CONFIG.COLORS;
        const roadGroup = new THREE.Group();
        this.roadGroup = roadGroup;
        roadGroup.userData.artSource = 'js/world.js:_buildRoad() CanvasTexture 256x512(柏油+车辙+补丁+车道线)';
        this.roadSegments = [];

        const SEG_LEN = 12;
        const SEG_COUNT = 12;

        // 道路纹理(浅灰蓝柏油 + 大色调变化 + 噪点 + 车道线) — V12视觉: 色调分层, 黄边线降饱和
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 256;
        roadCanvas.height = 512;
        const rctx = roadCanvas.getContext('2d');
        // 底色: 灰蓝柏油(V3.6加深保证可读; V12: 略偏蓝青与天空呼应, 去紫味)
        rctx.fillStyle = '#7C8B96';
        rctx.fillRect(0, 0, 256, 512);
        // V12: 大块色调变化(3-4个宽幅纵向淡色带, 打破整段同色)
        var bandTones = ['rgba(255,255,255,0.045)', 'rgba(30,44,56,0.05)', 'rgba(255,255,255,0.03)', 'rgba(30,44,56,0.04)'];
        for (let b = 0; b < 4; b++) {
            rctx.fillStyle = bandTones[b];
            var bx = (b * 67 + randRange(-10, 10)) % 256;
            rctx.fillRect(bx, 0, randRange(46, 80), 512);
        }
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
        // V3.7: 车辙印(两条纵向暗带 — 增加柏油路真实感)
        rctx.fillStyle = 'rgba(28,40,48,0.10)';
        rctx.fillRect(52, 0, 22, 512);
        rctx.fillRect(182, 0, 22, 512);
        // V3.7: 深色补丁(随机圆形沥青修补痕)
        for (let pi = 0; pi < 5; pi++) {
            var px = randRange(30, 226), py = randRange(20, 480), pr = randRange(8, 18);
            rctx.fillStyle = 'rgba(70,64,90,0.1)';
            rctx.beginPath();
            rctx.ellipse(px, py, pr, pr * 0.7, 0, 0, Math.PI * 2);
            rctx.fill();
        }
        // 车道分隔线(白色虚线 - 对齐实际车道边界 X=±1)
        rctx.fillStyle = '#F0EEF5';
        for (let y = 0; y < 512; y += 48) {
            rctx.fillRect(88, y, 5, 30);
            rctx.fillRect(163, y, 5, 30);
        }
        // 路边实线(V12: 降饱和暖黄+暗色衬边 — 原纯黄过艳, 抢戏整个画面)
        rctx.fillStyle = 'rgba(52,58,48,0.35)';
        rctx.fillRect(3, 0, 7, 512);
        rctx.fillRect(246, 0, 7, 512);
        rctx.fillStyle = '#E3C26B';
        rctx.fillRect(4, 0, 5, 512);
        rctx.fillRect(247, 0, 5, 512);
        // Drain covers and repairs make the road read as part of a lived-in street.
        rctx.fillStyle = '#445660';
        rctx.fillRect(12, 350, 19, 34);
        rctx.fillRect(225, 100, 19, 34);
        rctx.strokeStyle = '#8B9A9E';
        for (var drain = 0; drain < 6; drain++) {
            rctx.beginPath();
            rctx.moveTo(14, 354 + drain * 5);
            rctx.lineTo(29, 354 + drain * 5);
            rctx.moveTo(227, 104 + drain * 5);
            rctx.lineTo(242, 104 + drain * 5);
            rctx.stroke();
        }
        const roadTex = new THREE.CanvasTexture(roadCanvas);
        roadTex.wrapS = THREE.RepeatWrapping;
        roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.anisotropy = 4;

        const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
        this._v121RoadMaterial = roadMat;
        this.roadMat = roadMat; // V14: 主题地面纹理切换需要引用

        // V3.5: 每段合并为3个mesh(路面/路侧结构/草地) — 原9个, drawCalls 108→36
        for (let i = 0; i < SEG_COUNT; i++) {
            const seg = new THREE.Group();
            seg.userData.artSource = 'js/world.js:_buildRoad() CanvasTexture 256x512(柏油+车辙+补丁+车道线)';

            // 道路面(带纹理)
            const road = new THREE.Mesh(new THREE.PlaneGeometry(6.8, SEG_LEN), roadMat);
            road.rotation.x = -Math.PI / 2;
            road.receiveShadow = true;
            road.userData.legacyRoad = true;
            seg.add(road);

            // Keep low sidewalks; remove decorative guardrails and caps.
            var structGeos = [
                { g: new THREE.BoxGeometry(0.8, 0.1, SEG_LEN), x: -3.8, y: 0.05, z: 0, c: 0xC5CDC9 },
                { g: new THREE.BoxGeometry(0.8, 0.1, SEG_LEN), x: 3.8, y: 0.05, z: 0, c: 0xC5CDC9 }
            ].map(function(item) {
                item.g.translate(item.x, item.y, item.z);
                return colorize(item.g, item.c);
            });
            var structMesh = new THREE.Mesh(mergeGeometries(structGeos),
                new THREE.MeshLambertMaterial({ vertexColors: true }));
            structMesh.castShadow = true;
            structMesh.receiveShadow = true;
            structMesh.userData.legacyRoad = true;
            seg.add(structMesh);

            var pavement = [];
            for (var side = -1; side <= 1; side += 2) {
                for (var tile = 0; tile < 8; tile++) {
                    var seam = new THREE.BoxGeometry(.78, .012, .025);
                    seam.translate(side * 3.8, .108, -5.25 + tile * 1.5);
                    pavement.push(colorize(seam, 0x879A97));
                    var curb = new THREE.BoxGeometry(.12, .08, .72);
                    curb.translate(side * 3.43, .06, -5.25 + tile * 1.5);
                    pavement.push(colorize(curb, tile % 2 ? 0xE7E4CF : 0x4C6266));
                }
            }
            var pavementMesh = new THREE.Mesh(mergeGeometries(pavement), new THREE.MeshLambertMaterial({ vertexColors: true }));
            pavementMesh.userData.legacyRoad = true;
            seg.add(pavementMesh);

            // 草地(两侧合并) — V12视觉: 修剪条纹明暗交替 + 偶发浅色草斑, 打破大片单色
            var grassBase = new THREE.Color(C.grass);
            var grassLight = grassBase.clone().lerp(new THREE.Color(0xCFFF9E), 0.16);
            var grassGeoList = [];
            for (var side2 = -1; side2 <= 1; side2 += 2) {
                for (var strip = 0; strip < 4; strip++) {
                    var stripGeo = new THREE.PlaneGeometry(20, SEG_LEN / 4);
                    stripGeo.rotateX(-Math.PI / 2);
                    stripGeo.translate(side2 * 14, -0.02, SEG_LEN / 4 * (strip - 1.5));
                    grassGeoList.push(colorize(stripGeo, strip % 2 ? grassLight : grassBase));
                }
                // 偶发浅色草斑(每段每侧1个, 大而淡)
                var patch = new THREE.CircleGeometry(randRange(0.9, 1.7), 7);
                patch.rotateX(-Math.PI / 2);
                patch.translate(side2 * randRange(6.5, 10.5), -0.015, randRange(-4, 4));
                grassGeoList.push(colorize(patch, grassLight.clone().lerp(grassBase, 0.35)));
            }
            var grassMat = new THREE.MeshLambertMaterial({ vertexColors: true });
            // V14.3: 草地噪点贴图(与顶点色相乘, 提升地面材质质量; 共享单张纹理)
            if (typeof V42Art !== 'undefined' && V42Art.getGrassTexture) grassMat.map = V42Art.getGrassTexture();
            var groundMesh = new THREE.Mesh(mergeGeometries(grassGeoList), grassMat);
            groundMesh.receiveShadow = true;
            seg.add(groundMesh);

            seg.position.z = -i * SEG_LEN + SEG_LEN;
            roadGroup.add(seg);
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
        var startStripe = new THREE.Mesh(mergeGeometries(stripeGeos), new THREE.MeshBasicMaterial({ vertexColors: true }));
        startStripe.userData.legacyRoad = true;
        roadGroup.add(startStripe);
        this.scene.add(roadGroup);
    }


    // V11 QA: 移除无调用的 _buildCitySkyline()(V4.2环境由art-v42.js接管, 此方法全库零引用成为死代码;
    // this.buildings 仍保留 — art-v42.js重置它, 滚动循环遍历空数组无副作用)

    /**
     * 道路/装饰无限滚动 (V3.1: 无状态平铺)
     * 旧实现只在 z > squadZ+阈值 时向后跳一格, 重开(squad回0)后所有段滞留远处,
     * 玩家踩空100+单位 → 大面积空白。改为按 squadZ 直接计算每段归属位置,
     * 重开/复活/传送自动正确。
     */
    updateRoadScroll(squadZ) {
        if(this._v42Environment && this._v42Environment.root.visible)this._v42Environment.update(squadZ);
        if(this._v121Scenery)this._v121Scenery.update(squadZ);
        if(this._militaryArt)this._militaryArt.update(squadZ);
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
    // V4.0: 动态构图 — 相机随军团规模升高后移(sqrt曲线), 军团壮观但不拥挤
    // 12人: 6.1/7.8(清晰) | 100人: +1.2 | 300人: +2.0 | 500人: +2.6(全景)
    updateCamera(squadX, squadZ, dt, squadCount, formationDepth) {
        const cam = this.camera;
        var n=squadCount||1,cols=n<=1?1:n<=12?Math.ceil(Math.sqrt(n)):n<=100?6:n<=300?11:13;
        var spacing=n<=12?.72:n<=100?.74:n<=300?.50:.46;
        var depth=formationDepth===undefined ? Math.max(0,Math.ceil(n/cols)-1)*spacing : formationDepth;
        var cf = clamp(Math.sqrt(clamp((squadCount || 1) / 500, 0, 1)) * 1.2, 0, 1);
        if (this._camScale === undefined) this._camScale = cf;
        this._camScale = damp(this._camScale, cf, 3, dt);   // 人数变化时平滑过渡
        // V5.1修复: formationDepth 未平滑直接进相机 — 人数每次增减(被杀/吸血/穿门)相机前后跳,
        // 是"人物向后移动的视觉效果"的主因之一。改为阻尼平滑。
        if (this._depthSmooth === undefined) this._depthSmooth = depth;
        this._depthSmooth = damp(this._depthSmooth, depth, 5.5, dt);
        var sDepth = this._depthSmooth;
        // V15-ART-006: 稳定投影包围盒自适应相机 (护盾/状态切换零突兀缩放, 36人宽度占屏65%-86%, 底部86%-93%)
        var halfW = (squadCount > 1) ? Math.min(2.45, 0.50 + Math.sqrt(squadCount) * 0.255) : 0.45;
        var aspect = (cam.aspect && cam.aspect > 0.2) ? cam.aspect : (390 / 844);
        var halfVRad = (cam.fov * Math.PI / 180) * 0.5;
        var halfHRad = Math.atan(Math.tan(halfVRad) * aspect);
        var minDistForWidth = (halfW / 0.74) / Math.max(0.22, Math.tan(halfHRad));
        var baseOffZ = 8.2 + this._camScale * 1.8 + sDepth * 0.78;
        var offZ = Math.max(baseOffZ, minDistForWidth * 0.82);
        var offY = 5.7 + this._camScale * 2.75 + Math.max(0, offZ - baseOffZ) * 0.45;
        var lookAhead = CONFIG.CAMERA_LOOK_AHEAD - this._camScale * 1.5 + sDepth * 0.68;

        const targetX = squadX * CONFIG.CAMERA_FOLLOW_X;
        const targetPos = new THREE.Vector3(
            targetX,
            offY,
            squadZ + offZ
        );
        cam.position.x = damp(cam.position.x, targetPos.x, 6, dt);
        cam.position.y = damp(cam.position.y, targetPos.y, 5, dt);
        cam.position.z = damp(cam.position.z, targetPos.z, 8, dt);
        // Game Feel: Trauma^2 平滑多频正弦震屏(真实dt衰减, 不随机乱抖, 轻击微震重击有力)
        if (this._shakeT > 0.001) {
            this._shakeT = Math.max(0, this._shakeT - dt * (this._shakeDecay || 2.4));
            this._shakePhase = (this._shakePhase || 0) + dt * 34.0;
            var sAmp = this._shakeAmp * (this._shakeT * this._shakeT);
            cam.position.x += Math.sin(this._shakePhase * 1.7) * sAmp;
            cam.position.y += Math.sin(this._shakePhase * 2.3) * sAmp * 0.55;
        }
        cam.lookAt(targetX * 0.5, 0, squadZ + lookAhead);
        // V12视觉: 天空穹顶与V15白云跟随相机(XZ), 保持地平线稳定
        if (this._skyDome) this._skyDome.position.set(cam.position.x, 0, cam.position.z);
        if (this._skyClouds) this._skyClouds.position.set(cam.position.x * 0.4, 0, cam.position.z);

        // 阴影相机跟随
        this.sunLight.position.set(squadX + 4, 12, squadZ + 6);
        this.sunLight.target.position.set(squadX, 0, squadZ - 2);
        this.sunLight.target.updateMatrixWorld();
    }

    /** V6.0: 关卡主题 — 场景换装(天空/雾/灯光), 'default'还原
     *  V13: 泛化为 CONFIG.WORLD_THEMES 预设查表 — 10 关全覆盖(城市时段族+末日/洞穴/机械/要塞),
     *       天穹渐变按主题重绘(16x256 Canvas, 单drawCall不变), 环境实例染色目标泛化。
     *       仅表现层; 关卡结构/刷怪/胜负不受影响。'apocalypse' 保持与旧 APOCALYPSE_THEME 完全一致。 */
    applyTheme(themeName) {
        var themes = CONFIG.WORLD_THEMES || {};
        var T = themes[themeName] || themes.default;
        if (!T) return;
        if (this._skyCanvas && this._paintSky) {
            this._paintSky(T.sky);
            this.scene.background = null;
        } else {
            this.scene.background = new THREE.Color(CONFIG.COLORS.sky);
        }
        this.scene.fog = new THREE.Fog(T.fog, T.fogNear, T.fogFar);
        if (this._skyDome) this._skyDome.material.color.setHex(T.domeTint || 0xFFFFFF);
        this.sunLight.color.setHex(T.sunColor);
        this.sunLight.intensity = T.sunIntensity;
        if (this.hemiLight) {
            this.hemiLight.color.setHex(T.hemiSky);
            this.hemiLight.groundColor.setHex(T.hemiGround);
            this.hemiLight.intensity = T.hemiIntensity;
        }
        // 环境实例材质染色(草地/建筑向主题色过渡; __themeBaseHex 记录初始色, 幂等)
        if (this._v42Environment && this._v42Environment.root) {
            this._v42Environment.root.traverse(function(o) {
                if (o.isInstancedMesh && o.material && o.material.color && !o.material.__noThemeTint) {
                    if (o.material.__themeBaseHex === undefined) o.material.__themeBaseHex = o.material.color.getHex();
                    var base = new THREE.Color(o.material.__themeBaseHex);
                    var target = new THREE.Color(T.envTint).lerp(base, 0.35);
                    o.material.color.copy(base.lerp(target, 0.55));
                    o.material.needsUpdate = true;
                }
            });
        }
        // V14: 主题道具包可见性切换 + 地面纹理切换(柏油/龟裂/岩面/金属板/混凝土)
        if (this._v42Environment && V42Art.setEnvironmentTheme) {
            V42Art.setEnvironmentTheme(this._v42Environment, themeName);
        }
        if (this.roadMat && V42Art.getGroundTexture) {
            var groundTex = V42Art.getGroundTexture(T.ground || 'asphalt');
            if (this.roadMat.map !== groundTex) {
                this.roadMat.map = groundTex;
                this.roadMat.needsUpdate = true;
            }
        }
        this._themeApplied = themeName;
        if(this._v121Scenery)this._v121Scenery.setTheme(themeName);
        if(this._militaryArt)this._militaryArt.setTheme(themeName);
    }

    /** V13: 按主题重绘天穹渐变(与 _buildSky 同规格: 4 停靠点 + 顶部太阳光晕) */
    _paintSky(stops) {
        if (!this._skyCanvas || !stops || stops.length < 4) return;
        var ctx = this._skyCanvas.getContext('2d');
        var g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0.00, stops[0]);
        g.addColorStop(0.45, stops[1]);
        g.addColorStop(0.80, stops[2]);
        g.addColorStop(1.00, stops[3]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 16, 256);
        var sun = ctx.createRadialGradient(8, 36, 2, 8, 36, 90);
        sun.addColorStop(0, 'rgba(255,246,214,0.35)');
        sun.addColorStop(1, 'rgba(255,246,214,0)');
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, 16, 256);
        if (this._skyDome && this._skyDome.material && this._skyDome.material.map) {
            this._skyDome.material.map.needsUpdate = true;
        }
    }

    /** V4.0: 触发屏幕震动(amp≈世界单位幅度) */
    shake(amp, duration) {
        if (this._shakeDisabled === undefined) {
            // V12: 震动偏好走 Platform.storage(h5 兼容旧裸键 pz_shake_off; 微信端无 localStorage 也可存取)
            var _shakeOff = '0';
            if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
                _shakeOff = Platform.storage.getLegacy('pz_shake_off', '0');
            } else {
                try { _shakeOff = localStorage.getItem('pz_shake_off') || '0'; } catch (e) {}
            }
            this._shakeDisabled = (_shakeOff === '1' || _shakeOff === 1);
        }
        if (this._shakeDisabled) return; // V10 QA修复: 设置页屏幕震动开关此前只写不读
        var strength = amp || 0.3;
        if ((this._shakeAmp || 0) * (this._shakeT || 0) > strength) return;
        this._shakeT = 1;
        this._shakeAmp = strength;
        this._shakeDecay = 1 / (duration || .45);
    }

    _detectQuality() {
        var requested = new URLSearchParams(window.location.search).get('quality');
        if (requested !== null && /^[012]$/.test(requested)) return Number(requested);
        // V12: 用户画质设置生效(原 pz_quality 只写不读, 设置页按钮形同虚设)
        if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
            var savedQ = Platform.storage.getLegacy('pz_quality', null);
            if (savedQ !== null && /^[012]$/.test(String(savedQ))) return Number(savedQ);
        }
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
        // V11 QA修复[P3]: 容器缺失守卫(canvas未挂载时parentElement为null)
        const container = this.canvas.parentElement;
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

}
// V10.1: 移除无调用的 World.render()(game.js 直接 renderer.render)
