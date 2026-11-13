// ===== V4.2 presentation layer: gates, city dressing and UI composition =====
(function (global) {
    'use strict';

    var V42Art = {};
    var TAU = Math.PI * 2;

    var GATE_STYLES = {
        add:  { kind: 'common', title: '增援', frame: 0x2F77D0, dark: 0x173E82, light: 0x78E6FF, glass: 0x47BCEB },
        mul:  { kind: 'epic',   title: '倍增', frame: 0xEAAE32, dark: 0x8C4D13, light: 0xFFF09A, glass: 0xE8BC48 },
        buff: { kind: 'rare',   title: '强化', frame: 0x8454D6, dark: 0x43227C, light: 0xE8B8FF, glass: 0xA96DE1 },
        risk: { kind: 'danger', title: '风险', frame: 0xD94B55, dark: 0x711F35, light: 0xFF9C82, glass: 0xE45B68 }
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
        var rgb = Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255);
        var grad = ctx.createLinearGradient(0, 0, 256, 512);
        grad.addColorStop(0, 'rgba(255,255,255,.72)');
        grad.addColorStop(0.14, 'rgba(' + rgb + ',.48)');
        grad.addColorStop(0.72, 'rgba(' + rgb + ',.18)');
        grad.addColorStop(1, 'rgba(255,255,255,.38)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 512);
        ctx.strokeStyle = 'rgba(255,255,255,.28)';
        ctx.lineWidth = 3;
        for (var y = -220; y < 640; y += 92) {
            ctx.beginPath();
            ctx.moveTo(-30, y);
            ctx.lineTo(286, y + 160);
            ctx.stroke();
        }
        var edge = ctx.createLinearGradient(0, 0, 256, 0);
        edge.addColorStop(0, 'rgba(255,255,255,.7)');
        edge.addColorStop(.07, 'rgba(255,255,255,.08)');
        edge.addColorStop(.93, 'rgba(255,255,255,.05)');
        edge.addColorStop(1, 'rgba(255,255,255,.55)');
        ctx.fillStyle = edge;
        ctx.fillRect(0, 0, 256, 512);
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

    function makeGateTextTexture(label, style) {
        var measure = document.createElement('canvas').getContext('2d');
        measure.font = '900 164px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
        var lines = [label];
        var fullWidth = measure.measureText(label).width;
        if (/\s/.test(label) && fullWidth > 650) {
            var words = label.trim().split(/\s+/);
            lines = [words.shift(), words.join(' ')];
        }
        var buffMatch=label.match(/^([\u4e00-\u9fff]+)([+×]\d+%?)$/);
        if(buffMatch)lines=[buffMatch[1],buffMatch[2]];
        var measuredWidth = 0;
        for (var li = 0; li < lines.length; li++) {
            measuredWidth = Math.max(measuredWidth, measure.measureText(lines[li]).width);
        }
        var canvas = document.createElement('canvas');
        // Crop short values much tighter than long Chinese buffs. The sprite can
        // then use the full pane width without making "+25" look like footnote text.
        canvas.width = Math.round(clampNumber(measuredWidth + 190, 480, 1024));
        canvas.height = 256;
        var ctx = canvas.getContext('2d');
        var glow = new THREE.Color(style.light);
        var frame = new THREE.Color(style.dark);
        var glowCss = '#' + glow.getHexString();
        var frameCss = '#' + frame.getHexString();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var panel = ctx.createLinearGradient(0, 20, 0, 238);
        panel.addColorStop(0, 'rgba(255,255,255,.16)');
        panel.addColorStop(0.46, 'rgba(9,19,48,.36)');
        panel.addColorStop(1, 'rgba(5,12,31,.18)');
        ctx.fillStyle = panel;
        ctx.strokeStyle = 'rgba(255,255,255,.45)';
        ctx.lineWidth = 5;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(24, 24, canvas.width - 48, 208, 42);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(24, 24, canvas.width - 48, 208);
            ctx.strokeRect(24, 24, canvas.width - 48, 208);
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 30px "Microsoft YaHei", Arial, sans-serif';
        ctx.letterSpacing = '7px';
        ctx.fillStyle = glowCss;
        if (lines.length === 1) {
            ctx.fillText('◆  ' + style.title + '  ◆', canvas.width * 0.5, 62);
        }

        ctx.letterSpacing='0px';
        var fontSize = lines.length > 1 ? 128 : 164;
        var maxWidth = canvas.width - 112;
        do {
            ctx.font = '900 ' + fontSize + 'px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
            var widest = 0;
            for (var ti = 0; ti < lines.length; ti++) widest = Math.max(widest, ctx.measureText(lines[ti]).width);
            if (widest <= maxWidth) break;
            fontSize -= 4;
        } while (fontSize > 54);
        ctx.lineJoin = 'round';
        ctx.strokeStyle = frameCss;
        ctx.lineWidth = Math.max(6, fontSize * 0.065);
        ctx.shadowColor = glowCss;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFFFFF';
        if (lines.length > 1) {
            ctx.strokeText(lines[0], canvas.width * 0.5, 78);
            ctx.fillText(lines[0], canvas.width * 0.5, 78);
            ctx.strokeText(lines[1], canvas.width * 0.5, 178);
            ctx.fillText(lines[1], canvas.width * 0.5, 178);
        } else {
            ctx.strokeText(label, canvas.width * 0.5, 157);
            ctx.fillText(label, canvas.width * 0.5, 157);
        }
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
        var style = GATE_STYLES[gateData.op] || GATE_STYLES.add;
        // ExtrudeGeometry's size + thickness bevel envelope adds ~.065 per edge.
        // Capping the design width at 1.77 keeps the measured Box3 <= 1.9.
        var width = clampNumber(Number(gateWidth) || 1.8, 1.35, 1.77);
        var group = new THREE.Group();
        var frameParts = [];
        var trimParts = [];
        var postW = 0.22;
        var postH = 1.68;

        frameParts.push({ geo: applyTransform(roundedRectGeometry(postW, postH, 0.09, 0.24), -width * 0.5 + postW * 0.5, 0.90, 0), color: style.frame });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(postW, postH, 0.09, 0.24),  width * 0.5 - postW * 0.5, 0.90, 0), color: style.frame });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(width, 0.22, 0.09, 0.25), 0, 1.74, 0), color: style.frame });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.30, 0.16, 0.07, 0.32), -width * 0.5 + postW * 0.5, 0.11, 0.01), color: style.dark });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.30, 0.16, 0.07, 0.32),  width * 0.5 - postW * 0.5, 0.11, 0.01), color: style.dark });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(width * 0.48, 0.11, 0.05, 0.28), 0, 1.84, 0), color: style.dark });

        var insetX = width * 0.5 - 0.155;
        trimParts.push({ geo: applyTransform(roundedRectGeometry(0.034, 1.42, 0.014, 0.035), -insetX, 0.94, -0.145), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(0.034, 1.42, 0.014, 0.035),  insetX, 0.94, -0.145), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(width - 0.30, 0.034, 0.014, 0.035), 0, 1.64, -0.145), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(width - 0.30, 0.034, 0.014, 0.035), 0, 0.24, -0.145), color: style.light });
        addGateOrnament(trimParts, style, gateData.op, width);

        var frameMat = preparePbr(new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.29,
            metalness: 0.43,
            emissive: new THREE.Color(style.dark),
            emissiveIntensity: 0.13
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
            color: style.glass,
            map: glassTexture,
            transparent: true,
            opacity: 0.5,
            roughness: 0.13,
            metalness: 0.04,
            clearcoat: 0.8,
            clearcoatRoughness: 0.18,
            emissive: new THREE.Color(style.glass).multiplyScalar(0.28),
            emissiveIntensity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false
        }));
        var glass = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.31, 1.39), glassMat);
        glass.position.set(0, 0.94, -0.105);
        group.add(glass);

        // Keep every visible component, including the soft floor wash, inside
        // the single-lane 1.9-unit footprint.
        var glowPlane = new THREE.PlaneGeometry(Math.min(1.9, width + 0.08), 0.62);
        var ringGeo = new THREE.RingGeometry(width * 0.31, width * 0.47, 28);
        var groundGeo = mergeGeometries([colorize(glowPlane, style.glass), colorize(ringGeo, style.light)]);
        glowPlane.dispose();
        ringGeo.dispose();
        var groundMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.24,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
        });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI * 0.5;
        ground.position.y = 0.015;
        group.add(ground);

        var labelTexture = makeGateTextTexture(formatGateLabel(gateData), style);
        var labelMat = new THREE.SpriteMaterial({
            map: labelTexture,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            toneMapped: false
        });
        var label = new THREE.Sprite(labelMat);
        var labelWidth = width - 0.30;
        var labelHeight = labelWidth * labelTexture.image.height / labelTexture.image.width;
        if (labelTexture.userData.v42Multiline) labelHeight = Math.max(labelHeight, 0.72);
        label.scale.set(labelWidth, labelHeight, 1);
        label.position.set(0, 1.03, -0.175);
        label.renderOrder = 2;
        group.add(label);

        group.userData.artSource = 'V42Art.createGateModel/' + style.kind + '/procedural-beveled-PBR';
        group.userData.qualityKind = style.kind;
        group.userData.label = label;
        group.userData.labelBaseY = 1.03;
        group.userData.glass = glass;
        group.userData.glow = ground;
        group.userData.ring = ground;
        group.userData.drawCalls = 5;
        group.userData.ownsResources = true;
        return group;
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
        var entry = { mesh: mesh, records: records };
        env.entries.push(entry);
        env.drawCalls++;
        return entry;
    }

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

        var cream = makeCityMaterial(0xE8D9BC);
        var teal = makeCityMaterial(0x2D7778, { roughness: 0.58, metalness: 0.08 });
        var coral = makeCityMaterial(0xD77A67);
        var leaf = makeCityMaterial(0x70A77B, { roughness: 0.9 });
        var trunk = makeCityMaterial(0x8B684B, { roughness: 0.92 });
        var glass = makeCityMaterial(0x93C6C7, { roughness: 0.22, metalness: 0.18 });
        var warmLight = new THREE.MeshBasicMaterial({ color: 0xFFE5A3, toneMapped: false });
        var charcoal = makeCityMaterial(0x304552, { roughness: 0.5, metalness: 0.25 });
        var cloudMat = new THREE.MeshLambertMaterial({ color: 0xFFF7E9, transparent: true, opacity: 0.82 });

        var roadside = makeRecords(27, function (i) {
            var side = i % 2 ? 1 : -1;
            return { x: side * (4.8 + random() * 1.7), y: 0, z: 10 - i * 6.15 + random() * 1.1, s: side };
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
        addInstancedCategory(env, 'barriers', roundedRectGeometry(0.96, 0.27, 0.07, 0.14), cream,
            propBase.filter(function (_, i) { return i % 3 === 2; }).map(function (r) { return { x: r.x, y: 0.42, z: r.z, ry: r.s > 0 ? -0.15 : 0.15 }; }), { castShadow: true });

        var buildings = makeRecords(24, function (i) {
            var side = i % 2 ? 1 : -1;
            var h = 3.8 + random() * 4.8;
            var w = 1.7 + random() * 1.45;
            return { x: side * (9.2 + random() * 4.6), y: h * 0.5, z: 12 - i * 7.05, sx: w, sy: h, sz: 1.8 + random() * 0.8, h: h, w: w, s: side };
        });
        var buildingGeo = roundedRectGeometry(1, 1, 0.08, 1);
        addInstancedCategory(env, 'cream-buildings', buildingGeo, cream,
            buildings.filter(function (_, i) { return i % 3 === 0; }));
        addInstancedCategory(env, 'teal-buildings', roundedRectGeometry(1, 1, 0.08, 1), teal,
            buildings.filter(function (_, i) { return i % 3 === 1; }));
        addInstancedCategory(env, 'coral-buildings', roundedRectGeometry(1, 1, 0.08, 1), coral,
            buildings.filter(function (_, i) { return i % 3 === 2; }));

        // A single overhanging cap gives the skyline a deliberate toy-city
        // silhouette without multiplying each building into several meshes.
        addInstancedCategory(env, 'roof-trims', new THREE.BoxGeometry(1, 0.14, 1), teal,
            buildings.map(function (b) {
                return {
                    x: b.x,
                    y: b.h * 1.06,
                    z: b.z,
                    sx: b.w * 1.08,
                    sy: 1,
                    sz: b.sz * 1.07
                };
            }));

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

        var clouds = makeRecords(12, function (i) {
            var side = i % 2 ? 1 : -1;
            return { x: side * (3 + random() * 7), y: 8.5 + random() * 3.8, z: 14 - i * 13.4, sx: 1.4 + random() * 1.2, sy: 0.75 + random() * 0.4, sz: 0.8 + random() * 0.4, ry: random() * TAU };
        });
        addInstancedCategory(env, 'clouds', new THREE.IcosahedronGeometry(0.78, 1), cloudMat, clouds);

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
            var brand = makeElement('div', 'v42-brand', 'TACTICAL RUN · V42');
            brand.id = 'v42-brand';
            startPanel.insertBefore(brand, startPanel.firstChild);
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
            if (hint) hint.replaceWith(controls); else startPanel.appendChild(controls);
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
        }
        return true;
    };

    V42Art.pbr = { prepare: preparePbr };
    global.V42Art = V42Art;
})(window);
