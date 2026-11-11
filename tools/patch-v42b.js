// V4.2b: 髋点/阵型/相机配套调整
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// squad.js: 髋点 0.3→0.32(新腿部几何防穿地) + 31人档(≤100)改8列0.55(减密度)
var sf = path.join(ROOT, 'js', 'squad.js');
var s = fs.readFileSync(sf, 'utf8').replace(/\r\n/g, '\n');
function repS(oldS, newS, label) {
    if (s.indexOf(oldS) < 0) { console.error('[squad] NOT FOUND: ' + label); process.exitCode = 1; return; }
    s = s.replace(oldS, newS);
    console.log('[squad] ok: ' + label);
}
repS("        this._hipL = new THREE.Matrix4().makeTranslation(-0.09, 0.3, 0);",
    "        this._hipL = new THREE.Matrix4().makeTranslation(-0.095, 0.32, 0);",
    'hipL');
repS("        this._hipR = new THREE.Matrix4().makeTranslation(0.09, 0.3, 0);",
    "        this._hipR = new THREE.Matrix4().makeTranslation(0.095, 0.32, 0);",
    'hipR');
repS("        else if (n <= 100) { cols = 9;  sx = 0.50; sz = 0.52; }",
    "        else if (n <= 100) { cols = 8;  sx = 0.55; sz = 0.54; }",
    'tier 31-100 -> 8col');
fs.writeFileSync(sf, s);

// world.js: 相机曲线 ×1.2(31人→+0.9, 提前进入军团构图)
var wf = path.join(ROOT, 'js', 'world.js');
var w = fs.readFileSync(wf, 'utf8').replace(/\r\n/g, '\n');
var oldC = "        var cf = Math.sqrt(clamp((squadCount || 1) / 500, 0, 1));";
var newC = "        var cf = clamp(Math.sqrt(clamp((squadCount || 1) / 500, 0, 1)) * 1.2, 0, 1);";
if (w.indexOf(oldC) < 0) { console.error('[world] camera curve not found'); process.exitCode = 1; }
else { w = w.replace(oldC, newC); console.log('[world] ok: camera curve x1.2'); }
fs.writeFileSync(wf, w);
