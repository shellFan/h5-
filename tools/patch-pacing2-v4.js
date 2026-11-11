// V4.0 补丁: 生成点改为相对队伍的屏幕外预生成 — 防止队伍跑过固定波点导致怪从背后刷
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'js', 'pacing.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

const oldS = [
    "                    for (var i = 0; i < batch; i++) {",
    "                        var type = w.queue.shift();",
    "                        var lane = Math.floor(Math.random() * 3);",
    "                        var x = CONFIG.LANE_X[lane] + randRange(-0.4, 0.4);",
    "                        var z = w.z - randRange(0, P.spawnDepth);   // 纵深散布, 屏幕外逐步涌入",
    "                        if (this.spawnFn) this.spawnFn(type, x, z, null);",
    "                        w.spawned++;",
    "                    }"
].join('\n');

const newS = [
    "                    for (var i = 0; i < batch; i++) {",
    "                        var type = w.queue.shift();",
    "                        var lane = Math.floor(Math.random() * 3);",
    "                        var x = CONFIG.LANE_X[lane] + randRange(-0.4, 0.4);",
    "                        // V4.0: 屏幕外预生成 — 相对队伍前方11~(11+纵深)单位, 无论队伍速度如何怪永远迎面涌入",
    "                        var z = squad.z - randRange(11, 11 + P.spawnDepth);",
    "                        if (this.spawnFn) this.spawnFn(type, x, z, null);",
    "                        w.spawned++;",
    "                    }"
].join('\n');

if (c.indexOf(oldS) < 0) { console.error('spawn block not found'); process.exit(1); }
c = c.replace(oldS, newS);
fs.writeFileSync(FILE, c);
console.log('spawn-relative-to-squad installed');
