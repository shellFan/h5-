// 构建脚本修复: GAME_SCRIPTS 清单补入 V4 新文件(movement.js/pacing.js) — 缺失会导致打包后启动崩溃
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
for (const f of ['tools/build-douyin.js', 'tools/build-h5.js']) {
    const p = path.join(ROOT, f);
    let c = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    if (c.indexOf('js/movement.js') >= 0) { console.log(f + ': already ok'); continue; }
    c = c.replace("    'js/config.js',\n    'js/utils.js',",
        "    'js/config.js',\n    'js/utils.js',\n    'js/movement.js',   // V4.0");
    c = c.replace("    'js/enemies.js',\n    'js/combat.js',",
        "    'js/enemies.js',\n    'js/pacing.js',    // V4.0\n    'js/combat.js',");
    fs.writeFileSync(p, c);
    console.log(f + ': patched (movement.js + pacing.js)');
}
