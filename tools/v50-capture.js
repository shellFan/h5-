// ===== V5.0 真实战斗截图采集 =====
// 全部截图来自真实 Game/Three.js 渲染管线(非概念图):
//   docs/screenshots/v50/
//     final-combat-390x844.png   P0: 完整战斗画面(士兵军团+多类僵尸+精英+Boss+状态门+子弹+HUD)
//     home-<w>x<h>.png           首页(6 分辨率响应式)
//     combat-<w>x<h>.png         战斗HUD(6 分辨率响应式)
//     squad-31/100/300/500-390.png  军团规模
//     boss-390.png               Boss战(血条+技能)
//     gates-390.png              状态门四稀有度
//     win-390.png / lose-390.png 结算

'use strict';

const fs = require('fs');
const path = require('path');
const {
    ROOT,
    createHarness,
    seededContext,
    waitForGameReady,
    watchPageErrors
} = require('./v42-browser');

const OUT = path.join(ROOT, 'docs', 'screenshots', 'v50');
const PORT = Number(process.env.V50_CAPTURE_PORT || 8251);
const SEED = 0x50beeefd;

// 任务书响应式矩阵
const VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1080, height: 1920 }
];

const ENEMY_TYPES = ['normal', 'fast', 'shield', 'split', 'spitter', 'elite'];

function mkdirp(dir) { fs.mkdirSync(dir, { recursive: true }); }

async function openPage(browser, baseUrl, viewport) {
    const context = await seededContext(browser, viewport, 2, SEED);
    const page = await context.newPage();
    const errors = watchPageErrors(page);
    await page.goto(`${baseUrl}/index.html?v50capture=1&quality=2`, {
        waitUntil: 'domcontentloaded', timeout: 30000
    });
    await waitForGameReady(page, 30000);
    return { context, page, errors };
}

async function shot(page, name, expected) {
    const out = path.join(OUT, name);
    await page.screenshot({ path: out });
    expected.push(out);
    console.log('captured ' + name);
}

/** 开始一局并注入真实战斗: 不暂停, 真实跑帧直到截帧 */
async function startRealCombat(page, opts) {
    const o = Object.assign({ count: 120, gates: true, enemies: true, boss: false, runFrames: 50 }, opts);
    await page.evaluate(o => {
        const game = window.__game;
        game.levelIndex = 0;
        game.start();
        // 清掉关卡自带波次, 用注入的场景保证构图可控
        if (game.pacing && game.pacing.clear) game.pacing.clear();
        if (game.enemies && game.enemies.clear) game.enemies.clear();
        game.squad.reset(o.count);
        game.squad.x = 0; game.squad.targetX = 0; game.squad.z = 0;
        game.state = 'playing'; game.paused = false;
        game.squad.critChance = 0.2;
        game.squad.freezeStacks = 1;
        game.squad.damageBuff = 2;
        // 状态门: 一排三选一(蓝/紫/金), 前方可见
        if (o.gates) {
            game.gates.loadFromLevel({ segments: [{
                type: 'gates', z: -13, gates: [
                    { lane: 0, op: 'add', value: 20, label: '+20' },
                    { lane: 1, op: 'buff', value: 'freeze', label: '冰冻弹' },
                    { lane: 2, op: 'mul', value: 3, label: '×3' }
                ]
            }] });
        }
        // 混编敌群: 三车道散布, 高血量保证截帧时仍存活(展示全部敌型)
        if (o.enemies) {
            const roster = ['normal', 'fast', 'shield', 'split', 'spitter', 'normal', 'fast', 'elite', 'normal', 'shield', 'split', 'fast'];
            let i = 0;
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 3; col++) {
                    const type = roster[i % roster.length];
                    const x = (col - 1) * 2.1 + (row % 2 ? 0.35 : -0.35);
                    const z = -10.5 - row * 3.0;
                    game.enemies.spawnEnemy(type, x, z, type === 'elite' ? 900 : 400);
                    i++;
                }
            }
        }
        if (o.boss) {
            game.enemies.spawnEnemy('boss', 0, -27, 20000, 'overlord');
            game.enemies.boss.phaseIndex = 2;
        }
        // 真实跑帧: 战斗/子弹/特效/HUD全部活跃
        for (let f = 0; f < o.runFrames; f++) {
            game._update(1 / 60);
        }
    }, o);
    await page.waitForTimeout(160);
}

async function captureViewport(browser, baseUrl, viewport, expected) {
    const { context, page, errors } = await openPage(browser, baseUrl, viewport);
    const w = viewport.width;
    try {
        await page.waitForTimeout(400);
        await shot(page, `home-${w}x${viewport.height}.png`, expected);

        // 标准战斗(无Boss)
        await startRealCombat(page, { count: 120 });
        await shot(page, `combat-${w}x${viewport.height}.png`, expected);
    } finally {
        await context.close();
    }
}

async function captureShowcase(browser, baseUrl, expected) {
    const { context, page, errors } = await openPage(browser, baseUrl, { width: 390, height: 844 });
    try {
        await page.waitForTimeout(400);

        // P0 大图: 军团+全敌型+精英+Boss+门+子弹+HUD(短跑帧保证敌群存活入镜)
        await startRealCombat(page, { count: 180, boss: true, runFrames: 32 });
        await shot(page, 'final-combat-390x844.png', expected);

        // 军团规模系列
        for (const n of [31, 100, 300, 500]) {
            await startRealCombat(page, { count: n, enemies: n <= 100, runFrames: 40 });
            await shot(page, `squad-${n}-390.png`, expected);
        }

        // Boss战特写(血条+预警)
        await startRealCombat(page, { count: 100, boss: true, enemies: false, runFrames: 30 });
        await page.evaluate(() => {
            const game = window.__game;
            document.getElementById('boss-warning').classList.remove('hidden');
        });
        await shot(page, 'boss-390.png', expected);

        // 状态门(四稀有度整排)
        await startRealCombat(page, { count: 40, enemies: false, runFrames: 20 });
        await page.evaluate(() => {
            const game = window.__game;
            game.gates.clear();
            const rows = [
                { op: 'add', value: 20, label: '+20' },
                { op: 'buff', value: 'crit', label: '暴击+10%' },
                { op: 'mul', value: 3, label: '×3' },
                { op: 'risk', value: 0, label: '-30% 输出+2' }
            ];
            const segments = rows.map((g, row) => ({
                type: 'gates', z: -10 - row * 5,
                gates: [0, 1, 2].map(lane => ({ ...g, lane }))
            }));
            game.gates.loadFromLevel({ segments });
            for (let f = 0; f < 20; f++) game._update(1 / 60);
        });
        await shot(page, 'gates-390.png', expected);

        // 胜利/失败(等待星级弹出动画完成再截帧)
        await page.evaluate(() => {
            const game = window.__game;
            game.paused = false;
            game.winScreenHide = true;
            if (game.ui.winScreen) game.ui.winScreen.classList.add('hidden');
            if (game.ui.loseScreen) game.ui.loseScreen.classList.add('hidden');
            game.squad.setCount(233);
            game.enemies.killCount = 128;
            game.maxCombo = 47;
            game.elapsedTime = 96.4;
            game._win();
        });
        await page.waitForTimeout(900);
        await shot(page, 'win-390.png', expected);
        await page.evaluate(() => {
            const game = window.__game;
            if (game.ui.winScreen) game.ui.winScreen.classList.add('hidden'); // 避免双面板叠影(非游戏缺陷, 纯构图)
            game._lose('被怪潮吞噬 · 人数不足');
        });
        await page.waitForTimeout(400);
        await shot(page, 'lose-390.png', expected);

        if (errors.length) throw new Error('browser errors: ' + errors.join(' | '));
    } finally {
        await context.close();
    }
}

async function main() {
    mkdirp(OUT);
    const harness = await createHarness({ port: PORT }).start();
    const browser = harness.browser;
    const baseUrl = harness.baseUrl;
    const expected = [];
    try {
        await captureShowcase(browser, baseUrl, expected);
        for (const viewport of VIEWPORTS) {
            await captureViewport(browser, baseUrl, viewport, expected);
        }
        const missing = expected.filter(f => !fs.existsSync(f));
        if (missing.length) throw new Error('截图缺失: ' + missing.join(', '));
        console.log(`\nV5.0 capture complete: ${expected.length} screenshots → docs/screenshots/v50/`);
    } finally {
        await harness.close();
    }
}

main().catch(err => { console.error('[v50-capture] FAILED:', err.message); process.exit(1); });
