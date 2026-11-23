// ===== V14: 程序化武器 GLB 生成器 =====
// 无 Blender 环境下的程序化建模管线: 纯 Node 写出 glTF 2.0 GLB(自包含, 无外部纹理依赖)。
// 每把枪由参数化几何件(box/cyl)组成, 两套材质(枪体金属 + 配件), 枪口朝 -Z。
// 运行: node tools/v14-weapon-glb.js  →  assets/models/weapons/<id>/<id>.glb
'use strict';
const fs = require('fs');
const path = require('path');

// ---------- 几何原语(返回 {pos:[], idx:[], mat:0}) ----------
function box(cx, cy, cz, sx, sy, sz, mat) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    const v = [
        x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1, // 前(+Z)
        x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0, // 后(-Z)
        x0, y1, z0, x0, y1, z1, x0, y0, z1, x0, y0, z0, // 左
        x1, y1, z1, x1, y1, z0, x1, y0, z0, x1, y0, z1, // 右
        x0, y1, z1, x1, y1, z1, x1, y1, z0, x0, y1, z0, // 顶
        x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1  // 底
    ];
    // 每面解析法线(前/后/左/右/顶/底)
    const n = [];
    const faceN = [[0,0,1],[0,0,-1],[-1,0,0],[1,0,0],[0,1,0],[0,-1,0]];
    for (const fn of faceN) for (let k = 0; k < 4; k++) n.push(fn[0], fn[1], fn[2]);
    const q = [
        0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
    ];
    return { pos: v, nrm: n, idx: q, mat: mat || 0 };
}
function cyl(cx, cy, cz, r0, r1, len, axis, seg, mat) {
    const pos = [], idx = [];
    seg = seg || 10;
    const half = len / 2;
    const nrm = [];
    for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const rA = i % 2 && r1 !== undefined ? r1 : r0; // 交替半径产生棱面感
        if (axis === 'z') { pos.push(cx + c * rA, cy + s * rA, cz + half); pos.push(cx + c * rA, cy + s * rA, cz - half); nrm.push(c, s, 0, c, s, 0); }
        else if (axis === 'y') { pos.push(cx + c * rA, cy + half, cz + s * rA); pos.push(cx + c * rA, cy - half, cz + s * rA); nrm.push(c, 0, s, c, 0, s); }
        else { pos.push(cx + half, cy + c * rA, cz + s * rA); pos.push(cx - half, cy + c * rA, cz + s * rA); nrm.push(0, c, s, 0, c, s); }
    }
    for (let i = 0; i < seg; i++) {
        const a = i * 2, b = a + 1, c2 = a + 2, d = a + 3;
        idx.push(a, c2, b, b, c2, d);
    }
    return { pos, nrm, idx, mat: mat || 0 };
}

// ---------- 武器定义(枪口朝 -Z, 单位与世界一致, 总长~0.9) ----------
const M_BODY = 0, M_POLY = 1, M_ACCENT = 2;
const WEAPONS = {
    rifle: {
        name: '标准步枪', accent: [0.30, 0.55, 0.95, 1],
        parts: [
            box(0, 0.02, 0.05, 0.13, 0.14, 0.6, M_BODY),
            cyl(0, 0.05, -0.42, 0.03, 0.034, 0.42, 'z', 8, M_BODY),
            box(0, 0.02, -0.2, 0.135, 0.145, 0.12, M_ACCENT),
            box(0, -0.09, 0.32, 0.07, 0.17, 0.24, M_POLY),
            box(0, -0.13, 0.44, 0.09, 0.11, 0.14, M_POLY),
            box(0, -0.11, 0.05, 0.075, 0.18, 0.09, M_POLY),
            box(0, -0.1, -0.08, 0.085, 0.21, 0.11, M_ACCENT),
            box(0, 0.12, -0.1, 0.055, 0.05, 0.26, M_ACCENT),
            box(0, 0.15, -0.02, 0.05, 0.06, 0.09, M_ACCENT)
        ]
    },
    shotgun: {
        name: '散弹枪', accent: [0.85, 0.42, 0.16, 1],
        parts: [
            box(0, 0.03, 0.08, 0.14, 0.15, 0.54, M_BODY),
            cyl(0, 0.06, -0.4, 0.042, 0.046, 0.5, 'z', 8, M_BODY),
            cyl(0, 0.005, -0.34, 0.033, 0.035, 0.36, 'z', 8, M_ACCENT),
            cyl(0, 0.06, -0.62, 0.05, 0.05, 0.05, 'z', 10, M_ACCENT),
            box(0, -0.08, 0.3, 0.08, 0.16, 0.26, M_POLY),
            box(0, -0.13, 0.44, 0.1, 0.11, 0.13, M_POLY),
            box(0, -0.1, 0.08, 0.075, 0.17, 0.09, M_POLY)
        ]
    },
    sniper: {
        name: '狙击枪', accent: [0.85, 0.72, 0.34, 1],
        parts: [
            box(0, 0.02, 0.1, 0.11, 0.13, 0.64, M_BODY),
            cyl(0, 0.04, -0.52, 0.026, 0.03, 0.56, 'z', 8, M_BODY),
            cyl(0, 0.16, 0.02, 0.048, 0.052, 0.3, 'z', 10, M_ACCENT),
            cyl(0, 0.16, -0.15, 0.058, 0.058, 0.05, 'z', 10, M_ACCENT),
            box(0, 0.16, 0.1, 0.1, 0.02, 0.5, M_ACCENT),
            box(0, -0.1, 0.34, 0.075, 0.16, 0.3, M_POLY),
            box(0, -0.13, 0.48, 0.09, 0.1, 0.13, M_POLY),
            box(0, -0.1, 0.06, 0.07, 0.16, 0.09, M_POLY),
            box(0, -0.09, -0.06, 0.07, 0.14, 0.08, M_BODY)
        ]
    },
    mg: {
        name: '机枪', accent: [0.42, 0.52, 0.30, 1],
        parts: [
            box(0, 0.03, 0.06, 0.15, 0.17, 0.58, M_BODY),
            cyl(0, 0.05, -0.42, 0.036, 0.04, 0.46, 'z', 8, M_BODY),
            cyl(0, -0.14, -0.05, 0.105, 0.105, 0.1, 'z', 10, M_ACCENT),
            cyl(0, 0.05, -0.62, 0.045, 0.045, 0.06, 'z', 10, M_ACCENT),
            box(0, -0.1, 0.3, 0.08, 0.16, 0.24, M_POLY),
            box(0, -0.11, 0.1, 0.075, 0.16, 0.1, M_POLY),
            box(0, 0.13, -0.12, 0.05, 0.05, 0.3, M_ACCENT),
            box(0, -0.02, -0.68, 0.02, 0.14, 0.02, M_BODY),
            box(0, -0.02, -0.64, 0.02, 0.14, 0.02, M_BODY)
        ]
    },
    flamethrower: {
        name: '火焰喷射器', accent: [0.92, 0.34, 0.12, 1],
        parts: [
            box(0, 0.03, 0.1, 0.14, 0.16, 0.48, M_BODY),
            cyl(0, 0.05, -0.34, 0.034, 0.05, 0.4, 'z', 8, M_BODY),
            cyl(0.1, 0.12, 0.24, 0.08, 0.08, 0.3, 'z', 10, M_ACCENT),
            cyl(-0.1, 0.12, 0.24, 0.08, 0.08, 0.3, 'z', 10, M_ACCENT),
            box(0, -0.1, 0.08, 0.075, 0.16, 0.09, M_POLY),
            cyl(0, 0.05, -0.56, 0.055, 0.03, 0.1, 'z', 10, M_ACCENT)
        ]
    },
    rocket: {
        name: '火箭炮', accent: [0.95, 0.42, 0.14, 1],
        parts: [
            cyl(0, 0.06, -0.02, 0.085, 0.09, 0.9, 'z', 12, M_BODY),    // 发射筒
            cyl(0, 0.06, -0.48, 0.095, 0.095, 0.09, 'z', 12, M_ACCENT),// 筒口箍
            cyl(0, 0.06, 0.42, 0.093, 0.093, 0.07, 'z', 12, M_ACCENT), // 筒尾箍
            box(0, -0.055, -0.02, 0.07, 0.1, 0.66, M_BODY),            // 下挂导轨
            box(0, -0.13, 0.24, 0.08, 0.16, 0.22, M_POLY),             // 前握把
            box(0, -0.12, 0.05, 0.075, 0.15, 0.1, M_POLY),             // 后握把
            box(0, -0.11, 0.42, 0.09, 0.14, 0.16, M_POLY),             // 肩托
            box(0, 0.17, 0.1, 0.05, 0.09, 0.24, M_ACCENT),             // 提把
            box(0, 0.17, -0.3, 0.06, 0.12, 0.07, M_ACCENT)             // 光学瞄具
        ]
    },
    freeze: {
        name: '冰冻枪', accent: [0.42, 0.78, 0.95, 1],
        parts: [
            box(0, 0.02, 0.1, 0.13, 0.15, 0.48, M_BODY),
            cyl(0, 0.04, -0.34, 0.034, 0.038, 0.4, 'z', 8, M_BODY),
            cyl(0, 0.04, -0.18, 0.065, 0.065, 0.05, 'z', 10, M_ACCENT),
            cyl(0, 0.04, -0.28, 0.065, 0.065, 0.05, 'z', 10, M_ACCENT),
            cyl(0, 0.04, -0.38, 0.065, 0.065, 0.05, 'z', 10, M_ACCENT),
            cyl(0.09, 0.14, 0.22, 0.065, 0.065, 0.26, 'z', 10, M_ACCENT),
            box(0, -0.09, 0.08, 0.075, 0.15, 0.09, M_POLY),
            box(0, 0.12, 0.05, 0.05, 0.05, 0.3, M_ACCENT)
        ]
    },
    tesla: {
        name: '电磁枪', accent: [0.55, 0.38, 0.92, 1],
        parts: [
            box(0, 0.02, 0.1, 0.13, 0.15, 0.46, M_BODY),
            box(0, 0.03, -0.3, 0.075, 0.075, 0.4, M_BODY),
            cyl(0, 0.03, -0.14, 0.085, 0.085, 0.045, 'z', 10, M_ACCENT),
            cyl(0, 0.03, -0.28, 0.085, 0.085, 0.045, 'z', 10, M_ACCENT),
            cyl(0, 0.03, -0.42, 0.085, 0.085, 0.045, 'z', 10, M_ACCENT),
            box(0, 0.03, -0.56, 0.03, 0.03, 0.16, M_ACCENT),
            box(0, -0.09, 0.08, 0.075, 0.15, 0.09, M_POLY),
            cyl(0.09, 0.13, 0.26, 0.058, 0.058, 0.2, 'z', 10, M_ACCENT)
        ]
    }
};

// ---------- glTF 2.0 GLB 写出 ----------
function buildGlb(def) {
    // 合并全部几何件, 按材质分组
    let vOffset = [0, 0, 0];
    const posAll = [[], [], []], nrmAll = [[], [], []], idxAll = [[], [], []];
    for (const part of def.parts) {
        posAll[part.mat].push(...part.pos);
        nrmAll[part.mat].push(...part.nrm);
        for (const i of part.idx) idxAll[part.mat].push(i + vOffset[part.mat]);
        vOffset[part.mat] += part.pos.length / 3;
    }
    const prims = [];
    let binSize = 0;
    const chunks = [];
    const mats = [
        { name: 'gunmetal', pbrMetallicRoughness: { baseColorFactor: [0.13, 0.15, 0.19, 1], metallicFactor: 0.45, roughnessFactor: 0.52 } },
        { name: 'polymer', pbrMetallicRoughness: { baseColorFactor: [0.055, 0.065, 0.09, 1], metallicFactor: 0.12, roughnessFactor: 0.75 } },
        { name: 'accent', pbrMetallicRoughness: { baseColorFactor: def.accent, metallicFactor: 0.35, roughnessFactor: 0.45 } }
    ];
    for (let m = 0; m < 2; m++) {
        if (!idxAll[m].length) continue;
        const pos = new Float32Array(posAll[m]);
        const nrm = new Float32Array(nrmAll[m]);
        const idx = new Uint32Array(idxAll[m]);
        let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (let i = 0; i < pos.length; i += 3) {
            minX = Math.min(minX, pos[i]); maxX = Math.max(maxX, pos[i]);
            minY = Math.min(minY, pos[i + 1]); maxY = Math.max(maxY, pos[i + 1]);
            minZ = Math.min(minZ, pos[i + 2]); maxZ = Math.max(maxZ, pos[i + 2]);
        }
        const posBytes = pos.byteLength, nrmBytes = nrm.byteLength, idxBytes = idx.byteLength;
        const posView = { buffer: 0, byteOffset: binSize, byteLength: posBytes, target: 34962 };
        const nrmView = { buffer: 0, byteOffset: binSize + posBytes, byteLength: nrmBytes, target: 34962 };
        const idxView = { buffer: 0, byteOffset: binSize + posBytes + nrmBytes, byteLength: idxBytes, target: 34963 };
        chunks.push({ view: posView, data: Buffer.from(pos.buffer) });
        chunks.push({ view: nrmView, data: Buffer.from(nrm.buffer) });
        chunks.push({ view: idxView, data: Buffer.from(idx.buffer) });
        binSize += posBytes + nrmBytes + idxBytes;
        prims.push({
            attributes: { POSITION: chunks.length - 3, NORMAL: chunks.length - 2 },
            indices: chunks.length - 1,
            material: m,
            mode: 4
        });
        // 记录 accessor 范围(延迟填)
        chunks[chunks.length - 3].accessor = {
            bufferView: chunks.length - 3, componentType: 5126, count: pos.length / 3,
            type: 'VEC3', min: [minX, minY, minZ], max: [maxX, maxY, maxZ]
        };
        chunks[chunks.length - 2].accessor = {
            bufferView: chunks.length - 2, componentType: 5126, count: nrm.length / 3, type: 'VEC3'
        };
        chunks[chunks.length - 1].accessor = {
            bufferView: chunks.length - 1, componentType: 5125, count: idx.length, type: 'SCALAR'
        };
    }
    // 填充 accessor/binview 引用
    const accessors = chunks.map(c => c.accessor);
    const bufferViews = chunks.map(c => ({ buffer: 0, byteOffset: c.view.byteOffset, byteLength: c.view.byteLength, target: c.view.target }));
    // BIN 对齐 4
    const binPad = (4 - (binSize % 4)) % 4;
    const bin = Buffer.alloc(binSize + binPad);
    for (const c of chunks) c.data.copy(bin, c.view.byteOffset);

    const gltf = {
        asset: { version: '2.0', generator: 'pz-v14-procedural-weapon-builder' },
        scene: 0,
        scenes: [{ name: def.name, nodes: [0] }],
        nodes: [{ name: 'weapon-root', mesh: 0 }],
        meshes: [{ name: def.name, primitives: prims }],
        materials: mats,
        accessors,
        bufferViews,
        buffers: [{ byteLength: bin.length }]
    };
    const jsonBuf = Buffer.from(JSON.stringify(gltf), 'utf8');
    const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
    const jsonChunk = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);
    const header = Buffer.alloc(12);
    const total = 12 + 8 + jsonChunk.length + 8 + bin.length;
    header.writeUInt32LE(0x46546C67, 0); // glTF
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(total, 8);
    const jsonHeader = Buffer.alloc(8);
    jsonHeader.writeUInt32LE(jsonChunk.length, 0);
    jsonHeader.writeUInt32LE(0x4E4F534A, 4); // JSON
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(bin.length, 0);
    binHeader.writeUInt32LE(0x004E4942, 4); // BIN
    return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, bin]);
}

const outRoot = path.join(__dirname, '..', 'assets', 'models', 'weapons');
const stats = [];
for (const id of Object.keys(WEAPONS)) {
    const dir = path.join(outRoot, id);
    fs.mkdirSync(dir, { recursive: true });
    const buf = buildGlb(WEAPONS[id]);
    const file = path.join(dir, id + '.glb');
    fs.writeFileSync(file, buf);
    stats.push({ id, name: WEAPONS[id].name, bytes: buf.length });
    console.log('✓', id, (buf.length / 1024).toFixed(1) + 'KB');
}
fs.writeFileSync(path.join(outRoot, 'generation-stats.json'), JSON.stringify({
    generatedBy: 'tools/v14-weapon-glb.js (程序化建模, 无外部依赖)',
    license: '原创程序化生成 — 项目自有',
    count: stats.length, weapons: stats
}, null, 2));
console.log('total:', stats.length, 'GLB files');
