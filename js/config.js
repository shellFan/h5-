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
    FORMATION_COLS: 7,          // 阵型基础列数(V4: 大人数自适应扩列, 见squad._updateFormation)
    FORMATION_SPACING_X: 0.52,
    FORMATION_SPACING_Z: 0.46,

    // ===== V4.0 移动手感 (P0: 全部可配置, 禁止写死在事件处理中) =====
    MOVE: {
        touchSensitivity: 0.65,     // 拖动屏幕宽度的65% = 横穿全部可玩范围
        followSmoothTime: 0.15,     // 队伍跟随目标的时间常数(秒): 越小越跟手, 0.15≈跟手带轻微平滑
        laneTransitionTime: 0.45,   // 磁吸收敛参考时长(秒)
        gateMagnetDist: 0.55,       // 门磁吸触发距离(仅轻微吸附已选中的门, 不代选)
        gateMagnetLambda: 6.0,      // 磁吸阻尼强度
        centerMargin: 0.12,         // 队伍边缘与路缘的最小间隙
        minCenterRange: 1.1,        // 大人数时中心保底可移动范围(配合门触发窗口扩展保证门可达)
        keyStep: 1.2                // 键盘单次移动距离(世界单位)
    },

    // ===== V4.0 节奏控制 (P0: 全部真实游戏秒, 与帧率无关) =====
    PACING: {
        waveTriggerAhead: 14,       // 波次激活提前量(队伍距波点z, 世界单位)
        spawnIntervalMin: 0.8,      // 批次生成间隔下限(秒)
        spawnIntervalMax: 1.5,      // 批次生成间隔上限(秒)
        batchSizeBase: 1,           // 批次规模下限(只/批)
        batchSizeMax: 4,            // 批次规模上限
        maxAliveBase: 10,           // 场上活敌上限基准(L1), 每关+1
        maxAliveCap: 20,            // 场上活敌上限封顶
        spawnDepth: 9,              // 生成纵深(z向散布, 屏幕外逐步涌入)
        bossTriggerAhead: 24,       // Boss预警提前量(世界单位)
        bossWarningTime: 1.6,       // Boss预警展示时长(秒)
        bossSpawnSetback: 4,        // Boss出生点向屏幕外后退量(禁止贴脸刷新)
        firstContactGrace: 0.5      // 波激活后首批生成延迟(观察窗口, 秒)
    },

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

// ===== 关卡数据 =====
// type: 'gates' 状态门 | 'wave' 僵尸波 | 'boss' Boss战
// gates: 每个门占一条跑道 lane: 0左 1中 2右
const LEVELS = [
    // ============ 第1关 新手膨胀 ============
    {
        name: '第 1 关 新手膨胀',
        startCount: 1,
        totalZ: -150,
        segments: [
            { type: 'gates', z: -10, gates: [
                { lane: 0, op: 'add', value: 5, label: '+5' },
                { lane: 2, op: 'mul', value: 2, label: '×2' }
            ]},
            { type: 'gates', z: -24, gates: [
                { lane: 0, op: 'add', value: 10, label: '+10' },
                { lane: 2, op: 'mul', value: 2, label: '×2' }
            ]},
            { type: 'wave', z: -38, enemies: [
                { type: 'normal', count: 8 }
            ]},
            { type: 'gates', z: -52, gates: [
                { lane: 0, op: 'add', value: 8, label: '+8' },
                { lane: 2, op: 'buff', value: 'damage', label: '输出+1' }
            ]},
            { type: 'wave', z: -66, enemies: [
                { type: 'normal', count: 10 },
                { type: 'fast', count: 4 }
            ]},
            { type: 'gates', z: -80, gates: [
                { lane: 0, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'firerate', label: '射速+20%' }
            ]},
            { type: 'wave', z: -94, enemies: [
                { type: 'normal', count: 10 },
                { type: 'shield', count: 3 }
            ]},
            { type: 'gates', z: -108, gates: [
                { lane: 0, op: 'add', value: 10, label: '+10' },
                { lane: 2, op: 'mul', value: 2, label: '×2' }
            ]},
            { type: 'wave', z: -122, enemies: [
                { type: 'normal', count: 10 },
                { type: 'fast', count: 6 },
                { type: 'spitter', count: 2 }
            ]},
            { type: 'boss', z: -140, boss: { type: 'boss', hp: 200 } }
        ]
    },
    // ============ 第2关 快尸来袭 ============
    {
        name: '第 2 关 快尸来袭',
        startCount: 1,
        totalZ: -155,
        segments: [
            { type: 'gates', z: -10, gates: [
                { lane: 0, op: 'add', value: 8, label: '+8' },
                { lane: 2, op: 'buff', value: 'pierce', label: '穿透+1' }
            ]},
            { type: 'wave', z: -26, enemies: [
                { type: 'fast', count: 12 },
                { type: 'normal', count: 6 }
            ]},
            { type: 'gates', z: -44, gates: [
                { lane: 0, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'firerate', label: '射速+20%' }
            ]},
            { type: 'wave', z: -60, enemies: [
                { type: 'fast', count: 14 },
                { type: 'normal', count: 8 }
            ]},
            { type: 'gates', z: -78, gates: [
                { lane: 0, op: 'buff', value: 'crit', label: '暴击+10%' },
                { lane: 2, op: 'add', value: 12, label: '+12' }
            ]},
            { type: 'wave', z: -94, enemies: [
                { type: 'fast', count: 16 },
                { type: 'spitter', count: 3 }
            ]},
            { type: 'gates', z: -110, gates: [
                { lane: 0, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'pierce', label: '穿透+1' }
            ]},
            { type: 'wave', z: -126, enemies: [
                { type: 'fast', count: 14 },
                { type: 'normal', count: 10 }
            ]},
            { type: 'boss', z: -144, boss: { type: 'boss', hp: 280 } }
        ]
    },
    // ============ 第3关 盾墙 ============
    {
        name: '第 3 关 盾墙',
        startCount: 1,
        totalZ: -160,
        segments: [
            { type: 'gates', z: -10, gates: [
                { lane: 0, op: 'add', value: 10, label: '+10' },
                { lane: 2, op: 'buff', value: 'damage', label: '输出+1' }
            ]},
            { type: 'wave', z: -32, enemies: [
                { type: 'normal', count: 8 },
                { type: 'shield', count: 5 }
            ]},
            { type: 'gates', z: -46, gates: [
                { lane: 0, op: 'buff', value: 'crit', label: '暴击+10%' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出×2' }
            ]},
            { type: 'wave', z: -64, enemies: [
                { type: 'shield', count: 8 },
                { type: 'fast', count: 6 }
            ]},
            { type: 'gates', z: -82, gates: [
                { lane: 0, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'pierce', label: '穿透+1' }
            ]},
            { type: 'wave', z: -100, enemies: [
                { type: 'shield', count: 10 },
                { type: 'normal', count: 12 }
            ]},
            { type: 'gates', z: -118, gates: [
                { lane: 0, op: 'add', value: 15, label: '+15' },
                { lane: 2, op: 'buff', value: 'damage', label: '输出+1' }
            ]},
            { type: 'wave', z: -134, enemies: [
                { type: 'shield', count: 8 },
                { type: 'spitter', count: 4 }
            ]},
            { type: 'boss', z: -150, boss: { type: 'boss', hp: 360 } }
        ]
    },
    // ============ 第4关 分裂潮 ============
    {
        name: '第 4 关 分裂潮',
        startCount: 1,
        totalZ: -160,
        segments: [
            { type: 'gates', z: -10, gates: [
                { lane: 0, op: 'add', value: 10, label: '+10' },
                { lane: 2, op: 'buff', value: 'freeze', label: '冰冻弹' }
            ]},
            { type: 'wave', z: -34, enemies: [
                { type: 'split', count: 6 },
                { type: 'normal', count: 4 }
            ]},
            { type: 'gates', z: -46, gates: [
                { lane: 0, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'freeze', label: '冰冻弹' }
            ]},
            { type: 'wave', z: -66, enemies: [
                { type: 'split', count: 8 },
                { type: 'fast', count: 6 }
            ]},
            { type: 'gates', z: -82, gates: [
                { lane: 0, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'pierce', label: '穿透+1' }
            ]},
            { type: 'wave', z: -100, enemies: [
                { type: 'split', count: 12 },
                { type: 'shield', count: 4 }
            ]},
            { type: 'gates', z: -118, gates: [
                { lane: 0, op: 'add', value: 15, label: '+15' },
                { lane: 2, op: 'buff', value: 'crit', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -134, enemies: [
                { type: 'split', count: 10 },
                { type: 'fast', count: 8 }
            ]},
            { type: 'boss', z: -150, boss: { type: 'boss', hp: 420 } }
        ]
    },
    // ============ 第5关 吐痰者 ============
    {
        name: '第 5 关 吐痰者',
        startCount: 1,
        totalZ: -165,
        segments: [
            { type: 'gates', z: -10, gates: [
                { lane: 0, op: 'add', value: 12, label: '+12' },
                { lane: 2, op: 'buff', value: 'vamp', label: '吸血' }
            ]},
            { type: 'wave', z: -34, enemies: [
                { type: 'spitter', count: 4 },
                { type: 'normal', count: 8 }
            ]},
            { type: 'gates', z: -46, gates: [
                { lane: 0, op: 'buff', value: 'vamp', label: '吸血' },
                { lane: 2, op: 'buff', value: 'firerate', label: '射速+20%' }
            ]},
            { type: 'wave', z: -64, enemies: [
                { type: 'spitter', count: 7 },
                { type: 'fast', count: 8 }
            ]},
            { type: 'gates', z: -82, gates: [
                { lane: 0, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'crit', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -100, enemies: [
                { type: 'spitter', count: 8 },
                { type: 'shield', count: 6 },
                { type: 'normal', count: 8 }
            ]},
            { type: 'gates', z: -118, gates: [
                { lane: 0, op: 'add', value: 15, label: '+15' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出×2' }
            ]},
            { type: 'wave', z: -136, enemies: [
                { type: 'spitter', count: 8 },
                { type: 'fast', count: 10 }
            ]},
            { type: 'boss', z: -154, boss: { type: 'boss', hp: 480 } }
        ]
    },
    // ============ 第6关 双线压力 ============
    {
        name: '第 6 关 双线压力',
        startCount: 1,
        totalZ: -170,
        segments: [
            { type: 'gates', z: -10, gates: [
                { lane: 0, op: 'add', value: 12, label: '+12' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出×2' }
            ]},
            { type: 'wave', z: -34, enemies: [
                { type: 'fast', count: 8 },
                { type: 'spitter', count: 4 }
            ]},
            { type: 'gates', z: -46, gates: [
                { lane: 0, op: 'buff', value: 'firerate', label: '射速+20%' },
                { lane: 2, op: 'buff', value: 'vamp', label: '吸血' }
            ]},
            { type: 'wave', z: -64, enemies: [
                { type: 'fast', count: 12 },
                { type: 'spitter', count: 7 },
                { type: 'shield', count: 3 }
            ]},
            { type: 'gates', z: -82, gates: [
                { lane: 0, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'freeze', label: '冰冻弹' }
            ]},
            { type: 'wave', z: -100, enemies: [
                { type: 'fast', count: 14 },
                { type: 'spitter', count: 8 },
                { type: 'normal', count: 10 }
            ]},
            { type: 'gates', z: -118, gates: [
                { lane: 0, op: 'add', value: 18, label: '+18' },
                { lane: 2, op: 'mul', value: 2, label: '×2' }
            ]},
            { type: 'wave', z: -138, enemies: [
                { type: 'fast', count: 14 },
                { type: 'spitter', count: 8 },
                { type: 'shield', count: 6 }
            ]},
            { type: 'boss', z: -158, boss: { type: 'boss', hp: 550 } }
        ]
    },
    // ============ 第7关 尸海 ============
    {
        name: '第 7 关 尸海',
        startCount: 1,
        totalZ: -175,
        segments: [
            { type: 'gates', z: -10, gates: [
                { lane: 0, op: 'add', value: 20, label: '+20' },
                { lane: 2, op: 'mul', value: 2, label: '×2' }
            ]},
            { type: 'wave', z: -34, enemies: [
                { type: 'normal', count: 16 },
                { type: 'fast', count: 8 }
            ]},
            { type: 'gates', z: -46, gates: [
                { lane: 0, op: 'mul', value: 3, label: '×3' },
                { lane: 2, op: 'add', value: 20, label: '+20' }
            ]},
            { type: 'wave', z: -66, enemies: [
                { type: 'normal', count: 24 },
                { type: 'fast', count: 12 }
            ]},
            { type: 'gates', z: -84, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 2, op: 'mul', value: 2, label: '×2' }
            ]},
            { type: 'wave', z: -104, enemies: [
                { type: 'normal', count: 26 },
                { type: 'fast', count: 14 },
                { type: 'spitter', count: 6 }
            ]},
            { type: 'gates', z: -122, gates: [
                { lane: 0, op: 'add', value: 25, label: '+25' },
                { lane: 2, op: 'buff', value: 'crit', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -142, enemies: [
                { type: 'normal', count: 24 },
                { type: 'fast', count: 16 },
                { type: 'shield', count: 6 }
            ]},
            { type: 'boss', z: -164, boss: { type: 'boss', hp: 650 } }
        ]
    },
    // ============ 第8关 精英军团 ============
    {
        name: '第 8 关 精英军团',
        startCount: 1,
        totalZ: -180,
        segments: [
            { type: 'gates', z: -10, gates: [
                { lane: 0, op: 'add', value: 15, label: '+15' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出×2' }
            ]},
            { type: 'wave', z: -36, enemies: [
                { type: 'elite', count: 1 },
                { type: 'normal', count: 10 }
            ]},
            { type: 'gates', z: -48, gates: [
                { lane: 0, op: 'buff', value: 'crit', label: '暴击+10%' },
                { lane: 2, op: 'buff', value: 'pierce', label: '穿透+1' }
            ]},
            { type: 'wave', z: -68, enemies: [
                { type: 'elite', count: 2 },
                { type: 'shield', count: 6 },
                { type: 'fast', count: 6 }
            ]},
            { type: 'gates', z: -86, gates: [
                { lane: 0, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'vamp', label: '吸血' }
            ]},
            { type: 'wave', z: -106, enemies: [
                { type: 'elite', count: 3 },
                { type: 'split', count: 6 },
                { type: 'normal', count: 12 }
            ]},
            { type: 'gates', z: -124, gates: [
                { lane: 0, op: 'add', value: 20, label: '+20' },
                { lane: 2, op: 'mul', value: 2, label: '×2' }
            ]},
            { type: 'wave', z: -144, enemies: [
                { type: 'elite', count: 3 },
                { type: 'spitter', count: 6 },
                { type: 'fast', count: 10 }
            ]},
            { type: 'boss', z: -168, boss: { type: 'boss', hp: 750 } }
        ]
    },
    // ============ 第9关 终局前夜 ============
    {
        name: '第 9 关 终局前夜',
        startCount: 1,
        totalZ: -185,
        segments: [
            { type: 'gates', z: -10, gates: [
                { lane: 0, op: 'add', value: 20, label: '+20' },
                { lane: 2, op: 'buff', value: 'freeze', label: '冰冻弹' }
            ]},
            { type: 'wave', z: -36, enemies: [
                { type: 'normal', count: 12 },
                { type: 'fast', count: 8 },
                { type: 'spitter', count: 6 }
            ]},
            { type: 'gates', z: -48, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出×2' },
                { lane: 2, op: 'buff', value: 'crit', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -68, enemies: [
                { type: 'shield', count: 8 },
                { type: 'split', count: 8 },
                { type: 'fast', count: 10 }
            ]},
            { type: 'gates', z: -86, gates: [
                { lane: 0, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'pierce', label: '穿透+1' }
            ]},
            { type: 'wave', z: -106, enemies: [
                { type: 'elite', count: 2 },
                { type: 'spitter', count: 8 },
                { type: 'normal', count: 16 }
            ]},
            { type: 'gates', z: -124, gates: [
                { lane: 0, op: 'add', value: 25, label: '+25' },
                { lane: 2, op: 'mul', value: 3, label: '×3' }
            ]},
            { type: 'wave', z: -146, enemies: [
                { type: 'elite', count: 3 },
                { type: 'shield', count: 8 },
                { type: 'fast', count: 12 }
            ]},
            { type: 'boss', z: -172, boss: { type: 'boss', hp: 900 } }
        ]
    },
    // ============ 第10关 终极膨胀 ============
    {
        name: '第 10 关 终极膨胀',
        startCount: 1,
        totalZ: -190,
        segments: [
            { type: 'gates', z: -10, gates: [
                { lane: 0, op: 'add', value: 25, label: '+25' },
                { lane: 2, op: 'mul', value: 3, label: '×3' }
            ]},
            { type: 'wave', z: -36, enemies: [
                { type: 'normal', count: 16 },
                { type: 'fast', count: 10 }
            ]},
            { type: 'gates', z: -48, gates: [
                { lane: 0, op: 'mul', value: 3, label: '×3' },
                { lane: 2, op: 'risk', value: 0, label: '-30% 输出+2' }
            ]},
            { type: 'wave', z: -70, enemies: [
                { type: 'elite', count: 3 },
                { type: 'split', count: 10 },
                { type: 'fast', count: 12 }
            ]},
            { type: 'gates', z: -88, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出×2' },
                { lane: 2, op: 'buff', value: 'vamp', label: '吸血' }
            ]},
            { type: 'wave', z: -108, enemies: [
                { type: 'elite', count: 4 },
                { type: 'shield', count: 10 },
                { type: 'spitter', count: 8 }
            ]},
            { type: 'gates', z: -126, gates: [
                { lane: 0, op: 'add', value: 30, label: '+30' },
                { lane: 2, op: 'mul', value: 3, label: '×3' }
            ]},
            { type: 'wave', z: -148, enemies: [
                { type: 'elite', count: 4 },
                { type: 'normal', count: 20 },
                { type: 'fast', count: 14 },
                { type: 'spitter', count: 8 }
            ]},
            { type: 'boss', z: -178, boss: { type: 'boss', hp: 1200 } }
        ]
    }
];

// ===== V4.0 关卡扩容: 单局时长从~30s扩到2-4分钟(验收标准) =====
// 中段(门+波)循环3次, 数量按1/1.7/2.6递增; 段间距×1.15; Boss血量表按长关卡重调
(function() {
    var BOSS_HP = [500, 700, 900, 1100, 1400, 1700, 2100, 2500, 3000, 3600];
    var WAVE_MUL = [1, 1.7, 2.6];
    var MUL_SOFTEN = [1, 1, 2]; // rep2起mul降档: ×3→×2, ×2→大额add
    LEVELS.forEach(function(level, li) {
        var body = level.segments.filter(function(s) { return s.type !== 'boss'; });
        var boss = null;
        level.segments.forEach(function(s) { if (s.type === 'boss') boss = s; });
        if (!boss || body.length < 2) return;
        var deltas = [];
        for (var i = 1; i < body.length; i++) deltas.push(body[i - 1].z - body[i].z);
        var out = [];
        var z = body[0].z;
        for (var rep = 0; rep < 3; rep++) {
            for (var i = 0; i < body.length; i++) {
                var seg = JSON.parse(JSON.stringify(body[i]));
                seg.z = Math.round(z);
                if (seg.type === 'gates' && MUL_SOFTEN[rep] > 1) {
                    // 重复周期: mul门降档, 防人数过快顶到500上限失去张力
                    seg.gates = seg.gates.map(function(gd) {
                        if (gd.op === 'mul' && gd.value >= 3) return { lane: gd.lane, op: 'mul', value: 2, label: '\u00d72' };
                        if (gd.op === 'mul') return { lane: gd.lane, op: 'add', value: 15 + li * 2, label: '+' + (15 + li * 2) };
                        return gd;
                    });
                }
                if (seg.type === 'wave') {
                    seg.enemies = seg.enemies.map(function(e) {
                        return { type: e.type, count: Math.max(2, Math.round(e.count * WAVE_MUL[rep])) };
                    });
                }
                out.push(seg);
                z -= (deltas[i] || 14) * 1.5;
            }
        }
        boss = JSON.parse(JSON.stringify(boss));
        boss.z = Math.round(z - 14);
        boss.boss.hp = BOSS_HP[li];
        out.push(boss);
        level.segments = out;
        level.totalZ = boss.z - 12;
    });
})();
