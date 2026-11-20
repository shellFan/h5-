// V12视觉迭代: 单场景快速截图 (node tools/v120-shot.js combat|home|gates|boss [w] [h] [out])
'use strict';
const path = require('path');
const fs = require('fs');
const { createHarness, seededContext, waitForGameReady, watchPageErrors } = require('./v42-browser');

const mode = process.argv[2] || 'combat';
const W = Number(process.argv[3] || 390), H = Number(process.argv[4] || 844);
const OUT = process.argv[5] || ('docs/screenshots/v120-iter/' + mode + '-' + W + '.png');

async function main() {
    const harness = await createHarness({ port: 8253 }).start();
    try {
        const context = await seededContext(harness.browser, { width: W, height: H }, 2, 0x50beeefd);
        const page = await context.newPage();
        const errors = watchPageErrors(page);
        await page.goto(harness.baseUrl + '/index.html?shot=1&quality=2', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await waitForGameReady(page, 30000);
        await page.waitForTimeout(400);
        if (mode !== 'home') {
            await page.evaluate(function (m) {
                const mode = m;
                const game = window.__game;
                game.levelIndex = 0; game.start();
                if (game.pacing.clear) game.pacing.clear();
                if (game.enemies.clear) game.enemies.clear();
                game.squad.reset(mode === 'gates' ? 40 : 120);
                game.squad.x = 0; game.squad.targetX = 0; game.squad.z = 0;
                game.state = 'playing'; game.paused = false;
                game.squad.critChance = 0.2; game.squad.freezeStacks = 1; game.squad.damageBuff = 2;
                if (mode === 'combat' || mode === 'boss') {
                    const roster = ['normal', 'fast', 'shield', 'split', 'spitter', 'normal', 'fast', 'elite', 'normal', 'shield', 'split', 'fast'];
                    let i = 0;
                    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
                        const type = roster[i % roster.length];
                        game.enemies.spawnEnemy(type, (col - 1) * 2.1 + (row % 2 ? 0.35 : -0.35), -10.5 - row * 3.0, type === 'elite' ? 900 : 400);
                        i++;
                    }
                }
                if (mode === 'boss') {
                    game.enemies.spawnEnemy('boss', 0, -27, 20000, 'overlord');
                    game.enemies.boss.phaseIndex = 2;
                    document.getElementById('boss-warning').classList.remove('hidden');
                }
                if (mode === 'gates') {
                    const rows = [
                        { op: 'add', value: 20, label: '+20' },
                        { op: 'buff', value: 'crit', label: '暴击+10%' },
                        { op: 'mul', value: 3, label: '×3' },
                        { op: 'risk', value: 0, label: '-30% 输出+2' }
                    ];
                    const segments = [];
                    for (let row = 0; row < rows.length; row++) {
                        const g = rows[row];
                        segments.push({ type: 'gates', z: -10 - row * 5, gates: [0, 1, 2].map(lane => Object.assign({}, g, { lane: lane })) });
                    }
                    game.gates.loadFromLevel({ segments: segments });
                }
                for (let f = 0; f < 36; f++) game._update(1 / 60);
            }, mode);
            await page.waitForTimeout(160);
        }
        fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
        await page.screenshot({ path: OUT });
        if (errors.length) console.log('PAGE ERRORS:', errors.join(' | '));
        console.log('saved ' + OUT);
        await context.close();
    } finally { await harness.close(); }
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
