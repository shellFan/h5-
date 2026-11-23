# V13 军械库武器剪影 SVG 图标(替换 emoji) + 科技树连线 + 排行榜空态
import io

def edit(p, old, new, count=1):
    s = io.open(p, encoding='utf-8').read()
    assert s.count(old) == count, (p, s.count(old), repr(old[:70]))
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(old, new))
    print('ok', p)

# 1. ui-v60.js: 武器剪影 SVG 生成器(挂在 V60UI 命名空间, 表现层; 数据/数值零改动)
edit('js/ui-v60.js',
    """    renderArmory: function(game) {""",
    """    /** V13: 武器剪影图标(程序化 SVG, 按 type 区分轮廓, tier 决定色阶, evolved 金色发光)
     *  剪影设计遵循 ART_DIRECTION「剪影优先」规则: 0.3s 内可分辨武器类型。 */
    weaponIconSvg: function(type, tier, evolved) {
        var TIER_COLORS = ['#8FA8C2', '#8FA8C2', '#4A8FE0', '#4A8FE0', '#9A6EE0', '#FFC247'];
        var base = evolved ? '#FFC247' : (TIER_COLORS[tier] || '#8FA8C2');
        var dark = evolved ? '#B8860B' : '#2E4A6E';
        var lite = evolved ? '#FFE9A8' : '#B8D4F0';
        var glow = evolved ? '<circle cx="10" cy="9" r="7.2" fill="#FFC247" opacity=".25"/><circle cx="10" cy="9" r="4.6" fill="#FFE9A8" opacity=".4"/>' : '';
        // 各类型剪影(body: 主体 path, extra: 特征件)
        var P = {
            single: { body: 'M10 18h30l2-3h14v6h-8l-2 3H18l-2 4h-5l1-4h-3z', extra: '<rect x="24" y="24" width="6" height="10" rx="1.5" transform="rotate(-14 27 29)" fill="' + dark + '"/><rect x="12" y="14" width="4" height="4" fill="' + dark + '"/>' },
            spread: { body: 'M8 17h14l3-4h8v5h-6l-2 3H12z M33 15h18v8h-6l-2 4h-8z', extra: '<rect x="20" y="23" width="10" height="4" rx="2" fill="' + dark + '"/><rect x="36" y="14" width="3" height="10" fill="' + dark + '"/>' },
            pierce: { body: 'M6 19h10l2-2h40v5h-14l-3 4h-9l-2-3H12z', extra: '<rect x="30" y="11" width="14" height="5" rx="2.4" fill="' + dark + '"/><circle cx="37" cy="13.5" r="2" fill="' + lite + '"/><rect x="16" y="22" width="5" height="8" rx="1.5" transform="rotate(-16 18 26)" fill="' + dark + '"/>' },
            rapid: { body: 'M8 16h12l2-2h26v7h-9l-2 4h-8l-2-3H12z', extra: '<circle cx="22" cy="28" r="6" fill="' + dark + '"/><circle cx="22" cy="28" r="3" fill="' + lite + '"/><rect x="44" y="15" width="8" height="3" fill="' + dark + '"/>' },
            cone: { body: 'M8 17h10l3-3h10v10h-8l-2 3h-9z', extra: '<circle cx="34" cy="19" r="7.5" fill="' + dark + '"/><circle cx="34" cy="19" r="4" fill="' + lite + '"/><path d="M43 19l8-4-2 4 2 4z" fill="#FF8844"/>' },
            explosive: { body: 'M6 16h14l3-3h20v10h-8l-3 4h-10l-2-3H10z', extra: '<path d="M43 14l10 5-10 5z" fill="#FF8844"/><rect x="18" y="25" width="8" height="4" rx="2" fill="' + dark + '"/>' },
            freeze: { body: 'M8 16h12l2-2h18v9h-8l-2 3h-8l-2-3H12z', extra: '<rect x="40" y="13" width="9" height="12" rx="3" fill="#BFEFFF"/><path d="M50 19h6M53 16l-3 3 3 3" stroke="#7FD4FF" stroke-width="2" fill="none"/><circle cx="35" cy="25" r="3" fill="#7FD4FF"/>' },
            chain: { body: 'M8 18h12l2-2h16v8h-9l-2 3h-9l-2-3H12z', extra: '<rect x="38" y="13" width="5" height="12" rx="1.5" fill="' + dark + '"/><rect x="44" y="14" width="4" height="10" rx="1.5" fill="' + lite + '"/><path d="M52 15l4 2-1 3 3 2-4 2" stroke="#B8E0FF" stroke-width="2" fill="none"/>' }
        };
        var d = P[type] || P.single;
        return '<svg class="v13-wicon" viewBox="0 0 64 38" width="58" height="34" aria-hidden="true">' + glow +
            '<path d="' + d.body + '" fill="' + base + '" stroke="' + dark + '" stroke-width="1.2" stroke-linejoin="round"/>' +
            d.extra + '</svg>';
    },

    renderArmory: function(game) {""")

# 2. renderArmory: emoji → SVG 剪影(稀有度色阶随武器等级; 进化态金色)
edit('js/ui-v60.js',
    """            row.innerHTML =
                '<div class="v60-armory-head"><span class="v60-armory-icon">' + def.icon + '</span>' +""",
    """            // V13: 剪影图标(未解锁灰阶; 已解锁按等级色阶; 当前装备若已进化 → 金色发光)
            var iconTier = unlockedNow ? Math.min(5, (wLv || 0) + 1) : 0;
            var iconSvg = this.weaponIconSvg(def.type, iconTier, isCurrent && wStats.evolvedName);
            row.innerHTML =
                '<div class="v60-armory-head"><span class="v60-armory-icon">' + iconSvg + '</span>' +""")

# 3. 图鉴页武器区同步使用剪影
s = io.open('js/ui-v60.js', encoding='utf-8').read()
import re
m = re.search(r"renderCodex: function\(game\) \{", s)
print('codex renderer found:', bool(m))
