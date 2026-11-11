// V4.0 Phase6 补丁: 爽感层 — 乘法门慢动作+屏幕震动 / Boss入场动画+震屏
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function patch(file, pairs) {
    var p = path.join(ROOT, file);
    var c = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    var ok = true;
    pairs.forEach(function(pr) {
        if (c.indexOf(pr[0]) < 0) { console.error('[' + file + '] NOT FOUND: ' + pr[2]); ok = false; return; }
        c = c.replace(pr[0], pr[1]);
        console.log('[' + file + '] ok: ' + pr[2]);
    });
    if (ok) fs.writeFileSync(p, c);
}

// ---- world.js: 屏幕震动(衰减随机偏移) ----
patch('js/world.js', [
    [
        "        cam.lookAt(targetX * 0.5, 0, squadZ + lookAhead);",
        "        // V4.0: 屏幕震动(受击/翻倍/Boss入场), 指数衰减\n" +
        "        if (this._shakeT > 0.001) {\n" +
        "            this._shakeT = Math.max(0, this._shakeT - dt * 2.2);\n" +
        "            var sAmp = this._shakeAmp * this._shakeT;\n" +
        "            cam.position.x += (Math.random() - 0.5) * sAmp;\n" +
        "            cam.position.y += (Math.random() - 0.5) * sAmp * 0.5;\n" +
        "        }\n" +
        "        cam.lookAt(targetX * 0.5, 0, squadZ + lookAhead);",
        'shake decay in updateCamera'
    ],
    [
        "    _detectQuality() {",
        "    /** V4.0: 触发屏幕震动(amp≈世界单位幅度) */\n" +
        "    shake(amp) {\n" +
        "        this._shakeT = 1;\n" +
        "        this._shakeAmp = amp || 0.3;\n" +
        "    }\n\n" +
        "    _detectQuality() {",
        'shake() method'
    ]
]);

// ---- game.js: 慢动作时间缩放 + 乘法门/Boss入场钩子 ----
patch('js/game.js', [
    [
        "        this.pacing.onBossWarning = function(w) { self._showBossWarning(true); };",
        "        this.pacing.onBossWarning = function(w) { self._showBossWarning(true); };\n" +
        "        // V4.0 爽感: 乘法门慢动作+震屏 / Boss入场爆发\n" +
        "        this.gates.onMul = function(g) { self._slowmo(); self.world.shake(0.22); };\n" +
        "        this.pacing._onBossSpawnFx = function() { self.world.shake(0.5); };",
        'juice hooks in constructor'
    ],
    [
        "        this.state = 'idle'; // idle | playing | won | lost",
        "        this.state = 'idle'; // idle | playing | won | lost\n" +
        "        // V4.0: 慢动作(乘法门/Boss击杀) — dt缩放, UI与输入不受影响\n" +
        "        this._timeScale = 1;\n" +
        "        this._slowmoT = 0;",
        'slowmo fields init'
    ],
    [
        "    _showBossWarning(show) {",
        "    /** V4.0: 短暂慢动作(0.35s, 时间流速0.35), 不打断操作 */\n" +
        "    _slowmo() {\n" +
        "        this._timeScale = 0.35;\n" +
        "        this._slowmoT = 0.35;\n" +
        "    }\n\n" +
        "    _showBossWarning(show) {",
        '_slowmo method'
    ],
    [
        "        if (this.state === 'playing' && !this.paused) {\n" +
        "            this.time += dt;\n" +
        "            this.elapsedTime += dt;\n" +
        "            this._update(dt);",
        "        if (this.state === 'playing' && !this.paused) {\n" +
        "            // V4.0: 慢动作缩放游戏时间(输入/UI仍用真实dt)\n" +
        "            if (this._slowmoT > 0) {\n" +
        "                this._slowmoT -= dt;\n" +
        "            } else {\n" +
        "                this._timeScale = 1;\n" +
        "            }\n" +
        "            var ts = this._timeScale;\n" +
        "            this.time += dt * ts;\n" +
        "            this.elapsedTime += dt;\n" +
        "            this._update(dt * ts);",
        'slowmo dt scaling in loop'
    ]
]);

// ---- gates.js: 乘法门回调 ----
patch('js/gates.js', [
    [
        "                if (Math.abs(squad.x - g.x) < triggerWin) {\n" +
        "                    g.triggered = true;\n" +
        "                    squad.applyGate(g.data, effects);\n" +
        "                    this._highlight(g, effects);",
        "                if (Math.abs(squad.x - g.x) < triggerWin) {\n" +
        "                    g.triggered = true;\n" +
        "                    squad.applyGate(g.data, effects);\n" +
        "                    this._highlight(g, effects);\n" +
        "                    if (g.data.op === 'mul' && this.onMul) this.onMul(g); // V4.0: 翻倍慢动作+震屏",
        'mul gate callback'
    ]
]);

// ---- pacing.js: Boss出场时触发世界震动 ----
patch('js/pacing.js', [
    [
        "                if (this.spawnFn) this.spawnFn('boss', 0, bz, w.hp);\n" +
        "                w.state = 'done';\n" +
        "                if (this.onBossSpawn) this.onBossSpawn(w);",
        "                if (this.spawnFn) this.spawnFn('boss', 0, bz, w.hp);\n" +
        "                w.state = 'done';\n" +
        "                if (this._onBossSpawnFx) this._onBossSpawnFx(); // V4.0: 入场震屏\n" +
        "                if (this.onBossSpawn) this.onBossSpawn(w);",
        'boss spawn shake'
    ]
]);

// ---- enemies.js: Boss入场弹性缩放动画 ----
patch('js/enemies.js', [
    [
        "        this.dying = false;\n" +
        "        this.dieT = 0;\n" +
        "        this.deathHandled = false;\n" +
        "        this.removeReady = false;",
        "        this.dying = false;\n" +
        "        this.dieT = 0;\n" +
        "        this.deathHandled = false;\n" +
        "        this.removeReady = false;\n" +
        "        this.spawnT = this.isBoss ? 0 : 1; // V4.0: Boss弹性入场动画",
        'boss spawnT field'
    ],
    [
        "        if (!this.alive) return;\n\n" +
        "        // V3.3: 冰冻减速",
        "        if (!this.alive) return;\n\n" +
        "        // V4.0: Boss入场弹性缩放(0.5s, 期间不移动不攻击)\n" +
        "        if (this.spawnT < 1) {\n" +
        "            this.spawnT = Math.min(1, this.spawnT + dt * 2);\n" +
        "            this.model.scale.setScalar(this.visScale * Math.max(0.05, easeOutBack(this.spawnT)));\n" +
        "            if (this.spawnT < 1) return;\n" +
        "        }\n\n" +
        "        // V3.3: 冰冻减速",
        'boss entrance animation'
    ]
]);

console.log('juice patch complete');
