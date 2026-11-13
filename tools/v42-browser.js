// Shared browser/server plumbing for V4.2 evidence harnesses.

'use strict';

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const VIEWPORTS = Object.freeze([
    Object.freeze({ width: 360, height: 800 }),
    Object.freeze({ width: 390, height: 844 }),
    Object.freeze({ width: 430, height: 932 }),
    Object.freeze({ width: 1080, height: 1920 })
]);

function waitForServer(child, baseUrl, timeoutMs = 15000) {
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
            const request = http.get(`${baseUrl}/index.html`, response => {
                response.resume();
                if (response.statusCode === 200) finish();
                else if (Date.now() - started >= timeoutMs) finish(new Error(`Static server returned ${response.statusCode}`));
                else setTimeout(poll, 100);
            });
            request.setTimeout(1000, () => request.destroy());
            request.on('error', () => {
                if (Date.now() - started >= timeoutMs) finish(new Error(`Static server did not become ready at ${baseUrl}`));
                else setTimeout(poll, 100);
            });
        })();
    });
}

async function launchSystemBrowser(headless = true, extraArgs = []) {
    const options = { headless, args: extraArgs };
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
            const browser = await chromium.launch({ ...options, ...candidate });
            return { browser, launch: candidate.channel || candidate.executablePath };
        } catch (error) {
            failures.push(`${candidate.channel || candidate.executablePath}: ${error.message.split('\n')[0]}`);
        }
    }
    throw new Error(`No system Edge/Chrome installation could be launched:\n${failures.join('\n')}`);
}

async function seededContext(browser, viewport, deviceScaleFactor = 1, seed = 0x42c0ffee) {
    const context = await browser.newContext({
        viewport,
        screen: viewport,
        deviceScaleFactor,
        hasTouch: false,
        isMobile: false
    });
    await context.addInitScript(initialSeed => {
        let state = initialSeed >>> 0;
        Math.random = function seededRandom() {
            state += 0x6D2B79F5;
            let value = state;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
        window.__v42NavigationStart = performance.now();
    }, seed);
    return context;
}

function watchPageErrors(page) {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() !== 'error' || message.text().includes('favicon')) return;
        const url = message.location().url || '';
        if (!url.includes('favicon')) errors.push(`${message.text()}${url ? ` @${url}` : ''}`);
    });
    return errors;
}

async function waitForGameReady(page, timeout = 30000) {
    await page.waitForFunction(() => {
        if (!window.__game) return false;
        if (window.SoldierModelLoader && SoldierModelLoader.status !== 'loaded') return false;
        if (window.EnemyModelLoader && EnemyModelLoader.status !== 'loaded') return false;
        return true;
    }, null, { timeout });
}

function createHarness({ port, headless = true, browserArgs = [] }) {
    const baseUrl = `http://127.0.0.1:${port}`;
    let server = null;
    let browser = null;
    let launch = null;
    return {
        baseUrl,
        get browser() { return browser; },
        get launch() { return launch; },
        async start() {
            if (server || browser) throw new Error('Harness already started');
            server = spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
                cwd: ROOT,
                env: { ...process.env, PORT: String(port) },
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: true
            });
            let diagnostics = '';
            server.stdout.on('data', chunk => { diagnostics += chunk; });
            server.stderr.on('data', chunk => { diagnostics += chunk; });
            try {
                await waitForServer(server, baseUrl);
                const launched = await launchSystemBrowser(headless, browserArgs);
                browser = launched.browser;
                launch = launched.launch;
            } catch (error) {
                if (server.exitCode === null) server.kill();
                throw new Error(`${error.message}${diagnostics ? `\n${diagnostics.trim()}` : ''}`);
            }
            return this;
        },
        async close() {
            if (browser) await browser.close().catch(() => {});
            browser = null;
            if (server && server.exitCode === null) {
                server.kill();
                await new Promise(resolve => {
                    const timer = setTimeout(resolve, 1500);
                    server.once('exit', () => { clearTimeout(timer); resolve(); });
                });
            }
            server = null;
        }
    };
}

module.exports = {
    ROOT,
    VIEWPORTS,
    createHarness,
    launchSystemBrowser,
    seededContext,
    waitForGameReady,
    watchPageErrors
};
