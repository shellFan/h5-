# V13 UI 批量升级: 图鉴武器剪影 / 科技树连线+等级点 / 排行榜加载态
import io

def edit(p, old, new, count=1):
    s = io.open(p, encoding='utf-8').read()
    assert s.count(old) == count, (p, s.count(old), repr(old[:70]))
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(old, new))
    print('ok', p)

# 1. 图鉴: 武器剪影(已解锁) — 与军械库一致
edit('js/ui-v60.js',
    """                '<div class="v60-codex-icon">' + (got ? def.icon : '🔒') + '</div>' +""",
    """                '<div class="v60-codex-icon">' + (got ? this.weaponIconSvg(def.type, 3, false) : '🔒') + '</div>' +""")

# 2. 科技树: 分支导轨 + 节点连线 + 等级点(纯 CSS/结构, 节点关系与升级规则零改动)
edit('js/ui-v60.js',
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

edit('js/ui-v60.js',
    """                row.className = 'v60-tech-row' + (lv >= def.max ? ' maxed' : check.ok && tp >= check.cost ? ' ready' : check.ok ? '' : ' locked');
                row.innerHTML =
                    '<div class="v60-ach-info"><div class="v60-ach-name">' + def.icon + ' ' + def.name + ' <i>Lv.' + lv + '/' + def.max + '</i></div>' +
                    '<div class="v60-ach-desc">' + def.desc + (def.req && lv < def.max ? ' · 前置: ' + TECH_DEFS[def.req].name : '') + '</div></div>' +
                    '<div class="v60-ach-reward">' + (lv >= def.max ? 'MAX' : def.cost + '🔬') + '</div>';""",
    """                row.className = 'v60-tech-row v13-tech-node' + (lv >= def.max ? ' maxed' : check.ok && tp >= check.cost ? ' ready' : check.ok ? '' : ' locked');
                // V13: 等级点(pips) — 满级=已完成, 未满=点亮进度
                var pips = '<span class="v13-tech-pips" aria-hidden="true">';
                for (var pi = 0; pi < def.max; pi++) pips += '<i class="' + (pi < lv ? 'on' : '') + '"></i>';
                pips += '</span>';
                row.innerHTML =
                    '<span class="v13-tech-connector" aria-hidden="true"></span>' +
                    '<div class="v60-ach-info"><div class="v60-ach-name">' + def.icon + ' ' + def.name + ' <i>Lv.' + lv + '/' + def.max + '</i>' + pips + '</div>' +
                    '<div class="v60-ach-desc">' + def.desc + (def.req && lv < def.max ? ' · 前置: ' + TECH_DEFS[def.req].name : '') + '</div></div>' +
                    '<div class="v60-ach-reward">' + (lv >= def.max ? 'MAX' : def.cost + '🔬') + '</div>';""")

# 3. 排行榜: 加载态 + 错误态助手(空态已有; 数据源仍为本地榜, 不伪造数据)
edit('js/ui-v60.js',
    """        var list = Leaderboard.top(game.profile, LEADERBOARD_CAP);
        el.innerHTML = '';
        if (!list.length) {
            el.innerHTML = '<div class="v60-rank-empty">暂无战绩 · 完成一局战斗后进入排行</div>';
            return;
        }""",
    """        var list = [];
        try {
            list = Leaderboard.top(game.profile, LEADERBOARD_CAP);
        } catch (e) {
            // V13: 数据源异常态(本地榜读取失败) — 如实呈现, 不伪造数据
            el.innerHTML = '<div class="v60-rank-empty v13-rank-error">⚠️ 排行数据加载失败<br><span class="v13-rank-error-tip">请返回后重试</span></div>';
            return;
        }
        el.innerHTML = '';
        if (!list.length) {
            el.innerHTML = '<div class="v60-rank-empty v13-rank-empty-rich">' +
                '<div class="v13-rank-empty-medals" aria-hidden="true"><span>🥈</span><span class="gold">🥇</span><span>🥉</span></div>' +
                '暂无战绩 · 完成一局战斗后进入排行</div>';
            return;
        }""")
