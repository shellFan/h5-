// ===== H5 构建脚本 (Phase 8) =====
// 产物: dist/h5/ — 可直接静态部署(含全部资源, 无CDN依赖)
// 运行: npm run build:h5  (node tools/build-h5.js)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'h5');

// 需要复制到产物中的静态资源
const COPY_LIST = [
    'index.html',
    'style.css',
    'libs/three.min.js',
    'js/vendor/three.min.js',
    'js/vendor/GLTFLoader.js',
    'js/vendor/THREE-LICENSE.txt',
    'assets',
    'js/config.js',
    'js/utils.js',
    'js/movement.js',   // V4.0
    'js/models.js',
    'js/soldier-loader.js',
    'js/soldier-renderer.js',
    'js/world.js',
    'js/effects.js',
    'js/squad.js',
    'js/gates.js',
    'js/enemies.js',
    'js/pacing.js',    // V4.0
    'js/combat.js',
    'js/platform/storage-adapter.js',
    'js/platform/lifecycle-adapter.js',
    'js/platform/audio-adapter.js',
    'js/platform/share-adapter.js',
    'js/platform/platform.js',
    'js/ads/ad-service.js',
    'js/ads/web-mock-ad.js',
    'js/ads/douyin-ad.js',
    'js/ads/wechat-ad.js',
    'js/ads/game-ad-coordinator.js'
];

function copyTo(srcRel) {
    const src = path.join(ROOT, srcRel);
    const dst = path.join(OUT, srcRel);
    if (!fs.existsSync(src)) {
        console.warn('[build:h5] 跳过不存在的文件: ' + srcRel);
        return;
    }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        copyDir(src, dst);
    } else {
        fs.copyFileSync(src, dst);
    }
}

function copyDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        const s = path.join(src, entry);
        const d = path.join(dst, entry);
        if (fs.statSync(s).isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
}

function main() {
    console.log('[build:h5] 清理旧产物...');
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });

    console.log('[build:h5] 复制资源...');
    for (const rel of COPY_LIST) copyTo(rel);

    // 产物说明
    fs.writeFileSync(path.join(OUT, 'BUILD_INFO.txt'),
        '膨胀小队 H5 构建\n' +
        '构建时间: ' + new Date().toISOString() + '\n' +
        '说明: 纯静态部署, Three.js已本地化(libs/), 无CDN依赖\n' +
        '部署: 任意静态服务器指向本目录, 入口 index.html\n');

    // 校验: index.html 不应再引用外部CDN
    const html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
    const cdnRefs = html.match(/https?:\/\/[^"']+\.js/g) || [];
    if (cdnRefs.length > 0) {
        console.warn('[build:h5] 警告: index.html 仍引用外部JS: ' + cdnRefs.join(', '));
    }

    // 大小统计
    let total = 0;
    (function walk(dir) {
        for (const e of fs.readdirSync(dir)) {
            const p = path.join(dir, e);
            const st = fs.statSync(p);
            if (st.isDirectory()) walk(p);
            else total += st.size;
        }
    })(OUT);
    console.log('[build:h5] 完成 → dist/h5/ (' + (total / 1024).toFixed(0) + ' KB)');
}

main();
