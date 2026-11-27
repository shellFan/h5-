const assert = require('assert/strict');
const { createHarness, seededContext } = require('../../tools/v42-browser');
(async () => {
    const h = createHarness({ port: 8477 });
    await h.start();
    try {
        const context = await seededContext(h.browser, { width: 390, height: 844 });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(h.baseUrl);
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
        await page.evaluate(() => { const g = window.__game; g._rafDisabled = true; g.start(); g._updateUI(); });
        const result = await page.evaluate(() => {
            const g = window.__game, canvas = g.world.canvas;
            let reads = 0;
            for (const key of ['clientWidth', 'clientHeight']) {
                const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, key);
                Object.defineProperty(canvas, key, { configurable: true, get() { reads++; return descriptor.get.call(this); } });
            }
            try {
                for (let i = 0; i < 20; i++) { g.squad.z -= .1; g._updateUI(); }
                return { reads, transform: g.ui.countBadge.style.transform };
            } finally { delete canvas.clientWidth; delete canvas.clientHeight; }
        });
        assert.equal(result.reads, 0, 'steady HUD must not read layout after progress DOM writes');
        assert.match(result.transform, /^translate3d\(/);
        console.log('PASS steady HUD avoids layout dimension reads');
        for (const viewport of [{width:430,height:932}, {width:360,height:800}]) {
            await page.setViewportSize(viewport);
            const result = await page.evaluate(() => {
                const g = window.__game; g.world.resize(); g._updateUI();
                const v = g._badgeV, w = g.world.canvas.clientWidth, h = g.world.canvas.clientHeight;
                let x = clamp((v.x * .5 + .5) * w, 46, w - 46);
                const y = clamp((-v.y * .5 + .5) * h, 150, h - 40);
                if (y < 200 && x < 145) x = 145;
                return { actual: g.ui.countBadge.style.transform, expected: 'translate3d(' + Math.round(x) + 'px,' + Math.round(y - 18) + 'px,0px)' };
            });
            assert.equal(result.actual.replace(/\s/g,''), result.expected);
        }
        console.log('PASS badge projection follows resized CSS viewport');
        assert.deepEqual(errors, []);
        await context.close();
    } finally { await h.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
