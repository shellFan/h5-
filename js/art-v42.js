// ===== V4.2 presentation layer: gates, city dressing and UI composition =====
(function (global) {
    'use strict';

    var V42Art = {};
    var TAU = Math.PI * 2;

    var GATE_STYLES = {
        add:  { kind: 'common', icon: 'helmet', title: '增援', frame: 0x26D96B, dark: 0x0C4A26, light: 0xB8FFCE, glass: 0x22E06B, hex: '#26D96B' },
        mul:  { kind: 'epic',   icon: 'star',   title: '倍增', frame: 0xB44CFF, dark: 0x3F146B, light: 0xF2C6FF, glass: 0xC45CFF, hex: '#B44CFF' },
        buff: { kind: 'rare',   icon: 'rifle',  title: '火力', frame: 0x2898FF, dark: 0x0E3A73, light: 0xACE8FF, glass: 0x2AA8FF, hex: '#2898FF' },
        coin: { kind: 'epic',   icon: 'coin',   title: '金币', frame: 0xFFB824, dark: 0x6E3C04, light: 0xFFF29E, glass: 0xFFC533, hex: '#FFB824' },
        risk: { kind: 'danger', icon: 'skull',  title: '高危', frame: 0xF03E4E, dark: 0x6B101C, light: 0xFFABB4, glass: 0xFF4757, hex: '#F03E4E' }
    };

    function clampNumber(value, low, high) {
        return Math.max(low, Math.min(high, value));
    }

    function roundedRectGeometry(width, height, radius, depth) {
        var w2 = width * 0.5;
        var h2 = height * 0.5;
        var r = Math.min(radius, w2, h2);
        var shape = new THREE.Shape();
        shape.moveTo(-w2 + r, -h2);
        shape.lineTo(w2 - r, -h2);
        shape.quadraticCurveTo(w2, -h2, w2, -h2 + r);
        shape.lineTo(w2, h2 - r);
        shape.quadraticCurveTo(w2, h2, w2 - r, h2);
        shape.lineTo(-w2 + r, h2);
        shape.quadraticCurveTo(-w2, h2, -w2, h2 - r);
        shape.lineTo(-w2, -h2 + r);
        shape.quadraticCurveTo(-w2, -h2, -w2 + r, -h2);
        var geo = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            steps: 1,
            curveSegments: 2,
            bevelEnabled: true,
            bevelSegments: 1,
            bevelSize: Math.min(0.028, r * 0.35),
            bevelThickness: 0.025
        });
        geo.translate(0, 0, -depth * 0.5);
        return geo;
    }

    function applyTransform(geo, x, y, z, rx, ry, rz, sx, sy, sz) {
        if (sx !== undefined) geo.scale(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
        if (rx) geo.rotateX(rx);
        if (ry) geo.rotateY(ry);
        if (rz) geo.rotateZ(rz);
        geo.translate(x || 0, y || 0, z || 0);
        return geo;
    }

    function mergeColored(parts) {
        var geos = [];
        for (var i = 0; i < parts.length; i++) {
            geos.push(colorize(parts[i].geo, parts[i].color));
        }
        var merged = mergeGeometries(geos);
        for (var j = 0; j < geos.length; j++) geos[j].dispose();
        merged.computeBoundingSphere();
        return merged;
    }

    // This project pins r149, whose display chunk is encodings_fragment.
    // Match the GLB display transform while preserving legacy scenery shading.
    function preparePbr(material) {
        material.onBeforeCompile = function (shader, renderer) {
            if (renderer.outputEncoding !== THREE.LinearEncoding) return;
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <encodings_fragment>',
                'gl_FragColor = LinearTosRGB( gl_FragColor );'
            );
        };
        material.customProgramCacheKey = function () {
            return 'v42-pbr-r149-display';
        };
        material.userData.v42ColorManaged = true;
        return material;
    }

    function makeGateGlassTexture(style) {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        var c = new THREE.Color(style.glass);
        var l = new THREE.Color(style.light);
        var d = new THREE.Color(style.dark);
        var rgb = Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255);
        var lrgb = Math.round(l.r * 255) + ',' + Math.round(l.g * 255) + ',' + Math.round(l.b * 255);
        var drgb = Math.round(d.r * 255) + ',' + Math.round(d.g * 255) + ',' + Math.round(d.b * 255);
        var grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0.00, 'rgba(' + lrgb + ',0.95)');
        grad.addColorStop(0.10, 'rgba(' + rgb + ',0.84)');
        grad.addColorStop(0.55, 'rgba(' + drgb + ',0.66)');
        grad.addColorStop(0.88, 'rgba(' + rgb + ',0.86)');
        grad.addColorStop(1.00, 'rgba(' + lrgb + ',0.96)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 512);

        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.beginPath();
        ctx.moveTo(16, 0); ctx.lineTo(106, 0); ctx.lineTo(0, 210); ctx.lineTo(0, 120);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.beginPath();
        ctx.moveTo(180, 0); ctx.lineTo(224, 0); ctx.lineTo(36, 512); ctx.lineTo(0, 512);
        ctx.closePath(); ctx.fill();

        ctx.strokeStyle = 'rgba(' + lrgb + ',0.88)';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, 246, 502);

        var texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        return texture;
    }

    function formatGateLabel(data) {
        if (data && data.label !== undefined && data.label !== null && String(data.label).trim()) {
            return String(data.label);
        }
        var value = data ? data.value : '';
        if (data && data.op === 'add') return '+' + value;
        if (data && data.op === 'mul') return '×' + value;
        return String(value === undefined ? '' : value);
    }

    function drawGateIcon(ctx, iconType, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1.32, 1.32);
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = 'rgba(0,0,0,0.52)';
        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (iconType === 'helmet') {
            // Stylized military helmet + face silhouette (matches V15 +20 gate)
            ctx.beginPath();
            ctx.arc(0, -10, 48, Math.PI, 0, false);
            ctx.lineTo(54, 4);
            ctx.quadraticCurveTo(0, 14, -54, 4);
            ctx.closePath();
            ctx.stroke(); ctx.fill();
            // Head/chin under helmet
            ctx.beginPath();
            ctx.arc(0, 14, 30, 0, Math.PI, false);
            ctx.stroke(); ctx.fill();
        } else if (iconType === 'rifle') {
            // Stylized assault rifle angled diagonally (matches V15 +50% gate)
            ctx.rotate(-0.42);
            ctx.beginPath();
            ctx.roundRect(-62, -11, 108, 22, 6);
            ctx.stroke(); ctx.fill();
            // Barrel
            ctx.fillRect(42, -5, 28, 10);
            // Magazine & stock
            ctx.fillRect(-10, 8, 16, 26);
            ctx.fillRect(-62, -6, 18, 26);
            // Sight
            ctx.fillRect(-14, -22, 24, 10);
        } else if (iconType === 'coin') {
            // Stylized gold coin with inner star (matches V15 +100 gate)
            ctx.beginPath(); ctx.arc(0, 0, 48, 0, TAU); ctx.stroke(); ctx.fill();
            ctx.fillStyle = '#FFE47A';
            ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.fill();
            ctx.fillStyle = '#B87208';
            ctx.beginPath();
            for (var s = 0; s < 10; s++) {
                var a = -Math.PI / 2 + s * Math.PI / 5;
                var r = (s % 2 === 0) ? 24 : 11;
                if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath(); ctx.fill();
        } else if (iconType === 'star') {
            ctx.beginPath();
            for (var k = 0; k < 10; k++) {
                var ak = -Math.PI / 2 + k * Math.PI / 5;
                var rk = (k % 2 === 0) ? 48 : 22;
                if (k === 0) ctx.moveTo(Math.cos(ak) * rk, Math.sin(ak) * rk);
                else ctx.lineTo(Math.cos(ak) * rk, Math.sin(ak) * rk);
            }
            ctx.closePath(); ctx.stroke(); ctx.fill();
        } else {
            // Danger skull / warning diamond
            ctx.beginPath(); ctx.arc(0, -6, 40, 0, TAU); ctx.stroke(); ctx.fill();
            ctx.fillStyle = '#6B101C';
            ctx.beginPath(); ctx.arc(-15, -8, 9, 0, TAU); ctx.arc(15, -8, 9, 0, TAU); ctx.fill();
        }
        ctx.restore();
    }

    function makeGateChevronTexture(style) {
        var canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);
        var lightCss = '#' + new THREE.Color(style.light).getHexString();
        var mainCss = '#' + new THREE.Color(style.glass).getHexString();
        for (var i = 0; i < 3; i++) {
            var y = 40 + i * 74;
            var alpha = 1.0 - i * 0.18;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = mainCss;
            ctx.lineWidth = 30;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(48, y + 40); ctx.lineTo(128, y); ctx.lineTo(208, y + 40);
            ctx.stroke();
            ctx.strokeStyle = lightCss;
            ctx.lineWidth = 13;
            ctx.stroke();
            ctx.restore();
        }
        var tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    function makeGateTextTexture(label, style) {
        var lines = [label];
        var buffMatch = label.match(/^([\u4e00-\u9fff]+)\s*([+×\-]\d+%?)$/);
        if (buffMatch) {
            lines = [buffMatch[1], buffMatch[2]];
        } else if (/\s/.test(label) && label.length > 5) {
            var words = label.trim().split(/\s+/);
            lines = [words.shift(), words.join(' ')];
        }
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        var glow = new THREE.Color(style.light);
        var frame = new THREE.Color(style.dark);
        var glowCss = '#' + glow.getHexString();
        var frameCss = '#' + frame.getHexString();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // V15: 上半部大号高对比度立体图标 (头盔 / 步枪 / 金币 / 星标)
        drawGateIcon(ctx, style.icon || 'helmet', 256, 138);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';

        var mainText = lines.length > 1 ? lines[1] : label;
        if (lines.length > 1) {
            // 小标题紧贴图标下方
            ctx.font = '900 44px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
            ctx.strokeStyle = frameCss;
            ctx.lineWidth = 9;
            ctx.fillStyle = glowCss;
            ctx.strokeText(lines[0], 256, 232);
            ctx.fillText(lines[0], 256, 232);
        }

        // 超大加粗白字数值 (高对比黑绿/黑蓝厚描边 + 立体投影)
        var fontSize = lines.length > 1 ? 150 : 172;
        do {
            ctx.font = '900 ' + fontSize + 'px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
            if (ctx.measureText(mainText).width <= 452) break;
            fontSize -= 6;
        } while (fontSize > 68);
        var textY = lines.length > 1 ? 356 : 338;
        ctx.strokeStyle = frameCss;
        ctx.lineWidth = Math.max(18, fontSize * 0.14);
        ctx.shadowColor = 'rgba(0,0,0,0.58)';
        ctx.shadowOffsetY = 10;
        ctx.shadowBlur = 12;
        ctx.strokeText(mainText, 256, textY);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(mainText, 256, textY);
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;

        var texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.userData.v42Multiline = lines.length > 1;
        return texture;
    }

    function addGateOrnament(parts, style, op, width) {
        var topY = 1.88;
        if (op === 'mul') {
            var crown = new THREE.OctahedronGeometry(0.15, 0);
            applyTransform(crown, 0, topY, 0, 0, 0, Math.PI * 0.25, 1.2, 1.0, 0.75);
            parts.push({ geo: crown, color: style.light });
            for (var x = -1; x <= 1; x += 2) {
                var fin = new THREE.ConeGeometry(0.075, 0.22, 4);
                applyTransform(fin, x * width * 0.31, 1.87, 0, 0, 0, x * -0.22);
                parts.push({ geo: fin, color: style.light });
            }
        } else if (op === 'buff') {
            var gem = new THREE.OctahedronGeometry(0.17, 0);
            applyTransform(gem, 0, topY, 0, 0, 0, Math.PI * 0.25, 0.86, 1.25, 0.7);
            parts.push({ geo: gem, color: style.light });
            var halo = new THREE.TorusGeometry(0.23, 0.025, 5, 16);
            applyTransform(halo, 0, topY, -0.025, 0, 0, 0);
            parts.push({ geo: halo, color: style.light });
        } else if (op === 'risk') {
            var core = new THREE.OctahedronGeometry(0.14, 0);
            applyTransform(core, 0, 1.87, 0, 0, 0, Math.PI * 0.25);
            parts.push({ geo: core, color: style.light });
            for (var s = -1; s <= 1; s += 2) {
                var spike = new THREE.ConeGeometry(0.07, 0.28, 5);
                applyTransform(spike, s * 0.25, 1.89, 0, 0, 0, s * -0.65);
                parts.push({ geo: spike, color: style.light });
            }
        } else {
            var crest = new THREE.IcosahedronGeometry(0.15, 1);
            applyTransform(crest, 0, topY, 0, 0, 0, 0, 1.05, 1.18, 0.72);
            parts.push({ geo: crest, color: style.light });
            for (var w = -1; w <= 1; w += 2) {
                var wing = new THREE.BoxGeometry(0.22, 0.045, 0.06);
                applyTransform(wing, w * 0.22, 1.87, 0, 0, 0, w * 0.35);
                parts.push({ geo: wing, color: style.light });
            }
        }
    }

    V42Art.createGateModel = function (gateData, gateWidth) {
        gateData = gateData || { op: 'add', value: 1, label: '+1' };
        var styleKey = gateData.op;
        if (gateData.op === 'coin' || gateData.op === 'gold' || /金币|\+\d+金/.test(String(gateData.label || ''))) styleKey = 'coin';
        else if (gateData.op === 'addpct') styleKey = 'add';
        else if (gateData.op === 'skill' || gateData.op === 'damage' || gateData.op === 'damage2' || gateData.op === 'firerate') styleKey = 'buff';
        var style = GATE_STYLES[styleKey] || GATE_STYLES.add;
        var width = clampNumber(Number(gateWidth) || 1.8, 1.35, 1.77);
        var group = new THREE.Group();
        var frameParts = [];
        var trimParts = [];
        var postW = 0.20;
        var postH = 1.66;
        var postX = width * 0.5 - postW * 0.5;
        var steelDark = 0x2B3442;
        var steelMid = 0x455264;

        frameParts.push({ geo: applyTransform(roundedRectGeometry(postW, postH, 0.06, 0.22), -postX, 0.88, 0), color: steelMid });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(postW, postH, 0.06, 0.22),  postX, 0.88, 0), color: steelMid });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(width, 0.16, 0.06, 0.24), 0, 1.72, 0), color: style.frame });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.30, 0.18, 0.06, 0.32), -postX, 0.10, 0.01), color: steelDark });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.30, 0.18, 0.06, 0.32),  postX, 0.10, 0.01), color: steelDark });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.24, 0.10, 0.04, 0.26), -postX, 1.78, 0), color: steelDark });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.24, 0.10, 0.04, 0.26),  postX, 1.78, 0), color: steelDark });

        // V15: 底座黄黑战术防撞块 + 顶部中央发光状态指示灯
        trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.18, 0.14, 0.34), -postX, 0.18, 0.02), color: 0xF5B82E });
        trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.18, 0.14, 0.34),  postX, 0.18, 0.02), color: 0xF5B82E });
        trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.38, 0.14, 0.16), 0, 1.88, 0.02), color: style.light });
        trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.14, 0.11, 0.14), -postX, 1.88, 0), color: 0xFFB830 });
        trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.14, 0.11, 0.14),  postX, 1.88, 0), color: 0xFFB830 });
        var insetX = width * 0.5 - 0.145;
        trimParts.push({ geo: applyTransform(roundedRectGeometry(0.05, 1.46, 0.014, 0.045), -insetX, 0.92, 0.08), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(0.05, 1.46, 0.014, 0.045),  insetX, 0.92, 0.08), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(width - 0.28, 0.05, 0.014, 0.045), 0, 1.63, 0.08), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(width - 0.28, 0.05, 0.014, 0.045), 0, 0.21, 0.08), color: style.light });

        var frameMat = preparePbr(new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.38,
            metalness: 0.45,
            emissive: new THREE.Color(style.dark),
            emissiveIntensity: 0.08
        }));
        var frame = new THREE.Mesh(mergeColored(frameParts), frameMat);
        frame.castShadow = true;
        frame.receiveShadow = true;
        group.add(frame);

        var trimMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
        var trim = new THREE.Mesh(mergeColored(trimParts), trimMat);
        group.add(trim);

        var glassTexture = makeGateGlassTexture(style);
        var glassMat = preparePbr(new THREE.MeshPhysicalMaterial({
            color: 0xFFFFFF,
            map: glassTexture,
            transparent: true,
            opacity: 0.90,
            roughness: 0.10,
            metalness: 0.02,
            clearcoat: 0.85,
            clearcoatRoughness: 0.14,
            emissive: new THREE.Color(style.glass),
            emissiveIntensity: 0.72,
            side: THREE.DoubleSide,
            depthWrite: false
        }));
        var glass = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.26, 1.44), glassMat);
        glass.position.set(0, 0.92, 0.02);
        group.add(glass);

        // V15: 路面三连发光引导箭头 (直指增益门, 强化三跑道视觉牵引!)
        var chevronTex = makeGateChevronTexture(style);
        var chevronMat = new THREE.MeshBasicMaterial({
            map: chevronTex,
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
            toneMapped: false,
            side: THREE.DoubleSide
        });
        var chevronMesh = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.72, 1.45), chevronMat);
        chevronMesh.rotation.x = -Math.PI * 0.5;
        chevronMesh.position.set(0, 0.042, 1.15);
        chevronMesh.renderOrder = 2;
        group.add(chevronMesh);

        var glowPlane = new THREE.PlaneGeometry(Math.min(1.88, width + 0.04), 0.56);
        var ringGeo = new THREE.RingGeometry(width * 0.28, width * 0.44, 28);
        var groundGeo = mergeGeometries([colorize(glowPlane, style.glass), colorize(ringGeo, style.light)]);
        glowPlane.dispose();
        ringGeo.dispose();
        var groundMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.32,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
        });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI * 0.5;
        ground.position.y = 0.032;
        group.add(ground);

        var beamGeo = colorize(new THREE.PlaneGeometry(width - 0.30, 0.22), style.light);
        var beamMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.38,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
            side: THREE.DoubleSide,
            fog: false
        });
        var beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 0.30, -0.115);
        beam.renderOrder = 2;
        beam.userData.artSource = '能量门底部脉动光带';
        group.add(beam);

        var labelTexture = makeGateTextTexture(formatGateLabel(gateData), style);
        var labelMat = new THREE.SpriteMaterial({
            map: labelTexture,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            toneMapped: false,
            fog: false
        });
        var label = new THREE.Sprite(labelMat);
        var labelWidth = width - 0.16;
        var labelHeight = labelWidth * (labelTexture.image.height / labelTexture.image.width) * 0.88;
        label.scale.set(labelWidth, labelHeight, 1);
        label.position.set(0, 0.94, 0.12);
        label.renderOrder = 4;
        group.add(label);

        group.userData.artSource = 'V42Art.createGateModel/' + style.kind + '/V15-beveled-glow-chevron';
        group.userData.qualityKind = style.kind;
        group.userData.label = label;
        group.userData.labelBaseY = 0.94;
        group.userData.beamMat = beamMat; // V13: 光束脉动(gates.update)
        group.userData.chevronMat = chevronMat; // V15: 地面引导箭头脉动
        group.userData.glass = glass;
        group.userData.glow = ground;
        group.userData.ring = ground;
        group.userData.drawCalls = 6;
        group.userData.ownsResources = true;
        return group;
    };

    /** V12视觉: 精英身份光环 — 贴地金环+缓流入内圈; 共享几何/材质(调用方不dispose, 无泄漏) */
    V42Art.createEliteAura = function () {
        if (!V42Art._eliteAuraGeo) {
            V42Art._eliteAuraGeo = mergeGeometries([
                colorize(new THREE.RingGeometry(0.62, 0.78, 28), 0xFFC247),
                colorize(new THREE.RingGeometry(0.30, 0.38, 22), 0xFFE28A)
            ]);
            V42Art._eliteAuraMat = new THREE.MeshBasicMaterial({
                vertexColors: true, transparent: true, opacity: 0.55,
                side: THREE.DoubleSide, depthWrite: false, toneMapped: false
            });
            V42Art._eliteAuraGeo.userData = { artSource: 'js/art-v42.js:createEliteAura() 共享金环' };
        }
        var mesh = new THREE.Mesh(V42Art._eliteAuraGeo, V42Art._eliteAuraMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.renderOrder = 2;
        return mesh;
    };

    function seededRandom(seed) {
        var state = seed >>> 0;
        return function () {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }

    function makeCityMaterial(color, options) {
        options = options || {};
        return preparePbr(new THREE.MeshStandardMaterial({
            color: color,
            roughness: options.roughness === undefined ? 0.74 : options.roughness,
            metalness: options.metalness || 0,
            emissive: options.emissive || 0x000000,
            emissiveIntensity: options.emissiveIntensity || 0
        }));
    }

    function makeFacadeTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#e5e9e4';
        ctx.fillRect(0, 0, 256, 512);
        for (var floor = 0; floor < 4; floor++) {
            var y = 18 + floor * 120;
            ctx.fillStyle = '#b5bfbb';
            ctx.fillRect(0, y + 90, 256, 5);
            ctx.fillStyle = '#f6f4e9';
            ctx.fillRect(0, y + 95, 256, 7);
            for (var col = 0; col < 3; col++) {
                var x = 18 + col * 80;
                ctx.fillStyle = '#899996';
                ctx.fillRect(x - 4, y - 4, 64, 84);
                ctx.fillStyle = '#283e48';
                ctx.fillRect(x, y, 56, 74);
                ctx.fillStyle = floor % 2 === col % 2 ? '#a3ccd1' : '#57818b';
                ctx.fillRect(x + 5, y + 4, 46, 32);
                ctx.fillStyle = '#d6e5df';
                ctx.fillRect(x + 26, y, 4, 74);
                ctx.fillRect(x, y + 35, 56, 4);
                ctx.fillStyle = '#f7f4e8';
                ctx.fillRect(x - 7, y + 77, 70, 6);
            }
        }
        var tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 4;
        return tex;
    }

    function makeShopTexture(text, color) {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = '#ecf3e9';
        ctx.lineWidth = 5;
        ctx.strokeRect(8, 8, 496, 112);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 68px "Microsoft YaHei", Arial, sans-serif';
        ctx.fillText(text, 256, 67, 460);
        return new THREE.CanvasTexture(canvas);
    }

    function addStreetDetails(env, buildings, random) {
        var solids = [], glass = [], trims = [], foliage = [], wheels = [];
        var signs = [[], [], []], canopies = [], awningStripes = [], markings = [];
        var box = new THREE.BoxGeometry(1, 1, 1);
        function record(x, y, z, sx, sy, sz, ry) {
            return { x: x, y: y, z: z, sx: sx, sy: sy, sz: sz, ry: ry || 0 };
        }
        for (var i = 0; i < buildings.length; i++) {
            var b = buildings[i], inner = b.x - b.s * (b.w * .558 + .035);
            // Shops and their awnings face the road; the combat lanes stay clear.
            glass.push(record(inner, .92, b.z, .035, 1.45, b.sz * .77));
            trims.push(record(inner - b.s * .025, .17, b.z, .12, .16, b.sz * .86));
            for (var f = -1; f <= 1; f++) {
                trims.push(record(inner - b.s * .04, .92, b.z + f * b.sz * .32, .09, 1.55, .06));
            }
            canopies.push(record(inner - b.s * .35, 1.95, b.z, .85, .14, b.sz * .91));
            for (var st = 0; st < 7; st++) {
                awningStripes.push(record(inner - b.s * .35, 2.027, b.z + (st - 3) * b.sz * .13, .86, .018, b.sz * .055));
            }
            signs[i % 3].push(record(inner - b.s * .06, 2.36, b.z, 2.6, .56, 1, -b.s * Math.PI / 2));
            solids.push(record(b.x, b.h + .28, b.z, b.w * .38, .45, b.sz * .35));
            if (i % 2 === 0) {
                var pz = b.z + b.sz * .63;
                solids.push(record(b.s * 5.05, .19, pz, .7, .35, 1.3));
                foliage.push(record(b.s * 5.05, .49, pz, .7, .52, 1.25));
            }
            if (i % 4 === 1) {
                solids.push(record(b.s * 4.9, .28, b.z - 1.3, .8, .45, 1.25));
                trims.push(record(b.s * 4.9, .53, b.z - 1.3, .82, .07, 1.28));
                for (var h = -1; h <= 1; h += 2) {
                    markings.push(record(b.s * 4.9, .54, b.z - 1.3 + h * .42, .84, .02, .1));
                }
            }
            if (i % 5 === 2) {
                var carX = b.s * 5.8, carZ = b.z + 2.9;
                canopies.push(record(carX, .44, carZ, 1.05, .45, 1.95));
                glass.push(record(carX, .83, carZ - .12, .86, .38, .92));
                trims.push(record(carX, .28, carZ + 1, 1, .15, .12));
                for (var side = -1; side <= 1; side += 2) {
                    for (var axle = -1; axle <= 1; axle += 2) {
                        wheels.push(record(carX + side * .54, .24, carZ + axle * .65, .16, .38, .38));
                    }
                }
            }
        }
        // Street furniture is batched by surface, not by individual object.
        addInstancedCategory(env, 'street-concrete', box, makeCityMaterial(0x9AAFAA), solids, { receiveShadow: true });
        addInstancedCategory(env, 'shop-windows', box, makeCityMaterial(0x325D6A, { roughness: .24, metalness: .18 }), glass);
        addInstancedCategory(env, 'shop-frames', box, makeCityMaterial(0xDDE3DB), trims);
        addInstancedCategory(env, 'striped-awnings', box, makeCityMaterial(0xBB4E53), canopies, { castShadow: true });
        addInstancedCategory(env, 'awning-stripes', box, makeCityMaterial(0xF6EFE4), awningStripes);
        addInstancedCategory(env, 'planter-shrubs', new THREE.IcosahedronGeometry(.65, 1), makeCityMaterial(0x407B59), foliage);
        addInstancedCategory(env, 'parked-car-wheels', box, makeCityMaterial(0x283239), wheels);
        addInstancedCategory(env, 'street-reflectors', box, new THREE.MeshBasicMaterial({ color: 0xFFD365 }), markings);
        var labels = ['CITY MART', '补给站', 'METRO  03'];
        var colors = ['#386f67', '#ac4d4c', '#3b607f'];
        for (var s = 0; s < signs.length; s++) {
            addInstancedCategory(env, 'shop-sign-' + s, new THREE.PlaneGeometry(1, 1),
                new THREE.MeshBasicMaterial({ map: makeShopTexture(labels[s], colors[s]), side: THREE.DoubleSide }), signs[s]);
        }
        var skyline = makeRecords(32, function (i) {
            var h = 7 + random() * 10;
            return record((i % 2 ? 1 : -1) * (14 + random() * 9), h * .5, 10 - i * 5.2, 3 + random() * 3, h, 3 + random() * 3);
        });
        addInstancedCategory(env, 'distant-skyline', box, makeCityMaterial(0x7C9BA5), skyline);
    }

    function addInstancedCategory(env, name, geometry, material, records, options) {
        options = options || {};
        var mesh = new THREE.InstancedMesh(geometry, material, records.length);
        mesh.name = 'v42-' + name;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.castShadow = !!options.castShadow;
        mesh.receiveShadow = !!options.receiveShadow;
        mesh.frustumCulled = false;
        mesh.userData.artSource = 'V42Art.buildEnvironment/instanced-' + name;
        mesh.userData.collidable = false;
        env.root.add(mesh);
        // V14: 主题归属 — entry.themes 列出的主题可见, 未列出的隐藏(setEnvironmentTheme 切换)
        var entry = { mesh: mesh, records: records, themes: options.themes || null };
        if (entry.themes) mesh.visible = false; // 等待 setEnvironmentTheme 激活
        env.entries.push(entry);
        env.drawCalls++;
        return entry;
    }

    /** V14: 主题道具包可见性切换 — 每主题只激活自己的道具类别; 重置 lastSquadZ 触发全量重排 */
    V42Art.setEnvironmentTheme = function (env, themeName) {
        if (!env || !env.entries) return;
        for (var i = 0; i < env.entries.length; i++) {
            var entry = env.entries[i];
            if (!entry.themes) { entry.mesh.visible = true; continue; }
            var on = entry.themes.indexOf(themeName) >= 0;
            if (entry.mesh.visible !== on) {
                entry.mesh.visible = on;
                if (on) env.lastSquadZ = Number.POSITIVE_INFINITY; // 激活时全量重排矩阵
            }
        }
    };

    /** V14.3: 草地噪点纹理 — 灰度细噪+修剪条纹, 与顶点色相乘提升地面质感(共享单张) */
    var _grassTex = null;
    V42Art.getGrassTexture = function () {
        if (_grassTex) return _grassTex;
        var cv = document.createElement('canvas');
        cv.width = 128; cv.height = 128;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 128, 128);
        for (var i = 0; i < 900; i++) {
            var v = Math.random();
            ctx.fillStyle = v < 0.5 ? 'rgba(120,160,90,0.16)' : 'rgba(255,255,255,0.12)';
            ctx.fillRect(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 2, 1 + Math.random() * 2);
        }
        // 修剪条纹(横向明暗带)
        for (var b2 = 0; b2 < 4; b2++) {
            ctx.fillStyle = b2 % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(40,70,30,0.08)';
            ctx.fillRect(0, b2 * 32, 128, 16);
        }
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 2);
        _grassTex = tex;
        return tex;
    };

    /** V14: 主题地面纹理 — 程序化生成并缓存(柏油/龟裂/岩面/金属板/混凝土), 含三车道虚线保持跑道可读 */
    var _groundTexCache = {};
    V42Art.getGroundTexture = function (kind) {
        if (_groundTexCache[kind]) return _groundTexCache[kind];
        var cv = document.createElement('canvas');
        cv.width = 256; cv.height = 512;
        var ctx = cv.getContext('2d');
        var palettes = {
            asphalt: { base: '#7C8B96', line: '#F0EEF5', edge: '#E3C26B', noise: true },
            cracked: { base: '#5E5A54', line: '#B8AE9C', edge: '#8A7A54', noise: true, cracks: true },
            rock:    { base: '#3E4E52', line: '#7E9EA0', edge: '#5E7A78', noise: true, strata: true },
            metal:   { base: '#5E6268', line: '#B8C4C8', edge: '#8E9EA6', noise: false, plates: true },
            concrete:{ base: '#8E948E', line: '#E8ECE8', edge: '#C2B27E', noise: true, slabs: true }
        };
        var P = palettes[kind] || palettes.asphalt;
        ctx.fillStyle = P.base;
        ctx.fillRect(0, 0, 256, 512);
        var i;
        if (P.plates) {
            // 金属甲板: 大板拼缝+铆钉
            ctx.strokeStyle = 'rgba(20,26,30,0.55)'; ctx.lineWidth = 3;
            for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, i * 128 + 8); ctx.lineTo(256, i * 128 + 8); ctx.stroke(); }
            ctx.beginPath(); ctx.moveTo(85, 0); ctx.lineTo(85, 512); ctx.moveTo(171, 0); ctx.lineTo(171, 512); ctx.stroke();
            ctx.fillStyle = 'rgba(200,210,214,0.5)';
            for (i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(20 + (i % 4) * 60, 30 + Math.floor(i / 4) * 62, 3, 0, Math.PI * 2); ctx.fill(); }
        } else if (P.slabs) {
            // 混凝土: 伸缩缝+污渍
            ctx.strokeStyle = 'rgba(60,66,60,0.5)'; ctx.lineWidth = 3;
            for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, i * 170 + 40); ctx.lineTo(256, i * 170 + 40); ctx.stroke(); }
            for (i = 0; i < 10; i++) {
                ctx.fillStyle = 'rgba(50,54,48,' + (0.05 + Math.random() * 0.06) + ')';
                ctx.beginPath(); ctx.ellipse(Math.random() * 256, Math.random() * 512, 12 + Math.random() * 30, 8 + Math.random() * 20, 0, 0, Math.PI * 2); ctx.fill();
            }
        } else if (P.strata) {
            // 洞穴岩面: 水平岩层带+湿痕
            for (i = 0; i < 7; i++) {
                ctx.fillStyle = 'rgba(' + (i % 2 ? '28,42,46' : '52,68,72') + ',0.35)';
                ctx.fillRect(0, i * 74, 256, 34 + (i % 3) * 12);
            }
            for (i = 0; i < 8; i++) {
                ctx.fillStyle = 'rgba(90,140,140,0.12)';
                ctx.beginPath(); ctx.ellipse(Math.random() * 256, Math.random() * 512, 14 + Math.random() * 26, 20 + Math.random() * 40, 0, 0, Math.PI * 2); ctx.fill();
            }
        } else {
            // 柏油/龟裂: 大色调带 + 噪点 + 车辙
            var bandTones = ['rgba(255,255,255,0.045)', 'rgba(30,44,56,0.06)', 'rgba(255,255,255,0.03)'];
            for (i = 0; i < 3; i++) { ctx.fillStyle = bandTones[i]; ctx.fillRect((i * 83) % 256, 0, 60 + i * 14, 512); }
            for (i = 0; i < 380; i++) {
                ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.035)';
                ctx.fillRect(Math.random() * 256, Math.random() * 512, 2 + Math.random() * 3, 2 + Math.random() * 3);
            }
            ctx.fillStyle = 'rgba(24,34,40,0.10)';
            ctx.fillRect(52, 0, 22, 512); ctx.fillRect(182, 0, 22, 512);
        }
        if (P.cracks) {
            ctx.strokeStyle = 'rgba(16,14,10,0.5)'; ctx.lineWidth = 2;
            for (i = 0; i < 12; i++) {
                var sx = Math.random() * 256, sy = Math.random() * 512;
                ctx.beginPath(); ctx.moveTo(sx, sy);
                for (var c = 0; c < 3; c++) { sx += (Math.random() - 0.5) * 60; sy += 12 + Math.random() * 26; ctx.lineTo(sx, sy); }
                ctx.stroke();
            }
        }
        // 三车道虚线(与柏油版同位置: x≈90/165) + 路缘实线 — 保持跑道可读性
        ctx.fillStyle = P.line;
        for (i = 0; i < 512; i += 48) { ctx.fillRect(88, i, 5, 30); ctx.fillRect(163, i, 5, 30); }
        ctx.fillStyle = 'rgba(40,44,40,0.4)'; ctx.fillRect(3, 0, 7, 512); ctx.fillRect(246, 0, 7, 512);
        ctx.fillStyle = P.edge; ctx.fillRect(4, 0, 5, 512); ctx.fillRect(247, 0, 5, 512);
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
        _groundTexCache[kind] = tex;
        return tex;
    };

    function setRecordMatrix(entry, index, tempObject) {
        var r = entry.records[index];
        tempObject.position.set(r.x, r.y, r.z);
        tempObject.rotation.set(r.rx || 0, r.ry || 0, r.rz || 0);
        tempObject.scale.set(r.sx || 1, r.sy || 1, r.sz || 1);
        tempObject.updateMatrix();
        entry.mesh.setMatrixAt(index, tempObject.matrix);
    }

    function makeRecords(count, maker) {
        var result = [];
        for (var i = 0; i < count; i++) result.push(maker(i));
        return result;
    }

    V42Art.buildEnvironment = function (world) {
        if (!world || !world.scene) return null;
        if (world._v42Environment && world._v42Environment.root) {
            world.scene.remove(world._v42Environment.root);
        }
        world.decoItems = [];
        world.buildings = [];
        world.clouds = [];

        // V14: 主题族定义 — CITY_FAMILY(含末日废墟态) / CITY_ALIVE(完好城市态)
        var CITY_FAMILY = ['default', 'dawn', 'noon', 'overcast', 'sunset', 'dusk', 'apocalypse'];
        var CITY_ALIVE = ['default', 'dawn', 'noon', 'overcast', 'sunset', 'dusk'];
        var ALL_BUT_CAVE = ['default', 'dawn', 'noon', 'overcast', 'sunset', 'dusk', 'apocalypse', 'mechanical', 'fortress'];

        var random = seededRandom(42042);
        var root = new THREE.Group();
        root.name = 'v42-environment';
        root.userData.artSource = 'V42Art.buildEnvironment/procedural-instanced-city';
        root.userData.collidable = false;
        world.scene.add(root);

        var env = {
            root: root,
            entries: [],
            drawCalls: 0,
            span: 170,
            front: 18,
            tempObject: new THREE.Object3D(),
            lastSquadZ: Number.POSITIVE_INFINITY,
            update: function (squadZ) { V42Art.updateEnvironment(world, squadZ); }
        };
        world._v42Environment = env;

        var facade = makeFacadeTexture();
        var cream = makeCityMaterial(0xD8E0DC);
        var teal = makeCityMaterial(0x8AB8AF, { roughness: 0.68 });
        var coral = makeCityMaterial(0xD7A29B);
        cream.map = teal.map = coral.map = facade;
        var leaf = makeCityMaterial(0x70A77B, { roughness: 0.9 });
        var trunk = makeCityMaterial(0x8B684B, { roughness: 0.92 });
        var glass = makeCityMaterial(0x93C6C7, { roughness: 0.22, metalness: 0.18 });
        var warmLight = new THREE.MeshBasicMaterial({ color: 0xFFE5A3, toneMapped: false });
        var charcoal = makeCityMaterial(0x304552, { roughness: 0.5, metalness: 0.25 });
        // V5.0: 云朵不受雾影响并加自发光, 修复远景发灰像岩石
        var cloudMat = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF, emissive: 0xB8C4CC, emissiveIntensity: 0.55,
            transparent: true, opacity: 0.92, fog: false
        });

        var roadside = makeRecords(76, function (i) {
            var side = i % 2 ? 1 : -1;
            return { x: side * (4.8 + random() * .4), y: 0, z: 10 - i * 3.08 + random() * .5, s: side };
        });
        var treeBase = roadside.filter(function (_, i) { return i % 3 === 0; });
        var lampBase = roadside.filter(function (_, i) { return i % 3 === 1; });
        var propBase = roadside.filter(function (_, i) { return i % 3 === 2; });

        addInstancedCategory(env, 'tree-trunks', new THREE.CylinderGeometry(0.11, 0.16, 0.74, 7), trunk,
            treeBase.map(function (r) { return { x: r.x, y: 0.37, z: r.z, sx: 1, sy: 1, sz: 1 }; }), { castShadow: true });
        addInstancedCategory(env, 'tree-canopies', new THREE.IcosahedronGeometry(0.55, 1), leaf,
            treeBase.map(function (r, i) { return { x: r.x, y: 1.13, z: r.z, sx: 1.05, sy: 1.32 + (i % 2) * 0.12, sz: 0.92, ry: random() * TAU }; }), { castShadow: true });
        addInstancedCategory(env, 'tree-crowns', new THREE.IcosahedronGeometry(0.34, 1), leaf,
            treeBase.map(function (r, i) { return { x: r.x + r.s * 0.12, y: 1.61, z: r.z + 0.04, sx: 0.9, sy: 1.1, sz: 0.9, ry: i }; }));

        addInstancedCategory(env, 'lamp-poles', new THREE.CylinderGeometry(0.045, 0.065, 2.15, 7), charcoal,
            lampBase.map(function (r) { return { x: r.x, y: 1.075, z: r.z }; }));
        addInstancedCategory(env, 'lamp-heads', roundedRectGeometry(0.34, 0.12, 0.04, 0.16), warmLight,
            lampBase.map(function (r) { return { x: r.x - r.s * 0.12, y: 2.08, z: r.z, ry: r.s > 0 ? 0 : Math.PI }; }));

        addInstancedCategory(env, 'parked-cars', roundedRectGeometry(0.86, 0.42, 0.12, 1.45), coral,
            propBase.filter(function (_, i) { return i % 3 === 0; }).map(function (r) { return { x: r.x + r.s * 0.2, y: 0.36, z: r.z, sx: 1, sy: 1, sz: 1, ry: r.s * 0.1 }; }), { castShadow: true });
        addInstancedCategory(env, 'car-glass', roundedRectGeometry(0.68, 0.24, 0.08, 0.58), glass,
            propBase.filter(function (_, i) { return i % 3 === 0; }).map(function (r) { return { x: r.x + r.s * 0.2, y: 0.67, z: r.z - 0.08, sx: 1, sy: 1, sz: 1, ry: r.s * 0.1 }; }));
        addInstancedCategory(env, 'cones', new THREE.ConeGeometry(0.13, 0.42, 7), coral,
            propBase.filter(function (_, i) { return i % 3 === 1; }).map(function (r) { return { x: r.x, y: 0.21, z: r.z, ry: random() * TAU }; }));
        var buildings = makeRecords(50, function (i) {
            var side = i % 2 ? 1 : -1;
            var h = 3.4 + random() * 4.6;
            var w = 2.4 + random() * 1.2;
            return { x: side * (7.4 + random() * .9), y: h * .5, z: 12 - i * 3.84,
                sx: w, sy: h, sz: 4.5 + random() * 1.4, h: h, w: w, s: side };
        });
        var buildingGeo = roundedRectGeometry(1, 1, 0.08, 1);
        addInstancedCategory(env, 'cream-buildings', buildingGeo, cream,
            buildings.filter(function (_, i) { return i % 3 === 0; }));
        addInstancedCategory(env, 'teal-buildings', roundedRectGeometry(1, 1, 0.08, 1), teal,
            buildings.filter(function (_, i) { return i % 3 === 1; }));
        addInstancedCategory(env, 'coral-buildings', roundedRectGeometry(1, 1, 0.08, 1), coral,
            buildings.filter(function (_, i) { return i % 3 === 2; }));

        // No decorative roof caps or roadside rails in the combat view.

        var windows = [];
        for (var bi = 0; bi < buildings.length; bi++) {
            var b = buildings[bi];
            for (var row = 0; row < 4; row++) {
                windows.push({
                    // Face the road rather than +Z: the runner sees the inner
                    // side walls most clearly in the portrait perspective.
                    x: b.x - b.s * (b.w * 0.558),
                    y: 1.1 + row * Math.max(0.75, b.h * 0.18),
                    z: b.z - b.sz * 0.22,
                    sx: 0.38,
                    sy: 0.46,
                    sz: 1,
                    ry: -b.s * Math.PI * 0.5
                });
                windows.push({
                    x: b.x - b.s * (b.w * 0.558),
                    y: 1.1 + row * Math.max(0.75, b.h * 0.18),
                    z: b.z + b.sz * 0.22,
                    sx: 0.38,
                    sy: 0.46,
                    sz: 1,
                    ry: -b.s * Math.PI * 0.5
                });
            }
        }
        addInstancedCategory(env, 'windows', new THREE.PlaneGeometry(1, 1), warmLight, windows);

        addStreetDetails(env, buildings, random);

        var clouds = makeRecords(12, function (i) {
            var side = i % 2 ? 1 : -1;
            return { x: side * (3 + random() * 7), y: 8.5 + random() * 3.8, z: 14 - i * 13.4, sx: 1.4 + random() * 1.2, sy: 0.75 + random() * 0.4, sz: 0.8 + random() * 0.4, ry: random() * TAU };
        });
        addInstancedCategory(env, 'clouds', new THREE.IcosahedronGeometry(0.78, 1), cloudMat, clouds);

        // ===== V14: 主题道具包 =====
        // 每个主题族专属场景几何, 全部实例化+共享材质(按批合并), applyTheme 时按可见性切换。
        // 装饰只出现在 |x|>=4.9 的路外区域, 不影响跑道/碰撞/镜头。
        var box = new THREE.BoxGeometry(1, 1, 1);
        function rec(x, y, z, sx, sy, sz, ry, rx, rz) {
            return { x: x, y: y, z: z, sx: sx, sy: sy, sz: sz, ry: ry || 0, rx: rx || 0, rz: rz || 0 };
        }

        // —— 城市族加丰富(CITY_ALIVE): 候车亭/广告牌/信号灯/消防栓 ——
        var cxFrames = [], cxPanels = [], cxGlow = [];
        for (var ci = 0; ci < 6; ci++) {
            var cSide = ci % 2 ? 1 : -1, cz = 6 - ci * 27 + random() * 5, cx = cSide * 5.05;
            cxFrames.push(rec(cx, 1.2, cz, 0.09, 2.4, 1.85));                              // 候车亭背板
            cxFrames.push(rec(cx - cSide * 0.9, 1.1, cz - 0.85, 0.09, 2.2, 0.1));
            cxFrames.push(rec(cx - cSide * 0.9, 1.1, cz + 0.85, 0.09, 2.2, 0.1));
            cxPanels.push(rec(cx - cSide * 0.42, 2.24, cz, 1.25, 0.1, 2.0));               // 顶棚
            cxPanels.push(rec(cx - cSide * 0.42, 0.58, cz + 0.8, 0.12, 0.42, 1.2));        // 座椅
            cxGlow.push(rec(cx + cSide * 0.02, 1.55, cz - 0.95, 0.5, 0.36, 0.05));         // 站牌灯箱
        }
        for (var bi2 = 0; bi2 < 4; bi2++) {
            var bSide = bi2 % 2 ? 1 : -1, bz = -14 - bi2 * 36 + random() * 8, bx = bSide * 6.6;
            cxFrames.push(rec(bx - bSide * 0.5, 1.5, bz, 0.14, 3.0, 0.14));
            cxFrames.push(rec(bx + bSide * 0.5, 1.5, bz, 0.14, 3.0, 0.14));
            cxPanels.push(rec(bx, 3.4, bz + (bi2 % 2 ? 0.05 : -0.05), 2.6, 1.5, 0.12, bSide * 0.06));
            cxGlow.push(rec(bx - bSide * 0.09, 3.4, bz + (bi2 % 2 ? 0.1 : -0.1), 2.2, 1.1, 0.06));
        }
        for (var ti = 0; ti < 4; ti++) {
            var tSide = ti % 2 ? 1 : -1, tz = 18 - ti * 39, tx = tSide * 4.55;
            cxFrames.push(rec(tx, 1.35, tz, 0.11, 2.7, 0.11));
            cxPanels.push(rec(tx - tSide * 0.14, 2.78, tz, 0.3, 0.85, 0.26));
            cxGlow.push(rec(tx - tSide * 0.14, 2.95, tz, 0.16, 0.16, 0.05));
        }
        for (var hi = 0; hi < 4; hi++) {
            var hSide = hi % 2 ? 1 : -1, hz = 22 - hi * 41 + random() * 6;
            cxPanels.push(rec(hSide * 4.6, 0.26, hz, 0.16, 0.5, 0.2));
            cxGlow.push(rec(hSide * 4.6, 0.55, hz, 0.1, 0.12, 0.1));
        }
        // Cross-street decorative banners removed: keep the battle sightline clear.
        addInstancedCategory(env, 'cityx-frames', box, makeCityMaterial(0x2E3A42, { roughness: 0.5, metalness: 0.3 }), cxFrames, { themes: CITY_ALIVE, castShadow: true });
        addInstancedCategory(env, 'cityx-panels', box, makeCityMaterial(0x9AAFA8), cxPanels, { themes: CITY_ALIVE, castShadow: true });
        var cityxGlowMat = new THREE.MeshBasicMaterial({ color: 0xFFE9A8, toneMapped: false }); cityxGlowMat.__noThemeTint = true;
        addInstancedCategory(env, 'cityx-glow', box, cityxGlowMat, cxGlow, { themes: CITY_ALIVE });

        // —— 末日废墟(apocalypse): 坍塌楼板/瓦砾堆/烧毁车壳/余烬 ——
        var apoSlabs = [], apoRubble = [], apoWrecks = [], apoEmbers = [];
        for (var ai = 0; ai < 12; ai++) {
            var aSide = ai % 2 ? 1 : -1, az = 4 - ai * 19 + random() * 6;
            apoSlabs.push(rec(aSide * (5.7 + random() * 1.4), 0.9 + random() * 0.6, az, 2.8 + random() * 2.0, 0.6, 3.6 + random() * 1.8, random() * 1.2, (random() - 0.5) * 0.3, (random() - 0.5) * 0.24));
            for (var rb = 0; rb < 5; rb++) {
                apoRubble.push(rec(aSide * (4.85 + random() * 2.4), 0.18 + random() * 0.26, az + random() * 6 - 3, 0.5 + random() * 0.9, 0.3 + random() * 0.55, 0.5 + random() * 0.9, random() * TAU));
            }
            if (ai % 2 === 0 || ai % 3 === 1) {
                apoWrecks.push(rec(aSide * 5.3, 0.3, az + 2.4, 0.95, 0.6, 2.0, random() * 0.5 - 0.25, 0, (random() - 0.5) * 0.14));
                apoEmbers.push(rec(aSide * 5.3, 0.62, az + 2.0, 0.3, 0.1, 0.5));
            }
            if (ai % 3 === 1) apoEmbers.push(rec(aSide * (5.6 + random()), 0.34, az - 1.5, 0.24, 0.08, 0.3));
        }
        addInstancedCategory(env, 'apo-slabs', box, makeCityMaterial(0x4A4440, { roughness: 0.9 }), apoSlabs, { themes: ['apocalypse'], castShadow: true });
        addInstancedCategory(env, 'apo-rubble', new THREE.IcosahedronGeometry(0.5, 0), makeCityMaterial(0x6E655C, { roughness: 0.95 }), apoRubble, { themes: ['apocalypse'], castShadow: true });
        addInstancedCategory(env, 'apo-wrecks', roundedRectGeometry(1, 1, 0.12, 1), makeCityMaterial(0x26221E, { roughness: 0.6, metalness: 0.3 }), apoWrecks, { themes: ['apocalypse'], castShadow: true });
        var apoEmberMat = new THREE.MeshBasicMaterial({ color: 0xFF6A3C, toneMapped: false }); apoEmberMat.__noThemeTint = true;
        addInstancedCategory(env, 'apo-embers', box, apoEmberMat, apoEmbers, { themes: ['apocalypse'] });

        // —— 地下巢穴(cave): 巨岩壁/石笋/发光晶体/荧光菌 ——
        var caveBoulders = [], caveStalag = [], caveCrystals = [], caveShrooms = [];
        for (var vi = 0; vi < 14; vi++) {
            var vSide = vi % 2 ? 1 : -1, vz = 6 - vi * 12 + random() * 6;
            caveBoulders.push(rec(vSide * (4.9 + random() * 2.6), 0.7 + random() * 1.2, vz, 2.6 + random() * 2.6, 1.9 + random() * 2.4, 2.8 + random() * 2.2, random() * TAU));
            caveStalag.push(rec(vSide * (4.65 + random() * 1.0), 0.45 + random() * 0.5, vz + random() * 7 - 3.5, 0.28 + random() * 0.3, 0.9 + random() * 1.4, 0.28 + random() * 0.3));
            if (vi % 2 === 0) caveCrystals.push(rec(vSide * (4.6 + random() * 0.6), 0.4 + random() * 0.3, vz + random() * 5 - 2.5, 0.2 + random() * 0.22, 0.45 + random() * 0.55, 0.2 + random() * 0.22, random() * TAU, (random() - 0.5) * 0.4));
            if (vi % 3 === 0) caveShrooms.push(rec(vSide * (4.55 + random()), 0.2, vz - random() * 4, 0.14 + random() * 0.1, 0.13, 0.14 + random() * 0.1));
        }
        addInstancedCategory(env, 'cave-boulders', new THREE.IcosahedronGeometry(1, 0), makeCityMaterial(0x44565C, { roughness: 0.95 }), caveBoulders, { themes: ['cave'], castShadow: true });
        addInstancedCategory(env, 'cave-stalagmites', new THREE.ConeGeometry(0.5, 1.6, 6), makeCityMaterial(0x3E5054, { roughness: 0.9 }), caveStalag, { themes: ['cave'], castShadow: true });
        var caveCrystalMat = new THREE.MeshBasicMaterial({ color: 0x4FE3C0, toneMapped: false }); caveCrystalMat.__noThemeTint = true;
        addInstancedCategory(env, 'cave-crystals', new THREE.OctahedronGeometry(0.5, 0), caveCrystalMat, caveCrystals, { themes: ['cave'] });
        var caveShroomMat = new THREE.MeshBasicMaterial({ color: 0x6EE7A0, toneMapped: false }); caveShroomMat.__noThemeTint = true;
        addInstancedCategory(env, 'cave-shrooms', new THREE.SphereGeometry(0.16, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), caveShroomMat, caveShrooms, { themes: ['cave'] });

        // —— 机械废土(mechanical): 管线/机甲残骸/能源塔/金属碎板 ——
        var mechPipes = [], mechFrames = [], mechWrecks = [], mechStrips = [], mechDebris = [];
        for (var mi2 = 0; mi2 < 14; mi2++) {
            var mSide = mi2 % 2 ? 1 : -1, mz = 6 - mi2 * 17 + random() * 6;
            mechPipes.push(rec(mSide * 5.1, 0.95 + random() * 0.3, mz, 0.18, 0.18, 4.2 + random() * 2));
            mechPipes.push(rec(mSide * 5.4, 0.5, mz - 1.4, 0.14, 1.0, 0.14));
            mechPipes.push(rec(mSide * 5.4, 0.5, mz + 1.4, 0.14, 1.0, 0.14));
            if (mi2 % 2 === 0) {
                mechWrecks.push(rec(mSide * 6.6, 0.55, mz + 3, 1.0, 1.1, 0.9, random() * TAU));
                mechWrecks.push(rec(mSide * 6.6, 1.25, mz + 3, 0.5, 0.4, 0.5, random() * TAU));
                mechStrips.push(rec(mSide * 6.6, 0.9, mz + 3.42, 0.5, 0.08, 0.04));
            }
            if (mi2 % 3 === 1) {
                mechFrames.push(rec(mSide * 5.2, 1.6, mz - 3, 0.5, 3.2, 0.5));
                mechStrips.push(rec(mSide * 5.2, 2.6, mz - 3, 0.56, 0.3, 0.56));
            }
            mechDebris.push(rec(mSide * (4.8 + random() * 1.6), 0.05, mz + random() * 6 - 3, 0.5 + random() * 0.7, 0.04, 0.6 + random() * 0.8, random() * TAU));
            mechDebris.push(rec(mSide * (4.95 + random() * 1.8), 0.05, mz + random() * 8 - 4, 0.4 + random() * 0.6, 0.04, 0.5 + random() * 0.7, random() * TAU));
        }
        addInstancedCategory(env, 'mech-pipes', new THREE.CylinderGeometry(0.5, 0.5, 1, 9), makeCityMaterial(0x6E7076, { roughness: 0.4, metalness: 0.6 }), mechPipes, { themes: ['mechanical'], castShadow: true });
        addInstancedCategory(env, 'mech-wreck-frames', box, makeCityMaterial(0x4E5258, { roughness: 0.5, metalness: 0.55 }), mechWrecks, { themes: ['mechanical'], castShadow: true });
        addInstancedCategory(env, 'mech-pylons', box, makeCityMaterial(0x565A60, { roughness: 0.45, metalness: 0.6 }), mechFrames, { themes: ['mechanical'], castShadow: true });
        var mechStripMat = new THREE.MeshBasicMaterial({ color: 0x54D8E8, toneMapped: false }); mechStripMat.__noThemeTint = true;
        addInstancedCategory(env, 'mech-strips', box, mechStripMat, mechStrips, { themes: ['mechanical'] });
        addInstancedCategory(env, 'mech-debris', box, makeCityMaterial(0x3E4248, { roughness: 0.7, metalness: 0.4 }), mechDebris, { themes: ['mechanical'] });

        // —— 最终防线(fortress): 防御墙/瞭望塔/废弃坦克/沙袋 ——
        var fortWalls = [], fortTowers = [], fortHulls = [], fortTurrets = [], fortSandbags = [];
        for (var fi = 0; fi < 9; fi++) {
            var fSide = fi % 2 ? 1 : -1, fz = 4 - fi * 18 + random() * 5;
            fortWalls.push(rec(fSide * 5.15, 0.85, fz, 1.2, 1.7, 6.5 + random() * 2));
            if (fi % 3 === 0) {
                fortTowers.push(rec(fSide * 6.8, 1.9, fz + 2, 1.3, 3.8, 1.3));
                fortTowers.push(rec(fSide * 6.8, 3.95, fz + 2, 1.7, 0.24, 1.7));
            }
            if (fi % 3 === 1) {
                fortHulls.push(rec(fSide * 6.0, 0.55, fz + 2.6, 1.7, 0.8, 3.2, random() * 0.4 - 0.2));
                fortTurrets.push(rec(fSide * 6.0, 1.12, fz + 2.4, 0.9, 0.45, 1.2, random() * 0.4 - 0.2));
            }
            for (var sb = 0; sb < 3; sb++) {
                fortSandbags.push(rec(fSide * 4.85, 0.1 + sb * 0.11, fz + 1.2 + sb * 0.3, 0.5, 0.18, 0.3, random() * 0.2));
            }
        }
        // Decorative arches removed; gameplay gate rows are separate.
        addInstancedCategory(env, 'fort-walls', box, makeCityMaterial(0x5E6E7C, { roughness: 0.85 }), fortWalls, { themes: ['fortress'], castShadow: true });
        addInstancedCategory(env, 'fort-towers', box, makeCityMaterial(0x5E6E7C, { roughness: 0.8, metalness: 0.2 }), fortTowers, { themes: ['fortress'], castShadow: true });
        addInstancedCategory(env, 'fort-tank-hulls', roundedRectGeometry(1, 1, 0.1, 1), makeCityMaterial(0x4A5A50, { roughness: 0.6, metalness: 0.4 }), fortHulls, { themes: ['fortress'], castShadow: true });
        addInstancedCategory(env, 'fort-tank-turrets', box, makeCityMaterial(0x3E4E44, { roughness: 0.55, metalness: 0.5 }), fortTurrets, { themes: ['fortress'], castShadow: true });
        addInstancedCategory(env, 'fort-sandbags', box, makeCityMaterial(0x9A8E6A, { roughness: 0.95 }), fortSandbags, { themes: ['fortress'], castShadow: true });

        // —— 城市斑马线(路面层次, 城市族): 每~44单位一组白色横道, 1 drawCall ——
        var crosswalks = [];
        for (var cw = 0; cw < 4; cw++) {
            var cwz = 12 - cw * 44;
            for (var cst = 0; cst < 5; cst++) {
                crosswalks.push(rec(-2.8 + cst * 1.4, 0.012, cwz, 0.85, 0.012, 0.4));
            }
        }
        addInstancedCategory(env, 'cityx-crosswalk', box, new THREE.MeshBasicMaterial({ color: 0xD8DCE0 }), crosswalks, { themes: CITY_ALIVE });

        // —— 远景剪影(各主题地平线补白, 每主题一类别, 1 drawCall) ——
        var distantSil = makeRecords(26, function (i) {
            var h = 6 + random() * 9;
            return rec((i % 2 ? 1 : -1) * (13 + random() * 8), h * 0.5, 10 - i * 6.2, 3 + random() * 3, h, 3 + random() * 3);
        });
        addInstancedCategory(env, 'apo-silhouette', box, makeCityMaterial(0x3E3038, { roughness: 0.9 }), distantSil, { themes: ['apocalypse'] });
        var mechSil = makeRecords(24, function (i) {
            var h = 7 + random() * 12;
            return rec((i % 2 ? 1 : -1) * (14 + random() * 8), h * 0.5, 10 - i * 6.6, 2.4 + random() * 2.2, h, 2.6 + random() * 2.4);
        });
        addInstancedCategory(env, 'mech-silhouette', box, makeCityMaterial(0x4A4E54, { roughness: 0.6, metalness: 0.4 }), mechSil, { themes: ['mechanical'] });
        var fortSil = makeRecords(22, function (i) {
            var h = 5 + random() * 8;
            return rec((i % 2 ? 1 : -1) * (13 + random() * 9), h * 0.5, 10 - i * 7.0, 3.4 + random() * 3, h, 3.4 + random() * 3);
        });
        addInstancedCategory(env, 'fort-silhouette', box, makeCityMaterial(0x42566A, { roughness: 0.85 }), fortSil, { themes: ['fortress'] });

        // V14: 既有城市类别主题归属 — 末日态保留楼体/枯树/远景, 隐藏商业街具与完好设施
        var membership = {
            'tree-trunks': CITY_FAMILY, 'tree-canopies': CITY_ALIVE, 'tree-crowns': CITY_ALIVE,
            'lamp-poles': CITY_ALIVE, 'lamp-heads': CITY_ALIVE,
            'parked-cars': CITY_ALIVE, 'car-glass': CITY_ALIVE, 'cones': CITY_ALIVE, 'barriers': CITY_ALIVE,
            'cream-buildings': CITY_FAMILY, 'teal-buildings': CITY_FAMILY, 'coral-buildings': CITY_FAMILY,
            'roof-trims': CITY_FAMILY, 'windows': CITY_FAMILY, 'distant-skyline': CITY_FAMILY,
            'street-concrete': CITY_ALIVE, 'shop-windows': CITY_ALIVE, 'shop-frames': CITY_ALIVE,
            'striped-awnings': CITY_ALIVE, 'awning-stripes': CITY_ALIVE, 'planter-shrubs': CITY_ALIVE,
            'parked-car-wheels': CITY_ALIVE, 'street-reflectors': CITY_ALIVE,
            'shop-sign-0': CITY_ALIVE, 'shop-sign-1': CITY_ALIVE, 'shop-sign-2': CITY_ALIVE,
            'clouds': ALL_BUT_CAVE
        };
        for (var mi3 = 0; mi3 < env.entries.length; mi3++) {
            var mEntry = env.entries[mi3];
            var mKey = mEntry.mesh.name.replace('v42-', '');
            if (membership[mKey]) {
                mEntry.themes = membership[mKey];
                mEntry.mesh.visible = false;
            }
        }
        V42Art.setEnvironmentTheme(env, world._themeApplied || 'default');

        for (var ei = 0; ei < env.entries.length; ei++) {
            var entry = env.entries[ei];
            for (var ri = 0; ri < entry.records.length; ri++) setRecordMatrix(entry, ri, env.tempObject);
            entry.mesh.instanceMatrix.needsUpdate = true;
        }
        root.userData.drawCalls = env.drawCalls;
        return env;
    };

    V42Art.updateEnvironment = function (world, squadZ) {
        var env = world && world._v42Environment;
        if (!env || !isFinite(squadZ)) return;
        if (Math.abs(squadZ - env.lastSquadZ) < 0.2) return;
        env.lastSquadZ = squadZ;
        var back = squadZ - (env.span - env.front);
        var front = squadZ + env.front;
        for (var ei = 0; ei < env.entries.length; ei++) {
            var entry = env.entries[ei];
            if (!entry.mesh.visible) continue; // V14: 隐藏主题的类别不参与滚动重排
            var changed = false;
            for (var ri = 0; ri < entry.records.length; ri++) {
                var record = entry.records[ri];
                var oldZ = record.z;
                if (record.z > front) record.z -= env.span * Math.ceil((record.z - front) / env.span);
                else if (record.z < back) record.z += env.span * Math.ceil((back - record.z) / env.span);
                if (record.z !== oldZ) {
                    setRecordMatrix(entry, ri, env.tempObject);
                    changed = true;
                }
            }
            if (changed) entry.mesh.instanceMatrix.needsUpdate = true;
        }
    };

    function makeElement(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function appendOnce(parent, id, node) {
        if (!parent || document.getElementById(id)) return document.getElementById(id);
        node.id = id;
        parent.appendChild(node);
        return node;
    }

    V42Art.installUI = function (game) {
        var container = document.getElementById('game-container');
        if (!container) return false;
        container.classList.add('v42-ui');

        var startPanel = document.querySelector('#start-screen .title-panel');
        if (startPanel && !document.getElementById('v42-brand')) {
            // V11 QA修复[P3]: 版本标识原硬编码V8.0.1, 改读package.json版本号(构建内联)并回退
            var gameVersion = (window.__GAME_VERSION || 'V11').toUpperCase();
            var brand = makeElement('div', 'v42-brand', '膨胀小队 · ' + gameVersion + ' 正式版');
            brand.id = 'v42-brand';
            startPanel.insertBefore(brand, startPanel.firstChild);
        }
        // V5.0: 首页顶栏 — 最高纪录 + 音效开关(任务书9.1)
        if (startPanel && !document.getElementById('v42-home-top')) {
            var homeTop = makeElement('div', 'v42-home-top');
            homeTop.id = 'v42-home-top';
            // V14.2: 顶栏静态图标替换系统Emoji(原创SVG, currentColor, 与宫格图标同规格)
            var ICON = function (paths, cls) {
                return '<svg class="v14-tb-icon ' + (cls || '') + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
            };
            var best = makeElement('span', 'v42-best-record', '');
            best.id = 'v42-best-record';
            best.innerHTML = ICON('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 14v3M9 21h6M10 18h4v3h-4z"/>') + ' <span class="v42-best-text">最高纪录: 第1关</span>';
            var soundBtn = makeElement('button', 'v42-home-sound', '🔊');
            soundBtn.id = 'btn-home-sound';
            soundBtn.setAttribute('aria-label', '音效开关');
            // V5.1: 金币 + 升级商店 + 免费补给
            var left = makeElement('div', 'v42-home-left');
            left.appendChild(best);
            var supplyBtn = makeElement('button', 'v51-supply-btn', '');
            supplyBtn.innerHTML = ICON('<rect x="4" y="9" width="16" height="12" rx="1.6"/><path d="M4 12h16M12 9v12M8.5 9c-2 0-3-1-3-2.4C5.5 5 7 4.6 8.2 5.2L12 9l3.8-3.8C17 4.6 18.5 5 18.5 6.6 18.5 8 17.5 9 15.5 9"/>') + ' 免费补给';
            supplyBtn.id = 'btn-free-supply';
            supplyBtn.setAttribute('aria-label', '每日免费补给(广告)');
            left.appendChild(supplyBtn);
            homeTop.appendChild(left);
            var right = makeElement('div', 'v42-home-right');
            var coinPill = makeElement('span', 'v51-coin-pill');
            coinPill.innerHTML = ICON('<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5v9M14.8 9.2c-.7-.9-1.7-1.3-2.8-1.3-1.6 0-2.9 1-2.9 2.2 0 2.6 5.8 1.5 5.8 4 0 1.3-1.3 2.2-2.9 2.2-1.1 0-2.1-.4-2.8-1.3" class="v14-coin-mark"/>', 'v14-coin-icon') + ' <b data-coin-display>0</b>';
            right.appendChild(coinPill);
            var shopBtn = makeElement('button', 'v51-shop-btn', '');
            shopBtn.innerHTML = ICON('<path d="M12 19V6M6.5 11.5 12 6l5.5 5.5"/>') + ' 升级';
            shopBtn.id = 'btn-open-shop';
            right.appendChild(shopBtn);
            right.appendChild(soundBtn);
            homeTop.appendChild(right);
            startPanel.insertBefore(homeTop, startPanel.firstChild.nextSibling);
        }
        var title = document.querySelector('.game-title');
        if (title) title.textContent = '膨胀小队';
        var subtitle = document.querySelector('.game-subtitle');
        if (subtitle) subtitle.textContent = '城市突围 · 招募火力 · 击破核心';
        var startButton = document.getElementById('btn-start');
        if (startButton) startButton.textContent = '部署小队  →';

        if (startPanel && !document.getElementById('v42-mission-card')) {
            var mission = makeElement('section', 'v42-mission-card');
            mission.id = 'v42-mission-card';
            mission.setAttribute('aria-label', '任务简报');
            var missionTop = makeElement('div', 'v42-mission-topline');
            missionTop.appendChild(makeElement('span', 'v42-mission-label', '当前行动'));
            missionTop.appendChild(makeElement('span', 'v42-live-pill', '●  READY'));
            mission.appendChild(missionTop);
            mission.appendChild(makeElement('strong', 'v42-mission-title', '穿越增益门，扩大编队')); 
            mission.appendChild(makeElement('p', 'v42-mission-copy', '选择路线，叠加人数与火力，在终点击破首领核心。'));
            startPanel.insertBefore(mission, startButton);
        }
        if (startPanel && !document.getElementById('v42-controls')) {
            var controls = makeElement('div', 'v42-controls');
            controls.id = 'v42-controls';
            controls.setAttribute('aria-label', '操作方式');
            controls.appendChild(makeElement('span', 'v42-control-pill', '↔ 拖动变道'));
            controls.appendChild(makeElement('span', 'v42-control-pill', '◆ 选择状态门'));
            var hint = startPanel.querySelector('.hint-text');
            if (hint && hint.parentNode) { hint.parentNode.insertBefore(controls, hint); hint.parentNode.removeChild(hint); } else startPanel.appendChild(controls);
        }

        var levelName = document.getElementById('level-name');
        if (levelName && !document.getElementById('level-subtitle')) {
            var levelSubtitle = makeElement('div', 'v42-level-subtitle', '城市战区 · 突围中');
            levelSubtitle.id = 'level-subtitle';
            levelName.insertAdjacentElement('afterend', levelSubtitle);
        }
        var hud = document.getElementById('hud');
        if (hud) appendOnce(hud, 'v42-wave-banner', makeElement('div', 'v42-wave-banner hidden', '下一波接敌 · 2秒'));

        var bossInfo = document.getElementById('boss-info');
        if (bossInfo && !document.getElementById('boss-phase')) {
            var phase = makeElement('span', 'v42-boss-phase', '阶段 1');
            phase.id = 'boss-phase';
            var bossName = document.getElementById('boss-name');
            if (bossName) bossName.appendChild(phase); else bossInfo.insertBefore(phase, bossInfo.firstChild);
        }

        var pausePanel = document.querySelector('#pause-screen .title-panel');
        if (pausePanel && !pausePanel.querySelector('.v42-panel-kicker')) {
            pausePanel.insertBefore(makeElement('div', 'v42-panel-kicker', '行动已冻结'), pausePanel.firstChild);
        }
        var winPanel = document.querySelector('#win-screen .title-panel');
        if (winPanel && !winPanel.querySelector('.v42-panel-kicker')) {
            winPanel.insertBefore(makeElement('div', 'v42-panel-kicker gold', '任务完成'), winPanel.firstChild);
        }
        var losePanel = document.querySelector('#lose-screen .title-panel');
        if (losePanel && !losePanel.querySelector('.v42-panel-kicker')) {
            losePanel.insertBefore(makeElement('div', 'v42-panel-kicker red', '行动中断'), losePanel.firstChild);
        }

        if (game && game.ui) {
            game.ui.levelSubtitle = document.getElementById('level-subtitle');
            game.ui.waveBanner = document.getElementById('v42-wave-banner');
            game.ui.bossPhase = document.getElementById('boss-phase');
            game.ui.bestRecord = document.getElementById('v42-best-record');
            game.ui.homeSound = document.getElementById('btn-home-sound');
        }
        return true;
    };

    V42Art.pbr = { prepare: preparePbr };
    global.V42Art = V42Art;
})(window);
