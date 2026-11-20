// ===== V8.0 随机事件系统 =====
// 战斗中每 18~32 秒掷一次事件(65%良性/35%恶性), 全部效果真实生效。
// 应用入口: RandomEvents.update(dt, game);  reset 在每局 start() 时调用。

// V10 QA: 事件怪HP = 基础×关卡乘数×0.5(事件为瞬时批量增援, 低于常规波次单位压力)
function evHp(game, type) {
    var li = game.levelIndex || 0;
    // V10 QA: L1-L5保持历史基线HP(事件为瞬时批量压力, 全部历史平衡/测试以此校准);
    // L6+采用与常规波次相同的关卡HP乘数(修复事件怪基础HP在后期一枪秒的问题)
    if (li < 5) return (CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal).hp;
    var mul = CONFIG.ENEMY_HP_MULTIPLIER[Math.min(li, CONFIG.ENEMY_HP_MULTIPLIER.length - 1)] || 1.7;
    return Math.max(1, Math.round((CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal).hp * mul));
}

var RANDOM_EVENT_DEFS = [
    // —— 良性 (weight 65) ——
    { id: 'airdrop',   name: '空投补给',   icon: '📦', weight: 12, type: 'good',
      desc: '立即补充 15 名士兵',
      apply: function(game) { // V10.1: 空投人数吃士兵成长"招募效率"加成(原固定15, recruitBonus 从未消费于此)
          var rb = (typeof SoldierGrowth !== 'undefined') ? (SoldierGrowth.stats(game.profile).recruitBonus || 0) : 0;
          game.squad.addReinforcements(15 + rb, '空投补给', game.effects); } },
    { id: 'coin_rain', name: '金币雨',     icon: '🪙', weight: 12, type: 'good',
      desc: '立即获得 40 金币',
      apply: function(game) { if (game.profile) game.profile.addCoins(40); } },
    { id: 'frenzy',    name: '狂热时刻',   icon: '🔥', weight: 10, type: 'good',
      desc: '10 秒内全队伤害 ×2',
      apply: function(game) { var s = game.squad; s._evDmgMul = 2; s._evDmgMulT = 10; } },
    { id: 'ammo',      name: '弹药补给',   icon: '🔩', weight: 10, type: 'good',
      desc: '12 秒内射速 ×1.5',
      apply: function(game) { var s = game.squad; s._evRateMul = 1.5; s._evRateMulT = 12; } },
    { id: 'reinforce', name: '援军空降',   icon: '🚁', weight: 8, type: 'good',
      desc: '补充当前人数 30% 的士兵',
      apply: function(game) { game.squad.addReinforcements(Math.max(1, Math.floor(game.squad.count * 0.3)), '援军空降', game.effects); } },
    { id: 'medkit',    name: '战地医疗',   icon: '💉', weight: 8, type: 'good',
      desc: '恢复 10% 编制士兵',
      apply: function(game) { game.squad.addReinforcements(Math.max(1, Math.floor(game.maxCount * 0.1)), '战地医疗', game.effects); } },
    { id: 'crit_storm', name: '弱点洞察',  icon: '🎯', weight: 8, type: 'good',
      desc: '10 秒内暴击率 +20%',
      apply: function(game) { var s = game.squad; s._evCritBonus = 0.2; s._evCritT = 10; } },
    { id: 'freeze_time', name: '冰冻时间', icon: '❄️', weight: 7, type: 'good',
      desc: '全场僵尸冻结 3 秒',
      apply: function(game) {
          var n = 0;
          for (var i = 0; i < game.enemies.enemies.length; i++) {
              var e = game.enemies.enemies[i];
              if (e.alive && !e.isBoss) { e.frozenT = Math.max(e.frozenT || 0, 3); n++; }
          }
          return n > 0;
      } },

    // —— 恶性 (weight 35, V8.0.1: 强度调低避免压垮边缘局) ——
    { id: 'surge',     name: '尸潮暴动',   icon: '💥', weight: 12, type: 'bad',
      desc: '一波增援僵尸从侧翼涌入',
      apply: function(game) {
          var laneCount = 8 + Math.floor(game.elapsedTime / 60) * 3;
          for (var i = 0; i < laneCount; i++) {
              var x = CONFIG.LANE_X[i % 3] + (Math.random() - 0.5) * 1.6;
              game.pacing.spawnFn('normal', x, game.squad.z - CONFIG.BULLET_RANGE * 0.9, null); // V10 QA修复: 走spawnFn吃关卡HP乘数(原直调基础HP, L6+一枪秒)
          }
          return true;
      } },
    { id: 'elite',     name: '精英来袭',   icon: '👹', weight: 8, type: 'bad',
      desc: '2 只变异精英加入战场',
      apply: function(game) {
          for (var i = 0; i < 2; i++) {
              var x = CONFIG.LANE_X[i] + (Math.random() - 0.5) * 1.2;
              game.pacing.spawnFn('elite', x, game.squad.z - CONFIG.BULLET_RANGE * 0.9, null); // V10 QA修复: 同上
          }
          return true;
      } },
    { id: 'toxic_fog', name: '毒雾弥漫',   icon: '☠️', weight: 8, type: 'bad',
      desc: '损失 4% 编制士兵(至少2人)',
      apply: function(game) {
          var lost = Math.min(Math.max(2, Math.floor(game.squad.count * 0.04)), game.squad.count - 1);
          if (lost <= 0) return false;
          game.squad.killSoldiers(lost, game.effects);
          return true;
      } },
    { id: 'ambush',    name: '地道伏击',   icon: '🕳️', weight: 7, type: 'bad',
      desc: '僵尸从小队身后近距离突袭',
      apply: function(game) {
          for (var i = 0; i < 7; i++) {
              var x = CONFIG.LANE_X[i % 3] + (Math.random() - 0.5) * 1.6;
              game.pacing.spawnFn(i % 3 === 2 ? 'fast' : 'normal', x, game.squad.z + 3 + Math.random() * 2, null); // V10 QA修复: 同上
          }
          return true;
      } }
];

var RandomEvents = {
    /** 每局重置: 首个事件 15~25 秒后 */
    reset: function() {
        this._t = 15 + Math.random() * 10;
        this._shown = 0;
    },

    update: function(dt, game) {
        if (!game || game.state !== 'playing' || game.paused) return;
        if (this._t === undefined) this.reset();
        this._t -= dt;
        if (this._t <= 0) {
            this._t = 18 + Math.random() * 14;
            this._trigger(game);
        }
    },

    _trigger: function(game) {
        // 加权随机(良性65 / 恶性35); 冰冻时间无冻结目标时重掷
        for (var attempt = 0; attempt < 4; attempt++) {
            var total = 0, i;
            for (i = 0; i < RANDOM_EVENT_DEFS.length; i++) total += RANDOM_EVENT_DEFS[i].weight;
            var roll = Math.random() * total;
            var def = null;
            for (i = 0; i < RANDOM_EVENT_DEFS.length; i++) {
                roll -= RANDOM_EVENT_DEFS[i].weight;
                if (roll <= 0) { def = RANDOM_EVENT_DEFS[i]; break; }
            }
            if (!def) return;
            var ok = def.apply(game);
            if (ok !== false) {
                this._shown++;
                // 事件横幅: 复用波次横幅 + 飘字
                var el = document.getElementById('v42-wave-banner');
                if (el) {
                    el.textContent = def.icon + ' 随机事件 · ' + def.name + ' — ' + def.desc;
                    el.classList.remove('hidden');
                    el.style.borderColor = def.type === 'bad' ? '#FF6666' : '#FFC247';
                }
                if (game._waveNoticeT !== undefined) game._waveNoticeT = 2.6;
                if (game.effects) {
                    game.effects.floatText(game.squad.x, 2.6, game.squad.z - 2,
                        def.icon + ' ' + def.name, def.type === 'bad' ? '#FF6666' : '#FFC247', true);
                }
                if (game.world) game.world.shake(def.type === 'bad' ? 0.25 : 0.15);
                return;
            }
        }
    }
};
