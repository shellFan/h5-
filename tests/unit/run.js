// ===== 单元测试运行器 (Phase 7) =====
// 零依赖 Node 测试: 全局加载游戏JS(平台层/广告层/纯逻辑), 运行 suites/ 下全部测试
// 运行: node tests/unit/run.js
// 退出码: 0=全部通过 1=有失败

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');

// ---------- 加载游戏源码到共享沙箱 ----------
// 各源文件以全局类/函数形式互相依赖, 拼接后单次执行保证作用域共享
const SOURCE_FILES = [
    'js/config.js',
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

function loadSources() {
    let code = '';
    for (const f of SOURCE_FILES) {
        code += '\n// ==== ' + f + ' ====\n' + fs.readFileSync(path.join(ROOT, f), 'utf8') + '\n';
    }
    vm.runInThisContext(code, { filename: 'game-sources.js' });
}

// ---------- 极简测试框架 ----------
let _currentSuite = '';
let _pendingCollector = null;
const _suitePromises = []; // 所有describe返回的promise, 退出前统一等待
const _results = { pass: 0, fail: 0, cases: [] };

function describe(name, fn) {
    _currentSuite = name;
    console.log('\n■ ' + name);
    const pending = [];
    _pendingCollector = pending;
    const r = fn();
    _pendingCollector = null;
    const done = Promise.resolve(r).then(() => Promise.all(pending)).then(() => { _currentSuite = ''; });
    _suitePromises.push(done);
    return done;
}

function test(name, fn) {
    try {
        const r = fn();
        if (r && typeof r.then === 'function') {
            throw new Error('test() 不支持异步, 请用 testAsync()');
        }
        pass(name);
    } catch (e) {
        fail(name, e);
    }
}

function testAsync(name, fn) {
    const p = fn().then(
        () => pass(name),
        (e) => fail(name, e)
    );
    if (_pendingCollector) _pendingCollector.push(p);
    return p;
}

function pass(name) {
    _results.pass++;
    console.log('  ✓ ' + name);
}

function fail(name, e) {
    _results.fail++;
    console.log('  ✗ ' + name + '\n      ' + (e && e.message));
    _results.cases.push({ suite: _currentSuite, name, error: e && e.message });
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg || '断言失败');
}
function assertEq(a, b, msg) {
    if (a !== b) throw new Error((msg || '断言相等失败') + ` (实际=${JSON.stringify(a)} 期望=${JSON.stringify(b)})`);
}

// ---------- 测试专用桩 ----------
/** 可手动触发hide的Lifecycle桩 */
function makeStubLifecycle() {
    const handlers = { hide: [], show: [] };
    return {
        on(ev, fn) { handlers[ev].push(fn); },
        off(ev, fn) { const i = handlers[ev].indexOf(fn); if (i >= 0) handlers[ev].splice(i, 1); },
        fire(ev) { handlers[ev].slice().forEach(fn => fn()); }
    };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------- 执行 ----------
loadSources();

const suiteFiles = fs.readdirSync(__dirname + '/suites').filter(f => f.endsWith('.test.js')).sort();
(async () => {
    for (const f of suiteFiles) {
        const suite = require(path.join(__dirname, 'suites', f));
        await suite.run({ describe, test, testAsync, assert, assertEq, sleep, makeStubLifecycle });
    }
    await Promise.all(_suitePromises); // 等待全部异步用例完成
    console.log('\n======================');
    console.log(`通过 ${_results.pass} / 失败 ${_results.fail} / 共 ${_results.pass + _results.fail}`);
    if (_results.fail > 0) {
        console.log('失败明细:');
        _results.cases.forEach(c => console.log(`  [${c.suite}] ${c.name}: ${c.error}`));
        process.exit(1);
    }
    process.exit(0);
})();
