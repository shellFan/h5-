// ===== V15 资产审计: 未引用/超大/重复扫描 =====
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const files = [];
(function walk(d) {
    for (const f of fs.readdirSync(d)) {
        const fp = path.join(d, f);
        const st = fs.statSync(fp);
        if (st.isDirectory()) walk(fp);
        else files.push({ p: fp.split(path.sep).join('/'), size: st.size });
    }
})(path.join(ROOT, 'assets'));
let corpus = '';
for (const dir of ['js', 'tools', 'docs', 'wechat-game']) {
    (function walk2(d) {
        for (const f of fs.readdirSync(d)) {
            const fp = path.join(d, f);
            const st = fs.statSync(fp);
            if (st.isDirectory()) walk2(fp);
            else if (/\.(js|html|css|json|md)$/.test(f)) corpus += fs.readFileSync(fp, 'utf8');
        }
    })(path.join(ROOT, dir));
}
corpus += fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const unreferenced = [], oversized = [], texturePairs = {};
let totalKB = 0;
for (const f of files) {
    totalKB += f.size;
    const base = path.basename(f.p);
    const rel = f.p.replace(ROOT.replace(/\\/g, '/') + '/assets/', 'assets/');
    const referenced = corpus.indexOf(rel) >= 0 || corpus.indexOf(base) >= 0 ||
        f.p.includes('/textures/') || /-(basecolor|orm)\.png$/.test(base) ||
        base === 'generation-stats.json' || base === 'model-stats.json' || base === 'README.md' ||
        base === 'catalog.json' || base === 'weapon-atlas.png';
    if (!referenced) unreferenced.push(f.p.replace(ROOT.replace(/\\/g, '/') + '/', '') + ' (' + (f.size / 1024).toFixed(0) + 'KB)');
    if (f.size > 400 * 1024) oversized.push(f.p.replace(ROOT.replace(/\\/g, '/') + '/', '') + ' ' + (f.size / 1024).toFixed(0) + 'KB');
    const m = base.match(/^([a-z-]+)\.glb$/i);
    if (m) {
        const lod = f.p.replace(base, m[1] + '-lod.glb');
        if (!fs.existsSync(lod)) unreferenced.push(f.p.replace(ROOT.replace(/\\/g, '/') + '/', '') + ' (缺LOD)');
        texturePairs[m[1]] = (texturePairs[m[1]] || 0) + 1;
    }
}
const out = { totalFiles: files.length, totalKB: Math.round(totalKB / 1024), unreferenced, oversized, glbLodComplete: Object.keys(texturePairs).length };
fs.writeFileSync(path.join(ROOT, 'docs', 'V15', 'logs', 'asset-audit.json'), JSON.stringify(out, null, 2));
console.log('总文件:', out.totalFiles, '总体积:', out.totalKB + 'KB');
console.log('未引用候选:', out.unreferenced.length);
out.unreferenced.slice(0, 10).forEach(f => console.log('  -', f));
console.log('>400KB 大文件:', out.oversized.length);
out.oversized.forEach(f => console.log('  -', f));
console.log('GLB(含LOD配对)模型数:', out.glbLodComplete);
