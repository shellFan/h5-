// ===== 平台适配门面 (Phase 5) =====
// 运行时检测 H5 / 抖音小游戏 / 微信小游戏(预留), 装配各适配器
// 全局单例 Platform; 生产代码只依赖 Platform.*, 不直接触碰 window/tt/wx

/**
 * 平台检测:
 * - 抖音小游戏提供全局 tt 对象 (getSystemInfoSync/appId等)
 * - 微信小游戏提供全局 wx 对象
 * - 其余为浏览器H5
 */
function detectPlatform() {
    try {
        if (typeof tt !== 'undefined' && tt.getSystemInfoSync) return 'douyin';
        if (typeof wx !== 'undefined' && wx.getSystemInfoSync) return 'wechat';
    } catch (e) {}
    return 'h5';
}

class PlatformAdapter {
    constructor() {
        this.id = detectPlatform();
        this.tt = (this.id === 'douyin') ? tt : null;
        this.wx = (this.id === 'wechat') ? wx : null;

        // 存储适配器
        if (this.id === 'douyin') this.storageAdapter = new TtStorageAdapter(this.tt);
        else if (this.id === 'h5') this.storageAdapter = new LocalStorageAdapter();
        else this.storageAdapter = new MemoryStorageAdapter();
        this.storage = new GameStorage(this.storageAdapter);

        // 生命周期
        this.lifecycle = new LifecycleAdapter();
        // 音频
        this.audio = new AudioAdapter(this.storage);
        // 分享
        this.share = new ShareAdapter(this.id);
        // 广告服务(Phase 4): 由 ads/ad-service.js 装配
        this.ads = null;

        // 系统信息(屏幕/DPR/安全区)
        this.sysInfo = this._readSysInfo();
    }

    _readSysInfo() {
        var info = {
            platform: this.id,
            pixelRatio: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
            screenWidth: (typeof window !== 'undefined' && window.innerWidth) || 390,
            screenHeight: (typeof window !== 'undefined' && window.innerHeight) || 844,
            statusBarHeight: 0,
            safeArea: null
        };
        if (this.id === 'douyin' && this.tt.getSystemInfoSync) {
            try {
                var s = this.tt.getSystemInfoSync();
                info.pixelRatio = s.pixelRatio || info.pixelRatio;
                info.screenWidth = s.screenWidth || info.screenWidth;
                info.screenHeight = s.screenHeight || info.screenHeight;
                info.statusBarHeight = s.statusBarHeight || 0;
                info.safeArea = s.safeArea || null;
            } catch (e) {}
        }
        return info;
    }

    /** 初始化(绑定生命周期等); 在游戏启动时调用一次 */
    initialize() {
        if (this.id === 'douyin') {
            this.lifecycle.bindTt(this.tt);
        } else {
            this.lifecycle.bind();
        }
        // 显示/隐藏时暂停/恢复音频上下文
        var self = this;
        this.lifecycle.on('show', function() { self.audio.resume(); });
    }

    /** 是否小游戏环境(无完整DOM) */
    isMiniGame() { return this.id !== 'h5'; }
}

// 全局单例
var Platform = new PlatformAdapter();
