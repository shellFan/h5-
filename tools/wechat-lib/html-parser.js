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
