// Fixed-step replay of the actual Game. No forced wins, invulnerability or skips.
const fs=require('fs'),path=require('path');
const {ROOT,createHarness,seededContext,waitForGameReady}=require('./v42-browser');
async function main(){
 const h=createHarness({port:8247});await h.start();
 const results=[];
 try{
  const context=await seededContext(h.browser,{width:390,height:844},1,420);
  const page=await context.newPage();await page.goto(h.baseUrl+'/?quality=0');await waitForGameReady(page,30000);
  for(let level=0;level<10;level++){
   const r=await page.evaluate(async index=>{
    const g=window.__game;g.levelIndex=index;g.start();g.paused=true;
    const DT=1/30,trace=[],decided=new Set();let tick=0,maxAlive=0,shots=0;
    function score(data,s){
     const per=s.getDamage()*s.getFireRate(),dps=s.count*per;
     if(data.op==='add')return Math.min(data.value,500-s.count)*per*(s.count<40?1.5:1);
     if(data.op==='mul')return Math.min(s.count*(data.value-1),500-s.count)*per*(s.count<40?1.5:1);
     if(data.op==='risk')return -dps*.3+s.count*2*s.getFireRate();
     if(data.value==='damage')return s.count*s.getFireRate();
     if(data.value==='damage2')return s.count*s.getFireRate()*Math.max(0,Math.max(2,s.damageBuff*2)-s.damageBuff);
     if(data.value==='firerate')return dps*Math.max(0,Math.min(.5,s.fireRateBuff+.2)-s.fireRateBuff);
     if(data.value==='crit')return s.critChance<.5?dps*.1:0;
     if(data.value==='pierce')return s.pierce<3?dps*.35:0;
     if(data.value==='freeze')return s.freezeStacks<2?dps*.12:0;
     if(data.value==='vamp')return s.vampStacks<2?dps*.2:0;
     return 0;
    }
    while(g.state==='playing' && tick<30*330){
     const ahead=g.gates.gates.filter(x=>!x.triggered&&!x.passed&&x.z<g.squad.z+.3&&x.z>g.squad.z-18).sort((a,b)=>b.z-a.z);
     if(ahead.length&&!decided.has(ahead[0].z)){
      const row=ahead.filter(x=>x.z===ahead[0].z);const best=row.reduce((a,b)=>score(b.data,g.squad)>score(a.data,g.squad)?b:a);
      g.squad.targetX=best.x;decided.add(best.z);trace.push({tick,seconds:+(tick*DT).toFixed(3),z:best.z,lane:best.data.lane,op:best.data.op,value:best.data.value,count:g.squad.count});
     }
     if(g._slowmoT>0)g._slowmoT-=DT;else g._timeScale=1;
     const dt=DT*(g._timeScale||1);g.time+=dt;g.elapsedTime+=DT;g._updateInner(dt);
     maxAlive=Math.max(maxAlive,g.enemies.aliveCount);shots=Math.max(shots,g.combat.bullets.length);tick++;
     if(tick%180===0){g.world.render();await new Promise(r=>setTimeout(r,0));}
    }
    return {level:index+1,name:LEVELS[index].name,style:LEVELS[index].bossStyle,state:g.state,won:g.state==='won',duration:+(tick*DT).toFixed(2),count:g.squad.count,maxCount:g.maxCount,kills:g.enemies.killCount,maxAlive,bulletsPeak:shots,trace,waves:g.pacing.summary(),error:document.getElementById('error-display')?.textContent||'',timingPass:tick*DT>=180&&tick*DT<=240};
   },level);
   results.push(r);console.log('L'+r.level,r.state,r.duration+'s','count='+r.count,'kills='+r.kills,'timing='+r.timingPass);
   fs.writeFileSync(path.join(ROOT,'docs/v42-simulation.json'),JSON.stringify({seed:420,dt:1/30,actualEngine:true,forcedWins:false,passed:results.length===10&&results.every(x=>x.won&&x.timingPass&&!x.error),results},null,2));
  }
 }finally{await h.close();}
 if(!results.every(r=>r.won&&r.timingPass&&!r.error)||results.length!==10)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
