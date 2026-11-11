// ===== 广告系统单测 (Phase 4 验收核心) =====
// 覆盖 4.4 可靠性矩阵:
//   完成发奖 / 提前关闭不发奖 / 错误不发奖 / 重复回调只发一次 /
//   连点只展示一次 / 复活次数限制 / 双倍次数限制 / 刷门次数限制 /
//   平台不支持降级 / 切后台中断不发奖 / 账本防跨刷新重复发放

module.exports.run = function(ctx) {
    const { describe, testAsync, assert, assertEq, sleep, makeStubLifecycle } = ctx;

    function makeService(scenario) {
        const storage = new GameStorage(new MemoryStorageAdapter());
        const lifecycle = makeStubLifecycle();
        const svc = new WebMockAdService(storage, lifecycle, {
            scenario: scenario || 'normal',
            autoDuration: 1   // 单测用1秒倒计时
        });
        svc.initialize();
        return svc;
    }

    describe('WebMockAdService 基础流程', () => {
        testAsync('完整观看 → completed + transactionId', async () => {
            const svc = makeService('auto_complete');
            const r = await svc.showRewarded(AdPlacement.REVIVE);
            assertEq(r.status, 'completed');
            assert(!!r.transactionId, '应返回事务ID');
        });

        testAsync('提前关闭 → abandoned 不发奖', async () => {
            const svc = makeService('auto_abandon');
            const r = await svc.showRewarded(AdPlacement.REVIVE);
            assertEq(r.status, 'abandoned');
            assert(!r.transactionId, '提前关闭不应有事务ID');
        });

        testAsync('加载失败(error场景) → failed 不发奖', async () => {
            const svc = makeService('error');
            const r = await svc.showRewarded(AdPlacement.REVIVE);
            assertEq(r.status, 'failed');
            assert(!r.transactionId);
        });

        testAsync('流程结束后状态机归位idle(可再次展示)', async () => {
            const svc = makeService('auto_complete');
            await svc.showRewarded(AdPlacement.REVIVE);
            const r2 = await svc.showRewarded(AdPlacement.DOUBLE_REWARD);
            assertEq(r2.status, 'completed');
        });
    });

    describe('可靠性防护', () => {
        testAsync('连点: 第二次立即BUSY不发起展示', async () => {
            const svc = makeService('auto_complete');
            const p1 = svc.showRewarded(AdPlacement.REVIVE);
            const r2 = await svc.showRewarded(AdPlacement.REVIVE); // 进行中点击
            assertEq(r2.status, 'failed');
            assertEq(r2.reason, AdError.BUSY);
            await p1;
        });

        testAsync('切后台中断 → failed(INTERRUPTED) 不发奖', async () => {
            const storage = new GameStorage(new MemoryStorageAdapter());
            const lifecycle = makeStubLifecycle();
            const svc = new WebMockAdService(storage, lifecycle, { scenario: 'normal', autoDuration: 1 });
            svc.initialize();
            const p = svc.showRewarded(AdPlacement.REVIVE); // 手动模式,覆盖层不会自动完成
            // 模拟App切后台
            lifecycle.fire('hide');
            const r = await p;
            assertEq(r.status, 'failed');
            assertEq(r.reason, AdError.INTERRUPTED);
            // 中断后状态归位可再次展示并正常发奖
            svc.setScenario('auto_complete');
            const r2 = await svc.showRewarded(AdPlacement.REVIVE);
            assertEq(r2.status, 'completed');
        });

        testAsync('grantReward 防重复发放(同事务ID只发一次)', async () => {
            const svc = makeService('auto_complete');
            const r = await svc.showRewarded(AdPlacement.REVIVE);
            let grantedCount = 0;
            const grant = () => grantedCount++;
            assertEq(svc.grantReward(r.transactionId, grant), true);
            assertEq(svc.grantReward(r.transactionId, grant), false); // 第二次拒绝
            assertEq(grantedCount, 1);
        });
    });

    describe('GameAdCoordinator 场景限制', () => {
        function makeCoordinator(svc, hooks) {
            return new GameAdCoordinator(svc, hooks || {});
        }

        testAsync('复活: 每局最多1次', async () => {
            const svc = makeService('auto_complete');
            const coord = makeCoordinator(svc);
            coord.startRun();
            assertEq(coord.canRevive(), true);
            const g1 = await coord.requestRevive(20);
            assertEq(g1, true, '第一次复活应发奖');
            assertEq(coord.canRevive(), false, '第二次应被限制');
            const g2 = await coord.requestRevive(20);
            assertEq(g2, false, '第二次复活不应发奖');
        });

        testAsync('双倍结算: 每次通关最多1次', async () => {
            const svc = makeService('auto_complete');
            const coord = makeCoordinator(svc);
            coord.startRun();
            const g1 = await coord.requestDoubleReward();
            assertEq(g1, true);
            const g2 = await coord.requestDoubleReward();
            assertEq(g2, false);
        });

        testAsync('刷门: 默认每局2次上限', async () => {
            const svc = makeService('auto_complete');
            const coord = makeCoordinator(svc, { canRefreshGates: () => true });
            coord.startRun();
            assertEq(coord.getGateRefreshLeft(), 2);
            assertEq(await coord.requestGateRefresh(), true);
            assertEq(await coord.requestGateRefresh(), true);
            assertEq(coord.getGateRefreshLeft(), 0);
            assertEq(await coord.requestGateRefresh(), false);
        });

        testAsync('startRun 重置每局计数', async () => {
            const svc = makeService('auto_complete');
            const coord = makeCoordinator(svc);
            coord.startRun();
            await coord.requestRevive(10);
            assertEq(coord.canRevive(), false);
            coord.startRun();
            assertEq(coord.canRevive(), true);
        });

        testAsync('广告期间暂停游戏, 结束后恢复', async () => {
            const svc = makeService('auto_complete');
            const events = [];
            const coord = makeCoordinator(svc, {
                pauseGame: () => events.push('pause'),
                resumeGame: () => events.push('resume')
            });
            coord.startRun();
            await coord.requestRevive(10);
            assertEq(JSON.stringify(events), '["pause","resume"]');
        });

        testAsync('复活奖励人数=失败前最大人数×50%(至少5)', async () => {
            const svc = makeService('auto_complete');
            let revivedCount = 0;
            const coord = makeCoordinator(svc, {
                onReviveReward: (count) => { revivedCount = count; }
            });
            coord.startRun();
            await coord.requestRevive(40);
            assertEq(revivedCount, 20);
            // 小人数下限保护
            coord.startRun();
            await coord.requestRevive(2);
            assertEq(revivedCount, 5);
        });
    });

    describe('平台降级', () => {
        testAsync('未初始化 → failed(NOT_INITIALIZED)', async () => {
            const svc = new WebMockAdService(new GameStorage(new MemoryStorageAdapter()), makeStubLifecycle());
            const r = await svc.showRewarded(AdPlacement.REVIVE);
            assertEq(r.reason, AdError.NOT_INITIALIZED);
        });

        testAsync('不支持广告的平台(空实现) → failed(NOT_AVAILABLE)', async () => {
            const svc = new WechatAdService(new GameStorage(new MemoryStorageAdapter()), makeStubLifecycle());
            svc.initialize();
            const r = await svc.showRewarded(AdPlacement.REVIVE);
            assertEq(r.status, 'failed');
            assertEq(r.reason, AdError.NOT_AVAILABLE);
        });
    });
};
