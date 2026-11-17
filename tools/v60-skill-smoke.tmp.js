const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 150)));
  await page.goto('http://localhost:8080/index.html?v60sk=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__game && window.__game.squad.renderer, { timeout: 30000 });
  const out = await page.evaluate(() => {
    const g = window.__game;
    g.levelIndex = 1; g.start(); g.pacing.forceComplete(); g.enemies.clear(); g.gates.syncVisibility(g.pacing, 0, g.squad.z); // L2 有技能门; 波次先完成使门可选
    // 找技能门
    const skillGate = g.gates.gates.find(x => x.data.op === 'skill');
    if (!skillGate) return { err: 'no skill gate found' };
    const labels = g.gates.gates.filter(x => x.z === skillGate.z).map(x => x.data.label);
    // 传送过去选第一个
    g.squad.z = skillGate.z + 0.5; g.squad.x = skillGate.x; g.squad.targetX = skillGate.x;
    const frameLog = [];
    for (let f = 0; f < 40; f++) {
        g._update(1/30);
        if (f < 15) frameLog.push('f' + f + ' z=' + g.squad.z.toFixed(1) + ' vis=' + skillGate.model.visible + ' trig=' + skillGate.triggered);
    }
    console.log('FRAMES:', frameLog.join(' | '));
    const picked = skillGate.data.value;
    const skills = g.squad._skills;
    const triggered = skillGate.triggered;
    const visible = skillGate.model.visible;
    const dbg = g.pacing._dbg || {};
    const syncDebug = { squadZ: g.squad.z, gateZ: skillGate.z, chosen: Array.from(g.gates.chosenRows || []), canChoose: g.pacing.canChooseGate(skillGate.z), outstanding: g.enemies.encounterOutstanding };
    return { labels, picked, skills, triggered, visible, frameLog, hasSkill: Object.keys(skills || {}).length > 0 };
  });
  console.log(JSON.stringify(out, null, 1));
  console.log('ERRORS:', errs.join(' | ') || 'none');
  await browser.close();
})();
