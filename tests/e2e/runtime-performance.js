const assert = require('assert/strict');
const { createHarness, seededContext } = require('../../tools/v42-browser');
(async () => {
    const h = createHarness({ port: 8473 });
    let failures = 0;
    await h.start();
    try {
        const context = await seededContext(h.browser, { width: 390, height: 844 });
        await context.addInitScript(() => {
            let progress;
            Object.defineProperty(window, '__BootProgress', { configurable: true,
                get: () => progress, set: value => {
                    progress = value; const done = value.done;
                    value.done = function() {
                        window.__criticalStyles = Object.keys(EnemyModelLoader.get().styles);
                        return done.apply(this, arguments);
                    };
                } });
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(h.baseUrl);
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
        await page.evaluate(() => { window.__game._rafDisabled = true; });
        async function check(name, fn) {
            try { await fn(); console.log('PASS ' + name); }
            catch (e) { failures++; console.error('FAIL ' + name + ': ' + e.message); }
        }
        await check('home waits only for normal and fast enemy banks', async () => {
            assert.deepEqual(await page.evaluate(() => window.__criticalStyles.sort()), ['fast', 'normal']);
        });
        await check('environment preload is reused and resolves installed scenery', async () => {
            const r = await page.evaluate(async () => {
                if (!MilitaryArt.preload) return { missing: true };
                const a = MilitaryArt.preload(), b = MilitaryArt.preload();
                const ready = await window.__game.world._militaryArt.ready;
                return { shared: a === b, ready, model: !!window.__game.world.scene.getObjectByName('military-glb-pines'),
                    requests: performance.getEntriesByType('resource').filter(r => r.name.includes('env_military_pack.glb')).length };
            });
            assert(r.shared && r.ready && r.model && r.requests === 1, JSON.stringify(r));
        });
        await check('routine kills keep camera and game time steady', async () => {
            const r = await page.evaluate(() => {
                const g = window.__game; g.start(); g.pacing.clear(); g.gates.clear(); g.enemies.clear();
                RandomEvents._t = 99999; g.combat.fireTimer = 99999;
                const shake = g.world.shake; let shakes = 0;
                g.world.shake = () => shakes++;
                try {
                    g._prevKillCount = 0; g.combo = 0; g._timeScale = 1;
                    for (let i = 1; i <= 3; i++) { g.enemies.killCount = i; g.time += .016; g._update(.016); }
                    return { shakes, scale: g._timeScale, combo: g.combo };
                } finally { g.world.shake = shake; }
            });
            assert.deepEqual(r, { shakes: 0, scale: 1, combo: 3 });
        });
        await check('combo milestones do not pause soldier simulation', async () => {
            const scale = await page.evaluate(() => {
                const g = window.__game; g.enemies.killCount = 30; g._prevKillCount = 29; g.combo = 29;
                g._comboMilestone = 0; g.time += .016; g._update(.016); return g._timeScale;
            });
            assert.equal(scale, 1);
        });
        await check('camera shake cannot bias the subsequent follow position', async () => {
            const diff = await page.evaluate(() => {
                const w = window.__game.world;
                function run(shake) {
                    w.camera.position.set(0, 7, 9); w._camScale = undefined; w._depthSmooth = undefined;
                    w._shakeT = 0; w._shakePhase = 0; w._shakeOffsetX = w._shakeOffsetY = 0; w._shakeDisabled = false;
                    if (shake) w.shake(.2, .1);
                    for (let i = 0; i < 12; i++) w.updateCamera(0, 0, 1 / 60, 12, 2);
                    return w.camera.position.clone();
                }
                return run(false).distanceTo(run(true));
            });
            assert(diff < 1e-8, 'follow drift ' + diff);
        });
        await check('hidden scenery avoids uploads and themes restore valid matrices', async () => {
            const r = await page.evaluate(async () => {
                const art = window.__game.world._militaryArt;
                if (art.ready) await art.ready;
                art.setTheme('dawn'); art.update(-1);
                const hidden = art._meshes.filter(m => !m.visible);
                const versions = hidden.map(m => m.instanceMatrix.version);
                art.update(-49);
                const changed = hidden.filter((m,i) => m.instanceMatrix.version !== versions[i]).map(m => m.name);
                art.setTheme('dusk'); art.update(-49);
                const invalid = art._meshes.filter(m => m.visible).filter(m => {
                    const matrix = new THREE.Matrix4(); m.getMatrixAt(0, matrix);
                    const rec = m.userData.records[0];
                    return Math.abs(matrix.elements[14] - (art._anchor + 24 - rec.segment * 24 + rec.z)) > .001;
                }).map(m=>m.name);
                art.setTheme('dawn'); art.update(0);
                return { hidden: hidden.length, changed, invalid };
            });
            assert(r.hidden > 0); assert.deepEqual(r.changed, []); assert.deepEqual(r.invalid, []);
        });
        await check('no runtime errors', () => assert.deepEqual(errors, []));
        await context.close();
        // Failed optional scenery must leave the playable fallback and settle readiness.
        const fallback = await h.browser.newPage({ viewport: { width: 390, height: 844 } });
        await fallback.route('**/env_military_pack.glb*', route => route.abort());
        await fallback.goto(h.baseUrl);
        await fallback.waitForFunction(() => window.__game && window.__game.squad.renderer);
        await check('scenery network failure settles and preserves the fallback', async () => {
            const r = await fallback.evaluate(async () => {
                const art = window.__game.world._militaryArt;
                if (!art.ready) return { missing: true };
                return { ready: await art.ready, visible: art._meshes.filter(m => m.visible).length };
            });
            assert.equal(r.ready, false); assert(r.visible > 0);
        });
        await fallback.close();
    } finally { await h.close(); }
    if (failures) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
