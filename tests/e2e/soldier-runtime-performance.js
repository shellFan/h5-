'use strict';

const assert = require('assert/strict');
const { createHarness, seededContext, watchPageErrors } = require('../../tools/v42-browser');

function closeEnough(actual, expected, message) {
    assert(Math.abs(actual - expected) < 1e-6, `${message}: ${actual} != ${expected}`);
}

(async () => {
    const harness = createHarness({ port: 8474 });
    let failures = 0;
    await harness.start();
    try {
        const context = await seededContext(harness.browser, { width: 390, height: 844 });
        const page = await context.newPage();
        const errors = watchPageErrors(page);
        await page.goto(`${harness.baseUrl}/index.html`);
        await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer);
        await page.evaluate(() => { window.__game._rafDisabled = true; });

        async function check(name, fn) {
            try {
                await fn();
                console.log(`PASS ${name}`);
            } catch (error) {
                failures++;
                console.error(`FAIL ${name}: ${error.message}`);
            }
        }

        await check('120 Hz LOD frames advance leg poses without replacing cached pose objects', async () => {
            const result = await page.evaluate(() => {
                const renderer = new SoldierRenderer(new THREE.Scene());
                const soldiers = Array.from({ length: 101 }, (_, index) => ({
                    x: index * 0.001, z: 0, spawnT: 1, phase: index * 0.01, rotY: 0
                }));
                const squad = {
                    count: soldiers.length, soldiers, x: 0, z: 0, _formationScale: 1,
                    _gameRef: { _classStats: { id: 'rifleman' } }
                };
                renderer.update(1 / 120, 1, squad, true, 0, 0);
                const firstPose = renderer._debugPoses[0];
                const firstSwing = firstPose.swingL;
                renderer.update(1 / 120, 1 + 1 / 120, squad, true, 0, 0);
                const secondSwing = renderer._debugPoses[0].swingL;
                renderer.ghosts.push({ root: new THREE.Matrix4(), phase: 0.2, age: 0, direction: -1 });
                renderer.update(1 / 120, 1 + 2 / 120, squad, true, 0, 0);
                const firstGhostPose = renderer._ghostPoses[0];
                renderer.update(1 / 120, 1 + 3 / 120, squad, true, 0, 0);
                return {
                    bank: renderer.activeBank,
                    samePose: firstPose === renderer._debugPoses[0],
                    sameGhostPose: firstGhostPose === renderer._ghostPoses[0],
                    firstSwing,
                    secondSwing
                };
            });
            assert.equal(result.bank, 'lod');
            assert.equal(result.samePose, true, 'per-index pose object was replaced');
            assert.equal(result.sameGhostPose, true, 'per-slot ghost pose object was replaced');
            assert.notEqual(result.firstSwing, result.secondSwing, 'LOD leg cycle remained frozen at 30 Hz');
        });

        await check('instance tint uploads occur only for class or visible-slot changes', async () => {
            const result = await page.evaluate(() => {
                const renderer = new SoldierRenderer(new THREE.Scene());
                const makeSoldier = index => ({ x: index * 0.01, z: 0, spawnT: 1, phase: index * 0.1, rotY: 0 });
                const soldiers = [makeSoldier(0), makeSoldier(1)];
                const gameRef = { _classStats: { id: 'rifleman' } };
                const squad = { count: 2, soldiers, x: 0, z: 0, _formationScale: 1, _gameRef: gameRef };
                const color = new THREE.Color();
                const versions = [];

                renderer.update(1 / 60, 1, squad, true, 0, 0);
                const attribute = renderer.banks.hero.meshes.Body.instanceColor;
                versions.push(attribute.version);
                renderer.update(1 / 60, 1 + 1 / 60, squad, true, 0, 0);
                versions.push(attribute.version);

                gameRef._classStats.id = 'medic';
                renderer.update(1 / 60, 1 + 2 / 60, squad, true, 0, 0);
                versions.push(attribute.version);
                renderer.banks.hero.meshes.Body.getColorAt(1, color);
                const classColor = [color.r, color.g, color.b];

                soldiers.push(makeSoldier(2), makeSoldier(3));
                squad.count = 4;
                renderer.update(1 / 60, 1 + 3 / 60, squad, true, 0, 0);
                versions.push(attribute.version);
                renderer.banks.hero.meshes.Body.getColorAt(3, color);
                const grownColor = [color.r, color.g, color.b];

                squad.count = 1;
                soldiers.length = 1;
                renderer.update(1 / 60, 1 + 4 / 60, squad, true, 0, 0);
                versions.push(attribute.version);

                renderer.ghosts.push({ root: new THREE.Matrix4(), phase: 0, age: 0, direction: 1 });
                renderer.update(0, 1 + 5 / 60, squad, true, 0, 0);
                versions.push(attribute.version);
                renderer.banks.hero.meshes.Body.getColorAt(1, color);
                const ghostColor = [color.r, color.g, color.b];

                renderer.ghosts.length = 0;
                soldiers.push(makeSoldier(1));
                squad.count = 2;
                renderer.update(0, 1 + 6 / 60, squad, true, 0, 0);
                versions.push(attribute.version);
                renderer.banks.hero.meshes.Body.getColorAt(1, color);
                const reusedColor = [color.r, color.g, color.b];
                return { versions, classColor, grownColor, ghostColor, reusedColor };
            });
            const v = result.versions;
            assert.equal(v[1], v[0], `stable class/count dirtied tint buffer: ${v}`);
            assert(v[2] > v[1], `class change did not upload tint: ${v}`);
            assert(v[3] > v[2], `count growth did not upload new tint slots: ${v}`);
            assert(v[4] > v[3], `count shrink did not record a visible-slot change: ${v}`);
            assert(v[5] > v[4], `ghost growth did not upload its tint slot: ${v}`);
            assert.equal(v[6], v[5], `same-tint ghost slot reuse caused a redundant upload: ${v}`);
            for (const [name, rgb] of Object.entries({
                classColor: result.classColor,
                grownColor: result.grownColor,
                ghostColor: result.ghostColor,
                reusedColor: result.reusedColor
            })) {
                closeEnough(rgb[0], 0.82, `${name}.r`);
                closeEnough(rgb[1], 1.18, `${name}.g`);
                closeEnough(rgb[2], 0.94, `${name}.b`);
            }
        });

        await check('LOD classes skip accessory creation and hero accessories restore on return', async () => {
            const result = await page.evaluate(() => {
                const renderer = new SoldierRenderer(new THREE.Scene());
                const soldiers = Array.from({ length: 101 }, (_, index) => ({
                    x: index * 0.001, z: 0, spawnT: 1, phase: index * 0.01, rotY: 0
                }));
                const squad = {
                    count: 101, soldiers, x: 0, z: 0, _formationScale: 1,
                    _gameRef: { _classStats: { id: 'gunner' } }
                };
                renderer.update(1 / 60, 1, squad, true, 0, 0);
                const lodBankCount = Object.keys(renderer._v16AccBanks).length;

                squad.count = 100;
                soldiers.length = 100;
                renderer.update(1 / 60, 2, squad, true, 0, 0);
                const accessory = renderer._v16AccBanks.heavyplate;
                const hero = accessory && {
                    count: accessory.mesh.count,
                    visible: accessory.mesh.visible,
                    version: accessory.mesh.instanceMatrix.version
                };

                soldiers.push({ x: 0, z: 0, spawnT: 1, phase: 0, rotY: 0 });
                squad.count = 101;
                renderer.update(1 / 60, 3, squad, true, 0, 0);
                const lod = { count: accessory.mesh.count, visible: accessory.mesh.visible,
                    version: accessory.mesh.instanceMatrix.version };
                renderer.update(1 / 60, 3 + 1 / 60, squad, true, 0, 0);
                const stableLodVersion = accessory.mesh.instanceMatrix.version;

                squad.count = 100;
                soldiers.length = 100;
                renderer.update(1 / 60, 4, squad, true, 0, 0);
                const restored = { count: accessory.mesh.count, visible: accessory.mesh.visible,
                    version: accessory.mesh.instanceMatrix.version };
                return { lodBankCount, hero, lod, stableLodVersion, restored };
            });
            assert.equal(result.lodBankCount, 0, 'fresh LOD update constructed a hidden accessory bank');
            assert.deepEqual({ count: result.hero.count, visible: result.hero.visible }, { count: 100, visible: true });
            assert.deepEqual({ count: result.lod.count, visible: result.lod.visible }, { count: 0, visible: false });
            assert.equal(result.lod.version, result.hero.version, 'LOD transition dirtied hidden accessory matrices');
            assert.equal(result.stableLodVersion, result.lod.version, 'stable LOD dirtied hidden accessory matrices');
            assert(result.restored.visible && result.restored.count === 100 && result.restored.version > result.lod.version,
                `hero accessory did not restore: ${JSON.stringify(result)}`);
        });

        await check('muzzle remains attached to rigid Arms and animation priorities are unchanged', async () => {
            const result = await page.evaluate(() => {
                const renderer = new SoldierRenderer(new THREE.Scene());
                const soldier = { x: 0.25, z: -0.5, spawnT: 1, phase: 0.37, rotY: 0.08 };
                const squad = {
                    count: 1, soldiers: [soldier], x: 0.4, z: -2, _formationScale: 0.94,
                    _moving: true, _lean: 0.03, _tilt: -0.02,
                    _gameRef: { _classStats: { id: 'rifleman' } }
                };
                renderer.update(1 / 60, 1.25, squad, true, squad._lean, squad._tilt);
                const run = renderer.pose(0).state;
                const muzzle = renderer.getMuzzlePosition(0, squad, new THREE.Vector3());
                const arms = new THREE.Matrix4();
                renderer.banks[renderer.activeBank].meshes.Arms.getMatrixAt(0, arms);
                const attached = new THREE.Vector3().setFromMatrixPosition(arms.multiply(renderer.data.muzzleMatrix));

                renderer.triggerHit();
                renderer.update(0, 1.3, squad, true, 0, 0);
                const hit = renderer.pose(0).state;
                renderer.triggerShoot(0);
                renderer.update(0, 1.3, squad, true, 0, 0);
                const shootOverHit = renderer.pose(0).state;
                renderer.setState('Victory');
                renderer.update(0, 1.3, squad, true, 0, 0);
                const victory = renderer.pose(0).state;
                renderer.setState('Death');
                renderer.update(0, 1.3, squad, true, 0, 0);
                const death = renderer.pose(0).state;
                const deathPose = renderer._debugPoses[0];
                renderer.setState('Auto');
                renderer._shootT[0] = 0;
                renderer._hitT = 0;
                renderer.update(0, 1.4, squad, false, 0, 0);
                const resetPose = renderer._debugPoses[0];
                return {
                    muzzleDistance: muzzle.distanceTo(attached), run, hit, shootOverHit, victory, death,
                    reusedAfterDeath: deathPose === resetPose,
                    reset: {
                        state: resetPose.state, deathT: resetPose.deathT,
                        deathDirection: resetPose.deathDirection,
                        armsLift: resetPose.armsLift, headLift: resetPose.headLift
                    }
                };
            });
            assert(result.muzzleDistance < 1e-6, `muzzle detached by ${result.muzzleDistance}`);
            assert.deepEqual(
                { run: result.run, hit: result.hit, shootOverHit: result.shootOverHit, victory: result.victory, death: result.death },
                { run: 'Run', hit: 'Hit', shootOverHit: 'Shoot', victory: 'Victory', death: 'Death' }
            );
            assert.equal(result.reusedAfterDeath, true, 'death transition replaced the per-index pose cache');
            assert.deepEqual(result.reset, {
                state: 'Idle', deathT: 0, deathDirection: 0, armsLift: 0,
                headLift: Math.sin(1.4 * 2 + 0.37) * 0.008
            });
        });

        await check('soldier runtime checks emit no browser errors', async () => {
            assert.deepEqual(errors, []);
        });
        await context.close();
    } finally {
        await harness.close();
    }
    if (failures) process.exitCode = 1;
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
