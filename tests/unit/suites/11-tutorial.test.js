// ===== V17 新手教程单测 =====
// 覆盖: 触发判定矩阵 / 已阅标记持久化(含 _normalize 白名单回归) / 内容页完整性

module.exports.run = function(ctx) {
    const { describe, test, assert, assertEq } = ctx;

    function makeProfile() {
        return new GameProfile(new GameStorage(new MemoryStorageAdapter()));
    }

    describe('TutorialUI 触发判定', () => {
        test('首次通关第1关 → 弹出', () => {
            var p = makeProfile();
            assert(TutorialUI.shouldShowOnWin(0, p), 'L1胜利且未看过 → 弹');
        });
        test('通关非第1关 → 不弹', () => {
            var p = makeProfile();
            assert(!TutorialUI.shouldShowOnWin(1, p), 'L2胜利不触发win钩子');
            assert(!TutorialUI.shouldShowOnWin(4, p), 'L5胜利不触发');
        });
        test('首次在第2关失败 → 弹出', () => {
            var p = makeProfile();
            assert(TutorialUI.shouldShowOnLose(1, p), 'L2死亡且未看过 → 弹');
        });
        test('失败在非第2关 → 不弹', () => {
            var p = makeProfile();
            assert(!TutorialUI.shouldShowOnLose(0, p), 'L1死亡不触发lose钩子(留给重试后win钩子)');
            assert(!TutorialUI.shouldShowOnLose(2, p), 'L3死亡不触发');
        });
        test('已看过(tutorialSeen) → 两个钩子都不弹', () => {
            var p = makeProfile();
            TutorialUI.markSeen(p);
            assert(!TutorialUI.shouldShowOnWin(0, p), '看过后L1胜利不再弹');
            assert(!TutorialUI.shouldShowOnLose(1, p), '看过后L2死亡不再弹');
        });
        test('无档案/无data → 防御性返回false', () => {
            assert(!TutorialUI.shouldShowOnWin(0, null), 'profile=null');
            assert(!TutorialUI.shouldShowOnLose(1, null), 'profile=null');
            assert(!TutorialUI.seen(null), 'seen(null)=false');
        });
    });

    describe('TutorialUI.markSeen 持久化', () => {
        test('标记后写入档案并可跨实例恢复(模拟刷新)', () => {
            var st = new MemoryStorageAdapter();
            var p = new GameProfile(new GameStorage(st));
            assert(!p.data.tutorialSeen, '新档案未看过');
            assert(TutorialUI.markSeen(p), '标记成功');
            assert(p.data.tutorialSeen === true, 'data.tutorialSeen=true');
            var p2 = new GameProfile(new GameStorage(st));
            assertEq(p2.data.tutorialSeen, true, '重进后保留(未被_normalize清除)');
        });
        test('幂等: 重复标记不报错', () => {
            var p = makeProfile();
            TutorialUI.markSeen(p);
            TutorialUI.markSeen(p);
            assert(TutorialUI.seen(p));
        });
        test('markSeen(null) 安全返回false', () => {
            assert(!TutorialUI.markSeen(null));
        });
    });

    describe('PAGES 内容完整性', () => {
        test('≥3页且每页有标题与≥2条目', () => {
            assert(TutorialUI.PAGES.length >= 3, '页数≥3(实际' + TutorialUI.PAGES.length + ')');
            TutorialUI.PAGES.forEach(function(pg, i) {
                assert(pg.title && pg.title.length > 0, '第' + (i + 1) + '页有标题');
                assert(pg.items.length >= 2, '第' + (i + 1) + '页条目≥2');
                pg.items.forEach(function(it, j) {
                    assert(it.icon && it.head && it.text, '第' + (i + 1) + '页条目' + (j + 1) + '字段齐全');
                });
            });
        });
        test('覆盖用户核心问题: 加人/初始人数/升级武器', () => {
            var all = '';
            TutorialUI.PAGES.forEach(function(pg) {
                all += pg.title;
                pg.items.forEach(function(it) { all += it.head + it.text; });
            });
            assert(all.indexOf('新兵招募') >= 0, '提到商店新兵招募(初始人数)');
            assert(all.indexOf('扩编') >= 0, '提到科技扩编(初始人数)');
            assert(all.indexOf('军械库') >= 0, '提到军械库(武器升级)');
            assert(all.indexOf('×2') >= 0 || all.indexOf('倍增') >= 0, '提到倍增门');
            assert(all.indexOf('+N') >= 0, '提到人数门');
        });
    });

    describe('economy _normalize 白名单回归', () => {
        test('损坏/旧档案缺 tutorialSeen 字段 → 归一化为false而非undefined', () => {
            var p = makeProfile(); // 空档案走 _normalize 默认分支
            assertEq(p.data.tutorialSeen, false);
        });
        test('旧字段伪造值(数字1)归一化为布尔true', () => {
            var store = new GameStorage(new MemoryStorageAdapter());
            store.set('profile_v51', { profileVersion: 3, coins: 5, tutorialSeen: 1 });
            var p = new GameProfile(store);
            assertEq(p.data.tutorialSeen, true, '!!1 === true');
        });
    });
};
