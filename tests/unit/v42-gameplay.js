const vm=require('vm'),fs=require('fs'),assert=require('assert/strict');
vm.runInThisContext(['config','utils','movement','pacing'].map(n=>fs.readFileSync('js/'+n+'.js','utf8')).join('\n')+'\nglobalThis.C=CONFIG;globalThis.L=LEVELS;globalThis.M=MovementMath;globalThis.P=GamePacingController;');
assert.deepEqual(L.map(l=>l.totalZ),[-603,-621,-657,-657,-666,-675,-693,-702,-711,-720],'Do not stretch existing levels again');
function follow(hz,seconds){let x=0;for(let t=0;t<seconds-1e-6;t+=1/hz)x=damp(x,2,M.followLambda(),1/hz);return x;}
assert(follow(60,.15)>1.1 && follow(60,.15)<1.5,'.15s must behave as a time constant, not a nearly instantaneous snap');
assert(follow(60,.45)>1.88&&follow(60,.45)<1.96,'.45s reaches about95%');
assert(Math.abs(follow(30,.3)-follow(120,.3))<.025,'Frame-independent follow');
const p=new P();p.loadFromLevel({segments:[{type:'wave',z:-20,enemies:[{type:'normal',count:2}]},{type:'wave',z:-21,enemies:[{type:'fast',count:2}]}]},0);
let spawned=[];p.aliveCountFn=()=>0;p.spawnFn=(...a)=>spawned.push(a);
p.update(.1,{z:-30});assert.equal(p.waves.filter(w=>w.state==='spawning').length,1,'Only one wave may activate at a time');
assert.equal(spawned.length,0,'Preparation must happen before spawning');
p.clear();assert.equal(p.waves.length,0,'Reset clears queues');
assert(C.SQUAD_SPEED<=3.6&&C.SQUAD_SPEED>=3,'Forward pace reduced without idle padding');
assert(C.PACING.bossWarningTime>=2,'Boss telegraph lasts at least two seconds');
console.log('PASS V42 level paths, input tau, frame rates, single-wave admission, reset and pace');
