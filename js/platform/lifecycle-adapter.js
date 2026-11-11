// ===== 生命周期适配器 (Phase 5) =====
// 统一前后台切换 / 页面隐藏恢复事件: onHide / onShow
// H5: document.visibilitychange + window blur/focus
// 抖音: tt.onAppHide / tt.onAppShow

class LifecycleAdapter {
    constructor() {
        this._handlers = { hide: [], show: [] };
        this._isBackground = false;
    }

    /** 绑定平台事件(H5默认实现) */
    bind() {
        var self = this;
        // 页面隐藏 (切后台/锁屏/切标签)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) self._fire('hide');
            else self._fire('show');
        });
        // 失焦兜底(部分安卓WebView不触发visibilitychange)
        window.addEventListener('blur', function() {
            // visibilitychange 已覆盖多数场景, blur仅作为补充信号
            if (document.visibilityState !== 'hidden') return;
        });
    }

    /** 抖音环境用此方法接入 tt.onAppHide/onAppShow */
    bindTt(ttApi) {
        var self = this;
        if (ttApi.onAppHide) ttApi.onAppHide(function() { self._fire('hide'); });
        if (ttApi.onAppShow) ttApi.onAppShow(function() { self._fire('show'); });
    }

    on(event, fn) {
        if (this._handlers[event]) this._handlers[event].push(fn);
        return function() { this.off(event, fn); }.bind(this);
    }

    off(event, fn) {
        var list = this._handlers[event];
        if (!list) return;
        var idx = list.indexOf(fn);
        if (idx >= 0) list.splice(idx, 1);
    }

    isBackground() { return this._isBackground; }

    _fire(event) {
        if (event === 'hide') this._isBackground = true;
        if (event === 'show') this._isBackground = false;
        var list = this._handlers[event].slice();
        for (var i = 0; i < list.length; i++) {
            try { list[i](); } catch (e) { console.error('[Lifecycle]', e); }
        }
    }
}
