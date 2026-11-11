// V4.0 补丁: 士兵背面可读性 + 相机调用接线
// ① models.js: 头盔球径缩小(0.285→0.248, 不再大于肩宽) + 头盔后部白色竖条纹(背面识别) + 背包加大
// ② game.js: updateCamera 传入军团人数
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// ---- models.js ----
var mFile = path.join(ROOT, 'js', 'models.js');
var m = fs.readFileSync(mFile, 'utf8').replace(/\r\n/g, '\n');

// 头盔缩小
m = m.replace(
    "    p.push(colorize(new THREE.SphereGeometry(0.285, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), C.soldierHelmet)",
    "    p.push(colorize(new THREE.SphereGeometry(0.248, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), C.soldierHelmet)");
// 帽檐环缩小跟随
m = m.replace(
    "    p.push(colorize(new THREE.CylinderGeometry(0.29, 0.29, 0.045, 16), C.soldierVest)",
    "    p.push(colorize(new THREE.CylinderGeometry(0.252, 0.252, 0.045, 16), C.soldierVest)");
// 五角星随头盔前移
m = m.replace(
    "    p.push(colorize(createStarGeometry(0.075, 0.032), 0xFFFFFF)\n        .rotateY(Math.PI).translate(0, 0.97, -0.26));",
    "    p.push(colorize(createStarGeometry(0.07, 0.03), 0xFFFFFF)\n        .rotateY(Math.PI).translate(0, 0.97, -0.245));");
// 头盔后部白色竖条纹(V4.0新增: 背面视角识别条) + 顶饰微调
m = m.replace(
    "    // 头盔顶饰\n    p.push(colorize(new THREE.SphereGeometry(0.045, 8, 6), 0xFFFFFF)\n        .translate(0, 1.17, 0));",
    "    // 头盔后部白色竖条纹(V4.0: 从背后看是'小军人'而非'蓝球'的关键识别条)\n" +
    "    p.push(colorize(new THREE.BoxGeometry(0.07, 0.16, 0.02), 0xF0F4F8)\n" +
    "        .translate(0, 0.99, 0.235));\n" +
    "    // 头盔顶饰\n" +
    "    p.push(colorize(new THREE.SphereGeometry(0.042, 8, 6), 0xFFFFFF)\n" +
    "        .translate(0, 1.155, 0));");
// 背包加大加宽(背面主轮廓)
m = m.replace(
    "    p.push(colorize(new THREE.BoxGeometry(0.24, 0.19, 0.13), 0x8B6914)\n        .translate(0, 0.52, 0.2));",
    "    p.push(colorize(new THREE.BoxGeometry(0.28, 0.21, 0.14), 0x8B6914)\n        .translate(0, 0.5, 0.21));");
fs.writeFileSync(mFile, m);
console.log('models.js: helmet 0.248 + back-stripe + backpack enlarged');

// ---- game.js 相机接线 ----
var gFile = path.join(ROOT, 'js', 'game.js');
var g = fs.readFileSync(gFile, 'utf8').replace(/\r\n/g, '\n');
g = g.replace(
    "        this.world.updateCamera(0, 0, 0.016);",
    "        this.world.updateCamera(0, 0, 0.016, 1);");
g = g.replace(
    "            this.world.updateCamera(Math.sin(this.time * 0.4) * 0.6, 0, dt);",
    "            this.world.updateCamera(Math.sin(this.time * 0.4) * 0.6, 0, dt, 1);");
g = g.replace(
    "        this.world.updateCamera(this.squad.x, this.squad.z, dt);",
    "        this.world.updateCamera(this.squad.x, this.squad.z, dt, this.squad.count);");
fs.writeFileSync(gFile, g);
console.log('game.js: updateCamera call sites wired with squad count');
