// 一次性修复: run.js 中残留的旧键盘断言 + 被 bash 损坏的 samples 行
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'tests', 'e2e', 'run.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

// 1) 旧键盘测试 → V4 连续位移语义
const oldKb = [
    "        await gameApi(page, '(g) => { g.squad.lane = 1; g.squad.targetX = 0; }');",
    "        await page.keyboard.press('ArrowLeft');",
    "        await page.waitForTimeout(120);",
    "        assert(await gameApi(page, '(g) => g.squad.lane') === 0, 'lane应变为0');"
].join('\n');
const newKb = [
    "        await gameApi(page, '(g) => { g.squad.targetX = 0; }');",
    "        await page.keyboard.press('ArrowLeft');",
    "        await page.waitForTimeout(120);",
    "        const txKb = await gameApi(page, '(g) => g.squad.targetX');",
    "        assert(Math.abs(txKb - (-1.2)) < 0.01, 'V4键盘连续位移: targetX应为-1.2, 实际' + txKb);"
].join('\n');
if (c.indexOf(oldKb) >= 0) { c = c.replace(oldKb, newKb); console.log('fix1 keyboard applied'); }
else console.log('fix1 keyboard: pattern not found (skip)');

// 2) 收敛断言 → -1.2
const oldCv = "assert(Math.abs(x - (-2)) < 0.4, 'x应收敛到-2, 实际' + x);";
const newCv = "assert(Math.abs(x - (-1.2)) < 0.4, 'x应收敛到-1.2(keyStep), 实际' + x);";
if (c.indexOf(oldCv) >= 0) { c = c.replace(oldCv, newCv); console.log('fix2 converge applied'); }
else console.log('fix2 converge: not found (skip)');

// 3) samples 行(被bash清空) → 单行模板串
const BT = String.fromCharCode(96); // 反引号, 避免源码中直接出现
const oldSp = "        const samples = await gameApi(page, );";
const newSp = "        const samples = await gameApi(page, " + BT + "(g) => new Promise(res => { const xs = []; let n = 0; const iv = setInterval(() => { xs.push(g.squad.x); if (++n >= 20) { clearInterval(iv); res(xs); } }, 30); })" + BT + ");";
if (c.indexOf(oldSp) >= 0) { c = c.split(oldSp).join(newSp); console.log('fix3 samples applied'); }
else console.log('fix3 samples: not found (skip)');

fs.writeFileSync(FILE, c);
console.log('saved');
