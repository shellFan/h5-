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
        soldierHelmet: 0x2563EB,
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

    // 门稀有度配色
    GATE_RARITY: {
        common:  { frame: 0x3B82F6, glass: 0x93C5FD, glow: 0x60A5FA },  // 蓝
        rare:    { frame: 0x8B5CF6, glass: 0xC4B5FD, glow: 0xA78BFA },  // 紫
        epic:    { frame: 0xF59E0B, glass: 0xFDE68A, glow: 0xFBBF24 },  // 金
        danger:  { frame: 0xEF4444, glass: 0xFCA5A5, glow: 0xF87171 },  // 红
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