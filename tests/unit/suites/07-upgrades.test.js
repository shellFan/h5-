// ===== V5.1 升级商店单测 =====

module.exports.run = function(ctx) {
    const { describe, test, assert, assertEq } = ctx;

    function makeProfile(coins) {
        var p = new GameProfile(new GameStorage(new MemoryStorageAdapter()));
        if (coins) p.addCoins(coins);
        return p;
    }

    describe('UPGRADE_DEFS 配置完整性', () => {
        test('五项升级全部有价格阶梯', () => {
            var ids = ['recruit', 'logistics', 'gun', 'rapid', 'pierce'];
            ids.forEach(function(id) {
                var def = UPGRADE_DEFS[id];
                assert(def && def.levels.length >= 3, id + '存在且≥3级');
                for (var i = 1; i < def.levels.length; i++) {
                    assert(def.levels[i] > def.levels[i - 1], id + '价格递增');
                }
            });
        });
        test('等级上限符合任务书', () => {
            assertEq(UPGRADE_DEFS.recruit.levels.length, 10, '新兵招募10级');
            assertEq(UPGRADE_DEFS.logistics.levels.length, 5, '后勤5级');
            assertEq(UPGRADE_DEFS.rapid.levels.length, 5, '快速射击5级');
            assertEq(UPGRADE_DEFS.pierce.levels.length, 3, '穿甲弹3级');
            assertEq(UPGRADE_DEFS.gun.levels.length, 8, '枪械8级');
        });
    });

    describe('UpgradeShop.purchase', () => {
        test('购买成功: 扣款+升级+持久化(模拟刷新页面)', () => {
            var st = new MemoryStorageAdapter();
            var p = new GameProfile(new GameStorage(st));
            p.addCoins(120);
            var r = UpgradeShop.purchase(p, 'gun');
            assert(r.ok);
            assertEq(p.coins, 0);
            assertEq(p.data.upgrades.gun, 1);
            var p2 = new GameProfile(new GameStorage(st));
            assertEq(p2.data.upgrades.gun, 1, '重进后保留');
        });
        test('余额不足: 不扣款不升级', () => {
            var p = makeProfile(50);
            var r = UpgradeShop.purchase(p, 'gun'); // 120
            assert(!r.ok);
            assertEq(r.reason, 'insufficient');
            assertEq(p.coins, 50);
            assertEq(p.data.upgrades.gun, 0);
        });
        test('等级上限: MAX后拒绝', () => {
            var p = makeProfile(100000);
            p.data.upgrades.pierce = 3;
            var r = UpgradeShop.purchase(p, 'pierce');
            assert(!r.ok);
            assertEq(r.reason, 'maxed');
        });
        test('重复点击不多次扣款(原子spend)', () => {
            var p = makeProfile(500);
            assert(UpgradeShop.purchase(p, 'recruit').ok); // 100 → lv1
            assert(UpgradeShop.purchase(p, 'recruit').ok); // 180 → lv2
            assertEq(p.coins, 220);
            assertEq(p.data.upgrades.recruit, 2);
        });
    });

    describe('升级战斗应用', () => {
        test('startCount = 关卡基础 + recruit', () => {
            var p = makeProfile(0);
            p.data.upgrades.recruit = 3;
            assertEq(UpgradeShop.startCount(p, 1), 4, 'L1: 1+3=4');
            assertEq(UpgradeShop.startCount(p, 2), 5, 'L2: 2+3=5');
        });
        test('damageBonus/fireRateMul/pierceBonus/coinMul', () => {
            var p = makeProfile(0);
            p.data.upgrades.gun = 2;
            p.data.upgrades.rapid = 4;
            p.data.upgrades.pierce = 2;
            p.data.upgrades.logistics = 3;
            assertEq(UpgradeShop.damageBonus(p), 2);
            assertEq(UpgradeShop.fireRateMul(p), 1.2);
            assertEq(UpgradeShop.pierceBonus(p), 2);
            assertEq(UpgradeShop.coinMul(p), 1.3);
        });
        test('满级快速射击不突破全局射速上限', () => {
            var p = makeProfile(0);
            p.data.upgrades.rapid = 5;
            var rate = CONFIG.BULLET_FIRE_RATE_BASE * UpgradeShop.fireRateMul(p) * (1 + 0.5);
            assertEq(Math.min(3.0, rate), 3.0, '2.2*1.25*1.5=4.125 → 钳制3.0');
        });
        test('伤害公式: base1 + 永久gun + 门buff(集成公式)', () => {
            var p = makeProfile(0);
            p.data.upgrades.gun = 3;
            var dmg = Math.min(99, CONFIG.BULLET_DAMAGE_BASE + UpgradeShop.damageBonus(p) + 2);
            assertEq(dmg, 6, '1+3+2');
        });
    });
};
