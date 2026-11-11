// ===== 音频适配器 (Phase 5) =====
// H5: WebAudio(合成音效, 无需资源) | 抖音: tt.createInnerAudioContext
// 游戏当前无音频资源, 本适配器提供程序化合成音效接口 + 静音开关(持久化)

class AudioAdapter {
    constructor(storage) {
        this._storage = storage;
        this._ctx = null;
        this._muted = storage ? !!storage.get('audio_muted', false) : false;
        this._enabled = false;
        this._lastPlay = {}; // 限流: 同一音效最小间隔
    }

    /** 惰性初始化(必须由用户手势触发, 平台限制) */
    init() {
        if (this._ctx) { this._enabled = true; return true; }
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return false;
            this._ctx = new AC();
            this._enabled = true;
            return true;
        } catch (e) {
            console.warn('[Audio] 初始化失败', e);
            return false;
        }
    }

    /** 恢复上下文(iOS切后台后suspend) */
    resume() {
        if (this._ctx && this._ctx.state === 'suspended') {
            this._ctx.resume().catch(function() {});
        }
    }

    isMuted() { return this._muted; }
    setMuted(m) {
        this._muted = !!m;
        if (this._storage) this._storage.set('audio_muted', this._muted);
    }

    /**
     * 合成音效: 简单包络振荡器
     * type: 'shoot'|'hit'|'gate'|'win'|'lose'|'click'
     * 限流避免大量士兵同时射击时的音频爆音
     */
    play(type) {
        if (!this._enabled || this._muted || !this._ctx) return;
        var now = performance.now();
        var minGap = { shoot: 90, hit: 60, gate: 200, win: 0, lose: 0, click: 50 }[type] || 80;
        if (this._lastPlay[type] && now - this._lastPlay[type] < minGap) return;
        this._lastPlay[type] = now;

        try {
            var t = this._ctx.currentTime;
            var osc = this._ctx.createOscillator();
            var gain = this._ctx.createGain();
            osc.connect(gain);
            gain.connect(this._ctx.destination);

            var conf = {
                shoot: { freq: 880, end: 220, dur: 0.08, vol: 0.08, wave: 'square' },
                hit:   { freq: 320, end: 80,  dur: 0.1,  vol: 0.12, wave: 'triangle' },
                gate:  { freq: 440, end: 880, dur: 0.25, vol: 0.18, wave: 'sine' },
                win:   { freq: 523, end: 1046, dur: 0.5, vol: 0.22, wave: 'sine' },
                lose:  { freq: 330, end: 110, dur: 0.6, vol: 0.2, wave: 'sawtooth' },
                click: { freq: 660, end: 660, dur: 0.05, vol: 0.1, wave: 'sine' }
            }[type] || { freq: 440, end: 440, dur: 0.1, vol: 0.1, wave: 'sine' };

            osc.type = conf.wave;
            osc.frequency.setValueAtTime(conf.freq, t);
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, conf.end), t + conf.dur);
            gain.gain.setValueAtTime(conf.vol, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + conf.dur);
            osc.start(t);
            osc.stop(t + conf.dur + 0.02);
        } catch (e) { /* 音频失败不影响游戏 */ }
    }
}
