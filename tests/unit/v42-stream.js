const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
vm.runInThisContext(['config','utils','movement','pacing'].map(n=>fs.readFileSync('js/'+n+'.js','utf8')).join('\n')+'\nglobalThis.C=CONFIG;globalThis.L=LEVELS;globalThis.P=GamePacingController;');
// V5.1: fixture 更新为五关重做后的波次数据(保留'波次不可静默删减'守护意图)
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/v51-waves.json','utf8'));
assert.deepEqual(L.map(l=>({totalZ:l.totalZ,waves:l.segments.filter(s=>s.type==='wave').map(s=>({z:s.z,enemies:s.enemies}))})),baseline,'V5.1 five-level waves: all enemies, types and positions retained');
function run(dt){
 let seed=420;const old=Math.random;Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const p=new P();p.loadFromLevel({segments:[{type:'wave',z:-20,enemies:[{type:'normal',count:24}]}]},9);
 let time=0,events=[];p.aliveCountFn=()=>0;p.spawnFn=()=>{events.push(time);return {};};
 for(;time<30;time+=dt){const before=events.length;p.update(dt,{z:-30});assert(events.length-before<=3,'No whole-batch dump on catch-up frame (burst cap 3/frame)');if(p.waves[0].state==='done')break;}
 Math.random=old;assert.equal(events.length,24);
 // V5.1.1 burst契约: 单步≤3只已在采集时断言; 整批不得瞬间涌出(24只需≥0.1s展开)
 assert(events.length>=24,'wave fully emitted');
 assert(events[events.length-1]-events[0]>=0.099,'A batch must unfold over time, never dumped instantly');
 assert(events[0]>=C.PACING.firstContactGrace-.01,'First emission after prepare gate');
 return events;
}
const a=run(1/30),b=run(1/120);assert(Math.abs(a.at(-1)-b.at(-1))<.2,'Stream pacing stable across frame rates');run(.5);
const p=new P();p.loadFromLevel({segments:[{type:'wave',z:-20,enemies:[{type:'normal',count:24}]}]},0);p.aliveCountFn=()=>99;for(let i=0;i<500;i++)p.update(.05,{z:-30});assert.equal(p.waves[0].queue.length+p.waves[0].pending.length,24,'Backpressure must not delete actors');
console.log('PASS V51 five-level waves, streamed emission, prepare gate, FPS and backpressure');
const boss=new P();boss.loadFromLevel({segments:[{type:'boss',z:-100,boss:{hp:100}}]},0);
let spawnZ=null;boss.spawnFn=(t,x,z)=>{spawnZ=z;};boss.update(.01,{z:-99});assert(boss.frontierStopZ()!==null,'Hold forward motion through warning');boss.update(3,{z:-99});assert(spawnZ<=-110,'Even late activation must not spawn a boss on top of the player');
