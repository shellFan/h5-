# V13 设置页: 减少动态开关(模板行 + 渲染 + 启动恢复)
import io

def edit(p, old, new, count=1):
    s = io.open(p, encoding='utf-8').read()
    assert s.count(old) == count, (p, s.count(old), repr(old[:70]))
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(old, new))
    print('ok', p)

# 1. 模板行
edit('js/ui-v60.js',
    """                    '<div class="v60-setting-row"><span>屏幕震动</span><button id="v60-set-shake" class="v60-toggle"></button></div>' +
                    '<div class="v60-saveinfo" id="v60-saveinfo"></div>' +""",
    """                    '<div class="v60-setting-row"><span>屏幕震动</span><button id="v60-set-shake" class="v60-toggle"></button></div>' +
                    '<div class="v60-setting-row"><span>减少动效</span><button id="v60-set-motion" class="v60-toggle"></button></div>' +
                    '<div class="v60-saveinfo" id="v60-saveinfo"></div>' +""")

# 2. renderSettings 渲染开关状态 + 启动恢复类
edit('js/ui-v60.js',
    """        var shakeBtn = document.getElementById('v60-set-shake');
        if (shakeBtn) shakeBtn.textContent = game.world._shakeDisabled ? '🚫 关' : '💥 开';""",
    """        var shakeBtn = document.getElementById('v60-set-shake');
        if (shakeBtn) shakeBtn.textContent = game.world._shakeDisabled ? '🚫 关' : '💥 开';
        // V13: 减少动效开关状态渲染 + 应用到根节点(H5: html; 微信: minidom body)
        var motionBtn = document.getElementById('v60-set-motion');
        var motionOn = false;
        try { motionOn = Platform.storage.get('motion_reduced', 'false') === 'true'; } catch (e) {}
        if (motionBtn) motionBtn.textContent = motionOn ? '🚫 关' : '✨ 开';
        var htmlRoot = document.documentElement;
        if (htmlRoot && htmlRoot.classList) htmlRoot.classList.toggle('v13-reduced-motion', motionOn);
        if (window.__minidom && window.__minidom.body) window.__minidom.body.classList.toggle('v13-reduced-motion', motionOn);""")

# 3. 启动恢复(install 时) — 类名即时生效, 不等进入设置页
edit('js/ui-v60.js',
    """        // 启动时恢复设置
        if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
            if (Platform.storage.getLegacy('pz_shake_off', '0') === '1') game.world._shakeDisabled = true;""",
    """        // V13: 启动恢复"减少动效"偏好
        try {
            var motionOn0 = Platform.storage.get('motion_reduced', 'false') === 'true';
            var htmlRoot0 = document.documentElement;
            if (htmlRoot0 && htmlRoot0.classList) htmlRoot0.classList.toggle('v13-reduced-motion', motionOn0);
            if (window.__minidom && window.__minidom.body) window.__minidom.body.classList.toggle('v13-reduced-motion', motionOn0);
        } catch (e) {}
        // 启动时恢复设置
        if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
            if (Platform.storage.getLegacy('pz_shake_off', '0') === '1') game.world._shakeDisabled = true;""")
