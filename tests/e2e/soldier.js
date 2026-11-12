// V4.1 deterministic real-browser soldier integration tests.
// Run directly: node tests/e2e/soldier.js

'use strict';

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..', '..');
const PORT = Number(process.env.SOLDIER_E2E_PORT || 8241);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const HEADLESS = process.env.E2E_HEADED !== '1';
const VIEWPORT = { width: 390, height: 844 };
const SEED = 0x51d1e41;

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (error) {
        failed++;
        const message = error && error.message ? error.message : String(error);
        failures.push({ name, message });
        console.log(`  ✗ ${name}\n      ${message.split('\n')[0]}`);
    }
}

function waitForServer(child) {
    return new Promise((resolve, reject) => {
        const started = Date.now();
        let settled = false;
        function finish(error) {
            if (settled) return;
            settled = true;
            if (error) reject(error);
            else resolve();
        }
        child.once('exit', code => finish(new Error(`Static server exited before readiness (code ${code})`)));
        (function poll() {
            if (settled) return;
            const request = http.get(`${BASE_URL}/index.html`, response => {
                response.resume();
                if (response.statusCode === 200) finish();
                else if (Date.now() - started > 10000) finish(new Error(`Static server returned ${response.statusCode}`));
                else setTimeout(poll, 100);
            });
            request.setTimeout(1000, () => request.destroy());
            request.on('error', () => {
                if (Date.now() - started > 10000) finish(new Error(`Static server did not become ready at ${BASE_URL}`));
                else setTimeout(poll, 100);
            });
        })();
    });
}

async function startServer() {
    const child = spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
        cwd: ROOT,
        env: { ...process.env, PORT: String(PORT) },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
    });
    let diagnostics = '';
    child.stdout.on('data', chunk => { diagnostics += chunk; });
    child.stderr.on('data', chunk => { diagnostics += chunk; });
    try {
        await waitForServer(child);
        return child;
    } catch (error) {
        child.kill();
        throw new Error(`${error.message}${diagnostics ? `\n${diagnostics.trim()}` : ''}`);
    }
}

async function launchSystemBrowser() {
    const candidates = [
        { channel: 'msedge' },
        { executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
        { executablePath: 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe' },
        { channel: 'chrome' },
        { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' }
    ];
    for (const candidate of candidates) {
        try {
            return await chromium.launch({ headless: HEADLESS, ...candidate });
        } catch (_) {
            // Try the next system installation.
        }
    }
    throw new Error('No system Edge/Chrome installation could be launched');
}

async function newContext(browser) {
    const context = await browser.newContext({
        viewport: VIEWPORT,
        screen: VIEWPORT,
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false
    });
    await context.addInitScript(seed => {
        let state = seed >>> 0;
        Math.random = function seededRandom() {
            state += 0x6D2B79F5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    }, SEED);
    return context;
}

function watchPage(page, allowExpectedErrors = false) {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() !== 'error' || message.text().includes('favicon')) return;
        const url = message.location().url || '';
        if (url.includes('favicon')) return;
        if (!allowExpectedErrors) errors.push(message.text() + ' @' + url);
    });
    return errors;
}

async function gotoReadyGame(page) {
    await page.goto(`${BASE_URL}/index.html?soldier-e2e=1`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => Boolean(window.__game), null, { timeout: 15000 });
    await page.waitForFunction(() => window.SoldierModelLoader && SoldierModelLoader.status === 'loaded', null, { timeout: 5000 });
}

async function suiteFailureAndRetry(browser) {
    console.log('\n[soldier boot failure/retry]');
    const context = await newContext(browser);
    const page = await context.newPage();
    watchPage(page, true);
    let aborted = 0;
    let successfulHeroResponses = 0;
    const pattern = '**/assets/models/soldier/soldier.glb*';
    await page.route(pattern, route => {
        aborted++;
        return route.abort('failed');
    });
    page.on('response', response => {
        if (/\/assets\/models\/soldier\/soldier\.glb(?:\?|$)/.test(response.url()) && response.ok()) successfulHeroResponses++;
    });

    await test('aborted hero GLB shows a visible boot error and creates no Game', async () => {
        await page.goto(`${BASE_URL}/index.html?soldier-failure=1`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForFunction(() => {
            const error = document.getElementById('error-display');
            const retry = document.getElementById('btn-retry-model');
            return error && error.textContent.trim() && retry && getComputedStyle(retry).display !== 'none';
        }, null, { timeout: 10000 });
        const state = await page.evaluate(() => ({
            hasGame: Boolean(window.__game),
            error: document.getElementById('error-display').textContent.trim(),
            retryVisible: !!document.getElementById('btn-retry-model').offsetParent
        }));
        assert(aborted === 1, `Expected one aborted hero request, got ${aborted}`);
        assert(!state.hasGame, 'Game must not be constructed after the model load failure');
        assert(state.error.length > 0 && state.retryVisible, `Missing visible retry UI: ${JSON.stringify(state)}`);
    });

    await test('retry loads the GLB once and creates one game canvas', async () => {
        await page.unroute(pattern);
        await page.click('#btn-retry-model');
        await page.waitForFunction(() => Boolean(window.__game), null, { timeout: 15000 });
        await page.waitForFunction(() => SoldierModelLoader.status === 'loaded', null, { timeout: 5000 });
        const state = await page.evaluate(() => ({
            canvases: document.querySelectorAll('#game-canvas').length,
            allCanvases: document.querySelectorAll('canvas').length,
            loader: SoldierModelLoader.status,
            hasRenderer: Boolean(window.__game && window.__game.squad && window.__game.squad.renderer)
        }));
        assert(successfulHeroResponses === 1, `Retry fetched hero ${successfulHeroResponses} times`);
        assert(state.canvases === 1 && state.allCanvases === 1, `Duplicate canvas after retry: ${JSON.stringify(state)}`);
        assert(state.loader === 'loaded' && state.hasRenderer, `Retry did not finish renderer boot: ${JSON.stringify(state)}`);
    });

    await context.close();
}

async function suiteLoadedModel(browser) {
    console.log('\n[soldier loaded model/runtime]');
    const context = await newContext(browser);
    const page = await context.newPage();
    const errors = watchPage(page);
    const modelResponses = { hero: 0, lod: 0 };
    page.on('response', response => {
        if (!response.ok()) return;
        if (/\/soldier\.glb(?:\?|$)/.test(response.url())) modelResponses.hero++;
        if (/\/soldier-lod\.glb(?:\?|$)/.test(response.url())) modelResponses.lod++;
    });
    await gotoReadyGame(page);

    await test('real GLBs provide five indexed parts with shared material and no procedural soldier geometry', async () => {
        const result = await page.evaluate(() => {
            const data = SoldierModelLoader.get();
            const parts = ['Body', 'Head', 'Arms', 'LegL', 'LegR'];
            const bankInfo = {};
            for (const bankName of ['hero', 'lod']) {
                const bank = data.banks[bankName];
                bankInfo[bankName] = {
                    names: Object.keys(bank.geometries),
                    allIndexed: parts.every(name => Boolean(bank.geometries[name] && bank.geometries[name].index)),
                    triangles: parts.reduce((sum, name) => sum + bank.geometries[name].index.count / 3, 0),
                    sharedMaterial: bank.material === data.material
                };
            }
            const oldSources = [];
            window.__game.world.scene.traverse(node => {
                const source = node.userData && node.userData.artSource;
                if (source && /createSoldier|procedural soldier/i.test(source)) oldSources.push(source);
            });
            return {
                parts: data.parts,
                bankInfo,
                rendererBank: window.__game.squad.renderer.activeBank,
                oldSources
            };
        });
        assert(JSON.stringify(result.parts) === JSON.stringify(['Body', 'Head', 'Arms', 'LegL', 'LegR']), `Part contract mismatch: ${result.parts}`);
        for (const bankName of ['hero', 'lod']) {
            const bank = result.bankInfo[bankName];
            assert(bank.names.length === 5 && bank.allIndexed, `${bankName} does not use five indexed GLB geometries`);
            assert(bank.sharedMaterial, `${bankName} does not share the loaded material`);
        }
        assert(result.bankInfo.hero.triangles > 8000 && result.bankInfo.hero.triangles < 15000, 'Hero triangle budget');
        assert(result.bankInfo.lod.triangles < 4500, 'LOD triangle budget');
        assert(result.oldSources.length === 0, `Procedural soldier geometry remains in scene: ${result.oldSources.join(', ')}`);
    });

    await test('embedded base-color and ORM textures are decoded by the browser', async () => {
        const texture = await page.evaluate(() => {
            const material = SoldierModelLoader.get().material;
            const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
            const ctx=canvas.getContext('2d');ctx.drawImage(material.roughnessMap.image,0,0);
            const pixels=ctx.getImageData(0,0,256,256).data;
            let minG=255,maxG=0,maxB=0;
            for(let i=0;i<pixels.length;i+=4){minG=Math.min(minG,pixels[i+1]);maxG=Math.max(maxG,pixels[i+1]);maxB=Math.max(maxB,pixels[i+2]);}
            function size(map) {
                const image = map && map.image;
                return {
                    width: image && (image.width || image.naturalWidth || image.videoWidth) || 0,
                    height: image && (image.height || image.naturalHeight || image.videoHeight) || 0
                };
            }
            return {
                standard: material.isMeshStandardMaterial,
                baseColor: size(material.map),
                orm: size(material.metalnessMap),
                ormShared: material.metalnessMap === material.roughnessMap,
                minG,maxG,maxB,
                colorEncoding: material.map.encoding,
                dataEncoding: material.roughnessMap.encoding
            };
        });
        assert(texture.standard, 'Loaded material is not MeshStandardMaterial');
        assert(texture.baseColor.width > 0 && texture.baseColor.height > 0, `Base-color image not decoded: ${JSON.stringify(texture.baseColor)}`);
        assert(texture.orm.width > 0 && texture.orm.height > 0, `ORM image not decoded: ${JSON.stringify(texture.orm)}`);
        assert(texture.ormShared, 'Metalness and roughness must use the same decoded ORM texture');
        assert(texture.maxG>200 && texture.maxG-texture.minG>80 && texture.maxB>100,'Packed roughness/metallic data was erased or flattened');
        assert(texture.colorEncoding===3001 && texture.dataEncoding===3000,'Incorrect PBR texture color spaces');
    });

    await test('loader promise/data cache is referentially stable and does not refetch', async () => {
        const before = await page.evaluate(() => performance.getEntriesByType('resource')
            .filter(entry => /soldier(?:-lod)?\.glb(?:\?|$)/.test(entry.name)).length);
        const cache = await page.evaluate(async () => {
            const data = SoldierModelLoader.get();
            const firstPromise = SoldierModelLoader.load();
            const secondPromise = SoldierModelLoader.load();
            const first = await firstPromise;
            const second = await secondPromise;
            return {
                promiseEqual: firstPromise === secondPromise,
                resultEqual: first === second,
                getEqual: first === data && second === SoldierModelLoader.get(),
                status: SoldierModelLoader.status,
                loadMs: SoldierModelLoader.loadMs
            };
        });
        await page.waitForTimeout(100);
        const after = await page.evaluate(() => performance.getEntriesByType('resource')
            .filter(entry => /soldier(?:-lod)?\.glb(?:\?|$)/.test(entry.name)).length);
        assert(cache.resultEqual && cache.getEqual, `Loader data cache is not stable: ${JSON.stringify(cache)}`);
        // A fulfilled cache may return distinct Promise.resolve wrappers; the resolved data must be identical.
        assert(cache.status === 'loaded' && cache.loadMs > 0, `Invalid loader status/timing: ${JSON.stringify(cache)}`);
        assert(before === 2 && after === before, `Expected exactly two initial GLB resources and no refetch, got ${before} -> ${after}`);
        assert(modelResponses.hero === 1 && modelResponses.lod === 1, `Network response count mismatch: ${JSON.stringify(modelResponses)}`);
    });

    await test('movement, count growth, gate effect, and combat still operate with GLB soldiers', async () => {
        const initial = await page.evaluate(() => {
            const game = window.__game;
            game.start();
            game.squad.setCount(12);
            if (game.enemies && game.enemies.clear) game.enemies.clear();
            if (game.gates && game.gates.clear) game.gates.clear();
            if (game.pacing && game.pacing.clear) game.pacing.clear();
            game.squad.x = 0;
            game.squad.targetX = 1.2;
            return { x: game.squad.x, count: game.squad.count };
        });
        await page.waitForTimeout(500);
        const result = await page.evaluate(() => {
            const game = window.__game;
            const movedX = game.squad.x;
            game.squad.applyGate({ op: 'add', value: 5 }, null);
            const countAfterGate = game.squad.count;
            const enemy = game.enemies.spawnEnemy('normal', game.squad.x, game.squad.z - 5, 1000);
            game.combat.fireTimer = 0;
            return new Promise(resolve => setTimeout(() => resolve({
                movedX,
                countAfterGate,
                rendererCount: game.squad.renderer.mesh.count,
                bullets: game.combat.bullets.length,
                enemyAlive: Boolean(enemy && enemy.alive),
                state: game.state
            }), 250));
        });
        assert(initial.count === 12 && result.countAfterGate === 17, `Count/gate regression: ${JSON.stringify(result)}`);
        assert(result.movedX > initial.x + 0.25, `Movement did not advance toward target: ${initial.x} -> ${result.movedX}`);
        assert(result.rendererCount === 17, `Renderer count ${result.rendererCount} != squad count 17`);
        assert(result.state === 'playing' && (result.bullets > 0 || !result.enemyAlive), `Combat did not fire or damage target: ${JSON.stringify(result)}`);
    });

    await test('shoot positions equal the transformed Arms/Muzzle attachment in x/y/z', async () => {
        const result = await page.evaluate(() => {
            const game = window.__game;
            const originalRandom = Math.random;
            Math.random = () => 0;
            let shot;
            try { shot = game.squad.getShootPositions(1)[0]; }
            finally { Math.random = originalRandom; }
            const renderer = game.squad.renderer;
            const armsMatrix = new THREE.Matrix4();
            renderer.banks[renderer.activeBank].meshes.Arms.getMatrixAt(shot.shooterIndex, armsMatrix);
            const actual = new THREE.Vector3().setFromMatrixPosition(armsMatrix.multiply(SoldierModelLoader.get().muzzleMatrix));
            game.combat._fire(shot, 1, null, false);
            const bullet = game.combat.bullets[game.combat.bullets.length - 1].mesh.position;
            if (bullet.distanceTo(actual) > 1e-6) throw new Error('Bullet detached from muzzle');
            return {
                shooterIndex: shot.shooterIndex,
                shot: { x: shot.x, y: shot.y, z: shot.z },
                attachment: { x: actual.x, y: actual.y, z: actual.z },
                finite: [shot.x, shot.y, shot.z, actual.x, actual.y, actual.z].every(Number.isFinite)
            };
        });
        assert(Number.isInteger(result.shooterIndex), `Missing shooterIndex: ${JSON.stringify(result)}`);
        assert(result.finite, `Non-finite muzzle coordinates: ${JSON.stringify(result)}`);
        for (const axis of ['x', 'y', 'z']) {
            assert(Math.abs(result.shot[axis] - result.attachment[axis]) < 1e-6,
                `${axis} muzzle mismatch: shot=${result.shot[axis]}, attachment=${result.attachment[axis]}`);
        }
    });

    await test('all six animation states change real part transforms and death leaves a bounded ghost', async () => {
        const result = await page.evaluate(async () => {
            const game = window.__game;
            const squad = game.squad;
            const renderer = squad.renderer;
            game.enemies.clear();game.gates.clear();game.pacing.clear();game.combat.clear();
            squad.setCount(2);
            squad.soldiers.forEach(soldier => { soldier.spawnT = 1; });
            const nextFrames = count => new Promise(resolve => {
                function frame() {
                    if (--count <= 0) resolve();
                    else requestAnimationFrame(frame);
                }
                requestAnimationFrame(frame);
            });
            function flattenPose() {
                const output = [];
                for (const key of ['Body', 'Head', 'Arms', 'LegL', 'LegR']) {
                    const value = new THREE.Matrix4();
                    renderer.banks[renderer.activeBank].meshes[key].getMatrixAt(0, value);
                    output.push(...value.elements.map(n => Math.round(n * 1e6) / 1e6));
                }
                return output;
            }
            const states = ['idle', 'run', 'shoot', 'hit', 'death', 'victory'];
            const poses = {};
            for (const state of states) {
                squad.setAnimationState(state[0].toUpperCase() + state.slice(1));
                renderer._shootT.fill(0);renderer._hitT=0;
                if (state === 'shoot') renderer.triggerShoot(0);
                if (state === 'hit') renderer.triggerHit();
                renderer.update(1 / 30, 1.234, squad, state === 'run', state === 'run' ? 0.1 : 0, 0);
                poses[state] = flattenPose(renderer.pose(0));
            }
            squad.setAnimationState('Run');
            renderer.update(1 / 30, 1.234, squad, true, 0.1, 0);
            const runA = flattenPose(renderer.pose(0));
            renderer.update(1 / 30, 1.534, squad, true, 0.1, 0);
            const runB = flattenPose(renderer.pose(0));
            const ghostsBefore = renderer.ghosts ? renderer.ghosts.length : 0;
            squad.killSoldiers(1, null);
            await nextFrames(2);
            const ghostsAfterDeath = renderer.ghosts ? renderer.ghosts.length : 0;
            await new Promise(resolve => setTimeout(resolve, 1300));
            await nextFrames(2);
            const ghostsAfterExpiry = renderer.ghosts ? renderer.ghosts.length : 0;
            return {
                states,
                poseLengths: Object.fromEntries(states.map(state => [state, poses[state].length])),
                distinctFromIdle: Object.fromEntries(states.slice(1).map(state => [state, JSON.stringify(poses[state]) !== JSON.stringify(poses.idle)])),
                runChangesWithTime: JSON.stringify(runA) !== JSON.stringify(runB),
                ghostsBefore,
                ghostsAfterDeath,
                ghostsAfterExpiry,
                countAfterDeath: squad.count
            };
        });
        for (const state of result.states) {
            assert(result.poseLengths[state] >= 16 * 5, `${state} pose did not expose five real part matrices`);
        }
        for (const state of ['run', 'shoot', 'hit', 'death', 'victory']) {
            assert(result.distinctFromIdle[state], `${state} pose did not differ from idle`);
        }
        assert(result.runChangesWithTime, 'Run pose did not change over time');
        assert(result.countAfterDeath === 1 && result.ghostsAfterDeath > result.ghostsBefore,
            `Actual squad death did not create a ghost: ${JSON.stringify(result)}`);
        assert(result.ghostsAfterExpiry === 0,
            `Death ghost count grew after expiry window: ${JSON.stringify(result)}`);
    });

    await test('real GLB banks switch at 100/101 and all requested formation sizes fit the road', async () => {
        const cases = await page.evaluate(() => {
            const g=window.__game;g.paused=true;
            return [1,12,31,100,101,300,500].map(n=>{
                g.squad.reset(n);g.squad.update(1,3,g.squad.z);
                const r=g.squad.renderer;
                return {n,bank:r.activeBank,width:g.squad.getHalfWidth(),visible:Object.values(r.banks).flatMap(b=>Object.values(b.meshes)).filter(m=>m.visible).length,count:r.mesh.count,phases:new Set(g.squad.soldiers.map(s=>s.phase)).size};
            });
        });
        for(const c of cases){
            assert(c.bank === (c.n<=100?'hero':'lod'), 'LOD threshold '+JSON.stringify(c));
            assert(c.width<=2.3 && c.visible===5 && c.count===c.n, 'Formation/bank '+JSON.stringify(c));
            assert(c.phases===c.n,'Animation phases are synchronized');
        }
    });

    await test('win progression survives a real page reload', async () => {
        await page.evaluate(()=>{const g=window.__game;g.levelIndex=0;g._win();});
        await page.reload();
        await page.waitForFunction(()=>!!window.__game);
        assert(await page.evaluate(()=>window.__game._loadProgress()>=2),'Saved progression lost after reload');
    });

    await test('successful soldier boot is free of browser errors', async () => {
        const errorText = await page.evaluate(() => {
            const element = document.getElementById('error-display');
            return element ? element.textContent.trim() : '';
        });
        assert(!errorText, `Visible runtime error: ${errorText}`);
        assert(errors.length === 0, `Console/page errors: ${errors.join(' | ')}`);
    });

    await context.close();
}

async function main() {
    let server = null;
    let browser = null;
    try {
        server = await startServer();
        browser = await launchSystemBrowser();
        await suiteFailureAndRetry(browser);
        await suiteLoadedModel(browser);
    } catch (error) {
        failed++;
        const message = error && error.stack ? error.stack : String(error);
        failures.push({ name: 'runner', message });
        console.error(message);
    } finally {
        if (browser) await browser.close().catch(() => {});
        if (server && server.exitCode === null) {
            server.kill();
            await new Promise(resolve => {
                const timer = setTimeout(resolve, 1500);
                server.once('exit', () => { clearTimeout(timer); resolve(); });
            });
        }
    }

    console.log(`\nSoldier E2E: ${passed} passed / ${failed} failed`);
    if (failures.length) {
        for (const failure of failures) console.log(`  [${failure.name}] ${failure.message.split('\n')[0]}`);
    }
    process.exitCode = failed ? 1 : 0;
}

main();

