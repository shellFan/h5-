// Run after H5 / WeChat / Douyin builds. Inspect emitted files, not just build rules.
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
function files(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
        e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
for (const target of ['dist/h5', 'wechat-game', 'dist/douyin']) {
    const out = path.join(root, target);
    assert(fs.existsSync(out), 'Missing build ' + target);
    const list = files(out);
    assert(!list.some(p => p.includes('art-source')), 'Source images leaked into ' + target);
    const html = target === 'dist/h5' ? fs.readFileSync(path.join(out, 'index.html'), 'utf8') : '';
    if (html) {
        for (const m of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g)) {
            if (/^(data:|https?:|#)/.test(m[1])) continue;
            assert(fs.existsSync(path.join(out, m[1])), 'Missing emitted reference ' + m[1]);
        }
        assert(html.includes('style-art-military.css'));
    } else {
        const config = JSON.parse(fs.readFileSync(path.join(out, 'game.json'), 'utf8'));
        assert(config.subpackages.some(p => p.root === 'art-gallery/' && p.name === 'art_gallery'));
        const bundle = fs.readFileSync(path.join(out, 'game-bundle.js'), 'utf8');
        assert(bundle.includes('var ArtUI') && bundle.includes('MilitaryArt'));
        assert(!bundle.includes('assets/game/catalog/'), 'Gallery path not packaged');
        if (target === 'wechat-game') {
            let main = 0;
            for (const name of config.subpackages.map(p => p.root)) {
                const size = list.filter(p => path.relative(out, p).replaceAll('\\', '/').startsWith(name))
                    .reduce((sum, p) => sum + fs.statSync(p).size, 0);
                assert(size <= 4 * 1024 * 1024, 'Unpacked subpackage exceeds 4MiB: ' + name);
            }
            for (const p of list) if (!config.subpackages.some(s => path.relative(out, p).replaceAll('\\', '/').startsWith(s.root))) main += fs.statSync(p).size;
            assert(main <= 4 * 1024 * 1024, 'Unpacked main package exceeds 4MiB');
        }
    }
    const avatar = path.join(out, target === 'dist/h5' ? 'assets/game/ui/avatar.png' : 'art/ui/avatar.png');
    assert(fs.existsSync(avatar), target + ' missing real avatar');
    const data = fs.readFileSync(avatar);
    assert.equal(data.toString('ascii', 1, 4), 'PNG');
    assert(data.readUInt32BE(16) <= 256 && data.readUInt32BE(20) <= 256);
    console.log('PASS ' + target + ': runtime artwork present, originals excluded, package references checked');
}
