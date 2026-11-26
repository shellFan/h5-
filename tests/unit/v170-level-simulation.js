// V17.0 RC: L1–L10 每关 30 局数值模拟 + 切后台暂停契约 + 全关卡尾段补怪验证
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
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/upgrades.js'), 'utf8'), ctx);

const CONFIG = vm.runInContext('CONFIG', ctx);
const LEVELS = vm.runInContext('LEVELS', ctx);

// Deterministic PRNG for reproducible 30-run per-level simulation
function mulberry32(seed) {
    return function() {
        let t = (seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Simulate one battle run on levelIndex with given upgrade tier (0 = fresh no-upgrade rookie)
 * Models gate choices, squad DPS, wave HP * ENEMY_HP_MULTIPLIER, ranged/thrower attrition, and active skill saves.
 */
function simulateRun(levelIndex, upgradeTier, rand) {
    const level = LEVELS[levelIndex];
    const hpMul = CONFIG.ENEMY_HP_MULTIPLIER[levelIndex] || 1;
    let squad = level.startCount + upgradeTier; // recruit bonus
    let dmg = CONFIG.BULLET_DAMAGE_BASE + Math.floor(upgradeTier * 0.8);
    let fireRate = CONFIG.BULLET_FIRE_RATE_BASE * (1 + 0.05 * Math.min(5, upgradeTier));
    let pierce = 1 + Math.min(3, Math.floor(upgradeTier / 2));
    let crit = 0.05;
    let skillUses = upgradeTier >= 1 ? (1 + Math.floor(upgradeTier / 2)) : 0;

    for (const seg of level.segments) {
        if (seg.type === 'gates') {
            // Player picks a reasonable gate (weighted toward best available, with human variance)
            const g = seg.gates[Math.floor(rand() * seg.gates.length)];
            const bestAdd = seg.gates.filter(x => x.op === 'add').sort((a, b) => b.value - a.value)[0];
            const pick = (squad < 18 && bestAdd && rand() < 0.78) ? bestAdd : g;
            if (pick.op === 'add') squad += pick.value;
            else if (pick.op === 'mul') squad = Math.min(CONFIG.SQUAD_MAX_COUNT, Math.round(squad * pick.value));
            else if (pick.op === 'addpct') squad = Math.min(CONFIG.SQUAD_MAX_COUNT, Math.round(squad * (1 + pick.value / 100)));
            else if (pick.op === 'skill') { dmg += 0.65; pierce += 1; }
            else if (pick.op === 'buff') {
                if (pick.value === 'damage') dmg += 1;
                else if (pick.value === 'damage2') dmg += 2;
                else if (pick.value === 'firerate') fireRate *= 1.1;
                else if (pick.value === 'pierce') pierce += 1;
                else if (pick.value === 'crit') crit += 0.05;
                else if (pick.value === 'crit2') crit += 0.10;
            }
        } else if (seg.type === 'wave') {
            let waveHP = 0;
            let hazardThreat = 0;
            for (const e of seg.enemies) {
                const cfg = CONFIG.ZOMBIE[e.type] || CONFIG.ZOMBIE.normal;
                waveHP += e.count * cfg.hp * hpMul;
                if (e.type === 'spitter' || e.type === 'thrower' || e.type === 'flanker') {
                    hazardThreat += e.count * (e.type === 'thrower' ? 0.18 : 0.10);
                }
            }
            // 对齐 js/combat.js 真实齐射弹道公式: visualRate * volley * max(1, round(totalDPS / visualRate))
            const totalDPS = squad * dmg * fireRate;
            const visualRate = Math.min(2 + Math.sqrt(squad) * 2.2, 30);
            const volley = Math.min(5, 1 + Math.floor(Math.sqrt(squad) / 2.3));
            const perBullet = Math.max(1, Math.round(totalDPS / visualRate));
            const effDPS = Math.max(1, visualRate * volley * perBullet * (1 + (pierce - 1) * 0.35) * (1 + crit * 0.5));
            // 实际战局中波次在前方 14m 提前开火, 并按 ENEMY_WAVE_MULTIPLIER 分批涌入
            let netHP = waveHP;
            if (skillUses > 0 && waveHP > effDPS * 6.5) {
                netHP *= 0.65;
                skillUses--;
            }
            const ttk = netHP / effDPS;
            // 14m 接敌距离 / 推进相对速度 ≈ 9.2s 安全倾泻窗口
            const contactWindow = 9.0 + rand() * 1.6;
            const excess = Math.max(0, ttk - contactWindow);
            const meleeLoss = Math.floor(excess * (1.1 + levelIndex * 0.35));
            const dodgeFail = rand() < 0.25 ? Math.floor(hazardThreat * (0.15 + rand() * 0.2)) : 0;
            squad -= (meleeLoss + dodgeFail);
            if (squad <= 0) return { win: false, endSquad: 0 };
        } else if (seg.type === 'boss') {
            const bossHP = seg.boss.hp;
            const totalDPS = squad * dmg * fireRate;
            const visualRate = Math.min(2 + Math.sqrt(squad) * 2.2, 30);
            const volley = Math.min(5, 1 + Math.floor(Math.sqrt(squad) / 2.3));
            const perBullet = Math.max(1, Math.round(totalDPS / visualRate));
            const effDPS = Math.max(1, visualRate * volley * perBullet * (1 + crit * 0.5));
            const ttk = bossHP / effDPS;
            const bossLoss = Math.floor(ttk * (0.45 + rand() * 0.35));
            squad -= bossLoss;
            if (squad <= 0) return { win: false, endSquad: 0 };
        }
    }
    return { win: squad > 0, endSquad: squad };
}

console.log('\n■ V17.0 RC: L1–L10 每关 30 局数值模拟 (总计 300 局)');
const RUNS = 30;
const simReport = [];
for (let li = 0; li < LEVELS.length; li++) {
    const rand0 = mulberry32(17000 + li * 97);
    let rookieWins = 0;
    for (let r = 0; r < RUNS; r++) if (simulateRun(li, 0, rand0).win) rookieWins++;

    const recTier = li === 0 ? 0 : Math.min(8, li);
    const rand1 = mulberry32(27000 + li * 97);
    let gearedWins = 0;
    for (let r = 0; r < RUNS; r++) if (simulateRun(li, recTier, rand1).win) gearedWins++;

    simReport.push({
        level: `L${li + 1}`,
        rookieRate: Math.round((rookieWins / RUNS) * 100),
        gearedTier: recTier,
        gearedRate: Math.round((gearedWins / RUNS) * 100)
    });
}
console.table(simReport);

assert(simReport[0].rookieRate >= 35 && simReport[0].rookieRate <= 92, `V18.0 L1 无养成具备真实翻车风险且可通关 (实测 ${simReport[0].rookieRate}%)`);
assert(simReport[2].rookieRate < 100 || simReport[4].rookieRate < 80, `L3–L5 无养成逐步产生失败压力 (L3=${simReport[2].rookieRate}%, L5=${simReport[4].rookieRate}%)`);
assert(simReport.slice(3).every(r => r.gearedRate >= 60), 'L4–L10 在对应养成梯度下均可稳定通关');

console.log('\n■ V17.0 RC: 全 10 关后半段零空跑 + 切后台自动暂停契约');
let maxGap = 0;
for (let li = 0; li < LEVELS.length; li++) {
    const lvl = LEVELS[li];
    const lastWave = Math.min(...lvl.segments.filter(s => s.type === 'wave').map(s => s.z));
    const bossSeg = lvl.segments.find(s => s.type === 'boss');
    const anchor = bossSeg ? bossSeg.z : lvl.totalZ;
    const gap = Math.abs(anchor - lastWave);
    if (gap > maxGap) maxGap = gap;
}
assert(maxGap <= 12.5, `L1–L10 末波距终点/Boss 最大间距 ≤ 12.5m (实测 ${maxGap}m, 零无意义空跑)`);

const gameSrc = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
assert(gameSrc.includes("visibilitychange") && gameSrc.includes("wx.onHide"), 'js/game.js 已绑定 H5 visibilitychange 与微信 wx.onHide 切后台自动暂停');

console.log('\n======================');
console.log('V17.0 RC 模拟与上线契约: 通过 ' + pass + ' / 失败 ' + fail);
if (fail > 0) process.exit(1);
