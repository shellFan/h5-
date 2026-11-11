// V4.4 收尾轮: 亮蓝肩线超出头盔 + 左臂亮蓝 + dome微缩 + 腿部再露出
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

var mf = path.join(ROOT, 'js', 'models.js');
var m = fs.readFileSync(mf, 'utf8').replace(/\r\n/g, '\n');
function repM(oldS, newS, label) {
    if (m.indexOf(oldS) < 0) { console.error('[models] NOT FOUND: ' + label); process.exitCode = 1; return; }
    m = m.replace(oldS, newS);
    console.log('[models] ok: ' + label);
}
// 肩甲: 深蓝小半球 → 亮蓝大半球(超出头盔宽度, 背面形成"深色头上亮蓝肩线"的士兵剪影)
repM("    // 肩甲(深蓝半球)\n" +
    "    p.push(colorize(new THREE.SphereGeometry(0.09, 8, 6), C.soldierVest)\n" +
    "        .translate(-0.235, 0.62, 0));\n" +
    "    p.push(colorize(new THREE.SphereGeometry(0.09, 8, 6), C.soldierVest)\n" +
    "        .translate(0.235, 0.62, 0));",
    "    // 肩甲(V4.4: 亮蓝大半球 — 超出帽檐宽度, 背面剪影=深盔+亮蓝肩线)\n" +
    "    p.push(colorize(new THREE.SphereGeometry(0.105, 8, 6), C.soldierBlue)\n" +
    "        .translate(-0.27, 0.63, 0));\n" +
    "    p.push(colorize(new THREE.SphereGeometry(0.105, 8, 6), C.soldierBlue)\n" +
    "        .translate(0.27, 0.63, 0));",
    'bright shoulders');
// 左臂亮蓝(与深盔形成对比)
repM("    p.push(colorize(new THREE.CapsuleGeometry(0.055, 0.15, 4, 8), 0x2B50A7)\n" +
    "        .rotateX(0.55).rotateZ(0.12).translate(-0.27, 0.44, 0.06));",
    "    p.push(colorize(new THREE.CapsuleGeometry(0.055, 0.15, 4, 8), C.soldierBlue)\n" +
    "        .rotateX(0.55).rotateZ(0.12).translate(-0.29, 0.44, 0.06));",
    'left arm bright');
// dome 再微缩(0.215→0.205), 裙边同步
repM("    p.push(colorize(new THREE.SphereGeometry(0.215, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), C.soldierHelmet)\n" +
    "        .translate(0, 0.9, 0));",
    "    p.push(colorize(new THREE.SphereGeometry(0.205, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), C.soldierHelmet)\n" +
    "        .translate(0, 0.9, 0));",
    'dome 0.205');
repM("    p.push(colorize(new THREE.CylinderGeometry(0.205, 0.27, 0.06, 16), C.soldierHelmet)\n" +
    "        .translate(0, 0.81, 0));",
    "    p.push(colorize(new THREE.CylinderGeometry(0.195, 0.26, 0.06, 16), C.soldierHelmet)\n" +
    "        .translate(0, 0.81, 0));",
    'skirt 0.26');
repM("    p.push(colorize(new THREE.TorusGeometry(0.265, 0.02, 6, 18), 0x16306B)\n" +
    "        .rotateX(Math.PI / 2).translate(0, 0.79, 0));",
    "    p.push(colorize(new THREE.TorusGeometry(0.255, 0.02, 6, 18), 0x16306B)\n" +
    "        .rotateX(Math.PI / 2).translate(0, 0.79, 0));",
    'brim ring');
// 腿: 裤腿下移多露一截, 靴位同步
repM("    p.push(colorize(new THREE.CapsuleGeometry(0.085, 0.13, 4, 8), C.soldierPants)\n" +
    "        .translate(side * 0.095, -0.13, 0));",
    "    p.push(colorize(new THREE.CapsuleGeometry(0.085, 0.15, 4, 8), C.soldierPants)\n" +
    "        .translate(side * 0.095, -0.145, 0));",
    'pants longer');
fs.writeFileSync(mf, m);

// squad.js: 髋点 0.32→0.34(配合露腿)
var sf = path.join(ROOT, 'js', 'squad.js');
var s = fs.readFileSync(sf, 'utf8').replace(/\r\n/g, '\n');
var oldH1 = "        this._hipL = new THREE.Matrix4().makeTranslation(-0.095, 0.32, 0);";
var newH1 = "        this._hipL = new THREE.Matrix4().makeTranslation(-0.095, 0.34, 0);";
var oldH2 = "        this._hipR = new THREE.Matrix4().makeTranslation(0.095, 0.32, 0);";
var newH2 = "        this._hipR = new THREE.Matrix4().makeTranslation(0.095, 0.34, 0);";
if (s.indexOf(oldH1) < 0 || s.indexOf(oldH2) < 0) { console.error('[squad] hips not found'); process.exitCode = 1; }
s = s.replace(oldH1, newH1).replace(oldH2, newH2);
fs.writeFileSync(sf, s);
console.log('[squad] ok: hips 0.34');
