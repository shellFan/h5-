// Focused V4.1 runtime contracts. Run directly with Node.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');

const ROOT = path.join(__dirname, '..', '..');
global.THREE = require(path.join(ROOT, 'js/vendor/three.min.js'));

function source(name) {
    return fs.readFileSync(path.join(ROOT, name), 'utf8');
}

vm.runInThisContext([
    source('js/config.js'),
    source('js/utils.js'),
    source('js/movement.js'),
    source('js/soldier-renderer.js'),
    source('js/squad.js'),
    'globalThis.__SoldierRenderer = SoldierRenderer;',
    'globalThis.__Squad = Squad;'
].join('\n'), { filename: 'soldier-runtime-sources.js' });

function makeBank(material) {
    const geometries = {};
    const restMatrices = {};
    for (const name of ['Body', 'Head', 'Arms', 'LegL', 'LegR']) {
        geometries[name] = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        restMatrices[name] = new THREE.Matrix4();
    }
    restMatrices.Head.makeTranslation(0, 0.78, 0);
    restMatrices.Arms.makeTranslation(0, 0.67, 0);
    restMatrices.LegL.makeTranslation(-0.12, 0.38, 0);
    restMatrices.LegR.makeTranslation(0.12, 0.38, 0);
    return { geometries, restMatrices, material };
}

const material = new THREE.MeshStandardMaterial();
const fakeData = {
    parts: ['Body', 'Head', 'Arms', 'LegL', 'LegR'],
    banks: { hero: makeBank(material), lod: makeBank(material) },
    muzzleMatrix: new THREE.Matrix4().makeTranslation(0.16, -0.03, -0.78)
};
global.SoldierModelLoader = { get: () => fakeData };

const scene = new THREE.Scene();
const squad = new __Squad(scene);
squad.setCount(12);
assert.equal(squad.count, 12);
assert.equal(squad.mesh, squad.renderer.mesh);
assert.equal(squad.legMeshL, squad.renderer.legMeshL);
assert(squad.getHalfWidth() <= 2.3);

squad.setCount(100);
squad.update(1 / 60, 1, null);
assert.equal(squad.renderer.activeBank, 'hero');
assert.equal(squad.mesh.count, 100);

squad.setCount(101);
squad.update(1 / 60, 1.1, null);
assert.equal(squad.renderer.activeBank, 'lod');
assert.equal(squad.mesh.count, 101);
assert.equal(squad.renderer.banks.hero.meshes.Body.visible, false);
assert.equal(squad.renderer.banks.lod.meshes.Body.visible, true);

// Inspect a settled actor; newly spawned instances intentionally start near
// zero scale and do not have the final muzzle reach during the pop-in.
for (const s of squad.soldiers) s.spawnT = 1;
squad.update(1 / 60, 1.15, null);
const shot = squad.getShootPositions(1)[0];
assert.equal(typeof shot.shooterIndex, 'number');
assert(shot.z < squad.z + squad.soldiers[shot.shooterIndex].z - 0.25, 'muzzle must come from the forward attachment');
assert(squad.renderer.pose(shot.shooterIndex).recoil > 0, 'shoot trigger must be observable');

const before = squad.count;
squad.killSoldiers(2);
assert.equal(squad.count, before - 2);
assert.equal(squad.renderer.ghosts.length, 2);
squad.update(1 / 60, 1.12, null);
assert.equal(squad.renderer.pose(0).state, 'Hit');

squad.setAnimationState('Victory');
squad.update(1 / 60, 2, null);
assert.equal(squad.renderer.pose(0).state, 'Victory');

console.log('PASS soldier runtime: banks, aliases, muzzle, overlays, ghosts, victory');
