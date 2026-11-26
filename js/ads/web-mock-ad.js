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
                // V11 QA修复[P3]: 跟踪定时器并做归属校验 — 原实现未跟踪,
                // 若800ms内广告已被他路结算且新广告开启, 旧定时器会把新广告覆盖层藏掉
                if (self._abandonTimer) clearTimeout(self._abandonTimer);
                self._abandonTimer = setTimeout(function() {
                    self._abandonTimer = null;
                    if (self._current === opts) self._handleClose(opts, false);
                }, 800);
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
        el.style.cssText = 'position:absolute;inset:0;z-index:60;display:none;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 35%,rgba(22,38,66,0.94),rgba(8,14,26,0.98));backdrop-filter:blur(6px);color:#F8FAFC;font-family:sans-serif;';
        el.innerHTML =
            '<div style="width:min(334px,88vw);padding:20px 18px 18px;border-radius:20px;background:linear-gradient(170deg,#182844 0%,#0E192D 65%,#091120 100%);border:2px solid #38BDF8;box-shadow:0 8px 0 #050B14,0 20px 48px rgba(0,0,0,0.78),inset 0 1px 0 rgba(186,230,253,0.35);text-align:center;">' +
            '<div style="display:inline-block;padding:3px 11px;border-radius:99px;background:rgba(56,189,248,0.16);border:1px solid rgba(56,189,248,0.55);font-size:10.5px;font-weight:900;color:#7DD3FC;letter-spacing:1.4px;margin-bottom:10px;">EMERGENCY RESCUE · 战地紧急救援</div>' +
            '<div style="width:100%;height:78px;border-radius:14px;background:radial-gradient(circle at 50% 60%,rgba(34,211,238,0.28),rgba(12,24,46,0.92));border:1.5px solid rgba(56,189,248,0.38);display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:10px;box-shadow:inset 0 0 18px rgba(56,189,248,0.18);">' +
                '<svg viewBox="0 0 64 64" width="58" height="58"><defs><linearGradient id="v19sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38BDF8"/><stop offset="1" stop-color="#0284C7"/></linearGradient></defs>' +
                '<path d="M12 22c0-11 9-17 20-17s20 6 20 17H12z" fill="url(#v19sh)" stroke="#BAE6FD" stroke-width="2"/>' +
                '<path d="M14 22l12 14M50 22L38 36M32 22v14" stroke="#7DD3FC" stroke-width="1.8"/>' +
                '<rect x="20" y="36" width="24" height="20" rx="5" fill="#1E293B" stroke="#FBBF24" stroke-width="2.2"/>' +
                '<path d="M32 41v10M27 46h10" stroke="#4ADE80" stroke-width="3.4" stroke-linecap="round"/></svg>' +
                '<div style="text-align:left;"><div style="font-size:18px;font-weight:900;color:#FFF7D6;text-shadow:0 2px 4px rgba(0,0,0,0.6);">呼叫特种空降支援</div><div style="font-size:11.5px;color:#7DD3FC;font-weight:700;margin-top:2px;">直升机空投兵力 · 全屏震退清场</div></div>' +
            '</div>' +
            '<div id="mock-ad-timer" style="font-size:38px;font-weight:900;color:#FBBF24;margin-bottom:6px;">3</div>' +
            '<div id="mock-ad-tip" style="margin-bottom:16px;"></div>' +
            '<div style="display:flex;flex-direction:column;gap:9px;">' +
            '<button id="mock-ad-finish" style="padding:13px 20px;font-size:16px;font-weight:900;background:linear-gradient(180deg,#FFE866 0%,#FFB319 52%,#E06200 100%);color:#231000;border:2px solid #FFF8C8;border-radius:14px;cursor:pointer;box-shadow:0 5px 0 #8A3500,0 8px 18px rgba(224,98,0,0.45);">⚡ 跳过广告 · 立即复活</button>' +
            '<button id="mock-ad-close" style="padding:10px 20px;font-size:13px;font-weight:800;background:linear-gradient(180deg,#1E293B,#0F172A);color:#94A3B8;border:1.5px solid #334155;border-radius:12px;cursor:pointer;">放弃救援 · 返回结算</button>' +
            '</div></div>';
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
            var peakN = (typeof window !== 'undefined' && window.__game && window.__game.maxCount) ? window.__game.maxCount : 6;
            var revN = Math.max(1, Math.min(12, Math.ceil(peakN * 0.4)));
            this._tipEl.innerHTML =
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">' +
                    '<div style="padding:7px 4px;border-radius:10px;background:rgba(15,28,52,0.92);border:1px solid rgba(56,189,248,0.45);"><div style="font-size:16px;font-weight:900;color:#4ADE80;">+' + revN + '人</div><div style="font-size:10px;color:#94A3B8;margin-top:1px;">恢复兵力</div></div>' +
                    '<div style="padding:7px 4px;border-radius:10px;background:rgba(15,28,52,0.92);border:1px solid rgba(56,189,248,0.45);"><div style="font-size:16px;font-weight:900;color:#38BDF8;">3秒</div><div style="font-size:10px;color:#94A3B8;margin-top:1px;">无敌护盾</div></div>' +
                    '<div style="padding:7px 4px;border-radius:10px;background:rgba(15,28,52,0.92);border:1px solid rgba(56,189,248,0.45);"><div style="font-size:16px;font-weight:900;color:#FBBF24;">清场</div><div style="font-size:10px;color:#94A3B8;margin-top:1px;">震退近敌</div></div>' +
                '</div>' +
                '<div style="font-size:11px;color:#FBBF24;font-weight:700;">本局剩余 1 次救援机会 · 开发模式可直接跳过</div>';
            this._finishBtn.style.visibility = 'visible';
            this._closeBtn.style.visibility = 'visible';
        }
        if (afterShow) afterShow();
    }

    _hideTimer() {
        // V11 QA修复[P3]: _autoTimer 可能承载 setTimeout(无DOM兜底路径)或 setInterval(DOM倒计时),
        // 原实现只用clearInterval — 两者同时调用确保两种句柄都能正确清除
        if (this._autoTimer) { clearTimeout(this._autoTimer); clearInterval(this._autoTimer); this._autoTimer = null; }
    }

    _hideOverlay() {
        this._hideTimer();
        if (this._abandonTimer) { clearTimeout(this._abandonTimer); this._abandonTimer = null; } // V11 QA: 一并清理提前关闭定时器
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
