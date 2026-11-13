// A deterministic live combat fixture composed entirely of production systems.
// No screenshot-only meshes, sprites, HUD, postprocessing or image compositing.
const fs=require('fs'),path=require('path');
const {ROOT,createHarness,seededContext,waitForGameReady,watchPageErrors}=require('./v42-browser');
async function main(){
 const h=createHarness({port:8249});await h.start();const report=[];
 const out=path.join(ROOT,'docs/screenshots/v42');fs.mkdirSync(out,{recursive:true});
 try{
  for(const viewport of [{width:390,height:844},{width:430,height:932}]){
   const context=await seededContext(h.browser,viewport,1,420),page=await context.newPage(),errors=watchPageErrors(page);
   await page.goto(h.baseUrl+'/?quality=1&v42battle=1');await waitForGameReady(page);
   await page.evaluate(()=>{
    const g=__game;g.levelIndex=2;g.start();g.paused=true;g.pacing.clear();g.enemies.clear();g.combat.clear();g.effects.clear();
    g.squad.reset(31);g.squad.critChance=.25;
    const depth=g.squad.getDepth();
    g.gates.loadFromLevel({segments:[{type:'gates',z:-18+depth,gates:[{lane:0,op:'add',value:12,label:'+12'},{lane:1,op:'buff',value:'damage',label:'输出+1'},{lane:2,op:'mul',value:2,label:'×2'}]}]});
    for(let i=0;i<180;i++){g.squad.update(1/60,i/60,0);g.world.updateCamera(0,0,1/60,31);}
    const actors=[['normal',-1.75,-12],['fast',.0,-11.5],['shield',1.9,-12.6],['split',-1.4,-15],['spitter',.5,-15]];
    for(const [type,x,z] of actors)g.enemies.spawnEnemy(type,x,z+depth,180);
    const boss=g.enemies.spawnEnemy('boss',1.1,-26+depth,8000,'bulwark');boss.spawnT=1;
    g.enemies.renderer.update(0,0,g.enemies.enemies,g.squad.z);
    g.paused=false;
   });
   // Wait for an actual bullet impact; no scripted decorative hit is injected.
   await page.waitForFunction(()=>__game.time>.9&&__game.enemies.enemies.some(e=>!e.isBoss&&e.hitFlash>0)&&__game.combat.bullets.length>=9&&__game.effects.particles.length>5&&__game.effects.flashes.length>=2,null,{timeout:10000});
   const state=await page.evaluate(()=>{
    const g=__game;g.paused=true;
    g.enemies.renderer.update(0,g.time,g.enemies.enemies,g.squad.z);g.effects.update(0);g.combat._syncInstances();g._updateUI();g.world.render();
    return {time:g.time,state:g.state,soldiers:g.squad.count,enemyTypes:g.enemies.enemies.filter(e=>e.alive).map(e=>e.type),bossStyle:g.enemies.boss?.artStyle,gateValues:g.gates.gates.map(x=>x.data.label),bullets:g.combat.bullets.length,hitParticles:g.effects.particles.length,muzzleFlashes:g.effects.flashes.length,drawCalls:g.world.renderer.info.render.calls,renderer:'actual Game scene/camera/renderer + HTML HUD',fixture:'production GateSystem/EnemyManager/Combat/Effects; live bullet impact; seed420; no compositing'};
   });
   const file=`final-combat-${viewport.width}x${viewport.height}.png`;await page.screenshot({path:path.join(out,file)});
   if(errors.length)throw Error(errors.join('\n'));
   report.push({...viewport,file,...state});console.log('CAPTURE',file,JSON.stringify(state));await context.close();
  }
  fs.writeFileSync(path.join(ROOT,'docs/v42-main-capture.json'),JSON.stringify({generatedAt:new Date().toISOString(),seed:420,deviceScaleFactor:1,captures:report},null,2));
 }finally{await h.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
