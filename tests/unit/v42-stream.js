const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
vm.runInThisContext(['config','utils','movement','pacing'].map(n=>fs.readFileSync('js/'+n+'.js','utf8')).join('\n')+'\nglobalThis.C=CONFIG;globalThis.L=LEVELS;globalThis.P=GamePacingController;');
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/v42-original-waves.json','utf8'));
assert.deepEqual(L.map(l=>({totalZ:l.totalZ,waves:l.segments.filter(s=>s.type==='wave').map(s=>({z:s.z,enemies:s.enemies}))})),baseline,'All original enemies, types and road positions must be retained');
function run(dt){
 let seed=420;const old=Math.random;Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const p=new P();p.loadFromLevel({segments:[{type:'wave',z:-20,enemies:[{type:'normal',count:24}]}]},9);
 let time=0,events=[];p.aliveCountFn=()=>0;p.spawnFn=()=>{events.push(time);return {};};
 for(;time<30;time+=dt){const before=events.length;p.update(dt,{z:-30});assert(events.length-before<=1,'No instant batch on catch-up frame');if(p.waves[0].state==='done')break;}
 Math.random=old;assert.equal(events.length,24);assert(events[0]>=C.PACING.firstContactGrace-.01);
 for(let i=1;i<events.length;i++)assert(events[i]-events[i-1]>=C.PACING.streamInterval-dt-.0001,'Preparation/backpressure must not bank catch-up credit for an instant stream');
 return events;
}
const a=run(1/30),b=run(1/120);assert(Math.abs(a.at(-1)-b.at(-1))<.2,'Stream pacing stable across frame rates');run(.5);
const p=new P();p.loadFromLevel({segments:[{type:'wave',z:-20,enemies:[{type:'normal',count:24}]}]},0);p.aliveCountFn=()=>99;for(let i=0;i<500;i++)p.update(.05,{z:-30});assert.equal(p.waves[0].queue.length+p.waves[0].pending.length,24,'Backpressure must not delete actors');
console.log('PASS V42 exact original waves, streamed emission, prepare gate, FPS and backpressure');
const boss=new P();boss.loadFromLevel({segments:[{type:'boss',z:-100,boss:{hp:100}}]},0);
let spawnZ=null;boss.spawnFn=(t,x,z)=>{spawnZ=z;};boss.update(.01,{z:-99});assert(boss.frontierStopZ()!==null,'Hold forward motion through warning');boss.update(3,{z:-99});assert(spawnZ<=-110,'Even late activation must not spawn a boss on top of the player');
