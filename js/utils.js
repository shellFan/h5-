// ===== 工具函数 =====

/** 缓动: 弹出回弹 */
function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** 缓动: 平滑 */
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

/** 线性插值 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/** 帧率无关的阻尼插值 */
function damp(current, target, lambda, dt) {
    return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** 限制范围 */
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

/** 随机范围 */
function randRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * 将多个 BufferGeometry 合并为一个，支持顶点色。
 * 所有几何体必须具有 position、normal、uv 属性。
 */
function mergeGeometries(geometries) {
    let totalVerts = 0;
    let totalIndices = 0;
    for (let i = 0; i < geometries.length; i++) {
        const g = geometries[i];
        totalVerts += g.attributes.position.count;
        if (g.index) totalIndices += g.index.count;
        else totalIndices += g.attributes.position.count;
    }

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const colors = new Float32Array(totalVerts * 3);
    const indices = new (totalVerts > 65535 ? Uint32Array : Uint16Array)(totalIndices);

    let vOff = 0;
    let iOff = 0;
    for (let i = 0; i < geometries.length; i++) {
        const g = geometries[i];
        const cnt = g.attributes.position.count;

        positions.set(g.attributes.position.array, vOff * 3);
        normals.set(g.attributes.normal.array, vOff * 3);
        if (g.attributes.uv) {
            uvs.set(g.attributes.uv.array, vOff * 2);
        }
        if (g.attributes.color) {
            colors.set(g.attributes.color.array, vOff * 3);
        }

        if (g.index) {
            const idx = g.index.array;
            for (let j = 0; j < idx.length; j++) {
                indices[iOff + j] = idx[j] + vOff;
            }
            iOff += idx.length;
        } else {
            for (let j = 0; j < cnt; j++) {
                indices[iOff + j] = j + vOff;
            }
            iOff += cnt;
        }
        vOff += cnt;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
    return merged;
}

/**
 * 给几何体添加顶点色
 */
function colorize(geo, hexColor) {
    const cnt = geo.attributes.position.count;
    const colors = new Float32Array(cnt * 3);
    const c = new THREE.Color(hexColor);
    for (let i = 0; i < cnt; i++) {
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
}

/**
 * 变换几何体: 旋转+平移+缩放，然后返回新引用
 */
function transformGeo(geo, px, py, pz, rx, ry, rz, sx, sy, sz) {
    if (rx) geo.rotateX(rx);
    if (ry) geo.rotateY(ry);
    if (rz) geo.rotateZ(rz);
    if (sx !== undefined) geo.scale(sx, sy !== undefined ? sy : sx, sz !== undefined ? sz : sx);
    geo.translate(px || 0, py || 0, pz || 0);
    return geo;
}

/**
 * 创建 Canvas 文字纹理 (用于状态门数值等)
 */
function createTextTexture(text, opts) {
    opts = opts || {};
    const maxFontSize = opts.fontSize || 80;
    const canvasHeight = opts.height || 128;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 先用最大字号测量文字宽度，自适应缩放字号确保完整显示
    ctx.font = '900 ' + maxFontSize + 'px Arial, sans-serif';
    var metrics = ctx.measureText(text);
    var textWidth = metrics.width;
    // 画布宽度 = 文字宽度 + 左右padding，上限512
    var canvasWidth = Math.min(Math.ceil(textWidth + maxFontSize * 0.6), 512);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 若文字超宽则缩小字号
    var fontSize = maxFontSize;
    if (textWidth > canvasWidth - maxFontSize * 0.4) {
        fontSize = Math.floor(maxFontSize * (canvasWidth - maxFontSize * 0.4) / textWidth);
    }

    if (opts.bg) {
        ctx.fillStyle = opts.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = '900 ' + fontSize + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 描边
    if (opts.stroke) {
        ctx.strokeStyle = opts.stroke;
        ctx.lineWidth = opts.strokeWidth || 8;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    }

    ctx.fillStyle = opts.fill || '#ffffff';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}