// 隔离验证 pacing 发射门控(无浏览器/rAF干扰)
const fs = require('fs'), vm = require('vm');
const files = ['js/config.js', 'js/utils.js', 'js/movement.js', 'js/pacing.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
const sandbox = { console: console };
vm.createContext(sandbox);
vm.runInContext(files + `
;globalThis.__run = function() {
  const p = new GamePacingController(null);
  p.loadFromLevel({segments:[{type:'wave',z:-20,enemies:[{type:'normal',count:120}]}]}, 2);
  p._alive = 0;
  p.spawnFn = function() { p._alive++; return {}; };
  p.aliveCountFn = function() { return p._alive; };
  const dt = 1/30;
  let t = 0, calls = 0;
  const origSpawn = p.spawnFn;
  p.spawnFn = function(a,b,c,d) { calls++; return origSpawn(a,b,c,d); };
  const log = [];
  for (let s = 0; s < 300; s++) {
    const before = calls;
    p.update(dt, {z: -30, count: 22});
    t += dt;
    if (s % 30 === 0) {
      const w = p.waves[0];
      log.push('t=' + t.toFixed(1) + ' alive=' + p._alive + ' calls/s=' + (calls - before) * 30 + ' emitTimer=' + (w.emitTimer === undefined ? 'undef' : w.emitTimer.toFixed(3)) + ' state=' + w.state + ' target=' + JSON.stringify(p._dbg ? p._dbg.aliveTarget : '?'));
    }
  }
  return log;
};
`, sandbox);
console.log(sandbox.__run().join('\n'));
