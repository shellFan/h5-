// ===== V4.1 five-part instanced soldier renderer and procedural poses =====

var SoldierRenderer = class SoldierRenderer {
    constructor(scene) {
        this.scene = scene;
        this.data = SoldierModelLoader.get();
        if (!this.data) throw new Error('Soldier model data is not loaded');
        this.parts = this.data.parts.slice();
        this.capacity = CONFIG.SQUAD_MAX_COUNT + SoldierRenderer.MAX_GHOSTS;
        this.banks = {};
        this.activeBank = 'hero';
        this.state = null;
        this._stateAge = 0;
        this.ghosts = [];
        this._shootT = new Float32Array(CONFIG.SQUAD_MAX_COUNT);
        this._debugPoses = [];
        this._cycleSamples = [];
        this._lastRoots = [];
        this._lastTime = 0;
        this._denseSampleTime = -Infinity;
        this._denseSample = true;
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

        this._createBank('hero');
        this._createBank('lod');
        this._selectBank('hero', 0);
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
        this._denseSample = bankName === 'hero' || time - this._denseSampleTime >= 1 / 30;
        if (this._denseSample) this._denseSampleTime = time;

        var bank = this.banks[bankName];
        for (var index = 0; index < squad.count; index++) {
            this._composeRoot(index, squad, moving, lean, tilt, this._root);
            if (!this._lastRoots[index]) this._lastRoots[index] = new THREE.Matrix4();
            this._lastRoots[index].copy(this._root);
            var pose = this._poseFor(index, squad.soldiers[index], moving, time, this._denseSample);
            for (var p = 0; p < this.parts.length; p++) {
                var part = this.parts[p];
                this._partMatrix(part, bank.source, this._root, pose, this._temp);
                bank.meshes[part].setMatrixAt(index, this._temp);
            }
        }

        for (var ghostIndex = 0; ghostIndex < this.ghosts.length; ghostIndex++) {
            var ghost = this.ghosts[ghostIndex];
            var slot = squad.count + ghostIndex;
            var deathPose = this._deathPose(ghost);
            for (var gp = 0; gp < this.parts.length; gp++) {
                var ghostPart = this.parts[gp];
                this._partMatrix(ghostPart, bank.source, ghost.root, deathPose, this._temp);
                bank.meshes[ghostPart].setMatrixAt(slot, this._temp);
            }
        }

        var visibleCount = squad.count + this.ghosts.length;
        for (var m = 0; m < this.parts.length; m++) {
            var partMesh = bank.meshes[this.parts[m]];
            partMesh.count = visibleCount;
            partMesh.instanceMatrix.needsUpdate = true;
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

    _poseFor(index, soldier, moving, time, sampleCycle) {
        var cycle = this._cycleSamples[index];
        if (!cycle) cycle = this._cycleSamples[index] = { run: 0, idle: 0, victory: 0 };
        if (sampleCycle) {
            cycle.run = Math.sin(time * 8 + (soldier.phase || 0));
            cycle.idle = Math.sin(time * 2 + (soldier.phase || 0));
            cycle.victory = Math.sin(time * 5 + (soldier.phase || 0));
        }
        var recoil = this._shootT[index] > 0
            ? Math.sin((this._shootT[index] / SoldierRenderer.SHOOT_DURATION) * Math.PI * 0.5)
            : 0;
        if (this.state === 'Shoot') recoil = Math.abs(Math.sin(time * 16 + (soldier.phase || 0))) * .8 + .2;
        var state = this.state || (moving ? 'Run' : 'Idle');
        if (this._hitT > 0) state = 'Hit';
        if (recoil > 0) state = 'Shoot';
        if (this.state === 'Victory') state = 'Victory';
        if (this.state === 'Death') state = 'Death';
        var pose = {
            state: state,
            phase: soldier.phase || 0,
            swingL: moving && state !== 'Victory' ? cycle.run * 0.6 : 0,
            swingR: moving && state !== 'Victory' ? -cycle.run * 0.6 : 0,
            bodyPitch: moving ? cycle.run * 0.025 : 0,
            bodyYaw: 0,
            headYaw: (state === 'Idle' ? cycle.idle * 0.035 : 0),
            headLift: (state === 'Idle' ? cycle.idle * 0.008 : 0),
            armsPitch: 0,
            armsLift: 0,
            recoil: recoil,
            deathT: 0,
            deathDirection: 0
        };
        if (state === 'Hit') {
            pose.bodyPitch = -0.12 * (this._hitT > 0 ? this._hitT / SoldierRenderer.HIT_DURATION : 1);
            pose.headYaw = cycle.run * 0.08;
        } else if (state === 'Death') {
            pose = this._deathPose({ age: this._stateAge, phase: soldier.phase, direction: 1 });
        } else if (state === 'Victory') {
            pose.bodyPitch = cycle.victory * 0.04;
            pose.headLift = Math.abs(cycle.victory) * 0.03;
            pose.armsPitch = -0.55 - Math.abs(cycle.victory) * 0.18;
            pose.armsLift = 0.06;
            pose.swingL = cycle.victory * 0.12;
            pose.swingR = -cycle.victory * 0.12;
        }
        this._debugPoses[index] = pose;
        return pose;
    }

    _deathPose(ghost) {
        var t = Math.min(1, ghost.age / SoldierRenderer.DEATH_DURATION);
        return {
            state: 'Death', phase: ghost.phase,
            swingL: 0.12, swingR: -0.12,
            bodyPitch: 0, bodyYaw: 0, headYaw: 0, headLift: 0,
            armsPitch: 0, armsLift: 0, recoil: 0,
            deathT: t, deathDirection: ghost.direction
        };
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
        var pose = this._poseFor(index, squad.soldiers[index], !!squad._moving, this._lastTime, true);
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

SoldierRenderer.HERO_LIMIT = 100;
SoldierRenderer.MAX_GHOSTS = 16;
SoldierRenderer.SHOOT_DURATION = 0.16;
SoldierRenderer.HIT_DURATION = 0.18;
SoldierRenderer.DEATH_DURATION = 0.65;
if (typeof window !== 'undefined') window.SoldierRenderer = SoldierRenderer;
