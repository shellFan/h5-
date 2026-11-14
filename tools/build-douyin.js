// ===== 抖音小游戏构建脚本 V5.0（重写） =====
// 产物: dist/douyin/ — 可导入抖音开发者工具
// 运行: npm run build:douyin
//
// V5.0 架构变更（修复 V4.x 产物不可运行的 P0）:
// 抖音小游戏 CommonJS 每个文件独立模块作用域, H5 顶层 var/class 无法跨文件共享。
// 方案: 把全部游戏脚本按 index.html 加载顺序拼接为单一 IIFE 作用域文件 game-bundle.js
//（与 tests/unit/run.js 的 vm 拼接方案同构, 输出为真实文件）, 入口 game.js 只做:
//   环境模拟 → require three.js/GLTFLoader 接线 → require bundle → 启动
//
// 已知待真机验证项(无开发者工具/AppID 无法在本环境执行, 见 docs/V50_DOUYIN_RELEASE.md):
//   - GLB 贴图解码路径(tt.createImage 对 data URI 的支持)
//   - 激励视频真实回调时序
//   - tt 音频播放音量/时延

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'douyin');

// 与 index.html 加载顺序一致(除 vendor/three 与 vendor/GLTFLoader — 由 bundle 头部接线)
const GAME_SCRIPTS = [
    'js/config.js',
    'js/utils.js',
    'js/movement.js',
    'js/vendor/GLTFLoader.js',
    'js/soldier-loader.js',
    'js/soldier-renderer.js',
    'js/enemy-models.js',
    'js/boss-v42.js',
    'js/art-v42.js',
    'js/models.js',
    'js/world.js',
    'js/effects.js',
    'js/squad.js',
    'js/gates.js',
    'js/enemies.js',
    'js/combat.js',
    'js/pacing.js',
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

// index.html 内联引导脚本(平台初始化+广告装配, 必须在 game.js 之前执行)
const BOOTSTRAP_SNIPPET = `
/* ---- index.html 内联引导(等价移植) ---- */
window.__AD_TEST_SCENARIO = null; /* 小游戏无 location 注入, 生产恒为 null */
Platform.initialize();
window.__adService = setupAdService();
`;

// game.json — 抖音小游戏配置(竖屏, 无状态栏)
// V5.0: assets(4.2MB, 全部GLB模型)置于分包, 主包<4MB满足平台上限;
//       MiniGLTFLoader 读包内文件失败时自动 loadSubpackage 后重试
const GAME_JSON = {
    deviceOrientation: 'portrait',
    showStatusBar: false,
    networkTimeout: {
        request: 10000,
        downloadFile: 10000
    },
    subpackages: [
        { root: 'assets/', name: 'assets' }
    ]
};

// game-config.js — 上线前必填(广告位ID由抖音流量主后台分配; 留空则广告如实降级不可用)
const GAME_CONFIG_JS = `// ===== 抖音小游戏平台配置 (构建生成, 上线前必查) =====
// 广告位ID获取: 抖音开放平台 → 流量主 → 广告位管理 → 激励视频
window.__GAME_SETTINGS = {
    ads: {
        douyin: {
            rewardVideo: ''  // TODO(上线): 填入激励视频广告位ID, 留空则广告功能不可用
        }
    }
};
`;

// 入口 game.js: 环境模拟 + THREE/GLTFLoader 接线 + bundle 加载
const ENTRY_JS = `// ===== 抖音小游戏入口 (V5.0 构建产物, 源于 tools/build-douyin.js) =====
'use strict';
/* eslint-disable */

/* ==================================================================
 * 1. 小游戏环境模拟层(游戏代码所需的最小子集, 不做通用 polyfill)
 * ================================================================== */
(function setupMiniGameEnv() {
    var G = typeof GameGlobal !== 'undefined' ? GameGlobal
        : (typeof global !== 'undefined' ? global : this);
    G.__mgGlobal = G;

    var sysInfo = tt.getSystemInfoSync();
    G.__sysInfo = sysInfo;
    var mainCanvas = tt.createCanvas();
    mainCanvas.width = sysInfo.windowWidth * sysInfo.pixelRatio;
    mainCanvas.height = sysInfo.windowHeight * sysInfo.pixelRatio;
    mainCanvas.clientWidth = sysInfo.windowWidth;
    mainCanvas.clientHeight = sysInfo.windowHeight;
    // world.resize 依赖 canvas.parentElement.clientWidth
    mainCanvas.parentElement = { clientWidth: sysInfo.windowWidth, clientHeight: sysInfo.windowHeight };

    /* ---- 图片对象: tt.createImage 外观层(拦截 blob: URL → data URI) ---- */
    var BLOB_REGISTRY = {};
    G.__blobRegistry = BLOB_REGISTRY;
    function makeImage() {
        var impl = tt.createImage();
        var facade = {};
        facade._impl = impl;
        facade.onload = null; facade.onerror = null;
        impl.onload = function() {
            facade.width = impl.width; facade.height = impl.height;
            if (facade.onload) facade.onload();
        };
        impl.onerror = function() { if (facade.onerror) facade.onerror(); };
        Object.defineProperty(facade, 'src', {
            get: function() { return impl.src; },
            set: function(v) {
                if (v && v.indexOf && v.indexOf('blob:') === 0 && BLOB_REGISTRY[v]) v = BLOB_REGISTRY[v];
                try { impl.src = v; } catch (e) { if (facade.onerror) facade.onerror(e); }
            }
        });
        facade.crossOrigin = null;
        return facade;
    }
    G.__makeImage = makeImage;

    /* ---- Blob / URL.createObjectURL: GLTFLoader 内嵌贴图走 Blob→objectURL 路径 ---- */
    function Blob(parts, opts) {
        var total = 0, i;
        var views = [];
        for (i = 0; parts && i < parts.length; i++) {
            var p = parts[i];
            if (p instanceof ArrayBuffer) { views.push(new Uint8Array(p)); total += p.byteLength; }
            else if (p && p.buffer) { views.push(new Uint8Array(p.buffer, p.byteOffset, p.byteLength)); total += p.byteLength; }
        }
        var bytes = new Uint8Array(total);
        var off = 0;
        for (i = 0; i < views.length; i++) { bytes.set(views[i], off); off += views[i].length; }
        this._bytes = bytes;
        this.type = (opts && opts.type) || '';
    }
    G.Blob = Blob;

    var blobSeq = 0;
    function bytesToBase64(bytes) {
        var CHUNK = 0x8000, bin = '';
        for (var i = 0; i < bytes.length; i += CHUNK) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
        }
        return btoa(bin);
    }
    var URLShim = {
        createObjectURL: function(blob) {
            var id = 'blob:mg-' + (++blobSeq);
            var mime = blob.type || 'image/png';
            BLOB_REGISTRY[id] = 'data:' + mime + ';base64,' + bytesToBase64(blob._bytes);
            return id;
        },
        revokeObjectURL: function(id) { delete BLOB_REGISTRY[id]; }
    };
    G.URL = G.URL || URLShim;
    if (!G.URL.createObjectURL) G.URL.createObjectURL = URLShim.createObjectURL;
    if (!G.URL.revokeObjectURL) G.URL.revokeObjectURL = URLShim.revokeObjectURL;

    /* ---- document 模拟 ---- */
    G.document = {
        createElement: function(tag) {
            if (tag === 'canvas') return tt.createCanvas();
            if (tag === 'img') return makeImage();
            // div 等UI元素: 空壳(游戏对UI引用均判空, 仅error兜底会appendChild)
            return {
                style: {}, children: [],
                appendChild: function() {}, remove: function() {}, removeChild: function() {},
                set textContent(v) {}, get textContent() { return ''; },
                set innerHTML(v) {}, get innerHTML() { return ''; },
                addEventListener: function() {}, classList: { add: function(){}, remove: function(){}, toggle: function(){} }
            };
        },
        createElementNS: function(ns, tag) { return this.createElement(tag); },
        getElementById: function() { return null; },
        addEventListener: function() {},
        removeEventListener: function() {},
        body: {
            appendChild: function(node) { if (node && node.remove) node.remove(); return node; },
            removeChild: function() {}
        },
        images: [],
        hidden: false,
        visibilityState: 'visible'
    };

    /* ---- window 模拟 ---- */
    G.window = {
        innerWidth: sysInfo.windowWidth,
        innerHeight: sysInfo.windowHeight,
        devicePixelRatio: sysInfo.pixelRatio,
        addEventListener: function() {},
        removeEventListener: function() {},
        location: { search: '', href: 'game://douyin/', hostname: '', protocol: 'game:' },
        localStorage: null, // 明确置空: 平台层走 TtStorageAdapter
        navigator: { userAgent: 'douyin-minigame' }
    };
    G.navigator = G.window.navigator;
    G.location = G.window.location;
    if (!G.performance) G.performance = { now: function() { return Date.now(); } };
    G.window.performance = G.performance;
    G.requestAnimationFrame = G.requestAnimationFrame || function(cb) { return setTimeout(function() { cb(Date.now()); }, 16); };
    G.window.requestAnimationFrame = G.requestAnimationFrame;
    G.cancelAnimationFrame = G.cancelAnimationFrame || function(id) { clearTimeout(id); };
    if (typeof G.URLSearchParams === 'undefined') {
        G.URLSearchParams = function(search) {
            this.get = function() { return null; };
        };
    }

    /* ---- 触控桥接: canvas.addEventListener → tt 全局触控 ---- */
    var touchHandlers = { touchstart: [], touchmove: [], touchend: [], touchcancel: [] };
    mainCanvas.addEventListener = function(type, fn) {
        if (touchHandlers[type]) touchHandlers[type].push(fn);
    };
    mainCanvas.removeEventListener = function(type, fn) {
        var list = touchHandlers[type];
        if (!list) return;
        var i = list.indexOf(fn);
        if (i >= 0) list.splice(i, 1);
    };
    function dispatch(type, e) {
        var list = touchHandlers[type] || [];
        var evt = {
            preventDefault: function() {},
            touches: (e.touches || []).map(function(t) {
                return { clientX: t.clientX, clientY: t.clientY, identifier: t.id };
            }),
            changedTouches: (e.changedTouches || []).map(function(t) {
                return { clientX: t.clientX, clientY: t.clientY, identifier: t.id };
            })
        };
        for (var i = 0; i < list.length; i++) {
            try { list[i](evt); } catch (err) { console.error('[touch]', type, err); }
        }
    }
    tt.onTouchStart(function(e) { dispatch('touchstart', e); });
    tt.onTouchMove(function(e) { dispatch('touchmove', e); });
    tt.onTouchEnd(function(e) { dispatch('touchend', e); });
    tt.onTouchCancel(function(e) { dispatch('touchcancel', e); });

    /* ---- GLTFLoader 小游戏适配: GLB 包内文件走 FileSystemManager 读取 + parse ----
     * H5 的 THREE.FileLoader 依赖 XHR/fetch, 小游戏不存在。
     * 包内资产用 tt.getFileSystemManager().readFile 读为 ArrayBuffer 后调 GLTFLoader.parse。
     * V5.0: assets 为分包 — readFile 失败时自动 loadSubpackage('assets') 后重试一次。 */
    var assetsPkgPromise = null;
    function ensureAssetsSubpackage() {
        if (!assetsPkgPromise) {
            assetsPkgPromise = new Promise(function(resolve) {
                tt.loadSubpackage({
                    name: 'assets',
                    success: function() { resolve(true); },
                    fail: function(err) { console.warn('[分包] assets 加载失败', err); resolve(false); }
                });
            });
        }
        return assetsPkgPromise;
    }
    G.__ensureAssetsSubpackage = ensureAssetsSubpackage;
    G.__installMiniGLTFLoader = function() {
        if (!THREE || !THREE.GLTFLoader) return;
        var RealGLTFLoader = THREE.GLTFLoader;
        function MiniGLTFLoader() {
            this._impl = new RealGLTFLoader();
        }
        MiniGLTFLoader.prototype._readFile = function(filePath, onLoad, onError, retried) {
            var self = this;
            var fsm = tt.getFileSystemManager();
            fsm.readFile({
                filePath: filePath,
                success: function(res) {
                    try {
                        self._impl.parse(res.data, '', onLoad, onError);
                    } catch (err) { if (onError) onError(err); }
                },
                fail: function(err) {
                    if (!retried && filePath.indexOf('assets/') === 0) {
                        // 分包未就绪: 等待 assets 分包加载完成后重试一次
                        ensureAssetsSubpackage().then(function(ok) {
                            if (ok) self._readFile(filePath, onLoad, onError, true);
                            else if (onError) onError(err);
                        });
                        return;
                    }
                    console.error('[GLB] 读取失败:', filePath, err);
                    if (onError) onError(err);
                }
            });
        };
        MiniGLTFLoader.prototype.load = function(url, onLoad, onProgress, onError) {
            var filePath = String(url)
                .replace(/^https?:\\/\\/[^\\/]+\\//, '')
                .replace(/^\\.\\//, '')
                .split('?')[0];
            this._readFile(filePath, onLoad, onError, false);
        };
        MiniGLTFLoader.prototype.parse = function(data, path, onLoad, onError) {
            return this._impl.parse(data, path, onLoad, onError);
        };
        THREE.GLTFLoader = MiniGLTFLoader;
    };
})();

/* ==================================================================
 * 2. three.js + GLTFLoader 接线(UMD → CJS require, 挂到全局)
 * ================================================================== */
var THREE = require('./libs/three.min.js');
if (typeof GameGlobal !== 'undefined') GameGlobal.THREE = THREE;
if (typeof global !== 'undefined') global.THREE = THREE;
window.THREE = THREE;

/* ==================================================================
 * 3. 游戏代码 bundle(单一模块作用域, 全部脚本共享顶层声明)
 * ================================================================== */
require('./game-bundle.js');

/* ==================================================================
 * 4. 启动
 * ================================================================== */
try {
    __installMiniGLTFLoader();
    window.__game = typeof Game !== 'undefined' ? new Game() : null;
    if (!window.__game) throw new Error('Game 类未定义 — bundle 加载不完整');
} catch (err) {
    console.error('[启动错误]', err && err.stack || err);
}
`;

function mustRead(rel) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) {
        throw new Error('[build:douyin] 必需文件缺失: ' + rel + '（V5.0起缺失直接报错, 不再静默跳过）');
    }
    return fs.readFileSync(src, 'utf8');
}

function copyTo(srcRel) {
    const src = path.join(ROOT, srcRel);
    if (!fs.existsSync(src)) {
        throw new Error('[build:douyin] 必需文件缺失: ' + srcRel);
    }
    const dst = path.join(OUT, srcRel);
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

/** 构建单一作用域 bundle: 头部THREE接线 + 按序拼接全部脚本 + 引导 + game.js */
function buildBundle() {
    const parts = [];
    parts.push(`// ===== game-bundle.js (V5.0 构建产物: 单一模块作用域, 源脚本按 index.html 顺序拼接) =====
// 生成: tools/build-douyin.js @ ${new Date().toISOString()}
var THREE = (function() {
    var m = require('./libs/three.min.js');
    return (m && m.WebGLRenderer) ? m : (m && m.default ? m.default : m);
})();
this.THREE = THREE;
`);

    for (const rel of GAME_SCRIPTS) {
        const code = mustRead(rel);
        parts.push(`/* ===== [[ ${rel} ]] ===== */\n` + code + '\n');
        if (rel === 'js/vendor/GLTFLoader.js') {
            // vendor 包装以 THREE 为参数执行完毕后, 接入小游戏 GLB 读取包装
            parts.push(`/* 小游戏GLB文件读取适配(GLTFLoader.load → FileSystemManager.readFile + parse) */
if (typeof __installMiniGLTFLoader === 'function') __installMiniGLTFLoader();
`);
        }
        // index.html 中引导脚本位于 ads 装配之后、game.js 之前
        if (rel === 'js/ads/game-ad-coordinator.js') {
            parts.push(BOOTSTRAP_SNIPPET);
        }
    }
    return parts.join('\n');
}

function main() {
    console.log('[build:douyin] 清理旧产物...');
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });

    console.log('[build:douyin] 构建 bundle...');
    const bundle = buildBundle();
    fs.writeFileSync(path.join(OUT, 'game-bundle.js'), bundle);

    // 产物自检: 关键类必须出现在 bundle 中
    const requiredSymbols = ['class Game', 'class Squad', 'class EnemyManager', 'class World',
        'class PlatformAdapter', 'var Platform', 'class DouyinAdService', 'setupAdService',
        'THREE.GLTFLoader=GLTFLoader', 'SoldierModelLoader', 'EnemyModelLoader', 'V42Art'];
    const missing = requiredSymbols.filter(s => bundle.indexOf(s) === -1);
    if (missing.length) {
        throw new Error('[build:douyin] bundle 自检失败, 缺少符号: ' + missing.join(', '));
    }

    console.log('[build:douyin] 复制 three.js 与资源...');
    copyTo('libs/three.min.js');
    copyTo('assets');

    console.log('[build:douyin] 生成入口与配置...');
    fs.writeFileSync(path.join(OUT, 'game.js'), ENTRY_JS);
    fs.writeFileSync(path.join(OUT, 'game.json'), JSON.stringify(GAME_JSON, null, 2));
    fs.writeFileSync(path.join(OUT, 'game-config.js'), GAME_CONFIG_JS);

    // 产物完整性自检: 入口引用的文件必须存在
    const entryRefs = ['game-bundle.js', 'libs/three.min.js', 'game-config.js', 'game.json'];
    for (const ref of entryRefs) {
        if (!fs.existsSync(path.join(OUT, ref))) {
            throw new Error('[build:douyin] 产物自检失败: ' + ref + ' 缺失');
        }
    }

    // 包体统计: 主包(不含分包)受抖音 4MB 上限约束, 整包上限 20MB
    const SUBPKG_ROOTS = (GAME_JSON.subpackages || []).map(s => s.root);
    let mainSize = 0, totalSize = 0;
    (function walk(dir, inSub) {
        for (const entry of fs.readdirSync(dir)) {
            const p = path.join(dir, entry);
            const st = fs.statSync(p);
            if (st.isDirectory()) {
                walk(p, inSub || SUBPKG_ROOTS.some(r => p === path.join(OUT, r.replace(/\/$/, ''))));
            } else {
                totalSize += st.size;
                if (!inSub) mainSize += st.size;
            }
        }
    })(OUT, false);
    const mbMain = (mainSize / 1024 / 1024).toFixed(2);
    const mbTotal = (totalSize / 1024 / 1024).toFixed(2);
    console.log('[build:douyin] 完成 → dist/douyin/  (主包 ' + mbMain + ' MB / 整包 ' + mbTotal + ' MB)');
    if (mainSize > 4 * 1024 * 1024) {
        throw new Error('[build:douyin] 主包 ' + mbMain + ' MB 超过抖音 4MB 上限 — 需扩大分包或精简资产');
    }
    if (totalSize > 20 * 1024 * 1024) {
        throw new Error('[build:douyin] 整包 ' + mbTotal + ' MB 超过抖音 20MB 上限');
    }
    console.log('  导入: 抖音开发者工具 → 打开 dist/douyin 目录');
    console.log('  上线前必查: game-config.js 广告位ID / 真机预览(见 docs/V50_DOUYIN_RELEASE.md)');
}

main();
