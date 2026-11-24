// ==================================================================
// 膨胀小队 — 微信小游戏入口 (V12, 由 tools/build-wechat.js 生成)
// 结构: 环境模拟层 → minidom UI 运行时 → THREE/GLTFLoader 接线 → 游戏 bundle → 启动
// 设计: 游戏核心代码(game-bundle.js)与 H5 完全同一份, 平台差异全部收敛在本入口
// ==================================================================
'use strict';

// Critical art shares the model subpackage; preload before minidom requests images.
function __bootMilitaryGame() {
/* eslint-disable */

/** 跨环境全局写入: 微信 GameGlobal 可直写; 浏览器模拟器只读属性用 defineProperty */
function __gdef(obj, name, value) {
    try { obj[name] = value; return; } catch (e) {}
    try { Object.defineProperty(obj, name, { value: value, configurable: true, writable: true }); } catch (e2) {}
}

/* ==================================================================
 * 1. 全局环境模拟层(游戏代码所需的最小子集)
 * ================================================================== */
(function setupWechatEnv() {
    var G = typeof GameGlobal !== 'undefined' ? GameGlobal
        : (typeof globalThis !== 'undefined' ? globalThis : this);
    G.__mgGlobal = G;

    var sysInfo = wx.getSystemInfoSync();
    G.__sysInfo = sysInfo;

    // 安全区(wx safeArea → env(safe-area-inset-*))
    var safe = { top: 0, bottom: 0, left: 0, right: 0 };
    if (sysInfo.safeArea) {
        safe.top = Math.max(0, sysInfo.safeArea.top - (sysInfo.statusBarHeight || 0) * 0 || sysInfo.safeArea.top);
        safe.bottom = Math.max(0, sysInfo.screenHeight - sysInfo.safeArea.bottom);
        safe.left = Math.max(0, sysInfo.safeArea.left);
        safe.right = Math.max(0, sysInfo.screenWidth - sysInfo.safeArea.right);
    }
    if (sysInfo.statusBarHeight) safe.top = Math.max(safe.top, sysInfo.statusBarHeight);
    G.__safeArea = safe;

    var viewportW = sysInfo.windowWidth || sysInfo.screenWidth || 390;
    var viewportH = sysInfo.windowHeight || sysInfo.screenHeight || 844;
    var DPR = sysInfo.pixelRatio || 2;

    /* ---- 主屏 canvas(首次 createCanvas 即上屏画布) ---- */
    var mainCanvas = wx.createCanvas();
    mainCanvas.width = Math.round(viewportW * DPR);
    mainCanvas.height = Math.round(viewportH * DPR);
    G.__mainCanvas = mainCanvas;

    /* ---- minidom UI 运行时 ---- */
    var MiniDOMMod = require('./minidom.js');
    var uiDomSpec = require('./ui-dom.js');
    var uiCss = require('./ui-css.js');

    var runtime = MiniDOMMod.createRuntime({
        domSpec: uiDomSpec,
        cssTexts: uiCss,
        width: viewportW,
        height: viewportH,
        dpr: DPR,
        safeArea: safe,
        mainCanvas: mainCanvas,
        createCanvas: function () { return wx.createCanvas(); },
        createImage: function () {
            var img = wx.createImage();
            var proto = Object.getPrototypeOf(img);
            var desc = Object.getOwnPropertyDescriptor(img, 'src') || (proto && Object.getOwnPropertyDescriptor(proto, 'src'));
            if (desc && desc.set && desc.configurable) {
                Object.defineProperty(img, 'src', {
                    configurable: true,
                    get: function () { return desc.get ? desc.get.call(img) : ''; },
                    set: function (v) {
                        var raw = String(v || '');
                        if (raw.indexOf('/wechat-game/') === 0) { desc.set.call(img, raw); return; }
                        var s = raw.replace(/^\/+/, '');
                        if (/^assets\/game\/(?!models\/)/.test(s)) s = 'art/' + s.slice('assets/game/'.length);
                        desc.set.call(img, s);
                    }
                });
            }
            return img;
        },
        loadText: function (path) {
            return new Promise(function (resolve, reject) {
                var fsm = wx.getFileSystemManager();
                fsm.readFile({
                    filePath: path,
                    encoding: 'utf8',
                    success: function (res) { resolve(res.data); },
                    fail: function (err) { reject(err); }
                });
            });
        },
        onRepaint: function () { if (runtime && runtime._texture) runtime._texture.needsUpdate = true; },
        onReload: function () { G.__softRestart && G.__softRestart(); }
    });
    G.__minidom = runtime;

    // window / document / navigator / localStorage 语义注入(bundle 脚本共享此全局)
    // 兼容: 微信 GameGlobal 可直写; 浏览器模拟器中 window 属性为 getter → defineProperty 覆盖
    __gdef(G, 'self', G);
    __gdef(G, 'window', runtime.window);
    __gdef(G, 'document', runtime.document);
    __gdef(G, 'global', G);
    if (!G.performance) __gdef(G, 'performance', runtime.window.performance);

    /* ---- UI 纹理: 光栅化画布 → CanvasTexture(启动后在 3D 场景叠加) ---- */
    runtime.attachThreeTexture = function (THREE, scene, camera, renderer) {
        try {
            var tex = new THREE.CanvasTexture(runtime.rasterCanvas);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = false;
            runtime._texture = tex;
            var uiScene = new THREE.Scene();
            var aspect = viewportW / viewportH;
            var hWorld = 10;
            var wWorld = hWorld * aspect;
            var uiCam = new THREE.OrthographicCamera(-wWorld / 2, wWorld / 2, hWorld / 2, -hWorld / 2, 0.1, 10);
            uiCam.position.z = 1;
            var plane = new THREE.PlaneGeometry(wWorld, hWorld);
            var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
            var mesh = new THREE.Mesh(plane, mat);
            mesh.renderOrder = 9999;
            mesh.frustumCulled = false;
            uiScene.add(mesh);
            G.__uiScene = uiScene;
            G.__uiCamera = uiCam;
            // 每帧主渲染后叠加 UI(renderer 由 game.js 循环调用 render)
            // V12修复: autoClear=false + 帧首手动清屏 — 否则第二遍渲染(UI层)会把主场景清掉(黑屏)
            renderer.autoClear = false;
            var origRender = renderer.render.bind(renderer);
            renderer.render = function (scene2, cam2) {
                renderer.clear(true, true, true);
                origRender(scene2, cam2);
                runtime.tick(G.performance.now());
                origRender(uiScene, uiCam);
            };
            return true;
        } catch (e) {
            console.error('[minidom] UI 纹理装配失败', e);
            return false;
        }
    };

    /* ---- 触控桥接: wx 触摸 → minidom 命中(未命中转发游戏画布) ---- */
    var canvasHandlers = {}; // 游戏在 mainCanvas 上注册的监听
    mainCanvas.addEventListener = function (type, fn) {
        (canvasHandlers[type] = canvasHandlers[type] || []).push(fn);
    };
    mainCanvas.removeEventListener = function (type, fn) {
        var arr = canvasHandlers[type];
        if (arr) { var i = arr.indexOf(fn); if (i !== -1) arr.splice(i, 1); }
    };
    function toTouchList(t) {
        return [{
            identifier: t.identifier !== undefined ? t.identifier : 0,
            clientX: t.clientX, clientY: t.clientY,
            pageX: t.clientX, pageY: t.clientY
        }];
    }
    function forwardToCanvas(type, e) {
        var arr = canvasHandlers[type];
        if (!arr) return;
        var ev = {
            type: type,
            touches: e.touches, changedTouches: e.changedTouches || e.touches,
            clientX: e.touches && e.touches[0] ? e.touches[0].clientX : 0,
            clientY: e.touches && e.touches[0] ? e.touches[0].clientY : 0,
            preventDefault: function () {}, stopPropagation: function () {}
        };
        for (var i = 0; i < arr.length; i++) {
            try { arr[i](ev); } catch (err) { console.error('[输入桥接] ' + type + ' 处理异常', err); }
        }
    }
    wx.onTouchStart(function (e) {
        var t = e.touches && e.touches[0] ? e.touches : (e.changedTouches || []);
        var consumed = runtime.dispatchTouch('start', t);
        if (!consumed) forwardToCanvas('touchstart', e);
    });
    wx.onTouchMove(function (e) {
        var t = e.touches && e.touches[0] ? e.touches : [];
        var consumed = runtime.dispatchTouch('move', t);
        if (!consumed) forwardToCanvas('touchmove', e);
    });
    wx.onTouchEnd(function (e) {
        var t = e.changedTouches && e.changedTouches[0] ? e.changedTouches : [];
        var consumed = runtime.dispatchTouch('end', t);
        if (!consumed) forwardToCanvas('touchend', e);
    });
    wx.onTouchCancel(function (e) {
        var t = e.changedTouches && e.changedTouches[0] ? e.changedTouches : [];
        runtime.dispatchTouch('cancel', t);
        forwardToCanvas('touchcancel', e);
    });
    if (wx.onWindowResize) {
        wx.onWindowResize(function (res) {
            var w = (res && res.windowWidth) || sysInfo.windowWidth;
            var h = (res && res.windowHeight) || sysInfo.windowHeight;
            runtime.setViewport(w, h, DPR);
            runtime.window._fire('resize', {});
        });
    }
})();

/* ==================================================================
 * 1.5 小游戏 GLB 文件读取适配 — 必须在 bundle 执行前定义
 * (bundle 内 GLTFLoader 段后会调用 __installMiniGLTFLoader(); game.js IIFE 随 bundle 自启动,
 *  若在 bundle 后才安装, 首批模型加载会走未适配的 fetch 路径直接失败)
 * ================================================================== */
(function installMiniGLTFLoaderDef() {
    function install() {
        var T = (typeof THREE !== 'undefined') ? THREE : window.THREE;
        if (!T || !T.GLTFLoader || T.GLTFLoader.__miniInstalled) return;
        T.GLTFLoader.__miniInstalled = true;
        T.GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
            var self = this;
            var fsm = wx.getFileSystemManager();
            function ensureAssetsSubpackage(cb) {
                if (wx.loadSubpackage) {
                    var p = wx.loadSubpackage({ name: 'assets', success: function () { cb(true); }, fail: function () { cb(false); } });
                    if (p && p.then) p.then(function () { cb(true); }).catch(function () { cb(false); });
                    else setTimeout(function () { cb(true); }, 200);
                } else cb(false);
            }
            function attempt(retriesLeft) {
                fsm.readFile({
                    filePath: url.replace(/^\//, ''),
                    success: function (res) {
                        var buf = (typeof res.data === 'string') ? str2ab(res.data) : res.data;
                        try {
                            if (onProgress && onProgress.call) { try { onProgress({ loaded: buf.byteLength, total: buf.byteLength }); } catch (e2) {} }
                            self.parse(buf, '', function (gltf) {
                                if (onLoad) onLoad(gltf);
                            }, function (err) {
                                console.error('[GLB] parse 失败: ' + url, err);
                                if (onError) onError(err);
                            });
                        } catch (e) {
                            console.error('[GLB] parse 异常: ' + url, e);
                            if (onError) onError(e);
                        }
                    },
                    fail: function (err) {
                        if (retriesLeft > 0) {
                            ensureAssetsSubpackage(function () {
                                setTimeout(function () { attempt(retriesLeft - 1); }, 150);
                            });
                        } else {
                            console.error('[GLB] 读取失败: ' + url, err && err.errMsg || err);
                            if (onError) onError(err);
                        }
                    }
                });
            }
            attempt(3);
        };
        console.log('[GLB] MiniGLTFLoader 已安装(包内文件读取)');
    }
    function str2ab(s) {
        var b = new Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xFF;
        return b.buffer;
    }
    window.__installMiniGLTFLoader = install;
})();

/* ==================================================================
 * 1.5 小游戏 GLB 文件读取适配 — 必须在 bundle 执行前定义
 * (bundle 内 GLTFLoader 段后会调用 __installMiniGLTFLoader(); game.js IIFE 随 bundle 自启动,
 *  若在 bundle 后才安装, 首批模型加载会走未适配的 fetch 路径直接失败)
 * ================================================================== */
(function installMiniGLTFLoaderDef() {
    function install() {
        var T = (typeof THREE !== 'undefined') ? THREE : window.THREE;
        if (!T || !T.GLTFLoader || T.GLTFLoader.__miniInstalled) return;
        T.GLTFLoader.__miniInstalled = true;
        T.GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
            var self = this;
            var fsm = wx.getFileSystemManager();
            function ensureAssetsSubpackage(cb) {
                if (wx.loadSubpackage) {
                    var p = wx.loadSubpackage({ name: 'assets', success: function () { cb(true); }, fail: function () { cb(false); } });
                    if (p && p.then) p.then(function () { cb(true); }).catch(function () { cb(false); });
                    else setTimeout(function () { cb(true); }, 200);
                } else cb(false);
            }
            function attempt(retriesLeft) {
                fsm.readFile({
                    filePath: url.replace(/^\//, ''),
                    success: function (res) {
                        var buf = (typeof res.data === 'string') ? str2ab(res.data) : res.data;
                        try {
                            if (onProgress && onProgress.call) { try { onProgress({ loaded: buf.byteLength, total: buf.byteLength }); } catch (e2) {} }
                            self.parse(buf, '', function (gltf) {
                                if (onLoad) onLoad(gltf);
                            }, function (err) {
                                console.error('[GLB] parse 失败: ' + url, err);
                                if (onError) onError(err);
                            });
                        } catch (e) {
                            console.error('[GLB] parse 异常: ' + url, e);
                            if (onError) onError(e);
                        }
                    },
                    fail: function (err) {
                        if (retriesLeft > 0) {
                            ensureAssetsSubpackage(function () {
                                setTimeout(function () { attempt(retriesLeft - 1); }, 150);
                            });
                        } else {
                            console.error('[GLB] 读取失败: ' + url, err && err.errMsg || err);
                            if (onError) onError(err);
                        }
                    }
                });
            }
            attempt(3);
        };
        console.log('[GLB] MiniGLTFLoader 已安装(包内文件读取)');
    }
    function str2ab(s) {
        var b = new Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xFF;
        return b.buffer;
    }
    window.__installMiniGLTFLoader = install;
})();

/* ==================================================================
 * 1.5 小游戏 GLB 文件读取适配 — 必须在 bundle 执行前定义
 * (bundle 内 GLTFLoader 段后会调用 __installMiniGLTFLoader(); game.js IIFE 随 bundle 自启动,
 *  若在 bundle 后才安装, 首批模型加载会走未适配的 fetch 路径直接失败)
 * ================================================================== */
(function installMiniGLTFLoaderDef() {
    function install() {
        var T = (typeof THREE !== 'undefined') ? THREE : window.THREE;
        if (!T || !T.GLTFLoader || T.GLTFLoader.__miniInstalled) return;
        T.GLTFLoader.__miniInstalled = true;
        T.GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
            var self = this;
            var fsm = wx.getFileSystemManager();
            function ensureAssetsSubpackage(cb) {
                if (wx.loadSubpackage) {
                    var p = wx.loadSubpackage({ name: 'assets', success: function () { cb(true); }, fail: function () { cb(false); } });
                    if (p && p.then) p.then(function () { cb(true); }).catch(function () { cb(false); });
                    else setTimeout(function () { cb(true); }, 200);
                } else cb(false);
            }
            function attempt(retriesLeft) {
                fsm.readFile({
                    filePath: url.replace(/^\//, ''),
                    success: function (res) {
                        var buf = (typeof res.data === 'string') ? str2ab(res.data) : res.data;
                        try {
                            if (onProgress && onProgress.call) { try { onProgress({ loaded: buf.byteLength, total: buf.byteLength }); } catch (e2) {} }
                            self.parse(buf, '', function (gltf) {
                                if (onLoad) onLoad(gltf);
                            }, function (err) {
                                console.error('[GLB] parse 失败: ' + url, err);
                                if (onError) onError(err);
                            });
                        } catch (e) {
                            console.error('[GLB] parse 异常: ' + url, e);
                            if (onError) onError(e);
                        }
                    },
                    fail: function (err) {
                        if (retriesLeft > 0) {
                            ensureAssetsSubpackage(function () {
                                setTimeout(function () { attempt(retriesLeft - 1); }, 150);
                            });
                        } else {
                            console.error('[GLB] 读取失败: ' + url, err && err.errMsg || err);
                            if (onError) onError(err);
                        }
                    }
                });
            }
            attempt(3);
        };
        console.log('[GLB] MiniGLTFLoader 已安装(包内文件读取)');
    }
    function str2ab(s) {
        var b = new Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xFF;
        return b.buffer;
    }
    window.__installMiniGLTFLoader = install;
})();

/* ==================================================================
 * 1.8 bundle 全局环境表 — 必须先于 THREE/bundle 的 require 装配:
 * three.min.js 的 ImageLoader 等闭包捕获模块作用域的 document/window 参数,
 * 若晚于 require 装配, 纹理加载会走真实 DOM 路径(模拟器)或在微信端未定义.
 * ================================================================== */
var __G = (typeof GameGlobal !== 'undefined') ? GameGlobal : (typeof global !== 'undefined' ? global : window);
var __rt = __G.__minidom; // setupWechatEnv 经全局传递
__gdef(__G, '__gameEnv', {
    document: __rt.document,
    window: __rt.window,
    self: __rt.window,
    navigator: __rt.window.navigator,
    location: __rt.window.location,
    performance: __rt.window.performance,
    Image: __rt.window.Image,
    Blob: __rt.window.Blob,
    URL: __rt.window.URL,
    localStorage: null,
    requestAnimationFrame: __rt.window.requestAnimationFrame,
    cancelAnimationFrame: __rt.window.cancelAnimationFrame,
    setTimeout: setTimeout, clearTimeout: clearTimeout,
    setInterval: setInterval, clearInterval: clearInterval
});

/* ==================================================================
 * 2. three.js + GLTFLoader 接线(UMD → CJS require, 挂到全局)
 * ================================================================== */
var THREE = require('./libs/three.min.js');
if (typeof GameGlobal !== 'undefined') GameGlobal.THREE = THREE;
if (typeof global !== 'undefined') global.THREE = THREE;
window.THREE = THREE;

/* ==================================================================
 * 3. 平台配置(广告位ID等 — 构建 game-config.js, 上线前必查)
 * ================================================================== */
require('./game-config.js');

/* ==================================================================
 * 4. bundle 全局环境表(内联脚本+bundle 均经此拿到 minidom 语义)
 * 说明: 微信 GameGlobal 可直写 window/document; 但浏览器模拟器中
 *       window.document 为不可配置 getter — 故 bundle 用参数遮蔽方案
 * ================================================================== */


/* ==================================================================
 * 5. 游戏代码 bundle(单一模块作用域; index.html 内联脚本已由构建并入 bundle 头部)
 * ================================================================== */
require('./game-bundle.js');

/* ---- bundle 内通过 window.X 显式导出的模块(V42Art/GateCombos/SoldierModelLoader 等)
 *      落在遮蔽 window(普通对象)上; bundle 内裸标识符消费走真实全局链 — 回填真实全局。
 *      (H5 中 window.X 即全局, 无此问题; 抖音 bundle 同样存在此隐患, V12 一并修复) ---- */
(function exposeBundleGlobals() {
    var real = __G;
    var src = __rt.window;
    var SKIP = { window: 1, document: 1, self: 1, navigator: 1, location: 1, performance: 1,
        Image: 1, Blob: 1, URL: 1, localStorage: 1, requestAnimationFrame: 1,
        cancelAnimationFrame: 1, top: 1, parent: 1, frames: 1, console: 1, game: 1 };
    for (var k in src) {
        if (SKIP[k]) continue;
        if (k.charAt(0) === '_' && k !== '__game') continue;
        if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
        if (real[k] !== undefined) continue;
        try { real[k] = src[k]; } catch (e) {}
    }
    // __game 为异步赋值(模型加载完成后 new Game) — 用活桥双向同步, 测试/宿主轮询始终可读
    try {
        Object.defineProperty(real, '__game', {
            get: function () { return src.__game; },
            set: function (v) { src.__game = v; },
            configurable: true
        });
    } catch (e6) {
        try { real.__game = src.__game; } catch (e7) {}
    }
    // __adService / 版本与平台标识同理(BOOTSTRAP 在 bundle 内赋值到遮蔽 window)
    ['__adService', '__GAME_VERSION', '__platformId', '__AD_TEST_SCENARIO'].forEach(function (k2) {
        try {
            Object.defineProperty(real, k2, {
                get: function () { return src[k2]; },
                set: function (v) { src[k2] = v; },
                configurable: true
            });
        } catch (e8) {
            try { real[k2] = src[k2]; } catch (e9) {}
        }
    });
})();

/* ==================================================================
 * 6. 小游戏 GLB 文件读取适配 + 启动
 * ================================================================== */
(function bootWechat() {
    var g = typeof GameGlobal !== 'undefined' ? GameGlobal : global;
    var runtime = g.__minidom; // setupWechatEnv 作用域内创建, 经全局传递

    // bundle 内 game.js IIFE 已自启动(boot()); 这里兜底确保实例存在
    setTimeout(function () {
        try {
            if (!window.__game && typeof Game !== 'undefined') window.__game = new Game();
        } catch (err) {
            console.error('[启动错误]', err && err.stack || err);
        }
    }, 50);

    // ---- UI 纹理挂接: Game 构造完成后把 minidom 光栅画布叠进 3D 场景 ----
    var attachTries = 0;
    var attachTimer = setInterval(function () {
        attachTries++;
        var game = window.__game;
        if (game && game.world && game.world.renderer) {
            clearInterval(attachTimer);
            var ok = runtime.attachThreeTexture(THREE, game.world.scene, game.world.camera, game.world.renderer);
            console.log('[minidom] UI 纹理挂接' + (ok ? '成功' : '失败'));
        } else if (attachTries > 300) {
            clearInterval(attachTimer);
            console.error('[minidom] 30s 内未检测到 Game 渲染器, UI 未叠加');
        }
    }, 100);

    // ---- 生命周期: 切后台自动暂停战斗(恢复后由玩家手动继续, 状态不丢失) ----
    if (wx.onHide) {
        wx.onHide(function () {
            var game = window.__game;
            if (game && game.state === 'playing' && !game.paused) {
                try { game._togglePause(); } catch (e) { console.error('[生命周期] 自动暂停失败', e); }
            }
            console.log('[生命周期] onHide — 战斗已自动暂停');
        });
    }
    if (wx.onShow) {
        wx.onShow(function () {
            console.log('[生命周期] onShow — 保持暂停态, 玩家手动恢复');
        });
    }
    // ---- 错误捕获(小游戏全局) ----
    if (wx.onError) {
        wx.onError(function (msg) {
            console.error('[wx.onError]', msg);
        });
    }
})();

}
var __militaryBooted = false;
function __launchMilitaryGame() {
    if (__militaryBooted) return;
    __militaryBooted = true; __bootMilitaryGame();
}
if (wx.loadSubpackage) {
    var __artPackagesRemaining = 2;
    function __artPackageLoaded() { if (--__artPackagesRemaining === 0) __launchMilitaryGame(); }
    wx.loadSubpackage({ name: 'assets', success: __artPackageLoaded, fail: __artPackageLoaded });
    wx.loadSubpackage({ name: 'art', success: __artPackageLoaded, fail: __artPackageLoaded });
} else __launchMilitaryGame();
