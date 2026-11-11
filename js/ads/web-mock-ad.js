// ===== H5 测试广告模拟器 (Phase 4) =====
// 明确标注"测试广告", 不接真实广告SDK; 支持测试场景注入(自动化测试用)
// 规则与真实平台一致: 提前关闭不发奖 / 完整观看发奖 / 中断不发奖

class WebMockAdService extends AdService {
    constructor(storage, lifecycle, opts) {
        super(storage, lifecycle);
        this._opts = opts || {};
        // 测试场景: 'normal'(默认手动) | 'auto_complete'(自动完成) | 'auto_abandon'(自动提前关闭) | 'error'(加载失败)
        this._scenario = this._opts.scenario || 'normal';
        this._autoDuration = this._opts.autoDuration || 3; // 自动完成秒数
    }

    setScenario(s) { this._scenario = s; }

    _doInitialize() {
        // 创建DOM覆盖层(懒创建)
        this._ensureOverlay();
    }

    _doIsAvailable() {
        // 模拟器始终可用; 'error'场景模拟不可用
        return this._scenario !== 'error' || this._opts.errorAvailable === true;
    }

    _doPreload() { /* 模拟器无加载过程 */ }

    _doShow(opts) {
        var self = this;
        // 测试场景自动处置
        if (this._scenario === 'error') {
            setTimeout(function() { opts.onError(AdError.LOAD_FAILED); }, 60);
            return;
        }
        if (this._scenario === 'auto_complete') {
            // 模拟播放 autoDuration 秒后完成
            this._showOverlay(opts, this._autoDuration, true);
            return;
        }
        if (this._scenario === 'auto_abandon') {
            this._showOverlay(opts, this._autoDuration, false, function() {
                // 播放中自动"提前关闭"
                setTimeout(function() { self._handleClose(opts, false); }, 800);
            });
            return;
        }
        // 默认: 手动交互
        this._showOverlay(opts, 0, false);
    }

    _doInterrupt() {
        // 切后台: 关闭覆盖层, 不发奖
        this._hideOverlay();
    }

    _doDispose() { this._hideOverlay(); }

    // ---- 模拟器UI ----
    _ensureOverlay() {
        if (this._overlay || typeof document === 'undefined') return;
        var self = this;
        var el = document.createElement('div');
        el.id = 'mock-ad-overlay';
        el.style.cssText = 'position:absolute;inset:0;z-index:60;display:none;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#111827,#1F2937);color:#fff;font-family:sans-serif;';
        el.innerHTML =
            '<div style="position:absolute;top:10px;left:14px;background:#F59E0B;color:#111;font-weight:900;font-size:12px;padding:3px 10px;border-radius:6px;letter-spacing:1px;">测试广告模拟器 · TEST AD</div>' +
            '<div id="mock-ad-timer" style="font-size:52px;font-weight:900;color:#FDE68A;margin-bottom:8px;">3</div>' +
            '<div id="mock-ad-tip" style="font-size:14px;color:#9CA3AF;margin-bottom:26px;">模拟激励视频播放中…（完整观看才可领取奖励）</div>' +
            '<div style="display:flex;gap:14px;">' +
            '<button id="mock-ad-finish" style="padding:12px 30px;font-size:16px;font-weight:800;background:linear-gradient(180deg,#4DA8FF,#1A6FD4);color:#fff;border:none;border-radius:30px;cursor:pointer;">模拟完整观看</button>' +
            '<button id="mock-ad-close" style="padding:12px 30px;font-size:16px;font-weight:700;background:#374151;color:#D1D5DB;border:none;border-radius:30px;cursor:pointer;">提前关闭(不发奖)</button>' +
            '</div>';
        (document.getElementById('game-container') || document.body).appendChild(el);
        this._overlay = el;
        this._timerEl = el.querySelector('#mock-ad-timer');
        this._tipEl = el.querySelector('#mock-ad-tip');
        this._finishBtn = el.querySelector('#mock-ad-finish');
        this._closeBtn = el.querySelector('#mock-ad-close');
        this._finishBtn.addEventListener('click', function() {
            if (self._current) self._handleClose(self._current, true);
        });
        this._closeBtn.addEventListener('click', function() {
            if (self._current) self._handleClose(self._current, false);
        });
    }

    /**
     * 显示覆盖层
     * @param opts 广告回调
     * @param countdown 自动完成倒计时(0=手动)
     * @param autoComplete 是否自动完成
     * 注: 无DOM环境(单测/小游戏)自动跳过UI, 仅保留计时与结算逻辑
     */
    _showOverlay(opts, countdown, autoComplete, afterShow) {
        this._current = opts;
        this._hideTimer();
        if (!this._overlay) {
            // 无DOM兜底: 纯逻辑模式
            if (countdown > 0 && autoComplete) {
                var self = this;
                this._autoTimer = setTimeout(function() {
                    if (self._current) self._handleClose(self._current, true);
                }, countdown * 1000);
            }
            if (afterShow) afterShow();
            return;
        }
        this._overlay.style.display = 'flex';
        if (countdown > 0) {
            var self2 = this;
            var remain = countdown;
            this._timerEl.textContent = remain;
            this._timerEl.style.display = 'block';
            this._tipEl.textContent = '模拟激励视频播放中…（完整观看才可领取奖励）';
            this._autoTimer = setInterval(function() {
                remain--;
                if (self2._timerEl) self2._timerEl.textContent = Math.max(0, remain);
                if (remain <= 0) {
                    self2._hideTimer();
                    if (autoComplete && self2._current) self2._handleClose(self2._current, true);
                }
            }, 1000);
            this._finishBtn.style.visibility = 'hidden';
            this._closeBtn.style.visibility = 'hidden';
            setTimeout(function() {
                self2._finishBtn.style.visibility = 'visible';
                self2._closeBtn.style.visibility = 'visible';
            }, 600);
        } else {
            this._timerEl.style.display = 'none';
            this._tipEl.textContent = 'TEST AD · 点击下方按钮模拟观看结果';
            this._finishBtn.style.visibility = 'visible';
            this._closeBtn.style.visibility = 'visible';
        }
        if (afterShow) afterShow();
    }

    _hideTimer() {
        if (this._autoTimer) { clearInterval(this._autoTimer); this._autoTimer = null; }
    }

    _hideOverlay() {
        this._hideTimer();
        if (this._overlay) this._overlay.style.display = 'none';
        this._current = null;
    }

    /** 关闭处置: completed=完整观看发奖 / 提前关闭不发奖 */
    _handleClose(opts, completed) {
        this._hideOverlay();
        if (completed) {
            if (opts.onComplete) opts.onComplete();
        } else {
            if (opts.onAbandon) opts.onAbandon();
        }
    }
}
