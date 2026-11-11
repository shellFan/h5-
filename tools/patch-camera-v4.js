// V4.0 补丁: 动态相机(随军团规模升高后移) — world.js
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'js', 'world.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

const oldFn = [
    "    updateCamera(squadX, squadZ, dt) {",
    "        const cam = this.camera;",
    "        const targetX = squadX * CONFIG.CAMERA_FOLLOW_X;",
    "        const targetPos = new THREE.Vector3(",
    "            targetX,",
    "            squadZ * 0 + CONFIG.CAMERA_OFFSET_Y,",
    "            squadZ + CONFIG.CAMERA_OFFSET_Z",
    "        );",
    "        cam.position.x = damp(cam.position.x, targetPos.x, 6, dt);",
    "        cam.position.y = targetPos.y;",
    "        cam.position.z = damp(cam.position.z, targetPos.z, 8, dt);",
    "        cam.lookAt(targetX * 0.5, 0, squadZ + CONFIG.CAMERA_LOOK_AHEAD);"
].join('\n');

const newFn = [
    "    // V4.0: 动态构图 — 相机随军团规模升高后移(sqrt曲线), 军团壮观但不拥挤",
    "    // 12人: 6.1/7.8(清晰) | 100人: +1.2 | 300人: +2.0 | 500人: +2.6(全景)",
    "    updateCamera(squadX, squadZ, dt, squadCount) {",
    "        const cam = this.camera;",
    "        var cf = Math.sqrt(clamp((squadCount || 1) / 500, 0, 1));",
    "        if (this._camScale === undefined) this._camScale = cf;",
    "        this._camScale = damp(this._camScale, cf, 3, dt);   // 人数变化时平滑过渡",
    "        var offY = CONFIG.CAMERA_OFFSET_Y + this._camScale * 2.6;",
    "        var offZ = CONFIG.CAMERA_OFFSET_Z + this._camScale * 2.2;",
    "        var lookAhead = CONFIG.CAMERA_LOOK_AHEAD - this._camScale * 2.0;",
    "",
    "        const targetX = squadX * CONFIG.CAMERA_FOLLOW_X;",
    "        const targetPos = new THREE.Vector3(",
    "            targetX,",
    "            squadZ * 0 + offY,",
    "            squadZ + offZ",
    "        );",
    "        cam.position.x = damp(cam.position.x, targetPos.x, 6, dt);",
    "        cam.position.y = damp(cam.position.y, targetPos.y, 5, dt);",
    "        cam.position.z = damp(cam.position.z, targetPos.z, 8, dt);",
    "        cam.lookAt(targetX * 0.5, 0, squadZ + lookAhead);"
].join('\n');

if (c.indexOf(oldFn) < 0) { console.error('updateCamera pattern not found'); process.exit(1); }
c = c.replace(oldFn, newFn);
fs.writeFileSync(FILE, c);
console.log('dynamic camera installed');
