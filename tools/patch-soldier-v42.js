// V4.2 士兵重制(31人球阵判定不合格后的返工):
// ①宽帽檐裙边(从背后俯视=头盔而非球) ②腿部露出(躯干缩短+腿加长加粗) ③头身色彩分离
// ④背包加大上移(背面第二识别物) ⑤顶饰天线破球轮廓
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'js', 'models.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

function rep(oldS, newS, label) {
    if (c.indexOf(oldS) < 0) { console.error('NOT FOUND: ' + label); process.exitCode = 1; return; }
    c = c.replace(oldS, newS);
    console.log('ok: ' + label);
}

// ===== 躯干: 缩短(0.2→0.14)上移, 露出腿部空间 =====
rep("    p.push(colorize(new THREE.CapsuleGeometry(0.2, 0.2, 6, 12), C.soldierBlue)\n        .translate(0, 0.5, 0));",
    "    p.push(colorize(new THREE.CapsuleGeometry(0.21, 0.14, 6, 12), C.soldierBlue)\n        .translate(0, 0.5, 0));",
    'torso shorter');
rep("    p.push(colorize(new THREE.CylinderGeometry(0.215, 0.215, 0.14, 14), C.soldierVest)\n        .translate(0, 0.54, 0));",
    "    p.push(colorize(new THREE.CylinderGeometry(0.23, 0.23, 0.16, 14), C.soldierVest)\n        .translate(0, 0.55, 0));",
    'vest wider');
rep("    p.push(colorize(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 14), 0x1a2040)\n        .translate(0, 0.36, 0));",
    "    p.push(colorize(new THREE.CylinderGeometry(0.215, 0.215, 0.05, 14), 0x1a2040)\n        .translate(0, 0.35, 0));",
    'belt');
// 领口(头身分离的暗色环)
rep("    p.push(colorize(new THREE.BoxGeometry(0.08, 0.05, 0.02), 0xD8B048)\n        .translate(0, 0.36, -0.21));",
    "    p.push(colorize(new THREE.BoxGeometry(0.08, 0.05, 0.02), 0xD8B048)\n        .translate(0, 0.35, -0.22));\n" +
    "    // 领口暗环(V4.2: 头/身分界, 消除头身粘连)\n" +
    "    p.push(colorize(new THREE.CylinderGeometry(0.12, 0.14, 0.05, 12), 0x16306B)\n" +
    "        .translate(0, 0.76, 0));",
    'collar');

// ===== 背包: 加大上移(背面核心识别物) =====
rep("    p.push(colorize(new THREE.BoxGeometry(0.28, 0.21, 0.14), 0x8B6914)\n        .translate(0, 0.5, 0.21));",
    "    p.push(colorize(new THREE.BoxGeometry(0.30, 0.26, 0.15), 0x8B6914)\n        .translate(0, 0.52, 0.22));",
    'backpack bigger');

// ===== 头部缩小 + 五官收拢 =====
rep("    p.push(colorize(new THREE.SphereGeometry(0.225, 16, 12), C.skin)\n        .translate(0, 0.9, 0));",
    "    p.push(colorize(new THREE.SphereGeometry(0.2, 16, 12), C.skin)\n        .translate(0, 0.9, 0));",
    'head 0.2');
rep("    p.push(colorize(new THREE.SphereGeometry(0.05, 8, 6), 0x1a1a2e)\n        .translate(-0.09, 0.92, -0.2));",
    "    p.push(colorize(new THREE.SphereGeometry(0.045, 8, 6), 0x1a1a2e)\n        .translate(-0.075, 0.92, -0.185));",
    'eye L');
rep("    p.push(colorize(new THREE.SphereGeometry(0.05, 8, 6), 0x1a1a2e)\n        .translate(0.09, 0.92, -0.2));",
    "    p.push(colorize(new THREE.SphereGeometry(0.045, 8, 6), 0x1a1a2e)\n        .translate(0.075, 0.92, -0.185));",
    'eye R');
rep("    p.push(colorize(new THREE.SphereGeometry(0.019, 6, 4), 0xFFFFFF)\n        .translate(-0.065, 0.945, -0.235));",
    "    p.push(colorize(new THREE.SphereGeometry(0.017, 6, 4), 0xFFFFFF)\n        .translate(-0.055, 0.945, -0.21));",
    'eye hi L');
rep("    p.push(colorize(new THREE.SphereGeometry(0.019, 6, 4), 0xFFFFFF)\n        .translate(0.104, 0.945, -0.235));",
    "    p.push(colorize(new THREE.SphereGeometry(0.017, 6, 4), 0xFFFFFF)\n        .translate(0.09, 0.945, -0.21));",
    'eye hi R');
rep("    p.push(colorize(new THREE.SphereGeometry(0.032, 6, 4), 0xFFB8B8)\n        .translate(-0.155, 0.85, -0.16));",
    "    p.push(colorize(new THREE.SphereGeometry(0.03, 6, 4), 0xFFB8B8)\n        .translate(-0.135, 0.84, -0.15));",
    'cheek L');
rep("    p.push(colorize(new THREE.SphereGeometry(0.032, 6, 4), 0xFFB8B8)\n        .translate(0.155, 0.85, -0.16));",
    "    p.push(colorize(new THREE.SphereGeometry(0.03, 6, 4), 0xFFB8B8)\n        .translate(0.135, 0.84, -0.15));",
    'cheek R');

// ===== 头盔: 缩小dome + 宽帽檐裙边(背面=头盔非球) + 加宽白条纹 + 天线顶饰 =====
rep("    p.push(colorize(new THREE.SphereGeometry(0.248, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), C.soldierHelmet)\n        .translate(0, 0.9, 0));",
    "    p.push(colorize(new THREE.SphereGeometry(0.215, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), C.soldierHelmet)\n        .translate(0, 0.9, 0));",
    'helmet dome 0.215');
rep("    p.push(colorize(new THREE.CylinderGeometry(0.252, 0.252, 0.045, 16), C.soldierVest)\n        .translate(0, 0.8, 0));",
    "    // 帽檐裙边(V4.2核心: 锥形裙边从背后俯视呈椭圆环 = 明确的'头盔'轮廓; 斜面无共面, 密阵相交不闪)\n" +
    "    p.push(colorize(new THREE.CylinderGeometry(0.205, 0.27, 0.06, 16), C.soldierHelmet)\n" +
    "        .translate(0, 0.81, 0));\n" +
    "    // 帽檐深色包边\n" +
    "    p.push(colorize(new THREE.TorusGeometry(0.265, 0.02, 6, 18), 0x16306B)\n" +
    "        .rotateX(Math.PI / 2).translate(0, 0.79, 0));",
    'helmet skirt brim');
rep("    p.push(colorize(createStarGeometry(0.07, 0.03), 0xFFFFFF)\n        .rotateY(Math.PI).translate(0, 0.97, -0.235));",
    "    p.push(colorize(createStarGeometry(0.06, 0.026), 0xFFFFFF)\n        .rotateY(Math.PI).translate(0, 0.96, -0.205));",
    'star');
rep("    p.push(colorize(new THREE.BoxGeometry(0.07, 0.16, 0.02), 0xF0F4F8)\n        .translate(0, 0.99, 0.222));",
    "    p.push(colorize(new THREE.BoxGeometry(0.09, 0.15, 0.018), 0xF0F4F8)\n        .translate(0, 0.97, 0.19));",
    'back stripe wider');
rep("    p.push(colorize(new THREE.SphereGeometry(0.042, 8, 6), 0xFFFFFF)\n        .translate(0, 1.155, 0));",
    "    // 顶饰天线+绒球(V4.2: 打破俯视球轮廓)\n" +
    "    p.push(colorize(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 6), 0x16306B)\n" +
    "        .translate(0, 1.105, 0));\n" +
    "    p.push(colorize(new THREE.SphereGeometry(0.038, 8, 6), 0xFFFFFF)\n" +
    "        .translate(0, 1.15, 0));",
    'antenna pom');

// ===== 腿部: 髋点上移+加长加粗+靴子加大(露出真实的'腿') =====
rep("    // 裤腿(从髋垂下)\n" +
    "    p.push(colorize(new THREE.CapsuleGeometry(0.07, 0.13, 4, 8), C.soldierPants)\n" +
    "        .translate(side * 0.09, -0.1, 0));\n" +
    "    // 裤脚环(浅)\n" +
    "    p.push(colorize(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 8), 0x3E5175)\n" +
    "        .translate(side * 0.09, -0.185, 0));\n" +
    "    // 靴子(前伸)\n" +
    "    p.push(colorize(new THREE.BoxGeometry(0.15, 0.09, 0.22), 0x1a2040)\n" +
    "        .translate(side * 0.09, -0.25, -0.03));",
    "    // 裤腿(V4.2: 加长加粗, 从躯干下真实露出)\n" +
    "    p.push(colorize(new THREE.CapsuleGeometry(0.085, 0.13, 4, 8), C.soldierPants)\n" +
    "        .translate(side * 0.095, -0.13, 0));\n" +
    "    // 裤脚环(浅)\n" +
    "    p.push(colorize(new THREE.CylinderGeometry(0.088, 0.088, 0.035, 8), 0x3E5175)\n" +
    "        .translate(side * 0.095, -0.21, 0));\n" +
    "    // 靴子(加大前伸)\n" +
    "    p.push(colorize(new THREE.BoxGeometry(0.17, 0.1, 0.26), 0x1a2040)\n" +
    "        .translate(side * 0.095, -0.27, -0.04));",
    'legs longer + boots');

fs.writeFileSync(FILE, c);
console.log('soldier v4.2 installed');
