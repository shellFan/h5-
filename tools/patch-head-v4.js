// V4.0 补丁b: 头部比例修正 — 肤色头球必须小于头盔, 消除"米色球海"
// 头 0.26→0.225(藏进0.248头盔), 五官/腮红/星标/背条纹坐标随之收拢到新球面
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'js', 'models.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

function rep(oldS, newS, label) {
    if (c.indexOf(oldS) < 0) { console.error('NOT FOUND: ' + label); process.exitCode = 1; return; }
    c = c.replace(oldS, newS);
    console.log('ok: ' + label);
}

// 头球缩小
rep("    p.push(colorize(new THREE.SphereGeometry(0.26, 16, 12), C.skin)",
    "    p.push(colorize(new THREE.SphereGeometry(0.225, 16, 12), C.skin)",
    'head sphere 0.225');

// 眼睛收拢到新球面
rep("    p.push(colorize(new THREE.SphereGeometry(0.05, 8, 6), 0x1a1a2e)\n        .translate(-0.095, 0.92, -0.22));",
    "    p.push(colorize(new THREE.SphereGeometry(0.05, 8, 6), 0x1a1a2e)\n        .translate(-0.09, 0.92, -0.2));",
    'eye L');
rep("    p.push(colorize(new THREE.SphereGeometry(0.05, 8, 6), 0x1a1a2e)\n        .translate(0.095, 0.92, -0.22));",
    "    p.push(colorize(new THREE.SphereGeometry(0.05, 8, 6), 0x1a1a2e)\n        .translate(0.09, 0.92, -0.2));",
    'eye R');
rep("    p.push(colorize(new THREE.SphereGeometry(0.019, 6, 4), 0xFFFFFF)\n        .translate(-0.078, 0.94, -0.26));",
    "    p.push(colorize(new THREE.SphereGeometry(0.019, 6, 4), 0xFFFFFF)\n        .translate(-0.065, 0.945, -0.235));",
    'eye highlight L');
rep("    p.push(colorize(new THREE.SphereGeometry(0.019, 6, 4), 0xFFFFFF)\n        .translate(0.112, 0.94, -0.26));",
    "    p.push(colorize(new THREE.SphereGeometry(0.019, 6, 4), 0xFFFFFF)\n        .translate(0.104, 0.945, -0.235));",
    'eye highlight R');

// 腮红收拢
rep("    p.push(colorize(new THREE.SphereGeometry(0.034, 6, 4), 0xFFB8B8)\n        .translate(-0.18, 0.85, -0.18));",
    "    p.push(colorize(new THREE.SphereGeometry(0.032, 6, 4), 0xFFB8B8)\n        .translate(-0.155, 0.85, -0.16));",
    'cheek L');
rep("    p.push(colorize(new THREE.SphereGeometry(0.034, 6, 4), 0xFFB8B8)\n        .translate(0.18, 0.85, -0.18));",
    "    p.push(colorize(new THREE.SphereGeometry(0.032, 6, 4), 0xFFB8B8)\n        .translate(0.155, 0.85, -0.16));",
    'cheek R');

// 五角星贴到新头盔面
rep("    p.push(colorize(createStarGeometry(0.07, 0.03), 0xFFFFFF)\n        .rotateY(Math.PI).translate(0, 0.97, -0.245));",
    "    p.push(colorize(createStarGeometry(0.07, 0.03), 0xFFFFFF)\n        .rotateY(Math.PI).translate(0, 0.97, -0.235));",
    'star front');

// 头盔后条纹贴近头盔背(0.235→0.222)
rep("    p.push(colorize(new THREE.BoxGeometry(0.07, 0.16, 0.02), 0xF0F4F8)\n        .translate(0, 0.99, 0.235));",
    "    p.push(colorize(new THREE.BoxGeometry(0.07, 0.16, 0.02), 0xF0F4F8)\n        .translate(0, 0.99, 0.222));",
    'back stripe');

fs.writeFileSync(FILE, c);
console.log('head proportions fixed');
