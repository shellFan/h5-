// Combat-art binary contract: generated variants may only replace the embedded
// base-colour atlas. Geometry, hierarchy, animation metadata and ORM data stay
// identical to the immutable source GLBs.
const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const hashes = {
  'assets/models/bosses/bruiser/bruiser-lod.glb': 'be75f64597ce2501737e5bec31fe12f7e6b2fcafdb65f6061ba6e656aeb0b857',
  'assets/models/bosses/bruiser/bruiser.glb': '250e68cb3363e56cd4b8943d800369c44e1485adbac612697e86adad7c016d17',
  'assets/models/bosses/bulwark/bulwark-lod.glb': '8328af3b16ad9efc349b5e528f275e1ca5e0113065ae10e5960dd2cf4dcd3b04',
  'assets/models/bosses/bulwark/bulwark.glb': 'd6c796276e9c283b557e7c4d14788a0f6795a8f3710536b5f4556ac9c651cadd',
  'assets/models/bosses/hivelord/hivelord-lod.glb': '1ee26bbcf95670d5fa6e0ca2ff0dfcc01eed283dfbee743edca8ee84250e9891',
  'assets/models/bosses/hivelord/hivelord.glb': 'fe30fb6dd378ba9c44e94d6279c78f506b1db638f8c2489908c68018827224a8',
  'assets/models/bosses/overlord/overlord-lod.glb': 'bace755706a3fdeb8c19f724833117398c9c3a9694d268dd0f1b5a2524103fc7',
  'assets/models/bosses/overlord/overlord.glb': 'a043fe44147ff53faf96a46e78774fc183027d2bf42b698ec301ae7fa50e474d',
  'assets/models/bosses/spitking/spitking-lod.glb': 'ada83d0cf20aad854c2a2f446d2a5d3ff24d38b755b42c5213063d599b714b4a',
  'assets/models/bosses/spitking/spitking.glb': '2cf1b4adc2b07e91ab483089bfc2f0f2dda39917920944a2141c3cb87aee2bdb',
  'assets/models/bosses/titan/titan-lod.glb': '0439f5700de151351566f60244966c5e7a0bee709f8d8d2b1f2596d8c3c25be0',
  'assets/models/bosses/titan/titan.glb': '910f33c2bb7d1f8b9e6ffbb72d575c385c80b49c2372f82f8eec4e817e9c67b6',
  'assets/models/soldier/soldier-lod.glb': 'f0e88ad7d19a43464016a923c7c3f0d1bec54770eacb0b3e45c188a13d77e781',
  'assets/models/soldier/soldier.glb': 'e924d3fb363c60c4cb62a7ac30dda09e914947a44caeab281c585601c2fabd01',
  'assets/models/zombies/bomber/bomber-lod.glb': '57e29594d9ba943c391316e5cd5a78fb0d40fa5197a1593af6264e99b0b4746d',
  'assets/models/zombies/bomber/bomber.glb': 'f00e38858b4cf4901926c99ece671f8a1d0bcf4b957e5af33846d430745049f7',
  'assets/models/zombies/elite/elite-lod.glb': '56e55aa31cfaf1f787fe144be11b27fbb4dffe56623f62a9cb60cfcbc0d5e98e',
  'assets/models/zombies/elite/elite.glb': '160f41dc6fc642b78e10766d6056d30c325bd2a2936a07a3b45a99c5f30baec2',
  'assets/models/zombies/fast/fast-lod.glb': '40cf0fdcfba0d1beddb271914f4f475c4de61c5f1aef3bc8f6c5891b61c7813c',
  'assets/models/zombies/fast/fast.glb': 'fd51de5374c68df7104448fb9a44098b165ed81c70255e8f02e7efd506db6639',
  'assets/models/zombies/normal/normal-lod.glb': '63f6edb74d710e154aeada802fdb7b27d4071cde57db31b846063c7f514fb6b7',
  'assets/models/zombies/normal/normal.glb': '959d7834e30dc064215c24d0c44a56b75cab88fc8a50142e53275008dac7a483',
  'assets/models/zombies/shield/shield-lod.glb': '0b4ba0d91f4bd40715b57568b5a4fd9ae90d0e7c2f2b6bb1de8ab5d8e45367a5',
  'assets/models/zombies/shield/shield.glb': '9316e4865ad6152f192c8759ca1b1bf20d2e9c88b575e5704738cfef57069330',
  'assets/models/zombies/spitter/spitter-lod.glb': '37876922119cb120da129d6571b5cd559d78e39eb66b13edb78a734202fb2f5f',
  'assets/models/zombies/spitter/spitter.glb': '8c1637c4acddfc07ecfa7df786e2c9d80731a5a1f03f7f5d112267908e4a77fd',
  'assets/models/zombies/split/split-lod.glb': 'da615ca3a4ddaf1d9dc55dc35bd032c78777fcfe0440a6f40b0bb10fa99029ca',
  'assets/models/zombies/split/split.glb': '90b923917cfe49fa457f05e2594c641bf67ed4c5d773d5136bfc7739874244a6',
};

function digest(data) { return crypto.createHash('sha256').update(data).digest('hex'); }
function parseGlb(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF', `${file}: magic`);
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const binStart = 20 + jsonLength + 8;
  return {bytes, json, binStart};
}
function view(parsed, index) {
  const item = parsed.json.bufferViews[index];
  const start = parsed.binStart + (item.byteOffset || 0);
  return parsed.bytes.subarray(start, start + item.byteLength);
}

let originalBytes = 0;
let variantBytes = 0;
for (const [relative, expectedHash] of Object.entries(hashes)) {
  const originalPath = path.join(ROOT, relative);
  const variantPath = path.join(ROOT, relative.replace('assets/models/', 'assets/game/models/'));
  const original = parseGlb(originalPath);
  const variant = parseGlb(variantPath);
  assert.equal(digest(original.bytes), expectedHash, `${relative}: immutable original hash`);
  originalBytes += original.bytes.length;
  variantBytes += variant.bytes.length;

  for (const key of ['asset', 'scene', 'scenes', 'nodes', 'meshes', 'accessors', 'materials', 'textures', 'samplers', 'animations', 'skins']) {
    assert.deepEqual(variant.json[key], original.json[key], `${relative}: ${key} preserved`);
  }
  assert.equal(variant.json.images.length, 2, `${relative}: two embedded images`);
  const baseTexture = original.json.materials[0].pbrMetallicRoughness.baseColorTexture.index;
  const ormTexture = original.json.materials[0].pbrMetallicRoughness.metallicRoughnessTexture.index;
  const baseView = original.json.images[original.json.textures[baseTexture].source].bufferView;
  const ormView = original.json.images[original.json.textures[ormTexture].source].bufferView;
  assert.notEqual(digest(view(variant, baseView)), digest(view(original, baseView)), `${relative}: palette changed`);
  assert.equal(digest(view(variant, ormView)), digest(view(original, ormView)), `${relative}: ORM unchanged`);
  const imageViews = new Set(original.json.images.map(image => image.bufferView));
  original.json.bufferViews.forEach((_, index) => {
    if (!imageViews.has(index)) assert.equal(digest(view(variant, index)), digest(view(original, index)), `${relative}: binary view ${index}`);
  });
}
assert(variantBytes <= originalBytes, `variant GLBs remain within source budget (${variantBytes} <= ${originalBytes})`);

const presentation = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/game/models/presentation.json'), 'utf8'));
assert.deepEqual(presentation.keys, ['soldier', 'normal', 'fast', 'shield', 'split', 'spitter', 'elite', 'bomber',
  'bruiser', 'bulwark', 'spitking', 'hivelord', 'titan', 'overlord']);
assert.equal(presentation.policy, 'basecolor-atlas-only');
for (const item of presentation.models) {
  assert(item.remappedCells.length >= 2 && item.remappedCells.length < 16, `${item.key}: selective remap`);
}

const artSource = fs.readFileSync(path.join(ROOT, 'js/military-art.js'), 'utf8');
for (const name of ['sunny', 'desert', 'city', 'forest', 'snow']) assert(artSource.includes(name), `biome ${name}`);
assert.match(artSource, /class MilitaryArt/);
assert.match(artSource, /setTheme\s*\(/);
assert.match(artSource, /update\s*\(squadZ/);
assert.match(artSource, /InstancedMesh/);

for (const effect of ['muzzle', 'hit', 'explosion', 'boss_explosion', 'coins', 'upgrade', 'boss_entry', 'trail']) {
  const png = fs.readFileSync(path.join(ROOT, `assets/game/effects/${effect}.png`));
  assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a', `${effect}: PNG`);
  assert.equal(png[24], 8, `${effect}: 8-bit`);
  assert.equal(png[25], 6, `${effect}: RGBA transparency`);
}
const effectsSource = fs.readFileSync(path.join(ROOT, 'js/effects.js'), 'utf8');
for (const effect of ['muzzle', 'hit', 'explosion', 'boss_explosion']) {
  assert(effectsSource.includes(`assets/game/effects/${effect}.png`), `${effect}: live Effects integration`);
}

console.log(`PASS military combat art: ${Object.keys(hashes).length} GLB variants; originals immutable; ` +
  `geometry/parts/animation/ORM preserved; ${(variantBytes / 1048576).toFixed(2)} MiB`);
