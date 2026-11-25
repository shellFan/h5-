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
    // —— 良性 (V15-GAMEPLAY-001: 克制招募增幅 + 单次上限 + 医疗转healSquad A+B) ——
    { id: 'airdrop',   name: '空投补给',   icon: '📦', weight: 8, type: 'good', isRecruit: true,
      desc: '空投支援 4~6 名士兵',
      apply: function(game) {
          var rb = (typeof SoldierGrowth !== 'undefined' && game.profile) ? (SoldierGrowth.stats(game.profile).recruitBonus || 0) : 0;
          var want = Math.min(6, 4 + Math.max(0, Math.floor(rb)));
          var allowed = Math.min(want, Math.max(0, RandomEvents.RECRUIT_CAP_PER_RUN - (RandomEvents._recruitTotal || 0)));
          if (allowed <= 0) return false;
          var added = game.squad.addReinforcements(allowed, '空投补给', game.effects);
          RandomEvents._recruitTotal = (RandomEvents._recruitTotal || 0) + added;
          return added > 0;
      } },
    { id: 'coin_rain', name: '金币雨',     icon: '🪙', weight: 12, type: 'good',
      desc: '立即获得 40 金币',
      apply: function(game) { if (game.profile) game.profile.addCoins(40); } },
    { id: 'frenzy',    name: '狂热时刻',   icon: '🔥', weight: 10, type: 'good',
      desc: '10 秒内全队伤害 ×2',
      apply: function(game) { var s = game.squad; s._evDmgMul = 2; s._evDmgMulT = 10; } },
    { id: 'ammo',      name: '弹药补给',   icon: '🔩', weight: 10, type: 'good',
      desc: '12 秒内射速 ×1.5',
      apply: function(game) { var s = game.squad; s._evRateMul = 1.5; s._evRateMulT = 12; } },
    { id: 'reinforce', name: '援军空降',   icon: '🚁', weight: 5, type: 'good', isRecruit: true,
      desc: '空降当前人数 8% 援军(2~8人)',
      apply: function(game) {
          var want = Math.min(8, Math.max(2, Math.floor(game.squad.count * 0.08)));
          var allowed = Math.min(want, Math.max(0, RandomEvents.RECRUIT_CAP_PER_RUN - (RandomEvents._recruitTotal || 0)));
          if (allowed <= 0) return false;
          var added = game.squad.addReinforcements(allowed, '援军空降', game.effects);
          RandomEvents._recruitTotal = (RandomEvents._recruitTotal || 0) + added;
          return added > 0;
      } },
    { id: 'medkit',    name: '战地医疗',   icon: '💉', weight: 8, type: 'good',
      desc: '恢复损失编制(满编获2层护盾)',
      apply: function(game) {
          var loss = (game.squad && game.squad.recoverableLoss) || 0;
          var healAmt = Math.min(6, Math.max(3, Math.ceil(loss * 0.15)));
          if (game.squad && game.squad.healSquad) {
              game.squad.healSquad(healAmt, 'medkit', game.effects);
              return true;
          }
          return false;
      } },
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
          game.squad.killSoldiers(lost, game.effects, { unrecoverable: true });
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
    RECRUIT_CAP_PER_RUN: 20,
    SHARED_RECRUIT_CD: 45,
    SAME_RECRUIT_CD: 60,

    /** 每局重置: V15-GAMEPLAY-001 首个事件 >=25s, 后续 24~38s, 清空招募额度与冷却 */
    reset: function() {
        this._t = 25 + Math.random() * 10;
        this._shown = 0;
        this._recruitTotal = 0;
        this._sharedRecruitCd = 0;
        this._eventCd = {};
    },

    update: function(dt, game) {
        if (!game || game.state !== 'playing' || game.paused) return;
        if (this._t === undefined) this.reset();
        if (this._sharedRecruitCd > 0) this._sharedRecruitCd = Math.max(0, this._sharedRecruitCd - dt);
        for (var k in this._eventCd) {
            if (this._eventCd[k] > 0) this._eventCd[k] = Math.max(0, this._eventCd[k] - dt);
        }
        this._t -= dt;
        if (this._t <= 0) {
            this._t = 24 + Math.random() * 14;
            this._trigger(game);
        }
    },

    _eligible: function(def) {
        if (def.isRecruit) {
            if ((this._recruitTotal || 0) >= this.RECRUIT_CAP_PER_RUN) return false;
            if ((this._sharedRecruitCd || 0) > 0) return false;
            if (this._eventCd && (this._eventCd[def.id] || 0) > 0) return false;
        }
        return true;
    },

    _trigger: function(game) {
        // V15-GAMEPLAY-001: 过滤超出单局额度或冷却中的招募事件, 其余事件正常抽取
        var pool = [];
        for (var p = 0; p < RANDOM_EVENT_DEFS.length; p++) {
            if (this._eligible(RANDOM_EVENT_DEFS[p])) pool.push(RANDOM_EVENT_DEFS[p]);
        }
        if (!pool.length) return;
        for (var attempt = 0; attempt < 4; attempt++) {
            var total = 0, i;
            for (i = 0; i < pool.length; i++) total += pool[i].weight;
            var roll = Math.random() * total;
            var def = null;
            for (i = 0; i < pool.length; i++) {
                roll -= pool[i].weight;
                if (roll <= 0) { def = pool[i]; break; }
            }
            if (!def) return;
            var ok = def.apply(game);
            if (ok !== false) {
                if (def.isRecruit) {
                    this._sharedRecruitCd = this.SHARED_RECRUIT_CD;
                    this._eventCd[def.id] = this.SAME_RECRUIT_CD;
                }
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
