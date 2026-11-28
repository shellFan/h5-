// ==================================================================
// tests/e2e/wechat-emulator.js — 微信小游戏构建产物自动化冒烟测试 (V12)
// 方式: 浏览器内 wx 模拟层(tests/wechat-emulator-harness.html)加载 wechat-game/
//       构建产物, 用 playwright 驱动真实 WebGL + minidom UI 渲染。
// 覆盖: 入口启动 → UI 纹理挂接 → 首页 → 点击开始 → 战斗(HUD变化) → 暂停/恢复
//       → 存档落盘(wx存储) → 生命周期切后台 → 广告Mock不可用(无广告位ID如实降级)
// 注意: 这是构建产物级自动化验证, 不等同微信开发者工具/真机验证(见测试报告)
// ==================================================================
'use strict';

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '../..');
const PORT = 8125;
const SHOT_DIR = path.join(ROOT, 'docs', 'WeChat', 'screenshots');

function findBrowser() {
    const candidates = [
        { channel: 'msedge' },
        { channel: 'chrome' },
        { executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' },
        { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' }
    ];
    return candidates;
}

function startServer() {
    const server = spawn('node', [path.join(ROOT, 'tools', 'server.js')], {
        cwd: ROOT,
        env: Object.assign({}, process.env, { PORT: String(PORT) }),
        stdio: ['ignore', 'pipe', 'pipe']
    });
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('server start timeout')), 10000);
        server.stdout.on('data', d => {
            if (String(d).indexOf(PORT) !== -1 || String(d).indexOf('listening') !== -1) {
                clearTimeout(timer);
                resolve(server);
            }
        });
        server.on('error', reject);
        setTimeout(() => { clearTimeout(timer); resolve(server); }, 2500);
    });
}

async function touch(page, x, y) {
    await page.evaluate(([tx, ty]) => {
        const t = [{ identifier: 0, clientX: tx, clientY: ty }];
        wx.__emit('start', t);
        setTimeout(() => wx.__emit('end', t), 60);
    }, [x, y]);
    await page.waitForTimeout(180);
}

async function elCenter(page, id) {
    return await page.evaluate((elId) => {
        const el = window.__minidom.document.getElementById(elId);
        if (!el || !el._box) return null;
        return { x: el._box.x + el._box.w / 2, y: el._box.y + el._box.h / 2 };
    }, id);
}

async function main() {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    const server = await startServer();
    const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] }).catch(() => null)
        || await chromium.launch({ headless: true, channel: 'msedge', args: ['--enable-unsafe-swiftshader'] });

    const page = await browser.newPage({ viewport: { width: 480, height: 960 } });
    // Browser harness runs under /tests; packaged local images resolve from the mini-game root.
    await page.route(/\/tests\/assets\/art-v121\/world-materials\.jpg$/, route => route.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync(path.join(ROOT, 'wechat-game/assets/art-v121/world-materials.jpg')) }));
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
        if (msg.type() === 'error' || msg.type() === 'warning') console.log('  [console.' + msg.type() + ']', msg.text().slice(0, 220));
    });
    page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

    const results = [];
    const check = (name, ok, detail) => {
        results.push({ name, ok, detail: detail || '' });
        console.log((ok ? '  ✓ ' : '  ✗ ') + name + (detail ? ' — ' + detail : ''));
    };

    try {
        // 1. 启动
        console.log('[1] 加载模拟器与游戏入口...');
        await page.goto(`http://127.0.0.1:${PORT}/tests/wechat-emulator-harness.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction('window.__emulatorReady === true', { timeout: 10000 });
        await page.waitForFunction('window.__game !== undefined && window.__game !== null', { timeout: 60000 });
        check('微信入口启动: window.__game 就绪', true);

        // 2. UI 纹理挂接
        await page.waitForFunction('window.__uiScene !== undefined', { timeout: 20000 });
        check('minidom UI 纹理挂接(3D叠加)', true);
        const worldAtlas = await page.evaluate(async () => {
            const scenery = window.__game.world._v121Scenery;
            await scenery.ready;
            return { tiles: scenery.tiles.length, mapped: !!scenery.materials.rock.map };
        });
        check('五主题地图材质随包加载并裁切', worldAtlas.tiles === 8 && worldAtlas.mapped, JSON.stringify(worldAtlas));
        const uiStats = await page.evaluate('window.__minidom.getStats()');
        check('UI DOM 节点构建', uiStats.nodes > 100, `nodes=${uiStats.nodes}, rules=${uiStats.rules}, keyframes=${uiStats.keyframes}`);

        // 3. 首页可见(开始按钮存在且有布局)
        const startBox = await elCenter(page, 'btn-start');
        check('首页开始按钮布局', !!startBox, startBox ? JSON.stringify(startBox) : '未找到');
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(SHOT_DIR, 'wechat-home.png') });
        console.log('  截图: docs/WeChat/screenshots/wechat-home.png');

        // Inventory art must be packaged and cropped to a single atlas cell.
        await page.evaluate(() => {
            window.__atlasDrawCalls = [];
            const original = CanvasRenderingContext2D.prototype.drawImage;
            window.__restoreAtlasDraw = () => { CanvasRenderingContext2D.prototype.drawImage = original; };
            CanvasRenderingContext2D.prototype.drawImage = function(...args) {
                if (args.length === 9 && /ui-v118|ui-art/.test(String(args[0].src || ''))) window.__atlasDrawCalls.push(args.slice(1, 5));
                return original.apply(this, args);
            };
            window.__minidom.document.getElementById('v60-btn-armory').onclick();
        });
        await page.waitForTimeout(1800);
        await page.evaluate(() => { window.__minidom.document.getElementById('v60-armory-list').scrollTop = 10000; });
        await page.waitForTimeout(800);
        const artState = await page.evaluate(() => {
            const art = window.__minidom.document.querySelectorAll('.v118-weapon-art');
            const loaded = Array.from(art).filter(e => e._bgImgState === 'loaded').length;
            const textures = new Set(Array.from(art).filter(e => e._bgImg).map(e => e._bgImg)).size;
            const cells = new Set(window.__atlasDrawCalls.map(c => c.join(','))).size;
            window.__restoreAtlasDraw();
            window.__minidom.document.getElementById('v60-armory-back').onclick();
            return { count: art.length, loaded, cells, textures };
        });
        check('军械库透明图集随包加载', artState.count === 9 && artState.loaded === 9, JSON.stringify(artState));
        check('军械库8种插图按单格裁切', artState.cells === 8, JSON.stringify(artState));
        check('军械库共享单张图集解码', artState.textures === 1, JSON.stringify(artState));
        await page.waitForTimeout(300);

        // 4. 点击开始 → 进入战斗
        const readyStartBox = await elCenter(page, 'btn-start');
        await touch(page, readyStartBox.x, readyStartBox.y);
        await page.waitForFunction('window.__game.state === "playing"', { timeout: 20000 });
        check('点击开始进入战斗(state=playing)', true);

        // 5. 战斗 HUD 实时更新(人数/关卡名)
        await page.waitForTimeout(2500);
        const hud = await page.evaluate(() => {
            const c = window.__minidom.document.getElementById('squad-count-num');
            const w = window.__minidom.document.getElementById('wave');
            return { count: c ? c.textContent : null, countBox: c && c._box ? { w: c._box.w } : null };
        });
        check('战斗HUD人数渲染', hud.count !== null && hud.count !== '', `人数=${hud.count}`);
        const playing = await page.evaluate('window.__game.state');
        check('战斗状态持续', playing === 'playing');
        await page.screenshot({ path: path.join(SHOT_DIR, 'wechat-battle.png') });
        console.log('  截图: docs/WeChat/screenshots/wechat-battle.png');

        // 6. 触摸拖动(游戏画布输入桥接) — 队伍应响应移动
        const squadX0 = await page.evaluate('window.__game.squad.x');
        await page.evaluate(() => {
            const t = [{ identifier: 1, clientX: 300, clientY: 700 }];
            wx.__emit('start', t);
        });
        await page.evaluate(() => {
            const t = [{ identifier: 1, clientX: 60, clientY: 700 }];
            wx.__emit('move', t);
            wx.__emit('end', t);
        });
        await page.waitForTimeout(900);
        const squadX1 = await page.evaluate('window.__game.squad.x');
        check('拖动输入桥接(队伍移动)', Math.abs(squadX1 - squadX0) > 0.5, `x: ${squadX0.toFixed(2)} → ${squadX1.toFixed(2)}`);

        // 7. 暂停/恢复
        const pauseBox = await elCenter(page, 'btn-pause');
        if (pauseBox) {
            await touch(page, pauseBox.x, pauseBox.y);
            await page.waitForTimeout(500);
            const paused = await page.evaluate('window.__game.paused === true');
            check('暂停按钮生效', paused);
            await page.screenshot({ path: path.join(SHOT_DIR, 'wechat-pause.png') });
            console.log('  截图: docs/WeChat/screenshots/wechat-pause.png');
            const resumeBox = await elCenter(page, 'btn-resume');
            await touch(page, resumeBox.x, resumeBox.y);
            await page.waitForTimeout(400);
            const resumed = await page.evaluate('window.__game.paused === false');
            check('恢复按钮生效', resumed);
        } else {
            check('暂停按钮布局', false, '未找到 btn-pause');
        }

        // 8. 存档落盘(wx存储mock)
        const saved = await page.evaluate(() => {
            const keys = Object.keys(wx.__store);
            return { keys, hasProfile: keys.some(k => k.indexOf('profile') !== -1) };
        });
        check('存档写入 wx 存储', saved.hasProfile, `keys=${saved.keys.join(',')}`);

        // 9. 生命周期: 切后台自动暂停
        const preHide = await page.evaluate('window.__game.paused');
        await page.evaluate('wx.__emitLifecycle("hide")');
        await page.waitForTimeout(300);
        const postHide = await page.evaluate('window.__game.paused');
        check('切后台自动暂停战斗', postHide === true || preHide === true, `paused: ${preHide} → ${postHide}`);
        await page.evaluate('wx.__emitLifecycle("show")');

        // 10. 广告如实降级(未配置广告位ID → 不可用)
        const adState = await page.evaluate(() => {
            return {
                adService: !!window.__adService,
                available: window.__adService ? window.__adService.isAvailable() : null
            };
        });
        check('广告服务装配(wechat分支)', adState.adService === true);
        check('未配置广告位ID时如实不可用(不伪造)', adState.available === false, `isAvailable=${adState.available}`);

        // 11. 帧率采样(5秒战斗)
        await page.evaluate('wx.__emitLifecycle("show")');
        const pauseBox2 = await elCenter(page, 'btn-pause');
        if (pauseBox2) {
            const pausedNow = await page.evaluate('window.__game.paused');
            if (pausedNow) { const rb = await elCenter(page, 'btn-resume'); await touch(page, rb.x, rb.y); }
        }
        const fps = await page.evaluate(() => new Promise(resolve => {
            let frames = 0;
            const t0 = performance.now();
            function loop() {
                frames++;
                if (performance.now() - t0 < 5000) requestAnimationFrame(loop);
                else resolve({ fps: Math.round(frames / 5), dt: performance.now() - t0 });
            }
            requestAnimationFrame(loop);
        }));
        check('战斗帧率采样', fps.fps >= 15, `${fps.fps} FPS (模拟器软件渲染, 真机预期更高)`);

        // 12. 控制台错误审计
        const fatalErrors = consoleErrors.filter(e =>
            e.indexOf('未定义') !== -1 || e.indexOf('is not defined') !== -1 ||
            e.indexOf('null of') !== -1 || e.indexOf("Cannot read") !== -1);
        check('无致命运行时错误', fatalErrors.length === 0,
            fatalErrors.length ? fatalErrors.slice(0, 3).join(' | ').slice(0, 300) : `${consoleErrors.length}条普通日志`);

        // 13. 模拟器元信息
        const meta = await page.evaluate(() => ({
            version: window.__GAME_VERSION,
            platform: window.__platformId,
            nodes: window.__minidom.getStats().nodes
        }));
        console.log(`  元信息: 版本=${meta.version} 平台=${meta.platform} UI节点=${meta.nodes}`);
        check('平台检测为 wechat', meta.platform === 'wechat');

    } catch (err) {
        check('测试执行完成(无异常)', false, err.message);
        try {
            await page.screenshot({ path: path.join(SHOT_DIR, 'wechat-failure.png') });
            console.log('  失败现场截图: docs/WeChat/screenshots/wechat-failure.png');
        } catch (e) {}
    }

    await browser.close();
    server.kill();

    const passed = results.filter(r => r.ok).length;
    console.log(`\n======================`);
    console.log(`微信模拟器冒烟: 通过 ${passed} / ${results.length}`);
    fs.writeFileSync(path.join(ROOT, 'docs', 'WeChat', 'wechat-emulator-results.json'), JSON.stringify({
        timestamp: new Date().toISOString(),
        passed, total: results.length,
        results, consoleErrors
    }, null, 2));
    process.exit(passed === results.length ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(1); });
