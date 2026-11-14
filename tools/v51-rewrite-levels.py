# V5.1: rewrite LEVELS block in js/config.js to five defense levels
p = 'js/config.js'
s = open(p, encoding='utf-8').read()
start = s.index('// ===== 关卡数据 =====')
new_levels = '''// ===== 关卡数据 (V5.1 五关正式版: 阵地防守流程) =====
// type: 'gates' 状态门 | 'wave' 防守波 | 'boss' Boss战
// gates: 每门占一条跑道 lane: 0左 1中 2右; wave.z 即防守锚点(队伍停于 z+defenseStandoff)
// rewardCoins: 首次通关奖励金币
const LEVELS = [
    // ============ 第1关 新兵训练 (总怪44, 教学) ============
    {
        name: '第 1 关 新兵训练',
        startCount: 1,
        totalZ: -96,
        rewardCoins: 60,
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 8, label: '+8' },
                { lane: 1, op: 'add', value: 5, label: '+5' },
                { lane: 2, op: 'add', value: 5, label: '+5' }
            ]},
            { type: 'wave', z: -18, enemies: [ { type: 'normal', count: 10 } ] },
            { type: 'gates', z: -28, gates: [
                { lane: 0, op: 'add', value: 5, label: '+5' },
                { lane: 1, op: 'buff', value: 'damage', label: '输出+1' },
                { lane: 2, op: 'add', value: 8, label: '+8' }
            ]},
            { type: 'wave', z: -40, enemies: [ { type: 'normal', count: 12 }, { type: 'fast', count: 3 } ] },
            { type: 'gates', z: -52, gates: [
                { lane: 0, op: 'buff', value: 'firerate', label: '射速+10%' },
                { lane: 1, op: 'add', value: 8, label: '+8' },
                { lane: 2, op: 'buff', value: 'crit', label: '暴击+5%' }
            ]},
            { type: 'wave', z: -64, enemies: [ { type: 'normal', count: 10 }, { type: 'fast', count: 4 } ] },
            { type: 'wave', z: -78, enemies: [ { type: 'normal', count: 5 } ] }
        ]
    },
    // ============ 第2关 快速尸潮 (总怪60, 火力分配) ============
    {
        name: '第 2 关 快速尸潮',
        startCount: 1,
        totalZ: -104,
        rewardCoins: 80,
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 8, label: '+8' },
                { lane: 1, op: 'add', value: 5, label: '+5' },
                { lane: 2, op: 'buff', value: 'pierce', label: '穿透+1' }
            ]},
            { type: 'wave', z: -20, enemies: [ { type: 'fast', count: 10 }, { type: 'normal', count: 8 } ] },
            { type: 'gates', z: -34, gates: [
                { lane: 0, op: 'addpct', value: 20, label: '人数+20%' },
                { lane: 1, op: 'add', value: 12, label: '+12' },
                { lane: 2, op: 'buff', value: 'crit', label: '暴击+5%' }
            ]},
            { type: 'wave', z: -46, enemies: [ { type: 'fast', count: 14 }, { type: 'normal', count: 8 } ] },
            { type: 'gates', z: -60, gates: [
                { lane: 0, op: 'buff', value: 'firerate', label: '射速+10%' },
                { lane: 1, op: 'add', value: 8, label: '+8' },
                { lane: 2, op: 'buff', value: 'damage', label: '输出+1' }
            ]},
            { type: 'wave', z: -72, enemies: [ { type: 'fast', count: 12 }, { type: 'normal', count: 6 }, { type: 'shield', count: 2 } ] },
            { type: 'wave', z: -86, enemies: [ { type: 'fast', count: 6 } ] }
        ]
    },
    // ============ 第3关 盾牌军团 (总怪78, 破防思路) ============
    {
        name: '第 3 关 盾牌军团',
        startCount: 1,
        totalZ: -122,
        rewardCoins: 110,
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'buff', value: 'damage', label: '输出+1' },
                { lane: 1, op: 'add', value: 10, label: '+10' },
                { lane: 2, op: 'buff', value: 'crit', label: '暴击+5%' }
            ]},
            { type: 'wave', z: -22, enemies: [ { type: 'shield', count: 8 }, { type: 'normal', count: 10 } ] },
            { type: 'gates', z: -36, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'mul', value: 2, label: '\\u00d72' },
                { lane: 2, op: 'buff', value: 'firerate', label: '射速+10%' }
            ]},
            { type: 'wave', z: -50, enemies: [ { type: 'shield', count: 12 }, { type: 'fast', count: 8 } ] },
            { type: 'gates', z: -64, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'add', value: 12, label: '+12' },
                { lane: 2, op: 'buff', value: 'freeze', label: '冰冻弹' }
            ]},
            { type: 'wave', z: -78, enemies: [ { type: 'shield', count: 10 }, { type: 'normal', count: 10 }, { type: 'spitter', count: 2 } ] },
            { type: 'wave', z: -94, enemies: [ { type: 'shield', count: 6 }, { type: 'normal', count: 8 }, { type: 'spitter', count: 4 } ] },
            { type: 'wave', z: -108, enemies: [ { type: 'shield', count: 6 }, { type: 'fast', count: 6 } ] }
        ]
    },
    // ============ 第4关 变异尸潮 (总怪96, 组合压力) ============
    {
        name: '第 4 关 变异尸潮',
        startCount: 1,
        totalZ: -126,
        rewardCoins: 140,
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 12, label: '+12' },
                { lane: 1, op: 'buff', value: 'freeze', label: '冰冻弹' },
                { lane: 2, op: 'buff', value: 'damage', label: '输出+1' }
            ]},
            { type: 'wave', z: -22, enemies: [ { type: 'split', count: 8 }, { type: 'fast', count: 10 } ] },
            { type: 'gates', z: -36, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'mul', value: 2, label: '\\u00d72' }
            ]},
            { type: 'wave', z: -50, enemies: [ { type: 'split', count: 12 }, { type: 'shield', count: 6 }, { type: 'fast', count: 8 } ] },
            { type: 'gates', z: -64, gates: [
                { lane: 0, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 1, op: 'add', value: 15, label: '+15' },
                { lane: 2, op: 'buff', value: 'firerate', label: '射速+10%' }
            ]},
            { type: 'wave', z: -78, enemies: [ { type: 'split', count: 10 }, { type: 'spitter', count: 6 }, { type: 'normal', count: 10 } ] },
            { type: 'wave', z: -94, enemies: [ { type: 'split', count: 12 }, { type: 'fast', count: 10 }, { type: 'shield', count: 4 } ] },
            { type: 'wave', z: -108, enemies: [ { type: 'split', count: 8 }, { type: 'spitter', count: 4 } ] }
        ]
    },
    // ============ 第5关 终局Boss (总怪127+Boss, 三阶段挑战) ============
    {
        name: '第 5 关 终局Boss',
        startCount: 1,
        totalZ: -166,
        rewardCoins: 200,
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 15, label: '+15' },
                { lane: 1, op: 'mul', value: 2, label: '\\u00d72' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出+2' }
            ]},
            { type: 'wave', z: -22, enemies: [ { type: 'normal', count: 14 }, { type: 'fast', count: 12 } ] },
            { type: 'gates', z: -38, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'add', value: 12, label: '+12' }
            ]},
            { type: 'wave', z: -52, enemies: [ { type: 'elite', count: 2 }, { type: 'shield', count: 8 }, { type: 'normal', count: 12 } ] },
            { type: 'gates', z: -68, gates: [
                { lane: 0, op: 'buff', value: 'freeze', label: '冰冻弹' },
                { lane: 1, op: 'buff', value: 'vamp', label: '吸血' },
                { lane: 2, op: 'mul', value: 2, label: '\\u00d72' }
            ]},
            { type: 'wave', z: -82, enemies: [ { type: 'split', count: 10 }, { type: 'spitter', count: 8 }, { type: 'fast', count: 10 } ] },
            { type: 'gates', z: -96, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'add', value: 15, label: '+15' },
                { lane: 2, op: 'buff', value: 'crit2', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -110, enemies: [ { type: 'elite', count: 3 }, { type: 'shield', count: 8 }, { type: 'spitter', count: 6 }, { type: 'normal', count: 10 } ] },
            { type: 'wave', z: -124, enemies: [ { type: 'elite', count: 2 }, { type: 'normal', count: 14 }, { type: 'fast', count: 8 } ] },
            { type: 'boss', z: -150, boss: { type: 'boss', hp: 2600 } }
        ]
    }
];

// ===== V5.1 Boss 装配 =====
CONFIG.BOSS_STYLES = ['bruiser', 'bruiser', 'bulwark', 'hivelord', 'overlord'];
CONFIG.BOSS_NAMES = ['铁拳队长', '赤拳突击者', '钢盾领主', '裂变母巢', '终焉核心'];
LEVELS.forEach(function(level, li) {
    level.bossStyle = CONFIG.BOSS_STYLES[li];
    level.segments.forEach(function(seg) {
        if (seg.type === 'boss') seg.boss.style = level.bossStyle;
    });
});
'''
s = s[:start] + new_levels
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('LEVELS rewritten')
