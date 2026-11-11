// V4.3 士兵返工第二轮: 头身色彩分离 + 背面摆臂 + 白色交叉背带 + 俯角下调
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// ---- config.js: 头盔改深藏青(与亮蓝军服形成头/身色块分离) ----
var cf = path.join(ROOT, 'js', 'config.js');
var c = fs.readFileSync(cf, 'utf8').replace(/\r\n/g, '\n');
function repC(oldS, newS, label) {
    if (c.indexOf(oldS) < 0) { console.error('[config] NOT FOUND: ' + label); process.exitCode = 1; return; }
    c = c.replace(oldS, newS);
    console.log('[config] ok: ' + label);
}
repC("        soldierHelmet: 0x2563EB,",
    "        soldierHelmet: 0x1E3A8A,   // V4.3: 深藏青头盔(与亮蓝军服色块分离, 背面可辨头/身)",
    'helmet color');
fs.writeFileSync(cf, c);

// ---- models.js: 摆动左臂 + 交叉背带 ----
var mf = path.join(ROOT, 'js', 'models.js');
var m = fs.readFileSync(mf, 'utf8').replace(/\r\n/g, '\n');
function repM(oldS, newS, label) {
    if (m.indexOf(oldS) < 0) { console.error('[models] NOT FOUND: ' + label); process.exitCode = 1; return; }
    m = m.replace(oldS, newS);
    console.log('[models] ok: ' + label);
}
// 左臂: 从"前伸扶枪"改为"贴身下垂微摆姿"(从背后可见的蓝色手臂轮廓)
repM("    // 左臂(从左肩斜向前内扶枪)\n" +
    "    p.push(colorize(new THREE.CapsuleGeometry(0.056, 0.13, 4, 8), C.soldierBlue)\n" +
    "        .rotateX(-1.0).rotateZ(-0.45).translate(-0.13, 0.53, -0.14));\n" +
    "    // 白手套(右手-握把 / 左手-护木)\n" +
    "    p.push(colorize(new THREE.SphereGeometry(0.06, 8, 6), 0xF0F0F0)\n" +
    "        .translate(0.14, 0.5, -0.18));\n" +
    "    p.push(colorize(new THREE.SphereGeometry(0.06, 8, 6), 0xF0F0F0)\n" +
    "        .translate(-0.04, 0.5, -0.26));",
    "    // 左臂(V4.3: 贴身下垂后摆 — 背面可见的'手臂'轮廓, 与躯干色差)\n" +
    "    p.push(colorize(new THREE.CapsuleGeometry(0.055, 0.15, 4, 8), 0x2B50A7)\n" +
    "        .rotateX(0.55).rotateZ(0.12).translate(-0.27, 0.44, 0.06));\n" +
    "    // 左手手套(后摆位)\n" +
    "    p.push(colorize(new THREE.SphereGeometry(0.055, 8, 6), 0xF0F0F0)\n" +
    "        .translate(-0.29, 0.31, 0.12));\n" +
    "    // 白手套(右手-握把)\n" +
    "    p.push(colorize(new THREE.SphereGeometry(0.06, 8, 6), 0xF0F0F0)\n" +
    "        .translate(0.14, 0.5, -0.18));",
    'left arm swing pose');
// 背包白色交叉背带(X harness — 经典士兵背面符号)
repM("    // 双肩背带(深色, 从肩到包)\n" +
    "    p.push(colorize(new THREE.BoxGeometry(0.045, 0.2, 0.02), 0x5A4310)\n" +
    "        .translate(-0.1, 0.58, 0.205));\n" +
    "    p.push(colorize(new THREE.BoxGeometry(0.045, 0.2, 0.02), 0x5A4310)\n" +
    "        .translate(0.1, 0.58, 0.205));",
    "    // 白色交叉背带(V4.3: 背面X形Harness — 强士兵符号, 大白色块)\n" +
    "    p.push(colorize(new THREE.BoxGeometry(0.05, 0.34, 0.02), 0xF0F4F8)\n" +
    "        .rotateZ(0.42).translate(0, 0.52, 0.315));\n" +
    "    p.push(colorize(new THREE.BoxGeometry(0.05, 0.34, 0.02), 0xF0F4F8)\n" +
    "        .rotateZ(-0.42).translate(0, 0.52, 0.317));",
    'X straps');
fs.writeFileSync(mf, m);

// ---- squad.js: 31人档再放宽(8列0.58) ----
var sf = path.join(ROOT, 'js', 'squad.js');
var s = fs.readFileSync(sf, 'utf8').replace(/\r\n/g, '\n');
var oldT = "        else if (n <= 100) { cols = 8;  sx = 0.55; sz = 0.54; }";
var newT = "        else if (n <= 100) { cols = 8;  sx = 0.58; sz = 0.56; }";
if (s.indexOf(oldT) < 0) { console.error('[squad] tier not found'); process.exitCode = 1; }
else { s = s.replace(oldT, newT); console.log('[squad] ok: tier 8col 0.58'); }
// 腿摆幅度加大(背面可见的跑步节奏)
var oldSw = "                swingL = Math.sin(ph) * 0.62;\n" +
    "                swingR = Math.sin(ph + Math.PI) * 0.62;";
var newSw = "                swingL = Math.sin(ph) * 0.8;\n" +
    "                swingR = Math.sin(ph + Math.PI) * 0.8;";
if (s.indexOf(oldSw) < 0) { console.error('[squad] swing not found'); process.exitCode = 1; }
else { s = s.replace(oldSw, newSw); console.log('[squad] ok: swing 0.8'); }
fs.writeFileSync(sf, s);

// ---- world.js: 俯角下调(offY基线5.6/offZ基线8.4) ----
var wf = path.join(ROOT, 'js', 'world.js');
var w = fs.readFileSync(wf, 'utf8').replace(/\r\n/g, '\n');
var oldO = "        var offY = CONFIG.CAMERA_OFFSET_Y + this._camScale * 2.6;\n" +
    "        var offZ = CONFIG.CAMERA_OFFSET_Z + this._camScale * 2.2;";
var newO = "        // V4.3: 俯角下调(~36°, 背面人群更立体; 基线降低+距离拉开)\n" +
    "        var offY = 5.6 + this._camScale * 3.1;\n" +
    "        var offZ = 8.4 + this._camScale * 2.0;";
if (w.indexOf(oldO) < 0) { console.error('[world] offsets not found'); process.exitCode = 1; }
else { w = w.replace(oldO, newO); console.log('[world] ok: pitch lower'); }
fs.writeFileSync(wf, w);
