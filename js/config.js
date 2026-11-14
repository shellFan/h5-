// ===== 膨胀小队 - 全局配置 =====
const CONFIG = {
    // 跑道
    LANE_WIDTH: 2.0,
    LANE_COUNT: 3,
    LANE_X: [-2.0, 0, 2.0],
    ROAD_HALF_WIDTH: 3.4,

    // ===== V5.1 坐标方向约定 (唯一事实来源, 禁止在各文件散写正负号) =====
    // 世界: +X向右, +Y向上, 玩家军团面朝-Z(屏幕深处)推进, 敌人面朝+Z(镜头方向)追击防线。
    DIRS: {
        FORWARD_SIGN: -1,       // 玩家前进方向: squad.z 每秒增量符号
        ENEMY_ADVANCE_SIGN: 1,  // 怪物追击方向: 朝防线(+Z)移动
        SHOOT_SIGN: -1,         // 子弹飞行方向
        GATE_PASS_SIGN: -1,     // 穿门: squad.z 递减跨越 gate.z
        CAMERA_SIDE: 1          // 摄像机位于防线的(+Z)后方
    },

    // 小队
    SQUAD_START_COUNT: 1,
    SQUAD_MAX_COUNT: 500,
    SQUAD_SPEED: 3.3,
    FORMATION_COLS: 7,
    FORMATION_SPACING_X: 0.52,
    FORMATION_SPACING_Z: 0.46,

    // ===== V4.0 移动手感 (P0: 全部可配置, 禁止写死在事件处理中) =====
    MOVE: {
        // V5.0 语义: 越大越灵敏(移动越快)。1.0 = 拖过整屏宽度横穿全部可玩范围。
        touchSensitivity: 1.0,
        followSmoothTime: 0.15,
        laneTransitionTime: 0.45,
        gateMagnetDist: 0.55,
        gateMagnetLambda: 6.0,
        centerMargin: 0.12,
        minCenterRange: 1.1,
        keyStep: 1.2
    },

    // ===== V5.1 节奏控制 (阵地防守模式) =====
    PACING: {
        waveTriggerAhead: 14,       // 波次激活提前量(队伍距波点z, 世界单位)
        spawnIntervalMin: 0.8,      // 批次生成间隔下限(秒)
        spawnIntervalMax: 1.5,
        batchSizeBase: 2,
        batchSizeMax: 14,           // V5.1: 尸潮单批上限提升
        streamInterval: 0.10,       // 同批角色间距(秒)，每帧最多生成一只
        defenseStandoff: 9,         // V5.1: 防线与波点的距离 — 队伍抵达 w.z+9 处停住列阵, 怪从波点方向涌来
        spawnDepth: 12,             // 生成纵深(z向散布, 防线前方屏幕外逐步涌入)
        bossTriggerAhead: 24,
        bossWarningTime: 2.0,
        bossSpawnSetback: 4,
        firstContactGrace: 2.0,
        waveRestMin: 3.0,
        waveRestMax: 4.0
    },

    // ===== V5.1 每关场上活敌上限矩阵 (尸潮规模, 非同屏全部) =====
    MAX_ALIVE: [25, 30, 35, 45, 60],


    // 射击
    BULLET_SPEED: 28,
    BULLET_DAMAGE_BASE: 1,
    BULLET_FIRE_RATE_BASE: 2.2, // 每秒每兵射击次数
    BULLET_MAX_VISIBLE: 120,    // 最大可见弹道数
    BULLET_RANGE: 18,           // 子弹射程

    // 僵尸属性 (V4.0: 保留V3.7放大轮廓; 速度重校准 快速=1.5×普通, 盾/精英低速压迫感)
    ZOMBIE: {
        normal:  { hp: 3,  speed: 1.7,  scale: 1.45, color: 0x8FBC5A, killScore: 1 },
        fast:    { hp: 2,  speed: 2.55, scale: 1.18, color: 0xA9CB6B, killScore: 1 },
        shield:  { hp: 10, speed: 1.15, scale: 1.6,  color: 0x7EA35F, killScore: 2 },
        split:   { hp: 4,  speed: 1.35, scale: 1.28, color: 0xA583C9, killScore: 2 },
        spitter: { hp: 4,  speed: 1.25, scale: 1.38, color: 0x63C24B, killScore: 2 },
        elite:   { hp: 26, speed: 1.0,  scale: 2.5,  color: 0x6F9A52, killScore: 5 },
        boss:    { hp: 200, speed: 0.9, scale: 3.9,  color: 0x9C3B32, killScore: 50 }
    },

    // 僵尸攻击小队的距离
    ZOMBIE_ATTACK_DIST: 1.2,
    // 僵尸攻击间隔(秒)
    ZOMBIE_ATTACK_INTERVAL: 0.8,
    // 每次攻击杀死士兵数
    ZOMBIE_ATTACK_KILL: 1,

    // 相机 (V3.7: 抬高+拉远+看更远 — 军团占画面下部合理比例, 远处怪潮可见, 不挡路)
    CAMERA_OFFSET_Y: 6.1,
    CAMERA_OFFSET_Z: 7.8,
    CAMERA_LOOK_AHEAD: -8.5,
    CAMERA_FOLLOW_X: 0.32,
    CAMERA_FOV: 53,

    // 特效
    PARTICLE_MAX: 300,

    // 颜色方案 (V2 商业级卡通配色)
    COLORS: {
        sky: 0x87CEEB,
        fog: 0xB8D8F0,
        // 道路: 浅灰紫柏油
        road: 0xB8B4C8,
        roadEdge: 0x9A94B0,
        roadLine: 0xF0EEF5,
        grass: 0x8FCB6F,
        grassDark: 0x7ABA5A,
        // 士兵: 明亮蓝
        soldierBlue: 0x3B82F6,
        soldierHelmet: 0x1E3A8A,   // V4.3: 深藏青头盔(与亮蓝军服色块分离, 背面可辨头/身)
        soldierVest: 0x1E40AF,
        soldierPants: 0x2C3E60,
        skin: 0xF5C99B,
        // 僵尸肤色
        zombieSkin: 0x8FAE6E,
        zombieSkinDark: 0x6B8A52,
        zombieCloth: 0x6B5B45,
        // 子弹
        bulletGold: 0xFFD700,
        bulletCore: 0xFFF3B0,
        // 门
        gateGlass: 0x88CCFF,
    },

    // 门稀有度配色 (V3.1: 玻璃加深饱和, 对抗过曝保持色彩可读)
    GATE_RARITY: {
        common:  { frame: 0x2F6FE0, glass: 0x5FA8F5, glow: 0x60A5FA },  // 蓝
        rare:    { frame: 0x7C3AED, glass: 0xA78BFA, glow: 0xA78BFA },  // 紫
        epic:    { frame: 0xD97706, glass: 0xF5B93A, glow: 0xFBBF24 },  // 金
        danger:  { frame: 0xDC2626, glass: 0xF87171, glow: 0xF87171 },  // 红
    }
};

// ===== 关卡数据 (V5.1 五关正式版: 阵地防守流程) =====
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
                { lane: 2, op: 'add', value: 3, label: '+3' }
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
                { lane: 1, op: 'mul', value: 2, label: '\u00d72' },
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
                { lane: 2, op: 'mul', value: 2, label: '\u00d72' }
            ]},
            { type: 'wave', z: -50, enemies: [ { type: 'split', count: 14 }, { type: 'shield', count: 6 }, { type: 'fast', count: 8 } ] },
            { type: 'gates', z: -64, gates: [
                { lane: 0, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 1, op: 'add', value: 15, label: '+15' },
                { lane: 2, op: 'buff', value: 'firerate', label: '射速+10%' }
            ]},
            { type: 'wave', z: -78, enemies: [ { type: 'split', count: 10 }, { type: 'spitter', count: 8 }, { type: 'normal', count: 10 } ] },
            { type: 'wave', z: -94, enemies: [ { type: 'split', count: 14 }, { type: 'fast', count: 12 }, { type: 'shield', count: 4 } ] },
            { type: 'wave', z: -108, enemies: [ { type: 'split', count: 8 }, { type: 'spitter', count: 6 } ] }
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
                { lane: 1, op: 'mul', value: 2, label: '\u00d72' },
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
                { lane: 2, op: 'mul', value: 2, label: '\u00d72' }
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
