// 一次性修复: E2E拖动映射测试 — 固定squad.z远离门区 + 逐步采样诊断
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'tests', 'e2e', 'run.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

const oldTest = [
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
    "    });"
].join('\n');

const newTest = [
    "    await step('V4拖动映射: 像素位移按灵敏度换算世界坐标', async () => {",
    "        // 固定状态: 远离门区(z=-2)/1人/目标归零, 消除磁吸与前序测试干扰",
    "        await gameApi(page, '(g) => { g.squad.z = -2; g.squad.targetX = 0; g.squad.x = 0; }');",
    "        await page.waitForTimeout(120);",
    "        const cw = await page.evaluate(() => document.getElementById('game-canvas').clientWidth || 390);",
    "        const maxX = await gameApi(page, '(g) => MovementMath.centerBounds(g.squad.getHalfWidth())');",
    "        const dragPx = Math.round(cw * 0.325); // 半个可玩范围(65%灵敏度的一半)",
    "        await page.mouse.move(195, 400);",
    "        await page.mouse.down();",
    "        await page.mouse.move(195 + dragPx, 400, { steps: 8 });",
    "        await page.waitForTimeout(120);",
    "        const tx = await gameApi(page, '(g) => g.squad.targetX');",
    "        await page.mouse.up();",
    "        const expect = Math.min(maxX, dragPx * (maxX * 2) / (cw * 0.65));",
    "        assert(Math.abs(tx - expect) < 0.15, '拖动' + dragPx + 'px → targetX ' + tx.toFixed(2) + ' 期望' + expect.toFixed(2));",
    "    });"
].join('\n');

if (c.indexOf(oldTest) >= 0) { c = c.replace(oldTest, newTest); console.log('drag test pinned'); }
else { console.error('drag test pattern not found'); process.exit(1); }
fs.writeFileSync(FILE, c);
console.log('saved');
