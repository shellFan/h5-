// 更新 04-pacing 单测: 生成点语义改为"队伍前方屏幕外"
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'tests', 'unit', 'suites', '04-pacing.test.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

const oldA = [
    "        test('生成位置在波点后方纵深散布', () => {",
    "            var { p, spawned } = makeCtl(0);",
    "            var squad = { z: -24 };",
    "            p.update(CONFIG.PACING.firstContactGrace + 0.5, squad);",
    "            for (var i = 0; i < spawned.length; i++) {",
    "                assert(spawned[i].z <= -38 && spawned[i].z >= -38 - CONFIG.PACING.spawnDepth,",
    "                    'z=' + spawned[i].z + ' 应在[' + (-38 - CONFIG.PACING.spawnDepth) + ', -38]');",
    "                assert(Math.abs(spawned[i].x) <= 2.4 + 0.4, 'x在跑道附近');",
    "            }",
    "        });"
].join('\n');

const newA = [
    "        test('生成位置在队伍前方屏幕外(11~11+纵深)', () => {",
    "            var { p, spawned } = makeCtl(0);",
    "            var squad = { z: -24 };",
    "            p.update(CONFIG.PACING.firstContactGrace + 0.5, squad);",
    "            for (var i = 0; i < spawned.length; i++) {",
    "                assert(spawned[i].z <= -35 && spawned[i].z >= -35 - CONFIG.PACING.spawnDepth,",
    "                    'z=' + spawned[i].z + ' 应在队伍前方屏幕外');",
    "                assert(Math.abs(spawned[i].x) <= 2.4 + 0.4, 'x在跑道附近');",
    "            }",
    "        });"
].join('\n');

if (c.indexOf(oldA) < 0) { console.error('pattern not found'); process.exit(1); }
c = c.replace(oldA, newA);
fs.writeFileSync(FILE, c);
console.log('unit test updated');
