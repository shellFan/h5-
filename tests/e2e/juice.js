'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createHarness, seededContext, waitForGameReady, watchPageErrors } = require('../../tools/v42-browser');

const baseline = process.argv.includes('--baseline');
const out = path.resolve(__dirname, '../../docs/screenshots/juice');

function play({ level, seconds = 240, reset = true, stopAtAlive = 0 }) {
    const g = window.__game;
    if (reset) {
        g.levelIndex = level;
        g.start();
        g._juiceMetrics = { samples: 0, aliveSum: 0, peak: 0, contact: null, lastKill: 0, longestGap: 0, kills: 0 };
    }
    g.paused = false;
    const m = g._juiceMetrics;
    const deadline = g.elapsedTime + seconds;
    while (g.state === 'playing' && g.elapsedTime < deadline) {
        const rows = g.gates.gates.filter(gt => !gt.triggered && !gt.passed && gt.z < g.squad.z - 1 && gt.z > g.squad.z - 16);
        const row = rows.length ? Math.max(...rows.map(gt => gt.z)) : null;
        let best = null, score = -Infinity;
        for (const gt of rows) {
            if (gt.z !== row) continue;
            const d = gt.data;
            const value = d.op === 'add' ? d.value : d.op === 'mul' ? g.squad.count * (d.value - 1)
                : d.op === 'addpct' ? g.squad.count * d.value / 100
                : d.value === 'damage2' || d.value === 'arsenal' ? 12 : 4;
            if (value > score) { best = gt; score = value; }
        }
        if (best) { g.squad.targetX = best.x; g.squad.lane = best.data.lane; }
        g.time += 1 / 60;
        g._update(1 / 60);
        const alive = g.enemies.aliveCount;
        m.samples++;
        m.aliveSum += alive;
        m.peak = Math.max(m.peak, alive);
        if (alive && m.contact === null) m.contact = g.elapsedTime;
        if (g.enemies.killCount > m.kills) {
            if (m.lastKill) m.longestGap = Math.max(m.longestGap, g.elapsedTime - m.lastKill);
            m.lastKill = g.elapsedTime;
            m.kills = g.enemies.killCount;
        }
        if (stopAtAlive && alive >= stopAtAlive) break;
    }
    g.world.render();
    g.paused = true;
    return {
        level: level + 1, state: g.state, seconds: +g.elapsedTime.toFixed(2),
        survivors: g.squad.count, kills: g.enemies.killCount, peak: m.peak,
        average: +(m.aliveSum / m.samples).toFixed(2), contact: m.contact === null ? null : +m.contact.toFixed(2),
        longestGap: +m.longestGap.toFixed(2),
        error: document.getElementById('error-overlay')?.textContent || null
    };
}

(async () => {
    fs.mkdirSync(out, { recursive: true });
    const harness = await createHarness({ port: 8267 }).start();
    try {
        const context = await seededContext(harness.browser, { width: 390, height: 844 }, 1, 0x51f00dc0);
        const page = await context.newPage();
        const errors = watchPageErrors(page);
        await page.goto(harness.baseUrl + '/?quality=1', { waitUntil: 'domcontentloaded' });
        await waitForGameReady(page);
        await page.evaluate(() => {
            const g = window.__game;
            g.profile._storage.remove('profile_v51');
            g.profile = new GameProfile(g.profile._storage, g.profile._raw);
            g.squad.profile = g.profile;
            Platform.audio.setMuted(true);
        });
        const results = [];
        for (let level = 0; level < 5; level++) {
            await page.evaluate(level => {
                const g = window.__game;
                g.profile.data.upgrades.gun = level ? 1 : 0;
            }, level);
            await page.evaluate(play, { level, seconds: level ? 9 : 7 });
            if (level === 0 || level === 2) {
                await page.screenshot({ path: path.join(out, `${baseline ? 'before' : 'after'}-L${level + 1}-390.png`) });
            }
            const result = await page.evaluate(play, { level, reset: false });
            results.push(result);
            console.log(JSON.stringify(result));
        }
        fs.writeFileSync(path.join(out, baseline ? 'before.json' : 'after.json'), JSON.stringify(results, null, 2));
        assert.deepEqual(errors, [], 'No browser errors');
        if (!baseline) {
            for (const r of results) {
                assert.equal(r.state, 'won', `L${r.level} should remain beatable`);
                assert(r.contact < 4, `L${r.level} should start combat promptly`);
            }
        }
        await context.close();
    } finally {
        await harness.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
