// Reproducible functional release gate. Visual/performance runs are separate.
const {spawnSync,execFileSync}=require('child_process');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const steps=[
 ['unit','tests/unit/run.js'],
 ['GLB binary/material contract','tests/unit/soldier-asset.js'],
 ['rigid animation contracts','tests/unit/soldier-runtime.js'],
 ['H5 build','tools/build-h5.js'],
 ['existing Playwright E2E','tests/e2e/run.js'],
 ['soldier Playwright E2E','tests/e2e/soldier.js'],
 ['built deployment smoke','tests/e2e/h5-build.js']
];
const results=[];
for(const [name,file] of steps){
 console.log('\nRunning '+name);
 const start=Date.now();
 const r=spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:8*1024*1024});
 process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');
 results.push({name,command:'node '+file,exitCode:r.status,durationMs:Date.now()-start,output:(r.stdout||'')+(r.stderr||''),error:r.error?String(r.error):null});
 if(r.status!==0)break;
}
const pass=results.length===steps.length&&results.every(r=>r.exitCode===0);
const report={generatedAt:new Date().toISOString(),revision:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),passed:pass,results};
fs.writeFileSync(path.join(root,'docs/v41-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log('\nV4.1 verification '+(pass?'PASS':'FAIL')+' ('+results.length+'/'+steps.length+' commands)');
process.exitCode=pass?0:1;
