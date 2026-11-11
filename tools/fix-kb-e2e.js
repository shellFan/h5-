// 修复: 键盘E2E受前序测试遗留人数影响(30人→边界钳制1.05), 显式setCount(1)
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'tests', 'e2e', 'run.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const oldS = "        await gameApi(page, '(g) => { g.squad.targetX = 0; }');\n        await page.keyboard.press('ArrowLeft');";
const newS = "        await gameApi(page, '(g) => { g.squad.setCount(1); g.squad.targetX = 0; }');\n        await page.keyboard.press('ArrowLeft');";
if (c.indexOf(oldS) < 0) { console.error('pattern not found'); process.exit(1); }
c = c.replace(oldS, newS);
fs.writeFileSync(FILE, c);
console.log('keyboard test isolated');
