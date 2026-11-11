// V4.0 平衡补丁: ①段间距1.15→1.5 ②重复周期mul门降档(抑制人数过快通胀) ③Boss血量动态缩放
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// ---- config.js: 扩容参数调整 + mul降档 ----
var cf = path.join(ROOT, 'js', 'config.js');
var c = fs.readFileSync(cf, 'utf8').replace(/\r\n/g, '\n');
c = c.replace("var WAVE_MUL = [1, 1.7, 2.6];",
    "var WAVE_MUL = [1, 1.7, 2.6];\n    var MUL_SOFTEN = [1, 1, 2]; // rep2起mul降档: ×3→×2, ×2→大额add");
c = c.replace("                z -= (deltas[i] || 14) * 1.15;",
    "                z -= (deltas[i] || 14) * 1.5;");
c = c.replace(
    "                if (seg.type === 'wave') {",
    "                if (seg.type === 'gates' && MUL_SOFTEN[rep] > 1) {\n" +
    "                    // 重复周期: mul门降档, 防人数过快顶到500上限失去张力\n" +
    "                    seg.gates = seg.gates.map(function(gd) {\n" +
    "                        if (gd.op === 'mul' && gd.value >= 3) return { lane: gd.lane, op: 'mul', value: 2, label: '\\u00d72' };\n" +
    "                        if (gd.op === 'mul') return { lane: gd.lane, op: 'add', value: 15 + li * 2, label: '+' + (15 + li * 2) };\n" +
    "                        return gd;\n" +
    "                    });\n" +
    "                }\n" +
    "                if (seg.type === 'wave') {");
fs.writeFileSync(cf, c);
console.log('config.js: spacing 1.5 + mul soften');

// ---- game.js: Boss血量动态缩放(基础表 + 当前战力×8) ----
var gf = path.join(ROOT, 'js', 'game.js');
var g = fs.readFileSync(gf, 'utf8').replace(/\r\n/g, '\n');
const oldSpawn = "        this.pacing.spawnFn = function(type, x, z, hp) { return self.enemies.spawnEnemy(type, x, z, hp); };";
const newSpawn = [
    "        this.pacing.spawnFn = function(type, x, z, hp) {",
    "            // V4.0: Boss血量按出场时队伍战力动态缩放 — 任何策略/养成水平都面临~8-12s Boss战",
    "            if (type === 'boss') {",
    "                var base = hp || CONFIG.ZOMBIE.boss.hp;",
    "                var dpsNow = self.squad.count * self.squad.getDamage() * self.squad.getFireRate();",
    "                hp = Math.round((base + dpsNow * 8) / 50) * 50;",
    "            }",
    "            return self.enemies.spawnEnemy(type, x, z, hp);",
    "        };"
].join('\n');
if (g.indexOf(oldSpawn) < 0) { console.error('spawnFn pattern not found'); process.exit(1); }
g = g.replace(oldSpawn, newSpawn);
fs.writeFileSync(gf, g);
console.log('game.js: dynamic boss hp scaling');
