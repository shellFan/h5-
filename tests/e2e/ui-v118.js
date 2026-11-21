// Navy/gold UI acceptance: truthful records, live armory actions, mobile layout.
const assert = require('assert/strict');
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '../..');
const PORT = 8398;
(async () => {
    const server = spawn(process.execPath, ['tools/server.js'], {
        cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore'
    });
    let browser, failed = 0;
    try {
        browser = await chromium.launch({ headless: true, channel: 'msedge' });
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://localhost:${PORT}/`);
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
        if (process.env.UI_CAPTURE_DIR) {
            fs.mkdirSync(process.env.UI_CAPTURE_DIR, { recursive: true });
            await page.screenshot({ path: path.join(process.env.UI_CAPTURE_DIR, 'home-390x844.png') });
        }
        async function check(name, fn) {
            try { await fn(); console.log('PASS ' + name); }
            catch (e) { failed++; console.error('FAIL ' + name + ': ' + e.message); }
        }
        await check('local leaderboard identifies source and preserves empty/sparse/full records', async () => {
            const result = await page.evaluate(() => {
                const g = window.__game, results = [];
                for (const n of [0, 1, 2, 3, 20]) {
                    g.profile.data.records = Array.from({ length: n }, (_, i) => ({
                        score: 12840 - i * 200, level: 6, win: i % 3 !== 2, kills: 100,
                        maxCount: 30, combo: 12, time: 60.5, classId: 'rifleman', ts: 1795226400000 - i * 1000
                    }));
                    const before = JSON.stringify(g.profile.data.records);
                    V60UI.renderRank(g);
                    const list = document.getElementById('v60-rank-list');
                    results.push({ n, rows: list.querySelectorAll('.v60-rank-row').length,
                        podium: list.querySelectorAll('.v118-rank-podium .v60-rank-row').length,
                        empty: !!list.querySelector('.v60-rank-empty'), unchanged: before === JSON.stringify(g.profile.data.records) });
                }
                return { title: document.querySelector('#v60-rank-page .v60-page-title').textContent,
                    source: document.querySelector('#v60-rank-page .v118-rank-source')?.textContent, results };
            });
            assert.equal(result.title, '本机战绩榜');
            assert(result.source?.includes('此设备'), JSON.stringify(result));
            for (const r of result.results) {
                assert.equal(r.rows, r.n, JSON.stringify(r));
                assert.equal(r.podium, Math.min(3, r.n), JSON.stringify(r));
                assert.equal(r.empty, r.n === 0, JSON.stringify(r));
                assert(r.unchanged, 'presentation mutated stored records');
            }
        });
        await check('armory has eight illustrated weapons and working equip/upgrade actions', async () => {
            const art = await page.evaluate(() => new Promise(resolve => {
                const image = new Image(); image.onload = () => {
                    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
                    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
                    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    let minAlpha = 255, maxAlpha = 0; const tiles = Array(8).fill(0);
                    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
                        const alpha = pixels[(y * canvas.width + x) * 4 + 3];
                        minAlpha = Math.min(minAlpha, alpha); maxAlpha = Math.max(maxAlpha, alpha);
                        if (alpha > 127) tiles[Math.floor(y / (canvas.height / 2)) * 4 + Math.floor(x / (canvas.width / 4))]++;
                    }
                    resolve({ width: image.naturalWidth, height: image.naturalHeight, minAlpha, maxAlpha, tiles });
                };
                image.onerror = () => resolve(null); image.src = 'assets/ui-v118/weapon-atlas.png';
            }));
            assert(art && art.width >= 1000 && art.height >= 500, 'weapon atlas missing or unusable');
            assert(art.minAlpha === 0 && art.maxAlpha === 255 && art.tiles.every(n => n > 1000), 'atlas must have real alpha and eight occupied tiles');
            await page.evaluate(() => {
                const g = window.__game; g.profile.data.unlockedLevel = 10; g.profile.data.coins = 10000;
                V60UI.showPage('v60-armory-page'); V60UI.renderArmory(g);
            });
            assert.equal(await page.locator('.v60-armory-row').count(), 8);
            assert.equal(await page.locator('.v60-armory-row .v118-weapon-art').count(), 8);
            assert.equal(await page.locator('#v118-armory-hero .v118-weapon-art').count(), 1);
            const shotgun = page.locator('.v60-armory-row').filter({ has: page.locator('.v60-armory-name', { hasText: '散弹枪' }) });
            await shotgun.getByRole('button', { name: '切换', exact: true }).click();
            assert.equal(await page.evaluate(() => WeaponSystem.current(window.__game.profile)), 'shotgun');
            const before = await page.evaluate(() => ({ lv: WeaponSystem.level(window.__game.profile), coins: window.__game.profile.coins, cost: WeaponSystem.upgradeCost(window.__game.profile) }));
            await page.locator('.v60-armory-row.equipped button.upgrade').click();
            const after = await page.evaluate(() => ({ lv: WeaponSystem.level(window.__game.profile), coins: window.__game.profile.coins }));
            assert.equal(after.lv, before.lv + 1); assert.equal(after.coins, before.coins - before.cost);
        });
        for (const [width, height] of [[360, 640], [390, 844], [430, 932], [768, 1024]]) {
            await check(`menus remain reachable at ${width}x${height}`, async () => {
                await page.setViewportSize({ width, height });
                for (const name of ['armory', 'rank']) {
                    await page.evaluate(name => {
                        V60UI.showPage(`v60-${name}-page`);
                        V60UI[name === 'rank' ? 'renderRank' : 'renderArmory'](window.__game);
                    }, name);
                    const state = await page.evaluate(name => {
                        const back = document.getElementById(`v60-${name}-back`).getBoundingClientRect();
                        const panel = document.querySelector(`#v60-${name}-page .title-panel`);
                        return { bottom: back.bottom, left: back.left, right: back.right, height: back.height,
                            overflow: panel.scrollWidth - panel.clientWidth, viewport: innerHeight };
                    }, name);
                    assert(state.bottom <= state.viewport && state.left >= 0 && state.right <= width, JSON.stringify(state));
                    assert(state.height >= 44 && state.overflow <= 1, JSON.stringify(state));
                }
            });
        }
        if (process.env.UI_CAPTURE_DIR) {
            fs.mkdirSync(process.env.UI_CAPTURE_DIR, { recursive: true });
            await page.setViewportSize({ width: 390, height: 844 });
            for (const name of ['armory', 'rank']) {
                await page.evaluate(name => {
                    V60UI.showPage(`v60-${name}-page`);
                    V60UI[name === 'rank' ? 'renderRank' : 'renderArmory'](window.__game);
                }, name);
                await page.screenshot({ path: path.join(process.env.UI_CAPTURE_DIR, `${name}-390x844.png`) });
            }
            for (const [name, render] of [['map', 'renderMap'], ['tech', 'renderTech'], ['codex', 'renderCodex'], ['train', 'renderTraining']]) {
                await page.evaluate(({ name, render }) => {
                    V60UI.showPage(`v60-${name}-page`); V60UI[render](window.__game);
                }, { name, render });
                await page.screenshot({ path: path.join(process.env.UI_CAPTURE_DIR, `${name}-390x844.png`) });
            }
            await page.evaluate(() => {
                const g = window.__game; V60UI.hidePages(); g._rafDisabled = true;
                g.levelIndex = 0; g.start(); g.squad.setCount(24); RandomEvents._t = 99999;
                for (let i = 0; i < 90; i++) { g.time += 1 / 60; g._update(1 / 60); }
                g.squad.addReinforcements(15, '空投补给', g.effects);
                g.time += 1 / 60; g._update(1 / 60);
                g.world.renderer.render(g.world.scene, g.world.camera);
            });
            await page.screenshot({ path: path.join(process.env.UI_CAPTURE_DIR, 'battle-390x844.png') });
        }
        await check('no browser errors', () => assert.deepEqual(errors, []));
    } finally { if (browser) await browser.close(); server.kill(); }
    process.exitCode = failed ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
