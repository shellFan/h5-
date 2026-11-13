// V42 enemy-family binary contract test. Reads the authored GLBs directly.
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../assets/models/enemies');
const KEYS = ['normal', 'fast', 'shield', 'split', 'spitter', 'elite',
  'bruiser', 'bulwark', 'spitking', 'hivelord', 'titan', 'overlord'];
const BOSSES = new Set(['bruiser', 'bulwark', 'spitking', 'hivelord', 'titan', 'overlord']);
const PARTS = ['Body', 'Head', 'Arms', 'LegL', 'LegR'];

function pngDimensions(buffer, offset) {
  assert.equal(buffer.toString('hex', offset, offset + 8), '89504e470d0a1a0a', 'embedded image is PNG');
  assert.equal(buffer.toString('ascii', offset + 12, offset + 16), 'IHDR', 'PNG has IHDR');
  return [buffer.readUInt32BE(offset + 16), buffer.readUInt32BE(offset + 20)];
}

function parseGlb(file) {
  const b = fs.readFileSync(file);
  assert.equal(b.toString('ascii', 0, 4), 'glTF', `${file}: magic`);
  assert.equal(b.readUInt32LE(4), 2, `${file}: GLB 2`);
  assert.equal(b.readUInt32LE(8), b.length, `${file}: declared length`);
  const jsonLength = b.readUInt32LE(12);
  assert.equal(b.toString('ascii', 16, 20), 'JSON', `${file}: JSON chunk`);
  const json = JSON.parse(b.toString('utf8', 20, 20 + jsonLength));
  const binHeader = 20 + jsonLength;
  assert.equal(b.toString('ascii', binHeader + 4, binHeader + 8), 'BIN\0', `${file}: BIN chunk`);
  const binStart = binHeader + 8;
  function floatAccessor(index) {
    const accessor = json.accessors[index];
    assert.equal(accessor.componentType, 5126, `${file}: float vertex accessor`);
    const width = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4}[accessor.type];
    const view = json.bufferViews[accessor.bufferView];
    const stride = view.byteStride || width * 4;
    const start = binStart + (view.byteOffset || 0) + (accessor.byteOffset || 0);
    return Array.from({length: accessor.count}, (_, vertex) =>
      Array.from({length: width}, (_, component) => b.readFloatLE(start + vertex * stride + component * 4)));
  }
  assert.equal(json.materials.length, 1, `${file}: exactly one atlas material`);
  assert.equal(json.images.length, 2, `${file}: base color + ORM images`);
  const pbr = json.materials[0].pbrMetallicRoughness;
  assert(pbr.baseColorTexture && pbr.metallicRoughnessTexture, `${file}: PBR textures wired`);
  assert(!json.buffers[0].uri, `${file}: buffer embedded`);
  for (const image of json.images) {
    assert(!image.uri, `${file}: image embedded`);
    const v = json.bufferViews[image.bufferView];
    const [w, h] = pngDimensions(b, binStart + (v.byteOffset || 0));
    assert(w >= 256 && w <= 512 && h >= 256 && h <= 512, `${file}: atlas dimensions ${w}x${h}`);
  }
  assert.equal(json.meshes.length, 5, `${file}: exact five meshes`);
  const meshNodes = json.nodes.filter(n => n.mesh !== undefined);
  assert.equal(meshNodes.length, 5, `${file}: exact five mesh nodes`);
  assert.deepEqual(meshNodes.map(n => n.name).sort(), [...PARTS].sort(), `${file}: rigid part names`);
  let triangles = 0;
  let floor = Infinity;
  let top = -Infinity;
  for (const node of meshNodes) {
    const mesh = json.meshes[node.mesh];
    assert.equal(mesh.primitives.length, 1, `${file}/${node.name}: one primitive`);
    const primitive = mesh.primitives[0];
    assert.equal(primitive.material, 0, `${file}/${node.name}: shared material slot 0`);
    assert(primitive.attributes.POSITION !== undefined, `${file}/${node.name}: positions`);
    assert(primitive.attributes.NORMAL !== undefined, `${file}/${node.name}: normals`);
    assert(primitive.attributes.TEXCOORD_0 !== undefined, `${file}/${node.name}: UVs`);
    assert(primitive.indices !== undefined, `${file}/${node.name}: indexed`);
    triangles += json.accessors[primitive.indices].count / 3;
    const a = json.accessors[primitive.attributes.POSITION];
    assert(a.min && a.max, `${file}/${node.name}: position bounds`);
    const positions = floatAccessor(primitive.attributes.POSITION);
    const normals = floatAccessor(primitive.attributes.NORMAL);
    assert.equal(normals.length, positions.length, `${file}/${node.name}: normal per vertex`);
    for (const normal of normals) {
      const length = Math.hypot(normal[0], normal[1], normal[2]);
      assert(length > .94 && length < 1.06, `${file}/${node.name}: normalized outward data`);
    }
    // A front-most sample on every rigid part must point toward authored +Z.
    const frontZ = Math.max(...positions.map(position => position[2]));
    const frontNormals = normals.filter((_, i) => positions[i][2] >= frontZ - .02);
    assert(frontNormals.some(normal => normal[2] > .10), `${file}/${node.name}: front-most normal faces +Z`);
    const ty = node.translation ? node.translation[1] : 0;
    floor = Math.min(floor, a.min[1] + ty);
    top = Math.max(top, a.max[1] + ty);
  }
  assert(Math.abs(floor) <= 0.012, `${file}: ground origin (floor ${floor})`);
  return {json, triangles, height: top - floor};
}

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
assert.deepEqual(catalog.enemies.map(e => e.key), KEYS, 'catalog has stable complete enemy order');
assert.match(catalog.generator.blender, /^4\.2\./, 'generated by Blender 4.2');
assert.equal(catalog.generator.script, 'tools/create-enemies.py');

for (const key of KEYS) {
  const dir = path.join(ROOT, key);
  const stats = JSON.parse(fs.readFileSync(path.join(dir, 'model-stats.json'), 'utf8'));
  const entry = catalog.enemies.find(e => e.key === key);
  assert(entry && entry.hero === `${key}/${key}.glb` && entry.lod === `${key}/${key}-lod.glb`);
  assert.deepEqual(entry.parts, PARTS);
  assert.deepEqual(Object.keys(entry.origins).sort(), [...PARTS].sort());
  assert.equal(entry.up, '+Y');
  assert.equal(entry.forward, '+Z');
  assert(entry.frontAnchor[2] > 0, `${key}: positive-Z front anchor`);
  const hero = parseGlb(path.join(dir, `${key}.glb`));
  const lod = parseGlb(path.join(dir, `${key}-lod.glb`));
  const heroLimit = BOSSES.has(key) ? 15000 : 7000;
  const lodLimit = BOSSES.has(key) ? 4500 : 2000;
  assert(hero.triangles <= heroLimit, `${key}: hero ${hero.triangles} <= ${heroLimit}`);
  assert(lod.triangles <= lodLimit, `${key}: LOD ${lod.triangles} <= ${lodLimit}`);
  assert(lod.triangles < hero.triangles, `${key}: LOD is simpler`);
  assert(Math.abs(hero.height - lod.height) <= 0.05, `${key}: matching hero/LOD height`);
  assert(Math.abs(hero.height - entry.height) <= 0.025, `${key}: catalog height matches binary`);
  assert.equal(stats.triangles, hero.triangles);
  assert.equal(stats.lodTriangles, lod.triangles);
  for (const texture of [`${key}-basecolor.png`, `${key}-orm.png`]) {
    const p = path.join(dir, 'textures', texture);
    assert(fs.statSync(p).size > 128, `${key}: texture copy ${texture}`);
  }
}

console.log('PASS V42: 12 original five-part enemy GLB pairs, PBR atlases, budgets, bounds, and catalog');
