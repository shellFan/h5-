// Reproducible before/after browser performance evidence for the art integration.
// This is a comparative Windows Edge headless benchmark, not a mobile-device claim.

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const {
    ROOT,
    launchSystemBrowser,
    waitForGameReady,
    watchPageErrors
} = require('./v42-browser');

const HARNESS_VERSION = 1;
const PORT = positiveInteger(process.env.ART_PERF_PORT, 8250);
const RUNS = positiveInteger(process.env.ART_PERF_RUNS, 3);
const WARMUP_MS = positiveInteger(process.env.ART_PERF_WARMUP_MS, 750);
const SAMPLE_MS = positiveInteger(process.env.ART_PERF_SAMPLE_MS, 2000);
const PHASE = String(process.env.ART_PERF_PHASE || 'before').toLowerCase();
const OUTPUT = path.join(ROOT, 'docs', 'art-assets', `performance-${PHASE}.json`);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const VIEWPORT = Object.freeze({ width: 390, height: 844 });
const STRESS_LOADS = Object.freeze([
    Object.freeze({ id: '12-soldiers-60-enemies', soldiers: 12, enemies: 60 }),
    Object.freeze({ id: '100-soldiers-60-enemies', soldiers: 100, enemies: 60 }),
    Object.freeze({ id: '300-soldiers-60-enemies', soldiers: 300, enemies: 60 })
]);

function positiveInteger(value, fallback) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : fallback;
}

function round(value, digits = 2) {
    if (!Number.isFinite(value)) return null;
    const scale = 10 ** digits;
    return Math.round(value * scale) / scale;
}

function median(values) {
    const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values, fraction) {
    const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (!sorted.length) return null;
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
}

function summarize(values) {
    const finite = values.filter(Number.isFinite);
    return {
        runs: finite.length,
        min: finite.length ? round(Math.min(...finite)) : null,
        median: round(median(finite)),
        max: finite.length ? round(Math.max(...finite)) : null
    };
}

function git(args) {
    try {
        return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
    } catch (_) {
        return null;
    }
}

function sha256(relativePath) {
    const file = path.join(ROOT, relativePath);
    if (!fs.existsSync(file)) return null;
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function sourceSnapshot() {
    const files = [
        'index.html', 'style.css', 'style-v42.css', 'style-v60.css', 'style-v118.css',
        'style-v120.css', 'style-v130.css', 'js/game.js', 'js/world.js', 'js/squad.js',
        'js/enemies.js', 'js/gates.js', 'js/ui-v60.js'
    ];
    return Object.fromEntries(files.map(file => [file, sha256(file)]));
}

async function newMeasuredContext(browser) {
    const context = await browser.newContext({
        viewport: VIEWPORT,
        screen: VIEWPORT,
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false
    });
    await context.addInitScript(() => {
        window.__artPerfNavigationStart = performance.now();
        let state = 0x71a55eED;
        Math.random = function seededRandom() {
            state += 0x6D2B79F5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    });
    return context;
}

function monitorPage(page) {
    const errors = watchPageErrors(page);
    const failedRequests = [];
    const httpErrors = [];
    page.on('requestfailed', request => failedRequests.push({
        url: request.url(),
        error: request.failure() ? request.failure().errorText : 'unknown'
    }));
    page.on('response', response => {
        if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() });
    });
    return { errors, failedRequests, httpErrors };
}

async function navigateReady(page, runTag) {
    await page.goto(`${BASE_URL}/index.html?artperf=${encodeURIComponent(runTag)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
    });
    await waitForGameReady(page, 30000);
    return page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        const navigation = performance.getEntriesByType('navigation')[0];
        const renderer = window.__game.world.renderer.info;
        return {
            readyMs: performance.now() - window.__artPerfNavigationStart,
            navigation: navigation ? {
                durationMs: navigation.duration,
                domContentLoadedMs: navigation.domContentLoadedEventEnd,
                loadEventMs: navigation.loadEventEnd
            } : null,
            resources: {
                count: resources.length,
                transferBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
                encodedBodyBytes: resources.reduce((sum, entry) => sum + (entry.encodedBodySize || 0), 0),
                decodedBodyBytes: resources.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0),
                totalDurationMs: resources.reduce((sum, entry) => sum + (entry.duration || 0), 0),
                names: resources.map(entry => entry.name)
            },
            heapBytes: performance.memory ? performance.memory.usedJSHeapSize : null,
            renderer: {
                calls: renderer.render.calls,
                triangles: renderer.render.triangles,
                points: renderer.render.points,
                lines: renderer.render.lines,
                geometries: renderer.memory.geometries,
                textures: renderer.memory.textures,
                programs: renderer.programs ? renderer.programs.length : null
            },
            game: { state: window.__game.state, squad: window.__game.squad.count },
            loaders: {
                soldier: window.SoldierModelLoader ? window.SoldierModelLoader.status : 'unavailable',
                enemies: window.EnemyModelLoader ? window.EnemyModelLoader.status : 'unavailable'
            }
        };
    });
}

async function measureBootPair(browser, run) {
    const context = await newMeasuredContext(browser);
    try {
        const page = await context.newPage();
        const diagnostics = monitorPage(page);
        const cold = await navigateReady(page, `cold-${run}`);
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        await waitForGameReady(page, 30000);
        const warm = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource');
            const navigation = performance.getEntriesByType('navigation')[0];
            const renderer = window.__game.world.renderer.info;
            return {
                readyMs: performance.now() - window.__artPerfNavigationStart,
                navigation: navigation ? {
                    durationMs: navigation.duration,
                    domContentLoadedMs: navigation.domContentLoadedEventEnd,
                    loadEventMs: navigation.loadEventEnd
                } : null,
                resources: {
                    count: resources.length,
                    transferBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
                    encodedBodyBytes: resources.reduce((sum, entry) => sum + (entry.encodedBodySize || 0), 0),
                    decodedBodyBytes: resources.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0),
                    totalDurationMs: resources.reduce((sum, entry) => sum + (entry.duration || 0), 0),
                    names: resources.map(entry => entry.name)
                },
                heapBytes: performance.memory ? performance.memory.usedJSHeapSize : null,
                renderer: {
                    calls: renderer.render.calls,
                    triangles: renderer.render.triangles,
                    points: renderer.render.points,
                    lines: renderer.render.lines,
                    geometries: renderer.memory.geometries,
                    textures: renderer.memory.textures,
                    programs: renderer.programs ? renderer.programs.length : null
                },
                game: { state: window.__game.state, squad: window.__game.squad.count },
                loaders: {
                    soldier: window.SoldierModelLoader ? window.SoldierModelLoader.status : 'unavailable',
                    enemies: window.EnemyModelLoader ? window.EnemyModelLoader.status : 'unavailable'
                }
            };
        });
        return { run, cold, warm, diagnostics };
    } finally {
        await context.close();
    }
}

async function prepareStress(page, load) {
    return page.evaluate(spec => {
        const game = window.__game;
        game.start();
        if (game.pacing && game.pacing.clear) game.pacing.clear();
        if (game.gates && game.gates.clear) game.gates.clear();
        if (game.enemies && game.enemies.clear) game.enemies.clear();
        if (game.combat && game.combat.clear) game.combat.clear();
        if (game.effects && game.effects.clear) game.effects.clear();
        game.state = 'playing';
        game.squad.setCount(spec.soldiers);
        game.squad.x = 0;
        game.squad.targetX = 0;
        const types = ['normal', 'fast', 'shield', 'split', 'spitter', 'elite'];
        for (let index = 0; index < spec.enemies; index++) {
            const column = index % 10;
            const row = Math.floor(index / 10);
            const enemy = game.enemies.spawnEnemy(
                types[index % types.length],
                (column - 4.5) * 0.55,
                game.squad.z - 11 - row * 1.7,
                1000000000
            );
            enemy.hp = 1000000000;
            enemy.maxHp = 1000000000;
        }
        // The normal RAF/render loop remains active, but gameplay simulation is
        // paused so actor counts cannot drift through attacks, deaths or spawns.
        game.paused = true;
        return {
            state: game.state,
            paused: game.paused,
            soldiers: game.squad.count,
            enemies: game.enemies.aliveCount
        };
    }, load);
}

async function sampleFrames(page, durationMs) {
    return page.evaluate(ms => new Promise(resolve => {
        const stamps = [];
        let started = null;
        function frame(timestamp) {
            if (started === null) started = timestamp;
            stamps.push(timestamp);
            if (timestamp - started >= ms) resolve(stamps);
            else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }), durationMs);
}

async function measureStress(browser, load, run) {
    const context = await newMeasuredContext(browser);
    try {
        const page = await context.newPage();
        const diagnostics = monitorPage(page);
        await navigateReady(page, `stress-${load.soldiers}-${run}`);
        const setup = await prepareStress(page, load);
        if (!setup.paused || setup.soldiers !== load.soldiers || setup.enemies !== load.enemies) {
            throw new Error(`Stress fixture mismatch: ${JSON.stringify({ load, setup })}`);
        }
        await page.waitForTimeout(WARMUP_MS);
        const stamps = await sampleFrames(page, SAMPLE_MS);
        const intervals = [];
        for (let index = 1; index < stamps.length; index++) {
            const interval = stamps[index] - stamps[index - 1];
            if (interval > 0) intervals.push(interval);
        }
        const runtime = await page.evaluate(() => {
            const game = window.__game;
            const info = game.world.renderer.info;
            return {
                state: game.state,
                paused: game.paused,
                soldiers: game.squad.count,
                enemies: game.enemies.aliveCount,
                heapBytes: performance.memory ? performance.memory.usedJSHeapSize : null,
                renderer: {
                    calls: info.render.calls,
                    triangles: info.render.triangles,
                    points: info.render.points,
                    lines: info.render.lines,
                    geometries: info.memory.geometries,
                    textures: info.memory.textures,
                    programs: info.programs ? info.programs.length : null
                }
            };
        });
        const elapsedMs = stamps.length > 1 ? stamps[stamps.length - 1] - stamps[0] : 0;
        return {
            run,
            load: load.id,
            setup,
            sample: {
                durationMs: round(elapsedMs),
                frameCount: intervals.length,
                fps: elapsedMs > 0 ? round(intervals.length * 1000 / elapsedMs) : null,
                medianFrameMs: round(median(intervals), 3),
                p95FrameMs: round(percentile(intervals, 0.95), 3)
            },
            runtime,
            diagnostics
        };
    } finally {
        await context.close();
    }
}

function summarizeBoots(bootPairs) {
    const summarizeSide = side => ({
        readyMs: summarize(bootPairs.map(pair => pair[side].readyMs)),
        transferBytes: summarize(bootPairs.map(pair => pair[side].resources.transferBytes)),
        encodedBodyBytes: summarize(bootPairs.map(pair => pair[side].resources.encodedBodyBytes)),
        resourceDurationMs: summarize(bootPairs.map(pair => pair[side].resources.totalDurationMs)),
        heapBytes: summarize(bootPairs.map(pair => pair[side].heapBytes)),
        drawCalls: summarize(bootPairs.map(pair => pair[side].renderer.calls))
    });
    return { cold: summarizeSide('cold'), warm: summarizeSide('warm') };
}

function summarizeStress(samples) {
    return STRESS_LOADS.map(load => {
        const matching = samples.filter(sample => sample.load === load.id);
        return {
            load: load.id,
            runs: matching.length,
            fps: summarize(matching.map(sample => sample.sample.fps)),
            medianFrameMs: summarize(matching.map(sample => sample.sample.medianFrameMs)),
            p95FrameMs: summarize(matching.map(sample => sample.sample.p95FrameMs)),
            drawCalls: summarize(matching.map(sample => sample.runtime.renderer.calls)),
            triangles: summarize(matching.map(sample => sample.runtime.renderer.triangles)),
            heapBytes: summarize(matching.map(sample => sample.runtime.heapBytes))
        };
    });
}

function allDiagnostics(bootPairs, stressSamples) {
    const results = [];
    for (const entry of [...bootPairs, ...stressSamples]) {
        for (const error of entry.diagnostics.errors) results.push({ type: 'page-or-console-error', detail: error });
        for (const error of entry.diagnostics.failedRequests) results.push({ type: 'request-failed', ...error });
        for (const error of entry.diagnostics.httpErrors) results.push({ type: 'http-error', ...error });
    }
    return results;
}

function buildComparison(afterReport) {
    if (PHASE !== 'after') return null;
    const beforePath = path.join(ROOT, 'docs', 'art-assets', 'performance-before.json');
    if (!fs.existsSync(beforePath)) throw new Error('performance-before.json is required for the after comparison');
    const before = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
    const sourceHashChanges = [];
    const keys = new Set([...Object.keys(before.sourceSnapshot || {}), ...Object.keys(afterReport.sourceSnapshot || {})]);
    for (const file of [...keys].sort()) {
        const oldHash = before.sourceSnapshot && before.sourceSnapshot[file];
        const newHash = afterReport.sourceSnapshot && afterReport.sourceSnapshot[file];
        if (oldHash !== newHash) sourceHashChanges.push({ file, before: oldHash || null, after: newHash || null });
    }
    const beforeLoads = (before.summary && before.summary.stress || []).map(item => item.load);
    const afterLoads = (afterReport.summary && afterReport.summary.stress || []).map(item => item.load);
    return {
        beforeGeneratedAt: before.generatedAt,
        sameHarnessVersion: before.harnessVersion === afterReport.harnessVersion,
        sameBrowserChannel: before.environment && before.environment.browser === afterReport.environment.browser,
        sameViewport: JSON.stringify(before.environment && before.environment.viewport) === JSON.stringify(afterReport.environment.viewport),
        sameProtocol: Boolean(before.protocol &&
            before.protocol.runs === afterReport.protocol.runs &&
            before.protocol.warmupMs === afterReport.protocol.warmupMs &&
            before.protocol.sampleMs === afterReport.protocol.sampleMs &&
            JSON.stringify(beforeLoads) === JSON.stringify(afterLoads)),
        sourceHashChanges,
        sameSceneStress: 'Both phases call Game.start, Squad.setCount and EnemyManager.spawnEnemy for the identical 12/100/300-soldier + 60-enemy paused-render scenes.',
        fpsCeilingCaveat: 'A 60 fps result reaches the headless display cadence ceiling. It does not prove equivalent GPU cost; compare resource bytes, p95 frame time, draw calls, triangles and heap under the same browser/viewport/quality conditions.',
        interpretation: 'Source hashes prove the compared phases differ. Browser channel, host, viewport, DPR and automatic game quality selection are held constant; this remains desktop comparative evidence, not a real-device benchmark.'
    };
}

async function main() {
    if (!['before', 'after'].includes(PHASE)) throw new Error('ART_PERF_PHASE must be before or after');
    const launched = await launchSystemBrowser(true, ['--js-flags=--expose-gc']);
    const bootPairs = [];
    const stressSamples = [];
    try {
        for (let run = 1; run <= RUNS; run++) {
            process.stdout.write(`Boot pair ${run}/${RUNS} ... `);
            bootPairs.push(await measureBootPair(launched.browser, run));
            console.log('complete');
        }
        for (const load of STRESS_LOADS) {
            for (let run = 1; run <= RUNS; run++) {
                process.stdout.write(`${load.id} ${run}/${RUNS} ... `);
                const result = await measureStress(launched.browser, load, run);
                stressSamples.push(result);
                console.log(`${result.sample.fps} fps, ${result.runtime.renderer.calls} calls`);
            }
        }
        const diagnostics = allDiagnostics(bootPairs, stressSamples);
        const report = {
            schemaVersion: 1,
            harnessVersion: HARNESS_VERSION,
            phase: PHASE,
            generatedAt: new Date().toISOString(),
            git: {
                head: git(['rev-parse', 'HEAD']),
                branch: git(['branch', '--show-current']),
                status: git(['status', '--short'])
            },
            sourceSnapshot: sourceSnapshot(),
            environment: {
                browser: launched.launch,
                headless: true,
                platform: process.platform,
                node: process.version,
                viewport: VIEWPORT,
                baseUrl: BASE_URL,
                desktopEmulation: true,
                realDevice: false
            },
            protocol: {
                runs: RUNS,
                warmupMs: WARMUP_MS,
                sampleMs: SAMPLE_MS,
                coldBoot: 'Each run uses a new browser context with an empty context cache.',
                warmBoot: 'The same page is reloaded in the same context after its cold boot.',
                stress: 'Actual Game.start, Squad.setCount and EnemyManager.spawnEnemy APIs; fixed 60 enemies; paused simulation with active RAF rendering prevents deaths/spawns from changing actor counts.',
                interpretation: 'Comparative Windows Edge headless desktop evidence only; not a real mobile or WeChat-device benchmark.'
            },
            bootPairs,
            stressSamples,
            summary: {
                boot: summarizeBoots(bootPairs),
                stress: summarizeStress(stressSamples)
            },
            diagnostics,
            passed: diagnostics.length === 0
        };
        report.comparison = buildComparison(report);
        fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
        fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
        console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
        if (diagnostics.length) {
            console.error(`Captured ${diagnostics.length} browser diagnostic error(s)`);
            process.exitCode = 1;
        }
    } finally {
        await launched.browser.close().catch(() => {});
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error(error && error.stack ? error.stack : error);
        process.exitCode = 1;
    });
}

module.exports = {
    HARNESS_VERSION,
    STRESS_LOADS,
    median,
    percentile,
    summarize
};
