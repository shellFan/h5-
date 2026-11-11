// ===== 抖音小游戏构建脚本 (Phase 5/8) =====
// 产物: dist/douyin/ — 可直接导入抖音开发者工具
// 运行: npm run build:douyin  (node tools/build-douyin.js)
//
// 抖音小游戏与H5的差异(构建时处理):
// 1. 入口 game.js: 创建唯一 canvas + 模拟 window/document 最小子集 → 三方库与游戏代码零改动
// 2. 资源路径: 相对路径在 tt 环境需通过 tt.getFileSystemManager 读取? — 本项目全部为程序化生成
//    (Canvas纹理/SVG avatar), SVG avatar 在小游戏环境降级为程序化绘制
// 3. 广告: DouyinAdService(tt.createRewardedVideoAd) — 广告位ID在 game-config.js 配置
// 4. 存储: TtStorageAdapter
// 5. 物理/输入: 触控 tt.onTouchStart 等 → InputAdapter桥接

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'douyin');

// 游戏逻辑(H5与抖音共用, 原样复制)
const GAME_SCRIPTS = [
    'js/config.js',
    'js/utils.js',
    'js/models.js',
    'js/world.js',
    'js/effects.js',
    'js/squad.js',
    'js/gates.js',
    'js/enemies.js',
    'js/combat.js',
    'js/platform/storage-adapter.js',
    'js/platform/lifecycle-adapter.js',
    'js/platform/audio-adapter.js',
    'js/platform/share-adapter.js',
    'js/platform/platform.js',
    'js/ads/ad-service.js',
    'js/ads/web-mock-ad.js',
    'js/ads/douyin-ad.js',
    'js/ads/wechat-ad.js',
    'js/ads/game-ad-coordinator.js'
];

// game.json — 抖音小游戏配置(按官方默认字段, 未配置的能力由平台降级)
const GAME_JSON = {
    deviceOrientation: 'portrait',
    showStatusBar: false,
    networkTimeout: {
        request: 10000,
        downloadFile: 10000
    }
};

// game-config.js — 平台相关可配置项(上线前必查)
const GAME_CONFIG_JS = `// ===== 抖音小游戏平台配置 =====
// 广告位ID: 抖音开放平台流量主后台分配(上线必填, 留空则广告功能降级不可用)
var DOUYIN_AD_UNITS = {
    rewardVideo: ''  // TODO(上线): 填入激励视频广告位ID
};
`;

// game.js — 小游戏入口: 组装DOM模拟层 + 启动游戏
const ENTRY_JS = `// ===== 抖音小游戏入口 (构建产物, 源于 tools/build-douyin.js) =====
'use strict';

/* ------------------------------------------------------------------
 * DOM/Canvas 模拟层: 抖音小游戏无DOM, 提供游戏代码所需的最小子集:
 *   - document.getElementById / createElement('canvas')
 *   - window.innerWidth/Height/devicePixelRatio/addEventListener
 *   - window.localStorage 由 StorageAdapter 直接走 tt, 不需要模拟
 * 注意: 仅模拟游戏实际用到的API, 不做通用polyfill
 * ------------------------------------------------------------------ */
(function setupMiniGameEnv() {
    var sysInfo = tt.getSystemInfoSync();
    var mainCanvas = tt.createCanvas();
    // 抖音首屏canvas即主画布: 尺寸由系统给出
    mainCanvas.width = sysInfo.windowWidth * sysInfo.pixelRatio;
    mainCanvas.height = sysInfo.windowHeight * sysInfo.pixelRatio;
    // world.resize 依赖 canvas.parentElement.clientWidth
    mainCanvas.parentElement = { clientWidth: sysInfo.windowWidth, clientHeight: sysInfo.windowHeight };
    mainCanvas.clientWidth = sysInfo.windowWidth;
    mainCanvas.clientHeight = sysInfo.windowHeight;

    var createdCanvases = [];

    // --- document 模拟 ---
    global.document = {
        createElement: function(tag) {
            if (tag === 'canvas') {
                var c = tt.createCanvas();
                createdCanvases.push(c);
                return c;
            }
            if (tag === 'img') {
                // 游戏内SVG avatar加载在小游戏环境返回失败对象(走onerror降级)
                return {
                    set src(v) { var self = this; setTimeout(function() { if (self.onerror) self.onerror(); }, 0); },
                    set onerror(fn) { this._onerror = fn; },
                    get onerror() { return this._onerror; },
                    onload: null
                };
            }
            // div等DOM元素: 返回空壳(游戏在错误兜底时会appendChild, 不应崩溃)
            return { style: {}, appendChild: function() {}, set textContent(v) {}, get textContent() { return ''; } };
        },
        getElementById: function(id) {
            if (id === 'game-canvas') return mainCanvas;
            // UI层DOM在小游戏环境不存在: 返回null, game.js对所有UI引用均做了防御性判空
            return null;
        },
        addEventListener: function() {},
        body: { appendChild: function() {} }
    };

    // --- window 模拟 ---
    global.window = {
        innerWidth: sysInfo.windowWidth,
        innerHeight: sysInfo.windowHeight,
        devicePixelRatio: sysInfo.pixelRatio,
        addEventListener: function() {},
        requestAnimationFrame: function(cb) { return setTimeout(function() { cb(Date.now()); }, 16); },
        performance: { now: function() { return Date.now(); } },
        localStorage: null // 明确置空: 平台层走TtStorageAdapter
    };
    // 游戏代码混用 global.window 与裸 window
    global.navigator = {};
    // 裸全局(游戏代码直接调用 requestAnimationFrame / new Image)
    global.requestAnimationFrame = global.window.requestAnimationFrame;
    global.Image = function() { return global.document.createElement('img'); };
    global.performance = global.window.performance;

    // --- 触控桥接: canvas事件 → tt全局触控 ---
    var touchHandlers = {
        touchstart: [], touchmove: [], touchend: [], touchcancel: []
    };
    mainCanvas.addEventListener = function(type, fn) {
        if (touchHandlers[type]) touchHandlers[type].push(fn);
    };
    function dispatch(type, e) {
        var list = touchHandlers[type] || [];
        var evt = {
            preventDefault: function() {},
            touches: e.touches && e.touches.length ? e.touches.map(function(t) {
                return { clientX: t.clientX, clientY: t.clientY, identifier: t.id };
            }) : [],
            changedTouches: e.changedTouches && e.changedTouches.length ? e.changedTouches.map(function(t) {
                return { clientX: t.clientX, clientY: t.clientY, identifier: t.id };
            }) : []
        };
        for (var i = 0; i < list.length; i++) list[i](evt);
    }
    tt.onTouchStart(function(e) { dispatch('touchstart', e); });
    tt.onTouchMove(function(e) { dispatch('touchmove', e); });
    tt.onTouchEnd(function(e) { dispatch('touchend', e); });
    tt.onTouchCancel(function(e) { dispatch('touchcancel', e); });
})();

/* ------------------------------------------------------------------
 * 加载游戏脚本(按H5相同顺序)
 * ------------------------------------------------------------------ */
${GAME_SCRIPTS.map(function(rel) {
    return "require('./" + rel.replace('js/', '') + "');";
}).join('\n')}

/* ------------------------------------------------------------------
 * 启动
 * ------------------------------------------------------------------ */
try {
    Platform.initialize();       // 生命周期绑定(tt.onAppHide/onAppShow)
    window.__adService = setupAdService(); // 广告服务(H5=测试模拟器, 抖音=真实SDK)
    window.__game = new Game();
} catch (err) {
    console.error('[启动错误]', err && err.stack || err);
}
`;

function copyTo(srcRel) {
    const src = path.join(ROOT, srcRel);
    const dst = path.join(OUT, srcRel);
    if (!fs.existsSync(src)) {
        console.warn('[build:douyin] 跳过不存在的文件: ' + srcRel);
        return;
    }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    const stat = fs.statSync(src);
    if (stat.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
}

function copyDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        const s = path.join(src, entry);
        const d = path.join(dst, entry);
        if (fs.statSync(s).isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
}

function main() {
    console.log('[build:douyin] 清理旧产物...');
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });

    console.log('[build:douyin] 复制游戏脚本与资源...');
    for (const rel of GAME_SCRIPTS) copyTo(rel);
    // three.js(本地化, 与H5一致)
    copyTo('libs/three.min.js');
    // SVG素材: 小游戏无Image加载SVG → avatar降级, 但保留文件供后续扩展
    copyTo('assets');

    console.log('[build:douyin] 生成小游戏入口与配置...');
    fs.writeFileSync(path.join(OUT, 'game.js'), ENTRY_JS);
    fs.writeFileSync(path.join(OUT, 'game.json'), JSON.stringify(GAME_JSON, null, 2));
    fs.writeFileSync(path.join(OUT, 'game-config.js'), GAME_CONFIG_JS);

    // 生成 projection.js? 不需要。
    // game-config.js 需在 douyin-ad.js 之前加载 → 调整入口加载顺序: 把配置放在脚本列表最前
    // (douyin-ad.js 读取全局 DOUYIN_AD_UNITS, build时 game-config 先 require)
    const entry = fs.readFileSync(path.join(OUT, 'game.js'), 'utf8');
    fs.writeFileSync(path.join(OUT, 'game.js'), entry.replace(
        "require('./config.js');",
        "require('./game-config.js');\nrequire('./config.js');"
    ));

    console.log('[build:douyin] 完成 → dist/douyin/');
    console.log('  导入方式: 抖音开发者工具 → 打开 dist/douyin 目录');
    console.log('  上线前必查: game-config.js 广告位ID / 真机验证(见 docs/V3_DOUYIN_ADAPTER.md)');
}

main();
