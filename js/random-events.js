// ===== V18.0 随机危机事件系统 (CrisisEventSystem) =====
// 完整事件池占比: 危机事件 75% / 中性事件 10% / 补给事件 15% (共 15 种事件)
// 所有危机均有明确预警与公平应对窗口, 禁止无预警直接秒杀玩家!
// 应用入口: RandomEvents.update(dt, game);  reset 在每局 start() 时调用。

var RANDOM_EVENT_DEFS = [
    // ==================== 危机事件 (合计权重 75) ====================
    { id: 'flank_ambush', name: '侧翼伏击', icon: '⚠️', weight: 15, type: 'bad', minLevel: 1,
      desc: '敌军伏击怪正从道路两侧翻栏逼近!',
      apply: function(game) {
          var n = 4 + Math.min(4, Math.floor((game.levelIndex || 0) / 2));
          for (var i = 0; i < n; i++) {
              var side = (i % 2 === 0 ? -1 : 1) * 5.2;
              var z = game.squad.z - 7.0 - (i * 0.9);
              if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn('flanker', side, z, null);
              else if (game.enemies) game.enemies.spawnEnemy('flanker', side, z);
          }
          return true;
      } },
    { id: 'surge', name: '狂暴怪潮', icon: '💥', weight: 12, type: 'bad', minLevel: 1,
      desc: '大量普通与快速怪潮从前方涌来!',
      apply: function(game) {
          var n = 8 + Math.min(8, Math.floor((game.elapsedTime || 0) / 45) * 2);
          for (var i = 0; i < n; i++) {
              var x = CONFIG.LANE_X[i % 3] + (Math.random() - 0.5) * 1.6;
              var z = game.squad.z - 13.5 - Math.floor(i / 3) * 1.4;
              var tp = (i % 3 === 0) ? 'fast' : 'normal';
              if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn(tp, x, z, null);
              else if (game.enemies) game.enemies.spawnEnemy(tp, x, z);
          }
          return true;
      } },
    { id: 'enemy_frenzy', name: '敌军狂暴', icon: '🔥', weight: 10, type: 'bad', minLevel: 1,
      desc: '附近怪物进入狂暴, 移速+20% (6秒)!',
      apply: function(game) {
          var es = (game.enemies && game.enemies.enemies) || [];
          var hit = 0;
          for (var i = 0; i < es.length; i++) {
              var e = es[i];
              if (e.alive && !e.isBoss && Math.abs(e.z - game.squad.z) < 22) {
                  e.speedMul = Math.max(e.speedMul || 1, 1.2);
                  hit++;
              }
          }
          if (hit > 0) {
              setTimeout(function() {
                  for (var j = 0; j < es.length; j++) if (es[j].alive && !es[j].isBoss && es[j].speedMul === 1.2) es[j].speedMul = 1;
              }, 6000);
          }
          return hit > 0;
      } },
    { id: 'elite', name: '精英突降', icon: '👹', weight: 8, type: 'bad', minLevel: 3,
      desc: '1 只重装变异精英降临战场!',
      apply: function(game) {
          var x = (Math.random() - 0.5) * 2.4;
          var z = game.squad.z - 15;
          if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn('elite', x, z, null);
          else if (game.enemies) game.enemies.spawnEnemy('elite', x, z);
          return true;
      } },
    { id: 'enemy_reinforce', name: '敌军增援', icon: '🚨', weight: 8, type: 'bad', minLevel: 1,
      desc: '混编敌军增援部队抵达前线!',
      apply: function(game) {
          var li = game.levelIndex || 0;
          var n = 6 + Math.min(6, li);
          var pool = li >= 1 ? ['normal', 'fast', 'shield', 'spitter'] : ['normal', 'fast', 'shield'];
          for (var i = 0; i < n; i++) {
              var tp = pool[i % pool.length];
              var x = CONFIG.LANE_X[i % 3] + (Math.random() - 0.5) * 1.4;
              var z = game.squad.z - 14 - Math.floor(i / 3) * 1.5;
              if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn(tp, x, z, null);
              else if (game.enemies) game.enemies.spawnEnemy(tp, x, z);
          }
          return true;
      } },
    { id: 'toxic_fog', name: '毒雾封锁', icon: '☠️', weight: 6, type: 'bad', minLevel: 2,
      desc: '战场弥漫毒雾, 小队射速降低 25% (5秒)!',
      apply: function(game) {
          if (!game.squad) return false;
          game.squad._evRateMul = 0.75;
          game.squad._evRateMulT = 5;
          return true;
      } },
    { id: 'artillery', name: '敌方炮击', icon: '💣', weight: 6, type: 'bad', minLevel: 2,
      desc: '敌军发射 2 枚炮弹! 注意红圈走位躲避!',
      apply: function(game) {
          if (!game.enemies || !game.enemies.spawnBomb) return false;
          var sz = game.squad.z;
          var sx = game.squad.x;
          game.enemies.spawnBomb(sx - 1.5, 4.5, sz - 12, clamp(sx - 1.2, -2.8, 2.8), sz - 1.5);
          game.enemies.spawnBomb(sx + 1.5, 4.5, sz - 13, clamp(sx + 1.3, -2.8, 2.8), sz - 2.5);
          return true;
      } },
    { id: 'jamming', name: '战术干扰', icon: '📡', weight: 5, type: 'bad', minLevel: 2,
      desc: '通信受干扰, 射速降低 15% (5秒)!',
      apply: function(game) {
          if (!game.squad) return false;
          game.squad._evRateMul = 0.85;
          game.squad._evRateMulT = 5;
          return true;
      } },
    { id: 'roadblock', name: '道路封锁', icon: '🚧', weight: 5, type: 'bad', minLevel: 1,
      desc: '3 只重盾怪封锁单侧跑道!',
      apply: function(game) {
          var laneX = CONFIG.LANE_X[Math.floor(Math.random() * 3)];
          for (var i = 0; i < 3; i++) {
              var z = game.squad.z - 12 - i * 1.1;
              if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn('shield', laneX + (i - 1) * 0.45, z, null);
              else if (game.enemies) game.enemies.spawnEnemy('shield', laneX, z);
          }
          return true;
      } },

    // ==================== 中性事件 (合计权重 10) ====================
    { id: 'emergency_choice', name: '背水一战', icon: '⚡', weight: 6, type: 'neutral', minLevel: 1,
      desc: '伤害+25% (8秒), 但引来 4 只快怪突袭!',
      apply: function(game) {
          if (game.squad) { game.squad._evDmgMul = 1.25; game.squad._evDmgMulT = 8; }
          for (var i = 0; i < 4; i++) {
              var x = CONFIG.LANE_X[i % 3];
              var z = game.squad.z - 13 - i * 0.8;
              if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn('fast', x, z, null);
              else if (game.enemies) game.enemies.spawnEnemy('fast', x, z);
          }
          return true;
      } },
    { id: 'supply_crate', name: '战场物资箱', icon: '🎁', weight: 4, type: 'neutral', minLevel: 1,
      desc: '拾取战场遗落物资 +25 金币',
      apply: function(game) { if (game.profile) game.profile.addCoins(25); return true; } },

    // ==================== 补给事件 (合计权重 15) ====================
    { id: 'airdrop', name: '紧急空投', icon: '📦', weight: 5, type: 'good', isRecruit: true, minLevel: 1,
      desc: '紧急空投支援 1~3 名士兵',
      apply: function(game) {
          var want = 1 + Math.floor(Math.random() * 3); // 1~3人
          var allowed = Math.min(want, Math.max(0, RandomEvents.RECRUIT_CAP_PER_RUN - (RandomEvents._recruitTotal || 0)));
          if (allowed <= 0) return false;
          var added = game.squad.addReinforcements(allowed, '紧急空投', game.effects);
          RandomEvents._recruitTotal = (RandomEvents._recruitTotal || 0) + added;
          return added > 0;
      } },
    { id: 'medkit', name: '战地医疗', icon: '💉', weight: 4, type: 'good', minLevel: 1,
      desc: '恢复 1~3 名战斗减员 (满编获临时护盾)',
      apply: function(game) {
          var loss = (game.squad && game.squad.recoverableLoss) || 0;
          var healAmt = Math.min(3, Math.max(1, Math.ceil(loss * 0.2)));
          if (game.squad && game.squad.healSquad) {
              game.squad.healSquad(healAmt, 'medkit', game.effects);
              return true;
          }
          return false;
      } },
    { id: 'fire_support', name: '火力支援', icon: '🎯', weight: 3, type: 'good', minLevel: 1,
      desc: '6 秒内全队伤害 +25%',
      apply: function(game) { if (!game.squad) return false; game.squad._evDmgMul = 1.25; game.squad._evDmgMulT = 6; return true; } },
    { id: 'coin_rain', name: '幸运补给', icon: '🪙', weight: 3, type: 'good', minLevel: 1,
      desc: '获得 20~40 战地金币',
      apply: function(game) {
          var amt = 20 + Math.floor(Math.random() * 21);
          if (game.profile) game.profile.addCoins(amt);
          return true;
      } }
];

var RandomEvents = {
    RECRUIT_CAP_PER_RUN: 6, // V18.0: 单局随机事件直接招募上限严格 6 人
    SHARED_RECRUIT_CD: 45,
    SAME_RECRUIT_CD: 60,
    CRISIS_MIN_GAP: 12,

    /** 每局重置: V18.0 首次事件 25~35s, 后续 22~35s */
    reset: function() {
        this._t = 25 + Math.random() * 10;
        this._shown = 0;
        this._recruitTotal = 0;
        this._sharedRecruitCd = 0;
        this._crisisGap = 0;
        this._reviveGraceT = 0;
        this._eventCd = {};
    },

    /** V18.0: 复活后 8 秒危机保护窗口 */
    onRevive: function() {
        this._reviveGraceT = 8.0;
        this._t = Math.max(this._t || 0, 8.0);
    },

    update: function(dt, game) {
        if (!game || game.state !== 'playing' || game.paused) return;
        if (this._t === undefined) this.reset();
        if (this._sharedRecruitCd > 0) this._sharedRecruitCd = Math.max(0, this._sharedRecruitCd - dt);
        if (this._crisisGap > 0) this._crisisGap = Math.max(0, this._crisisGap - dt);
        if (this._reviveGraceT > 0) this._reviveGraceT = Math.max(0, this._reviveGraceT - dt);
        for (var k in this._eventCd) {
            if (this._eventCd[k] > 0) this._eventCd[k] = Math.max(0, this._eventCd[k] - dt);
        }
        // Boss 战期间暂停高危随机事件
        if (game.enemies && game.enemies.boss && game.enemies.boss.alive) return;
        if (this._reviveGraceT > 0) return;

        this._t -= dt;
        if (this._t <= 0) {
            this._t = 22 + Math.random() * 13;
            this._trigger(game);
        }
    },

    _eligible: function(def, levelNum) {
        if (levelNum !== undefined && def.minLevel && levelNum < def.minLevel) return false;
        if (this._eventCd && (this._eventCd[def.id] || 0) > 0) return false;
        if (def.type === 'bad' && (this._crisisGap || 0) > 0) return false;
        if (def.isRecruit) {
            if ((this._recruitTotal || 0) >= this.RECRUIT_CAP_PER_RUN) return false;
            if ((this._sharedRecruitCd || 0) > 0) return false;
        }
        return true;
    },

    _trigger: function(game) {
        var levelNum = (game.levelIndex || 0) + 1;
        var pool = [];
        for (var p = 0; p < RANDOM_EVENT_DEFS.length; p++) {
            if (this._eligible(RANDOM_EVENT_DEFS[p], levelNum)) pool.push(RANDOM_EVENT_DEFS[p]);
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
            if (!def) def = pool[pool.length - 1];
            var ok = def.apply(game);
            if (ok !== false) {
                this._shown++;
                this._eventCd = this._eventCd || {};
                this._eventCd[def.id] = this.SAME_RECRUIT_CD;
                if (def.type === 'bad') this._crisisGap = this.CRISIS_MIN_GAP;
                if (def.isRecruit) this._sharedRecruitCd = this.SHARED_RECRUIT_CD;
                this._showBanner(def);
                return;
            }
        }
    },

    _showBanner: function(def) {
        if (typeof document === 'undefined') return;
        var host = document.getElementById('game-container') || document.body;
        var el = document.getElementById('v80-event-banner');
        if (!el) {
            el = document.createElement('div');
            el.id = 'v80-event-banner';
            el.className = 'v80-event-banner';
            host.appendChild(el);
        }
        var isBad = def.type === 'bad';
        el.className = 'v80-event-banner ' + (isBad ? 'bad' : 'good');
        el.innerHTML =
            '<span class="ev-ico">' + def.icon + '</span>' +
            '<span class="ev-body"><b>' + (isBad ? '⚠ 突发危机 · ' : '') + def.name + '</b>' +
            '<small>' + def.desc + '</small></span>';
        el.classList.add('show');
        clearTimeout(this._hideTimer);
        this._hideTimer = setTimeout(function() { el.classList.remove('show'); }, 2200);
    }
};
