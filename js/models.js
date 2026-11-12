// V4.1: Soldier geometry now comes exclusively from assets/models/soldier/*.glb.
// This factory retains the existing enemy/gate art until separate visual acceptance.

/** 创建僵尸模型(返回Group) - 6种类型差异化轮廓 */
function createZombieModel(type) {
    const cfg = CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal;
    const group = new THREE.Group();
    const C = CONFIG.COLORS;

    // 材质工厂(每类型独立配色)
    const skinColor = cfg.color;
    const c = new THREE.Color(skinColor);
    const bodyMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const darkMat = new THREE.MeshLambertMaterial({ color: c.clone().multiplyScalar(0.6) });
    const clothMat = new THREE.MeshLambertMaterial({ color: C.zombieCloth });
    const clothDarkMat = new THREE.MeshLambertMaterial({ color: 0x4A3D2E });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFEE00 });
    const clawMat = new THREE.MeshLambertMaterial({ color: 0xE8E0D0 });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x8A8F98 });
    const metalDarkMat = new THREE.MeshLambertMaterial({ color: 0x5A5F68 });

    // 体型参数(类型差异化)
    const thin = (type === 'fast') ? 0.72 : (type === 'shield') ? 1.25 : 1.0;
    const big = (type === 'shield' || type === 'boss');

    // 上半身组(整体前倾 - 驼背姿态)
    const torso = new THREE.Group();
    torso.rotation.x = 0.22;
    group.add(torso);

    // === 头部(圆润大头 - Q版恐怖) ===
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), bodyMat);
    head.position.y = 0.7;
    head.scale.x = thin;
    head.castShadow = true;
    torso.add(head);

    // 眉骨(深色横条 - 凶相)
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.26 * thin, 0.05, 0.07), darkMat);
    brow.position.set(0, 0.77, -0.16);
    brow.rotation.x = -0.15;
    torso.add(brow);

    // 眼睛(黄色发光 - 凹陷感)
    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 6);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.075 * thin, 0.72, -0.18);
    torso.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.075 * thin;
    torso.add(eyeR);

    // 嘴部(血盆大口)
    const mouth = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0x2a0505 })
    );
    mouth.position.set(0, 0.62, -0.18);
    mouth.scale.set(thin * 1.3, 0.55, 0.65);
    torso.add(mouth);
    // 牙齿(白色小方块)
    const toothMat = new THREE.MeshBasicMaterial({ color: 0xF0E8D0 });
    for (var ti = 0; ti < 3; ti++) {
        var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.015), toothMat);
        tooth.position.set((ti - 1) * 0.03 * thin, 0.635, -0.22);
        torso.add(tooth);
    }

    // === 身体(破烂衣服 + 露出皮肤) ===
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17 * thin, 0.2, 6, 10), clothMat);
    body.position.y = 0.36;
    body.castShadow = true;
    torso.add(body);
    // 露出的胸口皮肤
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.13 * thin, 10, 8), bodyMat);
    chest.position.set(0, 0.34, -0.08);
    chest.scale.set(1, 1.2, 0.6);
    torso.add(chest);
    // 衣服破口(深色不规则块)
    const rip = new THREE.Mesh(new THREE.BoxGeometry(0.14 * thin, 0.06, 0.02), clothDarkMat);
    rip.position.set(0.03, 0.3, -0.16);
    torso.add(rip);

    // === 手臂前伸(僵尸姿势) ===
    const armGeo = new THREE.CapsuleGeometry(0.045, 0.14, 4, 8);
    const armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-0.18 * thin, 0.46, -0.14);
    armL.rotation.x = -1.35;
    torso.add(armL);
    const armR = armL.clone();
    armR.position.x = 0.18 * thin;
    torso.add(armR);

    // 爪子(锥形 - 锋利)
    const clawGeo = new THREE.ConeGeometry(0.038, 0.11, 6);
    const clawL = new THREE.Mesh(clawGeo, clawMat);
    clawL.position.set(-0.18 * thin, 0.46, -0.3);
    clawL.rotation.x = -Math.PI / 2;
    torso.add(clawL);
    const clawR = clawL.clone();
    clawR.position.x = 0.18 * thin;
    torso.add(clawR);

    // === 腿脚 ===
    const legGeo = new THREE.CapsuleGeometry(0.052 * thin, 0.1, 4, 8);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-0.085 * thin, 0.09, 0);
    group.add(legL);
    const legR = legL.clone();
    legR.position.x = 0.085 * thin;
    group.add(legR);
    // 脚(前伸 - 赤脚)
    const footGeo = new THREE.BoxGeometry(0.1 * thin, 0.05, 0.17);
    const footL = new THREE.Mesh(footGeo, bodyMat);
    footL.position.set(-0.085 * thin, 0.025, -0.03);
    group.add(footL);
    const footR = footL.clone();
    footR.position.x = 0.085 * thin;
    group.add(footR);

    // === 类型特化 ===

    // 快速僵尸: 红色棒球帽 + 更瘦轮廓
    if (type === 'fast') {
        const capMat = new THREE.MeshLambertMaterial({ color: 0xE74C3C });
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), capMat);
        cap.position.y = 0.72;
        cap.scale.x = thin;
        torso.add(cap);
        // 帽檐
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.2 * thin, 0.02, 0.1), capMat);
        brim.position.set(0, 0.7, -0.2);
        torso.add(brim);
        // 耳机式破烂装饰
        const earL = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.015, 6, 10), clothDarkMat);
        earL.position.set(-0.18 * thin, 0.68, 0);
        torso.add(earL);
    }

    // 盾僵尸: 金属头盔 + 大圆盾 + 护甲
    if (type === 'shield') {
        // 金属头盔
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), metalMat);
        helmet.position.y = 0.71;
        helmet.castShadow = true;
        torso.add(helmet);
        // 面甲缝(深色横条)
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3 * thin, 0.04, 0.03), metalDarkMat);
        visor.position.set(0, 0.73, -0.2);
        torso.add(visor);
        // 肩甲(金属半球)
        const shL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), metalMat);
        shL.position.set(-0.24, 0.5, 0);
        shL.castShadow = true;
        torso.add(shL);
        const shR = shL.clone();
        shR.position.x = 0.24;
        torso.add(shR);
        // 胸甲板
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.26 * thin, 0.18, 0.05), metalMat);
        plate.position.set(0, 0.42, -0.15);
        torso.add(plate);
        // 大圆盾(前方)
        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 18), metalMat);
        shield.rotation.x = Math.PI / 2;
        shield.position.set(0, 0.42, -0.34);
        shield.castShadow = true;
        group.add(shield);
        // 盾铆钉(装饰)
        const rivetMat = new THREE.MeshLambertMaterial({ color: 0xB0B5BC });
        for (var ri = 0; ri < 6; ri++) {
            var ra = (ri / 6) * Math.PI * 2;
            var rivet = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), rivetMat);
            rivet.position.set(Math.cos(ra) * 0.28, 0.42 + Math.sin(ra) * 0.28, -0.37);
            group.add(rivet);
        }
        // 盾边缘环
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 8, 18), metalDarkMat);
        rim.position.set(0, 0.42, -0.36);
        group.add(rim);
    }

    // 分裂僵尸: 紫绿变异 + 体表脓包
    if (type === 'split') {
        // 变异脓包(紫色球体)
        const cystMat = new THREE.MeshLambertMaterial({ color: 0xB07CC4, emissive: 0x4A2070 });
        for (var ci = 0; ci < 4; ci++) {
            var cyst = new THREE.Mesh(new THREE.SphereGeometry(randRange(0.04, 0.07), 8, 6), cystMat);
            cyst.position.set(randRange(-0.12, 0.12) * thin, randRange(0.28, 0.48), -0.1 + randRange(-0.04, 0.04));
            torso.add(cyst);
        }
        // 头部触角
        const tentMat = new THREE.MeshLambertMaterial({ color: 0x9B59B6 });
        var tent = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.15, 6), tentMat);
        tent.position.set(-0.1, 0.9, 0);
        tent.rotation.z = 0.4;
        torso.add(tent);
        var tent2 = tent.clone();
        tent2.position.x = 0.1;
        tent2.rotation.z = -0.4;
        torso.add(tent2);
    }

    // 吐痰僵尸: 发光绿色大嘴 + 胸部毒囊
    if (type === 'spitter') {
        // 发光绿色大嘴
        mouth.scale.set(thin * 1.8, 0.9, 0.9);
        mouth.material = new THREE.MeshBasicMaterial({ color: 0x22DD44 });
        // 毒液滴落(绿色小球)
        const droolMat = new THREE.MeshBasicMaterial({ color: 0x44FF66 });
        var drool = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), droolMat);
        drool.position.set(0, 0.56, -0.2);
        torso.add(drool);
        // 胸部毒囊(半透明绿色)
        const sacMat = new THREE.MeshLambertMaterial({ color: 0x3AA855, emissive: 0x1A6030 });
        var sac = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), sacMat);
        sac.position.set(0, 0.32, -0.12);
        sac.scale.set(1, 0.8, 0.7);
        torso.add(sac);
        // 头部绿色斑点
        const spotMat = new THREE.MeshLambertMaterial({ color: 0x2E8B4A });
        for (var si = 0; si < 3; si++) {
            var spot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), spotMat);
            spot.position.set(randRange(-0.12, 0.12) * thin, randRange(0.68, 0.82), -0.14);
            spot.scale.set(1, 0.5, 0.5);
            torso.add(spot);
        }
    }

    // 精英巨尸: 体型魁梧 + 金属肩甲 + 巨型拳头 + 红眼 (V3.6新增)
    if (type === 'elite') {
        // 红色发光眼睛
        eyeL.material = new THREE.MeshBasicMaterial({ color: 0xFF3333 });
        eyeR.material = eyeL.material;
        eyeL.scale.setScalar(1.2);
        eyeR.scale.setScalar(1.2);
        // 金属头盔
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), metalMat);
        helmet.position.y = 0.71;
        helmet.castShadow = true;
        torso.add(helmet);
        // 莫西干头冠(深红)
        const crestMat = new THREE.MeshLambertMaterial({ color: 0x8B2020 });
        var crest = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.3), crestMat);
        crest.position.set(0, 0.95, 0);
        torso.add(crest);
        // 厚重肩甲
        const shGeo = new THREE.SphereGeometry(0.14, 10, 8);
        const eshL = new THREE.Mesh(shGeo, metalMat);
        eshL.position.set(-0.27, 0.52, 0);
        eshL.castShadow = true;
        torso.add(eshL);
        const eshR = eshL.clone();
        eshR.position.x = 0.27;
        torso.add(eshR);
        // 胸甲
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.05), metalMat);
        plate.position.set(0, 0.42, -0.15);
        torso.add(plate);
        // 巨型拳头(替换爪子)
        const fistMat = new THREE.MeshLambertMaterial({ color: skinColor });
        const fistGeo = new THREE.SphereGeometry(0.09, 8, 6);
        clawL.visible = false;
        clawR.visible = false;
        const efistL = new THREE.Mesh(fistGeo, fistMat);
        efistL.position.set(-0.2, 0.42, -0.3);
        efistL.scale.setScalar(1.4);
        torso.add(efistL);
        const efistR = efistL.clone();
        efistR.position.x = 0.2;
        torso.add(efistR);
        // 手臂加粗
        armL.scale.set(1.35, 1.15, 1.35);
        armR.scale.set(1.35, 1.15, 1.35);
        // 腰带
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.07, 12), metalDarkMat);
        belt.position.y = 0.22;
        group.add(belt);
    }

    // Boss: 巨型 + 深红皮肤 + 暗金属重甲 + 红眼 + 巨角 (V3.2: 独立轮廓, 告别白色圆球)
    if (type === 'boss') {
        // Boss专属材质: 深红皮肤 + 暗黑金属
        const bossSkinMat = new THREE.MeshLambertMaterial({ color: 0x9C3B32 });
        const bossSkinDarkMat = new THREE.MeshLambertMaterial({ color: 0x6E241E });
        const bossArmorMat = new THREE.MeshLambertMaterial({ color: 0x454B5A });
        const bossArmorDarkMat = new THREE.MeshLambertMaterial({ color: 0x2E3340 });
        // 头部换深红皮肤
        head.material = bossSkinMat;
        brow.material = bossSkinDarkMat;

        // 红色发光大眼睛(替换黄色, 加大)
        eyeL.material = new THREE.MeshBasicMaterial({ color: 0xFF2222 });
        eyeR.material = eyeL.material;
        eyeL.scale.setScalar(1.7);
        eyeR.scale.setScalar(1.7);
        eyeL.position.z = -0.19;
        eyeR.position.z = -0.19;

        // 重型金属头盔(暗色, 不全包头顶留出深红皮肤)
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.245, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), bossArmorMat);
        helmet.position.y = 0.75;
        helmet.castShadow = true;
        torso.add(helmet);
        // 头盔面甲(深色T型)
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.04), bossArmorDarkMat);
        visor.position.set(0, 0.745, -0.21);
        torso.add(visor);
        // 头盔巨角(深色弯角, 加大加弯)
        const hornMat = bossArmorDarkMat;
        const hornGeo = new THREE.ConeGeometry(0.075, 0.42, 8);
        const hornL = new THREE.Mesh(hornGeo, hornMat);
        hornL.position.set(-0.2, 0.98, 0.02);
        hornL.rotation.z = 0.55;
        torso.add(hornL);
        const hornR = hornL.clone();
        hornR.position.x = 0.2;
        hornR.rotation.z = -0.55;
        torso.add(hornR);

        // 厚重肩甲(暗金属大半球 + 尖刺)
        const shGeo = new THREE.SphereGeometry(0.17, 12, 8);
        const bshL = new THREE.Mesh(shGeo, bossArmorMat);
        bshL.position.set(-0.31, 0.52, 0);
        bshL.castShadow = true;
        torso.add(bshL);
        const bshR = bshL.clone();
        bshR.position.x = 0.31;
        torso.add(bshR);
        const spikeGeo = new THREE.ConeGeometry(0.05, 0.16, 6);
        const spikeL = new THREE.Mesh(spikeGeo, bossArmorDarkMat);
        spikeL.position.set(-0.31, 0.7, 0);
        torso.add(spikeL);
        const spikeR = spikeL.clone();
        spikeR.position.x = 0.31;
        torso.add(spikeR);

        // 胸甲板(暗金属) + 红色发光核心
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.06), bossArmorMat);
        plate.position.set(0, 0.42, -0.16);
        torso.add(plate);
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xFF3333 }));
        core.position.set(0, 0.42, -0.21);
        torso.add(core);
        // 核心外圈(暗环)
        const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 12), bossArmorDarkMat);
        coreRing.position.set(0, 0.42, -0.2);
        torso.add(coreRing);

        // 巨大手臂(替换普通手臂, 深红皮肤)
        armL.material = bossSkinMat;
        armR.material = bossSkinMat;
        armL.scale.setScalar(1.5);
        armR.scale.setScalar(1.5);
        armL.position.x = -0.26;
        armR.position.x = 0.26;
        clawL.material = bossSkinDarkMat;
        clawR.material = bossSkinDarkMat;
        clawL.scale.setScalar(1.6);
        clawR.scale.setScalar(1.6);
        clawL.position.x = -0.26;
        clawR.position.x = 0.26;

        // 腰部金属带 + 腿部护甲
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 12), bossArmorDarkMat);
        belt.position.y = 0.22;
        group.add(belt);
        legL.material = bossSkinDarkMat;
        legR.material = bossSkinDarkMat;
    }

    group.scale.setScalar(cfg.scale);
    // V3.6修复: 模型正面朝-Z, 而僵尸向+Z进攻小队 → 旋转180°让脸/武器朝向玩家
    group.rotation.y = Math.PI;
    return group;
}

// ===== V3.5 性能优化: 大众僵尸几何合并批处理 =====
// 每只僵尸从 ~20 个独立 mesh → 2 个合并 mesh (Lambert体 + 发光件), 全类型共享2个材质
// drawCalls 实测 ~900 → ~150 (30只僵尸场景)
// 受击反馈由 emissive 闪烁改为缩放冲击(共享材质无法按实例闪烁)
var __zombieMergedCache = {};
var __zombieMergedMat = {
    lambert: new THREE.MeshLambertMaterial({ vertexColors: true }),
    basic: new THREE.MeshBasicMaterial({ vertexColors: true })
};

function bakeGroupToMergedGeos(group) {
    group.updateMatrixWorld(true);
    var lambertGeos = [];
    var basicGeos = [];
    group.traverse(function(node) {
        if (!node.isMesh || !node.geometry) return;
        var geo = node.geometry.clone();
        geo.applyMatrix4(node.matrixWorld);
        colorize(geo, node.material.color.getHex());
        // 发光件(自身发光/纯色 UI 件)入 basic 桶, 其余入 lambert 桶
        var isGlow = node.material.isMeshBasicMaterial ||
            (node.material.emissive && node.material.emissiveIntensity > 0.3);
        if (isGlow) basicGeos.push(geo);
        else lambertGeos.push(geo);
    });
    return {
        lambert: lambertGeos.length ? mergeGeometries(lambertGeos) : null,
        basic: basicGeos.length ? mergeGeometries(basicGeos) : null
    };
}

/** 创建合并版大众僵尸(返回Group: 1-2个mesh, 共享几何+材质; 缩放由外部visScale施加) */
function createZombieMerged(type) {
    var cached = __zombieMergedCache[type];
    if (!cached) {
        var raw = createZombieModel(type);
        raw.scale.setScalar(1); // 归一化: 缩放不烘焙, 由Enemy按cfg.scale施加
        raw.updateMatrixWorld(true);
        cached = bakeGroupToMergedGeos(raw);
        __zombieMergedCache[type] = cached;
    }
    var group = new THREE.Group();
    if (cached.lambert) {
        var lm = new THREE.Mesh(cached.lambert, __zombieMergedMat.lambert);
        lm.castShadow = true;
        group.add(lm);
    }
    if (cached.basic) {
        group.add(new THREE.Mesh(cached.basic, __zombieMergedMat.basic));
    }
    group.userData.merged = true;
    return group;
}

/** 创建状态门模型(返回Group) - 稀有度发光边框 */
/** 创建门玻璃纹理(参考gate-panel.svg设计: 渐变玻璃+高光弧线+边框光) */
function createGateGlassTexture(hexColor) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 192;
    var ctx = c.getContext('2d');
    var col = new THREE.Color(hexColor);
    var r = Math.round(col.r * 255), g = Math.round(col.g * 255), b = Math.round(col.b * 255);

    // 玻璃渐变(上亮下暗 - 参考gate-panel.svg的glass渐变)
    var grad = ctx.createLinearGradient(0, 0, 0, 192);
    grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0.55)');
    grad.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ',0.35)');
    grad.addColorStop(1, 'rgba(' + Math.round(r*0.3) + ',' + Math.round(g*0.3) + ',' + Math.round(b*0.3) + ',0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 192);

    // 顶部高光弧线(参考gate-panel.svg的白色弧线)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(20, 42);
    ctx.quadraticCurveTo(128, 16, 236, 42);
    ctx.stroke();

    // 侧边立柱暗影(参考gate-panel.svg的左右立柱)
    ctx.fillStyle = 'rgba(48,73,107,0.7)';
    ctx.fillRect(0, 0, 18, 192);
    ctx.fillRect(238, 0, 18, 192);
    // 立柱高光边
    ctx.fillStyle = 'rgba(139,216,255,0.4)';
    ctx.fillRect(16, 0, 3, 192);
    ctx.fillRect(237, 0, 3, 192);

    // 外发光边框
    ctx.strokeStyle = 'rgba(' + Math.min(255, r+60) + ',' + Math.min(255, g+60) + ',' + Math.min(255, b+60) + ',0.6)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 184);

    var tex = new THREE.CanvasTexture(c);
    return tex;
}

function createGateModel(gateData, gateWidth) {
    const group = new THREE.Group();
    const R = CONFIG.GATE_RARITY;

    // 稀有度: add=common(蓝) / mul=epic(金) / buff=rare(紫) / risk=danger(红) — V3.3
    var rarity = 'common';
    if (gateData.op === 'mul') rarity = 'epic';
    else if (gateData.op === 'buff') rarity = 'rare';
    else if (gateData.op === 'risk') rarity = 'danger';
    var rc = R[rarity] || R.common;

    var frameColor = rc.frame;
    var glassColor = rc.glass;
    var glowColor = rc.glow;

    const frameMat = new THREE.MeshLambertMaterial({ color: frameColor, emissive: glowColor, emissiveIntensity: 0.35 });
    const frameDark = new THREE.MeshLambertMaterial({
        color: new THREE.Color(frameColor).multiplyScalar(0.6),
        emissive: glowColor, emissiveIntensity: 0.15
    });
    const glassTex = createGateGlassTexture(glassColor);
    const glassMat = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        map: glassTex,
        transparent: true,
        opacity: 0.55,
        shininess: 140,
        specular: 0xFFFFFF,
        side: THREE.DoubleSide,
        emissive: glowColor,
        emissiveIntensity: 0.12,
        depthWrite: false
    });

    var w = gateWidth || 1.8;
    var h = 2.0;

    // V3.7: 立体边框 — 深度0.22柱体 + 柱础/柱头, 替代薄板方框
    var postGeo = new THREE.BoxGeometry(0.18, h, 0.22);
    var postL = new THREE.Mesh(postGeo, frameMat);
    postL.position.set(-w / 2, h / 2, 0);
    postL.castShadow = true;
    group.add(postL);
    var postR = postL.clone();
    postR.position.x = w / 2;
    group.add(postR);
    // 柱础(底部加宽) + 柱头
    var baseGeo = new THREE.BoxGeometry(0.26, 0.14, 0.3);
    var baseL = new THREE.Mesh(baseGeo, frameDark);
    baseL.position.set(-w / 2, 0.07, 0);
    group.add(baseL);
    var baseR = baseL.clone();
    baseR.position.x = w / 2;
    group.add(baseR);
    var capGeo = new THREE.BoxGeometry(0.24, 0.12, 0.28);
    var capL = new THREE.Mesh(capGeo, frameDark);
    capL.position.set(-w / 2, h - 0.06, 0);
    group.add(capL);
    var capR = capL.clone();
    capR.position.x = w / 2;
    group.add(capR);

    // V3.7: 发光内沿条(玻璃四周的亮边 — 核心质感件)
    var edgeMat = new THREE.MeshBasicMaterial({ color: glowColor });
    var edgeSideGeo = new THREE.BoxGeometry(0.045, h - 0.2, 0.045);
    var edgeL = new THREE.Mesh(edgeSideGeo, edgeMat);
    edgeL.position.set(-w / 2 + 0.1, h / 2, -0.1);
    group.add(edgeL);
    var edgeR = edgeL.clone();
    edgeR.position.x = w / 2 - 0.1;
    group.add(edgeR);
    var edgeTop = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.045, 0.045), edgeMat);
    edgeTop.position.set(0, h - 0.14, -0.1);
    group.add(edgeTop);
    var edgeBot = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.045, 0.045), edgeMat);
    edgeBot.position.set(0, 0.14, -0.1);
    group.add(edgeBot);

    // 立柱顶部装饰球(发光)
    var orbGeo = new THREE.SphereGeometry(0.09, 10, 8);
    var orbL = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({ color: glowColor }));
    orbL.position.set(-w / 2, h + 0.08, 0);
    group.add(orbL);
    var orbR = orbL.clone();
    orbR.position.x = w / 2;
    group.add(orbR);

    // 顶梁(加厚) + 顶部纹章板
    var topBar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, 0.18, 0.2), frameMat);
    topBar.position.y = h;
    topBar.castShadow = true;
    group.add(topBar);
    var emblem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.05, 12),
        new THREE.MeshBasicMaterial({ color: glowColor })
    );
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, h + 0.16, 0);
    group.add(emblem);

    // 底梁(发光地台)
    var botBar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.06, 0.32), frameDark);
    botBar.position.y = 0.03;
    group.add(botBar);

    // 底部柔和发光(平面) + V3.7地面投影环
    var glowGeo = new THREE.PlaneGeometry(w + 0.6, 0.8);
    var glowMat = new THREE.MeshBasicMaterial({
        color: glowColor, transparent: true, opacity: 0.18,
        side: THREE.DoubleSide, depthWrite: false
    });
    var glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.02;
    group.add(glow);
    group.userData.glow = glow;
    var ring = new THREE.Mesh(
        new THREE.RingGeometry(w * 0.42, w * 0.5, 24),
        new THREE.MeshBasicMaterial({
            color: glowColor, transparent: true, opacity: 0.3,
            side: THREE.DoubleSide, depthWrite: false
        })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.025;
    group.add(ring);
    group.userData.ring = ring;

    // 玻璃面板(带厚度感: 略微后退)
    var glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, h - 0.26), glassMat);
    glass.position.set(0, h / 2, -0.02);
    group.add(glass);
    group.userData.glass = glass;

    // 玻璃内文字(半透明大号 - 刻在门上) V3.6: buff门改用★标记
    // V3.3: 风险门用"!"图标, 其余buff用★
    var innerText = gateData.op === 'add' ? '+' : (gateData.op === 'mul' ? '×' : (gateData.op === 'risk' ? '!' : '★'));
    var innerTex = createTextTexture(innerText, {
        fontSize: 130,
        fill: '#FFFFFF',
        stroke: '#' + new THREE.Color(glowColor).getHexString(),
        strokeWidth: 12
    });
    var innerSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: innerTex, transparent: true, opacity: 0.5, depthWrite: false
    }));
    innerSprite.position.y = h * 0.45;
    var innerAspect = innerTex.image.width / innerTex.image.height;
    innerSprite.scale.set(0.8 * innerAspect, 0.8, 1);
    group.add(innerSprite);

    // 顶部数值文字 (Sprite宽度按文字长度自适应) V3.6: 加大字号保证远处可读
    var textFill = '#FFFFFF';
    var textStroke = '#' + new THREE.Color(glowColor).multiplyScalar(0.5).getHexString();
    var tex = createTextTexture(gateData.label, {
        fontSize: 150,
        fill: textFill,
        stroke: textStroke,
        strokeWidth: 18
    });
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.position.y = h + 0.46;
    var aspect = tex.image.width / tex.image.height;
    var baseH = 0.66;
    var baseW = baseH * aspect;
    if (baseW > 2.0) { baseW = 2.0; baseH = baseW / aspect; }
    sprite.scale.set(baseW, baseH, 1);
    group.add(sprite);
    group.userData.label = sprite;

    return group;
}