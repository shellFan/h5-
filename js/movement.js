// ===== V4.0 移动手感数学 (纯逻辑, 无THREE依赖, 可单测) =====
// 设计: 连续目标位置 + 帧率无关阻尼跟随, 替代旧"30px阈值跳道"
// 所有参数来自 CONFIG.MOVE, 禁止在事件处理中写死数值

var MovementMath = {

    /** 拖动映射: 世界可玩范围横穿 = 拖过屏幕宽度 × touchSensitivity
     *  @param anchorWX   按下时小队targetX(锚点, 相对拖动不跳变)
     *  @param dxPx       本次拖动像素位移(cur - start)
     *  @param canvasWidth 画布CSS宽度(px)
     *  @param maxX       队伍中心允许的最大|X|(随阵型宽度变化)
     *  @returns 目标X(已钳制)
     */
    dragTarget: function(anchorWX, dxPx, canvasWidth, maxX) {
        var M = CONFIG.MOVE;
        var w = Math.max(1, canvasWidth || 1);
        // 每像素世界位移 = 全可玩范围 / (屏幕宽 × 灵敏度)
        var worldPerPx = (maxX * 2) / (w * M.touchSensitivity);
        var x = anchorWX + dxPx * worldPerPx;
        return this.clampCenter(x, maxX);
    },

    /** 键盘单步移动(世界单位) */
    keyTarget: function(currentX, dir, maxX) {
        var step = (CONFIG.MOVE.keyStep || 1.2) * (dir >= 0 ? 1 : -1);
        return this.clampCenter(currentX + step, maxX);
    },

    /** 队伍中心可移动边界:
     *  小人数: 路半宽 - 边距 - 队伍半宽 (全路自由移动)
     *  大人数: 优先保证"人群边缘不出路", 中心范围收窄到 路缘-人群半宽-余量,
     *          门可达性由门触发窗口随队伍宽度扩展补偿(见gates.js)
     */
    centerBounds: function(crowdHalfWidth) {
        var M = CONFIG.MOVE;
        var crowd = crowdHalfWidth || 0;
        var raw = CONFIG.ROAD_HALF_WIDTH - (M.centerMargin || 0.12) - crowd;
        if (raw >= (M.minCenterRange || 1.1)) return raw;
        // 大人数: 包络优先
        var contain = Math.max(0.1, CONFIG.ROAD_HALF_WIDTH - 0.05 - crowd);
        return Math.max(raw, Math.min(M.minCenterRange || 1.1, contain));
    },

    /** 钳制中心X到±bound */
    clampCenter: function(x, bound) {
        return Math.max(-bound, Math.min(bound, x));
    },

    /** 跟随阻尼λ: 3/λ秒后到达目标的~95% (指数阻尼帧率无关) */
    followLambda: function() {
        var t = Math.max(0.02, CONFIG.MOVE.followSmoothTime || 0.15);
        return 3 / t;
    },

    /** 门触发窗口: 门半宽 + 队伍半宽的一半(封顶0.7) — 大人数时允许人群边缘触发,
     *  但封顶保证左右门(间距4)触发区间永不重叠(死区≥0.6)
     */
    gateTriggerWindow: function(gateHalfWidth, crowdHalfWidth) {
        return gateHalfWidth + Math.min((crowdHalfWidth || 0) * 0.5, 0.7);
    }
};
