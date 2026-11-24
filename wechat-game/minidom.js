/* ==================================================================
 * 微信小游戏 minidom UI 引擎 — 模块1: 极简 HTML 解析器
 * 用途: 构建期把 index.html 转 UI DOM 树; 运行时解析 innerHTML 动态片段
 * 支持子集: 标签/属性(引号可省)/void元素/注释/实体; <script>/<style> 原文保留不展开
 * 输出节点: {type:'el', tag, attrs, children} | {type:'text', text}
 * (V12 微信小游戏移植 — H5 主工程不引用本文件)
 * ================================================================== */
(function (root) {
    'use strict';

    var VOID_TAGS = { br: 1, img: 1, input: 1, hr: 1, meta: 1, link: 1, area: 1,
        base: 1, col: 1, embed: 1, source: 1, track: 1, wbr: 1 };
    var RAW_TAGS = { script: 1, style: 1 };
    var ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®', middot: '·', mdash: '—', ndash: '–', hellip: '…', times: '×', laquo: '«', raquo: '»', star: '★' };

    function decodeEntities(s) {
        if (s.indexOf('&') === -1) return s;
        return s.replace(/&#(\d+);|&#x([0-9a-fA-F]+);|&([a-zA-Z]+);/g, function (m, dec, hex, name) {
            if (dec) return String.fromCharCode(parseInt(dec, 10));
            if (hex) return String.fromCharCode(parseInt(hex, 16));
            if (ENTITIES[name]) return ENTITIES[name];
            return m;
        });
    }

    /** 解析属性串: name="v" name='v' name=v name — 返回 {} */
    function parseAttrs(s) {
        var attrs = {};
        var re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g;
        var m;
        while ((m = re.exec(s)) !== null) {
            if (m.index >= s.length) break;
            var name = m[1];
            var val = (m[2] !== undefined) ? m[2] : (m[3] !== undefined) ? m[3] : (m[4] !== undefined) ? m[4] : '';
            attrs[name.toLowerCase()] = decodeEntities(val);
            if (re.lastIndex === m.index) re.lastIndex++; // 防御零宽匹配
        }
        return attrs;
    }

    /**
     * 解析 HTML 片段 → 节点数组
     * opts.stripTags: 需要整体丢弃的顶层标签集合(如构建期排除 script)
     */
    function parse(html, opts) {
        opts = opts || {};
        var nodes = [];
        var stack = [{ children: nodes }];
        var i = 0, len = html.length;

        function cur() { return stack[stack.length - 1]; }

        while (i < len) {
            var lt = html.indexOf('<', i);
            if (lt === -1) {
                var rest = html.slice(i);
                if (rest.trim()) cur().children.push({ type: 'text', text: decodeEntities(rest) });
                break;
            }
            if (lt > i) {
                var text = html.slice(i, lt);
                if (text.trim() || (cur().tag && !VOID_TAGS[cur().tag])) {
                    // 保留有效文本(含空白折叠后的空格文本)
                    var collapsed = text.replace(/[ \t\r\n]+/g, ' ');
                    if (collapsed.trim()) cur().children.push({ type: 'text', text: decodeEntities(collapsed) });
                }
            }
            if (html.slice(lt, lt + 4) === '<!--') {
                var ce = html.indexOf('-->', lt + 4);
                i = (ce === -1) ? len : ce + 3;
                continue;
            }
            if (html.slice(lt, lt + 2) === '</') {
                var closeEnd = html.indexOf('>', lt + 2);
                var closeTag = html.slice(lt + 2, closeEnd === -1 ? len : closeEnd).trim().toLowerCase();
                // 回退到匹配的开标签(容错: 未匹配的闭标签忽略)
                for (var d = stack.length - 1; d > 0; d--) {
                    if (stack[d].tag === closeTag) { stack.length = d; break; }
                }
                i = (closeEnd === -1) ? len : closeEnd + 1;
                continue;
            }

            // 开标签
            var gt = html.indexOf('>', lt);
            if (gt === -1) break;
            var tagBody = html.slice(lt + 1, gt);
            var selfClose = tagBody.slice(-1) === '/';
            if (selfClose) tagBody = tagBody.slice(0, -1);
            var sp = tagBody.search(/[\s/]/);
            var tag = (sp === -1 ? tagBody : tagBody.slice(0, sp)).toLowerCase();
            var attrs = parseAttrs(sp === -1 ? '' : tagBody.slice(sp + 1));
            i = gt + 1;

            if (opts.stripTags && opts.stripTags[tag]) {
                // 丢弃该标签及其全部内容(按同名闭标签定位)
                var skipEnd = html.indexOf('</' + tag, i);
                i = (skipEnd === -1) ? len : html.indexOf('>', skipEnd) + 1;
                continue;
            }

            var node = { type: 'el', tag: tag, attrs: attrs, children: [] };
            cur().children.push(node);
            if (VOID_TAGS[tag] || selfClose) continue;
            if (RAW_TAGS[tag]) {
                // 原文内容整体收进 text 节点, 不展开
                var rawEnd = html.indexOf('</' + tag, i);
                var rawClose = rawEnd === -1 ? len : rawEnd;
                var raw = html.slice(i, rawClose);
                if (raw) node.children.push({ type: 'text', text: raw });
                i = rawEnd === -1 ? len : html.indexOf('>', rawEnd) + 1;
                continue;
            }
            node.attrs.__pos = { start: i }; // 内部记录(供调试)
            stack.push(node);
        }
        return nodes;
    }

    var api = { parse: parse, decodeEntities: decodeEntities };
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.__MiniHTML = api;
})(typeof self !== 'undefined' ? self : this);


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
        while (guard++ < 6) {
            var envM = s.match(/env\(safe-area-inset-(top|bottom|left|right)(?:\s*,\s*[^)]+)?\)/);
            if (envM) {
                var sa = (ctx.safeArea || {});
                s = s.replace(envM[0], String(sa[envM[1]] || 0) + 'px');
                continue;
            }
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
                    if (!bgDeclared) out.push(['background-image', 'none', imp]);
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


/* ==================================================================
 * 微信小游戏 minidom UI 引擎 — 模块3: 运行时(DOM/布局/绘制/事件/动画)
 * 设计: 游戏代码(document.getElementById/textContent/classList/style/…)零改动运行;
 *       虚拟 DOM 树经 CSS 级联+flex布局后整体光栅化到离屏 2D canvas,
 *       由入口上传为 CanvasTexture 经正交相机叠加在 3D 场景之上。
 * 依赖: __MiniHTML(模块1) __MiniCSS(模块2) — 构建期拼接为同一作用域
 * 宿主注入(createRuntime opts): createCanvas/createImage/loadText/log
 * (V12 微信小游戏移植 — H5 主工程不引用本文件)
 * ================================================================== */
(function (root) {
    'use strict';

    var CSS = root.__MiniCSS;

    /* ==================== 工具 ==================== */

    function kebab(prop) { return prop.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); }); }

    /** 跨环境属性写入: 普通对象直写; 标准 DOM 只读属性用 defineProperty 覆盖 */
    function hardDef(obj, name, value) {
        try { obj[name] = value; return; } catch (e) {}
        try { Object.defineProperty(obj, name, { value: value, configurable: true, writable: true }); } catch (e2) {}
    }
    function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

    function rectPath(ctx, x, y, w, h, r) {
        // r: [tl,tr,br,bl]
        var tl = Math.max(0, Math.min(r[0], Math.min(w, h) / 2));
        var tr = Math.max(0, Math.min(r[1], Math.min(w, h) / 2));
        var br = Math.max(0, Math.min(r[2], Math.min(w, h) / 2));
        var bl = Math.max(0, Math.min(r[3], Math.min(w, h) / 2));
        ctx.beginPath();
        ctx.moveTo(x + tl, y);
        ctx.lineTo(x + w - tr, y);
        ctx.arcTo(x + w, y, x + w, y + tr, tr);
        ctx.lineTo(x + w, y + h - br);
        ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
        ctx.lineTo(x + bl, y + h);
        ctx.arcTo(x, y + h, x, y + h - bl, bl);
        ctx.lineTo(x, y + tl);
        ctx.arcTo(x, y, x + tl, y, tl);
        ctx.closePath();
    }

    /* ==================== 虚拟 DOM 节点 ==================== */

    var _uid = 0;
    var GLOBAL_VERSION = 1;

    function bump() { GLOBAL_VERSION++; }

    function TextNode(text) {
        this.type = 'text';
        this.text = text;
        this.parent = null;
    }

    /** DOMTokenList 门面 — 游戏代码使用 add/remove/toggle/contains/item/length/indexOf */
    function ClassList(owner) {
        this._owner = owner;
        this._arr = [];
    }
    ClassList.prototype.add = function () {
        var changed = false;
        for (var i = 0; i < arguments.length; i++) {
            var c = arguments[i];
            if (c && this._arr.indexOf(c) === -1) { this._arr.push(c); changed = true; }
        }
        if (changed) bump();
    };
    ClassList.prototype.remove = function () {
        var changed = false;
        for (var i = 0; i < arguments.length; i++) {
            var idx = this._arr.indexOf(arguments[i]);
            if (idx !== -1) { this._arr.splice(idx, 1); changed = true; }
        }
        if (changed) bump();
    };
    ClassList.prototype.toggle = function (c, force) {
        var has = this._arr.indexOf(c) !== -1;
        var want = (force === undefined) ? !has : !!force;
        if (want && !has) { this._arr.push(c); bump(); }
        else if (!want && has) { this._arr.splice(this._arr.indexOf(c), 1); bump(); }
        return want;
    };
    ClassList.prototype.contains = function (c) { return this._arr.indexOf(c) !== -1; };
    ClassList.prototype.item = function (i) { return this._arr[i] || null; };
    ClassList.prototype.indexOf = function (c) { return this._arr.indexOf(c); };
    ClassList.prototype.join = function (sep) { return this._arr.join(sep === undefined ? ' ' : sep); };
    ClassList.prototype.toString = function () { return this._arr.join(' '); };
    Object.defineProperty(ClassList.prototype, 'length', { get: function () { return this._arr.length; } });

    function VElement(tag) {
        this.type = 'el';
        this.tag = tag;
        this.id = '';
        this._classList = new ClassList(this);
        this.attrs = {};
        this.children = [];
        this.childNodes = [];
        this.parent = null;
        this.styleInline = {};   // style 属性展开
        this._styleObj = {};     // el.style.xxx 运行时写入
        this._listeners = {};
        this._uid = ++_uid;
        this._style = null;      // 计算样式缓存
        this._box = null;        // 布局结果 {x,y,w,h}
        this._hitQuad = null;
        this._scroll = null;
        this._imgState = null;   // img 加载状态
        this._svgDoc = null;
        this._animStart = null;
        this._activeApplied = false;
        this.value = '';
        this.disabled = false;
        this.scrollTop = 0;
        var self = this;
        // style 代理: 写入常见属性即标脏(未知属性由 tick 差分兜底)
        this.style = {};
        this._styleProxy = null; // 惰性创建
    }

    Object.defineProperty(VElement.prototype, 'classList', {
        get: function () { return this._classList; },
        set: function (v) {
            // 兼容内部构建路径直接赋数组/字符串
            var arr = Array.isArray(v) ? v : String(v).split(/\s+/).filter(Boolean);
            this._classList._arr = arr.filter(Boolean);
            bump();
        }
    });
    Object.defineProperty(VElement.prototype, 'className', {
        get: function () { return this._classList.toString(); },
        set: function (v) {
            this._classList._arr = String(v).split(/\s+/).filter(Boolean);
            bump();
        }
    });

    Object.defineProperty(VElement.prototype, 'firstChild', {
        get: function () { return this.childNodes[0] || null; }
    });
    Object.defineProperty(VElement.prototype, 'lastChild', {
        get: function () { return this.childNodes[this.childNodes.length - 1] || null; }
    });
    Object.defineProperty(VElement.prototype, 'parentNode', {
        get: function () { return this.parent; }
    });
    Object.defineProperty(VElement.prototype, 'nextSibling', {
        get: function () {
            if (!this.parent) return null;
            var sib = this.parent.childNodes;
            var i = sib.indexOf(this);
            return i >= 0 ? sib[i + 1] || null : null;
        }
    });
    Object.defineProperty(VElement.prototype, 'offsetWidth', {
        get: function () { return this._box ? Math.round(this._box.w) : 0; }
    });
    Object.defineProperty(VElement.prototype, 'offsetHeight', {
        get: function () { return this._box ? Math.round(this._box.h) : 0; }
    });
    Object.defineProperty(VElement.prototype, 'scrollHeight', {
        get: function () { return this._scroll ? Math.round(this._scroll.contentH) : (this._box ? Math.round(this._box.h) : 0); }
    });

    VElement.prototype._mut = function () { bump(); };

    VElement.prototype.appendChild = function (child) {
        if (!child) return child;
        if (child.parent) child.parent.removeChild(child);
        child.parent = this;
        this.childNodes.push(child);
        if (child.type === 'text') this.children.push(child);
        else this.children.push(child);
        bump();
        if (this.doc && this.doc._onTreeChange) this.doc._onTreeChange(child, 'add');
        return child;
    };
    VElement.prototype.insertBefore = function (child, ref) {
        if (!child) return child;
        if (child.parent) child.parent.removeChild(child);
        child.parent = this;
        var idx = ref ? this.childNodes.indexOf(ref) : -1;
        if (idx === -1) this.childNodes.push(child);
        else this.childNodes.splice(idx, 0, child);
        bump();
        if (this.doc && this.doc._onTreeChange) this.doc._onTreeChange(child, 'add');
        return child;
    };
    VElement.prototype.removeChild = function (child) {
        var i = this.childNodes.indexOf(child);
        if (i !== -1) this.childNodes.splice(i, 1);
        var j = this.children.indexOf(child);
        if (j !== -1) this.children.splice(j, 1);
        child.parent = null;
        bump();
        if (this.doc && this.doc._onTreeChange) this.doc._onTreeChange(child, 'remove');
        return child;
    };
    VElement.prototype.remove = function () {
        if (this.parent) this.parent.removeChild(this);
    };
    VElement.prototype.contains = function (n) {
        while (n) { if (n === this) return true; n = n.parent; }
        return false;
    };
    VElement.prototype.setAttribute = function (k, v) {
        this.attrs[k] = String(v);
        if (k === 'id') { this.id = String(v); if (this.doc) this.doc._registerId(this); }
        if (k === 'class') this.className = String(v);
        if (k === 'style') this._parseStyleAttr(String(v));
        if (k === 'src') this._setSrc(String(v));
        bump();
    };
    VElement.prototype.getAttribute = function (k) {
        if (k === 'id') return this.id;
        if (k === 'class') return this.className;
        if (k === 'style') return this._styleAttrRaw || '';
        return this.attrs[k] !== undefined ? this.attrs[k] : null;
    };
    VElement.prototype._parseStyleAttr = function (text) {
        this._styleAttrRaw = text;
        var decls = CSS.splitTop(text, ';');
        var obj = {};
        for (var i = 0; i < decls.length; i++) {
            var ci = decls[i].indexOf(':');
            if (ci === -1) continue;
            obj[decls[i].slice(0, ci).trim().toLowerCase()] = decls[i].slice(ci + 1).trim();
        }
        this.styleInline = obj;
        bump();
    };
    VElement.prototype._setSrc = function (src) { this.attrs.src = src; };

    VElement.prototype.addEventListener = function (type, fn) {
        if (!this._listeners[type]) this._listeners[type] = [];
        this._listeners[type].push(fn);
    };
    VElement.prototype.removeEventListener = function (type, fn) {
        var arr = this._listeners[type];
        if (!arr) return;
        var i = arr.indexOf(fn);
        if (i !== -1) arr.splice(i, 1);
    };
    VElement.prototype._dispatch = function (ev) {
        // 冒泡
        var node = this;
        ev.target = ev.target || this;
        while (node) {
            ev.currentTarget = node;
            var arr = node._listeners[ev.type];
            if (arr) {
                for (var i = 0; i < arr.length; i++) {
                    try { arr[i].call(node, ev); } catch (e) {
                        if (root.console) console.error('[minidom] 事件处理器异常:', e);
                    }
                }
            }
            var onClick = node.onclick;
            if (ev.type === 'click' && typeof onClick === 'function') {
                try { onClick.call(node, ev); } catch (e) {
                    if (root.console) console.error('[minidom] onclick 异常:', e);
                }
            }
            if (ev._stopped) break;
            node = node.parent;
        }
    };
    /**
     * DOM query selector subset used by the game runtime. Unlike the CSS
     * cascade parser this path returns elements, so keep a small local parser
     * but preserve the same descendant/child combinator semantics.
     */
    function parseQueryCompound(text) {
        var source = String(text || '').trim();
        if (!source) return null;
        var attrs = [];
        source = source.replace(/\[([\w-]+)(?:\s*=\s*(['"]?)([^\]'"\s]+)\2)?\]/g, function (_, name, quote, value) {
            attrs.push({ name: name, value: value === undefined ? null : value });
            return '';
        });
        var match = source.match(/^([a-zA-Z][\w-]*|\*)?((?:[#.][\w-]+)*)$/);
        if (!match) return null;
        var compound = { tag: match[1] && match[1] !== '*' ? match[1].toLowerCase() : null, id: null, classes: [], attrs: attrs };
        var partRe = /([#.])([\w-]+)/g, part;
        while ((part = partRe.exec(match[2])) !== null) {
            if (part[1] === '#') compound.id = part[2];
            else compound.classes.push(part[2]);
        }
        return compound;
    }

    function parseQueryGroup(selector) {
        var normalized = String(selector || '').trim().replace(/\s*>\s*/g, '>');
        if (!normalized) return null;
        var tokens = normalized.split(/(>|\s+)/).filter(function (token) { return token && token.trim(); });
        var parts = [], pending = ' ';
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (token === '>') { pending = '>'; continue; }
            var compound = parseQueryCompound(token);
            if (!compound) return null;
            parts.push({ compound: compound, comb: parts.length ? pending : null });
            pending = ' ';
        }
        return parts.length ? parts : null;
    }

    function parseQuerySelector(selector) {
        var groups = String(selector || '').split(','), parsed = [];
        for (var i = 0; i < groups.length; i++) {
            var group = parseQueryGroup(groups[i]);
            if (group) parsed.push(group);
        }
        return parsed;
    }

    function queryCompoundMatches(compound, element) {
        if (!compound || !element || element.type !== 'el') return false;
        if (compound.tag && element.tag !== compound.tag) return false;
        if (compound.id && element.id !== compound.id) return false;
        for (var i = 0; i < compound.classes.length; i++) {
            if (element._classList._arr.indexOf(compound.classes[i]) === -1) return false;
        }
        for (var j = 0; j < compound.attrs.length; j++) {
            var attr = compound.attrs[j];
            var actual = element.getAttribute(attr.name);
            if (actual === null) return false;
            if (attr.value !== null && String(actual) !== attr.value) return false;
        }
        return true;
    }

    function queryGroupMatches(parts, element) {
        var index = parts.length - 1;
        var node = element;
        if (!queryCompoundMatches(parts[index].compound, node)) return false;
        while (index > 0) {
            var relation = parts[index].comb;
            index--;
            if (relation === '>') {
                node = node.parent;
                if (!queryCompoundMatches(parts[index].compound, node)) return false;
            } else {
                node = node.parent;
                while (node && !queryCompoundMatches(parts[index].compound, node)) node = node.parent;
                if (!node) return false;
            }
        }
        return true;
    }

    VElement.prototype._matchesSimple = function (sel) {
        var groups = parseQuerySelector(sel);
        for (var i = 0; i < groups.length; i++) {
            if (queryGroupMatches(groups[i], this)) return true;
        }
        return false;
    };
    VElement.prototype._collectMatches = function (groups, out, includeSelf) {
        if (includeSelf) {
            for (var g = 0; g < groups.length; g++) {
                if (queryGroupMatches(groups[g], this)) { out.push(this); break; }
            }
        }
        for (var i = 0; i < this.childNodes.length; i++) {
            var c = this.childNodes[i];
            if (c.type === 'el') c._collectMatches(groups, out, true);
        }
    };
    VElement.prototype.querySelector = function (sel) {
        var out = [];
        this._collectMatches(parseQuerySelector(sel), out, false);
        return out.length ? out[0] : null;
    };
    VElement.prototype.querySelectorAll = function (sel) {
        var out = [];
        this._collectMatches(parseQuerySelector(sel), out, false);
        return out;
    };
    VElement.prototype.insertAdjacentElement = function (position, node) {
        // 支持 beforebegin/afterbegin/beforeend/afterend(项目仅用 afterend/beforeend)
        var parent = this.parent || this;
        if (position === 'beforebegin') { parent.insertBefore(node, this); }
        else if (position === 'afterbegin') { this.insertBefore(node, this.firstChild); }
        else if (position === 'afterend') {
            var sib = this.parent ? this.parent.childNodes : [];
            var idx = sib.indexOf(this);
            if (idx === -1 || idx === sib.length - 1) parent.appendChild(node);
            else parent.insertBefore(node, sib[idx + 1]);
        }
        else { this.appendChild(node); }
        return node;
    };
    VElement.prototype.insertAdjacentHTML = function (position, html) {
        var frag = [];
        var nodes = root.__MiniHTML.parse(String(html));
        var tmp = new VElement('div');
        tmp.doc = this.doc || root.__MiniDOM && null;
        buildSubtree(tmp, nodes);
        for (var i = 0; i < tmp.childNodes.length; i++) frag.push(tmp.childNodes[i]);
        for (var j = 0; j < frag.length; j++) {
            tmp.removeChild(frag[j]);
            this.insertAdjacentElement(position, frag[j]);
        }
        return frag;
    };
    VElement.prototype.replaceWith = function () {
        var parent = this.parent;
        if (!parent) return;
        for (var i = 0; i < arguments.length; i++) {
            var n = typeof arguments[i] === 'string' ? new TextNode(arguments[i]) : arguments[i];
            parent.insertBefore(n, this);
        }
        parent.removeChild(this);
    };
    VElement.prototype.closest = function (sel) {
        var node = this;
        while (node) {
            if (node._matchesSimple(sel)) return node;
            node = node.parent;
        }
        return null;
    };

    Object.defineProperty(VElement.prototype, 'textContent', {
        get: function () {
            var out = '';
            for (var i = 0; i < this.childNodes.length; i++) {
                var n = this.childNodes[i];
                out += (n.type === 'text') ? n.text : n.textContent;
            }
            return out;
        },
        set: function (v) {
            this.childNodes = [];
            this.children = [];
            if (v !== '' && v !== null && v !== undefined) {
                var t = new TextNode(String(v));
                t.parent = this;
                this.childNodes.push(t);
                this.children.push(t);
            }
            bump();
        }
    });

    Object.defineProperty(VElement.prototype, 'innerHTML', {
        get: function () { return ''; }, // 项目未读, 返回空串即可
        set: function (html) {
            this.childNodes = [];
            this.children = [];
            var nodes = root.__MiniHTML.parse(String(html));
            buildSubtree(this, nodes);
            bump();
        }
    });

    function buildSubtree(parent, nodes) {
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (n.type === 'text') {
                var t = new TextNode(n.text);
                t.parent = parent;
                parent.childNodes.push(t);
                parent.children.push(t);
            } else {
                var el = new VElement(n.tag);
                for (var k in n.attrs) {
                    if (k === 'id') el.id = n.attrs[k];
                    else if (k === 'class') el.classList = n.attrs[k].split(/\s+/).filter(Boolean);
                    else el.attrs[k] = n.attrs[k];
                }
                if (n.attrs.style) el._parseStyleAttr(n.attrs.style);
                if (n.attrs.src) el.attrs.src = n.attrs.src;
                el.parent = parent;
                parent.childNodes.push(el);
                parent.children.push(el);
                buildSubtree(el, n.children);
            }
        }
    }

    /* ==================== 运行时 ==================== */

    /**
     * createRuntime(opts)
     * opts:
     *   domSpec       — 构建期由 index.html 转出的 UI 树 JSON
     *   cssTexts      — [4张CSS原文]
     *   width/height/dpr — 视口
     *   safeArea      — {top,bottom,left,right}
     *   createCanvas() — 首次调用返回主屏 canvas(wx.createCanvas), 之后为离屏
     *   createImage()  — wx.createImage 外观
     *   loadText(path) — Promise<string>(svg 图片文本)
     *   measureCtx     — 2D 上下文(文字测量用)
     */
    function createRuntime(opts) {
        var W = opts.width, H = opts.height, DPR = Math.min(opts.dpr || 2, 2);
        var safeArea = opts.safeArea || { top: 0, bottom: 0, left: 0, right: 0 };

        // 主屏 canvas 必须最先创建(小游戏第一次 createCanvas 返回上屏画布, 之后为离屏)
        var mainCanvas = opts.mainCanvas || null;
        var rasterCanvas = opts.createCanvas();
        rasterCanvas.width = Math.round(W * DPR);
        rasterCanvas.height = Math.round(H * DPR);
        var rasterCtx = rasterCanvas.getContext('2d');
        var measureCtx = opts.measureCtx || rasterCtx;

        var engine = CSS.parseStylesheets(opts.cssTexts, { width: W, height: H });
        var backgroundImageCache = Object.create(null);

        /* ---- 构建 DOM 树 ---- */
        var doc = {
            _idMap: {},
            _onTreeChange: function (el) { if (el.id) doc._registerId(el); }
        };
        doc._registerId = function (el) {
            if (el.id) doc._idMap[el.id] = el;
        };

        function wrapCtx(c, el) {
            // canvas 元素包装: 保持真实画布能力 + 提供 DOM 外观
            c._ve = el;
            el._realCanvas = c;
            if (!c.style) c.style = {};
            if (!c.addEventListener) {
                c.addEventListener = function (t, f) { el.addEventListener(t, f); };
                c.removeEventListener = function (t, f) { el.removeEventListener(t, f); };
            }
            hardDef(c, 'parentElement', el.parent || { clientWidth: W, clientHeight: H });
            return c;
        }

        function buildTree(spec, parent) {
            var el = new VElement(spec.tag);
            el.doc = doc;
            el.parent = parent;
            var attrs = spec.attrs || {};
            for (var k in attrs) {
                if (k === 'id') el.id = attrs[k];
                else if (k === 'class') el.classList = attrs[k].split(/\s+/).filter(Boolean);
                else el.attrs[k] = attrs[k];
            }
            if (attrs.style) el._parseStyleAttr(attrs.style);
            if (spec.text) {
                var t = new TextNode(spec.text);
                t.parent = el;
                el.childNodes.push(t);
                el.children.push(t);
            }
            for (var i = 0; i < (spec.children || []).length; i++) {
                var c = buildTree(spec.children[i], el);
                el.childNodes.push(c);
                el.children.push(c);
            }
            if (el.id) doc._registerId(el);
            return el;
        }

        var body = buildTree(opts.domSpec, null);
        doc.body = body;
        doc.documentElement = body;

        // 主屏 canvas 注入 #game-canvas 节点
        var canvasSlot = doc._idMap['game-canvas'];
        if (canvasSlot) {
            if (!mainCanvas) mainCanvas = opts.createCanvas();
            mainCanvas.width = Math.round(W * DPR);
            mainCanvas.height = Math.round(H * DPR);
            mainCanvas.style = mainCanvas.style || {};
            mainCanvas.id = 'game-canvas';
            hardDef(mainCanvas, 'clientWidth', W);
            hardDef(mainCanvas, 'clientHeight', H);
            hardDef(mainCanvas, 'parentElement', {
                clientWidth: W, clientHeight: H,
                getBoundingClientRect: function () { return { left: 0, top: 0, width: W, height: H }; }
            });
            wrapCtx(mainCanvas, canvasSlot);
            mainCanvas._ve = canvasSlot;
            canvasSlot._realCanvas = mainCanvas;
        }

        doc.getElementById = function (id) {
            var el = doc._idMap[id] || null;
            // insertAdjacentHTML may insert a whole nested menu at once; only
            // its root is indexed by _onTreeChange. Resolve and cache child IDs.
            if (!el && id) {
                el = body.querySelector('#' + id);
                if (el) doc._idMap[id] = el;
            }
            // 主画布槽位返回真实 canvas(WebGLRenderer 需要 getContext; 输入桥接已由入口接管)
            if (el && el._realCanvas) return el._realCanvas;
            return el;
        };
        doc.createElement = function (tag) {
            tag = String(tag).toLowerCase();
            if (tag === 'canvas') {
                var c = opts.createCanvas(); // 第二次起为离屏
                if (!c.style) c.style = {};
                hardDef(c, 'parentElement', null);
                return c;
            }
            var el = new VElement(tag);
            el.doc = doc;
            if (tag === 'img') {
                var host = opts.createImage();
                // 捕获原生 src 写入通道(安装拦截器前) — 防止 dataURI 赋值递归进拦截器
                var rawHostSrcSet = null;
                (function () {
                    var d0 = Object.getOwnPropertyDescriptor(host, 'src');
                    if (!d0) d0 = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(host), 'src');
                    if (d0 && d0.set) rawHostSrcSet = function (v) { d0.set.call(host, v); };
                    else if (d0) rawHostSrcSet = function (v) { d0.value = v; };
                    else rawHostSrcSet = function (v) { try { host.src = v; } catch (e5) {} };
                })();
                // V12: 混合宿主 — 真实 Image 承载 DOM 语义。
                // three ImageLoader/游戏代码把返回值同时当图源(WebGL texImage2D/2D drawImage)与 DOM 节点,
                // 纯 VElement 包装会导致纹理解码后无法上传 GPU。
                host.tag = 'img';
                host._classList = new ClassList(host);
                var _names = Object.getOwnPropertyNames(el);
                for (var _i2 = 0; _i2 < _names.length; _i2++) {
                    var _k = _names[_i2];
                    if (_k === 'src' || _k === 'style' || _k in host) continue;
                    var _d = Object.getOwnPropertyDescriptor(el, _k);
                    if (_d && !('get' in _d)) { try { Object.defineProperty(host, _k, _d); } catch (e3) {} }
                }
                var _proto = VElement.prototype;
                var _pn = Object.getOwnPropertyNames(_proto);
                for (var _i3 = 0; _i3 < _pn.length; _i3++) {
                    var _pk = _pn[_i3];
                    if (_pk === 'constructor' || _pk === 'className' || _pk === 'classList') continue;
                    if (_pk in host) continue;
                    var _pd = Object.getOwnPropertyDescriptor(_proto, _pk);
                    if (!_pd) continue;
                    try { Object.defineProperty(host, _pk, _pd); } catch (e4) {}
                }
                host._imgHost = host;
                host._isImgElement = true;
                host._imgState = 'pending';
                Object.defineProperty(host, 'classList', {
                    get: function () { return host._classList; },
                    set: function (v) {
                        var arr = Array.isArray(v) ? v : String(v).split(/\s+/).filter(Boolean);
                        host._classList._arr = arr.filter(Boolean);
                        bump();
                    }
                });
                Object.defineProperty(host, 'className', {
                    get: function () { return host._classList.toString(); },
                    set: function (v) { host._classList._arr = String(v).split(/\s+/).filter(Boolean); bump(); }
                });
                el = host; // 返回混合宿主
            }
            if (tag === 'img') {
                // three r149 ImageLoader 走 createElementNS('img') + src/onload 语义 — 混合宿主装配
                el._imgHost = host;
                el._rawSrcSet = rawHostSrcSet;
                host._rawSrcSet = rawHostSrcSet;
                Object.defineProperty(el, 'src', {
                    set: function (v) {
                        el.attrs.src = v;
                        host.attrs = el.attrs; // 混合宿主共享 attrs
                        if (/^blob:mini_/.test(v)) {
                            _loadBlobIntoHost(host, v);
                            el._imgState = 'pending';
                        }
                        else if (el._rawSrcSet) el._rawSrcSet(v); // svg/dataURI/URL → 原生通道
                        else setImgSrc(el, v);
                    },
                    get: function () { return el.attrs.src || ''; }
                });
                // onload/onerror 访问器: 多订阅者安全(THREE 用 addEventListener + 可能覆盖 onload 属性),
                // 触发时向 _listeners 派发(微信端复制版 addEventListener 走此通道), 原生 addEventListener 监听由宿主自动触发
                var _onloadFn = null, _onerrorFn = null;
                Object.defineProperty(el, 'onload', {
                    set: function (fn) { _onloadFn = fn; },
                    get: function () {
                        if (!_onloadFn) return null;
                        return function (ev) {
                            el._imgState = 'loaded';
                            el._naturalW = el._naturalW || (el.width !== undefined ? el.width : 0);
                            el._naturalH = el._naturalH || (el.height !== undefined ? el.height : 0);
                            if (el._dispatch) el._dispatch({ type: 'load', target: el });
                            _onloadFn.call(el, ev);
                            bump();
                        };
                    }
                });
                Object.defineProperty(el, 'onerror', {
                    set: function (fn) { _onerrorFn = fn; },
                    get: function () {
                        if (!_onerrorFn) return null;
                        return function (ev) {
                            el._imgState = 'failed';
                            if (el._dispatch) el._dispatch({ type: 'error', target: el });
                            _onerrorFn.call(el, ev);
                            bump();
                        };
                    }
                });
                el.crossOrigin = '';
                el._isImgElement = true;
            }
            return el;
        };
        // three.min.js ImageLoader 使用 createElementNS — 路由到 createElement
        doc.createElementNS = function (ns, tag) { return doc.createElement(String(tag || 'div').toLowerCase()); };
        doc.createTextNode = function (text) {
            var t = new TextNode(String(text));
            return t;
        };
        doc.addEventListener = function (type, fn) {
            // 文档级监听(项目未用关键路径), 挂在 body
            body.addEventListener(type, fn);
        };
        doc.querySelectorAll = function (sel) { return body.querySelectorAll(sel); };
        doc.querySelector = function (sel) { return body.querySelector(sel); };
        Object.defineProperty(doc, 'images', {
            get: function () {
                var imgs = [];
                (function walk(n) {
                    for (var i = 0; i < n.childNodes.length; i++) {
                        var c = n.childNodes[i];
                        if (c.type === 'el') {
                            if (c.tag === 'img') imgs.push(c);
                            walk(c);
                        }
                    }
                })(body);
                imgs.forEach(function (im) {
                    if (im._imgState === undefined) im._imgState = im._imgHost ? 'pending' : 'loaded';
                    if (im.complete === undefined) {
                        Object.defineProperty(im, 'complete', { get: function () { return im._imgState === 'loaded'; } });
                        Object.defineProperty(im, 'naturalWidth', { get: function () { return im._naturalW || 0; } });
                    }
                });
                return imgs;
            }
        });

        /* ---- img src 赋值(含 svg 文本加载) ---- */
        function setImgSrc(el, src) {
            el.attrs.src = src;
            if (el.tag !== 'img' || !el._imgHost) return;
            if (/\.svg(\?|$)/i.test(src)) {
                el._imgState = 'pending';
                if (opts.loadText) {
                    opts.loadText(src).then(function (text) {
                        try {
                            var parsed = root.__MiniHTML.parse(text);
                            var svgNode = null;
                            for (var i = 0; i < parsed.length; i++) if (parsed[i].type === 'el' && parsed[i].tag === 'svg') { svgNode = parsed[i]; break; }
                            el._svgDoc = svgNode;
                            el._imgState = 'loaded';
                        } catch (e) { el._imgState = 'failed'; }
                        bump();
                    }).catch(function () { el._imgState = 'failed'; bump(); });
                } else {
                    el._imgState = 'failed';
                }
            } else {
                el._imgState = 'pending';
                if (el._rawSrcSet) el._rawSrcSet(src);
                else el._imgHost.src = src;
            }
        }
        // 动态 img.src = '...' 直接赋值支持
        var origSetSrc = VElement.prototype._setSrc;
        VElement.prototype._setSrc = function (src) { setImgSrc(this, src); };

        /* ---- window 外观 ---- */
        var win = {
            innerWidth: W,
            innerHeight: H,
            devicePixelRatio: DPR,
            localStorage: null, // 明确置空 → WxStorageAdapter 分支(Platform.id === 'wechat')
            navigator: { userAgent: 'wechat-minigame-pz', maxTouchPoints: 5 },
            location: {
                search: '', href: 'game://wechat/entry',
                reload: function () { if (opts.onReload) opts.onReload(); }
            },
            performance: (typeof performance !== 'undefined') ? performance : { now: function () { return Date.now(); } },
            requestAnimationFrame: (typeof requestAnimationFrame === 'function') ? requestAnimationFrame
                : function (cb) { return setTimeout(function () { cb(now()); }, 16); },
            cancelAnimationFrame: (typeof cancelAnimationFrame === 'function') ? cancelAnimationFrame : clearTimeout,
            setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: setInterval, clearInterval: clearInterval,
            encodeURIComponent: encodeURIComponent, decodeURIComponent: decodeURIComponent,
            console: console, JSON: JSON, Math: Math, Date: Date, Promise: Promise, Array: Array, Object: Object
        };
        var winListeners = {};
        win.addEventListener = function (type, fn) {
            (winListeners[type] = winListeners[type] || []).push(fn);
        };
        win.removeEventListener = function (type, fn) {
            var arr = winListeners[type];
            if (arr) { var i = arr.indexOf(fn); if (i !== -1) arr.splice(i, 1); }
        };
        win._fire = function (type, ev) {
            var arr = winListeners[type];
            if (arr) for (var i = 0; i < arr.length; i++) { try { arr[i](ev); } catch (e) { console.error('[minidom] window 监听异常', e); } }
        };

        /* ---- Blob / URL shim(GLTFLoader 内嵌贴图路径) ---- */
        var BLOB_REGISTRY = {};
        var blobSeq = 0;
        function BlobShim(parts, options) {
            this._parts = parts || [];
            this.type = (options && options.type) || '';
            var size = 0;
            for (var i = 0; i < this._parts.length; i++) {
                var p = this._parts[i];
                if (p && p.byteLength !== undefined) size += p.byteLength;
                else if (p && p.size) size += p.size;
                else if (typeof p === 'string') size += p.length;
            }
            this.size = size;
        }
        win.Blob = BlobShim;
        var URLObj = {
            createObjectURL: function (obj) {
                var id = 'blob:mini_' + (++blobSeq);
                BLOB_REGISTRY[id] = obj;
                return id;
            },
            revokeObjectURL: function (id) { delete BLOB_REGISTRY[id]; }
        };
        win.URL = URLObj;

        // Image 构造器(window.Image) — 兼容 new Image()
        win.Image = function () {
            var el = doc.createElement('img');
            var facade = el;
            facade.onload = null; facade.onerror = null;
            var host = el._imgHost;
            host.onload = function () {
                el._imgState = 'loaded';
                el._naturalW = host.width; el._naturalH = host.height;
                el._dispatch({ type: 'load', target: el });
                if (facade.onload) facade.onload();
                bump();
            };
            host.onerror = function () {
                el._imgState = 'failed';
                el._dispatch({ type: 'error', target: el });
                if (facade.onerror) facade.onerror();
                bump();
            };
            Object.defineProperty(facade, 'src', {
                set: function (v) { setImgSrc(el, v); if (/^blob:mini_/.test(v)) _loadBlobIntoHost(host, v); else host.src = v; },
                get: function () { return el.attrs.src || ''; }
            });
            return facade;
        };

        function arrayBufferToBase64(buf) {
            if (typeof wx !== 'undefined' && wx.arrayBufferToBase64) return wx.arrayBufferToBase64(buf);
            var bytes = new Uint8Array(buf);
            var bin = '';
            var chunk = 0x8000;
            for (var i = 0; i < bytes.length; i += chunk) {
                bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
            }
            // 环境无 btoa 时手写 base64(GLTF 贴图路径)
            if (typeof btoa === 'function') return btoa(bin);
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var out = '';
            for (var j = 0; j < bytes.length; j += 3) {
                var b1 = bytes[j], b2 = bytes[j + 1], b3 = bytes[j + 2];
                out += chars[b1 >> 2];
                out += chars[((b1 & 3) << 4) | ((b2 || 0) >> 4)];
                out += (b2 === undefined) ? '=' : chars[((b2 & 15) << 2) | ((b3 || 0) >> 6)];
                out += (b3 === undefined) ? '==' : chars[b3 & 63];
            }
            return out;
        }

        function _loadBlobIntoHost(host, blobUrl) {
            var obj = BLOB_REGISTRY[blobUrl];
            if (!obj) { console.warn('[minidom] blob 未注册:', blobUrl); return; }
            var data = null;
            if (obj._parts && obj._parts.length) {
                data = obj._parts[0];
                if (typeof data === 'string') return; // 文本blob → 交给宿主
                if (data.arrayBuffer) { data.arrayBuffer().then(function (ab) {
                    if (host._rawSrcSet) host._rawSrcSet('data:' + (obj.type || 'image/png') + ';base64,' + arrayBufferToBase64(ab));
                    else host.src = 'data:' + (obj.type || 'image/png') + ';base64,' + arrayBufferToBase64(ab);
                }); return; }
                if (host._rawSrcSet) host._rawSrcSet('data:' + (obj.type || 'image/png') + ';base64,' + arrayBufferToBase64(data));
                else host.src = 'data:' + (obj.type || 'image/png') + ';base64,' + arrayBufferToBase64(data);
            }
        }

        /* ==================== 样式缓存 ==================== */

        var matchCache = {}; // matchKey → 规则下标数组
        function matchedRuleIndexes(el) {
            var key = el.tag + '#' + el.id + '.' + el.classList.join(',');
            var cached = matchCache[key];
            if (cached) return cached;
            var arr = [];
            for (var i = 0; i < engine.rules.length; i++) {
                var r = engine.rules[i];
                if (!r.mediaOk || r.active) continue;
                // 候选粗筛: 规则最右 compound 的 class/id/tag 命中才做完整匹配
                var right = null;
                for (var pi = r.parts.length - 1; pi >= 0; pi--) {
                    if (r.parts[pi].comb === undefined) { right = r.parts[pi]; break; }
                }
                if (right) {
                    if (right.id && right.id !== el.id) continue;
                    if (right.tag && right.tag !== '*' && right.tag !== el.tag) {
                        // 只有当规则含 id/class 才可能通过后代命中 → 保守做完整匹配
                        if (!right.id && !right.classes.length) continue;
                        if (!right.classes.length) continue;
                    }
                    if (right.classes.length) {
                        var hit = false;
                        for (var ci = 0; ci < right.classes.length; ci++) {
                            if (el.classList.indexOf(right.classes[ci]) !== -1) { hit = true; break; }
                        }
                        if (!hit && !right.id && (right.tag === el.tag || right.tag === '*')) { /* 可能命中 */ }
                        else if (!hit && !right.id) continue;
                    }
                }
                if (__partsMatch(r.parts, el)) arr.push(i);
            }
            matchCache[key] = arr;
            return arr;
        }
        // 重新绑定 partsMatch(在 CSS 模块中未导出, 这里复刻)
        function compoundMatches(cp, el) {
            if (cp.tag && cp.tag !== '*' && el.tag !== cp.tag) return false;
            if (cp.id && el.id !== cp.id) return false;
            for (var i = 0; i < cp.classes.length; i++) {
                if (el.classList.indexOf(cp.classes[i]) === -1) return false;
            }
            return true;
        }
        function __partsMatch(parts, el) {
            var node = el, idx = parts.length - 1;
            while (idx >= 0) {
                var cp = parts[idx];
                if (cp.comb !== undefined) { idx--; continue; }
                if (!node) return false; // V12: 祖先链走到头(容错)
                if (!compoundMatches(cp, node)) return false;
                var left = idx - 1;
                while (left >= 0 && parts[left].comb !== undefined) left--;
                if (left < 0) return true;
                var comb = parts[left + 1].comb;
                if (comb === '>') { node = node.parent; idx = left; }
                else {
                    var anc = node.parent, matched = false;
                    while (anc) {
                        if (compoundMatches(parts[left], anc)) { matched = true; break; }
                        anc = anc.parent;
                    }
                    if (!matched) return false;
                    node = anc; idx = left;
                }
            }
            return true;
        }

        function computeElStyle(el) {
            var matched = matchedRuleIndexes(el);
            // 级联: 普通声明按特异性排序, !important 最后应用(覆盖 ID 选择器, 如 .hidden !important)
            var declared = {};
            var importantDecls = {};
            for (var m = 0; m < matched.length; m++) {
                var r = engine.rules[matched[m]];
                var expanded = expandDecls(r.decls);
                for (var e = 0; e < expanded.length; e++) {
                    declared[expanded[e][0]] = expanded[e][1];
                }
            }
            // important 收集: 规则声明中带 important 的项(顺序无关, 全部生效)
            for (var mi = 0; mi < matched.length; mi++) {
                var ri = engine.rules[matched[mi]];
                for (var di = 0; di < ri.decls.length; di++) {
                    if (ri.decls[di][2]) importantDecls[ri.decls[di][0]] = ri.decls[di][1];
                }
            }
            for (var impProp in importantDecls) declared[impProp] = importantDecls[impProp];
            if (el.styleInline) {
                var inlineExpanded = expandDecls(objToDecls(el.styleInline));
                for (var ie = 0; ie < inlineExpanded.length; ie++) declared[inlineExpanded[ie][0]] = inlineExpanded[ie][1];
            }
            if (el._styleObj) {
                var objExpanded = expandDecls(objToDecls(el._styleObj));
                for (var oe = 0; oe < objExpanded.length; oe++) {
                    if (!(objExpanded[oe][0] in importantDecls)) declared[objExpanded[oe][0]] = objExpanded[oe][1];
                }
            }
            if (el._activeApplied && el._activeDecls) {
                var act = expandDecls(el._activeDecls);
                for (var ae = 0; ae < act.length; ae++) declared[act[ae][0]] = act[ae][1];
            }
            var style = {};
            var parentStyle = el.parent && el.parent._style;
            for (var prop in CSS.__defaults) {
                if (declared[prop] !== undefined) style[prop] = declared[prop];
                else if (CSS.INHERITED[prop] && parentStyle && parentStyle[prop] !== undefined) style[prop] = parentStyle[prop];
                else style[prop] = CSS.__defaults[prop];
            }
            for (var p2 in declared) if (style[p2] === undefined) style[p2] = declared[p2];
            for (var p3 in style) {
                if (typeof style[p3] === 'string' && style[p3].indexOf('var(') !== -1) {
                    style[p3] = CSS.substituteVars(style[p3], engine.vars);
                }
            }
            return style;
        }
        function objToDecls(obj) {
            var out = [];
            for (var k in obj) out.push([kebab(k), obj[k], false]);
            return out;
        }
        // expandShorthands 从 CSS 模块取(未导出 → 复刻精简版)
        function expandDecls(decls) {
            // 通过一次假级联: 直接用 CSS.computeStyle 无法拿到; 复刻关键简写
            var out = [];
            function fourWay(val) {
                var p = CSS.splitTop(val, ' ');
                if (p.length === 1) return [p[0], p[0], p[0], p[0]];
                if (p.length === 2) return [p[0], p[1], p[0], p[1]];
                if (p.length === 3) return [p[0], p[1], p[2], p[1]];
                return [p[0], p[1], p[2], p[3]];
            }
            for (var i = 0; i < decls.length; i++) {
                var prop = decls[i][0], val = decls[i][1];
                switch (prop) {
                    case 'margin': { var mv = fourWay(val); out.push(['margin-top', mv[0]], ['margin-right', mv[1]], ['margin-bottom', mv[2]], ['margin-left', mv[3]]); break; }
                    case 'padding': { var pv = fourWay(val); out.push(['padding-top', pv[0]], ['padding-right', pv[1]], ['padding-bottom', pv[2]], ['padding-left', pv[3]]); break; }
                    case 'border': {
                        var bp = CSS.splitTop(val, ' ');
                        var bw = '0px', bs = 'none', bc = null;
                        for (var bi = 0; bi < bp.length; bi++) {
                            if (/^[\d.]+(px|em|rem)$/.test(bp[bi])) bw = bp[bi];
                            else if (CSS.parseColor(bp[bi])) bc = bp[bi];
                            else if (bp[bi] !== 'none') bs = bp[bi];
                        }
                        out.push(['border-top-width', bw], ['border-right-width', bw], ['border-bottom-width', bw], ['border-left-width', bw]);
                        out.push(['border-top-style', bs], ['border-right-style', bs], ['border-bottom-style', bs], ['border-left-style', bs]);
                        if (bc) out.push(['border-top-color', bc], ['border-right-color', bc], ['border-bottom-color', bc], ['border-left-color', bc]);
                        break;
                    }
                    case 'border-radius': {
                        var brv = fourWay(val);
                        out.push(['border-top-left-radius', brv[0]], ['border-top-right-radius', brv[1]], ['border-bottom-right-radius', brv[2]], ['border-bottom-left-radius', brv[3]]);
                        break;
                    }
                    case 'gap': { var gp = CSS.splitTop(val, ' '); out.push(['row-gap', gp[0]], ['column-gap', gp[gp.length - 1]]); break; }
                    case 'flex': {
                        var fp = CSS.splitTop(val, ' ');
                        if (fp.length === 1) {
                            if (fp[0] === 'none') out.push(['flex-grow', '0'], ['flex-shrink', '0'], ['flex-basis', 'auto']);
                            else if (fp[0] === 'auto') out.push(['flex-grow', '1'], ['flex-shrink', '1'], ['flex-basis', 'auto']);
                            else out.push(['flex-grow', fp[0]], ['flex-shrink', '1'], ['flex-basis', '0%']);
                        } else {
                            out.push(['flex-grow', fp[0]], ['flex-shrink', fp[1] || '1'], ['flex-basis', fp[2] || '0%']);
                        }
                        break;
                    }
                    case 'background': {
                        var layers = CSS.splitTop(val, ',');
                        var l0 = layers[0] || 'transparent';
                        var bgDeclared = false;
                        if (/gradient\(/i.test(l0)) { out.push(['background-image', l0]); bgDeclared = true; }
                        else if (/url\(/i.test(l0)) { out.push(['background-image', l0]); bgDeclared = true; }
                        // V12修复: 颜色仅从非渐变层提取
                        var colorPart = null;
                        for (var li = 0; li < layers.length; li++) {
                            if (/gradient\(|url\(/i.test(layers[li])) continue;
                            var lp = CSS.splitTop(layers[li], ' ');
                            for (var lj = 0; lj < lp.length; lj++) {
                                if (!/gradient\(|url\(/i.test(lp[lj]) && CSS.parseColor(lp[lj])) colorPart = lp[lj];
                            }
                        }
                        if (colorPart) out.push(['background-color', colorPart]);
                        if (!bgDeclared) out.push(['background-image', 'none']);
                        break;
                    }
                    case 'overflow': { var ov = CSS.splitTop(val, ' '); out.push(['overflow-x', ov[0]], ['overflow-y', ov[ov.length - 1]]); break; }
                    case 'flex-flow': {
                        var ff = CSS.splitTop(val, ' ');
                        for (var fi = 0; fi < ff.length; fi++) {
                            if (/row|column/.test(ff[fi])) out.push(['flex-direction', ff[fi]]);
                            else if (/wrap/.test(ff[fi])) out.push(['flex-wrap', ff[fi]]);
                        }
                        break;
                    }
                    case 'animation': {
                        var ap = CSS.splitTop(val, ' ');
                        if (ap[0]) out.push(['animation-name', ap[0]]);
                        for (var ai = 1; ai < ap.length; ai++) {
                            if (/^[\d.]+m?s$/.test(ap[ai]) && !out.some(function (x) { return x[0] === 'animation-duration'; })) out.push(['animation-duration', ap[ai]]);
                            else if (ap[ai] === 'infinite') out.push(['animation-iteration-count', 'infinite']);
                            else if (/^(forwards|backwards|both)$/.test(ap[ai])) out.push(['animation-fill-mode', ap[ai]]);
                        }
                        break;
                    }
                    case 'border-top': case 'border-bottom': case 'border-left': case 'border-right': {
                        var side = prop.split('-')[1];
                        var sbp = CSS.splitTop(val, ' ');
                        for (var si = 0; si < sbp.length; si++) {
                            if (/^[\d.]+(px|em|rem)$/.test(sbp[si])) out.push(['border-' + side + '-width', sbp[si]]);
                            else if (CSS.parseColor(sbp[si])) out.push(['border-' + side + '-color', sbp[si]]);
                            else if (sbp[si] !== 'none') out.push(['border-' + side + '-style', sbp[si]]);
                            else out.push(['border-' + side + '-width', '0px']);
                        }
                        break;
                    }
                    default: out.push([prop, val]);
                }
            }
            return out;
        }

        /* ==================== 布局 ==================== */

        var layoutCtx = { viewportW: W, viewportH: H, safeArea: safeArea, rootFontSize: 16 };

        function resolveLenCtx(el, parentW) {
            return {
                parentW: parentW, parentH: el.parent && el.parent._box ? el.parent._box.h : undefined,
                viewportW: W, viewportH: H,
                fontSize: el._fs || 16, rootFontSize: 16,
                safeArea: safeArea
            };
        }

        function len(el, v, parentW) {
            if (v === undefined || v === null) return undefined;
            var s = CSS.expandCalc(String(v), resolveLenCtx(el, parentW));
            var r = CSS.resolveLen(s, resolveLenCtx(el, parentW));
            return r;
        }

        var BODY_PAD = 0;

        function visibleChildren(el) {
            var out = [];
            for (var i = 0; i < el.childNodes.length; i++) {
                var c = el.childNodes[i];
                if (c.type !== 'el') { out.push(c); continue; }
                var st = c._style;
                if (st && (st.display === 'none' || st.visibility === 'hidden')) continue;
                out.push(c);
            }
            return out;
        }

        /** V12: 流式内容测量/排布的子元素 — 排除绝对定位(#progress-nodes 等 height:100% 绝对子元素不计入内容高) */
        function flowChildren(el) {
            return visibleChildren(el).filter(function (c) {
                return c.type !== 'el' || (c._style.position !== 'absolute' && c._style.position !== 'fixed');
            });
        }

        function isHiddenByClass(el) {
            // .hidden 类约定(game.js 用 classList 控制)
            return el._style && el._style.display === 'none';
        }

        /** 计算 fontSize(父链) */
        function resolveFont(el) {
            if (el._fs) return el._fs;
            var parentFs = el.parent ? (el.parent._fs || resolveFont(el.parent)) : 16;
            var v = el._style['font-size'];
            var r = len(el, v, el.parent && el.parent._box ? el.parent._box.w : W);
            el._fs = (r === undefined || r === null || isNaN(r)) ? parentFs : r;
            if (el._fs < 8) el._fs = 8;
            return el._fs;
        }

        function fontString(el) {
            var fs = resolveFont(el);
            var weight = el._style['font-weight'] || 'normal';
            var style2 = el._style['font-style'] || 'normal';
            if (weight === 'bold' || weight === '600' || weight === '700' || weight === '800' || weight === '900') weight = 'bold';
            else if (/^\d+$/.test(weight)) weight = Number(weight) >= 600 ? 'bold' : 'normal';
            return style2 + ' ' + weight + ' ' + Math.round(fs) + 'px sans-serif';
        }

        function measureTextWidth(text, el) {
            measureCtx.font = fontString(el);
            var ls = len(el, el._style['letter-spacing'], undefined) || 0;
            if (ls) {
                var w = 0;
                for (var i = 0; i < text.length; i++) w += measureCtx.measureText(text[i]).width + ls;
                return w;
            }
            return measureCtx.measureText(text).width;
        }

        /** 文本折行 → 行数组 [{text, width}] */
        function wrapText(text, el, maxW) {
            var lines = [];
            if (maxW <= 0) return [{ text: text, width: 0 }];
            measureCtx.font = fontString(el);
            var paragraphs = String(text).split('\n');
            for (var p = 0; p < paragraphs.length; p++) {
                var para = paragraphs[p];
                if (!para) { lines.push({ text: '', width: 0 }); continue; }
                var cur = '', curW = 0;
                var ls = len(el, el._style['letter-spacing'], undefined) || 0;
                for (var i = 0; i < para.length; i++) {
                    var ch = para[i];
                    var chW = measureCtx.measureText(ch).width + ls;
                    if (curW + chW > maxW && cur) {
                        lines.push({ text: cur, width: curW });
                        cur = ch; curW = chW;
                    } else {
                        cur += ch; curW += chW;
                    }
                }
                if (cur || paragraphs.length === 1) lines.push({ text: cur, width: curW });
            }
            return lines;
        }

        function lineHeightOf(el, lines) {
            var lh = el._style['line-height'];
            var fs = resolveFont(el);
            if (lh === 'normal' || lh === undefined) return Math.round(fs * 1.4);
            var n = parseFloat(lh);
            if (!isNaN(n) && /^[0-9.]+$/.test(String(lh).trim())) return Math.round(fs * n);
            var px = len(el, lh, undefined);
            if (px !== undefined) return px;
            return Math.round(fs * 1.4);
        }

        /** 元素是否有直接文本 */
        function directText(el) {
            var t = '';
            for (var i = 0; i < el.childNodes.length; i++) {
                if (el.childNodes[i].type === 'text') t += el.childNodes[i].text;
            }
            return t.trim();
        }

        /** 测量内容尺寸(不含 padding/border) */
        function measureContent(el, availW, availH) {
            var s = el._style;
            var display = s.display;
            if (el.tag === 'img') {
                var w = len(el, s.width, availW);
                var h = len(el, s.height, availH);
                var nw = el._naturalW || (el._svgDoc ? 24 : 0), nh = el._naturalH || (el._svgDoc ? 24 : 0);
                if (w !== undefined && h !== undefined) return { w: w, h: h };
                if (w !== undefined && nh) return { w: w, h: h * (w / Math.max(1, nw)) };
                if (h !== undefined && nw) return { w: nw * (h / Math.max(1, nh)), h: h };
                return { w: nw || 0, h: nh || 0 };
            }
            if (el.tag === 'svg') {
                var vw = parseFloat(el.attrs['viewBox'] || '0 0 24 24');
                var vb = String(el.attrs['viewBox'] || '0 0 24 24').split(/[\s,]+/).map(Number);
                var ratio = vb.length === 4 ? vb[2] / Math.max(0.001, vb[3]) : 1;
                var sw = len(el, s.width, availW);
                var sh = len(el, s.height, availH);
                if (sw !== undefined && sh !== undefined) return { w: sw, h: sh };
                if (sw !== undefined) return { w: sw, h: sw / ratio };
                if (sh !== undefined) return { w: sh * ratio, h: sh };
                return { w: vb[2] || 24, h: vb[3] || 24 };
            }
            if (display === 'flex' || display === 'inline-flex') {
                return measureFlex(el, availW, availH);
            }
            if (display === 'grid') {
                return measureGrid(el, availW, availH);
            }
            // block: 文本 + 块级子元素堆叠
            var innerW = availW;
            var h = 0, maxW = 0;
            var text = directText(el);
            if (text) {
                var lines = wrapText(text, el, innerW);
                h += lines.length * lineHeightOf(el, lines);
                maxW = Math.max(maxW, Math.max.apply(null, lines.map(function (l) { return l.width; })));
            }
            var kids = flowChildren(el);
            for (var i = 0; i < kids.length; i++) {
                var c = kids[i];
                if (c.type === 'text') continue;
                var cs = c._style;
                if (cs.display === 'inline' || cs.display === 'inline-block') {
                    var mw = measureContent(c, innerW).w;
                    maxW = Math.max(maxW, mw);
                    continue;
                }
                var cw = len(c._style, c._style.width, innerW);
                var childW = cw !== undefined ? cw : innerW;
                var ch = measureBox(c, childW);
                h += ch;
                maxW = Math.max(maxW, childW);
            }
            return { w: maxW, h: h };
        }

        /** 测量含 padding/border 的盒子高(宽由外部约束) */
        function measureBox(el, outerW) {
            var s = el._style;
            var bl = len(el, s['border-left-width'], 0) || 0;
            var br = len(el, s['border-right-width'], 0) || 0;
            var bt = len(el, s['border-top-width'], 0) || 0;
            var bb = len(el, s['border-bottom-width'], 0) || 0;
            var pl = len(el, s['padding-left'], outerW) || 0;
            var pr = len(el, s['padding-right'], outerW) || 0;
            var pt = len(el, s['padding-top'], outerW) || 0;
            var pb = len(el, s['padding-bottom'], outerW) || 0;
            var innerW = Math.max(0, outerW - bl - br - pl - pr);
            var content = measureContent(el, innerW);
            return content.h + bt + bb + pt + pb;
        }

        function flexGap(el, mainAxis) {
            var g = len(el, mainAxis === 'row' ? (el._style['column-gap'] !== undefined ? el._style['column-gap'] : el._style['gap']) : (el._style['row-gap'] !== undefined ? el._style['row-gap'] : el._style['gap']), undefined);
            return g || 0;
        }

        function measureFlex(el, availW, availH) {
            var s = el._style;
            var row = (s['flex-direction'] || 'row').indexOf('row') === 0;
            var wrap = s['flex-wrap'] === 'wrap';
            var mainAvail = row ? availW : (availH !== undefined ? availH : 1e6);
            var gap = flexGap(el, row ? 'row' : 'col');
            var kids = flowChildren(el).filter(function (c) { return c.type === 'el'; });
            // 每个孩子的 main 基准
            var total = 0, crossMax = 0, lineCount = 1, lineTotal = 0;
            for (var i = 0; i < kids.length; i++) {
                var c = kids[i];
                var cs = c._style;
                var basis = cs['flex-basis'];
                var mainSize;
                if (basis && basis !== 'auto' && basis !== '0%') {
                    var bLen = len(c, basis, row ? availW : availH);
                    mainSize = bLen;
                }
                if (mainSize === undefined) {
                    var fixed = len(c, cs.width, availW);
                    if (!row && fixed !== undefined) mainSize = fixed;
                    else if (row && fixed !== undefined && basis === undefined) mainSize = fixed;
                }
                if (mainSize === undefined) {
                    // 按内容测量
                    if (row) {
                        var mw = measureFlexChildMain(c, availW);
                        mainSize = mw;
                    } else {
                        mainSize = undefined; // 列方向 auto → 由内容高度定
                    }
                }
                c._measMain = mainSize;
                // V12修复: 交叉轴预估宽度 — basis 0%/auto+grow 的项最终会伸展,
                // 按可用宽度测量(0宽预估曾致文本换行爆炸 → top-bar h=1218)
                var willGrow = (parseFloat(cs['flex-grow']) || 0) > 0;
                var measW = row ? ((mainSize !== undefined && mainSize > 0 && !willGrow) ? mainSize : availW) : availW;
                var crossSize = row
                    ? (len(c, cs.height, availH) !== undefined ? len(c, cs.height, availH) : measureBox(c, measW))
                    : (len(c, cs.width, availW) !== undefined ? len(c, cs.width, availW) : availW);
                c._measCross = crossSize;
                if (row) {
                    var m = mainSize !== undefined ? mainSize : 0;
                    if (wrap && lineTotal + m > mainAvail && lineTotal > 0) { lineCount++; lineTotal = m; }
                    else lineTotal += m;
                    total += m;
                    crossMax = Math.max(crossMax, crossSize !== undefined ? crossSize : 0);
                } else {
                    // V12修复: 列方向主轴=纵向 — 累加子项高度(原误累加宽度 → progress-area h=1050)
                    if (mainSize === undefined) mainSize = measureBox(c, crossSize !== undefined ? crossSize : availW);
                    total += mainSize;
                    crossMax = Math.max(crossMax, crossSize !== undefined ? crossSize : 0);
                }
            }
            total += gap * Math.max(0, kids.length - 1);
            if (row) {
                return { w: total, h: lineCount * crossMax + gap * (lineCount - 1) };
            }
            return { w: crossMax, h: total };
        }

        /** flex 子项 row 主轴内容宽(文本/容器) */
        function measureFlexChildMain(c, availW) {
            var s = c._style;
            var text = directText(c);
            if (text && !visibleChildren(c).some(function (x) { return x.type === 'el'; })) {
                return measureTextWidth(text, c) + (len(c, s['padding-left'], availW) || 0) + (len(c, s['padding-right'], availW) || 0)
                    + (len(c, s['border-left-width'], 0) || 0) + (len(c, s['border-right-width'], 0) || 0);
            }
            // 容器: 用内容测量(宽度自适应)
            var kids = visibleChildren(c).filter(function (x) { return x.type === 'el'; });
            if (!kids.length && !text) return 0;
            var total = 0, gap = flexGap(c, 'row');
            for (var i = 0; i < kids.length; i++) {
                var cc = kids[i];
                var fixed = len(cc._style, cc._style.width, availW);
                total += (fixed !== undefined) ? fixed : measureFlexChildMain(cc, availW);
            }
            total += gap * Math.max(0, kids.length - 1);
            var pl = len(c, s['padding-left'], availW) || 0, pr = len(c, s['padding-right'], availW) || 0;
            return total + pl + pr;
        }

        function measureGrid(el, availW, availH) {
            var s = el._style;
            var cols = CSS.splitTop(s['grid-template-columns'] || '1fr', ' ');
            var kids = flowChildren(el).filter(function (c) { return c.type === 'el'; });
            var colW = [];
            var frs = 0, fixedSum = 0;
            for (var i = 0; i < cols.length; i++) {
                if (cols[i].indexOf('fr') !== -1) frs += parseFloat(cols[i]) || 1;
                else { var cv = len(el, cols[i], availW) || 0; colW.push(cv); fixedSum += cv; }
            }
            var frSize = frs > 0 ? Math.max(0, (availW - fixedSum) / frs) : 0;
            var ci = 0;
            for (var i2 = 0; i2 < cols.length; i2++) {
                if (cols[i2].indexOf('fr') !== -1) colW[i2] = frSize * (parseFloat(cols[i2]) || 1);
            }
            // 行高: 每行取最高
            var rowH = 0, maxInRow = 0, colIdx = 0, h = 0;
            for (var k = 0; k < kids.length; k++) {
                var c = kids[k];
                var cw = colW[Math.min(colIdx, colW.length - 1)] || 0;
                var ch = measureBox(c, cw);
                maxInRow = Math.max(maxInRow, ch);
                colIdx++;
                if (colIdx >= colW.length) { h += maxInRow; maxInRow = 0; colIdx = 0; }
            }
            if (maxInRow > 0) h += maxInRow;
            return { w: availW, h: h };
        }

        /* ---- 正式布局 ---- */

        function layoutElement(el, box, containingBox) {
            // box: {x, y, w, h} — 元素外框(border-box)
            el._box = { x: box.x, y: box.y, w: box.w, h: box.h };
            var s = el._style;
            var bl = len(el, s['border-left-width'], box.w) || 0;
            var br = len(el, s['border-right-width'], box.w) || 0;
            var bt = len(el, s['border-top-width'], box.w) || 0;
            var bb = len(el, s['border-bottom-width'], box.w) || 0;
            var pl = len(el, s['padding-left'], box.w) || 0;
            var pr = len(el, s['padding-right'], box.w) || 0;
            var pt = len(el, s['padding-top'], box.w) || 0;
            var pb = len(el, s['padding-bottom'], box.w) || 0;
            var content = {
                x: box.x + bl + pl, y: box.y + bt + pt,
                w: Math.max(0, box.w - bl - br - pl - pr),
                h: Math.max(0, box.h - bt - bb - pt - pb)
            };
            el._content = content;
            el._borderBox = { bl: bl, br: br, bt: bt, bb: bb };
            el._paddingBox = { pl: pl, pr: pr, pt: pt, pb: pb };
            // 命中象限(含变换)
            el._hitQuad = transformQuad(el, box);

            var display = s.display;
            if (display === 'none') return;

            var positioned = (s.position === 'absolute' || s.position === 'fixed');
            var cb = containingBox || { x: 0, y: 0, w: W, h: H };

            // 布局子元素
            if (display === 'flex' || display === 'inline-flex') {
                layoutFlexChildren(el, content, cb);
            } else if (display === 'grid') {
                layoutGridChildren(el, content, cb);
            } else {
                layoutBlockChildren(el, content, cb);
            }

            // 滚动容器检测
            if (s['overflow-y'] === 'auto' || s['overflow-y'] === 'scroll') {
                var contentH = content.h;
                // 重新测子内容高(block 已布局完): 用最后孩子底部或测量
                var kids = flowChildren(el).filter(function (c) { return c.type === 'el'; });
                var bottomMost = content.y;
                for (var i = 0; i < kids.length; i++) {
                    if (kids[i]._box && kids[i]._box.y + kids[i]._box.h > bottomMost) bottomMost = kids[i]._box.y + kids[i]._box.h;
                }
                var totalH = bottomMost - content.y + pb;
                el._scroll = {
                    contentH: Math.max(totalH, content.h),
                    boxH: content.h,
                    overflow: totalH > content.h + 1
                };
            } else {
                el._scroll = null;
            }
            el.scrollTop = Math.min(el.scrollTop || 0, el._scroll && el._scroll.overflow ? Math.max(0, el._scroll.contentH - el._scroll.boxH) : 0);

            // 变换象限最终确定
            el._hitQuad = transformQuad(el, box);
        }

        function transformQuad(el, box) {
            var m = parseTransform(el, box);
            if (!m) return [{ x: box.x, y: box.y }, { x: box.x + box.w, y: box.y }, { x: box.x + box.w, y: box.y + box.h }, { x: box.x, y: box.y + box.h }];
            var pts = [[box.x, box.y], [box.x + box.w, box.y], [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]];
            return pts.map(function (p) {
                return { x: m.a * p[0] + m.c * p[1] + m.e, y: m.b * p[0] + m.d * p[1] + m.f };
            });
        }

        function parseTransform(el, box) {
            var t = el._style.transform;
            if (!t || t === 'none') return null;
            var funcs = t.match(/(\w+)\(([^)]*)\)/g);
            if (!funcs) return null;
            var a = 1, b = 0, c = 0, d = 1, e = 0, f = 0;
            var ownW = box.w, ownH = box.h;
            for (var i = 0; i < funcs.length; i++) {
                var m = funcs[i].match(/(\w+)\(([^)]*)\)/);
                if (!m) continue;
                var fn = m[1], args = m[2].split(/[,\s]+/).filter(Boolean).map(parseFloat);
                var na = 1, nb = 0, nc = 0, nd = 1, ne = 0, nf = 0;
                if (fn === 'translate' || fn === 'translateX' || fn === 'translateY') {
                    var tx = 0, ty = 0;
                    if (fn === 'translateX') tx = args[0] || 0;
                    else if (fn === 'translateY') ty = args[0] || 0;
                    else { tx = args[0] || 0; ty = args[1] || 0; }
                    // % 相对自身
                    if (/%/.test(m[2])) {
                        var raws = m[2].split(/[,\s]+/).filter(Boolean);
                        if (/%/.test(raws[0] || '')) tx = ownW * parseFloat(raws[0]) / 100;
                        if (/%/.test(raws[1] || '')) ty = ownH * parseFloat(raws[1]) / 100;
                    }
                    ne = tx; nf = ty;
                } else if (fn === 'scale') { na = nd = args[0] !== undefined ? args[0] : 1; if (args[1] !== undefined) nd = args[1]; }
                else if (fn === 'scaleX') { na = args[0] || 1; }
                else if (fn === 'scaleY') { nd = args[0] || 1; }
                else if (fn === 'rotate') {
                    var ang = (args[0] || 0) * Math.PI / 180;
                    na = Math.cos(ang); nb = Math.sin(ang); nc = -Math.sin(ang); nd = Math.cos(ang);
                } else if (fn === 'matrix') {
                    na = args[0]; nb = args[1]; nc = args[2]; nd = args[3]; ne = args[4]; nf = args[5];
                } else continue;
                // 组合: 先函数后既有
                var a2 = a * na + c * nb;
                var b2 = b * na + d * nb;
                var c2 = a * nc + c * nd;
                var d2 = b * nc + d * nd;
                var e2 = a * ne + c * nf + e;
                var f2 = b * ne + d * nf + f;
                a = a2; b = b2; c = c2; d = d2; e = e2; f = f2;
            }
            // transform-origin(默认 50% 50%)
            var org = (el._style['transform-origin'] || '50% 50%').split(/\s+/);
            var ox = (org[0] === 'left') ? 0 : (org[0] === 'right') ? ownW : ownW * (parseFloat(org[0]) || 50) / 100;
            var oy = (org[1] === 'top') ? 0 : (org[1] === 'bottom') ? ownH : ownH * (parseFloat(org[1] || '50') || 50) / 100;
            // 平移原点: T(origin) M T(-origin)
            var eO = e + ox - (a * ox + c * oy);
            var fO = f + oy - (b * ox + d * oy);
            return { a: a, b: b, c: c, d: d, e: eO, f: fO };
        }

        function layoutFlexChildren(el, content, cb) {
            var s = el._style;
            var row = (s['flex-direction'] || 'row').indexOf('row') === 0;
            var wrap = s['flex-wrap'] === 'wrap';
            var justify = s['justify-content'] || 'flex-start';
            var alignItems = s['align-items'] || 'stretch';
            var gap = flexGap(el, row ? 'row' : 'col');
            var kids = flowChildren(el).filter(function (c) { return c.type === 'el'; });
            if (!kids.length) return;

            var mainSize = row ? content.w : content.h;
            var crossSize = row ? content.h : content.w;
            var lineSplit = [kids];
            if (wrap && row) {
                lineSplit = [];
                var line = [], acc = 0;
                for (var i = 0; i < kids.length; i++) {
                    var k = kids[i];
                    var kb = k._measMain !== undefined ? k._measMain : (len(k._style, k._style.width, content.w) || 0);
                    if (acc + kb > mainSize && line.length) { lineSplit.push(line); line = [k]; acc = kb + gap; }
                    else { line.push(k); acc += kb + gap; }
                }
                if (line.length) lineSplit.push(line);
            }

            var lineTop = content.y;
            var linesCross = [];
            // 计算每行
            for (var li = 0; li < lineSplit.length; li++) {
                var lKids = lineSplit[li];
                var bases = [], grows = [], shrinks = [], marginsMain = [];
                var totalBase = 0;
                for (var i2 = 0; i2 < lKids.length; i2++) {
                    var c = lKids[i2];
                    var cs = c._style;
                    var mt = row ? (len(c, cs['margin-left'], content.w) || 0) : (len(c, cs['margin-top'], content.w) || 0);
                    var mb = row ? (len(c, cs['margin-right'], content.w) || 0) : (len(c, cs['margin-bottom'], content.w) || 0);
                    marginsMain.push([mt, mb]);
                    var basis = undefined; // V12修复: 函数级var在迭代间残留(progress的0%基准值泄漏给后续子项 → btn-pause w=0)
                    var fb = cs['flex-basis'];
                    if (fb && fb !== 'auto') basis = len(c, fb, row ? content.w : content.h);
                    if (basis === undefined) {
                        basis = len(c, row ? cs.width : cs.height, row ? content.w : content.h);
                    }
                    // V12修复: _measMain 仅在父级 measureFlex 预测时写入; 容器型子项经
                    // measureFlexChildMain 测量时未写 → 此前回退 0(文本项宽=0 → 数值/文字全部不可见)
                    if (basis === undefined && row) basis = measureFlexChildMain(c, content.w);
                    if (basis === undefined) basis = (c._measMain !== undefined) ? c._measMain : 0;
                    if (basis === undefined && !row) {
                        // 列方向 auto 高度 → 测量
                        basis = measureBox(c, content.w);
                    }
                    bases.push(basis);
                    grows.push(parseFloat(cs['flex-grow']) || 0);
                    shrinks.push(parseFloat(cs['flex-shrink']) || 1);
                    totalBase += basis + mt + mb;
                }
                totalBase += gap * (lKids.length - 1);
                var free = mainSize - totalBase;
                var sizes = bases.slice();
                if (free > 0) {
                    var growSum = 0;
                    for (var g = 0; g < grows.length; g++) growSum += grows[g];
                    if (growSum > 0) {
                        for (var g2 = 0; g2 < grows.length; g2++) {
                            if (grows[g2] > 0) sizes[g2] = (sizes[g2] || 0) + free * grows[g2] / growSum;
                        }
                    }
                } else if (free < 0) {
                    var shrinkSum = 0, weighted = 0;
                    for (var sh = 0; sh < shrinks.length; sh++) { weighted += (sizes[sh] || 0) * shrinks[sh]; shrinkSum += shrinks[sh]; }
                    if (shrinkSum > 0 && weighted > 0) {
                        for (var sh2 = 0; sh2 < shrinks.length; sh2++) {
                            if (shrinks[sh2] > 0 && sizes[sh2] > 0) {
                                var cut = -free * ((sizes[sh2] * shrinks[sh2]) / weighted);
                                sizes[sh2] = Math.max(0, sizes[sh2] - cut);
                            }
                        }
                    }
                }
                // 主轴排布
                var used = 0;
                for (var u = 0; u < sizes.length; u++) used += sizes[u] + marginsMain[u][0] + marginsMain[u][1];
                used += gap * (sizes.length - 1);
                var cursor = content.x;
                var spacing = 0;
                if (justify === 'center') cursor += (mainSize - used) / 2;
                else if (justify === 'flex-end' || justify === 'end') cursor += mainSize - used;
                else if (justify === 'space-between') spacing = sizes.length > 1 ? (mainSize - used) / (sizes.length - 1) : 0;
                else if (justify === 'space-around') spacing = (mainSize - used) / sizes.length;
                else if (justify === 'space-evenly') spacing = (mainSize - used) / (sizes.length + 1);
                if (justify === 'space-around') cursor += spacing / 2;
                if (justify === 'space-evenly') cursor += spacing;

                var placed = [];
                for (var pi = 0; pi < lKids.length; pi++) {
                    var c2 = lKids[pi];
                    var sizeMain = sizes[pi];
                    // 交叉轴尺寸
                    var cs2 = c2._style;
                    var alignSelf = cs2['align-self'] !== 'auto' ? cs2['align-self'] : alignItems;
                    var crossFixed = len(c2, row ? cs2.height : cs2.width, row ? content.h : content.w);
                    var cross;
                    if (crossFixed !== undefined) cross = crossFixed;
                    else if (alignSelf === 'stretch') {
                        cross = row ? content.h : content.w;
                        var mCrossA = row ? (len(c2, cs2['margin-top'], content.w) || 0) : (len(c2, cs2['margin-left'], content.w) || 0);
                        var mCrossB = row ? (len(c2, cs2['margin-bottom'], content.w) || 0) : (len(c2, cs2['margin-right'], content.w) || 0);
                        cross = Math.max(0, cross - mCrossA - mCrossB);
                    } else {
                        // V12修复: auto交叉轴在最终主轴宽度(含grow分配)下测量 —
                        // 原 measureFlex 预测量用 basis(0%/auto)宽度, 0宽下文本换行导致高度爆炸(top-bar h=1218)
                        var finalMain = (grows[pi] > 0) ? (sizeMain > 0 ? sizeMain : (row ? content.w : content.h)) : sizeMain;
                        cross = row
                            ? (c2._measCross !== undefined ? c2._measCross : measureBox(c2, finalMain > 0 ? finalMain : content.w))
                            : (c2._measCross !== undefined ? c2._measCross : measureFlexChildMain(c2, content.w));
                    }
                    var crossPos;
                    if (alignSelf === 'center') crossPos = (crossSize - cross) / 2;
                    else if (alignSelf === 'flex-end' || alignSelf === 'end') crossPos = crossSize - cross;
                    else crossPos = 0;
                    var mainPos = cursor + marginsMain[pi][0];
                    cursor += sizeMain + marginsMain[pi][0] + marginsMain[pi][1] + gap + spacing;
                    var childBox = row
                        ? { x: mainPos, y: content.y + crossPos, w: sizeMain, h: cross }
                        : { x: content.x + crossPos, y: mainPos, w: cross, h: sizeMain };
                    placed.push({ el: c2, box: childBox });
                }
                linesCross.push({ placed: placed, lineCross: crossSize });
                lineTop += crossSize + (row && wrap ? gap : 0);
            }
            // 递归布局
            for (var ln = 0; ln < linesCross.length; ln++) {
                var items = linesCross[ln].placed;
                for (var it = 0; it < items.length; it++) {
                    var itemEl = items[it].el, itemBox = items[it].box;
                    if (itemEl._style.position === 'absolute' || itemEl._style.position === 'fixed') continue; // 绝对定位后处理
                    layoutElement(itemEl, itemBox, el._paddingAbsBox || cb);
                }
            }
            // 绝对定位子项(相对最近 positioned 祖先)
            var allKids = visibleChildren(el).filter(function (c) { return c.type === 'el'; });
            for (var ai = 0; ai < allKids.length; ai++) {
                var ak = allKids[ai];
                if (ak._style.position === 'absolute' || ak._style.position === 'fixed') {
                    layoutAbsolute(ak, el, cb);
                }
            }
        }

        function layoutBlockChildren(el, content, cb) {
            var allKids = visibleChildren(el).filter(function (c) { return c.type === 'el'; });
            var kids = allKids.filter(function (c) {
                return c._style.position !== 'absolute' && c._style.position !== 'fixed'; // V12: 绝对定位子元素不占流式空间
            });
            var text = directText(el);
            var y = content.y;
            if (text) {
                var lines = wrapText(text, el, content.w);
                var lh = lineHeightOf(el, lines);
                el._textLayout = { lines: lines, lh: lh, x: content.x, y: y, w: content.w, align: el._style['text-align'] };
                y += lines.length * lh;
            } else {
                el._textLayout = null;
            }
            for (var i = 0; i < kids.length; i++) {
                var c = kids[i];
                var cs = c._style;
                if (cs.position === 'absolute' || cs.position === 'fixed') continue;
                var mt = len(c, cs['margin-top'], content.w) || 0;
                var mb = len(c, cs['margin-bottom'], content.w) || 0;
                var ml = len(c, cs['margin-left'], content.w) || 0;
                var mr = len(c, cs['margin-right'], content.w) || 0;
                y += mt;
                var wFixed = len(c, cs.width, content.w);
                var w = wFixed !== undefined ? wFixed : Math.max(0, content.w - ml - mr);
                var hFixed = len(c, cs.height, content.h); // V12修复: 高度%相对父内容高度(原误用宽度)
                var x = content.x + ml;
                var align = el._style['text-align'];
                if (align === 'center' && wFixed !== undefined) x = content.x + (content.w - w) / 2;
                if (align === 'right' && wFixed !== undefined) x = content.x + content.w - w - mr;
                var childBox = { x: x, y: y, w: w, h: hFixed !== undefined ? hFixed : 0 };
                if (hFixed === undefined) {
                    // 高度自适应: 测量后布局
                    var measured = measureBox(c, w);
                    childBox.h = measured;
                }
                layoutElement(c, childBox, cb);
                y += childBox.h + mb;
            }
            // 绝对定位子项(全部子元素, 含被流式排除的)
            for (var ai2 = 0; ai2 < allKids.length; ai2++) {
                var ak2 = allKids[ai2];
                if (ak2._style.position === 'absolute' || ak2._style.position === 'fixed') {
                    layoutAbsolute(ak2, el, cb);
                }
            }
        }

        function layoutGridChildren(el, content, cb) {
            var s = el._style;
            var cols = CSS.splitTop(s['grid-template-columns'] || '1fr 1fr', ' ');
            var colGap = flexGap(el, 'row');
            var allKids = visibleChildren(el).filter(function (c) { return c.type === 'el'; });
            var kids = allKids.filter(function (c) { return c._style.position !== 'absolute' && c._style.position !== 'fixed'; });
            var colW = [];
            var frs = 0, fixedSum = 0;
            for (var i = 0; i < cols.length; i++) {
                if (cols[i].indexOf('fr') !== -1) frs += parseFloat(cols[i]) || 1;
                else { var cv = len(el, cols[i], content.w) || 0; colW.push(cv); fixedSum += cv; }
            }
            for (var i2 = 0; i2 < cols.length; i2++) {
                if (cols[i2].indexOf('fr') !== -1) colW[i2] = frs > 0 ? (content.w - fixedSum - colGap * (cols.length - 1)) * ((parseFloat(cols[i2]) || 1) / frs) : 0;
            }
            var colIdx = 0, rowTop = content.y, rowMax = 0;
            for (var k = 0; k < kids.length; k++) {
                var c = kids[k];
                if (c._style.position === 'absolute' || c._style.position === 'fixed') continue;
                var ci = Math.min(colIdx, colW.length - 1);
                var x = content.x;
                for (var p = 0; p < ci; p++) x += colW[p] + colGap;
                var chh = measureBox(c, colW[ci]);
                layoutElement(c, { x: x, y: rowTop, w: colW[ci], h: chh }, cb);
                rowMax = Math.max(rowMax, chh);
                colIdx++;
                if (colIdx >= colW.length) { rowTop += rowMax; rowMax = 0; colIdx = 0; }
            }
            for (var ai = 0; ai < allKids.length; ai++) {
                if (allKids[ai]._style.position === 'absolute' || allKids[ai]._style.position === 'fixed') layoutAbsolute(allKids[ai], el, cb);
            }
        }

        function layoutAbsolute(el, parent, cb) {
            var s = el._style;
            var pb = parent._paddingBox || { pl: 0, pr: 0, pt: 0, pb: 0 };
            var bb = parent._borderBox || { bl: 0, br: 0, bt: 0, bb: 0 };
            var pbox = parent._box || { x: 0, y: 0, w: W, h: H };
            var cbx = pbox.x + bb.bl + pb.pl;
            var cby = pbox.y + bb.bt + pb.pt;
            var cbw = Math.max(0, pbox.w - bb.bl - bb.br - pb.pl - pb.pr);
            var cbh = Math.max(0, pbox.h - bb.bt - bb.bb - pb.pt - pb.pb);
            var left = len(el, s.left, cbw);
            var right = len(el, s.right, cbw);
            var top = len(el, s.top, cbh);
            var bottom = len(el, s.bottom, cbh);
            var w = len(el, s.width, cbw);
            var h = len(el, s.height, cbh);
            var x = (left !== undefined) ? cbx + left : (right !== undefined && w !== undefined) ? cbx + cbw - right - w : cbx;
            var y = (top !== undefined) ? cby + top : (bottom !== undefined && h !== undefined) ? cby + cbh - bottom - h : cby;
            if (w === undefined) {
                var avail = right !== undefined && left !== undefined ? cbw - left - right : cbw - (left !== undefined ? left : 0) - (right !== undefined ? right : 0);
                w = Math.max(0, avail);
            }
            if (h === undefined) {
                h = measureBox(el, w);
            }
            layoutElement(el, { x: x, y: y, w: w, h: h }, { x: cbx, y: cby, w: cbw, h: cbh });
        }

        /* ==================== 绘制 ==================== */

        function paintOrder(el) {
            // z-index 排序(稳定): zIndex 大后画
            var kids = visibleChildren(el).slice();
            kids.sort(function (a, b) {
                if (a.type !== 'el' || b.type !== 'el') return a.type === 'el' ? -1 : 1;
                var za = parseInt(a._style['z-index']) || 0;
                var zb = parseInt(b._style['z-index']) || 0;
                if (za !== zb) return za - zb;
                return el.childNodes.indexOf(a) - el.childNodes.indexOf(b);
            });
            return kids;
        }

        function paintElement(ctx, el) {
            if (el.type !== 'el') return;
            var s = el._style;
            if (!s || s.display === 'none' || s.visibility === 'hidden') return;
            var box = el._box;
            if (!box) return;
            if (el._realCanvas) return; // 主画布节点由 3D 渲染器负责
            if (box.w <= 0 || box.h <= 0) {
                // 尺寸为0但可能被 transform 放大(scale in 动画) — 仍绘制空盒
                if (!el._animRunning) return;
            }
            var opacity = parseFloat(s.opacity);
            if (isNaN(opacity)) opacity = 1;
            // 动画插值覆盖
            var animState = el._animState;
            if (animState && animState.opacity !== undefined) opacity *= animState.opacity;

            ctx.save();
            if (opacity < 1) ctx.globalAlpha *= Math.max(0, Math.min(1, opacity));
            // 变换
            var m = parseTransform(el, box);
            if (m) {
                ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
            }
            // 动画 transform 覆盖
            if (animState && animState.transform) {
                var am = animState.transform;
                ctx.transform(am.a, am.b, am.c, am.d, am.e, am.f);
            }

            var bl = len(el, s['border-left-width'], box.w) || 0;
            var br = len(el, s['border-right-width'], box.w) || 0;
            var bt = len(el, s['border-top-width'], box.w) || 0;
            var bb = len(el, s['border-bottom-width'], box.w) || 0;
            var pl = len(el, s['padding-left'], box.w) || 0;
            var pr = len(el, s['padding-right'], box.w) || 0;
            var pt = len(el, s['padding-top'], box.w) || 0;
            var pb = len(el, s['padding-bottom'], box.w) || 0;
            var radii = [
                len(el, s['border-top-left-radius'], box.w) || 0,
                len(el, s['border-top-right-radius'], box.w) || 0,
                len(el, s['border-bottom-right-radius'], box.w) || 0,
                len(el, s['border-bottom-left-radius'], box.w) || 0
            ];

            // V12: 画布祖先(容器/body)不绘制背景 — 3D 画布即视觉本体
            if (el._isCanvasAncestor) {
                // 仍需绘制子元素(HUD 等)与文本
                var scrollOff0 = (el._scroll && el._scroll.overflow) ? -(el.scrollTop || 0) : 0;
                if (el._textLayout) paintTextLines(ctx, el, el._textLayout, 0, 0);
                var kids0 = paintOrder(el);
                for (var k0 = 0; k0 < kids0.length; k0++) {
                    var c0 = kids0[k0];
                    if (c0.type === 'text') continue;
                    if (c0._style && (c0._style.position === 'absolute' || c0._style.position === 'fixed')) continue;
                    ctx.save();
                    if (scrollOff0) ctx.translate(0, scrollOff0);
                    paintElement(ctx, c0);
                    ctx.restore();
                }
                for (var a0 = 0; a0 < kids0.length; a0++) {
                    var ak0 = kids0[a0];
                    if (ak0.type === 'el' && ak0._style && (ak0._style.position === 'absolute' || ak0._style.position === 'fixed')) {
                        paintElement(ctx, ak0);
                    }
                }
                ctx.restore();
                return;
            }
            // box-shadow(外阴影近似)
            if (s['box-shadow'] && s['box-shadow'] !== 'none') {
                var shadows = splitShadows(s['box-shadow']);
                for (var si = 0; si < shadows.length; si++) {
                    var sh = shadows[si];
                    if (sh.inset) continue; // 内阴影 V1 忽略(视觉轻微降级)
                    var color = CSS.parseColor(sh.color) || [0, 0, 0, 80];
                    ctx.save();
                    rectPath(ctx, box.x + sh.x - sh.spread, box.y + sh.y - sh.spread, box.w + sh.spread * 2, box.h + sh.spread * 2, radii);
                    ctx.shadowColor = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + (color[3] / 255) + ')';
                    ctx.shadowBlur = sh.blur;
                    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
                    ctx.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + (color[3] / 255) + ')';
                    ctx.fill();
                    ctx.restore();
                }
            }

            // 背景
            var hasBg = false;
            var bgc = CSS.parseColor(s['background-color']);
            if (bgc && bgc[3] > 0) {
                rectPath(ctx, box.x, box.y, box.w, box.h, radii);
                ctx.fillStyle = CSS.rgbaCss(bgc);
                ctx.fill();
                hasBg = true;
            }
            if (s['background-image'] && /gradient\(/i.test(s['background-image'])) {
                paintGradient(ctx, el, box, radii, s['background-image']);
                hasBg = true;
            } else if (s['background-image'] && /url\(/i.test(s['background-image'])) {
                var mUrl = s['background-image'].match(/url\(["']?([^"')]+)["']?\)/);
                if (mUrl && el._bgImg && el._bgImgState === 'loaded') {
                    ctx.save();
                    rectPath(ctx, box.x, box.y, box.w, box.h, radii);
                    ctx.clip();
                    // Optional sprite-atlas coordinates for inventory art. The
                    // native canvas renderer cannot use CSS background-position.
                    var cols = Number(el.getAttribute('data-atlas-cols'));
                    var rows = Number(el.getAttribute('data-atlas-rows'));
                    var col = Number(el.getAttribute('data-atlas-col'));
                    var row = Number(el.getAttribute('data-atlas-row'));
                    var iw = el._bgImg.naturalWidth || el._bgImg.width;
                    var ih = el._bgImg.naturalHeight || el._bgImg.height;
                    if (cols > 0 && rows > 0 && col >= 0 && col < cols && row >= 0 && row < rows && iw > 0 && ih > 0) {
                        ctx.drawImage(el._bgImg, col * iw / cols, row * ih / rows, iw / cols, ih / rows, box.x, box.y, box.w, box.h);
                    } else {
                        ctx.drawImage(el._bgImg, box.x, box.y, box.w, box.h);
                    }
                    ctx.restore();
                } else if (mUrl && !el._bgImgRequested) {
                    el._bgImgRequested = true;
                    loadBgImage(el, mUrl[1]);
                }
            }

            // 边框
            if (bt > 0 || bb > 0 || bl > 0 || br > 0) {
                var borderColor = CSS.parseColor(s['border-top-color'] || s['border-color']) || CSS.parseColor(s['border-color']);
                if (borderColor && borderColor[3] > 0) {
                    // 统一描边近似(项目边框基本均匀)
                    ctx.lineWidth = Math.max(bl, Math.max(br, Math.max(bt, bb)));
                    rectPath(ctx, box.x + ctx.lineWidth / 2, box.y + ctx.lineWidth / 2, Math.max(0, box.w - ctx.lineWidth), Math.max(0, box.h - ctx.lineWidth), radii);
                    ctx.strokeStyle = CSS.rgbaCss(borderColor);
                    ctx.stroke();
                }
            }

            // 内容裁剪(overflow hidden / 圆角)
            var needClip = (s['overflow-y'] === 'auto' || s['overflow-y'] === 'scroll' || s['overflow-x'] === 'hidden' || s['overflow'] === 'hidden' ||
                (radii[0] > 0 || radii[1] > 0 || radii[2] > 0 || radii[3] > 0));
            if (needClip && (el.childNodes.length)) {
                ctx.save();
                rectPath(ctx, box.x, box.y, box.w, box.h, radii);
                ctx.clip();
                el._clipApplied = true;
            }

            var scrollOff = (el._scroll && el._scroll.overflow) ? -(el.scrollTop || 0) : 0;

            // 直接文本
            if (el._textLayout) {
                paintTextLines(ctx, el, el._textLayout, 0, 0);
            }
            // svg 元素
            if (el.tag === 'svg') {
                paintSvgNode(ctx, el, box);
            }
            // img 元素
            if (el.tag === 'img') {
                paintImg(ctx, el, box, radii);
            }

            // 子元素(按 z 排序)
            var kids = paintOrder(el);
            for (var i = 0; i < kids.length; i++) {
                var c = kids[i];
                if (c.type === 'text') {
                    // flex 容器内的散文本(罕见): 按行绘制在内容左上
                    if (!el._textLayout && c.text.trim()) {
                        ctx.font = fontString(el);
                        ctx.fillStyle = CSS.rgbaCss(CSS.parseColor(s.color)) || '#fff';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(c.text.trim(), el._content.x, el._content.y + lineHeightOf(el) / 2);
                    }
                    continue;
                }
                if (c._style && (c._style.position === 'absolute' || c._style.position === 'fixed')) continue; // 已在父层布局后绘制?
                ctx.save();
                if (scrollOff) ctx.translate(0, scrollOff);
                paintElement(ctx, c);
                ctx.restore();
            }
            // 绝对定位子项绘制(在最上层)
            for (var ai = 0; ai < kids.length; ai++) {
                var ak = kids[ai];
                if (ak.type === 'el' && ak._style && (ak._style.position === 'absolute' || ak._style.position === 'fixed')) {
                    paintElement(ctx, ak);
                }
            }

            if (needClip && el._clipApplied) {
                ctx.restore();
                el._clipApplied = false;
            }
            ctx.restore();
        }

        function loadBgImage(el, src) {
            var cached = backgroundImageCache[src];
            if (cached) {
                if (cached.state === 'loaded') {
                    el._bgImg = cached.image; el._bgImgState = 'loaded'; bump();
                } else if (cached.state === 'loading') {
                    cached.owners.push(el);
                } else {
                    el._bgImgState = 'failed';
                }
                return;
            }
            var img = opts.createImage();
            var entry = backgroundImageCache[src] = { image: img, state: 'loading', owners: [el] };
            img.onload = function () {
                entry.state = 'loaded';
                entry.owners.forEach(function (owner) { owner._bgImg = img; owner._bgImgState = 'loaded'; });
                entry.owners.length = 0; bump();
            };
            img.onerror = function () {
                entry.state = 'failed';
                entry.owners.forEach(function (owner) { owner._bgImgState = 'failed'; });
                entry.owners.length = 0; bump();
            };
            img.src = src;
        }

        function splitShadows(v) {
            var out = [];
            var parts = CSS.splitTop(v, ',');
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                var inset = /(^|\s)inset(\s|$)/.test(p);
                var toks = p.trim().split(/\s+(?![^(]*\))/);
                var color = null, nums = [];
                for (var t = 0; t < toks.length; t++) {
                    var tk = toks[t];
                    if (tk === 'inset') continue;
                    if (CSS.parseColor(tk)) color = tk;
                    else nums.push(tk);
                }
                if (nums.length >= 2) {
                    out.push({
                        x: parseFloat(nums[0]) || 0, y: parseFloat(nums[1]) || 0,
                        blur: parseFloat(nums[2]) || 0, spread: parseFloat(nums[3]) || 0,
                        color: color || 'rgba(0,0,0,0.3)', inset: inset
                    });
                }
            }
            return out;
        }

        function paintGradient(ctx, el, box, radii, grad) {
            var g = grad.trim();
            var inner = g.slice(g.indexOf('(') + 1, g.lastIndexOf(')'));
            var isRadial = /^radial/i.test(g);
            var stops = [];
            var angle = 180; // 默认 to bottom
            var parts = CSS.splitTop(inner, ',');
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i].trim();
                if (!isRadial && i === 0 && !CSS.parseColor(p)) {
                    // 角度或方向
                    var deg = p.match(/^(-?[\d.]+)deg/);
                    if (deg) { angle = parseFloat(deg[1]); continue; }
                    if (/^to\s/.test(p)) {
                        var dir = p.slice(3);
                        if (/top/.test(dir) && /left/.test(dir)) angle = 315;
                        else if (/top/.test(dir) && /right/.test(dir)) angle = 45;
                        else if (/bottom/.test(dir) && /left/.test(dir)) angle = 225;
                        else if (/bottom/.test(dir) && /right/.test(dir)) angle = 135;
                        else if (/top/.test(dir)) angle = 0;
                        else if (/right/.test(dir)) angle = 90;
                        else if (/bottom/.test(dir)) angle = 180;
                        else if (/left/.test(dir)) angle = 270;
                        continue;
                    }
                }
                if (isRadial && i === 0 && !CSS.parseColor(p) && !/^\d/.test(p)) continue; // shape/at 子句
                var sm = p.match(/^(.+?)(?:\s+([\d.]+)%)?$/);
                if (sm) {
                    stops.push({ color: CSS.parseColor(sm[1].trim()), pos: sm[2] !== undefined ? parseFloat(sm[2]) / 100 : null });
                }
            }
            if (stops.length < 2) return;
            for (var s2 = 0; s2 < stops.length; s2++) {
                if (stops[s2].pos === null) stops[s2].pos = s2 / (stops.length - 1);
            }
            rectPath(ctx, box.x, box.y, box.w, box.h, radii);
            ctx.save();
            ctx.clip();
            var gradObj;
            if (isRadial) {
                var cx = box.x + box.w / 2, cy = box.y + box.h / 2;
                var r = Math.max(box.w, box.h) / 2;
                gradObj = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            } else {
                // 角度 → 向量(CSS: 0deg 向上, 顺时针)
                var rad = (angle - 90) * Math.PI / 180;
                var dx = Math.cos(rad), dy = Math.sin(rad);
                var L = (Math.abs(box.w * dx) + Math.abs(box.h * dy)) / 2;
                var cx2 = box.x + box.w / 2, cy2 = box.y + box.h / 2;
                gradObj = ctx.createLinearGradient(cx2 - dx * L, cy2 - dy * L, cx2 + dx * L, cy2 + dy * L);
            }
            for (var s3 = 0; s3 < stops.length; s3++) {
                if (stops[s3].color) gradObj.addColorStop(Math.max(0, Math.min(1, stops[s3].pos)), CSS.rgbaCss(stops[s3].color));
            }
            ctx.fillStyle = gradObj;
            ctx.fillRect(box.x, box.y, box.w, box.h);
            ctx.restore();
        }

        function paintTextLines(ctx, el, layout, offX, offY) {
            var s = el._style;
            var color = CSS.parseColor(s.color);
            ctx.font = fontString(el);
            ctx.fillStyle = CSS.rgbaCss(color) || '#fff';
            ctx.textBaseline = 'middle';
            var ls = len(el, s['letter-spacing'], undefined) || 0;
            var tshadow = s['text-shadow'];
            var shadowParts = (tshadow && tshadow !== 'none') ? splitShadows(tshadow) : null;
            var ellipsis = (s['text-overflow'] === 'ellipsis' && s['white-space'] === 'nowrap');
            var transform = s['text-transform'];
            for (var i = 0; i < layout.lines.length; i++) {
                var line = layout.lines[i];
                var text = line.text;
                if (transform === 'uppercase') text = text.toUpperCase();
                else if (transform === 'lowercase') text = text.toLowerCase();
                var x = layout.x + offX;
                if (layout.align === 'center') x = layout.x + (layout.w - line.width) / 2;
                else if (layout.align === 'right') x = layout.x + layout.w - line.width;
                var y = layout.y + offY + i * layout.lh + layout.lh / 2;
                if (ellipsis && line.width > layout.w) {
                    text = truncateWithEllipsis(text, el, layout.w);
                }
                if (shadowParts) {
                    for (var sp = 0; sp < shadowParts.length; sp++) {
                        var sc = CSS.parseColor(shadowParts[sp].color) || [0, 0, 0, 160];
                        ctx.save();
                        ctx.shadowColor = CSS.rgbaCss(sc);
                        ctx.shadowBlur = shadowParts[sp].blur;
                        drawSpacedText(ctx, text, x + shadowParts[sp].x, y + shadowParts[sp].y, ls);
                        ctx.restore();
                    }
                }
                drawSpacedText(ctx, text, x, y, ls);
            }
        }

        function drawSpacedText(ctx, text, x, y, ls) {
            if (!ls) { ctx.fillText(text, x, y); return; }
            var cx = x;
            for (var i = 0; i < text.length; i++) {
                ctx.fillText(text[i], cx, y);
                cx += ctx.measureText(text[i]).width + ls;
            }
        }

        function truncateWithEllipsis(text, el, maxW) {
            measureCtx.font = fontString(el);
            var out = text, w = measureCtx.measureText(out + '…').width;
            while (out.length > 1 && w > maxW) {
                out = out.slice(0, -1);
                w = measureCtx.measureText(out + '…').width;
            }
            return out + '…';
        }

        function paintImg(ctx, el, box, radii) {
            if (el._svgDoc) {
                paintSvgDoc(ctx, el._svgDoc, box);
                return;
            }
            if (el._imgState !== 'loaded' || !el._imgHost) {
                return; // 未加载不绘制(占位透明)
            }
            ctx.save();
            rectPath(ctx, box.x, box.y, box.w, box.h, radii);
            ctx.clip();
            var iw = el._naturalW || box.w, ih = el._naturalH || box.h;
            // contain 缩放
            var scale = Math.min(box.w / Math.max(1, iw), box.h / Math.max(1, ih));
            var dw = iw * scale, dh = ih * scale;
            ctx.drawImage(el._imgHost, box.x + (box.w - dw) / 2, box.y + (box.h - dh) / 2, dw, dh);
            ctx.restore();
        }

        /* ---- SVG 子集渲染 ---- */
        function paintSvgNode(ctx, el, box) {
            paintSvgElement(ctx, el, el, box);
        }
        function paintSvgDoc(ctx, doc2, box) {
            // doc2 为解析后的 svg 节点 {type:'el', tag:'svg', attrs, children}
            var vb = String(doc2.attrs['viewBox'] || '0 0 24 24').split(/[\s,]+/).map(Number);
            var sx = box.w / Math.max(0.001, vb[2] || 24);
            var sy = box.h / Math.max(0.001, vb[3] || 24);
            ctx.save();
            ctx.translate(box.x - vb[0] * sx, box.y - vb[1] * sy);
            ctx.scale(sx, sy);
            for (var i = 0; i < doc2.children.length; i++) {
                if (doc2.children[i].type === 'el') paintSvgShape(ctx, doc2.children[i]);
            }
            ctx.restore();
        }
        function paintSvgElement(ctx, svgRoot, el, box) {
            var vb = String(svgRoot.attrs['viewBox'] || '0 0 24 24').split(/[\s,]+/).map(Number);
            var sx = box.w / Math.max(0.001, vb[2] || 24);
            var sy = box.h / Math.max(0.001, vb[3] || 24);
            ctx.save();
            ctx.translate(box.x - vb[0] * sx, box.y - vb[1] * sy);
            ctx.scale(sx, sy);
            for (var i = 0; i < el.childNodes.length; i++) {
                var c = el.childNodes[i];
                if (c.type === 'el') paintSvgShape(ctx, c);
            }
            ctx.restore();
        }
        function paintSvgShape(ctx, el) {
            var fill = CSS.parseColor(el.attrs.fill || 'currentColor') || CSS.parseColor('#fff');
            var stroke = CSS.parseColor(el.attrs.stroke || 'none');
            var sw = parseFloat(el.attrs['stroke-width']) || 1;
            ctx.save();
            if (el.attrs.transform) {
                var m = el.attrs.transform.match(/(\w+)\(([^)]*)\)/g);
                if (m) {
                    for (var i = 0; i < m.length; i++) {
                        var mm = m[i].match(/(\w+)\(([^)]*)\)/);
                        var args = mm[2].split(/[,\s]+/).map(parseFloat);
                        if (mm[1] === 'translate') ctx.translate(args[0] || 0, args[1] || 0);
                        else if (mm[1] === 'scale') ctx.scale(args[0] || 1, args[1] !== undefined ? args[1] : args[0] || 1);
                        else if (mm[1] === 'rotate') ctx.rotate((args[0] || 0) * Math.PI / 180);
                    }
                }
            }
            var path = new PathBuilder();
            buildSvgPath(path, el);
            if (el.tag === 'circle') {
                var cx = parseFloat(el.attrs.cx) || 0, cy = parseFloat(el.attrs.cy) || 0, r = parseFloat(el.attrs.r) || 0;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
            } else if (el.tag === 'ellipse') {
                ctx.beginPath();
                ctx.ellipse(parseFloat(el.attrs.cx) || 0, parseFloat(el.attrs.cy) || 0, parseFloat(el.attrs.rx) || 0, parseFloat(el.attrs.ry) || 0, 0, 0, Math.PI * 2);
            } else if (el.tag === 'rect') {
                var rx = parseFloat(el.attrs.rx) || 0;
                rectPath(ctx, parseFloat(el.attrs.x) || 0, parseFloat(el.attrs.y) || 0, parseFloat(el.attrs.width) || 0, parseFloat(el.attrs.height) || 0, [rx, rx, rx, rx]);
            } else {
                ctx.beginPath();
                path.apply(ctx);
            }
            if (fill && el.attrs.fill !== 'none') {
                ctx.fillStyle = CSS.rgbaCss(fill);
                ctx.fill();
            }
            if (stroke && el.attrs.stroke !== 'none') {
                ctx.strokeStyle = CSS.rgbaCss(stroke);
                ctx.lineWidth = sw;
                ctx.stroke();
            }
            ctx.restore();
            for (var k = 0; k < el.childNodes.length; k++) {
                if (el.childNodes[k].type === 'el') paintSvgShape(ctx, el.childNodes[k]);
            }
        }
        function PathBuilder() { this.ops = []; }
        PathBuilder.prototype.apply = function (ctx) {
            for (var i = 0; i < this.ops.length; i++) {
                var o = this.ops[i];
                if (o.f === 'M') ctx.moveTo(o.a[0], o.a[1]);
                else if (o.f === 'L') ctx.lineTo(o.a[0], o.a[1]);
                else if (o.f === 'C') ctx.bezierCurveTo(o.a[0], o.a[1], o.a[2], o.a[3], o.a[4], o.a[5]);
                else if (o.f === 'Q') ctx.quadraticCurveTo(o.a[0], o.a[1], o.a[2], o.a[3]);
                else if (o.f === 'Z') ctx.closePath();
                else if (o.f === 'A') { // 简化: 圆弧→折线(图标准度可接受)
                    arcToPolyline(ctx, o);
                }
            }
        };
        function arcToPolyline(ctx, o) {
            var x1 = o.a[0], y1 = o.a[1], rx = o.a[2], ry = o.a[3], x2 = o.a[6], y2 = o.a[7];
            var steps = 12;
            for (var i = 1; i <= steps; i++) {
                var t = i / steps;
                ctx.lineTo(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
            }
        }
        function buildSvgPath(pb, el) {
            var d = el.attrs.d;
            if (!d) return;
            var toks = d.match(/[a-zA-Z]|-?[\d.]+(?:e-?\d+)?/g) || [];
            var i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = '';
            function num() { return parseFloat(toks[i++]); }
            while (i < toks.length) {
                var t = toks[i];
                if (/[a-zA-Z]/.test(t)) { cmd = t; i++; if (cmd === 'z' || cmd === 'Z') { pb.ops.push({ f: 'Z' }); cx = sx; cy = sy; continue; } }
                var rel = cmd === cmd.toLowerCase() && cmd !== 'z';
                var C = cmd.toUpperCase();
                switch (C) {
                    case 'M': {
                        var x = num(), y = num();
                        if (rel) { x += cx; y += cy; }
                        pb.ops.push({ f: 'M', a: [x, y] });
                        cx = sx = x; cy = sy = y; cmd = rel ? 'l' : 'L';
                        break;
                    }
                    case 'L': { var x2 = num(), y2 = num(); if (rel) { x2 += cx; y2 += cy; } pb.ops.push({ f: 'L', a: [x2, y2] }); cx = x2; cy = y2; break; }
                    case 'H': { var hx = num(); if (rel) hx += cx; pb.ops.push({ f: 'L', a: [hx, cy] }); cx = hx; break; }
                    case 'V': { var vy = num(); if (rel) vy += cy; pb.ops.push({ f: 'L', a: [cx, vy] }); cy = vy; break; }
                    case 'C': {
                        var a1 = num(), a2 = num(), a3 = num(), a4 = num(), a5 = num(), a6 = num();
                        if (rel) { a1 += cx; a2 += cy; a3 += cx; a4 += cy; a5 += cx; a6 += cy; }
                        pb.ops.push({ f: 'C', a: [a1, a2, a3, a4, a5, a6] }); cx = a5; cy = a6; break;
                    }
                    case 'Q': {
                        var q1 = num(), q2 = num(), q3 = num(), q4 = num();
                        if (rel) { q1 += cx; q2 += cy; q3 += cx; q4 += cy; }
                        pb.ops.push({ f: 'Q', a: [q1, q2, q3, q4] }); cx = q3; cy = q4; break;
                    }
                    case 'A': {
                        var rx = num(), ry = num(), rot = num(), laf = num(), sf = num(), ex = num(), ey = num();
                        if (rel) { ex += cx; ey += cy; }
                        pb.ops.push({ f: 'A', a: [cx, cy, rx, ry, rot, laf, sf, ex, ey] });
                        cx = ex; cy = ey; break;
                    }
                    default: i++;
                }
            }
        }

        /* ==================== 布局驱动 ==================== */

        var layoutValid = false;

        function relayout() {
            // 1. 计算样式(自顶向下继承)
            computeTree(body);
            // 2. 布局
            var st = body._style;
            var bw = W, bh = H;
            var bwLen = len(body, st.width, W);
            var bhLen = len(body, st.height, H);
            if (bwLen !== undefined) bw = bwLen;
            if (bhLen !== undefined) bh = bhLen;
            layoutElement(body, { x: 0, y: 0, w: bw, h: bh }, null);
            // V12: 画布祖先链标记 — 这些元素的背景/边框在 H5 中位于 canvas 之下,
            // UI 叠加层不得绘制它们(否则 3D 场景被 #b9e3df 天空色遮盖)
            (function markCanvasAncestors(el) {
                el._isCanvasAncestor = false;
                for (var i = 0; i < el.childNodes.length; i++) {
                    var c = el.childNodes[i];
                    if (c.type !== 'el') continue;
                    markCanvasAncestors(c);
                    if (c._realCanvas || c._isCanvasAncestor) el._isCanvasAncestor = true;
                }
            })(body);
            layoutValid = true;
        }

        function computeTree(el) {
            el._style = computeElStyle(el);
            el._fs = null;
            for (var i = 0; i < el.childNodes.length; i++) {
                if (el.childNodes[i].type === 'el') computeTree(el.childNodes[i]);
            }
        }

        /* ==================== 动画 ==================== */

        var animEls = [];

        function findAnimElements() {
            animEls.length = 0;
            (function walk(el) {
                if (el.type === 'el') {
                    var name = el._style && el._style['animation-name'];
                    if (name && name !== 'none' && engine.keyframes[name]) {
                        el._animName = name;
                        el._animState = null;
                        if (el._animStart === null) el._animStart = now();
                        animEls.push(el);
                    } else {
                        el._animName = null;
                        el._animStart = null;
                    }
                }
                for (var i = 0; i < el.childNodes.length; i++) {
                    if (el.childNodes[i].type === 'el') walk(el.childNodes[i]);
                }
            })(body);
        }

        function lerp(a, b, t) { return a + (b - a) * t; }

        function frameDeclAt(frames, p) {
            // frames: [{offsets:['0%','50%'], decls}] — 转成 [{pos, decls}]
            var norm = [];
            for (var i = 0; i < frames.length; i++) {
                var f = frames[i];
                var pos = 0;
                if (f.offsets && f.offsets.length) {
                    var o = f.offsets[0];
                    if (o === 'from' || o === '0%') pos = 0;
                    else if (o === 'to' || o === '100%') pos = 1;
                    else pos = parseFloat(o) / 100;
                }
                norm.push({ pos: pos, decls: f.decls });
            }
            norm.sort(function (a, b) { return a.pos - b.pos; });
            if (!norm.length) return null;
            if (p <= norm[0].pos) return norm[0].decls;
            for (var i2 = 1; i2 < norm.length; i2++) {
                if (p <= norm[i2].pos) {
                    var A = norm[i2 - 1], B = norm[i2];
                    var t = (p - A.pos) / Math.max(1e-6, B.pos - A.pos);
                    return lerpDecls(A.decls, B.decls, t);
                }
            }
            return norm[norm.length - 1].decls;
        }

        function lerpDecls(A, B, t) {
            var mapA = {}, mapB = {};
            A.forEach(function (d) { mapA[d[0]] = d[1]; });
            B.forEach(function (d) { mapB[d[0]] = d[1]; });
            var out = [];
            var props = {};
            for (var k in mapA) props[k] = 1;
            for (var k2 in mapB) props[k2] = 1;
            for (var pk in props) {
                var a = mapA[pk], b = mapB[pk];
                if (a === undefined) a = b;
                if (b === undefined) b = a;
                if (a === b) { out.push([pk, a]); continue; }
                if (pk === 'opacity') {
                    out.push([pk, String(lerp(parseFloat(a) || 1, parseFloat(b) || 1, t))]);
                } else if (pk === 'transform') {
                    out.push([pk, lerpTransform(a, b, t)]);
                } else {
                    out.push([pk, t < 0.5 ? a : b]); // 其他属性半程切换
                }
            }
            return out;
        }

        function lerpTransform(a, b, t) {
            function decompose(v) {
                var o = { tx: 0, ty: 0, sx: 1, sy: 1, rot: 0 };
                var ms = String(v || '').match(/(\w+)\(([^)]*)\)/g) || [];
                for (var i = 0; i < ms.length; i++) {
                    var m = ms[i].match(/(\w+)\(([^)]*)\)/);
                    var args = m[2].split(/[,\s]+/).filter(Boolean);
                    if (m[1] === 'translate' || m[1] === 'translateX' || m[1] === 'translateY') {
                        o.tx = parseFloat(args[0]) || 0;
                        o.ty = parseFloat(args[1] || args[0]) || 0;
                    } else if (m[1] === 'scale' || m[1] === 'scaleX' || m[1] === 'scaleY') {
                        o.sx = parseFloat(args[0]) || 1;
                        o.sy = parseFloat(args[1] || args[0]) || 1;
                    } else if (m[1] === 'rotate') {
                        o.rot = parseFloat(args[0]) || 0;
                    }
                }
                return o;
            }
            var A = decompose(a), B = decompose(b);
            var tx = lerp(A.tx, B.tx, t), ty = lerp(A.ty, B.ty, t);
            var sx = lerp(A.sx, B.sx, t), sy = lerp(A.sy, B.sy, t);
            var rot = lerp(A.rot, B.rot, t);
            var parts = [];
            if (tx || ty) parts.push('translate(' + tx + 'px,' + ty + 'px)');
            if (rot) parts.push('rotate(' + rot + 'deg)');
            if (sx !== 1 || sy !== 1) parts.push('scale(' + sx + ',' + sy + ')');
            return parts.length ? parts.join(' ') : 'none';
        }

        function tickAnimations(t) {
            if (!animEls.length) return 0;
            var active = 0;
            for (var i = 0; i < animEls.length; i++) {
                var el = animEls[i];
                if (!el._box) continue;
                var durS = parseFloat(el._style['animation-duration']) || 0.3;
                var iter = el._style['animation-iteration-count'];
                var dur = durS * 1000;
                var elapsed = t - (el._animStart || t);
                var cycle = elapsed / dur;
                var infinite = iter === 'infinite';
                if (!infinite && cycle >= (parseFloat(iter) || 1)) {
                    el._animState = null;
                    el._animRunning = false;
                    continue;
                }
                active++;
                el._animRunning = true;
                var p = cycle % 1;
                var decls = frameDeclAt(engine.keyframes[el._animName], p);
                var state = { transform: null, opacity: undefined };
                for (var d = 0; d < decls.length; d++) {
                    if (decls[d][0] === 'transform') state.transform = parseTransformStr(decls[d][1]);
                    else if (decls[d][0] === 'opacity') state.opacity = parseFloat(decls[d][1]);
                }
                el._animState = state;
            }
            return active;
        }

        function parseTransformStr(v) {
            // 复用 parseTransform 的矩阵逻辑(伪元素盒子1x1)
            var fake = { _style: { transform: v, 'transform-origin': '50% 50%' } };
            var m = parseTransform(fake, { x: 0, y: 0, w: 1, h: 1 });
            return m;
        }

        /* ==================== 触控 ==================== */

        var pressed = null; // {el, x, y, t, moved}

        function pointInQuad(q, x, y) {
            // 凸四边形; V12: 退化四边形(零面积, 如 0×0 边框三角元素)不含任何点
            var area2 = (q[1].x - q[0].x) * (q[3].y - q[0].y) - (q[1].y - q[0].y) * (q[3].x - q[0].x);
            if (Math.abs(area2) < 0.01) return false;
            function side(a, b, p) { return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x); }
            var signs = [];
            for (var i = 0; i < 4; i++) {
                var s = side(q[i], q[(i + 1) % 4], { x: x, y: y });
                signs.push(s);
            }
            var pos = 0, neg = 0;
            for (var j = 0; j < 4; j++) { if (signs[j] >= 0) pos++; if (signs[j] <= 0) neg++; }
            return pos === 4 || neg === 4;
        }

        function hitTest(x, y) {
            // V12: 遵循绘制顺序的命中测试 — 顶层(后绘制)元素优先接收事件, 与浏览器一致。
            // (原最深命中策略会让先绘制的深层装饰元素(如进度旗子)截获后绘制的按钮点击)
            function inBoxOf(el) {
                var b = el._box;
                if (b.w <= 0 && b.h <= 0) return false; // V12: 零面积元素不拦截输入
                if (el._hitQuad) return pointInQuad(el._hitQuad, x, y);
                return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
            }
            function walk(el) {
                if (el.type !== 'el' || !el._box) return null;
                var s = el._style;
                if (!s || s.display === 'none' || s.visibility === 'hidden') return null;
                if (el._realCanvas) return null; // 3D 画布不拦截
                // 子元素按绘制顺序逆序(顶层优先); pe=none 的元素自身不接事件但子元素可覆盖
                var kids = paintOrder(el);
                for (var i = kids.length - 1; i >= 0; i--) {
                    var c = kids[i];
                    if (c.type !== 'el') continue;
                    var hit = walk(c);
                    if (hit) return hit;
                }
                if (s['pointer-events'] !== 'none' && inBoxOf(el)) return el;
                return null;
            }
            return walk(body);
        }

        function findScrollParent(el) {
            var node = el;
            while (node) {
                if (node._scroll && node._scroll.overflow) return node;
                node = node.parent;
            }
            return null;
        }

        function makeEvent(type, el, x, y, touches) {
            return {
                type: type, target: el, currentTarget: el,
                clientX: x, clientY: y, x: x, y: y,
                touches: touches || [], changedTouches: touches || [],
                timeStamp: now(),
                preventDefault: function () {}, stopPropagation: function () { this._stopped = true; }
            };
        }

        function dispatchTouch(phase, touches) {
            if (!touches || !touches.length) return false;
            var t = touches[0];
            var x = t.clientX !== undefined ? t.clientX : (t.pageX !== undefined ? t.pageX : t.x);
            var y = t.clientY !== undefined ? t.clientY : (t.pageY !== undefined ? t.pageY : t.y);
            var el = hitTest(x, y);
            // V12: 命中元素本身是 3D 画布/容器背景 → 等价 H5 中触摸落在 canvas 上, 转发游戏不消费。
            // 注意只判命中元素本身 — 容器是所有 UI 的祖先, 沿祖先链判断会让一切触摸被判为游戏区。
            var canvasSlot = doc._idMap['game-canvas'];
            if (el && (el === canvasSlot || el.id === 'game-container' || el._realCanvas)) el = null;
            if (phase === 'start') {
                var scrollP = el ? findScrollParent(el) : null;
                pressed = { el: el, x: x, y: y, t: now(), moved: false, scroll: scrollP, scrollStart: scrollP ? (scrollP.scrollTop || 0) : 0, lastY: y };
                if (el) {
                    // :active 反馈
                    var activeDecls = CSS.findActiveStyle(el, engine);
                    if (activeDecls && (activeDecls.transform || activeDecls.opacity || activeDecls['background-color'] || activeDecls['filter'])) {
                        el._activeApplied = true;
                        el._activeDecls = activeDecls;
                        bump();
                    }
                    el._dispatch(makeEvent('touchstart', el, x, y, touches));
                }
                return !!el;
            }
            if (phase === 'move') {
                if (pressed) {
                    var dy = y - pressed.lastY;
                    pressed.lastY = y;
                    if (Math.abs(y - pressed.y) > 6 || Math.abs(x - pressed.x) > 6) pressed.moved = true;
                    if (pressed.scroll && pressed.moved) {
                        pressed.scroll.scrollTop = Math.max(0, Math.min(
                            pressed.scroll._scroll.contentH - pressed.scroll._scroll.boxH,
                            pressed.scrollStart - (y - pressed.y)));
                        bump();
                    }
                    if (pressed.el) pressed.el._dispatch(makeEvent('touchmove', pressed.el, x, y, touches));
                }
                return !!(pressed && pressed.el);
            }
            if (phase === 'end' || phase === 'cancel') {
                if (pressed && pressed.el) {
                    pressed.el._dispatch(makeEvent(phase === 'end' ? 'touchend' : 'touchcancel', pressed.el, x, y, touches));
                    if (phase === 'end' && !pressed.moved && now() - pressed.t < 800) {
                        pressed.el._dispatch(makeEvent('click', pressed.el, x, y, touches));
                    }
                }
                if (pressed && pressed.el && pressed.el._activeApplied) {
                    pressed.el._activeApplied = false;
                    bump();
                }
                var consumed = !!(pressed && pressed.el);
                pressed = null;
                return consumed;
            }
            return false;
        }

        /* ==================== 脏检测 tick ==================== */

        var lastVersion = -1;
        var styleSnapshot = null;

        function snapshotStyles() {
            // 未知 style 属性写入兜底: 每帧浅比较 style 对象
            var sig = [];
            (function walk(el) {
                if (el.type !== 'el') return;
                var s = el._styleObj || {};
                var keys = Object.keys(s).sort();
                for (var i = 0; i < keys.length; i++) sig.push(el._uid + ':' + keys[i] + '=' + s[keys[i]]);
                if (el.tagNameChanged === undefined) { /* noop */ }
                for (var j = 0; j < el.childNodes.length; j++) {
                    if (el.childNodes[j].type === 'el') walk(el.childNodes[j]);
                }
            })(body);
            return sig.join('|');
        }

        /**
         * 每帧调用: 检测变更 → 重建布局 → 光栅化
         * 返回 true 表示有重绘
         */
        function tick(t) {
            var animActive = 0;
            if (layoutValid) animActive = tickAnimations(t);
            var versionChanged = GLOBAL_VERSION !== lastVersion;
            var styleChanged = false;
            if (!versionChanged) {
                var snap = snapshotStyles();
                styleChanged = snap !== styleSnapshot;
                styleSnapshot = snap;
            } else {
                styleSnapshot = snapshotStyles();
            }
            if (!versionChanged && !styleChanged && !animActive) return false;
            lastVersion = GLOBAL_VERSION;
            relayout();
            findAnimElements();
            animActive = tickAnimations(t);
            // 光栅化
            rasterCtx.setTransform(1, 0, 0, 1, 0, 0);
            rasterCtx.clearRect(0, 0, rasterCanvas.width, rasterCanvas.height);
            rasterCtx.scale(DPR, DPR);
            paintElement(rasterCtx, body);
            if (opts.onRepaint) opts.onRepaint();
            return true;
        }

        function setViewport(w, h, dpr) {
            W = w; H = h;
            if (dpr) DPR = Math.min(dpr, 2);
            layoutCtx.viewportW = W; layoutCtx.viewportH = H;
            rasterCanvas.width = Math.round(W * DPR);
            rasterCanvas.height = Math.round(H * DPR);
            if (mainCanvas) {
                mainCanvas.width = Math.round(W * DPR);
                mainCanvas.height = Math.round(H * DPR);
            }
            win.innerWidth = W; win.innerHeight = H;
            bump();
            layoutValid = false;
        }

        return {
            window: win,
            document: doc,
            body: body,
            mainCanvas: mainCanvas,
            rasterCanvas: rasterCanvas,
            tick: tick,
            setViewport: setViewport,
            dispatchTouch: dispatchTouch,
            hitTest: hitTest,
            relayout: relayout,
            getStats: function () {
                var nodes = 0;
                (function walk(e) { nodes++; for (var i = 0; i < e.childNodes.length; i++) if (e.childNodes[i].type === 'el') walk(e.childNodes[i]); })(body);
                return { nodes: nodes, rules: engine.rules.length, keyframes: Object.keys(engine.keyframes).length, animEls: animEls.length };
            }
        };
    }

    var api = { createRuntime: createRuntime, VElement: VElement };
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.MiniDOM = api;
})(typeof self !== 'undefined' ? self : this);
