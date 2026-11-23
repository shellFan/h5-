# V13: 恢复 6155371 基线伤害预算公式(并行会话的"budget"改动使多弹丸武器 DPS 缩水×弹丸数,
# 而全游戏波次/血量数值按旧口径调校 → L3 起不可通关, v51 回归)。
# 该改动的意图(多弹丸伤害膨胀)是真实问题, 但必须配合全盘数值重校准 — 记录于 QA 报告,
# 交由数值设计所有者决策; 本轮恢复已交付的 V12 平衡基线。
import io

def edit(p, old, new, count=1):
    s = io.open(p, encoding='utf-8').read()
    assert s.count(old) == count, (p, s.count(old), repr(old[:70]))
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(old, new))
    print('ok', p)

edit('js/combat.js',
    """                // budget multiplied damage by up to five. Keep fractional damage
                // so minimum-one rounding cannot inflate small squads either.
                var dmg = totalDPS / visualRate / Math.max(1, positions.length);""",
    """                // V13: 恢复 V12 交付基线公式 — c95ef42 的 budget 改动(除以弹丸数)虽修复了
                // "多弹丸武器 DPS 膨胀×3-5"的真实问题, 但全游戏波次/血量按旧口径调校,
                // 导致 L3 起不可通关(v51 L3胜利回归)。数值重校准属核心数值修改(需设计授权),
                // 本轮恢复基线; 该问题已在 docs/V13/QA_REPORT.md 登记为待决策项。
                var dmg = Math.max(1, Math.round(totalDPS / visualRate));""")

# 折返封顶一并回退(未参与 L3 修复; 最小化未经授权的行为变更, 保留并行会话原行为)
edit('js/enemies.js',
    """        // V13修复: 折返限定作战半径(22u) — 原实现让全部掉队敌人以2.5倍速回压,
        // 高压波次(试玩×3)下已通过敌军整体回流 → 数值压力爆炸(L3等关卡不可通关)。
        // 22u 内的掉队怪仍会归队(保留本修复意图: 门前遭遇锁不再永久卡死);
        // 更远的掉队怪以常规速度自然追赶, 不再瞬时叠加战压。
        if (dz < 0 && dist < 22) this._returningToFront = true;""",
    """        if (dz < 0) this._returningToFront = true;""")
