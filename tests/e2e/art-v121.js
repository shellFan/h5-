// Actual model/scene acceptance and reproducible before/after screenshots.
const { chromium } = require('playwright-core');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const ROOT = path.resolve(__dirname, '../..');
const PORT = 8410;
(async () => {
    const server = spawn(process.execPath, ['tools/server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
    let browser, failures = 0;
    try {
        browser = await chromium.launch({ headless: true, channel: 'msedge' });
        const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
        if (process.env.ART_BASELINE) {
            const original = file => execFileSync('git', ['show', 'c5a96a4:' + file], { cwd: ROOT });
            await page.route('**/index.html', r => r.fulfill({ contentType: 'text/html', body: original('index.html') }));
            for (const file of ['world.js', 'enemies.js', 'enemy-models.js']) await page.route('**/js/' + file + '*', r => r.fulfill({ contentType: 'text/javascript', body: original('js/' + file) }));
            await page.route(/\/assets\/models\/(?:zombies|bosses)\/.*\.glb/, r => r.fulfill({ contentType: 'model/gltf-binary', body: original(new URL(r.request().url()).pathname.slice(1)) }));
        }
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`http://localhost:${PORT}/index.html`);
        await page.waitForFunction(() => window.__game && window.__game.squad.renderer);
        await page.evaluate(async () => { window.__game._rafDisabled = true; await EnemyModelLoader.load(); });
        async function check(name, fn) {
            try { await fn(); console.log('PASS ' + name); }
            catch (e) { failures++; console.error('FAIL ' + name + ': ' + e.message); }
        }
        if (!process.env.ART_BASELINE) {
            await check('bomber has its own five-part loaded model instead of fast fallback', async () => {
                const result = await page.evaluate(() => {
                    const d = EnemyModelLoader.get();
                    const g = window.__game;
                    g.start(); const b = g.enemies.spawnEnemy('bomber', 0, -9, 100);
                    return { has: !!d.styles.bomber, style: b.artStyle,
                        parts: d.styles.bomber ? Object.keys(d.styles.bomber.hero.geometries) : [] };
                });
                assert(result.has && result.style === 'bomber', JSON.stringify(result));
                assert.equal(result.parts.length, 5);
            });
            await check('emissive mask retains exported glow cell and excludes ivory armor', async () => {
                const pixels=await page.evaluate(() => {
                    const image=EnemyModelLoader.get().styles.bomber.hero.material.emissiveMap.image;
                    const ctx=image.getContext('2d');
                    return {glow:[...ctx.getImageData(224,96,1,1).data],ivory:[...ctx.getImageData(224,160,1,1).data]};
                });
                assert(Math.max(...pixels.glow.slice(0,3))>30,JSON.stringify(pixels));
                assert.deepEqual(pixels.ivory.slice(0,3),[0,0,0]);
            });
            await check('decorative rails and overhead beams are removed while gameplay gates remain', async () => {
                const result=await page.evaluate(() => {
                    const g=window.__game; g.levelIndex=0; g.start();
                    const names=g.world._v42Environment.entries.map(e=>e.mesh.name);
                    const road=g.world.roadSegments[0].group.children[1].geometry;
                    road.computeBoundingBox();
                    g.world.applyTheme('mechanical');
                    const crossing=g.world._v121Scenery.active.userData.entries.flatMap(e=>e.records.map(r=>({shape:e.mesh.name,...r}))).filter(r=>Math.abs(r.x)<3 && r.y>2 && r.sx>6);
                    g.world.applyTheme('default');
                    return {names,roadMaxY:road.boundingBox.max.y,crossing,gates:g.gates.gates.length};
                });
                for (const name of ['barriers','roof-trims','cityx-banner-frames','cityx-banner-a','cityx-banner-b','fort-arches']) assert(!result.names.includes('v42-'+name),name);
                assert(result.roadMaxY<=.101,JSON.stringify(result));
                assert.equal(result.crossing.length,0); assert(result.gates>0);
            });
            await check('five themes use real distinct geometry, recycle, and restore the city', async () => {
                const result = await page.evaluate(async () => {
                    const w = window.__game.world;
                    if (!w._v121Scenery) return { missing: true };
                    await w._v121Scenery.ready;
                    const themes = [];
                    for (const theme of ['default', 'cave', 'mechanical', 'fortress', 'apocalypse']) {
                        w.applyTheme(theme);
                        const root = w._v121Scenery.active;
                        const objects = [];
                        root.traverse(o => { if (o.isMesh) objects.push({ name: o.name, count: o.isInstancedMesh ? o.count : 1 }); });
                        const geometryBefore = objects.map(x => x.name).sort().join('|');
                        w.updateRoadScroll(-500);
                        themes.push({ theme, visible: root.visible, objects, fingerprint: geometryBefore,
                            city: w._v42Environment.root.visible, texture: !!w._v121Scenery.materials.stone.map });
                    }
                    w.applyTheme('default');
                    return { themes, restored: w._v42Environment.root.visible,
                        cached: Object.keys(w._v121Scenery.groups).length,
                        active: Object.values(w._v121Scenery.groups).filter(g => g.visible).length };
                });
                assert(!result.missing, JSON.stringify(result));
                assert.equal(result.themes.length, 5);
                for (const r of result.themes) {
                    assert(r.visible && r.objects.length > 3 && r.texture, JSON.stringify(r));
                    assert.equal(r.city, r.theme === 'default');
                }
                assert.equal(new Set(result.themes.map(t => t.fingerprint)).size, 5);
                assert(result.restored && result.cached === 5 && result.active === 1, JSON.stringify(result));
            });
        }
        if (process.env.ART_CAPTURE_DIR) {
            fs.mkdirSync(process.env.ART_CAPTURE_DIR, { recursive: true });
            for (const [theme, level] of [['default', 0], ['cave', 6], ['mechanical', 7], ['fortress', 8], ['apocalypse', 5]]) {
                await page.evaluate(async ({ theme, level }) => {
                    const g = window.__game; g.levelIndex = level; g.start(); RandomEvents._t = 99999;
                    g.pacing.waves = []; g.gates.clear(); g.enemies.clear(); g.combat.fireTimer = 99999;
                    g.squad.setCount(12); g.squad.invulnT = 99999;
                    if (g.world._v121Scenery) await g.world._v121Scenery.ready;
                    for (let i = 0; i < 45; i++) { g.time += 1 / 60; g._update(1 / 60); }
                    g.enemies.clear();
                    const types = ['normal', 'fast', 'shield', 'split', 'spitter', 'elite', 'bomber'];
                    for (let i = 0; i < types.length; i++) g.enemies.spawnEnemy(types[i], (i % 3 - 1) * 1.8, g.squad.z - 6 - Math.floor(i / 3) * 3.2, 10000);
                    g.enemies.update(0.016, g.time, g.squad);
                    g.world.renderer.render(g.world.scene, g.world.camera);
                }, { theme, level });
                await page.screenshot({ path: path.join(process.env.ART_CAPTURE_DIR, `${theme}-390x844.png`) });
            }
        }
        if (process.env.ART_PERF) {
            const perf = await page.evaluate(async () => {
                const g=window.__game; g.levelIndex=6; g.start(); g.pacing.clear(); g.gates.clear();
                g.squad.setCount(100); g.squad.invulnT=99999; g.combat.fireTimer=99999; g.enemies.clear();
                if(g.world._v121Scenery) await g.world._v121Scenery.ready;
                const types=['normal','fast','shield','split','spitter','elite','bomber'];
                for(let i=0;i<40;i++) g.enemies.spawnEnemy(types[i%types.length],(i%5-2)*1.2,g.squad.z-8-Math.floor(i/5)*1.6,99999);
                g.enemies.update(.016,1,g.squad); g.squad.update(.016,1);
                const times=[]; let last;
                for(let i=0;i<180;i++) {
                    const t=await new Promise(requestAnimationFrame);
                    g.world.renderer.render(g.world.scene,g.world.camera);
                    if(i>=60 && last) times.push(t-last); last=t;
                }
                const info=g.world.renderer.info,sorted=times.slice().sort((a,b)=>a-b);
                return {scenario:'Cave:100 squad +40 enemies, fixed scene, 60 warmup +120 RAF intervals; desktop headless Edge, no CPU throttle', fps:1000/(times.reduce((a,b)=>a+b,0)/times.length),p95Ms:sorted[Math.floor(sorted.length*.95)],drawCalls:info.render.calls,triangles:info.render.triangles,textures:info.memory.textures};
            });
            fs.writeFileSync(process.env.ART_PERF,JSON.stringify(perf,null,2)+'\n'); console.log('PERF '+JSON.stringify(perf));
        }
        if (process.env.ART_CAPTURE_DIR && !process.env.ART_BASELINE) {
            await page.setViewportSize({ width: 1600, height: 900 });
            for (const [family, keys] of [['zombies', ['normal','fast','shield','split','spitter','elite','bomber']], ['bosses', ['bruiser','bulwark','spitking','hivelord','titan','overlord']]]) {
                await page.evaluate(({ family, keys }) => {
                    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a2939);
                    scene.add(new THREE.HemisphereLight(0xe8f7ff, 0x617184, .8));
                    const sun = new THREE.DirectionalLight(0xffe5bc, 1.2); sun.position.set(-5,12,9); scene.add(sun);
                    const camera = new THREE.OrthographicCamera(-11.5,11.5,6.47,-6.47,.1,100);
                    camera.position.set(0,5,22); camera.lookAt(0,1.7,0);
                    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60,30),new THREE.MeshLambertMaterial({color:0x14202b}));
                    floor.rotation.x=-Math.PI/2; floor.position.y=-.02; scene.add(floor);
                    for (let i=0;i<keys.length;i++) {
                        const bank=EnemyModelLoader.get().styles[keys[i]].hero;
                        const group=new THREE.Group(); group.position.x=(i-(keys.length-1)/2)*(family==='bosses'?3.6:3.1);
                        group.rotation.y=.22; group.scale.setScalar(family==='bosses'?2.2:3.1);
                        for(const part of EnemyModelLoader.PARTS) {
                            const mesh=new THREE.Mesh(bank.geometries[part],bank.material);
                            mesh.matrix.copy(bank.restMatrices[part]); mesh.matrixAutoUpdate=false; group.add(mesh);
                        }
                        scene.add(group);
                    }
                    const renderer=window.__game.world.renderer; renderer.setSize(1600,900); renderer.setPixelRatio(1);
                    document.body.innerHTML=''; document.body.appendChild(renderer.domElement);
                    renderer.domElement.style.cssText='position:fixed;inset:0;width:1600px;height:900px';
                    renderer.render(scene,camera);
                    const title=document.createElement('div'); title.textContent=family==='bosses'?'BOSS · 实际游戏模型':'ZOMBIES · 实际游戏模型';
                    title.style.cssText='position:fixed;top:35px;left:50px;color:#d9f2ff;font:600 30px sans-serif;letter-spacing:4px'; document.body.appendChild(title);
                    const labels=document.createElement('div');labels.style.cssText='position:fixed;bottom:145px;left:4%;width:92%;display:flex;justify-content:space-around;color:#c0d8e7;font:22px monospace';
                    keys.forEach(k=>{const el=document.createElement('span'); el.textContent=k; labels.appendChild(el);});document.body.appendChild(labels);
                }, {family, keys});
                await page.screenshot({path:path.join(process.env.ART_CAPTURE_DIR,family+'-lineup.png')});
            }
        }
        await check('no browser errors', () => assert.deepEqual(errors, []));
    } finally { if (browser) await browser.close(); server.kill(); }
    process.exitCode = failures ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
