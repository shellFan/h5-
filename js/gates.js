// ===== 状态门系统 =====

class GateSystem {
    constructor(scene) {
        this.scene = scene;
        this.gates = [];
        this.chosenRows = new Set();
    }

    /** 从关卡数据加载所有状态门 */
    loadFromLevel(level) {
        this.clear();
        for (const seg of level.segments) {
            if (seg.type !== 'gates') continue;
            // V2.2: 每扇门宽度=单车道宽(1.8)，不再用两门间距(4.0导致门超出路面)
            var gateWidth = CONFIG.LANE_WIDTH * 0.9;
            for (const gd of seg.gates) {
                // V5.1: 史诗门(×2/人数%大额)用金色
                if (!gd.style) gd.style = (gd.op === 'mul' || gd.op === 'nuke') ? 'mul' : (gd.op === 'addpct' ? 'buff' : (gd.op === 'risk' ? 'risk' : (gd.op === 'buff' ? 'buff' : 'add')));
                gd.tier = gd.tier || (gd.op === 'mul' ? 'rare' : 'common');
                const model = V42Art.createGateModel(gd, gateWidth);
                model.userData.artSource = 'js/models.js:createGateModel(' + gd.op + '/' + (gd.label || '') + ') 玻璃纹理:createGateGlassTexture(参考assets/art-v1/ui/gate-panel.svg)';
                model.position.set(CONFIG.LANE_X[gd.lane], 0, seg.z);
                this.scene.add(model);
                this.gates.push({
                    data: gd,
                    model: model,
                    z: seg.z,
                    x: CONFIG.LANE_X[gd.lane],
                    triggered: false,
                    passed: false
                });
            }
        }
    }

    clear() {
        for (const g of this.gates) {
            this.scene.remove(g.model);
            // V4.0: 释放纹理+材质+几何体(每局重建, 不释放会累积GPU缓冲)
            g.model.traverse(function(obj) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material && obj.material.map) obj.material.map.dispose();
                if (obj.material) obj.material.dispose();
            });
        }
        this.gates = [];
        this.chosenRows.clear();
    }

    isRowChosen(z) {
        return this.chosenRows.has(z);
    }

    syncVisibility(pacing, outstanding) {
        // V5.1.5: next = 队伍前方最近的未选行(考虑队伍已越过的行)
        var nextZ = null;
        var squadZ = arguments[2] !== undefined ? arguments[2] : pacing ? (pacing.game ? pacing.game.squad.z : 0) : 0;
        for (const g of this.gates) {
            if (this.isRowChosen(g.z)) continue;
            if (nextZ === null || (g.z <= squadZ + 2 && g.z > nextZ)) nextZ = g.z;
        }
        var available = outstanding === 0 && nextZ !== null && pacing.canChooseGate(nextZ);
        for (const g of this.gates) {
            // V6.0: 技能门始终可见(不走 exclusive next 选中逻辑)
            if (g.data && g.data.op === 'skill') {
                g.model.visible = !g.passed;
                continue;
            }
            g.model.visible = g.triggered || (available && g.z === nextZ && !g.passed);
        }
    }

    update(squad, effects, time, dt) {
        // V4.0: 触发窗口随队伍宽度扩展(大人数边缘可达侧门), 封顶保证左右门区间永不重叠
        var gateHalf = (CONFIG.LANE_WIDTH * 0.9) / 2;
        var triggerWin = MovementMath.gateTriggerWindow(gateHalf, squad.getHalfWidth ? squad.getHalfWidth() : 0);
        var stepDt = dt || 0.016;
        // A row is one decision even when the crowd envelope touches multiple
        // glass panels. Choose the nearest gate centre, never stack rewards.
        var rows = {};
        for (const candidate of this.gates) {
            if (!candidate.model.visible || candidate.triggered || candidate.passed || squad.z > candidate.z + .2 || squad.z < candidate.z - .8) continue;
            var distance = Math.abs(squad.x - candidate.x);
            if (!rows[candidate.z] || distance < rows[candidate.z].distance) rows[candidate.z] = {gate:candidate,distance:distance};
        }

        for (let i = this.gates.length - 1; i >= 0; i--) {
            const g = this.gates[i];
            if (!g.model.visible && !g.triggered) continue;

            // V5.1.1: 触发溶解动画 — 缩放收缩+玻璃/文字淡出, 完成后移除
            if (g.triggered && g.dissolveT !== undefined && g.dissolveT < 1) {
                g.dissolveT = Math.min(1, g.dissolveT + stepDt / 0.45);
                const t = g.dissolveT;
                g.model.scale.setScalar(Math.max(0.001, 1 - easeOutCubic(t)));
                const lbl = g.model.userData.label;
                if (lbl && lbl.material) lbl.material.opacity = 1 - t;
                const gls = g.model.userData.glass;
                if (gls && gls.material) { gls.material.transparent = true; gls.material.opacity = 0.5 * (1 - t); }
                if (t >= 1) { this._fadeRemove(g, i); continue; }
            }

            // 远处的门: 标签轻微浮动
            if (!g.triggered && g.model.userData.label) {
                g.model.userData.label.position.y =
                    (g.model.userData.labelBaseY || 2.46) + Math.sin(time * 2 + g.x) * 0.025;
            }

            // 接近发光
            if (!g.triggered) {
                const dist = Math.abs(squad.z - g.z);
                if (dist < 6 && dist > 0.5) {
                    const intensity = 1 - dist / 6;
                    const glass = g.model.userData.glass;
                    if (glass) {
                        glass.material.opacity = 0.45 + intensity * 0.3;
                    }
                }
            }

            // V4.0: 门磁吸辅助 — 仅当玩家已选边(距门中心<磁吸距离)时轻微吸附到该门跑道中心,
            // 不替代玩家选择(左右门磁吸区相距4, 永不重叠)
            if (!g.triggered && squad.z > g.z && squad.z - g.z < 4 &&
                Math.abs(squad.x - g.x) < CONFIG.MOVE.gateMagnetDist) {
                squad.targetX = damp(squad.targetX, g.x, CONFIG.MOVE.gateMagnetLambda, stepDt);
            }

            // 穿门检测(V4.0: 窗口=门半宽+队伍半宽补偿, 与视觉区域一致)
            if (!g.triggered && !g.passed && squad.z <= g.z + 0.2 && squad.z >= g.z - 0.8) {
                if (rows[g.z] && rows[g.z].gate === g) {
                    g.triggered = true;
                    this.chosenRows.add(g.z);
                    g.dissolveT = 0; // V5.1.1: 触发即开始溶解消失(玩家反馈: 门获得后要有消失效果)
                    for (const sibling of this.gates) if (sibling !== g && sibling.z === g.z) sibling.passed = true;
                    squad.applyGate(g.data, effects);
                    this._highlight(g, effects);
                    if (g.data.op === 'mul' && this.onMul) this.onMul(g); // V4.0: 翻倍慢动作+震屏
                }
            }

            // V5.1.1: 同排未选中门(passed)远离后移除; 触发门走溶解动画
            if (g.passed && !g.triggered && squad.z < g.z - 6) {
                this._fadeRemove(g, i);
            }
        }
    }

    _highlight(g, effects) {
        // 玻璃变亮
        const glass = g.model.userData.glass;
        if (glass) {
            glass.material.opacity = 0.85;
            glass.material.color.setHex(0xFFFFFF);
        }
        // 数值放大弹出
        const label = g.model.userData.label;
        if (label) {
            label.scale.multiplyScalar(1.04);
        }
        // 冲击波 + 门色粒子爆发(V5.1.1)
        if (effects) {
            effects.shockwave(g.x, 0.05, g.z, 0x6EE7B7);
            var gc = g.data && g.data.style === 'mul' ? 0xFFC247 : (g.data && g.data.style === 'buff' ? 0xA78BFA : 0x6EE7B7);
            effects.burst(g.x, 1.1, g.z, gc, 10, 3, 0.45);
        }
    }

    _fadeRemove(g, index) {
        // 直接移除(冲击波和膨胀动画已经提供了足够反馈)
        this.scene.remove(g.model);
        var geos = new Set(), mats = new Set(), textures = new Set();
        g.model.traverse(function(o) {
            if (o.geometry) geos.add(o.geometry);
            if (o.material) for (const m of (Array.isArray(o.material) ? o.material : [o.material])) mats.add(m);
        });
        mats.forEach(function(m) { for(const k in m) if(m[k] && m[k].isTexture) textures.add(m[k]); m.dispose(); });
        textures.forEach(function(t) { t.dispose(); });
        geos.forEach(function(g) { g.dispose(); });
        this.gates.splice(index, 1);
    }

    /** 战斗阶段隐藏所有未触发的门 */
    hideUntriggered() {
        for (const g of this.gates) {
            if (!g.triggered) {
                g.model.visible = false;
            }
        }
    }

    /** V6.0: 解析技能门 — 每排3个不同技能, 重建门模型 */
    resolveSkillGates(squad) {
        if (typeof Skills === 'undefined') return;
        var rebuilt = [];
        for (var i = 0; i < this.gates.length; i++) {
            var g = this.gates[i];
            if (!g.data || g.data.op !== 'skill' || g.data.value !== 'roll') continue;
            if (rebuilt.indexOf(g.z) >= 0) continue;
            rebuilt.push(g.z);
            var ids = Skills.rollChoices(squad) || ['rage', 'drone', 'venom'];
            var members = this.gates.filter(function(x) { return x.z === g.z && x.data && x.data.op === 'skill'; });
            for (var m = 0; m < members.length && m < ids.length; m++) {
                var id = ids[m];
                var def = SKILL_DEFS[id];
                var lv = squad._skills ? (squad._skills[id] || 0) : 0;
                members[m].data.value = id;
                members[m].data.label = def.icon + ' ' + def.name + (lv > 0 ? ' Lv' + (lv + 1) : '');
                this.scene.remove(members[m].model);
                members[m].model = V42Art.createGateModel(members[m].data, CONFIG.LANE_WIDTH * 0.9);
                this.scene.add(members[m].model);
                members[m].triggered = false;
                members[m].passed = false;
            }
        }
    }

    /**
     * V3.4: 广告刷门 — 重随前方(squadZ更小一侧)未触发的门
     * 只影响未触发门(旧门奖励作废), 已触发门保持; 加门权重随人数收敛, 防无限刷稀有门
     * @returns 重随的门数量
     */
    refreshAhead(squadZ) {
        var gateWidth = CONFIG.LANE_WIDTH * 0.9;
        var rerolled = 0;
        for (var i = 0; i < this.gates.length; i++) {
            var g = this.gates[i];
            if (g.triggered) continue;
            if (g.z >= squadZ) continue; // 已越过/脚下的门不重随

            var nd = GateSystem._rerollGateData(g.data, CONFIG.SQUAD_MAX_COUNT); // V5.1: 走 GateRewardPool(状态感知)
            // 重建模型
            this.scene.remove(g.model);
            g.model.traverse(function(obj) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material && obj.material.map) obj.material.map.dispose();
                if (obj.material) obj.material.dispose();
            });
            var model = V42Art.createGateModel(nd, gateWidth);
            model.position.set(CONFIG.LANE_X[nd.lane], 0, g.z);
            this.scene.add(model);
            g.data = nd;
            g.model = model;
            g.triggered = false;
            g.passed = false;
            rerolled++;
        }
        return rerolled;
    }

    /** 门数据重随: op/value/label 全部重新生成 */
    static _rerollGateData(oldData, maxCount) {
        return GateRewardPool.roll(oldData.lane, (typeof window !== 'undefined' && window.__game && window.__game.squad) ? window.__game.squad : null, false);
    }
}

// ===== V5.1 门奖励池 (普通~75% / 稀有~20% / 史诗~5%; ×2 仅属稀有池且受抑制) =====
var GATE_REWARD_POOL = {
    common: [
        { op: 'add',    value: 3,  label: '+3',      w: 6 },
        { op: 'add',    value: 5,  label: '+5',      w: 6 },
        { op: 'add',    value: 8,  label: '+8',      w: 5 },
        { op: 'add',    value: 12, label: '+12',     w: 4 },
        { op: 'buff',   value: 'damage',   label: '输出+1',   w: 4, style: 'buff' },
        { op: 'buff',   value: 'firerate10', label: '射速+10%', w: 4, style: 'buff' },
        { op: 'buff',   value: 'crit',     label: '暴击+5%',  w: 3, style: 'buff' },
        { op: 'buff',   value: 'pierce',   label: '穿透+1',   w: 2, style: 'buff' }
    ],
    rare: [
        { op: 'addpct', value: 20, label: '人数+20%', w: 3, style: 'buff' },
        { op: 'buff',   value: 'damage2', label: '输出+2',  w: 3, style: 'buff' },
        { op: 'buff',   value: 'crit2',   label: '暴击+10%', w: 3, style: 'buff' },
        { op: 'buff',   value: 'freeze',  label: '冰冻弹',   w: 2, style: 'buff' },
        { op: 'buff',   value: 'vamp',    label: '吸血',     w: 2, style: 'buff' },
        { op: 'buff',   value: 'explosive', label: '爆炸弹', w: 2, style: 'buff' },
        { op: 'buff',   value: 'chain',   label: '连锁闪电', w: 2, style: 'buff' },
        { op: 'mul',    value: 2,  label: '×2', w: 2, style: 'mul' }
    ],
    epic: [
        { op: 'addpct', value: 50, label: '人数+50%', w: 1.5, style: 'mul' },
        { op: 'nuke',   value: 0,  label: '全屏爆炸', w: 1.5, style: 'mul' },
        { op: 'buff',   value: 'arsenal', label: '军备强化', w: 1.5, style: 'mul' }
    ]
};

var GateRewardPool = {
    lastWasMul: false, // ×2连续抑制
    /** 按稀有度概率(75/20/5)选池, 再按权重+队伍状态选具体奖励 */
    roll: function(lane, squad, forceNoMul) {
        // 稀有度概率: 普通75% 稀有20% 史诗5%
        var r = Math.random();
        var tier = r < 0.75 ? 'common' : (r < 0.95 ? 'rare' : 'epic');
        var pool = GATE_REWARD_POOL[tier].slice();
        var count = squad ? squad.count : 10;
        var weights = [];
        for (var i = 0; i < pool.length; i++) {
            var item = pool[i];
            var w = item.w;
            // ×2 连续抑制
            if (item.op === 'mul' && (this.lastWasMul || forceNoMul)) w = 0;
            // 队伍状态感知: 人数少抬人数门, 人数多压人数门
            if (item.op === 'add' || item.op === 'addpct') {
                w *= count < 8 ? 1.6 : (count > 120 ? 0.6 : 1);
            }
            // 满级属性不再出现(无效奖励)
            if (squad) {
                if (item.value === 'pierce' && squad.pierce >= 3) w = 0;
                if (item.value === 'crit' && squad.critChance >= 0.5) w = 0;
                if (item.value === 'crit2' && squad.critChance >= 0.5) w = 0;
                if (item.value === 'firerate10' && squad.fireRateBuff >= 0.5) w = 0;
            }
            weights.push(w);
        }
        var total = 0;
        for (var k = 0; k < weights.length; k++) total += weights[k];
        // 该池全被抑制: 回退普通池的加人门
        if (total <= 0) return { lane: lane, op: 'add', value: 5, label: '+5', tier: 'common' };
        var pick = Math.random() * total;
        var chosen = pool[pool.length - 1];
        for (var j = 0; j < pool.length; j++) {
            pick -= weights[j];
            if (pick <= 0) { chosen = pool[j]; break; }
        }
        this.lastWasMul = (chosen.op === 'mul');
        var out = { lane: lane, op: chosen.op, value: chosen.value, label: chosen.label, tier: tier };
        if (chosen.style) out.style = chosen.style;
        return out;
    }
};
