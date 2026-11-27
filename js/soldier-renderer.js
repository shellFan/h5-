// ===== V4.1 five-part instanced soldier renderer and procedural poses =====

var SoldierRenderer = class SoldierRenderer {
    constructor(scene) {
        this.scene = scene;
        this.data = SoldierModelLoader.get();
        if (!this.data) throw new Error('Soldier model data is not loaded');
        this.parts = this.data.parts.slice();
        // V11 QA修复[P2]: 容量必须含科技"军团上限"加成(army_limit max2 × 50 = +100),
        // 原实现固定500+16, 科技买满后600人 → setMatrixAt越界丢弃 + instanceCount超缓冲 → WebGL渲染异常
        var techLimitBonus = (typeof TECH_DEFS !== 'undefined' && TECH_DEFS.army_limit) ? 50 * TECH_DEFS.army_limit.max : 0;
        this.capacity = CONFIG.SQUAD_MAX_COUNT + techLimitBonus + SoldierRenderer.MAX_GHOSTS;
        this.banks = {};
        this.activeBank = 'hero';
        this.state = null;
        this._stateAge = 0;
        this.ghosts = [];
        this._shootT = new Float32Array(this.capacity);
        this._debugPoses = [];
        this._ghostPoses = [];
        this._lastRoots = [];
        this._lastTime = 0;
        this._hitT = 0;

        this._p = new THREE.Vector3();
        this._q = new THREE.Quaternion();
        this._s = new THREE.Vector3();
        this._e = new THREE.Euler();
        this._root = new THREE.Matrix4();
        this._local = new THREE.Matrix4();
        this._anim = new THREE.Matrix4();
        this._temp = new THREE.Matrix4();
        this._muzzleWorld = new THREE.Matrix4();
        this._outPos = new THREE.Vector3();
        // V16: 职业辨识 — 实例染色 scratch + 职业附件库(gunner肩甲/medic急救包)
        this._v16Color = new THREE.Color();
        this._v16AccBanks = {};
        this._tintStates = {
            hero: { classId: null, visibleCount: -1 },
            lod: { classId: null, visibleCount: -1 }
        };
        this._tintBank = null;

        this._createBank('hero');
        this._createBank('lod');
        this._selectBank('hero', 0);

        // V15-ART-002: 士兵柔和接地阴影 (单 InstancedMesh, 彻底增强立体落地感)
        var sCv = document.createElement('canvas'); sCv.width = sCv.height = 64;
        var sCtx = sCv.getContext('2d');
        var sGrad = sCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
        sGrad.addColorStop(0, 'rgba(12, 18, 22, 0.50)');
        sGrad.addColorStop(0.62, 'rgba(12, 18, 22, 0.24)');
        sGrad.addColorStop(1, 'rgba(12, 18, 22, 0)');
        sCtx.fillStyle = sGrad; sCtx.fillRect(0, 0, 64, 64);
        var sPlane = new THREE.PlaneGeometry(0.88, 0.78); sPlane.rotateX(-Math.PI * 0.5);
        this._shadowMesh = new THREE.InstancedMesh(sPlane, new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(sCv), transparent: true, depthWrite: false
        }), this.capacity);
        this._shadowMesh.count = 0; this._shadowMesh.frustumCulled = false; this._shadowMesh.renderOrder = 1;
        this._shadowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this._shadowMesh);
    }

    /** V16+V15: 士兵背部与肩部精致玩具战术附件(Body 局部空间, 顶点色+共享材质) */
    static _classAccGeometry(name) {
        if (SoldierRenderer._accGeos && SoldierRenderer._accGeos[name]) return SoldierRenderer._accGeos[name];
        if (!SoldierRenderer._accGeos) SoldierRenderer._accGeos = {};
        var parts = [];
        if (name === 'tacticalpack') {
            // V15 R2: 紧贴士兵背部的精致战术背包扣件与白色五角星徽章 (无多余凸起)
            parts.push(colorize(new THREE.BoxGeometry(0.24, 0.045, 0.14), 0x4E4229).translate(0, 0.32, -0.18));
            parts.push(colorize(new THREE.BoxGeometry(0.09, 0.09, 0.025), 0xFAF6E1).translate(0, 0.22, -0.245));
            parts.push(colorize(new THREE.BoxGeometry(0.08, 0.06, 0.04), 0xE6B84C).translate(-0.11, 0.12, -0.17));
            parts.push(colorize(new THREE.BoxGeometry(0.08, 0.06, 0.04), 0xE6B84C).translate(0.11, 0.12, -0.17));
        } else if (name === 'heavyplate') {
            parts.push(colorize(new THREE.BoxGeometry(0.34, 0.14, 0.3), 0x8A5A34).translate(-0.36, 0.34, 0).rotateZ(0.1));
            parts.push(colorize(new THREE.BoxGeometry(0.34, 0.14, 0.3), 0x8A5A34).translate(0.36, 0.34, 0).rotateZ(-0.1));
            parts.push(colorize(new THREE.BoxGeometry(0.3, 0.18, 0.1), 0x9C6A3E).translate(0, 0.3, -0.28));
        } else if (name === 'scoutcap') {
            parts.push(colorize(new THREE.CylinderGeometry(0.21, 0.23, 0.09, 9), 0x4E3A66).translate(0, 0.34, 0));
            parts.push(colorize(new THREE.BoxGeometry(0.18, 0.03, 0.14), 0x3C2C50).translate(0, 0.3, 0.22));
            parts.push(colorize(new THREE.BoxGeometry(0.08, 0.26, 0.06), 0x5E4680).translate(0.24, 0.22, -0.1).rotateZ(-0.15));
        } else if (name === 'medickit') {
            parts.push(colorize(new THREE.BoxGeometry(0.3, 0.24, 0.16), 0xE8EDE8).translate(0, 0.32, -0.26));
            parts.push(colorize(new THREE.BoxGeometry(0.16, 0.05, 0.02), 0xD84848).translate(0, 0.34, -0.345));
            parts.push(colorize(new THREE.BoxGeometry(0.05, 0.16, 0.02), 0xD84848).translate(0, 0.34, -0.345));
        }
        var merged = mergeGeometries(parts);
        merged.userData = { artSource: 'V16 class attachment procedural: ' + name };
        SoldierRenderer._accGeos[name] = merged;
        return merged;
    }
    _classAccBank(name) {
        if (this._v16AccBanks[name]) return this._v16AccBanks[name];
        var geo = SoldierRenderer._classAccGeometry(name);
        var mat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, vertexColors: true });
        var mesh = new THREE.InstancedMesh(geo, mat, this.capacity);
        mesh.name = 'Soldier_clsacc_' + name;
        mesh.count = 0; mesh.frustumCulled = false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.userData.artSource = 'V16 class attachment ' + name;
        this.scene.add(mesh);
        return this._v16AccBanks[name] = { mesh: mesh, count: 0 };
    }

    _createBank(name) {
        var source = this.data.banks[name];
        var meshes = {};
        for (var i = 0; i < this.parts.length; i++) {
            var part = this.parts[i];
            var mesh = new THREE.InstancedMesh(source.geometries[part], source.material, this.capacity);
            mesh.name = 'Soldier_' + name + '_' + part;
            mesh.count = 0;
            mesh.frustumCulled = false;
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.userData.artSource = this.data.urls ? this.data.urls[name] : 'V4.1 soldier GLB';
            this.scene.add(mesh);
            meshes[part] = mesh;
        }
        this.banks[name] = { meshes: meshes, source: source };
    }

    _selectBank(name, count) {
        this.activeBank = name;
        for (var bankName in this.banks) {
            var visible = bankName === name;
            var bankMeshes = this.banks[bankName].meshes;
            for (var i = 0; i < this.parts.length; i++) {
                var mesh = bankMeshes[this.parts[i]];
                mesh.visible = visible;
                if (!visible) mesh.count = 0;
                // Dense formations have no dynamic shadows. Hero shadows are capped.
                mesh.castShadow = visible && name === 'hero' && count <= 64;
            }
        }
        var active = this.banks[name].meshes;
        this.mesh = active.Body;
        this.legMeshL = active.LegL;
        this.legMeshR = active.LegR;
    }

    setState(name) {
        var allowed = ['Idle', 'Run', 'Shoot', 'Hit', 'Death', 'Victory'];
        if (name === null || name === undefined || name === 'Auto') {
            this.state = null;
            this._stateAge = 0;
            return;
        }
        if (allowed.indexOf(name) < 0) throw new Error('Unknown soldier animation state: ' + name);
        this.state = name;
        this._stateAge = 0;
    }

    triggerShoot(index) {
        if (index >= 0 && index < this._shootT.length) {
            this._shootT[index] = SoldierRenderer.SHOOT_DURATION;
        }
    }

    triggerHit() {
        this._hitT = SoldierRenderer.HIT_DURATION;
    }

    clearGhosts() {
        this.ghosts.length = 0;
    }

    captureDeaths(start, end, squad) {
        start = Math.max(0, start | 0);
        end = Math.min(end | 0, squad.soldiers.length);
        for (var i = start; i < end; i++) {
            var soldier = squad.soldiers[i];
            if (!soldier) continue;
            var root = this._lastRoots[i] ? this._lastRoots[i].clone() : new THREE.Matrix4();
            if (!this._lastRoots[i]) this._composeRoot(i, squad, false, 0, 0, root);
            if (this.ghosts.length >= SoldierRenderer.MAX_GHOSTS) this.ghosts.shift();
            this.ghosts.push({
                root: root,
                phase: soldier.phase || 0,
                age: 0,
                direction: ((i + Math.floor((soldier.phase || 0) * 10)) & 1) ? 1 : -1
            });
        }
    }

    update(dt, time, squad, moving, lean, tilt) {
        this._lastTime = time;
        this._stateAge += dt;
        this._hitT = Math.max(0, this._hitT - dt);
        for (var i = 0; i < squad.count; i++) {
            this._shootT[i] = Math.max(0, this._shootT[i] - dt);
        }
        for (var g = this.ghosts.length - 1; g >= 0; g--) {
            this.ghosts[g].age += dt;
            if (this.ghosts[g].age >= SoldierRenderer.DEATH_DURATION) this.ghosts.splice(g, 1);
        }

        var bankName = squad.count > SoldierRenderer.HERO_LIMIT ? 'lod' : 'hero';
        this._selectBank(bankName, squad.count);

        var bank = this.banks[bankName];
        // V16: 职业辨识 — 每实例染色 + 职业附件(读取 squad._gameRef._classStats.id)
        var clsId = (squad._gameRef && squad._gameRef._classStats && squad._gameRef._classStats.id) || 'rifleman';
        var clsPres = SoldierRenderer.CLASS_PRESENTATION[clsId] || SoldierRenderer.CLASS_PRESENTATION.rifleman;
        for (var k in this._v16AccBanks) this._v16AccBanks[k].count = 0;
        // Dense LOD formations never display class attachments, so do not construct
        // their geometry/bank or calculate attachment matrices until hero detail returns.
        var accBank = bankName === 'hero' && clsPres.attach ? this._classAccBank(clsPres.attach) : null;
        for (var index = 0; index < squad.count; index++) {
            this._composeRoot(index, squad, moving, lean, tilt, this._root);
            if (!this._lastRoots[index]) this._lastRoots[index] = new THREE.Matrix4();
            this._lastRoots[index].copy(this._root);
            // V15: 士兵脚底接地阴影
            if (this._shadowMesh) {
                var sObj = squad.soldiers[index];
                var sSc = (squad._formationScale || 1) * Math.max(0.01, easeOutBack(sObj ? sObj.spawnT : 1));
                this._temp.makeScale(sSc, 1, sSc);
                this._temp.setPosition(squad.x + (sObj ? sObj.x : 0), 0.032, squad.z + (sObj ? sObj.z : 0));
                this._shadowMesh.setMatrixAt(index, this._temp);
            }
            var pose = this._poseFor(index, squad.soldiers[index], moving, time);
            for (var p = 0; p < this.parts.length; p++) {
                var part = this.parts[p];
                this._partMatrix(part, bank.source, this._root, pose, this._temp);
                bank.meshes[part].setMatrixAt(index, this._temp);
                if (part === 'Body' && accBank && index < SoldierRenderer.ACC_MAX) {
                    accBank.mesh.setMatrixAt(accBank.count++, this._temp);
                }
            }
        }

        for (var ghostIndex = 0; ghostIndex < this.ghosts.length; ghostIndex++) {
            var ghost = this.ghosts[ghostIndex];
            var slot = squad.count + ghostIndex;
            var deathPose = this._ghostPoses[ghostIndex];
            if (!deathPose) deathPose = this._ghostPoses[ghostIndex] = this._createPose();
            this._deathPose(ghost, deathPose);
            for (var gp = 0; gp < this.parts.length; gp++) {
                var ghostPart = this.parts[gp];
                this._partMatrix(ghostPart, bank.source, ghost.root, deathPose, this._temp);
                bank.meshes[ghostPart].setMatrixAt(slot, this._temp);
            }
        }

        var visibleCount = squad.count + this.ghosts.length;
        var tintState = this._tintStates[bankName];
        var bankChanged = this._tintBank !== bankName;
        var classChanged = tintState.classId !== clsId;
        var visibleChanged = tintState.visibleCount !== visibleCount;
        if (bankChanged || classChanged || visibleChanged) {
            this._v16Color.setRGB(clsPres.tint[0], clsPres.tint[1], clsPres.tint[2]);
            var colorStart = (!bankChanged && !classChanged && visibleCount > tintState.visibleCount)
                ? tintState.visibleCount : 0;
            for (var colorIndex = colorStart; colorIndex < visibleCount; colorIndex++) {
                for (var colorPart = 0; colorPart < this.parts.length; colorPart++) {
                    bank.meshes[this.parts[colorPart]].setColorAt(colorIndex, this._v16Color);
                }
            }
            tintState.classId = clsId;
            tintState.visibleCount = visibleCount;
        }
        this._tintBank = bankName;
        // V11.6: 前缀上传(只传已用槽位, 上限500时GPU带宽减半以上)
        for (var m = 0; m < this.parts.length; m++) {
            var partMesh = bank.meshes[this.parts[m]];
            partMesh.count = visibleCount;
            partMesh.instanceMatrix.updateRange.offset = 0;
            partMesh.instanceMatrix.updateRange.count = visibleCount * 16;
            partMesh.instanceMatrix.needsUpdate = true;
            if (partMesh.instanceColor && (bankChanged || classChanged || visibleChanged)) {
                partMesh.instanceColor.updateRange.offset = colorStart * 3;
                partMesh.instanceColor.updateRange.count = Math.max(0, visibleCount - colorStart) * 3;
                partMesh.instanceColor.needsUpdate = true;
            }
        }
        // V16: 职业附件上传(仅 hero 银行可见; LOD 大编制隐藏以省调用)
        for (var ak in this._v16AccBanks) {
            var accessoryBank = this._v16AccBanks[ak];
            var am = accessoryBank.mesh;
            var activeAccessory = bankName === 'hero' && accessoryBank === accBank && accessoryBank.count > 0;
            am.count = activeAccessory ? accessoryBank.count : 0;
            am.visible = activeAccessory;
            if (activeAccessory) {
                am.instanceMatrix.updateRange.offset = 0;
                am.instanceMatrix.updateRange.count = accessoryBank.count * 16;
                am.instanceMatrix.needsUpdate = true;
            }
        }
        if (this._shadowMesh) {
            this._shadowMesh.count = squad.count;
            this._shadowMesh.visible = squad.count > 0;
            this._shadowMesh.instanceMatrix.updateRange.offset = 0;
            this._shadowMesh.instanceMatrix.updateRange.count = squad.count * 16;
            this._shadowMesh.instanceMatrix.needsUpdate = true;
        }
    }

    _composeRoot(index, squad, moving, lean, tilt, target) {
        var soldier = squad.soldiers[index];
        if (!soldier) return target.identity();
        var phase = soldier.phase || 0;
        var time = this._lastTime;
        var bob = moving ? Math.abs(Math.sin(time * 8 + phase)) * 0.035 : Math.sin(time * 2 + phase) * 0.012;
        var spawnScale = Math.max(0.001, easeOutBack(soldier.spawnT));
        var modelScale = squad._formationScale || 1;
        this._p.set(squad.x + soldier.x, bob, squad.z + soldier.z);
        this._e.set(lean || 0, soldier.rotY || 0, tilt || 0, 'YXZ');
        this._q.setFromEuler(this._e);
        this._s.setScalar(spawnScale * modelScale);
        return target.compose(this._p, this._q, this._s);
    }

    _createPose() {
        return {
            state: 'Idle', phase: 0,
            swingL: 0, swingR: 0,
            bodyPitch: 0, bodyYaw: 0,
            headYaw: 0, headLift: 0,
            armsPitch: 0, armsLift: 0,
            recoil: 0, deathT: 0, deathDirection: 0
        };
    }

    _poseFor(index, soldier, moving, time) {
        var phase = soldier.phase || 0;
        var recoil = this._shootT[index] > 0
            ? Math.sin((this._shootT[index] / SoldierRenderer.SHOOT_DURATION) * Math.PI * 0.5)
            : 0;
        if (this.state === 'Shoot') recoil = Math.abs(Math.sin(time * 16 + phase)) * .8 + .2;
        var state = this.state || (moving ? 'Run' : 'Idle');
        if (this._hitT > 0) state = 'Hit';
        if (recoil > 0) state = 'Shoot';
        if (this.state === 'Victory') state = 'Victory';
        if (this.state === 'Death') state = 'Death';
        var runCycle = ((moving && state !== 'Victory' && state !== 'Death') || state === 'Hit')
            ? Math.sin(time * 8 + phase) : 0;
        var idleCycle = state === 'Idle' ? Math.sin(time * 2 + phase) : 0;
        var victoryCycle = state === 'Victory' ? Math.sin(time * 5 + phase) : 0;
        var pose = this._debugPoses[index];
        if (!pose) pose = this._debugPoses[index] = this._createPose();
        pose.state = state;
        pose.phase = phase;
        pose.swingL = moving && state !== 'Victory' ? runCycle * 0.6 : 0;
        pose.swingR = moving && state !== 'Victory' ? -runCycle * 0.6 : 0;
        pose.bodyPitch = moving ? runCycle * 0.025 : 0;
        pose.bodyYaw = 0;
        pose.headYaw = state === 'Idle' ? idleCycle * 0.035 : 0;
        pose.headLift = state === 'Idle' ? idleCycle * 0.008 : 0;
        pose.armsPitch = 0;
        pose.armsLift = 0;
        pose.recoil = recoil;
        pose.deathT = 0;
        pose.deathDirection = 0;
        if (state === 'Hit') {
            pose.bodyPitch = -0.12 * (this._hitT > 0 ? this._hitT / SoldierRenderer.HIT_DURATION : 1);
            pose.headYaw = runCycle * 0.08;
        } else if (state === 'Death') {
            this._setDeathPose(pose, this._stateAge, phase, 1);
        } else if (state === 'Victory') {
            pose.bodyPitch = victoryCycle * 0.04;
            pose.headLift = Math.abs(victoryCycle) * 0.03;
            pose.armsPitch = -0.55 - Math.abs(victoryCycle) * 0.18;
            pose.armsLift = 0.06;
            pose.swingL = victoryCycle * 0.12;
            pose.swingR = -victoryCycle * 0.12;
        }
        return pose;
    }

    _setDeathPose(target, age, phase, direction) {
        target.state = 'Death';
        target.phase = phase || 0;
        target.swingL = 0.12;
        target.swingR = -0.12;
        target.bodyPitch = 0;
        target.bodyYaw = 0;
        target.headYaw = 0;
        target.headLift = 0;
        target.armsPitch = 0;
        target.armsLift = 0;
        target.recoil = 0;
        target.deathT = Math.min(1, age / SoldierRenderer.DEATH_DURATION);
        target.deathDirection = direction;
        return target;
    }

    _deathPose(ghost, target) {
        if (!target) target = ghost._pose || (ghost._pose = this._createPose());
        return this._setDeathPose(target, ghost.age, ghost.phase, ghost.direction);
    }

    _partMatrix(part, source, root, pose, target) {
        this._anim.identity();
        if (part === 'Body') {
            this._e.set(pose.bodyPitch, pose.bodyYaw, 0, 'YXZ');
            this._anim.makeRotationFromEuler(this._e);
        } else if (part === 'Head') {
            this._e.set(0, pose.headYaw, 0, 'YXZ');
            this._anim.makeRotationFromEuler(this._e);
            this._anim.setPosition(0, pose.headLift, 0);
        } else if (part === 'Arms') {
            this._e.set(pose.armsPitch - pose.recoil * 0.12, 0, 0, 'YXZ');
            this._anim.makeRotationFromEuler(this._e);
            this._anim.setPosition(0, pose.armsLift, pose.recoil * 0.12);
        } else if (part === 'LegL') {
            this._anim.makeRotationX(pose.swingL);
        } else if (part === 'LegR') {
            this._anim.makeRotationX(pose.swingR);
        }
        target.copy(root);
        if (pose.deathT) {
            this._e.set(0, 0, pose.deathDirection * pose.deathT * Math.PI * 0.5);
            this._local.makeRotationFromEuler(this._e);
            var shrink = 1 - Math.pow(pose.deathT, 3) * .95;
            this._local.scale(this._s.setScalar(shrink));
            this._local.setPosition(0, .12 * Math.sin(pose.deathT * Math.PI), 0);
            target.multiply(this._local);
        }
        return target.multiply(source.restMatrices[part]).multiply(this._anim);
    }

    getMuzzlePosition(index, squad, target) {
        target = target || new THREE.Vector3();
        if (index < 0 || index >= squad.count) return null;
        this._composeRoot(index, squad, !!squad._moving, squad._lean || 0, squad._tilt || 0, this._root);
        var pose = this._poseFor(index, squad.soldiers[index], !!squad._moving, this._lastTime);
        var bank = this.banks[this.activeBank];
        this._partMatrix('Arms', bank.source, this._root, pose, this._temp);
        bank.meshes.Arms.setMatrixAt(index, this._temp);
        bank.meshes.Arms.instanceMatrix.needsUpdate = true;
        this._muzzleWorld.copy(this._temp).multiply(this.data.muzzleMatrix);
        return target.setFromMatrixPosition(this._muzzleWorld);
    }

    pose(index) {
        if (index < 0 || index >= this._debugPoses.length || !this._debugPoses[index]) return null;
        var pose = this._debugPoses[index];
        return {
            state: pose.state,
            phase: pose.phase,
            swingL: pose.swingL,
            swingR: pose.swingR,
            recoil: pose.recoil
        };
    }
};

// V16: 职业士兵辨识表 — 乘法染色(与 CLASS_DEFS.color 身份色呼应) + 职业附件
SoldierRenderer.CLASS_PRESENTATION = {
    rifleman: { tint: [1, 1, 1] },
    gunner:   { tint: [1.22, 0.98, 0.82], attach: 'heavyplate' },
    marksman: { tint: [1.05, 0.9, 1.28], attach: 'scoutcap' },
    medic:    { tint: [0.82, 1.18, 0.94], attach: 'medickit' }
};
SoldierRenderer.ACC_MAX = 600;
SoldierRenderer.HERO_LIMIT = 100;
SoldierRenderer.MAX_GHOSTS = 16;
SoldierRenderer.SHOOT_DURATION = 0.16;
SoldierRenderer.HIT_DURATION = 0.18;
SoldierRenderer.DEATH_DURATION = 0.65;
if (typeof window !== 'undefined') window.SoldierRenderer = SoldierRenderer;
