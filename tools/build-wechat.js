// ==================================================================
// tools/build-wechat.js — 微信小游戏 V1.0 构建脚本 (V12)
// 产物: wechat-game/ (可直接导入微信开发者工具)
//   game.js            入口(环境模拟+minidom+THREE接线+启动)
//   minidom.js         UI 引擎(html-parser + css-parser + minidom 拼接)
//   ui-dom.js          index.html <body> 转出的 UI DOM 树 JSON
//   ui-css.js          4 张 CSS 原文(运行时级联)
//   game-bundle.js     游戏脚本单作用域拼接(与 H5 同源代码, 头部含 index.html 内联脚本)
//   game-config.js     平台配置(广告位ID, 上线前必填)
//   game.json / project.config.json
//   libs/three.min.js  r149
//   assets/            分包: 仅运行时需要的 GLB + SVG(排除源纹理/文档)
//   assets-manifest.json 资源清单(优先级P0-P3/大小, 供包体审计)
// 自检: bundle 必须含 [[ js/game.js ]] 段(修抖音构建假阳性教训), 包体预算硬校验
// ==================================================================
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'wechat-game');

// 游戏脚本清单 — 与 index.html 加载顺序一致(含 js/game.js, 修复抖音构建 P0 缺陷教训)
const GAME_SCRIPTS = [
    'js/config.js',
    'js/utils.js',
    'js/economy.js',
    'js/energy-core.js',
    'js/skills.js',
    'js/affixes.js',
    'js/growth.js',
    'js/classes.js',
    'js/weapons.js',
    'js/tech-tree.js',
    'js/random-events.js',
    'js/leaderboard.js',
    'js/progression.js',
    'js/challenge.js',
    'js/ui-v60.js',
    'js/tutorial.js',
    'js/weapon-showcase.js',
    'js/upgrades.js',
    'js/movement.js',
    'js/vendor/GLTFLoader.js',
    'js/soldier-loader.js',
    'js/soldier-renderer.js',
    'js/enemy-models.js',
    'js/boss-v42.js',
    'js/art-v42.js',
    'js/world.js',
    'js/scenery-v121.js',
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
    'js/ads/game-ad-coordinator.js',
    'js/game.js'
];

// index.html 内联引导(平台初始化+广告装配) — 在 bundle 尾部执行(与 H5 中位置一致)
const BOOTSTRAP_SNIPPET = `
/* ---- index.html 内联引导(等价移植) ---- */
window.__GAME_VERSION = '__GAME_VERSION_PLACEHOLDER__';
window.__AD_TEST_SCENARIO = null; /* 小游戏无 location 注入, 生产恒为 null */
Platform.initialize();
window.__adService = setupAdService();
window.__platformId = Platform.id; /* V12: 供测试/诊断读取 */
`;

// 资源清单: P0=首局必需 P1=当前关卡 P2=后续关卡/Boss P3=非必要展示
const ASSET_RULES = [
    { match: /^assets\/models\/soldier\/(soldier|soldier-lod)\.glb$/, priority: 'P0', role: '士兵模型(首局必需)' },
    { match: /^assets\/models\/zombies\/(normal|fast)\/(normal|fast)(-lod)?\.glb$/, priority: 'P0', role: '基础僵尸(首局必需)' },
    { match: /^assets\/models\/zombies\//, priority: 'P1', role: '特型僵尸' },
    { match: /^assets\/models\/bosses\//, priority: 'P2', role: 'Boss模型' },
    { match: /^assets\/art-v1\/ui\/.*\.svg$/, priority: 'P0', role: 'HUD头像图标' },
    { match: /^assets\/ui-v118\/.*\.png$/, priority: 'P3', role: '军械库界面插图' },
    { match: /\.svg$/, priority: 'P3', role: '矢量图标' }
];

const CSS_FILES = ['style.css', 'style-v42.css', 'style-v51.css', 'style-v60.css', 'style-v120.css', 'style-v118.css', 'style-v130.css', 'style-tutorial.css'];

function mustRead(rel) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) throw new Error('[build:wechat] 必需文件缺失: ' + rel);
    return fs.readFileSync(p, 'utf8');
}

function fmtSize(n) { return (n / 1024 / 1024).toFixed(2) + ' MB'; }

/** index.html → { bodySpec, inlineScripts: {early:[], threeCheck:''}, gameVersion } */
function parseIndexHtml() {
    const html = mustRead('index.html');
    const versionM = html.match(/__GAME_VERSION\s*=\s*'([^']+)'/);
    const gameVersion = versionM ? versionM[1] : 'unknown';

    const bodyStart = html.indexOf('<body>') + '<body>'.length;
    const bodyEnd = html.lastIndexOf('</body>');
    const bodyHtml = html.slice(bodyStart, bodyEnd);

    const inlineScripts = [];
    const re = /<script>([\s\S]*?)<\/script>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        inlineScripts.push(m[1]);
    }
    const early = [];
    let threeCheck = '';
    for (const s of inlineScripts) {
        if (s.indexOf('setupAdService') !== -1) continue; // bundle 尾部引导(BOOTSTRAP_SNIPPET)
        // THREE 加载检测块(需在 THREE 接线之后执行) — 特征: 致命错误 / 本地文件缺失文案
        if (s.indexOf('THREE') !== -1 && (s.indexOf('致命错误') !== -1 || s.indexOf('本地文件缺失') !== -1)) { threeCheck = s; continue; }
        early.push(s);
    }

    const parser = require('./wechat-lib/html-parser.js');
    const nodes = parser.parse(bodyHtml, { stripTags: { script: 1 } });
    const bodySpec = { tag: 'body', attrs: {}, children: nodes };
    return { bodySpec, early, threeCheck, gameVersion };
}

/** 构建单作用域 bundle(头部内联脚本 + 源脚本按序拼接 + GLB适配 + 尾部引导) */
function buildBundle(gameVersion, inlineEarly, inlineThreeCheck) {
    const parts = [];
    parts.push('// ===== game-bundle.js (V12 微信小游戏构建产物: 单一模块作用域, 源脚本按 index.html 顺序拼接) =====\n' +
        '// 生成: tools/build-wechat.js @ ' + new Date().toISOString() + '\n' +
        '// 代码与 H5 完全同源; 平台差异收敛于入口 game.js\n' +
        '/* ==== index.html 内联脚本(BootProgress/错误横幅, H5 中先于业务脚本执行 — 保序) ==== */\n' +
        inlineEarly + '\n' +
        '/* ==== THREE 加载检测(H5 中位于 three.min.js 之后 — THREE 已由入口接线) ==== */\n' +
        inlineThreeCheck + '\n');
    for (const rel of GAME_SCRIPTS) {
        const code = mustRead(rel);
        parts.push('/* ===== [[ ' + rel + ' ]] ===== */\n' + code + '\n');
        if (rel === 'js/vendor/GLTFLoader.js') {
            // 入口定义的包内文件读取适配 — 必须在 game.js 自启动前生效
            parts.push('if (typeof __installMiniGLTFLoader === \'function\') __installMiniGLTFLoader();\n');
        }
    }
    parts.push(BOOTSTRAP_SNIPPET.replace('__GAME_VERSION_PLACEHOLDER__', gameVersion));
    return parts.join('\n');
}

/** 复制运行时资源 → assets/ 并生成清单 */
function copyAssets() {
    const srcRoot = path.join(ROOT, 'assets');
    const outRoot = path.join(OUT, 'assets');
    const manifest = [];
    function walk(rel) {
        const abs = path.join(srcRoot, rel);
        const entries = fs.readdirSync(abs, { withFileTypes: true });
        for (const e of entries) {
            const relPath = rel ? rel + '/' + e.name : e.name;
            if (e.isDirectory()) {
                // 排除目录: textures/(GLB 内嵌, 源文件不进包)
                if (e.name === 'textures') continue;
                walk(relPath);
            } else {
                const lower = e.name.toLowerCase();
                const isGlb = lower.endsWith('.glb');
                const isSvg = lower.endsWith('.svg');
                const isWorldAtlas = relPath === 'art-v121/world-materials.jpg';
                if (!isGlb && !isSvg && !isWorldAtlas) continue; // UI atlas is placed in the main package below.
                const rule = ASSET_RULES.find(r => r.match.test('assets/' + relPath)) || { priority: 'P3', role: 'other' };
                const dst = path.join(outRoot, relPath);
                fs.mkdirSync(path.dirname(dst), { recursive: true });
                fs.copyFileSync(path.join(abs, e.name), dst);
                const stat = fs.statSync(dst);
                manifest.push({
                    path: 'assets/' + relPath,
                    size: stat.size,
                    priority: rule.priority,
                    role: rule.role,
                    sha1: crypto.createHash('sha1').update(fs.readFileSync(dst)).digest('hex').slice(0, 12)
                });
            }
        }
    }
    walk('');
    // Keep the 1.25MB inventory atlas in the main package: assets already uses
    // 3.37MB of its 4MB subpackage budget. It is loaded only when armory opens.
    const uiArt = 'ui-art/weapon-atlas.png';
    fs.mkdirSync(path.join(OUT, 'ui-art'), { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'assets/ui-v118/weapon-atlas.png'), path.join(OUT, uiArt));
    const uiBytes = fs.readFileSync(path.join(OUT, uiArt));
    manifest.push({ path: uiArt, size: uiBytes.length, priority: 'P3', role: '军械库界面插图', package: 'main', sha1: crypto.createHash('sha1').update(uiBytes).digest('hex').slice(0, 12) });
    manifest.sort((a, b) => a.path.localeCompare(b.path));
    fs.writeFileSync(path.join(OUT, 'assets-manifest.json'), JSON.stringify({
        generatedAt: new Date().toISOString(),
        note: '微信小游戏资源清单(构建生成); P0=首局必需, P1=当前关卡, P2=Boss/后续, P3=装饰',
        totalSize: manifest.reduce((s, f) => s + f.size, 0),
        files: manifest
    }, null, 2));
    return manifest;
}

function main() {
    console.log('[build:wechat] 解析 index.html...');
    const { bodySpec, early, threeCheck, gameVersion } = parseIndexHtml();
    console.log('[build:wechat] 游戏版本 ' + gameVersion + '; UI DOM 节点已转换');

    console.log('[build:wechat] 清理旧产物...');
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });
    fs.mkdirSync(path.join(OUT, 'libs'), { recursive: true });

    console.log('[build:wechat] 构建 bundle...');
    const bundle = buildBundle(gameVersion, early.join('\n;\n'), threeCheck);
    fs.writeFileSync(path.join(OUT, 'game-bundle.js'), bundle);

    console.log('[build:wechat] 生成 minidom UI 引擎...');
    const minidomSrc = [
        mustRead('tools/wechat-lib/html-parser.js'),
        mustRead('tools/wechat-lib/css-parser.js'),
        mustRead('tools/wechat-lib/minidom.js')
    ].join('\n\n');
    fs.writeFileSync(path.join(OUT, 'minidom.js'), minidomSrc);

    console.log('[build:wechat] 生成 UI DOM/CSS 模块...');
    fs.writeFileSync(path.join(OUT, 'ui-dom.js'), '// V12 构建产物: index.html <body> 转换的 UI DOM 树\nmodule.exports = ' + JSON.stringify(bodySpec) + ';\n');
    const cssTexts = CSS_FILES.map(f => mustRead(f).replace(/assets\/ui-v118\//g, 'ui-art/'));
    fs.writeFileSync(path.join(OUT, 'ui-css.js'), '// V12 构建产物: 项目全部样式表原文(运行时级联)\nmodule.exports = ' + JSON.stringify(cssTexts) + ';\n');

    console.log('[build:wechat] 生成入口 game.js...');
    const entry = mustRead('tools/wechat-lib/entry-template.js');
    // 内联脚本(BootProgress/错误横幅/THREE检测)已并入 bundle 头部 — 入口自身只做环境装配
    fs.writeFileSync(path.join(OUT, 'game.js'), entry);

    console.log('[build:wechat] 生成平台配置...');
    fs.writeFileSync(path.join(OUT, 'game-config.js'),
        '// ===== 微信小游戏平台配置 (构建生成, 上线前必查) =====\n' +
        '// 广告位ID获取: 微信公众平台 → 流量主 → 广告位管理 → 激励式视频广告\n' +
        '// 留空 = 广告功能如实降级不可用(按钮自动隐藏), 不伪造广告\n' +
        'window.__GAME_SETTINGS = {\n' +
        "    version: '" + gameVersion + "',\n" +
        "    platform: 'wechat',\n" +
        '    ads: {\n' +
        '        wechat: {\n' +
        "            rewardVideo: ''  // TODO(上线): 填入激励视频广告位ID\n" +
        '        }\n' +
        '    }\n' +
        '};\n');

    console.log('[build:wechat] 生成小游戏配置...');
    fs.writeFileSync(path.join(OUT, 'game.json'), JSON.stringify({
        deviceOrientation: 'portrait',
        showStatusBar: false,
        networkTimeout: { request: 10000, downloadFile: 10000 },
        subpackages: [{ root: 'assets/', name: 'assets' }]
    }, null, 2));

    fs.writeFileSync(path.join(OUT, 'project.config.json'), JSON.stringify({
        description: '膨胀小队 微信小游戏 V1.0 (构建产物, 源于 tools/build-wechat.js)',
        packOptions: { ignore: [], include: [] },
        setting: {
            es6: false,          // bundle 为 ES5/ES2018 混合, 关闭编译保持原样
            enhance: false,
            postcss: false,
            minified: false,
            urlCheck: false
        },
        compileType: 'game',
        libVersion: '2.33.0',
        appid: '',               // TODO(上线): 填入真实 AppID; 测试可用开发者工具测试号
        projectname: 'pengzhang-xiaodui',
        condition: {}
    }, null, 2));

    console.log('[build:wechat] 复制 three.js...');
    fs.copyFileSync(path.join(ROOT, 'libs', 'three.min.js'), path.join(OUT, 'libs', 'three.min.js'));

    console.log('[build:wechat] 复制资源分包...');
    const manifest = copyAssets();

    // ---- 产物自检 ----
    console.log('[build:wechat] 产物自检...');
    const checks = [];
    checks.push(['bundle 含 js/game.js 段', bundle.indexOf('[[ js/game.js ]]') !== -1]);
    checks.push(['bundle 含 class Game 定义', /class Game\s*\{/.test(bundle)]);
    checks.push(['bundle 含 Platform 单例', bundle.indexOf('var Platform') !== -1]);
    checks.push(['bundle 含 WechatAdService', bundle.indexOf('class WechatAdService') !== -1]);
    checks.push(['bundle 含 BOOTSTRAP(Platform.initialize)', bundle.indexOf('Platform.initialize()') !== -1]);
    checks.push(['bundle 含 BootProgress 内联脚本', bundle.indexOf('__BootProgress') !== -1]);
    checks.push(['bundle 含 MiniGLTFLoader 安装调用', bundle.indexOf('__installMiniGLTFLoader()') !== -1]);
    checks.push(['minidom 含 createRuntime', minidomSrc.indexOf('createRuntime') !== -1]);
    checks.push(['入口含 wx.createCanvas', entry.indexOf('wx.createCanvas') !== -1]);
    checks.push(['入口含 __gameEnv(参数遮蔽环境表)', entry.indexOf('__gameEnv') !== -1]);
    checks.push(['UI DOM 树含 game-container', JSON.stringify(bodySpec).indexOf('game-container') !== -1]);
    const p0 = manifest.filter(f => f.priority === 'P0');
    checks.push(['P0 资源齐备(士兵+基础僵尸+头像) ≥6', p0.length >= 6]);
    const fails = checks.filter(c => !c[1]);
    for (const c of checks) console.log('  ' + (c[1] ? '✓' : '✗') + ' ' + c[0]);
    if (fails.length) throw new Error('[build:wechat] 自检失败: ' + fails.map(f => f[0]).join('; '));

    // 包体预算
    const mainFiles = ['game.js', 'minidom.js', 'ui-dom.js', 'ui-css.js', 'game-bundle.js', 'game-config.js', 'libs/three.min.js'];
    let mainSize = 0;
    for (const f of mainFiles) mainSize += fs.statSync(path.join(OUT, f)).size;
    mainSize += manifest.filter(f => f.package === 'main').reduce((s, f) => s + f.size, 0);
    const assetsSize = manifest.filter(f => f.package !== 'main').reduce((s, f) => s + f.size, 0);
    const totalSize = mainSize + assetsSize;
    const MAIN_LIMIT = 4 * 1024 * 1024, SUB_LIMIT = 4 * 1024 * 1024, TOTAL_LIMIT = 30 * 1024 * 1024;
    console.log('[build:wechat] 包体: 主包 ' + fmtSize(mainSize) + ' / 分包(assets) ' + fmtSize(assetsSize) + ' / 整包 ' + fmtSize(totalSize));
    if (mainSize > MAIN_LIMIT) throw new Error('[build:wechat] 主包超限: ' + fmtSize(mainSize) + ' > 4MB');
    if (assetsSize > SUB_LIMIT) throw new Error('[build:wechat] assets 分包超限: ' + fmtSize(assetsSize) + ' > 4MB — 需拆分资源');
    if (totalSize > TOTAL_LIMIT) throw new Error('[build:wechat] 整包超限: ' + fmtSize(totalSize) + ' > 30MB');

    console.log('[build:wechat] 完成 → wechat-game/ (主包 ' + fmtSize(mainSize) + ' / 整包 ' + fmtSize(totalSize) + ')');
    console.log('  导入: 微信开发者工具 → 导入 wechat-game 目录(测试可用测试号 AppID)');
    console.log('  上线前必查: project.config.json 的 appid / game-config.js 广告位ID / 真机预览(见 docs/WeChat/WECHAT_RELEASE_CHECKLIST.md)');
}

main();
