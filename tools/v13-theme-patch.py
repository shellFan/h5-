# V13 主题系统补丁 — config.js 数据 + world.js 渲染
import io

def edit(p, old, new, count=1):
    s = io.open(p, encoding='utf-8').read()
    assert s.count(old) == count, (p, s.count(old), repr(old[:70]))
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(old, new))
    print('ok', p)

# 1. config.js: WORLD_THEMES 注册表(数据驱动, 10 关全覆盖)
edit('js/config.js',
    "    // 试玩强化：每关 authored wave 总量×3，并提高同屏密度。",
    """    // ===== V13: 关卡视觉主题注册表 — 天穹渐变/雾/灯光/环境染色的表现层数据 =====
    // 仅影响视觉呈现; 关卡结构/刷怪/胜负完全不受影响。LEVELS[].theme 引用此处键名。
    // sky: 穹顶渐变 4 停靠点(顶→地平线) | envTint: 环境(草地/建筑实例)染色目标 | domeTint: 穹顶乘色
    WORLD_THEMES: {
        default: {
            sky: ['#4FA3DF', '#87CEEB', '#C9E6F5', '#EAF4FA'],
            fog: 0xC9E4F2, fogNear: 45, fogFar: 130,
            sunColor: 0xFFF4E0, sunIntensity: 0.72,
            hemiSky: 0xB0DFFF, hemiGround: 0x8FBC8F, hemiIntensity: 0.5,
            envTint: 0x719C80, domeTint: 0xFFFFFF
        },
        dawn: { // L1 新兵训练 — 柔和晨光
            sky: ['#5E9FD8', '#93C4E8', '#D8E8F2', '#F2F0EA'],
            fog: 0xDCEAF2, fogNear: 45, fogFar: 128,
            sunColor: 0xFFE8C8, sunIntensity: 0.68,
            hemiSky: 0xBADCF2, hemiGround: 0x8FBC8F, hemiIntensity: 0.52,
            envTint: 0x7BA486, domeTint: 0xFFFFFF
        },
        noon: { // L2 快速尸潮 — 明快正午
            sky: ['#3E96DE', '#7FC4EE', '#CFE9F8', '#EAF6FB'],
            fog: 0xD8ECF6, fogNear: 48, fogFar: 135,
            sunColor: 0xFFFBE8, sunIntensity: 0.78,
            hemiSky: 0xBEE4FF, hemiGround: 0x94C49A, hemiIntensity: 0.5,
            envTint: 0x6FA37C, domeTint: 0xFFFFFF
        },
        overcast: { // L3 盾牌军团 — 阴云灰蓝(压抑感)
            sky: ['#5E7E9E', '#8FA9C2', '#C2D2DE', '#DDE6EC'],
            fog: 0xC2D2DE, fogNear: 38, fogFar: 118,
            sunColor: 0xE8EEF4, sunIntensity: 0.62,
            hemiSky: 0xA9BFD2, hemiGround: 0x7E9C84, hemiIntensity: 0.55,
            envTint: 0x6E8A7A, domeTint: 0xFFFFFF
        },
        sunset: { // L4 变异尸潮 — 暖橙天际
            sky: ['#7E86C2', '#D8A678', '#F2CFA0', '#F8E4C2'],
            fog: 0xE8D2B2, fogNear: 42, fogFar: 125,
            sunColor: 0xFFD9A8, sunIntensity: 0.66,
            hemiSky: 0xD2C2E8, hemiGround: 0x9C9A6E, hemiIntensity: 0.5,
            envTint: 0x9C9A6E, domeTint: 0xFFFFFF
        },
        dusk: { // L5 终局Boss — 暮色
            sky: ['#4E5E9E', '#8E7EA8', '#C8A2B2', '#E2C8C2'],
            fog: 0xD2BCC2, fogNear: 36, fogFar: 112,
            sunColor: 0xFFC8A0, sunIntensity: 0.58,
            hemiSky: 0x9EA2C8, hemiGround: 0x7E7C8E, hemiIntensity: 0.5,
            envTint: 0x6E7C8E, domeTint: 0xFFFFFF
        },
        apocalypse: { // L6/L10 末日核心 — 兼容原 APOCALYPSE_THEME 视觉值
            sky: ['#6E4050', '#8A5060', '#A86870', '#C8A0A0'],
            fog: 0x5A3040, fogNear: 30, fogFar: 95,
            sunColor: 0xFFB0A0, sunIntensity: 0.55,
            hemiSky: 0x8A6070, hemiGround: 0x2E3A30, hemiIntensity: 0.5,
            envTint: 0x3E5C43, domeTint: 0x8A5060
        },
        cave: { // L7 地下巢穴 — 深蓝绿洞穴
            sky: ['#0E2430', '#16323C', '#1E424A', '#2A545C'],
            fog: 0x142E38, fogNear: 26, fogFar: 88,
            sunColor: 0xA8D8D0, sunIntensity: 0.42,
            hemiSky: 0x2E5A5C, hemiGround: 0x1A2E28, hemiIntensity: 0.55,
            envTint: 0x4A6A5C, domeTint: 0xFFFFFF
        },
        mechanical: { // L8 机械废土 — 铁灰锈橙
            sky: ['#4E5258', '#6E7076', '#8E8C86', '#A8A096'],
            fog: 0x8E8C86, fogNear: 34, fogFar: 108,
            sunColor: 0xFFE2C0, sunIntensity: 0.6,
            hemiSky: 0x9EA2A8, hemiGround: 0x6E6E6A, hemiIntensity: 0.48,
            envTint: 0x7A7E82, domeTint: 0xFFFFFF
        },
        fortress: { // L9 最终防线 — 冷钢蓝
            sky: ['#2E4E7E', '#4E6E9E', '#7E9EC2', '#B2C8DC'],
            fog: 0x8AA2B8, fogNear: 34, fogFar: 112,
            sunColor: 0xE2F0FF, sunIntensity: 0.62,
            hemiSky: 0x7E9EC8, hemiGround: 0x4A5E72, hemiIntensity: 0.5,
            envTint: 0x5E7A8E, domeTint: 0xFFFFFF
        }
    },

    // 试玩强化：每关 authored wave 总量×3，并提高同屏密度。""")

# 2. config.js: L1-L5 补 theme 字段
for name, theme in [
    ('第 1 关 新兵训练', 'dawn'),
    ('第 2 关 快速尸潮', 'noon'),
    ('第 3 关 盾牌军团', 'overcast'),
    ('第 4 关 变异尸潮', 'sunset'),
    ('第 5 关 终局Boss', 'dusk'),
]:
    edit('js/config.js',
        "        name: '" + name + "',",
        "        name: '" + name + "',\n        theme: '" + theme + "',")

# 3. world.js: 保存半球光引用
edit('js/world.js',
    """        const hemi = new THREE.HemisphereLight(0xB0DFFF, 0x8FBC8F, 0.5);
        this.scene.add(hemi);""",
    """        const hemi = new THREE.HemisphereLight(0xB0DFFF, 0x8FBC8F, 0.5);
        this.scene.add(hemi);
        this.hemiLight = hemi; // V13: 主题系统需要调整半球光色/强度""")

# 4. world.js: _buildSky 保存画布引用
edit('js/world.js',
    """    _buildSky() {
        const cv = document.createElement('canvas');
        cv.width = 16; cv.height = 256;
        const ctx = cv.getContext('2d');""",
    """    _buildSky() {
        const cv = document.createElement('canvas');
        cv.width = 16; cv.height = 256;
        const ctx = cv.getContext('2d');
        this._skyCanvas = cv; // V13: 主题系统重绘渐变用""")

# 5. world.js: applyTheme 泛化
edit('js/world.js',
    """    /** V6.0: 关卡主题 — 末日核心等场景换装(天空/雾/灯光), 'default'还原 */
    applyTheme(themeName) {
        var T = themeName === 'apocalypse' ? CONFIG.APOCALYPSE_THEME : null;
        if (!T) {
            this.scene.background = new THREE.Color(CONFIG.COLORS.sky);
            this.scene.fog = new THREE.Fog(0xC9E4F2, 45, 130);
            if (this._skyDome) this._skyDome.material.color.setHex(0xFFFFFF);
            this.sunLight.color.setHex(0xFFF4E0);
            this.sunLight.intensity = 0.72;
            this._themeApplied = 'default';
            return;
        }
        this.scene.background = new THREE.Color(T.sky);
        this.scene.fog = new THREE.Fog(T.fog, T.fogNear, T.fogFar);
        // V12视觉: 末日主题时天空穹顶整体压暗染色(乘色), 雾色不变
        if (this._skyDome) this._skyDome.material.color.setHex(0x8A5060);
        this.sunLight.color.setHex(T.sunColor);
        this.sunLight.intensity = T.sunIntensity;
        // 环境实例材质染色(草地/路面/建筑向末日色过渡)
        if (this._v42Environment && this._v42Environment.root) {
            var mix = { done: false };
            this._v42Environment.root.traverse(function(o) {
                if (o.isInstancedMesh && o.material && o.material.color) {
                    if (o.material.__themeBaseHex === undefined) o.material.__themeBaseHex = o.material.color.getHex();
                    var base = new THREE.Color(o.material.__themeBaseHex);
                    var target = new THREE.Color(T.grass).lerp(base, 0.35);
                    o.material.color.copy(base.lerp(target, 0.55));
                    o.material.needsUpdate = true;
                }
            });
            mix.done = true;
        }
        this._themeApplied = themeName;
    }""",
    """    /** V6.0: 关卡主题 — 场景换装(天空/雾/灯光), 'default'还原
     *  V13: 泛化为 CONFIG.WORLD_THEMES 预设查表 — 10 关全覆盖(城市时段族+末日/洞穴/机械/要塞),
     *       天穹渐变按主题重绘(16x256 Canvas, 单drawCall不变), 环境实例染色目标泛化。
     *       仅表现层; 关卡结构/刷怪/胜负不受影响。'apocalypse' 保持与旧 APOCALYPSE_THEME 完全一致。 */
    applyTheme(themeName) {
        var themes = CONFIG.WORLD_THEMES || {};
        var T = themes[themeName] || themes.default;
        if (!T) return;
        if (this._skyCanvas && this._paintSky) {
            this._paintSky(T.sky);
            this.scene.background = null;
        } else {
            this.scene.background = new THREE.Color(CONFIG.COLORS.sky);
        }
        this.scene.fog = new THREE.Fog(T.fog, T.fogNear, T.fogFar);
        if (this._skyDome) this._skyDome.material.color.setHex(T.domeTint || 0xFFFFFF);
        this.sunLight.color.setHex(T.sunColor);
        this.sunLight.intensity = T.sunIntensity;
        if (this.hemiLight) {
            this.hemiLight.color.setHex(T.hemiSky);
            this.hemiLight.groundColor.setHex(T.hemiGround);
            this.hemiLight.intensity = T.hemiIntensity;
        }
        // 环境实例材质染色(草地/建筑向主题色过渡; __themeBaseHex 记录初始色, 幂等)
        if (this._v42Environment && this._v42Environment.root) {
            this._v42Environment.root.traverse(function(o) {
                if (o.isInstancedMesh && o.material && o.material.color) {
                    if (o.material.__themeBaseHex === undefined) o.material.__themeBaseHex = o.material.color.getHex();
                    var base = new THREE.Color(o.material.__themeBaseHex);
                    var target = new THREE.Color(T.envTint).lerp(base, 0.35);
                    o.material.color.copy(base.lerp(target, 0.55));
                    o.material.needsUpdate = true;
                }
            });
        }
        this._themeApplied = themeName;
    }

    /** V13: 按主题重绘天穹渐变(与 _buildSky 同规格: 4 停靠点 + 顶部太阳光晕) */
    _paintSky(stops) {
        if (!this._skyCanvas || !stops || stops.length < 4) return;
        var ctx = this._skyCanvas.getContext('2d');
        var g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0.00, stops[0]);
        g.addColorStop(0.45, stops[1]);
        g.addColorStop(0.80, stops[2]);
        g.addColorStop(1.00, stops[3]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 16, 256);
        var sun = ctx.createRadialGradient(8, 36, 2, 8, 36, 90);
        sun.addColorStop(0, 'rgba(255,246,214,0.35)');
        sun.addColorStop(1, 'rgba(255,246,214,0)');
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, 16, 256);
        if (this._skyDome && this._skyDome.material && this._skyDome.material.map) {
            this._skyDome.material.map.needsUpdate = true;
        }
    }""")

# 6. world.js: _buildSky 尾部 fog 对齐当前主题
edit('js/world.js',
    """        // 雾色向地平线色靠拢 — 远处路段/建筑自然融入天际
        if (this._themeApplied !== 'apocalypse') this.scene.fog.color.setHex(0xC9E4F2);""",
    """        // 雾色向地平线色靠拢(V13: 雾色统一由主题预设决定, 与 applyTheme 一致)
        var T0 = (CONFIG.WORLD_THEMES && (CONFIG.WORLD_THEMES[this._themeApplied || 'default'])) || CONFIG.WORLD_THEMES.default;
        this.scene.fog.color.setHex(T0.fog);""")
