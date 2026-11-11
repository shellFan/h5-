// ===== 存储适配器单测 =====
// 覆盖: 内存兜底 / JSON序列化 / 前缀命名空间 / 损坏数据处理

module.exports.run = function(ctx) {
    const { describe, test, assert, assertEq } = ctx;

    describe('MemoryStorageAdapter', () => {
        test('set/get 往返', () => {
            const s = new MemoryStorageAdapter();
            s.set('a', 1);
            s.set('b', { x: '中文' });
            assertEq(s.get('a', 0), 1);
            assertEq(JSON.stringify(s.get('b', null)), JSON.stringify({ x: '中文' }));
        });
        test('get 不存在的键返回默认值', () => {
            const s = new MemoryStorageAdapter();
            assertEq(s.get('nope', 'def'), 'def');
        });
        test('损坏JSON返回默认值', () => {
            const s = new MemoryStorageAdapter();
            s._map['bad'] = '{oops';
            assertEq(s.get('bad', 'safe'), 'safe');
        });
        test('remove/keys', () => {
            const s = new MemoryStorageAdapter();
            s.set('a', 1); s.set('b', 2);
            s.remove('a');
            assertEq(s.keys().length, 1);
            assertEq(s.get('a', null), null);
        });
    });

    describe('LocalStorageAdapter', () => {
        test('Node无window时降级到内存存储', () => {
            const s = new LocalStorageAdapter();
            // Node环境无window → _available=false → fallback生效
            s.set('k', 42);
            assertEq(s.get('k', 0), 42);
        });
    });

    describe('GameStorage 前缀封装', () => {
        test('键自动加前缀且互不冲突', () => {
            const inner = new MemoryStorageAdapter();
            const g = new GameStorage(inner);
            g.set('level', 3);
            // 原始存储里是带前缀的键
            assert(inner.keys().indexOf('pz_squad_level') >= 0);
            assertEq(g.get('level', 0), 3);
        });
        test('keys()返回去前缀列表', () => {
            const g = new GameStorage(new MemoryStorageAdapter());
            g.set('a', 1); g.set('b', 2);
            const ks = g.keys().sort();
            assertEq(JSON.stringify(ks), '["a","b"]');
        });
    });

    describe('RewardLedger 幂等账本', () => {
        test('mark一次后has为真且二次mark被拒', () => {
            const g = new GameStorage(new MemoryStorageAdapter());
            const ledger = new RewardLedger(g);
            assertEq(ledger.has('txn_1'), false);
            assertEq(ledger.mark('txn_1'), true);
            assertEq(ledger.has('txn_1'), true);
            assertEq(ledger.mark('txn_1'), false); // 重复标记被拒
        });
        test('账本跨实例持久(模拟页面刷新)', () => {
            const store = new MemoryStorageAdapter();
            const g1 = new GameStorage(store);
            const l1 = new RewardLedger(g1);
            l1.mark('txn_x');
            // 新实例读取同一存储
            const l2 = new RewardLedger(new GameStorage(store));
            assertEq(l2.has('txn_x'), true);
        });
    });
};
