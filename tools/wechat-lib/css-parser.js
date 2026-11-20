/* ==================================================================
 * 微信小游戏 minidom UI 引擎 — 模块2: CSS 解析/匹配/级联引擎
 * 支持子集(按本项目 4 个 CSS 文件的实际用量裁剪, 1054 条声明 / 88 种属性):
 *   选择器: tag/#id/.class/后代/子代/逗号分组/:active(单独通道)
 *   @media: max/min-width/height, orientation (运行时按视口求值)
 *   @keyframes: 收集供动画插值(transform/opacity)
 *   值: 长度(px/%/vh/vw/dvh/em/rem/calc/clamp/env), 颜色(hex/rgb/rgba/命名/transparent/currentColor),
 *       linear-gradient/radial-gradient, box-shadow(含inset近似), border/margin/padding/flex/border-radius/
 *       background 简写展开, CSS 变量(var(--x)), transform 函数族, text-shadow, ellipsis
 * 不支持(降级为忽略): grid(仅1处→用2列退化实现), filter/mix-blend-mode/backdrop-filter/
 *   transition(静态终态), ::before/::after(仅4处装饰, 忽略), 伪类:hover等
 * ================================================================== */
(function (root) {
    'use strict';

    /* ---------------- 基础值工具 ---------------- */

    var NAMED_COLORS = {
        transparent: [0, 0, 0, 0], white: [255, 255, 255, 255], black: [0, 0, 0, 255],
        red: [255, 0, 0, 255], green: [0, 128, 0, 255], blue: [0, 0, 255, 255],
        yellow: [255, 255, 0, 255], orange: [255, 165, 0, 255], gold: [255, 215, 0, 255],
        gray: [128, 128, 128, 255], grey: [128, 128, 128, 255], silver: [192, 192, 192, 255],
        cyan: [0, 255, 255, 255], aqua: [0, 255, 255, 255], navy: [0, 0, 128, 255],
        lime: [0, 255, 0, 255], crimson: [220, 20, 60, 255], deeppink: [255, 20, 147, 255],
        skyblue: [135, 206, 235, 255], lightblue: [173, 216, 230, 255], lightgreen: [144, 238, 144, 255],
        darkred: [139, 0, 0, 255], darkblue: [0, 0, 139, 255], darkgray: [169, 169, 169, 255],
        darkgreen: [0, 100, 0, 255], purple: [128, 0, 128, 255], violet: [238, 130, 238, 255],
        teal: [0, 128, 128, 255], pink: [255, 192, 203, 255], whiteSmoke: [245, 245, 245, 255]
    };

    function clamp255(v) { return Math.max(0, Math.min(255, Math.round(v))); }

    /** 解析颜色 → [r,g,b,a] (0-255), 失败返回 null */
    function parseColor(str) {
        if (str === null || str === undefined) return null;
        str = String(str).trim();
        if (!str) return null;
        var lower = str.toLowerCase();
        if (lower === 'currentcolor') return 'currentColor';
        if (NAMED_COLORS[lower]) return NAMED_COLORS[lower].slice();
        if (lower === 'none' || lower === 'initial') return null;
        if (str.charAt(0) === '#') {
            var hex = str.slice(1);
            if (hex.length === 3 || hex.length === 4) {
                var r = parseInt(hex[0] + hex[0], 16), g = parseInt(hex[1] + hex[1], 16), b = parseInt(hex[2] + hex[2], 16);
                var a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) : 255;
                return [r, g, b, a];
            }
            if (hex.length === 6 || hex.length === 8) {
                return [
                    parseInt(hex.slice(0, 2), 16),
                    parseInt(hex.slice(2, 4), 16),
                    parseInt(hex.slice(4, 6), 16),
                    hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255
                ];
            }
            return null;
        }
        var m = str.match(/^rgba?\(([^)]+)\)$/i);
        if (m) {
            var parts = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number);
            if (parts.length >= 3) {
                var alpha = parts.length >= 4 ? parts[3] : 1;
                if (alpha <= 1) alpha = Math.round(alpha * 255);
                return [clamp255(parts[0]), clamp255(parts[1]), clamp255(parts[2]), clamp255(alpha)];
            }
        }
        var hsl = str.match(/^hsla?\(([^)]+)\)$/i);
        if (hsl) {
            var hp = hsl[1].split(/[,\s\/]+/).filter(Boolean).map(Number);
            return hslToRgb(hp[0], hp[1] / 100, hp[2] / 100, hp.length > 3 ? hp[3] : 1);
        }
        return null;
    }

    function hslToRgb(h, s, l, a) {
        h = ((h % 360) + 360) % 360 / 360;
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        var f = function (t) {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        return [clamp255(f(h + 1 / 3) * 255), clamp255(f(h) * 255), clamp255(f(h - 1 / 3) * 255), clamp255((a <= 1 ? a * 255 : a))];
    }

    function rgbaCss(c) {
        if (!c || c === 'currentColor') return c || null;
        return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + ((c[3] === undefined ? 255 : c[3]) / 255).toFixed(3) + ')';
    }

    /** 括号感知的顶层逗号切分 */
    function splitTop(str, sep) {
        var out = [], depth = 0, cur = '';
        for (var i = 0; i < str.length; i++) {
            var ch = str[i];
            if (ch === '(') depth++;
            else if (ch === ')') depth--;
            if (ch === sep && depth === 0) { out.push(cur.trim()); cur = ''; }
            else cur += ch;
        }
        if (cur.trim()) out.push(cur.trim());
        return out;
    }

    /* ---------------- 长度解析 ---------------- */

    /**
     * 解析长度值 → px 数字; 无法解析返回 undefined(调用方走 auto 逻辑)
     * ctx: {parentW, parentH, viewportW, viewportH, fontSize, rootFontSize, safeArea}
     */
    function resolveLen(v, ctx) {
        if (v === null || v === undefined) return undefined;
        v = String(v).trim();
        if (v === '' || v === 'auto' || v === 'none' || v === 'normal' || v === '0' || v === 'inherit') {
            return v === '0' ? 0 : undefined;
        }
        var num = parseFloat(v);
        if (isNaN(num)) return undefined;
        if (/^-?[\d.]+$/.test(v)) return num; // 纯数字(0或无单位)
        var m = v.match(/^(-?[\d.]+)(px|vh|vw|dvh|em|rem|%|rpx)$/);
        if (!m) {
            // calc()/clamp()/env() 在 computeStyle 阶段已展开; 到这里仍复杂则放弃
            return undefined;
        }
        var val = parseFloat(m[1]), unit = m[2];
        switch (unit) {
            case 'px': return val;
            case '%':
                if (ctx.parentW !== undefined && ctx.parentW !== null) return ctx.parentW * val / 100;
                return undefined;
            case 'vh': case 'dvh': return ctx.viewportH * val / 100;
            case 'vw': return ctx.viewportW * val / 100;
            case 'em': return (ctx.fontSize || 16) * val;
            case 'rem': return (ctx.rootFontSize || 16) * val;
            case 'rpx': return ctx.viewportW * val / 750; // 小程序习惯单位兜底
        }
        return undefined;
    }

    /** calc(a ± b) 与 clamp(min, val, max) 展开(两层内) */
    function expandCalc(v, ctx) {
        var s = String(v).trim();
        var guard = 0;
        while (guard++ < 4) {
            var calcM = s.match(/calc\(([^()]+)\)/);
            if (calcM) {
                var expr = calcM[1];
                // 全部转成 px 数值再算
                var tokenRe = /(-?[\d.]+(?:px|%|vh|vw|dvh|em|rem)?)/g;
                var numRe = /^-?[\d.]+$/;
                var total = 0, op = '+', found = false;
                var rest = expr.replace(/([+\-])\s+/g, '$1').split(/([+\-])/);
                for (var i = 0; i < rest.length; i++) {
                    var tk = rest[i].trim();
                    if (tk === '+' || tk === '-') { op = tk; continue; }
                    if (!tk) continue;
                    if (numRe.test(tk)) { var n0 = parseFloat(tk); total = op === '+' ? total + n0 : total - n0; found = true; continue; }
                    var n = resolveLen(tk, ctx);
                    if (n === undefined) return s; // 含 % 等需上下文 — 原样返回(layout 再试)
                    total = op === '+' ? total + n : total - n;
                    found = true;
                }
                if (found) { s = s.replace(calcM[0], String(total) + 'px'); continue; }
                return s;
            }
            var clampM = s.match(/clamp\(([^()]+)\)/);
            if (clampM) {
                var args = clampM[1].split(',').map(function (x) { return x.trim(); });
                if (args.length === 3) {
                    var mn = resolveLen(expandCalc(args[0], ctx), ctx);
                    var val = resolveLen(expandCalc(args[1], ctx), ctx);
                    var mx = resolveLen(expandCalc(args[2], ctx), ctx);
                    if (mn !== undefined && val !== undefined && mx !== undefined) {
                        var c = Math.max(mn, Math.min(val, mx));
                        s = s.replace(clampM[0], String(c) + 'px');
                        continue;
                    }
                }
                return s;
            }
            var envM = s.match(/env\(safe-area-inset-(top|bottom|left|right)\)/);
            if (envM) {
                var sa = (ctx.safeArea || {});
                s = s.replace(envM[0], String(sa[envM[1]] || 0) + 'px');
                continue;
            }
            break;
        }
        return s;
    }

    /** var(--x) 替换(最多两层) */
    function substituteVars(v, vars) {
        var s = String(v), guard = 0;
        while (s.indexOf('var(') !== -1 && guard++ < 4) {
            var replaced = s.replace(/var\(--([\w-]+)(?:\s*,\s*([^()]+))?\)/g, function (m, name, fb) {
                if (vars && vars['--' + name] !== undefined) return vars['--' + name];
                return fb !== undefined ? fb.trim() : '';
            });
            if (replaced === s) break;
            s = replaced;
        }
        return s;
    }

    /* ---------------- 样式表解析 ---------------- */

    function stripComments(css) {
        return css.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    /** 解析选择器组 → [parts...] ; parts = [compound...], compound={tag,id,classes,pseudo} */
    function parseSelectorGroup(sel) {
        var groups = splitTop(sel, ',');
        var out = [];
        for (var i = 0; i < groups.length; i++) {
            var g = groups[i].trim();
            if (!g) continue;
            var toks = g.replace(/\s*>\s*/g, ' > ').split(/\s+/).filter(Boolean);
            var parts = [], compound = null;
            for (var t = 0; t < toks.length; t++) {
                var tk = toks[t];
                if (tk === '>') { parts.push({ comb: '>' }); continue; }
                compound = { tag: null, id: null, classes: [], pseudos: [] };
                // V12修复: tag 可省(#id/.class 开头的选择器此前整组被丢弃)
                var m2 = tk.match(/^([a-zA-Z][\w-]*|\*)?((:[\w-]+)|[#.][\w-]+)*$/);
                if (!m2) return null; // 不支持的选择器 → 整组丢弃
                var first = tk.match(/^([a-zA-Z][\w-]*|\*)/);
                if (first) compound.tag = first[1] === '*' ? '*' : first[1].toLowerCase();
                var attrRe = /([#.]):?([\w-]+)/g, am;
                while ((am = attrRe.exec(tk)) !== null) {
                    if (am[1] === '#') compound.id = am[2];
                    else compound.classes.push(am[2]);
                }
                var psRe = /:([\w-]+)/g, pm;
                while ((pm = psRe.exec(tk)) !== null) {
                    if (pm[1] !== 'active' && pm[1] !== 'hover' && pm[1] !== 'focus') compound.pseudos.push(pm[1]);
                }
                parts.push(compound);
            }
            if (parts.length) out.push(parts);
        }
        return out;
    }

    function compoundMatches(cp, el) {
        if (cp.tag && cp.tag !== '*' && el.tag !== cp.tag) return false;
        if (cp.id && el.id !== cp.id) return false;
        for (var i = 0; i < cp.classes.length; i++) {
            if (!el.classList || el.classList.indexOf(cp.classes[i]) === -1) return false;
        }
        return true;
    }

    function partsMatch(parts, el) {
        // 从右往左
        var node = el, idx = parts.length - 1;
        while (idx >= 0) {
            var cp = parts[idx];
            if (cp.comb !== undefined) { idx--; continue; }
            if (!node) return false; // V12: 祖先链走到头(容错)
            if (!compoundMatches(cp, node)) return false;
            // 向左找下一个 compound
            var left = idx - 1;
            while (left >= 0 && parts[left].comb !== undefined) left--;
            if (left < 0) return true;
            var comb = parts[left + 1].comb;
            if (comb === '>') {
                node = node.parent;
                idx = left;
            } else {
                // 后代: 沿祖先链找任意匹配
                var anc = node.parent;
                var matched = false;
                while (anc) {
                    if (compoundMatches(parts[left], anc)) { matched = true; break; }
                    anc = anc.parent;
                }
                if (!matched) return false;
                node = anc;
                idx = left;
            }
        }
        return true;
    }

    function specificityOf(parts) {
        var ids = 0, cls = 0, tags = 0;
        for (var i = 0; i < parts.length; i++) {
            var cp = parts[i];
            if (cp.comb !== undefined) continue;
            if (cp.id) ids++;
            cls += cp.classes.length + cp.pseudos.length;
            if (cp.tag && cp.tag !== '*') tags++;
        }
        return [ids, cls, tags];
    }

    /** 声明串 → [[prop, value, important]] */
    function parseDecls(body) {
        var decls = [];
        var segs = splitTop(body, ';');
        for (var i = 0; i < segs.length; i++) {
            var d = segs[i];
            if (!d) continue;
            var ci = d.indexOf(':');
            if (ci === -1) continue;
            var prop = d.slice(0, ci).trim().toLowerCase();
            var val = d.slice(ci + 1).trim();
            var imp = false;
            if (/!\s*important$/i.test(val)) { imp = true; val = val.replace(/!\s*important$/i, '').trim(); }
            if (prop) decls.push([prop, val, imp]);
        }
        return decls;
    }

    /**
     * 解析多张样式表 → engine
     * mediaCtx: {width, height} 运行时视口(立即求值 @media)
     */
    function parseStylesheets(texts, mediaCtx) {
        var rules = [];      // {selectors:[[parts]], decls, spec, order, active:bool}
        var keyframes = {};  // name → [{offset, decls}]
        var varDecls = [];   // 含自定义属性的规则(收集 :root 级变量)
        var order = 0;

        function mediaMatch(cond) {
            if (!cond) return true;
            var ctx = mediaCtx || { width: 390, height: 844 };
            var segs = cond.split(/\s+and\s+/i);
            for (var i = 0; i < segs.length; i++) {
                var s = segs[i].trim().replace(/^\(|\)$/g, '').trim();
                var landscape = /orientation\s*:\s*landscape/i.test(s);
                var portrait = /orientation\s*:\s*portrait/i.test(s);
                if (landscape) { if (ctx.width < ctx.height) return false; continue; }
                if (portrait) { if (ctx.width >= ctx.height) return false; continue; }
                if (/prefers-reduced-motion/i.test(s)) return false; // 允许动画
                var m = s.match(/^(max-width|max-height|min-width|min-height)\s*:\s*([\d.]+)(px)?$/i);
                if (m) {
                    var v = parseFloat(m[2]);
                    if (m[1] === 'max-width' && ctx.width > v) return false;
                    if (m[1] === 'min-width' && ctx.width < v) return false;
                    if (m[1] === 'max-height' && ctx.height > v) return false;
                    if (m[1] === 'min-height' && ctx.height < v) return false;
                }
            }
            return true;
        }

        function parseBlock(text, mediaOk) {
            var i = 0, len = text.length;
            while (i < len) {
                var brace = text.indexOf('{', i);
                if (brace === -1) break;
                var header = text.slice(i, brace).trim();
                // 找配对右括号
                var depth = 1, j = brace + 1;
                while (j < len && depth > 0) {
                    if (text[j] === '{') depth++;
                    else if (text[j] === '}') depth--;
                    j++;
                }
                var body = text.slice(brace + 1, j - 1);
                i = j;
                if (header.charAt(0) === '@') {
                    var at = header.slice(1).split(/\s+/)[0].toLowerCase();
                    if (at === 'media') {
                        var cond = header.slice(5).trim();
                        parseBlock(body, mediaOk && mediaMatch(cond));
                    } else if (at === 'supports') {
                        parseBlock(body, mediaOk);
                    } else if (at === 'keyframes' || at === '-webkit-keyframes') {
                        var kfName = header.slice(header.indexOf(' ') + 1).trim();
                        var frames = [];
                        var ki = 0;
                        while (ki < body.length) {
                            var kb = body.indexOf('{', ki);
                            if (kb === -1) break;
                            var kd = 1, kj = kb + 1;
                            while (kj < body.length && kd > 0) {
                                if (body[kj] === '{') kd++; else if (body[kj] === '}') kd--;
                                kj++;
                            }
                            var stops = body.slice(ki, kb).trim().split(',').map(function (x) { return x.trim(); });
                            var frame = { offsets: stops, decls: parseDecls(body.slice(kb + 1, kj - 1)) };
                            frames.push(frame);
                            ki = kj;
                        }
                        keyframes[kfName] = frames;
                    }
                    // @font-face/@import/@charset → 忽略
                    continue;
                }
                var selGroup = parseSelectorGroup(header);
                if (!selGroup || !selGroup.length) continue;
                var decls = parseDecls(body);
                if (!decls.length) continue;
                for (var g = 0; g < selGroup.length; g++) {
                    var parts = selGroup[g];
                    var hasActive = false;
                    for (var pi = 0; pi < parts.length; pi++) {
                        if (parts[pi].classes && parts[pi].classes.indexOf('active') !== -1) hasActive = false;
                    }
                    // :active → 活跃态规则单独标记
                    var isActiveRule = /:active/.test(header);
                    rules.push({
                        parts: parts,
                        decls: decls,
                        spec: specificityOf(parts),
                        order: order++,
                        mediaOk: mediaOk,
                        active: isActiveRule
                    });
                    // 收集自定义属性
                    for (var di = 0; di < decls.length; di++) {
                        if (decls[di][0].charAt(0) === '-') { varDecls.push({ parts: parts, prop: decls[di][0], value: decls[di][1] }); }
                    }
                }
            }
        }

        for (var t = 0; t < texts.length; t++) parseBlock(stripComments(texts[t] || ''), true);

        var engine = {
            rules: rules,
            keyframes: keyframes,
            vars: {},
            _varDecls: varDecls
        };
        // 全局变量表: 匹配 :root / #game-container.v42-ui 的规则中的 --x
        var varHost = { tag: 'html', id: '', classList: [], parent: null };
        for (var v = 0; v < varDecls.length; v++) {
            var vd = varDecls[v];
            if (vd.parts.length === 1 && compoundMatches(vd.parts[0], varHost)) {
                engine.vars[vd.prop] = vd.value;
            }
        }
        var containerHost = { tag: 'div', id: 'game-container', classList: ['v42-ui'], parent: null };
        for (var v2 = 0; v2 < varDecls.length; v2++) {
            var vd2 = varDecls[v2];
            if (vd2.parts.length >= 1 && partsMatch(vd2.parts, containerHost)) {
                engine.vars[vd2.prop] = vd2.value;
            }
        }
        return engine;
    }

    /* ---------------- 级联计算 ---------------- */

    var INHERITED = {
        color: 1, 'font-size': 1, 'font-weight': 1, 'font-style': 1, 'font-family': 1,
        'letter-spacing': 1, 'line-height': 1, 'text-align': 1, 'text-shadow': 1,
        'white-space': 1, 'text-transform': 1, visibility: 1
    };

    var DEFAULTS = {
        display: 'block', position: 'static', overflow: 'visible', 'z-index': 'auto', opacity: '1',
        top: 'auto', right: 'auto', bottom: 'auto', left: 'auto',
        width: 'auto', height: 'auto', 'min-width': '0', 'min-height': '0', 'max-width': 'none', 'max-height': 'none',
        'margin-top': '0', 'margin-right': '0', 'margin-bottom': '0', 'margin-left': '0',
        'padding-top': '0', 'padding-right': '0', 'padding-bottom': '0', 'padding-left': '0',
        'border-width': '0', 'border-style': 'none', 'border-color': 'rgba(0,0,0,0)',
        'border-top-width': '0', 'border-right-width': '0', 'border-bottom-width': '0', 'border-left-width': '0',
        'border-radius': '0', background: 'rgba(0,0,0,0)', 'background-color': 'rgba(0,0,0,0)',
        color: '#000000', 'font-size': '16px', 'font-weight': 'normal', 'font-style': 'normal',
        'font-family': 'sans-serif', 'letter-spacing': '0px', 'line-height': 'normal',
        'text-align': 'left', 'text-shadow': 'none', 'white-space': 'normal', 'text-overflow': 'clip',
        'text-transform': 'none',
        gap: '0', 'row-gap': '0', 'column-gap': '0',
        'flex-direction': 'row', 'flex-wrap': 'nowrap', 'justify-content': 'flex-start',
        'align-items': 'stretch', 'align-self': 'auto',
        'flex-grow': '0', 'flex-shrink': '1', 'flex-basis': 'auto',
        transform: 'none', 'transform-origin': '50% 50%',
        'pointer-events': 'auto', 'box-sizing': 'border-box',
        'animation-name': 'none', 'animation-duration': '0s', 'animation-iteration-count': '1',
        'animation-fill-mode': 'none', 'animation-delay': '0s',
        'box-shadow': 'none', 'vertical-align': 'middle', 'user-select': 'none',
        'border-color': 'rgba(0,0,0,0)', cursor: 'auto'
    };

    function expandShorthands(decls) {
        // 简写展开成全属性(按 CSS 级联顺序保持)
        var out = [];
        function fourWay(val) {
            var p = splitTop(val, ' ');
            if (p.length === 1) return [p[0], p[0], p[0], p[0]];
            if (p.length === 2) return [p[0], p[1], p[0], p[1]];
            if (p.length === 3) return [p[0], p[1], p[2], p[1]];
            return [p[0], p[1], p[2], p[3]];
        }
        function radiusWay(val) {
            var p = splitTop(val, ' ');
            if (p.length === 1) return [p[0], p[0], p[0], p[0]];
            if (p.length === 2) return [p[0], p[1], p[0], p[1]];
            if (p.length === 3) return [p[0], p[1], p[2], p[1]];
            return [p[0], p[1], p[2], p[3]];
        }
        for (var i = 0; i < decls.length; i++) {
            var prop = decls[i][0], val = decls[i][1], imp = decls[i][2];
            switch (prop) {
                case 'margin':
                    var mv = fourWay(val);
                    out.push(['margin-top', mv[0], imp], ['margin-right', mv[1], imp], ['margin-bottom', mv[2], imp], ['margin-left', mv[3], imp]);
                    break;
                case 'padding':
                    var pv = fourWay(val);
                    out.push(['padding-top', pv[0], imp], ['padding-right', pv[1], imp], ['padding-bottom', pv[2], imp], ['padding-left', pv[3], imp]);
                    break;
                case 'border':
                    var bp = splitTop(val, ' ');
                    var bw = '0px', bs = 'none', bc = 'currentColor';
                    for (var bi = 0; bi < bp.length; bi++) {
                        if (/^[\d.]+(px|em|rem)$/.test(bp[bi])) bw = bp[bi];
                        else if (parseColor(bp[bi])) bc = bp[bi];
                        else if (bp[bi] !== 'none') bs = bp[bi];
                    }
                    out.push(['border-width', bw, imp], ['border-style', bs, imp], ['border-color', bc, imp]);
                    break;
                case 'border-top': case 'border-bottom': case 'border-left': case 'border-right': {
                    var side = prop.split('-')[1];
                    var sbp = splitTop(val, ' ');
                    for (var si = 0; si < sbp.length; si++) {
                        if (/^[\d.]+(px|em|rem)$/.test(sbp[si])) out.push(['border-' + side + '-width', sbp[si], imp]);
                        else if (parseColor(sbp[si])) out.push(['border-' + side + '-color', sbp[si], imp]);
                        else if (sbp[si] !== 'none') out.push(['border-' + side + '-style', sbp[si], imp]);
                        else out.push(['border-' + side + '-width', '0px', imp]);
                    }
                    break;
                }
                case 'border-width':
                    var bwv = fourWay(val);
                    out.push(['border-top-width', bwv[0], imp], ['border-right-width', bwv[1], imp], ['border-bottom-width', bwv[2], imp], ['border-left-width', bwv[3], imp]);
                    break;
                case 'border-color':
                    var bcv = fourWay(val);
                    out.push(['border-top-color', bcv[0], imp], ['border-right-color', bcv[1], imp], ['border-bottom-color', bcv[2], imp], ['border-left-color', bcv[3], imp]);
                    break;
                case 'border-radius':
                    var brv = radiusWay(val);
                    out.push(['border-top-left-radius', brv[0], imp], ['border-top-right-radius', brv[1], imp], ['border-bottom-right-radius', brv[2], imp], ['border-bottom-left-radius', brv[3], imp]);
                    break;
                case 'gap':
                    var gp = splitTop(val, ' ');
                    out.push(['row-gap', gp[0], imp], ['column-gap', gp[gp.length - 1], imp]);
                    break;
                case 'flex': {
                    var fp = splitTop(val, ' ');
                    if (fp.length === 1) {
                        if (fp[0] === 'none') out.push(['flex-grow', '0', imp], ['flex-shrink', '0', imp], ['flex-basis', 'auto', imp]);
                        else if (fp[0] === 'auto') out.push(['flex-grow', '1', imp], ['flex-shrink', '1', imp], ['flex-basis', 'auto', imp]);
                        else if (fp[0] === 'initial') out.push(['flex-grow', '0', imp], ['flex-shrink', '1', imp], ['flex-basis', 'auto', imp]);
                        else out.push(['flex-grow', fp[0], imp], ['flex-shrink', '1', imp], ['flex-basis', '0%', imp]);
                    } else {
                        out.push(['flex-grow', fp[0], imp], ['flex-shrink', fp[1] || '1', imp], ['flex-basis', fp[2] || '0%', imp]);
                    }
                    break;
                }
                case 'background': {
                    var layers = splitTop(val, ',');
                    var l0 = layers[0] || 'transparent';
                    var bgDeclared = false;
                    if (/gradient\(/i.test(l0)) { out.push(['background-image', l0, imp]); bgDeclared = true; }
                    else if (/url\(/i.test(l0)) { out.push(['background-image', l0, imp]); bgDeclared = true; }
                    // V12修复: 颜色仅从非渐变层提取(渐变色标此前被误当背景色 → 全屏白青面板)
                    var colorPart = null;
                    for (var li = 0; li < layers.length; li++) {
                        if (/gradient\(|url\(/i.test(layers[li])) continue;
                        var lp = splitTop(layers[li], ' ');
                        for (var lj = 0; lj < lp.length; lj++) {
                            if (!/gradient\(|url\(/i.test(lp[lj]) && parseColor(lp[lj])) colorPart = lp[lj];
                        }
                    }
                    if (colorPart) out.push(['background-color', colorPart, imp]);
                    if (!bgDeclared && !colorPart) out.push(['background-color', l0, imp]);
                    break;
                }
                case 'overflow':
                    var ov = splitTop(val, ' ');
                    out.push(['overflow-x', ov[0], imp], ['overflow-y', ov[ov.length - 1], imp]);
                    break;
                case 'flex-flow':
                    var ff = splitTop(val, ' ');
                    for (var fi = 0; fi < ff.length; fi++) {
                        if (/row|column/.test(ff[fi])) out.push(['flex-direction', ff[fi], imp]);
                        else if (/wrap/.test(ff[fi])) out.push(['flex-wrap', ff[fi], imp]);
                    }
                    break;
                case 'animation': {
                    var ap = splitTop(val, ' ');
                    if (ap[0]) out.push(['animation-name', ap[0], imp]);
                    for (var ai = 1; ai < ap.length; ai++) {
                        if (/^[\d.]+m?s$/.test(ap[ai])) {
                            if (out.length && out[out.length - 1][0] === 'animation-delay') continue;
                            out.push(['animation-duration', ap[ai], imp]);
                        } else if (ap[ai] === 'infinite') out.push(['animation-iteration-count', 'infinite', imp]);
                        else if (/^(forwards|backwards|both)$/.test(ap[ai])) out.push(['animation-fill-mode', ap[ai], imp]);
                        else if (/^[\d.]+m?s$/.test(ap[ai]) === false && parseColor(ap[ai]) === null) {
                            if (!/linear|ease|step/.test(ap[ai])) out.push(['animation-delay', ap[ai], imp]);
                        }
                    }
                    break;
                }
                case 'font': break; // font 简写本项目未用
                default:
                    out.push([prop, val, imp]);
            }
        }
        return out;
    }

    /**
     * 计算元素样式: 匹配规则 → 级联 → 继承 → 默认值 → var 替换
     * el 需要: tag, id, classList, parent(计算用), styleInline({prop:val})
     */
    function computeStyle(el, engine) {
        var matched = [];
        var rules = engine.rules;
        for (var i = 0; i < rules.length; i++) {
            var r = rules[i];
            if (!r.mediaOk) continue;
            if (r.active) continue; // :active 走单独通道
            if (partsMatch(r.parts, el)) matched.push(r);
        }
        matched.sort(function (a, b) {
            var ia = a.decls.some(function (d) { return d[2]; }) ? 1 : 0;
            var ib = b.decls.some(function (d) { return d[2]; }) ? 1 : 0;
            if (ia !== ib) return ia - ib;
            if (a.spec[0] !== b.spec[0]) return a.spec[0] - b.spec[0];
            if (a.spec[1] !== b.spec[1]) return a.spec[1] - b.spec[1];
            if (a.spec[2] !== b.spec[2]) return a.spec[2] - b.spec[2];
            return a.order - b.order;
        });

        var declared = {};
        for (var m = 0; m < matched.length; m++) {
            var expanded = expandShorthands(matched[m].decls);
            for (var e = 0; e < expanded.length; e++) {
                declared[expanded[e][0]] = [expanded[e][1], expanded[e][2]];
            }
        }
        // 内联 style 最高(非 important)
        if (el.styleInline) {
            var inlineExpanded = expandShorthands(Object.keys(el.styleInline).map(function (k) { return [k, el.styleInline[k], false]; }));
            for (var ie = 0; ie < inlineExpanded.length; ie++) {
                declared[inlineExpanded[ie][0]] = [inlineExpanded[ie][1], false];
            }
        }
        // 运行时 style 对象(el.style.xxx = v)
        if (el._styleObj) {
            for (var k in el._styleObj) {
                var expandedK = expandShorthands([[k, el._styleObj[k], false]]);
                for (var ke = 0; ke < expandedK.length; ke++) {
                    declared[expandedK[ke][0]] = [expandedK[ke][1], false];
                }
            }
        }

        var style = {};
        // 继承 + 默认
        var parentStyle = el.parent && el.parent._style ? el.parent._style : null;
        for (var prop in DEFAULTS) {
            if (declared[prop] !== undefined) style[prop] = declared[prop][0];
            else if (INHERITED[prop] && parentStyle && parentStyle[prop] !== undefined) style[prop] = parentStyle[prop];
            else if (parentStyle && parentStyle[prop] !== undefined && DEFAULTS[prop] === undefined) style[prop] = parentStyle[prop];
            else style[prop] = DEFAULTS[prop] || '';
        }
        // 非默认表中的属性(border side color 等已展开)
        for (var p2 in declared) {
            if (style[p2] === undefined) style[p2] = declared[p2][0];
        }
        // var 替换
        for (var p3 in style) {
            if (typeof style[p3] === 'string' && style[p3].indexOf('var(') !== -1) {
                style[p3] = substituteVars(style[p3], engine.vars);
            }
        }
        // display:none 的 grid 退化
        if (style.display === 'grid') style.display = 'grid';
        return style;
    }

    /** :active 规则查找(按下反馈) */
    function findActiveStyle(el, engine) {
        var out = null;
        for (var i = 0; i < engine.rules.length; i++) {
            var r = engine.rules[i];
            if (!r.active || !r.mediaOk) continue;
            if (partsMatch(r.parts, el)) {
                if (!out) out = {};
                var expanded = expandShorthands(r.decls);
                for (var e = 0; e < expanded.length; e++) out[expanded[e][0]] = expanded[e][1];
            }
        }
        return out;
    }

    var api = {
        __defaults: DEFAULTS,
        parseStylesheets: parseStylesheets,
        computeStyle: computeStyle,
        findActiveStyle: findActiveStyle,
        parseColor: parseColor,
        rgbaCss: rgbaCss,
        resolveLen: resolveLen,
        expandCalc: expandCalc,
        substituteVars: substituteVars,
        splitTop: splitTop,
        INHERITED: INHERITED
    };
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.__MiniCSS = api;
})(typeof self !== 'undefined' ? self : this);
