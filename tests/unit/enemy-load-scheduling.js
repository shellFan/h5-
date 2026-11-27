const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
function fresh() {
    const ctx = vm.createContext({ console, performance, setTimeout: fn => setImmediate(fn), Promise });
    vm.runInContext(fs.readFileSync('js/enemy-models.js', 'utf8'), ctx);
    return ctx.EnemyModelLoader;
}
(async () => {
    let failed = 0;
    async function check(name, fn) {
        try { await fn(); console.log('PASS ' + name); }
        catch(e) { failed++; console.error('FAIL ' + name + ': ' + e.message); }
    }
    await check('concurrent initial subsets actually load both requested styles', async () => {
        const L = fresh(), calls = [];
        L._loadKeys = async keys => { calls.push(...keys); return Object.fromEntries(keys.map(k=>[k, { hero: {}, lod: {} }])); };
        await Promise.all([L.load(['normal']), L.load(['fast'])]);
        assert.deepEqual([...Object.keys(L.get().styles)].sort(), ['fast', 'normal']);
        assert.equal(calls.length, 2);
    });
    await check('overlapping background subsets decode each style only once', async () => {
        const L = fresh(), calls = [];
        L._data = { parts: L.PARTS, styles: { normal: {} } };
        L._loadKeys = async keys => { calls.push(...keys); return Object.fromEntries(keys.map(k=>[k, { hero: {}, lod: {} }])); };
        await Promise.all([L.load(['shield', 'spitter']), L.load(['spitter', 'thrower'])]);
        assert.deepEqual(calls.sort(), ['shield', 'spitter', 'thrower']);
        assert.equal(L.status, 'partial');
    });
    await check('a failed style retries while already decoded siblings stay cached', async () => {
        const L = fresh(), calls = {};
        L._loadKeys = async keys => {
            const data = {};
            for(const k of keys) {
                calls[k] = (calls[k] || 0) + 1;
                if(k === 'fast' && calls[k] === 1) throw Error('decode failure');
                data[k] = { hero: {}, lod: {} };
            }
            return data;
        };
        await assert.rejects(L.load(['normal', 'fast']), /decode failure/);
        await L.load(['normal', 'fast']);
        assert.equal(calls.normal, 1); assert.equal(calls.fast, 2);
        assert.deepEqual(Object.keys(L.get().styles).sort(), ['fast', 'normal']);
    });
    await check('a background failure remains visible after later banks finish', async () => {
        const L = fresh();
        L._data = { parts: L.PARTS, styles: { normal: {} } };
        L._loadKeys = async keys => {
            L.status = 'loading';
            if (keys[0] === 'shield') throw Error('network failure');
            return { spitter: { hero: {}, lod: {} } };
        };
        await assert.rejects(L.load(['shield', 'spitter']), /network failure/);
        await L._queue;
        assert(L.get().styles.spitter);
        assert.equal(L.status, 'partial_failed');
    });
    process.exitCode = failed ? 1 : 0;
})().catch(e=>{console.error(e);process.exitCode=1;});
