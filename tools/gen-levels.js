// 将 js/config.js 中的 LEVELS 数组替换为 10 关完整配置 (V3.3)
// 用法: node tools/gen-levels.js
const fs = require('fs');
const path = require('path');

process.chdir(path.join(__dirname, '..'));
const filePath = 'js/config.js';
const content = fs.readFileSync(filePath, 'utf8');

const markerStart = content.indexOf('const LEVELS = [');
const markerEnd = content.lastIndexOf('];') + 2;
if (markerStart < 0 || markerEnd < 0) {
    console.error('未找到 LEVELS 标记');
    process.exit(1);
}
const head = content.slice(0, markerStart);

// 中文与×符号用 unicode 转义, 保持 config.js 为纯 ASCII 注释安全
const x2 = '\u00d72';
const x3 = '\u00d73';
const T = {
    add: (v) => `+${v}`,
    mul2: `\u00d72`,
    mul3: `\u00d73`,
    damage: '\u8f93\u51fa+1',
    damage2: '\u8f93\u51fa\u00d72',
    firerate: '\u5c04\u901f+20%',
    pierce: '\u7a7f\u900f+1',
    crit: '\u66b4\u51fb+10%',
    freeze: '\u51b0\u51bb\u5f39',
    vamp: '\u5438\u8840',
    risk: '-30% \u8f93\u51fa+2'
};

const gate = (lane, op, value, label) =>
    `                { lane: ${lane}, op: '${op}', value: ${value}, label: '${label}' }`;
const gatesSeg = (z, gates) =>
    `            { type: 'gates', z: ${z}, gates: [\n${gates.join(',\n')}\n            ]},`;
const waveSeg = (z, enemies) => {
    const lines = enemies.map(([t, c]) => `                { type: '${t}', count: ${c} }`).join(',\n');
    return `            { type: 'wave', z: ${z}, enemies: [\n${lines}\n            ]},`;
};
const bossSeg = (z, hp) => `            { type: 'boss', z: ${z}, boss: { type: 'boss', hp: ${hp} } }`;

// 每关: [名字, 关间距, [段落...] 最后一项为boss]
const G_ADD = (l, v) => gate(l, 'add', v, T.add(v));
const G_MUL2 = (l) => gate(l, 'mul', 2, T.mul2);
const G_MUL3 = (l) => gate(l, 'mul', 3, T.mul3);
const G_BUFF = (l, key) => gate(l, 'buff', `'${key}'`, T[key]);
const G_RISK = (l) => gate(l, 'risk', 0, T.risk);
const W = (z, ...enemies) => waveSeg(z, enemies);
const B = (z, hp) => bossSeg(z, hp);

const levels = [
    {
        name: '第 1 关 新手膨胀', totalZ: -150, segs: [
            gatesSeg(-10, [G_ADD(0, 5), G_MUL2(2)]),
            gatesSeg(-24, [G_ADD(0, 10), G_MUL2(2)]),
            W(-38, ['normal', 8]),
            gatesSeg(-52, [G_ADD(0, 8), G_BUFF(2, 'damage')]),
            W(-66, ['normal', 10], ['fast', 4]),
            gatesSeg(-80, [G_MUL2(0), G_BUFF(2, 'firerate')]),
            W(-94, ['normal', 10], ['shield', 3]),
            gatesSeg(-108, [G_ADD(0, 10), G_MUL2(2)]),
            W(-122, ['normal', 10], ['fast', 6], ['spitter', 2]),
            B(-140, 200)
        ]
    },
    {
        name: '第 2 关 快尸来袭', totalZ: -155, segs: [
            gatesSeg(-10, [G_ADD(0, 8), G_BUFF(2, 'pierce')]),
            W(-26, ['fast', 12], ['normal', 6]),
            gatesSeg(-44, [G_MUL2(0), G_BUFF(2, 'firerate')]),
            W(-60, ['fast', 14], ['normal', 8]),
            gatesSeg(-78, [G_BUFF(0, 'crit'), G_ADD(2, 12)]),
            W(-94, ['fast', 16], ['spitter', 3]),
            gatesSeg(-110, [G_MUL2(0), G_BUFF(2, 'pierce')]),
            W(-126, ['fast', 14], ['normal', 10]),
            B(-144, 280)
        ]
    },
    {
        name: '第 3 关 盾墙', totalZ: -160, segs: [
            gatesSeg(-10, [G_ADD(0, 10), G_BUFF(2, 'damage')]),
            W(-28, ['normal', 8], ['shield', 5]),
            gatesSeg(-46, [G_BUFF(0, 'crit'), G_BUFF(2, 'damage2')]),
            W(-64, ['shield', 8], ['fast', 6]),
            gatesSeg(-82, [G_MUL2(0), G_BUFF(2, 'pierce')]),
            W(-100, ['shield', 10], ['normal', 12]),
            gatesSeg(-118, [G_ADD(0, 15), G_BUFF(2, 'damage')]),
            W(-134, ['shield', 8], ['spitter', 4]),
            B(-150, 360)
        ]
    },
    {
        name: '第 4 关 分裂潮', totalZ: -160, segs: [
            gatesSeg(-10, [G_ADD(0, 10), G_BUFF(2, 'freeze')]),
            W(-28, ['split', 8], ['normal', 6]),
            gatesSeg(-46, [G_BUFF(0, 'freeze'), G_MUL2(2)]),
            W(-64, ['split', 10], ['fast', 6]),
            gatesSeg(-82, [G_BUFF(0, 'pierce'), G_MUL2(2)]),
            W(-100, ['split', 12], ['shield', 4]),
            gatesSeg(-118, [G_ADD(0, 15), G_BUFF(2, 'crit')]),
            W(-134, ['split', 10], ['fast', 8]),
            B(-150, 420)
        ]
    },
    {
        name: '第 5 关 吐痰者', totalZ: -165, segs: [
            gatesSeg(-10, [G_ADD(0, 12), G_BUFF(2, 'vamp')]),
            W(-28, ['spitter', 5], ['normal', 10]),
            gatesSeg(-46, [G_BUFF(0, 'vamp'), G_BUFF(2, 'firerate')]),
            W(-64, ['spitter', 7], ['fast', 8]),
            gatesSeg(-82, [G_MUL2(0), G_BUFF(2, 'crit')]),
            W(-100, ['spitter', 8], ['shield', 6], ['normal', 8]),
            gatesSeg(-118, [G_ADD(0, 15), G_BUFF(2, 'damage2')]),
            W(-136, ['spitter', 8], ['fast', 10]),
            B(-154, 480)
        ]
    },
    {
        name: '第 6 关 双线压力', totalZ: -170, segs: [
            gatesSeg(-10, [G_ADD(0, 12), G_BUFF(2, 'damage2')]),
            W(-28, ['fast', 10], ['spitter', 5]),
            gatesSeg(-46, [G_BUFF(0, 'firerate'), G_BUFF(2, 'vamp')]),
            W(-64, ['fast', 12], ['spitter', 7], ['shield', 3]),
            gatesSeg(-82, [G_MUL2(0), G_BUFF(2, 'freeze')]),
            W(-100, ['fast', 14], ['spitter', 8], ['normal', 10]),
            gatesSeg(-118, [G_ADD(0, 18), G_MUL2(2)]),
            W(-138, ['fast', 14], ['spitter', 8], ['shield', 6]),
            B(-158, 550)
        ]
    },
    {
        name: '第 7 关 尸海', totalZ: -175, segs: [
            gatesSeg(-10, [G_ADD(0, 20), G_MUL2(2)]),
            W(-28, ['normal', 20], ['fast', 10]),
            gatesSeg(-46, [G_MUL3(0), G_ADD(2, 20)]),
            W(-66, ['normal', 24], ['fast', 12]),
            gatesSeg(-84, [G_BUFF(0, 'pierce'), G_MUL2(2)]),
            W(-104, ['normal', 26], ['fast', 14], ['spitter', 6]),
            gatesSeg(-122, [G_ADD(0, 25), G_BUFF(2, 'crit')]),
            W(-142, ['normal', 24], ['fast', 16], ['shield', 6]),
            B(-164, 650)
        ]
    },
    {
        name: '第 8 关 精英军团', totalZ: -180, segs: [
            gatesSeg(-10, [G_ADD(0, 15), G_BUFF(2, 'damage2')]),
            W(-30, ['elite', 1], ['normal', 12]),
            gatesSeg(-48, [G_BUFF(0, 'crit'), G_BUFF(2, 'pierce')]),
            W(-68, ['elite', 2], ['shield', 6], ['fast', 6]),
            gatesSeg(-86, [G_MUL2(0), G_BUFF(2, 'vamp')]),
            W(-106, ['elite', 3], ['split', 6], ['normal', 12]),
            gatesSeg(-124, [G_ADD(0, 20), G_MUL2(2)]),
            W(-144, ['elite', 3], ['spitter', 6], ['fast', 10]),
            B(-168, 750)
        ]
    },
    {
        name: '第 9 关 终局前夜', totalZ: -185, segs: [
            gatesSeg(-10, [G_ADD(0, 20), G_BUFF(2, 'freeze')]),
            W(-30, ['normal', 14], ['fast', 10], ['spitter', 6]),
            gatesSeg(-48, [G_BUFF(0, 'damage2'), G_BUFF(2, 'crit')]),
            W(-68, ['shield', 8], ['split', 8], ['fast', 10]),
            gatesSeg(-86, [G_MUL2(0), G_BUFF(2, 'pierce')]),
            W(-106, ['elite', 2], ['spitter', 8], ['normal', 16]),
            gatesSeg(-124, [G_ADD(0, 25), G_MUL3(2)]),
            W(-146, ['elite', 3], ['shield', 8], ['fast', 12]),
            B(-172, 900)
        ]
    },
    {
        name: '第 10 关 终极膨胀', totalZ: -190, segs: [
            gatesSeg(-10, [G_ADD(0, 25), G_MUL3(2)]),
            W(-30, ['normal', 20], ['fast', 14]),
            gatesSeg(-48, [G_MUL3(0), G_RISK(2)]),
            W(-70, ['elite', 3], ['split', 10], ['fast', 12]),
            gatesSeg(-88, [G_BUFF(0, 'damage2'), G_BUFF(2, 'vamp')]),
            W(-108, ['elite', 4], ['shield', 10], ['spitter', 8]),
            gatesSeg(-126, [G_ADD(0, 30), G_MUL3(2)]),
            W(-148, ['elite', 4], ['normal', 20], ['fast', 14], ['spitter', 8]),
            B(-178, 1200)
        ]
    }
];

const out = levels.map((lv, i) => {
    const segs = lv.segs.join('\n');
    return `    // ============ 第${i + 1}关 ${lv.name.replace(/^第 \d+ 关 /, '')} ============\n` +
        `    {\n        name: '${lv.name}',\n        startCount: 1,\n        totalZ: ${lv.totalZ},\n        segments: [\n${segs}\n        ]\n    }`;
}).join(',\n');

const newContent = head + 'const LEVELS = [\n' + out + '\n];\n';
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('LEVELS 10关写入完成');

// 自验证: 语法+数据完整性
try {
    eval(fs.readFileSync(filePath, 'utf8'));
    if (LEVELS.length !== 10) throw new Error('关卡数不是10: ' + LEVELS.length);
    LEVELS.forEach((l, i) => {
        const gates = l.segments.filter(s => s.type === 'gates').length;
        const waves = l.segments.filter(s => s.type === 'wave').length;
        const boss = l.segments.filter(s => s.type === 'boss').length;
        const totalEnemies = l.segments.filter(s => s.type === 'wave')
            .reduce((n, s) => n + s.enemies.reduce((m, e) => m + e.count, 0), 0);
        const bossHp = l.segments.find(s => s.type === 'boss').boss.hp;
        const types = new Set();
        l.segments.filter(s => s.type === 'wave').forEach(s => s.enemies.forEach(e => types.add(e.type)));
        console.log(`L${i + 1} ${l.name} | 门排:${gates} 波:${waves} boss:${boss} 敌人:${totalEnemies} bossHP:${bossHp} 类型:[${[...types].join(',')}]`);
        if (boss !== 1) throw new Error(`L${i + 1} boss段数量异常`);
        if (gates < 4) throw new Error(`L${i + 1} 门排过少`);
    });
    console.log('自验证通过 ✓');
} catch (e) {
    console.error('自验证失败:', e.message);
    process.exit(1);
}
