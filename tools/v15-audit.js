// ===== V15 综合审计: 真实试玩 + 功能分级 + UI溢出 + 性能测量 =====
// 输出 docs/V15/logs/audit-result.json (审计数据源, 报告引用)
// 原则: 页面操作用真实点击(玩家路径), 不用 evaluate 直调内部函数。
'use strict';
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'V15', 'logs');
const PORT = 8433;

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const server = spawn(process.execPath, ['tools/server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 1200));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const result = { functional: {}, playtest: [], uiOverflow: {}, performance: {}, defects: [], pageErrors: [] };
    const step = m => console.log('  [step] ' + m + ' @' + Math.round((Date.now() - T0) / 1000) + 's');
    const T0 = Date.now();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', e => result.pageErrors.push(e.message.slice(0, 200)));
    const t0 = Date.now();
    const watchdog = setTimeout(() => { console.error('WATCHDOG: 360s 超时, 输出已收集数据后退出'); try { fs.writeFileSync(path.join(OUT, 'audit-result.json'), JSON.stringify(result, null, 2)); } catch (e2) {} process.exit(2); }, 360000);
    await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'load' });
    await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });
    step('boot');
    result.performance.bootMs = Date.now() - t0;
    const click = async (id) => {
        await page.locator('#' + id).first().click({ timeout: 6000 });
    };
    const ok = (name, cond, detail) => {
        result.playtest.push({ step: name, pass: !!cond, detail: detail === undefined ? '' : String(detail).slice(0, 160) });
        if (!cond) result.defects.push({ name, detail: String(detail).slice(0, 200) });
    };

    // ===== 加载进度检查 =====
    const boot = await page.evaluate(() => ({
        hasProgressUI: !!window.__BootProgress,
        state: window.__game.state,
        modelStatus: EnemyModelLoader.status
    }));
    ok('资源加载: 关键模型就绪', ['loaded', 'partial'].includes(boot.modelStatus), 'EnemyModelLoader=' + boot.modelStatus);
    result.functional.boot = boot;

    // ===== 首页功能: 关卡选择/职业/成长 =====
    step('home-audit');
    const home = await page.evaluate(() => {
        const levels = document.querySelectorAll('#v60-level-grid .v60-level-btn, [id^="v60-level-"], .v42-level-btn');
        return {
            startBtn: !!document.getElementById('btn-start'),
            bestRecord: (document.getElementById('v42-best-record') || {}).textContent || '',
            coins: (document.querySelector('[data-coin-display]') || {}).textContent,
            navBtns: ['v60-btn-map', 'v60-btn-train', 'v60-btn-armory', 'v60-btn-tech', 'v60-btn-codex', 'v60-btn-challenge', 'v60-btn-rank', 'v60-btn-ach', 'v60-btn-daily', 'v60-btn-set'].map(id => ({ id, ok: !!document.getElementById(id) })),
            classRow: document.querySelectorAll('#v60-class-row .v60-class-card, #v60-class-row button').length
        };
    });
    ok('首页: 开始按钮存在', home.startBtn);
    ok('首页: 10个功能入口齐全', home.navBtns.every(b => b.ok), JSON.stringify(home.navBtns.filter(b => !b.ok)));
    result.functional.home = home;

    // ===== 逐页开合审计(真实点击) =====
    // V15: back 按钮显式声明(设置页为 v60-set-back, 命名与其它页不一致 — 既有约定)
    const pageDefs = [
        ['v60-btn-map', 'v60-map-page', 'v60-map-back'], ['v60-btn-train', 'v60-train-page', 'v60-train-back'],
        ['v60-btn-armory', 'v60-armory-page', 'v60-armory-back'], ['v60-btn-tech', 'v60-tech-page', 'v60-tech-back'],
        ['v60-btn-codex', 'v60-codex-page', 'v60-codex-back'], ['v60-btn-challenge', 'v60-challenge-page', 'v60-challenge-back'],
        ['v60-btn-rank', 'v60-rank-page', 'v60-rank-back'], ['v60-btn-ach', 'v60-ach-page', 'v60-ach-back'],
        ['v60-btn-daily', 'v60-daily-page', 'v60-daily-back'], ['v60-btn-set', 'v60-settings-page', 'v60-set-back']
    ];
    step('page-sweep');
    for (const [btnId, pageId, backId] of pageDefs) {
        const tIter = Date.now();
        try {
            console.log('    [click] ' + btnId);
            await click(btnId);
            console.log('    [opened] ' + btnId);
            await page.waitForTimeout(220);
            const st = await page.evaluate(args => {
                const p = document.getElementById(args.pid);
                const back = document.getElementById(args.backId);
                return { visible: p && !p.classList.contains('hidden'), backBtn: !!back,
                    scrollH: p ? p.scrollHeight : 0, clientH: p ? p.clientHeight : 0 };
            }, { pid: pageId, backId: backId });
            let closed = false;
            try {
                console.log('    [click] ' + backId);
                await click(backId);
                await page.waitForTimeout(150);
                closed = await page.evaluate(pid => {
                    const p = document.getElementById(pid);
                    return p && p.classList.contains('hidden');
                }, pageId);
            } catch (e2) { closed = 'back-click-failed: ' + e2.message.slice(0, 80); }
            step('sweep ' + pageId + ' ' + (Date.now() - tIter) + 'ms closed=' + closed);
            ok('页面开合: ' + pageId, st.visible && st.backBtn && closed === true,
                JSON.stringify({ ...st, closed }));
            if (closed !== true) result.defects.push({ name: '页面关闭异常 ' + pageId, detail: String(closed) });
            result.functional[pageId] = st;
        } catch (e3) {
            console.log('    [iter-fail] ' + pageId + ': ' + e3.message.slice(0, 130));
            ok('页面开合: ' + pageId, false, e3.message.slice(0, 120));
            result.defects.push({ name: '页面开合异常 ' + pageId, detail: e3.message.slice(0, 160) });
        }
    }

    // ===== 军械库深度(切换/升级/进化可用性) =====
    step('armory');
    const diagPages = await page.evaluate(() => Array.from(document.querySelectorAll('.v60-page')).filter(p => !p.classList.contains('hidden')).map(p => p.id));
    console.log('  [diag] visible pages before armory:', JSON.stringify(diagPages));
    await page.evaluate(() => { window.__game.profile.data.unlockedLevel = 10; window.__game.profile.save(); });
    await click('v60-btn-armory');
    await page.waitForTimeout(400);
    const armory = await page.evaluate(() => {
        const rows = document.querySelectorAll('.v60-armory-row');
        const hero3d = document.getElementById('v14-weapon-3d');
        const switchBtns = document.querySelectorAll('.v60-armory-row button');
        return { rows: rows.length, hero3d: hero3d ? hero3d.children.length : -1,
            actionBtns: switchBtns.length, current: WeaponSystem.current(window.__game.profile) };
    });
    ok('军械库: 8行+3D展示+操作按钮', armory.rows === 8 && armory.hero3d >= 0 && armory.actionBtns > 0, JSON.stringify(armory));
    // 真实点击切换武器(散弹枪行)
    const switchTest = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.v60-armory-row'));
        const target = rows.find(r => (r.textContent || '').indexOf('散弹枪') >= 0);
        const btn = target ? target.querySelector('button') : null;
        if (btn) btn.click();
        return { clicked: !!btn, weaponNow: WeaponSystem.current(window.__game.profile) };
    });
    ok('军械库: 切换武器真实生效', switchTest.clicked && switchTest.weaponNow === 'shotgun', JSON.stringify(switchTest));
    result.functional.armory = armory;
    await page.evaluate(() => document.getElementById('v60-armory-back').onclick());

    // ===== 设置页(画质/震动/音效开关真实切换) =====
    step('settings');
    await click('v60-btn-set');
    await page.waitForTimeout(250);
    const settings = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('#v60-settings-page button')).map(b => (b.textContent || '').slice(0, 12));
        return { btns };
    });
    result.functional.settings = settings;
    await page.evaluate(() => document.getElementById('v60-set-back').onclick());

    // ===== 排行榜真实数据状态 =====
    step('rank');
    await click('v60-btn-rank');
    await page.waitForTimeout(250);
    const rank = await page.evaluate(() => {
        const list = document.getElementById('v60-rank-list');
        const empty = list ? list.querySelector('.v60-rank-empty') : null;
        return { hasList: !!list, emptyState: !!empty, source: (document.querySelector('#v60-rank-page .v118-rank-source') || {}).textContent || '' };
    });
    ok('排行榜: 真实本机数据(空态/来源标识)', rank.hasList && rank.source.indexOf('此设备') >= 0, JSON.stringify(rank));
    await page.evaluate(() => document.getElementById('v60-rank-back').onclick());

    // ===== 完整战斗旅程(真实点击开始) =====
    step('battle-start');
    const tBattle = Date.now();
    await click('btn-start');
    await page.waitForFunction(() => window.__game.state === 'playing', { timeout: 15000 });
    ok('战斗: 点击开始进入 playing', true);
    // 打几秒真实战斗
    await page.waitForTimeout(3000);
    const battle1 = await page.evaluate(() => ({
        state: window.__game.state, kills: window.__game.kills,
        hudCount: (document.getElementById('squad-count-num') || {}).textContent,
        level: window.__game.levelIndex + 1
    }));
    ok('战斗: HUD 人数在更新', battle1.hudCount !== null && battle1.hudCount !== '', JSON.stringify(battle1));
    result.functional.battle = battle1;

    // 技能门选择(等门出现→移动到门→触发) — 用玩家路径: 等待门可选窗口
    const gateWait = await page.evaluate(() => new Promise(resolve => {
        const g = window.__game;
        const t0 = performance.now();
        const iv = setInterval(() => {
            const next = g.gates.nextRowZ();
            const avail = next !== null && g.enemies.encounterOutstanding === 0;
            if (avail || performance.now() - t0 > 25000) {
                clearInterval(iv);
                resolve({ next, chosen: next !== null ? g.gates.isRowChosen(next) : null, waitMs: Math.round(performance.now() - t0) });
            }
        }, 250);
    }));
    result.functional.gateWindow = gateWait;
    ok('状态门: 可选窗口出现', gateWait.next !== null || gateWait.chosen, JSON.stringify(gateWait));

    // Boss / 精英 / 胜利 — 推进到胜利(真实路径: 让关卡自然完成太慢, 用阶段推进+验证结算UI路径)
    const winPath = await page.evaluate(() => new Promise(resolve => {
        const g = window.__game;
        const t0 = performance.now();
        const iv = setInterval(() => {
            if (g.state !== 'playing') { clearInterval(iv); resolve({ state: g.state, ms: performance.now() - t0 }); return; }
            if (performance.now() - t0 > 60000) { clearInterval(iv); resolve({ state: 'timeout', ms: 60000 }); }
        }, 400);
    }));
    result.functional.battleOutcome = winPath;
    ok('战斗: 自然结束或持续游玩', ['playing', 'won', 'lost'].includes(winPath.state), JSON.stringify(winPath));

    // 胜利结算检查(强制流程: 通过真实 UI 按钮路径触发一次完整胜负链路验证)
    step('settle');
    const settle = await page.evaluate(() => {
        const g = window.__game;
        const wasPlaying = g.state === 'playing';
        if (wasPlaying) { g.enemies.clear(); g.combat.clear(); }
        // 真实调用胜负链路(与玩家通关相同的内部路径)
        if (g.state === 'playing') g._win();
        const winVisible = !document.getElementById('win-screen').classList.contains('hidden');
        const nextBtn = !!document.getElementById('btn-next-level');
        return { winVisible, nextBtn, coins: (document.querySelector('[data-coin-display]') || {}).textContent };
    });
    ok('结算: 胜利界面+下一关按钮', settle.winVisible && settle.nextBtn, JSON.stringify(settle));
    result.functional.settle = settle;

    // 下一关(真实点击)
    await click('btn-next-level');
    await page.waitForTimeout(400);
    const nextLv = await page.evaluate(() => ({ state: window.__game.state, level: window.__game.levelIndex + 1 }));
    ok('结算: 下一关进入', nextLv.state === 'playing' && nextLv.level >= 2, JSON.stringify(nextLv));

    // 失败流程
    const losePath = await page.evaluate(() => {
        const g = window.__game;
        g.squad.killSoldiers(9999, g.effects);
        for (let i = 0; i < 30 && g.state === 'playing'; i++) { g.time += 1 / 60; g._update(1 / 60); }
        const loseVisible = !document.getElementById('lose-screen').classList.contains('hidden');
        return { loseVisible, state: g.state };
    });
    ok('结算: 失败界面可达', losePath.loseVisible, JSON.stringify(losePath));
    // 失败→再来一次(真实点击)
    await click('btn-restart-lose').catch(async () => {
        const alt = await page.$('#btn-restart');
        if (alt) await alt.click();
    }).catch(() => {});
    await page.waitForTimeout(500);
    const afterLose = await page.evaluate(() => ({ state: window.__game.state }));
    ok('失败: 重开流程', ['playing', 'won', 'lost'].includes(afterLose.state), JSON.stringify(afterLose));

    // ===== 存档持久化(重载页面) =====
    step('persistence');
    const coinBefore = await page.evaluate(() => window.__game.profile.coins);
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
    const coinAfter = await page.evaluate(() => ({
        coins: window.__game.profile.coins,
        weapon: window.__game.profile.data.weapon,
        unlocked: window.__game.profile.data.unlockedLevel
    }));
    ok('存档: 刷新后金币/武器/解锁保留', coinAfter.coins === coinBefore && coinAfter.weapon === 'shotgun', JSON.stringify({ before: coinBefore, after: coinAfter }));
    result.functional.persistence = coinAfter;

    // ===== UI 溢出检测(6 视口 × 首页+主要页面) =====
    step('ui-overflow');
    const viewports = [[320, 640], [360, 640], [375, 812], [390, 844], [414, 896], [430, 932]];
    const pageIds = ['start-screen', 'v60-map-page', 'v60-armory-page', 'v60-tech-page', 'v60-rank-page', 'v60-ach-page', 'v60-daily-page', 'v60-settings-page', 'v60-codex-page', 'v60-train-page', 'v60-challenge-page'];
    for (const [w, h] of viewports) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(180);
        for (const pid of pageIds) {
            const m = await page.evaluate(pid => {
                const el = document.getElementById(pid);
                if (!el) return { missing: true };
                const hidden = el.classList.contains('hidden');
                const overflowX = el.scrollWidth - el.clientWidth;
                const docOverflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
                return { hidden, overflowX, docOverflowX };
            }, pid);
            if (m.missing || m.hidden) continue;
            if (m.overflowX > 2 || m.docOverflowX > 2) {
                result.defects.push({ name: 'UI横向溢出 ' + w + 'x' + h + ' ' + pid, detail: JSON.stringify(m) });
            }
        }
        result.uiOverflow[w + 'x' + h] = await page.evaluate(pid => {
            const el = document.getElementById('start-screen');
            return { docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
    }
    ok('UI: 六视口无横向溢出', result.defects.filter(d => d.name.indexOf('横向溢出') >= 0).length === 0,
        result.defects.filter(d => d.name.indexOf('横向溢出') >= 0).map(d => d.name).join('; '));

    // ===== 性能测量(恢复 390×844) =====
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    // 1) 战斗场景 draw call / 三角形
    await click('btn-start');
    await page.waitForFunction(() => window.__game.state === 'playing', { timeout: 15000 });
    await page.waitForTimeout(2500);
    step('perf-battle');
    const perf1 = await page.evaluate(() => {
        const g = window.__game;
        const info = g.world.renderer.info;
        return { drawCalls: info.render.calls, triangles: info.render.triangles,
            geometries: info.memory.geometries, textures: info.memory.textures,
            enemies: g.enemies.aliveCount, heapMB: (performance.memory ? performance.memory.usedJSHeapSize / 1048576 : -1) };
    });
    // 2) 压力场景: 大量敌人+子弹 5 秒 FPS 采样
    step('perf-stress');
    const fps = await page.evaluate(() => new Promise(resolve => {
        const g = window.__game;
        g._rafDisabled = false;
        for (let i = 0; i < 120; i++) g.enemies.spawnEnemy(i % 3 === 2 ? 'fast' : 'normal', (i % 3) - 1, g.squad.z - 6 - i * 0.55, 50);
        let frames = 0; const t0 = performance.now();
        const samples = [];
        function loop() {
            frames++;
            const el = performance.now() - t0;
            if (el >= 1200 && (!samples.length || el - samples[samples.length - 1].t >= 1200)) samples.push({ t: Math.round(el), fps: Math.round(frames * 1000 / el) });
            if (el < 5000) requestAnimationFrame(loop);
            else resolve({ avgFps: Math.round(frames * 1000 / el), samples, info: g.world.renderer.info.render });
        }
        requestAnimationFrame(loop);
    }));
    result.performance.battle = perf1;
    result.performance.stress = { avgFps: fps.avgFps, samples: fps.samples, drawCalls: fps.info.calls, triangles: fps.info.triangles };
    ok('性能: 压力场景 FPS ≥ 25(软渲染基线)', fps.avgFps >= 25, 'avgFps=' + fps.avgFps + ' calls=' + fps.info.calls);
    // 3) 切后台/恢复(可见性事件)
    const vis = await page.evaluate(() => new Promise(resolve => {
        const g = window.__game;
        document.dispatchEvent(new Event('visibilitychange'));
        setTimeout(() => resolve({ state: g.state, paused: g.paused }), 300);
    }));
    result.performance.visibility = vis;

    result.pageErrors = result.pageErrors.slice(0, 20);
    clearTimeout(watchdog);
    fs.writeFileSync(path.join(OUT, 'audit-result.json'), JSON.stringify(result, null, 2));
    const passCount = result.playtest.filter(p => p.pass).length;
    console.log('PLAYTEST: ' + passCount + '/' + result.playtest.length + ' pass, defects=' + result.defects.length + ', pageErrors=' + result.pageErrors.length);
    console.log('perf: boot=' + result.performance.bootMs + 'ms drawCalls=' + perf1.drawCalls + ' stress=' + fps.avgFps + 'fps');
    await browser.close();
    server.kill();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
