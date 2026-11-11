// E2E 传送点动态化: 波次/Boss坐标改为从LEVELS实时读取(兼容V4扩容后的关卡长度)
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'tests', 'e2e', 'run.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

function rep(oldS, newS, label) {
    if (c.indexOf(oldS) < 0) { console.error('NOT FOUND: ' + label); process.exitCode = 1; return; }
    c = c.replace(oldS, newS);
    console.log('ok: ' + label);
}

// 1) 敌人触发生成: 动态取第一波
rep("        // 移到第一波(z=-42, 触发点z=-28)\n        await gameApi(page, '(g) => { g.squad.z = -28; }');",
    "        // V4: 动态定位第一波触发点(关卡扩容后坐标不再固定)\n" +
    "        await gameApi(page, '(g) => { const w = LEVELS[0].segments.find(s => s.type === \"wave\"); g.squad.z = w.z + CONFIG.PACING.waveTriggerAhead; }');",
    'enemy spawn teleport');

// 2) Boss生成: 动态取Boss触发区内
rep("        await gameApi(page, '(g) => { g.squad.z = -132; g.squad.setCount(40); }');",
    "        await gameApi(page, '(g) => { const b = LEVELS[0].segments.find(s => s.type === \"boss\"); g.squad.z = b.z + 16; g.squad.setCount(40); }');",
    'boss spawn teleport');

// 3) 双倍结算: 动态定位 + 150兵(动态Boss血量下保证击杀时长<超时)
rep("        await gameApi(page, \"(g) => { g.start(); g.squad.setCount(60); g.squad.z = -126; }\");",
    "        await gameApi(page, \"(g) => { g.start(); const b = LEVELS[0].segments.find(s => s.type === 'boss'); g.squad.setCount(150); g.squad.z = b.z + 16; }\");",
    'double-reward teleport');

fs.writeFileSync(FILE, c);
console.log('E2E teleports made dynamic');
