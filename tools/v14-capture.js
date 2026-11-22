// ===== V14 截图采集: docs/V14/screenshots (全部来自真实运行) =====
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'V14', 'screenshots');
const PORT = 8421;
(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const server = spawn(process.execPath, ['tools/server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 1200));
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message.slice(0, 160)));
    await page.goto('http://localhost:' + PORT + '/');
    await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
    await page.waitForTimeout(1000);
    const shot = async name => page.screenshot({ path: path.join(OUT, name + '.png') });
    const step = async (frames) => page.evaluate(fr => {
        const g = window.__game; g._rafDisabled = true;
        for (let i = 0; i < (fr || 1); i++) { g.time += 1 / 60; g._update(1 / 60); }
        g.world.renderer.render(g.world.scene, g.world.camera);
    }, frames);

    // 1. 首页 + 底部
    await shot('01-home');
    await page.evaluate(() => { const p = document.querySelector('#start-screen'); if (p) p.scrollTop = 99999; });
    await page.waitForTimeout(200);
    await shot('02-home-bottom');
    await page.evaluate(() => { const p = document.querySelector('#start-screen'); if (p) p.scrollTop = 0; });

    // 2. 战斗 HUD / 普通战斗 / 大量僵尸
    await page.evaluate(() => {
        const g = window.__game; g.levelIndex = 0; g.start(); g.squad.setCount(24);
        for (const [t, x, dz] of [['normal', -2, 7], ['normal', 0, 8], ['normal', 2, 9], ['fast', 0, 11]])
            g.enemies.spawnEnemy(t, x, g.squad.z - dz, 60);
    });
    await step(6);
    await shot('03-battle-hud');
    await page.evaluate(() => {
        const g = window.__game;
        for (let i = 0; i < 30; i++) g.enemies.spawnEnemy(i % 3 === 2 ? 'fast' : 'normal', (i % 3) - 1, g.squad.z - 8 - i * 1.2, 80);
    });
    await step(4);
    await shot('04-battle-mass');
    await page.evaluate(() => { const g = window.__game; g.enemies.enemies.clear && 0; });

    // 3. Boss 战
    await page.evaluate(() => {
        const g = window.__game; g.enemies.clear(); g.combat.clear();
        g.enemies.bossStyle = 'overlord';
        g.squad.setCount(60);
        const boss = g.pacing.spawnFn('boss', 0, g.squad.z - 12, 0);
        g.enemies.boss = boss;
        for (let i = 0; i < 10; i++) { g.time += 1 / 60; g._update(1 / 60); }
        g.world.renderer.render(g.world.scene, g.world.camera);
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => { const g = window.__game; g.world.renderer.render(g.world.scene, g.world.camera); });
    await shot('05-boss-battle');

    // 4. 状态门
    await page.evaluate(() => {
        const g = window.__game; g.enemies.clear(); g.combat.clear(); g.pacing.forceComplete();
        g.squad.setCount(30); g.squad.z = -30; g.pacing.restTimer = 99999;
    });
    await step(8);
    await shot('06-gates');

    // 5. 技能门(三选一)
    await page.evaluate(() => {
        const g = window.__game;
        g.levelIndex = 5; g.start(); g.pacing.forceComplete(); g.squad.setCount(30); g.squad.z = -28; g.pacing.restTimer = 99999;
    });
    await step(8);
    await shot('07-skill-gates');

    // 6. 各功能页面
    const pages = [['armory', 'renderArmory', '08-armory-3d'], ['tech', 'renderTech', '09-tech'], ['rank', 'renderRank', '10-rank'], ['map', 'renderMap', '11-map'], ['train', 'renderTraining', '12-train'], ['codex', 'renderCodex', '13-codex'], ['challenge', 'renderChallenges', '14-challenge'], ['ach', 'renderAchievements', '15-ach'], ['daily', 'renderDaily', '16-daily'], ['settings', 'renderSettings', '17-settings']];
    for (const [name, render, file] of pages) {
        await page.evaluate(([n, r]) => {
            const g = window.__game;
            if (n === 'armory') { g.profile.data.unlockedLevel = 10; g.profile.data.coins = 12000; }
            window.V60UI.showPage('v60-' + n + '-page'); window.V60UI[r](g);
        }, [name, render]);
        await page.waitForTimeout(name === 'armory' ? 900 : 200);
        await shot(file);
    }

    // 7. 装备页(军械库内 equip) — 复用 armory 滚动到底
    await page.evaluate(() => { window.V60UI.showPage('v60-armory-page'); window.V60UI.renderArmory(window.__game); });
    await page.waitForTimeout(600);
    await shot('08b-armory-list');

    // 8. 胜利 / 失败结算
    await page.evaluate(() => {
        const g = window.__game; window.V60UI.hidePages && window.V60UI.hidePages();
        g._rafDisabled = true; g.levelIndex = 0; g.start(); g.squad.setCount(40);
        for (let i = 0; i < 30; i++) { g.time += 1 / 60; g._update(1 / 60); }
        g._win();
    });
    await page.waitForTimeout(300);
    await shot('18-victory');
    await page.evaluate(() => {
        const g = window.__game;
        document.getElementById('btn-next-level') && document.getElementById('btn-next-level').click();
        g.state = 'playing';
        g.enemies.spawnEnemy('normal', 0, g.squad.z - 3, 99999);
        g.enemies.spawnEnemy('fast', 1, g.squad.z - 3.5, 99999);
        for (let i = 0; i < 25; i++) { g.time += 1 / 60; g._update(1 / 60); }
        g._lose();
    });
    await page.waitForTimeout(300);
    await shot('19-defeat');

    // 9. 移动端小屏 320×640(重载页面取全新首页状态)
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('http://localhost:' + PORT + '/');
    await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
    await page.waitForTimeout(800);
    await shot('20-mobile-320x640-home');
    await page.evaluate(() => {
        const g = window.__game; g._rafDisabled = true;
        g.levelIndex = 0; g.start(); g.squad.setCount(20);
        g.enemies.spawnEnemy('normal', -1, g.squad.z - 6, 60);
        g.enemies.spawnEnemy('normal', 1, g.squad.z - 7, 60);
        for (let i = 0; i < 10; i++) { g.time += 1 / 60; g._update(1 / 60); }
        g.world.renderer.render(g.world.scene, g.world.camera);
    });
    await shot('21-mobile-320x640-battle');

    // 微信截图复制
    const wDir = path.join(ROOT, 'docs', 'WeChat', 'screenshots');
    for (const w of ['wechat-home.png', 'wechat-battle.png']) {
        const src = path.join(wDir, w);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT, '22-' + w));
    }

    console.log('captured to', OUT);
    console.log('pageErrors:', errors.length ? errors : 'none');
    await browser.close();
    server.kill();
})().catch(e => { console.error('FATAL', e.message); process.exitCode = 1; });
