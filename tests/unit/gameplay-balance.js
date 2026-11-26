// V15-GAMEPLAY-001 玩法平衡与医疗/随机事件/后半段补怪回归测试
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
let pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.error('  ✗ FAIL: ' + msg); }
}

const ctx = {
    console, Math, Date, Object, Array, Number, String, Boolean, JSON,
    clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
    document: { getElementById: () => null },
    THREE: {
        Group: class { add() {} },
        Vector3: class { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} }
    }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/classes.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/random-events.js'), 'utf8'), ctx);

// 1. 怪物基础 HP 与关卡倍率检查
console.log('\n■ V15-GAMEPLAY-001 怪物基础HP与关卡倍率');
const Z = vm.runInContext('CONFIG.ZOMBIE', ctx);
const MUL = vm.runInContext('CONFIG.ENEMY_HP_MULTIPLIER', ctx);
const LEVELS = vm.runInContext('LEVELS', ctx);
assert(Z.normal.hp === 10 && Z.fast.hp === 7 && Z.split.hp === 12 && Z.spitter.hp === 11, '基础小怪HP: normal=10/fast=7/split=12/spitter=11 (V18.0校准)');
assert(Z.thrower && Z.thrower.hp === 16 && Z.thrower.speed === 1.15 && Z.flanker && Z.flanker.hp === 9 && Z.flanker.speed === 2.15, 'V18.0投弹怪(thrower hp=16)与路边伏击怪(flanker hp=9)');
assert(Z.bomber.hp === 16 && Z.shield.hp === 28 && Z.elite.hp === 65 && Z.boss.hp === 200, '重型怪HP提升至 bomber=16/shield=28/elite=65, boss=200不变');
assert(MUL.length === 10 && MUL[0] < MUL[9], '10关HP倍率单调递增');
assert(LEVELS[4].segments.some(s => s.type === 'boss' && s.boss.hp === 2600), 'L5 Boss独立血量2600保持不变');

// 2. 关卡后半段补怪验证
console.log('\n■ V15-GAMEPLAY-001 关卡后半段补怪');
const lastWaveZ = (lvl) => Math.min(...lvl.segments.filter(s => s.type === 'wave').map(s => s.z));
assert(lastWaveZ(LEVELS[0]) === -91 && LEVELS[0].totalZ === -89, 'L1后半段补齐至z=-91 (终点自动对齐-89, 零空跑)');
assert(lastWaveZ(LEVELS[1]) === -99 && LEVELS[1].totalZ === -97, 'L2后半段补齐至z=-99 (终点自动对齐-97, 零空跑)');
assert(lastWaveZ(LEVELS[2]) === -118 && LEVELS[2].totalZ === -116, 'L3后半段补齐至z=-118 (终点自动对齐-116, 零空跑)');
assert(lastWaveZ(LEVELS[3]) === -121 && LEVELS[3].totalZ === -119, 'L4后半段补齐至z=-121 (终点自动对齐-119, 零空跑)');
assert(lastWaveZ(LEVELS[4]) === -141, 'L5 Boss前补齐至z=-141 (距Boss 9m)');
assert(lastWaveZ(LEVELS[9]) === -196, 'L10 Boss前补齐至z=-196 (距Boss 12m)');

// 3. 随机危机事件招募上限与冷却验证 (V18.0: 危机75%/中性10%/补给15%, 单局招募上限6人)
console.log('\n■ V18.0 随机危机事件系统与招募控制');
const RE = vm.runInContext('RandomEvents', ctx);
const DEFS = vm.runInContext('RANDOM_EVENT_DEFS', ctx);
const airdrop = DEFS.find(d => d.id === 'airdrop');
const medkit = DEFS.find(d => d.id === 'medkit');
const badWeight = DEFS.filter(d => d.type === 'bad').reduce((s, d) => s + d.weight, 0);
const goodWeight = DEFS.filter(d => d.type === 'good').reduce((s, d) => s + d.weight, 0);
assert(DEFS.length === 15 && badWeight === 75 && goodWeight === 15, 'V18.0完整15事件池: 危机75% / 中性10% / 补给15%');

const mockSquad = {
    count: 12, alive: true, recoverableLoss: 0, _medShield: 0, _medShieldT: 0,
    addReinforcements(n) { this.count += n; return n; },
    healSquad(amt, src) {
        if (this.recoverableLoss > 0) {
            const r = Math.min(amt, this.recoverableLoss);
            this.count += r; this.recoverableLoss -= r; return r;
        }
        if (this._medShield < 2) { this._medShield = Math.min(2, this._medShield + (src === 'medkit' ? 2 : 1)); this._medShieldT = 8; }
        return 0;
    }
};
const mockGame = { state: 'playing', paused: false, squad: mockSquad, profile: null, effects: null };

RE.reset();
assert(RE._t >= 25, '首次随机事件 >= 25秒');
const preAir = mockSquad.count;
airdrop.apply(mockGame);
assert(mockSquad.count >= preAir + 1 && mockSquad.count <= preAir + 3, '紧急空投克制增加 1~3 人');
// 测单局6人招募上限
RE._recruitTotal = 5;
const preCap = mockSquad.count;
airdrop.apply(mockGame);
assert(RE._recruitTotal === 6 && mockSquad.count === preCap + 1, '单局随机招募严格截断在 6 人上限');
assert(!RE._eligible(airdrop, 1), '达6人上限后招募事件移出候选池');
assert(RE._eligible(medkit, 1), '战地医疗不计入招募上限');

// 4. 医疗 A+B 系统验证 (满编给护盾不加人, 有战斗损优先恢复, 负面门不可恢复)
console.log('\n■ V15-GAMEPLAY-001 / V18.0 医疗A+B机制');
const beforeMed = mockSquad.count;
medkit.apply(mockGame);
assert(mockSquad.count === beforeMed && mockSquad._medShield === 2, '满编触发战地医疗不加人数, 改为获得2层临时护盾');
mockSquad.recoverableLoss = 20;
const preHeal = mockSquad.count;
medkit.apply(mockGame);
assert(mockSquad.count === preHeal + 3 && mockSquad.recoverableLoss === 17, '有战斗损失时恢复 1~3 名可恢复编制');
const CLASS_DEFS = vm.runInContext('CLASS_DEFS', ctx);
assert(CLASS_DEFS.medic.mods.regenN === 1 && CLASS_DEFS.medic.mods.regenInterval === 12, '战地军医被动调整为12秒恢复1人');

// 5. 后期可升级主动战术技能验证
console.log('\n■ V15-GAMEPLAY-002 / V16.2 后期可升级主动技能 (含战术龙卷风)');
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/upgrades.js'), 'utf8'), ctx);
const UDEFS = vm.runInContext('UPGRADE_DEFS', ctx);
assert(UDEFS.skill_airstrike && UDEFS.skill_cryo && UDEFS.skill_overdrive && UDEFS.skill_tornado, '商店包含4项主动战术技能(空袭/冰冻/超载/龙卷风)');
assert(UDEFS.skill_airstrike.levels.length === 5 && UDEFS.skill_cryo.levels.length === 5 && UDEFS.skill_overdrive.levels.length === 5 && UDEFS.skill_tornado.levels.length === 5, '4项主动技能均为5级可升级成长');
assert(UDEFS.skill_airstrike.effect(0) === '未解锁' && UDEFS.skill_airstrike.effect(1).indexOf('范围伤害') >= 0, '空袭Lv.0未解锁, Lv.1解锁战斗生效');
assert(UDEFS.skill_tornado.effect(0) === '未解锁' && UDEFS.skill_tornado.effect(1).indexOf('5.0s') >= 0 && UDEFS.skill_tornado.effect(5).indexOf('7.0s') >= 0, '战术龙卷风Lv.1(5.0s)→Lv.5(7.0s)按V16.2方案成长');

// 6. V16.2-GAMEPLAY-005 关卡怪物丰富度验证 (L1>=4种, L2>=6种)
console.log('\n■ V16.2-GAMEPLAY-005 关卡怪物多样性');
const typesInLevel = (lvl) => {
    const s = new Set();
    lvl.segments.filter(seg => seg.type === 'wave').forEach(seg => seg.enemies.forEach(e => s.add(e.type)));
    return s;
};
const l1Types = typesInLevel(LEVELS[0]);
const l2Types = typesInLevel(LEVELS[1]);
assert(l1Types.size >= 4 && l1Types.has('shield') && l1Types.has('flanker'), 'L1包含>=4种怪(含shield与flanker)');
assert(l2Types.size >= 6 && l2Types.has('spitter') && l2Types.has('thrower') && l2Types.has('flanker'), 'L2包含>=6种怪(含spitter/thrower/flanker)');

console.log('\n======================');
console.log('V16.2 玩法平衡测试: 通过 ' + pass + ' / 失败 ' + fail);
if (fail > 0) process.exit(1);
