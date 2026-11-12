// Smoke the emitted deployment, blocking every external HTTP resource.
const {chromium}=require('playwright-core');
const {spawn}=require('child_process');
const path=require('path');
const fs=require('fs');
const assert=require('assert/strict');
const root=path.join(__dirname,'../../dist/h5');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/<script[^>]*\bsrc=["']([^"']+)/g)) {
  const p=m[1].split('?')[0];
  assert(!/^https?:/.test(p),'No external script');
  assert(fs.existsSync(path.join(root,p)),'Build missing '+p);
}
async function main(){
 const server=spawn(process.execPath,[path.resolve(__dirname,'../../tools/server.js')],{cwd:root,env:{...process.env,PORT:'8244'},stdio:'ignore',windowsHide:true});
 let browser;
 try{
  for(let i=0;i<50;i++){try{if((await fetch('http://localhost:8244')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];const external=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{if(/^https?:/.test(r.request().url())&&!r.request().url().startsWith('http://localhost:8244/')){external.push(r.request().url());return r.abort();}return r.continue();});
  await page.goto('http://localhost:8244');
  await page.waitForFunction(()=>!!window.__game,null,{timeout:15000});
  await page.click('#btn-start');await page.waitForTimeout(400);
  const state=await page.evaluate(()=>({state:__game.state,count:__game.squad.count,model:SoldierModelLoader.status}));
  assert.equal(state.state,'playing');assert.equal(state.model,'loaded');assert(state.count>0);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('PASS built H5 deployment: every script exists, local GLBs loaded, game starts without external requests');
 }finally{if(browser)await browser.close();server.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
