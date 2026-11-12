// V4.1 real-browser soldier renderer performance harness.
// Runs against a local static server with a system Edge/Chrome installation.
// Default matrix: 4 viewports x 6 squad sizes, 2 s warm-up + 3 s raw-rAF sample.

'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.V41_PERF_PORT || 8242);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SAMPLE_MS = positiveNumber(process.env.V41_PERF_SAMPLE_MS, 3000);
const WARMUP_MS = positiveNumber(process.env.V41_PERF_WARMUP_MS, 2000);
const OUTPUT = path.join(ROOT, 'docs', 'v41-performance.json');
const COUNTS = parseCounts(process.env.V41_PERF_COUNTS) || [1, 12, 31, 100, 300, 500];
const VIEWPORTS = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 1080, height: 1920 }
];
const SEED = 0x41c0ffee;

function positiveNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseCounts(value) {
    if (!value) return null;
    const counts = value.split(',').map(Number).filter(n => Number.isInteger(n) && n > 0 && n <= 500);
    return counts.length ? [...new Set(counts)] : null;
}

function percentile(sorted, fraction) {
    if (!sorted.length) return 0;
    return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

function round(value, digits = 2) {
    const scale = 10 ** digits;
    return Math.round(value * scale) / scale;
}

function waitForServer(child) {
    return new Promise((resolve, reject) => {
        const started = Date.now();
        let settled = false;
        const timeoutMs = 10000;

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
                else if (Date.now() - started >= timeoutMs) finish(new Error(`Static server returned ${response.statusCode}`));
                else setTimeout(poll, 100);
            });
            request.setTimeout(1000, () => request.destroy());
            request.on('error', () => {
                if (Date.now() - started >= timeoutMs) finish(new Error(`Static server did not become ready at ${BASE_URL}`));
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
    const common = {
        headless: true,
        args: ['--js-flags=--expose-gc']
    };
    const candidates = [
        { channel: 'msedge' },
        { executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
        { executablePath: 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe' },
        { channel: 'chrome' },
        { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' }
    ];
    const failures = [];
    for (const candidate of candidates) {
        try {
            const browser = await chromium.launch({ ...common, ...candidate });
            return { browser, launch: candidate.channel || candidate.executablePath };
        } catch (error) {
            failures.push(`${candidate.channel || candidate.executablePath}: ${error.message.split('\n')[0]}`);
        }
    }
    throw new Error(`No system Edge/Chrome installation could be launched:\n${failures.join('\n')}`);
}

async function makeContext(browser, viewport) {
    const context = await browser.newContext({
        viewport,
        screen: viewport,
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false
    });
    await context.addInitScript(seed => {
        let state = seed >>> 0;
        Math.random = function seededRandom() {
            state += 0x6D2B79F5;
            let t = state;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        window.__v41PerfNavigationStart = performance.now();
    }, SEED);
    return context;
}

async function openGame(context) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error' && !message.text().includes('favicon') && !(message.location().url || '').includes('favicon')) errors.push(message.text());
    });
    await page.goto(`${BASE_URL}/index.html?v41perf=1`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => Boolean(window.__game), null, { timeout: 15000 });
    const loadMs = await page.evaluate(() => SoldierModelLoader.loadMs);
    if (errors.length) throw new Error(`Browser errors during boot: ${errors.join(' | ')}`);
    return { page, errors, loadMs: round(loadMs) };
}

async function isolatePlayingScenario(page, squadCount) {
    const state = await page.evaluate(count => {
        const game = window.__game;
        game.start();
        game.squad.setCount(count);
        game.squad.x = 0;
        game.squad.targetX = 0;
        if (game.enemies && typeof game.enemies.clear === 'function') game.enemies.clear();
        if (game.gates && typeof game.gates.clear === 'function') game.gates.clear();
        if (game.pacing && typeof game.pacing.clear === 'function') game.pacing.clear();
        if (game.combat && typeof game.combat.clear === 'function') game.combat.clear();
        return { state: game.state, count: game.squad.count };
    }, squadCount);
    if (state.state !== 'playing' || state.count !== squadCount) {
        throw new Error(`Scenario setup mismatch: ${JSON.stringify(state)}`);
    }
}

async function sampleRawFrames(page, durationMs) {
    return page.evaluate(ms => new Promise(resolve => {
        const stamps = [];
        let first = null;
        function frame(timestamp) {
            if (first === null) first = timestamp;
            stamps.push(timestamp);
            if (timestamp - first >= ms) resolve(stamps);
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
        const webglRenderer = extension
            ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
            : gl.getParameter(gl.RENDERER);
        const webglVendor = extension
            ? gl.getParameter(extension.UNMASKED_VENDOR_WEBGL)
            : gl.getParameter(gl.VENDOR);
        return {
            game: {
                state: game.state,
                squadCount: game.squad.count,
                squadZ: game.squad.z,
                enemyCount: game.enemies && game.enemies.enemies ? game.enemies.enemies.length : null,
                gateCount: game.gates && game.gates.gates ? game.gates.gates.length : null
            },
            renderer: {
                calls: info.render.calls,
                triangles: info.render.triangles,
                geometries: info.memory.geometries,
                textures: info.memory.textures
            },
            environment: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                hardwareConcurrency: navigator.hardwareConcurrency || null,
                deviceMemoryGB: navigator.deviceMemory || null,
                webglRenderer,
                webglVendor
            },
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null
        };
    });
}

async function runSample(browser, viewport, count) {
    const context = await makeContext(browser, viewport);
    try {
        const { page, errors, loadMs } = await openGame(context);
        await isolatePlayingScenario(page, count);
        await page.waitForTimeout(WARMUP_MS);
        const stamps = await sampleRawFrames(page, SAMPLE_MS);
        const intervals = [];
        for (let i = 1; i < stamps.length; i++) intervals.push(stamps[i] - stamps[i - 1]);
        const sorted = intervals.slice().sort((a, b) => a - b);
        const elapsed = stamps.length > 1 ? stamps[stamps.length - 1] - stamps[0] : 0;
        const runtime = await collectRuntimeInfo(page);
        if (errors.length) throw new Error(`Browser errors during sample: ${errors.join(' | ')}`);
        return {
            viewport: `${viewport.width}x${viewport.height}`,
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            squadCount: count,
            loadMs,
            frameSampleMs: round(elapsed),
            frameCount: intervals.length,
            fps: elapsed > 0 ? round(intervals.length * 1000 / elapsed) : 0,
            medianFrameMs: round(percentile(sorted, 0.5), 3),
            p95FrameMs: round(percentile(sorted, 0.95), 3),
            renderer: runtime.renderer,
            gameplay: runtime.game,
            memory: runtime.memory
        };
    } finally {
        await context.close();
    }
}

async function runMemoryCycles(browser) {
    const viewport = { width: 390, height: 844 };
    const context = await makeContext(browser, viewport);
    try {
        const { page, errors } = await openGame(context);
        // Prime both instance banks, projectile/effect pools and newly visible
        // street geometry before measuring retained resources across resets.
        await isolatePlayingScenario(page, 500);
        await page.waitForTimeout(2500);
        await page.evaluate(()=>window.__game.squad.reset(1));
        await page.waitForTimeout(1500);
        const result = await page.evaluate(async () => {
            const game = window.__game;
            const nextFrames = count => new Promise(resolve => {
                function frame() {
                    if (--count <= 0) resolve();
                    else requestAnimationFrame(frame);
                }
                requestAnimationFrame(frame);
            });
            const snapshot = label => ({
                label,
                usedJSHeapSize: performance.memory ? performance.memory.usedJSHeapSize : null,
                geometries: game.world.renderer.info.memory.geometries,
                textures: game.world.renderer.info.memory.textures
            });

            let gcBaseline = null;
            if (typeof window.gc === 'function') {
                window.gc();
                await nextFrames(2);
                gcBaseline = snapshot('warm-gc-baseline');
            }
            const normal = [snapshot('start')];
            for (let cycle = 1; cycle <= 10; cycle++) {
                game.squad.setCount(500);
                await nextFrames(3);
                normal.push(snapshot(`cycle-${cycle}-grown`));
                game.squad.reset(1);
                await nextFrames(3);
                normal.push(snapshot(`cycle-${cycle}-reset`));
            }
            const beforeGc = snapshot('before-explicit-gc');
            let afterGc = null;
            if (typeof window.gc === 'function') {
                window.gc();
                await nextFrames(2);
                afterGc = snapshot('after-explicit-gc');
            }
            return {
                cycles: 10,
                normal,
                explicitGc: {
                    available: typeof window.gc === 'function',
                    baseline: gcBaseline,
                    before: beforeGc,
                    after: afterGc,
                    retainedGrowthBytes: gcBaseline && afterGc ? afterGc.usedJSHeapSize - gcBaseline.usedJSHeapSize : null
                }
            };
        });
        if (errors.length) throw new Error(`Browser errors during memory cycles: ${errors.join(' | ')}`);
        const resetSamples = result.normal.filter(sample => sample.label === 'start' || sample.label.endsWith('-reset'));
        const heapValues = resetSamples.map(sample => sample.usedJSHeapSize).filter(Number.isFinite);
        const first = resetSamples[0];
        const last = resetSamples[resetSamples.length - 1];
        result.normalSummary = {
            heapMetricAvailable: heapValues.length > 0,
            resetHeapStartBytes: first.usedJSHeapSize,
            resetHeapEndBytes: last.usedJSHeapSize,
            resetHeapGrowthBytes: Number.isFinite(first.usedJSHeapSize) && Number.isFinite(last.usedJSHeapSize)
                ? last.usedJSHeapSize - first.usedJSHeapSize : null,
            geometryGrowth: last.geometries - first.geometries,
            textureGrowth: last.textures - first.textures
        };
        return result;
    } finally {
        await context.close();
    }
}

async function main() {
    let server = null;
    let browser = null;
    try {
        server = await startServer();
        const launched = await launchSystemBrowser();
        browser = launched.browser;
        const samples = [];
        let environment = null;

        for (const viewport of VIEWPORTS) {
            for (const count of COUNTS) {
                process.stdout.write(`Sampling ${viewport.width}x${viewport.height}, ${count} soldiers ... `);
                const sample = await runSample(browser, viewport, count);
                samples.push(sample);
                console.log(`${sample.fps} fps, p95 ${sample.p95FrameMs} ms, ${sample.renderer.calls} calls`);
                if (!environment) {
                    const context = await makeContext(browser, viewport);
                    try {
                        const opened = await openGame(context);
                        environment = (await collectRuntimeInfo(opened.page)).environment;
                    } finally {
                        await context.close();
                    }
                }
            }
        }

        process.stdout.write('Running 10 grow/reset memory cycles ... ');
        const memoryCycles = await runMemoryCycles(browser);
        console.log('complete');

        const report = {
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            harness: {
                browserLaunch: launched.launch,
                headless: true,
                port: PORT,
                seed: SEED,
                warmupMs: WARMUP_MS,
                requestedSampleMs: SAMPLE_MS,
                deviceScaleFactor: 1,
                desktopEmulation: true
            },
            environment,
            scenario: {
                description: 'Deterministically seeded real game in playing state; squad advances normally.',
                isolation: 'After Game.start(), enemies, gates, pacing, and combat projectiles are cleared to remove battle timing variance.',
                interpretation: 'Headless desktop system-browser measurements are comparative development data, not claims about mobile-device speed.'
            },
            samples,
            memoryCycles
        };
        fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
        fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
        console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
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
}

main().catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
});

