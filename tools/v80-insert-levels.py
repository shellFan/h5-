import re
p = 'js/config.js'
s = open(p, encoding='utf-8').read()

# 构建 L7-L10 配置
l7_to_10 = """    ,
    // ============ 第7关 地下巢穴 (V8.0) ============
    {
        name: '第 7 关 地下巢穴',
        startCount: 1,
        totalZ: -180,
        rewardCoins: 350,
        theme: 'cave',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 20, label: '+20' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'normal', count: 80 }, { type: 'fast', count: 50 } ] },
            { type: 'gates', z: -40, gates: [
                { lane: 0, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -56, enemies: [ { type: 'elite', count: 8 }, { type: 'fast', count: 60 }, { type: 'normal', count: 50 } ] },
            { type: 'wave', z: -78, enemies: [ { type: 'elite', count: 6 }, { type: 'shield', count: 50 }, { type: 'spitter', count: 30 } ] },
            { type: 'gates', z: -96, gates: [
                { lane: 0, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'chain', label: '连锁闪电' }
            ]},
            { type: 'wave', z: -112, enemies: [ { type: 'elite', count: 10 }, { type: 'split', count: 60 }, { type: 'shield', count: 40 } ] },
            { type: 'boss', z: -148, boss: { type: 'boss', hp: 6000, style: 'hivelord', title: '巢穴之母' } }
        ]
    },
    // ============ 第8关 机械废土 (V8.0) ============
    {
        name: '第 8 关 机械废土',
        startCount: 1,
        totalZ: -190,
        rewardCoins: 400,
        theme: 'mechanical',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'shield', count: 80 }, { type: 'normal', count: 60 }, { type: 'fast', count: 40 } ] },
            { type: 'gates', z: -42, gates: [
                { lane: 0, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 1, op: 'buff', value: 'chain', label: '连锁闪电' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -58, enemies: [ { type: 'elite', count: 10 }, { type: 'spitter', count: 50 }, { type: 'fast', count: 60 } ] },
            { type: 'energy', z: -76, core: { hp: 1400, buffRadius: 10 } },
            { type: 'gates', z: -92, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -108, enemies: [ { type: 'elite', count: 12 }, { type: 'shield', count: 60 }, { type: 'normal', count: 80 } ] },
            { type: 'boss', z: -148, boss: { type: 'boss', hp: 7000, style: 'titan', title: '机械巨尸' } }
        ]
    },
    // ============ 第9关 最终防线 (V8.0) ============
    {
        name: '第 9 关 最终防线',
        startCount: 1,
        totalZ: -200,
        rewardCoins: 450,
        theme: 'fortress',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 25, label: '+25' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'elite', count: 8 }, { type: 'normal', count: 90 }, { type: 'fast', count: 60 } ] },
            { type: 'gates', z: -42, gates: [
                { lane: 0, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 1, op: 'buff', value: 'freeze', label: '冰冻弹' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -58, enemies: [ { type: 'elite', count: 12 }, { type: 'shield', count: 70 }, { type: 'spitter', count: 50 } ] },
            { type: 'gates', z: -76, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'chain', label: '连锁闪电' }
            ]},
            { type: 'wave', z: -92, enemies: [ { type: 'elite', count: 14 }, { type: 'split', count: 60 }, { type: 'fast', count: 70 }, { type: 'normal', count: 80 } ] },
            { type: 'boss', z: -130, boss: { type: 'boss', hp: 5000, style: 'bulwark', title: '钢盾领主' } },
            { type: 'boss', z: -166, boss: { type: 'boss', hp: 5000, style: 'hivelord', title: '裂变母巢' } }
        ]
    },
    // ============ 第10关 终极末日 (V8.0 终局关) ============
    {
        name: '第 10 关 终极末日',
        startCount: 1,
        totalZ: -220,
        rewardCoins: 600,
        theme: 'apocalypse',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 30, label: '+30' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -26, enemies: [ { type: 'elite', count: 10 }, { type: 'normal', count: 100 }, { type: 'fast', count: 70 } ] },
            { type: 'gates', z: -44, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -60, enemies: [ { type: 'elite', count: 14 }, { type: 'shield', count: 80 }, { type: 'spitter', count: 60 } ] },
            { type: 'energy', z: -78, core: { hp: 2000, buffRadius: 10 } },
            { type: 'gates', z: -94, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'chain', label: '连锁闪电' }
            ]},
            { type: 'wave', z: -110, enemies: [ { type: 'elite', count: 16 }, { type: 'split', count: 70 }, { type: 'shield', count: 70 }, { type: 'fast', count: 70 } ] },
            { type: 'gates', z: -128, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -144, enemies: [ { type: 'elite', count: 18 }, { type: 'spitter', count: 60 }, { type: 'shield', count: 60 }, { type: 'normal', count: 100 }, { type: 'fast', count: 80 } ] },
            { type: 'gates', z: -162, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -178, enemies: [ { type: 'elite', count: 20 }, { type: 'normal', count: 120 }, { type: 'fast', count: 90 }, { type: 'shield', count: 60 }, { type: 'spitter', count: 50 } ] },
            { type: 'boss', z: -208, boss: { type: 'boss', hp: 12000, style: 'overlord', title: '末日主宰' } }
        ]
    }"""

# 找 LEVELS 的关闭 ]; 
close_idx = s.rfind('];', 0, s.index('// ===== V6.0: 末日核心主题'))
if close_idx < 0:
    # 找 LEVELS 数组结尾 — 搜索第一个非嵌套的 ];
    in_level = False
    depth = 0
    for i, ch in enumerate(s):
        if ch == '[': depth += 1
        if ch == ']': depth -= 1
        if depth == 0 and ch == ';' and i > s.index('LEVELS'):
            close_idx = i
            break

if close_idx is not None:
    s = s[:close_idx] + l7_to_10 + s[close_idx:]
    open(p, 'w', encoding='utf-8', newline='\n').write(s)
    print('L7-L10 inserted at char', close_idx)
else:
    print('ERROR: closing bracket not found')
