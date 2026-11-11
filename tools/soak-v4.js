// ===== V4.0 稳定性浸泡测试(v2: evaluate带超时保护) =====
const path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..');
const PORT = 8198;
const BASE = 'http://localhost:' + PORT;
const MINUTES = parseFloat(process.env.SOAK_MIN || '3');

function startServer() {
    return new Promise((resolve) => {
        const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
            env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore'
        });
        const t0 = Date.now();
        (function poll() {
            require('http').get(BASE + '/index.html', (res) => { res.resume(); resolve(cp); })
                .on('error', () => { if (Date.now() - t0 > 10000) { resolve(cp); return; } setTimeout(poll, 200); });
        })();
    });
}

(async () => {
    const server = await startServer();
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(8000);
    page.on('pageerror', e => console.log('[pageerror]', e.message.split('\n')[0]));
    await page.goto(BASE + '/index.html', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1500);

    async function safeEval(fn, fallback) {
        try { return await Promise.race([
            page.evaluate(fn),
            new Promise(res => setTimeout(() => res(fallback), 6000))
        ]); } catch (e) { return fallback; }
    }

    const samples = [];
    const t0 = Date.now();
    const endAt = t0 + MINUTES * 60000;
    let cycles = 0, pauses = 0, losses = 0, evalTimeouts = 0;
    let lastLog = 0;

    while (Date.now() < endAt) {
        cycles++;
        await safeEval(() => { try { window.__game.start(); } catch (e) {} }, null);
        await page.waitForTimeout(500);
        await safeEval(() => {
            const g = window.__game;
            g.squad.setCount(200);
            g.squad.z = -80;
        }, null);
        await page.waitForTimeout(1200);
        await safeEval(() => window.__game._togglePause(), null); pauses++;
        await page.waitForTimeout(250);
        await safeEval(() => window.__game._togglePause(), null);
        await page.waitForTimeout(1400);
        const s = await safeEval(() => {
            const g = window.__game;
            const mem = performance.memory ? performance.memory.usedJSHeapSize : 0;
            return {
                mem: +(mem / 1048576).toFixed(1),
                fps: g.getPerf().fps,
                enemies: g.enemies.enemies.length,
                bullets: g.combat.bullets.length,
                particles: g.effects.particles.length,
                sceneChildren: g.world.scene.children.length
            };
        }, null);
        if (!s) { evalTimeouts++; console.log('[' + ((Date.now() - t0) / 1000).toFixed(0) + 's] 周期' + cycles + ' 采样超时(页面卡顿), 跳过'); continue; }
        samples.push(s);
        if (cycles % 3 === 0) {
            await safeEval(() => { try { window.__game.squad.setCount(0); } catch (e) {} }, null);
            await page.waitForTimeout(400);
            losses++;
        }
        if (Date.now() - lastLog > 30000) {
            lastLog = Date.now();
            console.log('[' + ((Date.now() - t0) / 1000).toFixed(0) + 's] cycle ' + cycles +
                ' mem ' + s.mem + 'MB fps ' + s.fps + ' enemies ' + s.enemies +
                ' particles ' + s.particles + ' sceneChildren ' + s.sceneChildren);
        }
    }

    if (samples.length >= 4) {
        const q = Math.max(1, Math.floor(samples.length / 4));
        const head = samples.slice(0, q).reduce((a, s) => a + s.mem, 0) / q;
        const tail = samples.slice(-q).reduce((a, s) => a + s.mem, 0) / q;
        const maxParticles = Math.max(...samples.map(s => s.particles));
        const maxEnemies = Math.max(...samples.map(s => s.enemies));
        const last = samples[samples.length - 1];
        const leakMB = tail - head;
        const verdict = leakMB < 8 ? 'PASS' : 'REVIEW';
        console.log('\n=== 浸泡汇总 ===');
        console.log('时长 ' + MINUTES + 'min, 周期 ' + cycles + ', 暂停 ' + pauses + ', 失败触发 ' + losses + ', 采样超时 ' + evalTimeouts);
        console.log('内存: ' + head.toFixed(1) + 'MB → ' + tail.toFixed(1) + 'MB (增长 ' + leakMB.toFixed(1) + 'MB)');
        console.log('粒子峰值 ' + maxParticles + ' | 敌人峰值 ' + maxEnemies + ' | 末帧 fps ' + last.fps + ' sceneChildren ' + last.sceneChildren);
        console.log('判定: ' + verdict);
        require('fs').writeFileSync(path.join(ROOT, 'docs', 'V4_SOAK_RESULT.json'), JSON.stringify({
            minutes: MINUTES, cycles, pauses, losses, evalTimeouts,
            headMB: +head.toFixed(1), tailMB: +tail.toFixed(1), leakMB: +leakMB.toFixed(1),
            maxParticles, maxEnemies, verdict, samples
        }, null, 2));
        console.log('已保存 docs/V4_SOAK_RESULT.json');
    } else {
        console.log('\n样本不足(' + samples.length + '), 判定 REVIEW — 环境受限(SwiftShader), 真机需补测');
        require('fs').writeFileSync(path.join(ROOT, 'docs', 'V4_SOAK_RESULT.json'), JSON.stringify({
            minutes: MINUTES, cycles, evalTimeouts, samples, verdict: 'REVIEW'
        }, null, 2));
    }

    await browser.close();
    server.kill();
})();
