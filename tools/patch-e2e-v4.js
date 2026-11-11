// 一次性补丁: 向 tests/e2e/run.js 注入 V4 移动手感 E2E 用例
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'tests', 'e2e', 'run.js');
let c = fs.readFileSync(FILE, 'utf8');
if (c.indexOf('V4拖动映射') >= 0) { console.log('already patched'); process.exit(0); }

const anchor = [
    "    await step('平滑移动收敛到目标X', async () => {",
    "        await page.waitForTimeout(700);",
    "        const x = await gameApi(page, '(g) => g.squad.x');",
    "        assert(Math.abs(x - (-1.2)) < 0.4, 'x应收敛到-keyStep(1.2), 实际' + x);",
    "    });",
    "}"
].join('\n');

const extra = [
    "    await step('平滑移动收敛到目标X', async () => {",
    "        await page.waitForTimeout(700);",
    "        const x = await gameApi(page, '(g) => g.squad.x');",
    "        assert(Math.abs(x - (-1.2)) < 0.4, 'x应收敛到-keyStep(1.2), 实际' + x);",
    "    });",
    "",
    "    // ===== V4.0 移动手感专项 =====",
    "    await step('V4拖动映射: 像素位移按灵敏度换算世界坐标', async () => {",
    "        await gameApi(page, '(g) => { g.squad.targetX = 0; g.squad.x = 0; }');",
    "        const cw = await page.evaluate(() => document.getElementById('game-canvas').clientWidth || 390);",
    "        const maxX = await gameApi(page, '(g) => MovementMath.centerBounds(g.squad.getHalfWidth())');",
    "        const dragPx = Math.round(cw * 0.325); // 半个可玩范围(65%灵敏度的一半)",
    "        await page.mouse.move(195, 400);",
    "        await page.mouse.down();",
    "        await page.mouse.move(195 + dragPx, 400, { steps: 8 });",
    "        await page.waitForTimeout(80);",
    "        const tx = await gameApi(page, '(g) => g.squad.targetX');",
    "        await page.mouse.up();",
    "        const expect = Math.min(maxX, dragPx * (maxX * 2) / (cw * 0.65));",
    "        assert(Math.abs(tx - expect) < 0.15, '拖动' + dragPx + 'px → targetX ' + tx.toFixed(2) + ' 期望' + expect.toFixed(2));",
    "    });",
    "    await step('V4平滑跟随: 无单帧位置跳变', async () => {",
    "        await gameApi(page, '(g) => { g.squad.targetX = 2.0; }');",
    "        const samples = await gameApi(page, '(g) => new Promise(res => {",
    "            const xs = []; let n = 0;",
    "            const iv = setInterval(() => { xs.push(g.squad.x); if (++n >= 20) { clearInterval(iv); res(xs); } }, 30);",
    "        })');",
    "        let maxJump = 0;",
    "        for (let i = 1; i < samples.length; i++) maxJump = Math.max(maxJump, Math.abs(samples[i] - samples[i - 1]));",
    "        assert(maxJump < 0.45, '30ms采样最大跳变' + maxJump.toFixed(3) + ' 应平滑(<0.45)');",
    "    });",
    "    await step('V4边界: 500人军团人群边缘不出路且侧门可达', async () => {",
    "        await gameApi(page, '(g) => { g.squad.setCount(500); g.squad.targetX = 99; g.squad.x = 99; }');",
    "        await page.waitForTimeout(300);",
    "        const info = await gameApi(page, '(g) => ({ x: g.squad.x, half: g.squad.getHalfWidth(), tx: g.squad.targetX })');",
    "        const edge = info.x + info.half;",
    "        assert(edge <= 3.41, '人群边缘' + edge.toFixed(2) + ' ≤ 路半宽3.4(含容差)');",
    "        const win = await gameApi(page, '(g) => MovementMath.gateTriggerWindow(0.9, g.squad.getHalfWidth())');",
    "        assert(Math.abs(info.x) + win > 2, '边界处可触发侧门: |x|+win=' + (Math.abs(info.x) + win).toFixed(2));",
    "        await gameApi(page, '(g) => { g.squad.setCount(1); g.squad.targetX = 0; }');",
    "    });",
    "}"
].join('\n');
if (c.indexOf(anchor) < 0) { console.error('anchor not found'); process.exit(1); }
c = c.replace(anchor, extra);
fs.writeFileSync(FILE, c);
console.log('added 3 V4 movement E2E tests');
