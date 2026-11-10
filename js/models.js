// ===== 3D模型工厂 =====
// 所有模型面朝 -Z 方向(前方)

/** 创建蓝色Q版小士兵合并几何体(用于InstancedMesh) */
function createSoldierGeometry() {
    const p = [];
    const C = CONFIG.COLORS;

    // 头(大圆球 - Q版大头)
    p.push(colorize(new THREE.SphereGeometry(0.25, 16, 12), C.skin)
        .translate(0, 0.85, 0));
    // 头盔(蓝色半球)
    p.push(colorize(new THREE.SphereGeometry(0.29, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), C.soldierHelmet)
        .translate(0, 0.86, 0));
    // 头盔顶饰(白色小球)
    p.push(colorize(new THREE.SphereGeometry(0.05, 8, 6), 0xFFFFFF)
        .translate(0, 1.12, 0));
    // 头盔帽檐
    p.push(colorize(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16), C.soldierVest)
        .translate(0, 0.78, 0));
    // 眼睛(大而圆 - Q版)
    p.push(colorize(new THREE.SphereGeometry(0.048, 8, 6), 0x1a1a2e)
        .translate(-0.09, 0.85, -0.21));
    p.push(colorize(new THREE.SphereGeometry(0.048, 8, 6), 0x1a1a2e)
        .translate(0.09, 0.85, -0.21));
    // 眼睛高光(白色小点 - 精神)
    p.push(colorize(new THREE.SphereGeometry(0.017, 6, 4), 0xFFFFFF)
        .translate(-0.075, 0.87, -0.25));
    p.push(colorize(new THREE.SphereGeometry(0.017, 6, 4), 0xFFFFFF)
        .translate(0.105, 0.87, -0.25));
    // 身体(蓝色胶囊 - 圆胖)
    p.push(colorize(new THREE.CapsuleGeometry(0.19, 0.18, 6, 12), C.soldierBlue)
        .translate(0, 0.42, 0));
    // 战术背心(深蓝环带)
    p.push(colorize(new THREE.CylinderGeometry(0.2, 0.2, 0.13, 14), C.soldierVest)
        .translate(0, 0.46, 0));
    // 背包
    p.push(colorize(new THREE.BoxGeometry(0.2, 0.17, 0.1), 0x3A6B8C)
        .translate(0, 0.45, 0.17));
    // 左臂(微张)
    p.push(colorize(new THREE.CapsuleGeometry(0.055, 0.13, 4, 8), C.soldierBlue)
        .rotateZ(0.3).translate(-0.24, 0.44, 0.02));
    // 右臂(微张)
    p.push(colorize(new THREE.CapsuleGeometry(0.055, 0.13, 4, 8), C.soldierBlue)
        .rotateZ(-0.3).translate(0.24, 0.44, 0.02));
    // 左腿
    p.push(colorize(new THREE.CapsuleGeometry(0.065, 0.09, 4, 8), 0x2C3E50)
        .translate(-0.09, 0.1, 0));
    // 右腿
    p.push(colorize(new THREE.CapsuleGeometry(0.065, 0.09, 4, 8), 0x2C3E50)
        .translate(0.09, 0.1, 0));
    // 靴子
    p.push(colorize(new THREE.BoxGeometry(0.13, 0.07, 0.17), 0x1a1a2e)
        .translate(-0.09, 0.035, -0.02));
    p.push(colorize(new THREE.BoxGeometry(0.13, 0.07, 0.17), 0x1a1a2e)
        .translate(0.09, 0.035, -0.02));
    // 枪身
    p.push(colorize(new THREE.BoxGeometry(0.08, 0.1, 0.17), 0x4A4A4A)
        .translate(0.14, 0.5, -0.09));
    // 枪管
    p.push(colorize(new THREE.CylinderGeometry(0.022, 0.022, 0.13, 8), 0x3A3A3A)
        .rotateX(Math.PI / 2).translate(0.14, 0.52, -0.22));
    // 枪口
    p.push(colorize(new THREE.CylinderGeometry(0.03, 0.03, 0.035, 8), 0x2A2A2A)
        .rotateX(Math.PI / 2).translate(0.14, 0.52, -0.3));

    return mergeGeometries(p);
}

/** 创建僵尸模型(返回Group) */
function createZombieModel(type) {
    const cfg = CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal;
    const group = new THREE.Group();
    const baseColor = cfg.color;
    const c = new THREE.Color(baseColor);

    const bodyMat = new THREE.MeshLambertMaterial({ color: baseColor });
    const darkMat = new THREE.MeshLambertMaterial({
        color: c.clone().multiplyScalar(0.65)
    });
    const clothMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A }); // 破烂衣服
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFEE00 });
    const clawMat = new THREE.MeshLambertMaterial({ color: 0xE8E0D0 });

    const thin = (type === 'fast') ? 0.75 : 1.0; // 快速僵尸更瘦

    // 上半身组(整体前倾 - 驼背姿态)
    const torso = new THREE.Group();
    torso.rotation.x = 0.2;
    group.add(torso);

    // 头
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), bodyMat);
    head.position.y = 0.7;
    head.scale.x = thin;
    head.castShadow = true;
    torso.add(head);

    // 眉骨(深色横条 - 凶相)
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.24 * thin, 0.045, 0.06), darkMat);
    brow.position.set(0, 0.77, -0.15);
    torso.add(brow);

    // 眼睛(黄色发光)
    const eyeGeo = new THREE.SphereGeometry(0.042, 8, 6);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.07 * thin, 0.72, -0.17);
    torso.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.07 * thin;
    torso.add(eyeR);

    // 嘴部
    const mouth = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0x3a0a0a })
    );
    mouth.position.set(0, 0.63, -0.17);
    mouth.scale.set(thin * 1.2, 0.5, 0.6);
    torso.add(mouth);

    // 身体(破烂衣服)
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16 * thin, 0.2, 6, 10), clothMat);
    body.position.y = 0.36;
    body.castShadow = true;
    torso.add(body);
    // 露出的胸口皮肤
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.12 * thin, 10, 8), bodyMat);
    chest.position.set(0, 0.34, -0.07);
    chest.scale.set(1, 1.2, 0.6);
    torso.add(chest);

    // 手臂前伸(僵尸姿势)
    const armGeo = new THREE.CapsuleGeometry(0.042, 0.13, 4, 8);
    const armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-0.17 * thin, 0.46, -0.14);
    armL.rotation.x = -1.3;
    torso.add(armL);
    const armR = armL.clone();
    armR.position.x = 0.17 * thin;
    torso.add(armR);

    // 爪子(锥形 - 锋利)
    const clawGeo = new THREE.ConeGeometry(0.035, 0.1, 6);
    const clawL = new THREE.Mesh(clawGeo, clawMat);
    clawL.position.set(-0.17 * thin, 0.46, -0.28);
    clawL.rotation.x = -Math.PI / 2;
    torso.add(clawL);
    const clawR = clawL.clone();
    clawR.position.x = 0.17 * thin;
    torso.add(clawR);

    // 腿
    const legGeo = new THREE.CapsuleGeometry(0.05 * thin, 0.1, 4, 8);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-0.08 * thin, 0.08, 0);
    group.add(legL);
    const legR = legL.clone();
    legR.position.x = 0.08 * thin;
    group.add(legR);

    // 脚(前伸)
    const footGeo = new THREE.BoxGeometry(0.1 * thin, 0.06, 0.16);
    const footL = new THREE.Mesh(footGeo, darkMat);
    footL.position.set(-0.08 * thin, 0.03, -0.03);
    group.add(footL);
    const footR = footL.clone();
    footR.position.x = 0.08 * thin;
    group.add(footR);

    // 盾僵尸: 大圆盾
    if (type === 'shield') {
        const shieldMat = new THREE.MeshLambertMaterial({ color: 0x9AA0A8 });
        const shieldRim = new THREE.MeshLambertMaterial({ color: 0x6B7280 });
        const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 18), shieldMat);
        shield.rotation.x = Math.PI / 2;
        shield.position.set(0, 0.42, -0.32);
        shield.castShadow = true;
        group.add(shield);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 8, 18), shieldRim);
        rim.position.set(0, 0.42, -0.34);
        group.add(rim);
    }

    // 吐痰僵尸: 大嘴
    if (type === 'spitter') {
        mouth.scale.set(thin * 1.6, 0.8, 0.8);
        mouth.material = new THREE.MeshBasicMaterial({ color: 0x1a4a1a });
    }

    // Boss: 角 + 肩甲 + 胸甲
    if (type === 'boss') {
        const hornMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const hornGeo = new THREE.ConeGeometry(0.07, 0.24, 8);
        const hornL = new THREE.Mesh(hornGeo, hornMat);
        hornL.position.set(-0.14, 0.88, 0);
        hornL.rotation.z = 0.35;
        torso.add(hornL);
        const hornR = hornL.clone();
        hornR.position.x = 0.14;
        hornR.rotation.z = -0.35;
        torso.add(hornR);
        // 肩甲
        const shoulderGeo = new THREE.SphereGeometry(0.13, 10, 8);
        const shL = new THREE.Mesh(shoulderGeo, darkMat);
        shL.position.set(-0.24, 0.52, 0);
        torso.add(shL);
        const shR = shL.clone();
        shR.position.x = 0.24;
        torso.add(shR);
        // 胸甲板(金属感)
        const plateMat = new THREE.MeshLambertMaterial({ color: 0x6B6B6B });
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.06), plateMat);
        plate.position.set(0, 0.42, -0.14);
        torso.add(plate);
    }

    group.scale.setScalar(cfg.scale);
    return group;
}

/** 创建状态门模型(返回Group) */
function createGateModel(gateData, gateWidth) {
    const group = new THREE.Group();
    const isPositive = gateData.op === 'add' || gateData.op === 'mul' || gateData.op === 'buff';

    // 门框颜色: 绿色增益 / 红色减益
    const frameColor = isPositive ? 0x34D399 : 0xF87171;
    const glassColor = isPositive ? 0x6EE7B7 : 0xFCA5A5;

    const frameMat = new THREE.MeshLambertMaterial({ color: frameColor });
    const frameDark = new THREE.MeshLambertMaterial({
        color: new THREE.Color(frameColor).multiplyScalar(0.7)
    });
    const glassMat = new THREE.MeshPhongMaterial({
        color: glassColor,
        transparent: true,
        opacity: 0.3,
        shininess: 120,
        specular: 0xFFFFFF,
        side: THREE.DoubleSide
    });

    var w = gateWidth || 1.5; // 门宽(2门段加宽至无缝衔接)
    var h = 2.3; // 门高

    // 左右立柱
    var postGeo = new THREE.BoxGeometry(0.14, h, 0.14);
    var postL = new THREE.Mesh(postGeo, frameMat);
    postL.position.set(-w / 2, h / 2, 0);
    postL.castShadow = true;
    group.add(postL);
    var postR = postL.clone();
    postR.position.x = w / 2;
    group.add(postR);

    // 顶梁
    var topBar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.16, 0.14), frameMat);
    topBar.position.y = h;
    topBar.castShadow = true;
    group.add(topBar);

    // 底梁
    var botBar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.08, 0.14), frameDark);
    botBar.position.y = 0.04;
    group.add(botBar);

    // 玻璃面板
    var glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.14, h - 0.2), glassMat);
    glass.position.y = h / 2;
    group.add(glass);
    group.userData.glass = glass;

    // 数值文字 (Sprite宽度按文字长度自适应)
    var textFill = gateData.op === 'add' ? '#FFFFFF' :
                   gateData.op === 'mul' ? '#FDE047' : '#93C5FD';
    var tex = createTextTexture(gateData.label, {
        fontSize: 95,
        fill: textFill,
        stroke: isPositive ? '#065F46' : '#7F1D1D',
        strokeWidth: 14
    });
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.position.y = h + 0.45;
    // 按纹理宽高比缩放，保证文字不变形且完整显示
    var aspect = tex.image.width / tex.image.height;
    var baseH = 0.55;
    var baseW = baseH * aspect;
    // 限制最大宽度避免遮挡相邻门
    if (baseW > 2.0) { baseW = 2.0; baseH = baseW / aspect; }
    sprite.scale.set(baseW, baseH, 1);
    group.add(sprite);
    group.userData.label = sprite;

    return group;
}