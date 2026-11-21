# V13 增量 → v118 基线重放(军械库保持 v118 图集方案, 剪影用于图鉴; 科技树/排行/设置为 V13 增量)
import io

def edit(p, old, new, count=1):
    s = io.open(p, encoding='utf-8').read()
    assert s.count(old) == count, (p, s.count(old), repr(old[:80]))
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(old, new))
    print('ok', p)

P = 'js/ui-v60.js'

# 1. weaponIconSvg 定义(图鉴用)
edit(P,
    "    renderCodex: function(game) {",
    """    /** V13: 武器剪影图标(程序化 SVG, 按 type 区分轮廓, tier 决定色阶, evolved 金色发光)
     *  剪影设计遵循 ART_DIRECTION「剪影优先」规则: 0.3s 内可分辨武器类型。
     *  军械库主视图使用 v118 武器图集(hero 大图); 本剪影服务于图鉴等小尺寸列表场景。 */
    weaponIconSvg: function(type, tier, evolved) {
        var TIER_COLORS = ['#8FA8C2', '#8FA8C2', '#4A8FE0', '#4A8FE0', '#9A6EE0', '#FFC247'];
        var base = evolved ? '#FFC247' : (TIER_COLORS[tier] || '#8FA8C2');
        var dark = evolved ? '#B8860B' : '#2E4A6E';
        var lite = evolved ? '#FFE9A8' : '#B8D4F0';
        var glow = evolved ? '<circle cx="10" cy="9" r="7.2" fill="#FFC247" opacity=".25"/><circle cx="10" cy="9" r="4.6" fill="#FFE9A8" opacity=".4"/>' : '';
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
        return '<svg class="v13-wicon" viewBox="0 0 64 38" width="46" height="27" aria-hidden="true">' + glow +
            '<path d="' + d.body + '" fill="' + base + '" stroke="' + dark + '" stroke-width="1.2" stroke-linejoin="round"/>' +
            d.extra + '</svg>';
    },

    renderCodex: function(game) {""")

# 2. 图鉴武器: emoji → 剪影
edit(P,
    """                '<div class="v60-codex-icon">' + (got ? def.icon : '🔒') + '</div>' +""",
    """                '<div class="v60-codex-icon">' + (got ? this.weaponIconSvg(def.type, 3, false) : '🔒') + '</div>' +""")

# 3. 科技树: 分支徽记+导轨+连线+等级点(节点关系/规则零改动)
edit(P,
    """        var self = this;
        var branches = { fire: '火力科技', army: '军团科技', logi: '后勤科技' };
        for (var branch in branches) {
            var title = document.createElement('div');
            title.className = 'v60-tech-branch';
            title.textContent = branches[branch];
            listEl.appendChild(title);""",
    """        var self = this;
        var branches = { fire: '火力科技', army: '军团科技', logi: '后勤科技' };
        var BRANCH_ICONS = { fire: '⚔️', army: '🛡️', logi: '🔧' }; // V13: 分支徽记
        for (var branch in branches) {
            var title = document.createElement('div');
            title.className = 'v60-tech-branch v13-tech-branch';
            title.innerHTML = '<span class="v13-tech-rail" aria-hidden="true"></span><span class="v13-tech-branch-badge">' + BRANCH_ICONS[branch] + '</span>' + branches[branch];
            listEl.appendChild(title);""")

edit(P,
    """                row.className = 'v60-tech-row' + (lv >= def.max ? ' maxed' : check.ok && tp >= check.cost ? ' ready' : check.ok ? '' : ' locked');
                row.innerHTML =
                    '<div class="v60-ach-info"><div class="v60-ach-name">' + def.icon + ' ' + def.name + ' <i>Lv.' + lv + '/' + def.max + '</i></div>' +
                    '<div class="v60-ach-desc">' + def.desc + (def.req && lv < def.max ? ' · 前置: ' + TECH_DEFS[def.req].name : '') + '</div></div>' +
                    '<div class="v60-ach-reward">' + (lv >= def.max ? 'MAX' : def.cost + '🔬') + '</div>';""",
    """                row.className = 'v60-tech-row v13-tech-node' + (lv >= def.max ? ' maxed' : check.ok && tp >= check.cost ? ' ready' : check.ok ? '' : ' locked');
                var pips = '<span class="v13-tech-pips" aria-hidden="true">';
                for (var pi = 0; pi < def.max; pi++) pips += '<i class="' + (pi < lv ? 'on' : '') + '"></i>';
                pips += '</span>';
                row.innerHTML =
                    '<span class="v13-tech-connector" aria-hidden="true"></span>' +
                    '<div class="v60-ach-info"><div class="v60-ach-name">' + def.icon + ' ' + def.name + ' <i>Lv.' + lv + '/' + def.max + '</i>' + pips + '</div>' +
                    '<div class="v60-ach-desc">' + def.desc + (def.req && lv < def.max ? ' · 前置: ' + TECH_DEFS[def.req].name : '') + '</div></div>' +
                    '<div class="v60-ach-reward">' + (lv >= def.max ? 'MAX' : def.cost + '🔬') + '</div>';""")

# 4. 排行榜: 数据源错误态 + 富空态(数据源=本地榜不变)
s = io.open(P, encoding='utf-8').read()
import re
m = re.search(r"renderRank: function\(game\) \{[^}]*?var list = Leaderboard\.top\(game\.profile, LEADERBOARD_CAP\);", s)
if m:
    old = """        var list = Leaderboard.top(game.profile, LEADERBOARD_CAP);
        el.innerHTML = '';"""
    if old in s:
        new = """        var list = [];
        try {
            list = Leaderboard.top(game.profile, LEADERBOARD_CAP);
        } catch (e) {
            // V13: 数据源异常态(本地榜读取失败) — 如实呈现, 不伪造数据
            el.innerHTML = '<div class="v60-rank-empty v13-rank-error">⚠️ 排行数据加载失败<br><span class="v13-rank-error-tip">请返回后重试</span></div>';
            return;
        }
        el.innerHTML = '';"""
        assert s.count(old) == 1
        s = s.replace(old, new)
        print('ok rank try/catch')
    old2 = """            el.innerHTML = '<div class="v60-rank-empty">暂无战绩 · 完成一局战斗后进入排行</div>';"""
    if old2 in s:
        new2 = """            el.innerHTML = '<div class="v60-rank-empty v13-rank-empty-rich">' +
                '<div class="v13-rank-empty-medals" aria-hidden="true"><span>🥈</span><span class="gold">🥇</span><span>🥉</span></div>' +
                '暂无战绩 · 完成一局战斗后进入排行</div>';"""
        assert s.count(old2) == 1
        s = s.replace(old2, new2)
        print('ok rank rich empty')

# 5. 设置页: 减少动效(模板行+bind+renderSettings+启动恢复)
edit(P,
    """                    '<div class="v60-setting-row"><span>屏幕震动</span><button id="v60-set-shake" class="v60-toggle"></button></div>' +""",
    """                    '<div class="v60-setting-row"><span>屏幕震动</span><button id="v60-set-shake" class="v60-toggle"></button></div>' +
                    '<div class="v60-setting-row"><span>减少动效</span><button id="v60-set-motion" class="v60-toggle"></button></div>' +""")

edit(P,
    """        bind('v60-set-shake', function() {""",
    """        bind('v60-set-motion', function() {
            // V13: 减少动态效果开关 — prefers-reduced-motion 的游戏内等价(H5/微信双端同步)
            var cur = false;
            try { cur = Platform.storage.get('motion_reduced', 'false') === 'true'; } catch (e) {}
            var next = !cur;
            Platform.storage.set('motion_reduced', next ? 'true' : 'false');
            var root = document.documentElement;
            if (root && root.classList) root.classList.toggle('v13-reduced-motion', next);
            if (window.__minidom && window.__minidom.body) window.__minidom.body.classList.toggle('v13-reduced-motion', next);
            self.renderSettings(game);
        });
        bind('v60-set-shake', function() {""")

edit(P,
    """        var shakeBtn = document.getElementById('v60-set-shake');
        if (shakeBtn) shakeBtn.textContent = game.world._shakeDisabled ? '🚫 关' : '💥 开';""",
    """        var shakeBtn = document.getElementById('v60-set-shake');
        if (shakeBtn) shakeBtn.textContent = game.world._shakeDisabled ? '🚫 关' : '💥 开';
        var motionBtn = document.getElementById('v60-set-motion');
        var motionOn = false;
        try { motionOn = Platform.storage.get('motion_reduced', 'false') === 'true'; } catch (e) {}
        if (motionBtn) motionBtn.textContent = motionOn ? '🚫 关' : '✨ 开';
        var htmlRoot = document.documentElement;
        if (htmlRoot && htmlRoot.classList) htmlRoot.classList.toggle('v13-reduced-motion', motionOn);
        if (window.__minidom && window.__minidom.body) window.__minidom.body.classList.toggle('v13-reduced-motion', motionOn);""")

# 6. 启动恢复(挂在现有"启动时恢复设置"附近; 找 shake 恢复块)
import re
m2 = re.search(r"(// 启动时恢复设置[\s\S]{0,200}?shakeDisabled = true;[\s\S]{0,40}?\})", s)
if m2:
    s = s.replace(m2.group(1), m2.group(1) + """
        // V13: 启动恢复"减少动效"偏好
        try {
            var motionOn0 = Platform.storage.get('motion_reduced', 'false') === 'true';
            var htmlRoot0 = document.documentElement;
            if (htmlRoot0 && htmlRoot0.classList) htmlRoot0.classList.toggle('v13-reduced-motion', motionOn0);
            if (window.__minidom && window.__minidom.body) window.__minidom.body.classList.toggle('v13-reduced-motion', motionOn0);
        } catch (e) {}""")
    print('ok startup motion restore')

io.open(P, 'w', encoding='utf-8', newline='\n').write(s)
print('saved')
