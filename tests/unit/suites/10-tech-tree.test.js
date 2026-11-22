// ===== V8.0 科技树单测 (V14.1回归: 科技购买必须扣科技点, 不得动金币) =====

module.exports.run = function(ctx) {
    const { describe, test, assert, assertEq } = ctx;

    function makeProfile() {
        var p = new GameProfile(new GameStorage(new MemoryStorageAdapter()));
        p.addCoins(10000);
        p.data.techPoints = 0;
        return p;
    }

    describe('TechTree.upgrade 货币语义', () => {
        test('购买成功: 扣科技点, 金币不动', () => {
            var p = makeProfile();
            p.data.techPoints = 250;
            var coinsBefore = p.coins;
            var r = TechTree.upgrade(p, 'fire_dmg'); // cost 100
            assert(r.ok);
            assertEq(p.data.techPoints, 150, '科技点扣100');
            assertEq(p.coins, coinsBefore, '金币不得扣减');
            assertEq(p.data.tech.fire_dmg, 1);
        });
        test('科技点不足: 拒绝且双方余额均不变', () => {
            var p = makeProfile();
            p.data.techPoints = 99;
            var coinsBefore = p.coins;
            var r = TechTree.upgrade(p, 'fire_dmg');
            assert(!r.ok);
            assertEq(r.reason, 'insufficient');
            assertEq(p.data.techPoints, 99);
            assertEq(p.coins, coinsBefore);
            assert(!p.data.tech || !p.data.tech.fire_dmg, '不得误升科技');
        });
        test('科技点为0/undefined时不误用金币购买', () => {
            var p = makeProfile();
            delete p.data.techPoints;
            var coinsBefore = p.coins;
            var r = TechTree.upgrade(p, 'army_size');
            assert(!r.ok);
            assertEq(p.coins, coinsBefore, '金币不得被扣');
        });
        test('重复点击不多次扣点(原子)', () => {
            var p = makeProfile();
            p.data.techPoints = 300;
            TechTree.upgrade(p, 'fire_dmg');
            TechTree.upgrade(p, 'fire_dmg'); // 200-100=100... 300-100=200, 第二次200-100=100
            assertEq(p.data.techPoints, 100);
            assertEq(p.data.tech.fire_dmg, 2);
        });
    });

    describe('TechTree 前置/上限', () => {
        test('前置科技未买时拒绝(fire_rate 需 fire_dmg)', () => {
            var p = makeProfile();
            p.data.techPoints = 1000;
            var r = TechTree.upgrade(p, 'fire_rate');
            assert(!r.ok);
            assertEq(r.reason, 'locked');
        });
        test('前置满足后可购买', () => {
            var p = makeProfile();
            p.data.techPoints = 1000;
            assert(TechTree.upgrade(p, 'fire_dmg').ok);
            var r = TechTree.upgrade(p, 'fire_rate');
            assert(r.ok);
            assertEq(p.data.tech.fire_rate, 1);
        });
        test('到达上限后拒绝(maxed)', () => {
            var p = makeProfile();
            p.data.techPoints = 1000;
            p.data.tech.fire_dmg = 3;
            var r = TechTree.upgrade(p, 'fire_dmg');
            assert(!r.ok);
            assertEq(r.reason, 'maxed');
            assertEq(p.data.techPoints, 1000, 'maxed不扣点');
        });
    });

    describe('TechTree.grantTech / combatStats', () => {
        test('grantTech 累加科技点(结算授予)', () => {
            var p = makeProfile();
            TechTree.grantTech(p, 30);
            TechTree.grantTech(p, 12.7); // 向下取整
            assertEq(p.data.techPoints, 42);
        });
        test('combatStats 按等级换算属性', () => {
            var p = makeProfile();
            p.data.tech = { fire_dmg: 2, fire_rate: 1, army_size: 3, log_coin: 1 };
            var s = TechTree.combatStats(p);
            assertEq(s.dmgBonus, 2);
            assertEq(s.rateBonus, 0.08);
            assertEq(s.startBonus, 6);
            assertEq(s.coinMul, 1.15);
        });
    });
};
