// ===== 膨胀小队 - 全局配置 =====
const CONFIG = {
    // 跑道
    LANE_WIDTH: 2.0,
    LANE_COUNT: 3,
    LANE_X: [-2.0, 0, 2.0],
    ROAD_HALF_WIDTH: 3.4,

    // 小队
    SQUAD_START_COUNT: 1,
    SQUAD_MAX_COUNT: 500,
    SQUAD_SPEED: 5.0,           // 前进速度 单位/秒
    SQUAD_LANE_LERP: 10,        // 切换跑道插值速度
    FORMATION_COLS: 7,          // 阵型最大列数
    FORMATION_SPACING_X: 0.48,
    FORMATION_SPACING_Z: 0.42,

    // 射击
    BULLET_SPEED: 28,
    BULLET_DAMAGE_BASE: 1,
    BULLET_FIRE_RATE_BASE: 2.2, // 每秒每兵射击次数
    BULLET_MAX_VISIBLE: 120,    // 最大可见弹道数
    BULLET_RANGE: 18,           // 子弹射程

    // 僵尸属性
    ZOMBIE: {
        normal:  { hp: 3,  speed: 1.6,  scale: 1.0,  color: 0xE85D3A, killScore: 1 },
        fast:    { hp: 2,  speed: 3.2,  scale: 0.8,  color: 0xF07050, killScore: 1 },
        shield:  { hp: 10, speed: 1.1,  scale: 1.1,  color: 0xC0392B, killScore: 2 },
        split:   { hp: 5,  speed: 1.4,  scale: 0.9,  color: 0x9B59B6, killScore: 2 },
        spitter: { hp: 4,  speed: 1.2,  scale: 0.95, color: 0x27AE60, killScore: 2 },
        boss:    { hp: 200, speed: 0.8, scale: 3.2,  color: 0x8B1A1A, killScore: 50 }
    },

    // 僵尸攻击小队的距离
    ZOMBIE_ATTACK_DIST: 1.2,
    // 僵尸攻击间隔(秒)
    ZOMBIE_ATTACK_INTERVAL: 0.8,
    // 每次攻击杀死士兵数
    ZOMBIE_ATTACK_KILL: 1,

    // 相机
    CAMERA_OFFSET_Y: 8.5,
    CAMERA_OFFSET_Z: 7.5,
    CAMERA_LOOK_AHEAD: -4,
    CAMERA_FOLLOW_X: 0.35,

    // 特效
    PARTICLE_MAX: 300,

    // 颜色方案
    COLORS: {
        sky: 0xB0DFFF,
        fog: 0xC8E8FF,
        road: 0xC8CDD4,
        roadEdge: 0xDDE8F5,
        grass: 0x7EC850,
        grassDark: 0x6BB840,
        soldierBlue: 0x4A90D9,
        soldierHelmet: 0x3A7BC8,
        soldierVest: 0x2E5F8A,
        skin: 0xF5C99B,
        bulletGold: 0xFFD700,
        gateGlass: 0x88CCFF,
    }
};

// ===== 关卡数据 =====
// type: 'gates' 状态门 | 'wave' 僵尸波 | 'boss' Boss战
// gates: 每个门占一条跑道 lane: 0左 1中 2右
const LEVELS = [
    {
        name: '第 1 关',
        startCount: 1,
        totalZ: -150,
        segments: [
            { type: 'gates', z: -14, gates: [
                { lane: 0, op: 'add', value: 5,  label: '+5' },
                { lane: 2, op: 'mul', value: 2,  label: '×2' }
            ]},
            { type: 'gates', z: -28, gates: [
                { lane: 0, op: 'add', value: 10, label: '+10' },
                { lane: 2, op: 'mul', value: 2,  label: '×2' }
            ]},
            { type: 'wave', z: -42, enemies: [
                { type: 'normal', count: 8 }
            ]},
            { type: 'gates', z: -56, gates: [
                { lane: 0, op: 'add', value: 8,  label: '+8' },
                { lane: 2, op: 'mul', value: 2,  label: '×2' }
            ]},
            { type: 'wave', z: -70, enemies: [
                { type: 'normal', count: 10 },
                { type: 'fast',   count: 4 }
            ]},
            { type: 'gates', z: -84, gates: [
                { lane: 0, op: 'add', value: 10, label: '+10' },
                { lane: 2, op: 'buff', value: 'damage', label: '输出+1' }
            ]},
            { type: 'wave', z: -98, enemies: [
                { type: 'normal', count: 12 },
                { type: 'shield', count: 3 }
            ]},
            { type: 'gates', z: -112, gates: [
                { lane: 0, op: 'mul', value: 2,  label: '×2' },
                { lane: 2, op: 'buff', value: 'firerate', label: '射速+20%' }
            ]},
            { type: 'wave', z: -126, enemies: [
                { type: 'normal', count: 10 },
                { type: 'fast',   count: 6 },
                { type: 'spitter',count: 2 }
            ]},
            { type: 'boss', z: -142, boss: { type: 'boss', hp: 200 } }
        ]
    }
];