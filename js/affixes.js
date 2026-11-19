// ===== V6.0 精英词缀系统 =====
// 精英僵尸随机获得1-2个词缀, 词缀修改属性并添加视觉标识。
// 词缀强度随关卡等级增长。

var AFFIX_DEFS = {
    frenzy:   { name: '狂暴', icon: '💥', apply: function(e) { e.speedMul = (e.speedMul || 1) * 1.5; } },
    hard:     { name: '坚硬', icon: '🔒', apply: function(e) { e.hp *= 1.6; e.maxHp = e.hp; } },
    vampiric: { name: '吸血', icon: '🩸', apply: function(e) { e._affixVamp = true; } },
    splitter: { name: '分裂', icon: '🧬', apply: function(e) { e._affixSplit = true; } },
    venom:    { name: '毒液', icon: '🧪', apply: function(e) { e._affixVenom = true; } },
    shielded: { name: '护盾', icon: '🔵', apply: function(e) { e._affixShield = true; e._affixShieldT = 0; } }
};

var AffixSystem = {
    /** 给精英怪随机分配词缀(1-2个, 不重复) */
    roll: function(enemy, levelIndex) {
        if (enemy.type !== 'elite') return;
        var keys = Object.keys(AFFIX_DEFS);
        var count = 1 + (Math.random() < 0.3 + levelIndex * 0.1 ? 1 : 0);
        var picked = [];
        var copy = keys.slice();
        for (var i = 0; i < count && copy.length; i++) {
            var idx = Math.floor(Math.random() * copy.length);
            picked.push(copy.splice(idx, 1)[0]);
        }
        enemy.affixes = picked;
        enemy.affixNames = picked.map(function(k) { return AFFIX_DEFS[k].name; }).join('+');
        picked.forEach(function(k) { AFFIX_DEFS[k].apply(enemy); });
        // 视觉: 词缀色环
        enemy._affixColor = picked.length >= 2 ? 0xFF4444 : 0xFFAA33;
    },
    /** 每帧处理词缀效果 */
    update: function(enemy, dt, squad, manager, effects) {
        if (!enemy.affixes || !enemy.alive) return;
        // 吸血: 攻击时恢复
        if (enemy._affixVamp && enemy.attackT > 0) {
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + 2);
        }
        // 护盾: 周期性生成
        if (enemy._affixShield) {
            enemy._affixShieldT = (enemy._affixShieldT || 0) - dt;
            if (enemy._affixShieldT <= 0) {
                enemy._affixShieldT = 6;
                enemy.shieldT = 2.5;
            }
        }
        // 毒液: 攻击附带持续伤害
        if (enemy._affixVenom && enemy.attackT > 0 && squad.count > 0) {
            squad._venomStacks = Math.max(squad._venomStacks || 0, 1);
            squad._venomFromElite = 8;
            squad._venomApplied = 0; // 单次附毒上限重置
        }
        // V10 QA修复: 毒液此前只写不读(词缀完全无效) — 小队侧持续减员DoT, 单次附毒最多4人/计数>3时生效
        if ((squad._venomFromElite || 0) > 0 && ((manager && manager._levelIndex) || 0) >= 3) { // V10 QA: 毒液DoT自L4起生效(早期关卡小队规模小, 不引入减员压力)
            squad._venomFromElite -= dt;
            squad._venomTick = (squad._venomTick || 0) + dt;
            if (squad._venomTick >= 2) { // 每2秒1跳
                squad._venomTick = 0;
                if (squad.count > 8 && (squad._venomApplied || 0) < 2) { // 单次附毒上限2人, 小队>8人才生效(保持L3边际胜率)
                    squad._venomApplied = (squad._venomApplied || 0) + 1;
                    squad.killSoldiers(1, effects);
                }
            }
            if (squad._venomFromElite <= 0) { squad._venomStacks = 0; }
        }
    },
    /** 死亡时分裂 */
    onDeath: function(enemy, manager) {
        if (!enemy.affixes) return;
        if (enemy._affixSplit) {
            for (var i = 0; i < 2; i++) {
                var mini = manager.spawnEnemy('normal', enemy.x + (i ? 0.5 : -0.5), enemy.z, 3);
                if (mini) { mini.model.scale.multiplyScalar(0.5); mini.visScale = mini.cfg.scale * 0.5; }
            }
        }
    }
};
