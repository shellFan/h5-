// V13 视觉审计: 遍历 H5 全部页面截图 + 微信模拟器关键屏
'use strict';
const { spawn } = require('child_process');
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'V13', 'screenshots');
const PORT = 8132;

function startServer() {
    const server = spawn('node', [path.join(ROOT, 'tools', 'server.js')], {
        cwd: ROOT, env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: ['ignore', 'pipe', 'pipe']
    });
    return server;
}

async function shootAllH5(browser) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 160)));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('window.__game', { timeout: 40000 });
    await page.waitForTimeout(2200);
    const shot = async (name) => {
        await page.screenshot({ path: path.join(OUT, name + '.png') });
        console.log('  shot:', name);
    };
    await shot('01-home');
    // 进入战斗 — HUD/门/Boss/特效
    await page.click('#btn-start');
    await page.waitForTimeout(2600);
    await shot('02-battle-early');
    // 等门出现
    await page.waitForTimeout(3500);
    await shot('03-battle-gates');
    // 暂停
    await page.evaluate(() => { var g = window.__game; if (!g.paused) g._togglePause(); });
    await page.waitForTimeout(500);
    await shot('04-pause');
    await page.evaluate(() => { var g = window.__game; if (g.paused) g._togglePause(); });
    await page.waitForTimeout(400);
    // 胜利结算(快速通关模拟)
    const win = await page.evaluate(() => {
        var g = window.__game;
        if (g.state !== 'playing') return 'idle';
        try { g.enemies.enemies.forEach(function (e) { if (e.alive) e.takeDamage(99999, g.effects, e.x, false); }); } catch (err) { return 'err:' + err.message; }
        return 'ok';
    });
    await page.waitForTimeout(2600);
    await shot('05-settle');
    // 商店/九页
    await page.evaluate(() => { var g = window.__game; if (g.state === 'won' || g.state === 'lost') { } document.getElementById('btn-open-shop') && document.getElementById('btn-open-shop').click(); });
    await page.waitForTimeout(600);
    await shot('06-shop');
    await page.evaluate(() => { var b = document.getElementById('btn-close-shop'); b && b.click(); });
    const pages = [
        ['07-map', 'v60-btn-map', 'v60-map-page'],
        ['08-train', 'v60-btn-train', 'v60-train-page'],
        ['09-armory', 'v60-btn-armory', 'v60-armory-page'],
        ['10-tech', 'v60-btn-tech', 'v60-tech-page'],
        ['11-codex', 'v60-btn-codex', 'v60-codex-page'],
        ['12-challenge', 'v60-btn-challenge', 'v60-challenge-page'],
        ['13-rank', 'v60-btn-rank', 'v60-rank-page'],
        ['14-ach', 'v60-btn-ach', 'v60-ach-page'],
        ['15-daily', 'v60-btn-daily', 'v60-daily-page'],
        ['16-settings', 'v60-btn-set', 'v60-settings-page']
    ];
    for (const [name, navId, pageId] of pages) {
        await page.evaluate(([n, p]) => {
            var game = window.__game;
            var nav = document.getElementById(n);
            if (nav) nav.click();
        }, [navId, pageId]);
        await page.waitForTimeout(650);
        await shot(name);
        await page.evaluate((p) => {
            var back = document.getElementById(p.replace('page', 'back'));
            if (back) back.click();
        }, pageId);
        await page.waitForTimeout(350);
    }
    // 职业选择区
    await page.evaluate(() => { window.scrollTo(0, 0); });
    await page.waitForTimeout(300);
    await shot('17-home-bottom');
    await page.close();
}

async function shootWechat(browser) {
    const page = await browser.newPage({ viewport: { width: 480, height: 960 } });
    await page.goto(`http://127.0.0.1:${PORT}/tests/wechat-emulator-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('window.__game', { timeout: 50000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, 'w01-home.png') });
    console.log('  shot: w01-home');
    await page.evaluate(() => {
        var doc = window.__minidom.document;
        var btn = doc.getElementById('btn-start');
        var b = btn._box;
        var t = [{ identifier: 0, clientX: b.x + b.w / 2, clientY: b.y + b.h / 2 }];
        window.wx.__emit('start', t); window.wx.__emit('end', t);
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT, 'w02-battle.png') });
    console.log('  shot: w02-battle');
    await page.close();
}

async function main() {
    fs.mkdirSync(OUT, { recursive: true });
    const server = startServer();
    const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });
    await shootAllH5(browser);
    await shootWechat(browser);
    await browser.close();
    server.kill();
    console.log('DONE — screenshots in docs/V13/screenshots/');
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
