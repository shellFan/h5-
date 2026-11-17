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

    // ===== V5.1 节奏控制 (持续推进模式, V5.1.1 尸潮密度强化) =====
    PACING: {
        waveTriggerAhead: 14,       // 波次激活提前量(队伍距波点z, 世界单位)
        spawnIntervalMin: 0.18,
        spawnIntervalMax: 0.3,
        batchGapMin: 0.25,          // V5.1.1: 同一波内后续批次密接间隔 — alive持续堆积成墙
        batchGapMax: 0.4,
        batchSizeBase: 8,           // V5.1.5: 批次与目标活敌匹配(旧上限16导致alive永远堆不到目标)
        batchSizeMax: 48,
        fillFrameInterval: 0.01,
        trickleInterval: 0.15,      // V5.1.5: 涓流冷却(秒/只) — alive达标后6.7只/s持续施压
        spawnDepth: 8,
        spawnDistance: 14,          // 留足开火距离，不贴脸刷新
        bossTriggerAhead: 24,
        bossWarningTime: 2.0,
        bossSpawnSetback: 4,
        firstContactGrace: 0.65,
        waveRestMin: 0.35,
        waveRestMax: 0.65
    },

    // ===== V5.1 每关场上活敌上限矩阵 (尸潮规模, 非同屏全部) =====
    MAX_ALIVE: [70, 140, 190, 260, 240],  // V5.1.5: 超级尸潮 — L5=240(Boss关兼顾竞速)
    ALIVE_TARGET: [40, 80, 110, 150, 120],  // V5.1.5: 每关期望同屏活敌 — L5=120(Boss关)
    // V6.0: 末日核心主题(第6关) — 场景配色/雾气/灯光与能源核心参数
    APOCALYPSE_THEME: {
        sky: 0x4A2C3A, fog: 0x5A3040, fogNear: 30, fogFar: 95,
        grass: 0x3E5C43, grassDark: 0x33503A, road: 0x6E6470, roadEdge: 0x5A5060,
        hemiSky: 0x8A6070, hemiGround: 0x2E3A30, sunColor: 0xFFB0A0, sunIntensity: 0.55,
        coreHp: 900, coreBuffRadius: 9, coreBuffInterval: 4.5,
        star2Count: 250, star3Kills: 700
    },
    // 试玩强化：每关 authored wave 总量×3，并提高同屏密度。
    ENEMY_WAVE_MULTIPLIER: 3,
    ENEMY_MAX_ALIVE_MULTIPLIER: 2.2,
    ENEMY_ALIVE_TARGET_MULTIPLIER: 2,
    ENEMY_HP_MULTIPLIER: [1.7, 2.2, 2.8, 3.4, 4.0, 4.6], // V6.0: 追加L6=4.6(原数组仅5项, L6索引越界→NaN血量)


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
    ZOMBIE_ATTACK_INTERVAL: 1.05,
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
        grass: 0x719C80,
        grassDark: 0x537A64,
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
            { type: 'wave', z: -18, enemies: [ { type: 'normal', count: 48 } ] },
            { type: 'gates', z: -28, gates: [
                { lane: 0, op: 'add', value: 5, label: '+5' },
                { lane: 1, op: 'buff', value: 'damage', label: '输出+1' },
                { lane: 2, op: 'add', value: 8, label: '+8' }
            ]},
            { type: 'wave', z: -40, enemies: [ { type: 'normal', count: 54 }, { type: 'fast', count: 18 } ] },
            { type: 'gates', z: -52, gates: [
                { lane: 0, op: 'buff', value: 'firerate', label: '射速+10%' },
                { lane: 1, op: 'add', value: 8, label: '+8' },
                { lane: 2, op: 'buff', value: 'crit', label: '暴击+5%' }
            ]},
            { type: 'wave', z: -64, enemies: [ { type: 'normal', count: 60 }, { type: 'fast', count: 24 } ] },
            { type: 'wave', z: -78, enemies: [ { type: 'normal', count: 60 } ] }
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
            { type: 'wave', z: -20, enemies: [ { type: 'fast', count: 60 }, { type: 'normal', count: 48 } ] },
            { type: 'gates', z: -34, gates: [
                { lane: 0, op: 'skill', value: 'roll' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -46, enemies: [ { type: 'fast', count: 84 }, { type: 'normal', count: 48 } ] },
            { type: 'gates', z: -60, gates: [
                { lane: 0, op: 'buff', value: 'firerate', label: '射速+10%' },
                { lane: 1, op: 'add', value: 8, label: '+8' },
                { lane: 2, op: 'buff', value: 'damage', label: '输出+1' }
            ]},
            { type: 'wave', z: -72, enemies: [ { type: 'fast', count: 69 }, { type: 'normal', count: 36 }, { type: 'shield', count: 9 } ] },
            { type: 'wave', z: -86, enemies: [ { type: 'fast', count: 36 } ] }
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
            { type: 'wave', z: -22, enemies: [ { type: 'shield', count: 54 }, { type: 'normal', count: 69 } ] },
            { type: 'gates', z: -36, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'mul', value: 2, label: '\u00d72' },
                { lane: 2, op: 'buff', value: 'firerate', label: '射速+10%' }
            ]},
            { type: 'wave', z: -50, enemies: [ { type: 'shield', count: 78 }, { type: 'fast', count: 54 } ] },
            { type: 'gates', z: -64, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'buff', value: 'freeze', label: '冰冻弹' }
            ]},
            { type: 'wave', z: -78, enemies: [ { type: 'shield', count: 69 }, { type: 'normal', count: 69 }, { type: 'spitter', count: 15 } ] },
            { type: 'wave', z: -94, enemies: [ { type: 'shield', count: 39 }, { type: 'normal', count: 54 }, { type: 'spitter', count: 24 } ] },
            { type: 'wave', z: -108, enemies: [ { type: 'shield', count: 39 }, { type: 'fast', count: 39 } ] }
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
            { type: 'wave', z: -22, enemies: [ { type: 'split', count: 51 }, { type: 'fast', count: 66 } ] },
            { type: 'gates', z: -36, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'mul', value: 2, label: '\u00d72' }
            ]},
            { type: 'wave', z: -50, enemies: [ { type: 'split', count: 93 }, { type: 'shield', count: 36 }, { type: 'fast', count: 51 } ] },
            { type: 'gates', z: -64, gates: [ { lane: 0, op: 'skill', value: 'roll' }, { lane: 1, op: 'skill', value: 'roll' }, { lane: 2, op: 'skill', value: 'roll' } ] },
            { type: 'wave', z: -78, enemies: [ { type: 'split', count: 66 }, { type: 'spitter', count: 51 }, { type: 'normal', count: 66 } ] },
            { type: 'wave', z: -94, enemies: [ { type: 'split', count: 93 }, { type: 'fast', count: 78 }, { type: 'shield', count: 27 } ] },
            { type: 'wave', z: -108, enemies: [ { type: 'split', count: 51 }, { type: 'spitter', count: 36 } ] }
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
            { type: 'wave', z: -22, enemies: [ { type: 'normal', count: 87 }, { type: 'fast', count: 75 } ] },
            { type: 'gates', z: -38, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出+2' }
            ]},
            { type: 'wave', z: -52, enemies: [ { type: 'elite', count: 15 }, { type: 'shield', count: 51 }, { type: 'normal', count: 75 } ] },
            { type: 'gates', z: -68, gates: [
                { lane: 0, op: 'buff', value: 'freeze', label: '冰冻弹' },
                { lane: 1, op: 'buff', value: 'vamp', label: '吸血' },
                { lane: 2, op: 'mul', value: 2, label: '\u00d72' }
            ]},
            { type: 'wave', z: -82, enemies: [ { type: 'split', count: 66 }, { type: 'spitter', count: 51 }, { type: 'fast', count: 66 } ] },
            { type: 'gates', z: -96, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'buff', value: 'chain', label: '连锁闪电' },
                { lane: 2, op: 'buff', value: 'crit2', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -110, enemies: [ { type: 'elite', count: 18 }, { type: 'shield', count: 51 }, { type: 'spitter', count: 36 }, { type: 'normal', count: 66 } ] },
            { type: 'wave', z: -124, enemies: [ { type: 'elite', count: 15 }, { type: 'normal', count: 87 }, { type: 'fast', count: 51 } ] },
            { type: 'boss', z: -150, boss: { type: 'boss', hp: 2600 } }
        ]
    }
    ,
    // ============ 第6关 末日核心 · 尸潮源头 (V6.0 终局关) ============
    {
        name: '第 6 关 末日核心',
        startCount: 1,
        totalZ: -180,
        rewardCoins: 300,
        theme: 'apocalypse',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 18, label: '+18' },
                { lane: 1, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出+2' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'normal', count: 90 }, { type: 'fast', count: 60 } ] },
            { type: 'gates', z: -40, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出+2' }
            ]},
            { type: 'wave', z: -56, enemies: [ { type: 'elite', count: 6 }, { type: 'shield', count: 45 }, { type: 'normal', count: 60 } ] },
            { type: 'energy', z: -72, core: { hp: 900, buffRadius: 9 } },
            { type: 'gates', z: -86, gates: [
                { lane: 0, op: 'skill', value: 'roll' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -102, enemies: [ { type: 'elite', count: 8 }, { type: 'spitter', count: 40 }, { type: 'split', count: 45 }, { type: 'fast', count: 45 } ] },
            { type: 'gates', z: -118, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'buff', value: 'chain', label: '连锁闪电' },
                { lane: 2, op: 'buff', value: 'crit2', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -134, enemies: [ { type: 'elite', count: 10 }, { type: 'shield', count: 50 }, { type: 'spitter', count: 35 }, { type: 'normal', count: 70 } ] },
            { type: 'boss', z: -166, boss: { type: 'boss', hp: 5200, style: 'overlord', title: '末日吞噬者' } }
        ]
    }
    ,
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
    }];

// ===== V5.1 Boss 装配 =====
CONFIG.BOSS_STYLES = ['bruiser', 'bruiser', 'bulwark', 'hivelord', 'overlord', 'overlord'];
CONFIG.BOSS_NAMES = ['铁拳队长', '赤拳突击者', '钢盾领主', '裂变母巢', '终焉核心', '末日吞噬者'    ,
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
    }];
LEVELS.forEach(function(level, li) {
    level.bossStyle = CONFIG.BOSS_STYLES[li];
    level.segments.forEach(function(seg) {
        if (seg.type === 'boss') seg.boss.style = level.bossStyle;
    });
});

// V5.1.2: 每关首排门全部为人数门 — 任何首选都不会开局即死(填墙控制器下弱build首排选buff=秒杀)
LEVELS.forEach(function(level) {
    var firstGatesSeg = null;
    for (var i = 0; i < level.segments.length; i++) {
        if (level.segments[i].type === 'gates') { firstGatesSeg = level.segments[i]; break; }
    }
    if (!firstGatesSeg) return;
    var addGate = null;
    for (var j = 0; j < firstGatesSeg.gates.length; j++) {
        if (firstGatesSeg.gates[j].op === 'add') { addGate = firstGatesSeg.gates[j]; break; }
    }
    var base = addGate ? addGate.value : 10;
    var mid = Math.max(4, Math.round(base * 0.8));   // V5.1.3: 低档再上调(0.8/0.6) — ×3体量下弱build安全
    var low = Math.max(3, Math.round(base * 0.6));
    firstGatesSeg.gates = [
        { lane: 0, op: 'add', value: base, label: '+' + base },
        { lane: 1, op: 'add', value: mid,  label: '+' + mid },
        { lane: 2, op: 'add', value: low,  label: '+' + low }
    ];
});

// V5.1.3: 进度条终点对齐最后一段阵地 — 修复"进度条没走完就结算":
//   无Boss关: totalZ = 末波z-1(军团穿过末波, 清完即到终点)
//   Boss关:   totalZ = boss.z+4.5(Boss战驻停位, 击杀时进度恰好100%)
LEVELS.forEach(function(level) {
    var last = level.segments[level.segments.length - 1];
    level.totalZ = last.type === 'boss' ? last.z + 4.5 : last.z + 2;
});
