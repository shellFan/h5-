// ===== V10 全量QA: 30分钟真实稳定性测试 =====
// 真实 rAF 长跑: 多轮 L1-L3 循环 + 暂停/恢复 + 每关重启 + 每30s采样(FPS/内存/状态/错误)
// 运行: node tools/qa-v10-soak.js  输出: docs/QA/v10-soak.json

'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'QA');
const PORT = Number(process.env.QA_PORT || 8315);
const BASE = 'http://localhost:' + PORT;
const DURATION_MIN = Number(process.env.QA_SOAK_MIN || 30);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')],
        { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
    await sleep(1200);
    const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });
    const samples = [];
    let pageErrors = [];
    let totalWins = 0, totalLoses = 0, totalRestarts = 0, totalPauses = 0;
    try {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const page = await ctx.newPage();
        page.on('pageerror', e => pageErrors.push(e.message.slice(0, 150)));
        page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) pageErrors.push(m.text().slice(0, 150)); });
        await page.goto(BASE + '/index.html?qa-soak=' + Date.now(), { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad && window.__game.squad.renderer, { timeout: 60000 });
        await page.evaluate(() => { window.__game.profile._storage.remove('profile_v51'); });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 60000 });
        // 转向AI
        await page.evaluate(() => {
            if (window.__qaSteer) return;
            window.__qaSteer = setInterval(() => {
                const g = window.__game;
                if (!g || g.state !== 'playing' || g.paused) return;
                const gates = g.gates.gates; let rowZ = null;
                for (const gt of gates) if (!gt.triggered && !gt.passed && gt.z < g.squad.z - 0.5 && gt.z > g.squad.z - 18) { if (rowZ === null || gt.z > rowZ) rowZ = gt.z; }
                if (rowZ === null) return;
                let best = null, bs = -1;
                for (const gt of gates) {
                    if (gt.z !== rowZ || gt.triggered || gt.passed) continue;
                    const d = gt.data; let s = 0;
                    if (d.op === 'mul') s = g.squad.count * (d.value - 1);
                    else if (d.op === 'add') s = d.value;
                    else if (d.op === 'addpct') s = Math.max(1, Math.floor(g.squad.count * d.value / 100));
                    else if (d.op === 'skill') s = 10;
                    else s = 6;
                    if (s > bs) { bs = s; best = gt; }
                }
                if (best) { g.squad.targetX = best.x; g.squad.lane = best.data.lane; }
            }, 120);
        });
        const t0 = Date.now();
        const deadline = t0 + DURATION_MIN * 60 * 1000;
        let li = 0;
        await page.evaluate(() => { window.__game.levelIndex = 0; window.__game.start(); });
        console.log('开始 ' + DURATION_MIN + ' 分钟稳定性长跑 @ ' + new Date().toISOString());
        let lastSample = 0;
        while (Date.now() < deadline) {
            const st = await page.evaluate(() => {
                const g = window.__game;
                return { state: g.state, t: +g.elapsedTime.toFixed(0), cnt: g.squad.count, kills: g.enemies.killCount, enemies: g.enemies.enemies.length, paused: !!g.paused };
            });
            if (st.state === 'won') {
                totalWins++;
                li = (li + 1) % 3;
                await page.evaluate(li => { window.__game.levelIndex = li; window.__game.start(); }, li);
                totalRestarts++;
            } else if (st.state === 'lost') {
                totalLoses++;
                await page.evaluate(li => { window.__game.levelIndex = li; window.__game.start(); }, li);
                totalRestarts++;
            } else if (st.state === 'playing' && st.t > 240) {
                // 单局超4分钟强切(卡死检测)
                totalRestarts++;
                pageErrors.push('[soak] 单局超时4分钟强切 L' + (li + 1) + ' t=' + st.t + ' cnt=' + st.cnt);
                await page.evaluate(li => { window.__game.levelIndex = li; window.__game.start(); }, li);
            }
            // 每30分钟周期内穿插暂停/恢复(每~90s一次)
            if (st.state === 'playing' && !st.paused && Date.now() - lastSample > 90000) {
                await page.evaluate(() => window.__game._togglePause());
                await sleep(1500);
                const frozen = await page.evaluate(() => ({ t: window.__game.elapsedTime, z: window.__game.squad.z }));
                await sleep(1000);
                const frozen2 = await page.evaluate(() => ({ t: window.__game.elapsedTime, z: window.__game.squad.z }));
                if (frozen.t !== frozen2.t) pageErrors.push('[soak] 暂停期间时间仍在推进!');
                totalPauses++;
                await page.evaluate(() => window.__game._togglePause());
            }
            // 每30s采样
            if (Date.now() - lastSample > 30000) {
                lastSample = Date.now();
                const s = await page.evaluate(async () => {
                    const fps = await new Promise(res => {
                        let n = 0; const t0 = performance.now();
                        (function tick() { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(tick); else res(+(n * 1000 / (performance.now() - t0)).toFixed(1)); })();
                    });
                    const g = window.__game;
                    return {
                        min: +((Date.now() - 0) / 60000).toFixed(1),
                        fps, mem: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
                        state: g.state, cnt: g.squad.count, kills: g.enemies.killCount, enemies: g.enemies.enemies.length,
                        bullets: g.combat.bullets.length, pool: g.combat.pool.length
                    };
                });
                s.min = +((Date.now() - t0) / 60000).toFixed(1);
                samples.push(s);
                console.log(`[${s.min}min] fps=${s.fps} mem=${s.mem}MB state=${s.state} cnt=${s.cnt} kills=${s.kills} enemies=${s.enemies} bullets=${s.bullets}`);
            }
            await sleep(2000);
        }
        // 汇总
        const fpsVals = samples.map(s => s.fps).filter(v => v > 0);
        const memVals = samples.map(s => s.mem).filter(v => v > 0);
        const result = {
            durationMin: +((Date.now() - t0) / 60000).toFixed(1),
            samples, totalWins, totalLoses, totalRestarts, totalPauses,
            fps: { avg: +(fpsVals.reduce((a, b) => a + b, 0) / fpsVals.length).toFixed(1), min: Math.min(...fpsVals), max: Math.max(...fpsVals) },
            memory: { start: memVals[0], peak: Math.max(...memVals), end: memVals[memVals.length - 1], growth: +(memVals[memVals.length - 1] - memVals[0]).toFixed(1) },
            pageErrors: pageErrors.slice(0, 50), errorCount: pageErrors.length
        };
        fs.writeFileSync(path.join(OUT, 'v10-soak.json'), JSON.stringify(result, null, 2));
        console.log('\n===== 长跑结束 =====');
        console.log(`时长 ${result.durationMin}min 胜${totalWins} 负${totalLoses} 重开${totalRestarts} 暂停${totalPauses}`);
        console.log(`FPS avg=${result.fps.avg} min=${result.fps.min} max=${result.fps.max}`);
        console.log(`内存 ${result.memory.start}→${result.memory.peak}→${result.memory.end} MB (增长${result.memory.growth}MB)`);
        console.log(`JS错误 ${result.errorCount} 条`);
        if (result.memory.growth > 150) console.log('⚠ 内存增长超150MB, 需检查泄漏');
    } finally {
        await browser.close();
        cp.kill();
    }
}
main().catch(e => { console.error('soak失败:', e); process.exit(1); });
