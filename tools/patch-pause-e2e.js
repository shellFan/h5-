// E2E增强: 暂停必须真正冻结游戏逻辑(位置/敌人/节奏都不推进)
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'tests', 'e2e', 'run.js');
let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

if (c.indexOf('V4暂停冻结') >= 0) { console.log('already patched'); process.exit(0); }

const anchor = [
    "    _current = '移动队伍';"
].join('\n');

const extra = [
    "    _current = 'V4暂停冻结';",
    "    await step('V4暂停冻结: 暂停时位置/敌人/节奏全部停止推进', async () => {",
    "        await gotoGame(page);",
    "        await gameApi(page, '(g) => { g.start(); g.squad.setCount(30); }');",
    "        await page.waitForTimeout(400);",
    "        await page.evaluate(() => window.__game._togglePause());",
    "        const before = await gameApi(page, '(g) => ({ z: g.squad.z, n: g.enemies.enemies.length, t: g.time, w: g.pacing.summary().map(x => x.state).join() })');",
    "        await page.waitForTimeout(900);",
    "        const after = await gameApi(page, '(g) => ({ z: g.squad.z, n: g.enemies.enemies.length, t: g.time, w: g.pacing.summary().map(x => x.state).join() })');",
    "        assert(before.z === after.z, '暂停中队伍z不得推进: ' + before.z + '→' + after.z);",
    "        assert(before.t === after.t, '暂停中游戏时间不得推进');",
    "        assert(before.n === after.n && before.w === after.w, '暂停中敌人/波次状态不得变化');",
    "        await page.evaluate(() => window.__game._togglePause());",
    "        await page.waitForTimeout(300);",
    "        const resume = await gameApi(page, '(g) => g.squad.z');",
    "        assert(resume < after.z, '恢复后应继续前进: ' + after.z + '→' + resume);",
    "    });",
    "",
    "    _current = '移动队伍';"
].join('\n');

if (c.indexOf(anchor) < 0) { console.error('anchor not found'); process.exit(1); }
c = c.replace(anchor, extra);
fs.writeFileSync(FILE, c);
console.log('pause-freeze E2E added');
