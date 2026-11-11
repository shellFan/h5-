// V4.0 补丁: config.js 末尾追加关卡扩容变换(中段×3循环/数量递增/Boss血量表/总长扩至2-4分钟)
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'js', 'config.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

if (c.indexOf('V4.0 关卡扩容') >= 0) { console.log('already patched'); process.exit(0); }

const block = [
    "",
    "// ===== V4.0 关卡扩容: 单局时长从~30s扩到2-4分钟(验收标准) =====",
    "// 中段(门+波)循环3次, 数量按1/1.7/2.6递增; 段间距×1.15; Boss血量表按长关卡重调",
    "(function() {",
    "    var BOSS_HP = [500, 700, 900, 1100, 1400, 1700, 2100, 2500, 3000, 3600];",
    "    var WAVE_MUL = [1, 1.7, 2.6];",
    "    LEVELS.forEach(function(level, li) {",
    "        var body = level.segments.filter(function(s) { return s.type !== 'boss'; });",
    "        var boss = null;",
    "        level.segments.forEach(function(s) { if (s.type === 'boss') boss = s; });",
    "        if (!boss || body.length < 2) return;",
    "        var deltas = [];",
    "        for (var i = 1; i < body.length; i++) deltas.push(body[i - 1].z - body[i].z);",
    "        var out = [];",
    "        var z = body[0].z;",
    "        for (var rep = 0; rep < 3; rep++) {",
    "            for (var i = 0; i < body.length; i++) {",
    "                var seg = JSON.parse(JSON.stringify(body[i]));",
    "                seg.z = Math.round(z);",
    "                if (seg.type === 'wave') {",
    "                    seg.enemies = seg.enemies.map(function(e) {",
    "                        return { type: e.type, count: Math.max(2, Math.round(e.count * WAVE_MUL[rep])) };",
    "                    });",
    "                }",
    "                out.push(seg);",
    "                z -= (deltas[i] || 14) * 1.15;",
    "            }",
    "        }",
    "        boss = JSON.parse(JSON.stringify(boss));",
    "        boss.z = Math.round(z - 14);",
    "        boss.boss.hp = BOSS_HP[li];",
    "        out.push(boss);",
    "        level.segments = out;",
    "        level.totalZ = boss.z - 12;",
    "    });",
    "})();",
    ""
].join('\n');

fs.writeFileSync(FILE, c + block);
console.log('level expansion installed (3x cycles, boss hp table, totalZ stretch)');
