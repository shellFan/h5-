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

    update(squad, effects, time) {
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

            // 穿门检测
            if (!g.triggered && squad.z <= g.z + 0.2 && squad.z >= g.z - 0.8) {
                if (Math.abs(squad.x - g.x) < 1.0) {
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
}