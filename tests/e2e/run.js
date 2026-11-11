// ===== E2E 测试运行器 (Phase 7) =====
// Playwright(core) + 系统Edge/Chrome, 无需下载Chromium
// 覆盖: 首页加载/开始游戏/移动队伍/状态门/人数/自动射击/怪物死亡/Boss/通关/失败/暂停/广告模拟/刷新
// 运行: node tests/e2e/run.js  (需先 npm i playwright-core)
// 退出码: 0=全部通过 1=有失败

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');
const ROOT = path.join(__dirname, '..', '..');

// ---------- 配置 ----------
const PORT = process.env.E2E_PORT || 8123;
const BASE = 'http://localhost:' + PORT;
const HEADLESS = process.env.E2E_HEADED !== '1';
const VIEWPORT = { width: 390, height: 844 };

let _pass = 0, _fail = 0, _current = '';
const _failures = [];

function ok(name) { _pass++; console.log('  ✓ ' + name); }
function bad(name, e) {
    _fail++;
    console.log('  ✗ ' + name + '\n      ' + (e && e.message ? e.message.split('\n')[0] : e));
    _failures.push({ suite: _current, name, error: String(e && e.message || e).split('\n')[0] });
}
async function step(name, fn) {
    try { await fn(); ok(name); }
    catch (e) { bad(name, e); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'E2E断言失败'); }

// ---------- 服务器(自启动, 测试结束关闭) ----------
function startServer() {
    return new Promise((resolve) => {
        const cp = require('child_process').spawn(process.execPath, [path.join(ROOT, 'tools', 'server.js')], {
            env: Object.assign({}, process.env, { PORT: String(PORT), PATH: process.env.PATH }),
            stdio: 'ignore'
        });
        // 轮询直到可访问
        const t0 = Date.now();
        (function poll() {
            require('http').get(BASE + '/index.html', (res) => {
                res.resume();
                resolve(cp);
            }).on('error', () => {
                if (Date.now() - t0 > 10000) { resolve(cp); return; }
                setTimeout(poll, 200);
            });
        })();
    });
}

// ---------- 浏览器辅助 ----------
async function launchBrowser() {
    // 优先系统Edge, 备选Chrome(不下载Chromium)
    const candidates = [
        { channel: 'msedge' },
        { channel: 'chrome' },
        { executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
        { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' }
    ];
    for (const opt of candidates) {
        try { return await chromium.launch(Object.assign({ headless: HEADLESS }, opt)); }
        catch (e) { /* 尝试下一个 */ }
    }
    throw new Error('未找到可用的系统浏览器(Edge/Chrome)');
}

async function newPage(browser) {
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page._consoleErrors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            const t = msg.text();
            const url = (msg.location() && msg.location().url) || '';
            // favicon缺失不算游戏错误
            if (url.indexOf('favicon') >= 0 || t.indexOf('favicon') >= 0) return;
            page._consoleErrors.push(t + (url ? ' @' + url : ''));
        }
    });
    page.on('pageerror', (err) => page._consoleErrors.push(String(err)));
    return page;
}

async function gotoGame(page, query) {
    await page.goto(BASE + '/index.html' + (query || ''), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__game, { timeout: 8000 });
    await page.waitForTimeout(600);
}

/** 页面内游戏操作工具(通过__game实例) */
async function gameApi(page, expr) {
    // 注意: 传入表达式字符串必须自调用
    return page.evaluate('(function(){ var g = window.__game; return (' + expr + ')(g); })()');
}

// ---------- 测试套件 ----------
async function suiteBasics(page) {
    _current = '首页加载';
    await step('页面标题正确', async () => {
        await gotoGame(page);
        assert((await page.title()).indexOf('膨胀小队') >= 0);
    });
    await step('无JS错误(error-display为空)', async () => {
        const err = await page.evaluate(() => {
            const el = document.getElementById('error-display');
            return el ? el.textContent : '';
        });
        assert(!err, '页面JS错误: ' + err);
        assert(page._consoleErrors.length === 0, '控制台错误: ' + page._consoleErrors.join('; '));
    });
    await step('canvas/WebGL已创建', async () => {
        const info = await page.evaluate(() => ({
            w: document.getElementById('game-canvas').width,
            h: document.getElementById('game-canvas').height,
            webgl: !!window.__game.world.renderer
        }));
        assert(info.webgl && info.w > 0 && info.h > 0);
    });

    _current = '开始与暂停';
    await step('点击开始游戏 → playing', async () => {
        await page.evaluate(() => window.__game.start());
        await page.waitForTimeout(300);
        assert(await gameApi(page, '(g) => g.state') === 'playing');
    });
    await step('HUD可见/开始界面隐藏', async () => {
        const hudHidden = await page.evaluate(() => document.getElementById('hud').classList.contains('hidden'));
        const startHidden = await page.evaluate(() => document.getElementById('start-screen').classList.contains('hidden'));
        assert(!hudHidden && startHidden);
    });
    await step('暂停菜单打开/关闭', async () => {
        await page.evaluate(() => window.__game._togglePause());
        await page.waitForTimeout(100);
        let visible = await page.evaluate(() => !document.getElementById('pause-screen').classList.contains('hidden'));
        assert(visible, '暂停菜单未显示');
        assert(await gameApi(page, '(g) => g.paused') === true);
        await page.evaluate(() => window.__game._togglePause());
        await page.waitForTimeout(100);
        assert(await gameApi(page, '(g) => !g.paused') === true);
    });

    _current = '移动队伍';
    await step('键盘方向键切道(lane 1→0)', async () => {
        await gameApi(page, '(g) => { g.squad.lane = 1; g.squad.targetX = 0; }');
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(120);
        assert(await gameApi(page, '(g) => g.squad.lane') === 0, 'lane应变为0');
    });
    await step('平滑移动收敛到目标X', async () => {
        await page.waitForTimeout(700);
        const x = await gameApi(page, '(g) => g.squad.x');
        assert(Math.abs(x - (-2)) < 0.4, 'x应收敛到-2, 实际' + x);
    });
}

async function suiteGameplay(page) {
    _current = '状态门';
    await step('穿门人数增加(+5)', async () => {
        await gotoGame(page);
        await gameApi(page, '(g) => g.start()');
        // 传送到门前(V3.3关卡: 第一组门 z=-10, lane0 为 +5 门, 队伍停在门前1单位)
        await gameApi(page, '(g) => { g.squad.z = -9; g.squad.x = -2; g.squad.lane = 0; g.squad.targetX = -2; }');
        await page.waitForTimeout(500);
        const count = await gameApi(page, '(g) => g.squad.count');
        assert(count >= 6, '穿门后人数应≥6, 实际' + count);
    });
    await step('门触发后移除(无残留碰撞)', async () => {
        // 越过门后等待淡出
        await gameApi(page, '(g) => { g.squad.z = -18; }');
        await page.waitForTimeout(400);
        const left = await gameApi(page, '(g) => g.gates.gates.filter(x => x.triggered && x.z === -10).length');
        assert(left === 0, '触发的门应被移除');
    });

    _current = '自动射击';
    await step('敌人触发生成', async () => {
        await gotoGame(page);
        await gameApi(page, '(g) => { g.start(); g.squad.setCount(12); }');
        // 移到第一波(z=-42, 触发点z=-28)
        await gameApi(page, '(g) => { g.squad.z = -28; }');
        await page.waitForTimeout(800);
        const n = await gameApi(page, '(g) => g.enemies.enemies.length');
        assert(n > 0, '应有敌人生成, 实际' + n);
    });
    await step('子弹发射(弹道池回收正常)', async () => {
        await page.waitForTimeout(600);
        const info = await gameApi(page, "(g) => ({ flying: g.combat.bullets.length, pool: g.combat.pool.length })");
        assert(info.flying > 0, '应有飞行中的子弹');
        assert(info.flying + info.pool <= 120, '弹池总量不超上限');
    });
    await step('怪物可被击杀(killCount增加)', async () => {
        // 直击敌人
        await gameApi(page, "(g) => { const e = g.enemies.enemies[0]; if (e) e.takeDamage(999, g.effects); }");
        await page.waitForTimeout(700);
        const kills = await gameApi(page, '(g) => g.enemies.killCount');
        assert(kills >= 1, '击杀数应≥1');
    });

    _current = 'Boss战';
    await step('Boss生成+血条显示', async () => {
        await gameApi(page, '(g) => { g.squad.z = -132; g.squad.setCount(40); }');
        // 等待Boss生成(轮询代替固定等待, 消除时序不稳定)
        await page.waitForFunction(() => {
            const g = window.__game;
            return !!(g && g.enemies && g.enemies.boss);
        }, { timeout: 5000 }).catch(() => {});
        const boss = await gameApi(page, '(g) => g.enemies.boss ? { hp: g.enemies.boss.hp, max: g.enemies.boss.maxHp } : null');
        assert(boss, 'Boss应已生成');
        const barVisible = await page.evaluate(() => !document.getElementById('boss-bar-container').classList.contains('hidden'));
        assert(barVisible, 'Boss血条应显示');
    });
    await step('Boss掉血联动血条', async () => {
        await gameApi(page, '(g) => g.enemies.boss.takeDamage(50, g.effects)');
        await page.waitForTimeout(300);
        const w = await page.evaluate(() => document.getElementById('boss-bar-fill').style.width);
        assert(w && w !== '100%', '血条宽度应变化, 实际' + w);
    });
    await step('Boss死亡 → 通关结算', async () => {
        // 40名士兵火力可能已击杀Boss, 此处兜底: Boss存在则直杀, 否则直接等待结算
        await gameApi(page, "(g) => { if (g.enemies.boss) g.enemies.boss.takeDamage(99999, g.effects); }");
        await page.waitForTimeout(1800);
        assert(await gameApi(page, '(g) => g.state') === 'won', '应为won状态');
        const visible = await page.evaluate(() => !document.getElementById('win-screen').classList.contains('hidden'));
        assert(visible, '胜利界面应显示');
    });

    _current = '失败结算';
    await step('人数归零 → 失败界面', async () => {
        await gotoGame(page);
        await gameApi(page, '(g) => { g.start(); g.squad.setCount(0); }');
        await page.waitForTimeout(600);
        assert(await gameApi(page, '(g) => g.state') === 'lost');
        const visible = await page.evaluate(() => !document.getElementById('lose-screen').classList.contains('hidden'));
        assert(visible, '失败界面应显示');
    });
    await step('重新开始不继承错误状态(人数/进度/boss重置)', async () => {
        await page.evaluate(() => document.getElementById('btn-restart-lose').click());
        await page.waitForTimeout(400);
        const st = await gameApi(page, "(g) => ({ state: g.state, count: g.squad.count, z: g.squad.z, boss: !!g.enemies.boss, kills: g.enemies.killCount })");
        assert(st.state === 'playing');
        assert(st.count === 1, '重开人数应为1, 实际' + st.count);
        assert(!st.boss && st.kills === 0, 'Boss/击杀应清零');
    });

    _current = '人数上限';
    await step('setCount超过500被钳制', async () => {
        await gameApi(page, '(g) => g.squad.setCount(999)');
        assert(await gameApi(page, '(g) => g.squad.count') === 500);
    });
    await step('InstancedMesh渲染500人不炸', async () => {
        await page.waitForTimeout(800);
        const meshCount = await gameApi(page, '(g) => g.squad.mesh.count');
        assert(meshCount === 500);
        const err = await page.evaluate(() => {
            const el = document.getElementById('error-display');
            return el ? el.textContent : '';
        });
        assert(!err, '页面JS错误: ' + err);
    });
}

async function suiteAdMock(page) {
    // 广告E2E: 通过测试场景注入(window.__AD_TEST_SCENARIO)验证UI流程
    _current = '广告模拟(H5测试模拟器)';
    await step('场景注入: auto_complete环境生效', async () => {
        await gotoGame(page, '?adtest=auto_complete');
        const avail = await page.evaluate(() => window.Platform && Platform.ads && Platform.ads.isAvailable());
        assert(avail, 'Platform.ads应可用');
    });

    _current = '广告复活E2E';
    await step('广告完整观看 → 复活成功(人数恢复+无敌)', async () => {
        await gotoGame(page, '?adtest=auto_complete');
        await gameApi(page, '(g) => g.start()');
        await gameApi(page, '(g) => g.squad.setCount(0)');
        await page.waitForTimeout(400);
        const btnVisible = await page.evaluate(() => !document.getElementById('btn-revive').classList.contains('hidden'));
        assert(btnVisible, '失败界面应显示复活按钮');
        // 点击 → 模拟器3秒自动完整观看
        await page.evaluate(() => document.getElementById('btn-revive').click());
        await page.waitForTimeout(4600);
        assert(await gameApi(page, '(g) => g.state') === 'playing', '应复活为playing');
        const count = await gameApi(page, '(g) => g.squad.count');
        assert(count >= 5, '复活人数应≥5, 实际' + count);
        const inv = await gameApi(page, '(g) => g.squad.invulnT');
        assert(inv > 0, '应有复活无敌, 实际' + inv);
    });
    await step('二次死亡: 复活按钮隐藏(每局1次)', async () => {
        await gameApi(page, '(g) => g.squad.setCount(0)');
        await page.waitForTimeout(400);
        const btnVisible = await page.evaluate(() => !document.getElementById('btn-revive').classList.contains('hidden'));
        assert(!btnVisible, '第二次失败复活按钮应隐藏');
    });

    _current = '双倍结算E2E';
    await step('通关后广告领取双倍(限1次)', async () => {
        await gotoGame(page, '?adtest=auto_complete');
        await gameApi(page, "(g) => { g.start(); g.squad.setCount(60); g.squad.z = -136; }");
        // 等待Boss被击杀→won
        await page.waitForFunction(() => { const g = window.__game; return g && g.state === 'won'; }, { timeout: 12000 }).catch(() => {});
        assert(await gameApi(page, '(g) => g.state') === 'won', '应进入胜利状态');
        const btnVisible = await page.evaluate(() => !document.getElementById('btn-double-reward').classList.contains('hidden'));
        assert(btnVisible, '双倍按钮应显示');
        await page.evaluate(() => document.getElementById('btn-double-reward').click());
        await page.waitForTimeout(4600);
        const label = await page.evaluate(() => document.getElementById('btn-double-reward').textContent);
        assert(label.indexOf('已领取') >= 0, '按钮应变为已领取, 实际: ' + label);
        // 重开一局按钮重置
        await gameApi(page, '(g) => g.start()');
        await page.waitForTimeout(200);
        const again = await page.evaluate(() => !document.getElementById('btn-double-reward').classList.contains('hidden'));
        assert(again, '新一局双倍按钮应恢复');
    });

    _current = '广告提前关闭E2E';
    await step('提前关闭 → 不复活保持失败界面', async () => {
        await gotoGame(page, '?adtest=auto_abandon');
        await gameApi(page, '(g) => g.start()');
        await gameApi(page, '(g) => g.squad.setCount(0)');
        await page.waitForTimeout(400);
        await page.evaluate(() => document.getElementById('btn-revive').click());
        await page.waitForTimeout(2000);
        assert(await gameApi(page, '(g) => g.state') === 'lost', '提前关闭应保持lost');
        const loseVisible = await page.evaluate(() => !document.getElementById('lose-screen').classList.contains('hidden'));
        assert(loseVisible, '失败界面应保持显示');
    });
}

// ---------- 主流程 ----------
(async () => {
    let server, browser;
    try {
        server = await startServer();
        browser = await launchBrowser();
        const page = await newPage(browser);
        await suiteBasics(page);
        await suiteGameplay(page);
        await suiteAdMock(page);
        await page.close();
    } catch (e) {
        bad('E2E运行器', e);
    } finally {
        if (browser) await browser.close().catch(() => {});
        if (server) server.kill();
    }
    console.log('\n======================');
    console.log(`E2E 通过 ${_pass} / 失败 ${_fail}`);
    if (_failures.length) {
        console.log('失败明细:');
        _failures.forEach(f => console.log(`  [${f.suite}] ${f.name}: ${f.error}`));
    }
    process.exit(_fail > 0 ? 1 : 0);
})();
