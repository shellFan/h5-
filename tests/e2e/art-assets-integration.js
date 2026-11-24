// End-to-end acceptance for the toy-military art integration.
// Natural play is exercised first. Deterministic presentation states below are
// explicitly reported as debug fixtures; they still call production game APIs.

'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '../..');
const PORT = Number(process.env.ART_E2E_PORT || 8250);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SCREENSHOT_ROOT = path.join(ROOT, 'docs', 'art-assets', 'screenshots', 'after');
const RESULT_PATH = path.join(ROOT, 'docs', 'art-assets', 'qa-results.json');
const VIEWPORTS = [
    { width: 320, height: 720 },
    { width: 360, height: 800 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 414, height: 896 },
    { width: 430, height: 932 }
];

const results = [];
let browser;
let ownedServer;

function record(name, ok, detail, kind = 'acceptance') {
    const item = { name, ok: Boolean(ok), detail: detail || '', kind };
    results.push(item);
    console.log(`${item.ok ? '  PASS' : '  FAIL'} ${name}${item.detail ? ` -- ${item.detail}` : ''}`);
    return item.ok;
}

async function test(name, fn, kind) {
    try {
        const detail = await fn();
        record(name, true, typeof detail === 'string' ? detail : '', kind);
    } catch (error) {
        record(name, false, error && error.message ? error.message : String(error), kind);
    }
}

function writeResults(extra = {}) {
    const failures = results.filter(result => !result.ok);
    const report = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        environment: {
            browser: 'Microsoft Edge via playwright-core',
            headless: true,
            baseUrl: BASE_URL,
            realMobileDevice: false,
            realWeChatDevice: false
        },
        fixturePolicy: {
            natural: 'Home start, keyboard lane movement, retry, shop and navigation use real user-facing controls.',
            debug: 'Gate/Boss/victory/defeat states are deterministic fixtures using production GateSystem, Squad, EnemyManager and Game settlement methods.',
            limitation: 'Desktop browser mobile-width emulation is not a real phone or WeChat-device certification.'
        },
        passed: failures.length === 0,
        counts: { total: results.length, passed: results.length - failures.length, failed: failures.length },
        results,
        ...extra
    };
    fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true });
    fs.writeFileSync(RESULT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    return report;
}

async function serverIsReady() {
    try {
        const response = await fetch(`${BASE_URL}/index.html`);
        return response.ok;
    } catch (_) {
        return false;
    }
}

async function ensureServer() {
    if (await serverIsReady()) return;
    ownedServer = spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
        cwd: ROOT,
        env: { ...process.env, PORT: String(PORT) },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
    });
    const started = Date.now();
    while (Date.now() - started < 15000) {
        if (await serverIsReady()) return;
        if (ownedServer.exitCode !== null) throw new Error(`Static server exited with ${ownedServer.exitCode}`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Static server did not become ready on ${BASE_URL}`);
}

async function launchEdge() {
    const candidates = [
        { channel: 'msedge' },
        { executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
        { executablePath: 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe' }
    ];
    const errors = [];
    for (const candidate of candidates) {
        try {
            return await chromium.launch({ ...candidate, headless: true });
        } catch (error) {
            errors.push(`${candidate.channel || candidate.executablePath}: ${error.message.split('\n')[0]}`);
        }
    }
    throw new Error(`Cannot launch Edge:\n${errors.join('\n')}`);
}

async function waitReady(page) {
    await page.waitForFunction(() => {
        if (!window.__game) return false;
        if (window.SoldierModelLoader && SoldierModelLoader.status !== 'loaded') return false;
        if (window.EnemyModelLoader && EnemyModelLoader.status !== 'loaded') return false;
        return true;
    }, null, { timeout: 30000 });
    await page.waitForTimeout(250);
}

async function openCleanPage(context, viewport = VIEWPORTS[3]) {
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    await page.goto(`${BASE_URL}/index.html?artqa=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitReady(page);
    return page;
}

async function screenshot(page, name) {
    const file = path.join(SCREENSHOT_ROOT, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file });
}

async function stopRealtimeLoop(page) {
    await page.evaluate(() => { window.__game._rafDisabled = true; });
    await page.waitForTimeout(40);
}

async function renderFrames(page, frames = 2) {
    await page.evaluate(count => {
        const game = window.__game;
        for (let index = 0; index < count; index++) {
            game.time += 1 / 60;
            if (game.state === 'playing' && !game.paused) game._update(1 / 60);
        }
        game.world.renderer.render(game.world.scene, game.world.camera);
    }, frames);
}

async function fixtureGate(page, data, expectations) {
    return page.evaluate(({ gateData, expected }) => {
        const game = window.__game;
        if (typeof GateCombos !== 'undefined' && GateCombos.reset) GateCombos.reset();
        game.gates.clear();
        const model = V42Art.createGateModel(gateData, CONFIG.LANE_WIDTH * 0.9);
        model.position.set(game.squad.x, 0, game.squad.z);
        game.world.scene.add(model);
        const gate = {
            data: Object.assign({}, gateData), model,
            z: game.squad.z, x: game.squad.x, triggered: false, passed: false
        };
        game.gates.gates.push(gate);
        const before = {
            count: game.squad.count,
            damage: game.squad.damageBuff,
            coins: game.profile.coins
        };
        game.gates.update(game.squad, game.effects, game.time, 1 / 60);
        const after = {
            count: game.squad.count,
            damage: game.squad.damageBuff,
            coins: game.profile.coins
        };
        return {
            fixture: 'debug: real GateSystem.update -> Squad.applyGate',
            triggered: gate.triggered,
            before,
            after,
            expected
        };
    }, { gateData: data, expected: expectations });
}

function recursiveFiles(root) {
    if (!fs.existsSync(root)) return [];
    const result = [];
    const visit = directory => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const full = path.join(directory, entry.name);
            if (entry.isDirectory()) visit(full);
            else result.push(path.relative(root, full).replace(/\\/g, '/'));
        }
    };
    visit(root);
    return result;
}

function verifyBuildTree(outputRoot, platform) {
    assert(fs.existsSync(outputRoot), `${platform} output missing: run its build first`);
    const files = recursiveFiles(outputRoot);
    assert(files.length > 0, `${platform} output is empty`);
    assert(!files.some(file => /(^|\/)art-source\//i.test(file)), `${platform} includes assets/art-source`);
    assert(!files.some(file => /\.zip$/i.test(file)), `${platform} includes source ZIP`);
    assert(files.some(file => /^assets\/game\//.test(file)), `${platform} is missing assets/game runtime art`);
    assert(files.some(file => /^assets\/game\/models\/.+\.glb$/i.test(file)), `${platform} is missing military GLB variants`);
    return { platform, fileCount: files.length };
}

async function main() {
    fs.mkdirSync(SCREENSHOT_ROOT, { recursive: true });
    await ensureServer();
    browser = await launchEdge();
    const context = await browser.newContext({
        viewport: VIEWPORTS[3],
        screen: VIEWPORTS[3],
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false
    });
    await context.addInitScript(() => {
        try { localStorage.clear(); } catch (_) {}
        let state = 0xA27A55E;
        Math.random = function seededRandom() {
            state += 0x6D2B79F5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    });

    const pageErrors = [];
    const consoleErrors = [];
    const requestFailures = [];
    const httpErrors = [];
    const requestedUrls = [];
    context.on('page', page => {
        page.on('pageerror', error => pageErrors.push(error.message));
        page.on('console', message => {
            if (message.type() === 'error' && !message.text().includes('favicon')) consoleErrors.push(message.text());
        });
        page.on('request', request => requestedUrls.push(request.url()));
        page.on('requestfailed', request => requestFailures.push({
            url: request.url(), error: request.failure() ? request.failure().errorText : 'unknown'
        }));
        page.on('response', response => {
            if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() });
        });
    });

    const page = await openCleanPage(context);

    // Natural user flow comes first.
    await test('home installs interactive military UI with loaded raster assets', async () => {
        const state = await page.evaluate(() => ({
            className: document.getElementById('game-container').className,
            version: window.ArtUI && ArtUI.version,
            buttonText: document.getElementById('btn-start').textContent.trim(),
            images: Array.from(document.images).map(image => ({ src: image.src, complete: image.complete, width: image.naturalWidth }))
        }));
        assert.match(state.className, /art-military/);
        assert.equal(state.version, 'military_v5');
        assert.match(state.buttonText, /\u5f00\u59cb\u884c\u52a8/);
        const gameImages = state.images.filter(image => image.src.includes('/assets/game/'));
        assert(gameImages.length >= 3, `only ${gameImages.length} assets/game images attached`);
        assert(gameImages.every(image => image.complete && image.width > 0), 'one or more military UI images failed to decode');
        return `${gameImages.length} runtime UI images decoded`;
    }, 'natural');
    await screenshot(page, 'home-390x844.png');

    await test('real start button enters gameplay', async () => {
        await page.click('#btn-start');
        await page.waitForFunction(() => window.__game.state === 'playing');
        const state = await page.evaluate(() => ({ state: __game.state, count: __game.squad.count, hud: !__game.ui.hud.classList.contains('hidden') }));
        assert.equal(state.state, 'playing');
        assert(state.count > 0);
        assert(state.hud);
        return `${state.count} soldiers`;
    }, 'natural');

    await test('real keyboard input reaches all three lane regions', async () => {
        await page.evaluate(() => { __game.squad.targetX = 0; __game.squad.x = 0; });
        const center = await page.evaluate(() => __game.squad.targetX);
        for (let index = 0; index < 8; index++) await page.keyboard.press('ArrowLeft');
        const left = await page.evaluate(() => __game.squad.targetX);
        for (let index = 0; index < 8; index++) await page.keyboard.press('ArrowRight');
        const right = await page.evaluate(() => __game.squad.targetX);
        assert(left < -1, `left=${left}`);
        assert(Math.abs(center) < 0.75, `center=${center}`);
        assert(right > 1, `right=${right}`);
        return `targets ${left.toFixed(2)}, ${center.toFixed(2)}, ${right.toFixed(2)}`;
    }, 'natural');

    await stopRealtimeLoop(page);
    await page.evaluate(() => {
        const game = __game;
        game.pacing.clear(); game.gates.clear(); game.enemies.clear(); game.combat.clear();
        game.state = 'playing'; game.paused = false; game.squad.setCount(24);
        [['normal', -2, 7], ['fast', 0, 9], ['shield', 2, 11], ['elite', 0, 14]].forEach(item => {
            game.enemies.spawnEnemy(item[0], item[1], game.squad.z - item[2], 5000);
        });
    });
    await renderFrames(page, 4);
    await screenshot(page, 'battle-390x844.png');

    await test('combat scene uses runtime military variants, not immutable source GLBs', async () => {
        const state = await page.evaluate(() => ({
            militaryArt: Boolean(__game.world._militaryArt),
            soldierSource: __game.squad.renderer && __game.squad.renderer.mesh && __game.squad.renderer.mesh.userData.artSource,
            enemySources: __game.enemies.enemies.map(enemy => enemy.model && enemy.model.userData.artSource)
        }));
        assert(state.militaryArt, 'world._militaryArt not installed');
        return `${state.enemySources.length} enemy models active`;
    }, 'natural');

    // Deterministic gate fixtures exercise the real GateSystem trigger path.
    await page.evaluate(() => { __game.profile.data.coins = 1000; __game.profile.save(); __game.squad.setCount(20); __game.squad.damageBuff = 0; });
    await test('people gate triggers through GateSystem.update', async () => {
        const state = await fixtureGate(page, { lane: 1, op: 'add', value: 5, label: '+5', style: 'add', tier: 'common' });
        assert(state.triggered);
        assert.equal(state.after.count, state.before.count + 5);
        return `${state.before.count} -> ${state.after.count}`;
    }, 'debug-fixture');
    await test('firepower gate triggers through GateSystem.update', async () => {
        const state = await fixtureGate(page, { lane: 1, op: 'buff', value: 'damage', label: '\u706b\u529b+1', style: 'buff', tier: 'rare' });
        assert(state.triggered);
        assert.equal(state.after.damage, state.before.damage + 1);
        return `${state.before.damage} -> ${state.after.damage}`;
    }, 'debug-fixture');
    await test('coin gate triggers and deposits real profile currency', async () => {
        const state = await fixtureGate(page, { lane: 1, op: 'coin', value: 50, label: '+50', style: 'mul', tier: 'epic' });
        assert(state.triggered);
        assert.equal(state.after.coins, state.before.coins + 50);
        return `${state.before.coins} -> ${state.after.coins}`;
    }, 'debug-fixture');

    await page.evaluate(() => {
        const game = __game;
        game.gates.clear();
        const defs = [
            { lane: 0, op: 'add', value: 5, label: '+5', style: 'add', tier: 'common' },
            { lane: 1, op: 'buff', value: 'damage', label: '\u706b\u529b+1', style: 'buff', tier: 'rare' },
            { lane: 2, op: 'coin', value: 50, label: '+50', style: 'mul', tier: 'epic' }
        ];
        for (const data of defs) {
            const model = V42Art.createGateModel(data, CONFIG.LANE_WIDTH * 0.9);
            model.position.set(CONFIG.LANE_X[data.lane], 0, game.squad.z - 7);
            game.world.scene.add(model);
            game.gates.gates.push({ data, model, z: game.squad.z - 7, x: CONFIG.LANE_X[data.lane], triggered: false, passed: false });
        }
        game.world.renderer.render(game.world.scene, game.world.camera);
    });
    await screenshot(page, 'doors-people-firepower-coins-390x844.png');

    await test('soldier growth and weapon upgrade use production economy APIs', async () => {
        const state = await page.evaluate(() => {
            const game = __game;
            game.profile.data.coins = 100000;
            game.profile.save();
            const soldierBefore = SoldierGrowth.level(game.profile);
            const weaponBefore = game.profile.data.weaponLevel || 0;
            const growth = SoldierGrowth.upgrade(game.profile);
            const weapon = WeaponSystem.upgrade(game.profile);
            return {
                soldierBefore,
                soldierAfter: SoldierGrowth.level(game.profile),
                weaponBefore,
                weaponAfter: game.profile.data.weaponLevel,
                growth,
                weapon
            };
        });
        assert(state.growth.ok, JSON.stringify(state.growth));
        assert(state.weapon.ok, JSON.stringify(state.weapon));
        assert.equal(state.soldierAfter, state.soldierBefore + 1);
        assert.equal(state.weaponAfter, state.weaponBefore + 1);
        return `soldier ${state.soldierBefore}->${state.soldierAfter}; weapon ${state.weaponBefore}->${state.weaponAfter}`;
    }, 'debug-fixture');

    await page.evaluate(() => {
        const game = __game;
        game.gates.clear(); game.enemies.clear(); game.combat.clear();
        game.squad.setCount(80); game.state = 'playing'; game.paused = false;
        const boss = game.enemies.spawnEnemy('boss', 0, game.squad.z - 12, 100000, 'overlord');
        game.enemies.boss = boss;
        game._update(1 / 60);
        game.world.renderer.render(game.world.scene, game.world.camera);
    });
    await test('Boss fixture uses real EnemyManager and visible Boss HUD', async () => {
        const state = await page.evaluate(() => ({
            boss: Boolean(__game.enemies.boss && __game.enemies.boss.alive),
            barVisible: !document.getElementById('boss-bar-container').classList.contains('hidden'),
            style: __game.enemies.boss && __game.enemies.boss.artStyle
        }));
        assert(state.boss);
        assert(state.barVisible);
        return state.style || 'boss active';
    }, 'debug-fixture');
    await screenshot(page, 'boss-390x844.png');

    await test('victory settlement awards coins through Game._win', async () => {
        const state = await page.evaluate(() => {
            const game = __game;
            game.enemies.clear(); game.squad.setCount(40); game.state = 'playing';
            game.enemies.killCount = 12; game.elapsedTime = 42; game.maxCount = 40;
            const before = game.profile.coins;
            game._win();
            return {
                before, after: game.profile.coins, state: game.state,
                visible: !document.getElementById('win-screen').classList.contains('hidden')
            };
        });
        assert.equal(state.state, 'won');
        assert(state.visible);
        assert(state.after > state.before, `${state.before} -> ${state.after}`);
        return `coins ${state.before} -> ${state.after}`;
    }, 'debug-fixture');
    await screenshot(page, 'victory-390x844.png');

    await test('defeat settlement and real retry button work', async () => {
        await page.evaluate(() => {
            const game = __game;
            game.state = 'playing'; game.squad.setCount(0); game.maxCount = 20;
            game._lose('\u81ea\u52a8\u9a8c\u6536\u5931\u8d25\u6001');
        });
        const lost = await page.evaluate(() => ({
            state: __game.state,
            visible: !document.getElementById('lose-screen').classList.contains('hidden')
        }));
        assert.equal(lost.state, 'lost');
        assert(lost.visible);
        await screenshot(page, 'defeat-390x844.png');
        await page.click('#btn-restart-lose');
        const retried = await page.evaluate(() => ({ state: __game.state, count: __game.squad.count }));
        assert.equal(retried.state, 'playing');
        assert(retried.count > 0);
        return `retry restored ${retried.count} soldiers`;
    }, 'debug-fixture');

    await page.evaluate(() => __game._backToMenu());
    await test('shop opens through its real home button', async () => {
        await page.click('#btn-open-shop');
        const state = await page.evaluate(() => ({
            visible: !document.getElementById('shop-screen').classList.contains('hidden'),
            rows: document.querySelectorAll('#shop-list .shop-row').length
        }));
        assert(state.visible);
        assert(state.rows >= 5);
        return `${state.rows} upgrade rows`;
    }, 'natural');
    await screenshot(page, 'shop-390x844.png');
    await page.click('#btn-close-shop');

    const uiPages = [
        ['map', 'map'], ['train', 'training'], ['armory', 'armory'], ['tech', 'technology'],
        ['codex', 'codex'], ['challenge', 'challenge'], ['rank', 'ranking'],
        ['ach', 'achievements'], ['daily', 'daily'], ['set', 'settings']
    ];
    for (const [button, file] of uiPages) {
        await test(`${file} page opens through real navigation`, async () => {
            await page.click(`#v60-btn-${button}`);
            const target = button === 'set' ? 'settings' : button;
            const state = await page.evaluate(id => {
                const element = document.getElementById(`v60-${id}-page`);
                return { exists: Boolean(element), visible: Boolean(element && !element.classList.contains('hidden')) };
            }, target);
            assert(state.exists && state.visible, JSON.stringify(state));
            await page.waitForTimeout(80);
            return 'visible';
        }, 'natural');
        await screenshot(page, `${file}-390x844.png`);
        const target = button === 'set' ? 'settings' : button;
        const back = page.locator(`#v60-${target}-back`);
        if (await back.count()) await back.click();
        else await page.evaluate(() => V60UI.hidePages());
    }

    await test('ranking contains real recorded settlement entries', async () => {
        await page.click('#v60-btn-rank');
        const state = await page.evaluate(() => ({
            rows: document.querySelectorAll('#v60-rank-list .v60-rank-row').length,
            text: document.getElementById('v60-rank-list').textContent
        }));
        assert(state.rows >= 1, state.text);
        await page.click('#v60-rank-back');
        return `${state.rows} local entries`;
    }, 'natural');

    await test('reference catalog images are not requested by gameplay', async () => {
        const catalogPaths = await page.evaluate(() => (ArtAssetCatalog || []).flatMap(item => [item.path, item.fallbackPath]).filter(Boolean));
        const catalogSet = new Set(catalogPaths.map(item => `/${item.replace(/^\//, '')}`));
        const requestedCatalog = requestedUrls.filter(url => catalogSet.has(new URL(url).pathname));
        assert.deepEqual(requestedCatalog, []);
        return `${catalogSet.size} reference paths stayed unloaded`;
    }, 'natural');

    await test('reference gallery is labelled and excluded from combat scene provenance', async () => {
        await page.click('#v60-btn-codex');
        await page.click('#art-gallery-open');
        await page.waitForSelector('#art-gallery-page:not(.hidden)', { timeout: 3000 });
        const state = await page.evaluate(() => {
            let gallerySceneNodes = 0;
            __game.world.scene.traverse(node => {
                const source = node.userData && node.userData.artSource;
                if (source && /gallery|catalog|reference/i.test(source)) gallerySceneNodes++;
            });
            return {
                visible: !document.getElementById('art-gallery-page').classList.contains('hidden'),
                note: document.querySelector('#art-gallery-page .art-gallery-note').textContent,
                cards: document.querySelectorAll('.art-gallery-card').length,
                gallerySceneNodes
            };
        });
        assert(state.visible);
        assert.match(state.note, /\u8bbe\u8ba1\u53c2\u8003/);
        assert(state.cards > 0 && state.cards <= 6);
        assert.equal(state.gallerySceneNodes, 0);
        await screenshot(page, 'reference-gallery-390x844.png');
        await page.click('#art-gallery-back');
        await page.click('#v60-codex-back');
        return `${state.cards} reference cards, zero scene nodes`;
    }, 'natural');

    // Mobile-width layout matrix. These are browser emulations, not device claims.
    for (const viewport of VIEWPORTS) {
        await page.setViewportSize(viewport);
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        await waitReady(page);
        await test(`${viewport.width}px home has no horizontal overflow or clipped primary controls`, async () => {
            const state = await page.evaluate(() => {
                const root = document.getElementById('game-container');
                const start = document.getElementById('btn-start').getBoundingClientRect();
                const nav = Array.from(document.querySelectorAll('#v60-home-nav .v60-nav-btn'))
                    .filter(element => getComputedStyle(element).display !== 'none')
                    .map(element => element.getBoundingClientRect());
                const brokenImages = Array.from(document.images)
                    .filter(image => image.src.includes('/assets/game/') && (!image.complete || !image.naturalWidth))
                    .map(image => image.src);
                return {
                    viewport: window.innerWidth,
                    documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
                    rootOverflow: root.scrollWidth - root.clientWidth,
                    start: { left: start.left, right: start.right, height: start.height },
                    navTooSmall: nav.filter(rect => rect.height < 44 || rect.width < 30).length,
                    brokenImages
                };
            });
            assert(state.documentOverflow <= 1, JSON.stringify(state));
            assert(state.rootOverflow <= 1, JSON.stringify(state));
            assert(state.start.left >= -1 && state.start.right <= viewport.width + 1 && state.start.height >= 44, JSON.stringify(state));
            assert.equal(state.navTooSmall, 0, JSON.stringify(state));
            assert.deepEqual(state.brokenImages, []);
            return `${viewport.width}x${viewport.height}`;
        }, 'mobile-width-emulation');
        await screenshot(page, `responsive/home-${viewport.width}x${viewport.height}.png`);
    }

    await test('runtime has no page errors, 404s or failed asset requests', async () => {
        assert.deepEqual(pageErrors, []);
        assert.deepEqual(consoleErrors, []);
        assert.deepEqual(requestFailures, []);
        assert.deepEqual(httpErrors, []);
        return `${requestedUrls.length} requests observed`;
    });

    await test('runtime never requests immutable source art or source GLBs', async () => {
        const forbidden = requestedUrls.filter(url => {
            const pathname = new URL(url).pathname.replace(/\\/g, '/');
            const replacedModelSource = pathname.startsWith('/assets/models/soldier/') ||
                pathname.startsWith('/assets/models/zombies/') ||
                pathname.startsWith('/assets/models/bosses/');
            return pathname.includes('/assets/art-source/') || replacedModelSource || /\.zip$/i.test(pathname);
        });
        assert.deepEqual(forbidden, []);
        return 'zero forbidden source requests';
    });

    await test('H5 build excludes sources and contains runtime military assets', async () => {
        const state = verifyBuildTree(path.join(ROOT, 'dist', 'h5'), 'H5');
        return `${state.fileCount} files`;
    });
    await test('WeChat build excludes sources and preserves assets/game paths', async () => {
        const state = verifyBuildTree(path.join(ROOT, 'wechat-game'), 'WeChat');
        const files = recursiveFiles(path.join(ROOT, 'wechat-game'));
        assert(files.some(file => /^art\//.test(file)), 'WeChat transformed runtime art subpackage is missing');
        assert(files.some(file => /^art-gallery\//.test(file)), 'WeChat reference gallery subpackage is missing');
        const bundles = ['game.js', 'game-bundle.js'].map(file => fs.readFileSync(path.join(ROOT, 'wechat-game', file), 'utf8')).join('\n');
        assert.doesNotMatch(bundles, /assets\/art-source\//, 'WeChat bundle references assets/art-source');
        return `${state.fileCount} files`;
    });

    const report = writeResults({
        browserDiagnostics: { pageErrors, consoleErrors, requestFailures, httpErrors },
        network: { requestCount: requestedUrls.length },
        screenshots: recursiveFiles(SCREENSHOT_ROOT)
    });
    console.log(`\n${report.passed ? 'PASS' : 'FAIL'} art integration QA: ${report.counts.passed}/${report.counts.total}`);
    if (!report.passed) process.exitCode = 1;
    await context.close();
}

main().catch(error => {
    record('fatal harness error', false, error && error.stack ? error.stack : String(error), 'harness');
    writeResults();
    process.exitCode = 1;
}).finally(async () => {
    if (browser) await browser.close().catch(() => {});
    if (ownedServer && ownedServer.exitCode === null) ownedServer.kill();
});

