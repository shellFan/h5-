// V4.2 screenshots from the actual Game/Three.js renderer.
// The script records evidence only; existence is not artistic acceptance.

'use strict';

const fs = require('fs');
const path = require('path');
const {
    ROOT,
    VIEWPORTS,
    createHarness,
    seededContext,
    waitForGameReady,
    watchPageErrors
} = require('./v42-browser');

const OUT = path.join(ROOT, 'docs', 'screenshots', 'v42');
const PORT = Number(process.env.V42_CAPTURE_PORT || 8245);
const SEED = 0x42ca970e;
const SQUAD_COUNTS = [1, 12, 31, 100, 300, 500];
const ENEMY_TYPES = ['normal', 'fast', 'shield', 'split', 'spitter', 'elite'];
const BOSS_STYLES = ['bruiser', 'bulwark', 'spitking', 'hivelord', 'titan', 'overlord'];

function selectedViewports() {
    const value = process.env.V42_CAPTURE_VIEWPORTS;
    if (!value) return VIEWPORTS.slice();
    const requested = new Set(value.split(',').map(item => item.trim()));
    const selected = VIEWPORTS.filter(viewport => requested.has(`${viewport.width}x${viewport.height}`));
    return selected.length ? selected : VIEWPORTS.slice();
}

async function openPage(browser, baseUrl, viewport) {
    const context = await seededContext(browser, viewport, 1, SEED);
    const page = await context.newPage();
    const errors = watchPageErrors(page);
    await page.goto(`${baseUrl}/index.html?v42capture=1&quality=2`, {
        waitUntil: 'domcontentloaded', timeout: 30000
    });
    await waitForGameReady(page, 30000);
    return { context, page, errors };
}

async function startClean(page, count = 31) {
    await page.evaluate(value => {
        const game = window.__game;
        game.start();
        if (game.pacing && game.pacing.clear) game.pacing.clear();
        if (game.gates && game.gates.clear) game.gates.clear();
        if (game.enemies && game.enemies.clear) game.enemies.clear();
        if (game.combat && game.combat.clear) game.combat.clear();
        game.squad.reset(value);
        game.squad.x = 0;
        game.squad.targetX = 0;
        game.squad.z = 0;
        game.state = 'playing';
        game.paused = true;
        for (let frame = 0; frame < 120; frame++) game.squad.update(1 / 60, frame / 60, 0);
        game.squad.renderer.update(0,3,game.squad,true,.1,0);
        game.world.updateCamera(0, 0, 1, value);
        if (game._updateUI) game._updateUI();
        game.world.render();
    }, count);
}

async function screenshot(page, filename, expected) {
    const output = path.join(OUT, filename);
    await page.screenshot({ path: output });
    expected.push(output);
    console.log(`captured ${filename}`);
}

async function captureViewport(browser, baseUrl, viewport, expected) {
    const { context, page, errors } = await openPage(browser, baseUrl, viewport);
    const width = viewport.width;
    try {
        await page.waitForTimeout(300);
        await screenshot(page, `${width}-start.png`, expected);

        for (const count of SQUAD_COUNTS) {
            await startClean(page, count);
            await screenshot(page, `${width}-squad-${count}.png`, expected);
        }

        await startClean(page, 31);
        await page.evaluate(types => {
            const game = window.__game;
            types.forEach((type, index) => {
                const x = (index % 3 - 1) * 2;
                const z = -8 - Math.floor(index / 3) * 3.1;
                game.enemies.spawnEnemy(type, x, z, 600);
            });
            game.paused = false;
        }, ENEMY_TYPES);
        await page.waitForTimeout(450);
        await page.evaluate(() => {
            const game = window.__game;
            game.paused = true;
            if (game.enemies.renderer && game.enemies.renderer.update) {
                game.enemies.renderer.update(1 / 60, game.time, game.enemies.enemies, game.squad.z);
            }
            game.world.render();
        });
        await screenshot(page, `${width}-enemies.png`, expected);

        await startClean(page, 31);
        await page.evaluate(style => {
            const game = window.__game;
            const enemy = game.enemies.spawnEnemy('boss', 0, -11, 20000, style);
            enemy.bossStyle = enemy.bossStyle || style;
            enemy.style = enemy.style || style;
            game.paused = false;
        }, 'overlord');
        await page.waitForTimeout(550);
        await page.evaluate(() => {
            const game = window.__game;
            game.paused = true;
            if (game.enemies.renderer && game.enemies.renderer.update) {
                game.enemies.renderer.update(1 / 60, game.time, game.enemies.enemies, game.squad.z);
            }
            game.world.render();
        });
        await screenshot(page, `${width}-boss.png`, expected);

        await startClean(page, 31);
        await page.evaluate(() => {
            const game = window.__game;
            const rarities = [
                { rarity: 'common', op: 'add', value: 20, label: '+20' },
                { rarity: 'rare', op: 'buff', value: 'freeze', label: '冰冻弹' },
                { rarity: 'epic', op: 'mul', value: 3, label: '×3' },
                { rarity: 'legendary', op: 'buff', value: 'damage2', label: '输出×2' }
            ];
            const segments = rarities.map((rarity, row) => ({
                type: 'gates',
                z: -6.5 - row * 4.25,
                gates: [0, 1, 2].map(lane => ({ ...rarity, lane }))
            }));
            game.gates.loadFromLevel({ segments });
            game.world.camera.position.set(0, 10, 14);
            game.world.camera.lookAt(0, .8, -11);
            game.world.camera.updateProjectionMatrix();
            game.world.render();
        });
        await screenshot(page, `${width}-gates.png`, expected);

        await startClean(page, 31);
        await page.evaluate(() => {
            const game = window.__game;
            game.squad.z = -38;
            game.squad.update(1, 3, game.squad.z);
            game.world.updateRoadScroll(game.squad.z);
            game.world.updateCamera(0, game.squad.z, 1, 31);
            game.world.render();
        });
        await screenshot(page, `${width}-city.png`, expected);

        await startClean(page, 100);
        await page.evaluate(types => {
            const game = window.__game;
            game.squad.critChance = .25;
            game.squad.freezeStacks = 1;
            for (let index = 0; index < 40; index++) {
                const column = index % 8;
                const row = Math.floor(index / 8);
                game.enemies.spawnEnemy(types[index % types.length], (column - 3.5) * .68,
                    game.squad.z - 9 - row * 1.55, 180);
            }
            game.paused = false;
        }, ENEMY_TYPES);
        await page.waitForTimeout(850);
        await screenshot(page, `${width}-battle.png`, expected);

        await page.evaluate(() => {
            const game = window.__game;
            game.squad.setCount(233);
            game.enemies.killCount = Math.max(game.enemies.killCount, 128);
            game.maxCombo = 47;
            game._win();
        });
        await screenshot(page, `${width}-win.png`, expected);

        await page.evaluate(() => window.__game._lose('被怪潮吞噬 · 人数不足'));
        await screenshot(page, `${width}-lose.png`, expected);

        if (errors.length) throw new Error(`${viewport.width}x${viewport.height} browser errors: ${errors.join(' | ')}`);
    } finally {
        await context.close();
    }
}

async function captureSoldierInspections(browser, baseUrl, expected) {
    const { context, page, errors } = await openPage(browser, baseUrl, { width: 780, height: 1000 });
    try {
        await startClean(page, 1);
        await page.evaluate(() => {
            document.querySelectorAll('#hud,.start-screen,#art-debug-panel').forEach(node => { node.style.visibility = 'hidden'; });
            window.__game.world.scene.fog = null;
        });
        const poses = [
            ['soldier-front.png', [0, 1.23, -2.85], [0, .7, -.05]],
            ['soldier-back.png', [.75, 1.4, 2.7], [0, .7, -.05]],
            ['soldier-shoot.png', [1.7, 1.4, -2.5], [0, .7, -.05]]
        ];
        for (const [filename, position, lookAt] of poses) {
            await page.evaluate(({ filename: name, position: cameraPosition, lookAt: cameraTarget }) => {
                const game = window.__game;
                const soldier = game.squad.soldiers[0];
                soldier.rotY = 0;
                soldier.x = 0;
                soldier.z = 0;
                game.squad.setAnimationState(name.includes('shoot') ? 'Shoot' : 'Idle');
                if (name.includes('shoot')) {
                    const positions = game.squad.getShootPositions(1);
                    if (positions[0]) game.combat._fire(positions[0], 1, null, true);
                }
                game.squad.renderer.update(.025, 2.025, game.squad, false, .02, 0);
                game.world.camera.position.set(...cameraPosition);
                game.world.camera.lookAt(...cameraTarget);
                game.world.camera.updateProjectionMatrix();
                game.world.render();
            }, { filename, position, lookAt });
            await screenshot(page, filename, expected);
        }
        if (errors.length) throw new Error(`Soldier inspection browser errors: ${errors.join(' | ')}`);
    } finally {
        await context.close();
    }
}

async function captureBossInspections(browser, baseUrl, expected) {
    const { context, page, errors } = await openPage(browser, baseUrl, { width: 780, height: 1000 });
    try {
        await page.evaluate(() => {
            document.querySelectorAll('#hud,.start-screen,#art-debug-panel').forEach(node => { node.style.visibility = 'hidden'; });
            window.__game.world.scene.fog = null;
        });
        for (const style of BOSS_STYLES) {
            await startClean(page, 1);
            await page.evaluate(profile => {
                const game = window.__game;
                const boss = game.enemies.spawnEnemy('boss', 0, 0, 20000, profile);
                boss.bossStyle = boss.bossStyle || profile;
                boss.style = boss.style || profile;
                // Keep the inspection scene game-authentic but remove the one
                // soldier from this isolated boss turntable frame.
                if (game.squad.renderer && game.squad.renderer.banks) {
                    Object.values(game.squad.renderer.banks).forEach(bank => {
                        Object.values(bank.meshes).forEach(mesh => { mesh.visible = false; });
                    });
                }
                if (game.enemies.renderer && game.enemies.renderer.update) {
                    game.enemies.renderer.update(1 / 60, 1, game.enemies.enemies, game.squad.z);
                }
                game.world.camera.position.set(0, 3.5, 10);
                game.world.camera.lookAt(0, 2.3, 0);
                game.world.camera.updateProjectionMatrix();
                game.world.render();
            }, style);
            await screenshot(page, `boss-${style}.png`, expected);
        }
        if (errors.length) throw new Error(`Boss inspection browser errors: ${errors.join(' | ')}`);
    } finally {
        await context.close();
    }
}

async function main() {
    fs.mkdirSync(OUT, { recursive: true });
    const harness = createHarness({ port: PORT, headless: true });
    const expected = [];
    try {
        await harness.start();
        await captureSoldierInspections(harness.browser, harness.baseUrl, expected);
        await captureBossInspections(harness.browser, harness.baseUrl, expected);
        for (const viewport of selectedViewports()) {
            await captureViewport(harness.browser, harness.baseUrl, viewport, expected);
        }
        const missing = expected.filter(filename => !fs.existsSync(filename) || fs.statSync(filename).size === 0);
        if (missing.length) throw new Error(`Missing/empty screenshots: ${missing.join(', ')}`);
        console.log(`Recorded ${expected.length} actual-render screenshots in ${path.relative(ROOT, OUT)}`);
    } finally {
        await harness.close();
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error(error && error.stack ? error.stack : error);
        process.exitCode = 1;
    });
}

module.exports = { BOSS_STYLES, ENEMY_TYPES, SQUAD_COUNTS, selectedViewports };
