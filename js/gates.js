// ===== 状态门系统 =====

class GateSystem {
    constructor(scene) {
        this.scene = scene;
        this.gates = [];
    }

    /** 从关卡数据加载所有状态门 */
    loadFromLevel(level) {
        this.clear();
        for (const seg of level.segments) {
            if (seg.type !== 'gates') continue;
            // V2.2: 每扇门宽度=单车道宽(1.8)，不再用两门间距(4.0导致门超出路面)
            var gateWidth = CONFIG.LANE_WIDTH * 0.9;
            for (const gd of seg.gates) {
                const model = createGateModel(gd, gateWidth);
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
            // 释放纹理
            g.model.traverse(function(obj) {
                if (obj.material && obj.material.map) obj.material.map.dispose();
                if (obj.material) obj.material.dispose();
            });
        }
        this.gates = [];
    }

    update(squad, effects, time, dt) {
        // V4.0: 触发窗口随队伍宽度扩展(大人数边缘可达侧门), 封顶保证左右门区间永不重叠
        var gateHalf = (CONFIG.LANE_WIDTH * 0.9) / 2;
        var triggerWin = MovementMath.gateTriggerWindow(gateHalf, squad.getHalfWidth ? squad.getHalfWidth() : 0);
        var stepDt = dt || 0.016;

        for (let i = this.gates.length - 1; i >= 0; i--) {
            const g = this.gates[i];

            // 远处的门: 标签轻微浮动
            if (!g.triggered && g.model.userData.label) {
                g.model.userData.label.position.y =
                    2.46 + Math.sin(time * 2 + g.x) * 0.06;
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
            if (!g.triggered && squad.z <= g.z + 0.2 && squad.z >= g.z - 0.8) {
                if (Math.abs(squad.x - g.x) < triggerWin) {
                    g.triggered = true;
                    squad.applyGate(g.data, effects);
                    this._highlight(g, effects);
                }
            }

            // 已触发且已远离: 淡出移除
            if (g.triggered && squad.z < g.z - 6) {
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
            label.scale.set(2.4, 1.2, 1);
        }
        // 冲击波
        if (effects) {
            effects.shockwave(g.x, 0.05, g.z, 0x6EE7B7);
        }
    }

    _fadeRemove(g, index) {
        // 直接移除(冲击波和膨胀动画已经提供了足够反馈)
        this.scene.remove(g.model);
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

            var nd = GateSystem._rerollGateData(g.data, CONFIG.SQUAD_MAX_COUNT);
            // 重建模型
            this.scene.remove(g.model);
            g.model.traverse(function(obj) {
                if (obj.material && obj.material.map) obj.material.map.dispose();
                if (obj.material) obj.material.dispose();
            });
            var model = createGateModel(nd, gateWidth);
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
        var r = Math.random();
        var op, value, label;
        // 概率分布: add 45% / mul 25% / buff 30% (mul封顶25%防刷稀有)
        if (r < 0.45) {
            op = 'add';
            value = Math.max(5, Math.min(50, Math.floor(maxCount * 0.15) + Math.floor(Math.random() * 8)));
            label = '+' + value;
        } else if (r < 0.70) {
            op = 'mul';
            value = (Math.random() < 0.2) ? 3 : 2;
            label = '×' + value;
        } else {
            op = 'buff';
            value = (Math.random() < 0.5) ? 'damage' : 'firerate';
            label = (value === 'damage') ? '输出+1' : '射速+20%';
        }
        return { lane: oldData.lane, op: op, value: value, label: label };
    }
}