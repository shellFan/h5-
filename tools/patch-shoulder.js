// V4.4b: 亮蓝肩甲(超出头盔宽度)
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'js', 'models.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const oldS = [
    "    // === 肩甲(深蓝半球) ===",
    "    p.push(colorize(new THREE.SphereGeometry(0.09, 8, 6), C.soldierVest)",
    "        .translate(-0.235, 0.62, 0));",
    "    p.push(colorize(new THREE.SphereGeometry(0.09, 8, 6), C.soldierVest)",
    "        .translate(0.235, 0.62, 0));"
].join('\n');
const newS = [
    "    // === 肩甲(V4.4: 亮蓝大半球 — 超出帽檐宽度, 背面剪影=深盔+亮蓝肩线) ===",
    "    p.push(colorize(new THREE.SphereGeometry(0.105, 8, 6), C.soldierBlue)",
    "        .translate(-0.27, 0.63, 0));",
    "    p.push(colorize(new THREE.SphereGeometry(0.105, 8, 6), C.soldierBlue)",
    "        .translate(0.27, 0.63, 0));"
].join('\n');
if (c.indexOf(oldS) < 0) { console.error('shoulder block not found'); process.exit(1); }
c = c.replace(oldS, newS);
fs.writeFileSync(FILE, c);
console.log('bright shoulders applied');
