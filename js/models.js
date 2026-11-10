// ===== 3D模型工厂 V2 (商业级卡通美术) =====
// 所有模型面朝 -Z 方向(前方)

/** 创建五角星平面几何体(用于头盔徽标) */
function createStarGeometry(outerR, innerR) {
    var shape = new THREE.Shape();
    for (var i = 0; i < 10; i++) {
        var r = i % 2 === 0 ? outerR : innerR;
        var a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        var x = Math.cos(a) * r;
        var y = Math.sin(a) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
}

/** 创建蓝色Q版小士兵合并几何体(用于InstancedMesh)
 *  比例: 头30% / 身体40% / 腿20% / 头盔配件10%
 */
function createSoldierGeometry() {
    const p = [];
    const C = CONFIG.COLORS;

    // === 腿部(20%: 0~0.24) ===
    // 靴子(深蓝黑)
    p.push(colorize(new THREE.BoxGeometry(0.14, 0.08, 0.2), 0x1a2040)
        .translate(-0.09, 0.04, -0.02));
    p.push(colorize(new THREE.BoxGeometry(0.14, 0.08, 0.2), 0x1a2040)
        .translate(0.09, 0.04, -0.02));
    // 腿(深蓝裤)
    p.push(colorize(new THREE.CapsuleGeometry(0.068, 0.08, 4, 8), C.soldierPants)
        .translate(-0.09, 0.15, 0));
    p.push(colorize(new THREE.CapsuleGeometry(0.068, 0.08, 4, 8), C.soldierPants)
        .translate(0.09, 0.15, 0));

    // === 身体(40%: 0.24~0.72) ===
    // 躯干(亮蓝军服 - 圆胖胶囊)
    p.push(colorize(new THREE.CapsuleGeometry(0.2, 0.2, 6, 12), C.soldierBlue)
        .translate(0, 0.5, 0));
    // 战术背心(深蓝环带)
    p.push(colorize(new THREE.CylinderGeometry(0.215, 0.215, 0.14, 14), C.soldierVest)
        .translate(0, 0.54, 0));
    // 腰带(深色)
    p.push(colorize(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 14), 0x1a2040)
        .translate(0, 0.36, 0));
    // 棕色背包
    p.push(colorize(new THREE.BoxGeometry(0.22, 0.18, 0.11), 0x8B6914)
        .translate(0, 0.52, 0.18));
    // 背包扣(浅棕)
    p.push(colorize(new THREE.BoxGeometry(0.24, 0.03, 0.12), 0xA07830)
        .translate(0, 0.45, 0.18));
    // 左臂(亮蓝 - 微张跑动姿势)
    p.push(colorize(new THREE.CapsuleGeometry(0.058, 0.14, 4, 8), C.soldierBlue)
        .rotateZ(0.35).translate(-0.25, 0.5, 0.02));
    // 右臂(持枪前伸)
    p.push(colorize(new THREE.CapsuleGeometry(0.058, 0.14, 4, 8), C.soldierBlue)
        .rotateZ(-0.15).translate(0.22, 0.5, -0.04));
    // 白色手套(左)
    p.push(colorize(new THREE.SphereGeometry(0.065, 8, 6), 0xF0F0F0)
        .translate(-0.28, 0.38, 0.04));
    // 白色手套(右 - 握枪)
    p.push(colorize(new THREE.SphereGeometry(0.065, 8, 6), 0xF0F0F0)
        .translate(0.16, 0.46, -0.1));

    // === 头部(30%: 0.72~1.08) ===
    // 大圆头(肤色 - Q版大头)
    p.push(colorize(new THREE.SphereGeometry(0.27, 16, 12), C.skin)
        .translate(0, 0.9, 0));
    // 眼睛(大而黑 - Q版)
    p.push(colorize(new THREE.SphereGeometry(0.052, 8, 6), 0x1a1a2e)
        .translate(-0.095, 0.92, -0.23));
    p.push(colorize(new THREE.SphereGeometry(0.052, 8, 6), 0x1a1a2e)
        .translate(0.095, 0.92, -0.23));
    // 眼睛高光(白色小点 - 精神)
    p.push(colorize(new THREE.SphereGeometry(0.019, 6, 4), 0xFFFFFF)
        .translate(-0.08, 0.94, -0.27));
    p.push(colorize(new THREE.SphereGeometry(0.019, 6, 4), 0xFFFFFF)
        .translate(0.11, 0.94, -0.27));
    // 腮红(淡粉 - 卡通可爱)
    p.push(colorize(new THREE.SphereGeometry(0.035, 6, 4), 0xFFB8B8)
        .translate(-0.18, 0.85, -0.19));
    p.push(colorize(new THREE.SphereGeometry(0.035, 6, 4), 0xFFB8B8)
        .translate(0.18, 0.85, -0.19));

    // === 头盔(10%: 0.82~1.14) ===
    // 蓝色圆润头盔(半球)
    p.push(colorize(new THREE.SphereGeometry(0.295, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), C.soldierHelmet)
        .translate(0, 0.9, 0));
    // 头盔帽檐(深蓝环)
    p.push(colorize(new THREE.CylinderGeometry(0.3, 0.3, 0.045, 16), C.soldierVest)
        .translate(0, 0.8, 0));
    // 白色五角星(头盔正面徽标)
    p.push(colorize(createStarGeometry(0.075, 0.032), 0xFFFFFF)
        .rotateY(Math.PI).translate(0, 0.97, -0.27));
    // 头盔顶饰(白色小球)
    p.push(colorize(new THREE.SphereGeometry(0.045, 8, 6), 0xFFFFFF)
        .translate(0, 1.18, 0));

    // === 枪械(迷你自动步枪) ===
    // 枪身(深灰)
    p.push(colorize(new THREE.BoxGeometry(0.07, 0.1, 0.18), 0x3a3a3a)
        .translate(0.16, 0.5, -0.14));
    // 枪管
    p.push(colorize(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 8), 0x2a2a2a)
        .rotateX(Math.PI / 2).translate(0.16, 0.52, -0.28));
    // 枪口(略粗 - 制退器)
    p.push(colorize(new THREE.CylinderGeometry(0.032, 0.032, 0.04, 8), 0x1a1a1a)
        .rotateX(Math.PI / 2).translate(0.16, 0.52, -0.36));
    // 弹匣
    p.push(colorize(new THREE.BoxGeometry(0.05, 0.12, 0.06), 0x2a2a2a)
        .translate(0.16, 0.42, -0.12));

    return mergeGeometries(p);
}

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

    // Boss: 巨型 + 金属头盔 + 厚重肩甲 + 红眼 + 巨大手臂
    if (type === 'boss') {
        // 红色发光眼睛(替换黄色)
        eyeL.material = new THREE.MeshBasicMaterial({ color: 0xFF2222 });
        eyeR.material = eyeL.material;
        eyeL.scale.setScalar(1.4);
        eyeR.scale.setScalar(1.4);

        // 大型金属头盔(全罩)
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), metalMat);
        helmet.position.y = 0.72;
        helmet.castShadow = true;
        torso.add(helmet);
        // 头盔面甲(深色)
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.04), metalDarkMat);
        visor.position.set(0, 0.74, -0.22);
        torso.add(visor);
        // 头盔角(黑色弯角)
        const hornMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const hornGeo = new THREE.ConeGeometry(0.06, 0.28, 8);
        const hornL = new THREE.Mesh(hornGeo, hornMat);
        hornL.position.set(-0.16, 0.92, 0.02);
        hornL.rotation.z = 0.4;
        torso.add(hornL);
        const hornR = hornL.clone();
        hornR.position.x = 0.16;
        hornR.rotation.z = -0.4;
        torso.add(hornR);

        // 厚重肩甲(大金属半球)
        const shGeo = new THREE.SphereGeometry(0.16, 12, 8);
        const bshL = new THREE.Mesh(shGeo, metalMat);
        bshL.position.set(-0.3, 0.52, 0);
        bshL.castShadow = true;
        torso.add(bshL);
        const bshR = bshL.clone();
        bshR.position.x = 0.3;
        torso.add(bshR);
        // 肩甲尖刺
        const spikeGeo = new THREE.ConeGeometry(0.04, 0.12, 6);
        const spikeL = new THREE.Mesh(spikeGeo, metalDarkMat);
        spikeL.position.set(-0.3, 0.68, 0);
        torso.add(spikeL);
        const spikeR = spikeL.clone();
        spikeR.position.x = 0.3;
        torso.add(spikeR);

        // 胸甲板(大金属板)
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.06), metalMat);
        plate.position.set(0, 0.42, -0.16);
        torso.add(plate);
        // 胸甲核心(红色发光)
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), 
            new THREE.MeshBasicMaterial({ color: 0xFF3333 }));
        core.position.set(0, 0.42, -0.2);
        torso.add(core);

        // 巨大手臂(替换普通手臂)
        armL.scale.setScalar(1.5);
        armR.scale.setScalar(1.5);
        armL.position.x = -0.26;
        armR.position.x = 0.26;
        clawL.scale.setScalar(1.6);
        clawR.scale.setScalar(1.6);
        clawL.position.x = -0.26;
        clawR.position.x = 0.26;

        // 腰部金属带
        const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 12), metalDarkMat);
        belt.position.y = 0.22;
        group.add(belt);
    }

    group.scale.setScalar(cfg.scale);
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

    // 稀有度: add=common(蓝) / mul=epic(金) / buff=rare(紫)
    var rarity = 'common';
    if (gateData.op === 'mul') rarity = 'epic';
    else if (gateData.op === 'buff') rarity = 'rare';
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

    // 左右立柱(带发光)
    var postGeo = new THREE.BoxGeometry(0.16, h, 0.16);
    var postL = new THREE.Mesh(postGeo, frameMat);
    postL.position.set(-w / 2, h / 2, 0);
    postL.castShadow = true;
    group.add(postL);
    var postR = postL.clone();
    postR.position.x = w / 2;
    group.add(postR);

    // 立柱顶部装饰球(发光)
    var orbGeo = new THREE.SphereGeometry(0.09, 10, 8);
    var orbL = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({ color: glowColor }));
    orbL.position.set(-w / 2, h + 0.08, 0);
    group.add(orbL);
    var orbR = orbL.clone();
    orbR.position.x = w / 2;
    group.add(orbR);

    // 顶梁
    var topBar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, 0.18, 0.16), frameMat);
    topBar.position.y = h;
    topBar.castShadow = true;
    group.add(topBar);

    // 底梁(发光地台)
    var botBar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.06, 0.3), frameDark);
    botBar.position.y = 0.03;
    group.add(botBar);

    // 底部柔和发光(平面)
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

    // 玻璃面板
    var glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.16, h - 0.24), glassMat);
    glass.position.y = h / 2;
    group.add(glass);
    group.userData.glass = glass;

    // 玻璃内文字(半透明大号 - 刻在门上)
    var innerText = gateData.op === 'add' ? '+' : (gateData.op === 'mul' ? 'x' : 'B');
    var innerTex = createTextTexture(innerText, {
        fontSize: 130,
        fill: '#FFFFFF',
        stroke: '#' + new THREE.Color(glowColor).getHexString(),
        strokeWidth: 12
    });
    var innerSprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
        map: innerTex, transparent: true, opacity: 0.35, depthWrite: false 
    }));
    innerSprite.position.y = h * 0.45;
    var innerAspect = innerTex.image.width / innerTex.image.height;
    innerSprite.scale.set(0.8 * innerAspect, 0.8, 1);
    group.add(innerSprite);

    // 顶部数值文字 (Sprite宽度按文字长度自适应)
    var textFill = '#FFFFFF';
    var textStroke = '#' + new THREE.Color(glowColor).multiplyScalar(0.5).getHexString();
    var tex = createTextTexture(gateData.label, {
        fontSize: 100,
        fill: textFill,
        stroke: textStroke,
        strokeWidth: 16
    });
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.position.y = h + 0.42;
    var aspect = tex.image.width / tex.image.height;
    var baseH = 0.5;
    var baseW = baseH * aspect;
    if (baseW > 1.6) { baseW = 1.6; baseH = baseW / aspect; }
    sprite.scale.set(baseW, baseH, 1);
    group.add(sprite);
    group.userData.label = sprite;

    return group;
}