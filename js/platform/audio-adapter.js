// ===== 音频适配器 (Phase 5 / V5.0) =====
// H5: WebAudio(合成音效, 无需资源文件) | 抖音小游戏: 无 AudioContext, V5.0 增加
//     tt.createInnerAudioContext 分支 — 播放前用合成参数现场生成 8bit WAV 数据 URI。
// 游戏无音频资源文件, 全部音效为程序化合成; 提供静音开关(持久化)。

class AudioAdapter {
    constructor(storage, platformId) {
        this._storage = storage;
        this._platform = platformId || 'h5';
        this._ctx = null;          // WebAudio 上下文(h5)
        this._ttPool = [];         // 抖音 InnerAudioContext 池(按音效类型预建)
        this._wxPool = [];         // V12: 微信 InnerAudioContext 池
        this._muted = storage ? !!storage.get('audio_muted', false) : false;
        this._enabled = false;
        this._lastPlay = {}; // 限流: 同一音效最小间隔
    }

    /** 惰性初始化(必须由用户手势触发, 平台限制) */
    init() {
        if (this._enabled) return true;
        try {
            if (this._platform === 'douyin' && typeof tt !== 'undefined' && tt.createInnerAudioContext) {
                this._enabled = true;
                return true;
            }
            // V12: 微信小游戏 — 优先 wx.createWebAudioContext(振荡器API与H5一致),
            // 不支持时回退 wx.createInnerAudioContext(合成WAV data URI, 结构对齐抖音分支)
            if (this._platform === 'wechat' && typeof wx !== 'undefined') {
                if (wx.createWebAudioContext) {
                    try {
                        this._ctx = wx.createWebAudioContext();
                        this._enabled = true;
                        return true;
                    } catch (e) { /* 落入 InnerAudio 回退 */ }
                }
                if (wx.createInnerAudioContext) {
                    this._enabled = true;
                    return true;
                }
                return false;
            }
            var AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
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

    /** V5.0: 页面隐藏时暂停不必要的播放(WebAudio 全局挂起; 抖音由系统接管) */
    suspend() {
        if (this._ctx && this._ctx.state === 'running') {
            this._ctx.suspend().catch(function() {});
        }
    }

    isMuted() { return this._muted; }
    setMuted(m) {
        this._muted = !!m;
        if (this._storage) this._storage.set('audio_muted', this._muted);
    }

    /** 音效合成参数: freq起始Hz → end结束Hz, dur时长s, vol音量, wave波形 */
    static spec(type) {
        return {
            shoot: { freq: 880, end: 220, dur: 0.08, vol: 0.08, wave: 'square' },
            hit:   { freq: 320, end: 80,  dur: 0.1,  vol: 0.12, wave: 'triangle' },
            kill:  { freq: 520, end: 160, dur: 0.12, vol: 0.14, wave: 'square' },
            gate:  { freq: 440, end: 880, dur: 0.25, vol: 0.18, wave: 'sine' },
            grow:  { freq: 392, end: 784, dur: 0.18, vol: 0.16, wave: 'sine' },
            win:   { freq: 523, end: 1046, dur: 0.5, vol: 0.22, wave: 'sine' },
            lose:  { freq: 330, end: 110, dur: 0.6, vol: 0.2, wave: 'sawtooth' },
            click: { freq: 660, end: 660, dur: 0.05, vol: 0.1, wave: 'sine' },
            bossWarn: { freq: 150, end: 60, dur: 0.7, vol: 0.25, wave: 'sawtooth' },
            bossDie:  { freq: 200, end: 40, dur: 0.8, vol: 0.26, wave: 'sawtooth' }
        }[type] || { freq: 440, end: 440, dur: 0.1, vol: 0.1, wave: 'sine' };
    }

    /**
     * 合成音效
     * type: 'shoot'|'hit'|'kill'|'gate'|'grow'|'win'|'lose'|'click'|'bossWarn'|'bossDie'
     * 限流避免大量士兵同时射击时的音频爆音
     */
    play(type) {
        if (!this._enabled || this._muted) return;
        var now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        var minGap = { shoot: 90, hit: 60, kill: 70, gate: 200, grow: 120, win: 0, lose: 0, click: 50, bossWarn: 0, bossDie: 0 }[type] || 80;
        if (this._lastPlay[type] && now - this._lastPlay[type] < minGap) return;
        this._lastPlay[type] = now;

        try {
            if (this._ctx) this._playWebAudio(type);
            else if (this._platform === 'douyin') this._playTt(type);
            else if (this._platform === 'wechat') this._playWx(type);
        } catch (e) { /* 音频失败不影响游戏 */ }
    }

    _playWebAudio(type) {
        var t = this._ctx.currentTime;
        var conf = AudioAdapter.spec(type);
        var osc = this._ctx.createOscillator();
        var gain = this._ctx.createGain();
        osc.connect(gain);
        gain.connect(this._ctx.destination);
        osc.type = conf.wave;
        osc.frequency.setValueAtTime(conf.freq, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, conf.end), t + conf.dur);
        gain.gain.setValueAtTime(conf.vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + conf.dur);
        osc.start(t);
        osc.stop(t + conf.dur + 0.02);
    }

    /** V12: 微信回退路径 — InnerAudioContext 播放合成 WAV(与抖音分支同构) */
    _playWx(type) {
        if (typeof wx === 'undefined' || !wx.createInnerAudioContext) return;
        var conf = AudioAdapter.spec(type);
        var dataUri = this._synthWav(conf);
        var ctx = this._wxPool[type];
        if (!ctx) {
            ctx = wx.createInnerAudioContext();
            ctx.volume = Math.min(1, conf.vol * 4);
            ctx.loop = false;
            this._wxPool[type] = ctx;
        }
        try { ctx.stop(); } catch (e) {}
        ctx.src = dataUri;
        ctx.play();
    }

    /** 抖音: 现场合成 8bit 单声道 WAV data URI, 经 InnerAudioContext 播放 */
    _playTt(type) {
        var conf = AudioAdapter.spec(type);
        var dataUri = this._synthWav(conf);
        // 池化复用: 每类型保留一个 context, 换 src 重播(抖音换src播完自动停)
        var ctx = this._ttPool[type];
        if (!ctx) {
            ctx = tt.createInnerAudioContext({ useWebAudioImplement: true });
            ctx.volume = Math.min(1, conf.vol * 4);
            ctx.loop = false;
            this._ttPool[type] = ctx;
        }
        ctx.stop();
        ctx.src = dataUri;
        ctx.play();
    }

    /** 生成简短包络振荡 WAV(8bit 8kHz, 长度=dur) */
    _synthWav(conf) {
        var rate = 8000, n = Math.max(1, Math.floor(conf.dur * rate));
        var bytes = new Uint8Array(n);
        var phase = 0;
        for (var i = 0; i < n; i++) {
            var t = i / rate;
            // 频率指数滑降/滑升
            var f = conf.freq + (conf.end - conf.freq) * (t / conf.dur);
            phase += f / rate;
            var wave;
            var frac = phase % 1;
            if (conf.wave === 'square') wave = frac < 0.5 ? 1 : -1;
            else if (conf.wave === 'sawtooth') wave = frac * 2 - 1;
            else if (conf.wave === 'triangle') wave = 1 - Math.abs(frac - 0.5) * 4;
            else wave = Math.sin(phase * Math.PI * 2);
            // 音量包络(快起慢落)
            var env = Math.min(1, i / (rate * 0.005)) * Math.pow(1 - t / conf.dur, 1.5);
            bytes[i] = Math.round(128 + wave * 100 * env) & 0xFF;
        }
        // 组装 WAV 文件头(PCM 8bit mono)
        var buf = new ArrayBuffer(44 + n);
        var view = new DataView(buf);
        var w = 0;
        function str(s) { for (var i = 0; i < s.length; i++) view.setUint8(w++, s.charCodeAt(i)); }
        function u32(v) { view.setUint32(w, v, true); w += 4; }
        function u16(v) { view.setUint16(w, v, true); w += 2; }
        str('RIFF'); u32(36 + n); str('WAVE'); str('fmt ');
        u32(16); u16(1); u16(1); u32(rate); u32(rate); u16(1); u16(8);
        str('data'); u32(n);
        new Uint8Array(buf, 44).set(bytes);
        // ArrayBuffer→base64: 抖音用 tt.arrayBufferToBase64, H5 用 btoa
        if (typeof tt !== 'undefined' && tt.arrayBufferToBase64) {
            return 'data:audio/wav;base64,' + tt.arrayBufferToBase64(buf);
        }
        // V12: 微信小游戏 wx.arrayBufferToBase64
        if (typeof wx !== 'undefined' && wx.arrayBufferToBase64) {
            return 'data:audio/wav;base64,' + wx.arrayBufferToBase64(buf);
        }
        var bin = '';
        var raw = new Uint8Array(buf);
        var chunk = 0x8000;
        for (var ci = 0; ci < raw.length; ci += chunk) {
            bin += String.fromCharCode.apply(null, raw.subarray(ci, ci + chunk));
        }
        return 'data:audio/wav;base64,' + btoa(bin);
    }
}
