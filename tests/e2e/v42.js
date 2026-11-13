const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {ROOT,createHarness,seededContext,waitForGameReady,watchPageErrors}=require('../../tools/v42-browser');
async function main(){
 const h=createHarness({port:8248}),results=[];await h.start();
 async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(e){results.push({name,passed:false,error:String(e)});console.error('FAIL '+name,e.message);}}
 try{
  const ctx=await seededContext(h.browser,{width:390,height:844},1,420),page=await ctx.newPage(),errors=watchPageErrors(page);
  await page.goto(h.baseUrl+'/?quality=0');await waitForGameReady(page);
  await test('all twelve GLBs cached; hero/LOD material shared without legacy enemy geometry',async()=>{
   const r=await page.evaluate(async()=>{const a=EnemyModelLoader.load(),b=EnemyModelLoader.load(),d=await a;return{same:a===b&&d===await b,keys:Object.keys(d.styles),materials:Object.values(d.styles).every(s=>s.hero.material===s.lod.material),styles:EnemyModelLoader.status};});
   assert(r.same&&r.materials&&r.keys.length===12&&r.styles==='loaded');
  });
  await test('one gate reward per row even when a 500-soldier footprint touches three panes',async()=>{
   const r=await page.evaluate(()=>{const g=__game;g.start();g.paused=true;g.pacing.clear();g.squad.reset(500);g.squad.x=1.05;g.squad.targetX=1.05;g.squad.z=-10;g.gates.update(g.squad,g.effects,0,.016);return g.gates.gates.filter(x=>x.z===-10&&x.triggered).length;});assert.equal(r,1);
  });
  await test('actual enemy instances animate and hit tint does not mutate another actor material',async()=>{
   const r=await page.evaluate(()=>{const g=__game;g.enemies.clear();const a=g.enemies.spawnEnemy('normal',-1,-10,100),b=g.enemies.spawnEnemy('normal',1,-10,100);g.enemies.update(.016,1,g.squad);a.takeDamage(1,null);g.enemies.renderer.update(.016,1.1,g.enemies.enemies,g.squad.z);const bank=g.enemies.renderer.banks[a.renderBank],ca=new THREE.Color(),cb=new THREE.Color();bank.meshes.Body.getColorAt(a.renderSlot,ca);bank.meshes.Body.getColorAt(b.renderSlot,cb);return{different:ca.r!==cb.r,anchor:a.model.children.length,geo:bank.source.geometries.Body.index.count,materialSame:bank.meshes.Body.material===bank.meshes.Head.material};});assert(r.different&&r.anchor===0&&r.geo>0&&r.materialSame);
  });
  await test('final boss has shield, summons and third phase; shield reduces real damage',async()=>{
   const r=await page.evaluate(()=>{const g=__game;g.enemies.clear();const e=g.enemies.spawnEnemy('boss',0,g.squad.z-10,1000,'overlord');e.spawnT=1;e.abilityTimer=0;e.update(.016,1,g.squad,g.enemies,g.effects);const before=e.hp;e.takeDamage(10,null);const damage=before-e.hp;const shield=e.shieldT>0;e.shieldT=0;e.takeDamage(400,null);e.abilityTimer=0;e.update(.016,2,g.squad,g.enemies,g.effects);const second=e.phaseIndex,adds=g.enemies.enemies.filter(x=>!x.isBoss).length;e.takeDamage(300,null);e.update(.016,3,g.squad,g.enemies,g.effects);return{damage,shield,second,adds,third:e.phaseIndex,emissive:!!EnemyModelLoader.get().styles.overlord.hero.material.emissiveMap};});assert(r.shield&&Math.abs(r.damage-3)<1e-6&&r.second===2&&r.third===3&&r.adds>0&&r.emissive);
  });
  await test('both twin elites must die before the encounter wins',async()=>{
   const r=await page.evaluate(()=>{const g=__game;g.levelIndex=5;g.start();g.paused=true;g.pacing.clear();g.enemies.bossStyle='twinelite';g.pacing.spawnFn('boss',0,-12,1000);const actors=g.enemies.enemies.filter(e=>e.isBoss);g.bossSpawned=true;actors[0].takeDamage(1e9,null);g._updateInner(.016);const one=g.state,live=g.enemies.enemies.filter(e=>e.isBoss&&e.alive).length;actors[1].takeDamage(1e9,null);g._updateInner(.016);return{n:actors.length,one,live,last:g.state};});assert(r.n===2&&r.one==='playing'&&r.live===1&&r.last==='won');
  });
  await test('acid projectiles move toward the player and the pool is bounded',async()=>{
   const r=await page.evaluate(()=>{const g=__game;g.enemies.clear();g.enemies.spawnSpit(0,.5,g.squad.z-8,g.squad);const p=g.enemies.spits[0],z=p.mesh.position.z;g.enemies.update(.05,3,g.squad);return{forward:p.mesh.position.z>z,total:g.enemies.spits.length+g.enemies._spitPool.length,batch:g.enemies._spitInstances.isInstancedMesh};});assert(r.forward&&r.total===64&&r.batch);
  });
  await test('decoration visibility has no effect on movement, road bounds or gate logic',async()=>{
   const r=await page.evaluate(()=>{const g=__game;function trace(show){g.world._v42Environment.root.visible=show;g.squad.reset(31);g.squad.x=0;g.squad.targetX=1;const a=[];for(let i=0;i<30;i++){g.squad.update(1/60,i/60,null);a.push([g.squad.x,g.squad.z]);}return a;}const random=Math.random;Math.random=()=>.5;const a=trace(true),b=trace(false);Math.random=random;g.world._v42Environment.root.visible=true;return JSON.stringify(a)===JSON.stringify(b);});assert(r);
  });
  await test('particles and golden projectiles are bounded instance batches',async()=>{assert(await page.evaluate(()=>__game.effects.particleMesh.isInstancedMesh&&__game.combat._bulletInstances.isInstancedMesh&&__game.effects._flashPool.length+__game.effects.flashes.length<=24));});
  await test('no browser shader/runtime errors',async()=>{assert.deepEqual(errors,[]);});
  await ctx.close();
  await test('failed enemy GLB is visible and retry boots exactly one Game',async()=>{
   const c=await seededContext(h.browser,{width:390,height:844},1,420),p=await c.newPage();
   await p.route('**/normal/normal.glb',r=>r.abort());await p.goto(h.baseUrl);
   await p.waitForSelector('#btn-retry-model',{state:'visible'});assert(!await p.evaluate(()=>!!window.__game));
   await p.unroute('**/normal/normal.glb');await p.click('#btn-retry-model');await waitForGameReady(p);assert.equal(await p.locator('#game-canvas').count(),1);await c.close();
  });
 }finally{await h.close();fs.writeFileSync(path.join(ROOT,'docs/v42-functional.json'),JSON.stringify({passed:results.every(r=>r.passed),results},null,2));}
 if(results.some(r=>!r.passed))process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
