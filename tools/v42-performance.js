// V4.2 full-battle real-browser performance harness.
// Default matrix: 4 viewports x 3 quality/DPR tiers x 5 live combat loads.

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

const PORT = Number(process.env.V42_PERF_PORT || 8243);
const WARMUP_MS = positiveNumber(process.env.V42_PERF_WARMUP_MS, 2000);
const SAMPLE_MS = positiveNumber(process.env.V42_PERF_SAMPLE_MS, 3000);
const OUTPUT = path.resolve(ROOT, process.env.V42_PERF_OUTPUT || 'docs/v42-performance.json');
const MEMORY_CYCLES = nonNegativeInteger(process.env.V42_PERF_MEMORY_CYCLES, 10);
const REINFORCEMENT_MS = positiveNumber(process.env.V42_PERF_REINFORCEMENT_MS, 50);
const SEED = 0x42c0ffee;

const QUALITY_TIERS = Object.freeze([
    Object.freeze({ name: 'low', quality: 0, deviceScaleFactor: 1 }),
    Object.freeze({ name: 'mid', quality: 1, deviceScaleFactor: 1.5 }),
    Object.freeze({ name: 'high', quality: 2, deviceScaleFactor: 2 })
]);

const LOADS = Object.freeze([
    Object.freeze({ id: '31+20', soldiers: 31, adds: 20, boss: false }),
    Object.freeze({ id: '100+40', soldiers: 100, adds: 40, boss: false }),
    Object.freeze({ id: '300+60', soldiers: 300, adds: 60, boss: false }),
    Object.freeze({ id: '500+100', soldiers: 500, adds: 100, boss: false }),
    Object.freeze({ id: 'boss+40', soldiers: 100, adds: 40, boss: true, bossStyle: 'overlord', bossHp: 20000 })
]);

function positiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
}

function nonNegativeInteger(value, fallback) {
    if (value === undefined || value === '') return fallback;
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function round(value, digits = 2) {
    if (!Number.isFinite(value)) return null;
    const scale = 10 ** digits;
    return Math.round(value * scale) / scale;
}

function percentile(sorted, fraction) {
    if (!sorted.length) return 0;
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
}

function parseViewports(value) {
    if (!value) return VIEWPORTS.slice();
    const parsed = [];
    for (const token of value.split(',')) {
        const match = token.trim().match(/^(\d+)x(\d+)$/i);
        if (!match) continue;
        const width = Number(match[1]);
        const height = Number(match[2]);
        if (width > 0 && height > 0) parsed.push({ width, height });
    }
    return parsed.length ? parsed : VIEWPORTS.slice();
}

function parseQualities(value) {
    if (!value) return QUALITY_TIERS.slice();
    const wanted = new Set(value.split(',').map(token => token.trim().toLowerCase()));
    const tiers = QUALITY_TIERS.filter(tier => wanted.has(tier.name) || wanted.has(String(tier.quality)));
    return tiers.length ? tiers : QUALITY_TIERS.slice();
}

function parseLoads(value) {
    if (!value) return LOADS.slice();
    const wanted = new Set(value.split(',').map(token => token.trim().toLowerCase()));
    const loads = LOADS.filter(load => wanted.has(load.id.toLowerCase()) ||
        (load.boss && (wanted.has('boss') || wanted.has('boss+40+effects'))));
    return loads.length ? loads : LOADS.slice();
}

function summarizeNumbers(values) {
    const finite = values.filter(Number.isFinite);
    if (!finite.length) return { min: null, mean: null, max: null };
    return {
        min: Math.min(...finite),
        mean: round(finite.reduce((sum, value) => sum + value, 0) / finite.length, 2),
        max: Math.max(...finite)
    };
}

async function openGame(context, baseUrl, quality) {
    const page = await context.newPage();
    const errors = watchPageErrors(page);
    await page.goto(`${baseUrl}/index.html?v42perf=1&quality=${quality}`, {
        waitUntil: 'domcontentloaded', timeout: 30000
    });
    await waitForGameReady(page, 30000);
    const load = await page.evaluate(() => {
        const soldier = window.SoldierModelLoader ? Number(SoldierModelLoader.loadMs) || 0 : 0;
        const enemy = window.EnemyModelLoader ? Number(EnemyModelLoader.loadMs) || 0 : 0;
        return {
            soldierMs: soldier,
            enemyMs: enemy,
            totalMs: soldier + enemy,
            navigationToReadyMs: performance.now() - (window.__v42NavigationStart || 0),
            soldierStatus: window.SoldierModelLoader ? SoldierModelLoader.status : 'unavailable',
            enemyStatus: window.EnemyModelLoader ? EnemyModelLoader.status : 'unavailable'
        };
    });
    if (errors.length) throw new Error(`Browser errors during boot: ${errors.join(' | ')}`);
    return { page, errors, load };
}

async function setupFullBattle(page, load) {
    const state = await page.evaluate(spec => {
        const game = window.__game;
        if (window.__v42Stress && window.__v42Stress.timer) clearInterval(window.__v42Stress.timer);
        game.start();
        if (game.pacing && typeof game.pacing.clear === 'function') game.pacing.clear();
        if (game.gates && typeof game.gates.clear === 'function') game.gates.clear();
        if (game.enemies && typeof game.enemies.clear === 'function') game.enemies.clear();
        if (game.combat && typeof game.combat.clear === 'function') game.combat.clear();

        game.state = 'playing';
        game.paused = false;
        game.bossSpawned = false;
        game.bossDefeated = false;
        game.squad.setCount(spec.soldiers);
        game.squad.x = 0;
        game.squad.targetX = 0;
        // Exercise real critical, freeze, pierce, vamp, bullets, hits, deaths and particles.
        game.squad.critChance = Math.max(game.squad.critChance || 0, 0.15);
        game.squad.freezeStacks = Math.max(game.squad.freezeStacks || 0, 1);
        game.squad.pierce = Math.max(game.squad.pierce || 0, 1);
        game.squad.vampStacks = Math.max(game.squad.vampStacks || 0, 1);

        const types = ['normal', 'fast', 'shield', 'split', 'spitter', 'elite'];
        const columns = spec.adds >= 60 ? 10 : 7;
        const dps = spec.soldiers * game.squad.getDamage() * game.squad.getFireRate();
        const addHp = Math.max(50, Math.ceil((dps * 2.25 / Math.max(1, spec.adds)) / 10) * 10);
        let serial = 0;
        function spawnAdd() {
            const column = serial % columns;
            const row = Math.floor((serial % Math.max(spec.adds, columns)) / columns);
            const x = (column - (columns - 1) / 2) * (columns >= 10 ? .53 : .72);
            const depth = 10 + (row % 8) * 1.65 + (serial % 3) * .18;
            const type = types[serial % types.length];
            serial++;
            return game.enemies.spawnEnemy(type, x, game.squad.z - Math.min(22, depth), addHp);
        }
        for (let index = 0; index < spec.adds; index++) spawnAdd();

        let boss = null;
        if (spec.boss) {
            boss = game.enemies.spawnEnemy('boss', 0, game.squad.z - 20, spec.bossHp, spec.bossStyle);
            boss.bossStyle = boss.bossStyle || spec.bossStyle;
            boss.style = boss.style || spec.bossStyle;
            game.enemies.boss = boss;
        }

        const stats = {
            scenario: spec.id,
            targetSoldiers: spec.soldiers,
            targetAdds: spec.adds,
            targetTotalEnemies: spec.adds + (spec.boss ? 1 : 0),
            reinforcementIntervalMs: spec.reinforcementMs,
            addHp,
            bossHp: boss ? boss.hp : null,
            bossStyle: boss ? (boss.bossStyle || boss.style || spec.bossStyle) : null,
            reinforcementTicks: 0,
            soldierReinforcements: 0,
            soldierCountCorrections: 0,
            vampExcessTrimmed: 0,
            enemyReinforcements: 0,
            soldierDeathsObserved: 0,
            enemyKillsStart: game.enemies.killCount || 0,
            enemyKillsObserved: 0,
            bulletsMax: 0,
            bulletActiveTicks: 0,
            stateTransitions: [],
            startedAt: performance.now(),
            initialSquadZ: game.squad.z
        };
        let previousState = game.state;
        const timer = setInterval(() => {
            stats.reinforcementTicks++;
            if (game.state !== previousState) {
                stats.stateTransitions.push({ from: previousState, to: game.state, atMs: performance.now() - stats.startedAt });
                previousState = game.state;
            }
            const bullets = game.combat && game.combat.bullets ? game.combat.bullets.length : 0;
            stats.bulletsMax = Math.max(stats.bulletsMax, bullets);
            if (bullets > 0) stats.bulletActiveTicks++;
            const soldierShortfall = Math.max(0, spec.soldiers - game.squad.count);
            const soldierExcess = Math.max(0, game.squad.count - spec.soldiers);
            if (soldierShortfall) {
                stats.soldierDeathsObserved += soldierShortfall;
                stats.soldierReinforcements += soldierShortfall;
            }
            if (soldierExcess) stats.vampExcessTrimmed += soldierExcess;
            if (game.squad.count !== spec.soldiers) stats.soldierCountCorrections++;
            // The load contract is sampled at fixed actor counts. This uses the
            // real squad API every tick; damage/death/vamp mechanics stay live.
            game.squad.setCount(spec.soldiers);
            const aliveAdds = game.enemies.enemies.filter(enemy => enemy.alive && !enemy.isBoss).length;
            const addShortfall = Math.max(0, spec.adds - aliveAdds);
            for (let index = 0; index < addShortfall; index++) spawnAdd();
            stats.enemyReinforcements += addShortfall;
            stats.enemyKillsObserved = Math.max(0, (game.enemies.killCount || 0) - stats.enemyKillsStart);
        }, spec.reinforcementMs);
        window.__v42Stress = { timer, stats, spec };
        return {
            state: game.state,
            quality: game.world.quality,
            soldiers: game.squad.count,
            enemies: game.enemies.aliveCount,
            addHp,
            bossStyle: stats.bossStyle,
            bossHp: stats.bossHp,
            positionRange: { nearest: game.squad.z - 10, farthest: game.squad.z - 22 }
        };
    }, load);
    if (state.state !== 'playing' || state.soldiers !== load.soldiers || state.enemies !== load.adds + (load.boss ? 1 : 0)) {
        throw new Error(`Full-battle setup mismatch for ${load.id}: ${JSON.stringify(state)}`);
    }
    return state;
}

async function sampleRawFramesAndActors(page, durationMs) {
    return page.evaluate(ms => new Promise(resolve => {
        const stamps = [];
        const actors = [];
        let first = null;
        function frame(timestamp) {
            if (first === null) first = timestamp;
            const game = window.__game;
            stamps.push(timestamp);
            actors.push({
                soldiers: game.squad.count,
                enemies: game.enemies.aliveCount,
                bullets: game.combat && game.combat.bullets ? game.combat.bullets.length : 0,
                kills: game.enemies.killCount || 0,
                squadZ: game.squad.z,
                state: game.state
            });
            if (timestamp - first >= ms) resolve({ stamps, actors });
            else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }), durationMs);
}

async function collectRuntimeInfo(page) {
    return page.evaluate(() => {
        const game = window.__game;
        const renderer = game.world.renderer;
        const info = renderer.info;
        const gl = renderer.getContext();
        const extension = gl.getExtension('WEBGL_debug_renderer_info');
        const stress = window.__v42Stress;
        if (stress) {
            stress.stats.enemyKillsObserved = Math.max(0, (game.enemies.killCount || 0) - stress.stats.enemyKillsStart);
            stress.stats.finalSquadZ = game.squad.z;
            stress.stats.elapsedMs = performance.now() - stress.stats.startedAt;
        }
        return {
            game: {
                state: game.state,
                squadCount: game.squad.count,
                squadZ: game.squad.z,
                enemyAliveCount: game.enemies.aliveCount,
                enemyArrayCount: game.enemies.enemies.length,
                killCount: game.enemies.killCount || 0,
                bulletCount: game.combat && game.combat.bullets ? game.combat.bullets.length : 0,
                bossAlive: Boolean(game.enemies.boss && game.enemies.boss.alive)
            },
            stress: stress ? { ...stress.stats } : null,
            renderer: {
                calls: info.render.calls,
                triangles: info.render.triangles,
                points: info.render.points,
                lines: info.render.lines,
                geometries: info.memory.geometries,
                textures: info.memory.textures,
                programs: info.programs ? info.programs.length : null
            },
            environment: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                hardwareConcurrency: navigator.hardwareConcurrency || null,
                deviceMemoryGB: navigator.deviceMemory || null,
                webglRenderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
                webglVendor: extension ? gl.getParameter(extension.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
                webglVersion: gl.getParameter(gl.VERSION)
            },
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null
        };
    });
}

async function stopStress(page) {
    await page.evaluate(() => {
        if (window.__v42Stress && window.__v42Stress.timer) clearInterval(window.__v42Stress.timer);
        window.__v42Stress = null;
    }).catch(() => {});
}

async function runSample(browser, baseUrl, viewport, tier, load) {
    const context = await seededContext(browser, viewport, tier.deviceScaleFactor, SEED);
    try {
        const { page, errors, load: timings } = await openGame(context, baseUrl, tier.quality);
        const setup = await setupFullBattle(page, { ...load, reinforcementMs: REINFORCEMENT_MS });
        if (setup.quality !== tier.quality) {
            throw new Error(`Quality override mismatch: requested ${tier.quality}, game selected ${setup.quality}`);
        }
        await page.waitForTimeout(WARMUP_MS);
        const sampled = await sampleRawFramesAndActors(page, SAMPLE_MS);
        const intervals = [];
        for (let index = 1; index < sampled.stamps.length; index++) {
            const interval = sampled.stamps[index] - sampled.stamps[index - 1];
            if (interval > 0) intervals.push(interval);
        }
        const sortedIntervals = intervals.slice().sort((a, b) => a - b);
        const fpsSamples = intervals.map(interval => 1000 / interval).sort((a, b) => a - b);
        const elapsed = sampled.stamps.length > 1 ? sampled.stamps.at(-1) - sampled.stamps[0] : 0;
        const runtime = await collectRuntimeInfo(page);
        await stopStress(page);
        if (errors.length) throw new Error(`Browser errors during sample: ${errors.join(' | ')}`);
        if (sampled.actors.some(actor => actor.state !== 'playing') || runtime.game.state !== 'playing') {
            throw new Error(`Combat left playing state during ${load.id}: ${JSON.stringify(runtime.stress)}`);
        }
        return {
            viewport: `${viewport.width}x${viewport.height}`,
            width: viewport.width,
            height: viewport.height,
            quality: tier.name,
            qualityLevel: tier.quality,
            requestedDeviceScaleFactor: tier.deviceScaleFactor,
            actualDevicePixelRatio: await page.evaluate(() => window.devicePixelRatio),
            load: load.id,
            requestedActors: {
                soldiers: load.soldiers,
                adds: load.adds,
                bosses: load.boss ? 1 : 0,
                total: load.soldiers + load.adds + (load.boss ? 1 : 0)
            },
            setup,
            assetLoadMs: {
                soldier: round(timings.soldierMs),
                enemy: round(timings.enemyMs),
                total: round(timings.totalMs),
                navigationToReady: round(timings.navigationToReadyMs)
            },
            frameSampleMs: round(elapsed),
            frameCount: intervals.length,
            fps: elapsed > 0 ? round(intervals.length * 1000 / elapsed) : 0,
            medianFps: round(percentile(fpsSamples, .5)),
            p95Fps: round(percentile(fpsSamples, .95)),
            p05Fps: round(percentile(fpsSamples, .05)),
            medianFrameMs: round(percentile(sortedIntervals, .5), 3),
            p95FrameMs: round(percentile(sortedIntervals, .95), 3),
            rawFrameIntervalsMs: intervals.map(interval => round(interval, 3)),
            actualActors: {
                soldiers: summarizeNumbers(sampled.actors.map(actor => actor.soldiers)),
                enemies: summarizeNumbers(sampled.actors.map(actor => actor.enemies)),
                bullets: summarizeNumbers(sampled.actors.map(actor => actor.bullets)),
                squadZ: summarizeNumbers(sampled.actors.map(actor => actor.squadZ))
            },
            combatEvidence: runtime.stress,
            renderer: runtime.renderer,
            gameplay: runtime.game,
            memory: runtime.memory,
            environment: runtime.environment
        };
    } finally {
        await context.close();
    }
}

async function runFullBattleMemoryCycles(browser, baseUrl, cycles) {
    if (!cycles) return null;
    const viewport = { width: 390, height: 844 };
    const tier = QUALITY_TIERS[1];
    const context = await seededContext(browser, viewport, tier.deviceScaleFactor, SEED ^ 0x99);
    try {
        const { page, errors } = await openGame(context, baseUrl, tier.quality);
        const nextFrames = count => page.evaluate(frameCount => new Promise(resolve => {
            function frame() {
                if (--frameCount <= 0) resolve();
                else requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        }), count);
        const snapshot = label => page.evaluate(value => {
            const renderer = window.__game.world.renderer;
            return {
                label: value,
                usedJSHeapSize: performance.memory ? performance.memory.usedJSHeapSize : null,
                geometries: renderer.info.memory.geometries,
                textures: renderer.info.memory.textures,
                programs: renderer.info.programs ? renderer.info.programs.length : null,
                sceneChildren: window.__game.world.scene.children.length
            };
        }, label);

        await setupFullBattle(page, { ...LOADS[3], reinforcementMs: REINFORCEMENT_MS });
        await page.waitForTimeout(1200);
        await stopStress(page);
        await page.evaluate(async () => {
            if (typeof window.gc === 'function') window.gc();
        });
        await nextFrames(2);
        const baseline = await snapshot('warm-full-battle-baseline');
        const samples = [];
        for (let cycle = 1; cycle <= cycles; cycle++) {
            await setupFullBattle(page, { ...LOADS[3], reinforcementMs: REINFORCEMENT_MS });
            await page.waitForTimeout(500);
            samples.push(await snapshot(`cycle-${cycle}-full-battle`));
            await stopStress(page);
            await page.evaluate(() => {
                const game = window.__game;
                if (game.enemies && game.enemies.clear) game.enemies.clear();
                if (game.combat && game.combat.clear) game.combat.clear();
                game.squad.reset(1);
                game.world.render();
            });
            await nextFrames(2);
            samples.push(await snapshot(`cycle-${cycle}-reset`));
        }
        const beforeGc = await snapshot('before-explicit-gc');
        const gcAvailable = await page.evaluate(() => typeof window.gc === 'function');
        if (gcAvailable) {
            await page.evaluate(() => window.gc());
            await nextFrames(2);
        }
        const afterGc = await snapshot('after-explicit-gc');
        if (errors.length) throw new Error(`Browser errors during memory cycles: ${errors.join(' | ')}`);
        return {
            cycles,
            scenario: 'Repeated real 500-soldier + 100-enemy live-combat warm/grow/reset cycles; AI, bullets, damage and effects stay enabled.',
            gcAvailable,
            baseline,
            samples,
            beforeGc,
            afterGc,
            retainedGrowthBytes: Number.isFinite(baseline.usedJSHeapSize) && Number.isFinite(afterGc.usedJSHeapSize)
                ? afterGc.usedJSHeapSize - baseline.usedJSHeapSize : null,
            geometryGrowth: afterGc.geometries - baseline.geometries,
            textureGrowth: afterGc.textures - baseline.textures
        };
    } finally {
        await context.close();
    }
}

async function main() {
    const viewports = parseViewports(process.env.V42_PERF_VIEWPORTS);
    const tiers = parseQualities(process.env.V42_PERF_QUALITIES);
    const loads = parseLoads(process.env.V42_PERF_LOADS);
    const harness = createHarness({ port: PORT, headless: true, browserArgs: ['--js-flags=--expose-gc'] });
    const samples = [];
    try {
        await harness.start();
        for (const viewport of viewports) {
            for (const tier of tiers) {
                for (const load of loads) {
                    process.stdout.write(`Sampling ${viewport.width}x${viewport.height}, ${tier.name}/DPR${tier.deviceScaleFactor}, ${load.id} ... `);
                    const sample = await runSample(harness.browser, harness.baseUrl, viewport, tier, load);
                    samples.push(sample);
                    console.log(`${sample.fps} fps, p95 ${sample.p95FrameMs} ms, ${sample.renderer.calls} calls, kills ${sample.combatEvidence.enemyKillsObserved}`);
                }
            }
        }

        let memoryCycles = null;
        if (MEMORY_CYCLES) {
            process.stdout.write(`Running ${MEMORY_CYCLES} full-battle grow/reset memory cycles ... `);
            memoryCycles = await runFullBattleMemoryCycles(harness.browser, harness.baseUrl, MEMORY_CYCLES);
            console.log('complete');
        }

        const first = samples[0] || null;
        const report = {
            schemaVersion: 2,
            generatedAt: new Date().toISOString(),
            harness: {
                browserLaunch: harness.launch,
                headless: true,
                port: PORT,
                seed: SEED,
                warmupMs: WARMUP_MS,
                requestedSampleMs: SAMPLE_MS,
                reinforcementIntervalMs: REINFORCEMENT_MS,
                sampleCount: samples.length,
                expectedDefaultSampleCount: 60,
                viewports,
                qualities: tiers,
                loads,
                output: path.relative(ROOT, OUTPUT),
                desktopEmulation: true
            },
            environment: first ? first.environment : null,
            scenario: {
                description: 'Deterministically seeded actual Game in playing state with live Enemy AI, hits, bullets, kills, freeze, crit, vamp and pooled effects.',
                pacing: 'Natural level pacing is cleared only so each stress load is manually maintained. The normal Game update/render loop remains active.',
                reinforcement: `Every ${REINFORCEMENT_MS} ms, real squad/enemy losses are counted and replenished with setCount/spawnEnemy; no invulnerability or HP freeze is used.`,
                placement: 'Mixed normal/fast/shield/split/spitter/elite adds spawn in 7-10 column grids 10-22 world units in front of the moving squad.',
                boss: 'Boss load is 100 soldiers + 40 mixed adds + one actual 20,000 HP overlord through spawnEnemy fifth style argument.',
                interpretation: 'Headless desktop system-browser measurements are comparative development evidence, not mobile-device claims.'
            },
            samples,
            memoryCycles
        };
        fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
        fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
        console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
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

module.exports = {
    LOADS,
    QUALITY_TIERS,
    parseLoads,
    parseQualities,
    parseViewports,
    summarizeNumbers
};
