// V18.0 商业升级专项测试: 严格1人开局、精简增兵门、统一伤害入口与DamageTrace、广告复活闭环
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
let pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.error('  ✗ FAIL: ' + msg); }
}

const ctx = { console, Math, Object, Array, Number, String, Boolean };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8'), ctx);
const LEVELS = vm.runInContext('LEVELS', ctx);

console.log('\n■ V18.0 严格1人开局与精简增兵门 (L1-L3无×2/无大额膨胀)');
assert(LEVELS.every(l => l.startCount === 1), 'L1-L10 所有关卡 startCount 严格为 1');
const l1FirstGates = LEVELS[0].segments.find(s => s.type === 'gates').gates.map(g => g.value);
assert(Math.max(...l1FirstGates) <= 3 && Math.min(...l1FirstGates) === 1, `L1 首排增兵门克制为 [${l1FirstGates.join(', ')}]`);
const l1to3HasMul = LEVELS.slice(0, 3).some(l => l.segments.some(s => s.type === 'gates' && s.gates.some(g => g.op === 'mul')));
assert(!l1to3HasMul, 'L1-L3 禁止出现常规 ×2 翻倍门');

console.log('\n■ V18.0 源码级契约: 统一伤害入口 / 1人开局 / 跳过广告复活');
const squadSrc = fs.readFileSync(path.join(ROOT, 'js/squad.js'), 'utf8');
const gameSrc = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
const adSrc = fs.readFileSync(path.join(ROOT, 'js/ads/web-mock-ad.js'), 'utf8');
const enemiesSrc = fs.readFileSync(path.join(ROOT, 'js/enemies.js'), 'utf8');

assert(squadSrc.includes('applySquadDamage(') && squadSrc.includes('__damageTrace'), 'js/squad.js 实现统一伤害入口 applySquadDamage 与 DamageTrace');
assert(enemiesSrc.includes('applySquadDamage') && enemiesSrc.includes('squadHalfW + 0.35'), 'js/enemies.js 酸液/炸弹/自爆均走真实2D碰撞与统一伤害入口');
assert(gameSrc.includes('this.squad.reset(1);'), 'js/game.js start() 严格1人开局');
assert(gameSrc.includes('Math.ceil(peak * 0.4)') && gameSrc.includes('RandomEvents.onRevive()'), 'js/game.js _applyRevive 按40%峰值(1~12人)+3s无敌+击退+8s危机保护实现');
assert(adSrc.includes('跳过广告'), 'js/ads/web-mock-ad.js 开发期支持一键跳过广告立即复活');

console.log('\n======================');
console.log('V18.0 商业升级测试: 通过 ' + pass + ' / 失败 ' + fail);
if (fail > 0) process.exit(1);
