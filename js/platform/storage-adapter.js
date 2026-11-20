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

/** 微信小游戏: wx.getStorageSync / wx.setStorageSync (V12 新增, 结构对齐 TtStorageAdapter) */
class WxStorageAdapter {
    constructor(wxApi) {
        this._wx = wxApi;
        this._fallback = new MemoryStorageAdapter();
    }
    get(key, defaultValue) {
        try {
            var raw = this._wx.getStorageSync(key);
            if (raw === '' || raw === undefined || raw === null) return defaultValue;
            // wx 存储原样存取字符串; 兼容直接存对象的历史数据
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
            this._wx.setStorageSync(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return this._fallback.set(key, value);
        }
    }
    remove(key) {
        try { this._wx.removeStorageSync(key); } catch (e) {}
        this._fallback.remove(key);
    }
    keys() {
        try {
            var info = this._wx.getStorageInfoSync();
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
        // V12: 主键损坏标记键(损坏旧档保留现场, 便于诊断, 不静默覆盖)
        this.CORRUPT_SUFFIX = '.corrupt';
    }
    _k(key) { return this.PREFIX + key; }
    /**
     * V12: 带备份的写入 — 每次写主键同时镜像 .bak, 读损坏时回退上一份好数据。
     * 仅对关键存档启用(开销: 双份存储); 普通设置键走普通 get/set。
     */
    setSafe(key, value) {
        var okMain = false, okBak = false;
        try { okMain = this._adapter.set(this._k(key), value); } catch (e) {}
        try { okBak = this._adapter.set(this._k(key) + '.bak', value); } catch (e) {}
        return okMain && okBak;
    }
    /**
     * V12: 带备份的读取 — 主键 JSON 损坏时回退 .bak(上一份好数据)并修复主键;
     * 两份都损坏时保留现场(.corrupt 镜像), 返回 defaultValue, 不静默清零旧档。
     */
    getSafe(key, defaultValue) {
        var main = this._readValid(this._k(key));
        if (main.valid) return main.value;
        var bak = this._readValid(this._k(key) + '.bak');
        if (bak.valid) {
            // 主档损坏但备份完好: 用备份修复主档
            try { this._adapter.set(this._k(key), bak.raw); } catch (e) {}
            return bak.value;
        }
        // 双份都损坏: 保留损坏现场供诊断(仅首次), 不覆盖
        if (main.raw !== null || bak.raw !== null) {
            var markKey = this._k(key) + this.CORRUPT_SUFFIX;
            var already = this._adapter.get(markKey, null);
            if (!already) {
                try {
                    this._adapter.set(markKey, {
                        at: (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0,
                        main: main.raw, bak: bak.raw
                    });
                } catch (e) {}
            }
        }
        return defaultValue;
    }
    /** 读原始串并校验 JSON; 返回 {valid, value, raw} */
    _readValid(fullKey) {
        var raw = null;
        try { raw = this._adapter.get(fullKey, null); } catch (e) { raw = null; }
        if (raw === null || raw === undefined) return { valid: false, value: null, raw: null };
        // 适配器已解析成功(对象/数字)即视为有效
        if (typeof raw === 'object' || typeof raw === 'number' || typeof raw === 'boolean') {
            return { valid: true, value: raw, raw: raw };
        }
        if (typeof raw === 'string') {
            try { return { valid: true, value: JSON.parse(raw), raw: raw }; } catch (e) {}
        }
        return { valid: false, value: null, raw: raw };
    }
    get(key, defaultValue) { return this._adapter.get(this._k(key), defaultValue); }
    set(key, value) { return this._adapter.set(this._k(key), value); }
    remove(key) {
        this._adapter.remove(this._k(key));
        this._adapter.remove(this._k(key) + '.bak');
        this._adapter.remove(this._k(key) + this.CORRUPT_SUFFIX);
    }
    keys() {
        var all = this._adapter.keys();
        var out = [];
        for (var i = 0; i < all.length; i++) {
            if (all[i].indexOf(this.PREFIX) === 0) out.push(all[i].slice(this.PREFIX.length));
        }
        return out;
    }
    /**
     * V12: 旧版裸 localStorage 键兼容读(h5 上历史键无前缀)。
     * 优先读命名空间键, 缺失再读裸键; 微信等新端无裸键直接走默认值。
     */
    getLegacy(key, defaultValue) {
        var v = this.get(key, undefined);
        if (v !== undefined && v !== null) return v;
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                var raw = window.localStorage.getItem(key);
                if (raw !== null && raw !== undefined) return raw;
            } catch (e) {}
        }
        return defaultValue;
    }
    /** V12: 写设置键(命名空间)并清理 h5 旧裸键, 保证单一数据源 */
    setLegacy(key, value) {
        this.set(key, String(value));
        if (typeof window !== 'undefined' && window.localStorage) {
            try { window.localStorage.removeItem(key); } catch (e) {}
        }
    }
}
