// ===== V12 微信端单元测试: WxStorageAdapter / GameStorage 加固 / 旧键迁移 =====
// 零浏览器依赖 — wx 以内存 mock 提供(与微信同步存储 API 语义一致)
module.exports.run = function(ctx) {
    const { describe, test, assert, assertEq } = ctx;

    describe('WxStorageAdapter (V12 微信存储)', () => {
        test('基本读写与 JSON 语义', () => {
            const mockWx = { __data: {} };
            mockWx.getStorageSync = (k) => (mockWx.__data[k] !== undefined ? mockWx.__data[k] : '');
            mockWx.setStorageSync = (k, v) => { mockWx.__data[k] = v; };
            mockWx.removeStorageSync = (k) => { delete mockWx.__data[k]; };
            mockWx.getStorageInfoSync = () => ({ keys: Object.keys(mockWx.__data) });
            const gs = new GameStorage(new WxStorageAdapter(mockWx));
            assertEq(gs.get('nothing', 'def'), 'def', '缺失键返回默认值');
            gs.set('num', 42);
            assertEq(gs.get('num', 0), 42, '数字读写');
            gs.set('obj', { a: 1 });
            assertEq(JSON.stringify(gs.get('obj', {})), '{"a":1}', '对象读写');
            assertEq(mockWx.__data[gs.PREFIX + 'num'], '42', '底层 JSON 字符串(与 TtStorageAdapter 一致)');
            gs.remove('num');
            assertEq(gs.get('num', 'gone'), 'gone', '删除后读默认值');
        });

        test('存储异常降级内存不崩溃', () => {
            const boom = () => { throw new Error('wx storage unavailable'); };
            const mockWx = { getStorageSync: boom, setStorageSync: boom, removeStorageSync: boom, getStorageInfoSync: boom };
            const gs = new GameStorage(new WxStorageAdapter(mockWx));
            gs.set('k', 'v');
            assertEq(gs.get('k', 'def'), 'v', '写失败降级内存后同会话可读');
        });
    });

    describe('GameStorage.getSafe/setSafe (V12 存档加固)', () => {
        test('主档损坏自动回退 .bak 备份', () => {
            const ad = new MemoryStorageAdapter();
            const gs = new GameStorage(ad);
            gs.setSafe('profile_v51', { profileVersion: 3, coins: 100, unlockedLevel: 5 });
            ad.set(gs.PREFIX + 'profile_v51', '{broken json!!!');
            const restored = gs.getSafe('profile_v51', null);
            assert(restored && restored.coins === 100, '主档损坏 → 从 .bak 恢复');
            const fixed = gs.get('profile_v51', null);
            assert(fixed && fixed.coins === 100, '读侧用备份修复主档');
        });

        test('双份损坏保留现场不静默清零', () => {
            const ad = new MemoryStorageAdapter();
            const gs = new GameStorage(ad);
            gs.setSafe('profile_v51', { coins: 55 });
            ad.set(gs.PREFIX + 'profile_v51', '{{{');
            ad.set(gs.PREFIX + 'profile_v51.bak', '{{{');
            assertEq(gs.getSafe('profile_v51', null), null, '双份损坏返回默认值');
            const corrupt = ad.get(gs.PREFIX + 'profile_v51.corrupt', null);
            assert(corrupt && corrupt.main && corrupt.bak, '损坏现场镜像保存(.corrupt)');
            assert(corrupt.at > 0, '现场带时间戳');
        });

        test('正常路径无损', () => {
            const gs = new GameStorage(new MemoryStorageAdapter());
            gs.setSafe('p', { coins: 7, bag: [{ id: 1 }] });
            const v = gs.getSafe('p', null);
            assert(v && v.coins === 7 && v.bag.length === 1, '往返无损');
        });

        test('remove 同时清理主档/备份/损坏标记', () => {
            const ad = new MemoryStorageAdapter();
            const gs = new GameStorage(ad);
            gs.setSafe('p', { a: 1 });
            gs.remove('p');
            assertEq(gs.get('p', null), null);
            assertEq(gs.getSafe('p', 'gone'), 'gone');
            assertEq(ad.keys().filter(k => k.indexOf('p') !== -1).length, 0, '无残留键');
        });
    });

    describe('GameStorage.getLegacy/setLegacy (V12 旧键迁移)', () => {
        test('命名空间优先, 裸键兼容读, setLegacy 清理裸键', () => {
            const savedLS = global.window && global.window.localStorage;
            const hadWindow = !!global.window;
            if (!hadWindow) global.window = {};
            const backing = {};
            global.window.localStorage = {
                getItem: (k) => (backing[k] !== undefined ? backing[k] : null),
                setItem: (k, v) => { backing[k] = String(v); },
                removeItem: (k) => { delete backing[k]; }
            };
            try {
                backing['pz_shake_off'] = '1';
                const gs = new GameStorage(new MemoryStorageAdapter());
                assertEq(gs.getLegacy('pz_shake_off', '0'), '1', '旧裸键兼容读');
                gs.set('pz_shake_off', '0');
                assertEq(gs.getLegacy('pz_shake_off', '1'), '0', '命名空间键优先');
                gs.setLegacy('pz_shake_off', '0');
                assertEq(backing['pz_shake_off'], undefined, '旧裸键已清理(单一数据源)');
                // 无 localStorage 环境(微信) → 直接走命名空间
                global.window.localStorage = undefined;
                const gsWx = new GameStorage(new MemoryStorageAdapter());
                assertEq(gsWx.getLegacy('pz_quality', '1'), '1', '无裸键走默认值');
            } finally {
                global.window.localStorage = savedLS;
                if (!hadWindow) delete global.window;
            }
        });
    });

    describe('GameProfile 走安全读写 (V12)', () => {
        test('save() 主档 + .bak 双写', () => {
            const gs = new GameStorage(new MemoryStorageAdapter());
            const profile = new GameProfile(gs, null);
            profile.addCoins(88);
            const raw = gs.get('profile_v51', null);
            const bak = gs.get('profile_v51.bak', null);
            assert(raw && raw.coins === 88, '主档写入');
            assert(bak && bak.coins === 88, '.bak 镜像同步写入');
        });

        test('主档损坏后重建档案 → 从 .bak 恢复, 不清零', () => {
            const ad = new MemoryStorageAdapter();
            const gs = new GameStorage(ad);
            let profile = new GameProfile(gs, null);
            profile.addCoins(120);
            ad.set(gs.PREFIX + 'profile_v51', 'CORRUPT{{');
            const profile2 = new GameProfile(gs, null);
            assertEq(profile2.data.coins, 120, '损坏档案从备份恢复');
        });
    });

    describe('平台检测 (V12 微信分支就绪)', () => {
        test('无 wx/tt 全局 → h5', () => {
            assertEq(detectPlatform(), 'h5', '沙箱环境检测为 h5');
        });
    });
};
