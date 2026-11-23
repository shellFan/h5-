# V13: 敌人折返前线距离封顶 — 保留近距离侧翼包抄修复, 消除全军回压导致的数值爆炸
import io

def edit(p, old, new, count=1):
    s = io.open(p, encoding='utf-8').read()
    assert s.count(old) == count, (p, s.count(old), repr(old[:70]))
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(old, new))
    print('ok', p)

edit('js/enemies.js',
    """        // Rear ambushes must finish flanking into the forward firing line.
        // Stopping at melee distance behind a lone soldier left them untargetable
        // forever, which also held the next gate's encounter lock forever.
        if (dz < 0) this._returningToFront = true;
        if (this.z <= squad.z - attackDist) this._returningToFront = false;""",
    """        // Rear ambushes must finish flanking into the forward firing line.
        // Stopping at melee distance behind a lone soldier left them untargetable
        // forever, which also held the next gate's encounter lock forever.
        // V13修复: 折返限定作战半径(22u) — 原实现让全部掉队敌人以2.5倍速回压,
        // 高压波次(试玩×3)下已通过敌军整体回流 → 数值压力爆炸(L3等关卡不可通关)。
        // 22u 内的掉队怪仍会归队(保留本修复意图: 门前遭遇锁不再永久卡死);
        // 更远的掉队怪以常规速度自然追赶, 不再瞬时叠加战压。
        if (dz < 0 && dist < 22) this._returningToFront = true;
        if (this.z <= squad.z - attackDist) this._returningToFront = false;""")
