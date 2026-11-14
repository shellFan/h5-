// ===== V5.1 金币经济单测 =====

module.exports.run = function(ctx) {
    const { describe, test, assert, assertEq } = ctx;

    function makeStorage() { return new MemoryStorageAdapter(); }
    function makeProfile() { return new GameProfile(new GameStorage(makeStorage())); }

    describe('GameProfile 存档', () => {
        test('建档: 初始0金币/1级解锁/空升级', () => {
            var p = makeProfile();
            assertEq(p.coins, 0);
            assertEq(p.data.unlockedLevel, 1);
            assertEq(p.data.upgrades.recruit, 0);
            assert(p.data.claimedRewards && typeof p.data.claimedRewards === 'object');
        });
        test('旧存档迁移: 原始层 pz_progress 解锁进度不丢失', () => {
            var raw = new MemoryStorageAdapter();
            raw.set('pz_progress', '3'); // V3.3 旧键(原始层, 无前缀)
            var p = new GameProfile(new GameStorage(makeStorage()), raw);
            assertEq(p.data.unlockedLevel, 3, '旧解锁迁移');
            assertEq(p.coins, 0, '新字段默认');
        });
        test('刷新页面不丢金币: 同storage二次建档读到一致数据', () => {
            var st = makeStorage();
            var g1 = new GameStorage(st);
            var p1 = new GameProfile(g1);
            p1.addCoins(150);
            var p2 = new GameProfile(new GameStorage(st));
            assertEq(p2.coins, 150, '重进不丢');
            assertEq(p2.data.unlockedLevel, p1.data.unlockedLevel);
        });
        test('spend 原子性: 余额不足不扣款', () => {
            var p = makeProfile();
            p.addCoins(100);
            assert(!p.spend(150), '超额消费失败');
            assertEq(p.coins, 100, '余额不动');
            assert(p.spend(100));
            assertEq(p.coins, 0);
            assert(!p.spend(1), '0余额不能消费');
        });
        test('claimReward 幂等: 同键只领一次', () => {
            var p = makeProfile();
            assert(p.claimReward('win:L1', 60), '首次领取成功');
            assert(!p.claimReward('win:L1', 60), '重复领取被拒');
            assertEq(p.coins, 60, '只入账一次');
        });
    });

    describe('settleRunEconomy 结算', () => {
        test('胜利: 关卡奖励+击杀币, 首次通关入账', () => {
            var p = makeProfile();
            var level = { rewardCoins: 60 };
            var r = settleRunEconomy(p, level, 0, 20, true, false);
            assertEq(r.levelReward, 60);
            assertEq(r.killReward, Math.min(18, Math.floor(20 * 0.5)), '击杀币=min(10, 60*30%＝18)');
            assertEq(r.total, r.levelReward + r.killReward);
            assertEq(p.coins, r.total);
        });
        test('重复通关同关: 关卡奖励不再发放(防刷)', () => {
            var p = makeProfile();
            var level = { rewardCoins: 60 };
            settleRunEconomy(p, level, 0, 10, true, false);
            var before = p.coins;
            var r2 = settleRunEconomy(p, level, 0, 10, true, false);
            assertEq(r2.levelReward, 0, '第二次通关无关卡奖励');
            assertEq(r2.killReward, Math.min(18, 5), '仅击杀币');
            assertEq(p.coins, before + r2.total);
        });
        test('失败: 不发关卡奖励, 击杀币封顶15', () => {
            var p = makeProfile();
            var level = { rewardCoins: 60 };
            var r = settleRunEconomy(p, level, 0, 100, false, false);
            assertEq(r.levelReward, 0);
            assertEq(r.killReward, 15, '失败击杀币上限15');
            assertEq(p.coins, 15);
        });
        test('双倍广告: 只翻倍关卡奖励且一次性', () => {
            var p = makeProfile();
            var level = { rewardCoins: 80 };
            var r = settleRunEconomy(p, level, 1, 10, true, true);
            assertEq(r.levelReward, 80);
            assert(r.doubled, '标记双倍');
            assertEq(r.total, 80 * 2 + 5);
            assertEq(p.coins, r.total);
        });
        test('后勤升级提高首次关卡奖励', () => {
            var p = makeProfile();
            p.data.upgrades.logistics = 2;
            var r = settleRunEconomy(p, { rewardCoins: 100 }, 2, 0, true, false);
            assertEq(r.levelReward, 120, '100 × (1+2*10%)');
        });
        test('recordRun 解锁下一关且不回退', () => {
            var p = makeProfile();
            assert(p.recordRun(0, 5, 20, true, 5), 'L1胜利解锁L2');
            assertEq(p.data.unlockedLevel, 2);
            assert(!p.recordRun(0, 5, 20, true, 5), '重复通关不再变更');
            assertEq(p.data.unlockedLevel, 2);
            assert(p.recordRun(4, 5, 20, true, 5), 'L5胜利解锁到5(封顶)');
            assertEq(p.data.unlockedLevel, 5);
        });
    });
};
