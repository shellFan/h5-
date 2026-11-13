// V4.2 real-browser responsive-layout and projection checks.
// This is a geometry/layout test. It does not claim artistic acceptance.

'use strict';

const {
    createHarness,
    watchPageErrors,
    waitForGameReady,
    VIEWPORTS,
    seededContext
} = require('../../tools/v42-browser');

const PORT = Number(process.env.V42_VISUAL_PORT || 8244);
const HEADLESS = process.env.E2E_HEADED !== '1';
const ONLY_VIEWPORTS = process.env.V42_VISUAL_VIEWPORTS || '';

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

function requestedViewports() {
    if (!ONLY_VIEWPORTS) return VIEWPORTS;
    const wanted = new Set(ONLY_VIEWPORTS.split(',').map(value => value.trim()));
    return VIEWPORTS.filter(viewport => wanted.has(`${viewport.width}x${viewport.height}`));
}

async function exerciseViewport(browser, baseUrl, viewport) {
    const context = await seededContext(browser, viewport, 1, 0x42c0ffee);
    const page = await context.newPage();
    const browserErrors = watchPageErrors(page);
    const tag = `${viewport.width}x${viewport.height}`;
    try {
        await page.goto(`${baseUrl}/index.html?v42-visual=1&quality=0`, {
            waitUntil: 'domcontentloaded', timeout: 20000
        });
        await waitForGameReady(page);

        await test(`${tag} long HUD labels and maximum count stay inside the viewport without overlap`, async () => {
            const result = await page.evaluate(() => {
                const game = window.__game;
                game.start();
                game.squad.setCount(500);
                if (game._updateUI) game._updateUI();
                const levelName = document.getElementById('level-name');
                const originalLevelName = levelName.textContent;
                levelName.textContent = '第 10 关 · 最终阶段 · 深渊巨城突围战';

                function rect(selector) {
                    const element = document.querySelector(selector);
                    if (!element) return { selector, missing: true };
                    const box = element.getBoundingClientRect();
                    const style = getComputedStyle(element);
                    return {
                        selector,
                        hidden: style.display === 'none' || style.visibility === 'hidden',
                        pointerEvents: style.pointerEvents,
                        left: box.left, top: box.top, right: box.right, bottom: box.bottom,
                        width: box.width, height: box.height
                    };
                }
                const selectors = [
                    '#top-bar', '#stats-panel', '#btn-pause', '#level-name',
                    '#squad-count-badge', '#stat-count', '#btn-refresh-gates'
                ];
                const boxes = selectors.map(rect);
                const pause = boxes.find(box => box.selector === '#btn-pause');
                const stats = boxes.find(box => box.selector === '#stats-panel');
                const level = boxes.find(box => box.selector === '#level-name');
                const refresh = boxes.find(box => box.selector === '#btn-refresh-gates');
                const count = boxes.find(box => box.selector === '#stat-count');
                const overlap = (a, b) => !a.hidden && !b.hidden &&
                    Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
                    Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
                const output = {
                    viewport: { width: innerWidth, height: innerHeight },
                    boxes,
                    countText: count && document.querySelector('#stat-count').textContent,
                    levelPauseOverlap: overlap(level, pause),
                    statsPauseOverlap: overlap(stats, pause),
                    refreshPauseOverlap: overlap(refresh, pause),
                    longLabelScrolls: levelName.scrollWidth > levelName.clientWidth + 1,
                    longLabelOverflow: getComputedStyle(levelName).overflow,
                    originalLevelName
                };
                levelName.textContent = originalLevelName;
                return output;
            });
            assert(result.countText === '500', `${tag} maximum count was not rendered: ${JSON.stringify(result)}`);
            for (const box of result.boxes.filter(box => !box.hidden && !box.missing)) {
                assert(box.left >= 0 && box.top >= 0 && box.right <= viewport.width && box.bottom <= viewport.height,
                    `${tag} ${box.selector} leaves viewport: ${JSON.stringify(box)}`);
                assert(box.width > 0 && box.height > 0, `${tag} ${box.selector} collapsed`);
            }
            assert(!result.levelPauseOverlap && !result.statsPauseOverlap && !result.refreshPauseOverlap,
                `${tag} HUD controls overlap: ${JSON.stringify(result)}`);
            assert(!result.longLabelScrolls || ['hidden', 'clip'].includes(result.longLabelOverflow),
                `${tag} long label spills out instead of clipping: ${JSON.stringify(result)}`);
        });

        await test(`${tag} pause, menu, and ad controls retain usable layout`, async () => {
            await page.locator('#btn-pause').evaluate(element => element.click());
            await page.waitForFunction(() => window.__game.paused === true);
            const pauseLayout = await page.evaluate(() => {
                function box(id) {
                    const element = document.getElementById(id);
                    if (!element) return null;
                    const rect = element.getBoundingClientRect();
                    return {
                        id, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
                        width: rect.width, height: rect.height,
                        display: getComputedStyle(element).display,
                        pointerEvents: getComputedStyle(element).pointerEvents
                    };
                }
                return ['pause-screen', 'btn-resume', 'btn-pause-menu', 'btn-sound-toggle',
                    'btn-refresh-gates', 'btn-revive', 'btn-double-reward'].map(box);
            });
            for (const box of pauseLayout.filter(Boolean)) {
                if (box.display === 'none') continue;
                assert(box.left >= -1 && box.top >= -1 && box.right <= viewport.width + 1 && box.bottom <= viewport.height + 1,
                    `${tag} ${box.id} leaves viewport: ${JSON.stringify(box)}`);
                assert(box.width > 0 && box.height > 0 && box.pointerEvents !== 'none',
                    `${tag} ${box.id} is not interactable: ${JSON.stringify(box)}`);
            }
            await page.locator('#btn-resume').evaluate(element => element.click());
            await page.waitForFunction(() => window.__game.paused === false);
            await page.locator('#btn-pause').evaluate(element => element.click());
            await page.locator('#btn-pause-menu').evaluate(element => element.click());
            await page.waitForFunction(() => window.__game.state === 'idle');
            const menuVisible = await page.locator('#start-screen').evaluate(element => !element.classList.contains('hidden'));
            assert(menuVisible, `${tag} pause menu did not return to the start screen`);
            await page.locator('#btn-start').evaluate(element => element.click());
        });

        await test(`${tag} three real gates have finite, non-cropped projected bounds`, async () => {
            const projected = await page.evaluate(() => {
                const game = window.__game;
                if (game.gates && game.gates.clear) game.gates.clear();
                if (game.enemies && game.enemies.clear) game.enemies.clear();
                if (game.pacing && game.pacing.clear) game.pacing.clear();
                game.squad.setCount(31);
                game.squad.x = 0;
                game.squad.targetX = 0;
                const z = game.squad.z - 9;
                game.gates.loadFromLevel({
                    segments: [{
                        type: 'gates', z,
                        gates: [
                            { lane: 0, op: 'add', value: 25, label: '+25', rarity: 'common' },
                            { lane: 1, op: 'mul', value: 3, label: '×3', rarity: 'epic' },
                            { lane: 2, op: 'buff', value: 'crit', label: '暴击+10%', rarity: 'legendary' }
                        ]
                    }]
                });
                game.world.updateCamera(0, game.squad.z, 1, 31);
                game.world.camera.updateMatrixWorld(true);
                game.world.render();
                const camera = game.world.camera;
                return game.gates.gates.map((gate, index) => {
                    const bounds = new THREE.Box3().setFromObject(gate.model);
                    const min = bounds.min;
                    const max = bounds.max;
                    const points = [];
                    for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z0 of [min.z, max.z]) {
                        const point = new THREE.Vector3(x, y, z0).project(camera);
                        points.push({
                            x: (point.x * .5 + .5) * innerWidth,
                            y: (-point.y * .5 + .5) * innerHeight,
                            z: point.z
                        });
                    }
                    return {
                        index,
                        points,
                        minX: Math.min(...points.map(point => point.x)),
                        maxX: Math.max(...points.map(point => point.x)),
                        minY: Math.min(...points.map(point => point.y)),
                        maxY: Math.max(...points.map(point => point.y))
                    };
                });
            });
            assert(projected.length === 3, `${tag} expected three gates, got ${projected.length}`);
            for (const gate of projected) {
                assert(gate.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z)),
                    `${tag} gate ${gate.index} has non-finite projected points`);
                assert(gate.maxX - gate.minX >= 12 && gate.maxY - gate.minY >= 24,
                    `${tag} gate ${gate.index} projection collapsed: ${JSON.stringify(gate)}`);
                assert(gate.minX >= -2 && gate.maxX <= viewport.width + 2 && gate.minY >= -2 && gate.maxY <= viewport.height + 2,
                    `${tag} gate ${gate.index} is cropped: ${JSON.stringify(gate)}`);
            }
        });

        await test(`${tag} page remains free of browser errors`, async () => {
            const visibleError = await page.evaluate(() => {
                const element = document.getElementById('error-display');
                return element ? element.textContent.trim() : '';
            });
            assert(!visibleError, `${tag} visible runtime error: ${visibleError}`);
            assert(browserErrors.length === 0, `${tag} browser errors: ${browserErrors.join(' | ')}`);
        });
    } finally {
        await context.close();
    }
}

async function main() {
    const harness = createHarness({ port: PORT, headless: HEADLESS });
    try {
        await harness.start();
        for (const viewport of requestedViewports()) {
            console.log(`\n[V4.2 visual ${viewport.width}x${viewport.height}]`);
            await exerciseViewport(harness.browser, harness.baseUrl, viewport);
        }
    } catch (error) {
        failed++;
        failures.push({ name: 'runner', message: error && error.stack ? error.stack : String(error) });
        console.error(error && error.stack ? error.stack : error);
    } finally {
        await harness.close();
    }
    console.log(`\nV4.2 visual: ${passed} passed / ${failed} failed`);
    for (const failure of failures) console.log(`  [${failure.name}] ${failure.message.split('\n')[0]}`);
    process.exitCode = failed ? 1 : 0;
}

if (require.main === module) main();

module.exports = { requestedViewports };
