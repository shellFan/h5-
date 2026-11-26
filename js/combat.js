// ===== 自动射击与弹道系统 =====

class CombatSystem {
    static get TRACER_COLORS() {
        return {
            rifle: 0xFFF8E8, shotgun: 0xFFE6C8, sniper: 0xFFFFFF, mg: 0xFFF0D4,
            flamethrower: 0xFF9C4A, rocket: 0xFF8852, freeze: 0x9EE8FF, tesla: 0xC8A6FF
        };
    }
    static get HEAVY_MUZZLE() { return { shotgun: 1, mg: 1, flamethrower: 1, rocket: 1 }; }
    constructor(scene, effects) {
        this.scene = scene;
        this.effects = effects;
        this.bullets = [];
        this.fireTimer = 0;

        // 弹道纹理: V12视觉 — 程序化曳光弹贴图(亮核弹头+长尾迹), 替代原SVG水滴形
        this._bulletTex = null;

        // 共享Sprite材质(所有子弹共用，减少DrawCall)
        // V3.6修复: 改用Normal混合(Additive在浅色路面上会加成纯白,弹道完全不可见)
        this._bulletMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 1,
            depthWrite: false
        });
        // 顺序修正(V12): 材质就绪后再挂贴图 — _makeTracerTexture 同步写 map, 必须在材质创建之后
        this._makeTracerTexture();
        this._bulletInstances=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),this._bulletMat,CONFIG.BULLET_MAX_VISIBLE);
        this._bulletInstances.count=0;this._bulletInstances.frustumCulled=false;
        this._bulletInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this._bulletInstances.userData.artSource='V120 instanced ground tracer streaks / pooled bullet anchors';
        scene.add(this._bulletInstances);
        this._bulletMat.userData = { artSource: 'js/combat.js:_makeTracerTexture() 程序化曳光贴图 64x256 (CanvasTexture)' };
        // V12视觉: 曳光朝向(贴地掠过+尾部微抬向镜头), 不再逐帧拷贝相机四元数
        this._tracerQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.42, 0, 0));
        this._tmpColor = new THREE.Color();

        // 弹道对象池 (锚点 + 曳光纹理)
        this.pool = [];
        for (var i = 0; i < CONFIG.BULLET_MAX_VISIBLE; i++) {
            var sprite = new THREE.Object3D();
            sprite.visible = false;
            sprite.scale.set(0.26, 2.1, 1);
            this.pool.push(sprite);
        }
    }

    /** V15-ART-008: 锐利炽白激光曳光弹 — 细长炽白弹芯 + 短金橙光晕(彻底告别钝黄色水滴!) */
    _makeTracerTexture() {
        var c = document.createElement('canvas');
        c.width = 64; c.height = 256;
        var ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 64, 256);
        // 外层纤细金橙辉光
        var tail = ctx.createLinearGradient(0, 10, 0, 244);
        tail.addColorStop(0.0, 'rgba(255,245,190,0.92)');
        tail.addColorStop(0.24, 'rgba(255,178,42,0.78)');
        tail.addColorStop(0.62, 'rgba(255,118,16,0.34)');
        tail.addColorStop(1.0, 'rgba(255,88,0,0)');
        ctx.fillStyle = tail;
        ctx.beginPath();
        ctx.moveTo(25, 16);
        ctx.lineTo(29.5, 244);
        ctx.lineTo(34.5, 244);
        ctx.lineTo(39, 16);
        ctx.lineTo(32, 4);
        ctx.closePath();
        ctx.fill();
        // 内层纯白炽热锐利弹芯 (高对比度)
        var core = ctx.createLinearGradient(0, 8, 0, 170);
        core.addColorStop(0.0, '#FFFFFF');
        core.addColorStop(0.45, 'rgba(255,255,252,0.98)');
        core.addColorStop(1.0, 'rgba(255,240,180,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.moveTo(29, 12);
        ctx.lineTo(30.8, 170);
        ctx.lineTo(33.2, 170);
        ctx.lineTo(35, 12);
        ctx.lineTo(32, 6);
        ctx.closePath();
        ctx.fill();
        this._bulletTex = new THREE.CanvasTexture(c);
        if (this._bulletMat) {
            this._bulletMat.map = this._bulletTex;
            this._bulletMat.needsUpdate = true;
        }
    }

    update(dt, squad, enemyManager, energyCore) {
        this._squad = squad; // V3.3: 供_fire读取穿透层数
        // === 射击逻辑 ===
        if (squad.count > 0 && squad.alive) {
            this.fireTimer -= dt;
            if (this.fireTimer <= 0) {
                var count = squad.count;
                // 视觉弹道频率: 随人数增长但有上限(性能保护)
                // V8.0.1: 吞吐曲线提升(×1.8→×2.2, 上限22→30, 池120容量内) — 大编制波次需要在行军窗口内被清空
                var visualRate = Math.min(2 + Math.sqrt(count) * 2.2, 30);
                this.fireTimer = 1 / visualRate;

                // 每发子弹伤害 = 总DPS / 视觉弹道频率
                var totalDPS = count * squad.getDamage() * squad.getFireRate();

                // 齐射数量: 1~5发(人数越多越多)
                var volley = Math.min(5, 1 + Math.floor(Math.sqrt(count) / 2.3)); // V8.0.1: 齐射曲线提升(÷2.6→÷2.3)
                var positions = squad.getShootPositions(volley);
                // A volley shares the squad DPS; giving every trail the full
                // budget multiplied damage by up to five. Keep fractional damage
                // so minimum-one rounding cannot inflate small squads either.
                // V13.1事实修正: 上行注释描述的是历史"齐射分摊"理想契约, 非当前交付口径。
                // 当前已交付契约 = max(1, round(totalDPS/visualRate))/发:
                // - 实证 v51 L3 在真实V12基线(totalDPS/visualRate/positions, 未取整)下稳定lost
                //   ×2, 在本公式下稳定胜利 — L3 可通关性依赖本口径;
                // - 9c32560 的"c95ef42 改动基线"归因有误(c95ef42 未改过此公式), 但公式本身
                //   是全部现行平衡门(v51/v80/vnext/v111-114)的校验口径, 予以保留;
                // - 与分摊理想契约的偏差属数值重校准事项, 已在 docs/V13/QA_REPORT.md 登记。
                var dmg = Math.max(1, Math.round(totalDPS / visualRate));
                if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('shoot'); // V5.0: 齐射音效(适配器内部限流)
                for (var k = 0; k < positions.length; k++) {
                    // V3.1: 每发子弹瞄准前方最近敌人(修复阵型散布导致5/7子弹打不中Boss的问题)
                    // V8.0.1: Boss存活时火力优先Boss — 修复杂兵吸引弹道导致Boss战输出饥饿(战损失衡)
                    var target = (enemyManager.boss && enemyManager.boss.alive)
                        ? enemyManager.boss
                        : enemyManager.getNearest(positions[k].x, positions[k].z, CONFIG.BULLET_RANGE);
                    // V3.3: 暴击判定(开火时掷骰, 伤害×2)
                    var dmgFinal = dmg;
                    // V6.0: 狂暴技能伤害乘区
                    if (squad._skillRage) dmgFinal *= 1 + 0.35 * squad._skillRage;
                    // V8.0: 守护之怒组合 — 护盾可用时+25%
                    if (squad._comboGuardianFury && squad._skillShield > 0) dmgFinal *= 1.25;
                    // V8.0: 随机事件伤害buff(狂热时刻)
                    if (squad._evDmgMul) dmgFinal *= squad._evDmgMul;
                    // V6.0: 背水一战 — 人数低于一半时增伤
                    if (squad._skillBerserk && squad.count > 0 && squad._halfCount && squad.count <= squad._halfCount) {
                        dmgFinal *= 1 + 0.5 * squad._skillBerserk;
                    }
                    var isCrit = Math.random() < Math.min(0.8, squad.critChance + (squad._evCritBonus || 0)); // V8.0: 事件暴击buff
                    // V11.2: 处决者 — 暴击伤害乘区(2 + 0.25×层), 火力流派 +15%
                    var critMul = 2 + (squad._critMul || 0);
                    if (isCrit) dmgFinal *= critMul;
                    if (squad._comboFireFlow) dmgFinal *= 1.15;
                    this._fire(positions[k], dmgFinal, target, isCrit);
                    // V10.1: 散弹枪 pellets — 多发弹丸扇形铺散(其余弹丸依次瞄准相邻目标, 多目标AOE; 单目标时自然衰减)
                    var wpnPellets = squad._wpnPellets || 1;
                    if (wpnPellets > 1) {
                        var fanHit = [target];
                        for (var pi = 1; pi < wpnPellets; pi++) {
                            var fanTarget = enemyManager.getNearest(positions[k].x, positions[k].z, CONFIG.BULLET_RANGE, fanHit);
                            if (!fanTarget) break;
                            fanHit.push(fanTarget);
                            this._fire(positions[k], dmgFinal, fanTarget, isCrit);
                        }
                    }
                    // V10.1: 风暴机枪 dualLane — 平行双弹道(同目标, 双倍弹丸吞吐)
                    if (squad._wpnDualLane) {
                        this._fire({ x: positions[k].x + 0.38, y: positions[k].y, z: positions[k].z }, dmgFinal, target, isCrit);
                    }
                }
                // V16.1: 强化全队视觉弹幕与交错枪口火焰(纯视觉装饰弹道, damage=0 不影响任何数值平衡!)
                if (count >= 4 && this.pool.length > 16) {
                    var decoCount = Math.min(12, Math.floor(Math.sqrt(count) * 1.65));
                    var decoPos = squad.getShootPositions(decoCount);
                    var aliveList = enemyManager.enemies;
                    for (var dk = 0; dk < decoPos.length && this.pool.length > 10; dk++) {
                        // 分散瞄准不同怪兽, 展现真实扇面火力覆盖而非全挤在中央一条线
                        var decoTarget = null;
                        if (aliveList && aliveList.length > 0) {
                            var cand = aliveList[(dk * 3 + Math.floor(Math.random() * aliveList.length)) % aliveList.length];
                            if (cand && cand.alive && squad.z - cand.z > 0 && squad.z - cand.z < CONFIG.BULLET_RANGE) decoTarget = cand;
                        }
                        this._fire(decoPos[dk], 0, decoTarget, false, true);
                    }
                }
            }
        }

        // === 弹道更新与碰撞 ===
        for (var i = this.bullets.length - 1; i >= 0; i--) {
            var b = this.bullets[i];
            var oldZ = b.mesh.position.z;
            // VNext: 职业弹速乘区(重装机枪手 +25%)
            var bSpeed = CONFIG.BULLET_SPEED * (squad._classBulletSpeed || 1);
            var newZ = BattleKinematics.bulletZ(oldZ, bSpeed, dt); // V5.1: SHOOT_SIGN=-Z
            b.mesh.position.z = newZ;
            b.life -= dt;

            // V3.1: 弹道向目标x收敛(轻微追踪, 保证视觉上弹道汇聚到敌人身上)
            if (b.target && b.target.alive) {
                b.mesh.position.x = damp(b.mesh.position.x, b.target.x, 10, dt);
            }

            // 碰撞检测: 检查是否穿越僵尸Z面
            var hit = false;
            var enemies = enemyManager.enemies;
            for (var j = 0; j < enemies.length; j++) {
                var e = enemies[j];
                if (!e.alive) continue;
                // V3.3: 穿透弹不重复命中同一目标
                if (b.hitSet && b.hitSet.indexOf(e) >= 0) continue;
                // 子弹从前往后穿越僵尸位置
                // V13.1近距离盲区修复: 命中窗后沿 0.2→1.5 — 弹速28u/s(0.467/帧)时旧0.6深度
                // 窗口对近身目标(枪口前0.5-1.2单位)只开放~2帧, x收敛(damp λ=10, ~15%/帧)
                // 2帧内最多关闭1.26横向差; 近身目标横向差可达1.4-1.5(枪口姿态偏移+怪横移
                // 冻结位), 子弹逐发从怪侧面掠过(x在穿越后才收敛) → 永久不可命中 → 伏击怪
                // 驻足态打不死 → outstanding永不归零 → 状态门永久锁死(软锁)。
                // 延长后沿=曳光(长2.1)尾部仍覆在僵尸体上时允许命中, 给x收敛4-5帧; 远距离
                // 目标穿越面时x早已收敛, 命中帧不变; 不改变伤害数值。
                if (oldZ >= e.z - 1.5 && newZ <= e.z + 0.4) {
                    // V3.1: 命中窗加宽(0.7→0.9), Boss等大体型敌人按体型放大判定
                    var winX = e.isBoss ? 1.4 : 0.9;
                    if (Math.abs(b.mesh.position.x - e.x) < winX) {
                        // V15-ART-002: 装饰视觉弹道仅触发轻火花并回收, 绝对不结算伤害
                        if (b.decorative) {
                            if (this.effects && Math.random() < 0.45) {
                                this.effects.burst(b.mesh.position.x, 0.72, e.z, 0xFFE26A, 2, 1.8, 0.16);
                            }
                            hit = true;
                            break;
                        }
                        // V3.3: 冰冻弹 — 命中减速
                        if (squad.freezeStacks > 0 && !e.isBoss) {
                            e.frozenT = 0.9 + 0.45 * squad.freezeStacks;
                            if (!e._frozenFx) {
                                this.effects.burst(e.x, 0.5, e.z, 0x9AD8FF, 4, 1.8, 0.35);
                                e._frozenFx = true;
                            }
                        }
                        // 地狱火箭燃烧 — 持续3秒, 每秒25%弹丸伤害(每0.5秒结算)
                        if (squad._wpnBurn) {
                            e._burnT = 3;
                            e._burnDps = Math.max(e._burnDps || 0, b.damage * 0.25);
                            this.effects.burst(e.x, 0.8, e.z, 0xFF8833, 3, 1.5, 0.3);
                        }
                        // V6.0: 毒液弹头 — 命中附加中毒DoT(修复: 原实现从未挂载)
                        if (squad._skillVenom) {
                            var venomMul = squad._comboPlagueFury ? 2 : 1; // V8.0: 瘟疫狂怒×2
                            e._venomT = 2;
                            e._venomStacks = Math.min(3, (e._venomStacks || 0) + 1);
                            e._venomDps = Math.max(e._venomDps || 0, b.damage * 0.2 * squad._skillVenom * venomMul);
                            if (e._venomStacks === 1) this.effects.burst(e.x, 0.6, e.z, 0x88CC44, 3, 1.5, 0.3);
                        }
                        var hitDmg = b.damage;
                        // VNext: 神射狙击 — 对精英/Boss ×1.25
                        if (squad._classEliteMul && (e.isBoss || e.type === 'elite' || e.affixes)) {
                            hitDmg *= squad._classEliteMul;
                        }
                        var died = e.takeDamage(hitDmg, this.effects, b.mesh.position.x, b.crit);
                        // V5.1: 爆炸弹 — 命中溅射(半径1.7, 50%伤害, 最多4个邻近目标)
                        if (squad.explosive > 0) {
                            var splashR = 1.2 + 0.5 * squad.explosive;
                            var splashN = 0;
                            for (var si = 0; si < enemies.length && splashN < 4; si++) {
                                var se = enemies[si];
                                if (se === e || !se.alive) continue;
                                var sdx = se.x - e.x, sdz = se.z - e.z;
                                if (sdx * sdx + sdz * sdz < splashR * splashR) {
                                    se.takeDamage(b.damage * 0.5, this.effects, se.x, false);
                                    splashN++;
                                }
                            }
                            this.effects.burst(e.x, 0.6, e.z, 0xFF8833, 6, 2.5, 0.3);
                            // V12视觉: 爆炸弹命中白闪
                            if (this.effects.flash) this.effects.flash(e.x, 0.6, e.z, 0xFFB060, 1.5);
                        }
                        // V5.1: 连锁闪电 — 跳至最近(最多1+chain层)邻敌, 各受40%伤害
                        if (squad.chain > 0) {
                            var hops = squad.chain, last = e;
                            for (var hi = 0; hi < hops; hi++) {
                                var best = null, bestD = 9;
                                for (var ci = 0; ci < enemies.length; ci++) {
                                    var ce = enemies[ci];
                                    if (!ce.alive || ce === last || ce === e) continue;
                                    var cdx = ce.x - last.x, cdz = ce.z - last.z;
                                    var cd = Math.sqrt(cdx * cdx + cdz * cdz);
                                    if (cd < bestD) { bestD = cd; best = ce; }
                                }
                                if (!best) break;
                                best.takeDamage(b.damage * 0.4, this.effects, best.x, false);
                                this.effects.burst(best.x, 1.0, best.z, 0x66D9FF, 4, 2, 0.25);
                                last = best;
                            }
                        }
                        // 暴击/击杀反馈
                        if (died) {
                            if (b.crit) {
                                this.effects.floatText(e.x, 1.2, e.z, '暴击!', '#FF4444', true);
                            }
                            // V3.3: 吸血 — 击杀按层数概率回复1人
                            if (squad.vampStacks > 0 && squad.count > 0 && squad.count < squad._maxLimit()) {
                                var vampProb = 0.12 * squad.vampStacks;
                                if (Math.random() < vampProb) {
                                    squad.addReinforcements(1, '吸血恢复', this.effects);
                                }
                            }
                            // V8.0: 回收无人机组合 — 3%概率补员
                            if (squad._comboRecycle && squad.count > 0 && squad.count < squad._maxLimit() && Math.random() < 0.03) {
                                squad.addReinforcements(1, '回收无人机', this.effects);
                            }
                            // V11.2: 亡者征召 — 5%×层概率补员(虫群流派×1.5)
                            if (squad._skillHarvest && squad.count > 0 && squad.count < squad._maxLimit()) {
                                var harvProb = 0.05 * squad._skillHarvest * (squad._comboSwarmFlow ? 1.5 : 1);
                                if (Math.random() < harvProb) {
                                    squad.addReinforcements(1, '亡者征召', this.effects);
                                }
                            }
                        }
                        hit = true;
                        // V3.3: 穿透 — 命中后不消失, 继续飞行
                        if (b.pierceLeft > 0) {
                            b.pierceLeft--;
                            if (!b.hitSet) b.hitSet = [];
                            b.hitSet.push(e);
                            hit = false; // 继续存在
                        }
                        break;
                    }
                }
            }

            // V6.0: 能源核心命中(穿越核心z面且横向命中)
            if (!hit && energyCore && energyCore.alive &&
                oldZ >= energyCore.z - 0.4 && newZ <= energyCore.z + 0.4 &&
                Math.abs(b.mesh.position.x - energyCore.x) < 1.6) {
                energyCore.takeBulletHit(b.damage, this.effects);
                hit = true;
            }

            // 超射程或命中: 回收
            if (hit || b.life <= 0 || newZ < squad.z - CONFIG.BULLET_RANGE) {
                b.mesh.visible = false;
                this.pool.push(b.mesh);
                this.bullets.splice(i, 1);
            }
        }

        // V6.0: 毒液DoT结算(每帧)
        if (enemyManager && enemyManager.enemies) {
            for (var vi = enemyManager.enemies.length - 1; vi >= 0; vi--) {
                var ve = enemyManager.enemies[vi];
                if (!ve.alive || (!ve._venomT && !ve._burnT)) continue; // V10.1: 燃烧DoT共入结算循环
                if (ve._venomT) {
                    ve._venomT -= dt;
                    ve._venomTick = (ve._venomTick || 0) - dt;
                    if (ve._venomTick <= 0) {
                        ve._venomTick = 0.5;
                        ve.takeDamage(ve._venomDps * 0.5, this.effects, ve.x, false);
                        if (this.effects) this.effects.burst(ve.x, 1, ve.z, 0x66DD44, 2, 1.5, 0.25);
                    }
                    if (ve._venomT <= 0) { ve._venomT = 0; ve._venomStacks = 0; }
                }
                // V10.1: 燃烧DoT结算(地狱火箭)
                if (ve._burnT) {
                    ve._burnT -= dt;
                    ve._burnTick = (ve._burnTick || 0) - dt;
                    if (ve._burnTick <= 0) {
                        ve._burnTick = 0.5;
                        ve.takeDamage(ve._burnDps * 0.5, this.effects, ve.x, false);
                        if (this.effects) this.effects.burst(ve.x, 1, ve.z, 0xFF8833, 2, 1.5, 0.25);
                    }
                    if (ve._burnT <= 0) { ve._burnT = 0; ve._burnDps = 0; }
                }
            }
        }

        // V8.0: 毒性护盾组合 — 格挡时毒化周围敌人(半径3, 每秒20%基础伤害×毒液层)
        if (squad._toxicWardPulse) {
            squad._toxicWardPulse = false;
            var wardDps = Math.max(1, Math.round(squad.getDamage() * 0.2 * Math.max(1, squad._skillVenom || 1)));
            for (var wi = 0; wi < enemyManager.enemies.length; wi++) {
                var we = enemyManager.enemies[wi];
                if (!we.alive) continue;
                var wdx = we.x - squad.x, wdz = we.z - squad.z;
                if (wdx * wdx + wdz * wdz < 9) {
                    we._venomT = 3;
                    we._venomStacks = Math.min(3, (we._venomStacks || 0) + 1);
                    we._venomDps = Math.max(we._venomDps || 0, wardDps);
                }
            }
            this.effects.shockwave(squad.x, 0.05, squad.z, 0x88CC44);
        }
    }

    _syncInstances() {
        this._bulletInstances.count=this.bullets.length;
        for(var i=0;i<this.bullets.length;i++) {
            var anchor=this.bullets[i].mesh;
            anchor.quaternion.copy(this._tracerQuat); // V12视觉: 贴地曳光朝向(弹头朝-Z, 尾部微抬)
            anchor.updateMatrix();this._bulletInstances.setMatrixAt(i,anchor.matrix);
            if (this.bullets[i].color !== undefined) this._bulletInstances.setColorAt(i, this._tmpColor.setHex(this.bullets[i].color));
        }
        this._bulletInstances.instanceMatrix.needsUpdate=true;
        if (this._bulletInstances.instanceColor) this._bulletInstances.instanceColor.needsUpdate = true;
    }

    // V14: 武器弹道色表 — 单材质+实例色实现 8 类弹道辨识(零额外drawCall)
    _tracerColor() {
        var wid = (this._squad && this._squad._gameRef && this._squad._gameRef._weaponStats) ? this._squad._gameRef._weaponStats.weaponId : null;
        return CombatSystem.TRACER_COLORS[wid] || CombatSystem.TRACER_COLORS.rifle;
    }
    _fire(pos, damage, target, isCrit, decorative) {
        var mesh = this.pool.pop();
        if (!mesh) return;
        mesh.visible = true;
        mesh.position.set(pos.x, pos.y, pos.z);
        if (decorative) mesh.scale.set(0.20, 1.70, 1);
        else if (isCrit) mesh.scale.set(0.36, 2.65, 1);
        else mesh.scale.set(0.25, 2.0, 1);
        this.bullets.push({
            mesh: mesh, damage: decorative ? 0 : damage, life: decorative ? 0.85 : 1.2,
            decorative: !!decorative,
            target: target || null,
            color: this._tracerColor(),
            crit: !!isCrit,
            pierceLeft: decorative ? 1 : (1 + (this._squad ? this._squad.pierce + (this._squad._evPierce || 0) + (this._squad._comboPierceFlow ? 1 : 0) : 0)),
            hitSet: null
        });

        // 枪口闪光 (V15: 增强全队齐射枪口火焰表现力)
        var wid = (this._squad && this._squad._gameRef && this._squad._gameRef._weaponStats) ? this._squad._gameRef._weaponStats.weaponId : 'rifle';
        var muzzleScale = decorative ? 1.05 : (CombatSystem.HEAVY_MUZZLE[wid] ? 1.65 : 1.38);
        this.effects.muzzleFlash(pos.x, pos.y, pos.z, muzzleScale);
    }

    clear() {
        for (var i = 0; i < this.bullets.length; i++) {
            this.bullets[i].mesh.visible = false;
            this.pool.push(this.bullets[i].mesh);
        }
        this.bullets = [];
        this.fireTimer = 0;
        this._bulletInstances.count=0;
    }
}
