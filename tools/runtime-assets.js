// Build-time policy shared by all targets. Original inputs never enter a runtime package.
const fs = require('fs');
const path = require('path');
function includeAsset(root, relative, platform) {
    const rel = relative.replace(/\\/g, '/');
    if (rel === 'art-source' || rel.startsWith('art-source/')) return false;
    if (platform !== 'h5') {
        if (rel.startsWith('game/catalog/')) return false; // Separate optional gallery package.
        if (rel.includes('/textures/') || /\.(md|py|blend|csv)$/i.test(rel)) return false;
        if (rel.startsWith('models/') && rel.endsWith('.glb') &&
            fs.existsSync(path.join(root, 'assets/game/models', rel.slice('models/'.length)))) return false;
        if (rel.startsWith('game/') && rel.endsWith('.webp')) return false; // JPEG/PNG fallback.
    }
    return true;
}
function miniSource(code) {
    return code.replace(/assets\/game\/catalog\//g, 'art-gallery/')
        .replace(/assets\/game\/(?!models\/)/g, 'art/');
}
function copyGallery(root, out) {
    const source = path.join(root, 'assets/game/catalog');
    if (!fs.existsSync(source)) return 0;
    let bytes = 0;
    const target = path.join(out, 'art-gallery');
    fs.mkdirSync(target, { recursive: true });
    for (const name of fs.readdirSync(source)) {
        if (!name.endsWith('.jpg')) continue;
        const data = fs.readFileSync(path.join(source, name));
        fs.writeFileSync(path.join(target, name), data); bytes += data.length;
    }
    return bytes;
}
module.exports = { includeAsset, miniSource, copyGallery };
