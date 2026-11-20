// ===== game-bundle.js (V12 微信小游戏构建产物: 单一模块作用域, 源脚本按 index.html 顺序拼接) =====
// 生成: tools/build-wechat.js @ 2026-11-20T19:15:25.779Z
// 代码与 H5 完全同源; 平台差异收敛于入口 game.js
/* ==== index.html 内联脚本(BootProgress/错误横幅, H5 中先于业务脚本执行 — 保序) ==== */

        // V11 QA: 游戏版本标识(首页品牌栏读取; 与package.json同步维护)
        window.__GAME_VERSION = 'v12.0';
        // VNext: 加载进度追踪器(被 soldier-loader / enemy-models 调用; 仅统计真实文件进度, 无定时器伪造)
        window.__BootProgress = {
            files: {}, total: 26, // 2士兵 + 12×2 僵尸/Boss GLB
            file: function(url, loaded, total) {
                this.files[url] = { loaded: loaded, total: total };
                var sum = 0, done = 0;
                for (var k in this.files) {
                    var f = this.files[k];
                    sum += Math.min(1, f.loaded / Math.max(1, f.total));
                    if (f.loaded >= f.total) done++;
                }
                var pct = Math.min(99, Math.round(sum / this.total * 100));
                var bar = document.getElementById('boot-bar-fill');
                var pctEl = document.getElementById('boot-pct');
                if (bar) bar.style.width = pct + '%';
                if (pctEl) pctEl.textContent = pct + '%';
                var stage = document.getElementById('boot-stage');
                if (stage && done < this.total) {
                    stage.textContent = '加载战场资源 ' + done + '/' + this.total + ' (士兵/僵尸/Boss模型)';
                }
            },
            stage: function(text, pct) {
                var stage = document.getElementById('boot-stage');
                var pctEl = document.getElementById('boot-pct');
                var bar = document.getElementById('boot-bar-fill');
                if (stage) stage.textContent = text;
                if (pctEl && pct !== undefined) pctEl.textContent = pct + '%';
                if (bar && pct !== undefined) bar.style.width = pct + '%';
            },
            done: function() {
                var bar = document.getElementById('boot-bar-fill');
                var pctEl = document.getElementById('boot-pct');
                if (bar) bar.style.width = '100%';
                if (pctEl) pctEl.textContent = '100%';
            }
        };
    
;

        // 全局错误捕获: 将JS错误显示在页面上便于诊断
        window.addEventListener('error', function(e) {
            var div = document.getElementById('error-display');
            if (!div) {
                div = document.createElement('div');
                div.id = 'error-display';
                div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC0000;color:#fff;padding:8px 12px;font-size:13px;font-family:monospace;white-space:pre-wrap;pointer-events:none;';
                document.body.appendChild(div);
            }
            div.textContent += (div.textContent ? '\n' : '') + '[错误] ' + e.message + (e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '');
        });
    
/* ==== THREE 加载检测(H5 中位于 three.min.js 之后 — THREE 已由入口接线) ==== */

        // 检测Three.js是否加载成功
        if (typeof THREE === 'undefined') {
            document.addEventListener('DOMContentLoaded', function() {
                var div = document.getElementById('error-display');
                if (!div) {
                    div = document.createElement('div');
                    div.id = 'error-display';
                    div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC0000;color:#fff;padding:8px 12px;font-size:13px;font-family:monospace;white-space:pre-wrap;pointer-events:none;';
                    document.body.appendChild(div);
                }
                div.textContent = '[错误] Three.js 本地文件缺失，请检查部署完整性';
            });
        }
    

/* ===== [[ js/config.js ]] ===== */
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
    // V10 QA修复: 扩容到10关(原5项靠 Math.min 钳制使 L6-L10 复用 L5 数值)
    MAX_ALIVE: [70, 140, 190, 260, 240, 240, 240, 240, 240, 240],  // V5.1.5: 超级尸潮 — L5=240(Boss关兼顾竞速)
    ALIVE_TARGET: [40, 80, 110, 150, 120, 120, 120, 120, 120, 120],  // V5.1.5: 每关期望同屏活敌 — L5=120(Boss关)
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
    ENEMY_HP_MULTIPLIER: [1.7, 2.2, 2.8, 3.4, 4.0, 2.8, 2.2, 2.5, 2.8, 2.6], // V8.0.1: L6=4.6为HP乘数bug时期标定(150敌×4.6实测开局10s全灭); L7-L10大编制波次以数量为难度主轴


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
        bomber:  { hp: 6,  speed: 2.0,  scale: 1.32, color: 0xC94B4B, killScore: 2 }, // V11.5: 爆炸僵尸(死亡自爆波及)
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
                { lane: 0, op: 'addpct', value: 50, label: '+50%' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -56, enemies: [ { type: 'elite', count: 5 }, { type: 'shield', count: 35 }, { type: 'normal', count: 55 } ] },
            { type: 'energy', z: -72, core: { hp: 900, buffRadius: 9 } },
            { type: 'gates', z: -86, gates: [
                { lane: 0, op: 'add', value: 25, label: '+25' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'pierce', label: '穿透+1' }
            ]},
            { type: 'wave', z: -102, enemies: [ { type: 'elite', count: 8 }, { type: 'spitter', count: 40 }, { type: 'split', count: 45 }, { type: 'fast', count: 45 } ] },
            { type: 'gates', z: -118, gates: [
                { lane: 0, op: 'addpct', value: 40, label: '+40%' },
                { lane: 1, op: 'buff', value: 'chain', label: '连锁闪电' },
                { lane: 2, op: 'buff', value: 'crit2', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -134, enemies: [ { type: 'elite', count: 10 }, { type: 'shield', count: 50 }, { type: 'spitter', count: 35 }, { type: 'normal', count: 70 } ] },
            { type: 'gates', z: -150, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'explosive', label: '爆炸弹' }
            ]},
            { type: 'boss', z: -166, boss: { type: 'boss', hp: 5200, style: 'overlord', title: '末日吞噬者' } }
        ]
    }
    ,
    // ============ 第7关 地下巢穴 (V8.0, V8.0.1: 补人数门防软锁) ============
    {
        name: '第 7 关 地下巢穴',
        startCount: 1,
        totalZ: -180,
        rewardCoins: 350,
        theme: 'cave',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 25, label: '+25' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'normal', count: 80 }, { type: 'fast', count: 50 } ] },
            { type: 'gates', z: -40, gates: [
                { lane: 0, op: 'addpct', value: 30, label: '+30%' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -56, enemies: [ { type: 'elite', count: 6 }, { type: 'fast', count: 60 }, { type: 'normal', count: 50 } ] },
            { type: 'wave', z: -78, enemies: [ { type: 'elite', count: 5 }, { type: 'shield', count: 40 }, { type: 'spitter', count: 25 } ] },
            { type: 'gates', z: -96, gates: [
                { lane: 0, op: 'add', value: 20, label: '+20' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'chain', label: '连锁闪电' }
            ]},
            { type: 'wave', z: -112, enemies: [ { type: 'elite', count: 8 }, { type: 'split', count: 60 }, { type: 'shield', count: 40 } ] },
            { type: 'gates', z: -128, gates: [
                { lane: 0, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'crit2', label: '暴击+10%' }
            ]},
            { type: 'boss', z: -148, boss: { type: 'boss', hp: 4500, style: 'hivelord', title: '巢穴之母' } }
        ]
    },
    // ============ 第8关 机械废土 (V8.0, V8.0.1: 全关零人数门修复) ============
    {
        name: '第 8 关 机械废土',
        startCount: 1,
        totalZ: -190,
        rewardCoins: 400,
        theme: 'mechanical',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 25, label: '+25' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'shield', count: 40 }, { type: 'normal', count: 60 }, { type: 'fast', count: 40 } ] },
            { type: 'gates', z: -42, gates: [
                { lane: 0, op: 'addpct', value: 30, label: '+30%' },
                { lane: 1, op: 'buff', value: 'chain', label: '连锁闪电' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -58, enemies: [ { type: 'elite', count: 8 }, { type: 'spitter', count: 40 }, { type: 'fast', count: 50 }, { type: 'bomber', count: 10 } ] },
            { type: 'energy', z: -76, core: { hp: 1400, buffRadius: 10 } },
            { type: 'gates', z: -92, gates: [
                { lane: 0, op: 'add', value: 20, label: '+20' },
                { lane: 1, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -108, enemies: [ { type: 'elite', count: 10 }, { type: 'shield', count: 50 }, { type: 'normal', count: 70 } ] },
            { type: 'gates', z: -124, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'crit2', label: '暴击+10%' }
            ]},
            { type: 'boss', z: -148, boss: { type: 'boss', hp: 5500, style: 'titan', title: '机械巨尸' } }
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
                { lane: 0, op: 'add', value: 45, label: '+45' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'elite', count: 6 }, { type: 'normal', count: 80 }, { type: 'fast', count: 60 } ] },
            { type: 'gates', z: -42, gates: [
                { lane: 0, op: 'addpct', value: 50, label: '+50%' },
                { lane: 1, op: 'buff', value: 'freeze', label: '冰冻弹' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -58, enemies: [ { type: 'elite', count: 10 }, { type: 'shield', count: 60 }, { type: 'spitter', count: 45 } ] },
            { type: 'gates', z: -76, gates: [
                { lane: 0, op: 'add', value: 30, label: '+30' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'chain', label: '连锁闪电' }
            ]},
            { type: 'wave', z: -92, enemies: [ { type: 'elite', count: 10 }, { type: 'split', count: 50 }, { type: 'fast', count: 60 }, { type: 'normal', count: 70 } ] },
            { type: 'gates', z: -112, gates: [
                { lane: 0, op: 'addpct', value: 40, label: '+40%' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'boss', z: -130, boss: { type: 'boss', hp: 3500, style: 'bulwark', title: '钢盾领主' } },
            { type: 'boss', z: -166, boss: { type: 'boss', hp: 3500, style: 'hivelord', title: '裂变母巢' } }
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
                { lane: 0, op: 'add', value: 40, label: '+40' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -26, enemies: [ { type: 'elite', count: 8 }, { type: 'normal', count: 80 }, { type: 'fast', count: 70 }, { type: 'bomber', count: 12 } ] },
            { type: 'gates', z: -44, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -60, enemies: [ { type: 'elite', count: 14 }, { type: 'shield', count: 80 }, { type: 'spitter', count: 50 }, { type: 'bomber', count: 10 } ] },
            { type: 'energy', z: -78, core: { hp: 2000, buffRadius: 10 } },
            { type: 'gates', z: -94, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'chain', label: '连锁闪电' }
            ]},
            { type: 'wave', z: -110, enemies: [ { type: 'elite', count: 16 }, { type: 'split', count: 70 }, { type: 'shield', count: 70 }, { type: 'fast', count: 70 } ] },
            { type: 'gates', z: -128, gates: [
                { lane: 0, op: 'addpct', value: 50, label: '+50%' },
                { lane: 1, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -144, enemies: [ { type: 'elite', count: 14 }, { type: 'spitter', count: 40 }, { type: 'shield', count: 40 }, { type: 'normal', count: 80 }, { type: 'fast', count: 60 } ] },
            { type: 'gates', z: -162, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -178, enemies: [ { type: 'elite', count: 16 }, { type: 'normal', count: 90 }, { type: 'fast', count: 70 }, { type: 'shield', count: 40 }, { type: 'spitter', count: 35 } ] },
            { type: 'boss', z: -208, boss: { type: 'boss', hp: 10000, style: 'overlord', title: '末日主宰' } }
        ]
    }];

// ===== V5.1 Boss 装配 =====
CONFIG.BOSS_STYLES = ['bruiser', 'bruiser', 'bulwark', 'hivelord', 'overlord', 'overlord', 'hivelord', 'titan', 'bulwark', 'overlord'];
CONFIG.BOSS_NAMES = ['铁拳队长', '赤拳突击者', '钢盾领主', '裂变母巢', '终焉核心', '末日吞噬者', '巢穴之母', '机械巨尸', '钢盾领主', '末日主宰'];
// V8.0修复: BOSS_NAMES数组曾未闭合 — L7-L10关卡定义被吞进数组(LEVELS外的重复块),
// 导致BOSS_NAMES[6..9]=关卡对象(Boss血条显示[object Object])且关卡体积膨胀。
LEVELS.forEach(function(level, li) {
    if (!level.bossStyle) level.bossStyle = CONFIG.BOSS_STYLES[li];
    level.segments.forEach(function(seg) {
        // V8.0: 尊重关卡内已写明的Boss体格(L9双Boss各自不同), 缺省才按关索引装配
        if (seg.type === 'boss' && !seg.boss.style) seg.boss.style = level.bossStyle;
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


/* ===== [[ js/utils.js ]] ===== */
// ===== 工具函数 =====

/** 缓动: 弹出回弹 */
function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** 缓动: 平滑 */
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

/** 线性插值 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/** 帧率无关的阻尼插值 */
function damp(current, target, lambda, dt) {
    return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** 限制范围 */
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

/** 随机范围 */
function randRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * V5.1 战斗运动学辅助: 方向符号统一取自 CONFIG.DIRS, 任何文件不得散写正负号。
 * 约定(见 config.js DIRS): 玩家面朝-Z推进; 怪物朝+Z追击防线; 子弹朝-Z飞行。
 */
var BattleKinematics = {
    /** 玩家前进: 返回新 z */
    advanceZ: function(z, speed, dt) {
        return z + CONFIG.DIRS.FORWARD_SIGN * speed * dt;
    },
    /** 怪物向防线追击: 返回新 z */
    enemyApproachZ: function(z, speed, dt) {
        return z + CONFIG.DIRS.ENEMY_ADVANCE_SIGN * speed * dt;
    },
    /** 子弹飞行: 返回新 z */
    bulletZ: function(z, speed, dt) {
        return z + CONFIG.DIRS.SHOOT_SIGN * speed * dt;
    }
}; // V10.1: 移除无调用的 atDefenseLine

/**
 * 将多个 BufferGeometry 合并为一个，支持顶点色。
 * 所有几何体必须具有 position、normal、uv 属性。
 */
function mergeGeometries(geometries) {
    let totalVerts = 0;
    let totalIndices = 0;
    for (let i = 0; i < geometries.length; i++) {
        const g = geometries[i];
        totalVerts += g.attributes.position.count;
        if (g.index) totalIndices += g.index.count;
        else totalIndices += g.attributes.position.count;
    }

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const colors = new Float32Array(totalVerts * 3);
    const indices = new (totalVerts > 65535 ? Uint32Array : Uint16Array)(totalIndices);

    let vOff = 0;
    let iOff = 0;
    for (let i = 0; i < geometries.length; i++) {
        const g = geometries[i];
        const cnt = g.attributes.position.count;

        positions.set(g.attributes.position.array, vOff * 3);
        normals.set(g.attributes.normal.array, vOff * 3);
        if (g.attributes.uv) {
            uvs.set(g.attributes.uv.array, vOff * 2);
        }
        if (g.attributes.color) {
            colors.set(g.attributes.color.array, vOff * 3);
        }

        if (g.index) {
            const idx = g.index.array;
            for (let j = 0; j < idx.length; j++) {
                indices[iOff + j] = idx[j] + vOff;
            }
            iOff += idx.length;
        } else {
            for (let j = 0; j < cnt; j++) {
                indices[iOff + j] = j + vOff;
            }
            iOff += cnt;
        }
        vOff += cnt;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
    return merged;
}

/**
 * 给几何体添加顶点色
 */
function colorize(geo, hexColor) {
    const cnt = geo.attributes.position.count;
    const colors = new Float32Array(cnt * 3);
    const c = new THREE.Color(hexColor);
    for (let i = 0; i < cnt; i++) {
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
}

/**
 * 变换几何体: 旋转+平移+缩放，然后返回新引用
 */

/**
 * 创建 Canvas 文字纹理 (用于状态门数值等)
 */
function createTextTexture(text, opts) {
    opts = opts || {};
    const maxFontSize = opts.fontSize || 80;
    const canvasHeight = opts.height || 128;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 先用最大字号测量文字宽度，自适应缩放字号确保完整显示
    ctx.font = '900 ' + maxFontSize + 'px Arial, sans-serif';
    var metrics = ctx.measureText(text);
    var textWidth = metrics.width;
    // 画布宽度 = 文字宽度 + 左右padding，上限512
    var canvasWidth = Math.min(Math.ceil(textWidth + maxFontSize * 0.6), 512);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 若文字超宽则缩小字号
    var fontSize = maxFontSize;
    if (textWidth > canvasWidth - maxFontSize * 0.4) {
        fontSize = Math.floor(maxFontSize * (canvasWidth - maxFontSize * 0.4) / textWidth);
    }

    if (opts.bg) {
        ctx.fillStyle = opts.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = '900 ' + fontSize + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 描边
    if (opts.stroke) {
        ctx.strokeStyle = opts.stroke;
        ctx.lineWidth = opts.strokeWidth || 8;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    }

    ctx.fillStyle = opts.fill || '#ffffff';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/* ===== [[ js/economy.js ]] ===== */
// ===== V5.1 金币经济与永久档案 =====
// 存档: 经 Platform.storage(GameStorage 前缀 pz_squad_) 持久化, H5 localStorage / 小游戏 tt 存储通吃。
// 铁律:
//  - 胜利奖励每关只发一次(claimedRewards 幂等), 刷新/重进/重复通关都不再入账
//  - 击杀金币局终一次性入账(失败也给, 但上限低, 不鼓励故意失败刷钱)
//  - 旧存档(pz_progress 解锁进度)自动迁移, 不清空

var ECONOMY_RULES = {
    PROFILE_KEY: 'profile_v51',
    PROFILE_VERSION: 3,
    KILL_COIN_RATE: 0.8,          // V5.1.5: 每击杀 0.8 金币(超级尸潮下升级资金需求提升)
    KILL_COIN_WIN_CAP_RATIO: 0.5, // V5.1.5: 胜利局击杀币上限 = 关卡奖励×50%
    KILL_COIN_LOSE_CAP: 70,       // V5.1.5: 失败保底=胜利上限(超级尸潮下防软锁; 赢仍2倍+首通奖励优于刷)
    LEGACY_PROGRESS_KEY: 'pz_progress' // V3.3 旧解锁进度键(迁移源)
};

class GameProfile {
    /**
     * @param storage GameStorage(带前缀) — 档案主存储
     * @param rawAdapter 原始存储适配器(读旧版 pz_progress 迁移键, 无前缀)
     */
    constructor(storage, rawAdapter) {
        this._storage = storage;
        this._raw = rawAdapter || null;
        this._data = this._load();
    }

    _load() {
        var raw = null;
        try { raw = this._storage.getSafe ? this._storage.getSafe(ECONOMY_RULES.PROFILE_KEY, null) : this._storage.get(ECONOMY_RULES.PROFILE_KEY, null); } catch (e) {}
        if (raw && typeof raw === 'object') {
            // V8.0: 分版本迁移链 — v1→v2(星级/成就)→v3(武器/科技/签到)
            if ((raw.profileVersion || 0) >= 3) return this._normalize(raw);
            if (typeof Progression !== 'undefined') raw = Progression.migrate(raw);
            return this._normalize(raw);
        }
        // 首次建档: 迁移旧版解锁进度(旧键在原始存储层, 无前缀)
        var legacyUnlocked = 1;
        try {
            var legacy = null;
            if (this._raw && this._raw.get) legacy = this._raw.get(ECONOMY_RULES.LEGACY_PROGRESS_KEY, null);
            if (typeof legacy === 'number') legacyUnlocked = legacy;
            else if (typeof legacy === 'string' && /^\d+$/.test(legacy)) legacyUnlocked = parseInt(legacy);
        } catch (e) {}
        return this._normalize({
            profileVersion: ECONOMY_RULES.PROFILE_VERSION,
            coins: 0,
            unlockedLevel: Math.max(1, legacyUnlocked || 1),
            upgrades: { recruit: 0, logistics: 0, gun: 0, rapid: 0, pierce: 0 },
            totalKills: 0,
            totalWins: 0,
            bestSquadCount: 0,
            claimedRewards: {}
        });
    }

    _normalize(d) {
        return {
            profileVersion: ECONOMY_RULES.PROFILE_VERSION,
            coins: Math.max(0, Math.floor(d.coins || 0)),
            unlockedLevel: Math.max(1, Math.floor(d.unlockedLevel || 1)),
            upgrades: {
                recruit: Math.max(0, Math.floor((d.upgrades && d.upgrades.recruit) || 0)),
                logistics: Math.max(0, Math.floor((d.upgrades && d.upgrades.logistics) || 0)),
                gun: Math.max(0, Math.floor((d.upgrades && d.upgrades.gun) || 0)),
                rapid: Math.max(0, Math.floor((d.upgrades && d.upgrades.rapid) || 0)),
                pierce: Math.max(0, Math.floor((d.upgrades && d.upgrades.pierce) || 0))
            },
            totalKills: Math.max(0, Math.floor(d.totalKills || 0)),
            totalWins: Math.max(0, Math.floor(d.totalWins || 0)),
            bestSquadCount: Math.max(0, Math.floor(d.bestSquadCount || 0)),
            claimedRewards: d.claimedRewards || {},
            // V6.0: 星级/经验/成就/统计
            stars: d.stars || {},
            xp: Math.max(0, Math.floor(d.xp || 0)),
            playerLevel: Math.max(1, Math.floor(d.playerLevel || 1)),
            achievements: d.achievements || {},
            achievements_meta: d.achievements_meta || {},
            stats: d.stats || { bossKills: 0, eliteKills: 0, playTime: 0 },
            // V8.0: 武器/科技/签到
            weapon: d.weapon || 'rifle',
            weaponLevel: Math.max(0, Math.floor(d.weaponLevel || 0)),
            weaponEvolved: d.weaponEvolved || null,
            tech: d.tech || {},
            techPoints: Math.max(0, Math.floor(d.techPoints || 0)),
            signin: d.signin || { lastDate: '', streak: 0, totalDays: 0 },
            // V8.0.1修复: 以下字段曾不在白名单 → 每次启动被 _normalize 静默丢弃
            // (挑战最高纪录/每日任务进度/士兵训练等级/装备全部无法持久化)
            challengeBest: d.challengeBest || {},
            daily: d.daily || null,
            soldier: d.soldier || null,
            equipment: d.equipment || {},
            // V10 QA修复: pendingSupply(免费补给待领标记, 原刷新后广告奖励蒸发) / bossSeen(Boss图鉴遭遇标记)
            pendingSupply: d.pendingSupply || null,
            bossSeen: d.bossSeen || {},
            // VNext: 职业/装备背包/排行榜战绩
            classId: d.classId || 'rifleman',
            bag: d.bag || [],
            records: d.records || [],
            weaponAffix: d.weaponAffix || null, // V11.3: 武器词条持久化
            classMastery: d.classMastery || {} // V11.4: 职业专精
        };
    }

    save() {
        // V12: 主档带 .bak 双写; 读侧损坏自动回退备份(GameStorage.getSafe), 不静默清档
        if (this._storage.setSafe) { try { this._storage.setSafe(ECONOMY_RULES.PROFILE_KEY, this._data); } catch (e) {} return; }
        try { this._storage.set(ECONOMY_RULES.PROFILE_KEY, this._data); } catch (e) {}
    }
    get data() { return this._data; }
    get coins() { return this._data.coins; }

    /** 原子入账(金币只增不减经由 spend), 返回新余额 */
    addCoins(n) {
        this._data.coins = Math.max(0, this._data.coins + Math.floor(n));
        this.save();
        return this._data.coins;
    }

    /** 消费: 余额不足返回 false 且不动账(防重复扣款) */
    spend(n) {
        n = Math.floor(n);
        if (n < 0 || this._data.coins < n) return false;
        this._data.coins -= n;
        this.save();
        return true;
    }

    /** 幂等奖励键: 已领返回 false, 未领标记并入账 */
    claimReward(key, coins) {
        if (this._data.claimedRewards[key]) return false;
        this._data.claimedRewards[key] = { t: Date.now(), coins: Math.floor(coins) };
        if (coins) this._data.coins += Math.floor(coins);
        this.save();
        return true;
    }

    hasClaimed(key) { return !!this._data.claimedRewards[key]; }

    /** 记录一局统计; won=true 时解锁下一关(返回是否新解锁) */
    recordRun(levelIndex, kills, maxSquad, won, levelCount) {
        this._data.totalKills += Math.max(0, Math.floor(kills));
        var newUnlocked = false;
        if (won) {
            this._data.totalWins += 1;
            var next = Math.min((levelCount || 5), levelIndex + 2);
            if (next > this._data.unlockedLevel) {
                this._data.unlockedLevel = next;
                newUnlocked = true;
            }
        }
        if (maxSquad > this._data.bestSquadCount) this._data.bestSquadCount = maxSquad;
        this.save();
        return newUnlocked;
    }
}

/**
 * 一局结算(唯一入账入口, 幂等):
 * @param magnetBonus 磁力吸附技能击杀币加成(V11 QA修复[P3]: 原经 arguments[6] 隐式传参, 现入正式签名)
 * @returns {levelReward, killReward, doubled, total} — total 为本局实际入账金币
 */
function settleRunEconomy(profile, level, levelIndex, kills, won, useDoubleAd, magnetBonus) {
    // V10 QA: 科技后勤线接线(原 log_coin/log_supply 科技购买后无任何效果)
    var tech = (typeof TechTree !== 'undefined' && profile) ? TechTree.combatStats(profile) : null;
    var coinMul = tech ? tech.coinMul : 1;
    var coinPerKill = tech ? tech.coinPerKill : 0;
    var reward = level.rewardCoins || 60;
    var levelReward = 0;
    if (won) {
        // 胜利奖励每关一次(幂等键), 后勤加成只作用于首次发放
        var gain = Math.round(reward * (1 + 0.10 * (profile.data.upgrades.logistics || 0)) * coinMul);
        if (profile.claimReward('win:L' + levelIndex, 0)) {
            levelReward = gain; // 先记账, 金币在下方统一入账
        }
    }
    var cap = won
        ? Math.round(reward * ECONOMY_RULES.KILL_COIN_WIN_CAP_RATIO)
        : ECONOMY_RULES.KILL_COIN_LOSE_CAP;
    var killReward = Math.min(cap, Math.floor(kills * (ECONOMY_RULES.KILL_COIN_RATE + coinPerKill)));
    // V6.0: 磁力吸附技能 — 击杀币加成(V11 QA: arguments[6] 隐式传参已入正式签名 magnetBonus)
    if (magnetBonus) killReward = Math.min(cap * 2, Math.floor(killReward * (1 + 0.5 * magnetBonus)));
    var base = levelReward + killReward;
    var total = base;
    if (won && useDoubleAd && levelReward > 0) {
        // 双倍广告: 仅对本次结算的关卡奖励生效(击杀币不翻倍)
        total = levelReward * 2 + killReward;
    }
    if (total > 0) profile.addCoins(total);
    // 确保胜利奖励键已标记(即使经双倍路径)
    if (won && !profile.hasClaimed('win:L' + levelIndex)) {
        profile.claimReward('win:L' + levelIndex, 0);
    }
    return { levelReward: levelReward, killReward: killReward, doubled: !!(won && useDoubleAd && levelReward > 0), total: total };
}


/* ===== [[ js/energy-core.js ]] ===== */
// ===== V6.0 病毒能源核心 (第6关特殊玩法) =====
// 独立生命值/受击反馈/发光/伤害数字/击破动画与奖励。
// 存活时周期性强化半径内僵尸(移速+35%/攻速+25%/绿色感染染色)；击破后周围僵尸失去强化。
// 由 Game 在含 energy 段的关卡生成；战斗系统通过 takeBulletHit 注入伤害。

class EnergyCore {
    constructor(scene, x, z, cfg, game) {
        this.scene = scene;
        this.game = game;
        this.x = x; this.z = z;
        this.hp = cfg.hp || 900;
        this.maxHp = this.hp;
        this.radius = cfg.buffRadius || 9;
        this.buffInterval = cfg.buffInterval || 4.5;
        this._buffTimer = 1.2; // 首次强化较快, 让玩家立刻感知机制
        this.alive = true;
        this.dying = false;
        this._spin = 0;

        var group = new THREE.Group();
        // 核心球体(发光绿)
        var coreMat = new THREE.MeshStandardMaterial({
            color: 0x39D98A, emissive: 0x1F8F55, emissiveIntensity: 1.4,
            roughness: 0.35, metalness: 0.2
        });
        this.coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), coreMat);
        this.coreMesh.position.y = 2.6;
        this.coreMesh.castShadow = true;
        group.add(this.coreMesh);
        // 旋转环(双色)
        var ringMat = new THREE.MeshBasicMaterial({ color: 0x9CFFC4, transparent: true, opacity: 0.75 });
        this.ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.09, 8, 40), ringMat);
        this.ringMesh.position.y = 2.6;
        group.add(this.ringMesh);
        var ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 8, 32),
            new THREE.MeshBasicMaterial({ color: 0x2FA868, transparent: true, opacity: 0.85 }));
        ring2.position.y = 2.6;
        ring2.rotation.x = Math.PI / 2.6;
        group.add(ring2);
        this._ring2 = ring2;
        // 基座(能源塔)
        var baseMat = new THREE.MeshStandardMaterial({ color: 0x37474F, roughness: 0.8, metalness: 0.4 });
        var base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 1.6, 8), baseMat);
        base.position.y = 0.8;
        base.castShadow = true;
        group.add(base);
        // 点光源(绿)
        this.light = new THREE.PointLight(0x39D98A, 1.6, this.radius * 2.4);
        this.light.position.y = 2.8;
        group.add(this.light);
        // 强化半径圈(地面)
        var aura = new THREE.Mesh(new THREE.RingGeometry(this.radius - 0.35, this.radius, 48),
            new THREE.MeshBasicMaterial({ color: 0x39D98A, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
        aura.rotation.x = -Math.PI / 2;
        aura.position.y = 0.06;
        group.add(aura);
        this.auraMesh = aura;
        // 血条(双色平面, 面向相机由 update 处理)
        var barBg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.3),
            new THREE.MeshBasicMaterial({ color: 0x101820, transparent: true, opacity: 0.72, depthWrite: false }));
        barBg.position.y = 4.6;
        group.add(barBg);
        this.barBg = barBg;
        this.barFill = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.2),
            new THREE.MeshBasicMaterial({ color: 0x39D98A, depthWrite: false }));
        this.barFill.position.y = 4.6;
        this.barFill.position.z = 0.01;
        group.add(this.barFill);

        group.position.set(x, 0, z);
        group.userData.artSource = 'V6 energy-core (procedural)';
        scene.add(group);
        this.model = group;

        // 相机朝向的血条(每帧对齐)
        this._hpQuad = new THREE.Object3D();
    }

    /** 战斗系统注入伤害; 返回是否击破 */
    takeBulletHit(dmg, effects) {
        if (!this.alive || this.dying) return false;
        this.hp -= dmg;
        if (effects) {
            effects.impact(this.x, 2.6, this.z, false, false);
            if (Math.random() < 0.3) effects.floatText(this.x + randRange(-0.6, 0.6), 3.2, this.z, String(dmg), '#66FFB3', false);
            effects.burst(this.x, 2.6, this.z, 0x66FFB3, 4, 2.2, 0.3);
        }
        if (this.hp <= 0) {
            this.destroyed(effects);
            return true;
        }
        return false;
    }

    destroyed(effects) {
        this.alive = false;
        this.dying = true;
        this._dieT = 0;
        if (effects) {
            effects.burst(this.x, 2.6, this.z, 0x66FFB3, 26, 5, 0.8);
            effects.burst(this.x, 2.6, this.z, 0xFFFFFF, 14, 4, 0.5);
            effects.shockwave(this.x, 0.08, this.z, 0x39D98A);
            effects.floatText(this.x, 4.2, this.z, '能源核心击破!', '#66FFB3', true);
        }
        if (this.game && this.game.world) this.game.world.shake(0.45);
        // 击破奖励(一次性, 幂等由关卡结算外的即时金币承担, 数值固定)
        if (this.game && this.game.profile) this.game.profile.addCoins(60);
        if (effects) effects.floatText(this.x, 3.4, this.z, '+60', '#FFC247', true);
        if (this.game) this.game.onCoreDestroyed && this.game.onCoreDestroyed();
    }

    update(dt, time, squad, enemies, effects) {
        if (this.dying) {
            this._dieT += dt;
            var k = Math.max(0.001, 1 - this._dieT / 0.7);
            this.model.scale.setScalar(k);
            this.coreMesh.material.emissiveIntensity = 1.4 * k + Math.random() * 0.6;
            if (this._dieT >= 0.7) {
                this.scene.remove(this.model);
                this.dying = false; this.removed = true;
            }
            return;
        }
        if (!this.alive) return;
        // 旋转/呼吸/脉动
        this._spin += dt * 1.6;
        this.coreMesh.rotation.y = this._spin;
        this.ringMesh.rotation.z = this._spin * 1.3;
        this._ring2.rotation.z = -this._spin * 0.9;
        this.coreMesh.position.y = 2.6 + Math.sin(time * 2.2) * 0.12;
        this.light.intensity = 1.4 + Math.sin(time * 3.1) * 0.35;
        this.auraMesh.material.opacity = 0.13 + Math.sin(time * 2.4) * 0.05;
        // 血条对齐相机
        var cam = this.scene.userData.camera;
        if (cam) {
            this.barBg.quaternion.copy(cam.quaternion);
            this.barFill.quaternion.copy(cam.quaternion);
            var ratio = Math.max(0, this.hp / this.maxHp);
            this.barFill.scale.x = ratio;
            this.barFill.position.x = -1.25 * (1 - ratio);
            this.barFill.material.color.setHex(ratio > 0.5 ? 0x39D98A : ratio > 0.25 ? 0xFFC247 : 0xE45B68);
        }
        // 周期强化半径内僵尸
        this._buffTimer -= dt;
        if (this._buffTimer <= 0) {
            this._buffTimer = this.buffInterval;
            var buffed = 0;
            for (var i = 0; i < enemies.length; i++) {
                var e = enemies[i];
                if (!e.alive || e.isBoss) continue;
                var dx = e.x - this.x, dz = e.z - this.z;
                if (dx * dx + dz * dz < this.radius * this.radius) {
                    e.speedMul = Math.max(e.speedMul || 1, 1.35);
                    e.attackMul = Math.min(e.attackMul || 1, 0.75);
                    e._coreBuffed = true;
                    buffed++;
                }
            }
            if (buffed > 0 && effects) {
                effects.floatText(this.x, 4.0, this.z, '能源强化 ×' + buffed, '#66FFB3', false);
                effects.shockwave(this.x, 0.06, this.z, 0x39D98A);
            }
        }
        // 失去强化的僵尸恢复(每帧扫描, 数量可控)
        for (var j = 0; j < enemies.length; j++) {
            var m = enemies[j];
            if (!m._coreBuffed) continue;
            var mdx = m.x - this.x, mdz = m.z - this.z;
            if (!this.alive || mdx * mdx + mdz * mdz > this.radius * this.radius * 1.25) {
                m.speedMul = 1; m.attackMul = 1; m._coreBuffed = false;
            }
        }
    }

    destroy(scene) {
        scene.remove(this.model);
        this.model.traverse(function(o) {
            if (o.geometry) o.geometry.dispose();
            if (o.material && o.material.dispose) o.material.dispose();
        });
    }
}


/* ===== [[ js/skills.js ]] ===== */
// ===== V6.0 肉鸽技能系统 =====
// 技能门(op:'skill')三选一; 技能有等级(重复选择升层), 立即生效。
// 配置集中: SKILL_DEFS。应用入口: Skills.apply(squad, id)。

var SKILL_DEFS = {
    rage: {
        name: '狂暴射击', icon: '🔥', maxLevel: 3, quality: 'epic',
        desc: '伤害 ×(1+0.35×层), 全局持续',
        apply: function(squad, lv) { squad._skillRage = lv; }
    },
    drone: {
        name: '支援无人机', icon: '🛰️', maxLevel: 3, quality: 'epic',
        desc: '每层射速 +15%(火力全开组合 +25%/层)', // V10.1: 文案对齐实现(射速乘区, 无独立僚机实体)
        apply: function(squad, lv) { squad._skillDrones = lv; }
    },
    venom: {
        name: '毒液弹头', icon: '🧫', maxLevel: 3, quality: 'rare',
        desc: '命中附加中毒, 每层每秒造成 20% 伤害持续2秒',
        apply: function(squad, lv) { squad._skillVenom = lv; }
    },
    shield: {
        name: '能量护盾', icon: '🔵', maxLevel: 3, quality: 'rare',
        desc: '每层抵挡 2 次致命伤害(受击后冷却6秒恢复)',
        apply: function(squad, lv) { squad._skillShieldMax = lv * 2; if (!squad._skillShield) squad._skillShield = squad._skillShieldMax; }
    },
    magnet: {
        name: '磁力吸附', icon: '🧲', maxLevel: 2, quality: 'common',
        desc: '击杀金币获取 ×(1+0.5×层)',
        apply: function(squad, lv) { squad._skillMagnet = lv; }
    },
    berserk: {
        name: '背水一战', icon: '⚔️', maxLevel: 2, quality: 'rare',
        desc: '人数低于一半时伤害 ×(1+0.5×层)',
        apply: function(squad, lv) { squad._skillBerserk = lv; }
    },
    // ===== V11.2: 分类补缺(攻击/防御/人数/经济; 与既有6技能不重复) =====
    swiftness: {
        name: '迅捷弹幕', icon: '💨', maxLevel: 3, quality: 'common',
        desc: '攻速 +12% 每层',
        apply: function(squad, lv) { squad._skillSwiftness = lv; }
    },
    deadly: {
        name: '致命精准', icon: '🎖️', maxLevel: 3, quality: 'rare',
        desc: '暴击率 +6% 每层',
        apply: function(squad, lv) { squad._skillDeadly = lv; squad.critChance = Math.min(0.8, squad.critChance + 0.06); }
    },
    executioner: {
        name: '处决者', icon: '🗡️', maxLevel: 3, quality: 'epic',
        desc: '暴击伤害 +25% 每层',
        apply: function(squad, lv) { squad._critMul = 0.25 * lv; }
    },
    pierce_master: {
        name: '穿甲弹头', icon: '🔩', maxLevel: 2, quality: 'rare',
        desc: '穿透 +1 每层(上限5)',
        apply: function(squad, lv) { squad.pierce = Math.min(5, squad.pierce + 1); }
    },
    harvest: {
        name: '亡者征召', icon: '🕯️', maxLevel: 2, quality: 'epic',
        desc: '击杀 5% 概率补充1名士兵 每层',
        apply: function(squad, lv) { squad._skillHarvest = lv; }
    },
    fortune: {
        name: '实战经验', icon: '📖', maxLevel: 2, quality: 'common',
        desc: '结算经验 +15% 每层',
        apply: function(squad, lv) { squad._skillFortune = lv; }
    }
};

// ===== V8.0 技能组合 (同时持有特定技能时触发协同效果) =====
var SKILL_COMBOS = [
    { id: 'plague_fury',   name: '瘟疫狂怒', icon: '☠️', req: { rage: 1, venom: 1 },
      desc: '毒液伤害 ×2', apply: function(s) { s._comboPlagueFury = 1; } },
    { id: 'desperate_edge', name: '绝境锋芒', icon: '🗡️', req: { rage: 1, berserk: 1 },
      desc: '背水触发线提升至最大编制的60%', apply: function(s) { s._comboDesperate = 1; } },
    { id: 'swarm_venom',   name: '毒雾僚机', icon: '☣️', req: { drone: 1, venom: 1 },
      desc: '射速额外 +8%×毒液层', apply: function(s) { s._comboSwarmVenom = 1; } },
    { id: 'undying_will',  name: '不灭意志', icon: '🛡️', req: { shield: 1, berserk: 1 },
      desc: '护盾恢复冷却 6s → 3s', apply: function(s) { s._comboUndying = 1; } },
    { id: 'greed_fire',    name: '贪婪火力', icon: '💰', req: { magnet: 1, rage: 1 },
      desc: '击杀金币额外 +1 层磁力', apply: function(s) { s._comboGreedFire = 1; } },
    { id: 'recycle_drone', name: '回收无人机', icon: '♻️', req: { drone: 1, magnet: 1 },
      desc: '击杀 3% 概率补充1名士兵', apply: function(s) { s._comboRecycle = 1; } },
    { id: 'toxic_ward',    name: '毒性护盾', icon: '🧪', req: { venom: 1, shield: 1 },
      desc: '护盾格挡时毒化周围敌人', apply: function(s) { s._comboToxicWard = 1; } },
    { id: 'full_barrage',  name: '火力全开', icon: '🌪️', req: { rage: 1, drone: 1 },
      desc: '僚机射速加成 15% → 25% 每层', apply: function(s) { s._comboFullBarrage = 1; } },
    { id: 'venom_bounty',  name: '剧毒赏金', icon: '🪙', req: { venom: 1, magnet: 1 },
      desc: '击杀金币 +0.2/只', apply: function(s) { s._comboVenomBounty = 1; } },
    { id: 'guardian_fury', name: '守护之怒', icon: '⚔️', req: { shield: 1, rage: 1 },
      desc: '护盾可用时伤害 +25%', apply: function(s) { s._comboGuardianFury = 1; } },
    // ===== V11.2: 流派组合 =====
    { id: 'fire_flow', name: '火力流派', icon: '☄️', req: { rage: 1, swiftness: 1 },
      desc: '伤害 +15% & 射速 +10%', apply: function(s) { s._comboFireFlow = 1; } },
    { id: 'pierce_flow', name: '穿透流派', icon: '➤', req: { pierce_master: 1, swiftness: 1 },
      desc: '弹丸穿透 +1', apply: function(s) { s._comboPierceFlow = 1; } },
    { id: 'swarm_flow', name: '虫群流派', icon: '🐜', req: { harvest: 1, magnet: 1 },
      desc: '征召概率 ×1.5', apply: function(s) { s._comboSwarmFlow = 1; } }
];

var Skills = {
    /** 应用技能层到 squad(叠加式, 幂等重算) */
    apply: function(squad, id) {
        if (!SKILL_DEFS[id]) return;
        if (!squad._skills) squad._skills = {};
        squad._skills[id] = Math.min(SKILL_DEFS[id].maxLevel, (squad._skills[id] || 0) + 1);
        SKILL_DEFS[id].apply(squad, squad._skills[id]);
        this.checkCombos(squad);
    },

    /** V8.0: 重算全部组合(技能变化后调用, 幂等) */
    checkCombos: function(squad) {
        if (!squad._skills) return [];
        squad._comboPlagueFury = 0; squad._comboDesperate = 0; squad._comboSwarmVenom = 0;
        squad._comboUndying = 0; squad._comboGreedFire = 0; squad._comboRecycle = 0;
        squad._comboToxicWard = 0; squad._comboFullBarrage = 0; squad._comboVenomBounty = 0;
        squad._comboGuardianFury = 0;
        squad._comboFireFlow = 0; squad._comboPierceFlow = 0; squad._comboSwarmFlow = 0;
        var active = [];
        for (var i = 0; i < SKILL_COMBOS.length; i++) {
            var c = SKILL_COMBOS[i], ok = true;
            for (var id in c.req) {
                if ((squad._skills[id] || 0) < c.req[id]) { ok = false; break; }
            }
            if (ok) { c.apply(squad); active.push(c); }
        }
        return active;
    },

    /** 击杀金币加成汇总(magnet技能+组合), 供结算读取 */
    coinBonus: function(squad) {
        var bonus = squad._skillMagnet || 0;
        if (squad._comboGreedFire) bonus += 1;
        if (squad._comboVenomBounty) bonus += 0.2;
        return bonus;
    },

    /** 技能品质标签(普通/稀有/史诗) V11.2 */
    qualityOf: function(id) {
        var def = SKILL_DEFS[id];
        return def && def.quality ? def.quality : 'common';
    },
    qualityName: function(id) {
        var q = this.qualityOf(id);
        return q === 'epic' ? '史诗' : q === 'rare' ? '稀有' : '普通';
    },
    /** V11.2: 职业倾向 — 偏好技能加权(副本进候选), 不排除其它技能 */
    CLASS_SKILL_BIAS: {
        rifleman: [],
        gunner: ['swiftness', 'swiftness', 'drone'],
        marksman: ['deadly', 'executioner', 'pierce_master'],
        medic: ['shield', 'harvest', 'magnet']
    },
    /** 门数据工厂: 未满级技能池按职业倾向加权随机3个不重复 */
    rollChoices: function(squad) {
        var pool = [];
        for (var id in SKILL_DEFS) {
            var lv = squad._skills ? (squad._skills[id] || 0) : 0;
            if (lv < SKILL_DEFS[id].maxLevel) pool.push(id);
        }
        if (!pool.length) return null;
        var weighted = pool.slice();
        var bias = (squad._gameRef && squad._gameRef._classStats && this.CLASS_SKILL_BIAS[squad._gameRef._classStats.id]) || [];
        for (var b = 0; b < bias.length; b++) {
            if (pool.indexOf(bias[b]) >= 0) weighted.push(bias[b]);
        }
        var picks = [];
        while (picks.length < 3 && weighted.length) {
            var pick = weighted.splice(Math.floor(Math.random() * weighted.length), 1)[0];
            if (picks.indexOf(pick) < 0) picks.push(pick);
        }
        return picks;
    }
};


/* ===== [[ js/affixes.js ]] ===== */
// ===== V6.0 精英词缀系统 =====
// 精英僵尸随机获得1-2个词缀, 词缀修改属性并添加视觉标识。
// 词缀强度随关卡等级增长。

var AFFIX_DEFS = {
    frenzy:   { name: '狂暴', icon: '💥', apply: function(e) { e.speedMul = (e.speedMul || 1) * 1.5; } },
    hard:     { name: '坚硬', icon: '🔒', apply: function(e) { e.hp *= 1.6; e.maxHp = e.hp; } },
    vampiric: { name: '吸血', icon: '🩸', apply: function(e) { e._affixVamp = true; } },
    splitter: { name: '分裂', icon: '🧬', apply: function(e) { e._affixSplit = true; } },
    venom:    { name: '毒液', icon: '🧪', apply: function(e) { e._affixVenom = true; } },
    shielded: { name: '护盾', icon: '🔵', apply: function(e) { e._affixShield = true; e._affixShieldT = 0; } }
};

var AffixSystem = {
    /** 给精英怪随机分配词缀(1-2个, 不重复) */
    roll: function(enemy, levelIndex) {
        if (enemy.type !== 'elite') return;
        var keys = Object.keys(AFFIX_DEFS);
        var count = 1 + (Math.random() < 0.3 + levelIndex * 0.1 ? 1 : 0);
        var picked = [];
        var copy = keys.slice();
        for (var i = 0; i < count && copy.length; i++) {
            var idx = Math.floor(Math.random() * copy.length);
            picked.push(copy.splice(idx, 1)[0]);
        }
        enemy.affixes = picked;
        enemy.affixNames = picked.map(function(k) { return AFFIX_DEFS[k].name; }).join('+');
        picked.forEach(function(k) { AFFIX_DEFS[k].apply(enemy); });
        // 视觉: 词缀色环
        enemy._affixColor = picked.length >= 2 ? 0xFF4444 : 0xFFAA33;
    },
    /** 每帧处理词缀效果 */
    update: function(enemy, dt, squad, manager, effects) {
        if (!enemy.affixes || !enemy.alive) return;
        // 吸血: 攻击时恢复
        if (enemy._affixVamp && enemy.attackT > 0) {
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + 2);
        }
        // 护盾: 周期性生成
        if (enemy._affixShield) {
            enemy._affixShieldT = (enemy._affixShieldT || 0) - dt;
            if (enemy._affixShieldT <= 0) {
                enemy._affixShieldT = 6;
                enemy.shieldT = 2.5;
            }
        }
        // 毒液: 攻击附带持续伤害
        if (enemy._affixVenom && enemy.attackT > 0 && squad.count > 0) {
            squad._venomStacks = Math.max(squad._venomStacks || 0, 1);
            squad._venomFromElite = 8;
            squad._venomApplied = 0; // 单次附毒上限重置
        }
        // V10 QA修复: 毒液此前只写不读(词缀完全无效) — 小队侧持续减员DoT, 单次附毒最多4人/计数>3时生效
        if ((squad._venomFromElite || 0) > 0 && ((manager && manager._levelIndex) || 0) >= 3) { // V10 QA: 毒液DoT自L4起生效(早期关卡小队规模小, 不引入减员压力)
            squad._venomFromElite -= dt;
            squad._venomTick = (squad._venomTick || 0) + dt;
            if (squad._venomTick >= 2) { // 每2秒1跳
                squad._venomTick = 0;
                if (squad.count > 8 && (squad._venomApplied || 0) < 2) { // 单次附毒上限2人, 小队>8人才生效(保持L3边际胜率)
                    squad._venomApplied = (squad._venomApplied || 0) + 1;
                    squad.killSoldiers(1, effects);
                }
            }
            if (squad._venomFromElite <= 0) { squad._venomStacks = 0; }
        }
    },
    /** 死亡时分裂 */
    onDeath: function(enemy, manager) {
        if (!enemy.affixes) return;
        if (enemy._affixSplit) {
            for (var i = 0; i < 2; i++) {
                var mini = manager.spawnEnemy('normal', enemy.x + (i ? 0.5 : -0.5), enemy.z, 3);
                if (mini) { mini.model.scale.multiplyScalar(0.5); mini.visScale = mini.cfg.scale * 0.5; }
            }
        }
    }
};


/* ===== [[ js/growth.js ]] ===== */
// ===== V8.0 士兵成长 + 装备 + 军团训练中心 =====
// SoldierProgressionManager / SoldierEquipmentManager / GrowthSaveManager
// 全部属性统一进入 profile.soldier / profile.equipment

// —— 士兵等级配置 (1-50, 每10级一个阶段) ——
var SOLDIER_TIERS = [
    { max: 10,  name: '新兵',   color: '#4DA8FF' },
    { max: 20,  name: '精锐',   color: '#39D98A' },
    { max: 30,  name: '特种兵', color: '#FFC247' },
    { max: 40,  name: '王牌',   color: '#FF8844' },
    { max: 50,  name: '传奇',   color: '#FF4444' }
];

var SOLDIER_LEVEL_COST = function(lv) { return Math.round(50 * Math.pow(1.15, lv - 1)); };

// 每级属性成长
var SOLDIER_LEVEL_STATS = function(lv) {
    return {
        dmgBonus: Math.floor(lv / 5),           // 每5级+1伤害
        hpBonus: lv * 2,                        // 每级+2生命
        rateBonus: lv * 0.008,                  // 每级+0.8%射速
        critBonus: Math.min(0.25, lv * 0.005),  // 每级+0.5%暴击(上限25%)
        drBonus: Math.min(0.3, lv * 0.006),     // 每级+0.6%减伤(上限30%)
        recruitBonus: Math.floor(lv / 10)       // 每10级+1初始人数
    };
};

// 阶段里程碑解锁
var SOLDIER_MILESTONES = {
    10: { unlock: '精锐外观', desc: '士兵头盔换为精锐蓝' },
    20: { unlock: '装备槽扩展', desc: '解锁战术装备栏' },
    30: { unlock: '特殊射击', desc: '子弹拖尾加长' },
    40: { unlock: '精英视觉', desc: '金色边框+专属徽章' },
    50: { unlock: '传奇外观', desc: '传奇红色外观+专属徽章' }
};

// —— 装备系统 ——
var EQUIP_SLOTS = ['helmet', 'vest', 'weapon', 'backpack', 'tactical', 'badge'];
var EQUIP_SLOT_NAMES = { helmet: '头盔', vest: '防弹衣', weapon: '主武器', backpack: '背包', tactical: '战术装备', badge: '军团徽章' };
var EQUIP_QUALITY = ['普通', '优秀', '稀有', '史诗', '传说'];
var EQUIP_QUALITY_COLORS = ['#B0B0B0', '#4DA8FF', '#9C4DFF', '#FFC247', '#FF4444'];

var EQUIPMENT_DEFS = {
    helmet_starter:  { slot: 'helmet',  name: '训练头盔',   quality: 0, attrs: { hpBonus: 5 } },
    helmet_ace:      { slot: 'helmet',  name: '王牌头盔',   quality: 3, attrs: { hpBonus: 30, drBonus: 0.05 }, unlock: { level: 30 } },
    vest_starter:    { slot: 'vest',    name: '训练防弹衣', quality: 0, attrs: { hpBonus: 8 } },
    vest_ace:        { slot: 'vest',    name: '王牌防弹衣', quality: 3, attrs: { hpBonus: 40, drBonus: 0.08 }, unlock: { level: 30 } },
    wpn_starter:     { slot: 'weapon',  name: '标准步枪',   quality: 0, attrs: { dmgBonus: 1 } },
    wpn_veteran:     { slot: 'weapon',  name: '老兵步枪',   quality: 2, attrs: { dmgBonus: 3, rateBonus: 0.05 }, unlock: { level: 15 } },
    pack_starter:    { slot: 'backpack',name: '标准背包',   quality: 0, attrs: { recruitBonus: 1 } },
    pack_elite:      { slot: 'backpack',name: '精锐背包',   quality: 2, attrs: { recruitBonus: 3, hpBonus: 10 }, unlock: { level: 20 } },
    tac_starter:     { slot: 'tactical',name: '基础战术装', quality: 0, attrs: { rateBonus: 0.03 } },
    tac_special:     { slot: 'tactical',name: '特种战术装', quality: 3, attrs: { rateBonus: 0.1, critBonus: 0.05 }, unlock: { level: 25 } },
    badge_starter:   { slot: 'badge',   name: '新兵徽章',   quality: 0, attrs: { critBonus: 0.02 } },
    badge_legend:    { slot: 'badge',   name: '传奇徽章',   quality: 4, attrs: { dmgBonus: 5, hpBonus: 25, critBonus: 0.08 }, unlock: { level: 45 } }
};

// 装备强化成本
var EQUIP_UPGRADE_COST = function(quality, level) {
    return Math.round(80 * Math.pow(1.3, level) * (1 + quality * 0.4));
};

var SoldierGrowth = {
    /** 士兵等级 */
    level: function(profile) { return (profile.data.soldier && profile.data.soldier.level) || 1; },
    xp: function(profile) { return (profile.data.soldier && profile.data.soldier.xp) || 0; },

    /** 升级所需金币 */
    upgradeCost: function(profile) {
        return SOLDIER_LEVEL_COST(this.level(profile));
    },

    /** 升级士兵(事务性: 失败不扣钱) */
    upgrade: function(profile) {
        var lv = this.level(profile);
        if (lv >= 50) return { ok: false, reason: 'maxed' };
        var cost = this.upgradeCost(profile);
        if (profile.coins < cost) return { ok: false, reason: 'insufficient', cost: cost };
        if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
        if (!profile.data.soldier) profile.data.soldier = { level: 1, xp: 0 };
        profile.data.soldier.level = lv + 1;
        profile.save();
        var milestone = SOLDIER_MILESTONES[lv + 1];
        return { ok: true, level: lv + 1, cost: cost, milestone: milestone || null };
    },

    /** 士兵属性汇总(等级+装备+科技合并) */
    stats: function(profile) {
        var lv = this.level(profile);
        var base = SOLDIER_LEVEL_STATS(lv);
        // 装备加成
        var eq = profile.data.equipment || {};
        for (var slot in eq) {
            var piece = eq[slot];
            if (!piece || !piece.attrs) continue;
            for (var k in piece.attrs) {
                base[k] = (base[k] || 0) + piece.attrs[k] * (piece.level || 1);
            }
        }
        return base;
    },

    /** 阶段名称 */
    tierName: function(profile) {
        var lv = this.level(profile);
        for (var i = SOLDIER_TIERS.length - 1; i >= 0; i--) {
            if (lv >= SOLDIER_TIERS[i].max - 9) return SOLDIER_TIERS[i];
        }
        return SOLDIER_TIERS[0];
    },

    /** 装备穿戴(替换或卸下) */
    equip: function(profile, slot, equipId) {
        if (!profile.data.equipment) profile.data.equipment = {};
        var def = EQUIPMENT_DEFS[equipId];
        if (!def || def.slot !== slot) return { ok: false, reason: 'invalid' };
        // 解锁条件检查
        if (def.unlock && def.unlock.level > this.level(profile)) {
            return { ok: false, reason: 'locked', need: def.unlock.level };
        }
        profile.data.equipment[slot] = { id: equipId, quality: def.quality, level: 1, attrs: def.attrs };
        profile.save();
        return { ok: true, slot: slot, equipId: equipId };
    },

    /** 装备强化(等级+1, 属性放大) */
    upgradeEquip: function(profile, slot) {
        var eq = profile.data.equipment;
        if (!eq || !eq[slot]) return { ok: false, reason: 'empty' };
        var piece = eq[slot];
        var cost = EQUIP_UPGRADE_COST(piece.quality, piece.level);
        if (profile.coins < cost) return { ok: false, reason: 'insufficient', cost: cost };
        if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
        piece.level++;
        profile.save();
        return { ok: true, slot: slot, level: piece.level, cost: cost };
    }
};



// ===== VNext: 装备掉落 + 随机词条 + 背包 =====
// 掉落物为独立实例(词条随机), 与固定装备(EQUIPMENT_DEFS)共存:
// stats() 同时合并 piece.attrs(固定) 与 piece.affixes(随机词条), 全部真实进战斗。

var EQUIP_AFFIX_POOL = [
    { k: 'dmgBonus',     name: '伤害',      perQ: 1,    fmt: function(v) { return '+' + v; } },
    { k: 'hpBonus',      name: '生命',      perQ: 8,    fmt: function(v) { return '+' + v; } },
    { k: 'rateBonus',    name: '射速',      perQ: 0.02, fmt: function(v) { return '+' + Math.round(v * 100) + '%'; } },
    { k: 'critBonus',    name: '暴击率',    perQ: 0.02, fmt: function(v) { return '+' + Math.round(v * 100) + '%'; } },
    { k: 'drBonus',      name: '减伤',      perQ: 0.015, fmt: function(v) { return '+' + Math.round(v * 100) + '%'; } },
    { k: 'recruitBonus', name: '招募',      perQ: 0.6,  fmt: function(v) { return '+' + Math.max(1, Math.round(v)); } }
];
var EQUIP_AFFIX_MAX = 3; // 词条条数上限(按品质 1-3)
var EQUIP_NAME_PREFIX = ['哨兵', '猎手', '暴怒', '坚壁', '疾风', '掠夺', '王牌', '铁血'];
var EQUIP_BAG_CAP = 30;
var EQUIP_SELL_VALUE = function(quality, level) { return Math.round(40 * (1 + quality * 0.8) * (1 + (level - 1) * 0.3)); };

var EquipmentLoot = {
    _uid: 0,
    /** 生成一件掉落装备 */
    _makeItem: function(levelIndex, quality) {
        this._uid++;
        var slots = EQUIP_SLOTS;
        var slot = slots[Math.floor(Math.random() * slots.length)];
        // 词条数: 品质0→1条, 品质4→3条
        var affixCount = 1 + Math.min(EQUIP_AFFIX_MAX - 1, quality);
        var affixes = {};
        var poolCopy = EQUIP_AFFIX_POOL.slice();
        var lines = [];
        for (var i = 0; i < affixCount && poolCopy.length; i++) {
            var pool2 = poolCopy.splice(Math.floor(Math.random() * poolCopy.length), 1)[0];
            var scale = (1 + quality * 0.5) * (1 + Math.min(9, levelIndex) * 0.12);
            var raw = pool2.perQ * (0.7 + Math.random() * 0.6) * scale;
            var v = (pool2.k === 'rateBonus' || pool2.k === 'critBonus' || pool2.k === 'drBonus')
                ? Math.round(raw * 1000) / 1000 : Math.max(1, Math.round(raw));
            affixes[pool2.k] = v;
            lines.push(pool2.name + ' ' + pool2.fmt(v));
        }
        var prefix = EQUIP_NAME_PREFIX[Math.floor(Math.random() * EQUIP_NAME_PREFIX.length)];
        return {
            uid: Date.now().toString(36) + '_' + this._uid,
            slot: slot, name: prefix + EQUIP_SLOT_NAMES[slot],
            quality: quality, affixes: affixes, affixLines: lines,
            level: 1, ts: Date.now(), isNew: true
        };
    },
    /** 通关掉落: 1件保底 + 星级加成 */
    rollOnWin: function(profile, levelIndex, stars) {
        var drops = [];
        var count = 1 + (stars >= 2 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0);
        for (var i = 0; i < count; i++) {
            var q = this._rollQuality(levelIndex, true);
            drops.push(this._makeItem(levelIndex, q));
        }
        return this._store(profile, drops);
    },
    /** 失败掉落: 25%概率1件(保底参与感) */
    rollOnLose: function(profile, levelIndex) {
        if (Math.random() >= 0.25) return [];
        return this._store(profile, [this._makeItem(levelIndex, this._rollQuality(levelIndex, false))]);
    },
    _rollQuality: function(levelIndex, win) {
        // 品质权重随关卡推进右移: 普通/优秀/稀有/史诗/传说
        var r = Math.random() * 100;
        var shift = Math.min(20, levelIndex * 2.2) + (win ? 4 : 0);
        if (r > 97 - shift * 0.3) return 4;
        if (r > 88 - shift * 0.4) return 3;
        if (r > 70 - shift * 0.5) return 2;
        if (r > 42 - shift * 0.3) return 1;
        return 0;
    },
    _store: function(profile, drops) {
        if (!profile || !drops.length) return [];
        if (!profile.data.bag) profile.data.bag = [];
        var bag = profile.data.bag;
        for (var i = 0; i < drops.length && bag.length < EQUIP_BAG_CAP; i++) bag.push(drops[i]);
        profile.save();
        return drops;
    },
    /** 背包穿装(同槽互换: 旧装备回背包) */
    equipFromBag: function(profile, uid) {
        var bag = profile.data.bag || [];
        var idx = -1;
        for (var i = 0; i < bag.length; i++) if (bag[i].uid === uid) { idx = i; break; }
        if (idx < 0) return { ok: false, reason: 'missing' };
        var item = bag.splice(idx, 1)[0];
        if (!profile.data.equipment) profile.data.equipment = {};
        var old = profile.data.equipment[item.slot];
        profile.data.equipment[item.slot] = item;
        if (old && old.uid) bag.push(old); // 掉落装备互换回背包; 固定新手装被替换即退役
        profile.save();
        return { ok: true, slot: item.slot, replaced: !!(old && old.uid) };
    },
    /** 分解 → 金币 */
    sellEquip: function(profile, uid) {
        var bag = profile.data.bag || [];
        for (var i = 0; i < bag.length; i++) {
            if (bag[i].uid === uid) {
                var it = bag[i];
                var value = EQUIP_SELL_VALUE(it.quality, it.level);
                bag.splice(i, 1);
                profile.addCoins(value);
                return { ok: true, value: value };
            }
        }
        return { ok: false, reason: 'missing' };
    },
    /** 背包装备强化(词条×等级成长) */
    upgradeBagEquip: function(profile, uid) {
        var bag = profile.data.bag || [];
        for (var i = 0; i < bag.length; i++) {
            if (bag[i].uid === uid) {
                var it = bag[i];
                if (it.level >= 10) return { ok: false, reason: 'maxed' };
                var cost = EQUIP_UPGRADE_COST(it.quality, it.level);
                if (profile.coins < cost) return { ok: false, reason: 'insufficient', cost: cost };
                if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
                it.level++;
                it.isNew = false;
                profile.save();
                return { ok: true, level: it.level };
            }
        }
        return { ok: false, reason: 'missing' };
    }
};

// VNext: SoldierGrowth.stats 合并随机词条(×等级成长, 与固定装备一致)
// (原 stats 已遍历 eq[slot].attrs — 此处扩展读取 affixes)
(function() {
    var baseStats = SoldierGrowth.stats;
    SoldierGrowth.stats = function(profile) {
        var out = baseStats.call(SoldierGrowth, profile);
        var eq = profile.data.equipment || {};
        for (var slot in eq) {
            var piece = eq[slot];
            if (!piece || !piece.affixes) continue;
            var mul = piece.level || 1;
            for (var k in piece.affixes) {
                out[k] = (out[k] || 0) + piece.affixes[k] * mul;
            }
        }
        return out;
    };
})();


/* ===== [[ js/classes.js ]] ===== */
// ===== VNext 职业系统 =====
// 四职业 = 小队编制原型(不替换现有士兵/武器/技能, 叠加生效)。
// 职业差异全部进入真实战斗: 伤害乘区/射速/穿透/暴击/减伤/弹速/精英伤害/战地回复。
// 职业技能为自动循环 buff(复用 squad 事件buff通道), 强度随士兵阶段(tier 0-4)成长。

var CLASS_DEFS = {
    rifleman: {
        id: 'rifleman', name: '枪械步兵', icon: '🎖️', color: '#4DA8FF',
        desc: '均衡输出的标准战线, 无短板',
        unlock: null, unlockText: '初始解锁',
        mods: { dmgMul: 1.0, rateMul: 1.0, critBonus: 0, pierce: 0, dr: 0, bulletSpeed: 1.0, eliteDmgMul: 1.0, regenN: 0 },
        skill: { name: '聚焦射击', icon: '🎯', cd: 26, firstCd: 10,
            desc: '全员伤害 ×1.5, 持续5秒',
            apply: function(s, tier) { s._evDmgMul = 1.5 + tier * 0.25; s._evDmgMulT = 5; } }
    },
    gunner: {
        id: 'gunner', name: '重装机枪手', icon: '🌀', color: '#FF8844',
        desc: '高射速压制: 射速×1.3 弹速+25% 减伤+8%, 单发×0.8',
        unlock: { clear: 2 }, unlockText: '通关第2关解锁',
        mods: { dmgMul: 0.8, rateMul: 1.3, critBonus: 0, pierce: 0, dr: 0.08, bulletSpeed: 1.25, eliteDmgMul: 1.0, regenN: 0 },
        skill: { name: '弹幕全开', icon: '💥', cd: 24, firstCd: 8,
            desc: '射速 ×2, 持续3秒',
            apply: function(s, tier) { s._evRateMul = 2 + tier * 0.25; s._evRateMulT = 3; } }
    },
    marksman: {
        id: 'marksman', name: '神射狙击', icon: '🎯', color: '#9C4DFF',
        desc: '单发×1.5 暴击+10% 穿透+1, 对精英/Boss ×1.25, 射速×0.75',
        unlock: { clear: 4 }, unlockText: '通关第4关解锁',
        mods: { dmgMul: 1.5, rateMul: 0.75, critBonus: 0.1, pierce: 1, dr: 0, bulletSpeed: 1.0, eliteDmgMul: 1.25, regenN: 0 },
        skill: { name: '穿甲弹匣', icon: '🔩', cd: 30, firstCd: 12,
            desc: '穿透 +2, 持续6秒',
            apply: function(s, tier) { s._evPierce = 2 + tier; s._evPierceT = 6; } }
    },
    medic: {
        id: 'medic', name: '战地军医', icon: '💉', color: '#39D98A',
        desc: '每10秒恢复2人, 减伤+10%, 单发×0.85',
        unlock: { clear: 6 }, unlockText: '通关第6关解锁',
        mods: { dmgMul: 0.85, rateMul: 1.0, critBonus: 0, pierce: 0, dr: 0.1, bulletSpeed: 1.0, eliteDmgMul: 1.0, regenN: 2, regenInterval: 10 },
        skill: { name: '战斗激励', icon: '🚑', cd: 28, firstCd: 14,
            desc: '全员暴击率 +15%, 持续6秒',
            apply: function(s, tier) { s._evCritBonus = 0.15 + tier * 0.05; s._evCritT = 6; } }
    }
};

var SoldierClass = {
    /** 当前职业配置(未选择默认步兵) */
    def: function(profile) {
        return CLASS_DEFS[(profile && profile.data && profile.data.classId)] || CLASS_DEFS.rifleman;
    },
    /** 是否可选(解锁条件) */
    canSelect: function(profile, id) {
        var def = CLASS_DEFS[id];
        if (!def) return { ok: false, reason: 'invalid' };
        if (!def.unlock) return { ok: true };
        if (!profile) return { ok: false, reason: 'no_profile' };
        if ((profile.data.unlockedLevel || 1) > def.unlock.clear) return { ok: true };
        return { ok: false, reason: 'locked', need: def.unlock.clear };
    },
    /** 选择职业(存档持久化) */
    select: function(profile, id) {
        var check = this.canSelect(profile, id);
        if (!check.ok) return check;
        profile.data.classId = id;
        profile.save();
        return { ok: true, id: id };
    },
    /** 技能强化档位(随士兵阶段 0-4): 新兵0/精锐1/特种2/王牌3/传奇4 */
    tier: function(profile) {
        if (typeof SoldierGrowth === 'undefined') return 0;
        var lv = SoldierGrowth.level(profile);
        return Math.min(4, Math.floor(lv / 10));
    },

    // ===== V11.4: 职业专精 (使用该职业完成对局 → 专精等级 → 永久战斗加成) =====
    MASTERY_PER_LEVEL: 3, // 每3局+1级, 上限10
    masteryOf: function(profile, id) {
        var m = (profile && profile.data.classMastery && profile.data.classMastery[id]) || { games: 0 };
        var level = Math.min(10, Math.floor(m.games / this.MASTERY_PER_LEVEL));
        return { games: m.games || 0, level: level };
    },
    /** 对局结束记录(胜负均计, 仅当前职业) */
    recordGame: function(profile, classId) {
        if (!profile || !classId) return null;
        if (!profile.data.classMastery) profile.data.classMastery = {};
        var m = profile.data.classMastery[classId] || { games: 0 };
        m.games++;
        profile.data.classMastery[classId] = m;
        profile.save();
        return this.masteryOf(profile, classId);
    },
    /** 专精加成描述(每职业不同成长方向) */
    masteryBonusText: function(id) {
        return {
            rifleman: '每级伤害 +1.5%',
            gunner: '每级射速 +2%',
            marksman: '每级暴击 +1%',
            medic: '每级伤害减免 +1%'
        }[id] || '';
    },
    _masteryBonus: function(profile, id) {
        var level = id ? this.masteryOf(profile, id).level : 0;
        switch (id) {
            case 'rifleman': return { dmgMul: 1 + 0.015 * level };
            case 'gunner': return { rateMul: 1 + 0.02 * level };
            case 'marksman': return { critBonus: 0.01 * level };
            case 'medic': return { dr: 0.01 * level };
            default: return {};
        }
    },
    /** 战斗装配(每局 start() 调用一次) — V11.4: 叠加专精加成 */
    combat: function(profile) {
        var def = this.def(profile);
        var m = def.mods;
        var mb = this._masteryBonus(profile, def.id);
        return {
            id: def.id, name: def.name, icon: def.icon, color: def.color,
            dmgMul: m.dmgMul * (mb.dmgMul || 1),
            rateMul: m.rateMul * (mb.rateMul || 1),
            critBonus: m.critBonus + (mb.critBonus || 0),
            pierce: m.pierce,
            dr: m.dr + (mb.dr || 0),
            bulletSpeed: m.bulletSpeed, eliteDmgMul: m.eliteDmgMul,
            regenN: m.regenN, regenInterval: m.regenInterval || 10,
            skill: def.skill, tier: this.tier(profile),
            mastery: this.masteryOf(profile, def.id).level
        };
    }
};


/* ===== [[ js/weapons.js ]] ===== */
// ===== V8.0 武器系统 =====
// 8种武器 × 5级升级 × 进化路线。战斗效果真实注入 combat.js。
// 配置集中: WEAPON_DEFS / EVOLUTION_DEFS。应用: WeaponSystem。

var WEAPON_DEFS = {
    rifle: {
        name: '标准步枪', icon: '🔫', type: 'single',
        desc: '稳定单体伤害',
        unlockCondition: null,
        levels: [{ dmg: 1 }, { dmg: 1.3 }, { dmg: 1.6 }, { dmg: 2 }, { dmg: 2.5 }],
        effect: function(lv) { return { dmgMul: [1, 1.3, 1.6, 2, 2.5][lv] }; }
    },
    shotgun: {
        name: '散弹枪', icon: '💥', type: 'spread',
        desc: '多发弹丸扇形范围',
        unlockCondition: { type: 'clear', level: 1 },
        levels: [{ pellets: 3, dmg: 0.5 }, { pellets: 4, dmg: 0.6 }, { pellets: 5, dmg: 0.7 }, { pellets: 6, dmg: 0.8 }, { pellets: 7, dmg: 1 }],
        effect: function(lv) { return { pellets: [3,4,5,6,7][lv], dmgMul: [0.5,0.6,0.7,0.8,1][lv] }; }
    },
    sniper: {
        name: '狙击枪', icon: '🎯', type: 'pierce',
        desc: '高伤害+穿透1',
        unlockCondition: { type: 'clear', level: 1 },
        levels: [{ dmg: 3, pierce: 1 }, { dmg: 4, pierce: 1 }, { dmg: 5, pierce: 2 }, { dmg: 6, pierce: 2 }, { dmg: 8, pierce: 3 }],
        effect: function(lv) { return { dmgMul: [3,4,5,6,8][lv], pierceBonus: [1,1,2,2,3][lv] }; }
    },
    mg: {
        name: '机枪', icon: '🌀', type: 'rapid',
        desc: '射速×2.5',
        unlockCondition: { type: 'clear', level: 2 },
        levels: [{ rateMul: 2 }, { rateMul: 2.3 }, { rateMul: 2.6 }, { rateMul: 2.9 }, { rateMul: 3.2 }],
        effect: function(lv) { return { rateMul: [2,2.3,2.6,2.9,3.2][lv], dmgMul: 0.55 }; }
    },
    flamethrower: {
        name: '火焰喷射器', icon: '🔥', type: 'cone',
        desc: '持续范围燃烧',
        unlockCondition: { type: 'clear', level: 3 },
        levels: [{ dmg: 0.8, radius: 1.2 }, { dmg: 1, radius: 1.4 }, { dmg: 1.2, radius: 1.6 }, { dmg: 1.5, radius: 1.8 }, { dmg: 1.8, radius: 2 }],
        effect: function(lv) { return { dmgMul: [0.8,1,1.2,1.5,1.8][lv], radius: [1.2,1.4,1.6,1.8,2][lv] }; }
    },
    rocket: {
        name: '火箭炮', icon: '🚀', type: 'explosive',
        desc: '范围爆炸伤害',
        unlockCondition: { type: 'clear', level: 3 },
        levels: [{ dmg: 3, radius: 1.5 }, { dmg: 4, radius: 1.7 }, { dmg: 5, radius: 2 }, { dmg: 6, radius: 2.2 }, { dmg: 8, radius: 2.5 }],
        effect: function(lv) { return { dmgMul: [3,4,5,6,8][lv], radius: [1.5,1.7,2,2.2,2.5][lv] }; }
    },
    freeze: {
        name: '冰冻枪', icon: '❄️', type: 'freeze',
        desc: '命中减速+冻结',
        unlockCondition: { type: 'clear', level: 4 },
        levels: [{ slow: .4 }, { slow: .5 }, { slow: .6 }, { slow: .7 }, { slow: .8 }],
        effect: function(lv) { return { slowMul: [0.4,0.5,0.6,0.7,0.8][lv], dmgMul: 0.8 }; }
    },
    tesla: {
        name: '电磁枪', icon: '⚡', type: 'chain',
        desc: '连锁闪电攻击',
        unlockCondition: { type: 'clear', level: 4 },
        levels: [{ chain: 2 }, { chain: 3 }, { chain: 4 }, { chain: 5 }, { chain: 6 }],
        effect: function(lv) { return { chain: [2,3,4,5,6][lv], dmgMul: 0.7 }; }
    }
};

var EVOLUTION_DEFS = {
    storm_mg: {
        base: 'mg', req: { rapid: 2 },
        name: '风暴机枪', icon: '🌪️',
        desc: '射速×4 + 双弹道',
        effect: { rateMul: 4, dmgMul: 0.6, dualLane: true }
    },
    hell_rocket: {
        base: 'rocket', req: { explosive: 2 },
        name: '地狱火箭', icon: '🌋',
        desc: '爆炸半径×2 + 持续燃烧',
        effect: { dmgMul: 4, radius: 3.5, burn: true }
    },
    arctic_pierce: {
        base: 'freeze', req: { pierce: 2 },
        name: '极寒穿透炮', icon: '🧊',
        desc: '冰冻+穿透3+伤害提升',
        effect: { slowMul: 0.8, pierceBonus: 3, dmgMul: 1.5 }
    },
    thunder_chain: {
        base: 'tesla', req: { crit: 2 },
        name: '雷霆链式炮', icon: '⚡',
        desc: '连锁+暴击率+15%',
        effect: { chain: 8, critBonus: 0.15, dmgMul: 1 }
    },
    // ===== V11.3: 补齐步枪/散弹/狙击/火焰四条进化 =====
    twin_rifle: {
        base: 'rifle', req: { pierce: 1 },
        name: '双管步枪', icon: '🔫',
        desc: '伤害×2.8 + 射速×1.15',
        effect: { dmgMul: 2.8, rateMul: 1.15 }
    },
    storm_shotgun: {
        base: 'shotgun', req: { pierce: 1 },
        name: '散弹风暴', icon: '🌪️',
        desc: '弹丸+2 + 伤害×1.4',
        effect: { pellets: 2, dmgMul: 1.4 }
    },
    phantom_sniper: {
        base: 'sniper', req: { crit: 2 },
        name: '幻影狙击', icon: '👁️',
        desc: '暴击率+20% + 穿透+2',
        effect: { critBonus: 0.2, pierceBonus: 2, dmgMul: 1.3 }
    },
    inferno_thrower: {
        base: 'flamethrower', req: { crit: 2 },
        name: '炼狱喷射', icon: '🌋',
        desc: '范围+0.8 + 伤害×1.6',
        effect: { radius: 2.8, dmgMul: 1.6 }
    }
};

var WeaponSystem = {
    /** 获取当前武器(存档持久化) */
    current: function(profile) { return profile.data.weapon || 'rifle'; },
    level: function(profile) { return profile.data.weaponLevel || 0; },
    evolved: function(profile) { return profile.data.weaponEvolved || null; },

    /** 解析当前武器战斗参数 */
    stats: function(profile) {
        var id = this.current(profile);
        var lv = this.level(profile);
        var def = WEAPON_DEFS[id];
        var evo = this.evolved(profile);
        var evoDef = evo ? EVOLUTION_DEFS[evo] : null;
        var base = def.effect(lv);
        if (evoDef) {
            var e = evoDef.effect;
            for (var k in e) base[k] = e[k];
            base.evolvedName = evoDef.name;
            base.evolvedId = evo;
        }
        // V11.3: 武器词条合并(伤害/射速乘区, 暴击/穿透加值)
        var affix = profile.data.weaponAffix;
        if (affix) {
            base.affixName = affix.name;
            if (affix.k === 'dmg') base.dmgMul = (base.dmgMul || 1) * (1 + affix.v);
            else if (affix.k === 'rate') base.rateMul = (base.rateMul || 1) * (1 + affix.v);
            else if (affix.k === 'crit') base.critBonus = (base.critBonus || 0) + affix.v;
            else if (affix.k === 'pierce') base.pierceBonus = (base.pierceBonus || 0) + affix.v;
        }
        base.weaponId = id;
        base.weaponLevel = lv;
        return base;
    },

    /** 解锁/切换/升级/进化 */
    canUnlock: function(profile, id) {
        var def = WEAPON_DEFS[id];
        if (!def || !def.unlockCondition) return false;
        var cond = def.unlockCondition;
        if (cond.type === 'clear') return (profile.data.unlockedLevel || 1) > cond.level;
        return false;
    },
    switchTo: function(profile, id) {
        if (WEAPON_DEFS[id]) { profile.data.weapon = id; profile.save(); return true; }
        return false;
    },
    upgradeCost: function(profile) {
        var lv = this.level(profile);
        return [200, 400, 700, 1100, 1600][lv] || null;
    },
    upgrade: function(profile) {
        var cost = this.upgradeCost(profile);
        if (cost === null) return { ok: false, reason: 'maxed' };
        if (profile.coins < cost) return { ok: false, reason: 'insufficient' };
        if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
        profile.data.weaponLevel = (profile.data.weaponLevel || 0) + 1;
        // V11.3: 3级首次掉落武器词条
        var affix = null;
        if (profile.data.weaponLevel === 3 && !profile.data.weaponAffix) affix = this.rollAffix(profile);
        profile.save();
        return { ok: true, level: profile.data.weaponLevel, affix: affix };
    },
    /** 进化: 检查前置科技 */
    canEvolve: function(profile) {
        var id = this.current(profile);
        var evoId = null;
        for (var k in EVOLUTION_DEFS) { if (EVOLUTION_DEFS[k].base === id) { evoId = k; break; } }
        if (!evoId) return { ok: false, reason: 'no_evolution' };
        if (this.evolved(profile)) return { ok: false, reason: 'already_evolved' };
        var def = EVOLUTION_DEFS[evoId];
        if (!def.req) return { ok: true, evoId: evoId };
        for (var tech in def.req) {
            if ((profile.data.tech || {})[tech] < def.req[tech]) return { ok: false, reason: 'tech_required', tech: tech, need: def.req[tech] };
        }
        return { ok: true, evoId: evoId };
    },
    evolve: function(profile) {
        var check = this.canEvolve(profile);
        if (!check.ok) return check;
        profile.data.weaponEvolved = check.evoId;
        // V11.3: 进化时重roll词条
        this.rollAffix(profile);
        profile.save();
        return { ok: true, evolved: check.evoId };
    },

    // ===== V11.3: 武器词条 (升至3级随机掉落1条; 进化重roll; 全部真实进战斗) =====
    AFFIX_POOL: [
        { k: 'dmg', v: 0.10, name: '伤害 +10%' },
        { k: 'rate', v: 0.08, name: '射速 +8%' },
        { k: 'crit', v: 0.05, name: '暴击 +5%' },
        { k: 'pierce', v: 1, name: '穿透 +1' }
    ],
    rollAffix: function(profile) {
        var pool = this.AFFIX_POOL;
        var affix = pool[Math.floor(Math.random() * pool.length)];
        profile.data.weaponAffix = { k: affix.k, v: affix.v, name: affix.name };
        return profile.data.weaponAffix;
    },
    affix: function(profile) {
        return profile.data.weaponAffix || null;
    }
};


/* ===== [[ js/tech-tree.js ]] ===== */
// ===== V8.0 科技树 =====
// 三方向(火力/军团/后勤), 前置解锁, 科技点消耗。配置集中: TECH_DEFS。

var TECH_CURRENCY = 'tech'; // 科技点

var TECH_DEFS = {
    // —— 火力科技 ——
    fire_dmg:   { branch: 'fire', name: '弹药强化', icon: '💢', desc: '全队伤害 +1', cost: 100, req: null, max: 3 },
    fire_rate:  { branch: 'fire', name: '射速优化', icon: '⚡', desc: '射速 +8%', cost: 120, req: 'fire_dmg', max: 3 },
    fire_crit:  { branch: 'fire', name: '弱点分析', icon: '🎯', desc: '暴击率 +5%', cost: 200, req: 'fire_rate', max: 3 },
    fire_pierce:{ branch: 'fire', name: '穿甲技术', icon: '🔩', desc: '穿透 +1', cost: 300, req: 'fire_crit', max: 2 },
    fire_explo: { branch: 'fire', name: '爆炸弹头', icon: '💣', desc: '子弹爆炸', cost: 400, req: 'fire_pierce', max: 1 },
    // —— 军团科技 ——
    army_size:  { branch: 'army', name: '扩编', icon: '👥', desc: '初始人数 +2', cost: 100, req: null, max: 3 },
    army_limit: { branch: 'army', name: '军团上限', icon: '🏛️', desc: '最大人数 +50', cost: 250, req: 'army_size', max: 2 },
    army_regen: { branch: 'army', name: '战地医疗', icon: '🏥', desc: '每10秒恢复1人', cost: 200, req: 'army_limit', max: 2 },
    army_shield:{ branch: 'army', name: '防弹装甲', icon: '🛡️', desc: '伤害减免 8%', cost: 300, req: 'army_regen', max: 2 },
    // —— 后勤科技 ——
    log_coin:   { branch: 'logi', name: '战利品回收', icon: '🪙', desc: '金币 +15%', cost: 100, req: null, max: 3 },
    log_xp:     { branch: 'logi', name: '训练手册', icon: '📚', desc: '经验 +20%', cost: 120, req: 'log_coin', max: 3 },
    log_supply: { branch: 'logi', name: '后勤补给', icon: '📦', desc: '击杀金币 +0.3', cost: 200, req: 'log_xp', max: 2 },
    log_start:  { branch: 'logi', name: '战术储备', icon: '🎖️', desc: '开局金币 +150', cost: 300, req: 'log_supply', max: 1 }
};

var TechTree = {
    /** 获取科技等级 */
    levelOf: function(profile, id) {
        return (profile.data.tech && profile.data.tech[id]) || 0;
    },
    /** 是否可升级(前置+上限) */
    canUpgrade: function(profile, id) {
        var def = TECH_DEFS[id];
        if (!def) return { ok: false, reason: 'invalid' };
        var lv = this.levelOf(profile, id);
        if (lv >= def.max) return { ok: false, reason: 'maxed' };
        if (def.req && this.levelOf(profile, def.req) < 1) return { ok: false, reason: 'locked' };
        return { ok: true, lv: lv, cost: def.cost };
    },
    /** 升级(原子) */
    upgrade: function(profile, id) {
        var check = this.canUpgrade(profile, id);
        if (!check.ok) return check;
        if (!profile.spend(check.cost)) return { ok: false, reason: 'insufficient' };
        if (!profile.data.tech) profile.data.tech = {};
        profile.data.tech[id] = (profile.data.tech[id] || 0) + 1;
        profile.save();
        return { ok: true, id: id, lv: profile.data.tech[id] };
    },
    /** 战斗属性汇总(供 combat/squad 读取) */
    combatStats: function(profile) {
        var d = profile.data;
        var t = d.tech || {};
        return {
            dmgBonus: this.levelOf(profile, 'fire_dmg'),
            rateBonus: 0.08 * this.levelOf(profile, 'fire_rate'),
            critBonus: 0.05 * this.levelOf(profile, 'fire_crit'),
            pierceBonus: this.levelOf(profile, 'fire_pierce'),
            explosive: this.levelOf(profile, 'fire_explo') > 0,
            startBonus: 2 * this.levelOf(profile, 'army_size'),
            limitBonus: 50 * this.levelOf(profile, 'army_limit'),
            regen: this.levelOf(profile, 'army_regen'),
            drBonus: 0.08 * this.levelOf(profile, 'army_shield'),
            coinMul: 1 + 0.15 * this.levelOf(profile, 'log_coin'),
            xpMul: 1 + 0.2 * this.levelOf(profile, 'log_xp'),
            coinPerKill: 0.3 * this.levelOf(profile, 'log_supply'),
            startCoins: 150 * this.levelOf(profile, 'log_start')
        };
    },
    /** 授予科技点(结算时) */
    grantTech: function(profile, amount) {
        if (!profile.data.techPoints) profile.data.techPoints = 0;
        profile.data.techPoints += Math.floor(amount);
        profile.save();
    }
};


/* ===== [[ js/random-events.js ]] ===== */
// ===== V8.0 随机事件系统 =====
// 战斗中每 18~32 秒掷一次事件(65%良性/35%恶性), 全部效果真实生效。
// 应用入口: RandomEvents.update(dt, game);  reset 在每局 start() 时调用。

// V10 QA: 事件怪HP = 基础×关卡乘数×0.5(事件为瞬时批量增援, 低于常规波次单位压力)
function evHp(game, type) {
    var li = game.levelIndex || 0;
    // V10 QA: L1-L5保持历史基线HP(事件为瞬时批量压力, 全部历史平衡/测试以此校准);
    // L6+采用与常规波次相同的关卡HP乘数(修复事件怪基础HP在后期一枪秒的问题)
    if (li < 5) return (CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal).hp;
    var mul = CONFIG.ENEMY_HP_MULTIPLIER[Math.min(li, CONFIG.ENEMY_HP_MULTIPLIER.length - 1)] || 1.7;
    return Math.max(1, Math.round((CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal).hp * mul));
}

var RANDOM_EVENT_DEFS = [
    // —— 良性 (weight 65) ——
    { id: 'airdrop',   name: '空投补给',   icon: '📦', weight: 12, type: 'good',
      desc: '立即补充 15 名士兵',
      apply: function(game) { // V10.1: 空投人数吃士兵成长"招募效率"加成(原固定15, recruitBonus 从未消费于此)
          var rb = (typeof SoldierGrowth !== 'undefined') ? (SoldierGrowth.stats(game.profile).recruitBonus || 0) : 0;
          game.squad.addReinforcements(15 + rb, '空投补给', game.effects); } },
    { id: 'coin_rain', name: '金币雨',     icon: '🪙', weight: 12, type: 'good',
      desc: '立即获得 40 金币',
      apply: function(game) { if (game.profile) game.profile.addCoins(40); } },
    { id: 'frenzy',    name: '狂热时刻',   icon: '🔥', weight: 10, type: 'good',
      desc: '10 秒内全队伤害 ×2',
      apply: function(game) { var s = game.squad; s._evDmgMul = 2; s._evDmgMulT = 10; } },
    { id: 'ammo',      name: '弹药补给',   icon: '🔩', weight: 10, type: 'good',
      desc: '12 秒内射速 ×1.5',
      apply: function(game) { var s = game.squad; s._evRateMul = 1.5; s._evRateMulT = 12; } },
    { id: 'reinforce', name: '援军空降',   icon: '🚁', weight: 8, type: 'good',
      desc: '补充当前人数 30% 的士兵',
      apply: function(game) { game.squad.addReinforcements(Math.max(1, Math.floor(game.squad.count * 0.3)), '援军空降', game.effects); } },
    { id: 'medkit',    name: '战地医疗',   icon: '💉', weight: 8, type: 'good',
      desc: '恢复 10% 编制士兵',
      apply: function(game) { game.squad.addReinforcements(Math.max(1, Math.floor(game.maxCount * 0.1)), '战地医疗', game.effects); } },
    { id: 'crit_storm', name: '弱点洞察',  icon: '🎯', weight: 8, type: 'good',
      desc: '10 秒内暴击率 +20%',
      apply: function(game) { var s = game.squad; s._evCritBonus = 0.2; s._evCritT = 10; } },
    { id: 'freeze_time', name: '冰冻时间', icon: '❄️', weight: 7, type: 'good',
      desc: '全场僵尸冻结 3 秒',
      apply: function(game) {
          var n = 0;
          for (var i = 0; i < game.enemies.enemies.length; i++) {
              var e = game.enemies.enemies[i];
              if (e.alive && !e.isBoss) { e.frozenT = Math.max(e.frozenT || 0, 3); n++; }
          }
          return n > 0;
      } },

    // —— 恶性 (weight 35, V8.0.1: 强度调低避免压垮边缘局) ——
    { id: 'surge',     name: '尸潮暴动',   icon: '💥', weight: 12, type: 'bad',
      desc: '一波增援僵尸从侧翼涌入',
      apply: function(game) {
          var laneCount = 8 + Math.floor(game.elapsedTime / 60) * 3;
          for (var i = 0; i < laneCount; i++) {
              var x = CONFIG.LANE_X[i % 3] + (Math.random() - 0.5) * 1.6;
              game.pacing.spawnFn('normal', x, game.squad.z - CONFIG.BULLET_RANGE * 0.9, null); // V10 QA修复: 走spawnFn吃关卡HP乘数(原直调基础HP, L6+一枪秒)
          }
          return true;
      } },
    { id: 'elite',     name: '精英来袭',   icon: '👹', weight: 8, type: 'bad',
      desc: '2 只变异精英加入战场',
      apply: function(game) {
          for (var i = 0; i < 2; i++) {
              var x = CONFIG.LANE_X[i] + (Math.random() - 0.5) * 1.2;
              game.pacing.spawnFn('elite', x, game.squad.z - CONFIG.BULLET_RANGE * 0.9, null); // V10 QA修复: 同上
          }
          return true;
      } },
    { id: 'toxic_fog', name: '毒雾弥漫',   icon: '☠️', weight: 8, type: 'bad',
      desc: '损失 4% 编制士兵(至少2人)',
      apply: function(game) {
          var lost = Math.min(Math.max(2, Math.floor(game.squad.count * 0.04)), game.squad.count - 1);
          if (lost <= 0) return false;
          game.squad.killSoldiers(lost, game.effects);
          return true;
      } },
    { id: 'ambush',    name: '地道伏击',   icon: '🕳️', weight: 7, type: 'bad',
      desc: '僵尸从小队身后近距离突袭',
      apply: function(game) {
          for (var i = 0; i < 7; i++) {
              var x = CONFIG.LANE_X[i % 3] + (Math.random() - 0.5) * 1.6;
              game.pacing.spawnFn(i % 3 === 2 ? 'fast' : 'normal', x, game.squad.z + 3 + Math.random() * 2, null); // V10 QA修复: 同上
          }
          return true;
      } }
];

var RandomEvents = {
    /** 每局重置: 首个事件 15~25 秒后 */
    reset: function() {
        this._t = 15 + Math.random() * 10;
        this._shown = 0;
    },

    update: function(dt, game) {
        if (!game || game.state !== 'playing' || game.paused) return;
        if (this._t === undefined) this.reset();
        this._t -= dt;
        if (this._t <= 0) {
            this._t = 18 + Math.random() * 14;
            this._trigger(game);
        }
    },

    _trigger: function(game) {
        // 加权随机(良性65 / 恶性35); 冰冻时间无冻结目标时重掷
        for (var attempt = 0; attempt < 4; attempt++) {
            var total = 0, i;
            for (i = 0; i < RANDOM_EVENT_DEFS.length; i++) total += RANDOM_EVENT_DEFS[i].weight;
            var roll = Math.random() * total;
            var def = null;
            for (i = 0; i < RANDOM_EVENT_DEFS.length; i++) {
                roll -= RANDOM_EVENT_DEFS[i].weight;
                if (roll <= 0) { def = RANDOM_EVENT_DEFS[i]; break; }
            }
            if (!def) return;
            var ok = def.apply(game);
            if (ok !== false) {
                this._shown++;
                // 事件横幅: 复用波次横幅 + 飘字
                var el = document.getElementById('v42-wave-banner');
                if (el) {
                    el.textContent = def.icon + ' 随机事件 · ' + def.name + ' — ' + def.desc;
                    el.classList.remove('hidden');
                    el.style.borderColor = def.type === 'bad' ? '#FF6666' : '#FFC247';
                }
                if (game._waveNoticeT !== undefined) game._waveNoticeT = 2.6;
                if (game.effects) {
                    game.effects.floatText(game.squad.x, 2.6, game.squad.z - 2,
                        def.icon + ' ' + def.name, def.type === 'bad' ? '#FF6666' : '#FFC247', true);
                }
                if (game.world) game.world.shake(def.type === 'bad' ? 0.25 : 0.15);
                return;
            }
        }
    }
};


/* ===== [[ js/leaderboard.js ]] ===== */
// ===== VNext 本地排行榜 =====
// 真实对局数据入库(结算时写入), 无任何伪造排名。平台排行(抖音/微信)预留适配点:
// Platform.leaderboard 可被平台适配器覆写 report/fetchTop; H5 默认实现=本地存档。

var LEADERBOARD_CAP = 20;

var Leaderboard = {
    /** 结算分: 击杀为主, 人数/连杀/通关加权 */
    scoreOf: function(run) {
        return Math.round((run.kills || 0) * 10 + (run.maxCount || 0) * 5 +
            (run.combo || 0) * 2 + (run.win ? 500 + (run.level || 0) * 100 : 0));
    },
    /** 写入一条真实战绩(结算调用; 保留前N名) */
    record: function(profile, run) {
        if (!profile) return null;
        var entry = {
            score: this.scoreOf(run),
            level: run.level || 0,
            win: !!run.win,
            kills: run.kills || 0,
            maxCount: run.maxCount || 0,
            combo: run.combo || 0,
            time: Math.round((run.time || 0) * 10) / 10,
            classId: run.classId || 'rifleman',
            challenge: run.challenge || null,
            ts: Date.now()
        };
        if (!profile.data.records) profile.data.records = [];
        profile.data.records.push(entry);
        profile.data.records.sort(function(a, b) { return b.score - a.score; });
        if (profile.data.records.length > LEADERBOARD_CAP) profile.data.records.length = LEADERBOARD_CAP;
        profile.save();
        // 平台排行上报(适配器可覆写; H5默认no-op本地已存)
        if (typeof Platform !== 'undefined') {
            if (!Platform.leaderboard) {
                Platform.leaderboard = {
                    report: function() { /* 本地已由 record 持久化 */ },
                    fetchTop: function(p, n) { return Leaderboard.top(p, n); }
                };
            }
            if (Platform.leaderboard.report) {
                try { Platform.leaderboard.report(entry); } catch (e) {}
            }
        }
        return entry;
    },
    /** 本地榜单(降序) */
    top: function(profile, n) {
        var list = (profile && profile.data.records) || [];
        return list.slice(0, n || LEADERBOARD_CAP);
    },
    /** 日期格式化(排名时间展示) */
    fmtDate: function(ts) {
        var d = new Date(ts);
        return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
            ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
};


/* ===== [[ js/progression.js ]] ===== */
// ===== V6.0 进度系统: 星级 / 玩家经验等级 / 成就 / 存档迁移 v2 =====
// 依赖 economy.js 的 GameProfile(存档)。所有奖励发放幂等(claimedRewards 账本)。

var STAR_RULES = {
    // 每关二星=通关且结算人数≥star2Count; 三星=二星且击杀≥star3Kills
    L1: { star2Count: 25, star3Kills: 80 },
    L2: { star2Count: 40, star3Kills: 130 },
    L3: { star2Count: 45, star3Kills: 200 },
    L4: { star2Count: 60, star3Kills: 260 },
    L5: { star2Count: 90, star3Kills: 350 },
    L6: { star2Count: 110, star3Kills: 500 },
    // V10 QA修复: 补齐 L7-L10(原回退 L1 阈值25/80 → 后期关卡星级全面通胀)
    L7: { star2Count: 130, star3Kills: 650 },
    L8: { star2Count: 150, star3Kills: 800 },
    L9: { star2Count: 170, star3Kills: 950 },
    L10: { star2Count: 200, star3Kills: 1200 }
};

var XP_RULES = {
    basePerWin: 120,        // 通关基础经验
    perKill: 1,             // 每击杀经验
    perStar: 80,            // 每颗星经验(首获)
    firstClearBonus: 200,   // 首次通关额外
    levelCurve: function(level) { return Math.round(300 * Math.pow(level, 1.35)); } // 升到 level+1 需要的累计经验
};

var ACHIEVEMENT_DEFS = [
    { id: 'first_blood',  name: '初战告捷',   icon: '🩸', desc: '完成第一关',        reward: 50 },
    { id: 'squad_100',    name: '百人军团',   icon: '🎖️', desc: '单局人数达到100',   reward: 80 },
    { id: 'squad_300',    name: '三百勇士',   icon: '🏅', desc: '单局人数达到300',   reward: 150 },
    { id: 'squad_500',    name: '五百膨胀',   icon: '🏆', desc: '单局人数达到500',   reward: 260 },
    { id: 'kills_500',    name: '屠戮者',     icon: '⚔️', desc: '累计击杀500只僵尸',  reward: 80 },
    { id: 'kills_2000',   name: '尸潮收割机', icon: '💀', desc: '累计击杀2000只僵尸', reward: 180 },
    { id: 'kills_5000',   name: '末日清道夫', icon: '☠️', desc: '累计击杀5000只僵尸', reward: 320 },
    { id: 'boss_first',   name: '弑君者',     icon: '👑', desc: '首次击败Boss',      reward: 120 },
    { id: 'boss_5',       name: 'Boss猎人',   icon: '🗡️', desc: '累计击败5个Boss',    reward: 240 },
    { id: 'clear_l3',     name: '破盾者',     icon: '🛡️', desc: '通过第3关盾牌军团',   reward: 100 },
    { id: 'clear_l5',     name: '终焉突破',   icon: '🔮', desc: '通过第5关',         reward: 160 },
    { id: 'clear_l6',     name: '末日终结者', icon: '🌟', desc: '通过第6关末日核心',   reward: 300 },
    { id: 'perfect_l1',   name: '新兵模范',   icon: '⭐', desc: '第1关获得三星',      reward: 100 },
    { id: 'perfect_l6',   name: '传奇指挥官', icon: '✨', desc: '第6关获得三星',      reward: 500 },
    { id: 'stars_9',      name: '星尘收藏家', icon: '🌠', desc: '累计获得9颗星',      reward: 150 },
    { id: 'stars_15',     name: '银河战星',   icon: '🌌', desc: '累计获得15颗星',     reward: 280 },
    { id: 'wins_10',      name: '常胜将军',   icon: '🎉', desc: '累计通关10次',      reward: 140 },
    { id: 'upgrades_10',  name: '军火大亨',   icon: '🏭', desc: '永久升级总等级达10', reward: 160 },
    { id: 'rich_2000',    name: '战地富豪',   icon: '💰', desc: '同时持有2000金币',   reward: 120 },
    { id: 'player_10',    name: '身经百战',   icon: '📈', desc: '玩家等级达到10级',   reward: 200 },
    { id: 'player_20',    name: '战场老兵',   icon: '🎖️', desc: '玩家等级达到20级',   reward: 400 },
    { id: 'clear_l7',     name: '巢穴猎人',   icon: '🕳️', desc: '通过第7关地下巢穴',   reward: 350 },
    { id: 'clear_l8',     name: '机械终结',   icon: '🤖', desc: '通过第8关机械废土',   reward: 400 },
    { id: 'clear_l9',     name: '防线突破',   icon: '🏰', desc: '通过第9关最终防线',   reward: 450 },
    { id: 'clear_l10',    name: '末日降临',   icon: '🌍', desc: '通过第10关终极末日',   reward: 600 },
    { id: 'perfect_l5',   name: '防线守护',   icon: '🌟', desc: '第5关获得三星',      reward: 250 },
    { id: 'perfect_l2',   name: '街区清理',   icon: '⭐', desc: '第2关获得三星',      reward: 100 },
    { id: 'perfect_l3',   name: '实验突破',   icon: '⭐', desc: '第3关获得三星',      reward: 120 },
    { id: 'perfect_l4',   name: '工业毁灭',   icon: '⭐', desc: '第4关获得三星',      reward: 140 },
    { id: 'boss_10',      name: '屠君者',     icon: '🔪', desc: '累计击败10个Boss',   reward: 350 },
    { id: 'boss_20',      name: 'Boss终结者', icon: '💀', desc: '累计击败20个Boss',   reward: 500 },
    { id: 'elite_50',     name: '精英猎手',   icon: '🎯', desc: '累计击杀50个精英',   reward: 200 },
    { id: 'elite_100',    name: '精英屠戮',   icon: '⚔️', desc: '累计击杀100个精英',  reward: 350 },
    { id: 'kills_10000',  name: '僵尸末日',   icon: '💀', desc: '累计击杀10000只僵尸', reward: 500 },
    { id: 'wins_25',      name: '胜利之师',   icon: '🎊', desc: '累计通关25次',      reward: 280 },
    { id: 'rich_5000',    name: '战争财阀',   icon: '💎', desc: '同时持有5000金币',   reward: 200 },
    { id: 'weapon_evo',   name: '武器大师',   icon: '🔧', desc: '进化一把武器',      reward: 200 },
    { id: 'tech_5',       name: '科学家',     icon: '🔬', desc: '科技树升级5次',     reward: 180 },
    { id: 'upgrades_20',  name: '军备竞赛',   icon: '🏭', desc: '永久升级总等级达20', reward: 300 },
    { id: 'sign_7',       name: '七日忠诚',   icon: '📅', desc: '连续签到7天',      reward: 250 }
];

var Progression = {
    /** V5.1.5→V6.0 存档迁移: 补默认字段, 不动旧数据 */
    migrate: function(data) {
        if ((data.profileVersion || 0) >= 2) return data;
        data.profileVersion = 2;
        if (!data.stars) data.stars = {};
        if (data.xp === undefined) data.xp = 0;
        if (data.playerLevel === undefined) data.playerLevel = 1;
        if (!data.achievements) data.achievements = {};
        if (!data.stats) data.stats = { bossKills: 0, eliteKills: 0, playTime: 0 };
        if (data.totalWins === undefined) data.totalWins = 0;
        if (data.totalKills === undefined) data.totalKills = 0;
        if (data.bestSquadCount === undefined) data.bestSquadCount = 0;
        return data;
    },

    /** 星级评定: win + 人数/击杀门槛 → 0-3 */
    computeStars: function(level, endCount, kills, won) {
        if (!won) return 0;
        var rule = STAR_RULES['L' + (level + 1)] || STAR_RULES.L1;
        var stars = 1;
        if (endCount >= rule.star2Count) stars = 2;
        if (stars === 2 && kills >= rule.star3Kills) stars = 3;
        return stars;
    },

    /** 经验→等级(累计经验制) */
    levelFromXp: function(xp) {
        var level = 1, need = 0;
        while (level < 99) {
            need += XP_RULES.levelCurve(level);
            if (xp < need) break;
            level++;
        }
        return { level: level, nextNeed: need };
    },

    /** 结算经验(幂等由调用方保证: 首通/星级奖励走 claimedRewards) */
    computeXp: function(kills, won, levelIndex, newStars) {
        var xp = kills * XP_RULES.perKill;
        if (won) xp += XP_RULES.basePerWin + levelIndex * 30;
        if (newStars > 0) xp += newStars * XP_RULES.perStar;
        return xp;
    },

    /** 成就检测: 返回新解锁的成就列表(自动入账claimedRewards发奖金) */
    checkAchievements: function(profile) {
        var d = profile.data;
        var totalStars = 0;
        for (var k in d.stars) totalStars += d.stars[k] || 0;
        var upgradeTotal = 0;
        for (var u in d.upgrades) upgradeTotal += d.upgrades[u] || 0;
        var pl = Progression.levelFromXp(d.xp || 0).level;
        var conditions = {
            first_blood: (d.unlockedLevel || 1) >= 2,
            squad_100: (d.bestSquadCount || 0) >= 100,
            squad_300: (d.bestSquadCount || 0) >= 300,
            squad_500: (d.bestSquadCount || 0) >= 500,
            kills_500: (d.totalKills || 0) >= 500,
            kills_2000: (d.totalKills || 0) >= 2000,
            kills_5000: (d.totalKills || 0) >= 5000,
            boss_first: (d.stats && d.stats.bossKills || 0) >= 1,
            boss_5: (d.stats && d.stats.bossKills || 0) >= 5,
            clear_l3: (d.unlockedLevel || 1) >= 4,
            clear_l5: (d.unlockedLevel || 1) >= 6,
            clear_l6: !!d.achievements_meta && d.achievements_meta.clear_l6,
            perfect_l1: (d.stars && d.stars.L1) === 3,
            perfect_l6: (d.stars && d.stars.L6) === 3,
            stars_9: totalStars >= 9,
            stars_15: totalStars >= 15,
            wins_10: (d.totalWins || 0) >= 10,
            upgrades_10: upgradeTotal >= 10,
            rich_2000: (d.coins || 0) >= 2000,
            player_10: pl >= 10,
            player_20: pl >= 20,
            clear_l7: (d.unlockedLevel || 1) >= 8,
            clear_l8: (d.unlockedLevel || 1) >= 9,
            clear_l9: (d.unlockedLevel || 1) >= 10,
            clear_l10: !!d.achievements_meta && d.achievements_meta.clear_l10,
            perfect_l5: (d.stars && d.stars.L5) === 3,
            perfect_l2: (d.stars && d.stars.L2) === 3,
            perfect_l3: (d.stars && d.stars.L3) === 3,
            perfect_l4: (d.stars && d.stars.L4) === 3,
            boss_10: (d.stats && d.stats.bossKills || 0) >= 10,
            boss_20: (d.stats && d.stats.bossKills || 0) >= 20,
            elite_50: (d.stats && d.stats.eliteKills || 0) >= 50,
            elite_100: (d.stats && d.stats.eliteKills || 0) >= 100,
            kills_10000: (d.totalKills || 0) >= 10000,
            wins_25: (d.totalWins || 0) >= 25,
            rich_5000: (d.coins || 0) >= 5000,
            weapon_evo: !!(d.weaponEvolved),
            tech_5: (function() { var t = d.tech || {}; var total = 0; for (var k in t) total += t[k]; return total >= 5; })(),
            upgrades_20: (function() { var t = d.upgrades || {}; var total = 0; for (var k in t) total += t[k]; return total >= 20; })(),
            sign_7: (d.signin && d.signin.streak || 0) >= 7
        };
        var newly = [];
        for (var i = 0; i < ACHIEVEMENT_DEFS.length; i++) {
            var def = ACHIEVEMENT_DEFS[i];
            if (conditions[def.id] && !profile.hasClaimed('ach:' + def.id)) {
                profile.claimReward('ach:' + def.id, def.reward);
                newly.push(def);
            }
        }
        return newly;
    }
};


/* ===== [[ js/challenge.js ]] ===== */
// ===== V6.0 挑战模式 + 每日任务 =====
// 挑战: 狂暴生存(无尽波次) / Boss试炼(连续Boss rush)
// 每日: 3个任务按日期种子从池中选出, 进度持久化, 奖励幂等

var CHALLENGE_MODES = {
    survival: {
        name: '无尽尸潮', icon: '🌊',
        desc: '无限波次，生存越久分越高',
        baseHp: 4, hpScale: 1.12, spawnRateMul: 1.2
    },
    boss_rush: {
        name: 'Boss试炼', icon: '👑',
        desc: '连续挑战强化Boss，击杀数=得分',
        baseHp: 6, hpScale: 1.25
    }
};


var DAILY_TASK_POOL = [
    { id: 'kill_100',  name: '消灭100只僵尸', target: 100, type: 'kills', reward: 60 },
    { id: 'kill_300',  name: '消灭300只僵尸', target: 300, type: 'kills', reward: 150 },
    { id: 'clear_2',   name: '通关2个关卡',   target: 2,  type: 'wins',  reward: 100 },
    { id: 'clear_4',   name: '通关4个关卡',   target: 4,  type: 'wins',  reward: 200 },
    { id: 'squad_50',  name: '单局人数达50',  target: 50, type: 'squad', reward: 80 },
    { id: 'boss_1',    name: '击败1个Boss',   target: 1,  type: 'boss',  reward: 120 },
    { id: 'gate_5',    name: '穿过5扇状态门',  target: 5,  type: 'gates', reward: 60 },
    { id: 'skill_2',   name: '选择2个技能',   target: 2,  type: 'skills', reward: 50 }
];

var ChallengeDaily = {
    _gameRef: null,
    /** 今日日期字符串(时区安全) */
    today: function() {
        var d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },

    /** 获取或初始化今日任务(种子随机选3个不重复) */
    ensureDaily: function(profile) {
        var today = this.today();
        var d = profile.data;
        if (d.daily && d.daily.date === today) return d.daily;
        var seed = today.split('-').reduce(function(a, b) { return (a * 31 + parseInt(b) || 0) >>> 0; }, 7);
        var pool = DAILY_TASK_POOL.slice();
        var picked = [];
        while (picked.length < 3 && pool.length) {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            picked.push(pool.splice(seed % pool.length, 1)[0]);
        }
        d.daily = {
            date: today,
            tasks: picked.map(function(t) { return { id: t.id, name: t.name, target: t.target, type: t.type, reward: t.reward, progress: 0, claimed: false }; })
        };
        profile.save();
        return d.daily;
    },

    /** 战斗内进度上报(V10 QA: 仅在进度实际变化时落盘, 原实现每次调用无条件save) */
    report: function(profile, type, amount) {
        var daily = this.ensureDaily(profile);
        var g = this._gameRef;
        var dirty = false;
        daily.tasks.forEach(function(t) {
            if (t.claimed) return;
            var before = t.progress;
            if (t.type === 'kills' && type === 'kills') t.progress = Math.min(t.target, g ? (g.enemies ? g.enemies.killCount : t.progress) : t.progress + amount);
            else if (t.type === 'squad' && type === 'squad' && g) t.progress = Math.min(t.target, Math.max(t.progress, g.maxCount || 0));
            else if (t.type === 'gates' && type === 'gates' && g) t.progress = Math.min(t.target, g.gates.chosenRows.size);
            else if (t.type === 'skills' && type === 'skills' && g) t.progress = Math.min(t.target, Object.keys(g.squad._skills || {}).length);
            else if (t.type === 'boss' && type === 'boss' && g) t.progress = Math.min(t.target, g.enemies.bossKills || 0);
            else if (t.type === 'wins' && type === 'wins') t.progress = Math.min(t.target, t.progress + amount);
            else if (t.type === 'clear' && type === 'wins') t.progress = Math.min(t.target, t.progress + amount);
            if (t.progress !== before) dirty = true;
        });
        if (dirty) profile.save();
    },

    /** 领取奖励(幂等) */
    claim: function(profile, index) {
        var daily = this.ensureDaily(profile);
        var t = daily.tasks[index];
        if (!t || t.claimed || t.progress < t.target) return false;
        t.claimed = true;
        profile.addCoins(t.reward);
        profile.save();
        return true;
    }
}; // V10.1: 移除无调用的 startChallenge(挑战模式由 game.js startChallengeMode 实现)

// ===== V8.0: 7天循环签到 =====
var SIGNIN_REWARDS = [80, 120, 150, 200, 250, 300, 500];

var SignInSystem = {
    /** 获取或初始化签到状态 */
    ensure: function(profile) {
        var d = profile.data;
        if (!d.signin) d.signin = { lastDate: '', streak: 0, totalDays: 0 };
        return d.signin;
    },
    today: function() {
        var d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },
    /** 今日是否可签(上次签到不是今天) */
    canSign: function(profile) {
        var si = this.ensure(profile);
        return si.lastDate !== this.today();
    },
    /** 签到(幂等: 同一天不重复) */
    sign: function(profile) {
        var si = this.ensure(profile);
        var today = this.today();
        if (si.lastDate === today) return false;
        si.streak = (si.streak % 7) + 1;
        si.totalDays++;
        si.lastDate = today;
        var reward = SIGNIN_REWARDS[(si.streak - 1) % 7];
        profile.addCoins(reward);
        profile.save();
        return { streak: si.streak, reward: reward };
    }
};


/* ===== [[ js/ui-v60.js ]] ===== */
// ===== V6.0/V8.0 UI 模块: 关卡地图 / 训练中心 / 军械库 / 科技树 / 图鉴 / 挑战 / 成就 / 每日 / 设置 =====
// 由 V42Art.installUI 后调用 V60UI.install(game) 装配; 全部数据来自 GameProfile。

var V60UI = {
    // V8.0: 十关元数据(名称取自 LEVELS[i].name, 去掉"第 X 关 "前缀)
    LEVEL_META: [
        { icon: '🏕️', threat: '低' },
        { icon: '🏙️', threat: '中' },
        { icon: '🧪', threat: '中高' },
        { icon: '☣️', threat: '高' },
        { icon: '🛡️', threat: '极高' },
        { icon: '☢️', threat: '终局' },
        { icon: '🕳️', threat: '高危' },
        { icon: '⚙️', threat: '极危' },
        { icon: '🏰', threat: '要塞' },
        { icon: '💀', threat: '末日' }
    ],

    install: function(game) {
        this.game = game;
        if (typeof ChallengeDaily !== 'undefined') ChallengeDaily._gameRef = game;
        var container = document.getElementById('game-container');
        if (!container || document.getElementById('v60-map-page')) return;

        // —— 页面骨架(全部页面) ——
        container.insertAdjacentHTML('beforeend',
            '<div id="v60-daily-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">每日作战令</div>' +
                    '<h2 class="v60-page-title">每日任务</h2>' +
                    '<div id="v60-signin-strip" class="v60-signin-strip"></div>' +
                    '<button id="v60-signin-btn" class="btn-primary">签到</button>' +
                    '<div id="v60-daily-list" class="v60-ach-list"></div>' +
                    '<button id="v60-daily-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-train-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">军团训练中心</div>' +
                    '<div class="v60-train-header" id="v60-train-header"></div>' +
                    '<div class="v60-train-stats" id="v60-train-stats"></div>' +
                    '<div class="v60-train-equip" id="v60-train-equip"></div>' +
                    '<div class="v60-equip-title" style="margin-top:10px">背包 · 掉落装备</div>' +
                    '<div id="v60-train-bag" class="v60-bag-list"></div>' +
                    '<button id="v60-train-upgrade" class="btn-primary">升级士兵</button>' +
                    '<div class="v60-train-cost" id="v60-train-cost"></div>' +
                    '<button id="v60-train-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-armory-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">军械库</div>' +
                    '<div id="v60-armory-list" class="v60-armory-list"></div>' +
                    '<button id="v60-armory-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-tech-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">科研站</div>' +
                    '<div id="v60-tech-points" class="v60-tech-points"></div>' +
                    '<div id="v60-tech-list" class="v60-tech-list"></div>' +
                    '<button id="v60-tech-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-codex-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">战场图鉴</div>' +
                    '<h2 class="v60-page-title">Boss图鉴</h2>' +
                    '<div id="v60-codex-bosses" class="v60-codex-list"></div>' +
                    '<h2 class="v60-page-title">武器收藏</h2>' +
                    '<div id="v60-codex-weapons" class="v60-codex-list"></div>' +
                    '<button id="v60-codex-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-challenge-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">极限挑战</div>' +
                    '<h2 class="v60-page-title">挑战模式</h2>' +
                    '<div id="v60-challenge-list" class="v60-challenge-list"></div>' +
                    '<button id="v60-challenge-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-rank-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">名人堂</div>' +
                    '<h2 class="v60-page-title">战绩排行</h2>' +
                    '<div id="v60-rank-list" class="v60-rank-list"></div>' +
                    '<button id="v60-rank-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-map-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker">作战地图 · 十大防区</div>' +
                    '<h2 class="v60-page-title">关卡地图</h2>' +
                    '<div class="v60-map-stats" id="v60-map-stats"></div>' +
                    '<div id="v60-map-nodes" class="v60-map-nodes"></div>' +
                    '<button id="v60-map-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-ach-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">荣誉殿堂</div>' +
                    '<h2 class="v60-page-title">成就</h2>' +
                    '<div id="v60-ach-list" class="v60-ach-list"></div>' +
                    '<button id="v60-ach-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-settings-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker">系统</div>' +
                    '<h2 class="v60-page-title">设置</h2>' +
                    '<div class="v60-setting-row"><span>音效</span><button id="v60-set-sound" class="v60-toggle"></button></div>' +
                    '<div class="v60-setting-row"><span>画质</span><button id="v60-set-quality" class="v60-toggle"></button></div>' +
                    '<div class="v60-setting-row"><span>屏幕震动</span><button id="v60-set-shake" class="v60-toggle"></button></div>' +
                    '<div class="v60-saveinfo" id="v60-saveinfo"></div>' +
                    '<button id="v60-set-back" class="btn-primary">返回</button>' +
                '</div>' +
            '</div>');

        // —— 首页按钮组(V8.0: 九宫格导航) ——
        var startPanel = document.querySelector('#start-screen .title-panel');
        if (startPanel && !document.getElementById('v60-home-nav')) {
            startPanel.insertAdjacentHTML('beforeend',
                '<div id="v60-home-nav" class="v60-home-nav">' +
                    '<button id="v60-btn-map" class="v60-nav-btn">🗺️ 地图</button>' +
                    '<button id="v60-btn-train" class="v60-nav-btn">🎖️ 训练</button>' +
                    '<button id="v60-btn-armory" class="v60-nav-btn">🔧 军械库</button>' +
                    '<button id="v60-btn-tech" class="v60-nav-btn">🔬 科技</button>' +
                    '<button id="v60-btn-codex" class="v60-nav-btn">📖 图鉴</button>' +
                    '<button id="v60-btn-challenge" class="v60-nav-btn">⚔️ 挑战</button>' +
                    '<button id="v60-btn-rank" class="v60-nav-btn">🏆 排行</button>' +
                    '<button id="v60-btn-ach" class="v60-nav-btn">🏅 成就</button>' +
                    '<button id="v60-btn-daily" class="v60-nav-btn">📋 每日</button>' +
                    '<button id="v60-btn-set" class="v60-nav-btn">⚙️ 设置</button>' +
                '</div>' +
                '<div id="v60-class-row" class="v60-class-row"></div>' +
                '<div id="v60-home-growth" class="v60-home-growth"></div>');
        }

        // —— 事件(全量防御) ——
        var self = this;
        var bind = function(id, fn) {
            var el = document.getElementById(id);
            if (el) el.onclick = function() { game._sfx('click'); fn(); };
        };
        bind('v60-btn-map', function() { self.showPage('v60-map-page'); self.renderMap(game); });
        bind('v60-btn-ach', function() { self.showPage('v60-ach-page'); self.renderAchievements(game); });
        bind('v60-btn-set', function() { self.showPage('v60-settings-page'); self.renderSettings(game); });
        bind('v60-btn-daily', function() { self.showPage('v60-daily-page'); self.renderDaily(game); });
        bind('v60-btn-train', function() { self.showPage('v60-train-page'); self.renderTraining(game); });
        bind('v60-btn-armory', function() { self.showPage('v60-armory-page'); self.renderArmory(game); });
        bind('v60-btn-tech', function() { self.showPage('v60-tech-page'); self.renderTech(game); });
        bind('v60-btn-codex', function() { self.showPage('v60-codex-page'); self.renderCodex(game); });
        bind('v60-btn-challenge', function() { self.showPage('v60-challenge-page'); self.renderChallenges(game); });
        bind('v60-btn-rank', function() { self.showPage('v60-rank-page'); self.renderRank(game); });
        bind('v60-rank-back', function() { self.hidePages(); });
        bind('v60-map-back', function() { self.hidePages(); });
        bind('v60-ach-back', function() { self.hidePages(); });
        bind('v60-daily-back', function() { self.hidePages(); });
        bind('v60-set-back', function() { self.hidePages(); });
        bind('v60-train-back', function() { self.hidePages(); });
        bind('v60-armory-back', function() { self.hidePages(); });
        bind('v60-tech-back', function() { self.hidePages(); });
        bind('v60-codex-back', function() { self.hidePages(); });
        bind('v60-challenge-back', function() { self.hidePages(); });
        bind('v60-signin-btn', function() {
            if (typeof SignInSystem === 'undefined' || !game.profile) return;
            var r = SignInSystem.sign(game.profile);
            if (r) {
                game._sfx('win');
                game._refreshCoinDisplays();
                self.renderDaily(game);
            } else {
                var btn = document.getElementById('v60-signin-btn');
                if (btn) btn.textContent = '今日已签';
            }
        });
        bind('v60-set-sound', function() {
            if (typeof Platform !== 'undefined' && Platform.audio) {
                Platform.audio.setMuted(!Platform.audio.isMuted());
                game._updateSoundLabel();
                self.renderSettings(game);
            }
        });
        bind('v60-set-quality', function() {
            var cur = game.world.quality;
            var next = (cur + 1) % 3;
            // V12: 画质偏好走 Platform.storage(旧裸键 pz_quality 只写不读已修复; 微信端无 localStorage)
            if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.setLegacy) {
                Platform.storage.setLegacy('pz_quality', String(next));
            } else {
                try { localStorage.setItem('pz_quality', String(next)); } catch (e) {}
            }
            location.reload();
        });
        bind('v60-set-shake', function() {
            game.world._shakeDisabled = !game.world._shakeDisabled;
            if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.setLegacy) {
                Platform.storage.setLegacy('pz_shake_off', game.world._shakeDisabled ? '1' : '0');
            } else {
                try { localStorage.setItem('pz_shake_off', game.world._shakeDisabled ? '1' : '0'); } catch (e) {}
            }
            self.renderSettings(game);
        });

        // 启动时恢复设置
        if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
            if (Platform.storage.getLegacy('pz_shake_off', '0') === '1') game.world._shakeDisabled = true;
        } else {
            try {
                if (localStorage.getItem('pz_shake_off') === '1') game.world._shakeDisabled = true;
            } catch (e) {}
        }

        this.renderHomeGrowth(game);
        this.renderClassSelector(game);
    },

    // ===== VNext: 职业选择(首页四卡) =====
    renderClassSelector: function(game) {
        var row = document.getElementById('v60-class-row');
        if (!row || !game.profile || typeof SoldierClass === 'undefined') return;
        var current = SoldierClass.def(game.profile).id;
        row.innerHTML = '';
        for (var id in CLASS_DEFS) {
            var def = CLASS_DEFS[id];
            var check = SoldierClass.canSelect(game.profile, id);
            var card = document.createElement('button');
            card.className = 'v60-class-card' + (id === current ? ' selected' : '') + (check.ok ? '' : ' locked');
            card.innerHTML =
                '<div class="v60-class-icon">' + def.icon + '</div>' +
                '<div class="v60-class-name">' + def.name + '</div>' +
                '<div class="v60-class-desc">' + (check.ok
                    ? def.desc + '<br>专精 Lv.' + SoldierClass.masteryOf(game.profile, id).level + ' (' + SoldierClass.masteryOf(game.profile, id).games + '场)'
                    : def.unlockText) + '</div>';
            card.onclick = function(cid) { return function() {
                var r = SoldierClass.select(game.profile, cid);
                if (r.ok) { game._sfx('gate'); V60UI.renderClassSelector(game); }
                else { game._sfx('click'); }
            }; }(id);
            row.appendChild(card);
        }
    },


    showPage: function(id) {
        this.hidePages();
        var el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    },

    /** V8.0修复: 全部页面隐藏(旧实现漏掉 daily/train/armory/tech/codex/challenge) */
    hidePages: function() {
        ['v60-map-page', 'v60-ach-page', 'v60-settings-page', 'v60-daily-page',
         'v60-train-page', 'v60-armory-page', 'v60-tech-page', 'v60-codex-page',
         'v60-challenge-page', 'v60-rank-page'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    },

    renderHomeGrowth: function(game) {
        var el = document.getElementById('v60-home-growth');
        if (!el || !game.profile) return;
        var d = game.profile.data;
        var pl = typeof Progression !== 'undefined' ? Progression.levelFromXp(d.xp || 0) : { level: 1, nextNeed: 300 };
        var xpPrev = 0;
        for (var l = 1; l < pl.level; l++) xpPrev += (typeof XP_RULES !== 'undefined' ? XP_RULES.levelCurve(l) : 300);
        var pct = Math.min(100, Math.round(((d.xp || 0) - xpPrev) / Math.max(1, pl.nextNeed - xpPrev) * 100));
        var totalStars = 0;
        for (var k in d.stars) totalStars += d.stars[k] || 0;
        el.innerHTML =
            '<div class="v60-growth-row"><span class="v60-growth-lv">Lv.' + pl.level + '</span>' +
            '<div class="v60-xp-bar"><div class="v60-xp-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="v60-growth-xp">' + (d.xp || 0) + ' XP</span></div>' +
            '<div class="v60-growth-stats">⭐ ' + totalStars + ' · ⚔️ ' + (d.totalKills || 0) + ' · 🏆 ' + (d.totalWins || 0) + '</div>';
    },

    renderMap: function(game) {
        var nodesEl = document.getElementById('v60-map-nodes');
        var statsEl = document.getElementById('v60-map-stats');
        if (!nodesEl || !game.profile) return;
        var d = game.profile.data;
        var unlocked = d.unlockedLevel || 1;
        var totalStars = 0;
        for (var k in d.stars) totalStars += d.stars[k] || 0;
        var starTotal = LEVELS.length * 3;
        if (statsEl) statsEl.innerHTML = '⭐ ' + totalStars + '/' + starTotal + ' · 🏆 通关 ' + (d.totalWins || 0) + ' · ⚔️ ' + (d.totalKills || 0);
        nodesEl.innerHTML = '';
        var self = this;
        var metaTotal = this.LEVEL_META.length;
        this.LEVEL_META.forEach(function(meta, i) {
            if (i >= LEVELS.length) return;
            var rawName = (LEVELS[i].name || ('关卡 ' + (i + 1))).replace(/^第\s*\d+\s*关\s*/, '');
            var state = i + 1 < unlocked ? 'cleared' : (i === unlocked - 1 ? 'current' : 'locked');
            if (i === unlocked - 1 && d.stars['L' + (i + 1)]) state = 'cleared';
            var stars = d.stars['L' + (i + 1)] || 0;
            var node = document.createElement('div');
            node.className = 'v60-map-node ' + state;
            node.innerHTML =
                '<div class="v60-node-icon">' + (state === 'locked' ? '🔒' : meta.icon) + '</div>' +
                '<div class="v60-node-info"><div class="v60-node-name">' + (i + 1) + '. ' + rawName + '</div>' +
                '<div class="v60-node-meta">威胁: ' + meta.threat + ' · 奖励 ' + (LEVELS[i].rewardCoins || 0) + '🪙</div>' +
                '<div class="v60-node-stars">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</div></div>' +
                (state === 'current' ? '<div class="v60-node-current">▶</div>' : '') +
                (state === 'cleared' ? '<div class="v60-node-medal">🎖️</div>' : '');
            if (i + 1 <= unlocked) {
                node.onclick = function() {
                    self.game._sfx('click');
                    self.game.levelIndex = i;
                    self.game.start();
                    self.hidePages();
                };
                node.classList.add('clickable');
            }
            nodesEl.appendChild(node);
            if (i < metaTotal - 1 && i < LEVELS.length - 1) {
                var line = document.createElement('div');
                line.className = 'v60-map-line' + (i + 2 <= unlocked ? ' done' : '');
                nodesEl.appendChild(line);
            }
        }, game);
    },

    renderAchievements: function(game) {
        var el = document.getElementById('v60-ach-list');
        if (!el || !game.profile || typeof ACHIEVEMENT_DEFS === 'undefined') return;
        var d = game.profile.data;
        el.innerHTML = '';
        var claimed = d.claimedRewards || {};
        var gotCount = 0;
        ACHIEVEMENT_DEFS.forEach(function(def) {
            var got = !!claimed['ach:' + def.id];
            if (got) gotCount++;
            var row = document.createElement('div');
            row.className = 'v60-ach-row' + (got ? ' got' : '');
            row.innerHTML =
                '<div class="v60-ach-icon">' + def.icon + '</div>' +
                '<div class="v60-ach-info"><div class="v60-ach-name">' + def.name + '</div>' +
                '<div class="v60-ach-desc">' + def.desc + '</div></div>' +
                '<div class="v60-ach-reward">' + (got ? '✓' : '+' + def.reward + '🪙') + '</div>';
            el.appendChild(row);
        });
        var header = el.parentNode.querySelector('.v60-ach-progress');
        if (!header) {
            header = document.createElement('div');
            header.className = 'v60-ach-progress';
            el.parentNode.insertBefore(header, el);
        }
        header.textContent = '进度: ' + gotCount + ' / ' + ACHIEVEMENT_DEFS.length;
    },

    renderDaily: function(game) {
        var self = this;
        // —— 签到条(V8.0: 7天循环) ——
        var strip = document.getElementById('v60-signin-strip');
        var signBtn = document.getElementById('v60-signin-btn');
        if (strip && game.profile && typeof SignInSystem !== 'undefined') {
            var si = SignInSystem.ensure(game.profile);
            var curDay = si.streak % 7; // 今日待签的第几天(0起)
            var html = '';
            for (var d = 0; d < 7; d++) {
                var done = d < curDay;
                var reward = SIGNIN_REWARDS[d];
                html += '<div class="v60-signin-day' + (done ? ' done' : d === curDay ? ' today' : '') + '">' +
                    '<span class="v60-signin-day-num">D' + (d + 1) + '</span>' +
                    '<span class="v60-signin-day-r">' + (done ? '✓' : reward + '🪙') + '</span></div>';
            }
            strip.innerHTML = html;
            if (signBtn) signBtn.textContent = SignInSystem.canSign(game.profile)
                ? '签到 (+' + SIGNIN_REWARDS[curDay] + '🪙)' : '今日已签';
        }
        // —— 每日任务 ——
        var el = document.getElementById('v60-daily-list');
        if (!el || !game.profile || typeof ChallengeDaily === 'undefined') return;
        var daily = ChallengeDaily.ensureDaily(game.profile);
        el.innerHTML = '';
        daily.tasks.forEach(function(t, i) {
            var pct = Math.min(100, Math.round(t.progress / t.target * 100));
            var can = t.progress >= t.target && !t.claimed;
            var row = document.createElement('div');
            row.className = 'v60-ach-row' + (t.claimed ? ' got' : can ? ' ready' : '');
            row.innerHTML =
                '<div class="v60-ach-info"><div class="v60-ach-name">' + t.name + '</div>' +
                '<div class="v60-ach-bar"><div class="v60-ach-fill" style="width:' + pct + '%"></div></div></div>' +
                '<div class="v60-ach-reward">' + (t.claimed ? '✓' : '+' + t.reward + '🪙') + '</div>';
            if (can) row.onclick = function() { ChallengeDaily.claim(game.profile, i); game._sfx('gate'); self.renderDaily(game); game._refreshCoinDisplays(); };
            el.appendChild(row);
        });
    },

    // ===== V8.0: 军团训练中心(士兵等级+装备) =====
    renderTraining: function(game) {
        var self = this;
        var header = document.getElementById('v60-train-header');
        var statsEl = document.getElementById('v60-train-stats');
        var equipEl = document.getElementById('v60-train-equip');
        var upBtn = document.getElementById('v60-train-upgrade');
        var costEl = document.getElementById('v60-train-cost');
        if (!header || !game.profile || typeof SoldierGrowth === 'undefined') return;
        var lv = SoldierGrowth.level(game.profile);
        var tier = SoldierGrowth.tierName(game.profile);
        var stats = SoldierGrowth.stats(game.profile);
        var cost = SoldierGrowth.upgradeCost(game.profile);
        if (header) header.innerHTML =
            '<span class="v60-train-level">Lv.' + lv + '</span>' +
            '<span class="v60-train-tier" style="color:' + tier.color + '">' + tier.name + '</span>' +
            '<span class="v60-train-coins">🪙 ' + game.profile.coins + '</span>';
        if (statsEl) statsEl.innerHTML =
            '<div class="v60-stat-row"><span>伤害加成</span><b>+' + (stats.dmgBonus || 0) + '</b></div>' +
            '<div class="v60-stat-row"><span>生命加成</span><b>+' + (stats.hpBonus || 0) + '</b></div>' +
            '<div class="v60-stat-row"><span>暴击率</span><b>+' + ((stats.critBonus || 0) * 100).toFixed(1) + '%</b></div>' +
            '<div class="v60-stat-row"><span>伤害减免</span><b>' + ((stats.drBonus || 0) * 100).toFixed(1) + '%</b></div>' +
            '<div class="v60-stat-row"><span>招募效率</span><b>+' + (stats.recruitBonus || 0) + '</b></div>';
        if (equipEl) {
            var eq = game.profile.data.equipment || {};
            var equipHtml = '<div class="v60-equip-title">装备栏</div>';
            for (var si = 0; si < EQUIP_SLOTS.length; si++) {
                var slot = EQUIP_SLOTS[si];
                var piece = eq[slot];
                var qName = piece ? EQUIP_QUALITY[piece.quality] : '空';
                var qColor = piece ? EQUIP_QUALITY_COLORS[piece.quality] : '#666';
                var eName = piece ? (piece.name || (EQUIPMENT_DEFS[piece.id] ? EQUIPMENT_DEFS[piece.id].name : piece.id)) : '未装备';
                equipHtml += '<div class="v60-equip-row"><span class="v60-equip-slot">' + EQUIP_SLOT_NAMES[slot] + '</span>' +
                    '<span class="v60-equip-name" style="color:' + qColor + '">' + eName + '</span>' +
                    '<span class="v60-equip-quality">' + qName + (piece ? ' +' + (piece.level - 1) : '') + '</span></div>';
            }
            equipEl.innerHTML = equipHtml;
        }
        // VNext: 背包(掉落装备 穿戴/强化/分解)
        var bagEl = document.getElementById('v60-train-bag');
        if (bagEl) {
            var bag = game.profile.data.bag || [];
            bagEl.innerHTML = '';
            if (!bag.length) {
                bagEl.innerHTML = '<div class="v60-rank-empty">暂无掉落装备 · 通关战斗获取</div>';
            }
            for (var bi = 0; bi < bag.length; bi++) {
                (function(item) {
                    var it = document.createElement('div');
                    it.className = 'v60-bag-item';
                    it.innerHTML =
                        '<div class="v60-bag-main"><div class="v60-bag-name v60-quality-' + item.quality + '">' +
                        (item.isNew ? '<span style="color:#FF4444">新!</span> ' : '') + item.name +
                        ' <i style="font-style:normal;font-size:10px">Q' + EQUIP_QUALITY[item.quality] + ' +' + (item.level - 1) + '</i></div>' +
                        '<div class="v60-bag-affix">' + (item.affixLines || []).join(' · ') + '</div></div>';
                    var actions = document.createElement('div');
                    actions.className = 'v60-bag-actions';
                    var wearBtn = document.createElement('button');
                    wearBtn.className = 'v60-bag-btn';
                    wearBtn.textContent = '穿戴';
                    wearBtn.onclick = function() {
                        // V11 QA修复[P3]: 原守卫判的是SoldierGrowth却调用EquipmentLoot, 守卫与被调对象不一致
                        var r = EquipmentLoot ? EquipmentLoot.equipFromBag(game.profile, item.uid) : { ok: false };
                        if (r.ok) { game._sfx('gate'); game._refreshCoinDisplays(); self.renderTraining(game); }
                    };
                    actions.appendChild(wearBtn);
                    var upBtn = document.createElement('button');
                    upBtn.className = 'v60-bag-btn up';
                    var upCost = item.level >= 10 ? null : EQUIP_UPGRADE_COST(item.quality, item.level);
                    upBtn.textContent = upCost === null ? 'MAX' : '强化🪙' + upCost;
                    upBtn.disabled = upCost === null || game.profile.coins < upCost;
                    upBtn.onclick = function() {
                        var r = EquipmentLoot.upgradeBagEquip(game.profile, item.uid);
                        if (r.ok) { game._sfx('gate'); game._refreshCoinDisplays(); self.renderTraining(game); }
                    };
                    actions.appendChild(upBtn);
                    var sellBtn = document.createElement('button');
                    sellBtn.className = 'v60-bag-btn sell';
                    sellBtn.textContent = '分解';
                    sellBtn.onclick = function() {
                        var r = EquipmentLoot.sellEquip(game.profile, item.uid);
                        if (r.ok) { game._sfx('coin'); game._refreshCoinDisplays(); self.renderTraining(game); }
                    };
                    actions.appendChild(sellBtn);
                    it.appendChild(actions);
                    bagEl.appendChild(it);
                })(bag[bi]);
            }
        }
        var maxed = lv >= 50;
        if (upBtn) {
            upBtn.textContent = maxed ? 'MAX' : '升级 (🪙' + cost + ')';
            upBtn.disabled = maxed || game.profile.coins < cost;
            upBtn.onclick = function() {
                var r = SoldierGrowth.upgrade(game.profile);
                if (r.ok) {
                    game._sfx('gate');
                    game._refreshCoinDisplays();
                    self.renderTraining(game);
                    if (r.milestone && costEl) costEl.innerHTML = '<b style="color:#FFC247">🎉 解锁: ' + r.milestone.unlock + '</b>';
                } else if (costEl) {
                    costEl.textContent = r.reason === 'insufficient' ? '金币不足 (需要🪙' + r.cost + ')' : '已满级';
                }
            };
        }
    },

    // ===== V8.0: 军械库(WeaponSystem 8种武器) =====
    renderArmory: function(game) {
        var el = document.getElementById('v60-armory-list');
        if (!el || !game.profile || typeof WeaponSystem === 'undefined') return;
        el.innerHTML = '';
        var current = WeaponSystem.current(game.profile);
        var wLv = WeaponSystem.level(game.profile);
        var wStats = WeaponSystem.stats(game.profile);
        var upCost = WeaponSystem.upgradeCost(game.profile);
        var canEvo = WeaponSystem.canEvolve(game.profile);
        var self = this;
        for (var id in WEAPON_DEFS) {
            var def = WEAPON_DEFS[id];
            var isCurrent = id === current;
            var canUnlock = WeaponSystem.canUnlock(game.profile, id);
            var unlockedNow = !def.unlockCondition || isCurrent || canUnlock ||
                (def.unlockCondition.type === 'clear' && (game.profile.data.unlockedLevel || 1) > def.unlockCondition.level);
            var st = def.effect(wLv);
            var row = document.createElement('div');
            row.className = 'v60-armory-row' + (isCurrent ? ' equipped' : unlockedNow ? ' owned' : ' locked');
            var evoLine = '';
            if (isCurrent) {
                if (wStats.evolvedName) evoLine = '<div class="v60-armory-evo">✅ 已进化: ' + wStats.evolvedName + '</div>';
                else if (canEvo.ok) evoLine = '<div class="v60-armory-evo">⚡ 可进化: ' + EVOLUTION_DEFS[canEvo.evoId].name + '</div>';
                else if (canEvo.reason === 'tech_required') evoLine = '<div class="v60-armory-evo">🔒 进化需科技: ' + canEvo.tech + ' ×' + canEvo.need + '</div>';
                // V11.3: 武器词条行
                if (wStats.affixName) evoLine += '<div class="v60-armory-evo" style="color:#FFC247">📝 词条: ' + wStats.affixName + '</div>';
            }
            var statText = '伤害 ×' + (st.dmgMul || 1) +
                (st.rateMul ? ' · 射速 ×' + st.rateMul : '') +
                (st.pellets ? ' · 弹丸 ×' + st.pellets : '') +
                (st.pierceBonus ? ' · 穿透 +' + st.pierceBonus : '') +
                (st.radius ? ' · 半径 ' + st.radius : '') +
                (st.chain ? ' · 链式 ×' + st.chain : '') +
                (st.slowMul ? ' · 减速 ' + Math.round((1 - st.slowMul) * 100) + '%' : '');
            row.innerHTML =
                '<div class="v60-armory-head"><span class="v60-armory-icon">' + def.icon + '</span>' +
                '<span class="v60-armory-name">' + def.name + (isCurrent ? ' ✓' : '') + '</span>' +
                '<span class="v60-armory-lv">Lv.' + wLv + '/5</span></div>' +
                '<div class="v60-armory-stats">' + statText + '</div>' +
                evoLine + '<div class="v60-armory-actions"></div>';
            var actions = row.querySelector('.v60-armory-actions');
            if (!unlockedNow) {
                actions.innerHTML = '<span class="v60-locked">通关第 ' + def.unlockCondition.level + ' 关解锁</span>';
            } else if (isCurrent) {
                var upBtn = document.createElement('button');
                upBtn.className = 'v60-armory-btn upgrade';
                upBtn.textContent = upCost !== null ? '升级 🪙' + upCost : 'MAX';
                upBtn.disabled = upCost === null || game.profile.coins < upCost;
                upBtn.onclick = function() {
                    var r = WeaponSystem.upgrade(game.profile);
                    if (r.ok) { game._sfx('gate'); game._refreshCoinDisplays(); self.renderArmory(game); }
                };
                actions.appendChild(upBtn);
                if (canEvo.ok) {
                    var evoBtn = document.createElement('button');
                    evoBtn.className = 'v60-armory-btn evolve';
                    evoBtn.textContent = '⚡进化';
                    evoBtn.onclick = function() {
                        var r = WeaponSystem.evolve(game.profile);
                        if (r.ok) { game._sfx('win'); self.renderArmory(game); }
                    };
                    actions.appendChild(evoBtn);
                }
            } else {
                var swBtn = document.createElement('button');
                swBtn.className = 'v60-armory-btn';
                swBtn.textContent = '切换';
                swBtn.onclick = function(wid) { return function() { WeaponSystem.switchTo(game.profile, wid); game._sfx('gate'); self.renderArmory(game); }; }(id);
                actions.appendChild(swBtn);
            }
            el.appendChild(row);
        }
    },

    // ===== V8.0: 科研站(科技树) =====
    renderTech: function(game) {
        var ptsEl = document.getElementById('v60-tech-points');
        var listEl = document.getElementById('v60-tech-list');
        if (!listEl || !game.profile || typeof TechTree === 'undefined') return;
        var tp = game.profile.data.techPoints || 0;
        if (ptsEl) ptsEl.innerHTML = '<b>🔬 科技点: ' + tp + '</b><span class="v60-tech-tip">通关与成就获取科技点</span>';
        listEl.innerHTML = '';
        var self = this;
        var branches = { fire: '火力科技', army: '军团科技', logi: '后勤科技' };
        for (var branch in branches) {
            var title = document.createElement('div');
            title.className = 'v60-tech-branch';
            title.textContent = branches[branch];
            listEl.appendChild(title);
            for (var id in TECH_DEFS) {
                var def = TECH_DEFS[id];
                if (def.branch !== branch) continue;
                var lv = TechTree.levelOf(game.profile, id);
                var check = TechTree.canUpgrade(game.profile, id);
                var row = document.createElement('div');
                row.className = 'v60-tech-row' + (lv >= def.max ? ' maxed' : check.ok && tp >= check.cost ? ' ready' : check.ok ? '' : ' locked');
                row.innerHTML =
                    '<div class="v60-ach-info"><div class="v60-ach-name">' + def.icon + ' ' + def.name + ' <i>Lv.' + lv + '/' + def.max + '</i></div>' +
                    '<div class="v60-ach-desc">' + def.desc + (def.req && lv < def.max ? ' · 前置: ' + TECH_DEFS[def.req].name : '') + '</div></div>' +
                    '<div class="v60-ach-reward">' + (lv >= def.max ? 'MAX' : def.cost + '🔬') + '</div>';
                if (check.ok) {
                    row.onclick = function(tid) { return function() {
                        var r = TechTree.upgrade(game.profile, tid);
                        if (r.ok) { game._sfx('gate'); self.renderTech(game); }
                    }; }(id);
                    row.classList.add('clickable');
                }
                listEl.appendChild(row);
            }
        }
    },

    // ===== V8.0: 战场图鉴(Boss+武器收藏) =====
    renderCodex: function(game) {
        var bossesEl = document.getElementById('v60-codex-bosses');
        var weaponsEl = document.getElementById('v60-codex-weapons');
        if (!bossesEl || !weaponsEl || !game.profile) return;
        var d = game.profile.data;
        // —— Boss图鉴 ——
        bossesEl.innerHTML = '';
        var bossSeen = d.bossSeen || {};
        for (var i = 0; i < LEVELS.length && i < CONFIG.BOSS_NAMES.length; i++) {
            var name = CONFIG.BOSS_NAMES[i];
            var style = LEVELS[i].bossStyle || 'bruiser';
            var seen = !!bossSeen[style] || (d.stats && d.stats.bossKills > 0 && i + 1 <= (d.unlockedLevel || 1));
            var killed = d.stars && d.stars['L' + (i + 1)] > 0;
            var card = document.createElement('div');
            card.className = 'v60-codex-card' + (seen ? '' : ' unknown');
            card.innerHTML =
                '<div class="v60-codex-icon">' + (seen ? '👹' : '❓') + '</div>' +
                '<div class="v60-ach-info"><div class="v60-ach-name">' + (seen ? name : '???') + '</div>' +
                '<div class="v60-ach-desc">' + (seen ? '第' + (i + 1) + '关 · 体格: ' + style : '通关后解锁') + '</div></div>' +
                '<div class="v60-ach-reward">' + (killed ? '🎖️已讨伐' : seen ? '遭遇过' : '') + '</div>';
            bossesEl.appendChild(card);
        }
        // —— 武器收藏 ——
        // V11 QA修复[P3]: renderCodex 补 WeaponSystem 守卫(与 renderArmory 等处一致)
        if (typeof WeaponSystem === 'undefined') return;
        weaponsEl.innerHTML = '';
        var wLv = WeaponSystem.level(game.profile);
        var wStats = WeaponSystem.stats(game.profile);
        for (var wid in WEAPON_DEFS) {
            var def = WEAPON_DEFS[wid];
            var cond = def.unlockCondition;
            var got = !cond || (game.profile.data.unlockedLevel || 1) > cond.level;
            var wcard = document.createElement('div');
            wcard.className = 'v60-codex-card' + (got ? '' : ' unknown');
            wcard.innerHTML =
                '<div class="v60-codex-icon">' + (got ? def.icon : '🔒') + '</div>' +
                '<div class="v60-ach-info"><div class="v60-ach-name">' + (got ? def.name : '???') + '</div>' +
                '<div class="v60-ach-desc">' + (got ? def.desc : '通关第 ' + cond.level + ' 关解锁') + '</div></div>' +
                '<div class="v60-ach-reward">' + (wStats.weaponId === wid && wStats.evolvedName ? '⚡' : got ? '已装备档案' : '') + '</div>';
            weaponsEl.appendChild(wcard);
        }
    },

    // ===== V8.0: 挑战模式入口 =====
    renderChallenges: function(game) {
        var el = document.getElementById('v60-challenge-list');
        if (!el || !game.profile || typeof CHALLENGE_MODES === 'undefined') return;
        var d = game.profile.data;
        var best = d.challengeBest || {};
        var unlockedLv = d.unlockedLevel || 1;
        el.innerHTML = '';
        var self = this;
        for (var type in CHALLENGE_MODES) {
            var cfg = CHALLENGE_MODES[type];
            // 无尽生存需通关L3; Boss试炼需通关L5
            var need = type === 'survival' ? 4 : 6;
            var open = unlockedLv >= need;
            var card = document.createElement('div');
            card.className = 'v60-challenge-card' + (open ? '' : ' locked');
            card.innerHTML =
                '<div class="v60-ach-info"><div class="v60-ach-name">' + cfg.icon + ' ' + cfg.name + '</div>' +
                '<div class="v60-ach-desc">' + cfg.desc + '</div>' +
                '<div class="v60-ach-desc">最高纪录: ' + (best[type] || 0) + '</div></div>' +
                '<div class="v60-ach-reward">' + (open ? '▶' : '🔒 通关L' + (need - 1)) + '</div>';
            if (open) {
                card.onclick = function(mode) { return function() {
                    game._sfx('gate');
                    self.hidePages();
                    game.startChallengeMode(mode);
                }; }(type);
                card.classList.add('clickable');
            }
            el.appendChild(card);
        }
    },

    // ===== VNext: 战绩排行(真实结算数据, 无假排名) =====
    // V12视觉: 前三甲奖牌徽章 + 职业徽章 + 最新战绩高亮(docs/art/UI_DESIGN_SYSTEM.md)
    renderRank: function(game) {
        var el = document.getElementById('v60-rank-list');
        if (!el || !game.profile || typeof Leaderboard === 'undefined') return;
        var list = Leaderboard.top(game.profile, LEADERBOARD_CAP);
        el.innerHTML = '';
        if (!list.length) {
            el.innerHTML = '<div class="v60-rank-empty">暂无战绩 · 完成一局战斗后进入排行</div>';
            return;
        }
        // 最新一条战绩标记"最新"徽标(本地榜=玩家自己的历史)
        var latestTs = 0;
        for (var mi = 0; mi < list.length; mi++) latestTs = Math.max(latestTs, list[mi].ts || 0);
        var MEDALS = ['🥇', '🥈', '🥉'];
        for (var i = 0; i < list.length; i++) {
            var r = list[i];
            var clsDef = (typeof CLASS_DEFS !== 'undefined' && CLASS_DEFS[r.classId]) ? CLASS_DEFS[r.classId] : null;
            var row = document.createElement('div');
            row.className = 'v60-rank-row' + (i < 3 ? ' top' + (i + 1) : '') +
                (r.ts === latestTs ? ' v60-rank-row-me' : '');
            row.innerHTML =
                (i < 3
                    ? '<div class="v60-rank-badge">' + MEDALS[i] + '</div>'
                    : '<div class="v60-rank-badge" style="background:linear-gradient(180deg,#B9D2EA,#8FB2D1)">' + (i + 1) + '</div>') +
                '<div class="v60-rank-info"><div class="v60-rank-name">' +
                (r.win ? '🏆 通关L' + r.level : (r.challenge ? '⚔️ ' + r.challenge : '💀 L' + r.level + '失利')) +
                (clsDef ? ' <span class="v60-rank-class-chip" style="background:' + clsDef.color + '">' + clsDef.icon + clsDef.name + '</span>' : '') + '</div>' +
                '<div class="v60-rank-meta">⚔️' + r.kills + ' · 👥' + r.maxCount + ' · 🔥' + (r.combo || 0) +
                ' · ' + Leaderboard.fmtDate(r.ts) + '</div></div>' +
                '<div class="v60-rank-score">' + r.score + '</div>';
            el.appendChild(row);
        }
    },

    renderSettings: function(game) {
        var soundBtn = document.getElementById('v60-set-sound');
        if (soundBtn && typeof Platform !== 'undefined' && Platform.audio) {
            soundBtn.textContent = Platform.audio.isMuted() ? '🔇 关' : '🔊 开';
        }
        var qualityBtn = document.getElementById('v60-set-quality');
        if (qualityBtn) {
            var names = ['低', '中', '高'];
            qualityBtn.textContent = names[game.world.quality] || '高';
        }
        var shakeBtn = document.getElementById('v60-set-shake');
        if (shakeBtn) shakeBtn.textContent = game.world._shakeDisabled ? '🚫 关' : '💥 开';
        var info = document.getElementById('v60-saveinfo');
        if (info && game.profile) {
            var d = game.profile.data;
            info.innerHTML = '存档 v' + d.profileVersion + ' · 金币 ' + d.coins + ' · 解锁 ' + d.unlockedLevel + '/' + LEVELS.length + ' 关 · 击杀 ' + (d.totalKills || 0);
        }
    }
};


/* ===== [[ js/upgrades.js ]] ===== */
// ===== V5.1 永久升级商店 (全部价格/上限/效果集中配置) =====

var UPGRADE_DEFS = {
    recruit: {
        id: 'recruit',
        name: '新兵招募',
        icon: '🎖️',
        desc: '每级初始人数 +1',
        levels: [100, 180, 300, 450, 650, 900, 1200, 1600, 2100, 2700],
        effect: function(lv) { return '初始人数 ' + (1 + lv); }
    },
    logistics: {
        id: 'logistics',
        name: '后勤补给',
        icon: '📦',
        desc: '每级金币收益 +10%',
        levels: [150, 300, 500, 800, 1200],
        effect: function(lv) { return '金币收益 +' + (lv * 10) + '%'; }
    },
    gun: {
        id: 'gun',
        name: '枪械强化',
        icon: '🔫',
        desc: '每级基础伤害 +1',
        levels: [120, 220, 360, 550, 800, 1100, 1500, 2000],
        effect: function(lv) { return '基础伤害 ' + (1 + lv); }
    },
    rapid: {
        id: 'rapid',
        name: '快速射击',
        icon: '⚡',
        desc: '每级射速 +5%（全局射速上限不变）',
        levels: [120, 240, 400, 650, 950],
        effect: function(lv) { return '射速 +' + (lv * 5) + '%'; }
    },
    pierce: {
        id: 'pierce',
        name: '穿甲弹',
        icon: '🛡️',
        desc: '每级子弹穿透 +1',
        levels: [250, 500, 900],
        effect: function(lv) { return '穿透 +' + lv; }
    }
};

var UpgradeShop = {
    /** 升级当前等级(0起) */
    levelOf: function(profile, id) {
        return (profile.data.upgrades && profile.data.upgrades[id]) || 0;
    },
    maxLevel: function(id) { return UPGRADE_DEFS[id].levels.length; },
    priceOf: function(id, lv) {
        var def = UPGRADE_DEFS[id];
        return (lv >= def.levels.length) ? null : def.levels[lv];
    },
    /**
     * 购买(原子): 余额检查→扣款→升级→保存。
     * @returns {ok:boolean, reason?:'insufficient'|'maxed', coins?:number}
     */
    purchase: function(profile, id) {
        var lv = this.levelOf(profile, id);
        var price = this.priceOf(id, lv);
        if (price === null) return { ok: false, reason: 'maxed' };
        if (profile.coins < price) return { ok: false, reason: 'insufficient', need: price };
        if (!profile.spend(price)) return { ok: false, reason: 'insufficient', need: price }; // 原子扣款失败
        profile.data.upgrades[id] = lv + 1;
        profile.save();
        return { ok: true, coins: profile.coins, level: lv + 1 };
    },
    /** 战斗内应用(与门 buff 叠加规则见 squad) */
    startCount: function(profile, levelStart) {
        return levelStart + this.levelOf(profile, 'recruit');
    },
    damageBonus: function(profile) { return this.levelOf(profile, 'gun'); },
    fireRateMul: function(profile) { return 1 + 0.05 * this.levelOf(profile, 'rapid'); },
    pierceBonus: function(profile) { return this.levelOf(profile, 'pierce'); }
}; // V10.1: 移除无调用的 coinMul(后勤金币加成在 settleRunEconomy 直接读 upgrades.logistics)


/* ===== [[ js/movement.js ]] ===== */
// ===== V4.0 移动手感数学 (纯逻辑, 无THREE依赖, 可单测) =====
// 设计: 连续目标位置 + 帧率无关阻尼跟随, 替代旧"30px阈值跳道"
// 所有参数来自 CONFIG.MOVE, 禁止在事件处理中写死数值

var MovementMath = {

    /** 拖动映射: touchSensitivity = 1.0 表示"拖过整个屏幕宽度 = 横穿全部可玩范围"。
     *  V5.0 语义修正: touchSensitivity 越大 → 移动越快(越灵敏), 越小 → 移动越慢。
     *  @param anchorWX   按下时小队targetX(锚点, 相对拖动不跳变)
     *  @param dxPx       本次拖动像素位移(cur - start)
     *  @param canvasWidth 画布CSS宽度(px)
     *  @param maxX       队伍中心允许的最大|X|(随阵型宽度变化)
     *  @returns 目标X(已钳制)
     */
    dragTarget: function(anchorWX, dxPx, canvasWidth, maxX) {
        var M = CONFIG.MOVE;
        var w = Math.max(1, canvasWidth || 1);
        // 每像素世界位移 = 全可玩范围 × 灵敏度 / 屏幕宽
        var worldPerPx = (maxX * 2) * M.touchSensitivity / w;
        var x = anchorWX + dxPx * worldPerPx;
        return this.clampCenter(x, maxX);
    },

    /** 键盘单步移动(世界单位) */
    keyTarget: function(currentX, dir, maxX) {
        var step = (CONFIG.MOVE.keyStep || 1.2) * (dir >= 0 ? 1 : -1);
        return this.clampCenter(currentX + step, maxX);
    },

    /** 队伍中心可移动边界:
     *  小人数: 路半宽 - 边距 - 队伍半宽 (全路自由移动)
     *  大人数: 优先保证"人群边缘不出路", 中心范围收窄到 路缘-人群半宽-余量,
     *          门可达性由门触发窗口随队伍宽度扩展补偿(见gates.js)
     */
    centerBounds: function(crowdHalfWidth) {
        var M = CONFIG.MOVE;
        var crowd = crowdHalfWidth || 0;
        var raw = CONFIG.ROAD_HALF_WIDTH - (M.centerMargin || 0.12) - crowd;
        if (raw >= (M.minCenterRange || 1.1)) return raw;
        // 大人数: 包络优先
        var contain = Math.max(0.1, CONFIG.ROAD_HALF_WIDTH - 0.05 - crowd);
        return Math.max(raw, Math.min(M.minCenterRange || 1.1, contain));
    },

    /** 钳制中心X到±bound */
    clampCenter: function(x, bound) {
        return Math.max(-bound, Math.min(bound, x));
    },

    /** 跟随阻尼λ: 3/λ秒后到达目标的~95% (指数阻尼帧率无关) */
    followLambda: function() {
        var t = Math.max(0.02, CONFIG.MOVE.followSmoothTime || 0.15);
        return 1 / t;
    },

    /** 门触发窗口: 门半宽 + 队伍半宽的一半(封顶0.7) — 大人数时允许人群边缘触发,
     *  但封顶保证左右门(间距4)触发区间永不重叠(死区≥0.6)
     */
    gateTriggerWindow: function(gateHalfWidth, crowdHalfWidth) {
        return gateHalfWidth + Math.min((crowdHalfWidth || 0) * 0.5, 0.7);
    }
};


/* ===== [[ js/vendor/GLTFLoader.js ]] ===== */
/* Three.js r149 GLTFLoader + BufferGeometryUtils; MIT. Local classic-script wrapper. */
(function(THREE){
const toTrianglesDrawMode=(function(){
const {
	BufferAttribute,
	BufferGeometry,
	Float32BufferAttribute,
	InstancedBufferAttribute,
	InterleavedBuffer,
	InterleavedBufferAttribute,
	TriangleFanDrawMode,
	TriangleStripDrawMode,
	TrianglesDrawMode,
	Vector3,
} = THREE;

function computeTangents() {

	throw new Error( 'BufferGeometryUtils: computeTangents renamed to computeMikkTSpaceTangents.' );

}

function computeMikkTSpaceTangents( geometry, MikkTSpace, negateSign = true ) {

	if ( ! MikkTSpace || ! MikkTSpace.isReady ) {

		throw new Error( 'BufferGeometryUtils: Initialized MikkTSpace library required.' );

	}

	if ( ! geometry.hasAttribute( 'position' ) || ! geometry.hasAttribute( 'normal' ) || ! geometry.hasAttribute( 'uv' ) ) {

		throw new Error( 'BufferGeometryUtils: Tangents require "position", "normal", and "uv" attributes.' );

	}

	function getAttributeArray( attribute ) {

		if ( attribute.normalized || attribute.isInterleavedBufferAttribute ) {

			const dstArray = new Float32Array( attribute.getCount() * attribute.itemSize );

			for ( let i = 0, j = 0; i < attribute.getCount(); i ++ ) {

				dstArray[ j ++ ] = attribute.getX( i );
				dstArray[ j ++ ] = attribute.getY( i );

				if ( attribute.itemSize > 2 ) {

					dstArray[ j ++ ] = attribute.getZ( i );

				}

			}

			return dstArray;

		}

		if ( attribute.array instanceof Float32Array ) {

			return attribute.array;

		}

		return new Float32Array( attribute.array );

	}

	// MikkTSpace algorithm requires non-indexed input.

	const _geometry = geometry.index ? geometry.toNonIndexed() : geometry;

	// Compute vertex tangents.

	const tangents = MikkTSpace.generateTangents(

		getAttributeArray( _geometry.attributes.position ),
		getAttributeArray( _geometry.attributes.normal ),
		getAttributeArray( _geometry.attributes.uv )

	);

	// Texture coordinate convention of glTF differs from the apparent
	// default of the MikkTSpace library; .w component must be flipped.

	if ( negateSign ) {

		for ( let i = 3; i < tangents.length; i += 4 ) {

			tangents[ i ] *= - 1;

		}

	}

	//

	_geometry.setAttribute( 'tangent', new BufferAttribute( tangents, 4 ) );

	if ( geometry !== _geometry ) {

		geometry.copy( _geometry );

	}

	return geometry;

}

/**
 * @param  {Array<BufferGeometry>} geometries
 * @param  {Boolean} useGroups
 * @return {BufferGeometry}
 */
function mergeBufferGeometries( geometries, useGroups = false ) {

	const isIndexed = geometries[ 0 ].index !== null;

	const attributesUsed = new Set( Object.keys( geometries[ 0 ].attributes ) );
	const morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );

	const attributes = {};
	const morphAttributes = {};

	const morphTargetsRelative = geometries[ 0 ].morphTargetsRelative;

	const mergedGeometry = new BufferGeometry();

	let offset = 0;

	for ( let i = 0; i < geometries.length; ++ i ) {

		const geometry = geometries[ i ];
		let attributesCount = 0;

		// ensure that all geometries are indexed, or none

		if ( isIndexed !== ( geometry.index !== null ) ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.' );
			return null;

		}

		// gather attributes, exit early if they're different

		for ( const name in geometry.attributes ) {

			if ( ! attributesUsed.has( name ) ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure "' + name + '" attribute exists among all geometries, or in none of them.' );
				return null;

			}

			if ( attributes[ name ] === undefined ) attributes[ name ] = [];

			attributes[ name ].push( geometry.attributes[ name ] );

			attributesCount ++;

		}

		// ensure geometries have the same number of attributes

		if ( attributesCount !== attributesUsed.size ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. Make sure all geometries have the same number of attributes.' );
			return null;

		}

		// gather morph attributes, exit early if they're different

		if ( morphTargetsRelative !== geometry.morphTargetsRelative ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. .morphTargetsRelative must be consistent throughout all geometries.' );
			return null;

		}

		for ( const name in geometry.morphAttributes ) {

			if ( ! morphAttributesUsed.has( name ) ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '.  .morphAttributes must be consistent throughout all geometries.' );
				return null;

			}

			if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];

			morphAttributes[ name ].push( geometry.morphAttributes[ name ] );

		}

		if ( useGroups ) {

			let count;

			if ( isIndexed ) {

				count = geometry.index.count;

			} else if ( geometry.attributes.position !== undefined ) {

				count = geometry.attributes.position.count;

			} else {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. The geometry must have either an index or a position attribute' );
				return null;

			}

			mergedGeometry.addGroup( offset, count, i );

			offset += count;

		}

	}

	// merge indices

	if ( isIndexed ) {

		let indexOffset = 0;
		const mergedIndex = [];

		for ( let i = 0; i < geometries.length; ++ i ) {

			const index = geometries[ i ].index;

			for ( let j = 0; j < index.count; ++ j ) {

				mergedIndex.push( index.getX( j ) + indexOffset );

			}

			indexOffset += geometries[ i ].attributes.position.count;

		}

		mergedGeometry.setIndex( mergedIndex );

	}

	// merge attributes

	for ( const name in attributes ) {

		const mergedAttribute = mergeBufferAttributes( attributes[ name ] );

		if ( ! mergedAttribute ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the ' + name + ' attribute.' );
			return null;

		}

		mergedGeometry.setAttribute( name, mergedAttribute );

	}

	// merge morph attributes

	for ( const name in morphAttributes ) {

		const numMorphTargets = morphAttributes[ name ][ 0 ].length;

		if ( numMorphTargets === 0 ) break;

		mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
		mergedGeometry.morphAttributes[ name ] = [];

		for ( let i = 0; i < numMorphTargets; ++ i ) {

			const morphAttributesToMerge = [];

			for ( let j = 0; j < morphAttributes[ name ].length; ++ j ) {

				morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );

			}

			const mergedMorphAttribute = mergeBufferAttributes( morphAttributesToMerge );

			if ( ! mergedMorphAttribute ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the ' + name + ' morphAttribute.' );
				return null;

			}

			mergedGeometry.morphAttributes[ name ].push( mergedMorphAttribute );

		}

	}

	return mergedGeometry;

}

/**
 * @param {Array<BufferAttribute>} attributes
 * @return {BufferAttribute}
 */
function mergeBufferAttributes( attributes ) {

	let TypedArray;
	let itemSize;
	let normalized;
	let arrayLength = 0;

	for ( let i = 0; i < attributes.length; ++ i ) {

		const attribute = attributes[ i ];

		if ( attribute.isInterleavedBufferAttribute ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. InterleavedBufferAttributes are not supported.' );
			return null;

		}

		if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
		if ( TypedArray !== attribute.array.constructor ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.' );
			return null;

		}

		if ( itemSize === undefined ) itemSize = attribute.itemSize;
		if ( itemSize !== attribute.itemSize ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.' );
			return null;

		}

		if ( normalized === undefined ) normalized = attribute.normalized;
		if ( normalized !== attribute.normalized ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.' );
			return null;

		}

		arrayLength += attribute.array.length;

	}

	const array = new TypedArray( arrayLength );
	let offset = 0;

	for ( let i = 0; i < attributes.length; ++ i ) {

		array.set( attributes[ i ].array, offset );

		offset += attributes[ i ].array.length;

	}

	return new BufferAttribute( array, itemSize, normalized );

}

/**
 * @param {BufferAttribute}
 * @return {BufferAttribute}
 */
function deepCloneAttribute( attribute ) {

	if ( attribute.isInstancedInterleavedBufferAttribute || attribute.isInterleavedBufferAttribute ) {

		return deinterleaveAttribute( attribute );

	}

	if ( attribute.isInstancedBufferAttribute ) {

		return new InstancedBufferAttribute().copy( attribute );

	}

	return new BufferAttribute().copy( attribute );

}

/**
 * @param {Array<BufferAttribute>} attributes
 * @return {Array<InterleavedBufferAttribute>}
 */
function interleaveAttributes( attributes ) {

	// Interleaves the provided attributes into an InterleavedBuffer and returns
	// a set of InterleavedBufferAttributes for each attribute
	let TypedArray;
	let arrayLength = 0;
	let stride = 0;

	// calculate the length and type of the interleavedBuffer
	for ( let i = 0, l = attributes.length; i < l; ++ i ) {

		const attribute = attributes[ i ];

		if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
		if ( TypedArray !== attribute.array.constructor ) {

			console.error( 'AttributeBuffers of different types cannot be interleaved' );
			return null;

		}

		arrayLength += attribute.array.length;
		stride += attribute.itemSize;

	}

	// Create the set of buffer attributes
	const interleavedBuffer = new InterleavedBuffer( new TypedArray( arrayLength ), stride );
	let offset = 0;
	const res = [];
	const getters = [ 'getX', 'getY', 'getZ', 'getW' ];
	const setters = [ 'setX', 'setY', 'setZ', 'setW' ];

	for ( let j = 0, l = attributes.length; j < l; j ++ ) {

		const attribute = attributes[ j ];
		const itemSize = attribute.itemSize;
		const count = attribute.count;
		const iba = new InterleavedBufferAttribute( interleavedBuffer, itemSize, offset, attribute.normalized );
		res.push( iba );

		offset += itemSize;

		// Move the data for each attribute into the new interleavedBuffer
		// at the appropriate offset
		for ( let c = 0; c < count; c ++ ) {

			for ( let k = 0; k < itemSize; k ++ ) {

				iba[ setters[ k ] ]( c, attribute[ getters[ k ] ]( c ) );

			}

		}

	}

	return res;

}

// returns a new, non-interleaved version of the provided attribute
function deinterleaveAttribute( attribute ) {

	const cons = attribute.data.array.constructor;
	const count = attribute.count;
	const itemSize = attribute.itemSize;
	const normalized = attribute.normalized;

	const array = new cons( count * itemSize );
	let newAttribute;
	if ( attribute.isInstancedInterleavedBufferAttribute ) {

		newAttribute = new InstancedBufferAttribute( array, itemSize, normalized, attribute.meshPerAttribute );

	} else {

		newAttribute = new BufferAttribute( array, itemSize, normalized );

	}

	for ( let i = 0; i < count; i ++ ) {

		newAttribute.setX( i, attribute.getX( i ) );

		if ( itemSize >= 2 ) {

			newAttribute.setY( i, attribute.getY( i ) );

		}

		if ( itemSize >= 3 ) {

			newAttribute.setZ( i, attribute.getZ( i ) );

		}

		if ( itemSize >= 4 ) {

			newAttribute.setW( i, attribute.getW( i ) );

		}

	}

	return newAttribute;

}

// deinterleaves all attributes on the geometry
function deinterleaveGeometry( geometry ) {

	const attributes = geometry.attributes;
	const morphTargets = geometry.morphTargets;
	const attrMap = new Map();

	for ( const key in attributes ) {

		const attr = attributes[ key ];
		if ( attr.isInterleavedBufferAttribute ) {

			if ( ! attrMap.has( attr ) ) {

				attrMap.set( attr, deinterleaveAttribute( attr ) );

			}

			attributes[ key ] = attrMap.get( attr );

		}

	}

	for ( const key in morphTargets ) {

		const attr = morphTargets[ key ];
		if ( attr.isInterleavedBufferAttribute ) {

			if ( ! attrMap.has( attr ) ) {

				attrMap.set( attr, deinterleaveAttribute( attr ) );

			}

			morphTargets[ key ] = attrMap.get( attr );

		}

	}

}

/**
 * @param {Array<BufferGeometry>} geometry
 * @return {number}
 */
function estimateBytesUsed( geometry ) {

	// Return the estimated memory used by this geometry in bytes
	// Calculate using itemSize, count, and BYTES_PER_ELEMENT to account
	// for InterleavedBufferAttributes.
	let mem = 0;
	for ( const name in geometry.attributes ) {

		const attr = geometry.getAttribute( name );
		mem += attr.count * attr.itemSize * attr.array.BYTES_PER_ELEMENT;

	}

	const indices = geometry.getIndex();
	mem += indices ? indices.count * indices.itemSize * indices.array.BYTES_PER_ELEMENT : 0;
	return mem;

}

/**
 * @param {BufferGeometry} geometry
 * @param {number} tolerance
 * @return {BufferGeometry}
 */
function mergeVertices( geometry, tolerance = 1e-4 ) {

	tolerance = Math.max( tolerance, Number.EPSILON );

	// Generate an index buffer if the geometry doesn't have one, or optimize it
	// if it's already available.
	const hashToIndex = {};
	const indices = geometry.getIndex();
	const positions = geometry.getAttribute( 'position' );
	const vertexCount = indices ? indices.count : positions.count;

	// next value for triangle indices
	let nextIndex = 0;

	// attributes and new attribute arrays
	const attributeNames = Object.keys( geometry.attributes );
	const tmpAttributes = {};
	const tmpMorphAttributes = {};
	const newIndices = [];
	const getters = [ 'getX', 'getY', 'getZ', 'getW' ];
	const setters = [ 'setX', 'setY', 'setZ', 'setW' ];

	// Initialize the arrays, allocating space conservatively. Extra
	// space will be trimmed in the last step.
	for ( let i = 0, l = attributeNames.length; i < l; i ++ ) {

		const name = attributeNames[ i ];
		const attr = geometry.attributes[ name ];

		tmpAttributes[ name ] = new BufferAttribute(
			new attr.array.constructor( attr.count * attr.itemSize ),
			attr.itemSize,
			attr.normalized
		);

		const morphAttr = geometry.morphAttributes[ name ];
		if ( morphAttr ) {

			tmpMorphAttributes[ name ] = new BufferAttribute(
				new morphAttr.array.constructor( morphAttr.count * morphAttr.itemSize ),
				morphAttr.itemSize,
				morphAttr.normalized
			);

		}

	}

	// convert the error tolerance to an amount of decimal places to truncate to
	const decimalShift = Math.log10( 1 / tolerance );
	const shiftMultiplier = Math.pow( 10, decimalShift );
	for ( let i = 0; i < vertexCount; i ++ ) {

		const index = indices ? indices.getX( i ) : i;

		// Generate a hash for the vertex attributes at the current index 'i'
		let hash = '';
		for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

			const name = attributeNames[ j ];
			const attribute = geometry.getAttribute( name );
			const itemSize = attribute.itemSize;

			for ( let k = 0; k < itemSize; k ++ ) {

				// double tilde truncates the decimal value
				hash += `${ ~ ~ ( attribute[ getters[ k ] ]( index ) * shiftMultiplier ) },`;

			}

		}

		// Add another reference to the vertex if it's already
		// used by another index
		if ( hash in hashToIndex ) {

			newIndices.push( hashToIndex[ hash ] );

		} else {

			// copy data to the new index in the temporary attributes
			for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

				const name = attributeNames[ j ];
				const attribute = geometry.getAttribute( name );
				const morphAttr = geometry.morphAttributes[ name ];
				const itemSize = attribute.itemSize;
				const newarray = tmpAttributes[ name ];
				const newMorphArrays = tmpMorphAttributes[ name ];

				for ( let k = 0; k < itemSize; k ++ ) {

					const getterFunc = getters[ k ];
					const setterFunc = setters[ k ];
					newarray[ setterFunc ]( nextIndex, attribute[ getterFunc ]( index ) );

					if ( morphAttr ) {

						for ( let m = 0, ml = morphAttr.length; m < ml; m ++ ) {

							newMorphArrays[ m ][ setterFunc ]( nextIndex, morphAttr[ m ][ getterFunc ]( index ) );

						}

					}

				}

			}

			hashToIndex[ hash ] = nextIndex;
			newIndices.push( nextIndex );
			nextIndex ++;

		}

	}

	// generate result BufferGeometry
	const result = geometry.clone();
	for ( const name in geometry.attributes ) {

		const tmpAttribute = tmpAttributes[ name ];

		result.setAttribute( name, new BufferAttribute(
			tmpAttribute.array.slice( 0, nextIndex * tmpAttribute.itemSize ),
			tmpAttribute.itemSize,
			tmpAttribute.normalized,
		) );

		if ( ! ( name in tmpMorphAttributes ) ) continue;

		for ( let j = 0; j < tmpMorphAttributes[ name ].length; j ++ ) {

			const tmpMorphAttribute = tmpMorphAttributes[ name ][ j ];

			result.morphAttributes[ name ][ j ] = new BufferAttribute(
				tmpMorphAttribute.array.slice( 0, nextIndex * tmpMorphAttribute.itemSize ),
				tmpMorphAttribute.itemSize,
				tmpMorphAttribute.normalized,
			);

		}

	}

	// indices

	result.setIndex( newIndices );

	return result;

}

/**
 * @param {BufferGeometry} geometry
 * @param {number} drawMode
 * @return {BufferGeometry}
 */
function toTrianglesDrawMode( geometry, drawMode ) {

	if ( drawMode === TrianglesDrawMode ) {

		console.warn( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.' );
		return geometry;

	}

	if ( drawMode === TriangleFanDrawMode || drawMode === TriangleStripDrawMode ) {

		let index = geometry.getIndex();

		// generate index if not present

		if ( index === null ) {

			const indices = [];

			const position = geometry.getAttribute( 'position' );

			if ( position !== undefined ) {

				for ( let i = 0; i < position.count; i ++ ) {

					indices.push( i );

				}

				geometry.setIndex( indices );
				index = geometry.getIndex();

			} else {

				console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.' );
				return geometry;

			}

		}

		//

		const numberOfTriangles = index.count - 2;
		const newIndices = [];

		if ( drawMode === TriangleFanDrawMode ) {

			// gl.TRIANGLE_FAN

			for ( let i = 1; i <= numberOfTriangles; i ++ ) {

				newIndices.push( index.getX( 0 ) );
				newIndices.push( index.getX( i ) );
				newIndices.push( index.getX( i + 1 ) );

			}

		} else {

			// gl.TRIANGLE_STRIP

			for ( let i = 0; i < numberOfTriangles; i ++ ) {

				if ( i % 2 === 0 ) {

					newIndices.push( index.getX( i ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i + 2 ) );

				} else {

					newIndices.push( index.getX( i + 2 ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i ) );

				}

			}

		}

		if ( ( newIndices.length / 3 ) !== numberOfTriangles ) {

			console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.' );

		}

		// build final geometry

		const newGeometry = geometry.clone();
		newGeometry.setIndex( newIndices );
		newGeometry.clearGroups();

		return newGeometry;

	} else {

		console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:', drawMode );
		return geometry;

	}

}

/**
 * Calculates the morphed attributes of a morphed/skinned BufferGeometry.
 * Helpful for Raytracing or Decals.
 * @param {Mesh | Line | Points} object An instance of Mesh, Line or Points.
 * @return {Object} An Object with original position/normal attributes and morphed ones.
 */
function computeMorphedAttributes( object ) {

	if ( object.geometry.isBufferGeometry !== true ) {

		console.error( 'THREE.BufferGeometryUtils: Geometry is not of type BufferGeometry.' );
		return null;

	}

	const _vA = new Vector3();
	const _vB = new Vector3();
	const _vC = new Vector3();

	const _tempA = new Vector3();
	const _tempB = new Vector3();
	const _tempC = new Vector3();

	const _morphA = new Vector3();
	const _morphB = new Vector3();
	const _morphC = new Vector3();

	function _calculateMorphedAttributeData(
		object,
		attribute,
		morphAttribute,
		morphTargetsRelative,
		a,
		b,
		c,
		modifiedAttributeArray
	) {

		_vA.fromBufferAttribute( attribute, a );
		_vB.fromBufferAttribute( attribute, b );
		_vC.fromBufferAttribute( attribute, c );

		const morphInfluences = object.morphTargetInfluences;

		if ( morphAttribute && morphInfluences ) {

			_morphA.set( 0, 0, 0 );
			_morphB.set( 0, 0, 0 );
			_morphC.set( 0, 0, 0 );

			for ( let i = 0, il = morphAttribute.length; i < il; i ++ ) {

				const influence = morphInfluences[ i ];
				const morph = morphAttribute[ i ];

				if ( influence === 0 ) continue;

				_tempA.fromBufferAttribute( morph, a );
				_tempB.fromBufferAttribute( morph, b );
				_tempC.fromBufferAttribute( morph, c );

				if ( morphTargetsRelative ) {

					_morphA.addScaledVector( _tempA, influence );
					_morphB.addScaledVector( _tempB, influence );
					_morphC.addScaledVector( _tempC, influence );

				} else {

					_morphA.addScaledVector( _tempA.sub( _vA ), influence );
					_morphB.addScaledVector( _tempB.sub( _vB ), influence );
					_morphC.addScaledVector( _tempC.sub( _vC ), influence );

				}

			}

			_vA.add( _morphA );
			_vB.add( _morphB );
			_vC.add( _morphC );

		}

		if ( object.isSkinnedMesh ) {

			object.boneTransform( a, _vA );
			object.boneTransform( b, _vB );
			object.boneTransform( c, _vC );

		}

		modifiedAttributeArray[ a * 3 + 0 ] = _vA.x;
		modifiedAttributeArray[ a * 3 + 1 ] = _vA.y;
		modifiedAttributeArray[ a * 3 + 2 ] = _vA.z;
		modifiedAttributeArray[ b * 3 + 0 ] = _vB.x;
		modifiedAttributeArray[ b * 3 + 1 ] = _vB.y;
		modifiedAttributeArray[ b * 3 + 2 ] = _vB.z;
		modifiedAttributeArray[ c * 3 + 0 ] = _vC.x;
		modifiedAttributeArray[ c * 3 + 1 ] = _vC.y;
		modifiedAttributeArray[ c * 3 + 2 ] = _vC.z;

	}

	const geometry = object.geometry;
	const material = object.material;

	let a, b, c;
	const index = geometry.index;
	const positionAttribute = geometry.attributes.position;
	const morphPosition = geometry.morphAttributes.position;
	const morphTargetsRelative = geometry.morphTargetsRelative;
	const normalAttribute = geometry.attributes.normal;
	const morphNormal = geometry.morphAttributes.position;

	const groups = geometry.groups;
	const drawRange = geometry.drawRange;
	let i, j, il, jl;
	let group;
	let start, end;

	const modifiedPosition = new Float32Array( positionAttribute.count * positionAttribute.itemSize );
	const modifiedNormal = new Float32Array( normalAttribute.count * normalAttribute.itemSize );

	if ( index !== null ) {

		// indexed buffer geometry

		if ( Array.isArray( material ) ) {

			for ( i = 0, il = groups.length; i < il; i ++ ) {

				group = groups[ i ];

				start = Math.max( group.start, drawRange.start );
				end = Math.min( ( group.start + group.count ), ( drawRange.start + drawRange.count ) );

				for ( j = start, jl = end; j < jl; j += 3 ) {

					a = index.getX( j );
					b = index.getX( j + 1 );
					c = index.getX( j + 2 );

					_calculateMorphedAttributeData(
						object,
						positionAttribute,
						morphPosition,
						morphTargetsRelative,
						a, b, c,
						modifiedPosition
					);

					_calculateMorphedAttributeData(
						object,
						normalAttribute,
						morphNormal,
						morphTargetsRelative,
						a, b, c,
						modifiedNormal
					);

				}

			}

		} else {

			start = Math.max( 0, drawRange.start );
			end = Math.min( index.count, ( drawRange.start + drawRange.count ) );

			for ( i = start, il = end; i < il; i += 3 ) {

				a = index.getX( i );
				b = index.getX( i + 1 );
				c = index.getX( i + 2 );

				_calculateMorphedAttributeData(
					object,
					positionAttribute,
					morphPosition,
					morphTargetsRelative,
					a, b, c,
					modifiedPosition
				);

				_calculateMorphedAttributeData(
					object,
					normalAttribute,
					morphNormal,
					morphTargetsRelative,
					a, b, c,
					modifiedNormal
				);

			}

		}

	} else {

		// non-indexed buffer geometry

		if ( Array.isArray( material ) ) {

			for ( i = 0, il = groups.length; i < il; i ++ ) {

				group = groups[ i ];

				start = Math.max( group.start, drawRange.start );
				end = Math.min( ( group.start + group.count ), ( drawRange.start + drawRange.count ) );

				for ( j = start, jl = end; j < jl; j += 3 ) {

					a = j;
					b = j + 1;
					c = j + 2;

					_calculateMorphedAttributeData(
						object,
						positionAttribute,
						morphPosition,
						morphTargetsRelative,
						a, b, c,
						modifiedPosition
					);

					_calculateMorphedAttributeData(
						object,
						normalAttribute,
						morphNormal,
						morphTargetsRelative,
						a, b, c,
						modifiedNormal
					);

				}

			}

		} else {

			start = Math.max( 0, drawRange.start );
			end = Math.min( positionAttribute.count, ( drawRange.start + drawRange.count ) );

			for ( i = start, il = end; i < il; i += 3 ) {

				a = i;
				b = i + 1;
				c = i + 2;

				_calculateMorphedAttributeData(
					object,
					positionAttribute,
					morphPosition,
					morphTargetsRelative,
					a, b, c,
					modifiedPosition
				);

				_calculateMorphedAttributeData(
					object,
					normalAttribute,
					morphNormal,
					morphTargetsRelative,
					a, b, c,
					modifiedNormal
				);

			}

		}

	}

	const morphedPositionAttribute = new Float32BufferAttribute( modifiedPosition, 3 );
	const morphedNormalAttribute = new Float32BufferAttribute( modifiedNormal, 3 );

	return {

		positionAttribute: positionAttribute,
		normalAttribute: normalAttribute,
		morphedPositionAttribute: morphedPositionAttribute,
		morphedNormalAttribute: morphedNormalAttribute

	};

}

function mergeGroups( geometry ) {

	if ( geometry.groups.length === 0 ) {

		console.warn( 'THREE.BufferGeometryUtils.mergeGroups(): No groups are defined. Nothing to merge.' );
		return geometry;

	}

	let groups = geometry.groups;

	// sort groups by material index

	groups = groups.sort( ( a, b ) => {

		if ( a.materialIndex !== b.materialIndex ) return a.materialIndex - b.materialIndex;

		return a.start - b.start;

	} );

	// create index for non-indexed geometries

	if ( geometry.getIndex() === null ) {

		const positionAttribute = geometry.getAttribute( 'position' );
		const indices = [];

		for ( let i = 0; i < positionAttribute.count; i += 3 ) {

			indices.push( i, i + 1, i + 2 );

		}

		geometry.setIndex( indices );

	}

	// sort index

	const index = geometry.getIndex();

	const newIndices = [];

	for ( let i = 0; i < groups.length; i ++ ) {

		const group = groups[ i ];

		const groupStart = group.start;
		const groupLength = groupStart + group.count;

		for ( let j = groupStart; j < groupLength; j ++ ) {

			newIndices.push( index.getX( j ) );

		}

	}

	geometry.dispose(); // Required to force buffer recreation
	geometry.setIndex( newIndices );

	// update groups indices

	let start = 0;

	for ( let i = 0; i < groups.length; i ++ ) {

		const group = groups[ i ];

		group.start = start;
		start += group.count;

	}

	// merge groups

	let currentGroup = groups[ 0 ];

	geometry.groups = [ currentGroup ];

	for ( let i = 1; i < groups.length; i ++ ) {

		const group = groups[ i ];

		if ( currentGroup.materialIndex === group.materialIndex ) {

			currentGroup.count += group.count;

		} else {

			currentGroup = group;
			geometry.groups.push( currentGroup );

		}

	}

	return geometry;

}


// Creates a new, non-indexed geometry with smooth normals everywhere except faces that meet at
// an angle greater than the crease angle.
function toCreasedNormals( geometry, creaseAngle = Math.PI / 3 /* 60 degrees */ ) {

	const creaseDot = Math.cos( creaseAngle );
	const hashMultiplier = ( 1 + 1e-10 ) * 1e2;

	// reusable vertors
	const verts = [ new Vector3(), new Vector3(), new Vector3() ];
	const tempVec1 = new Vector3();
	const tempVec2 = new Vector3();
	const tempNorm = new Vector3();
	const tempNorm2 = new Vector3();

	// hashes a vector
	function hashVertex( v ) {

		const x = ~ ~ ( v.x * hashMultiplier );
		const y = ~ ~ ( v.y * hashMultiplier );
		const z = ~ ~ ( v.z * hashMultiplier );
		return `${x},${y},${z}`;

	}

	const resultGeometry = geometry.toNonIndexed();
	const posAttr = resultGeometry.attributes.position;
	const vertexMap = {};

	// find all the normals shared by commonly located vertices
	for ( let i = 0, l = posAttr.count / 3; i < l; i ++ ) {

		const i3 = 3 * i;
		const a = verts[ 0 ].fromBufferAttribute( posAttr, i3 + 0 );
		const b = verts[ 1 ].fromBufferAttribute( posAttr, i3 + 1 );
		const c = verts[ 2 ].fromBufferAttribute( posAttr, i3 + 2 );

		tempVec1.subVectors( c, b );
		tempVec2.subVectors( a, b );

		// add the normal to the map for all vertices
		const normal = new Vector3().crossVectors( tempVec1, tempVec2 ).normalize();
		for ( let n = 0; n < 3; n ++ ) {

			const vert = verts[ n ];
			const hash = hashVertex( vert );
			if ( ! ( hash in vertexMap ) ) {

				vertexMap[ hash ] = [];

			}

			vertexMap[ hash ].push( normal );

		}

	}

	// average normals from all vertices that share a common location if they are within the
	// provided crease threshold
	const normalArray = new Float32Array( posAttr.count * 3 );
	const normAttr = new BufferAttribute( normalArray, 3, false );
	for ( let i = 0, l = posAttr.count / 3; i < l; i ++ ) {

		// get the face normal for this vertex
		const i3 = 3 * i;
		const a = verts[ 0 ].fromBufferAttribute( posAttr, i3 + 0 );
		const b = verts[ 1 ].fromBufferAttribute( posAttr, i3 + 1 );
		const c = verts[ 2 ].fromBufferAttribute( posAttr, i3 + 2 );

		tempVec1.subVectors( c, b );
		tempVec2.subVectors( a, b );

		tempNorm.crossVectors( tempVec1, tempVec2 ).normalize();

		// average all normals that meet the threshold and set the normal value
		for ( let n = 0; n < 3; n ++ ) {

			const vert = verts[ n ];
			const hash = hashVertex( vert );
			const otherNormals = vertexMap[ hash ];
			tempNorm2.set( 0, 0, 0 );

			for ( let k = 0, lk = otherNormals.length; k < lk; k ++ ) {

				const otherNorm = otherNormals[ k ];
				if ( tempNorm.dot( otherNorm ) > creaseDot ) {

					tempNorm2.add( otherNorm );

				}

			}

			tempNorm2.normalize();
			normAttr.setXYZ( i3 + n, tempNorm2.x, tempNorm2.y, tempNorm2.z );

		}

	}

	resultGeometry.setAttribute( 'normal', normAttr );
	return resultGeometry;

}


return toTrianglesDrawMode;})();
const {
	AnimationClip,
	Bone,
	Box3,
	BufferAttribute,
	BufferGeometry,
	ClampToEdgeWrapping,
	Color,
	DirectionalLight,
	DoubleSide,
	FileLoader,
	FrontSide,
	Group,
	ImageBitmapLoader,
	InstancedMesh,
	InterleavedBuffer,
	InterleavedBufferAttribute,
	Interpolant,
	InterpolateDiscrete,
	InterpolateLinear,
	Line,
	LineBasicMaterial,
	LineLoop,
	LineSegments,
	LinearFilter,
	LinearMipmapLinearFilter,
	LinearMipmapNearestFilter,
	Loader,
	LoaderUtils,
	Material,
	MathUtils,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	MirroredRepeatWrapping,
	NearestFilter,
	NearestMipmapLinearFilter,
	NearestMipmapNearestFilter,
	NumberKeyframeTrack,
	Object3D,
	OrthographicCamera,
	PerspectiveCamera,
	PointLight,
	Points,
	PointsMaterial,
	PropertyBinding,
	Quaternion,
	QuaternionKeyframeTrack,
	RepeatWrapping,
	Skeleton,
	SkinnedMesh,
	Sphere,
	SpotLight,
	Texture,
	TextureLoader,
	TriangleFanDrawMode,
	TriangleStripDrawMode,
	Vector2,
	Vector3,
	VectorKeyframeTrack,
	sRGBEncoding
} = THREE;


class GLTFLoader extends Loader {

	constructor( manager ) {

		super( manager );

		this.dracoLoader = null;
		this.ktx2Loader = null;
		this.meshoptDecoder = null;

		this.pluginCallbacks = [];

		this.register( function ( parser ) {

			return new GLTFMaterialsClearcoatExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureBasisUExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureWebPExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsSheenExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsTransmissionExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsVolumeExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsIorExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsEmissiveStrengthExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsSpecularExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsIridescenceExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFLightsExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMeshoptCompression( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMeshGpuInstancing( parser );

		} );

	}

	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		let resourcePath;

		if ( this.resourcePath !== '' ) {

			resourcePath = this.resourcePath;

		} else if ( this.path !== '' ) {

			resourcePath = this.path;

		} else {

			resourcePath = LoaderUtils.extractUrlBase( url );

		}

		// Tells the LoadingManager to track an extra item, which resolves after
		// the model is fully loaded. This means the count of items loaded will
		// be incorrect, but ensures manager.onLoad() does not fire early.
		this.manager.itemStart( url );

		const _onError = function ( e ) {

			if ( onError ) {

				onError( e );

			} else {

				console.error( e );

			}

			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		};

		const loader = new FileLoader( this.manager );

		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );

		loader.load( url, function ( data ) {

			try {

				scope.parse( data, resourcePath, function ( gltf ) {

					onLoad( gltf );

					scope.manager.itemEnd( url );

				}, _onError );

			} catch ( e ) {

				_onError( e );

			}

		}, onProgress, _onError );

	}

	setDRACOLoader( dracoLoader ) {

		this.dracoLoader = dracoLoader;
		return this;

	}

	setDDSLoader() {

		throw new Error(

			'THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".'

		);

	}

	setKTX2Loader( ktx2Loader ) {

		this.ktx2Loader = ktx2Loader;
		return this;

	}

	setMeshoptDecoder( meshoptDecoder ) {

		this.meshoptDecoder = meshoptDecoder;
		return this;

	}

	register( callback ) {

		if ( this.pluginCallbacks.indexOf( callback ) === - 1 ) {

			this.pluginCallbacks.push( callback );

		}

		return this;

	}

	unregister( callback ) {

		if ( this.pluginCallbacks.indexOf( callback ) !== - 1 ) {

			this.pluginCallbacks.splice( this.pluginCallbacks.indexOf( callback ), 1 );

		}

		return this;

	}

	parse( data, path, onLoad, onError ) {

		let json;
		const extensions = {};
		const plugins = {};
		const textDecoder = new TextDecoder();

		if ( typeof data === 'string' ) {

			json = JSON.parse( data );

		} else if ( data instanceof ArrayBuffer ) {

			const magic = textDecoder.decode( new Uint8Array( data, 0, 4 ) );

			if ( magic === BINARY_EXTENSION_HEADER_MAGIC ) {

				try {

					extensions[ EXTENSIONS.KHR_BINARY_GLTF ] = new GLTFBinaryExtension( data );

				} catch ( error ) {

					if ( onError ) onError( error );
					return;

				}

				json = JSON.parse( extensions[ EXTENSIONS.KHR_BINARY_GLTF ].content );

			} else {

				json = JSON.parse( textDecoder.decode( data ) );

			}

		} else {

			json = data;

		}

		if ( json.asset === undefined || json.asset.version[ 0 ] < 2 ) {

			if ( onError ) onError( new Error( 'THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.' ) );
			return;

		}

		const parser = new GLTFParser( json, {

			path: path || this.resourcePath || '',
			crossOrigin: this.crossOrigin,
			requestHeader: this.requestHeader,
			manager: this.manager,
			ktx2Loader: this.ktx2Loader,
			meshoptDecoder: this.meshoptDecoder

		} );

		parser.fileLoader.setRequestHeader( this.requestHeader );

		for ( let i = 0; i < this.pluginCallbacks.length; i ++ ) {

			const plugin = this.pluginCallbacks[ i ]( parser );
			plugins[ plugin.name ] = plugin;

			// Workaround to avoid determining as unknown extension
			// in addUnknownExtensionsToUserData().
			// Remove this workaround if we move all the existing
			// extension handlers to plugin system
			extensions[ plugin.name ] = true;

		}

		if ( json.extensionsUsed ) {

			for ( let i = 0; i < json.extensionsUsed.length; ++ i ) {

				const extensionName = json.extensionsUsed[ i ];
				const extensionsRequired = json.extensionsRequired || [];

				switch ( extensionName ) {

					case EXTENSIONS.KHR_MATERIALS_UNLIT:
						extensions[ extensionName ] = new GLTFMaterialsUnlitExtension();
						break;

					case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
						extensions[ extensionName ] = new GLTFDracoMeshCompressionExtension( json, this.dracoLoader );
						break;

					case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
						extensions[ extensionName ] = new GLTFTextureTransformExtension();
						break;

					case EXTENSIONS.KHR_MESH_QUANTIZATION:
						extensions[ extensionName ] = new GLTFMeshQuantizationExtension();
						break;

					default:

						if ( extensionsRequired.indexOf( extensionName ) >= 0 && plugins[ extensionName ] === undefined ) {

							console.warn( 'THREE.GLTFLoader: Unknown extension "' + extensionName + '".' );

						}

				}

			}

		}

		parser.setExtensions( extensions );
		parser.setPlugins( plugins );
		parser.parse( onLoad, onError );

	}

	parseAsync( data, path ) {

		const scope = this;

		return new Promise( function ( resolve, reject ) {

			scope.parse( data, path, resolve, reject );

		} );

	}

}

/* GLTFREGISTRY */

function GLTFRegistry() {

	let objects = {};

	return	{

		get: function ( key ) {

			return objects[ key ];

		},

		add: function ( key, object ) {

			objects[ key ] = object;

		},

		remove: function ( key ) {

			delete objects[ key ];

		},

		removeAll: function () {

			objects = {};

		}

	};

}

/*********************************/
/********** EXTENSIONS ***********/
/*********************************/

const EXTENSIONS = {
	KHR_BINARY_GLTF: 'KHR_binary_glTF',
	KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
	KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
	KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
	KHR_MATERIALS_IOR: 'KHR_materials_ior',
	KHR_MATERIALS_SHEEN: 'KHR_materials_sheen',
	KHR_MATERIALS_SPECULAR: 'KHR_materials_specular',
	KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
	KHR_MATERIALS_IRIDESCENCE: 'KHR_materials_iridescence',
	KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
	KHR_MATERIALS_VOLUME: 'KHR_materials_volume',
	KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
	KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
	KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
	KHR_MATERIALS_EMISSIVE_STRENGTH: 'KHR_materials_emissive_strength',
	EXT_TEXTURE_WEBP: 'EXT_texture_webp',
	EXT_MESHOPT_COMPRESSION: 'EXT_meshopt_compression',
	EXT_MESH_GPU_INSTANCING: 'EXT_mesh_gpu_instancing'
};

/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */
class GLTFLightsExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;

		// Object3D instance caches
		this.cache = { refs: {}, uses: {} };

	}

	_markDefs() {

		const parser = this.parser;
		const nodeDefs = this.parser.json.nodes || [];

		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			const nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.extensions
					&& nodeDef.extensions[ this.name ]
					&& nodeDef.extensions[ this.name ].light !== undefined ) {

				parser._addNodeRef( this.cache, nodeDef.extensions[ this.name ].light );

			}

		}

	}

	_loadLight( lightIndex ) {

		const parser = this.parser;
		const cacheKey = 'light:' + lightIndex;
		let dependency = parser.cache.get( cacheKey );

		if ( dependency ) return dependency;

		const json = parser.json;
		const extensions = ( json.extensions && json.extensions[ this.name ] ) || {};
		const lightDefs = extensions.lights || [];
		const lightDef = lightDefs[ lightIndex ];
		let lightNode;

		const color = new Color( 0xffffff );

		if ( lightDef.color !== undefined ) color.fromArray( lightDef.color );

		const range = lightDef.range !== undefined ? lightDef.range : 0;

		switch ( lightDef.type ) {

			case 'directional':
				lightNode = new DirectionalLight( color );
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			case 'point':
				lightNode = new PointLight( color );
				lightNode.distance = range;
				break;

			case 'spot':
				lightNode = new SpotLight( color );
				lightNode.distance = range;
				// Handle spotlight properties.
				lightDef.spot = lightDef.spot || {};
				lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
				lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
				lightNode.angle = lightDef.spot.outerConeAngle;
				lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			default:
				throw new Error( 'THREE.GLTFLoader: Unexpected light type: ' + lightDef.type );

		}

		// Some lights (e.g. spot) default to a position other than the origin. Reset the position
		// here, because node-level parsing will only override position if explicitly specified.
		lightNode.position.set( 0, 0, 0 );

		lightNode.decay = 2;

		assignExtrasToUserData( lightNode, lightDef );

		if ( lightDef.intensity !== undefined ) lightNode.intensity = lightDef.intensity;

		lightNode.name = parser.createUniqueName( lightDef.name || ( 'light_' + lightIndex ) );

		dependency = Promise.resolve( lightNode );

		parser.cache.add( cacheKey, dependency );

		return dependency;

	}

	getDependency( type, index ) {

		if ( type !== 'light' ) return;

		return this._loadLight( index );

	}

	createNodeAttachment( nodeIndex ) {

		const self = this;
		const parser = this.parser;
		const json = parser.json;
		const nodeDef = json.nodes[ nodeIndex ];
		const lightDef = ( nodeDef.extensions && nodeDef.extensions[ this.name ] ) || {};
		const lightIndex = lightDef.light;

		if ( lightIndex === undefined ) return null;

		return this._loadLight( lightIndex ).then( function ( light ) {

			return parser._getNodeRef( self.cache, lightIndex, light );

		} );

	}

}

/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */
class GLTFMaterialsUnlitExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;

	}

	getMaterialType() {

		return MeshBasicMaterial;

	}

	extendParams( materialParams, materialDef, parser ) {

		const pending = [];

		materialParams.color = new Color( 1.0, 1.0, 1.0 );
		materialParams.opacity = 1.0;

		const metallicRoughness = materialDef.pbrMetallicRoughness;

		if ( metallicRoughness ) {

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				const array = metallicRoughness.baseColorFactor;

				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture, sRGBEncoding ) );

			}

		}

		return Promise.all( pending );

	}

}

/**
 * Materials Emissive Strength Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/blob/5768b3ce0ef32bc39cdf1bef10b948586635ead3/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md
 */
class GLTFMaterialsEmissiveStrengthExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_EMISSIVE_STRENGTH;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const emissiveStrength = materialDef.extensions[ this.name ].emissiveStrength;

		if ( emissiveStrength !== undefined ) {

			materialParams.emissiveIntensity = emissiveStrength;

		}

		return Promise.resolve();

	}

}

/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 */
class GLTFMaterialsClearcoatExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.clearcoatFactor !== undefined ) {

			materialParams.clearcoat = extension.clearcoatFactor;

		}

		if ( extension.clearcoatTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatMap', extension.clearcoatTexture ) );

		}

		if ( extension.clearcoatRoughnessFactor !== undefined ) {

			materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;

		}

		if ( extension.clearcoatRoughnessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatRoughnessMap', extension.clearcoatRoughnessTexture ) );

		}

		if ( extension.clearcoatNormalTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatNormalMap', extension.clearcoatNormalTexture ) );

			if ( extension.clearcoatNormalTexture.scale !== undefined ) {

				const scale = extension.clearcoatNormalTexture.scale;

				materialParams.clearcoatNormalScale = new Vector2( scale, scale );

			}

		}

		return Promise.all( pending );

	}

}

/**
 * Iridescence Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_iridescence
 */
class GLTFMaterialsIridescenceExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_IRIDESCENCE;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.iridescenceFactor !== undefined ) {

			materialParams.iridescence = extension.iridescenceFactor;

		}

		if ( extension.iridescenceTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'iridescenceMap', extension.iridescenceTexture ) );

		}

		if ( extension.iridescenceIor !== undefined ) {

			materialParams.iridescenceIOR = extension.iridescenceIor;

		}

		if ( materialParams.iridescenceThicknessRange === undefined ) {

			materialParams.iridescenceThicknessRange = [ 100, 400 ];

		}

		if ( extension.iridescenceThicknessMinimum !== undefined ) {

			materialParams.iridescenceThicknessRange[ 0 ] = extension.iridescenceThicknessMinimum;

		}

		if ( extension.iridescenceThicknessMaximum !== undefined ) {

			materialParams.iridescenceThicknessRange[ 1 ] = extension.iridescenceThicknessMaximum;

		}

		if ( extension.iridescenceThicknessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'iridescenceThicknessMap', extension.iridescenceThicknessTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Sheen Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 */
class GLTFMaterialsSheenExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_SHEEN;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		materialParams.sheenColor = new Color( 0, 0, 0 );
		materialParams.sheenRoughness = 0;
		materialParams.sheen = 1;

		const extension = materialDef.extensions[ this.name ];

		if ( extension.sheenColorFactor !== undefined ) {

			materialParams.sheenColor.fromArray( extension.sheenColorFactor );

		}

		if ( extension.sheenRoughnessFactor !== undefined ) {

			materialParams.sheenRoughness = extension.sheenRoughnessFactor;

		}

		if ( extension.sheenColorTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'sheenColorMap', extension.sheenColorTexture, sRGBEncoding ) );

		}

		if ( extension.sheenRoughnessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'sheenRoughnessMap', extension.sheenRoughnessTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 */
class GLTFMaterialsTransmissionExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.transmissionFactor !== undefined ) {

			materialParams.transmission = extension.transmissionFactor;

		}

		if ( extension.transmissionTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'transmissionMap', extension.transmissionTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 */
class GLTFMaterialsVolumeExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_VOLUME;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.thickness = extension.thicknessFactor !== undefined ? extension.thicknessFactor : 0;

		if ( extension.thicknessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'thicknessMap', extension.thicknessTexture ) );

		}

		materialParams.attenuationDistance = extension.attenuationDistance || Infinity;

		const colorArray = extension.attenuationColor || [ 1, 1, 1 ];
		materialParams.attenuationColor = new Color( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ] );

		return Promise.all( pending );

	}

}

/**
 * Materials ior Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_ior
 */
class GLTFMaterialsIorExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_IOR;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const extension = materialDef.extensions[ this.name ];

		materialParams.ior = extension.ior !== undefined ? extension.ior : 1.5;

		return Promise.resolve();

	}

}

/**
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */
class GLTFMaterialsSpecularExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_SPECULAR;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.specularIntensity = extension.specularFactor !== undefined ? extension.specularFactor : 1.0;

		if ( extension.specularTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'specularIntensityMap', extension.specularTexture ) );

		}

		const colorArray = extension.specularColorFactor || [ 1, 1, 1 ];
		materialParams.specularColor = new Color( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ] );

		if ( extension.specularColorTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'specularColorMap', extension.specularColorTexture, sRGBEncoding ) );

		}

		return Promise.all( pending );

	}

}

/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
class GLTFTextureBasisUExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_TEXTURE_BASISU;

	}

	loadTexture( textureIndex ) {

		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ this.name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ this.name ];
		const loader = parser.options.ktx2Loader;

		if ( ! loader ) {

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures' );

			} else {

				// Assumes that the extension is optional and that a fallback texture is present
				return null;

			}

		}

		return parser.loadTextureImage( textureIndex, extension.source, loader );

	}

}

/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
class GLTFTextureWebPExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.EXT_TEXTURE_WEBP;
		this.isSupported = null;

	}

	loadTexture( textureIndex ) {

		const name = this.name;
		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ name ];
		const source = json.images[ extension.source ];

		let loader = parser.textureLoader;
		if ( source.uri ) {

			const handler = parser.options.manager.getHandler( source.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.detectSupport().then( function ( isSupported ) {

			if ( isSupported ) return parser.loadTextureImage( textureIndex, extension.source, loader );

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: WebP required by asset but unsupported.' );

			}

			// Fall back to PNG or JPEG.
			return parser.loadTexture( textureIndex );

		} );

	}

	detectSupport() {

		if ( ! this.isSupported ) {

			this.isSupported = new Promise( function ( resolve ) {

				const image = new Image();

				// Lossy test image. Support for lossy images doesn't guarantee support for all
				// WebP images, unfortunately.
				image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

				image.onload = image.onerror = function () {

					resolve( image.height === 1 );

				};

			} );

		}

		return this.isSupported;

	}

}

/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */
class GLTFMeshoptCompression {

	constructor( parser ) {

		this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;
		this.parser = parser;

	}

	loadBufferView( index ) {

		const json = this.parser.json;
		const bufferView = json.bufferViews[ index ];

		if ( bufferView.extensions && bufferView.extensions[ this.name ] ) {

			const extensionDef = bufferView.extensions[ this.name ];

			const buffer = this.parser.getDependency( 'buffer', extensionDef.buffer );
			const decoder = this.parser.options.meshoptDecoder;

			if ( ! decoder || ! decoder.supported ) {

				if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

					throw new Error( 'THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files' );

				} else {

					// Assumes that the extension is optional and that fallback buffer data is present
					return null;

				}

			}

			return buffer.then( function ( res ) {

				const byteOffset = extensionDef.byteOffset || 0;
				const byteLength = extensionDef.byteLength || 0;

				const count = extensionDef.count;
				const stride = extensionDef.byteStride;

				const source = new Uint8Array( res, byteOffset, byteLength );

				if ( decoder.decodeGltfBufferAsync ) {

					return decoder.decodeGltfBufferAsync( count, stride, source, extensionDef.mode, extensionDef.filter ).then( function ( res ) {

						return res.buffer;

					} );

				} else {

					// Support for MeshoptDecoder 0.18 or earlier, without decodeGltfBufferAsync
					return decoder.ready.then( function () {

						const result = new ArrayBuffer( count * stride );
						decoder.decodeGltfBuffer( new Uint8Array( result ), count, stride, source, extensionDef.mode, extensionDef.filter );
						return result;

					} );

				}

			} );

		} else {

			return null;

		}

	}

}

/**
 * GPU Instancing Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_mesh_gpu_instancing
 *
 */
class GLTFMeshGpuInstancing {

	constructor( parser ) {

		this.name = EXTENSIONS.EXT_MESH_GPU_INSTANCING;
		this.parser = parser;

	}

	createNodeMesh( nodeIndex ) {

		const json = this.parser.json;
		const nodeDef = json.nodes[ nodeIndex ];

		if ( ! nodeDef.extensions || ! nodeDef.extensions[ this.name ] ||
			nodeDef.mesh === undefined ) {

			return null;

		}

		const meshDef = json.meshes[ nodeDef.mesh ];

		// No Points or Lines + Instancing support yet

		for ( const primitive of meshDef.primitives ) {

			if ( primitive.mode !== WEBGL_CONSTANTS.TRIANGLES &&
				 primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_STRIP &&
				 primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_FAN &&
				 primitive.mode !== undefined ) {

				return null;

			}

		}

		const extensionDef = nodeDef.extensions[ this.name ];
		const attributesDef = extensionDef.attributes;

		// @TODO: Can we support InstancedMesh + SkinnedMesh?

		const pending = [];
		const attributes = {};

		for ( const key in attributesDef ) {

			pending.push( this.parser.getDependency( 'accessor', attributesDef[ key ] ).then( accessor => {

				attributes[ key ] = accessor;
				return attributes[ key ];

			} ) );

		}

		if ( pending.length < 1 ) {

			return null;

		}

		pending.push( this.parser.createNodeMesh( nodeIndex ) );

		return Promise.all( pending ).then( results => {

			const nodeObject = results.pop();
			const meshes = nodeObject.isGroup ? nodeObject.children : [ nodeObject ];
			const count = results[ 0 ].count; // All attribute counts should be same
			const instancedMeshes = [];

			for ( const mesh of meshes ) {

				// Temporal variables
				const m = new Matrix4();
				const p = new Vector3();
				const q = new Quaternion();
				const s = new Vector3( 1, 1, 1 );

				const instancedMesh = new InstancedMesh( mesh.geometry, mesh.material, count );

				for ( let i = 0; i < count; i ++ ) {

					if ( attributes.TRANSLATION ) {

						p.fromBufferAttribute( attributes.TRANSLATION, i );

					}

					if ( attributes.ROTATION ) {

						q.fromBufferAttribute( attributes.ROTATION, i );

					}

					if ( attributes.SCALE ) {

						s.fromBufferAttribute( attributes.SCALE, i );

					}

					instancedMesh.setMatrixAt( i, m.compose( p, q, s ) );

				}

				// Add instance attributes to the geometry, excluding TRS.
				for ( const attributeName in attributes ) {

					if ( attributeName !== 'TRANSLATION' &&
						 attributeName !== 'ROTATION' &&
						 attributeName !== 'SCALE' ) {

						mesh.geometry.setAttribute( attributeName, attributes[ attributeName ] );

					}

				}

				// Just in case
				Object3D.prototype.copy.call( instancedMesh, mesh );

				// https://github.com/mrdoob/three.js/issues/18334
				instancedMesh.frustumCulled = false;
				this.parser.assignFinalMaterial( instancedMesh );

				instancedMeshes.push( instancedMesh );

			}

			if ( nodeObject.isGroup ) {

				nodeObject.clear();

				nodeObject.add( ... instancedMeshes );

				return nodeObject;

			}

			return instancedMeshes[ 0 ];

		} );

	}

}

/* BINARY EXTENSION */
const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

class GLTFBinaryExtension {

	constructor( data ) {

		this.name = EXTENSIONS.KHR_BINARY_GLTF;
		this.content = null;
		this.body = null;

		const headerView = new DataView( data, 0, BINARY_EXTENSION_HEADER_LENGTH );
		const textDecoder = new TextDecoder();

		this.header = {
			magic: textDecoder.decode( new Uint8Array( data.slice( 0, 4 ) ) ),
			version: headerView.getUint32( 4, true ),
			length: headerView.getUint32( 8, true )
		};

		if ( this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC ) {

			throw new Error( 'THREE.GLTFLoader: Unsupported glTF-Binary header.' );

		} else if ( this.header.version < 2.0 ) {

			throw new Error( 'THREE.GLTFLoader: Legacy binary file detected.' );

		}

		const chunkContentsLength = this.header.length - BINARY_EXTENSION_HEADER_LENGTH;
		const chunkView = new DataView( data, BINARY_EXTENSION_HEADER_LENGTH );
		let chunkIndex = 0;

		while ( chunkIndex < chunkContentsLength ) {

			const chunkLength = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			const chunkType = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON ) {

				const contentArray = new Uint8Array( data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength );
				this.content = textDecoder.decode( contentArray );

			} else if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN ) {

				const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
				this.body = data.slice( byteOffset, byteOffset + chunkLength );

			}

			// Clients must ignore chunks with unknown types.

			chunkIndex += chunkLength;

		}

		if ( this.content === null ) {

			throw new Error( 'THREE.GLTFLoader: JSON content not found.' );

		}

	}

}

/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
class GLTFDracoMeshCompressionExtension {

	constructor( json, dracoLoader ) {

		if ( ! dracoLoader ) {

			throw new Error( 'THREE.GLTFLoader: No DRACOLoader instance provided.' );

		}

		this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
		this.json = json;
		this.dracoLoader = dracoLoader;
		this.dracoLoader.preload();

	}

	decodePrimitive( primitive, parser ) {

		const json = this.json;
		const dracoLoader = this.dracoLoader;
		const bufferViewIndex = primitive.extensions[ this.name ].bufferView;
		const gltfAttributeMap = primitive.extensions[ this.name ].attributes;
		const threeAttributeMap = {};
		const attributeNormalizedMap = {};
		const attributeTypeMap = {};

		for ( const attributeName in gltfAttributeMap ) {

			const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

			threeAttributeMap[ threeAttributeName ] = gltfAttributeMap[ attributeName ];

		}

		for ( const attributeName in primitive.attributes ) {

			const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

			if ( gltfAttributeMap[ attributeName ] !== undefined ) {

				const accessorDef = json.accessors[ primitive.attributes[ attributeName ] ];
				const componentType = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

				attributeTypeMap[ threeAttributeName ] = componentType.name;
				attributeNormalizedMap[ threeAttributeName ] = accessorDef.normalized === true;

			}

		}

		return parser.getDependency( 'bufferView', bufferViewIndex ).then( function ( bufferView ) {

			return new Promise( function ( resolve ) {

				dracoLoader.decodeDracoFile( bufferView, function ( geometry ) {

					for ( const attributeName in geometry.attributes ) {

						const attribute = geometry.attributes[ attributeName ];
						const normalized = attributeNormalizedMap[ attributeName ];

						if ( normalized !== undefined ) attribute.normalized = normalized;

					}

					resolve( geometry );

				}, threeAttributeMap, attributeTypeMap );

			} );

		} );

	}

}

/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 */
class GLTFTextureTransformExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

	}

	extendTexture( texture, transform ) {

		if ( transform.texCoord !== undefined ) {

			console.warn( 'THREE.GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.' );

		}

		if ( transform.offset === undefined && transform.rotation === undefined && transform.scale === undefined ) {

			// See https://github.com/mrdoob/three.js/issues/21819.
			return texture;

		}

		texture = texture.clone();

		if ( transform.offset !== undefined ) {

			texture.offset.fromArray( transform.offset );

		}

		if ( transform.rotation !== undefined ) {

			texture.rotation = transform.rotation;

		}

		if ( transform.scale !== undefined ) {

			texture.repeat.fromArray( transform.scale );

		}

		texture.needsUpdate = true;

		return texture;

	}

}

/**
 * Mesh Quantization Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization
 */
class GLTFMeshQuantizationExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;

	}

}

/*********************************/
/********** INTERPOLATION ********/
/*********************************/

// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
class GLTFCubicSplineInterpolant extends Interpolant {

	constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		super( parameterPositions, sampleValues, sampleSize, resultBuffer );

	}

	copySampleValue_( index ) {

		// Copies a sample value to the result buffer. See description of glTF
		// CUBICSPLINE values layout in interpolate_() function below.

		const result = this.resultBuffer,
			values = this.sampleValues,
			valueSize = this.valueSize,
			offset = index * valueSize * 3 + valueSize;

		for ( let i = 0; i !== valueSize; i ++ ) {

			result[ i ] = values[ offset + i ];

		}

		return result;

	}

	interpolate_( i1, t0, t, t1 ) {

		const result = this.resultBuffer;
		const values = this.sampleValues;
		const stride = this.valueSize;

		const stride2 = stride * 2;
		const stride3 = stride * 3;

		const td = t1 - t0;

		const p = ( t - t0 ) / td;
		const pp = p * p;
		const ppp = pp * p;

		const offset1 = i1 * stride3;
		const offset0 = offset1 - stride3;

		const s2 = - 2 * ppp + 3 * pp;
		const s3 = ppp - pp;
		const s0 = 1 - s2;
		const s1 = s3 - pp + p;

		// Layout of keyframe output values for CUBICSPLINE animations:
		//   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
		for ( let i = 0; i !== stride; i ++ ) {

			const p0 = values[ offset0 + i + stride ]; // splineVertex_k
			const m0 = values[ offset0 + i + stride2 ] * td; // outTangent_k * (t_k+1 - t_k)
			const p1 = values[ offset1 + i + stride ]; // splineVertex_k+1
			const m1 = values[ offset1 + i ] * td; // inTangent_k+1 * (t_k+1 - t_k)

			result[ i ] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;

		}

		return result;

	}

}

const _q = new Quaternion();

class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {

	interpolate_( i1, t0, t, t1 ) {

		const result = super.interpolate_( i1, t0, t, t1 );

		_q.fromArray( result ).normalize().toArray( result );

		return result;

	}

}


/*********************************/
/********** INTERNALS ************/
/*********************************/

/* CONSTANTS */

const WEBGL_CONSTANTS = {
	FLOAT: 5126,
	//FLOAT_MAT2: 35674,
	FLOAT_MAT3: 35675,
	FLOAT_MAT4: 35676,
	FLOAT_VEC2: 35664,
	FLOAT_VEC3: 35665,
	FLOAT_VEC4: 35666,
	LINEAR: 9729,
	REPEAT: 10497,
	SAMPLER_2D: 35678,
	POINTS: 0,
	LINES: 1,
	LINE_LOOP: 2,
	LINE_STRIP: 3,
	TRIANGLES: 4,
	TRIANGLE_STRIP: 5,
	TRIANGLE_FAN: 6,
	UNSIGNED_BYTE: 5121,
	UNSIGNED_SHORT: 5123
};

const WEBGL_COMPONENT_TYPES = {
	5120: Int8Array,
	5121: Uint8Array,
	5122: Int16Array,
	5123: Uint16Array,
	5125: Uint32Array,
	5126: Float32Array
};

const WEBGL_FILTERS = {
	9728: NearestFilter,
	9729: LinearFilter,
	9984: NearestMipmapNearestFilter,
	9985: LinearMipmapNearestFilter,
	9986: NearestMipmapLinearFilter,
	9987: LinearMipmapLinearFilter
};

const WEBGL_WRAPPINGS = {
	33071: ClampToEdgeWrapping,
	33648: MirroredRepeatWrapping,
	10497: RepeatWrapping
};

const WEBGL_TYPE_SIZES = {
	'SCALAR': 1,
	'VEC2': 2,
	'VEC3': 3,
	'VEC4': 4,
	'MAT2': 4,
	'MAT3': 9,
	'MAT4': 16
};

const ATTRIBUTES = {
	POSITION: 'position',
	NORMAL: 'normal',
	TANGENT: 'tangent',
	TEXCOORD_0: 'uv',
	TEXCOORD_1: 'uv2',
	COLOR_0: 'color',
	WEIGHTS_0: 'skinWeight',
	JOINTS_0: 'skinIndex',
};

const PATH_PROPERTIES = {
	scale: 'scale',
	translation: 'position',
	rotation: 'quaternion',
	weights: 'morphTargetInfluences'
};

const INTERPOLATION = {
	CUBICSPLINE: undefined, // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
		                        // keyframe track will be initialized with a default interpolation type, then modified.
	LINEAR: InterpolateLinear,
	STEP: InterpolateDiscrete
};

const ALPHA_MODES = {
	OPAQUE: 'OPAQUE',
	MASK: 'MASK',
	BLEND: 'BLEND'
};

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 */
function createDefaultMaterial( cache ) {

	if ( cache[ 'DefaultMaterial' ] === undefined ) {

		cache[ 'DefaultMaterial' ] = new MeshStandardMaterial( {
			color: 0xFFFFFF,
			emissive: 0x000000,
			metalness: 1,
			roughness: 1,
			transparent: false,
			depthTest: true,
			side: FrontSide
		} );

	}

	return cache[ 'DefaultMaterial' ];

}

function addUnknownExtensionsToUserData( knownExtensions, object, objectDef ) {

	// Add unknown glTF extensions to an object's userData.

	for ( const name in objectDef.extensions ) {

		if ( knownExtensions[ name ] === undefined ) {

			object.userData.gltfExtensions = object.userData.gltfExtensions || {};
			object.userData.gltfExtensions[ name ] = objectDef.extensions[ name ];

		}

	}

}

/**
 * @param {Object3D|Material|BufferGeometry} object
 * @param {GLTF.definition} gltfDef
 */
function assignExtrasToUserData( object, gltfDef ) {

	if ( gltfDef.extras !== undefined ) {

		if ( typeof gltfDef.extras === 'object' ) {

			Object.assign( object.userData, gltfDef.extras );

		} else {

			console.warn( 'THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras );

		}

	}

}

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
 *
 * @param {BufferGeometry} geometry
 * @param {Array<GLTF.Target>} targets
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */
function addMorphTargets( geometry, targets, parser ) {

	let hasMorphPosition = false;
	let hasMorphNormal = false;
	let hasMorphColor = false;

	for ( let i = 0, il = targets.length; i < il; i ++ ) {

		const target = targets[ i ];

		if ( target.POSITION !== undefined ) hasMorphPosition = true;
		if ( target.NORMAL !== undefined ) hasMorphNormal = true;
		if ( target.COLOR_0 !== undefined ) hasMorphColor = true;

		if ( hasMorphPosition && hasMorphNormal && hasMorphColor ) break;

	}

	if ( ! hasMorphPosition && ! hasMorphNormal && ! hasMorphColor ) return Promise.resolve( geometry );

	const pendingPositionAccessors = [];
	const pendingNormalAccessors = [];
	const pendingColorAccessors = [];

	for ( let i = 0, il = targets.length; i < il; i ++ ) {

		const target = targets[ i ];

		if ( hasMorphPosition ) {

			const pendingAccessor = target.POSITION !== undefined
				? parser.getDependency( 'accessor', target.POSITION )
				: geometry.attributes.position;

			pendingPositionAccessors.push( pendingAccessor );

		}

		if ( hasMorphNormal ) {

			const pendingAccessor = target.NORMAL !== undefined
				? parser.getDependency( 'accessor', target.NORMAL )
				: geometry.attributes.normal;

			pendingNormalAccessors.push( pendingAccessor );

		}

		if ( hasMorphColor ) {

			const pendingAccessor = target.COLOR_0 !== undefined
				? parser.getDependency( 'accessor', target.COLOR_0 )
				: geometry.attributes.color;

			pendingColorAccessors.push( pendingAccessor );

		}

	}

	return Promise.all( [
		Promise.all( pendingPositionAccessors ),
		Promise.all( pendingNormalAccessors ),
		Promise.all( pendingColorAccessors )
	] ).then( function ( accessors ) {

		const morphPositions = accessors[ 0 ];
		const morphNormals = accessors[ 1 ];
		const morphColors = accessors[ 2 ];

		if ( hasMorphPosition ) geometry.morphAttributes.position = morphPositions;
		if ( hasMorphNormal ) geometry.morphAttributes.normal = morphNormals;
		if ( hasMorphColor ) geometry.morphAttributes.color = morphColors;
		geometry.morphTargetsRelative = true;

		return geometry;

	} );

}

/**
 * @param {Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */
function updateMorphTargets( mesh, meshDef ) {

	mesh.updateMorphTargets();

	if ( meshDef.weights !== undefined ) {

		for ( let i = 0, il = meshDef.weights.length; i < il; i ++ ) {

			mesh.morphTargetInfluences[ i ] = meshDef.weights[ i ];

		}

	}

	// .extras has user-defined data, so check that .extras.targetNames is an array.
	if ( meshDef.extras && Array.isArray( meshDef.extras.targetNames ) ) {

		const targetNames = meshDef.extras.targetNames;

		if ( mesh.morphTargetInfluences.length === targetNames.length ) {

			mesh.morphTargetDictionary = {};

			for ( let i = 0, il = targetNames.length; i < il; i ++ ) {

				mesh.morphTargetDictionary[ targetNames[ i ] ] = i;

			}

		} else {

			console.warn( 'THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.' );

		}

	}

}

function createPrimitiveKey( primitiveDef ) {

	const dracoExtension = primitiveDef.extensions && primitiveDef.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ];
	let geometryKey;

	if ( dracoExtension ) {

		geometryKey = 'draco:' + dracoExtension.bufferView
				+ ':' + dracoExtension.indices
				+ ':' + createAttributesKey( dracoExtension.attributes );

	} else {

		geometryKey = primitiveDef.indices + ':' + createAttributesKey( primitiveDef.attributes ) + ':' + primitiveDef.mode;

	}

	return geometryKey;

}

function createAttributesKey( attributes ) {

	let attributesKey = '';

	const keys = Object.keys( attributes ).sort();

	for ( let i = 0, il = keys.length; i < il; i ++ ) {

		attributesKey += keys[ i ] + ':' + attributes[ keys[ i ] ] + ';';

	}

	return attributesKey;

}

function getNormalizedComponentScale( constructor ) {

	// Reference:
	// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data

	switch ( constructor ) {

		case Int8Array:
			return 1 / 127;

		case Uint8Array:
			return 1 / 255;

		case Int16Array:
			return 1 / 32767;

		case Uint16Array:
			return 1 / 65535;

		default:
			throw new Error( 'THREE.GLTFLoader: Unsupported normalized accessor component type.' );

	}

}

function getImageURIMimeType( uri ) {

	if ( uri.search( /\.jpe?g($|\?)/i ) > 0 || uri.search( /^data\:image\/jpeg/ ) === 0 ) return 'image/jpeg';
	if ( uri.search( /\.webp($|\?)/i ) > 0 || uri.search( /^data\:image\/webp/ ) === 0 ) return 'image/webp';

	return 'image/png';

}

const _identityMatrix = new Matrix4();

/* GLTF PARSER */

class GLTFParser {

	constructor( json = {}, options = {} ) {

		this.json = json;
		this.extensions = {};
		this.plugins = {};
		this.options = options;

		// loader object cache
		this.cache = new GLTFRegistry();

		// associations between Three.js objects and glTF elements
		this.associations = new Map();

		// BufferGeometry caching
		this.primitiveCache = {};

		// Object3D instance caches
		this.meshCache = { refs: {}, uses: {} };
		this.cameraCache = { refs: {}, uses: {} };
		this.lightCache = { refs: {}, uses: {} };

		this.sourceCache = {};
		this.textureCache = {};

		// Track node names, to ensure no duplicates
		this.nodeNamesUsed = {};

		// Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
		// expensive work of uploading a texture to the GPU off the main thread.

		let isSafari = false;
		let isFirefox = false;
		let firefoxVersion = - 1;

		if ( typeof navigator !== 'undefined' ) {

			isSafari = /^((?!chrome|android).)*safari/i.test( navigator.userAgent ) === true;
			isFirefox = navigator.userAgent.indexOf( 'Firefox' ) > - 1;
			firefoxVersion = isFirefox ? navigator.userAgent.match( /Firefox\/([0-9]+)\./ )[ 1 ] : - 1;

		}

		if ( typeof createImageBitmap === 'undefined' || isSafari || ( isFirefox && firefoxVersion < 98 ) ) {

			this.textureLoader = new TextureLoader( this.options.manager );

		} else {

			this.textureLoader = new ImageBitmapLoader( this.options.manager );

		}

		this.textureLoader.setCrossOrigin( this.options.crossOrigin );
		this.textureLoader.setRequestHeader( this.options.requestHeader );

		this.fileLoader = new FileLoader( this.options.manager );
		this.fileLoader.setResponseType( 'arraybuffer' );

		if ( this.options.crossOrigin === 'use-credentials' ) {

			this.fileLoader.setWithCredentials( true );

		}

	}

	setExtensions( extensions ) {

		this.extensions = extensions;

	}

	setPlugins( plugins ) {

		this.plugins = plugins;

	}

	parse( onLoad, onError ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;

		// Clear the loader cache
		this.cache.removeAll();

		// Mark the special nodes/meshes in json for efficient parse
		this._invokeAll( function ( ext ) {

			return ext._markDefs && ext._markDefs();

		} );

		Promise.all( this._invokeAll( function ( ext ) {

			return ext.beforeRoot && ext.beforeRoot();

		} ) ).then( function () {

			return Promise.all( [

				parser.getDependencies( 'scene' ),
				parser.getDependencies( 'animation' ),
				parser.getDependencies( 'camera' ),

			] );

		} ).then( function ( dependencies ) {

			const result = {
				scene: dependencies[ 0 ][ json.scene || 0 ],
				scenes: dependencies[ 0 ],
				animations: dependencies[ 1 ],
				cameras: dependencies[ 2 ],
				asset: json.asset,
				parser: parser,
				userData: {}
			};

			addUnknownExtensionsToUserData( extensions, result, json );

			assignExtrasToUserData( result, json );

			Promise.all( parser._invokeAll( function ( ext ) {

				return ext.afterRoot && ext.afterRoot( result );

			} ) ).then( function () {

				onLoad( result );

			} );

		} ).catch( onError );

	}

	/**
	 * Marks the special nodes/meshes in json for efficient parse.
	 */
	_markDefs() {

		const nodeDefs = this.json.nodes || [];
		const skinDefs = this.json.skins || [];
		const meshDefs = this.json.meshes || [];

		// Nothing in the node definition indicates whether it is a Bone or an
		// Object3D. Use the skins' joint references to mark bones.
		for ( let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex ++ ) {

			const joints = skinDefs[ skinIndex ].joints;

			for ( let i = 0, il = joints.length; i < il; i ++ ) {

				nodeDefs[ joints[ i ] ].isBone = true;

			}

		}

		// Iterate over all nodes, marking references to shared resources,
		// as well as skeleton joints.
		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			const nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.mesh !== undefined ) {

				this._addNodeRef( this.meshCache, nodeDef.mesh );

				// Nothing in the mesh definition indicates whether it is
				// a SkinnedMesh or Mesh. Use the node's mesh reference
				// to mark SkinnedMesh if node has skin.
				if ( nodeDef.skin !== undefined ) {

					meshDefs[ nodeDef.mesh ].isSkinnedMesh = true;

				}

			}

			if ( nodeDef.camera !== undefined ) {

				this._addNodeRef( this.cameraCache, nodeDef.camera );

			}

		}

	}

	/**
	 * Counts references to shared node / Object3D resources. These resources
	 * can be reused, or "instantiated", at multiple nodes in the scene
	 * hierarchy. Mesh, Camera, and Light instances are instantiated and must
	 * be marked. Non-scenegraph resources (like Materials, Geometries, and
	 * Textures) can be reused directly and are not marked here.
	 *
	 * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
	 */
	_addNodeRef( cache, index ) {

		if ( index === undefined ) return;

		if ( cache.refs[ index ] === undefined ) {

			cache.refs[ index ] = cache.uses[ index ] = 0;

		}

		cache.refs[ index ] ++;

	}

	/** Returns a reference to a shared resource, cloning it if necessary. */
	_getNodeRef( cache, index, object ) {

		if ( cache.refs[ index ] <= 1 ) return object;

		const ref = object.clone();

		// Propagates mappings to the cloned object, prevents mappings on the
		// original object from being lost.
		const updateMappings = ( original, clone ) => {

			const mappings = this.associations.get( original );
			if ( mappings != null ) {

				this.associations.set( clone, mappings );

			}

			for ( const [ i, child ] of original.children.entries() ) {

				updateMappings( child, clone.children[ i ] );

			}

		};

		updateMappings( object, ref );

		ref.name += '_instance_' + ( cache.uses[ index ] ++ );

		return ref;

	}

	_invokeOne( func ) {

		const extensions = Object.values( this.plugins );
		extensions.push( this );

		for ( let i = 0; i < extensions.length; i ++ ) {

			const result = func( extensions[ i ] );

			if ( result ) return result;

		}

		return null;

	}

	_invokeAll( func ) {

		const extensions = Object.values( this.plugins );
		extensions.unshift( this );

		const pending = [];

		for ( let i = 0; i < extensions.length; i ++ ) {

			const result = func( extensions[ i ] );

			if ( result ) pending.push( result );

		}

		return pending;

	}

	/**
	 * Requests the specified dependency asynchronously, with caching.
	 * @param {string} type
	 * @param {number} index
	 * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
	 */
	getDependency( type, index ) {

		const cacheKey = type + ':' + index;
		let dependency = this.cache.get( cacheKey );

		if ( ! dependency ) {

			switch ( type ) {

				case 'scene':
					dependency = this.loadScene( index );
					break;

				case 'node':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadNode && ext.loadNode( index );

					} );
					break;

				case 'mesh':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadMesh && ext.loadMesh( index );

					} );
					break;

				case 'accessor':
					dependency = this.loadAccessor( index );
					break;

				case 'bufferView':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadBufferView && ext.loadBufferView( index );

					} );
					break;

				case 'buffer':
					dependency = this.loadBuffer( index );
					break;

				case 'material':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadMaterial && ext.loadMaterial( index );

					} );
					break;

				case 'texture':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadTexture && ext.loadTexture( index );

					} );
					break;

				case 'skin':
					dependency = this.loadSkin( index );
					break;

				case 'animation':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadAnimation && ext.loadAnimation( index );

					} );
					break;

				case 'camera':
					dependency = this.loadCamera( index );
					break;

				default:
					dependency = this._invokeOne( function ( ext ) {

						return ext != this && ext.getDependency && ext.getDependency( type, index );

					} );

					if ( ! dependency ) {

						throw new Error( 'Unknown type: ' + type );

					}

					break;

			}

			this.cache.add( cacheKey, dependency );

		}

		return dependency;

	}

	/**
	 * Requests all dependencies of the specified type asynchronously, with caching.
	 * @param {string} type
	 * @return {Promise<Array<Object>>}
	 */
	getDependencies( type ) {

		let dependencies = this.cache.get( type );

		if ( ! dependencies ) {

			const parser = this;
			const defs = this.json[ type + ( type === 'mesh' ? 'es' : 's' ) ] || [];

			dependencies = Promise.all( defs.map( function ( def, index ) {

				return parser.getDependency( type, index );

			} ) );

			this.cache.add( type, dependencies );

		}

		return dependencies;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	loadBuffer( bufferIndex ) {

		const bufferDef = this.json.buffers[ bufferIndex ];
		const loader = this.fileLoader;

		if ( bufferDef.type && bufferDef.type !== 'arraybuffer' ) {

			throw new Error( 'THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.' );

		}

		// If present, GLB container is required to be the first buffer.
		if ( bufferDef.uri === undefined && bufferIndex === 0 ) {

			return Promise.resolve( this.extensions[ EXTENSIONS.KHR_BINARY_GLTF ].body );

		}

		const options = this.options;

		return new Promise( function ( resolve, reject ) {

			loader.load( LoaderUtils.resolveURL( bufferDef.uri, options.path ), resolve, undefined, function () {

				reject( new Error( 'THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".' ) );

			} );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferViewIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	loadBufferView( bufferViewIndex ) {

		const bufferViewDef = this.json.bufferViews[ bufferViewIndex ];

		return this.getDependency( 'buffer', bufferViewDef.buffer ).then( function ( buffer ) {

			const byteLength = bufferViewDef.byteLength || 0;
			const byteOffset = bufferViewDef.byteOffset || 0;
			return buffer.slice( byteOffset, byteOffset + byteLength );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
	 * @param {number} accessorIndex
	 * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
	 */
	loadAccessor( accessorIndex ) {

		const parser = this;
		const json = this.json;

		const accessorDef = this.json.accessors[ accessorIndex ];

		if ( accessorDef.bufferView === undefined && accessorDef.sparse === undefined ) {

			const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];
			const normalized = accessorDef.normalized === true;

			const array = new TypedArray( accessorDef.count * itemSize );
			return Promise.resolve( new BufferAttribute( array, itemSize, normalized ) );

		}

		const pendingBufferViews = [];

		if ( accessorDef.bufferView !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.bufferView ) );

		} else {

			pendingBufferViews.push( null );

		}

		if ( accessorDef.sparse !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.indices.bufferView ) );
			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.values.bufferView ) );

		}

		return Promise.all( pendingBufferViews ).then( function ( bufferViews ) {

			const bufferView = bufferViews[ 0 ];

			const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

			// For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
			const elementBytes = TypedArray.BYTES_PER_ELEMENT;
			const itemBytes = elementBytes * itemSize;
			const byteOffset = accessorDef.byteOffset || 0;
			const byteStride = accessorDef.bufferView !== undefined ? json.bufferViews[ accessorDef.bufferView ].byteStride : undefined;
			const normalized = accessorDef.normalized === true;
			let array, bufferAttribute;

			// The buffer is not interleaved if the stride is the item size in bytes.
			if ( byteStride && byteStride !== itemBytes ) {

				// Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
				// This makes sure that IBA.count reflects accessor.count properly
				const ibSlice = Math.floor( byteOffset / byteStride );
				const ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType + ':' + ibSlice + ':' + accessorDef.count;
				let ib = parser.cache.get( ibCacheKey );

				if ( ! ib ) {

					array = new TypedArray( bufferView, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes );

					// Integer parameters to IB/IBA are in array elements, not bytes.
					ib = new InterleavedBuffer( array, byteStride / elementBytes );

					parser.cache.add( ibCacheKey, ib );

				}

				bufferAttribute = new InterleavedBufferAttribute( ib, itemSize, ( byteOffset % byteStride ) / elementBytes, normalized );

			} else {

				if ( bufferView === null ) {

					array = new TypedArray( accessorDef.count * itemSize );

				} else {

					array = new TypedArray( bufferView, byteOffset, accessorDef.count * itemSize );

				}

				bufferAttribute = new BufferAttribute( array, itemSize, normalized );

			}

			// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
			if ( accessorDef.sparse !== undefined ) {

				const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
				const TypedArrayIndices = WEBGL_COMPONENT_TYPES[ accessorDef.sparse.indices.componentType ];

				const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
				const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

				const sparseIndices = new TypedArrayIndices( bufferViews[ 1 ], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices );
				const sparseValues = new TypedArray( bufferViews[ 2 ], byteOffsetValues, accessorDef.sparse.count * itemSize );

				if ( bufferView !== null ) {

					// Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
					bufferAttribute = new BufferAttribute( bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized );

				}

				for ( let i = 0, il = sparseIndices.length; i < il; i ++ ) {

					const index = sparseIndices[ i ];

					bufferAttribute.setX( index, sparseValues[ i * itemSize ] );
					if ( itemSize >= 2 ) bufferAttribute.setY( index, sparseValues[ i * itemSize + 1 ] );
					if ( itemSize >= 3 ) bufferAttribute.setZ( index, sparseValues[ i * itemSize + 2 ] );
					if ( itemSize >= 4 ) bufferAttribute.setW( index, sparseValues[ i * itemSize + 3 ] );
					if ( itemSize >= 5 ) throw new Error( 'THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.' );

				}

			}

			return bufferAttribute;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
	 * @param {number} textureIndex
	 * @return {Promise<THREE.Texture|null>}
	 */
	loadTexture( textureIndex ) {

		const json = this.json;
		const options = this.options;
		const textureDef = json.textures[ textureIndex ];
		const sourceIndex = textureDef.source;
		const sourceDef = json.images[ sourceIndex ];

		let loader = this.textureLoader;

		if ( sourceDef.uri ) {

			const handler = options.manager.getHandler( sourceDef.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.loadTextureImage( textureIndex, sourceIndex, loader );

	}

	loadTextureImage( textureIndex, sourceIndex, loader ) {

		const parser = this;
		const json = this.json;

		const textureDef = json.textures[ textureIndex ];
		const sourceDef = json.images[ sourceIndex ];

		const cacheKey = ( sourceDef.uri || sourceDef.bufferView ) + ':' + textureDef.sampler;

		if ( this.textureCache[ cacheKey ] ) {

			// See https://github.com/mrdoob/three.js/issues/21559.
			return this.textureCache[ cacheKey ];

		}

		const promise = this.loadImageSource( sourceIndex, loader ).then( function ( texture ) {

			texture.flipY = false;

			texture.name = textureDef.name || sourceDef.name || '';

			const samplers = json.samplers || {};
			const sampler = samplers[ textureDef.sampler ] || {};

			texture.magFilter = WEBGL_FILTERS[ sampler.magFilter ] || LinearFilter;
			texture.minFilter = WEBGL_FILTERS[ sampler.minFilter ] || LinearMipmapLinearFilter;
			texture.wrapS = WEBGL_WRAPPINGS[ sampler.wrapS ] || RepeatWrapping;
			texture.wrapT = WEBGL_WRAPPINGS[ sampler.wrapT ] || RepeatWrapping;

			parser.associations.set( texture, { textures: textureIndex } );

			return texture;

		} ).catch( function () {

			return null;

		} );

		this.textureCache[ cacheKey ] = promise;

		return promise;

	}

	loadImageSource( sourceIndex, loader ) {

		const parser = this;
		const json = this.json;
		const options = this.options;

		if ( this.sourceCache[ sourceIndex ] !== undefined ) {

			return this.sourceCache[ sourceIndex ].then( ( texture ) => texture.clone() );

		}

		const sourceDef = json.images[ sourceIndex ];

		const URL = self.URL || self.webkitURL;

		let sourceURI = sourceDef.uri || '';
		let isObjectURL = false;

		if ( sourceDef.bufferView !== undefined ) {

			// Load binary image data from bufferView, if provided.

			sourceURI = parser.getDependency( 'bufferView', sourceDef.bufferView ).then( function ( bufferView ) {

				isObjectURL = true;
				const blob = new Blob( [ bufferView ], { type: sourceDef.mimeType } );
				sourceURI = URL.createObjectURL( blob );
				return sourceURI;

			} );

		} else if ( sourceDef.uri === undefined ) {

			throw new Error( 'THREE.GLTFLoader: Image ' + sourceIndex + ' is missing URI and bufferView' );

		}

		const promise = Promise.resolve( sourceURI ).then( function ( sourceURI ) {

			return new Promise( function ( resolve, reject ) {

				let onLoad = resolve;

				if ( loader.isImageBitmapLoader === true ) {

					onLoad = function ( imageBitmap ) {

						const texture = new Texture( imageBitmap );
						texture.needsUpdate = true;

						resolve( texture );

					};

				}

				loader.load( LoaderUtils.resolveURL( sourceURI, options.path ), onLoad, undefined, reject );

			} );

		} ).then( function ( texture ) {

			// Clean up resources and configure Texture.

			if ( isObjectURL === true ) {

				URL.revokeObjectURL( sourceURI );

			}

			texture.userData.mimeType = sourceDef.mimeType || getImageURIMimeType( sourceDef.uri );

			return texture;

		} ).catch( function ( error ) {

			console.error( 'THREE.GLTFLoader: Couldn\'t load texture', sourceURI );
			throw error;

		} );

		this.sourceCache[ sourceIndex ] = promise;
		return promise;

	}

	/**
	 * Asynchronously assigns a texture to the given material parameters.
	 * @param {Object} materialParams
	 * @param {string} mapName
	 * @param {Object} mapDef
	 * @return {Promise<Texture>}
	 */
	assignTexture( materialParams, mapName, mapDef, encoding ) {

		const parser = this;

		return this.getDependency( 'texture', mapDef.index ).then( function ( texture ) {

			if ( ! texture ) return null;

			// Materials sample aoMap from UV set 1 and other maps from UV set 0 - this can't be configured
			// However, we will copy UV set 0 to UV set 1 on demand for aoMap
			if ( mapDef.texCoord !== undefined && mapDef.texCoord != 0 && ! ( mapName === 'aoMap' && mapDef.texCoord == 1 ) ) {

				console.warn( 'THREE.GLTFLoader: Custom UV set ' + mapDef.texCoord + ' for texture ' + mapName + ' not yet supported.' );

			}

			if ( parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] ) {

				const transform = mapDef.extensions !== undefined ? mapDef.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] : undefined;

				if ( transform ) {

					const gltfReference = parser.associations.get( texture );
					texture = parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ].extendTexture( texture, transform );
					parser.associations.set( texture, gltfReference );

				}

			}

			if ( encoding !== undefined ) {

				texture.encoding = encoding;

			}

			materialParams[ mapName ] = texture;

			return texture;

		} );

	}

	/**
	 * Assigns final material to a Mesh, Line, or Points instance. The instance
	 * already has a material (generated from the glTF material options alone)
	 * but reuse of the same glTF material may require multiple threejs materials
	 * to accommodate different primitive types, defines, etc. New materials will
	 * be created if necessary, and reused from a cache.
	 * @param  {Object3D} mesh Mesh, Line, or Points instance.
	 */
	assignFinalMaterial( mesh ) {

		const geometry = mesh.geometry;
		let material = mesh.material;

		const useDerivativeTangents = geometry.attributes.tangent === undefined;
		const useVertexColors = geometry.attributes.color !== undefined;
		const useFlatShading = geometry.attributes.normal === undefined;

		if ( mesh.isPoints ) {

			const cacheKey = 'PointsMaterial:' + material.uuid;

			let pointsMaterial = this.cache.get( cacheKey );

			if ( ! pointsMaterial ) {

				pointsMaterial = new PointsMaterial();
				Material.prototype.copy.call( pointsMaterial, material );
				pointsMaterial.color.copy( material.color );
				pointsMaterial.map = material.map;
				pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px

				this.cache.add( cacheKey, pointsMaterial );

			}

			material = pointsMaterial;

		} else if ( mesh.isLine ) {

			const cacheKey = 'LineBasicMaterial:' + material.uuid;

			let lineMaterial = this.cache.get( cacheKey );

			if ( ! lineMaterial ) {

				lineMaterial = new LineBasicMaterial();
				Material.prototype.copy.call( lineMaterial, material );
				lineMaterial.color.copy( material.color );

				this.cache.add( cacheKey, lineMaterial );

			}

			material = lineMaterial;

		}

		// Clone the material if it will be modified
		if ( useDerivativeTangents || useVertexColors || useFlatShading ) {

			let cacheKey = 'ClonedMaterial:' + material.uuid + ':';

			if ( useDerivativeTangents ) cacheKey += 'derivative-tangents:';
			if ( useVertexColors ) cacheKey += 'vertex-colors:';
			if ( useFlatShading ) cacheKey += 'flat-shading:';

			let cachedMaterial = this.cache.get( cacheKey );

			if ( ! cachedMaterial ) {

				cachedMaterial = material.clone();

				if ( useVertexColors ) cachedMaterial.vertexColors = true;
				if ( useFlatShading ) cachedMaterial.flatShading = true;

				if ( useDerivativeTangents ) {

					// https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995
					if ( cachedMaterial.normalScale ) cachedMaterial.normalScale.y *= - 1;
					if ( cachedMaterial.clearcoatNormalScale ) cachedMaterial.clearcoatNormalScale.y *= - 1;

				}

				this.cache.add( cacheKey, cachedMaterial );

				this.associations.set( cachedMaterial, this.associations.get( material ) );

			}

			material = cachedMaterial;

		}

		// workarounds for mesh and geometry

		if ( material.aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined ) {

			geometry.setAttribute( 'uv2', geometry.attributes.uv );

		}

		mesh.material = material;

	}

	getMaterialType( /* materialIndex */ ) {

		return MeshStandardMaterial;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
	 * @param {number} materialIndex
	 * @return {Promise<Material>}
	 */
	loadMaterial( materialIndex ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;
		const materialDef = json.materials[ materialIndex ];

		let materialType;
		const materialParams = {};
		const materialExtensions = materialDef.extensions || {};

		const pending = [];

		if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ] ) {

			const kmuExtension = extensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ];
			materialType = kmuExtension.getMaterialType();
			pending.push( kmuExtension.extendParams( materialParams, materialDef, parser ) );

		} else {

			// Specification:
			// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

			const metallicRoughness = materialDef.pbrMetallicRoughness || {};

			materialParams.color = new Color( 1.0, 1.0, 1.0 );
			materialParams.opacity = 1.0;

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				const array = metallicRoughness.baseColorFactor;

				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture, sRGBEncoding ) );

			}

			materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
			materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

			if ( metallicRoughness.metallicRoughnessTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture ) );
				pending.push( parser.assignTexture( materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture ) );

			}

			materialType = this._invokeOne( function ( ext ) {

				return ext.getMaterialType && ext.getMaterialType( materialIndex );

			} );

			pending.push( Promise.all( this._invokeAll( function ( ext ) {

				return ext.extendMaterialParams && ext.extendMaterialParams( materialIndex, materialParams );

			} ) ) );

		}

		if ( materialDef.doubleSided === true ) {

			materialParams.side = DoubleSide;

		}

		const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

		if ( alphaMode === ALPHA_MODES.BLEND ) {

			materialParams.transparent = true;

			// See: https://github.com/mrdoob/three.js/issues/17706
			materialParams.depthWrite = false;

		} else {

			materialParams.transparent = false;

			if ( alphaMode === ALPHA_MODES.MASK ) {

				materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;

			}

		}

		if ( materialDef.normalTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'normalMap', materialDef.normalTexture ) );

			materialParams.normalScale = new Vector2( 1, 1 );

			if ( materialDef.normalTexture.scale !== undefined ) {

				const scale = materialDef.normalTexture.scale;

				materialParams.normalScale.set( scale, scale );

			}

		}

		if ( materialDef.occlusionTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'aoMap', materialDef.occlusionTexture ) );

			if ( materialDef.occlusionTexture.strength !== undefined ) {

				materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;

			}

		}

		if ( materialDef.emissiveFactor !== undefined && materialType !== MeshBasicMaterial ) {

			materialParams.emissive = new Color().fromArray( materialDef.emissiveFactor );

		}

		if ( materialDef.emissiveTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'emissiveMap', materialDef.emissiveTexture, sRGBEncoding ) );

		}

		return Promise.all( pending ).then( function () {

			const material = new materialType( materialParams );

			if ( materialDef.name ) material.name = materialDef.name;

			assignExtrasToUserData( material, materialDef );

			parser.associations.set( material, { materials: materialIndex } );

			if ( materialDef.extensions ) addUnknownExtensionsToUserData( extensions, material, materialDef );

			return material;

		} );

	}

	/** When Object3D instances are targeted by animation, they need unique names. */
	createUniqueName( originalName ) {

		const sanitizedName = PropertyBinding.sanitizeNodeName( originalName || '' );

		let name = sanitizedName;

		for ( let i = 1; this.nodeNamesUsed[ name ]; ++ i ) {

			name = sanitizedName + '_' + i;

		}

		this.nodeNamesUsed[ name ] = true;

		return name;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
	 *
	 * Creates BufferGeometries from primitives.
	 *
	 * @param {Array<GLTF.Primitive>} primitives
	 * @return {Promise<Array<BufferGeometry>>}
	 */
	loadGeometries( primitives ) {

		const parser = this;
		const extensions = this.extensions;
		const cache = this.primitiveCache;

		function createDracoPrimitive( primitive ) {

			return extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ]
				.decodePrimitive( primitive, parser )
				.then( function ( geometry ) {

					return addPrimitiveAttributes( geometry, primitive, parser );

				} );

		}

		const pending = [];

		for ( let i = 0, il = primitives.length; i < il; i ++ ) {

			const primitive = primitives[ i ];
			const cacheKey = createPrimitiveKey( primitive );

			// See if we've already created this geometry
			const cached = cache[ cacheKey ];

			if ( cached ) {

				// Use the cached geometry if it exists
				pending.push( cached.promise );

			} else {

				let geometryPromise;

				if ( primitive.extensions && primitive.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] ) {

					// Use DRACO geometry if available
					geometryPromise = createDracoPrimitive( primitive );

				} else {

					// Otherwise create a new geometry
					geometryPromise = addPrimitiveAttributes( new BufferGeometry(), primitive, parser );

				}

				// Cache this geometry
				cache[ cacheKey ] = { primitive: primitive, promise: geometryPromise };

				pending.push( geometryPromise );

			}

		}

		return Promise.all( pending );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
	 * @param {number} meshIndex
	 * @return {Promise<Group|Mesh|SkinnedMesh>}
	 */
	loadMesh( meshIndex ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;

		const meshDef = json.meshes[ meshIndex ];
		const primitives = meshDef.primitives;

		const pending = [];

		for ( let i = 0, il = primitives.length; i < il; i ++ ) {

			const material = primitives[ i ].material === undefined
				? createDefaultMaterial( this.cache )
				: this.getDependency( 'material', primitives[ i ].material );

			pending.push( material );

		}

		pending.push( parser.loadGeometries( primitives ) );

		return Promise.all( pending ).then( function ( results ) {

			const materials = results.slice( 0, results.length - 1 );
			const geometries = results[ results.length - 1 ];

			const meshes = [];

			for ( let i = 0, il = geometries.length; i < il; i ++ ) {

				const geometry = geometries[ i ];
				const primitive = primitives[ i ];

				// 1. create Mesh

				let mesh;

				const material = materials[ i ];

				if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
						primitive.mode === undefined ) {

					// .isSkinnedMesh isn't in glTF spec. See ._markDefs()
					mesh = meshDef.isSkinnedMesh === true
						? new SkinnedMesh( geometry, material )
						: new Mesh( geometry, material );

					if ( mesh.isSkinnedMesh === true && ! mesh.geometry.attributes.skinWeight.normalized ) {

						// we normalize floating point skin weight array to fix malformed assets (see #15319)
						// it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
						mesh.normalizeSkinWeights();

					}

					if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ) {

						mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleStripDrawMode );

					} else if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ) {

						mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleFanDrawMode );

					}

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINES ) {

					mesh = new LineSegments( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_STRIP ) {

					mesh = new Line( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_LOOP ) {

					mesh = new LineLoop( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.POINTS ) {

					mesh = new Points( geometry, material );

				} else {

					throw new Error( 'THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode );

				}

				if ( Object.keys( mesh.geometry.morphAttributes ).length > 0 ) {

					updateMorphTargets( mesh, meshDef );

				}

				mesh.name = parser.createUniqueName( meshDef.name || ( 'mesh_' + meshIndex ) );

				assignExtrasToUserData( mesh, meshDef );

				if ( primitive.extensions ) addUnknownExtensionsToUserData( extensions, mesh, primitive );

				parser.assignFinalMaterial( mesh );

				meshes.push( mesh );

			}

			for ( let i = 0, il = meshes.length; i < il; i ++ ) {

				parser.associations.set( meshes[ i ], {
					meshes: meshIndex,
					primitives: i
				} );

			}

			if ( meshes.length === 1 ) {

				return meshes[ 0 ];

			}

			const group = new Group();

			parser.associations.set( group, { meshes: meshIndex } );

			for ( let i = 0, il = meshes.length; i < il; i ++ ) {

				group.add( meshes[ i ] );

			}

			return group;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
	 * @param {number} cameraIndex
	 * @return {Promise<THREE.Camera>}
	 */
	loadCamera( cameraIndex ) {

		let camera;
		const cameraDef = this.json.cameras[ cameraIndex ];
		const params = cameraDef[ cameraDef.type ];

		if ( ! params ) {

			console.warn( 'THREE.GLTFLoader: Missing camera parameters.' );
			return;

		}

		if ( cameraDef.type === 'perspective' ) {

			camera = new PerspectiveCamera( MathUtils.radToDeg( params.yfov ), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6 );

		} else if ( cameraDef.type === 'orthographic' ) {

			camera = new OrthographicCamera( - params.xmag, params.xmag, params.ymag, - params.ymag, params.znear, params.zfar );

		}

		if ( cameraDef.name ) camera.name = this.createUniqueName( cameraDef.name );

		assignExtrasToUserData( camera, cameraDef );

		return Promise.resolve( camera );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
	 * @param {number} skinIndex
	 * @return {Promise<Skeleton>}
	 */
	loadSkin( skinIndex ) {

		const skinDef = this.json.skins[ skinIndex ];

		const pending = [];

		for ( let i = 0, il = skinDef.joints.length; i < il; i ++ ) {

			pending.push( this.getDependency( 'node', skinDef.joints[ i ] ) );

		}

		if ( skinDef.inverseBindMatrices !== undefined ) {

			pending.push( this.getDependency( 'accessor', skinDef.inverseBindMatrices ) );

		} else {

			pending.push( null );

		}

		return Promise.all( pending ).then( function ( results ) {

			const inverseBindMatrices = results.pop();
			const jointNodes = results;

			const bones = [];
			const boneInverses = [];

			for ( let i = 0, il = jointNodes.length; i < il; i ++ ) {

				const jointNode = jointNodes[ i ];

				if ( jointNode ) {

					bones.push( jointNode );

					const mat = new Matrix4();

					if ( inverseBindMatrices !== null ) {

						mat.fromArray( inverseBindMatrices.array, i * 16 );

					}

					boneInverses.push( mat );

				} else {

					console.warn( 'THREE.GLTFLoader: Joint "%s" could not be found.', skinDef.joints[ i ] );

				}

			}

			return new Skeleton( bones, boneInverses );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
	 * @param {number} animationIndex
	 * @return {Promise<AnimationClip>}
	 */
	loadAnimation( animationIndex ) {

		const json = this.json;

		const animationDef = json.animations[ animationIndex ];

		const pendingNodes = [];
		const pendingInputAccessors = [];
		const pendingOutputAccessors = [];
		const pendingSamplers = [];
		const pendingTargets = [];

		for ( let i = 0, il = animationDef.channels.length; i < il; i ++ ) {

			const channel = animationDef.channels[ i ];
			const sampler = animationDef.samplers[ channel.sampler ];
			const target = channel.target;
			const name = target.node;
			const input = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.input ] : sampler.input;
			const output = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.output ] : sampler.output;

			pendingNodes.push( this.getDependency( 'node', name ) );
			pendingInputAccessors.push( this.getDependency( 'accessor', input ) );
			pendingOutputAccessors.push( this.getDependency( 'accessor', output ) );
			pendingSamplers.push( sampler );
			pendingTargets.push( target );

		}

		return Promise.all( [

			Promise.all( pendingNodes ),
			Promise.all( pendingInputAccessors ),
			Promise.all( pendingOutputAccessors ),
			Promise.all( pendingSamplers ),
			Promise.all( pendingTargets )

		] ).then( function ( dependencies ) {

			const nodes = dependencies[ 0 ];
			const inputAccessors = dependencies[ 1 ];
			const outputAccessors = dependencies[ 2 ];
			const samplers = dependencies[ 3 ];
			const targets = dependencies[ 4 ];

			const tracks = [];

			for ( let i = 0, il = nodes.length; i < il; i ++ ) {

				const node = nodes[ i ];
				const inputAccessor = inputAccessors[ i ];
				const outputAccessor = outputAccessors[ i ];
				const sampler = samplers[ i ];
				const target = targets[ i ];

				if ( node === undefined ) continue;

				node.updateMatrix();

				let TypedKeyframeTrack;

				switch ( PATH_PROPERTIES[ target.path ] ) {

					case PATH_PROPERTIES.weights:

						TypedKeyframeTrack = NumberKeyframeTrack;
						break;

					case PATH_PROPERTIES.rotation:

						TypedKeyframeTrack = QuaternionKeyframeTrack;
						break;

					case PATH_PROPERTIES.position:
					case PATH_PROPERTIES.scale:
					default:

						TypedKeyframeTrack = VectorKeyframeTrack;
						break;

				}

				const targetName = node.name ? node.name : node.uuid;

				const interpolation = sampler.interpolation !== undefined ? INTERPOLATION[ sampler.interpolation ] : InterpolateLinear;

				const targetNames = [];

				if ( PATH_PROPERTIES[ target.path ] === PATH_PROPERTIES.weights ) {

					node.traverse( function ( object ) {

						if ( object.morphTargetInfluences ) {

							targetNames.push( object.name ? object.name : object.uuid );

						}

					} );

				} else {

					targetNames.push( targetName );

				}

				let outputArray = outputAccessor.array;

				if ( outputAccessor.normalized ) {

					const scale = getNormalizedComponentScale( outputArray.constructor );
					const scaled = new Float32Array( outputArray.length );

					for ( let j = 0, jl = outputArray.length; j < jl; j ++ ) {

						scaled[ j ] = outputArray[ j ] * scale;

					}

					outputArray = scaled;

				}

				for ( let j = 0, jl = targetNames.length; j < jl; j ++ ) {

					const track = new TypedKeyframeTrack(
						targetNames[ j ] + '.' + PATH_PROPERTIES[ target.path ],
						inputAccessor.array,
						outputArray,
						interpolation
					);

					// Override interpolation with custom factory method.
					if ( sampler.interpolation === 'CUBICSPLINE' ) {

						track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline( result ) {

							// A CUBICSPLINE keyframe in glTF has three output values for each input value,
							// representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
							// must be divided by three to get the interpolant's sampleSize argument.

							const interpolantType = ( this instanceof QuaternionKeyframeTrack ) ? GLTFCubicSplineQuaternionInterpolant : GLTFCubicSplineInterpolant;

							return new interpolantType( this.times, this.values, this.getValueSize() / 3, result );

						};

						// Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.
						track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;

					}

					tracks.push( track );

				}

			}

			const name = animationDef.name ? animationDef.name : 'animation_' + animationIndex;

			return new AnimationClip( name, undefined, tracks );

		} );

	}

	createNodeMesh( nodeIndex ) {

		const json = this.json;
		const parser = this;
		const nodeDef = json.nodes[ nodeIndex ];

		if ( nodeDef.mesh === undefined ) return null;

		return parser.getDependency( 'mesh', nodeDef.mesh ).then( function ( mesh ) {

			const node = parser._getNodeRef( parser.meshCache, nodeDef.mesh, mesh );

			// if weights are provided on the node, override weights on the mesh.
			if ( nodeDef.weights !== undefined ) {

				node.traverse( function ( o ) {

					if ( ! o.isMesh ) return;

					for ( let i = 0, il = nodeDef.weights.length; i < il; i ++ ) {

						o.morphTargetInfluences[ i ] = nodeDef.weights[ i ];

					}

				} );

			}

			return node;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
	 * @param {number} nodeIndex
	 * @return {Promise<Object3D>}
	 */
	loadNode( nodeIndex ) {

		const json = this.json;
		const extensions = this.extensions;
		const parser = this;

		const nodeDef = json.nodes[ nodeIndex ];

		// reserve node's name before its dependencies, so the root has the intended name.
		const nodeName = nodeDef.name ? parser.createUniqueName( nodeDef.name ) : '';

		return ( function () {

			const objectPending = [];

			const meshPromise = parser._invokeOne( function ( ext ) {

				return ext.createNodeMesh && ext.createNodeMesh( nodeIndex );

			} );

			if ( meshPromise ) {

				objectPending.push( meshPromise );

			}

			if ( nodeDef.camera !== undefined ) {

				objectPending.push( parser.getDependency( 'camera', nodeDef.camera ).then( function ( camera ) {

					return parser._getNodeRef( parser.cameraCache, nodeDef.camera, camera );

				} ) );

			}

			parser._invokeAll( function ( ext ) {

				return ext.createNodeAttachment && ext.createNodeAttachment( nodeIndex );

			} ).forEach( function ( promise ) {

				objectPending.push( promise );

			} );

			const childPending = [];
			const childrenDef = nodeDef.children || [];

			for ( let i = 0, il = childrenDef.length; i < il; i ++ ) {

				childPending.push( parser.getDependency( 'node', childrenDef[ i ] ) );

			}

			const skeletonPending = nodeDef.skin === undefined
				? Promise.resolve( null )
				: parser.getDependency( 'skin', nodeDef.skin );

			return Promise.all( [
				Promise.all( objectPending ),
				Promise.all( childPending ),
				skeletonPending
			] );

		}() ).then( function ( results ) {

			const objects = results[ 0 ];
			const children = results[ 1 ];
			const skeleton = results[ 2 ];

			let node;

			// .isBone isn't in glTF spec. See ._markDefs
			if ( nodeDef.isBone === true ) {

				node = new Bone();

			} else if ( objects.length > 1 ) {

				node = new Group();

			} else if ( objects.length === 1 ) {

				node = objects[ 0 ];

			} else {

				node = new Object3D();

			}

			if ( node !== objects[ 0 ] ) {

				for ( let i = 0, il = objects.length; i < il; i ++ ) {

					node.add( objects[ i ] );

				}

			}

			if ( nodeDef.name ) {

				node.userData.name = nodeDef.name;
				node.name = nodeName;

			}

			assignExtrasToUserData( node, nodeDef );

			if ( nodeDef.extensions ) addUnknownExtensionsToUserData( extensions, node, nodeDef );

			if ( nodeDef.matrix !== undefined ) {

				const matrix = new Matrix4();
				matrix.fromArray( nodeDef.matrix );
				node.applyMatrix4( matrix );

			} else {

				if ( nodeDef.translation !== undefined ) {

					node.position.fromArray( nodeDef.translation );

				}

				if ( nodeDef.rotation !== undefined ) {

					node.quaternion.fromArray( nodeDef.rotation );

				}

				if ( nodeDef.scale !== undefined ) {

					node.scale.fromArray( nodeDef.scale );

				}

			}

			if ( ! parser.associations.has( node ) ) {

				parser.associations.set( node, {} );

			}

			parser.associations.get( node ).nodes = nodeIndex;

			if ( skeleton !== null ) {

				// This full traverse should be fine because
				// child glTF nodes have not been added to this node yet.
				node.traverse( function ( mesh ) {

					if ( ! mesh.isSkinnedMesh ) return;

					mesh.bind( skeleton, _identityMatrix );

				} );

			}

			for ( let i = 0, il = children.length; i < il; i ++ ) {

				node.add( children[ i ] );

			}

			return node;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
	 * @param {number} sceneIndex
	 * @return {Promise<Group>}
	 */
	loadScene( sceneIndex ) {

		const extensions = this.extensions;
		const sceneDef = this.json.scenes[ sceneIndex ];
		const parser = this;

		// Loader returns Group, not Scene.
		// See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172
		const scene = new Group();
		if ( sceneDef.name ) scene.name = parser.createUniqueName( sceneDef.name );

		assignExtrasToUserData( scene, sceneDef );

		if ( sceneDef.extensions ) addUnknownExtensionsToUserData( extensions, scene, sceneDef );

		const nodeIds = sceneDef.nodes || [];

		const pending = [];

		for ( let i = 0, il = nodeIds.length; i < il; i ++ ) {

			pending.push( parser.getDependency( 'node', nodeIds[ i ] ) );

		}

		return Promise.all( pending ).then( function ( nodes ) {

			for ( let i = 0, il = nodes.length; i < il; i ++ ) {

				scene.add( nodes[ i ] );

			}

			// Removes dangling associations, associations that reference a node that
			// didn't make it into the scene.
			const reduceAssociations = ( node ) => {

				const reducedAssociations = new Map();

				for ( const [ key, value ] of parser.associations ) {

					if ( key instanceof Material || key instanceof Texture ) {

						reducedAssociations.set( key, value );

					}

				}

				node.traverse( ( node ) => {

					const mappings = parser.associations.get( node );

					if ( mappings != null ) {

						reducedAssociations.set( node, mappings );

					}

				} );

				return reducedAssociations;

			};

			parser.associations = reduceAssociations( scene );

			return scene;

		} );

	}

}

/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 */
function computeBounds( geometry, primitiveDef, parser ) {

	const attributes = primitiveDef.attributes;

	const box = new Box3();

	if ( attributes.POSITION !== undefined ) {

		const accessor = parser.json.accessors[ attributes.POSITION ];

		const min = accessor.min;
		const max = accessor.max;

		// glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

		if ( min !== undefined && max !== undefined ) {

			box.set(
				new Vector3( min[ 0 ], min[ 1 ], min[ 2 ] ),
				new Vector3( max[ 0 ], max[ 1 ], max[ 2 ] )
			);

			if ( accessor.normalized ) {

				const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
				box.min.multiplyScalar( boxScale );
				box.max.multiplyScalar( boxScale );

			}

		} else {

			console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

			return;

		}

	} else {

		return;

	}

	const targets = primitiveDef.targets;

	if ( targets !== undefined ) {

		const maxDisplacement = new Vector3();
		const vector = new Vector3();

		for ( let i = 0, il = targets.length; i < il; i ++ ) {

			const target = targets[ i ];

			if ( target.POSITION !== undefined ) {

				const accessor = parser.json.accessors[ target.POSITION ];
				const min = accessor.min;
				const max = accessor.max;

				// glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

				if ( min !== undefined && max !== undefined ) {

					// we need to get max of absolute components because target weight is [-1,1]
					vector.setX( Math.max( Math.abs( min[ 0 ] ), Math.abs( max[ 0 ] ) ) );
					vector.setY( Math.max( Math.abs( min[ 1 ] ), Math.abs( max[ 1 ] ) ) );
					vector.setZ( Math.max( Math.abs( min[ 2 ] ), Math.abs( max[ 2 ] ) ) );


					if ( accessor.normalized ) {

						const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
						vector.multiplyScalar( boxScale );

					}

					// Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
					// to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
					// are used to implement key-frame animations and as such only two are active at a time - this results in very large
					// boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
					maxDisplacement.max( vector );

				} else {

					console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

				}

			}

		}

		// As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.
		box.expandByVector( maxDisplacement );

	}

	geometry.boundingBox = box;

	const sphere = new Sphere();

	box.getCenter( sphere.center );
	sphere.radius = box.min.distanceTo( box.max ) / 2;

	geometry.boundingSphere = sphere;

}

/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */
function addPrimitiveAttributes( geometry, primitiveDef, parser ) {

	const attributes = primitiveDef.attributes;

	const pending = [];

	function assignAttributeAccessor( accessorIndex, attributeName ) {

		return parser.getDependency( 'accessor', accessorIndex )
			.then( function ( accessor ) {

				geometry.setAttribute( attributeName, accessor );

			} );

	}

	for ( const gltfAttributeName in attributes ) {

		const threeAttributeName = ATTRIBUTES[ gltfAttributeName ] || gltfAttributeName.toLowerCase();

		// Skip attributes already provided by e.g. Draco extension.
		if ( threeAttributeName in geometry.attributes ) continue;

		pending.push( assignAttributeAccessor( attributes[ gltfAttributeName ], threeAttributeName ) );

	}

	if ( primitiveDef.indices !== undefined && ! geometry.index ) {

		const accessor = parser.getDependency( 'accessor', primitiveDef.indices ).then( function ( accessor ) {

			geometry.setIndex( accessor );

		} );

		pending.push( accessor );

	}

	assignExtrasToUserData( geometry, primitiveDef );

	computeBounds( geometry, primitiveDef, parser );

	return Promise.all( pending ).then( function () {

		return primitiveDef.targets !== undefined
			? addMorphTargets( geometry, primitiveDef.targets, parser )
			: geometry;

	} );

}


THREE.GLTFLoader=GLTFLoader;
})(THREE);


if (typeof __installMiniGLTFLoader === 'function') __installMiniGLTFLoader();

/* ===== [[ js/soldier-loader.js ]] ===== */
// ===== V4.1 soldier GLB loading, validation and shared render data =====

var SoldierModelLoader = class SoldierModelLoader {
    static load() {
        if (SoldierModelLoader._data) return SoldierModelLoader._promise;
        if (SoldierModelLoader._promise) return SoldierModelLoader._promise;
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader !== 'function') {
            return Promise.reject(new Error('SoldierModelLoader requires THREE.GLTFLoader'));
        }

        var started = performance.now();
        var partial = [];
        SoldierModelLoader.status = 'loading';
        SoldierModelLoader.loadMs = 0;
        var loader = new THREE.GLTFLoader();
        function one(url, label) {
            return new Promise(function(resolve, reject) {
                loader.load(url, function(gltf) {
                    try {
                        SoldierModelLoader._validate(gltf, label);
                        partial.push(gltf);
                        resolve(gltf);
                    } catch (err) {
                        SoldierModelLoader._disposeScene(gltf && gltf.scene);
                        reject(err);
                    }
                }, function(evt) {
                    // VNext: 启动进度上报(文件级 loaded/total)
                    if (window.__BootProgress && evt && evt.lengthComputable !== false) {
                        window.__BootProgress.file(url, evt.loaded || 0, evt.total || 1);
                    }
                }, function(err) {
                    reject(new Error('Failed to load ' + label + ': ' + (err && err.message ? err.message : err)));
                });
            });
        }

        SoldierModelLoader._promise = Promise.allSettled([
            one('assets/models/soldier/soldier.glb', 'hero soldier'),
            one('assets/models/soldier/soldier-lod.glb', 'LOD soldier')
        ]).then(function(results) {
            // Wait for both requests before cleanup: a slow sibling must not
            // allocate textures after an early failed request has been disposed.
            var failed = results.find(function(r) { return r.status === 'rejected'; });
            if (failed) throw failed.reason;
            var loaded = results.map(function(r) { return r.value; });
            var hero = SoldierModelLoader._extract(loaded[0], 'hero');
            var lod = SoldierModelLoader._extract(loaded[1], 'lod');
            // Existing scenery was authored for legacy linear-output Lambert shading.
            // glTF PBR is linear-lit and must receive an sRGB display transform.
            // Apply it to this material only, preserving the established scenery palette.
            hero.material.onBeforeCompile = function(shader) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <encodings_fragment>',
                    'gl_FragColor = LinearTosRGB( gl_FragColor );'
                );
            };
            hero.material.customProgramCacheKey = function() { return 'v41-gltf-srgb-display'; };
            var duplicateLodMaterial = lod.material;
            for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
                lod.nodes[SoldierModelLoader.PARTS[i]].material = hero.material;
            }
            lod.material = hero.material;
            if (duplicateLodMaterial !== hero.material) {
                SoldierModelLoader._disposeMaterial(duplicateLodMaterial);
            }

            // Derive the attachment from world transforms so exported parent
            // rotations/scales remain correct even when Blender changes them.
            hero.scene.updateMatrixWorld(true);
            var inverseArms = new THREE.Matrix4().copy(hero.nodes.Arms.matrixWorld).invert();
            var muzzleMatrix = inverseArms.multiply(hero.muzzle.matrixWorld);
            var data = {
                version: 1,
                parts: SoldierModelLoader.PARTS.slice(),
                banks: {
                    hero: SoldierModelLoader._bankData(hero),
                    lod: SoldierModelLoader._bankData(lod)
                },
                material: hero.material,
                muzzleMatrix: muzzleMatrix.clone(),
                muzzlePosition: new THREE.Vector3().setFromMatrixPosition(muzzleMatrix),
                urls: {
                    hero: 'assets/models/soldier/soldier.glb',
                    lod: 'assets/models/soldier/soldier-lod.glb'
                }
            };
            SoldierModelLoader._data = data;
            SoldierModelLoader.status = 'loaded';
            SoldierModelLoader.loadMs = performance.now() - started;
            return data;
        }).catch(function(err) {
            for (var i = 0; i < partial.length; i++) {
                SoldierModelLoader._disposeScene(partial[i] && partial[i].scene);
            }
            SoldierModelLoader._data = null;
            SoldierModelLoader._promise = null;
            SoldierModelLoader.status = 'failed';
            SoldierModelLoader.loadMs = performance.now() - started;
            throw err;
        });
        return SoldierModelLoader._promise;
    }

    static get() {
        return SoldierModelLoader._data;
    }

    static _validate(gltf, label) {
        if (!gltf || !gltf.scene) throw new Error(label + ' has no scene');
        var shared = null;
        for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
            var name = SoldierModelLoader.PARTS[i];
            var node = gltf.scene.getObjectByName(name);
            if (!node || !node.isMesh) throw new Error(label + ' missing mesh ' + name);
            if (!node.geometry || !node.geometry.getAttribute('position') ||
                !node.geometry.getAttribute('normal') || !node.geometry.getAttribute('uv')) {
                throw new Error(label + ' ' + name + ' requires position, normal and UV attributes');
            }
            if (!node.geometry.index) throw new Error(label + ' ' + name + ' requires indexed geometry');
            if (Array.isArray(node.material) || !node.material || !node.material.isMeshStandardMaterial) {
                throw new Error(label + ' ' + name + ' requires one MeshStandardMaterial');
            }
            if (!shared) shared = node.material;
            if (node.material !== shared) throw new Error(label + ' parts must share one material');
        }
        var muzzle = gltf.scene.getObjectByName('Muzzle');
        var arms = gltf.scene.getObjectByName('Arms');
        if (!muzzle || muzzle.parent !== arms) throw new Error(label + ' Muzzle must be a direct Arms child');
        if (!shared.map || !shared.metalnessMap || !shared.roughnessMap) {
            throw new Error(label + ' material requires decoded base-color and ORM textures');
        }
        SoldierModelLoader._validateImage(shared.map.image, label + ' base-color');
        SoldierModelLoader._validateImage(shared.metalnessMap.image, label + ' ORM');
        if (shared.metalnessMap !== shared.roughnessMap) {
            throw new Error(label + ' ORM texture must be shared by metalness and roughness');
        }
    }

    static _validateImage(image, label) {
        var width = image && (image.width || image.videoWidth || image.naturalWidth);
        var height = image && (image.height || image.videoHeight || image.naturalHeight);
        if (!width || !height) throw new Error(label + ' image did not decode');
    }

    static _extract(gltf, label) {
        var nodes = {};
        for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
            var name = SoldierModelLoader.PARTS[i];
            nodes[name] = gltf.scene.getObjectByName(name);
            nodes[name].updateMatrix();
        }
        return {
            label: label,
            scene: gltf.scene,
            nodes: nodes,
            material: nodes.Body.material,
            muzzle: gltf.scene.getObjectByName('Muzzle')
        };
    }

    static _bankData(extracted) {
        var geometries = {};
        var restMatrices = {};
        for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
            var name = SoldierModelLoader.PARTS[i];
            geometries[name] = extracted.nodes[name].geometry;
            restMatrices[name] = extracted.nodes[name].matrix.clone();
        }
        return {
            name: extracted.label,
            geometries: geometries,
            restMatrices: restMatrices,
            material: extracted.material
        };
    }

    static _disposeScene(scene) {
        if (!scene) return;
        var geometries = [];
        var materials = [];
        scene.traverse(function(obj) {
            if (obj.geometry && geometries.indexOf(obj.geometry) < 0) geometries.push(obj.geometry);
            if (obj.material) {
                var list = Array.isArray(obj.material) ? obj.material : [obj.material];
                for (var i = 0; i < list.length; i++) {
                    if (materials.indexOf(list[i]) < 0) materials.push(list[i]);
                }
            }
        });
        for (var i = 0; i < geometries.length; i++) geometries[i].dispose();
        for (var j = 0; j < materials.length; j++) SoldierModelLoader._disposeMaterial(materials[j]);
    }

    static _disposeMaterial(material) {
        if (!material) return;
        var textures = [];
        for (var key in material) {
            var value = material[key];
            if (value && value.isTexture && textures.indexOf(value) < 0) textures.push(value);
        }
        for (var i = 0; i < textures.length; i++) textures[i].dispose();
        material.dispose();
    }
};

SoldierModelLoader.PARTS = ['Body', 'Head', 'Arms', 'LegL', 'LegR'];
SoldierModelLoader._promise = null;
SoldierModelLoader._data = null;
SoldierModelLoader.status = 'idle';
SoldierModelLoader.loadMs = 0;
if (typeof window !== 'undefined') window.SoldierModelLoader = SoldierModelLoader;


/* ===== [[ js/soldier-renderer.js ]] ===== */
// ===== V4.1 five-part instanced soldier renderer and procedural poses =====

var SoldierRenderer = class SoldierRenderer {
    constructor(scene) {
        this.scene = scene;
        this.data = SoldierModelLoader.get();
        if (!this.data) throw new Error('Soldier model data is not loaded');
        this.parts = this.data.parts.slice();
        // V11 QA修复[P2]: 容量必须含科技"军团上限"加成(army_limit max2 × 50 = +100),
        // 原实现固定500+16, 科技买满后600人 → setMatrixAt越界丢弃 + instanceCount超缓冲 → WebGL渲染异常
        var techLimitBonus = (typeof TECH_DEFS !== 'undefined' && TECH_DEFS.army_limit) ? 50 * TECH_DEFS.army_limit.max : 0;
        this.capacity = CONFIG.SQUAD_MAX_COUNT + techLimitBonus + SoldierRenderer.MAX_GHOSTS;
        this.banks = {};
        this.activeBank = 'hero';
        this.state = null;
        this._stateAge = 0;
        this.ghosts = [];
        this._shootT = new Float32Array(this.capacity);
        this._debugPoses = [];
        this._cycleSamples = [];
        this._lastRoots = [];
        this._lastTime = 0;
        this._denseSampleTime = -Infinity;
        this._denseSample = true;
        this._hitT = 0;

        this._p = new THREE.Vector3();
        this._q = new THREE.Quaternion();
        this._s = new THREE.Vector3();
        this._e = new THREE.Euler();
        this._root = new THREE.Matrix4();
        this._local = new THREE.Matrix4();
        this._anim = new THREE.Matrix4();
        this._temp = new THREE.Matrix4();
        this._muzzleWorld = new THREE.Matrix4();
        this._outPos = new THREE.Vector3();

        this._createBank('hero');
        this._createBank('lod');
        this._selectBank('hero', 0);
    }

    _createBank(name) {
        var source = this.data.banks[name];
        var meshes = {};
        for (var i = 0; i < this.parts.length; i++) {
            var part = this.parts[i];
            var mesh = new THREE.InstancedMesh(source.geometries[part], source.material, this.capacity);
            mesh.name = 'Soldier_' + name + '_' + part;
            mesh.count = 0;
            mesh.frustumCulled = false;
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.userData.artSource = this.data.urls ? this.data.urls[name] : 'V4.1 soldier GLB';
            this.scene.add(mesh);
            meshes[part] = mesh;
        }
        this.banks[name] = { meshes: meshes, source: source };
    }

    _selectBank(name, count) {
        this.activeBank = name;
        for (var bankName in this.banks) {
            var visible = bankName === name;
            var bankMeshes = this.banks[bankName].meshes;
            for (var i = 0; i < this.parts.length; i++) {
                var mesh = bankMeshes[this.parts[i]];
                mesh.visible = visible;
                if (!visible) mesh.count = 0;
                // Dense formations have no dynamic shadows. Hero shadows are capped.
                mesh.castShadow = visible && name === 'hero' && count <= 64;
            }
        }
        var active = this.banks[name].meshes;
        this.mesh = active.Body;
        this.legMeshL = active.LegL;
        this.legMeshR = active.LegR;
    }

    setState(name) {
        var allowed = ['Idle', 'Run', 'Shoot', 'Hit', 'Death', 'Victory'];
        if (name === null || name === undefined || name === 'Auto') {
            this.state = null;
            this._stateAge = 0;
            return;
        }
        if (allowed.indexOf(name) < 0) throw new Error('Unknown soldier animation state: ' + name);
        this.state = name;
        this._stateAge = 0;
    }

    triggerShoot(index) {
        if (index >= 0 && index < this._shootT.length) {
            this._shootT[index] = SoldierRenderer.SHOOT_DURATION;
        }
    }

    triggerHit() {
        this._hitT = SoldierRenderer.HIT_DURATION;
    }

    clearGhosts() {
        this.ghosts.length = 0;
    }

    captureDeaths(start, end, squad) {
        start = Math.max(0, start | 0);
        end = Math.min(end | 0, squad.soldiers.length);
        for (var i = start; i < end; i++) {
            var soldier = squad.soldiers[i];
            if (!soldier) continue;
            var root = this._lastRoots[i] ? this._lastRoots[i].clone() : new THREE.Matrix4();
            if (!this._lastRoots[i]) this._composeRoot(i, squad, false, 0, 0, root);
            if (this.ghosts.length >= SoldierRenderer.MAX_GHOSTS) this.ghosts.shift();
            this.ghosts.push({
                root: root,
                phase: soldier.phase || 0,
                age: 0,
                direction: ((i + Math.floor((soldier.phase || 0) * 10)) & 1) ? 1 : -1
            });
        }
    }

    update(dt, time, squad, moving, lean, tilt) {
        this._lastTime = time;
        this._stateAge += dt;
        this._hitT = Math.max(0, this._hitT - dt);
        for (var i = 0; i < squad.count; i++) {
            this._shootT[i] = Math.max(0, this._shootT[i] - dt);
        }
        for (var g = this.ghosts.length - 1; g >= 0; g--) {
            this.ghosts[g].age += dt;
            if (this.ghosts[g].age >= SoldierRenderer.DEATH_DURATION) this.ghosts.splice(g, 1);
        }

        var bankName = squad.count > SoldierRenderer.HERO_LIMIT ? 'lod' : 'hero';
        this._selectBank(bankName, squad.count);
        this._denseSample = bankName === 'hero' || time - this._denseSampleTime >= 1 / 30;
        if (this._denseSample) this._denseSampleTime = time;

        var bank = this.banks[bankName];
        for (var index = 0; index < squad.count; index++) {
            this._composeRoot(index, squad, moving, lean, tilt, this._root);
            if (!this._lastRoots[index]) this._lastRoots[index] = new THREE.Matrix4();
            this._lastRoots[index].copy(this._root);
            var pose = this._poseFor(index, squad.soldiers[index], moving, time, this._denseSample);
            for (var p = 0; p < this.parts.length; p++) {
                var part = this.parts[p];
                this._partMatrix(part, bank.source, this._root, pose, this._temp);
                bank.meshes[part].setMatrixAt(index, this._temp);
            }
        }

        for (var ghostIndex = 0; ghostIndex < this.ghosts.length; ghostIndex++) {
            var ghost = this.ghosts[ghostIndex];
            var slot = squad.count + ghostIndex;
            var deathPose = this._deathPose(ghost);
            for (var gp = 0; gp < this.parts.length; gp++) {
                var ghostPart = this.parts[gp];
                this._partMatrix(ghostPart, bank.source, ghost.root, deathPose, this._temp);
                bank.meshes[ghostPart].setMatrixAt(slot, this._temp);
            }
        }

        var visibleCount = squad.count + this.ghosts.length;
        // V11.6: 前缀上传(只传已用槽位, 上限500时GPU带宽减半以上)
        for (var m = 0; m < this.parts.length; m++) {
            var partMesh = bank.meshes[this.parts[m]];
            partMesh.count = visibleCount;
            partMesh.instanceMatrix.updateRange.offset = 0;
            partMesh.instanceMatrix.updateRange.count = visibleCount * 16;
            partMesh.instanceMatrix.needsUpdate = true;
        }
    }

    _composeRoot(index, squad, moving, lean, tilt, target) {
        var soldier = squad.soldiers[index];
        if (!soldier) return target.identity();
        var phase = soldier.phase || 0;
        var time = this._lastTime;
        var bob = moving ? Math.abs(Math.sin(time * 8 + phase)) * 0.035 : Math.sin(time * 2 + phase) * 0.012;
        var spawnScale = Math.max(0.001, easeOutBack(soldier.spawnT));
        var modelScale = squad._formationScale || 1;
        this._p.set(squad.x + soldier.x, bob, squad.z + soldier.z);
        this._e.set(lean || 0, soldier.rotY || 0, tilt || 0, 'YXZ');
        this._q.setFromEuler(this._e);
        this._s.setScalar(spawnScale * modelScale);
        return target.compose(this._p, this._q, this._s);
    }

    _poseFor(index, soldier, moving, time, sampleCycle) {
        var cycle = this._cycleSamples[index];
        if (!cycle) cycle = this._cycleSamples[index] = { run: 0, idle: 0, victory: 0 };
        if (sampleCycle) {
            cycle.run = Math.sin(time * 8 + (soldier.phase || 0));
            cycle.idle = Math.sin(time * 2 + (soldier.phase || 0));
            cycle.victory = Math.sin(time * 5 + (soldier.phase || 0));
        }
        var recoil = this._shootT[index] > 0
            ? Math.sin((this._shootT[index] / SoldierRenderer.SHOOT_DURATION) * Math.PI * 0.5)
            : 0;
        if (this.state === 'Shoot') recoil = Math.abs(Math.sin(time * 16 + (soldier.phase || 0))) * .8 + .2;
        var state = this.state || (moving ? 'Run' : 'Idle');
        if (this._hitT > 0) state = 'Hit';
        if (recoil > 0) state = 'Shoot';
        if (this.state === 'Victory') state = 'Victory';
        if (this.state === 'Death') state = 'Death';
        var pose = {
            state: state,
            phase: soldier.phase || 0,
            swingL: moving && state !== 'Victory' ? cycle.run * 0.6 : 0,
            swingR: moving && state !== 'Victory' ? -cycle.run * 0.6 : 0,
            bodyPitch: moving ? cycle.run * 0.025 : 0,
            bodyYaw: 0,
            headYaw: (state === 'Idle' ? cycle.idle * 0.035 : 0),
            headLift: (state === 'Idle' ? cycle.idle * 0.008 : 0),
            armsPitch: 0,
            armsLift: 0,
            recoil: recoil,
            deathT: 0,
            deathDirection: 0
        };
        if (state === 'Hit') {
            pose.bodyPitch = -0.12 * (this._hitT > 0 ? this._hitT / SoldierRenderer.HIT_DURATION : 1);
            pose.headYaw = cycle.run * 0.08;
        } else if (state === 'Death') {
            pose = this._deathPose({ age: this._stateAge, phase: soldier.phase, direction: 1 });
        } else if (state === 'Victory') {
            pose.bodyPitch = cycle.victory * 0.04;
            pose.headLift = Math.abs(cycle.victory) * 0.03;
            pose.armsPitch = -0.55 - Math.abs(cycle.victory) * 0.18;
            pose.armsLift = 0.06;
            pose.swingL = cycle.victory * 0.12;
            pose.swingR = -cycle.victory * 0.12;
        }
        this._debugPoses[index] = pose;
        return pose;
    }

    _deathPose(ghost) {
        var t = Math.min(1, ghost.age / SoldierRenderer.DEATH_DURATION);
        return {
            state: 'Death', phase: ghost.phase,
            swingL: 0.12, swingR: -0.12,
            bodyPitch: 0, bodyYaw: 0, headYaw: 0, headLift: 0,
            armsPitch: 0, armsLift: 0, recoil: 0,
            deathT: t, deathDirection: ghost.direction
        };
    }

    _partMatrix(part, source, root, pose, target) {
        this._anim.identity();
        if (part === 'Body') {
            this._e.set(pose.bodyPitch, pose.bodyYaw, 0, 'YXZ');
            this._anim.makeRotationFromEuler(this._e);
        } else if (part === 'Head') {
            this._e.set(0, pose.headYaw, 0, 'YXZ');
            this._anim.makeRotationFromEuler(this._e);
            this._anim.setPosition(0, pose.headLift, 0);
        } else if (part === 'Arms') {
            this._e.set(pose.armsPitch - pose.recoil * 0.12, 0, 0, 'YXZ');
            this._anim.makeRotationFromEuler(this._e);
            this._anim.setPosition(0, pose.armsLift, pose.recoil * 0.12);
        } else if (part === 'LegL') {
            this._anim.makeRotationX(pose.swingL);
        } else if (part === 'LegR') {
            this._anim.makeRotationX(pose.swingR);
        }
        target.copy(root);
        if (pose.deathT) {
            this._e.set(0, 0, pose.deathDirection * pose.deathT * Math.PI * 0.5);
            this._local.makeRotationFromEuler(this._e);
            var shrink = 1 - Math.pow(pose.deathT, 3) * .95;
            this._local.scale(this._s.setScalar(shrink));
            this._local.setPosition(0, .12 * Math.sin(pose.deathT * Math.PI), 0);
            target.multiply(this._local);
        }
        return target.multiply(source.restMatrices[part]).multiply(this._anim);
    }

    getMuzzlePosition(index, squad, target) {
        target = target || new THREE.Vector3();
        if (index < 0 || index >= squad.count) return null;
        this._composeRoot(index, squad, !!squad._moving, squad._lean || 0, squad._tilt || 0, this._root);
        var pose = this._poseFor(index, squad.soldiers[index], !!squad._moving, this._lastTime, true);
        var bank = this.banks[this.activeBank];
        this._partMatrix('Arms', bank.source, this._root, pose, this._temp);
        bank.meshes.Arms.setMatrixAt(index, this._temp);
        bank.meshes.Arms.instanceMatrix.needsUpdate = true;
        this._muzzleWorld.copy(this._temp).multiply(this.data.muzzleMatrix);
        return target.setFromMatrixPosition(this._muzzleWorld);
    }

    pose(index) {
        if (index < 0 || index >= this._debugPoses.length || !this._debugPoses[index]) return null;
        var pose = this._debugPoses[index];
        return {
            state: pose.state,
            phase: pose.phase,
            swingL: pose.swingL,
            swingR: pose.swingR,
            recoil: pose.recoil
        };
    }
};

SoldierRenderer.HERO_LIMIT = 100;
SoldierRenderer.MAX_GHOSTS = 16;
SoldierRenderer.SHOOT_DURATION = 0.16;
SoldierRenderer.HIT_DURATION = 0.18;
SoldierRenderer.DEATH_DURATION = 0.65;
if (typeof window !== 'undefined') window.SoldierRenderer = SoldierRenderer;


/* ===== [[ js/enemy-models.js ]] ===== */
// V4.2: local Blender assets, cached immutable resources and rigid-part batches.
var EnemyModelLoader = class EnemyModelLoader {
    static load(keys) {
        // V11.6: 子集加载+后台续载 — 启动只等关键资源(士兵+normal/fast), 其余模型战斗中后台补齐
        // (_bank 有 normal 回退, 未就绪体格短暂降级不崩溃)
        if (keys === undefined) keys = this.KEYS;
        if (this._data) {
            var missing = keys.filter(function(k) { return !this._data.styles[k]; }, this);
            if (!missing.length) return Promise.resolve(this._data);
            // V12: 续载并发去重 — 同一缺键集合已有在途续载时复用, 防重复加载
            if (this._contPromise && this._contKeys === missing.join(',')) return this._contPromise;
            this._contKeys = missing.join(',');
            // V11.6: 错峰续载 — 逐体型串行+间隔; 战斗中自动拉长间隔(解码不与实时玩法抢主线程)
            var contPromise = missing.reduce(function(p, k) {
                return p.then(function() {
                    var playing = typeof window !== 'undefined' && window.__game && window.__game.state === 'playing';
                    var gap = playing ? 1500 : 400;
                    return new Promise(function(res) { setTimeout(res, gap); })
                        .then(function() { return this._loadKeys([k]); }.bind(this))
                        .then(function(styles) { for (var mk in styles) this._data.styles[mk] = styles[mk]; }.bind(this));
                }.bind(this));
            }.bind(this), Promise.resolve()).then(function() {
                this.status = 'loaded';
                this._contPromise = null; // V12: 在途标记清理
                return this._data;
            }.bind(this)).catch(function(e) { this.status = 'partial_failed'; this._contPromise = null; throw e; }.bind(this));
            this._contPromise = contPromise;
            return contPromise;
        }
        if (this._promise) return this._promise;
        this._bootT0 = performance.now();
        this._promise = this._loadKeys(keys).then(function(styles) {
            this._data = { parts: this.PARTS, styles: styles };
            this.status = keys.length === this.KEYS.length ? 'loaded' : 'partial';
            this.loadMs = performance.now() - this._bootT0;
            return this._data;
        }.bind(this)).catch(function(e) {
            this._promise = null; this._data = null; this.status = 'failed'; throw e;
        }.bind(this));
        return this._promise;
    }
    static loadCritical() {
        // V11.6: 启动关键集 — 2士兵+普通/快速僵尸×2LOD = 6 GLB
        if (typeof window !== 'undefined' && window.__BootProgress) window.__BootProgress.total = 6;
        return this.load(['normal', 'fast']);
    }
    static _loadKeys(keys) {
        var loaded = [], loader = new THREE.GLTFLoader();
        this.status = 'loading';
        if (typeof window !== 'undefined' && window.__BootProgress && keys.length === this.KEYS.length) {
            window.__BootProgress.total = 2 + this.KEYS.length * 2; // 士兵2 + 全部僵尸/Boss
        }
        return Promise.allSettled(keys.flatMap(key => ['hero','lod'].map(lod=>new Promise((resolve,reject)=>{
            var category=['normal','fast','shield','split','spitter','elite'].includes(key)?'zombies':'bosses';
            var url='assets/models/'+category+'/'+key+'/'+key+(lod==='lod'?'-lod':'')+'.glb';
            loader.load(url,g=>{
                try {
                    g.scene.updateMatrixWorld(true);
                    var bank={geometries:{},restMatrices:{},material:null,url:url};
                    for(var name of EnemyModelLoader.PARTS) {
                        var n=g.scene.getObjectByName(name);
                        if(!n || !n.isMesh || !n.geometry.index || !n.geometry.attributes.uv || !n.geometry.attributes.normal || Array.isArray(n.material)) throw Error(key+' invalid part '+name);
                        if(bank.material && bank.material!==n.material) throw Error(key+' material is not shared');
                        bank.material=n.material;
                        bank.geometries[name]=n.geometry;
                        bank.restMatrices[name]=n.matrixWorld.clone();
                    }
                    if(!bank.material.isMeshStandardMaterial || !bank.material.map || !bank.material.roughnessMap) throw Error(key+' missing PBR texture');
                    for(var tex of [bank.material.map,bank.material.roughnessMap]) if(!tex.image || !tex.image.width) throw Error(key+' image did not decode');
                    loaded.push(g.scene);
                    resolve({key,lod,bank});
                }catch(e){SoldierModelLoader._disposeScene(g.scene);reject(e);}
            },undefined,ev=>{
                if (window.__BootProgress && ev) window.__BootProgress.file(url, ev.loaded || 0, ev.total || 1);
            },e=>reject(Error('Enemy asset failed: '+url+' '+(e.message||e))));
        })))).then(results=>{
            var fail=results.find(r=>r.status==='rejected');
            if(fail)throw fail.reason;
            var styles={};
            for(var r of results) {var v=r.value;(styles[v.key]||(styles[v.key]={}))[v.lod]=v.bank;}
            for(var key of keys) {
                var h=styles[key].hero,l=styles[key].lod;
                if(l.material!==h.material)SoldierModelLoader._disposeMaterial(l.material);
                l.material=h.material;
                h.material.onBeforeCompile=function(shader){shader.fragmentShader=shader.fragmentShader.replace('#include <encodings_fragment>','gl_FragColor = LinearTosRGB( gl_FragColor );');};
                if(['spitter','spitking','hivelord','overlord'].includes(key)) {
                    var image=h.material.map.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
                    var ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);var pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
                    for(var py=0;py<canvas.height;py++)for(var px=0;px<canvas.width;px++) {
                        if(px<canvas.width*.75 || py<canvas.height*.25 || py>=canvas.height*.5) {
                            var off=(py*canvas.width+px)*4;pixels.data[off]=pixels.data[off+1]=pixels.data[off+2]=0;
                        }
                    }
                    ctx.putImageData(pixels,0,0);var emissive=new THREE.CanvasTexture(canvas);emissive.flipY=false;emissive.encoding=THREE.sRGBEncoding;
                    h.material.emissiveMap=emissive;h.material.emissive.setHex(0xffffff);h.material.emissiveIntensity=.65;
                    h.material.onBeforeCompile=function(shader){
                        shader.fragmentShader=shader.fragmentShader.replace('#include <encodings_fragment>','gl_FragColor = LinearTosRGB( gl_FragColor );');
                        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\n#ifdef USE_INSTANCING_COLOR\nfloat glowPower=max(totalEmissiveRadiance.r,max(totalEmissiveRadiance.g,totalEmissiveRadiance.b));\nif(vColor.r>1.25 && vColor.g<.8)totalEmissiveRadiance=vec3(1.,.08,.15)*glowPower;\nelse if(vColor.r>1.05 && vColor.g<.95 && vColor.b>1.15)totalEmissiveRadiance=vec3(.7,.15,1.)*glowPower;\n#endif');
                    };
                }
                h.material.customProgramCacheKey=function(){return 'v42-pbr-display';};
            }
            return styles;
        }).catch(e=>{loaded.forEach(s=>SoldierModelLoader._disposeScene(s));throw e;});
    }
    static get(){return this._data;}
};
EnemyModelLoader.PARTS=['Body','Head','Arms','LegL','LegR'];
EnemyModelLoader.KEYS=['normal','fast','shield','split','spitter','elite','bruiser','bulwark','spitking','hivelord','titan','overlord'];
EnemyModelLoader.status='idle';EnemyModelLoader.loadMs=0;

var EnemyArmyRenderer = class EnemyArmyRenderer {
    constructor(scene) {
        this.scene=scene;this.data=EnemyModelLoader.get();this.banks={};
        this._root=new THREE.Matrix4();this._matrix=new THREE.Matrix4();this._pose=new THREE.Matrix4();
        this._e=new THREE.Euler();this._color=new THREE.Color();this._counts={};
        this.shieldMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,20,12),new THREE.MeshBasicMaterial({color:0x57cfff,transparent:true,opacity:.14,depthWrite:false}),8);
        this.shieldMesh.count=0;this.shieldMesh.frustumCulled=false;this.shieldMesh.userData.artSource='V42 boss shield energy shell';scene.add(this.shieldMesh);
        this._shieldLocal=new THREE.Matrix4().makeScale(.65,.85,.60);this._shieldLocal.setPosition(0,.65,0);
    }
    _bank(style,lod) {
        // V5.1.5 防御: 未知风格回退normal(避免渲染循环每帧崩溃), 并告警暴露根因
        if(!this.data.styles[style]) {
            if(!this._warnedStyles) this._warnedStyles = {};
            if(!this._warnedStyles[style]) { this._warnedStyles[style] = 1; console.warn('[EnemyArmyRenderer] unknown style:', style); }
            style = 'normal';
        }
        var key=style+':'+lod;
        if(this.banks[key])return this.banks[key];
        var source=this.data.styles[style][lod],meshes={};
        for(var part of this.data.parts) {
            var m=new THREE.InstancedMesh(source.geometries[part],source.material,448); // V5.1.5: 单类型可堆448(320+活敌全同类型)
            m.name='Enemy_'+style+'_'+lod+'_'+part;m.count=0;m.frustumCulled=false;
            m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.setColorAt(0,new THREE.Color(1,1,1));
            m.userData.artSource=source.url;m.userData.collidable=false;
            this.scene.add(m);meshes[part]=m;
        }
        return this.banks[key]={meshes,source,count:0};
    }
    update(dt,time,enemies,squadZ) {
        var shieldCount=0;
        for(var k in this.banks)this.banks[k].count=0;
        for(var e of enemies) {
            if(e.removeReady || e.model.scale.x<.005)continue;
            var style=e.artStyle||e.type;
            var lod=e.isBoss?(Math.abs(e.z-squadZ)>42?'lod':'hero'):((enemies.length>40||Math.abs(e.z-squadZ)>22)?'lod':'hero');
            var bank=this._bank(style,lod),slot=bank.count++;
            if(slot>=448){bank.count=448;continue;}
            e.model.updateMatrix();this._root.copy(e.model.matrix);
            if(e.alive && e.shieldT>0 && shieldCount<8) {this._matrix.copy(this._root).multiply(this._shieldLocal);this.shieldMesh.setMatrixAt(shieldCount++,this._matrix);}
            var speed=e.type==='fast'?10:(e.isBoss?3:4.5),phase=time*speed+e.phase;
            var walk=e.dying?0:Math.sin(phase)*(.45*(e.frozenT>0?.3:1));
            var attack=e.attackT||0,charge=e.chargeT||0;
            this._color.setRGB(1,1,1);
            // V12视觉: 特殊体型染色(冰冻/受击闪烁随后覆盖)
            if(e.type==='elite')this._color.setRGB(1.22,1.08,.72);          // 精英金染
            else if(e.type==='bomber')this._color.setRGB(1.5,.55,.5);       // 自爆尸红染(fast模型区分)
            if(e.frozenT>0)this._color.setRGB(.50,.85,1.35);
            if(e.phaseIndex>=3)this._color.setRGB(1.35,.72,.75);
            else if(e.phaseIndex===2)this._color.setRGB(1.12,.85,1.2);
            if(e.hitFlash>0)this._color.setRGB(2.8,2.4,1.8);
            for(var part of this.data.parts) {
                this._pose.identity();
                if(part==='LegL'||part==='LegR')this._pose.makeRotationX(walk*(part==='LegL'?1:-1));
                else if(part==='Arms') {
                    this._e.set(-.12-Math.sin(phase)*.05-attack*.65-charge*.4,0,Math.sin(phase)*.04);
                    this._pose.makeRotationFromEuler(this._e);
                } else if(part==='Head') {
                    this._e.set(charge*.12,Math.sin(phase*.5)*.09,Math.sin(phase)*.025);
                    this._pose.makeRotationFromEuler(this._e);
                } else if(part==='Body'&&e.isBoss) {
                    this._pose.makeScale(1+charge*.035,1+charge*.05,1+charge*.035);
                }
                this._matrix.copy(this._root).multiply(bank.source.restMatrices[part]).multiply(this._pose);
                bank.meshes[part].setMatrixAt(slot,this._matrix);
                bank.meshes[part].setColorAt(slot,this._color);
            }
            e.renderBank=style+':'+lod;e.renderSlot=slot;
        }
        // V11.6: 实例缓冲前缀上传 — 原每帧全量上传448槽×5部件矩阵/颜色, 怪多时GPU带宽浪费
        for(var key in this.banks)for(var part of this.data.parts) {
            var mesh=this.banks[key].meshes[part],used=this.banks[key].count;
            mesh.count=used;mesh.visible=used>0;
            mesh.instanceMatrix.updateRange.offset=0;
            mesh.instanceMatrix.updateRange.count=used*16;
            mesh.instanceMatrix.needsUpdate=true;
            if(mesh.instanceColor){mesh.instanceColor.updateRange.offset=0;mesh.instanceColor.updateRange.count=used*3;mesh.instanceColor.needsUpdate=true;}
            mesh.castShadow=mesh.visible&&enemies.length<=20;
        }
        this.shieldMesh.count=shieldCount; // V11.6: 前缀上传
        this.shieldMesh.instanceMatrix.updateRange.count=shieldCount*16;
        this.shieldMesh.instanceMatrix.needsUpdate=true;
    }
    clear(){for(var key in this.banks)for(var p of this.data.parts)this.banks[key].meshes[p].count=0;this.shieldMesh.count=0;}
};


/* ===== [[ js/boss-v42.js ]] ===== */
// Boss abilities are part of an active encounter, never a second pacing wave.
var V42BossController = {
    update:function(e,dt,squad,manager,effects) {
        var fraction=Math.max(0,e.hp/e.maxHp), final=e.artStyle==='overlord';
        var phase=final?(fraction<=.33?3:fraction<=.66?2:1):(fraction<=.5?2:1);
        if(e.phaseIndex!==phase) {
            e.phaseIndex=phase;
            e.abilityTimer=.1;e.pendingAttack=null;e.chargeT=0;
            if(final&&phase>1)e.shieldT=0;
            effects.floatText(e.x,2.6,e.z,final?'核心阶段 '+phase:(phase===1?'领主出现':'强化阶段'),phase===3?'#ff666c':'#cb95ff',true);
            effects.shockwave(e.x,.04,e.z,phase===3?0xff5a65:0x9b78ff);
        }
        e.shieldT=Math.max(0,(e.shieldT||0)-dt);
        e.abilityTimer=(e.abilityTimer===undefined?3.5:e.abilityTimer)-dt;
        if(e.pendingAttack) {
            e.pendingAttack.t-=dt;e.chargeT=Math.min(1,1-e.pendingAttack.t/.95);
            if(e.pendingAttack.t<=0) {
                var a=e.pendingAttack;e.pendingAttack=null;e.chargeT=0;e.attackT=1;
                effects.shockwave(a.x,.06,a.z,e.phaseIndex>=3?0xff535f:0xffbe55);
                effects.burst(a.x,.3,a.z,0xffc558,12,3,.5);
                if(Math.abs(squad.x-a.x)<1.0&&Math.abs(squad.z-a.z)<1.6)squad.killSoldiers(final?7:3,effects);
            }
        }
        if(e.abilityTimer>0||e.pendingAttack)return;
        e.abilityTimer=final?(phase===3?2.6:4.4):(phase===2?3.8:5.0);
        var kind=e.artStyle;
        if(kind==='bulwark'||(final&&phase===1)) {
            e.shieldT=1.7;e.attackT=.7;
            effects.shockwave(e.x,.05,e.z,0x70d9ff);
        } else if(kind==='spitking') {
            e.chargeT=.8;
            for(var i=-1;i<=1;i++)manager.spawnSpit(e.x+i*.55,1.0,e.z,squad);
            effects.burst(e.x,1.1,e.z,0x9eff7b,6,2,.4);
        } else if(kind==='hivelord'||(final&&phase===2)) {
            var cap=Math.min(2,Math.max(0,24-manager.aliveCount)); // V5.1.3: 召唤压力再下调(Boss磨损5/s→3.75/s)
            for(var j=0;j<cap;j++)manager.spawnEnemy(j%2?'fast':'split',e.x+(j-1.5)*.65,e.z-2,phase===2?8:5);
            effects.shockwave(e.x,.05,e.z,0xbe79ff);
        } else {
            e.pendingAttack={t:.95,x:squad.x,z:squad.z};e.chargeT=0;
            effects.shockwave(squad.x,.045,squad.z,0xff616b);
            effects.floatText(squad.x,1.3,squad.z,'闪避冲击!','#ffb06c',false);
        }
    }
};


/* ===== [[ js/art-v42.js ]] ===== */
// ===== V4.2 presentation layer: gates, city dressing and UI composition =====
(function (global) {
    'use strict';

    var V42Art = {};
    var TAU = Math.PI * 2;

    var GATE_STYLES = {
        add:  { kind: 'common', title: '增援', frame: 0x2F77D0, dark: 0x173E82, light: 0x78E6FF, glass: 0x47BCEB },
        mul:  { kind: 'epic',   title: '倍增', frame: 0xEAAE32, dark: 0x8C4D13, light: 0xFFF09A, glass: 0xE8BC48 },
        buff: { kind: 'rare',   title: '强化', frame: 0x8454D6, dark: 0x43227C, light: 0xE8B8FF, glass: 0xA96DE1 },
        risk: { kind: 'danger', title: '风险', frame: 0xD94B55, dark: 0x711F35, light: 0xFF9C82, glass: 0xE45B68 }
    };

    function clampNumber(value, low, high) {
        return Math.max(low, Math.min(high, value));
    }

    function roundedRectGeometry(width, height, radius, depth) {
        var w2 = width * 0.5;
        var h2 = height * 0.5;
        var r = Math.min(radius, w2, h2);
        var shape = new THREE.Shape();
        shape.moveTo(-w2 + r, -h2);
        shape.lineTo(w2 - r, -h2);
        shape.quadraticCurveTo(w2, -h2, w2, -h2 + r);
        shape.lineTo(w2, h2 - r);
        shape.quadraticCurveTo(w2, h2, w2 - r, h2);
        shape.lineTo(-w2 + r, h2);
        shape.quadraticCurveTo(-w2, h2, -w2, h2 - r);
        shape.lineTo(-w2, -h2 + r);
        shape.quadraticCurveTo(-w2, -h2, -w2 + r, -h2);
        var geo = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            steps: 1,
            curveSegments: 2,
            bevelEnabled: true,
            bevelSegments: 1,
            bevelSize: Math.min(0.028, r * 0.35),
            bevelThickness: 0.025
        });
        geo.translate(0, 0, -depth * 0.5);
        return geo;
    }

    function applyTransform(geo, x, y, z, rx, ry, rz, sx, sy, sz) {
        if (sx !== undefined) geo.scale(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
        if (rx) geo.rotateX(rx);
        if (ry) geo.rotateY(ry);
        if (rz) geo.rotateZ(rz);
        geo.translate(x || 0, y || 0, z || 0);
        return geo;
    }

    function mergeColored(parts) {
        var geos = [];
        for (var i = 0; i < parts.length; i++) {
            geos.push(colorize(parts[i].geo, parts[i].color));
        }
        var merged = mergeGeometries(geos);
        for (var j = 0; j < geos.length; j++) geos[j].dispose();
        merged.computeBoundingSphere();
        return merged;
    }

    // This project pins r149, whose display chunk is encodings_fragment.
    // Match the GLB display transform while preserving legacy scenery shading.
    function preparePbr(material) {
        material.onBeforeCompile = function (shader, renderer) {
            if (renderer.outputEncoding !== THREE.LinearEncoding) return;
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <encodings_fragment>',
                'gl_FragColor = LinearTosRGB( gl_FragColor );'
            );
        };
        material.customProgramCacheKey = function () {
            return 'v42-pbr-r149-display';
        };
        material.userData.v42ColorManaged = true;
        return material;
    }

    function makeGateGlassTexture(style) {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        var c = new THREE.Color(style.glass);
        var rgb = Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255);
        var grad = ctx.createLinearGradient(0, 0, 256, 512);
        grad.addColorStop(0, 'rgba(255,255,255,.72)');
        grad.addColorStop(0.14, 'rgba(' + rgb + ',.48)');
        grad.addColorStop(0.72, 'rgba(' + rgb + ',.18)');
        grad.addColorStop(1, 'rgba(255,255,255,.38)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 512);
        ctx.strokeStyle = 'rgba(255,255,255,.28)';
        ctx.lineWidth = 3;
        for (var y = -220; y < 640; y += 92) {
            ctx.beginPath();
            ctx.moveTo(-30, y);
            ctx.lineTo(286, y + 160);
            ctx.stroke();
        }
        var edge = ctx.createLinearGradient(0, 0, 256, 0);
        edge.addColorStop(0, 'rgba(255,255,255,.7)');
        edge.addColorStop(.07, 'rgba(255,255,255,.08)');
        edge.addColorStop(.93, 'rgba(255,255,255,.05)');
        edge.addColorStop(1, 'rgba(255,255,255,.55)');
        ctx.fillStyle = edge;
        ctx.fillRect(0, 0, 256, 512);
        var texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        return texture;
    }

    function formatGateLabel(data) {
        if (data && data.label !== undefined && data.label !== null && String(data.label).trim()) {
            return String(data.label);
        }
        var value = data ? data.value : '';
        if (data && data.op === 'add') return '+' + value;
        if (data && data.op === 'mul') return '×' + value;
        return String(value === undefined ? '' : value);
    }

    function makeGateTextTexture(label, style) {
        var measure = document.createElement('canvas').getContext('2d');
        measure.font = '900 164px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
        var lines = [label];
        var fullWidth = measure.measureText(label).width;
        if (/\s/.test(label) && fullWidth > 650) {
            var words = label.trim().split(/\s+/);
            lines = [words.shift(), words.join(' ')];
        }
        var buffMatch=label.match(/^([\u4e00-\u9fff]+)([+×]\d+%?)$/);
        if(buffMatch)lines=[buffMatch[1],buffMatch[2]];
        var measuredWidth = 0;
        for (var li = 0; li < lines.length; li++) {
            measuredWidth = Math.max(measuredWidth, measure.measureText(lines[li]).width);
        }
        var canvas = document.createElement('canvas');
        // Crop short values much tighter than long Chinese buffs. The sprite can
        // then use the full pane width without making "+25" look like footnote text.
        canvas.width = Math.round(clampNumber(measuredWidth + 190, 480, 1024));
        canvas.height = 256;
        var ctx = canvas.getContext('2d');
        var glow = new THREE.Color(style.light);
        var frame = new THREE.Color(style.dark);
        var glowCss = '#' + glow.getHexString();
        var frameCss = '#' + frame.getHexString();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var panel = ctx.createLinearGradient(0, 20, 0, 238);
        // V12视觉: 面板加深提高文字对比(浅色玻璃上白字不再发虚)
        panel.addColorStop(0, 'rgba(255,255,255,.16)');
        panel.addColorStop(0.46, 'rgba(8,17,44,.74)');
        panel.addColorStop(1, 'rgba(4,10,28,.55)');
        ctx.fillStyle = panel;
        ctx.strokeStyle = 'rgba(255,255,255,.62)';
        ctx.lineWidth = 7;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(24, 24, canvas.width - 48, 208, 42);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(24, 24, canvas.width - 48, 208);
            ctx.strokeRect(24, 24, canvas.width - 48, 208);
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 30px "Microsoft YaHei", Arial, sans-serif';
        ctx.letterSpacing = '7px';
        ctx.fillStyle = glowCss;
        if (lines.length === 1) {
            ctx.fillText('◆  ' + style.title + '  ◆', canvas.width * 0.5, 62);
        }

        ctx.letterSpacing='0px';
        var fontSize = lines.length > 1 ? 128 : 164;
        var maxWidth = canvas.width - 112;
        do {
            ctx.font = '900 ' + fontSize + 'px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
            var widest = 0;
            for (var ti = 0; ti < lines.length; ti++) widest = Math.max(widest, ctx.measureText(lines[ti]).width);
            if (widest <= maxWidth) break;
            fontSize -= 4;
        } while (fontSize > 54);
        ctx.lineJoin = 'round';
        ctx.strokeStyle = frameCss;
        ctx.lineWidth = Math.max(6, fontSize * 0.065);
        ctx.shadowColor = glowCss;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFFFFF';
        if (lines.length > 1) {
            ctx.strokeText(lines[0], canvas.width * 0.5, 78);
            ctx.fillText(lines[0], canvas.width * 0.5, 78);
            ctx.strokeText(lines[1], canvas.width * 0.5, 178);
            ctx.fillText(lines[1], canvas.width * 0.5, 178);
        } else {
            ctx.strokeText(label, canvas.width * 0.5, 157);
            ctx.fillText(label, canvas.width * 0.5, 157);
        }
        ctx.shadowBlur = 0;

        var texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.userData.v42Multiline = lines.length > 1;
        return texture;
    }

    function addGateOrnament(parts, style, op, width) {
        var topY = 1.88;
        if (op === 'mul') {
            var crown = new THREE.OctahedronGeometry(0.15, 0);
            applyTransform(crown, 0, topY, 0, 0, 0, Math.PI * 0.25, 1.2, 1.0, 0.75);
            parts.push({ geo: crown, color: style.light });
            for (var x = -1; x <= 1; x += 2) {
                var fin = new THREE.ConeGeometry(0.075, 0.22, 4);
                applyTransform(fin, x * width * 0.31, 1.87, 0, 0, 0, x * -0.22);
                parts.push({ geo: fin, color: style.light });
            }
        } else if (op === 'buff') {
            var gem = new THREE.OctahedronGeometry(0.17, 0);
            applyTransform(gem, 0, topY, 0, 0, 0, Math.PI * 0.25, 0.86, 1.25, 0.7);
            parts.push({ geo: gem, color: style.light });
            var halo = new THREE.TorusGeometry(0.23, 0.025, 5, 16);
            applyTransform(halo, 0, topY, -0.025, 0, 0, 0);
            parts.push({ geo: halo, color: style.light });
        } else if (op === 'risk') {
            var core = new THREE.OctahedronGeometry(0.14, 0);
            applyTransform(core, 0, 1.87, 0, 0, 0, Math.PI * 0.25);
            parts.push({ geo: core, color: style.light });
            for (var s = -1; s <= 1; s += 2) {
                var spike = new THREE.ConeGeometry(0.07, 0.28, 5);
                applyTransform(spike, s * 0.25, 1.89, 0, 0, 0, s * -0.65);
                parts.push({ geo: spike, color: style.light });
            }
        } else {
            var crest = new THREE.IcosahedronGeometry(0.15, 1);
            applyTransform(crest, 0, topY, 0, 0, 0, 0, 1.05, 1.18, 0.72);
            parts.push({ geo: crest, color: style.light });
            for (var w = -1; w <= 1; w += 2) {
                var wing = new THREE.BoxGeometry(0.22, 0.045, 0.06);
                applyTransform(wing, w * 0.22, 1.87, 0, 0, 0, w * 0.35);
                parts.push({ geo: wing, color: style.light });
            }
        }
    }

    V42Art.createGateModel = function (gateData, gateWidth) {
        gateData = gateData || { op: 'add', value: 1, label: '+1' };
        var style = GATE_STYLES[gateData.op] || GATE_STYLES.add;
        // ExtrudeGeometry's size + thickness bevel envelope adds ~.065 per edge.
        // Capping the design width at 1.77 keeps the measured Box3 <= 1.9.
        var width = clampNumber(Number(gateWidth) || 1.8, 1.35, 1.77);
        var group = new THREE.Group();
        var frameParts = [];
        var trimParts = [];
        var postW = 0.22;
        var postH = 1.68;

        frameParts.push({ geo: applyTransform(roundedRectGeometry(postW, postH, 0.09, 0.24), -width * 0.5 + postW * 0.5, 0.90, 0), color: style.frame });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(postW, postH, 0.09, 0.24),  width * 0.5 - postW * 0.5, 0.90, 0), color: style.frame });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(width, 0.22, 0.09, 0.25), 0, 1.74, 0), color: style.frame });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.30, 0.16, 0.07, 0.32), -width * 0.5 + postW * 0.5, 0.11, 0.01), color: style.dark });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.30, 0.16, 0.07, 0.32),  width * 0.5 - postW * 0.5, 0.11, 0.01), color: style.dark });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(width * 0.48, 0.11, 0.05, 0.28), 0, 1.84, 0), color: style.dark });

        var insetX = width * 0.5 - 0.155;
        trimParts.push({ geo: applyTransform(roundedRectGeometry(0.034, 1.42, 0.014, 0.035), -insetX, 0.94, -0.145), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(0.034, 1.42, 0.014, 0.035),  insetX, 0.94, -0.145), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(width - 0.30, 0.034, 0.014, 0.035), 0, 1.64, -0.145), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(width - 0.30, 0.034, 0.014, 0.035), 0, 0.24, -0.145), color: style.light });
        addGateOrnament(trimParts, style, gateData.op, width);

        var frameMat = preparePbr(new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.29,
            metalness: 0.43,
            emissive: new THREE.Color(style.dark),
            emissiveIntensity: 0.13
        }));
        var frame = new THREE.Mesh(mergeColored(frameParts), frameMat);
        frame.castShadow = true;
        frame.receiveShadow = true;
        group.add(frame);

        var trimMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
        var trim = new THREE.Mesh(mergeColored(trimParts), trimMat);
        group.add(trim);

        var glassTexture = makeGateGlassTexture(style);
        var glassMat = preparePbr(new THREE.MeshPhysicalMaterial({
            color: style.glass,
            map: glassTexture,
            transparent: true,
            opacity: 0.5,
            roughness: 0.13,
            metalness: 0.04,
            clearcoat: 0.8,
            clearcoatRoughness: 0.18,
            emissive: new THREE.Color(style.glass).multiplyScalar(0.28),
            emissiveIntensity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false
        }));
        var glass = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.31, 1.39), glassMat);
        glass.position.set(0, 0.94, -0.105);
        group.add(glass);

        // Keep every visible component, including the soft floor wash, inside
        // the single-lane 1.9-unit footprint.
        var glowPlane = new THREE.PlaneGeometry(Math.min(1.9, width + 0.08), 0.62);
        var ringGeo = new THREE.RingGeometry(width * 0.31, width * 0.47, 28);
        var groundGeo = mergeGeometries([colorize(glowPlane, style.glass), colorize(ringGeo, style.light)]);
        glowPlane.dispose();
        ringGeo.dispose();
        var groundMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.24,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
        });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI * 0.5;
        ground.position.y = 0.015;
        group.add(ground);

        var labelTexture = makeGateTextTexture(formatGateLabel(gateData), style);
        var labelMat = new THREE.SpriteMaterial({
            map: labelTexture,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            toneMapped: false,
            fog: false // V5.0: 门文字不受雾影响, 远距离仍清晰可读(玩法可读性)
        });
        var label = new THREE.Sprite(labelMat);
        var labelWidth = width - 0.30;
        var labelHeight = labelWidth * labelTexture.image.height / labelTexture.image.width;
        if (labelTexture.userData.v42Multiline) labelHeight = Math.max(labelHeight, 0.72);
        label.scale.set(labelWidth, labelHeight, 1);
        // V5.0: 文字置于玻璃前侧(-0.105为玻璃), 避免金/红等亮色玻璃洗白文字
        label.position.set(0, 1.03, -0.055);
        label.renderOrder = 3;
        group.add(label);

        group.userData.artSource = 'V42Art.createGateModel/' + style.kind + '/procedural-beveled-PBR';
        group.userData.qualityKind = style.kind;
        group.userData.label = label;
        group.userData.labelBaseY = 1.03;
        group.userData.glass = glass;
        group.userData.glow = ground;
        group.userData.ring = ground;
        group.userData.drawCalls = 5;
        group.userData.ownsResources = true;
        return group;
    };

    /** V12视觉: 精英身份光环 — 贴地金环+缓流入内圈; 共享几何/材质(调用方不dispose, 无泄漏) */
    V42Art.createEliteAura = function () {
        if (!V42Art._eliteAuraGeo) {
            V42Art._eliteAuraGeo = mergeGeometries([
                colorize(new THREE.RingGeometry(0.62, 0.78, 28), 0xFFC247),
                colorize(new THREE.RingGeometry(0.30, 0.38, 22), 0xFFE28A)
            ]);
            V42Art._eliteAuraMat = new THREE.MeshBasicMaterial({
                vertexColors: true, transparent: true, opacity: 0.55,
                side: THREE.DoubleSide, depthWrite: false, toneMapped: false
            });
            V42Art._eliteAuraGeo.userData = { artSource: 'js/art-v42.js:createEliteAura() 共享金环' };
        }
        var mesh = new THREE.Mesh(V42Art._eliteAuraGeo, V42Art._eliteAuraMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.renderOrder = 2;
        return mesh;
    };

    function seededRandom(seed) {
        var state = seed >>> 0;
        return function () {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }

    function makeCityMaterial(color, options) {
        options = options || {};
        return preparePbr(new THREE.MeshStandardMaterial({
            color: color,
            roughness: options.roughness === undefined ? 0.74 : options.roughness,
            metalness: options.metalness || 0,
            emissive: options.emissive || 0x000000,
            emissiveIntensity: options.emissiveIntensity || 0
        }));
    }

    function makeFacadeTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#e5e9e4';
        ctx.fillRect(0, 0, 256, 512);
        for (var floor = 0; floor < 4; floor++) {
            var y = 18 + floor * 120;
            ctx.fillStyle = '#b5bfbb';
            ctx.fillRect(0, y + 90, 256, 5);
            ctx.fillStyle = '#f6f4e9';
            ctx.fillRect(0, y + 95, 256, 7);
            for (var col = 0; col < 3; col++) {
                var x = 18 + col * 80;
                ctx.fillStyle = '#899996';
                ctx.fillRect(x - 4, y - 4, 64, 84);
                ctx.fillStyle = '#283e48';
                ctx.fillRect(x, y, 56, 74);
                ctx.fillStyle = floor % 2 === col % 2 ? '#a3ccd1' : '#57818b';
                ctx.fillRect(x + 5, y + 4, 46, 32);
                ctx.fillStyle = '#d6e5df';
                ctx.fillRect(x + 26, y, 4, 74);
                ctx.fillRect(x, y + 35, 56, 4);
                ctx.fillStyle = '#f7f4e8';
                ctx.fillRect(x - 7, y + 77, 70, 6);
            }
        }
        var tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 4;
        return tex;
    }

    function makeShopTexture(text, color) {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = '#ecf3e9';
        ctx.lineWidth = 5;
        ctx.strokeRect(8, 8, 496, 112);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 68px "Microsoft YaHei", Arial, sans-serif';
        ctx.fillText(text, 256, 67, 460);
        return new THREE.CanvasTexture(canvas);
    }

    function addStreetDetails(env, buildings, random) {
        var solids = [], glass = [], trims = [], foliage = [], wheels = [];
        var signs = [[], [], []], canopies = [], awningStripes = [], markings = [];
        var box = new THREE.BoxGeometry(1, 1, 1);
        function record(x, y, z, sx, sy, sz, ry) {
            return { x: x, y: y, z: z, sx: sx, sy: sy, sz: sz, ry: ry || 0 };
        }
        for (var i = 0; i < buildings.length; i++) {
            var b = buildings[i], inner = b.x - b.s * (b.w * .558 + .035);
            // Shops and their awnings face the road; the combat lanes stay clear.
            glass.push(record(inner, .92, b.z, .035, 1.45, b.sz * .77));
            trims.push(record(inner - b.s * .025, .17, b.z, .12, .16, b.sz * .86));
            for (var f = -1; f <= 1; f++) {
                trims.push(record(inner - b.s * .04, .92, b.z + f * b.sz * .32, .09, 1.55, .06));
            }
            canopies.push(record(inner - b.s * .35, 1.95, b.z, .85, .14, b.sz * .91));
            for (var st = 0; st < 7; st++) {
                awningStripes.push(record(inner - b.s * .35, 2.027, b.z + (st - 3) * b.sz * .13, .86, .018, b.sz * .055));
            }
            signs[i % 3].push(record(inner - b.s * .06, 2.36, b.z, 2.6, .56, 1, -b.s * Math.PI / 2));
            solids.push(record(b.x, b.h + .28, b.z, b.w * .38, .45, b.sz * .35));
            if (i % 2 === 0) {
                var pz = b.z + b.sz * .63;
                solids.push(record(b.s * 5.05, .19, pz, .7, .35, 1.3));
                foliage.push(record(b.s * 5.05, .49, pz, .7, .52, 1.25));
            }
            if (i % 4 === 1) {
                solids.push(record(b.s * 4.9, .28, b.z - 1.3, .8, .45, 1.25));
                trims.push(record(b.s * 4.9, .53, b.z - 1.3, .82, .07, 1.28));
                for (var h = -1; h <= 1; h += 2) {
                    markings.push(record(b.s * 4.9, .54, b.z - 1.3 + h * .42, .84, .02, .1));
                }
            }
            if (i % 5 === 2) {
                var carX = b.s * 5.8, carZ = b.z + 2.9;
                canopies.push(record(carX, .44, carZ, 1.05, .45, 1.95));
                glass.push(record(carX, .83, carZ - .12, .86, .38, .92));
                trims.push(record(carX, .28, carZ + 1, 1, .15, .12));
                for (var side = -1; side <= 1; side += 2) {
                    for (var axle = -1; axle <= 1; axle += 2) {
                        wheels.push(record(carX + side * .54, .24, carZ + axle * .65, .16, .38, .38));
                    }
                }
            }
        }
        // Street furniture is batched by surface, not by individual object.
        addInstancedCategory(env, 'street-concrete', box, makeCityMaterial(0x9AAFAA), solids, { receiveShadow: true });
        addInstancedCategory(env, 'shop-windows', box, makeCityMaterial(0x325D6A, { roughness: .24, metalness: .18 }), glass);
        addInstancedCategory(env, 'shop-frames', box, makeCityMaterial(0xDDE3DB), trims);
        addInstancedCategory(env, 'striped-awnings', box, makeCityMaterial(0xBB4E53), canopies, { castShadow: true });
        addInstancedCategory(env, 'awning-stripes', box, makeCityMaterial(0xF6EFE4), awningStripes);
        addInstancedCategory(env, 'planter-shrubs', new THREE.IcosahedronGeometry(.65, 1), makeCityMaterial(0x407B59), foliage);
        addInstancedCategory(env, 'parked-car-wheels', box, makeCityMaterial(0x283239), wheels);
        addInstancedCategory(env, 'street-reflectors', box, new THREE.MeshBasicMaterial({ color: 0xFFD365 }), markings);
        var labels = ['CITY MART', '补给站', 'METRO  03'];
        var colors = ['#386f67', '#ac4d4c', '#3b607f'];
        for (var s = 0; s < signs.length; s++) {
            addInstancedCategory(env, 'shop-sign-' + s, new THREE.PlaneGeometry(1, 1),
                new THREE.MeshBasicMaterial({ map: makeShopTexture(labels[s], colors[s]), side: THREE.DoubleSide }), signs[s]);
        }
        var skyline = makeRecords(32, function (i) {
            var h = 7 + random() * 10;
            return record((i % 2 ? 1 : -1) * (14 + random() * 9), h * .5, 10 - i * 5.2, 3 + random() * 3, h, 3 + random() * 3);
        });
        addInstancedCategory(env, 'distant-skyline', box, makeCityMaterial(0x7C9BA5), skyline);
    }

    function addInstancedCategory(env, name, geometry, material, records, options) {
        options = options || {};
        var mesh = new THREE.InstancedMesh(geometry, material, records.length);
        mesh.name = 'v42-' + name;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.castShadow = !!options.castShadow;
        mesh.receiveShadow = !!options.receiveShadow;
        mesh.frustumCulled = false;
        mesh.userData.artSource = 'V42Art.buildEnvironment/instanced-' + name;
        mesh.userData.collidable = false;
        env.root.add(mesh);
        var entry = { mesh: mesh, records: records };
        env.entries.push(entry);
        env.drawCalls++;
        return entry;
    }

    function setRecordMatrix(entry, index, tempObject) {
        var r = entry.records[index];
        tempObject.position.set(r.x, r.y, r.z);
        tempObject.rotation.set(r.rx || 0, r.ry || 0, r.rz || 0);
        tempObject.scale.set(r.sx || 1, r.sy || 1, r.sz || 1);
        tempObject.updateMatrix();
        entry.mesh.setMatrixAt(index, tempObject.matrix);
    }

    function makeRecords(count, maker) {
        var result = [];
        for (var i = 0; i < count; i++) result.push(maker(i));
        return result;
    }

    V42Art.buildEnvironment = function (world) {
        if (!world || !world.scene) return null;
        if (world._v42Environment && world._v42Environment.root) {
            world.scene.remove(world._v42Environment.root);
        }
        world.decoItems = [];
        world.buildings = [];
        world.clouds = [];

        var random = seededRandom(42042);
        var root = new THREE.Group();
        root.name = 'v42-environment';
        root.userData.artSource = 'V42Art.buildEnvironment/procedural-instanced-city';
        root.userData.collidable = false;
        world.scene.add(root);

        var env = {
            root: root,
            entries: [],
            drawCalls: 0,
            span: 170,
            front: 18,
            tempObject: new THREE.Object3D(),
            lastSquadZ: Number.POSITIVE_INFINITY,
            update: function (squadZ) { V42Art.updateEnvironment(world, squadZ); }
        };
        world._v42Environment = env;

        var facade = makeFacadeTexture();
        var cream = makeCityMaterial(0xD8E0DC);
        var teal = makeCityMaterial(0x8AB8AF, { roughness: 0.68 });
        var coral = makeCityMaterial(0xD7A29B);
        cream.map = teal.map = coral.map = facade;
        var leaf = makeCityMaterial(0x70A77B, { roughness: 0.9 });
        var trunk = makeCityMaterial(0x8B684B, { roughness: 0.92 });
        var glass = makeCityMaterial(0x93C6C7, { roughness: 0.22, metalness: 0.18 });
        var warmLight = new THREE.MeshBasicMaterial({ color: 0xFFE5A3, toneMapped: false });
        var charcoal = makeCityMaterial(0x304552, { roughness: 0.5, metalness: 0.25 });
        // V5.0: 云朵不受雾影响并加自发光, 修复远景发灰像岩石
        var cloudMat = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF, emissive: 0xB8C4CC, emissiveIntensity: 0.55,
            transparent: true, opacity: 0.92, fog: false
        });

        var roadside = makeRecords(54, function (i) {
            var side = i % 2 ? 1 : -1;
            return { x: side * (4.8 + random() * .4), y: 0, z: 10 - i * 3.08 + random() * .5, s: side };
        });
        var treeBase = roadside.filter(function (_, i) { return i % 3 === 0; });
        var lampBase = roadside.filter(function (_, i) { return i % 3 === 1; });
        var propBase = roadside.filter(function (_, i) { return i % 3 === 2; });

        addInstancedCategory(env, 'tree-trunks', new THREE.CylinderGeometry(0.11, 0.16, 0.74, 7), trunk,
            treeBase.map(function (r) { return { x: r.x, y: 0.37, z: r.z, sx: 1, sy: 1, sz: 1 }; }), { castShadow: true });
        addInstancedCategory(env, 'tree-canopies', new THREE.IcosahedronGeometry(0.55, 1), leaf,
            treeBase.map(function (r, i) { return { x: r.x, y: 1.13, z: r.z, sx: 1.05, sy: 1.32 + (i % 2) * 0.12, sz: 0.92, ry: random() * TAU }; }), { castShadow: true });
        addInstancedCategory(env, 'tree-crowns', new THREE.IcosahedronGeometry(0.34, 1), leaf,
            treeBase.map(function (r, i) { return { x: r.x + r.s * 0.12, y: 1.61, z: r.z + 0.04, sx: 0.9, sy: 1.1, sz: 0.9, ry: i }; }));

        addInstancedCategory(env, 'lamp-poles', new THREE.CylinderGeometry(0.045, 0.065, 2.15, 7), charcoal,
            lampBase.map(function (r) { return { x: r.x, y: 1.075, z: r.z }; }));
        addInstancedCategory(env, 'lamp-heads', roundedRectGeometry(0.34, 0.12, 0.04, 0.16), warmLight,
            lampBase.map(function (r) { return { x: r.x - r.s * 0.12, y: 2.08, z: r.z, ry: r.s > 0 ? 0 : Math.PI }; }));

        addInstancedCategory(env, 'parked-cars', roundedRectGeometry(0.86, 0.42, 0.12, 1.45), coral,
            propBase.filter(function (_, i) { return i % 3 === 0; }).map(function (r) { return { x: r.x + r.s * 0.2, y: 0.36, z: r.z, sx: 1, sy: 1, sz: 1, ry: r.s * 0.1 }; }), { castShadow: true });
        addInstancedCategory(env, 'car-glass', roundedRectGeometry(0.68, 0.24, 0.08, 0.58), glass,
            propBase.filter(function (_, i) { return i % 3 === 0; }).map(function (r) { return { x: r.x + r.s * 0.2, y: 0.67, z: r.z - 0.08, sx: 1, sy: 1, sz: 1, ry: r.s * 0.1 }; }));
        addInstancedCategory(env, 'cones', new THREE.ConeGeometry(0.13, 0.42, 7), coral,
            propBase.filter(function (_, i) { return i % 3 === 1; }).map(function (r) { return { x: r.x, y: 0.21, z: r.z, ry: random() * TAU }; }));
        addInstancedCategory(env, 'barriers', roundedRectGeometry(0.96, 0.27, 0.07, 0.14), cream,
            propBase.filter(function (_, i) { return i % 3 === 2; }).map(function (r) { return { x: r.x, y: 0.42, z: r.z, ry: r.s > 0 ? -0.15 : 0.15 }; }), { castShadow: true });

        var buildings = makeRecords(44, function (i) {
            var side = i % 2 ? 1 : -1;
            var h = 3.4 + random() * 4.6;
            var w = 2.4 + random() * 1.2;
            return { x: side * (7.4 + random() * .9), y: h * .5, z: 12 - i * 3.84,
                sx: w, sy: h, sz: 4.5 + random() * 1.4, h: h, w: w, s: side };
        });
        var buildingGeo = roundedRectGeometry(1, 1, 0.08, 1);
        addInstancedCategory(env, 'cream-buildings', buildingGeo, cream,
            buildings.filter(function (_, i) { return i % 3 === 0; }));
        addInstancedCategory(env, 'teal-buildings', roundedRectGeometry(1, 1, 0.08, 1), teal,
            buildings.filter(function (_, i) { return i % 3 === 1; }));
        addInstancedCategory(env, 'coral-buildings', roundedRectGeometry(1, 1, 0.08, 1), coral,
            buildings.filter(function (_, i) { return i % 3 === 2; }));

        // A single overhanging cap gives the skyline a deliberate toy-city
        // silhouette without multiplying each building into several meshes.
        addInstancedCategory(env, 'roof-trims', new THREE.BoxGeometry(1, 0.14, 1), teal,
            buildings.map(function (b) {
                return {
                    x: b.x,
                    y: b.h * 1.06,
                    z: b.z,
                    sx: b.w * 1.08,
                    sy: 1,
                    sz: b.sz * 1.07
                };
            }));

        var windows = [];
        for (var bi = 0; bi < buildings.length; bi++) {
            var b = buildings[bi];
            for (var row = 0; row < 4; row++) {
                windows.push({
                    // Face the road rather than +Z: the runner sees the inner
                    // side walls most clearly in the portrait perspective.
                    x: b.x - b.s * (b.w * 0.558),
                    y: 1.1 + row * Math.max(0.75, b.h * 0.18),
                    z: b.z - b.sz * 0.22,
                    sx: 0.38,
                    sy: 0.46,
                    sz: 1,
                    ry: -b.s * Math.PI * 0.5
                });
                windows.push({
                    x: b.x - b.s * (b.w * 0.558),
                    y: 1.1 + row * Math.max(0.75, b.h * 0.18),
                    z: b.z + b.sz * 0.22,
                    sx: 0.38,
                    sy: 0.46,
                    sz: 1,
                    ry: -b.s * Math.PI * 0.5
                });
            }
        }
        addInstancedCategory(env, 'windows', new THREE.PlaneGeometry(1, 1), warmLight, windows);

        addStreetDetails(env, buildings, random);

        var clouds = makeRecords(12, function (i) {
            var side = i % 2 ? 1 : -1;
            return { x: side * (3 + random() * 7), y: 8.5 + random() * 3.8, z: 14 - i * 13.4, sx: 1.4 + random() * 1.2, sy: 0.75 + random() * 0.4, sz: 0.8 + random() * 0.4, ry: random() * TAU };
        });
        addInstancedCategory(env, 'clouds', new THREE.IcosahedronGeometry(0.78, 1), cloudMat, clouds);

        for (var ei = 0; ei < env.entries.length; ei++) {
            var entry = env.entries[ei];
            for (var ri = 0; ri < entry.records.length; ri++) setRecordMatrix(entry, ri, env.tempObject);
            entry.mesh.instanceMatrix.needsUpdate = true;
        }
        root.userData.drawCalls = env.drawCalls;
        return env;
    };

    V42Art.updateEnvironment = function (world, squadZ) {
        var env = world && world._v42Environment;
        if (!env || !isFinite(squadZ)) return;
        if (Math.abs(squadZ - env.lastSquadZ) < 0.2) return;
        env.lastSquadZ = squadZ;
        var back = squadZ - (env.span - env.front);
        var front = squadZ + env.front;
        for (var ei = 0; ei < env.entries.length; ei++) {
            var entry = env.entries[ei];
            var changed = false;
            for (var ri = 0; ri < entry.records.length; ri++) {
                var record = entry.records[ri];
                var oldZ = record.z;
                if (record.z > front) record.z -= env.span * Math.ceil((record.z - front) / env.span);
                else if (record.z < back) record.z += env.span * Math.ceil((back - record.z) / env.span);
                if (record.z !== oldZ) {
                    setRecordMatrix(entry, ri, env.tempObject);
                    changed = true;
                }
            }
            if (changed) entry.mesh.instanceMatrix.needsUpdate = true;
        }
    };

    function makeElement(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function appendOnce(parent, id, node) {
        if (!parent || document.getElementById(id)) return document.getElementById(id);
        node.id = id;
        parent.appendChild(node);
        return node;
    }

    V42Art.installUI = function (game) {
        var container = document.getElementById('game-container');
        if (!container) return false;
        container.classList.add('v42-ui');

        var startPanel = document.querySelector('#start-screen .title-panel');
        if (startPanel && !document.getElementById('v42-brand')) {
            // V11 QA修复[P3]: 版本标识原硬编码V8.0.1, 改读package.json版本号(构建内联)并回退
            var gameVersion = (window.__GAME_VERSION || 'V11').toUpperCase();
            var brand = makeElement('div', 'v42-brand', '膨胀小队 · ' + gameVersion + ' 正式版');
            brand.id = 'v42-brand';
            startPanel.insertBefore(brand, startPanel.firstChild);
        }
        // V5.0: 首页顶栏 — 最高纪录 + 音效开关(任务书9.1)
        if (startPanel && !document.getElementById('v42-home-top')) {
            var homeTop = makeElement('div', 'v42-home-top');
            homeTop.id = 'v42-home-top';
            var best = makeElement('span', 'v42-best-record', '🏆 最高纪录: 第1关');
            best.id = 'v42-best-record';
            var soundBtn = makeElement('button', 'v42-home-sound', '🔊');
            soundBtn.id = 'btn-home-sound';
            soundBtn.setAttribute('aria-label', '音效开关');
            // V5.1: 金币 + 升级商店 + 免费补给
            var left = makeElement('div', 'v42-home-left');
            left.appendChild(best);
            var supplyBtn = makeElement('button', 'v51-supply-btn', '🎁 免费补给');
            supplyBtn.id = 'btn-free-supply';
            supplyBtn.setAttribute('aria-label', '每日免费补给(广告)');
            left.appendChild(supplyBtn);
            homeTop.appendChild(left);
            var right = makeElement('div', 'v42-home-right');
            var coinPill = makeElement('span', 'v51-coin-pill');
            coinPill.innerHTML = '🪙 <b data-coin-display>0</b>';
            right.appendChild(coinPill);
            var shopBtn = makeElement('button', 'v51-shop-btn', '⬆ 升级');
            shopBtn.id = 'btn-open-shop';
            right.appendChild(shopBtn);
            right.appendChild(soundBtn);
            homeTop.appendChild(right);
            startPanel.insertBefore(homeTop, startPanel.firstChild.nextSibling);
        }
        var title = document.querySelector('.game-title');
        if (title) title.textContent = '膨胀小队';
        var subtitle = document.querySelector('.game-subtitle');
        if (subtitle) subtitle.textContent = '城市突围 · 招募火力 · 击破核心';
        var startButton = document.getElementById('btn-start');
        if (startButton) startButton.textContent = '部署小队  →';

        if (startPanel && !document.getElementById('v42-mission-card')) {
            var mission = makeElement('section', 'v42-mission-card');
            mission.id = 'v42-mission-card';
            mission.setAttribute('aria-label', '任务简报');
            var missionTop = makeElement('div', 'v42-mission-topline');
            missionTop.appendChild(makeElement('span', 'v42-mission-label', '当前行动'));
            missionTop.appendChild(makeElement('span', 'v42-live-pill', '●  READY'));
            mission.appendChild(missionTop);
            mission.appendChild(makeElement('strong', 'v42-mission-title', '穿越增益门，扩大编队')); 
            mission.appendChild(makeElement('p', 'v42-mission-copy', '选择路线，叠加人数与火力，在终点击破首领核心。'));
            startPanel.insertBefore(mission, startButton);
        }
        if (startPanel && !document.getElementById('v42-controls')) {
            var controls = makeElement('div', 'v42-controls');
            controls.id = 'v42-controls';
            controls.setAttribute('aria-label', '操作方式');
            controls.appendChild(makeElement('span', 'v42-control-pill', '↔ 拖动变道'));
            controls.appendChild(makeElement('span', 'v42-control-pill', '◆ 选择状态门'));
            var hint = startPanel.querySelector('.hint-text');
            if (hint) hint.replaceWith(controls); else startPanel.appendChild(controls);
        }

        var levelName = document.getElementById('level-name');
        if (levelName && !document.getElementById('level-subtitle')) {
            var levelSubtitle = makeElement('div', 'v42-level-subtitle', '城市战区 · 突围中');
            levelSubtitle.id = 'level-subtitle';
            levelName.insertAdjacentElement('afterend', levelSubtitle);
        }
        var hud = document.getElementById('hud');
        if (hud) appendOnce(hud, 'v42-wave-banner', makeElement('div', 'v42-wave-banner hidden', '下一波接敌 · 2秒'));

        var bossInfo = document.getElementById('boss-info');
        if (bossInfo && !document.getElementById('boss-phase')) {
            var phase = makeElement('span', 'v42-boss-phase', '阶段 1');
            phase.id = 'boss-phase';
            var bossName = document.getElementById('boss-name');
            if (bossName) bossName.appendChild(phase); else bossInfo.insertBefore(phase, bossInfo.firstChild);
        }

        var pausePanel = document.querySelector('#pause-screen .title-panel');
        if (pausePanel && !pausePanel.querySelector('.v42-panel-kicker')) {
            pausePanel.insertBefore(makeElement('div', 'v42-panel-kicker', '行动已冻结'), pausePanel.firstChild);
        }
        var winPanel = document.querySelector('#win-screen .title-panel');
        if (winPanel && !winPanel.querySelector('.v42-panel-kicker')) {
            winPanel.insertBefore(makeElement('div', 'v42-panel-kicker gold', '任务完成'), winPanel.firstChild);
        }
        var losePanel = document.querySelector('#lose-screen .title-panel');
        if (losePanel && !losePanel.querySelector('.v42-panel-kicker')) {
            losePanel.insertBefore(makeElement('div', 'v42-panel-kicker red', '行动中断'), losePanel.firstChild);
        }

        if (game && game.ui) {
            game.ui.levelSubtitle = document.getElementById('level-subtitle');
            game.ui.waveBanner = document.getElementById('v42-wave-banner');
            game.ui.bossPhase = document.getElementById('boss-phase');
            game.ui.bestRecord = document.getElementById('v42-best-record');
            game.ui.homeSound = document.getElementById('btn-home-sound');
        }
        return true;
    };

    V42Art.pbr = { prepare: preparePbr };
    global.V42Art = V42Art;
})(window);


/* ===== [[ js/world.js ]] ===== */
// ===== 场景/相机/灯光/道路 =====

class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.COLORS.sky);
        this.scene.fog = new THREE.Fog(CONFIG.COLORS.fog, 45, 130);

        // 画质自动检测 (0=低 1=中 2=高)
        this.quality = this._detectQuality();

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: this.quality >= 1,
            powerPreference: 'high-performance'
        });
        var maxRatio = this.quality === 0 ? 1 : (this.quality === 1 ? 1.5 : 2);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxRatio));
        this.renderer.shadowMap.enabled = this.quality >= 1;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // V3.6修复: 移除sRGBEncoding(会把所有颜色洗白成粉彩,导致路面过曝/僵尸肤色失真)

        // 相机 (V2.2: FOV 55° 竖屏构图)
        this.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA_FOV || 55, 1, 0.1, 120);
        this.scene.userData.camera=this.camera;

        this._setupLights();
        this._buildRoad();
        V42Art.buildEnvironment(this);
        this._buildSky();

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    _setupLights() {
        // V3.1: 灯光再平衡。旧参数合计~1.85x导致Lambert钳制发白(路面/草地洗成白蓝)。
        // raw-linear工作流下, 水平面有效光照 ≈ 0.7*0.85 + 0.5*0.6 + 0.15 ≈ 1.1, 保留少量高光余量。
        // 半球光: 天空蓝 -> 地面绿
        const hemi = new THREE.HemisphereLight(0xB0DFFF, 0x8FBC8F, 0.5);
        this.scene.add(hemi);

        // 主方向光 (暖白色, 产生阴影)
        const dir = new THREE.DirectionalLight(0xFFF4E0, 0.72);
        dir.position.set(4, 12, 6);
        dir.castShadow = true;
        // V10.1: 阴影贴图按画质分档 — 中画质(多数手机)2048→1024, GPU负担减半
        var shadowRes = this.quality >= 2 ? 2048 : 1024;
        dir.shadow.mapSize.set(shadowRes, shadowRes);
        dir.shadow.camera.left = -8;
        dir.shadow.camera.right = 8;
        dir.shadow.camera.top = 12;
        dir.shadow.camera.bottom = -12;
        dir.shadow.camera.near = 1;
        dir.shadow.camera.far = 35;
        dir.shadow.bias = -0.001;
        this.scene.add(dir);
        this.scene.add(dir.target); // target必须加入场景才能正确更新matrixWorld
        this.sunLight = dir;

        // 补光 (淡蓝色, 从前方照射)
        const fill = new THREE.DirectionalLight(0xC8E0FF, 0.30);
        fill.position.set(-3, 6, -8);
        this.scene.add(fill);
    }

    /** V12视觉: 渐变天空穹顶 — 替代纯色背景, 一张Canvas渐变+BackSide球, 单drawCall, 无光照成本 */
    _buildSky() {
        const cv = document.createElement('canvas');
        cv.width = 16; cv.height = 256;
        const ctx = cv.getContext('2d');
        var g = ctx.createLinearGradient(0, 0, 0, 256);
        // 顶:饱和天蓝 → 中:晴空蓝 → 地平线:暖白(与雾色衔接, 远景建筑融入天际)
        g.addColorStop(0.00, '#4FA3DF');
        g.addColorStop(0.45, '#87CEEB');
        g.addColorStop(0.80, '#C9E6F5');
        g.addColorStop(1.00, '#EAF4FA');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 16, 256);
        // 顶部淡光晕(太阳方位感)
        var sun = ctx.createRadialGradient(8, 36, 2, 8, 36, 90);
        sun.addColorStop(0, 'rgba(255,246,214,0.35)');
        sun.addColorStop(1, 'rgba(255,246,214,0)');
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, 16, 256);
        var tex = new THREE.CanvasTexture(cv);
        var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
        var dome = new THREE.Mesh(new THREE.SphereGeometry(88, 24, 16), mat);
        dome.renderOrder = -10;
        dome.userData.artSource = 'js/world.js:_buildSky() 渐变天空穹顶 16x256';
        this.scene.add(dome);
        this._skyDome = dome;
        // 雾色向地平线色靠拢 — 远处路段/建筑自然融入天际
        if (this._themeApplied !== 'apocalypse') this.scene.fog.color.setHex(0xC9E4F2);
    }

    _buildRoad() {
        const C = CONFIG.COLORS;
        const roadGroup = new THREE.Group();
        this.roadGroup = roadGroup;
        roadGroup.userData.artSource = 'js/world.js:_buildRoad() CanvasTexture 256x512(柏油+车辙+补丁+车道线)';
        this.roadSegments = [];

        const SEG_LEN = 12;
        const SEG_COUNT = 12;

        // 道路纹理(浅灰蓝柏油 + 大色调变化 + 噪点 + 车道线) — V12视觉: 色调分层, 黄边线降饱和
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 256;
        roadCanvas.height = 512;
        const rctx = roadCanvas.getContext('2d');
        // 底色: 灰蓝柏油(V3.6加深保证可读; V12: 略偏蓝青与天空呼应, 去紫味)
        rctx.fillStyle = '#7C8B96';
        rctx.fillRect(0, 0, 256, 512);
        // V12: 大块色调变化(3-4个宽幅纵向淡色带, 打破整段同色)
        var bandTones = ['rgba(255,255,255,0.045)', 'rgba(30,44,56,0.05)', 'rgba(255,255,255,0.03)', 'rgba(30,44,56,0.04)'];
        for (let b = 0; b < 4; b++) {
            rctx.fillStyle = bandTones[b];
            var bx = (b * 67 + randRange(-10, 10)) % 256;
            rctx.fillRect(bx, 0, randRange(46, 80), 512);
        }
        // 柏油噪点纹理
        for (let i = 0; i < 400; i++) {
            var v = Math.random();
            rctx.fillStyle = v < 0.5 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
            rctx.fillRect(Math.random() * 256, Math.random() * 512, 2 + Math.random() * 3, 2 + Math.random() * 3);
        }
        // 路面裂缝(细微线条)
        rctx.strokeStyle = 'rgba(0,0,0,0.06)';
        rctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            rctx.beginPath();
            var sx = Math.random() * 256;
            var sy = Math.random() * 512;
            rctx.moveTo(sx, sy);
            rctx.lineTo(sx + randRange(-20, 20), sy + randRange(10, 40));
            rctx.stroke();
        }
        // V3.7: 车辙印(两条纵向暗带 — 增加柏油路真实感)
        rctx.fillStyle = 'rgba(28,40,48,0.10)';
        rctx.fillRect(52, 0, 22, 512);
        rctx.fillRect(182, 0, 22, 512);
        // V3.7: 深色补丁(随机圆形沥青修补痕)
        for (let pi = 0; pi < 5; pi++) {
            var px = randRange(30, 226), py = randRange(20, 480), pr = randRange(8, 18);
            rctx.fillStyle = 'rgba(70,64,90,0.1)';
            rctx.beginPath();
            rctx.ellipse(px, py, pr, pr * 0.7, 0, 0, Math.PI * 2);
            rctx.fill();
        }
        // 车道分隔线(白色虚线 - 对齐实际车道边界 X=±1)
        rctx.fillStyle = '#F0EEF5';
        for (let y = 0; y < 512; y += 48) {
            rctx.fillRect(88, y, 5, 30);
            rctx.fillRect(163, y, 5, 30);
        }
        // 路边实线(V12: 降饱和暖黄+暗色衬边 — 原纯黄过艳, 抢戏整个画面)
        rctx.fillStyle = 'rgba(52,58,48,0.35)';
        rctx.fillRect(3, 0, 7, 512);
        rctx.fillRect(246, 0, 7, 512);
        rctx.fillStyle = '#E3C26B';
        rctx.fillRect(4, 0, 5, 512);
        rctx.fillRect(247, 0, 5, 512);
        // Drain covers and repairs make the road read as part of a lived-in street.
        rctx.fillStyle = '#445660';
        rctx.fillRect(12, 350, 19, 34);
        rctx.fillRect(225, 100, 19, 34);
        rctx.strokeStyle = '#8B9A9E';
        for (var drain = 0; drain < 6; drain++) {
            rctx.beginPath();
            rctx.moveTo(14, 354 + drain * 5);
            rctx.lineTo(29, 354 + drain * 5);
            rctx.moveTo(227, 104 + drain * 5);
            rctx.lineTo(242, 104 + drain * 5);
            rctx.stroke();
        }
        const roadTex = new THREE.CanvasTexture(roadCanvas);
        roadTex.wrapS = THREE.RepeatWrapping;
        roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.anisotropy = 4;

        const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });

        // V3.5: 每段合并为3个mesh(路面/路侧结构/草地) — 原9个, drawCalls 108→36
        for (let i = 0; i < SEG_COUNT; i++) {
            const seg = new THREE.Group();
            seg.userData.artSource = 'js/world.js:_buildRoad() CanvasTexture 256x512(柏油+车辙+补丁+车道线)';

            // 道路面(带纹理)
            const road = new THREE.Mesh(new THREE.PlaneGeometry(6.8, SEG_LEN), roadMat);
            road.rotation.x = -Math.PI / 2;
            road.receiveShadow = true;
            seg.add(road);

            // 路侧结构合并: 人行道×2 + 护栏×2 + 顶盖×2 (顶点色单材质)
            var structGeos = [
                { g: new THREE.BoxGeometry(0.8, 0.1, SEG_LEN), x: -3.8, y: 0.05, z: 0, c: 0xC5CDC9 },
                { g: new THREE.BoxGeometry(0.8, 0.1, SEG_LEN), x: 3.8, y: 0.05, z: 0, c: 0xC5CDC9 },
                { g: new THREE.BoxGeometry(0.25, 0.35, SEG_LEN), x: -4.35, y: 0.17, z: 0, c: 0x8E8AA0 },
                { g: new THREE.BoxGeometry(0.25, 0.35, SEG_LEN), x: 4.35, y: 0.17, z: 0, c: 0x8E8AA0 },
                { g: new THREE.BoxGeometry(0.3, 0.06, SEG_LEN), x: -4.35, y: 0.37, z: 0, c: 0xA8A4B8 },
                { g: new THREE.BoxGeometry(0.3, 0.06, SEG_LEN), x: 4.35, y: 0.37, z: 0, c: 0xA8A4B8 }
            ].map(function(item) {
                item.g.translate(item.x, item.y, item.z);
                return colorize(item.g, item.c);
            });
            var structMesh = new THREE.Mesh(mergeGeometries(structGeos),
                new THREE.MeshLambertMaterial({ vertexColors: true }));
            structMesh.castShadow = true;
            structMesh.receiveShadow = true;
            seg.add(structMesh);

            var pavement = [];
            for (var side = -1; side <= 1; side += 2) {
                for (var tile = 0; tile < 8; tile++) {
                    var seam = new THREE.BoxGeometry(.78, .012, .025);
                    seam.translate(side * 3.8, .108, -5.25 + tile * 1.5);
                    pavement.push(colorize(seam, 0x879A97));
                    var curb = new THREE.BoxGeometry(.12, .08, .72);
                    curb.translate(side * 3.43, .06, -5.25 + tile * 1.5);
                    pavement.push(colorize(curb, tile % 2 ? 0xE7E4CF : 0x4C6266));
                }
            }
            seg.add(new THREE.Mesh(mergeGeometries(pavement), new THREE.MeshLambertMaterial({ vertexColors: true })));

            // 草地(两侧合并) — V12视觉: 修剪条纹明暗交替 + 偶发浅色草斑, 打破大片单色
            var grassBase = new THREE.Color(C.grass);
            var grassLight = grassBase.clone().lerp(new THREE.Color(0xCFFF9E), 0.16);
            var grassGeoList = [];
            for (var side2 = -1; side2 <= 1; side2 += 2) {
                for (var strip = 0; strip < 4; strip++) {
                    var stripGeo = new THREE.PlaneGeometry(20, SEG_LEN / 4);
                    stripGeo.rotateX(-Math.PI / 2);
                    stripGeo.translate(side2 * 14, -0.02, SEG_LEN / 4 * (strip - 1.5));
                    grassGeoList.push(colorize(stripGeo, strip % 2 ? grassLight : grassBase));
                }
                // 偶发浅色草斑(每段每侧1个, 大而淡)
                var patch = new THREE.CircleGeometry(randRange(0.9, 1.7), 7);
                patch.rotateX(-Math.PI / 2);
                patch.translate(side2 * randRange(6.5, 10.5), -0.015, randRange(-4, 4));
                grassGeoList.push(colorize(patch, grassLight.clone().lerp(grassBase, 0.35)));
            }
            var groundMesh = new THREE.Mesh(mergeGeometries(grassGeoList),
                new THREE.MeshLambertMaterial({ vertexColors: true }));
            groundMesh.receiveShadow = true;
            seg.add(groundMesh);

            seg.position.z = -i * SEG_LEN + SEG_LEN;
            this.scene.add(seg);
            this.roadSegments.push({ group: seg, length: SEG_LEN });
        }

        // 起点线(斑马线样式 - 白色横条合并为单mesh)
        var stripeGeos = [];
        for (var si = 0; si < 5; si++) {
            var sg = new THREE.PlaneGeometry(1.0, 0.25);
            sg.rotateX(-Math.PI / 2);
            sg.translate(-2.8 + si * 1.4, 0.012, 0.5);
            stripeGeos.push(colorize(sg, 0xFFFFFF));
        }
        this.scene.add(new THREE.Mesh(mergeGeometries(stripeGeos),
            new THREE.MeshBasicMaterial({ vertexColors: true })));
    }


    // V11 QA: 移除无调用的 _buildCitySkyline()(V4.2环境由art-v42.js接管, 此方法全库零引用成为死代码;
    // this.buildings 仍保留 — art-v42.js重置它, 滚动循环遍历空数组无副作用)

    /**
     * 道路/装饰无限滚动 (V3.1: 无状态平铺)
     * 旧实现只在 z > squadZ+阈值 时向后跳一格, 重开(squad回0)后所有段滞留远处,
     * 玩家踩空100+单位 → 大面积空白。改为按 squadZ 直接计算每段归属位置,
     * 重开/复活/传送自动正确。
     */
    updateRoadScroll(squadZ) {
        if(this._v42Environment)this._v42Environment.update(squadZ);
        const SEG_LEN = 12;
        // 路段: 覆盖 [squadZ+18, squadZ-114], 共12段
        const base = Math.ceil((squadZ + SEG_LEN * 1.5) / SEG_LEN) * SEG_LEN;
        for (let i = 0; i < this.roadSegments.length; i++) {
            this.roadSegments[i].group.position.z = base - i * SEG_LEN;
        }

        // 装饰/建筑/云: 双向折返进窗口 [squadZ-170, squadZ+15]
        const span = 170;
        for (const item of this.decoItems) {
            if (item.position.z > squadZ + 15) {
                item.position.z -= span * Math.ceil((item.position.z - (squadZ + 15)) / span);
            } else if (item.position.z < squadZ - (span - 15)) {
                item.position.z += span * Math.ceil((squadZ - (span - 15) - item.position.z) / span);
            }
        }
        for (const building of this.buildings) {
            if (building.position.z > squadZ + 20) {
                building.position.z -= span * Math.ceil((building.position.z - (squadZ + 20)) / span);
            } else if (building.position.z < squadZ - (span - 20)) {
                building.position.z += span * Math.ceil((squadZ - (span - 20) - building.position.z) / span);
            }
        }
        for (const cloud of this.clouds) {
            const cSpan = 110;
            if (cloud.position.z > squadZ + 20) {
                cloud.position.z -= cSpan * Math.ceil((cloud.position.z - (squadZ + 20)) / cSpan);
            } else if (cloud.position.z < squadZ - (cSpan - 20)) {
                cloud.position.z += cSpan * Math.ceil((squadZ - (cSpan - 20) - cloud.position.z) / cSpan);
            }
        }
    }

    /** 相机跟随小队 */
    // V4.0: 动态构图 — 相机随军团规模升高后移(sqrt曲线), 军团壮观但不拥挤
    // 12人: 6.1/7.8(清晰) | 100人: +1.2 | 300人: +2.0 | 500人: +2.6(全景)
    updateCamera(squadX, squadZ, dt, squadCount, formationDepth) {
        const cam = this.camera;
        var n=squadCount||1,cols=n<=1?1:n<=12?Math.ceil(Math.sqrt(n)):n<=100?6:n<=300?11:13;
        var spacing=n<=12?.72:n<=100?.74:n<=300?.50:.46;
        var depth=formationDepth===undefined ? Math.max(0,Math.ceil(n/cols)-1)*spacing : formationDepth;
        var cf = clamp(Math.sqrt(clamp((squadCount || 1) / 500, 0, 1)) * 1.2, 0, 1);
        if (this._camScale === undefined) this._camScale = cf;
        this._camScale = damp(this._camScale, cf, 3, dt);   // 人数变化时平滑过渡
        // V5.1修复: formationDepth 未平滑直接进相机 — 人数每次增减(被杀/吸血/穿门)相机前后跳,
        // 是"人物向后移动的视觉效果"的主因之一。改为阻尼平滑。
        if (this._depthSmooth === undefined) this._depthSmooth = depth;
        this._depthSmooth = damp(this._depthSmooth, depth, 2.5, dt);
        var sDepth = this._depthSmooth;
        // V4.3: 俯角下调(~36°, 背面人群更立体; 基线降低+距离拉开)
        var offY = 5.6 + this._camScale * 3.1;
        var offZ = 8.4 + this._camScale * 2.0 + sDepth;
        var lookAhead = CONFIG.CAMERA_LOOK_AHEAD - this._camScale * 2.0 + sDepth;

        const targetX = squadX * CONFIG.CAMERA_FOLLOW_X;
        const targetPos = new THREE.Vector3(
            targetX + 0.6 * (1 - this._camScale * .65),
            squadZ * 0 + offY,
            squadZ + offZ
        );
        cam.position.x = damp(cam.position.x, targetPos.x, 6, dt);
        cam.position.y = damp(cam.position.y, targetPos.y, 5, dt);
        cam.position.z = damp(cam.position.z, targetPos.z, 8, dt);
        // V4.0: 屏幕震动(受击/翻倍/Boss入场), 指数衰减
        if (this._shakeT > 0.001) {
            this._shakeT = Math.max(0, this._shakeT - dt * (this._shakeDecay || 2.2));
            var sAmp = this._shakeAmp * this._shakeT;
            cam.position.x += (Math.random() - 0.5) * sAmp;
            cam.position.y += (Math.random() - 0.5) * sAmp * 0.5;
        }
        cam.lookAt(targetX * 0.5, 0, squadZ + lookAhead);
        // V12视觉: 天空穹顶跟随相机(XZ), 保持地平线稳定
        if (this._skyDome) this._skyDome.position.set(cam.position.x, 0, cam.position.z);

        // 阴影相机跟随
        this.sunLight.position.set(squadX + 4, 12, squadZ + 6);
        this.sunLight.target.position.set(squadX, 0, squadZ - 2);
        this.sunLight.target.updateMatrixWorld();
    }

    /** V6.0: 关卡主题 — 末日核心等场景换装(天空/雾/灯光), 'default'还原 */
    applyTheme(themeName) {
        var T = themeName === 'apocalypse' ? CONFIG.APOCALYPSE_THEME : null;
        if (!T) {
            this.scene.background = new THREE.Color(CONFIG.COLORS.sky);
            this.scene.fog = new THREE.Fog(0xC9E4F2, 45, 130);
            if (this._skyDome) this._skyDome.material.color.setHex(0xFFFFFF);
            this.sunLight.color.setHex(0xFFF4E0);
            this.sunLight.intensity = 0.72;
            this._themeApplied = 'default';
            return;
        }
        this.scene.background = new THREE.Color(T.sky);
        this.scene.fog = new THREE.Fog(T.fog, T.fogNear, T.fogFar);
        // V12视觉: 末日主题时天空穹顶整体压暗染色(乘色), 雾色不变
        if (this._skyDome) this._skyDome.material.color.setHex(0x8A5060);
        this.sunLight.color.setHex(T.sunColor);
        this.sunLight.intensity = T.sunIntensity;
        // 环境实例材质染色(草地/路面/建筑向末日色过渡)
        if (this._v42Environment && this._v42Environment.root) {
            var mix = { done: false };
            this._v42Environment.root.traverse(function(o) {
                if (o.isInstancedMesh && o.material && o.material.color) {
                    if (o.material.__themeBaseHex === undefined) o.material.__themeBaseHex = o.material.color.getHex();
                    var base = new THREE.Color(o.material.__themeBaseHex);
                    var target = new THREE.Color(T.grass).lerp(base, 0.35);
                    o.material.color.copy(base.lerp(target, 0.55));
                    o.material.needsUpdate = true;
                }
            });
            mix.done = true;
        }
        this._themeApplied = themeName;
    }

    /** V4.0: 触发屏幕震动(amp≈世界单位幅度) */
    shake(amp, duration) {
        if (this._shakeDisabled === undefined) {
            // V12: 震动偏好走 Platform.storage(h5 兼容旧裸键 pz_shake_off; 微信端无 localStorage 也可存取)
            var _shakeOff = '0';
            if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
                _shakeOff = Platform.storage.getLegacy('pz_shake_off', '0');
            } else {
                try { _shakeOff = localStorage.getItem('pz_shake_off') || '0'; } catch (e) {}
            }
            this._shakeDisabled = (_shakeOff === '1' || _shakeOff === 1);
        }
        if (this._shakeDisabled) return; // V10 QA修复: 设置页屏幕震动开关此前只写不读
        var strength = amp || 0.3;
        if ((this._shakeAmp || 0) * (this._shakeT || 0) > strength) return;
        this._shakeT = 1;
        this._shakeAmp = strength;
        this._shakeDecay = 1 / (duration || .45);
    }

    _detectQuality() {
        var requested = new URLSearchParams(window.location.search).get('quality');
        if (requested !== null && /^[012]$/.test(requested)) return Number(requested);
        // V12: 用户画质设置生效(原 pz_quality 只写不读, 设置页按钮形同虚设)
        if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
            var savedQ = Platform.storage.getLegacy('pz_quality', null);
            if (savedQ !== null && /^[012]$/.test(String(savedQ))) return Number(savedQ);
        }
        var dpr = window.devicePixelRatio || 1;
        var area = window.innerWidth * window.innerHeight;
        // 移动端小屏 + 低DPR → 低画质
        if (dpr <= 1 && area < 500000) return 0;
        // 中等设备 → 中画质
        if (dpr <= 1.5 || area < 800000) return 1;
        // 高端设备 → 高画质
        return 2;
    }

    resize() {
        // V11 QA修复[P3]: 容器缺失守卫(canvas未挂载时parentElement为null)
        const container = this.canvas.parentElement;
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

}
// V10.1: 移除无调用的 World.render()(game.js 直接 renderer.render)


/* ===== [[ js/effects.js ]] ===== */
// ===== 特效系统: 粒子/浮动数字/冲击波/枪口闪光 =====

class Effects {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.floatTexts = [];
        this.shockwaves = [];
        this.flashes = [];

        // 粒子池 (共享几何体, 独立材质)
        this.pool = [];
        const geo = new THREE.SphereGeometry(0.06, 6, 4);
        this.particleMesh=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:0xffffff}),CONFIG.PARTICLE_MAX);
        this.particleMesh.count=0;this.particleMesh.frustumCulled=false;
        this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.particleMesh.userData.artSource='V42 instanced pooled sparks';scene.add(this.particleMesh);
        this._particleColor=new THREE.Color();
        this._flashPool=[];
        this._ringPool=[];
        for (let i = 0; i < CONFIG.PARTICLE_MAX; i++) {
            const m = new THREE.Object3D();
            m.material={color:new THREE.Color(),opacity:1};
            m.visible = false;
            m.userData.artSource = 'js/effects.js 程序化粒子池(共享SphereGeometry)';
            this.pool.push(m);
        }

        // 浮动文字纹理缓存
        this._textCache = {};
        this._floatTextCount = 0;
        this.impacts = [];
        this._impactPool = Array.from({ length: 48 }, function() { return new THREE.Object3D(); });
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        var ink = canvas.getContext('2d');
        ink.translate(64, 64);
        ink.fillStyle = '#FFFFFF';
        ink.beginPath();
        for (var ray = 0; ray < 16; ray++) {
            var angle = ray * Math.PI / 8;
            var radius = ray % 2 ? 12 : (ray % 4 ? 43 : 62);
            ink.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ink.closePath();
        ink.fill();
        var impactTex = new THREE.CanvasTexture(canvas);
        this.impactMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: impactTex, transparent: true, depthWrite: false, alphaTest: .05 }), 48);
        this.impactMesh.count = 0;
        this.impactMesh.frustumCulled = false;
        this.impactMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.impactMesh.userData.artSource = 'pooled-impact-starbursts';
        scene.add(this.impactMesh);

        // V12视觉: 尸液/碎屑地面痕迹(pooled decals, 16上限) — 击杀反馈落地
        this._splatPool = Array.from({ length: 16 }, function() { return new THREE.Object3D(); });
        var splatCanvas = document.createElement('canvas');
        splatCanvas.width = splatCanvas.height = 128;
        var sc2 = splatCanvas.getContext('2d');
        sc2.translate(64, 64);
        var gooGrad = sc2.createRadialGradient(0, 0, 4, 0, 0, 56);
        gooGrad.addColorStop(0, 'rgba(46,74,40,0.92)');
        gooGrad.addColorStop(0.55, 'rgba(52,84,44,0.75)');
        gooGrad.addColorStop(0.85, 'rgba(60,96,48,0.28)');
        gooGrad.addColorStop(1, 'rgba(60,96,48,0)');
        sc2.fillStyle = gooGrad;
        sc2.beginPath();
        for (var sa = 0; sa < 26; sa++) {
            var ang = sa / 26 * Math.PI * 2;
            var wob = 40 + Math.sin(sa * 2.7) * 10 + Math.cos(sa * 5.1) * 6;
            sc2.lineTo(Math.cos(ang) * wob, Math.sin(ang) * wob);
        }
        sc2.closePath();
        sc2.fill();
        // 三滴飞溅卫星点
        for (var drop = 0; drop < 3; drop++) {
            var da = drop * 2.2 + 0.6;
            var dr = 46 + drop * 6;
            sc2.fillStyle = 'rgba(52,84,44,0.5)';
            sc2.beginPath();
            sc2.arc(Math.cos(da) * dr, Math.sin(da) * dr, 5 - drop, 0, Math.PI * 2);
            sc2.fill();
        }
        var splatTex = new THREE.CanvasTexture(splatCanvas);
        this.splatMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: splatTex, transparent: true, depthWrite: false }), 16);
        this.splatMesh.count = 0;
        this.splatMesh.frustumCulled = false;
        this.splatMesh.renderOrder = 1;
        this.splatMesh.userData.artSource = 'js/effects.js 程序化尸液decal(128px CanvasTexture)';
        scene.add(this.splatMesh);
        this.splats = [];
        this._splatQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

        // V12视觉: 爆炸白闪(径向亮核, 8上限) — 自爆/Boss死亡/爆炸弹的瞬间亮度冲击
        this._boomPool = [];
        this.booms = [];
        if (!this._boomTex) {
            var bc = document.createElement('canvas');
            bc.width = bc.height = 128;
            var bctx = bc.getContext('2d');
            var bg = bctx.createRadialGradient(64, 64, 4, 64, 64, 62);
            bg.addColorStop(0, 'rgba(255,255,255,1)');
            bg.addColorStop(0.28, 'rgba(255,236,160,0.92)');
            bg.addColorStop(0.62, 'rgba(255,176,64,0.42)');
            bg.addColorStop(1, 'rgba(255,120,20,0)');
            bctx.fillStyle = bg;
            bctx.fillRect(0, 0, 128, 128);
            this._boomTex = new THREE.CanvasTexture(bc);
        }
    }

    /** V12视觉: 地面尸液痕迹 (dieT期间淡出, 大体型更大) */
    splat(x, z, size) {
        var p = this._splatPool.pop();
        if (!p) return;
        p.position.set(x, 0.02 + Math.random() * 0.01, z);
        p.userData = { life: 2.2, maxLife: 2.2, size: (size || 1) * randRange(0.75, 1.05), roll: Math.random() * Math.PI * 2 };
        this.splats.push(p);
    }

    /** V12视觉: 爆炸白闪 (0.14s 亮核弹出) */
    flash(x, y, z, color, size) {
        if (this.booms.length >= 8) return;
        var s = this._boomPool.pop() || new THREE.Sprite(new THREE.SpriteMaterial({ map: this._boomTex, transparent: true, depthWrite: false }));
        s.position.set(x, y, z);
        s.visible = true;
        s.material.opacity = 1;
        if (color) s.material.color.setHex(color); else s.material.color.setHex(0xFFFFFF);
        s.scale.setScalar((size || 1.6) * 0.55);
        this.scene.add(s);
        this.booms.push({ mesh: s, life: 0.14, maxLife: 0.14, size: size || 1.6 });
    }

    reinforcement(squad, source, added) {
        if (added <= 0) return;
        if (!(this._recruitNoticeT > 0)) this._recruitTotals = {};
        this._recruitTotals[source] = (this._recruitTotals[source] || 0) + added;
        this._recruitNoticeT = 2.8;
        var el = document.getElementById('reinforcement-notice');
        if (el) {
            el.textContent = Object.keys(this._recruitTotals).map(key => key + ' +' + this._recruitTotals[key] + '人').join(' · ');
            el.hidden = false;
        }
        // Kill-based healing can fire dozens of times a second: aggregate the
        // notice, and bound the expensive world effects to one pulse per 0.4s.
        if (!(this._recruitFxT > 0)) {
            this._recruitFxT = 0.4;
            this.floatText(squad.x, 2.2, squad.z, source + ' +' + added + '人', '#75FFB5', true);
            this.shockwave(squad.x, 0.06, squad.z, 0x39D98A);
            this.burst(squad.x, 0.6, squad.z, 0x75FFB5, 10, 2.2, 0.6);
        }
    }

    impact(x, y, z, critical, lethal) {
        var p = this._impactPool.pop();
        if (!p) return;
        p.position.set(x, y, z + .15);
        p.userData = { life: .16, maxLife: .16, size: lethal ? .9 : critical ? .78 : .48,
            color: critical ? 0xFF9C47 : 0xFFF0AF, angle: Math.random() * Math.PI };
        this.impacts.push(p);
    }

    /** 生成粒子爆发 */
    burst(x, y, z, color, count, speed, life) {
        count = count || 8;
        speed = speed || 3;
        life = life || 0.5;
        for (let i = 0; i < count; i++) {
            const p = this.pool.pop();
            if (!p) break;
            p.visible = true;
            p.position.set(x, y, z);
            p.material.color.setHex(color);
            p.material.opacity = 1;
            const s = randRange(0.5, 1.3);
            p.scale.setScalar(s);
            p.userData = {
                vx: randRange(-1, 1) * speed,
                vy: randRange(0.8, 2.2) * speed,
                vz: randRange(-1, 1) * speed,
                life: life * randRange(0.7, 1.2),
                maxLife: life,
                s0: s
            };
            this.particles.push(p);
        }
    }

    /** 生成浮动文字(伤害/暴击) */
    floatText(x, y, z, text, color, big) {
        const damageNumber=/^\d+$/.test(String(text));
        // 限制同时显示数量
        if (this._floatTextCount > 20) return;
        this._floatTextCount++;

        const key = text + '_' + color + (big ? '_b' : '');
        let tex = this._textCache[key];
        if (!tex) {
            var keys=Object.keys(this._textCache);
            if(keys.length>=128) {
                var free=keys.find(k=>!this.floatTexts.some(ft=>ft.sprite.material.map===this._textCache[k]));
                if(free){this._textCache[free].dispose();delete this._textCache[free];}
            }
            tex = createTextTexture(text, damageNumber ? {
                // V12视觉: 纯数字伤害 — 白芯+彩色描边(远看醒目, 近看不糊)
                fontSize: big ? 120 : 88,
                fill: '#FFFFFF',
                stroke: color,
                strokeWidth: big ? 14 : 10
            } : {
                fontSize: big ? 110 : 80,
                fill: color,
                stroke: '#1a1a2e',
                strokeWidth: big ? 10 : 7
            });
            this._textCache[key] = tex;
        }

        // V10.1: Sprite/Material 池化 — 原实现每条飘字 new Sprite+Material(高频战斗GC尖峰)
        var sprite = this._floatPool && this._floatPool.pop();
        if (!sprite) {
            sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
            if (!this._floatPool) this._floatPool = [];
        }
        sprite.material.map = tex;
        sprite.material.needsUpdate = true;
        // V3.2: 分散出生点, 避免连续暴击文字完全重叠
        sprite.position.set(
            x + randRange(-0.5, 0.5),
            (damageNumber ? y * .55 : y) + randRange(0, damageNumber ? .08 : .35),
            z + randRange(-0.4, 0.4)
        );
        const sc = big ? (damageNumber ? .70 : .9) : .55;
        sprite.scale.set(sc, sc * 0.5, 1);
        sprite.renderOrder = 999;
        this.scene.add(sprite);
        this.floatTexts.push({
            sprite: sprite, life: 0.7, maxLife: 0.7,
            vy: damageNumber ? (big ? 1.35 : 1.1) : (big ? 3.2 : 2.5), vx: randRange(-0.5, 0.5)
        });
    }

    /** 生成穿门冲击波(扩散圆环) */
    shockwave(x, y, z, color) {
        const ring = this._ringPool.pop() || new THREE.Mesh(
            new THREE.RingGeometry(0.3, 0.45, 24),
            new THREE.MeshBasicMaterial({
                color: color || 0x6EE7B7,
                transparent: true, opacity: 0.8,
                side: THREE.DoubleSide
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.visible=true;ring.scale.setScalar(1);ring.material.color.setHex(color || 0x6ee7b7);ring.material.opacity=.8;
        ring.position.set(x, y, z);
        this.scene.add(ring);
        this.shockwaves.push({ mesh: ring, life: 0.5, maxLife: 0.5 });
    }

    /** 枪口闪光 (星形+加法混合发光) */
    muzzleFlash(x, y, z) {
        // 惰性创建星形闪光纹理
        if (!this._muzzleTex) {
            var c = document.createElement('canvas');
            c.width = 64; c.height = 64;
            var ctx = c.getContext('2d');
            // 四角星形
            var cx = 32, cy = 32;
            ctx.fillStyle = '#FFF8DC';
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.quadraticCurveTo(cx + 4, cy - 4, 64, cy);
            ctx.quadraticCurveTo(cx + 4, cy + 4, cx, 64);
            ctx.quadraticCurveTo(cx - 4, cy + 4, 0, cy);
            ctx.quadraticCurveTo(cx - 4, cy - 4, cx, 0);
            ctx.closePath();
            ctx.fill();
            // 中心亮核
            var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.4, '#FFE066');
            grad.addColorStop(1, 'rgba(255,160,40,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
            this._muzzleTex = new THREE.CanvasTexture(c);
        }
        if(this.flashes.length>=24)return;
        var flash = this._flashPool.pop() || new THREE.Sprite(new THREE.SpriteMaterial({
            map: this._muzzleTex,
            transparent: true,
            opacity: 0.95,
            depthWrite: false
        }));
        flash.position.set(x, y, z);
        flash.visible=true;flash.material.opacity=.95;
        flash.material.rotation = Math.random() * Math.PI; // V12视觉: 随机滚转, 齐射时火光不重复
        var mfScale = randRange(0.42, 0.52);
        flash.scale.set(mfScale, mfScale, 1); // V3.7: 枪口火焰更醒目
        this.scene.add(flash);
        this.flashes.push({ mesh: flash, life: 0.07, maxLife: 0.07 });
    }

    clear() {
        this._recruitTotals = {};
        this._recruitNoticeT = 0;
        this._recruitFxT = 0;
        var notice = document.getElementById('reinforcement-notice');
        if (notice) { notice.hidden = true; notice.textContent = ''; }
        for (var impact of this.impacts) this._impactPool.push(impact);
        this.impacts.length = 0;
        this.impactMesh.count = 0;
        for(var p of this.particles){p.visible=false;this.pool.push(p);}this.particles.length=0;
        for(var f of this.flashes){this.scene.remove(f.mesh);f.mesh.visible=false;this._flashPool.push(f.mesh);}this.flashes.length=0;
        for(var r of this.shockwaves){this.scene.remove(r.mesh);r.mesh.visible=false;this._ringPool.push(r.mesh);}this.shockwaves.length=0;
        // V10.1: clear 回收入池
        for(var ft of this.floatTexts){this.scene.remove(ft.sprite);if(this._floatPool.length<24)this._floatPool.push(ft.sprite);else ft.sprite.material.dispose();}
        this.floatTexts.length=0;this._floatTextCount=0;
        this.particleMesh.count=0;
        // V12视觉: decals/爆闪回收
        for(var sp of this.splats) this._splatPool.push(sp);
        this.splats.length = 0;
        this.splatMesh.count = 0;
        for(var bm of this.booms){this.scene.remove(bm.mesh);bm.mesh.visible=false;this._boomPool.push(bm.mesh);}
        this.booms.length = 0;
    }

    update(dt) {
        this._recruitFxT = Math.max(0, (this._recruitFxT || 0) - dt);
        if (this._recruitNoticeT > 0) {
            this._recruitNoticeT = Math.max(0, this._recruitNoticeT - dt);
            if (!this._recruitNoticeT) {
                var notice = document.getElementById('reinforcement-notice');
                if (notice) notice.hidden = true;
                this._recruitTotals = {};
            }
        }
        var camera = this.scene.userData.camera;
        for (var ii = this.impacts.length - 1; ii >= 0; ii--) {
            var impact = this.impacts[ii], data = impact.userData;
            data.life -= dt;
            if (data.life <= 0) {
                this._impactPool.push(impact);
                this.impacts.splice(ii, 1);
                continue;
            }
            var progress = 1 - data.life / data.maxLife;
            if (camera) impact.quaternion.copy(camera.quaternion);
            impact.rotateZ(data.angle);
            impact.scale.setScalar(data.size * (.6 + progress * 1.25));
            impact.updateMatrix();
            this.impactMesh.setMatrixAt(ii, impact.matrix);
            this._particleColor.setHex(data.color).multiplyScalar(1 - progress * .55);
            this.impactMesh.setColorAt(ii, this._particleColor);
        }
        // Repack after expiry; splice must not leave a stale instance in a hole.
        this.impactMesh.count = this.impacts.length;
        for (var packed = 0; packed < this.impacts.length; packed++) {
            var item = this.impacts[packed];
            this.impactMesh.setMatrixAt(packed, item.matrix);
            this._particleColor.setHex(item.userData.color).multiplyScalar(.45 + .55 * item.userData.life / item.userData.maxLife);
            this.impactMesh.setColorAt(packed, this._particleColor);
        }
        this.impactMesh.instanceMatrix.needsUpdate = true;
        if (this.impactMesh.instanceColor) this.impactMesh.instanceColor.needsUpdate = true;
        // 粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const u = p.userData;
            u.life -= dt;
            if (u.life <= 0) {
                p.visible = false;
                this.pool.push(p);
                this.particles.splice(i, 1);
                continue;
            }
            u.vy -= 7 * dt;
            p.position.x += u.vx * dt;
            p.position.y += u.vy * dt;
            p.position.z += u.vz * dt;
            if (p.position.y < 0.03) {
                p.position.y = 0.03;
                u.vy *= -0.25;
                u.vx *= 0.7;
                u.vz *= 0.7;
            }
            const t = u.life / u.maxLife;
            p.material.opacity = t;
            p.scale.setScalar(u.s0 * (0.3 + t * 0.7));
        }

        // 浮动文字
        for (let i = this.floatTexts.length - 1; i >= 0; i--) {
            const ft = this.floatTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
                // V10.1: 回收入池(材质复用, 仅换贴图)
                this.scene.remove(ft.sprite);
                if (this._floatPool.length < 24) this._floatPool.push(ft.sprite);
                else ft.sprite.material.dispose();
                this.floatTexts.splice(i, 1);
                this._floatTextCount--;
                continue;
            }
            ft.sprite.position.y += ft.vy * dt;
            ft.sprite.position.x += ft.vx * dt;
            const t = ft.life / ft.maxLife;
            ft.sprite.material.opacity = Math.min(1, t * 2);
            if (t < 0.5) {
                const s = 0.55 * (0.5 + t);
                ft.sprite.scale.set(s, s * 0.5, 1);
            }
        }

        // 冲击波
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.life -= dt;
            if (sw.life <= 0) {
                this.scene.remove(sw.mesh);
                sw.mesh.visible=false;
                this._ringPool.push(sw.mesh);
                this.shockwaves.splice(i, 1);
                continue;
            }
            const t = 1 - sw.life / sw.maxLife;
            const scale = 1 + t * 5;
            sw.mesh.scale.setScalar(scale);
            sw.mesh.material.opacity = 0.8 * (1 - t);
        }

        // 枪口闪光
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            const f = this.flashes[i];
            f.life -= dt;
            if (f.life <= 0) {
                this.scene.remove(f.mesh);
                // Sprite共享内部几何体不可dispose; Mesh需dispose
                f.mesh.visible=false;
                this._flashPool.push(f.mesh);
                this.flashes.splice(i, 1);
                continue;
            }
            const t = f.life / f.maxLife;
            f.mesh.material.opacity = t * 0.95;
            var sc = 0.48 + (1 - t) * 0.55; // V3.7
            f.mesh.scale.set(sc, sc, 1);
        }

        // V12视觉: 尸液decal(淡出+首帧展开; 复用scratch矩阵/向量, 热循环零分配)
        if (!this._m4) { this._m4 = new THREE.Matrix4(); this._v3 = new THREE.Vector3(); }
        var liveSplats = 0;
        for (var si2 = this.splats.length - 1; si2 >= 0; si2--) {
            var sp = this.splats[si2];
            sp.userData.life -= dt;
            if (sp.userData.life <= 0) {
                this._splatPool.push(sp);
                this.splats.splice(si2, 1);
            }
        }
        for (var pk = 0; pk < this.splats.length; pk++) {
            var pkSp = this.splats[pk];
            var pkGrow = Math.min(1, (1 - pkSp.userData.life / pkSp.userData.maxLife) * 8); // 前0.125s快速展开
            this._v3.set(pkSp.userData.size * pkGrow, pkSp.userData.size * pkGrow, 1);
            this._m4.compose(pkSp.position, this._splatQuat, this._v3);
            this.splatMesh.setMatrixAt(pk, this._m4);
            liveSplats++;
        }
        this.splatMesh.count = liveSplats;
        this.splatMesh.instanceMatrix.needsUpdate = true;

        // V12视觉: 爆炸白闪(0.14s 弹出+淡出)
        for (var bi = this.booms.length - 1; bi >= 0; bi--) {
            var bm = this.booms[bi];
            bm.life -= dt;
            if (bm.life <= 0) {
                this.scene.remove(bm.mesh);
                bm.mesh.visible = false;
                this._boomPool.push(bm.mesh);
                this.booms.splice(bi, 1);
                continue;
            }
            var bt = bm.life / bm.maxLife;
            bm.mesh.material.opacity = bt;
            bm.mesh.scale.setScalar(bm.size * (0.55 + (1 - bt) * 0.6));
        }

        this.particleMesh.count=this.particles.length;
        for(var pi=0;pi<this.particles.length;pi++) {
            var particle=this.particles[pi];particle.updateMatrix();
            this.particleMesh.setMatrixAt(pi,particle.matrix);
            this._particleColor.copy(particle.material.color).multiplyScalar(.4+.6*particle.material.opacity);
            this.particleMesh.setColorAt(pi,this._particleColor);
        }
        this.particleMesh.instanceMatrix.needsUpdate=true;
        if(this.particleMesh.instanceColor)this.particleMesh.instanceColor.needsUpdate=true;
    }
}


/* ===== [[ js/squad.js ]] ===== */
// ===== 小队系统: 实例化渲染/阵型/膨胀动画 =====

class Squad {
    constructor(scene, profile) {
        this.scene = scene;
        this.profile = profile || null; // V5.1: 永久档案(升级属性)
        this.x = 0;
        this.z = 0;
        this.lane = 1;
        this.targetX = CONFIG.LANE_X[1];
        this.count = 0;
        this.damageBuff = 0;
        this.fireRateBuff = 0;
        // V3.3: 扩展Buff体系
        this.pierce = 0;        // 穿透层数(0-3)
        this.critChance = 0;    // 暴击率(0-0.5)
        this.freezeStacks = 0;  // 冰冻弹(命中减速)
        this.vampStacks = 0;    // 吸血(击杀回复)
        this.alive = true;

        // 士兵数据数组
        this.soldiers = [];

        // V4.1: loaded rigid GLB parts, shared by hero/LOD instance banks.
        this.renderer = new SoldierRenderer(scene);
        this.mesh = this.renderer.mesh;       // compatibility aliases used by tests/debug UI
        this.legMeshL = this.renderer.legMeshL;
        this.legMeshR = this.renderer.legMeshR;
        this._legMeshes = [this.legMeshL, this.legMeshR];
        this._moving = false;
        this._lean = 0;
        this._tilt = 0;
    }

    /** V10 QA: 小队人数上限 = 基础上限 + 科技"军团上限"加成(原科技 army_limit 定义后从未生效) */
    _maxLimit() {
        var g = this._gameRef;
        var bonus = (g && g._techStats && g._techStats.limitBonus) || 0;
        return CONFIG.SQUAD_MAX_COUNT + bonus;
    }

    /** Automatic recruitment reports actual gains after the squad cap. */
    addReinforcements(amount, source, effects) {
        if (this.count <= 0 || amount <= 0) return 0;
        var before = this.count;
        this.setCount(this.count + amount);
        var added = this.count - before;
        if (added > 0 && effects) effects.reinforcement(this, source, added);
        return added;
    }

    /** 设置小队人数(自动处理增减与弹出动画) */
    setCount(n) {
        n = clamp(Math.floor(n), 0, this._maxLimit());
        const old = this.count;
        this.count = n;

        if (n > old) {
            // 新增士兵: 从中心弹出 (V3.7: 附带固定个体微抖动, 打破网格僵硬感)
            for (let i = old; i < n; i++) {
                this.soldiers.push({
                    fx: 0, fz: 0,
                    x: randRange(-0.15, 0.15),
                    z: randRange(-0.15, 0.15),
                    spawnT: 0,
                    phase: Math.random() * Math.PI * 2,
                    rotY: randRange(-0.09, 0.09),
                    jx: randRange(-0.07, 0.07),
                    jz: randRange(-0.05, 0.05)
                });
            }
        } else if (n < old) {
            this.soldiers.length = n;
        }

        this.alive = n > 0;
        this._updateFormation();
    }

    /** Balanced compact ranks. Adjacent rows differ by at most one soldier. */
    _updateFormation() {
        const n = this.count;
        let preferredCols, sx, sz, scale;
        if (n <= 1)        { preferredCols = 1;  sx = 0.72; sz = 0.72; scale = 1; }
        else if (n <= 12)  { preferredCols = Math.ceil(Math.sqrt(n)); sx = 0.70; sz = 0.72; scale = 1; }
        else if (n <= 100) { preferredCols = 6;  sx = 0.70; sz = 0.74; scale = 0.86; }
        else if (n <= 300) { preferredCols = 11; sx = 0.37; sz = 0.50; scale = 0.55; }
        else               { preferredCols = 13; sx = 0.328; sz = 0.46; scale = 0.50; }

        const rows = n > 0 ? Math.ceil(n / preferredCols) : 0;
        const shortRow = rows ? Math.floor(n / rows) : 0;
        let longRows = rows ? n % rows : 0;
        const rowLengths = [];
        // Spread longer rows through the formation rather than leaving one
        // visibly incomplete tail row.
        for (let row = 0; row < rows; row++) {
            const remainingRows = rows - row;
            const makeLong = longRows > 0 && (row % 2 === 0 || longRows === remainingRows);
            rowLengths.push(shortRow + (makeLong ? 1 : 0));
            if (makeLong) longRows--;
        }
        this._formationCols = rowLengths.length ? Math.max.apply(Math, rowLengths) : 1;
        this._formationSpacingX = sx;
        this._formationScale = scale;
        let soldierIndex = 0;
        let maxAbsX = 0;
        let maxZ = 0;
        for (let row = 0; row < rowLengths.length; row++) {
            const rowCount = rowLengths[row];
            for (let col = 0; col < rowCount; col++) {
                const s = this.soldiers[soldierIndex++];
                const staggerAmount = sx * (n <= 100 ? 0.10 : 0.16);
                const stagger = row % 2 ? staggerAmount : -staggerAmount;
                s.fx = (col - (rowCount - 1) / 2) * sx + (n > 1 ? stagger : 0) + s.jx * 0.45;
                s.fz = row * sz + s.jz * 0.5 + Math.abs(col - (rowCount - 1) / 2) * 0.055;
                maxZ=Math.max(maxZ,s.fz);
                maxAbsX = Math.max(maxAbsX, Math.abs(s.fx));
            }
        }
        // Model shoulder envelope is ~0.72 wide at scale 1.
        this._halfWidth = maxAbsX + 0.48 * scale;
        this._formationDepth=maxZ;
    }

    /** 队伍半宽(含单兵半径+交错余量) — 移动边界钳制与门触发窗口共用 */
    getHalfWidth() {
        return this._halfWidth || 0.36;
    }

    getDepth() { return this._formationDepth || 0; }

    /** 僵尸击杀士兵 (V3.3: 复活无敌期间免疫) */
    killSoldiers(n, effects) {
        if (this.invulnT > 0) return; // 复活无敌
        var lethal = n >= this.count;
        // VNext: 伤害减免(科技/职业/装备, 上限60%) — 只作用于非致命伤害, 致命一击保留护盾判定
        // 概率化取整: 期望值精确且保持整数(避免小数人数破坏 setCount)
        if (!lethal && this._totalDr > 0) {
            var reduced = n * (1 - this._totalDr);
            n = Math.floor(reduced) + (Math.random() < reduced % 1 ? 1 : 0);
            if (n <= 0) {
                if (effects) effects.floatText(this.x, 1.8, this.z, '减伤!', '#75DFFF', false);
                return;
            }
        }
        // V6.0: 能量护盾技能 — 挡致命伤害, 冷却恢复
        if (this._skillShieldMax && this._skillShield > 0 && lethal && this._shieldCd <= 0) {
            this._skillShield--;
            this._shieldCd = this._comboUndying ? 3 : 6; // V8.0: 不灭意志组合减冷却
            if (effects) effects.floatText(this.x, 2.2, this.z, '护盾格挡!', '#4DA8FF', true);
            // V8.0: 毒性护盾组合 — 格挡时毒化周围敌人(由combat下一帧读取)
            if (this._comboToxicWard) this._toxicWardPulse = true;
            return;
        }
        const before = this.count;
        var removed = Math.min(before, Math.max(0, Math.floor(n)));
        var removedStart = before - removed;
        if (removed > 0) this.renderer.captureDeaths(removedStart, before, this);
        // V2.2修复: 先保存被杀士兵位置，再截断数组(原代码先截断再读取导致undefined)
        var deathPos = [];
        if (effects && n > 0) {
            var startIdx = removedStart;
            for (let i = startIdx; i < Math.min(before, startIdx + 3); i++) {
                if (this.soldiers[i]) {
                    deathPos.push({ x: this.soldiers[i].x, z: this.soldiers[i].z });
                }
            }
        }
        this.setCount(this.count - n);
        if (this.count > 0 && removed > 0) this.renderer.triggerHit();
        // 在被杀士兵位置生成蓝色死亡粒子
        if (effects && deathPos.length > 0) {
            for (let i = 0; i < deathPos.length; i++) {
                effects.burst(
                    this.x + deathPos[i].x, 0.5, this.z + deathPos[i].z,
                    0x4A90D9, 5, 2.5, 0.4
                );
            }
        }
    }

    /** 应用状态门效果 (V3.3: 完整Buff体系) */
    applyGate(gate, effects) {
        var added = 0;
        if (gate.op === 'add') {
            added = gate.value;
            this.setCount(this.count + gate.value);
        } else if (gate.op === 'addpct') {
            // V5.1: 百分比人数门(+20%/+50%), 至少+1
            added = Math.max(1, Math.floor(this.count * gate.value / 100));
            this.setCount(this.count + added);
        } else if (gate.op === 'skill') {
            // V6.0: 肉鸽技能门 — 技能升层, 立即生效
            if (typeof Skills !== 'undefined') Skills.apply(this, gate.value);
            added = 0;
        } else if (gate.op === 'nuke') {
            // V5.1: 史诗门 全屏爆炸 — 由 Game 在下帧对所有场上怪结算(this.nukePending)
            this.nukePending = true;
        } else if (gate.op === 'mul') {
            added = this.count * (gate.value - 1);
            this.setCount(this.count * gate.value);
        } else if (gate.op === 'coin') {
            // V11.1: 金币奖励门 — 真实入账
            if (this.profile) this.profile.addCoins(gate.value);
            if (effects) effects.floatText(this.x, 2.0, this.z, '+' + gate.value + ' 金币', '#FFC247', true);
            added = 0;
        } else if (gate.op === 'risk') {
            // V3.3: 风险门 — 红色, 人数-30%换输出+2
            var lost = Math.floor(this.count * 0.3);
            this.setCount(Math.max(1, this.count - lost));
            this.damageBuff = Math.min(99, this.damageBuff + 2);
            added = -lost;
        } else if (gate.op === 'buff') {
            switch (gate.value) {
                case 'damage':  this.damageBuff = Math.min(99, this.damageBuff + 1); break;
                case 'damage2': this.damageBuff = Math.min(99, this.damageBuff + 2); break; // V5.1: 固定+2(旧×2易数值失控)
                case 'firerate10': this.fireRateBuff = Math.min(0.5, this.fireRateBuff + 0.1); break; // V5.1: +10%档
                case 'firerate': this.fireRateBuff = Math.min(0.5, this.fireRateBuff + 0.2); break;
                case 'pierce':  this.pierce = Math.min(3, this.pierce + 1); break;
                case 'crit':    this.critChance = Math.min(0.5, this.critChance + 0.05); break; // V5.1: +5%档
                case 'crit2':   this.critChance = Math.min(0.5, this.critChance + 0.1); break;
                case 'freeze':  this.freezeStacks = Math.min(2, this.freezeStacks + 1); break;
                case 'vamp':    this.vampStacks = Math.min(2, this.vampStacks + 1); break;
                case 'explosive': this.explosive = Math.min(2, (this.explosive || 0) + 1); break; // V5.1: 命中溅射
                case 'chain':   this.chain = Math.min(2, (this.chain || 0) + 1); break;           // V5.1: 连锁闪电
                case 'arsenal': // V5.1 史诗: 本局军备强化包
                    this.damageBuff = Math.min(99, this.damageBuff + 2);
                    this.fireRateBuff = Math.min(0.5, this.fireRateBuff + 0.2);
                    this.critChance = Math.min(0.5, this.critChance + 0.1);
                    break;
            }
        }
        // V5.0: 穿门音效(人数增长用grow, 其余用gate)
        if (typeof Platform !== 'undefined' && Platform.audio) {
            Platform.audio.play(added > 0 ? 'grow' : 'gate');
        }
        // 穿门反馈: 冲击波 + 膨胀文字 + 粒子
        if (effects) {
            var isMul = gate.op === 'mul';
            var isRisk = gate.op === 'risk';
            var isBuff = gate.op === 'buff';
            // 冲击波(乘法门更大/风险门红色)
            effects.shockwave(this.x, 0.05, this.z, isRisk ? 0xFF5B58 : (isMul ? 0xFFC247 : 0x75DFFF));
            if (isMul) effects.shockwave(this.x, 0.05, this.z, 0x75DFFF);
            // 人数变化文字
            if (added > 0) {
                effects.floatText(this.x, 1.6, this.z, '+' + added, '#75DFFF', isMul);
            } else if (added < 0) {
                effects.floatText(this.x, 1.6, this.z, String(added), '#FF5B58', true);
            }
            // Buff文字(按类型配色)
            if (isBuff || isRisk) {
                var texts = {
                    damage:  ['输出+1', '#FFE66D'],
                    damage2: ['输出+2', '#FFE66D'],
                    firerate:['射速+20%', '#66D68F'],
                    pierce:  ['穿透+1', '#75DFFF'],
                    crit:    ['暴击+5%', '#FFC247'],
                    freeze:  ['冰冻弹', '#9AD8FF'],
                    vamp:    ['吸血', '#66D68F'],
                    risk:    ['输出+2', '#FF5B58']
                };
                var t = texts[gate.value] || ['BUFF', '#A14DFF'];
                effects.floatText(this.x, 1.7, this.z, t[0], t[1], true);
                var burstCol = gate.value === 'crit' ? 0xFFC247 :
                    gate.value === 'freeze' ? 0x9AD8FF :
                    gate.value === 'vamp' ? 0x66D68F : 0xA14DFF;
                effects.burst(this.x, 0.6, this.z, burstCol, 10, 3, 0.5);
            }
            // 蓝色粒子扩散(人数增加时)
            if (added > 0) {
                var pCount = Math.min(12, 4 + Math.floor(added / 5));
                effects.burst(this.x, 0.5, this.z, 0x75DFFF, pCount, 3.5, 0.6);
            }
        }
    }

    update(dt, time, stopZ) {
        // V3.3: 复活无敌倒计时
        if (this.invulnT > 0) this.invulnT -= dt;
        // 前进 (Boss战时在Boss前方停下，击败Boss后继续)
        var moving = (stopZ === undefined || stopZ === null || this.z > stopZ);
        if (moving) {
            // V5.1: 前进方向统一走 BattleKinematics(CONFIG.DIRS.FORWARD_SIGN = -Z)
            this.z = BattleKinematics.advanceZ(this.z, CONFIG.SQUAD_SPEED, dt);
            if (stopZ !== undefined && stopZ !== null) this.z = Math.max(this.z, stopZ);
        }

        // V4.0: 连续目标位置 + 帧率无关平滑跟随(替代旧跳道急吸附)
        // 目标与实际位置都钳制在随队伍宽度变化的可移动边界内
        var bound = MovementMath.centerBounds(this.getHalfWidth());
        this.targetX = MovementMath.clampCenter(this.targetX, bound);
        this.x = MovementMath.clampCenter(
            damp(this.x, this.targetX, MovementMath.followLambda(), dt), bound);
        // V8.0: game 引用(武器/科技读取)
        if (this._gameRef === undefined && typeof window !== 'undefined' && window.__game) this._gameRef = window.__game;
        // V6.0: 背水阈值 + 护盾冷却
        this._halfCount = Math.floor(CONFIG.SQUAD_MAX_COUNT / (this._comboDesperate ? 1.67 : 2)); // V8.0: 绝境锋芒60%
        if (this._shieldCd > 0) this._shieldCd -= dt;
        if (this._skillShieldMax && this._shieldCd <= 0 && this._skillShield < this._skillShieldMax) this._skillShield = this._skillShieldMax;
        // V8.0: 随机事件限时buff衰减
        if (this._evDmgMulT > 0) { this._evDmgMulT -= dt; if (this._evDmgMulT <= 0) this._evDmgMul = 0; }
        if (this._evRateMulT > 0) { this._evRateMulT -= dt; if (this._evRateMulT <= 0) this._evRateMul = 0; }
        if (this._evCritT > 0) { this._evCritT -= dt; if (this._evCritT <= 0) this._evCritBonus = 0; }
        if (this._evPierceT > 0) { this._evPierceT -= dt; if (this._evPierceT <= 0) this._evPierce = 0; }
        // VNext: 职业被动(战地回复) + V10 QA: 科技"战地医疗"回血接线 + 职业技能自动循环
        var cls = this._gameRef && this._gameRef._classStats;
        var techRegen = (this._gameRef && this._gameRef._techStats && this._gameRef._techStats.regen) || 0;
        var regenN = ((cls && cls.regenN) || 0) + techRegen;
        if (regenN > 0 && this.count > 0) {
            var regenIv = (cls && cls.regenN) ? cls.regenInterval : 10; // 科技战地医疗: 每10秒
            this._regenT = (this._regenT === undefined ? regenIv : this._regenT) - dt;
            if (this._regenT <= 0) {
                this._regenT = regenIv;
                var cap = this._maxLimit();
                if (this.count < cap) {
                    this.addReinforcements(regenN, '战地医疗', this._gameRef.effects);
                }
            }
        }
        if (cls && this.count > 0) {
            this._classSkillT = (this._classSkillT === undefined ? cls.skill.firstCd : this._classSkillT) - dt;
            if (this._classSkillT <= 0) {
                this._classSkillT = cls.skill.cd;
                cls.skill.apply(this, cls.tier);
                if (this._gameRef.effects) this._gameRef.effects.floatText(this.x, 2.2, this.z, cls.skill.icon + ' ' + cls.skill.name + '!', cls.color, true);
            }
        }
        // V3.2: 换道倾斜(速度感) + 跑动前倾
        const tilt = clamp((this.x - this.targetX) * 0.28, -0.28, 0.28);
        // V5.1: 防守阵地时完全站立(无残余前倾漂移感)
        const lean = moving ? 0.1 : 0;

        this._moving = moving;
        this._lean = lean;
        this._tilt = tilt;
        // Logical positions remain independent from GLB rendering.
        for (let i = 0; i < this.count; i++) {
            const s = this.soldiers[i];

            // 弹出动画进度
            if (s.spawnT < 1) {
                s.spawnT = Math.min(1, s.spawnT + dt * 3.2);
            }

            // 平滑移向阵型位置
            s.x = damp(s.x, s.fx, 9, dt);
            s.z = damp(s.z, s.fz, 9, dt);

        }
        this.renderer.update(dt, time, this, moving, lean, tilt);
        this.mesh = this.renderer.mesh;
        this.legMeshL = this.renderer.legMeshL;
        this.legMeshR = this.renderer.legMeshR;
        this._legMeshes[0] = this.legMeshL;
        this._legMeshes[1] = this.legMeshR;
    }

    /** 获取随机士兵世界位置(射击出弹点) */
    getRandomSoldierPos() {
        if (this.count === 0) return null;
        const i = Math.floor(Math.random() * this.count);
        const p = this.renderer.getMuzzlePosition(i, this);
        return { x: p.x, y: p.y, z: p.z, shooterIndex: i };
    }

    /** 获取多个射击点(分散取) */
    getShootPositions(n) {
        const positions = [];
        if (this.count === 0) return positions;
        n = Math.min(n, this.count);
        const step = this.count / n;
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(i * step + Math.random() * step) % this.count;
            this.renderer.triggerShoot(idx);
            const p = this.renderer.getMuzzlePosition(idx, this);
            positions.push({ x: p.x, y: p.y, z: p.z, shooterIndex: idx });
        }
        return positions;
    }

    /** 获取伤害值(永久枪械升级 + 门buff) V5.1: 上限99 */
    getDamage() {
        var gun = this.profile && typeof UpgradeShop !== 'undefined' ? UpgradeShop.damageBonus(this.profile) : 0;
        var dmg = CONFIG.BULLET_DAMAGE_BASE + gun + this.damageBuff;
        // V8.0: 科技伤害加成(火力科技"弹药强化") + 武器伤害乘区 — 修复: 原先只算了不 consuming
        if (this._gameRef) {
            var tech = this._gameRef._techStats;
            if (tech && tech.dmgBonus) dmg += tech.dmgBonus;
            var w = this._gameRef._weaponStats;
            if (w && w.dmgMul) dmg *= w.dmgMul;
            // VNext: 职业伤害乘区
            var c = this._gameRef._classStats;
            if (c && c.dmgMul) dmg *= c.dmgMul;
        }
        return Math.min(99, Math.round(dmg * 10) / 10);
    }

    /** 获取射速(永久快速射击升级 + 门buff) V5.1: 全局上限3.0 */
    getFireRate() {
        var mul = this.profile && typeof UpgradeShop !== 'undefined' ? UpgradeShop.fireRateMul(this.profile) : 1;
        // V8.0: 武器+科技射速(从 game 引用)
        if (this._gameRef && this._gameRef._weaponStats && this._gameRef._weaponStats.rateMul) mul *= this._gameRef._weaponStats.rateMul;
        if (this._gameRef && this._gameRef._techStats && this._gameRef._techStats.rateBonus) mul *= (1 + this._gameRef._techStats.rateBonus);
        // V6.0: 无人机技能 — 每层+15%射速 (V8.0: 火力全开组合+25%/层)
        if (this._skillDrones) mul *= 1 + (this._comboFullBarrage ? 0.25 : 0.15) * this._skillDrones;
        // V11.2: 迅捷弹幕 — 每层+12%射速
        if (this._skillSwiftness) mul *= 1 + 0.12 * this._skillSwiftness;
        // V11.2: 火力流派 — 射速 +10%
        if (this._comboFireFlow) mul *= 1.1;
        // V8.0: 毒雾僚机组合 — 毒液层附带射速
        if (this._comboSwarmVenom && this._skillVenom) mul *= 1 + 0.08 * this._skillVenom;
        // V8.0: 随机事件射速buff
        if (this._evRateMul) mul *= this._evRateMul;
        // VNext: 职业射速乘区
        if (this._gameRef && this._gameRef._classStats && this._gameRef._classStats.rateMul) mul *= this._gameRef._classStats.rateMul;
        return Math.min(3.0, CONFIG.BULLET_FIRE_RATE_BASE * mul * (1 + this.fireRateBuff));
    }

    setAnimationState(name) {
        this.renderer.setState(name);
    }

    reset(startCount) {
        this.renderer.clearGhosts();
        this.renderer.setState(null);
        this.renderer._shootT.fill(0);
        this.renderer._hitT = 0;
        this.x = 0;
        this.z = 0;
        this.lane = 1;
        this.targetX = CONFIG.LANE_X[1];
        this.damageBuff = 0;
        this.fireRateBuff = 0;
        this.pierce = 0;
        this.critChance = 0;
        this.freezeStacks = 0;
        this.vampStacks = 0;
        this.explosive = 0;
        this.chain = 0;
        this.nukePending = false;
        this._skillRage = 0; this._skillDrones = 0; this._skillVenom = 0;
        this._skillShieldMax = 0; this._skillShield = 0; this._shieldCd = 0;
        this._skillMagnet = 0; this._skillBerserk = 0; this._skills = null;
        // V8.0: 技能组合+事件buff复位
        this._comboPlagueFury = 0; this._comboDesperate = 0; this._comboSwarmVenom = 0;
        this._comboUndying = 0; this._comboGreedFire = 0; this._comboRecycle = 0;
        this._comboToxicWard = 0; this._comboFullBarrage = 0; this._comboVenomBounty = 0;
        this._comboGuardianFury = 0; this._toxicWardPulse = false;
        this._evDmgMul = 0; this._evDmgMulT = 0; this._evRateMul = 0; this._evRateMulT = 0;
        this._evCritBonus = 0; this._evCritT = 0; this._evPierce = 0; this._evPierceT = 0;
        this._skillSwiftness = 0; this._skillDeadly = 0; this._critMul = 0;
        this._skillHarvest = 0; this._skillFortune = 0;
        this._comboFireFlow = 0; this._comboPierceFlow = 0; this._comboSwarmFlow = 0;
        this._regenT = undefined; this._classSkillT = undefined;
        this._totalDr = 0; this._classBulletSpeed = 1.0;
        this.invulnT = 0; // V12: 复活无敌时间复位, 防残留到下一局
        this.alive = true;
        this.soldiers = [];
        this.count = 0; // 必须重置count, 否则setCount认为人数未变不补充士兵
        this.setCount(startCount);
    }
}


/* ===== [[ js/gates.js ]] ===== */
// ===== 状态门系统 =====

class GateSystem {
    constructor(scene) {
        this.scene = scene;
        this.gates = [];
        this.chosenRows = new Set();
    }

    /** 从关卡数据加载所有状态门 */
    loadFromLevel(level) {
        this.clear();
        GateRewardPool.lastWasMul = false; // V12: ×2连续抑制状态跨局复位
        for (const seg of level.segments) {
            if (seg.type !== 'gates') continue;
            // V2.2: 每扇门宽度=单车道宽(1.8)，不再用两门间距(4.0导致门超出路面)
            var gateWidth = CONFIG.LANE_WIDTH * 0.9;
            for (const gd of seg.gates) {
                // V5.1: 史诗门(×2/人数%大额)用金色
                if (!gd.style) gd.style = (gd.op === 'mul' || gd.op === 'nuke') ? 'mul' : (gd.op === 'addpct' ? 'buff' : (gd.op === 'risk' ? 'risk' : (gd.op === 'buff' ? 'buff' : 'add')));
                gd.tier = gd.tier || (gd.op === 'mul' ? 'rare' : 'common');
                const model = V42Art.createGateModel(gd, gateWidth);
                model.userData.artSource = 'js/models.js:createGateModel(' + gd.op + '/' + (gd.label || '') + ') 玻璃纹理:createGateGlassTexture(参考assets/art-v1/ui/gate-panel.svg)';
                model.position.set(CONFIG.LANE_X[gd.lane], 0, seg.z);
                this.scene.add(model);
                this.gates.push({
                    // VNext修复: 克隆门数据 — 原实现按引用共享 LEVELS 配置对象,
                    // resolveSkillGates 会把 value:'roll' 改写成具体技能并永久污染关卡常量(重玩不再随机)
                    data: Object.assign({}, gd),
                    model: model,
                    z: seg.z,
                    x: CONFIG.LANE_X[gd.lane],
                    triggered: false,
                    passed: false
                });
            }
        }
    }

    clear() {
        for (const g of this.gates) {
            this.scene.remove(g.model);
            // V4.0: 释放纹理+材质+几何体(每局重建, 不释放会累积GPU缓冲)
            g.model.traverse(function(obj) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material && obj.material.map) obj.material.map.dispose();
                if (obj.material) obj.material.dispose();
            });
        }
        this.gates = [];
        this.chosenRows.clear();
    }

    isRowChosen(z) {
        return this.chosenRows.has(z);
    }

    nextRowZ() {
        var nextZ = null;
        for (const g of this.gates) {
            if (g.passed || this.isRowChosen(g.z)) continue;
            if (nextZ === null || g.z > nextZ) nextZ = g.z;
        }
        return nextZ;
    }

    approachStopZ(pacing, outstanding, squadZ) {
        var z = this.nextRowZ();
        if (z === null || (outstanding === 0 && pacing.canChooseGate(z))) return null;
        // Hold before the choice area, including while waves rest or splits spawn.
        // Never pull a squad backwards when loading an already advanced position.
        return Math.min(squadZ, z + 5);
    }

    syncVisibility(pacing, outstanding) {
        var nextZ = this.nextRowZ();
        var available = outstanding === 0 && nextZ !== null && pacing.canChooseGate(nextZ);
        for (const g of this.gates) {
            g.model.visible = g.triggered || (available && g.z === nextZ && !g.passed);
        }
    }

    update(squad, effects, time, dt) {
        // V4.0: 触发窗口随队伍宽度扩展(大人数边缘可达侧门), 封顶保证左右门区间永不重叠
        var gateHalf = (CONFIG.LANE_WIDTH * 0.9) / 2;
        var triggerWin = MovementMath.gateTriggerWindow(gateHalf, squad.getHalfWidth ? squad.getHalfWidth() : 0);
        var stepDt = dt || 0.016;
        // A row is one decision even when the crowd envelope touches multiple
        // glass panels. Choose the nearest gate centre, never stack rewards.
        var rows = {};
        for (const candidate of this.gates) {
            if (!candidate.model.visible || candidate.triggered || candidate.passed || squad.z > candidate.z + .2 || squad.z < candidate.z - .8) continue;
            var distance = Math.abs(squad.x - candidate.x);
            if (!rows[candidate.z] || distance < rows[candidate.z].distance) rows[candidate.z] = {gate:candidate,distance:distance};
        }

        for (let i = this.gates.length - 1; i >= 0; i--) {
            const g = this.gates[i];
            if (!g.model.visible && !g.triggered) continue;

            // V5.1.1: 触发溶解动画 — 缩放收缩+玻璃/文字淡出, 完成后移除
            if (g.triggered && g.dissolveT !== undefined && g.dissolveT < 1) {
                g.dissolveT = Math.min(1, g.dissolveT + stepDt / 0.45);
                const t = g.dissolveT;
                g.model.scale.setScalar(Math.max(0.001, 1 - easeOutCubic(t)));
                const lbl = g.model.userData.label;
                if (lbl && lbl.material) lbl.material.opacity = 1 - t;
                const gls = g.model.userData.glass;
                if (gls && gls.material) { gls.material.transparent = true; gls.material.opacity = 0.5 * (1 - t); }
                if (t >= 1) { this._fadeRemove(g, i); continue; }
            }

            // 远处的门: 标签轻微浮动
            if (!g.triggered && g.model.userData.label) {
                g.model.userData.label.position.y =
                    (g.model.userData.labelBaseY || 2.46) + Math.sin(time * 2 + g.x) * 0.025;
            }

            // 接近发光
            if (!g.triggered) {
                const dist = Math.abs(squad.z - g.z);
                if (dist < 6 && dist > 0.5) {
                    const intensity = 1 - dist / 6;
                    const glass = g.model.userData.glass;
                    if (glass) {
                        glass.material.opacity = 0.45 + intensity * 0.3;
                    }
                }
            }

            // V4.0: 门磁吸辅助 — 仅当玩家已选边(距门中心<磁吸距离)时轻微吸附到该门跑道中心,
            // 不替代玩家选择(左右门磁吸区相距4, 永不重叠)
            if (!g.triggered && squad.z > g.z && squad.z - g.z < 4 &&
                Math.abs(squad.x - g.x) < CONFIG.MOVE.gateMagnetDist) {
                squad.targetX = damp(squad.targetX, g.x, CONFIG.MOVE.gateMagnetLambda, stepDt);
            }

            // 穿门检测(V4.0: 窗口=门半宽+队伍半宽补偿, 与视觉区域一致)
            if (!g.triggered && !g.passed && squad.z <= g.z + 0.2 && squad.z >= g.z - 0.8) {
                if (rows[g.z] && rows[g.z].gate === g) {
                    g.triggered = true;
                    this.chosenRows.add(g.z);
                    g.dissolveT = 0; // V5.1.1: 触发即开始溶解消失(玩家反馈: 门获得后要有消失效果)
                    for (const sibling of this.gates) if (sibling !== g && sibling.z === g.z) sibling.passed = true;
                    squad.applyGate(g.data, effects);
                    this._highlight(g, effects);
                    // V11.1: 门组合系统(同窗内成对触发真实增益)
                    if (typeof GateCombos !== 'undefined') {
                        var combo = GateCombos.feed(squad, g.data, effects, (typeof window !== 'undefined' && window.__game) || null);
                        if (combo && effects) effects.floatText(squad.x, 2.8, squad.z, combo.icon + ' 门组合 · ' + combo.name + '!', '#FFC247', true);
                    }
                    if (g.data.op === 'mul' && this.onMul) this.onMul(g); // V4.0: 翻倍慢动作+震屏
                }
            }

            // V5.1.1: 同排未选中门(passed)远离后移除; 触发门走溶解动画
            if (g.passed && !g.triggered && squad.z < g.z - 6) {
                this._fadeRemove(g, i);
            }
        }
    }

    _highlight(g, effects) {
        // 玻璃变亮
        const glass = g.model.userData.glass;
        if (glass) {
            glass.material.opacity = 0.85;
            glass.material.color.setHex(0xFFFFFF);
        }
        // 数值放大弹出
        const label = g.model.userData.label;
        if (label) {
            label.scale.multiplyScalar(1.04);
        }
        // 冲击波 + 门色粒子爆发(V5.1.1)
        if (effects) {
            effects.shockwave(g.x, 0.05, g.z, 0x6EE7B7);
            var gc = g.data && g.data.style === 'mul' ? 0xFFC247 : (g.data && g.data.style === 'buff' ? 0xA78BFA : 0x6EE7B7);
            effects.burst(g.x, 1.1, g.z, gc, 10, 3, 0.45);
        }
    }

    _fadeRemove(g, index) {
        // 直接移除(冲击波和膨胀动画已经提供了足够反馈)
        this.scene.remove(g.model);
        var geos = new Set(), mats = new Set(), textures = new Set();
        g.model.traverse(function(o) {
            if (o.geometry) geos.add(o.geometry);
            if (o.material) for (const m of (Array.isArray(o.material) ? o.material : [o.material])) mats.add(m);
        });
        mats.forEach(function(m) { for(const k in m) if(m[k] && m[k].isTexture) textures.add(m[k]); m.dispose(); });
        textures.forEach(function(t) { t.dispose(); });
        geos.forEach(function(g) { g.dispose(); });
        this.gates.splice(index, 1);
    }

    /** V6.0: 解析技能门 — 每排3个不同技能, 重建门模型 (VNext: 只认op, 每局重随机) */
    resolveSkillGates(squad) {
        if (typeof Skills === 'undefined') return;
        var rebuilt = [];
        for (var i = 0; i < this.gates.length; i++) {
            var g = this.gates[i];
            if (!g.data || g.data.op !== 'skill') continue;
            if (rebuilt.indexOf(g.z) >= 0) continue;
            rebuilt.push(g.z);
            var members = this.gates.filter(function(x) { return x.z === g.z && x.data && x.data.op === 'skill'; });
            var ids = Skills.rollChoices(squad);
            if (!ids || !ids.length) {
                // VNext修复: 全技能满级时禁止重roll出无法生效的重复选项 — 整排转人数门(+30%)
                for (var ci = 0; ci < members.length; ci++) {
                    members[ci].data.op = 'addpct';
                    members[ci].data.value = 30;
                    members[ci].data.label = '+30%';
                    members[ci].data.style = 'epic';
                    this.scene.remove(members[ci].model);
                    members[ci].model = V42Art.createGateModel(members[ci].data, CONFIG.LANE_WIDTH * 0.9);
                    this.scene.add(members[ci].model);
                    members[ci].triggered = false;
                    members[ci].passed = false;
                }
                continue;
            }
            for (var m = 0; m < members.length && m < ids.length; m++) {
                var id = ids[m];
                var def = SKILL_DEFS[id];
                var lv = squad._skills ? (squad._skills[id] || 0) : 0;
                members[m].data.value = id;
                // V11.2: 门标签带技能品质(普通/稀有/史诗)
                members[m].data.label = def.icon + ' ' + def.name + '[' + Skills.qualityName(id) + ']' + (lv > 0 ? ' Lv' + (lv + 1) : '');
                this.scene.remove(members[m].model);
                members[m].model = V42Art.createGateModel(members[m].data, CONFIG.LANE_WIDTH * 0.9);
                this.scene.add(members[m].model);
                members[m].triggered = false;
                members[m].passed = false;
            }
            // V10 QA修复: 技能池剩余不足3个时, 未重写的门仍保留 value:'roll' → 穿过时 Skills.apply('roll') 静默无效
            // (玩家白选一扇门) — 与上方空池分支同策略, 转为人数门
            for (var r = ids.length; r < members.length; r++) {
                members[r].data.op = 'addpct';
                members[r].data.value = 30;
                members[r].data.label = '+30%';
                members[r].data.style = 'epic';
                this.scene.remove(members[r].model);
                members[r].model = V42Art.createGateModel(members[r].data, CONFIG.LANE_WIDTH * 0.9);
                this.scene.add(members[r].model);
                members[r].triggered = false;
                members[r].passed = false;
            }
        }
    }

    /**
     * V3.4: 广告刷门 — 重随前方(squadZ更小一侧)未触发的门
     * 只影响未触发门(旧门奖励作废), 已触发门保持; 加门权重随人数收敛, 防无限刷稀有门
     * @returns 重随的门数量
     */
    refreshAhead(squadZ) {
        var gateWidth = CONFIG.LANE_WIDTH * 0.9;
        var rerolled = 0;
        for (var i = 0; i < this.gates.length; i++) {
            var g = this.gates[i];
            if (g.triggered) continue;
            if (g.z >= squadZ) continue; // 已越过/脚下的门不重随

            var nd = GateSystem._rerollGateData(g.data, CONFIG.SQUAD_MAX_COUNT); // V5.1: 走 GateRewardPool(状态感知)
            // 重建模型
            this.scene.remove(g.model);
            g.model.traverse(function(obj) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material && obj.material.map) obj.material.map.dispose();
                if (obj.material) obj.material.dispose();
            });
            var model = V42Art.createGateModel(nd, gateWidth);
            model.position.set(CONFIG.LANE_X[nd.lane], 0, g.z);
            this.scene.add(model);
            g.data = nd;
            g.model = model;
            g.triggered = false;
            g.passed = false;
            rerolled++;
        }
        return rerolled;
    }

    /** 门数据重随: op/value/label 全部重新生成 */
    static _rerollGateData(oldData, maxCount) {
        return GateRewardPool.roll(oldData.lane, (typeof window !== 'undefined' && window.__game && window.__game.squad) ? window.__game.squad : null, false);
    }
}

// ===== V5.1 门奖励池 (普通~75% / 稀有~20% / 史诗~5%; ×2 仅属稀有池且受抑制) =====
var GATE_REWARD_POOL = {
    common: [
        { op: 'add',    value: 3,  label: '+3',      w: 6 },
        { op: 'add',    value: 5,  label: '+5',      w: 6 },
        { op: 'add',    value: 8,  label: '+8',      w: 5 },
        { op: 'add',    value: 12, label: '+12',     w: 4 },
        { op: 'buff',   value: 'damage',   label: '输出+1',   w: 4, style: 'buff' },
        { op: 'buff',   value: 'firerate10', label: '射速+10%', w: 4, style: 'buff' },
        { op: 'buff',   value: 'crit',     label: '暴击+5%',  w: 3, style: 'buff' },
        { op: 'buff',   value: 'pierce',   label: '穿透+1',   w: 2, style: 'buff' }
    ],
    rare: [
        { op: 'addpct', value: 20, label: '人数+20%', w: 3, style: 'buff' },
        { op: 'buff',   value: 'damage2', label: '输出+2',  w: 3, style: 'buff' },
        { op: 'buff',   value: 'crit2',   label: '暴击+10%', w: 3, style: 'buff' },
        { op: 'buff',   value: 'freeze',  label: '冰冻弹',   w: 2, style: 'buff' },
        { op: 'buff',   value: 'vamp',    label: '吸血',     w: 2, style: 'buff' },
        { op: 'buff',   value: 'explosive', label: '爆炸弹', w: 2, style: 'buff' },
        { op: 'buff',   value: 'chain',   label: '连锁闪电', w: 2, style: 'buff' },
        { op: 'mul',    value: 2,  label: '×2', w: 2, style: 'mul' },
        { op: 'coin',   value: 30, label: '🪙 30金币', w: 1.5, style: 'mul' } // V11.1: 金币奖励门
    ],
    epic: [
        { op: 'addpct', value: 50, label: '人数+50%', w: 1.5, style: 'mul' },
        { op: 'nuke',   value: 0,  label: '全屏爆炸', w: 1.5, style: 'mul' },
        { op: 'buff',   value: 'arsenal', label: '军备强化', w: 1.5, style: 'mul' },
        { op: 'coin',   value: 80, label: '🪙 80金币', w: 1, style: 'mul' } // V11.1: 史诗金币门
    ]
};

var GateRewardPool = {
    lastWasMul: false, // ×2连续抑制
    /** 按稀有度概率(75/20/5)选池, 再按权重+队伍状态选具体奖励 */
    roll: function(lane, squad, forceNoMul) {
        // 稀有度概率: 普通75% 稀有20% 史诗5%
        var r = Math.random();
        var tier = r < 0.75 ? 'common' : (r < 0.95 ? 'rare' : 'epic');
        var pool = GATE_REWARD_POOL[tier].slice();
        var count = squad ? squad.count : 10;
        var weights = [];
        for (var i = 0; i < pool.length; i++) {
            var item = pool[i];
            var w = item.w;
            // ×2 连续抑制
            if (item.op === 'mul' && (this.lastWasMul || forceNoMul)) w = 0;
            // 队伍状态感知: 人数少抬人数门, 人数多压人数门
            if (item.op === 'add' || item.op === 'addpct') {
                w *= count < 8 ? 1.6 : (count > 120 ? 0.6 : 1);
            }
            // 满级属性不再出现(无效奖励)
            if (squad) {
                if (item.value === 'pierce' && squad.pierce >= 3) w = 0;
                if (item.value === 'crit' && squad.critChance >= 0.5) w = 0;
                if (item.value === 'crit2' && squad.critChance >= 0.5) w = 0;
                if (item.value === 'firerate10' && squad.fireRateBuff >= 0.5) w = 0;
            }
            weights.push(w);
        }
        var total = 0;
        for (var k = 0; k < weights.length; k++) total += weights[k];
        // 该池全被抑制: 回退普通池的加人门
        if (total <= 0) return { lane: lane, op: 'add', value: 5, label: '+5', tier: 'common' };
        var pick = Math.random() * total;
        var chosen = pool[pool.length - 1];
        for (var j = 0; j < pool.length; j++) {
            pick -= weights[j];
            if (pick <= 0) { chosen = pool[j]; break; }
        }
        this.lastWasMul = (chosen.op === 'mul');
        var out = { lane: lane, op: chosen.op, value: chosen.value, label: chosen.label, tier: tier };
        if (chosen.style) out.style = chosen.style;
        return out;
    }
};

// ===== V11.1: 门组合效果 (同类/协同门在14秒窗内成对出现 → 真实增益, 每组合独立20s冷却) =====
function _gateCategory(op, value) {
    if (op === 'add' || op === 'addpct' || op === 'mul') return 'count';
    if (op === 'buff') {
        if (value === 'damage' || value === 'damage2') return 'attack';
        if (value === 'firerate' || value === 'firerate10') return 'rate';
        if (value === 'crit' || value === 'crit2') return 'crit';
        if (value === 'pierce') return 'pierce';
    }
    if (op === 'coin') return 'coin';
    return 'special';
}

var GATE_COMBO_DEFS = [
    { id: 'horde_fury',    name: '人海战术', icon: '👥', catA: 'count',  catB: 'attack',
      desc: '10秒伤害×1.5', apply: function(s) { s._evDmgMul = 1.5; s._evDmgMulT = 10; } },
    { id: 'fire_synergy',  name: '火力共鸣', icon: '🔥', catA: 'attack', catB: 'rate',
      desc: '8秒射速×1.6', apply: function(s) { s._evRateMul = 1.6; s._evRateMulT = 8; } },
    { id: 'weak_strike',   name: '弱点打击', icon: '🎯', catA: 'crit',   catB: 'attack',
      desc: '10秒暴击+25%', apply: function(s) { s._evCritBonus = 0.25; s._evCritT = 10; } },
    { id: 'pierce_rain',   name: '穿刺弹幕', icon: '🔩', catA: 'pierce', catB: 'rate',
      desc: '10秒穿透+2', apply: function(s) { s._evPierce = 2; s._evPierceT = 10; } },
    { id: 'gold_rush',     name: '财源滚滚', icon: '🪙', catA: 'coin',   catB: 'count',
      desc: '立即+40金币', apply: function(s, game) { if (game && game.profile) game.profile.addCoins(40); } },
    { id: 'tide_surge',    name: '怒潮',    icon: '🌊', catA: 'count',  catB: 'count',
      desc: '人数+15%', apply: function(s) { s.setCount(Math.min(CONFIG.SQUAD_MAX_COUNT, s.count + Math.max(1, Math.round(s.count * 0.15)))); } }
];

var GateCombos = {
    WINDOW: 14, COOLDOWN: 20,
    _log: [], _cd: {},
    reset: function() { this._log = []; this._cd = {}; },
    /** 门触发时投喂; 命中组合返回 def 并施加真实效果 */
    feed: function(squad, data, effects, game) {
        var cat = _gateCategory(data.op, data.value);
        var now = (typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000);
        this._log = this._log.filter(function(e) { return now - e.t < this.WINDOW; }, this);
        var activated = null;
        for (var i = 0; i < GATE_COMBO_DEFS.length; i++) {
            var c = GATE_COMBO_DEFS[i];
            if (this._cd[c.id] && now - this._cd[c.id] < this.COOLDOWN) continue;
            var matched = null;
            if (c.catA === cat) {
                for (var j = this._log.length - 1; j >= 0; j--) {
                    if (this._log[j].cat === c.catB) { matched = this._log[j]; break; }
                }
            } else if (c.catB === cat) {
                for (var j2 = this._log.length - 1; j2 >= 0; j2--) {
                    if (this._log[j2].cat === c.catA) { matched = this._log[j2]; break; }
                }
            }
            if (matched) {
                c.apply(squad, game);
                this._cd[c.id] = now;
                activated = c;
                break;
            }
        }
        this._log.push({ cat: cat, t: now });
        if (this._log.length > 8) this._log.shift();
        return activated;
    }
};
if (typeof window !== 'undefined') window.GateCombos = GateCombos;


/* ===== [[ js/enemies.js ]] ===== */
// ===== 僵尸/Boss 系统 =====

class Enemy {
    constructor(type, x, z, scene, hpOverride, styleOverride) {
        this.type = type;
        this.cfg = CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal;
        this.hp = hpOverride || this.cfg.hp;   // V3.3: 关卡可覆盖Boss血量
        this.maxHp = this.hp;
        this.x = x;
        this.z = z;
        this.alive = true;
        this.attackTimer = 0;
        this.hitFlash = 0;
        this.knockback = 0;
        this.frozenT = 0;       // V3.3: 冰冻减速剩余时间
        this._frozenFx = false; // 冰冻粒子只播一次
        this.spitTimer = randRange(1, 2);
        this.phase = Math.random() * Math.PI * 2;
        this.isBoss = (type === 'boss');
        this.enraged = false;   // V3.2: Boss狂暴阶段标记
        this.speedMul = 1;      // 移速倍率
        this._returningToFront = false;
        this.attackMul = 1;     // 攻击间隔倍率
        this.dying = false;
        this.dieT = 0;
        this.deathHandled = false;
        this.removeReady = false;
        this.spawnT = this.isBoss ? 0 : 1; // V4.0: Boss弹性入场动画

        // V3.5: 大众僵尸使用合并批处理模型(2 mesh/只), Boss/精英保留Group模型(细节动画+独立材质)
        this.artStyle = styleOverride || (this.isBoss ? 'bruiser' : (type === 'bomber' ? 'fast' : type)); // V11.5: 爆炸僵尸复用快速尸模型(红染/小体)
        this.model = new THREE.Group();
        this.model.userData.merged = true;
        this.model.userData.artSource = 'assets/models/'+(['normal','fast','shield','split','spitter','elite'].includes(this.artStyle)?'zombies':'bosses')+'/'+this.artStyle+'/'+this.artStyle+'.glb (instanced anchor)';
        this.model.position.set(x, 0, z);
        this.model.scale.setScalar(this.cfg.scale); // V2.2修复: 存活时应用类型scale
        this.visScale = this.cfg.scale; // 实际视觉scale(分裂僵尸会缩小)
        if(this.isBoss && this.artStyle==='elite') {this.visScale=2.25;this.model.scale.setScalar(this.visScale);}
        scene.add(this.model);
        this._baseRotY = this.model.rotation.y; // V3.7: 行走摇摆基准朝向(合并模型0 / Group模型PI)

        // 收集可闪烁材质(合并模型无独立材质 → 用缩放冲击代替闪烁)
        this.flashMats = [];
        this.model.traverse(function(obj) {
            if (obj.material && obj.material.emissive) {
                this.flashMats.push(obj.material);
            }
        }.bind(this));
    }

    takeDamage(dmg, effects, fromX, isCrit) {
        if (!this.alive) return false;
        var actualDamage = this.shieldT > 0 ? dmg * .3 : dmg;
        if(this.artStyle==='titan')actualDamage*=.85;
        this.hp -= actualDamage;
        this.hitFlash = 0.13;
        this._deathSide = clamp((this.x - (fromX === undefined ? this.x : fromX)) * 2, -1.4, 1.4);
        // 击退(非Boss)
        if (!this.isBoss) this.knockback = Math.min(this.knockback + 1.5, 3);
        // 命中火花
        if (effects) {
            effects.burst(this.x, 0.65, this.z, isCrit ? 0xFF8844 : 0xFFE066, isCrit ? 6 : 3, 2.5, .25);
            if (effects.impact) effects.impact(this.x, .85, this.z, isCrit, this.hp <= 0);
            // 伤害数字 (V3.6: 降低概率避免大规模战斗时文字刷屏; V3.3: 暴击必显大字)
            if (isCrit) {
                effects.floatText(this.x, 1.0, this.z, String(Math.round(dmg * 100) / 100), '#FF8844', true);
            } else if (Math.random() < 0.12) {
                effects.floatText(this.x, 0.9, this.z, String(Math.round(dmg * 100) / 100), '#FFD700', false);
            }
        }
        if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('hit');
        if (this.hp <= 0) {
            this.die(effects);
            return true;
        }
        return false;
    }

    die(effects) {
        this.alive = false;
        this.dying = true;
        this.dieT = 0;
        if (effects) {
            // 卡通粒子爆开
            effects.burst(this.x, 0.5, this.z, this.cfg.color, 12, 3.5, 0.6);
            effects.burst(this.x, 0.5, this.z, 0xFFFFFF, 4, 2, 0.3);
            // 金色积分光点
            effects.burst(this.x, 0.7, this.z, 0xFFD700, 3, 2.2, 0.8);
            // V12视觉: 地面尸液痕迹(大体型更大; decal池内自动限流)
            if (effects.splat) effects.splat(this.x, this.z, this.visScale * (this.isBoss ? 1.6 : 0.9));
        }
    }

    update(dt, time, squad, manager, effects) {
        // === 死亡动画: 后仰+缩小 ===
        if (this.dying) {
            this.dieT += dt;
            var dur = this.isBoss ? 0.8 : 0.46;
            var t = Math.min(1, this.dieT / dur);
            // 后仰
            this.model.rotation.x = -t * 1.4;
            this.model.rotation.z += (this._deathSide || .35) * dt * 2.5;
            this.model.position.y = Math.sin(t * Math.PI) * (this.isBoss ? .25 : .65);
            this.model.position.z = this.z - t * (this.isBoss ? .25 : 1.35);
            this.model.position.x = this.x + (this._deathSide || .25) * t;
            // 缩小消失 (V2.2: 使用visScale避免分裂僵尸跳变)
            var s = this.visScale * (1 - t * t);
            this.model.scale.setScalar(Math.max(0.001, s));
            if (this.dieT >= dur) {
                this.removeReady = true;
            }
            return;
        }
        if (!this.alive) return;
        this.attackT=Math.max(0,(this.attackT||0)-dt*3);

        // V4.0: Boss入场弹性缩放(0.5s, 期间不移动不攻击)
        if (this.spawnT < 1) {
            this.spawnT = Math.min(1, this.spawnT + dt * 2);
            this.model.scale.setScalar(this.visScale * Math.max(0.05, easeOutBack(this.spawnT)));
            if (this.spawnT < 1) return;
        }
        if(this.isBoss)V42BossController.update(this,dt,squad,manager,effects);

        // V3.3: 冰冻减速
        if (this.frozenT > 0) this.frozenT -= dt;
        const frozen = this.frozenT > 0;

        const dz = squad.z - this.z;
        const dist = Math.abs(dz);
        const attackDist = CONFIG.ZOMBIE_ATTACK_DIST * (this.isBoss ? 2.5 : 1);

        // V3.2: Boss狂暴阶段 — 血量50%触发, 移速/攻击提升 + 红色氛围
        if (this.isBoss && !this.enraged && this.hp <= this.maxHp * (this.artStyle==='overlord'?.33:.5)) {
            this.enraged = true;
            this.speedMul = 1.5;
            this.attackMul = 0.65; // 攻击间隔缩短
            if (effects) {
                effects.floatText(this.x, 2.6, this.z, '狂暴!', '#FF4444', true);
                effects.shockwave(this.x, 0.05, this.z, 0xFF4444);
                effects.burst(this.x, 1.2, this.z, 0xFF3333, 18, 4, 0.7);
            }
            var self = this;
            this.model.traverse(function(obj) {
                if (obj.material && obj.material.emissive) obj.material.emissive.setHex(0x3A0000);
            });
        }

        // 吐痰僵尸: 远程攻击
        // V5.1.3: 攻击间隔随场上吐痰怪数量摊薄(×3体量下24只齐射=12击杀/秒, 任何队伍都融化)
        if (this.type === 'spitter' && dist > attackDist && dist < 10) {
            this.spitTimer -= dt;
            if (this.spitTimer <= 0) {
                this.spitTimer = randRange(1.8, 2.5) * (1 + 0.3 * ((manager && manager._spitterCount) || 1));
                manager.spawnSpit(this.x, 0.5, this.z, squad);
            }
        }

        // Rear ambushes must finish flanking into the forward firing line.
        // Stopping at melee distance behind a lone soldier left them untargetable
        // forever, which also held the next gate's encounter lock forever.
        if (dz < 0) this._returningToFront = true;
        if (this.z <= squad.z - attackDist) this._returningToFront = false;
        if (dist > attackDist || this._returningToFront) {
            // V5.1.1修复: 前方怪(+Z)向防线追击; 落后于军团的怪(-Z)以2.5倍冲刺归队
            // (旧Math.abs(sign)写反了落后怪方向 → 怪永远追不上 → 波次永不完成关卡卡死)
            const behind = this._returningToFront;
            const spd = this.cfg.speed * (this.speedMul || 1) * (frozen ? 0.3 : 1) * (behind ? 2.5 : 1);
            if (behind) this.z = Math.max(squad.z - attackDist, this.z - spd * dt);
            else this.z = BattleKinematics.enemyApproachZ(this.z, spd, dt);
            const dx = squad.x - this.x;
            this.x += clamp(dx, -1, 1) * spd * 0.4 * dt;
        } else if (Math.abs(this.x - squad.x) > (squad.getHalfWidth ? squad.getHalfWidth() : 1) + (this.isBoss ? 1.2 : .45)) {
            this.x += Math.sign(squad.x - this.x) * this.cfg.speed * dt;
        } else {
            // Melee requires horizontal contact too, not just a matching Z.
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                // V5.1.4: Boss攻击间隔×2(挥击1.6s, 磨损0.625/s) — Boss竞速与召唤磨损平衡
                this.attackTimer = CONFIG.ZOMBIE_ATTACK_INTERVAL * (this.attackMul || 1) * (frozen ? 2 : 1) * (this.isBoss ? 2 : 1);
                this.attackT=1;
                const kill = this.isBoss ? (this.enraged ? 3 : 1) : CONFIG.ZOMBIE_ATTACK_KILL; // 非狂暴1/狂暴3
                squad.killSoldiers(kill, effects);
                if (effects) {
                    effects.burst(squad.x, 0.5, squad.z, 0xFF4444, 5, 2, 0.3);
                }
            }
        }

        // 击退衰减
        if (this.knockback > 0.01) {
            this.z -= this.knockback * dt * 3;
            this.knockback *= Math.pow(0.05, dt);
        }

        // 行走动画: 摇摆+弹跳+V3.7左右摇头蹒跚(尸吊感)
        const walkSpeed = this.isBoss ? 3 : 5;
        const sway = Math.sin(time * walkSpeed + this.phase) * 0.1;
        const bob = Math.abs(Math.sin(time * walkSpeed + this.phase)) * 0.06;
        this.model.position.set(this.x, bob, this.z);
        this.model.rotation.z = sway;
        this.model.rotation.y = this._baseRotY + Math.sin(time * walkSpeed * 0.5 + this.phase) * 0.12;
        // V3.2: 攻击时前扑啃咬动画(近战范围内身体前倾伸缩)
        if (dist <= attackDist) {
            this.model.rotation.x = -0.16 + Math.sin(time * 9 + this.phase) * 0.13;
        } else {
            this.model.rotation.x = Math.sin(time * walkSpeed + this.phase) * 0.05;
        }

        // 受击反馈 (V3.5: 合并模型用缩放冲击, Group模型用emissive闪烁)
        if (this.hitFlash > 0) {
            this.hitFlash -= dt;
            const k = Math.max(0, this.hitFlash / 0.13);
            if (this.model.userData.merged) {
                // 缩放冲击: 短暂膨胀回弹
                var punch = 1 + k * 0.18;
                this.model.scale.setScalar(this.visScale * punch);
            } else {
                const f = k * 0.35;
                for (let i = 0; i < this.flashMats.length; i++) {
                    this.flashMats[i].emissive.setRGB(f, f * 0.85, f * 0.6);
                }
            }
        } else if (this.spawnT >= 1 && this.model.userData.merged) {
            this.model.scale.setScalar(this.visScale);
        }
    }

    destroy(scene) {
        scene.remove(this.model);
        var merged = !!this.model.userData.merged; // V4.0: 合并僵尸几何为全类型共享缓存, 不可dispose
        this.model.traverse(function(obj) {
            if (obj.geometry && !merged) obj.geometry.dispose();
            if (obj.material && !merged) obj.material.dispose();
        });
    }
}

class EnemyManager {
    constructor(scene, effects) {
        this.scene = scene;
        this._levelIndex = 0;
        this.effects = effects;
        this.enemies = [];
        this.spits = [];
        this.pendingSpawns = [];
        this.boss = null;
        this.splitQueue = [];
        this.killCount = 0;
        this.bossStyle='bruiser';
        this.renderer=new EnemyArmyRenderer(scene);
        this._spitPool=Array.from({length:64},()=>({mesh:new THREE.Object3D(),life:0,vx:0,vz:0}));
        this._spitInstances=new THREE.InstancedMesh(new THREE.SphereGeometry(.11,8,6),new THREE.MeshBasicMaterial({color:0x9dff67}),64);
        this._spitInstances.count=0;this._spitInstances.frustumCulled=false;
        this._spitInstances.userData.artSource='V42 pooled acid projectiles';scene.add(this._spitInstances);
    }

    /** V4.0: loadFromLevel 只负责清场; 波次计划移交 GamePacingController 分批驱动 */
    loadFromLevel(level, levelIndex) {
        this.clear();
        this._levelIndex = levelIndex || 0;
    }

    /** V4.0: 统一出生入口(供节奏控制器/分裂/E2E注入调用) */
    spawnEnemy(type, x, z, hp, style) {
        const e = new Enemy(type, x, z, this.scene, hp || null, style || (type==='boss' ? this.bossStyle : null));
        // V6.0: 精英词缀
        if (type === 'elite' && typeof AffixSystem !== 'undefined') {
            AffixSystem.roll(e, this._levelIndex || 0);
            if (e.affixNames) e.model.userData.affixTag = e.affixNames;
        }
        // V12视觉: 精英身份光环(贴地金环, 随锚点移动; >10只精英时省略保护drawcall)
        if (type === 'elite' && this._eliteAuraCount === undefined) this._eliteAuraCount = 0;
        if (type === 'elite' && this._eliteAuraCount < 10 && typeof V42Art !== 'undefined' && V42Art.createEliteAura) {
            var aura = V42Art.createEliteAura();
            aura.position.y = 0.04;
            e.model.add(aura);
            e._eliteAura = aura;
            this._eliteAuraCount++;
        }
        this.enemies.push(e);
        if (type === 'boss') { this.boss = e; this.bossKills = this.bossKills || 0; }
        return e;
    }

    clear() {
        for (const e of this.enemies) e.destroy(this.scene);
        this.enemies = [];
        this._eliteAuraCount = 0; // V12视觉: 光环配额重置(共享几何/材质不dispose, 无泄漏)
        for (const s of this.spits) this._spitPool.push(s);
        this.spits = [];
        this.pendingSpawns = [];
        this.boss = null;
        this.bossKills = 0; // V10 QA修复: 原漏复位导致Boss击杀数跨关卡累计重复入账
        this.splitQueue = [];
        this.killCount = 0;
        this.renderer.clear();this._spitInstances.count=0;
    }

    spawnSpit(x, y, z, squad) {
        var s=this._spitPool.pop();if(!s)return;
        s.mesh.position.set(x,y,z);
        var dx=squad.x-x,dz=squad.z-z, inv=8/Math.max(.01,Math.hypot(dx,dz));
        s.vx=dx*inv;s.vz=dz*inv;s.life=2.5;this.spits.push(s);
    }

    update(dt, time, squad) {
        // V4.0: 生成由 GamePacingController 驱动(分批+上限), 此处不再整波触发

        // 分裂僵尸死亡后产生小僵尸
        // V5.1.3: 小体受活敌门控 — 超上限时延迟分裂(否则×3体量下小体洪流无视控制器团灭小队)
        // V5.1.3: 分裂门控基准=目标活敌×1.5(随队伍规模缩放; 旧MAX_ALIVE×1.3基准过松导致小体洪流)
        var splitCap = Math.max(20, Math.round((squad.count || 1) * 0.9 + 4) * 1.5);
        var splitEmitted = 0;
        for (let i = this.splitQueue.length - 1; i >= 0; i--) {
            const sq = this.splitQueue[i];
            sq.delay -= dt;
            if (sq.delay <= 0) {
                if (splitEmitted >= 1 || this.aliveCount >= splitCap) { sq.delay = 0.15; continue; } // 每帧至多1只, 超限延后
                const e = new Enemy('normal', sq.x + randRange(-0.5, 0.5), sq.z, this.scene);
                e.model.scale.multiplyScalar(0.6);
                e.visScale = e.cfg.scale * 0.6;
                e.hp = 2;
                this.enemies.push(e);
                this.splitQueue.splice(i, 1);
                splitEmitted++;
            }
        }

        // V5.1.3: 统计场上吐痰怪数(供攻击间隔摊薄)
        this._spitterCount = 0;
        for (const e of this.enemies) if (e.alive && e.type === 'spitter') this._spitterCount++;

        // 更新僵尸
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (typeof AffixSystem !== 'undefined') AffixSystem.update(e, dt, squad, this, this.effects);
            e.update(dt, time, squad, this, this.effects);
            // 刚死亡: 触发分裂/Boss爆炸(仅一次)
            if (!e.alive && !e.deathHandled) {
                e.deathHandled = true;
                this.killCount++;
                // V5.0: 击杀音效(适配器内部限流70ms) / Boss死亡低音轰鸣
                if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play(e.isBoss ? 'bossDie' : 'kill');
                // 分裂僵尸: 死亡时排队分裂
                if (e.type === 'split') {
                    this.splitQueue.push({ x: e.x, z: e.z, delay: 0.2 });
                    this.splitQueue.push({ x: e.x, z: e.z, delay: 0.35 });
                }
                // V11.5: 爆炸僵尸 — 死亡自爆, 半径2.2内波及小队-2人 + 红色冲击
                if (e.type === 'bomber' && squad) {
                    if (Math.abs(e.z - squad.z) < 3.0 && squad.alive) { // V11.5: 半径3.0(击退漂移容忍)
                        squad.killSoldiers(2, this.effects);
                    }
                    if (this.effects) {
                        this.effects.shockwave(e.x, 0.05, e.z, 0xFF5A4B);
                        this.effects.burst(e.x, 0.6, e.z, 0xFF5A4B, 16, 3.5, 0.55);
                        // V12视觉: 自爆白闪(瞬间亮度冲击)
                        if (this.effects.flash) this.effects.flash(e.x, 0.7, e.z, 0xFFB060, 2.4);
                    }
                }
                // V6.0: 分裂词缀
                if (e.affixes && typeof AffixSystem !== 'undefined') AffixSystem.onDeath(e, this);
                // V10 QA修复: 按 isBoss 标记计数(原判定 e===this.boss 在多Boss并存时, 先生成新Boss后旧Boss被击杀会漏记)
                if (e.isBoss) {
                    this.bossKills = (this.bossKills || 0) + 1;
                    this.boss = this.enemies.find(other=>other!==e && other.isBoss && other.alive) || null;
                    // Boss死亡大爆炸 + 金色粒子
                    this.effects.burst(e.x, 1, e.z, 0xFF4444, 30, 5, 1);
                    this.effects.burst(e.x, 1, e.z, 0xFFD700, 20, 4, 0.8);
                    this.effects.burst(e.x, 1.2, e.z, 0xFFFFFF, 15, 3, 0.6);
                    // 冲击波
                    this.effects.shockwave(e.x, 0.05, e.z, 0xFFD700);
                    // V12视觉: Boss死亡爆闪(大尺寸金色)
                    if (this.effects.flash) this.effects.flash(e.x, 1.1, e.z, 0xFFD980, 3.4);
                }
            }
            // 死亡动画完成: 移除
            if (e.removeReady) {
                if (e._eliteAura) this._eliteAuraCount--;
                e.destroy(this.scene);
                this.enemies.splice(i, 1);
            }
        }

        // 更新吐痰弹
        for (let i = this.spits.length - 1; i >= 0; i--) {
            const s = this.spits[i];
            s.life -= dt;
            s.mesh.position.x += s.vx * dt;
            s.mesh.position.z += s.vz * dt;
            // 命中小队
            if (Math.abs(s.mesh.position.z - squad.z) < 0.8 &&
                Math.abs(s.mesh.position.x - squad.x) < 1.5) {
                squad.killSoldiers(1, this.effects);
                this.effects.burst(s.mesh.position.x, 0.5, s.mesh.position.z, 0x44FF44, 5, 2, 0.3);
                this.scene.remove(s.mesh);
                this._spitPool.push(s);
                this.spits.splice(i, 1);
                continue;
            }
            if (s.life <= 0) {
                this.scene.remove(s.mesh);
                this._spitPool.push(s);
                this.spits.splice(i, 1);
            }
        }
        this._spitInstances.count=this.spits.length;
        for(var si=0;si<this.spits.length;si++) {
            this.spits[si].mesh.updateMatrix();
            this._spitInstances.setMatrixAt(si,this.spits[si].mesh.matrix);
        }
        this._spitInstances.instanceMatrix.needsUpdate=true;
        this.renderer.update(dt,time,this.enemies,squad.z);
    }

    finishDeaths(dt,time,squad) {
        for(var i=this.enemies.length-1;i>=0;i--) {
            var e=this.enemies[i];if(!e.dying)continue;
            e.update(dt,time,squad,this,this.effects);
            if(e.removeReady){
                if (e._eliteAura) this._eliteAuraCount--;
                e.destroy(this.scene);this.enemies.splice(i,1);
            }
        }
        this.renderer.update(dt,time,this.enemies,squad.z);
    }

    /** 获取最近的活僵尸(子弹追踪用) V3.1: 只瞄准前方(e.z更小)的敌人 */
    getNearest(x, z, maxDist, exclude) {
        let best = null;
        let bestDist = maxDist || 20;
        for (const e of this.enemies) {
            if (!e.alive) continue;
            if (exclude && exclude.indexOf(e) >= 0) continue; // V10.1: 散弹pellets扇形多目标排除已瞄准者
            if (e.z > z + 1) continue; // 身后的敌人不瞄准
            const d = Math.hypot(e.z - z, (e.x - x) * .85);
            if (d < bestDist) {
                bestDist = d;
                best = e;
            }
        }
        return best;
    }

    get aliveCount() {
        let n = 0;
        for (const e of this.enemies) if (e.alive) n++;
        return n;
    }

    get encounterOutstanding() {
        return this.aliveCount + this.splitQueue.length + this.enemies.filter(e=>e.type==='split' && !e.alive && !e.deathHandled).length*2;
    }
}


/* ===== [[ js/combat.js ]] ===== */
// ===== 自动射击与弹道系统 =====

class CombatSystem {
    constructor(scene, effects) {
        this.scene = scene;
        this.effects = effects;
        this.bullets = [];
        this.fireTimer = 0;

        // 弹道纹理: V12视觉 — 程序化曳光弹贴图(亮核弹头+长尾迹), 替代原SVG水滴形
        this._bulletTex = null;

        // 共享Sprite材质(所有子弹共用，减少DrawCall)
        // V3.6修复: 改用Normal混合(Additive在浅色路面上会加成纯白,弹道完全不可见)
        this._bulletMat = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 1,
            depthWrite: false
        });
        // 顺序修正(V12): 材质就绪后再挂贴图 — _makeTracerTexture 同步写 map, 必须在材质创建之后
        this._makeTracerTexture();
        this._bulletInstances=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),this._bulletMat,CONFIG.BULLET_MAX_VISIBLE);
        this._bulletInstances.count=0;this._bulletInstances.frustumCulled=false;
        this._bulletInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this._bulletInstances.userData.artSource='V120 instanced ground tracer streaks / pooled bullet anchors';
        scene.add(this._bulletInstances);
        this._bulletMat.userData = { artSource: 'js/combat.js:_makeTracerTexture() 程序化曳光贴图 64x256 (CanvasTexture)' };
        // V12视觉: 曳光朝向(贴地掠过+尾部微抬向镜头), 不再逐帧拷贝相机四元数
        this._tracerQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.42, 0, 0));

        // 弹道对象池 (锚点 + 曳光纹理)
        this.pool = [];
        for (var i = 0; i < CONFIG.BULLET_MAX_VISIBLE; i++) {
            var sprite = new THREE.Object3D();
            sprite.visible = false;
            sprite.scale.set(0.26, 2.1, 1);
            this.pool.push(sprite);
        }
    }

    /** V12视觉: 程序化曳光弹贴图 — 白热弹头 + 金色长尾; 实测(flipY=true): 画布顶部=平面+Y=弹道前方 */
    _makeTracerTexture() {
        var c = document.createElement('canvas');
        c.width = 64; c.height = 256;
        var ctx = c.getContext('2d');
        // 尾迹主体(锥形, 弹头宽→尾端窄): 外层柔光 + 内层亮芯, 沿画布向下渐隐
        var tail = ctx.createLinearGradient(0, 52, 0, 256);
        tail.addColorStop(0, 'rgba(255,214,90,0.95)');
        tail.addColorStop(0.35, 'rgba(255,170,44,0.62)');
        tail.addColorStop(1, 'rgba(255,120,16,0)');
        ctx.fillStyle = tail;
        ctx.beginPath();
        ctx.moveTo(10, 52);
        ctx.quadraticCurveTo(14, 130, 27, 252);
        ctx.lineTo(37, 252);
        ctx.quadraticCurveTo(50, 130, 54, 52);
        ctx.closePath();
        ctx.fill();
        // 内层亮芯(更窄更亮)
        var core = ctx.createLinearGradient(0, 52, 0, 220);
        core.addColorStop(0, 'rgba(255,250,205,0.95)');
        core.addColorStop(1, 'rgba(255,200,70,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.moveTo(20, 52);
        ctx.quadraticCurveTo(24, 130, 30, 218);
        ctx.lineTo(34, 218);
        ctx.quadraticCurveTo(40, 130, 44, 52);
        ctx.closePath();
        ctx.fill();
        // 弹头亮核(径向: 白→金→透明), 画布顶部
        var head = ctx.createRadialGradient(32, 40, 2, 32, 40, 26);
        head.addColorStop(0, '#FFFFFF');
        head.addColorStop(0.25, '#FFF3B0');
        head.addColorStop(0.55, 'rgba(255,190,50,0.85)');
        head.addColorStop(1, 'rgba(255,140,20,0)');
        ctx.fillStyle = head;
        ctx.beginPath();
        ctx.ellipse(32, 40, 22, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        // 弹头中心炽白小核
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(32, 38, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        this._bulletTex = new THREE.CanvasTexture(c);
        if (this._bulletMat) {
            this._bulletMat.map = this._bulletTex;
            this._bulletMat.needsUpdate = true;
        }
    }

    update(dt, squad, enemyManager, energyCore) {
        this._squad = squad; // V3.3: 供_fire读取穿透层数
        // === 射击逻辑 ===
        if (squad.count > 0 && squad.alive) {
            this.fireTimer -= dt;
            if (this.fireTimer <= 0) {
                var count = squad.count;
                // 视觉弹道频率: 随人数增长但有上限(性能保护)
                // V8.0.1: 吞吐曲线提升(×1.8→×2.2, 上限22→30, 池120容量内) — 大编制波次需要在行军窗口内被清空
                var visualRate = Math.min(2 + Math.sqrt(count) * 2.2, 30);
                this.fireTimer = 1 / visualRate;

                // 每发子弹伤害 = 总DPS / 视觉弹道频率
                var totalDPS = count * squad.getDamage() * squad.getFireRate();

                // 齐射数量: 1~5发(人数越多越多)
                var volley = Math.min(5, 1 + Math.floor(Math.sqrt(count) / 2.3)); // V8.0.1: 齐射曲线提升(÷2.6→÷2.3)
                var positions = squad.getShootPositions(volley);
                // A volley shares the squad DPS; giving every trail the full
                // budget multiplied damage by up to five. Keep fractional damage
                // so minimum-one rounding cannot inflate small squads either.
                var dmg = totalDPS / visualRate / Math.max(1, positions.length);
                if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('shoot'); // V5.0: 齐射音效(适配器内部限流)
                for (var k = 0; k < positions.length; k++) {
                    // V3.1: 每发子弹瞄准前方最近敌人(修复阵型散布导致5/7子弹打不中Boss的问题)
                    // V8.0.1: Boss存活时火力优先Boss — 修复杂兵吸引弹道导致Boss战输出饥饿(战损失衡)
                    var target = (enemyManager.boss && enemyManager.boss.alive)
                        ? enemyManager.boss
                        : enemyManager.getNearest(positions[k].x, positions[k].z, CONFIG.BULLET_RANGE);
                    // V3.3: 暴击判定(开火时掷骰, 伤害×2)
                    var dmgFinal = dmg;
                    // V6.0: 狂暴技能伤害乘区
                    if (squad._skillRage) dmgFinal *= 1 + 0.35 * squad._skillRage;
                    // V8.0: 守护之怒组合 — 护盾可用时+25%
                    if (squad._comboGuardianFury && squad._skillShield > 0) dmgFinal *= 1.25;
                    // V8.0: 随机事件伤害buff(狂热时刻)
                    if (squad._evDmgMul) dmgFinal *= squad._evDmgMul;
                    // V6.0: 背水一战 — 人数低于一半时增伤
                    if (squad._skillBerserk && squad.count > 0 && squad._halfCount && squad.count <= squad._halfCount) {
                        dmgFinal *= 1 + 0.5 * squad._skillBerserk;
                    }
                    var isCrit = Math.random() < Math.min(0.8, squad.critChance + (squad._evCritBonus || 0)); // V8.0: 事件暴击buff
                    // V11.2: 处决者 — 暴击伤害乘区(2 + 0.25×层), 火力流派 +15%
                    var critMul = 2 + (squad._critMul || 0);
                    if (isCrit) dmgFinal *= critMul;
                    if (squad._comboFireFlow) dmgFinal *= 1.15;
                    this._fire(positions[k], dmgFinal, target, isCrit);
                    // V10.1: 散弹枪 pellets — 多发弹丸扇形铺散(其余弹丸依次瞄准相邻目标, 多目标AOE; 单目标时自然衰减)
                    var wpnPellets = squad._wpnPellets || 1;
                    if (wpnPellets > 1) {
                        var fanHit = [target];
                        for (var pi = 1; pi < wpnPellets; pi++) {
                            var fanTarget = enemyManager.getNearest(positions[k].x, positions[k].z, CONFIG.BULLET_RANGE, fanHit);
                            if (!fanTarget) break;
                            fanHit.push(fanTarget);
                            this._fire(positions[k], dmgFinal, fanTarget, isCrit);
                        }
                    }
                    // V10.1: 风暴机枪 dualLane — 平行双弹道(同目标, 双倍弹丸吞吐)
                    if (squad._wpnDualLane) {
                        this._fire({ x: positions[k].x + 0.38, y: positions[k].y, z: positions[k].z }, dmgFinal, target, isCrit);
                    }
                }
            }
        }

        // === 弹道更新与碰撞 ===
        for (var i = this.bullets.length - 1; i >= 0; i--) {
            var b = this.bullets[i];
            var oldZ = b.mesh.position.z;
            // VNext: 职业弹速乘区(重装机枪手 +25%)
            var bSpeed = CONFIG.BULLET_SPEED * (squad._classBulletSpeed || 1);
            var newZ = BattleKinematics.bulletZ(oldZ, bSpeed, dt); // V5.1: SHOOT_SIGN=-Z
            b.mesh.position.z = newZ;
            b.life -= dt;

            // V3.1: 弹道向目标x收敛(轻微追踪, 保证视觉上弹道汇聚到敌人身上)
            if (b.target && b.target.alive) {
                b.mesh.position.x = damp(b.mesh.position.x, b.target.x, 10, dt);
            }

            // 碰撞检测: 检查是否穿越僵尸Z面
            var hit = false;
            var enemies = enemyManager.enemies;
            for (var j = 0; j < enemies.length; j++) {
                var e = enemies[j];
                if (!e.alive) continue;
                // V3.3: 穿透弹不重复命中同一目标
                if (b.hitSet && b.hitSet.indexOf(e) >= 0) continue;
                // 子弹从前往后穿越僵尸位置
                if (oldZ >= e.z - 0.2 && newZ <= e.z + 0.4) {
                    // V3.1: 命中窗加宽(0.7→0.9), Boss等大体型敌人按体型放大判定
                    var winX = e.isBoss ? 1.4 : 0.9;
                    if (Math.abs(b.mesh.position.x - e.x) < winX) {
                        // V3.3: 冰冻弹 — 命中减速
                        if (squad.freezeStacks > 0 && !e.isBoss) {
                            e.frozenT = 0.9 + 0.45 * squad.freezeStacks;
                            if (!e._frozenFx) {
                                this.effects.burst(e.x, 0.5, e.z, 0x9AD8FF, 4, 1.8, 0.35);
                                e._frozenFx = true;
                            }
                        }
                        // 地狱火箭燃烧 — 持续3秒, 每秒25%弹丸伤害(每0.5秒结算)
                        if (squad._wpnBurn) {
                            e._burnT = 3;
                            e._burnDps = Math.max(e._burnDps || 0, b.damage * 0.25);
                            this.effects.burst(e.x, 0.8, e.z, 0xFF8833, 3, 1.5, 0.3);
                        }
                        // V6.0: 毒液弹头 — 命中附加中毒DoT(修复: 原实现从未挂载)
                        if (squad._skillVenom) {
                            var venomMul = squad._comboPlagueFury ? 2 : 1; // V8.0: 瘟疫狂怒×2
                            e._venomT = 2;
                            e._venomStacks = Math.min(3, (e._venomStacks || 0) + 1);
                            e._venomDps = Math.max(e._venomDps || 0, b.damage * 0.2 * squad._skillVenom * venomMul);
                            if (e._venomStacks === 1) this.effects.burst(e.x, 0.6, e.z, 0x88CC44, 3, 1.5, 0.3);
                        }
                        var hitDmg = b.damage;
                        // VNext: 神射狙击 — 对精英/Boss ×1.25
                        if (squad._classEliteMul && (e.isBoss || e.type === 'elite' || e.affixes)) {
                            hitDmg *= squad._classEliteMul;
                        }
                        var died = e.takeDamage(hitDmg, this.effects, b.mesh.position.x, b.crit);
                        // V5.1: 爆炸弹 — 命中溅射(半径1.7, 50%伤害, 最多4个邻近目标)
                        if (squad.explosive > 0) {
                            var splashR = 1.2 + 0.5 * squad.explosive;
                            var splashN = 0;
                            for (var si = 0; si < enemies.length && splashN < 4; si++) {
                                var se = enemies[si];
                                if (se === e || !se.alive) continue;
                                var sdx = se.x - e.x, sdz = se.z - e.z;
                                if (sdx * sdx + sdz * sdz < splashR * splashR) {
                                    se.takeDamage(b.damage * 0.5, this.effects, se.x, false);
                                    splashN++;
                                }
                            }
                            this.effects.burst(e.x, 0.6, e.z, 0xFF8833, 6, 2.5, 0.3);
                            // V12视觉: 爆炸弹命中白闪
                            if (this.effects.flash) this.effects.flash(e.x, 0.6, e.z, 0xFFB060, 1.5);
                        }
                        // V5.1: 连锁闪电 — 跳至最近(最多1+chain层)邻敌, 各受40%伤害
                        if (squad.chain > 0) {
                            var hops = squad.chain, last = e;
                            for (var hi = 0; hi < hops; hi++) {
                                var best = null, bestD = 9;
                                for (var ci = 0; ci < enemies.length; ci++) {
                                    var ce = enemies[ci];
                                    if (!ce.alive || ce === last || ce === e) continue;
                                    var cdx = ce.x - last.x, cdz = ce.z - last.z;
                                    var cd = Math.sqrt(cdx * cdx + cdz * cdz);
                                    if (cd < bestD) { bestD = cd; best = ce; }
                                }
                                if (!best) break;
                                best.takeDamage(b.damage * 0.4, this.effects, best.x, false);
                                this.effects.burst(best.x, 1.0, best.z, 0x66D9FF, 4, 2, 0.25);
                                last = best;
                            }
                        }
                        // 暴击/击杀反馈
                        if (died) {
                            if (b.crit) {
                                this.effects.floatText(e.x, 1.2, e.z, '暴击!', '#FF4444', true);
                            }
                            // V3.3: 吸血 — 击杀按层数概率回复1人
                            if (squad.vampStacks > 0 && squad.count > 0 && squad.count < squad._maxLimit()) {
                                var vampProb = 0.12 * squad.vampStacks;
                                if (Math.random() < vampProb) {
                                    squad.addReinforcements(1, '吸血恢复', this.effects);
                                }
                            }
                            // V8.0: 回收无人机组合 — 3%概率补员
                            if (squad._comboRecycle && squad.count > 0 && squad.count < squad._maxLimit() && Math.random() < 0.03) {
                                squad.addReinforcements(1, '回收无人机', this.effects);
                            }
                            // V11.2: 亡者征召 — 5%×层概率补员(虫群流派×1.5)
                            if (squad._skillHarvest && squad.count > 0 && squad.count < squad._maxLimit()) {
                                var harvProb = 0.05 * squad._skillHarvest * (squad._comboSwarmFlow ? 1.5 : 1);
                                if (Math.random() < harvProb) {
                                    squad.addReinforcements(1, '亡者征召', this.effects);
                                }
                            }
                        }
                        hit = true;
                        // V3.3: 穿透 — 命中后不消失, 继续飞行
                        if (b.pierceLeft > 0) {
                            b.pierceLeft--;
                            if (!b.hitSet) b.hitSet = [];
                            b.hitSet.push(e);
                            hit = false; // 继续存在
                        }
                        break;
                    }
                }
            }

            // V6.0: 能源核心命中(穿越核心z面且横向命中)
            if (!hit && energyCore && energyCore.alive &&
                oldZ >= energyCore.z - 0.4 && newZ <= energyCore.z + 0.4 &&
                Math.abs(b.mesh.position.x - energyCore.x) < 1.6) {
                energyCore.takeBulletHit(b.damage, this.effects);
                hit = true;
            }

            // 超射程或命中: 回收
            if (hit || b.life <= 0 || newZ < squad.z - CONFIG.BULLET_RANGE) {
                b.mesh.visible = false;
                this.pool.push(b.mesh);
                this.bullets.splice(i, 1);
            }
        }

        // V6.0: 毒液DoT结算(每帧)
        if (enemyManager && enemyManager.enemies) {
            for (var vi = enemyManager.enemies.length - 1; vi >= 0; vi--) {
                var ve = enemyManager.enemies[vi];
                if (!ve.alive || (!ve._venomT && !ve._burnT)) continue; // V10.1: 燃烧DoT共入结算循环
                if (ve._venomT) {
                    ve._venomT -= dt;
                    ve._venomTick = (ve._venomTick || 0) - dt;
                    if (ve._venomTick <= 0) {
                        ve._venomTick = 0.5;
                        ve.takeDamage(ve._venomDps * 0.5, this.effects, ve.x, false);
                        if (this.effects) this.effects.burst(ve.x, 1, ve.z, 0x66DD44, 2, 1.5, 0.25);
                    }
                    if (ve._venomT <= 0) { ve._venomT = 0; ve._venomStacks = 0; }
                }
                // V10.1: 燃烧DoT结算(地狱火箭)
                if (ve._burnT) {
                    ve._burnT -= dt;
                    ve._burnTick = (ve._burnTick || 0) - dt;
                    if (ve._burnTick <= 0) {
                        ve._burnTick = 0.5;
                        ve.takeDamage(ve._burnDps * 0.5, this.effects, ve.x, false);
                        if (this.effects) this.effects.burst(ve.x, 1, ve.z, 0xFF8833, 2, 1.5, 0.25);
                    }
                    if (ve._burnT <= 0) { ve._burnT = 0; ve._burnDps = 0; }
                }
            }
        }

        // V8.0: 毒性护盾组合 — 格挡时毒化周围敌人(半径3, 每秒20%基础伤害×毒液层)
        if (squad._toxicWardPulse) {
            squad._toxicWardPulse = false;
            var wardDps = Math.max(1, Math.round(squad.getDamage() * 0.2 * Math.max(1, squad._skillVenom || 1)));
            for (var wi = 0; wi < enemyManager.enemies.length; wi++) {
                var we = enemyManager.enemies[wi];
                if (!we.alive) continue;
                var wdx = we.x - squad.x, wdz = we.z - squad.z;
                if (wdx * wdx + wdz * wdz < 9) {
                    we._venomT = 3;
                    we._venomStacks = Math.min(3, (we._venomStacks || 0) + 1);
                    we._venomDps = Math.max(we._venomDps || 0, wardDps);
                }
            }
            this.effects.shockwave(squad.x, 0.05, squad.z, 0x88CC44);
        }
    }

    _syncInstances() {
        this._bulletInstances.count=this.bullets.length;
        for(var i=0;i<this.bullets.length;i++) {
            var anchor=this.bullets[i].mesh;
            anchor.quaternion.copy(this._tracerQuat); // V12视觉: 贴地曳光朝向(弹头朝-Z, 尾部微抬)
            anchor.updateMatrix();this._bulletInstances.setMatrixAt(i,anchor.matrix);
        }
        this._bulletInstances.instanceMatrix.needsUpdate=true;
    }

    _fire(pos, damage, target, isCrit) {
        var mesh = this.pool.pop();
        if (!mesh) return;
        mesh.visible = true;
        // GLB Muzzle is authoritative. Target convergence supplies trajectory
        // variation after launch; random origin offsets detached shots from guns.
        mesh.position.set(pos.x, pos.y, pos.z);
        // Sprite scale: V12视觉 贴地曳光(长度沿弹道; 暴击弹更长更亮)
        if (isCrit) mesh.scale.set(0.34, 2.8, 1);
        else mesh.scale.set(0.26, 2.1, 1);
        this.bullets.push({
            mesh: mesh, damage: damage, life: 1.2,
            target: target || null,
            crit: !!isCrit,
            // V11.2: 穿透流派 +1
            pierceLeft: 1 + (this._squad ? this._squad.pierce + (this._squad._evPierce || 0) + (this._squad._comboPierceFlow ? 1 : 0) : 0),
            hitSet: null
        });

        // 枪口闪光
        this.effects.muzzleFlash(pos.x, pos.y, pos.z);
        // V12: 移除逐发同步 — _updateInner 在 combat.update 后统一调用 _syncInstances, 帧内一次即可(高频开火时省冗余矩阵上传)
    }

    clear() {
        for (var i = 0; i < this.bullets.length; i++) {
            this.bullets[i].mesh.visible = false;
            this.pool.push(this.bullets[i].mesh);
        }
        this.bullets = [];
        this.fireTimer = 0;
        this._bulletInstances.count=0;
    }
}


/* ===== [[ js/pacing.js ]] ===== */
// ===== V4.0 节奏控制器 (P0: 独立于帧率的战斗节奏) =====
// 职责: 波次激活 → 分批生成(间隔0.8-1.5s, 每批1-4只) → 场上活敌上限 → 波次结束 → Boss预警 → Boss出场
// 所有时间均为真实游戏秒(dt驱动), 与渲染帧率无关
// 纯逻辑: 敌人生成通过注入的spawnFn完成, 便于单测

class GamePacingController {
    constructor(game) {
        this.game = game || null;
        this.waves = [];
        this.spawnFn = null;        // function(type, x, z, hp) → Enemy
        this.onWaveStart = null;    // function(wave)
        this.onWaveClear = null;    // function(wave)
        this.onBossWarning = null;  // function(wave) — 预警开始
        this.onBossSpawn = null;    // function(wave)
        this.maxAliveFn = null;     // function() → 当前场上活敌数
        this.aliveCountFn = null;   // function() → 活敌数(判断波清)
        this.gateReadyFn = null;
    }

    /** 从关卡数据构建波次计划 */
    loadFromLevel(level, levelIndex, runtimeHordeBoost) {
        // V10 QA: 移除每关生产路径 console.log
        this.clear();
        var P = CONFIG.PACING;
        this.levelIndex = levelIndex || 0;
        this.runtimeHordeBoost = !!runtimeHordeBoost;
        var waveMultiplier = this.runtimeHordeBoost ? (CONFIG.ENEMY_WAVE_MULTIPLIER || 1) : 1;
        var previousGateZ = null;
        // V5.1.4: 标记最后一个波段(末波清尾驻停用)
        var lastWaveIdx = -1;
        for (var wi = 0; wi < level.segments.length; wi++) {
            if (level.segments[wi].type === 'wave') lastWaveIdx = wi;
        }
        for (var i = 0; i < level.segments.length; i++) {
            var seg = level.segments[i];
            if (seg.type === 'wave') {
                var queue = [];
                for (var j = 0; j < seg.enemies.length; j++) {
                    for (var k = 0; k < seg.enemies[j].count * waveMultiplier; k++) {
                        queue.push(seg.enemies[j].type);
                    }
                }
                // Mix roles through the horde instead of spawning every shield
                // or splitter first. The authored roster is retained exactly.
                for (var qi = queue.length - 1; qi > 0; qi--) {
                    var swap = Math.floor(Math.random() * (qi + 1));
                    var held = queue[qi]; queue[qi] = queue[swap]; queue[swap] = held;
                }
                this.waves.push({
                    type: 'wave', z: seg.z,
                    requiredGateZ: previousGateZ,
                    index: this.waves.filter(function(w) { return w.type === 'wave'; }).length,
                    isFinal: i === lastWaveIdx,
                    triggerZ: seg.z + P.waveTriggerAhead,
                    queue: queue,
                    state: 'idle',          // idle|spawning|clearing|done
                    batchTimer: P.firstContactGrace,
                    total: queue.length,
                    pending: [],
                    emitTimer: 0,
                    spawned: 0
                });
            } else if (seg.type === 'boss') {
                this.waves.push({
                    type: 'boss', z: seg.z,
                    requiredGateZ: previousGateZ,
                    triggerZ: seg.z + P.bossTriggerAhead,
                    hp: seg.boss && seg.boss.hp ? seg.boss.hp : null,
                    state: 'idle',          // idle|warning|done
                    warnTimer: P.bossWarningTime
                });
            } else if (seg.type === 'gates') {
                previousGateZ = seg.z;
            }
        }
    }

    clear() {
        this.waves = [];
        this.restTimer = 0;
        this.activeWave = null;
    }

    /** V5.1: 当前关卡场上活敌上限(尸潮矩阵 CONFIG.MAX_ALIVE) */
    _maxAlive() {
        var matrix = CONFIG.MAX_ALIVE;
        var li = this.levelIndex || 0;
        if (matrix && matrix.length) {
            var base = matrix[Math.min(li, matrix.length - 1)];
            return Math.round(base * (this.runtimeHordeBoost ? (CONFIG.ENEMY_MAX_ALIVE_MULTIPLIER || 1) : 1));
        }
        var P = CONFIG.PACING;
        return Math.min(20, 10 + li);
    }

    /** V5.1.1: 批次规模加大(尸潮成堆涌现, 玩家反馈"怪物太少") */
    _batchSize(wave, aliveTarget) {
        var P = CONFIG.PACING;
        if(wave) {
            // V5.1.5: 批次≥目标活敌×1.25 — 一批就能把 alive 填到目标(旧按波总量/1.5切批,
            // 批间真空期被击杀清空, alive 永远只有批大小)
            var ceiling=Math.min(P.batchSizeMax,Math.max(P.batchSizeBase,
                Math.ceil(wave.total/1.5), Math.ceil((aliveTarget||30)*1.25)));
            var floor=Math.max(P.batchSizeBase,ceiling-4);
            return floor+Math.floor(Math.random()*(ceiling-floor+1));
        }
        var effMax = Math.min(P.batchSizeMax, 2 + Math.floor((this.levelIndex || 0) / 2));
        return P.batchSizeBase + Math.floor(Math.random() * (effMax - P.batchSizeBase + 1));
    }

    _emit(w, squad) {
        if (!this.spawnFn || !w.pending.length) return false;
        var slot = w.spawned % 48;
        var col = slot % 6, row = Math.floor(slot / 6);
        var x = (col - 2.5) * 1.04 + randRange(-.12, .12);
        var z = Math.min(w.z - 1.5, squad.z - (CONFIG.PACING.spawnDistance || 14)) - row * .95 - randRange(0, .35);
        var enemy = this.spawnFn(w.pending[0], x, z, null);
        if (enemy === false || enemy === null) return false;
        w.pending.shift();
        w.spawned++;
        return true;
    }

    /** 波次内部推进: 返回true表示有状态变化(供测试断言) */
    _updateWave(w, dt, squad) {
        var P = CONFIG.PACING;

        if (w.state === 'idle') {
            if (w.requiredGateZ !== null && this.gateReadyFn && !this.gateReadyFn(w, squad)) return false;
            if (squad.z <= w.triggerZ) {
                w.startedAt=this.game ? this.game.elapsedTime : null;
                if (w.type === 'boss') {
                    w.state = 'warning';
                    if (this.onBossWarning) this.onBossWarning(w);
                } else {
                    w.state = 'spawning';
                    w.batchTimer = P.firstContactGrace;
                    if (this.onWaveStart) this.onWaveStart(w);
                }
                return true;
            }
            return false;
        }

        if (w.state === 'warning') {
            w.warnTimer -= dt;
            if (w.warnTimer <= 0) {
                // Boss从波点再向屏幕外后退出生(禁止贴脸刷新), 出场后自行走近
                var bz = Math.min(w.z + P.bossSpawnSetback, squad.z - 11);
                if (this.spawnFn) this.spawnFn('boss', 0, bz, w.hp);
                w.state = 'done';
                if (this._onBossSpawnFx) this._onBossSpawnFx(); // V4.0: 入场震屏
                if (this.onBossSpawn) this.onBossSpawn(w);
                return true;
            }
            return false;
        }

        if (w.state === 'spawning') {
            w.batchTimer -= dt;
            w.emitTimer -= dt;
            var aliveTargetNow = Math.min(this._maxAlive(), Math.max(32, Math.round((squad.count || 1) * 1.4 + 15)));
            if(!w.pending.length && w.batchTimer<=0 && w.queue.length) {
                // Atomic ownership transfer: backpressure never discards a
                // queued actor; it remains in pending until it really spawns.
                w.pending=w.queue.splice(0,Math.min(this._batchSize(w, aliveTargetNow),w.queue.length));
                // V5.1.1: 同波后续批次密接(0.25-0.4s) — 批与批间alive持续堆积成墙
                w.batchTimer = w.spawned > 0
                    ? randRange(P.batchGapMin, P.batchGapMax)
                    : randRange(P.spawnIntervalMin, P.spawnIntervalMax);
            }
            // V5.1.2(玩家反馈"来超级多的"): 活敌目标控制器(填充-涓流反馈) —
            //   alive < ALIVE_TARGET → 快速填充(~30只/秒) 尸潮墙成形
            //   alive ≥ ALIVE_TARGET → 涓流(≈4.5只/秒) 缓慢逼近硬上限, 持续施压
            // Little定律(alive=spawn×TTK)下TTK随血量缩放平方增长, 速率公式不可解析 — 反馈控制最鲁棒。
            var alive = this.aliveCountFn ? this.aliveCountFn() : 0;
            // V5.1.5: 目标活敌随队伍规模自适应(count×1.4+15) × 波次进度因子(首波0.55温和开场, 末波1.0成墙)
            var cap = this._maxAlive();
            var targetCeiling = CONFIG.ALIVE_TARGET[Math.min(this.levelIndex || 0, CONFIG.ALIVE_TARGET.length - 1)];
            if (this.runtimeHordeBoost) targetCeiling = Math.round(targetCeiling * (CONFIG.ENEMY_ALIVE_TARGET_MULTIPLIER || 1));
            var targetFormula = Math.round(((squad.count || 1) * 1.5 + 14) *
                (this.runtimeHordeBoost ? (CONFIG.ENEMY_ALIVE_TARGET_MULTIPLIER || 1) : 1));
            var aliveTarget = Math.min(cap, targetCeiling, Math.max(32, targetFormula));
            // V5.1.5 双相出怪(用户反馈"来超级多的"):
            //   填充相: alive < 目标 → 帧预算突发 ceil(dt/0.008)≈4只/帧(120-240只/s) 尸潮墙成形
            //   涓流相: alive ≥ 目标 → 1只/0.15s(6.7只/s) 持续施压逼近硬上限
            // 弱队伍击杀慢 → alive 高于目标时间更长 → 涓流为主自动降速; 强队伍击杀快 → 填充为主屏满尸潮。
            if (alive < aliveTarget) {
                // Accumulate fractional credit, so 30/60/120 Hz emit at the
                // same rate. Bound catch-up work to avoid one-frame spawn spikes.
                w.fillCredit = Math.min(3, (w.fillCredit || 0) + dt / P.fillFrameInterval);
                var budget = Math.floor(w.fillCredit);
                var emitted = 0;
                while (w.pending.length && emitted < budget && alive < aliveTarget) {
                    if (!this._emit(w, squad)) break;
                    emitted++; alive++; w.fillCredit--;
                }
                w.emitTimer = P.trickleInterval;
            } else if (w.pending.length && w.emitTimer <= 0 && alive < this._maxAlive()) {
                // V5.1.5: 涓流速率 = 小队对该类型怪的击杀速率 ×1.15(缓慢渗漏逼近硬上限) —
                // 怪墙保持在枪线内被逐层瓦解, 到达近战的怪≈击杀×15% → 压力与火力自动平衡
                this._emit(w, squad);
                w.emitTimer = P.trickleInterval;
            }
            if (w.queue.length === 0 && w.pending.length === 0) {
                w.state = 'clearing';
                w.spawnFinishedAt=this.game ? this.game.elapsedTime : null;
                return true;
            }
            return false;
        }

        if (w.state === 'clearing') {
            var remain = this.aliveCountFn ? this.aliveCountFn() : 0;
            if (remain === 0) {
                w.state = 'done';
                w.clearedAt=this.game ? this.game.elapsedTime : null;
                if (this.onWaveClear) this.onWaveClear(w);
                return true;
            }
        }
        return false;
    }

    update(dt, squad) {
        if (this.restTimer > 0) {
            this.restTimer = Math.max(0, this.restTimer - dt);
            return;
        }
        // Admit exactly one encounter. Boss summons belong to the encounter,
        // not another pacing wave; all timers use game seconds and reset.
        for (var i = 0; i < this.waves.length; i++) {
            var w = this.waves[i];
            if (w.state === 'done') continue;
            this.activeWave = w;
            this._updateWave(w, dt, squad);
            if (w.state === 'done') {
                this.activeWave = null;
                if (w.type === 'wave') this.restTimer = randRange(CONFIG.PACING.waveRestMin, CONFIG.PACING.waveRestMax);
            }
            break;
        }
    }

    /** V5.1.1(玩家反馈): 军团持续推进模式 — 波次期间不再停驻
     *  (停驻+怪物朝镜头涌来在视觉上等同"人物向后走/撤退", 用户实测否定)
     *  现在: 军团始终前进穿越尸潮, 怪群迎面而来, 相向运动产生"推进感"。
     *  Boss warning 保留停驻(决战前蓄势)。
     *  返回 null 表示不停(继续推进) */
    frontierStopZ() {
        var w = this.activeWave;
        if (this.runtimeHordeBoost && w && w.type === 'wave' &&
            (w.state === 'spawning' || w.state === 'clearing')) return w.z + 2;
        if (w && w.type === 'boss' && w.state === 'warning') return w.triggerZ - 1;
        // V5.1.4: 末波清尾驻停 — 全部涌出后(clearing)停驻清完残余, 进度条到头=清完=结算(用户反馈"进度条到头怪还在")
        if (w && w.type === 'wave' && w.isFinal && w.state === 'clearing') return w.z + 2;
        return null;
    }

    canChooseGate(z) {
        return this.waves.every(function(w) { return w.z < z || w.state === 'done'; });
    }

    /** V5.1.5 测试钩子: 强制所有波次完成(E2E组合式Boss遭遇用) */
    forceComplete() {
        for (var i = 0; i < this.waves.length; i++) this.waves[i].state = 'done';
        this.activeWave = null;
    }

    /** V5.1: 全部波次(含Boss)是否都已排空完成 */
    isComplete() {
        for (var i = 0; i < this.waves.length; i++) {
            if (this.waves[i].state !== 'done') return false;
        }
        return this.waves.length > 0;
    }

    /** 调试/测试: 当前波次状态摘要 */
    summary() {
        return this.waves.map(function(w) {
            return { type: w.type, z: w.z, state: w.state, queued: w.queue ? w.queue.length : 0, pending:w.pending?w.pending.length:0, spawned: w.spawned || 0,startedAt:w.startedAt,spawnFinishedAt:w.spawnFinishedAt,clearedAt:w.clearedAt };
        });
    }
}


/* ===== [[ js/platform/storage-adapter.js ]] ===== */
// ===== 存储适配器 (Phase 5 平台抽象层) =====
// 统一 localStorage / tt.getStorageSync / 内存兜底
// 接口: get(key, defaultValue) / set(key, value) / remove(key) / keys()

/** 内存存储兜底(隐私模式/无存储环境) */
class MemoryStorageAdapter {
    constructor() {
        this._map = {};
    }
    get(key, defaultValue) {
        var raw = this._map[key];
        if (raw === undefined) return defaultValue;
        try { return JSON.parse(raw); } catch (e) { return defaultValue; }
    }
    set(key, value) {
        try { this._map[key] = JSON.stringify(value); return true; } catch (e) { return false; }
    }
    remove(key) { delete this._map[key]; }
    keys() { return Object.keys(this._map); }
}

/** H5: window.localStorage */
class LocalStorageAdapter {
    constructor() {
        // 构造时探测可用性(隐私模式可能抛异常)
        this._available = false;
        try {
            var probe = '__pz_probe__';
            window.localStorage.setItem(probe, '1');
            window.localStorage.removeItem(probe);
            this._available = true;
        } catch (e) {
            this._available = false;
        }
        this._fallback = new MemoryStorageAdapter();
    }
    get(key, defaultValue) {
        if (!this._available) return this._fallback.get(key, defaultValue);
        try {
            var raw = window.localStorage.getItem(key);
            if (raw === null || raw === undefined) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            return defaultValue;
        }
    }
    set(key, value) {
        if (!this._available) return this._fallback.set(key, value);
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            // 写满/被拒: 降级内存
            return this._fallback.set(key, value);
        }
    }
    remove(key) {
        if (this._available) { try { window.localStorage.removeItem(key); } catch (e) {} }
        this._fallback.remove(key);
    }
    keys() {
        if (!this._available) return this._fallback.keys();
        var out = [];
        try {
            for (var i = 0; i < window.localStorage.length; i++) {
                out.push(window.localStorage.key(i));
            }
        } catch (e) {}
        return out;
    }
}

/** 抖音小游戏: tt.getStorageSync / tt.setStorageSync */
class TtStorageAdapter {
    constructor(ttApi) {
        this._tt = ttApi;
        this._fallback = new MemoryStorageAdapter();
    }
    get(key, defaultValue) {
        try {
            var raw = this._tt.getStorageSync(key);
            if (raw === '' || raw === undefined || raw === null) return defaultValue;
            // tt 存储原样存取字符串; 兼容直接存对象的历史数据
            if (typeof raw === 'string') {
                try { return JSON.parse(raw); } catch (e) { return raw; }
            }
            return raw;
        } catch (e) {
            return this._fallback.get(key, defaultValue);
        }
    }
    set(key, value) {
        try {
            this._tt.setStorageSync(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return this._fallback.set(key, value);
        }
    }
    remove(key) {
        try { this._tt.removeStorageSync(key); } catch (e) {}
        this._fallback.remove(key);
    }
    keys() {
        try {
            var info = this._tt.getStorageInfoSync();
            return (info && info.keys) || [];
        } catch (e) {
            return this._fallback.keys();
        }
    }
}

/** 微信小游戏: wx.getStorageSync / wx.setStorageSync (V12 新增, 结构对齐 TtStorageAdapter) */
class WxStorageAdapter {
    constructor(wxApi) {
        this._wx = wxApi;
        this._fallback = new MemoryStorageAdapter();
    }
    get(key, defaultValue) {
        try {
            var raw = this._wx.getStorageSync(key);
            if (raw === '' || raw === undefined || raw === null) return defaultValue;
            // wx 存储原样存取字符串; 兼容直接存对象的历史数据
            if (typeof raw === 'string') {
                try { return JSON.parse(raw); } catch (e) { return raw; }
            }
            return raw;
        } catch (e) {
            return this._fallback.get(key, defaultValue);
        }
    }
    set(key, value) {
        try {
            this._wx.setStorageSync(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return this._fallback.set(key, value);
        }
    }
    remove(key) {
        try { this._wx.removeStorageSync(key); } catch (e) {}
        this._fallback.remove(key);
    }
    keys() {
        try {
            var info = this._wx.getStorageInfoSync();
            return (info && info.keys) || [];
        } catch (e) {
            return this._fallback.keys();
        }
    }
}

/** 存储命名空间封装: 所有游戏键加前缀, 防冲突 */
class GameStorage {
    constructor(adapter) {
        this._adapter = adapter || new MemoryStorageAdapter();
        this.PREFIX = 'pz_squad_';
        // V12: 主键损坏标记键(损坏旧档保留现场, 便于诊断, 不静默覆盖)
        this.CORRUPT_SUFFIX = '.corrupt';
    }
    _k(key) { return this.PREFIX + key; }
    /**
     * V12: 带备份的写入 — 每次写主键同时镜像 .bak, 读损坏时回退上一份好数据。
     * 仅对关键存档启用(开销: 双份存储); 普通设置键走普通 get/set。
     */
    setSafe(key, value) {
        var okMain = false, okBak = false;
        try { okMain = this._adapter.set(this._k(key), value); } catch (e) {}
        try { okBak = this._adapter.set(this._k(key) + '.bak', value); } catch (e) {}
        return okMain && okBak;
    }
    /**
     * V12: 带备份的读取 — 主键 JSON 损坏时回退 .bak(上一份好数据)并修复主键;
     * 两份都损坏时保留现场(.corrupt 镜像), 返回 defaultValue, 不静默清零旧档。
     */
    getSafe(key, defaultValue) {
        var main = this._readValid(this._k(key));
        if (main.valid) return main.value;
        var bak = this._readValid(this._k(key) + '.bak');
        if (bak.valid) {
            // 主档损坏但备份完好: 用备份修复主档
            try { this._adapter.set(this._k(key), bak.raw); } catch (e) {}
            return bak.value;
        }
        // 双份都损坏: 保留损坏现场供诊断(仅首次), 不覆盖
        if (main.raw !== null || bak.raw !== null) {
            var markKey = this._k(key) + this.CORRUPT_SUFFIX;
            var already = this._adapter.get(markKey, null);
            if (!already) {
                try {
                    this._adapter.set(markKey, {
                        at: (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0,
                        main: main.raw, bak: bak.raw
                    });
                } catch (e) {}
            }
        }
        return defaultValue;
    }
    /** 读原始串并校验 JSON; 返回 {valid, value, raw} */
    _readValid(fullKey) {
        var raw = null;
        try { raw = this._adapter.get(fullKey, null); } catch (e) { raw = null; }
        if (raw === null || raw === undefined) return { valid: false, value: null, raw: null };
        // 适配器已解析成功(对象/数字)即视为有效
        if (typeof raw === 'object' || typeof raw === 'number' || typeof raw === 'boolean') {
            return { valid: true, value: raw, raw: raw };
        }
        if (typeof raw === 'string') {
            try { return { valid: true, value: JSON.parse(raw), raw: raw }; } catch (e) {}
        }
        return { valid: false, value: null, raw: raw };
    }
    get(key, defaultValue) { return this._adapter.get(this._k(key), defaultValue); }
    set(key, value) { return this._adapter.set(this._k(key), value); }
    remove(key) {
        this._adapter.remove(this._k(key));
        this._adapter.remove(this._k(key) + '.bak');
        this._adapter.remove(this._k(key) + this.CORRUPT_SUFFIX);
    }
    keys() {
        var all = this._adapter.keys();
        var out = [];
        for (var i = 0; i < all.length; i++) {
            if (all[i].indexOf(this.PREFIX) === 0) out.push(all[i].slice(this.PREFIX.length));
        }
        return out;
    }
    /**
     * V12: 旧版裸 localStorage 键兼容读(h5 上历史键无前缀)。
     * 优先读命名空间键, 缺失再读裸键; 微信等新端无裸键直接走默认值。
     */
    getLegacy(key, defaultValue) {
        var v = this.get(key, undefined);
        if (v !== undefined && v !== null) return v;
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                var raw = window.localStorage.getItem(key);
                if (raw !== null && raw !== undefined) return raw;
            } catch (e) {}
        }
        return defaultValue;
    }
    /** V12: 写设置键(命名空间)并清理 h5 旧裸键, 保证单一数据源 */
    setLegacy(key, value) {
        this.set(key, String(value));
        if (typeof window !== 'undefined' && window.localStorage) {
            try { window.localStorage.removeItem(key); } catch (e) {}
        }
    }
}


/* ===== [[ js/platform/lifecycle-adapter.js ]] ===== */
// ===== 生命周期适配器 (Phase 5) =====
// 统一前后台切换 / 页面隐藏恢复事件: onHide / onShow
// H5: document.visibilitychange + window blur/focus
// 抖音: tt.onAppHide / tt.onAppShow

class LifecycleAdapter {
    constructor() {
        this._handlers = { hide: [], show: [] };
        this._isBackground = false;
    }

    /** 绑定平台事件(H5默认实现) */
    bind() {
        var self = this;
        // 页面隐藏 (切后台/锁屏/切标签)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) self._fire('hide');
            else self._fire('show');
        });
        // V5.0: 失焦兜底 — visibilitychange 均触发时两者幂等(_fire 有 isBackground 去重语义由消费方保证);
        // 部分安卓WebView只触发blur不触发visibilitychange, 作为补充信号。
        window.addEventListener('blur', function() {
            if (document.visibilityState !== 'hidden') self._fire('hide');
        });
        window.addEventListener('focus', function() {
            if (!document.hidden) self._fire('show');
        });
    }

    /** 抖音环境用此方法接入 tt.onAppHide/onAppShow */
    /** V12: 微信小游戏生命周期(wx.onShow/onHide), 与 bindTt 对齐 */
    bindWx(wxApi) {
        var self = this;
        if (wxApi && wxApi.onShow) wxApi.onShow(function() { self._fire('show'); });
        if (wxApi && wxApi.onHide) wxApi.onHide(function() { self._fire('hide'); });
    }
    bindTt(ttApi) {
        var self = this;
        if (ttApi.onAppHide) ttApi.onAppHide(function() { self._fire('hide'); });
        if (ttApi.onAppShow) ttApi.onAppShow(function() { self._fire('show'); });
    }

    on(event, fn) {
        if (this._handlers[event]) this._handlers[event].push(fn);
        return function() { this.off(event, fn); }.bind(this);
    }

    off(event, fn) {
        var list = this._handlers[event];
        if (!list) return;
        var idx = list.indexOf(fn);
        if (idx >= 0) list.splice(idx, 1);
    }

    isBackground() { return this._isBackground; }

    _fire(event) {
        if (event === 'hide') this._isBackground = true;
        if (event === 'show') this._isBackground = false;
        var list = this._handlers[event].slice();
        for (var i = 0; i < list.length; i++) {
            try { list[i](); } catch (e) { console.error('[Lifecycle]', e); }
        }
    }
}


/* ===== [[ js/platform/audio-adapter.js ]] ===== */
// ===== 音频适配器 (Phase 5 / V5.0) =====
// H5: WebAudio(合成音效, 无需资源文件) | 抖音小游戏: 无 AudioContext, V5.0 增加
//     tt.createInnerAudioContext 分支 — 播放前用合成参数现场生成 8bit WAV 数据 URI。
// 游戏无音频资源文件, 全部音效为程序化合成; 提供静音开关(持久化)。

class AudioAdapter {
    constructor(storage, platformId) {
        this._storage = storage;
        this._platform = platformId || 'h5';
        this._ctx = null;          // WebAudio 上下文(h5)
        this._ttPool = [];         // 抖音 InnerAudioContext 池(按音效类型预建)
        this._wxPool = [];         // V12: 微信 InnerAudioContext 池
        this._muted = storage ? !!storage.get('audio_muted', false) : false;
        this._enabled = false;
        this._lastPlay = {}; // 限流: 同一音效最小间隔
    }

    /** 惰性初始化(必须由用户手势触发, 平台限制) */
    init() {
        if (this._enabled) return true;
        try {
            if (this._platform === 'douyin' && typeof tt !== 'undefined' && tt.createInnerAudioContext) {
                this._enabled = true;
                return true;
            }
            // V12: 微信小游戏 — 优先 wx.createWebAudioContext(振荡器API与H5一致),
            // 不支持时回退 wx.createInnerAudioContext(合成WAV data URI, 结构对齐抖音分支)
            if (this._platform === 'wechat' && typeof wx !== 'undefined') {
                if (wx.createWebAudioContext) {
                    try {
                        this._ctx = wx.createWebAudioContext();
                        this._enabled = true;
                        return true;
                    } catch (e) { /* 落入 InnerAudio 回退 */ }
                }
                if (wx.createInnerAudioContext) {
                    this._enabled = true;
                    return true;
                }
                return false;
            }
            var AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
            if (!AC) return false;
            this._ctx = new AC();
            this._enabled = true;
            return true;
        } catch (e) {
            console.warn('[Audio] 初始化失败', e);
            return false;
        }
    }

    /** 恢复上下文(iOS切后台后suspend) */
    resume() {
        if (this._ctx && this._ctx.state === 'suspended') {
            this._ctx.resume().catch(function() {});
        }
    }

    /** V5.0: 页面隐藏时暂停不必要的播放(WebAudio 全局挂起; 抖音由系统接管) */
    suspend() {
        if (this._ctx && this._ctx.state === 'running') {
            this._ctx.suspend().catch(function() {});
        }
    }

    isMuted() { return this._muted; }
    setMuted(m) {
        this._muted = !!m;
        if (this._storage) this._storage.set('audio_muted', this._muted);
    }

    /** 音效合成参数: freq起始Hz → end结束Hz, dur时长s, vol音量, wave波形 */
    static spec(type) {
        return {
            shoot: { freq: 880, end: 220, dur: 0.08, vol: 0.08, wave: 'square' },
            hit:   { freq: 320, end: 80,  dur: 0.1,  vol: 0.12, wave: 'triangle' },
            kill:  { freq: 520, end: 160, dur: 0.12, vol: 0.14, wave: 'square' },
            gate:  { freq: 440, end: 880, dur: 0.25, vol: 0.18, wave: 'sine' },
            grow:  { freq: 392, end: 784, dur: 0.18, vol: 0.16, wave: 'sine' },
            win:   { freq: 523, end: 1046, dur: 0.5, vol: 0.22, wave: 'sine' },
            lose:  { freq: 330, end: 110, dur: 0.6, vol: 0.2, wave: 'sawtooth' },
            click: { freq: 660, end: 660, dur: 0.05, vol: 0.1, wave: 'sine' },
            bossWarn: { freq: 150, end: 60, dur: 0.7, vol: 0.25, wave: 'sawtooth' },
            bossDie:  { freq: 200, end: 40, dur: 0.8, vol: 0.26, wave: 'sawtooth' }
        }[type] || { freq: 440, end: 440, dur: 0.1, vol: 0.1, wave: 'sine' };
    }

    /**
     * 合成音效
     * type: 'shoot'|'hit'|'kill'|'gate'|'grow'|'win'|'lose'|'click'|'bossWarn'|'bossDie'
     * 限流避免大量士兵同时射击时的音频爆音
     */
    play(type) {
        if (!this._enabled || this._muted) return;
        var now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        var minGap = { shoot: 90, hit: 60, kill: 70, gate: 200, grow: 120, win: 0, lose: 0, click: 50, bossWarn: 0, bossDie: 0 }[type] || 80;
        if (this._lastPlay[type] && now - this._lastPlay[type] < minGap) return;
        this._lastPlay[type] = now;

        try {
            if (this._ctx) this._playWebAudio(type);
            else if (this._platform === 'douyin') this._playTt(type);
            else if (this._platform === 'wechat') this._playWx(type);
        } catch (e) { /* 音频失败不影响游戏 */ }
    }

    _playWebAudio(type) {
        var t = this._ctx.currentTime;
        var conf = AudioAdapter.spec(type);
        var osc = this._ctx.createOscillator();
        var gain = this._ctx.createGain();
        osc.connect(gain);
        gain.connect(this._ctx.destination);
        osc.type = conf.wave;
        osc.frequency.setValueAtTime(conf.freq, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, conf.end), t + conf.dur);
        gain.gain.setValueAtTime(conf.vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + conf.dur);
        osc.start(t);
        osc.stop(t + conf.dur + 0.02);
    }

    /** V12: 微信回退路径 — InnerAudioContext 播放合成 WAV(与抖音分支同构) */
    _playWx(type) {
        if (typeof wx === 'undefined' || !wx.createInnerAudioContext) return;
        var conf = AudioAdapter.spec(type);
        var dataUri = this._synthWav(conf);
        var ctx = this._wxPool[type];
        if (!ctx) {
            ctx = wx.createInnerAudioContext();
            ctx.volume = Math.min(1, conf.vol * 4);
            ctx.loop = false;
            this._wxPool[type] = ctx;
        }
        try { ctx.stop(); } catch (e) {}
        ctx.src = dataUri;
        ctx.play();
    }

    /** 抖音: 现场合成 8bit 单声道 WAV data URI, 经 InnerAudioContext 播放 */
    _playTt(type) {
        var conf = AudioAdapter.spec(type);
        var dataUri = this._synthWav(conf);
        // 池化复用: 每类型保留一个 context, 换 src 重播(抖音换src播完自动停)
        var ctx = this._ttPool[type];
        if (!ctx) {
            ctx = tt.createInnerAudioContext({ useWebAudioImplement: true });
            ctx.volume = Math.min(1, conf.vol * 4);
            ctx.loop = false;
            this._ttPool[type] = ctx;
        }
        ctx.stop();
        ctx.src = dataUri;
        ctx.play();
    }

    /** 生成简短包络振荡 WAV(8bit 8kHz, 长度=dur) */
    _synthWav(conf) {
        var rate = 8000, n = Math.max(1, Math.floor(conf.dur * rate));
        var bytes = new Uint8Array(n);
        var phase = 0;
        for (var i = 0; i < n; i++) {
            var t = i / rate;
            // 频率指数滑降/滑升
            var f = conf.freq + (conf.end - conf.freq) * (t / conf.dur);
            phase += f / rate;
            var wave;
            var frac = phase % 1;
            if (conf.wave === 'square') wave = frac < 0.5 ? 1 : -1;
            else if (conf.wave === 'sawtooth') wave = frac * 2 - 1;
            else if (conf.wave === 'triangle') wave = 1 - Math.abs(frac - 0.5) * 4;
            else wave = Math.sin(phase * Math.PI * 2);
            // 音量包络(快起慢落)
            var env = Math.min(1, i / (rate * 0.005)) * Math.pow(1 - t / conf.dur, 1.5);
            bytes[i] = Math.round(128 + wave * 100 * env) & 0xFF;
        }
        // 组装 WAV 文件头(PCM 8bit mono)
        var buf = new ArrayBuffer(44 + n);
        var view = new DataView(buf);
        var w = 0;
        function str(s) { for (var i = 0; i < s.length; i++) view.setUint8(w++, s.charCodeAt(i)); }
        function u32(v) { view.setUint32(w, v, true); w += 4; }
        function u16(v) { view.setUint16(w, v, true); w += 2; }
        str('RIFF'); u32(36 + n); str('WAVE'); str('fmt ');
        u32(16); u16(1); u16(1); u32(rate); u32(rate); u16(1); u16(8);
        str('data'); u32(n);
        new Uint8Array(buf, 44).set(bytes);
        // ArrayBuffer→base64: 抖音用 tt.arrayBufferToBase64, H5 用 btoa
        if (typeof tt !== 'undefined' && tt.arrayBufferToBase64) {
            return 'data:audio/wav;base64,' + tt.arrayBufferToBase64(buf);
        }
        // V12: 微信小游戏 wx.arrayBufferToBase64
        if (typeof wx !== 'undefined' && wx.arrayBufferToBase64) {
            return 'data:audio/wav;base64,' + wx.arrayBufferToBase64(buf);
        }
        var bin = '';
        var raw = new Uint8Array(buf);
        var chunk = 0x8000;
        for (var ci = 0; ci < raw.length; ci += chunk) {
            bin += String.fromCharCode.apply(null, raw.subarray(ci, ci + chunk));
        }
        return 'data:audio/wav;base64,' + btoa(bin);
    }
}


/* ===== [[ js/platform/share-adapter.js ]] ===== */
// ===== 分享适配器 (Phase 5) =====
// 抖音: tt.shareAppMessage | H5: 无系统分享时静默降级(不报错)

class ShareAdapter {
    constructor(platformId) {
        this._platform = platformId;
        this._tt = (typeof tt !== 'undefined') ? tt : null;
        this._wx = (typeof wx !== 'undefined') ? wx : null; // V12: 微信分享
    }

    /**
     * 分享游戏
     * @returns {Promise<boolean>} true=已调起分享 false=平台不支持/失败(静默降级)
     */
    share(opts) {
        opts = opts || {};
        if (this._platform === 'douyin' && this._tt && this._tt.shareAppMessage) {
            try {
                this._tt.shareAppMessage({
                    title: opts.title || '膨胀小队 - 招兵买马·火力全开',
                    desc: opts.desc || '带你的小队冲穿状态门，击败僵尸Boss！',
                    success: function() {},
                    fail: function() {}
                });
                return Promise.resolve(true);
            } catch (e) {
                return Promise.resolve(false);
            }
        }
        // V12: 微信小游戏 wx.shareAppMessage(主动分享, 静默失败不影响游戏)
        if (this._platform === 'wechat' && this._wx && this._wx.shareAppMessage) {
            try {
                this._wx.shareAppMessage({
                    title: opts.title || '膨胀小队 - 招兵买马·火力全开',
                    desc: opts.desc || '带你的小队冲穿状态门，击败僵尸Boss！'
                });
                return Promise.resolve(true);
            } catch (e) {
                return Promise.resolve(false);
            }
        }
        // H5: 尝试 navigator.share, 不支持则降级(V12: 小游戏环境无 navigator, 直接降级)
        if (typeof navigator !== 'undefined' && navigator.share) {
            return navigator.share({
                title: opts.title || '膨胀小队',
                text: opts.desc || '带你的小队冲穿状态门，击败僵尸Boss！',
                url: opts.url || location.href
            }).then(function() { return true; }).catch(function() { return false; });
        }
        return Promise.resolve(false);
    }
}


/* ===== [[ js/platform/platform.js ]] ===== */
// ===== 平台适配门面 (Phase 5) =====
// 运行时检测 H5 / 抖音小游戏 / 微信小游戏(预留), 装配各适配器
// 全局单例 Platform; 生产代码只依赖 Platform.*, 不直接触碰 window/tt/wx

/**
 * 平台检测:
 * - 抖音小游戏提供全局 tt 对象 (getSystemInfoSync/appId等)
 * - 微信小游戏提供全局 wx 对象
 * - 其余为浏览器H5
 */
function detectPlatform() {
    try {
        if (typeof tt !== 'undefined' && tt.getSystemInfoSync) return 'douyin';
        if (typeof wx !== 'undefined' && wx.getSystemInfoSync) return 'wechat';
    } catch (e) {}
    return 'h5';
}

class PlatformAdapter {
    constructor() {
        this.id = detectPlatform();
        this.tt = (this.id === 'douyin') ? tt : null;
        this.wx = (this.id === 'wechat') ? wx : null;

        // 存储适配器(V12: 微信端接入 wx 同步存储 — 原先误落内存存储导致存档不持久)
        if (this.id === 'douyin') this.storageAdapter = new TtStorageAdapter(this.tt);
        else if (this.id === 'wechat') this.storageAdapter = new WxStorageAdapter(this.wx);
        else if (this.id === 'h5') this.storageAdapter = new LocalStorageAdapter();
        else this.storageAdapter = new MemoryStorageAdapter();
        this.storage = new GameStorage(this.storageAdapter);

        // 生命周期
        this.lifecycle = new LifecycleAdapter();
        // 音频(V5.0: 传入平台ID, 抖音端走 tt.createInnerAudioContext 分支)
        this.audio = new AudioAdapter(this.storage, this.id);
        // 分享
        this.share = new ShareAdapter(this.id);
        // 广告服务(Phase 4): 由 ads/ad-service.js 装配
        this.ads = null;

        // 系统信息(屏幕/DPR/安全区)
        this.sysInfo = this._readSysInfo();
    }

    _readSysInfo() {
        var info = {
            platform: this.id,
            pixelRatio: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
            screenWidth: (typeof window !== 'undefined' && window.innerWidth) || 390,
            screenHeight: (typeof window !== 'undefined' && window.innerHeight) || 844,
            statusBarHeight: 0,
            safeArea: null
        };
        if (this.id === 'douyin' && this.tt.getSystemInfoSync) {
            try {
                var s = this.tt.getSystemInfoSync();
                info.pixelRatio = s.pixelRatio || info.pixelRatio;
                info.screenWidth = s.screenWidth || info.screenWidth;
                info.screenHeight = s.screenHeight || info.screenHeight;
                info.statusBarHeight = s.statusBarHeight || 0;
                info.safeArea = s.safeArea || null;
            } catch (e) {}
        }
        // V12: 微信小游戏系统信息(windowWidth/Height 为可用窗口尺寸, 用于 UI 视口)
        if (this.id === 'wechat' && this.wx && this.wx.getSystemInfoSync) {
            try {
                var w = this.wx.getSystemInfoSync();
                info.pixelRatio = w.pixelRatio || info.pixelRatio;
                info.screenWidth = w.windowWidth || w.screenWidth || info.screenWidth;
                info.screenHeight = w.windowHeight || w.screenHeight || info.screenHeight;
                info.statusBarHeight = w.statusBarHeight || 0;
                info.safeArea = w.safeArea || null;
                info.model = w.model || '';
                info.benchmarkLevel = (w.benchmarkLevel !== undefined) ? w.benchmarkLevel : -1;
            } catch (e) {}
        }
        return info;
    }

    /** 初始化(绑定生命周期等); 在游戏启动时调用一次 */
    initialize() {
        if (this.id === 'douyin') {
            this.lifecycle.bindTt(this.tt);
        } else if (this.id === 'wechat') {
            // V12修复: 微信走 wx.onShow/onHide — 原先误入 bind() 会触碰 document(小游戏无 document, 直接抛错)
            this.lifecycle.bindWx(this.wx);
        } else {
            this.lifecycle.bind();
        }
        // 显示/隐藏时暂停/恢复音频上下文(V5.0: hide侧补齐挂起)
        var self = this;
        this.lifecycle.on('show', function() { self.audio.resume(); });
        this.lifecycle.on('hide', function() { self.audio.suspend(); });
    }

    /** 是否小游戏环境(无完整DOM) */
    isMiniGame() { return this.id !== 'h5'; }
}

// 全局单例
var Platform = new PlatformAdapter();


/* ===== [[ js/ads/ad-service.js ]] ===== */
// ===== 广告服务核心 (Phase 4) =====
// 统一激励视频接口 + 幂等状态机 + 奖励事务账本
// 生产代码只依赖 AdService 门面; 平台实现见 web-mock-ad.js / douyin-ad.js / wechat-ad.js
//
// 铁律:
// 1. 只有平台回调确认"完整观看"才发奖 (抖音 isEnded=true / 模拟器点击"完成观看")
// 2. 每笔奖励有唯一 transactionId, 发奖前查 RewardLedger 防重复
// 3. 广告期间游戏必须暂停; 关闭/失败/中断都要恢复
// 4. 绝不伪造广告完成回调

/** 广告错误码 */
var AdError = {
    NOT_INITIALIZED: 'not_initialized',   // 未调用 initialize()
    NOT_AVAILABLE:   'not_available',     // 无可用广告位/平台不支持
    LOAD_FAILED:     'load_failed',       // 加载失败(网络等)
    SHOW_FAILED:     'show_failed',       // 展示失败
    ABANDONED:       'abandoned',         // 用户提前关闭(不发奖)
    INTERRUPTED:     'interrupted',       // 切后台/来电中断(不发奖)
    BUSY:            'busy',              // 已有广告流程进行中(防连点)
    TIMEOUT:         'timeout'            // V5.0: 展示超时兜底(平台回调丢失时不软锁死)
};

/** 广告场景(激励视频) */
var AdPlacement = {
    REVIVE:        'revive',         // 4.1 复活
    DOUBLE_REWARD: 'double_reward',  // 4.2 双倍结算
    REFRESH_GATES: 'refresh_gates',  // 4.3 状态门刷新
    FREE_SUPPLY:    'free_supply'    // V5.1 每日免费补给
};

/**
 * 奖励事务账本: 持久化已发奖的 transactionId, 跨页面刷新防重复发放
 */
class RewardLedger {
    constructor(storage) {
        this._storage = storage;
        this._granted = storage.get('ad_reward_ledger', {});
        // 清理7天前的旧事务(防止无限膨胀)
        var cutoff = Date.now() - 7 * 24 * 3600 * 1000;
        var changed = false;
        for (var id in this._granted) {
            if (this._granted[id].t < cutoff) { delete this._granted[id]; changed = true; }
        }
        if (changed) this._save();
    }
    _save() { this._storage.set('ad_reward_ledger', this._granted); }
    /** 是否已发放过 */
    has(transactionId) { return !!this._granted[transactionId]; }
    /** 标记发放 */
    mark(transactionId, meta) {
        if (this.has(transactionId)) return false;
        this._granted[transactionId] = { t: Date.now(), meta: meta || null };
        this._save();
        return true;
    }
}

/**
 * 广告服务门面(基类)
 * 平台实现子类需覆写: _doInitialize / _doIsAvailable / _doPreload / _doShow
 * _doShow(opts) 约定:
 *   opts.placement     广告场景
 *   opts.onComplete()  完整观看(唯一发奖入口)
 *   opts.onAbandon()   提前关闭
 *   opts.onError(err)  加载/展示失败
 *   opts.onInterrupt() 中断(切后台)
 */
class AdService {
    constructor(storage, lifecycle) {
        this._storage = storage;
        this._lifecycle = lifecycle;
        this._ledger = new RewardLedger(storage);
        // 状态机: idle -> requesting -> showing -> (settling) -> idle
        this._state = 'idle';
        this._requestId = null;
        this._pendingShow = null; // 进行中的 {resolve} 防连点
        this._initialized = false;
        this._rewardDelivered = false; // 本次展示是否已确认发奖(防平台重复回调)
    }

    /** 初始化(幂等) */
    initialize() {
        if (this._initialized) return;
        this._initialized = true;
        this._doInitialize();
        // 切后台中断当前广告
        if (this._lifecycle) {
            var self = this;
            this._lifecycle.on('hide', function() { self._onAppHide(); });
        }
    }

    /** 广告是否可用(平台支持且已配置广告位) */
    isAvailable() {
        if (!this._initialized) return false;
        return this._doIsAvailable();
    }

    /** 预加载(尽力而为, 失败静默) */
    preload() {
        if (!this._initialized || !this.isAvailable()) return Promise.resolve(false);
        return Promise.resolve(this._doPreload()).catch(function() { return false; });
    }

    /**
     * 展示激励视频
     * @param {string} placement AdPlacement
     * @returns {Promise<{status:'completed'|'abandoned'|'failed', reason?:string, transactionId?:string}>}
     *  - completed: 完整观看, transactionId 可发奖(调用方还需 ledger.mark 防重)
     *  - abandoned: 提前关闭, 不发奖
     *  - failed:    加载/展示失败/不支持/中断, 不发奖
     */
    showRewarded(placement) {
        var self = this;
        // 防连点/防重入
        if (this._state !== 'idle') {
            return Promise.resolve({ status: 'failed', reason: AdError.BUSY });
        }
        if (!this._initialized) {
            return Promise.resolve({ status: 'failed', reason: AdError.NOT_INITIALIZED });
        }
        if (!this.isAvailable()) {
            return Promise.resolve({ status: 'failed', reason: AdError.NOT_AVAILABLE });
        }

        this._state = 'requesting';
        this._requestId = 'req_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
        this._rewardDelivered = false;

        return new Promise(function(resolve) {
            self._pendingShow = { resolve: resolve, placement: placement, requestId: self._requestId };
            self._state = 'showing';
            // V5.0: 超时兜底 — 平台onClose丢失(进程异常/系统弹窗遮挡)时游戏不得永久暂停。
            // 30s远超正常激励视频时长; 超时结算为failed(不发奖), 由调用方恢复游戏。
            self._showTimer = setTimeout(function() {
                if (self._state === 'showing' || self._state === 'requesting') {
                    self._settle('failed', AdError.TIMEOUT);
                }
            }, 30000);
            try {
                self._doShow({
                    placement: placement,
                    requestId: self._requestId,
                    onComplete: function() { self._settle('completed'); },
                    onAbandon:  function() { self._settle('abandoned'); },
                    onError:    function(code) { self._settle('failed', code); },
                    onInterrupt:function() { self._settle('failed', AdError.INTERRUPTED); }
                });
            } catch (e) {
                self._settle('failed', AdError.SHOW_FAILED);
            }
        });
    }

    dispose() {
        this._state = 'idle';
        this._pendingShow = null;
        this._doDispose();
    }

    // ---- 内部 ----

    /** 统一结算入口(状态机唯一出口, 幂等) */
    _settle(status, reason) {
        if (this._state === 'idle') return; // 已结算过(重复回调防护)
        var pending = this._pendingShow;
        this._state = 'idle';
        this._pendingShow = null;
        if (this._showTimer) { clearTimeout(this._showTimer); this._showTimer = null; } // V5.0: 清理超时兜底

        var result = { status: status, reason: reason || null };
        if (status === 'completed') {
            // 完整观看: 生成奖励事务ID(即使重复回调, transactionId 只生成一次)
            if (!this._rewardDelivered) {
                this._rewardDelivered = true;
                result.transactionId = 'txn_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
            } else {
                // 平台重复的完成回调: 不再发新事务
                result.status = 'failed';
                result.reason = 'duplicate_callback';
            }
        }
        if (pending) pending.resolve(result);
    }

    /** 切后台: 中断当前展示(不发奖) */
    _onAppHide() {
        if (this._state === 'showing' || this._state === 'requesting') {
            this._doInterrupt();
            this._settle('failed', AdError.INTERRUPTED);
        }
    }

    /** 发奖防护门: 调用方在拿到 completed+transactionId 后调用 */
    grantReward(transactionId, grantFn) {
        if (!transactionId) return false;
        if (this._ledger.has(transactionId)) return false;
        grantFn();
        this._ledger.mark(transactionId, {});
        return true;
    }

    // ---- 平台子类覆写 ----
    _doInitialize() {}
    _doIsAvailable() { return false; }
    _doPreload() {}
    _doShow(opts) { if (opts.onError) opts.onError(AdError.NOT_AVAILABLE); }
    _doInterrupt() {}
    _doDispose() {}
}


/* ===== [[ js/ads/web-mock-ad.js ]] ===== */
// ===== H5 测试广告模拟器 (Phase 4) =====
// 明确标注"测试广告", 不接真实广告SDK; 支持测试场景注入(自动化测试用)
// 规则与真实平台一致: 提前关闭不发奖 / 完整观看发奖 / 中断不发奖

class WebMockAdService extends AdService {
    constructor(storage, lifecycle, opts) {
        super(storage, lifecycle);
        this._opts = opts || {};
        // 测试场景: 'normal'(默认手动) | 'auto_complete'(自动完成) | 'auto_abandon'(自动提前关闭) | 'error'(加载失败)
        this._scenario = this._opts.scenario || 'normal';
        this._autoDuration = this._opts.autoDuration || 3; // 自动完成秒数
    }

    setScenario(s) { this._scenario = s; }

    _doInitialize() {
        // 创建DOM覆盖层(懒创建)
        this._ensureOverlay();
    }

    _doIsAvailable() {
        // 模拟器始终可用; 'error'场景模拟不可用
        return this._scenario !== 'error' || this._opts.errorAvailable === true;
    }

    _doPreload() { /* 模拟器无加载过程 */ }

    _doShow(opts) {
        var self = this;
        // 测试场景自动处置
        if (this._scenario === 'error') {
            setTimeout(function() { opts.onError(AdError.LOAD_FAILED); }, 60);
            return;
        }
        if (this._scenario === 'auto_complete') {
            // 模拟播放 autoDuration 秒后完成
            this._showOverlay(opts, this._autoDuration, true);
            return;
        }
        if (this._scenario === 'auto_abandon') {
            this._showOverlay(opts, this._autoDuration, false, function() {
                // 播放中自动"提前关闭"
                // V11 QA修复[P3]: 跟踪定时器并做归属校验 — 原实现未跟踪,
                // 若800ms内广告已被他路结算且新广告开启, 旧定时器会把新广告覆盖层藏掉
                if (self._abandonTimer) clearTimeout(self._abandonTimer);
                self._abandonTimer = setTimeout(function() {
                    self._abandonTimer = null;
                    if (self._current === opts) self._handleClose(opts, false);
                }, 800);
            });
            return;
        }
        // 默认: 手动交互
        this._showOverlay(opts, 0, false);
    }

    _doInterrupt() {
        // 切后台: 关闭覆盖层, 不发奖
        this._hideOverlay();
    }

    _doDispose() { this._hideOverlay(); }

    // ---- 模拟器UI ----
    _ensureOverlay() {
        if (this._overlay || typeof document === 'undefined') return;
        var self = this;
        var el = document.createElement('div');
        el.id = 'mock-ad-overlay';
        el.style.cssText = 'position:absolute;inset:0;z-index:60;display:none;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#111827,#1F2937);color:#fff;font-family:sans-serif;';
        el.innerHTML =
            '<div style="position:absolute;top:10px;left:14px;background:#F59E0B;color:#111;font-weight:900;font-size:12px;padding:3px 10px;border-radius:6px;letter-spacing:1px;">测试广告模拟器 · TEST AD</div>' +
            '<div id="mock-ad-timer" style="font-size:52px;font-weight:900;color:#FDE68A;margin-bottom:8px;">3</div>' +
            '<div id="mock-ad-tip" style="font-size:14px;color:#9CA3AF;margin-bottom:26px;">模拟激励视频播放中…（完整观看才可领取奖励）</div>' +
            '<div style="display:flex;gap:14px;">' +
            '<button id="mock-ad-finish" style="padding:12px 30px;font-size:16px;font-weight:800;background:linear-gradient(180deg,#4DA8FF,#1A6FD4);color:#fff;border:none;border-radius:30px;cursor:pointer;">模拟完整观看</button>' +
            '<button id="mock-ad-close" style="padding:12px 30px;font-size:16px;font-weight:700;background:#374151;color:#D1D5DB;border:none;border-radius:30px;cursor:pointer;">提前关闭(不发奖)</button>' +
            '</div>';
        (document.getElementById('game-container') || document.body).appendChild(el);
        this._overlay = el;
        this._timerEl = el.querySelector('#mock-ad-timer');
        this._tipEl = el.querySelector('#mock-ad-tip');
        this._finishBtn = el.querySelector('#mock-ad-finish');
        this._closeBtn = el.querySelector('#mock-ad-close');
        this._finishBtn.addEventListener('click', function() {
            if (self._current) self._handleClose(self._current, true);
        });
        this._closeBtn.addEventListener('click', function() {
            if (self._current) self._handleClose(self._current, false);
        });
    }

    /**
     * 显示覆盖层
     * @param opts 广告回调
     * @param countdown 自动完成倒计时(0=手动)
     * @param autoComplete 是否自动完成
     * 注: 无DOM环境(单测/小游戏)自动跳过UI, 仅保留计时与结算逻辑
     */
    _showOverlay(opts, countdown, autoComplete, afterShow) {
        this._current = opts;
        this._hideTimer();
        if (!this._overlay) {
            // 无DOM兜底: 纯逻辑模式
            if (countdown > 0 && autoComplete) {
                var self = this;
                this._autoTimer = setTimeout(function() {
                    if (self._current) self._handleClose(self._current, true);
                }, countdown * 1000);
            }
            if (afterShow) afterShow();
            return;
        }
        this._overlay.style.display = 'flex';
        if (countdown > 0) {
            var self2 = this;
            var remain = countdown;
            this._timerEl.textContent = remain;
            this._timerEl.style.display = 'block';
            this._tipEl.textContent = '模拟激励视频播放中…（完整观看才可领取奖励）';
            this._autoTimer = setInterval(function() {
                remain--;
                if (self2._timerEl) self2._timerEl.textContent = Math.max(0, remain);
                if (remain <= 0) {
                    self2._hideTimer();
                    if (autoComplete && self2._current) self2._handleClose(self2._current, true);
                }
            }, 1000);
            this._finishBtn.style.visibility = 'hidden';
            this._closeBtn.style.visibility = 'hidden';
            setTimeout(function() {
                self2._finishBtn.style.visibility = 'visible';
                self2._closeBtn.style.visibility = 'visible';
            }, 600);
        } else {
            this._timerEl.style.display = 'none';
            this._tipEl.textContent = 'TEST AD · 点击下方按钮模拟观看结果';
            this._finishBtn.style.visibility = 'visible';
            this._closeBtn.style.visibility = 'visible';
        }
        if (afterShow) afterShow();
    }

    _hideTimer() {
        // V11 QA修复[P3]: _autoTimer 可能承载 setTimeout(无DOM兜底路径)或 setInterval(DOM倒计时),
        // 原实现只用clearInterval — 两者同时调用确保两种句柄都能正确清除
        if (this._autoTimer) { clearTimeout(this._autoTimer); clearInterval(this._autoTimer); this._autoTimer = null; }
    }

    _hideOverlay() {
        this._hideTimer();
        if (this._abandonTimer) { clearTimeout(this._abandonTimer); this._abandonTimer = null; } // V11 QA: 一并清理提前关闭定时器
        if (this._overlay) this._overlay.style.display = 'none';
        this._current = null;
    }

    /** 关闭处置: completed=完整观看发奖 / 提前关闭不发奖 */
    _handleClose(opts, completed) {
        this._hideOverlay();
        if (completed) {
            if (opts.onComplete) opts.onComplete();
        } else {
            if (opts.onAbandon) opts.onAbandon();
        }
    }
}


/* ===== [[ js/ads/douyin-ad.js ]] ===== */
// ===== 抖音小游戏激励视频服务 (Phase 4 / V5.0 修复) =====
// 使用官方 tt.createRewardedVideoAd
// 铁律: 仅 onClose 回调 res.isEnded === true (或 res.isEnded 布尔真) 才算完整观看
// 广告位ID从平台配置读取(构建期由 tools/build-douyin.js 注入 window.__GAME_SETTINGS.ads.douyin);
// 未配置 → isAvailable()=false, 不伪造广告

class DouyinAdService extends AdService {
    constructor(storage, lifecycle) {
        super(storage, lifecycle);
        // V5.0修复: 旧代码引用从未赋值的this.tt导致初始化必然抛错(广告永不可用)。
        // tt 句柄由 Platform 门面注入(平台检测时捕获), 小游戏环境兜底直接读全局。
        this.tt = (typeof Platform !== 'undefined' && Platform.tt) ? Platform.tt
            : (typeof tt !== 'undefined' ? tt : null);
        this._rewardAd = null;
        this._loadError = null;
        this._showing = false;
    }

    /** 广告位ID: 优先构建期注入配置(window.__GAME_SETTINGS.ads.douyin.rewardVideo), 未配置返回空 */
    _adUnitId() {
        try {
            var s = (typeof window !== 'undefined' && window.__GAME_SETTINGS) || null;
            var units = s && s.ads && s.ads.douyin;
            return (units && units.rewardVideo) || '';
        } catch (e) { return ''; }
    }

    _doInitialize() {
        var self = this;
        if (!this.tt || !this._adUnitId()) return; // 无平台句柄/未配置广告位: 保持不可用
        try {
            this._rewardAd = this.tt.createRewardedVideoAd({ adUnitId: this._adUnitId() });
            // 平台错误(加载失败等)
            this._rewardAd.onError(function(err) {
                self._loadError = err || true;
                // 展示中出错 → 结算为失败
                if (self._showing && self._current) {
                    self._showing = false;
                    if (self._current.opts.onError) self._current.opts.onError(AdError.SHOW_FAILED);
                }
            });
            // 关闭回调(唯一发奖判定点)
            this._rewardAd.onClose(function(res) {
                self._showing = false;
                var cur = self._current;
                if (!cur) return;
                self._current = null;
                if (res && (res.isEnded === true || res.isEnded === 1)) {
                    if (cur.opts.onComplete) cur.opts.onComplete();
                } else {
                    // 提前关闭
                    if (cur.opts.onAbandon) cur.opts.onAbandon();
                }
                // 预加载下一次
                self._doPreload();
            });
        } catch (e) {
            console.error('[DouyinAd] 初始化失败', e);
            this._rewardAd = null;
        }
    }

    _doIsAvailable() {
        return !!(this.tt && this._adUnitId() && this._rewardAd);
    }

    _doPreload() {
        var self = this;
        if (!this._rewardAd) return Promise.resolve(false);
        return new Promise(function(resolve) {
            self._loadError = null;
            self._rewardAd.load()
                .then(function() { resolve(true); })
                .catch(function(err) { self._loadError = err; resolve(false); });
        });
    }

    _doShow(opts) {
        var self = this;
        if (!this._rewardAd) {
            opts.onError(AdError.NOT_AVAILABLE);
            return;
        }
        this._current = { opts: opts };
        this._showing = true;
        // V11 QA修复[P3]: 捕获广告实例引用 — 原重试链二次重读 this._rewardAd,
        // 若期间被dispose()置null则重试路径抛错(虽被catch兜底, 但语义混乱且依赖隐式null检查)
        var ad = this._rewardAd;
        ad.show()
            .catch(function(err) {
                // 展示失败: 尝试二次load后重试一次
                ad.load()
                    .then(function() { return ad.show(); })
                    .catch(function() {
                        self._showing = false;
                        self._current = null;
                        opts.onError(AdError.SHOW_FAILED);
                    });
            });
    }

    _doInterrupt() {
        // 抖音切后台由系统接管视频; AdService._onAppHide 已统一结算为 interrupted(不发奖),
        // onClose 若仍回调 isEnded=true 会被状态机幂等拦截(_settle 二次调用直接 return)。
        this._showing = false;
    }

    _doDispose() {
        if (this._rewardAd && this._rewardAd.destroy) {
            try { this._rewardAd.destroy(); } catch (e) {}
        }
        this._rewardAd = null;
    }
}


/* ===== [[ js/ads/wechat-ad.js ]] ===== */
// ===== 微信小游戏激励视频服务 (V12 正式实现) =====
// 使用官方 wx.createRewardedVideoAd — 结构与 DouyinAdService 一致
// 铁律: 仅 onClose 回调 res.isEnded === true (或 res.isEnded === 1) 才算完整观看并发放奖励
// 广告位ID从平台配置读取(构建期由 tools/build-wechat.js 注入 window.__GAME_SETTINGS.ads.wechat);
// 未配置 → isAvailable()=false, 上层如实降级, 不伪造广告, 不用 Mock 冒充正式广告
// 合规: 奖励发放经 AdService 状态机幂等结算 + RewardLedger 唯一事务ID防重复(grantReward),
//       切后台由 AdService._onAppHide 统一结算为 interrupted(不发奖)

class WechatAdService extends AdService {
    constructor(storage, lifecycle) {
        super(storage, lifecycle);
        // wx 句柄由 Platform 门面注入(平台检测时捕获), 小游戏环境兜底直接读全局
        this.wx = (typeof Platform !== 'undefined' && Platform.wx) ? Platform.wx
            : (typeof wx !== 'undefined' ? wx : null);
        this._rewardAd = null;
        this._loadError = null;
        this._showing = false;
    }

    /** 广告位ID: 优先构建期注入配置(window.__GAME_SETTINGS.ads.wechat.rewardVideo), 未配置返回空 */
    _adUnitId() {
        try {
            var s = (typeof window !== 'undefined' && window.__GAME_SETTINGS) || null;
            var units = s && s.ads && s.ads.wechat;
            return (units && units.rewardVideo) || '';
        } catch (e) { return ''; }
    }

    _doInitialize() {
        var self = this;
        if (!this.wx || !this._adUnitId()) return; // 无平台句柄/未配置广告位: 保持不可用
        try {
            this._rewardAd = this.wx.createRewardedVideoAd({ adUnitId: this._adUnitId() });
            // 平台错误(加载失败等): 记录并结算展示中的请求
            this._rewardAd.onError(function(err) {
                self._loadError = err || true;
                if (self._showing && self._current) {
                    self._showing = false;
                    if (self._current.opts.onError) self._current.opts.onError(AdError.SHOW_FAILED);
                }
            });
            // 关闭回调(唯一发奖判定点)
            this._rewardAd.onClose(function(res) {
                self._showing = false;
                var cur = self._current;
                if (!cur) return;
                self._current = null;
                if (res && (res.isEnded === true || res.isEnded === 1)) {
                    if (cur.opts.onComplete) cur.opts.onComplete();
                } else {
                    // 用户中途关闭 → 不发奖
                    if (cur.opts.onAbandon) cur.opts.onAbandon();
                }
                // 预加载下一次
                self._doPreload();
            });
        } catch (e) {
            console.error('[WechatAd] 初始化失败', e);
            this._rewardAd = null;
        }
    }

    _doIsAvailable() {
        return !!(this.wx && this._adUnitId() && this._rewardAd);
    }

    _doPreload() {
        var self = this;
        if (!this._rewardAd || !this._rewardAd.load) return Promise.resolve(false);
        return new Promise(function(resolve) {
            self._loadError = null;
            try {
                var p = self._rewardAd.load();
                if (p && p.then) {
                    p.then(function() { resolve(true); })
                     .catch(function(err) { self._loadError = err; resolve(false); });
                } else {
                    resolve(false);
                }
            } catch (e) {
                self._loadError = e;
                resolve(false);
            }
        });
    }

    _doShow(opts) {
        var self = this;
        if (!this._rewardAd) {
            opts.onError(AdError.NOT_AVAILABLE);
            return;
        }
        this._current = { opts: opts };
        this._showing = true;
        // 捕获广告实例引用 — 防 dispose 竞态(与抖音 V11 修复同构)
        var ad = this._rewardAd;
        try {
            var p = ad.show();
            if (p && p.catch) {
                p.catch(function(err) {
                    // 展示失败: 尝试二次 load 后重试一次
                    var lp = ad.load && ad.load();
                    var loadP = (lp && lp.then) ? lp : Promise.resolve();
                    loadP.then(function() { return ad.show(); })
                        .catch(function() {
                            self._showing = false;
                            self._current = null;
                            opts.onError(AdError.SHOW_FAILED);
                        });
                });
            }
        } catch (e) {
            self._showing = false;
            self._current = null;
            opts.onError(AdError.SHOW_FAILED);
        }
    }

    _doInterrupt() {
        // 微信切后台由系统接管视频; AdService._onAppHide 已统一结算为 interrupted(不发奖),
        // onClose 若仍回调 isEnded=true 会被状态机幂等拦截(_settle 二次调用直接 return)。
        this._showing = false;
    }

    _doDispose() {
        if (this._rewardAd && this._rewardAd.destroy) {
            try { this._rewardAd.destroy(); } catch (e) {}
        }
        this._rewardAd = null;
    }
}


/* ===== [[ js/ads/game-ad-coordinator.js ]] ===== */
// ===== 游戏广告协调器 (Phase 4) =====
// 把 AdService 接到游戏规则上:
//   4.1 复活: 每局最多1次; 发奖后恢复50%人数(至少5人), 短暂无敌2.5s
//   4.2 双倍结算: 每次通关最多领1次双倍
//   4.3 状态门刷新: 每局有限次数(默认2次); 刷新后重新生成当前段三选一门, 不重复发旧门奖励
// 所有奖励走 ledger 幂等; 广告展示前后由外部回调暂停/恢复游戏

var AD_RULES = {
    REVIVE_MAX_PER_RUN: 1,
    DOUBLE_MAX_PER_RUN: 1,
    GATE_REFRESH_MAX_PER_RUN: 2,
    REVIVE_RATIO: 0.5,        // 复活恢复比例(相对失败前最大人数)
    REVIVE_MIN: 5,
    REVIVE_INVINCIBLE_SEC: 2.5
};

class GameAdCoordinator {
    /**
     * @param adService AdService 实例
     * @param hooks { pauseGame(), resumeGame(), onReviveReward(count, invincibleSec), onDoubleReward(), onGatesRefresh(), canRefreshGates() }
     */
    constructor(adService, hooks) {
        this._ads = adService;
        this._hooks = hooks || {};
        // 每局计数器(startRun时重置)
        this._runCounters = { revive: 0, double: 0, gateRefresh: 0 };
        // 进行中标记(防UI连点)
        this._busy = false;
    }

    /** 新一局开始: 重置次数限制 */
    startRun() {
        this._runCounters = { revive: 0, double: 0, gateRefresh: 0 };
        this._busy = false;
    }

    // ---- 能力查询(UI按钮置灰用) ----
    canShowAds() { return this._ads && this._ads.isAvailable(); }
    canRevive() { return this.canShowAds() && this._runCounters.revive < AD_RULES.REVIVE_MAX_PER_RUN; }
    canDoubleReward() { return this.canShowAds() && this._runCounters.double < AD_RULES.DOUBLE_MAX_PER_RUN; }
    canRefreshGates() { return this.canShowAds() && this._runCounters.gateRefresh < AD_RULES.GATE_REFRESH_MAX_PER_RUN; }
    getGateRefreshLeft() { return Math.max(0, AD_RULES.GATE_REFRESH_MAX_PER_RUN - this._runCounters.gateRefresh); }

    /**
     * 通用展示流程: 暂停游戏 → 展示 → 结算(幂等发奖) → 恢复游戏
     * @returns {Promise<boolean>} 是否发放了奖励
     */
    _showAndGrant(placement, grantFn) {
        var self = this;
        if (this._busy) return Promise.resolve(false);
        if (!this._ads.isAvailable()) return Promise.resolve(false);
        this._busy = true;
        if (this._hooks.pauseGame) this._hooks.pauseGame();
        return this._ads.showRewarded(placement).then(function(result) {
            var granted = false;
            if (result.status === 'completed' && result.transactionId) {
                // V11 QA修复[P2]: 发奖回调抛错时仍必须 resumeGame + 复位_busy,
                // 否则游戏永久暂停且广告系统卡死(上游调用点无.catch兜底)
                try {
                    granted = self._ads.grantReward(result.transactionId, grantFn);
                } catch (e) {
                    console.error('[AdCoordinator] grant callback failed:', e);
                }
            }
            if (self._hooks.resumeGame) self._hooks.resumeGame();
            self._busy = false;
            return granted;
        });
    }

    /** 4.1 激励视频复活(失败界面按钮) V3.5: 次数在请求时消耗(防授奖竞态), 奖励仍由幂等账本保证 */
    requestRevive(maxCountBeforeDeath) {
        var self = this;
        if (!this.canRevive()) return Promise.resolve(false);
        this._runCounters.revive++;
        return this._showAndGrant(AdPlacement.REVIVE, function() {
            var reviveCount = Math.max(AD_RULES.REVIVE_MIN,
                Math.floor((maxCountBeforeDeath || 10) * AD_RULES.REVIVE_RATIO));
            if (self._hooks.onReviveReward) {
                self._hooks.onReviveReward(reviveCount, AD_RULES.REVIVE_INVINCIBLE_SEC);
            }
        });
    }

    /** 4.2 双倍结算(胜利界面按钮) */
    requestDoubleReward() {
        var self = this;
        if (!this.canDoubleReward()) return Promise.resolve(false);
        this._runCounters.double++;
        return this._showAndGrant(AdPlacement.DOUBLE_REWARD, function() {
            if (self._hooks.onDoubleReward) self._hooks.onDoubleReward();
        });
    }

    /** V5.1 每日免费补给(首页按钮): 随机人数/伤害/射速补给 → 下一局生效 */
    requestFreeSupply() {
        return this._showAndGrant(AdPlacement.FREE_SUPPLY, function() {});
    }

    /** 4.3 状态门刷新(战斗中按钮) */
    requestGateRefresh() {
        var self = this;
        if (!this.canRefreshGates()) return Promise.resolve(false);
        if (this._hooks.canRefreshGates && !this._hooks.canRefreshGates()) {
            return Promise.resolve(false); // 当前无未触发的门可刷新
        }
        this._runCounters.gateRefresh++;
        return this._showAndGrant(AdPlacement.REFRESH_GATES, function() {
            if (self._hooks.onGatesRefresh) self._hooks.onGatesRefresh();
        });
    }
}

/**
 * 广告服务装配: 按平台选择实现
 *   抖音=真实SDK(需构建期注入广告位ID) / 微信=预留 / H5=仅开发测试环境装配Mock
 * V5.0 生产隔离: H5 生产部署没有真实广告SDK, 不得把"测试广告模拟器"当商业广告发放奖励 —
 *   仅 localhost/file 环境装配 WebMock(?adtest= 场景注入同样仅限本地, V10 QA 收紧); 其余H5环境广告如实降级不可用(按钮自动隐藏)。
 * 供 Platform.initialize() 后的引导脚本调用。
 */
function isLocalDevHost() {
    if (typeof location === 'undefined') return false;
    if (location.protocol === 'file:') return true;
    var h = String(location.hostname || '');
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';
}

function setupAdService() {
    var svc;
    if (Platform.id === 'douyin') {
        svc = new DouyinAdService(Platform.storage, Platform.lifecycle);
    } else if (Platform.id === 'wechat') {
        svc = new WechatAdService(Platform.storage, Platform.lifecycle);
    } else if (isLocalDevHost()) { // V10 QA修复: ?adtest= 场景注入收紧到本地开发环境(原条件让线上用户可用URL参数激活自动完成测试广告)
        // H5 开发/测试环境: 明确标注的测试广告模拟器(支持 ?adtest= 场景注入)
        svc = new WebMockAdService(Platform.storage, Platform.lifecycle, {
            scenario: (typeof window !== 'undefined' && window.__AD_TEST_SCENARIO) || 'normal'
        });
    } else {
        // 生产H5: 无真实广告SDK, 广告功能不可用(复活/双倍/刷门入口自动隐藏), 不伪造完成回调
        svc = null;
    }
    if (svc) svc.initialize();
    Platform.ads = svc;
    return svc;
}


/* ===== [[ js/game.js ]] ===== */
// ===== 游戏主控制器: 循环/输入/UI/胜负 =====

class Game {
    constructor() {
        var self = this;
        this.canvas = document.getElementById('game-canvas');
        this.world = new World(this.canvas);
        // 按画质等级调整池大小
        var q = this.world.quality;
        if (q === 0) {
            CONFIG.BULLET_MAX_VISIBLE = 50;
            CONFIG.PARTICLE_MAX = 120;
        } else if (q === 1) {
            CONFIG.BULLET_MAX_VISIBLE = 90;
            CONFIG.PARTICLE_MAX = 220;
        }
        this.effects = new Effects(this.world.scene);
        // V5.1: 永久档案(金币/升级/解锁) — Squad 构造时注入以读取永久属性
        this.profile = (typeof GameProfile !== 'undefined' && Platform.storage)
            ? new GameProfile(Platform.storage, Platform.storageAdapter) : null;
        this.shop = (typeof UpgradeShop !== 'undefined') ? UpgradeShop : null;
        this.squad = new Squad(this.world.scene, this.profile);
        this.squad._gameRef = this; // V11.5修复: 原惰性挂到首帧squad.update — 启动前读取武器/职业/科技乘区全部静默失效
        this.gates = new GateSystem(this.world.scene);
        this.enemies = new EnemyManager(this.world.scene, this.effects);
        this.combat = new CombatSystem(this.world.scene, this.effects);
        // V4.0: 节奏控制器 — 分批刷怪/场上上限/Boss预警(替代整波同帧生成)
        this.pacing = new GamePacingController(this);
        this.pacing.spawnFn = function(type, x, z, hp) {
            // Enemy health depends on the encounter, never on the player's upgrades.
            if (type !== 'boss' && !hp) {
                var refHp = (CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal).hp;
                // V8.0: 越界防御 — 乘数缺失时用末档而不是静默回退基础血量
                var hpMul = CONFIG.ENEMY_HP_MULTIPLIER[Math.min(self.levelIndex, CONFIG.ENEMY_HP_MULTIPLIER.length - 1)] || 1.7;
                hp = Math.round(refHp * hpMul);
            }
            // V4.0: Boss血量按出场时队伍战力动态缩放 — 任何策略/养成水平都面临~8-12s Boss战
            if (type === 'boss') {
                // V5.1.3: Boss血量 = 人数×DPS双因子(人数=防御/竞速生存, DPS=输出) —
                // V8.0.1: 恢复在重构中丢失的双因子公式: hp = clamp(count×totalDPS×0.5, 关卡值×0.5, 关卡值×12)
                // 战斗时长 ≈ 0.5×count/(0.8×volley) ≈ 9-12s, 与养成水平无关。
                var base = hp || CONFIG.ZOMBIE.boss.hp;
                var bossDps = self.squad.count * self.squad.getDamage() * self.squad.getFireRate();
                var dualFactor = Math.max(base * 0.5, Math.min(self.squad.count * bossDps * 0.5, base * 12));
                hp = Math.round(dualFactor);
            }
            if(type==='boss' && self.enemies.bossStyle==='twinelite') {
                self.enemies.spawnEnemy(type,-1.1,z,hp/2,'elite');
                return self.enemies.spawnEnemy(type,1.1,z,hp/2,'elite');
            }
            return self.enemies.spawnEnemy(type, x, z, hp);
        };
        this.pacing.aliveCountFn = function() { return self.enemies.encounterOutstanding; };
        this.pacing.gateReadyFn = function(w, squad) {
            return self.gates.isRowChosen(w.requiredGateZ) && squad.z <= w.requiredGateZ - 1.5;
        };
        this.pacing.onWaveStart = function(w) {
            self._waveNoticeT=CONFIG.PACING.firstContactGrace;
            var el=document.getElementById('v42-wave-banner');
            if(el){el.textContent='怪潮接近 · 准备射击';el.classList.remove('hidden');}
        };
        this.pacing.onWaveClear = function(w) {
            if (self.effects && self.state === 'playing') {
                self.effects.floatText(self.squad.x, 2.2, self.squad.z - 1.5, '波次清除!', '#66D68F', false);
            }
        };
        this.pacing.onBossWarning = function(w) { self._showBossWarning(true); };
        // V4.0 爽感: 乘法门慢动作+震屏 / Boss入场爆发
        this.gates.onMul = function(g) { self._slowmo(); self.world.shake(0.22); };
        this.pacing._onBossSpawnFx = function() { self.world.shake(0.5); };
        this.pacing.onBossSpawn = function(w) { self._showBossWarning(false); };
        // V3.4: 广告协调器(复活/双倍/刷门; Platform.ads已在页面引导装配)
        this.adCoord = (typeof GameAdCoordinator !== 'undefined' && window.__adService)
            ? new GameAdCoordinator(window.__adService, {
                pauseGame: function() { self.paused = true; },
                resumeGame: function() { self.paused = false; },
                onReviveReward: function(count, invSec) { self._applyRevive(count, invSec); },
                onDoubleReward: function() { self._onDoubleReward(); },
                onGatesRefresh: function() { self._onGatesRefreshed(); },
                canRefreshGates: function() { return self._hasRerollableGates(); }
            })
            : null;
        this._doubleTaken = false;

        this.state = 'idle'; // idle | playing | won | lost
        // V4.0: 慢动作(乘法门/Boss击杀) — dt缩放, UI与输入不受影响
        this._timeScale = 1;
        this._slowmoT = 0;
        this.levelIndex = 0;
        this.time = 0;
        this.lastTime = 0;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.paused = false;
        // 统计
        this.kills = 0;
        this.maxCount = 0;
        this.elapsedTime = 0;
        // V3.3: 连杀系统
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this._prevKillCount = 0;
        this._comboMilestone = 0;
        // 性能统计
        this._fpsEma = 0;
        this._frameTimes = [];
        // 属性变化追踪(触发动画)
        this._prevDamage = 1;
        this._prevFireRate = 2.2;
        // 人数气泡3D投影用临时向量
        this._badgeV = new THREE.Vector3();

        // 待机画面: V5.0 首页军团展示 — 12人士兵方阵行进姿态(原1人被面板遮挡)
        this._setupIdleShowcase();

        this._setupInput();
        this._setupUI();
        this._setupDebugPanel(); // V3.7: ?debug=1 显示运行时美术/性能面板
        V42Art.installUI(this);
        this._bindHomeButtons(); // V10 QA: 动态首页按钮绑定(依赖 installUI 创建的 DOM)
        if (typeof V60UI !== 'undefined') V60UI.install(this);

        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    /** V5.0: 首页待机军团展示 — 小方阵置于镜头中上部, 不被首页面板遮挡 */
    _setupIdleShowcase() {
        this.squad.reset(12);
        for (var i = 0; i < this.squad.soldiers.length; i++) {
            this.squad.soldiers[i].spawnT = 1;
        }
        this.squad.z = -13;
        this.squad.update(0.001, 0);
        this.world.updateRoadScroll(this.squad.z);
        this.world.updateCamera(0, this.squad.z, 0.016, 12);
        this._refreshBestRecord();
    }

    /** V5.0: 刷新首页最高纪录(防御性: 元素可能不存在) */
    _refreshBestRecord() {
        try { this._updateBestRecord(); } catch (e) {}
    }

    _setupInput() {
        var self = this;
        // V4.0: 连续拖动 → 目标位置(锚点相对映射, 无阈值跳道), 队伍经阻尼平滑跟随
        var dragAnchorPx = 0;
        var dragAnchorWX = 0;
        var dragging = false;

        function canvasWidth() { return self.canvas.clientWidth || window.innerWidth; }
        function onDown(x) {
            if (self.state !== 'playing' || self.paused) return;
            dragAnchorPx = x;
            dragAnchorWX = self.squad.targetX;
            dragging = true;
        }
        function onMove(x) {
            if (!dragging || self.state !== 'playing' || self.paused) return;
            self.squad.targetX = MovementMath.dragTarget(
                dragAnchorWX, x - dragAnchorPx, canvasWidth(),
                MovementMath.centerBounds(self.squad.getHalfWidth()));
        }
        function onUp() { dragging = false; }

        // 触摸
        this.canvas.addEventListener('touchstart', function(e) {
            e.preventDefault(); onDown(e.touches[0].clientX);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', function(e) {
            e.preventDefault(); onMove(e.touches[0].clientX);
        }, { passive: false });
        this.canvas.addEventListener('touchend', onUp);

        // 鼠标
        this.canvas.addEventListener('mousedown', function(e) { onDown(e.clientX); });
        window.addEventListener('mousemove', function(e) { onMove(e.clientX); });
        window.addEventListener('mouseup', onUp);

        // 键盘 (方向键/AD) — 连续位移(不吸附固定跑道)
        window.addEventListener('keydown', function(e) {
            if (self.state !== 'playing' || self.paused) return;
            var maxX = MovementMath.centerBounds(self.squad.getHalfWidth());
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                self.squad.targetX = MovementMath.keyTarget(self.squad.targetX, -1, maxX);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                self.squad.targetX = MovementMath.keyTarget(self.squad.targetX, 1, maxX);
            }
        });
    }

    _setupUI() {
        var self = this;
        this.ui = {
            hud: document.getElementById('hud'),
            levelName: document.getElementById('level-name'),
            levelBadge: document.getElementById('level-badge'),
            progressFill: document.getElementById('progress-bar-fill'),
            progressFlag: document.getElementById('progress-flag'),
            progressNodes: document.getElementById('progress-nodes'),
            countNum: document.getElementById('squad-count-num'),
            countBadge: document.getElementById('squad-count-badge'),
            statCount: document.getElementById('stat-count'),
            statDamage: document.getElementById('stat-damage'),
            statFirerate: document.getElementById('stat-firerate'),
            statRowCount: document.getElementById('stat-row-count'),
            statRowDamage: document.getElementById('stat-row-damage'),
            statRowFirerate: document.getElementById('stat-row-firerate'),
            bossBar: document.getElementById('boss-bar-container'),
            bossFill: document.getElementById('boss-bar-fill'),
            startScreen: document.getElementById('start-screen'),
            winScreen: document.getElementById('win-screen'),
            loseScreen: document.getElementById('lose-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            winCount: document.getElementById('win-count'),
            winKills: document.getElementById('win-kills'),
            winMax: document.getElementById('win-max'),
            winTime: document.getElementById('win-time'),
            winCombo: document.getElementById('win-combo'),
            loseKills: document.getElementById('lose-kills'),
            loseMax: document.getElementById('lose-max'),
            loseCombo: document.getElementById('lose-combo'),
            loseReason: document.getElementById('lose-reason'),
            comboBox: document.getElementById('combo-box'),
            comboNum: document.getElementById('combo-num'),
            levelSelect: document.getElementById('level-select'),
            btnNextLevel: document.getElementById('btn-next-level'),
            // V3.4: 广告入口
            btnRevive: document.getElementById('btn-revive'),
            btnDouble: document.getElementById('btn-double-reward'),
            btnRefreshGates: document.getElementById('btn-refresh-gates'),
            rgCount: document.getElementById('rg-count'),
            btnSound: document.getElementById('btn-sound-toggle'),
            // V5.0: 首页元素
            homeSound: document.getElementById('btn-home-sound'),
            bestRecord: document.getElementById('v42-best-record')
        };

        // 进度节点数据(从关卡segments动态生成)
        this.progressNodes = [];

        // 按钮事件绑定(防御性: 元素可能不存在于测试页面)
        var btnStart = document.getElementById('btn-start');
        if (btnStart) btnStart.addEventListener('click', function() { self._sfx('click'); self.start(); });
        var btnRestartWin = document.getElementById('btn-restart-win');
        if (btnRestartWin) btnRestartWin.addEventListener('click', function() { self._sfx('click'); self.start(); });
        var btnRestartLose = document.getElementById('btn-restart-lose');
        if (btnRestartLose) btnRestartLose.addEventListener('click', function() { self._sfx('click'); self.start(); });
        // V5.0: 失败页返回首页入口(任务书9.5)
        var btnLoseMenu = document.getElementById('btn-lose-menu');
        if (btnLoseMenu) btnLoseMenu.addEventListener('click', function() { self._sfx('click'); self._backToMenu(); });
        var btnPause = document.getElementById('btn-pause');
        if (btnPause) btnPause.addEventListener('click', function() { self._sfx('click'); self._togglePause(); });
        var btnRevive = document.getElementById('btn-revive');
        if (btnRevive) btnRevive.addEventListener('click', function() { self._revive(); });
        // V3.4: 双倍结算 / 刷门 / 音效开关
        if (this.ui.btnDouble) this.ui.btnDouble.addEventListener('click', function() { self._doubleRewardViaAd(); });
        if (this.ui.btnRefreshGates) this.ui.btnRefreshGates.addEventListener('click', function() { self._refreshGatesViaAd(); });
        if (this.ui.btnSound) this.ui.btnSound.addEventListener('click', function() { self._toggleSound(); });
        // V5.0: 首页音效开关/免费补给/升级商店按钮由 V42Art.installUI 动态创建,
        // 必须在 installUI 之后绑定(此前在此处绑定时元素尚不存在, 监听从未挂上 → 死按钮)
        // V5.1.4: 胜利页商店入口(静态元素, 此处可绑)
        var btnShopWin = document.getElementById('btn-open-shop-win');
        if (btnShopWin) btnShopWin.addEventListener('click', function() { self._sfx('click'); self._openShop(); });
        // V5.1: 商店UI装配
        this._setupShopUI();
        this._refreshCoinDisplays();
        // V3.3: 下一关按钮
        if (this.ui.btnNextLevel) {
            this.ui.btnNextLevel.addEventListener('click', function() {
                if (self.levelIndex + 1 < LEVELS.length) {
                    self._sfx('click');
                    self.levelIndex++;
                    self.start();
                }
            });
        }
        // 暂停菜单按钮
        var btnResume = document.getElementById('btn-resume');
        if (btnResume) btnResume.addEventListener('click', function() { self._sfx('click'); self._togglePause(); });
        var btnPauseRestart = document.getElementById('btn-pause-restart');
        if (btnPauseRestart) btnPauseRestart.addEventListener('click', function() {
            self._sfx('click');
            if (self.ui.pauseScreen) self.ui.pauseScreen.classList.add('hidden');
            self.paused = false;
            self.start();
        });
        var btnPauseMenu = document.getElementById('btn-pause-menu');
        if (btnPauseMenu) btnPauseMenu.addEventListener('click', function() { self._sfx('click'); self._backToMenu(); });

        // V3.3: 生成关卡选择按钮
        if (this.ui.levelSelect) {
            for (var i = 0; i < LEVELS.length; i++) {
                var b = document.createElement('button');
                b.textContent = String(i + 1);
                this.ui.levelSelect.appendChild(b);
            }
        }
        this._refreshLevelSelect();
    }

    /** 构建进度条节点(基于关卡segments) */
    _buildProgressNodes(level) {
        if (!this.ui.progressNodes) return;
        this.ui.progressNodes.innerHTML = '';
        this.progressNodes = [];
        for (var i = 0; i < level.segments.length; i++) {
            var seg = level.segments[i];
            if(seg.type!=='boss' && (seg.type!=='wave' || level.segments.filter((s,index)=>index<=i&&s.type==='wave').length%2===0))continue;
            var nodePos = clamp(seg.z / level.totalZ, 0, 1) * 100;
            var el = document.createElement('div');
            el.className = 'pnode';
            if (seg.type === 'boss') el.classList.add('boss-node');
            el.style.left = nodePos + '%';
            this.ui.progressNodes.appendChild(el);
            this.progressNodes.push({ z: seg.z, el: el, type: seg.type });
        }
    }

    /** 更新进度节点状态(基于小队当前位置) */
    _updateProgressNodes() {
        for (var i = 0; i < this.progressNodes.length; i++) {
            var n = this.progressNodes[i];
            if (!n.el) continue;
            // 已通过的节点: 小队z已越过节点z(更负)
            if (this.squad.z < n.z - 2) {
                n.el.className = n.type === 'boss' ? 'pnode boss-node done' : 'pnode done';
            }
            // 当前节点: 小队接近节点
            else if (Math.abs(this.squad.z - n.z) < 8) {
                n.el.className = n.type === 'boss' ? 'pnode boss-node current' : 'pnode current';
            }
            // 未到达
            else {
                n.el.className = n.type === 'boss' ? 'pnode boss-node' : 'pnode';
            }
        }
    }

    _togglePause() {
        if (this.state !== 'playing') return;
        this.paused = !this.paused;
        if (this.paused) {
            if (this.ui.pauseScreen) this.ui.pauseScreen.classList.remove('hidden');
        } else {
            if (this.ui.pauseScreen) this.ui.pauseScreen.classList.add('hidden');
        }
    }

    /** V6.0: 能源核心生成与清理 */
    _setupEnergyCore(level) {
        if (this.energyCore) { this.energyCore.destroy(this.world.scene); this.energyCore = null; }
        var seg = null;
        for (var i = 0; i < level.segments.length; i++) {
            if (level.segments[i].type === 'energy') { seg = level.segments[i]; break; }
        }
        if (!seg || typeof EnergyCore === 'undefined') return;
        this.energyCore = new EnergyCore(this.world.scene, 0, seg.z, seg.core || {}, this);
    }

    /** V6.0: 能源核心击破回调 */
    onCoreDestroyed() {
        if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z, '僵尸失去强化!', '#66FFB3', true);
    }

    /** V5.0: 统一音效入口(自动初始化 + 平台/静音守卫) */
    _sfx(type) {
        if (typeof Platform === 'undefined' || !Platform.audio) return;
        Platform.audio.play(type);
    }

    /** V4.0: Boss出场预警横幅(震动+音效, 预警结束由onBossSpawn隐藏) */
    /** V4.0: 短暂慢动作(0.35s, 时间流速0.35), 不打断操作 */
    _slowmo() {
        this._timeScale = 0.35;
        this._slowmoT = 0.35;
    }

    _showBossWarning(show) {
        var el = document.getElementById('boss-warning');
        if (!el) return;
        if (show) {
            el.classList.remove('hidden');
            // 强制重启动画
            void el.offsetWidth;
            el.classList.add('warning-anim');
            if (typeof Platform !== 'undefined' && Platform.audio) {
                Platform.audio.init();
                Platform.audio.play('bossWarn');
            }
        } else {
            el.classList.add('hidden');
            el.classList.remove('warning-anim');
        }
    }

    _backToMenu() {
        this.paused = false;
        this.state = 'idle';
        if (this.ui.pauseScreen) this.ui.pauseScreen.classList.add('hidden');
        if (this.ui.winScreen) this.ui.winScreen.classList.add('hidden');
        if (this.ui.loseScreen) this.ui.loseScreen.classList.add('hidden');
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        if (this.ui.startScreen) this.ui.startScreen.classList.remove('hidden');
        // V5.0: 恢复首页待机军团展示
        this._setupIdleShowcase();
        // V10 QA修复: 返回主页时销毁能源核心(原滞留场景)
        if (this.energyCore) { this.energyCore.destroy(this.world.scene); this.energyCore = null; }
        this.gates.clear();
        this.enemies.clear();
        this.pacing.clear();
        var ws = document.getElementById('win-stars'); if (ws) ws.classList.add('hidden');
            this._showBossWarning(false);
        this.combat.clear();
        this.effects.clear();
        // V3.3: 刷新关卡选择解锁状态
        this._refreshLevelSelect();
    }

    _revive() {
        // V3.4: 复活必须通过激励视频(每局最多1次, 平台确认完整观看才发奖)
        if (!this.adCoord || !this.adCoord.canRevive()) {
            // 无广告环境/次数用尽: 按钮已隐藏, 此处兜底不复活
            return;
        }
        var maxBefore = Math.max(this.maxCount, 10);
        this.adCoord.requestRevive(maxBefore).then(function(granted) {
            if (!granted) {
                // 提前关闭/展示失败: 保持失败界面, 用户可重试或重新挑战
            }
        });
    }

    /** 实际复活执行(由广告协调器发奖回调) */
    _applyRevive(count, invSec) {
        this.state = 'playing';
        this.squad.alive = true;
        this.squad.setCount(count);
        this.squad.invulnT = invSec || 2.0;
        // V8.0: 挑战模式复活 — 重新开启计分(基准重置, 只计复活后的增量)
        if (this._challenge) {
            this._challenge._scored = false;
            this._challenge._bossStart = this.enemies.bossKills || 0;
        }
        if (this.ui.loseScreen) this.ui.loseScreen.classList.add('hidden');
        if (this.ui.hud) this.ui.hud.classList.remove('hidden');
        // 复活反馈
        if (this.effects) {
            this.effects.floatText(this.squad.x, 2.2, this.squad.z, '复活!', '#75DFFF', true);
            this.effects.shockwave(this.squad.x, 0.05, this.squad.z, 0x75DFFF);
        }
    }

    /** V3.4: 双倍结算(胜利界面按钮 → 激励视频) */
    _doubleRewardViaAd() {
        if (!this.adCoord || this._doubleTaken) return;
        var self = this;
        this.adCoord.requestDoubleReward().then(function(granted) {
            if (!granted && self.state === 'won') {
                // 提前关闭: 按钮恢复可点, 用户可重试
                if (self.ui.btnDouble) self.ui.btnDouble.disabled = false;
            }
        });
    }

    /** 双倍奖励发放回调(V5.1: 对本次结算的关卡奖励补发一次, 幂等) */
    _onDoubleReward() {
        this._doubleTaken = true;
        if (this._settlement && this._settlement.levelReward > 0 && !this._doubleApplied) {
            this._doubleApplied = true;
            this._settlement.doubled = true;
            this._settlement.total += this._settlement.levelReward;
            if (this.profile) this.profile.addCoins(this._settlement.levelReward);
        }
        if (this.ui.btnDouble) {
            this.ui.btnDouble.textContent = '✓ 已领取双倍';
            this.ui.btnDouble.disabled = true;
        }
        this._fillSettlementUI();
        if (this.effects) {
            this.effects.floatText(this.squad.x, 2.0, this.squad.z, '奖励×2!', '#FFC247', true);
        }
    }

    /** V5.1: 结算面板金币明细(金币飞入动画在CSS) */
    _fillSettlementUI() {
        var box = document.getElementById('win-coins');
        var st = this._settlement;
        if (box && st) {
            document.getElementById('wc-level').textContent = '+' + st.levelReward;
            document.getElementById('wc-kills').textContent = '+' + st.killReward;
            var dbl = document.getElementById('wc-double-row');
            if (dbl) dbl.classList.toggle('hidden', !st.doubled);
            if (st.doubled) document.getElementById('wc-double').textContent = '+' + st.levelReward;
            document.getElementById('wc-total').textContent = st.total;
            box.classList.remove('hidden');
            box.classList.remove('coin-in'); void box.offsetWidth; box.classList.add('coin-in');
        }
        var loseBox = document.getElementById('lose-coins');
        if (loseBox && st && this.state === 'lost') {
            document.getElementById('lc-kills-coin').textContent = '+' + st.killReward;
            var xpEl = document.getElementById('lc-xp');
            if (xpEl) xpEl.textContent = '+' + (this.enemies.killCount * ((typeof XP_RULES !== 'undefined' && XP_RULES.perKill) || 1)); // V10 QA修复: 与实际入账公式一致
            loseBox.classList.remove('hidden');
        }
        // VNext: 装备掉落展示(胜利/失败面板共用逻辑)
        this._renderSettlementDrops('win-coins', 'wc-drops-row', '📦 装备掉落');
        this._renderSettlementDrops('lose-coins', 'lc-drops-row', '📦 掉落');
        this._refreshCoinDisplays();
    }

    /** VNext: 结算面板掉落行(动态注入, 无掉落显示"无") */
    _renderSettlementDrops(boxId, rowId, label) {
        var box = document.getElementById(boxId);
        if (!box) return;
        var row = document.getElementById(rowId);
        if (!row) {
            row = document.createElement('div');
            row.id = rowId;
            row.className = 'wc-row';
            var total = box.querySelector('.wc-total') || box.lastElementChild;
            if (total) box.insertBefore(row, total); else box.appendChild(row);
        }
        var drops = this._drops || [];
        row.innerHTML = '<span>' + label + '</span><b>' +
            (drops.length ? drops.map(function(d) { return d.name; }).join('、') : '无') + '</b>';
    }

    /** V5.1: 每日免费补给(首页按钮 → 激励视频 → 下局生效) */
    _freeSupplyViaAd() {
        if (!this.adCoord || !this.adCoord.canShowAds() || !this.profile) return;
        var d = new Date();
        var key = 'supply:' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
        if (this.profile.hasClaimed(key)) { this._showSupplyTip('今日已领取补给, 明天再来!'); return; }
        var self = this;
        this.adCoord.requestFreeSupply().then(function(granted) {
            if (!granted) return;
            if (!self.profile.claimReward(key, 0)) return; // 幂等(防并发)
            var kinds = ['people', 'damage', 'firerate'];
            var kind = kinds[Math.floor(Math.random() * kinds.length)];
            self.profile.data.pendingSupply = kind;
            self.profile.save();
            var names = { people: '+15 补给兵(下局生效)', damage: '输出+2(下局生效)', firerate: '射速+20%(下局生效)' };
            self._showSupplyTip('🎁 ' + (names[kind] || '补给!'));
            self._refreshCoinDisplays();
        });
    }

    _showSupplyTip(text) {
        var tip = document.getElementById('supply-tip');
        if (!tip) return;
        tip.textContent = text;
        tip.classList.remove('hidden');
        clearTimeout(this._supplyTipT);
        this._supplyTipT = setTimeout(function() { tip.classList.add('hidden'); }, 2600);
    }

    /** V10 QA: 首页动态按钮绑定(V42Art.installUI 创建的元素, 原绑定时机过早成死按钮) */
    _bindHomeButtons() {
        var self = this;
        var btnOpen = document.getElementById('btn-open-shop');
        if (btnOpen) btnOpen.addEventListener('click', function() { self._sfx('click'); self._openShop(); });
        var btnSupply = document.getElementById('btn-free-supply');
        if (btnSupply) btnSupply.addEventListener('click', function() { self._sfx('click'); self._freeSupplyViaAd(); });
        var homeSound = document.getElementById('btn-home-sound');
        if (homeSound) {
            this.ui.homeSound = homeSound;
            homeSound.addEventListener('click', function() { self._toggleSound(); });
        }
        // 免费补给今日已领标签(原在 _setupUI 中查询时元素尚不存在)
        if (this.profile) {
            var d = new Date();
            var key = 'supply:' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
            if (btnSupply && this.profile.hasClaimed(key)) btnSupply.classList.add('claimed');
        }
    }

    /** V5.1: 升级商店UI(渲染/购买/刷新) */
    _setupShopUI() {
        var self = this;
        this.ui.shopCoins = document.getElementById('shop-coins-num');
        var listEl = document.getElementById('shop-list');
        var btnClose = document.getElementById('btn-close-shop');
        if (btnClose) btnClose.addEventListener('click', function() { self._sfx('click'); self._closeShop(); });
        this._shopRows = {};
        if (listEl) {
            Object.keys(UPGRADE_DEFS).forEach(function(id) {
                var def = UPGRADE_DEFS[id];
                var row = document.createElement('div');
                row.className = 'shop-row';
                row.innerHTML =
                    '<div class="shop-icon">' + def.icon + '</div>' +
                    '<div class="shop-info"><div class="shop-name">' + def.name + '</div>' +
                    '<div class="shop-desc">' + def.desc + '</div>' +
                    '<div class="shop-effect" id="shop-effect-' + id + '"></div></div>' +
                    '<button class="shop-buy" id="shop-buy-' + id + '"></button>';
                listEl.appendChild(row);
                self._shopRows[id] = row;
                row.querySelector('.shop-buy').addEventListener('click', function() { self._buyUpgrade(id); });
            });
        }
        this._refreshShop();
    }

    _openShop() {
        var el = document.getElementById('shop-screen');
        if (el) {
            el.classList.remove('hidden');
            this._refreshShop();
        }
    }

    _closeShop() {
        var el = document.getElementById('shop-screen');
        if (el) el.classList.add('hidden');
        this._refreshLevelSelect(); // 解锁状态可能因属性变化展示不同
    }

    _refreshShop() {
        if (!this.profile || !this._shopRows) return;
        var self = this;
        Object.keys(UPGRADE_DEFS).forEach(function(id) {
            var lv = UpgradeShop.levelOf(self.profile, id);
            var price = UpgradeShop.priceOf(id, lv);
            var row = self._shopRows[id];
            if (!row) return;
            row.querySelector('.shop-effect').textContent = UPGRADE_DEFS[id].effect(lv) +
                (price !== null ? '' : ' · 已满级');
            var btn = row.querySelector('.shop-buy');
            if (price === null) {
                btn.textContent = 'MAX';
                btn.disabled = true;
                btn.classList.add('maxed');
            } else {
                btn.innerHTML = '🪙 ' + price;
                btn.disabled = self.profile.coins < price;
                btn.classList.toggle('affordable', self.profile.coins >= price);
            }
        });
        if (this.ui.shopCoins) this.ui.shopCoins.textContent = this.profile.coins;
    }

    _buyUpgrade(id) {
        var res = UpgradeShop.purchase(this.profile, id);
        if (res.ok) {
            this._sfx('gate');
            this._refreshShop();
            this._refreshCoinDisplays();
            this._showSupplyTip('✅ ' + UPGRADE_DEFS[id].name + ' Lv.' + res.level);
        } else if (res.reason === 'insufficient') {
            this._sfx('hit');
            this._showSupplyTip('🪙 金币不足, 需要 ' + res.need);
        } else {
            this._showSupplyTip('已达到最高等级');
        }
    }

    /** V5.1: 刷新所有金币显示(首页/商店/结算) */
    _refreshCoinDisplays() {
        var coins = this.profile ? this.profile.coins : 0;
        var els = document.querySelectorAll('[data-coin-display]');
        for (var i = 0; i < els.length; i++) {
            // V10.1: 数值变化时触发脉冲动画(视觉反馈)
            var el = els[i];
            if (el.textContent !== String(coins)) {
                el.textContent = coins;
                var pill = el.closest('.v51-coin-pill, .shop-coins, .v42-best-record');
                if (pill) {
                    pill.classList.remove('coin-pulse');
                    void pill.offsetWidth;
                    pill.classList.add('coin-pulse');
                }
            }
        }
        if (this.ui && this.ui.shopCoins) this.ui.shopCoins.textContent = coins;
    }

    /** V5.1: 消耗免费补给(广告每日奖励 → 本局生效) */
    _consumePendingSupply() {
        if (!this.profile || !this.profile.data.pendingSupply) return;
        var kind = this.profile.data.pendingSupply;
        this.profile.data.pendingSupply = null;
        this.profile.save();
        if (kind === 'people') this.squad.setCount(this.squad.count + 15);
        else if (kind === 'damage') this.squad.damageBuff = Math.min(99, this.squad.damageBuff + 2);
        else if (kind === 'firerate') this.squad.fireRateBuff = Math.min(0.5, this.squad.fireRateBuff + 0.2);
        if (this.effects) {
            var names = { people: '+15 补给兵!', damage: '补给: 输出+2!', firerate: '补给: 射速+20%!' };
            this.effects.floatText(this.squad.x, 2.0, this.squad.z, names[kind] || '补给!', '#75DFFF', true);
        }
    }

    /** V3.4: 广告刷门(HUD按钮 → 激励视频) */
    _refreshGatesViaAd() {
        if (!this.adCoord || !this.adCoord.canRefreshGates() || !this._hasRerollableGates()) return;
        this.adCoord.requestGateRefresh().then(function(granted) { /* 发奖回调 _onGatesRefreshed */ });
    }

    /** 当前是否有"前方未触发且可重随"的门 */
    _hasRerollableGates() {
        if (!this.gates || this.state !== 'playing') return false;
        for (var i = 0; i < this.gates.gates.length; i++) {
            var g = this.gates.gates[i];
            if (!g.triggered && g.z < this.squad.z) return true;
        }
        return false;
    }

    /** 刷门发奖回调: 重随前方门 */
    _onGatesRefreshed() {
        if (!this.gates) return;
        var n = this.gates.refreshAhead(this.squad.z);
        if (n > 0 && this.effects) {
            this.effects.floatText(this.squad.x, 2.4, this.squad.z, '状态门刷新!', '#A14DFF', true);
            this.effects.shockwave(this.squad.x, 0.05, this.squad.z, 0xA14DFF);
        }
        this._updateAdButtons();
    }

    /** V3.4: 音效开关(暂停菜单) */
    _toggleSound() {
        if (typeof Platform === 'undefined') return;
        Platform.audio.init(); // 用户手势触发初始化
        var muted = !Platform.audio.isMuted();
        Platform.audio.setMuted(muted);
        this._updateSoundLabel();
        Platform.audio.play('click');
    }

    _updateSoundLabel() {
        if (typeof Platform === 'undefined') return;
        var muted = Platform.audio.isMuted();
        if (this.ui.btnSound) this.ui.btnSound.textContent = muted ? '🔇 音效: 关' : '🔊 音效: 开';
        // V5.0: 首页音效图标同步
        if (this.ui.homeSound) this.ui.homeSound.textContent = muted ? '🔇' : '🔊';
    }

    /** V5.0: 刷新首页最高纪录展示(读取关卡解锁进度) */
    _updateBestRecord() {
        if (!this.ui.bestRecord) return;
        var unlocked = this._loadProgress();
        this.ui.bestRecord.textContent = '🏆 最高纪录: 第' + unlocked + '关';
    }

    /** V3.4: 广告入口按钮可见性(随状态/次数刷新) */
    _updateAdButtons() {
        var coord = this.adCoord;
        // 复活按钮: 失败界面 && 尚有次数
        if (this.ui.btnRevive) {
            var canRevive = !!(coord && coord.canRevive());
            this.ui.btnRevive.classList.toggle('hidden', !canRevive);
        }
        // 双倍按钮: 胜利界面 && 尚有次数 && 未领取
        if (this.ui.btnDouble) {
            var canDouble = !!(coord && coord.canDoubleReward()) && !this._doubleTaken;
            this.ui.btnDouble.classList.toggle('hidden', !canDouble);
            if (canDouble) { this.ui.btnDouble.textContent = '📺 双倍奖励'; this.ui.btnDouble.disabled = false; }
        }
        // 刷门按钮: 战斗中 && 尚有次数 && 有可刷的门
        if (this.ui.btnRefreshGates) {
            var canRefresh = !!(coord && coord.canRefreshGates()) && this._hasRerollableGates();
            this.ui.btnRefreshGates.classList.toggle('hidden', !canRefresh);
            if (coord && this.ui.rgCount) this.ui.rgCount.textContent = coord.getGateRefreshLeft();
        }
    }

    _showError(msg) {
        var div = document.getElementById('error-display');
        if (!div) {
            div = document.createElement('div');
            div.id = 'error-display';
            div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC0000;color:#fff;padding:10px 14px;font-size:13px;font-family:monospace;white-space:pre-wrap;pointer-events:none;';
            document.body.appendChild(div);
        }
        div.textContent = msg;
        console.error(msg);
    }

    /** 性能报告: FPS/P95帧耗时/DrawCall/三角形 (V3.6测试用) */
    getPerf() {
        var ft = (this._frameTimes || []).slice().sort(function(a, b) { return a - b; });
        var p95 = ft.length ? ft[Math.floor(ft.length * 0.95)] : 0;
        var r = this.world.renderer.info;
        return {
            fps: Math.round(this._fpsEma),
            workMs: +(this._workMs || 0).toFixed(2),
            p95FrameMs: +p95.toFixed(2),
            drawCalls: r.render.calls,
            triangles: r.render.triangles,
            geometries: r.memory.geometries,
            textures: r.memory.textures,
            squadCount: this.squad.count,
            enemyCount: this.enemies.enemies.length,
            quality: this.world.quality
        };
    }

    /** V3.7 运行时美术资源追踪报告: 证明实际渲染场景使用的模型/材质/纹理来源 */
    artReport() {
        var self = this;
        var provenance = {};   // artSource标签 -> {objects, meshes}
        var untaggedMeshes = 0;
        var sceneObjs = 0;
        this.world.scene.traverse(function(node) {
            sceneObjs++;
            var src = node.userData && node.userData.artSource;
            if (node.isMesh || node.isSprite || node.isInstancedMesh) {
                if (src) {
                    if (!provenance[src]) provenance[src] = { objects: 0, visible: 0 };
                    provenance[src].objects++;
                    if (node.visible) provenance[src].visible++;
                } else if (node.parent && !(node.parent.userData && node.parent.userData.artSource)) {
                    untaggedMeshes++;
                }
            }
        });
        // 归组: 带标签的Group/InstancedMesh自身记1, 其子mesh跟随标签(上面parent逻辑会跳过计数, 但要并入)
        // 简化: 重新遍历, 子对象继承最近祖先标签; Sprite继承共享材质标签
        var grouped = {};
        this.world.scene.traverse(function(node) {
            var src = null;
            var n = node;
            while (n) {
                if (n.userData && n.userData.artSource) { src = n.userData.artSource; break; }
                n = n.parent;
            }
            if (!src && node.material && node.material.userData && node.material.userData.artSource) {
                src = node.material.userData.artSource;
            }
            if (!src) return;
            if (!node.visible) return; // 隐藏对象(如粒子池)不计入实际渲染
            if (!grouped[src]) grouped[src] = { objects: 0, visible: 0 };
            grouped[src].objects++;
            grouped[src].visible++;
        });

        // 外部资产加载状态
        var assetStatus = [];
        var imgs = document.images;
        for (var i = 0; i < imgs.length; i++) {
            assetStatus.push({
                src: imgs[i].src.split('/').slice(-2).join('/'),
                status: imgs[i].complete && imgs[i].naturalWidth > 0 ? 'LOADED' : 'FAILED',
                used: 'UI/' + (imgs[i].alt || 'img')
            });
        }
        var bulletTexLoaded = !!(this.combat && this.combat._bulletTex);
        assetStatus.push({
            src: 'assets/art-v1/effects/bullet-glow.svg',
            status: bulletTexLoaded ? 'LOADED' : (this.combat && this.combat._bulletMat && this.combat._bulletMat.map ? 'FALLBACK(程序化兜底)' : 'LOADING'),
            used: '弹道Sprite纹理'
        });

        var perf = this.getPerf();
        return {
            timestamp: new Date().toISOString(),
            sceneObjects: sceneObjs,
            provenance: grouped,
            untaggedRenderables: untaggedMeshes,
            assets: assetStatus,
            perf: perf,
            camera: {
                pos: this.world.camera.position.toArray().map(function(x) { return +x.toFixed(2); }),
                fov: this.world.camera.fov
            },
            modelPolicy: 'V4.1: assets/models/soldier/soldier.glb + soldier-lod.glb / embedded PBR atlas / rigid-part instancing',
            soldierModel: { status: SoldierModelLoader.status, loadMs: SoldierModelLoader.loadMs }
        };
    }

    /** V3.7 调试面板(?debug=1): FPS/DrawCall/模型来源 实时显示 */
    _setupDebugPanel() {
        if (location.search.indexOf('debug') === -1) return;
        var self = this;
        var div = document.createElement('div');
        div.id = 'art-debug-panel';
        div.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99998;background:rgba(10,20,40,0.82);color:#7FE0FF;font:11px/1.5 monospace;padding:8px 10px;border-radius:8px;pointer-events:none;white-space:pre;max-width:46vw;';
        document.body.appendChild(div);
        this._debugPanel = div;
        this._debugPanelIv = setInterval(function() {
            if (!self._debugPanel) { clearInterval(self._debugPanelIv); return; } // V10 QA: 面板移除后停止轮询
            var p = self.getPerf();
            var src = [
                '士兵: GLB / PBR / 分部件实例化 / ' + (self.squad.count > 100 ? 'LOD' : '完整模型'),
                '僵尸: ' + (self.enemies.enemies.length ? (self.enemies.enemies[0].model.userData.artSource || '?') : '场景无僵尸'),
                'Boss: ' + (self.enemies.boss ? (self.enemies.boss.model.userData.artSource || '?') : '未出现')
            ].join('\n');
            self._debugPanel.textContent =
                'FPS ' + p.fps + ' | work ' + p.workMs + 'ms | DC ' + p.drawCalls + ' | Tri ' + (p.triangles / 1000).toFixed(0) + 'k\n' +
                '兵 ' + p.squadCount + ' | 敌 ' + p.enemyCount + ' | 画质 ' + p.quality + '\n' + src;
        }, 500);
    }

    start() {
        try {
            var level = LEVELS[this.levelIndex];
            // V5.1: 永久升级应用 — 初始人数 = 关卡基础 + 新兵招募等级; 穿透初始等级
            var startCount = this.shop ? this.shop.startCount(this.profile, level.startCount) : level.startCount;
            this.squad.reset(Math.min(startCount, CONFIG.SQUAD_MAX_COUNT));
            if (this.shop && this.profile) {
                this.squad.pierce = Math.min(3, this.shop.pierceBonus(this.profile));
            }
            // V8.0: 武器+科技战斗属性
            this._weaponStats = (typeof WeaponSystem !== 'undefined' && this.profile) ? WeaponSystem.stats(this.profile) : {};
            this._techStats = (typeof TechTree !== 'undefined' && this.profile) ? TechTree.combatStats(this.profile) : {};
            if (this._techStats.startBonus) this.squad.setCount(this.squad.count + this._techStats.startBonus);
            // V10 QA: 科技"战术储备"开局金币接线(每关一次幂等发放, 防重开刷币)
            if (this._techStats.startCoins && this.profile) {
                this.profile.claimReward('startcoins:L' + this.levelIndex, this._techStats.startCoins);
            }
            if (this._techStats.pierceBonus) this.squad.pierce = Math.min(3, this.squad.pierce + this._techStats.pierceBonus);
            if (this._techStats.critBonus) this.squad.critChance = Math.min(0.5, this.squad.critChance + this._techStats.critBonus);
            if (this._techStats.explosive) this.squad.explosive = Math.max(this.squad.explosive, 1); // 爆炸弹头科技
            // V8.0.1: 武器特化效果接线(修复: 武器特殊属性此前未进入战斗)
            var ws = this._weaponStats || {};
            if (ws.pierceBonus) this.squad.pierce = Math.min(5, this.squad.pierce + ws.pierceBonus);
            if (ws.chain) this.squad.chain = Math.max(this.squad.chain, ws.chain);
            if (ws.slowMul) this.squad.freezeStacks = Math.max(this.squad.freezeStacks, Math.round((1 - ws.slowMul) * 10));
            if (ws.radius) this.squad.explosive = Math.max(this.squad.explosive, Math.round(ws.radius * 2));
            if (ws.critBonus) this.squad.critChance = Math.min(0.8, this.squad.critChance + ws.critBonus);
            // V10.1: 武器特殊属性接线(修复: pellets/burn/dualLane 此前定义后无消费者)
            this.squad._wpnPellets = ws.pellets || 1;   // 散弹枪: 每次射击多发弹丸扇形铺散
            this.squad._wpnBurn = !!ws.burn;            // 地狱火箭: 命中附加燃烧DoT
            this.squad._wpnDualLane = !!ws.dualLane;    // 风暴机枪: 平行双弹道
            // V8.0: 士兵成长属性(等级+装备)
            if (typeof SoldierGrowth !== 'undefined' && this.profile) {
                var solStats = SoldierGrowth.stats(this.profile);
                if (solStats.dmgBonus) this.squad.damageBuff = Math.min(99, this.squad.damageBuff + solStats.dmgBonus);
                if (solStats.critBonus) this.squad.critChance = Math.min(0.8, this.squad.critChance + solStats.critBonus);
                this._soldierStats = solStats;
            }
            // VNext: 职业系统 — 属性乘区+被动+技能循环
            if (typeof SoldierClass !== 'undefined' && this.profile) {
                this._classStats = SoldierClass.combat(this.profile);
                var cs = this._classStats;
                if (cs.critBonus) this.squad.critChance = Math.min(0.8, this.squad.critChance + cs.critBonus);
                if (cs.pierce) this.squad.pierce = Math.min(5, this.squad.pierce + cs.pierce);
                this.squad._classBulletSpeed = cs.bulletSpeed;
                if (cs.eliteDmgMul && cs.eliteDmgMul !== 1) this.squad._classEliteMul = cs.eliteDmgMul;
                else this.squad._classEliteMul = 0;
                // 总减伤 = 科技 + 职业 + 士兵成长/装备 (killSoldiers 消费, 上限60%)
                this.squad._totalDr = Math.min(0.6, (this._techStats.drBonus || 0) + (cs.dr || 0) + ((this._soldierStats && this._soldierStats.drBonus) || 0));
            } else {
                this._classStats = null;
                this.squad._totalDr = Math.min(0.6, this._techStats.drBonus || 0);
            }
            // V6.0: 关卡主题(末日核心等) + 能源核心生成
            if (this.world.applyTheme) this.world.applyTheme(level.theme);
            this._setupEnergyCore(level);
            this.gates.loadFromLevel(level);
            this.enemies.loadFromLevel(level, this.levelIndex);
            this.enemies.bossStyle=level.bossStyle;
            // V6.0: 波次计划加载(L1-L5吃boost, L6手授终稿)
            this.pacing.loadFromLevel(level, this.levelIndex, this.levelIndex < 5);
            this.gates.resolveSkillGates(this.squad); // V6.0: 技能门roll(需squad._skills已重置)
            this.gates.syncVisibility(this.pacing, 0, this.squad.z);
            this._showBossWarning(false);
            this.combat.clear();
            this.effects.clear();
            // V3.4: 每局重置广告次数 + 音频手势初始化
            if (this.adCoord) this.adCoord.startRun();
            this._doubleTaken = false;
            // V5.1: 消耗免费补给(首页广告获得, 本局生效)
            this._consumePendingSupply();
            if (typeof Platform !== 'undefined') Platform.audio.init();

            this.state = 'playing';
            this.paused = false;
            this.time = 0;
            this.elapsedTime = 0;
            this._waveNoticeT=0;
            var notice=document.getElementById('v42-wave-banner');if(notice)notice.classList.add('hidden');
            this.kills = 0;
            this.maxCount = level.startCount;
            this.bossSpawned = false;
            this.bossDefeated = false;
            // V3.3: 重置连杀
            this.combo = 0;
            this.comboTimer = 0;
            this.maxCombo = 0;
            this._prevKillCount = 0;
            this._comboMilestone = 0;
            if (this.ui.comboBox) this.ui.comboBox.classList.add('hidden');
            this._prevDamage = this.squad.getDamage();
            this._prevFireRate = this.squad.getFireRate();
            // V10.1: HUD脏检查缓存复位(新一局强制全量刷新)
            this._cachedBossActive = undefined; this._cachedProgress = undefined;
            this._cachedBadgeX = undefined; this._cachedBadgeY = undefined; this._cachedBadgeShown = undefined;
            this._cachedComboShown = undefined; this._cachedCombo = undefined; this._cachedComboHot = undefined;
            this._cachedStatCount = undefined; this._cachedStatDamage = undefined; this._cachedStatFr = undefined;
            this._cachedCountNum = undefined;
            for (var pn = 0; pn < this.progressNodes.length; pn++) this.progressNodes[pn]._lastCls = undefined;
            this._adBtnT = 0;

            // V8.0: 随机事件系统每局重置
            if (typeof RandomEvents !== 'undefined') RandomEvents.reset();
            // V8.0: 挑战模式竞技场装配(普通关卡为 null)
            if (this._pendingChallenge) {
                this._challenge = this._pendingChallenge;
                this._pendingChallenge = null;
                this._initChallengeArena();
            } else {
                this._challenge = null;
            }

            // 更新关卡名和等级徽章
            if (this.ui.levelName) this.ui.levelName.textContent = level.name;
            if (this.ui.levelBadge) this.ui.levelBadge.textContent = 'Lv.' + (this.levelIndex + 1);

            // 构建进度节点
            this._buildProgressNodes(level);

            if (this.ui.startScreen) this.ui.startScreen.classList.add('hidden');
            if (this.ui.winScreen) this.ui.winScreen.classList.add('hidden');
            if (this.ui.loseScreen) this.ui.loseScreen.classList.add('hidden');
            if (this.ui.pauseScreen) this.ui.pauseScreen.classList.add('hidden');
            if (this.ui.hud) this.ui.hud.classList.remove('hidden');
            if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
            // V3.4: 刷新广告按钮可见性
            this._updateAdButtons();
            this._updateSoundLabel();
            this._updateUI();
        } catch (err) {
            this._showError('[start错误] ' + err.message + '\n' + (err.stack || ''));
        }
    }

    // ===== V8.0: 挑战模式(无尽生存 / Boss试炼) =====
    /** 进入挑战模式: 用最高解锁关作为竞技场, 失败即结算 */
    startChallengeMode(type) {
        if (typeof CHALLENGE_MODES === 'undefined' || !CHALLENGE_MODES[type]) return false;
        var unlocked = this.profile ? (this.profile.data.unlockedLevel || 1) : 1;
        this.levelIndex = Math.min(LEVELS.length - 1, Math.max(0, unlocked - 1));
        this._pendingChallenge = {
            type: type, cfg: CHALLENGE_MODES[type],
            wave: 0, waveT: 3, time: 0, holdZ: undefined,
            _bossStart: 0, _scored: false
        };
        this.start();
        if (this.ui.levelName) this.ui.levelName.textContent = CHALLENGE_MODES[type].name;
        if (this.ui.levelBadge) this.ui.levelBadge.textContent = '⚔️';
        return true;
    }

    /** 竞技场初始化: 记录驻守线与Boss击杀基准 */
    _initChallengeArena() {
        var c = this._challenge;
        if (!c) return;
        c.holdZ = this.squad.z - 14;
        c._bossStart = this.enemies.bossKills || 0;
        c._scored = false;
        c.time = 0;
        c.wave = 0;
        c.waveT = 3;
        if (this.effects) {
            this.effects.floatText(this.squad.x, 2.6, this.squad.z - 2, c.cfg.icon + ' ' + c.cfg.name + ' 开始!', '#FFC247', true);
        }
    }

    /** 挑战波次驱动: 生存=混合波(每5波Boss); Boss试炼=纯Boss连续 */
    _updateChallenge(dt) {
        var c = this._challenge;
        if (!c || c.holdZ === undefined) return;
        c.time += dt;
        c.waveT -= dt;
        if (c.waveT > 0) return;
        c.wave++;
        if (c.type === 'survival') {
            c.waveT = Math.max(7, 12 - c.wave * 0.3);
            if (c.wave % 5 === 0) {
                // 每5波Boss: HP按波次指数增长
                var bhp = Math.round(1200 * Math.pow(c.cfg.hpScale || 1.12, c.wave));
                this.enemies.spawnEnemy('boss', CONFIG.LANE_X[1], this.squad.z - 14, bhp);
                this._showBossWarning(true);
                if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z - 3, '⚔️ Boss来袭!', '#FF4444', true);
            } else {
                var count = Math.min(70, 16 + Math.round(c.wave * 5));
                for (var i = 0; i < count; i++) {
                    var lane = i % 3;
                    var type = (c.wave >= 3 && i % 9 === 8) ? 'elite' : (i % 5 === 4 ? 'fast' : 'normal');
                    var x = CONFIG.LANE_X[lane] + (Math.random() - 0.5) * 2.4;
                    this.enemies.spawnEnemy(type, x, this.squad.z - CONFIG.BULLET_RANGE * (0.75 + Math.random() * 0.25), 0);
                }
                if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z - 3, '第 ' + c.wave + ' 波', '#FF8844', true);
            }
        } else if (c.type === 'boss_rush') {
            c.waveT = 6;
            var bhp2 = Math.round(1000 * Math.pow(c.cfg.hpScale || 1.25, c.wave));
            this.enemies.spawnEnemy('boss', CONFIG.LANE_X[1], this.squad.z - 14, bhp2);
            this._showBossWarning(true);
            if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z - 3, '👑 第 ' + c.wave + ' 个Boss', '#FFC247', true);
        }
    }

    _loop(timestamp) {
        if (this._rafDisabled) return; // V10.1: 测试密闭化开关 — 停止实时循环, 帧推进改由外部 _update 驱动
        requestAnimationFrame(this._loop);
        var workT0 = performance.now();
        if (this.lastTime === 0) { this.lastTime = timestamp; return; }
        var dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        // 性能采样: FPS指数移动平均 + P95帧耗时统计 (V3.6)
        this._fpsEma = this._fpsEma ? this._fpsEma * 0.95 + (1 / Math.max(dt, 0.0001)) * 0.05 : 1 / Math.max(dt, 0.0001);
        this._frameMs = dt * 1000;
        if (!this._frameTimes) this._frameTimes = [];
        this._frameTimes.push(this._frameMs);
        if (this._frameTimes.length > 300) this._frameTimes.shift();

        if (this.state === 'playing' && !this.paused) {
            // V4.0: 慢动作缩放游戏时间(输入/UI仍用真实dt)
            if (this._slowmoT > 0) {
                this._slowmoT -= dt;
            } else {
                this._timeScale = 1;
            }
            var ts = this._timeScale;
            this.time += dt * ts;
            this._update(dt * ts); // V5.1: elapsedTime 移入 _update(手动步进与真实循环一致)
        } else if (this.state === 'idle') {
            // 待机: 相机轻微摆动展示场景
            this.time += dt;
            this.squad.update(dt, this.time, this.squad.z);
            this.world.updateCamera(Math.sin(this.time * 0.4) * 0.6, 0, dt, 1);
        } else if (this.state === 'won' || this.state === 'lost') {
            this.time += dt;
            this.squad.update(dt, this.time, this.squad.z);
            this.enemies.finishDeaths(dt,this.time,this.squad);
            this.effects.update(dt);
        }

        this.world.renderer.render(this.world.scene, this.world.camera);

        // 单帧计算耗时(含update+render提交, 不受rAF节流影响)
        this._workMs = this._workMs ? this._workMs * 0.9 + (performance.now() - workT0) * 0.1 : (performance.now() - workT0);
    }

    _update(dt) {
        try {
            if (this.state === 'playing' && !this.paused) this.elapsedTime += dt; // V5.1
            this._updateInner(dt);
        } catch (err) {
            this._showError('[update错误] ' + err.message + '\n' + (err.stack || ''));
            this.state = 'lost'; // 停止循环避免刷屏
        }
    }

    _updateInner(dt) {
        if(this._waveNoticeT>0){this._waveNoticeT=Math.max(0,this._waveNoticeT-dt);if(!this._waveNoticeT){var _wb=document.getElementById('v42-wave-banner');if(_wb)_wb.classList.add('hidden');}} // V12: 移除ES2020可选链
        // 核心系统更新
        // Boss存活时小队在Boss前方停下，击败Boss才能继续
        var stopZ = this.enemies.boss ? this.enemies.boss.z + 4.5 : null;
        var frontier = this.pacing.frontierStopZ();
        if (frontier !== null) stopZ = stopZ === null ? frontier : Math.max(stopZ, frontier);
        // V12修复: 挑战模式驻守固定阵地, 门停线不外推驻守点(门前停线曾使挑战模式小队滞留门前
        // 无法接敌 → 永不战败, v80 挑战失败判定/结算标记/失败原因三项回归)
        var gateStop = (this._challenge && this._challenge.holdZ !== undefined)
            ? null
            : this.gates.approachStopZ(this.pacing, this.enemies.encounterOutstanding, this.squad.z);
        if (gateStop !== null) stopZ = stopZ === null ? gateStop : Math.max(stopZ, gateStop);
        // V8.0: 挑战模式 — 小队驻守固定阵地
        if (this._challenge && this._challenge.holdZ !== undefined) {
            stopZ = stopZ === null ? this._challenge.holdZ : Math.max(stopZ, this._challenge.holdZ);
        }
        this.squad.update(dt, this.time, stopZ);
        // V5.1: 全屏爆炸门 — 对场上所有活敌 50%maxHp 结算
        if (this.squad.nukePending) {
            this.squad.nukePending = false;
            var nuked = 0;
            for (var ni = 0; ni < this.enemies.enemies.length; ni++) {
                var ne = this.enemies.enemies[ni];
                if (!ne.alive) continue;
                ne.takeDamage(Math.max(20, ne.maxHp * 0.5), this.effects, ne.x, false);
                nuked++;
            }
            this.effects.shockwave(this.squad.x, 0.05, this.squad.z - 6, 0xFFC247);
            this.world.shake(0.5);
            this.effects.floatText(this.squad.x, 2.4, this.squad.z, '全屏爆炸!', '#FFC247', true);
        }
        this.gates.syncVisibility(this.pacing, this.enemies.encounterOutstanding, this.squad.z);
        this.gates.update(this.squad, this.effects, this.time, dt);
        // V4.0: 节奏控制器驱动分批刷怪/Boss预警
        this.pacing.update(dt, this.squad);
        this.enemies.update(dt, this.time, this.squad);
        if (this.energyCore) this.energyCore.update(dt, this.time, this.squad, this.enemies.enemies, this.effects);
        this.combat.update(dt, this.squad, this.enemies, this.energyCore);
        this.combat._syncInstances();
        this.effects.update(dt);

        // V10 QA: 每日任务进度轮询从每帧5次降为每0.5秒1次(原实现每帧5次全量profile.save ≈300次/s的localStorage写入)
        if (typeof ChallengeDaily !== 'undefined' && this.profile) {
            this._dailyPollT = (this._dailyPollT || 0) + dt;
            if (this._dailyPollT >= 0.5) {
                this._dailyPollT = 0;
                ChallengeDaily.report(this.profile, 'kills', 0);
                ChallengeDaily.report(this.profile, 'squad', 0);
                ChallengeDaily.report(this.profile, 'gates', 0);
                ChallengeDaily.report(this.profile, 'skills', 0);
                ChallengeDaily.report(this.profile, 'boss', 0);
            }
        }
        // V8.0: 随机事件 + 挑战模式波次驱动
        if (typeof RandomEvents !== 'undefined') RandomEvents.update(dt, this);
        if (this._challenge) this._updateChallenge(dt);
        // V3.3: 连杀系统 — 击杀数增长时combo+1, 2秒无击杀清零
        var kc = this.enemies.killCount;
        if (kc > this._prevKillCount) {
            var newKills = kc - this._prevKillCount;
            var previousCombo = this.combo;
            this.combo += kc - this._prevKillCount;
            this.comboTimer = 3.0;
            this.world.shake(Math.min(.12, .045 + newKills * .009), .1);
            if (this.ui.comboBox) {
                this.ui.comboBox.classList.remove('combo-hit');
                void this.ui.comboBox.offsetWidth;
                this.ui.comboBox.classList.add('combo-hit');
            }
            // 连杀里程碑
            var milestones = [10, 30, 50, 100];
            for (var mi = 0; mi < milestones.length; mi++) {
                if (previousCombo < milestones[mi] && this.combo >= milestones[mi]) {
                    if (this._comboMilestone !== milestones[mi]) {
                        this._comboMilestone = milestones[mi];
                        this.effects.floatText(this.squad.x, 2.2, this.squad.z - 1, milestones[mi] + '连杀!', '#FFC247', true);
                        this.effects.shockwave(this.squad.x, 0.05, this.squad.z, 0xFFC247);
                    }
                }
            }
            this.maxCombo = Math.max(this.maxCombo || 0, this.combo);
        }
        this._prevKillCount = kc;
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) { this.combo = 0; this._comboMilestone = 0; }
        }

        // 场景跟随
        this.world.updateRoadScroll(this.squad.z);
        this.world.updateCamera(this.squad.x, this.squad.z, dt, this.squad.count,this.squad.getDepth());

        // UI刷新
        this._updateUI();

        // Boss血条
        if (this.enemies.boss) {
            this.bossSpawned = true;
            if (this.ui.bossBar) this.ui.bossBar.classList.remove('hidden');
            var bosses=this.enemies.enemies.filter(e=>e.isBoss&&e.alive);
            // V10 QA修复: Boss死亡瞬间 bosses 可为空数组 → 0/0=NaN 血条, 加空值守卫
            var hpSum=bosses.reduce((n,e)=>n+e.hp,0), maxSum=bosses.reduce((n,e)=>n+(e.maxHp||0),0);
            var ratio = maxSum>0 ? Math.max(0,hpSum/maxSum) : 0;
            var bossNameNode=document.getElementById('boss-name');
            // V10 QA修复: L9双Boss各自显示自己的title(按 artStyle 匹配段配置, 原固定读 BOSS_NAMES[levelIndex])
            var segBoss=(LEVELS[this.levelIndex].segments||[]).find(s=>s.type==='boss'&&s.boss&&s.boss.style===(this.enemies.boss&&this.enemies.boss.artStyle));
            var bossTitle=(segBoss&&segBoss.boss&&segBoss.boss.title)||CONFIG.BOSS_NAMES[this.levelIndex];
            if(bossNameNode){ // V12: 结构无关的文本更新(原依赖firstChild.nodeType===3, HTML结构变动即失效)
                var _bnTextNode=null;
                for(var _bnI=0;_bnI<bossNameNode.childNodes.length;_bnI++){if(bossNameNode.childNodes[_bnI].nodeType===3){_bnTextNode=bossNameNode.childNodes[_bnI];break;}}
                if(_bnTextNode)_bnTextNode.nodeValue=bossTitle;else bossNameNode.textContent=bossTitle;
            }
            var phaseLabel=document.getElementById('boss-phase');
            if(phaseLabel)phaseLabel.textContent='阶段 '+(this.enemies.boss.phaseIndex||1)+(this.enemies.boss.shieldT>0?' · 护盾':'');
            if (this.ui.bossFill) this.ui.bossFill.style.width = (ratio * 100) + '%';
            // V10 QA修复: Boss图鉴"遭遇过"标记(原 d.bossSeen 从未写入, 只靠fallback)
            if (this.profile && typeof this.profile.data.bossSeen === 'object') {
                var bk=(this.enemies.boss && this.enemies.boss.artStyle)||CONFIG.BOSS_NAMES[this.levelIndex];
                if (!this.profile.data.bossSeen[bk]) { this.profile.data.bossSeen[bk] = true; this.profile.save(); }
            }
        }

        // V5.1 胜利判定(阵地防守): 全部波次排空 + 场上无敌(含Boss已亡+召唤清完) → 通关
        // V8.0: 挑战模式无通关 — 由失败结算
        if (!this._challenge && this.pacing.isComplete() && this.enemies.encounterOutstanding === 0 && !this.enemies.boss) {
            this.bossDefeated = true; // 兼容旧标志(E2E引用)
            if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
            this._win();
            return;
        }
        if (!this.squad.alive || this.squad.count <= 0) {
            // V3.3: 失败原因追踪
            var reason = '小队全灭';
            if (this.enemies.boss) reason = 'Boss战失利 · 输出不足';
            else if (this.enemies.aliveCount > 8) reason = '被怪潮吞噬 · 人数不足';
            else reason = '阵亡于残敌 · 火力分散';
            this._lose(reason);
            return;
        }
    }

    /** V10.1: HUD刷新脏检查 — 原实现每帧 getElementById+无条件DOM写(剖析占17.3%主线程) */
    _updateUI() {
        var bossActive = !!this.enemies.boss && this.state === 'playing';
        if (this._containerEl === undefined) this._containerEl = document.getElementById('game-container'); // V11 QA: 只查一次, 容器缺失时不逐帧取null调用
        if (this._containerEl && this._cachedBossActive !== bossActive) {
            this._cachedBossActive = bossActive;
            this._containerEl.classList.toggle('boss-active', bossActive);
        }
        var level = LEVELS[this.levelIndex];
        var progress = clamp(-this.squad.z / -level.totalZ, 0, 1);
        var progPct = (progress * 100).toFixed(1);
        if (this._cachedProgress !== progPct) {
            this._cachedProgress = progPct;
            if (this.ui.progressFill) this.ui.progressFill.style.width = progPct + '%';
            if (this.ui.progressFlag) this.ui.progressFlag.style.left = progPct + '%';
        }

        // 进度节点
        this._updateProgressNodes();

        // 人数气泡: 跟随小队头顶(V3.6: 3D投影定位,随队伍移动不遮挡弹道)
        if (this.ui.countBadge && this.state === 'playing') {
            var cam = this.world.camera;
            this._badgeV.set(this.squad.x, 1.42 * (this.squad._formationScale || 1) + .2, this.squad.z - .1).project(cam);
            if (this._badgeV.z < 1) {
                var cw = this.world.canvas.clientWidth || window.innerWidth;
                var ch = this.world.canvas.clientHeight || window.innerHeight;
                var sx = (this._badgeV.x * 0.5 + 0.5) * cw;
                var sy = (-this._badgeV.y * 0.5 + 0.5) * ch;
                // 屏幕内钳制: 避免压到HUD或飞出边界
                sx = clamp(sx, 46, cw - 46);
                sy = clamp(sy, 150, ch - 40);
                if (sy < 200 && sx < 145) sx = 145; // 避让左上属性面板
                var sxR = Math.round(sx), syR = Math.round(sy - 18);
                if (this._cachedBadgeX !== sxR || this._cachedBadgeY !== syR) {
                    this._cachedBadgeX = sxR; this._cachedBadgeY = syR;
                    // V11.6: transform 代替 left/top — 合成器路径, 不触发每帧布局
                    this.ui.countBadge.style.transform = 'translate3d(' + sxR + 'px,' + syR + 'px,0)';
                }
                if (this._cachedBadgeShown !== true) { this._cachedBadgeShown = true; this.ui.countBadge.style.display = 'flex'; }
            } else if (this._cachedBadgeShown !== false) {
                this._cachedBadgeShown = false;
                this.ui.countBadge.style.display = 'none';
            }
        }

        // 人数气泡(变化时触发弹出/抖动动画)
        if (this.ui.countNum) {
            // V11.6: 数值先行比较, 避免每帧 String 分配
            if (this._cachedCountNum !== this.squad.count) {
                var countStr = String(this.squad.count);
                this._cachedCountNum = this.squad.count;
                var prevCount = parseInt(this.ui.countNum.textContent) || 0;
                this.ui.countNum.textContent = countStr;
                var animClass = this.squad.count > prevCount ? 'pop' : 'shake';
                if (this.ui.countBadge) {
                    this.ui.countBadge.classList.remove('pop', 'shake');
                    void this.ui.countBadge.offsetWidth;
                    this.ui.countBadge.classList.add(animClass);
                }
            }
        }

        // 追踪最大人数
        if (this.squad.count > this.maxCount) {
            this.maxCount = this.squad.count;
        }

        // V3.3: 连杀HUD (combo>=5时显示)
        if (this.ui.comboBox) {
            var comboShown = this.combo >= 5 && this.state === 'playing';
            if (this._cachedComboShown !== comboShown) {
                this._cachedComboShown = comboShown;
                this.ui.comboBox.classList.toggle('hidden', !comboShown);
            }
            if (comboShown && this.ui.comboNum) {
                if (this._cachedCombo !== this.combo) { this._cachedCombo = this.combo; this.ui.comboNum.textContent = this.combo; }
                var hot = this.combo >= 30;
                if (this._cachedComboHot !== hot) { this._cachedComboHot = hot; this.ui.comboBox.classList.toggle('hot', hot); }
            }
        }

        // V3.4: 刷门按钮状态刷新(战斗中, 0.5s一次)
        if (this.adCoord && this.state === 'playing') {
            this._adBtnT = (this._adBtnT || 0) - 1;
            if (this._adBtnT <= 0) { this._adBtnT = 15; this._updateAdButtons(); }
        }

        // 属性面板(带变化动画) — 数值脏检查后写DOM
        if (this.ui.statCount) {
            var cnt = this.squad.count;
            if (this._cachedStatCount !== cnt) {
                this._cachedStatCount = cnt;
                this.ui.statCount.textContent = cnt;
                if (this.ui.statRowCount && this.ui.countNum && String(cnt) !== this.ui.countNum.textContent) {
                    this.ui.statRowCount.classList.remove('bump');
                    void this.ui.statRowCount.offsetWidth;
                    this.ui.statRowCount.classList.add('bump');
                }
            }
            var curDmg = this.squad.getDamage();
            if (this._cachedStatDamage !== curDmg) {
                this._cachedStatDamage = curDmg;
                this.ui.statDamage.textContent = curDmg;
                if (curDmg !== this._prevDamage && this.ui.statRowDamage) {
                    this.ui.statRowDamage.classList.remove('flash');
                    void this.ui.statRowDamage.offsetWidth;
                    this.ui.statRowDamage.classList.add('flash');
                }
                this._prevDamage = curDmg;
            }
            var curFr = this.squad.getFireRate();
            var frStr = curFr.toFixed(1);
            if (this._cachedStatFr !== frStr) {
                this._cachedStatFr = frStr;
                this.ui.statFirerate.textContent = frStr;
                if (Math.abs(curFr - this._prevFireRate) > 0.01 && this.ui.statRowFirerate) {
                    this.ui.statRowFirerate.classList.remove('bump');
                    void this.ui.statRowFirerate.offsetWidth;
                    this.ui.statRowFirerate.classList.add('bump');
                }
                this._prevFireRate = curFr;
            }
        }
    }

    _win() {
        this.state = 'won';
        this._sfx('win'); // V5.0
        this.squad.setAnimationState('Victory');
        // V5.1: 金币结算(幂等入账) + 档案统计
        this._doubleApplied = false;
        this._settlement = this.profile ? settleRunEconomy(this.profile, LEVELS[this.levelIndex], this.levelIndex, this.enemies.killCount, true, false, (typeof Skills !== 'undefined' ? Skills.coinBonus(this.squad) : (this.squad._skillMagnet || 0))) : null;
        if (this.profile) {
            this._newUnlocked = this.profile.recordRun(this.levelIndex, this.enemies.killCount, this.maxCount, true, LEVELS.length);
            // V6.0: 星级/经验/成就/统计
            this._stars = typeof Progression !== 'undefined' ? Progression.computeStars(this.levelIndex, this.squad.count, this.enemies.killCount, true) : 0;
            var starKey = 'L' + (this.levelIndex + 1);
            var prevStars = this.profile.data.stars[starKey] || 0;
            this._newStars = Math.max(0, this._stars - prevStars);
            if (this._stars > prevStars) this.profile.data.stars[starKey] = this._stars;
            if (this.enemies.bossKills) this.profile.data.stats.bossKills = (this.profile.data.stats.bossKills || 0) + this.enemies.bossKills;
            // V10 QA: 科技"训练手册"经验加成接线(原 log_xp 购买后无效果)
            // V11.2: 实战经验技能 — XP ×(1+0.15×层) 叠乘
            var xpMul = ((this._techStats && this._techStats.xpMul) ? this._techStats.xpMul : 1) * (1 + 0.15 * (this.squad._skillFortune || 0));
            this.profile.data.xp = (this.profile.data.xp || 0) + (typeof Progression !== 'undefined' ? Math.round(Progression.computeXp(this.enemies.killCount, true, this.levelIndex, this._newStars) * xpMul) : 0);
            this.profile.data.playerLevel = Progression ? Progression.levelFromXp(this.profile.data.xp).level : this.profile.data.playerLevel;
            // V10 QA修复: 胜利上报每日任务(wins类型此前无任何调用方, 通关N关任务永远0进度)
            if (typeof ChallengeDaily !== 'undefined') ChallengeDaily.report(this.profile, 'wins', 1);
            // V10 QA修复: 科技点发放(原 grantTech 全库零调用 → 科研站永远0点, 科技树不可用)
            if (typeof TechTree !== 'undefined') TechTree.grantTech(this.profile, 1 + (this.enemies.bossKills || 0));
            this.profile.save();
            this._newAchievements = typeof Progression !== 'undefined' ? Progression.checkAchievements(this.profile) : [];
        }
        // VNext: 通关装备掉落(1件保底, 星级加成)
        this._drops = (typeof EquipmentLoot !== 'undefined' && this.profile)
            ? EquipmentLoot.rollOnWin(this.profile, this.levelIndex, this._stars || 0) : [];
        // VNext: 真实战绩入榜
        if (typeof Leaderboard !== 'undefined' && this.profile) {
            // V11.4: 职业专精计局
            if (typeof SoldierClass !== 'undefined') SoldierClass.recordGame(this.profile, this.profile.data.classId);
            Leaderboard.record(this.profile, {
                level: this.levelIndex + 1, win: true, kills: this.enemies.killCount,
                maxCount: this.maxCount, combo: this.maxCombo, time: this.elapsedTime,
                classId: this.profile.data.classId
            });
        }
        var starsEl = document.getElementById('win-stars');
        if (starsEl && this._stars !== undefined) {
            starsEl.innerHTML = '★'.repeat(this._stars) + '☆'.repeat(3 - this._stars);
            starsEl.classList.remove('hidden');
        }
        this._fillSettlementUI();
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        this._showBossWarning(false);
        // 填充结算数据
        if (this.ui.winCount) this.ui.winCount.textContent = this.squad.count;
        if (this.ui.winKills) this.ui.winKills.textContent = this.enemies.killCount;
        if (this.ui.winMax) this.ui.winMax.textContent = this.maxCount;
        if (this.ui.winTime) this.ui.winTime.textContent = this.elapsedTime.toFixed(1) + 's';
        // V3.3: 连杀统计
        if (this.ui.winCombo) this.ui.winCombo.textContent = this.maxCombo || 0;
        // V3.3: 通关存档 — 解锁下一关
        this._saveProgress(Math.min(LEVELS.length, this.levelIndex + 2));
        // V3.4: 双倍按钮(每通关限1次)
        this._updateAdButtons();
        if (this.ui.winScreen) this.ui.winScreen.classList.remove('hidden');
        // V3.3: 胜利→下一关按钮
        var hasNext = this.levelIndex + 1 < LEVELS.length;
        if (this.ui.btnNextLevel) {
            this.ui.btnNextLevel.classList.toggle('hidden', !hasNext);
        }
    }

    _lose(reason) {
        this.state = 'lost';
        this.lastLoseReason = reason; // V5.0: 供平衡模拟分析失败原因
        this._sfx('lose'); // V5.0
        // V5.1: 失败只给少量击杀金币(防故意失败刷钱)
        this._settlement = this.profile ? settleRunEconomy(this.profile, LEVELS[this.levelIndex], this.levelIndex, this.enemies.killCount, false, false, (typeof Skills !== 'undefined' ? Skills.coinBonus(this.squad) : (this.squad._skillMagnet || 0))) : null;
        if (this.profile) {
            this.profile.recordRun(this.levelIndex, this.enemies.killCount, this.maxCount, false, LEVELS.length);
            this.profile.data.xp = (this.profile.data.xp || 0) + this.enemies.killCount * (typeof XP_RULES !== 'undefined' ? XP_RULES.perKill : 1);
            this.profile.data.playerLevel = typeof Progression !== 'undefined' ? Progression.levelFromXp(this.profile.data.xp).level : this.profile.data.playerLevel;
            this._newAchievements = typeof Progression !== 'undefined' ? Progression.checkAchievements(this.profile) : [];
            this.profile.save();
        }
        // V8.0: 挑战模式结算 — 分数+奖励+最高纪录(幂等: _scored 防重复)
        // VNext: 失败也有25%概率掉落1件装备(保底参与感)
        this._drops = (typeof EquipmentLoot !== 'undefined' && this.profile)
            ? EquipmentLoot.rollOnLose(this.profile, this.levelIndex) : [];
        // VNext: 真实战绩入榜(失败也计)
        if (typeof Leaderboard !== 'undefined' && this.profile) {
            if (typeof SoldierClass !== 'undefined') SoldierClass.recordGame(this.profile, this.profile.data.classId);
            Leaderboard.record(this.profile, {
                level: this.levelIndex + 1, win: false, kills: this.enemies.killCount,
                maxCount: this.maxCount, combo: this.maxCombo, time: this.elapsedTime,
                classId: this.profile.data.classId,
                challenge: this._challenge ? this._challenge.type : null
            });
        }
        if (this._challenge && !this._challenge._scored) {
            this._challenge._scored = true;
            var cScore = this._challenge.type === 'survival'
                ? this.enemies.killCount
                : Math.max(0, (this.enemies.bossKills || 0) - (this._challenge._bossStart || 0));
            var cReward = this.profile ? Math.round(cScore * (this._challenge.type === 'survival' ? 0.5 : 1.2)) : 0;
            if (this.profile) {
                this.profile.addCoins(cReward);
                this.profile.data.xp = (this.profile.data.xp || 0) + Math.round(cScore * 2);
                this.profile.data.playerLevel = typeof Progression !== 'undefined' ? Progression.levelFromXp(this.profile.data.xp).level : this.profile.data.playerLevel;
                if (!this.profile.data.challengeBest) this.profile.data.challengeBest = {};
                var bestKey = this._challenge.type;
                if (cScore > (this.profile.data.challengeBest[bestKey] || 0)) {
                    this.profile.data.challengeBest[bestKey] = cScore;
                    this._challenge._newBest = true;
                }
                this.profile.save();
            }
            if (this.ui.loseReason) this._challenge._scoreText =
                (this._challenge.cfg ? this._challenge.cfg.name : '挑战') + ' · 得分 ' + cScore +
                (this._challenge._newBest ? ' 🎉新纪录!' : '') + ' · 奖励 ' + cReward + '🪙';
        }
        this._fillSettlementUI();
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        this._showBossWarning(false);
        // 填充结算数据
        if (this.ui.loseKills) this.ui.loseKills.textContent = this.enemies.killCount;
        if (this.ui.loseMax) this.ui.loseMax.textContent = this.maxCount;
        if (this.ui.loseCombo) this.ui.loseCombo.textContent = this.maxCombo || 0;
        // V3.3: 失败原因
        if (this.ui.loseReason) this.ui.loseReason.textContent = reason || '小队全灭';
        // V8.0: 挑战模式 — 失败原因替换为挑战得分(须在默认原因之后写入)
        if (this._challenge && this._challenge._scored && this._challenge._scoreText && this.ui.loseReason) {
            this.ui.loseReason.textContent = this._challenge._scoreText;
        }
        // V3.4: 复活按钮(每局限1次)
        this._updateAdButtons();
        if (this.ui.loseScreen) this.ui.loseScreen.classList.remove('hidden');
    }

    // ===== V3.3: 存档系统(关卡解锁进度) =====
    /** V5.1: 解锁进度迁移至 GameProfile 持久档(旧 pz_progress 已在建档时迁移) */
    _loadProgress() {
        if (this.profile) return clamp(this.profile.data.unlockedLevel, 1, LEVELS.length);
        try {
            var v = parseInt(window.localStorage.getItem('pz_progress')) || 1;
            return clamp(v, 1, LEVELS.length);
        } catch (e) { return 1; }
    }

    _saveProgress(unlocked) {
        if (this.profile) {
            if (unlocked > this.profile.data.unlockedLevel) {
                this.profile.data.unlockedLevel = unlocked;
                this.profile.save();
            }
            return;
        }
        try {
            var cur = this._loadProgress();
            if (unlocked > cur) {
                window.localStorage.setItem('pz_progress', String(unlocked));
            }
        } catch (e) { /* 存储不可用则跳过 */ }
    }

    /** 刷新关卡选择按钮(解锁状态) */
    _refreshLevelSelect() {
        if (!this.ui.levelSelect) return;
        var unlocked = this._loadProgress();
        this._refreshBestRecord(); // V5.0: 首页最高纪录同步
        var self = this;
        var btns = this.ui.levelSelect.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
            (function(idx, btn) {
                var isUnlocked = idx < unlocked;
                btn.className = 'lv-btn' + (isUnlocked ? ' unlocked' : ' locked') + (idx + 1 === unlocked ? ' current' : '');
                btn.disabled = !isUnlocked;
                btn.onclick = function() {
                    self.levelIndex = idx;
                    self.start();
                };
            })(i, btns[i]);
        }
    }
}

// 启动 (脚本在body底部, DOM已就绪, Three.js已同步加载完成)
(function() {
    function showError(msg) {
        var div = document.getElementById('error-display');
        if (!div) {
            div = document.createElement('div');
            div.id = 'error-display';
            div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC0000;color:#fff;padding:10px 14px;font-size:13px;font-family:monospace;white-space:pre-wrap;pointer-events:none;';
            document.body.appendChild(div);
        }
        div.textContent = msg;
    }

    if (typeof THREE === 'undefined') {
        showError('[致命错误] Three.js 未加载成功!\n请检查网络连接后刷新页面重试。');
        return;
    }

    // VNext: 启动加载界面(真实进度条, 由 index.html 的 __BootProgress 驱动)
    var loading = document.getElementById('boot-loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'boot-loading';
        loading.textContent = '正在整备蓝色小队…';
        document.body.appendChild(loading);
    }
    var starting = false;
    function boot() {
        if (starting || window.__game) return;
        starting = true;
        loading.classList.remove('boot-hidden');
        var actions = document.getElementById('boot-actions');
        if (actions) actions.innerHTML = '';
        window.__BootProgress && window.__BootProgress.stage('整备蓝色小队…', 2);
        var error = document.getElementById('error-display');
        if (error) error.remove();
        // V11.6: 关键资源优先启动 — 只等士兵+普通/快速僵尸(6 GLB), 其余20个模型战斗中后台补齐
        // (_bank 对未就绪体格有 normal 回退; Boss通常开局1-3分钟后才出场, 届时早已加载完成)
        Promise.all([SoldierModelLoader.load(), EnemyModelLoader.loadCritical()]).then(function() {
            window.__BootProgress && window.__BootProgress.stage('构建战场与渲染管线…', 99);
            // V11 QA修复[P3]: 构造失败(如WebGL上下文异常)不再走"重建"重试 —
            // 同canvas二次new Game()会重复注册输入监听; 此路径引导用户刷新页面整体重置
            try {
                if (!window.__game) window.__game = new Game();
                EnemyModelLoader.load(); // V11.6: 后台续载剩余模型(不阻塞进入游戏)
            } catch (e) {
                starting = false;
                showError('游戏初始化失败：' + e.message + '\n请刷新页面重试。');
                window.__BootProgress && window.__BootProgress.stage('初始化失败', 0);
                return;
            }
            window.__BootProgress && window.__BootProgress.done();
            window.__BootProgress && window.__BootProgress.stage('准备完毕!', 100);
            setTimeout(function() { loading.classList.add('boot-hidden'); }, 260);
        }).catch(function(err) {
            starting = false;
            showError('角色资源加载失败：' + err.message);
            window.__BootProgress && window.__BootProgress.stage('资源加载失败', 0);
            var retry = document.createElement('button');
            retry.id = 'btn-retry-model';
            retry.textContent = '重新加载小队';
            retry.onclick = boot;
            var actions = document.getElementById('boot-actions');
            if (actions) actions.appendChild(retry);
            else loading.appendChild(retry);
        });
    }
    boot();
})();



/* ---- index.html 内联引导(等价移植) ---- */
window.__GAME_VERSION = 'v12.0';
window.__AD_TEST_SCENARIO = null; /* 小游戏无 location 注入, 生产恒为 null */
Platform.initialize();
window.__adService = setupAdService();
window.__platformId = Platform.id; /* V12: 供测试/诊断读取 */
