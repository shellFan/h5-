// Real binary contract test; no Three.js mocks.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const dir = path.join(__dirname, '../../assets/models/soldier');
function read(name) {
  const b = fs.readFileSync(path.join(dir, name));
  assert.equal(b.toString('ascii', 0, 4), 'glTF');
  assert.equal(b.readUInt32LE(4), 2);
  assert.equal(b.readUInt32LE(8), b.length);
  const json = JSON.parse(b.toString('utf8', 20, 20 + b.readUInt32LE(12)));
  assert(!json.buffers[0].uri, 'buffer must be embedded');
  const binStart = 20 + b.readUInt32LE(12) + 8;
  for (const image of json.images) {
    assert(!image.uri, 'runtime images must be embedded');
    const v = json.bufferViews[image.bufferView];
    assert.equal(b.toString('hex', binStart + v.byteOffset, binStart + v.byteOffset + 8), '89504e470d0a1a0a');
  }
  assert.equal(json.images.length, 2, 'base color + packed metallic/roughness');
  const material = json.materials[0].pbrMetallicRoughness;
  assert(material.baseColorTexture && material.metallicRoughnessTexture);
  const names = json.nodes.map(n => n.name);
  for (const n of ['Body','Head','Arms','LegL','LegR','Muzzle']) assert(names.includes(n), n);
  let tris = 0;
  for (const m of json.meshes) {
    assert.equal(m.primitives.length, 1, 'one draw per part');
    const p = m.primitives[0];
    assert.equal(p.material, 0, 'shared material');
    assert(p.attributes.TEXCOORD_0 !== undefined);
    assert(p.attributes.NORMAL !== undefined);
    tris += json.accessors[p.indices].count / 3;
  }
  assert.equal(json.meshes.length, 5);
  assert(b.length < 2 * 1024 * 1024);
  return tris;
}
const hero = read('soldier.glb');
const lod = read('soldier-lod.glb');
assert(hero <= 15000);
assert(lod < 4500 && lod < hero * .4);
console.log('PASS GLB structure, embedded PNGs, PBR, UVs, parts, shared material, triangles:', {hero,lod});
