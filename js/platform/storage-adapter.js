// ===== 存储适配器 (Phase 5 平台抽象层) =====
// 统一 localStorage / tt.getStorageSync / 内存兜底
// 接口: get(key, defaultValue) / set(key, value) / remove(key) / keys()

/** 内存存储兜底(隐私模式/无存储环境) */
class MemoryStorageAdapter {
    constructor() {
        this._map = {};
    }
    get(key, defaultValue) {
        var raw = this._map[key];
        if (raw === undefined) return defaultValue;
        try { return JSON.parse(raw); } catch (e) { return defaultValue; }
    }
    set(key, value) {
        try { this._map[key] = JSON.stringify(value); return true; } catch (e) { return false; }
    }
    remove(key) { delete this._map[key]; }
    keys() { return Object.keys(this._map); }
}

/** H5: window.localStorage */
class LocalStorageAdapter {
    constructor() {
        // 构造时探测可用性(隐私模式可能抛异常)
        this._available = false;
        try {
            var probe = '__pz_probe__';
            window.localStorage.setItem(probe, '1');
            window.localStorage.removeItem(probe);
            this._available = true;
        } catch (e) {
            this._available = false;
        }
        this._fallback = new MemoryStorageAdapter();
    }
    get(key, defaultValue) {
        if (!this._available) return this._fallback.get(key, defaultValue);
        try {
            var raw = window.localStorage.getItem(key);
            if (raw === null || raw === undefined) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            return defaultValue;
        }
    }
    set(key, value) {
        if (!this._available) return this._fallback.set(key, value);
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            // 写满/被拒: 降级内存
            return this._fallback.set(key, value);
        }
    }
    remove(key) {
        if (this._available) { try { window.localStorage.removeItem(key); } catch (e) {} }
        this._fallback.remove(key);
    }
    keys() {
        if (!this._available) return this._fallback.keys();
        var out = [];
        try {
            for (var i = 0; i < window.localStorage.length; i++) {
                out.push(window.localStorage.key(i));
            }
        } catch (e) {}
        return out;
    }
}

/** 抖音小游戏: tt.getStorageSync / tt.setStorageSync */
class TtStorageAdapter {
    constructor(ttApi) {
        this._tt = ttApi;
        this._fallback = new MemoryStorageAdapter();
    }
    get(key, defaultValue) {
        try {
            var raw = this._tt.getStorageSync(key);
            if (raw === '' || raw === undefined || raw === null) return defaultValue;
            // tt 存储原样存取字符串; 兼容直接存对象的历史数据
            if (typeof raw === 'string') {
                try { return JSON.parse(raw); } catch (e) { return raw; }
            }
            return raw;
        } catch (e) {
            return this._fallback.get(key, defaultValue);
        }
    }
    set(key, value) {
        try {
            this._tt.setStorageSync(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return this._fallback.set(key, value);
        }
    }
    remove(key) {
        try { this._tt.removeStorageSync(key); } catch (e) {}
        this._fallback.remove(key);
    }
    keys() {
        try {
            var info = this._tt.getStorageInfoSync();
            return (info && info.keys) || [];
        } catch (e) {
            return this._fallback.keys();
        }
    }
}

/** 存储命名空间封装: 所有游戏键加前缀, 防冲突 */
class GameStorage {
    constructor(adapter) {
        this._adapter = adapter || new MemoryStorageAdapter();
        this.PREFIX = 'pz_squad_';
    }
    _k(key) { return this.PREFIX + key; }
    get(key, defaultValue) { return this._adapter.get(this._k(key), defaultValue); }
    set(key, value) { return this._adapter.set(this._k(key), value); }
    remove(key) { return this._adapter.remove(this._k(key)); }
    keys() {
        var all = this._adapter.keys();
        var out = [];
        for (var i = 0; i < all.length; i++) {
            if (all[i].indexOf(this.PREFIX) === 0) out.push(all[i].slice(this.PREFIX.length));
        }
        return out;
    }
}
