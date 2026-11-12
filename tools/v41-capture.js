// Screenshots of the real Game scene/renderer. Inspection only changes camera and simulation pose.
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs/screenshots/v41');
const PORT = 8241;
async function main() {
  fs.mkdirSync(OUT, {recursive:true});
  const server = spawn(process.execPath, ['tools/server.js'], {cwd:ROOT,env:{...process.env,PORT:String(PORT)},stdio:'ignore'});
  let browser;
  try {
    for (let i=0;i<50;i++) {
      try { if ((await fetch('http://localhost:'+PORT)).ok) break; } catch {}
      await new Promise(r=>setTimeout(r,100));
    }
    browser = await chromium.launch({channel:'msedge',headless:true});
    const page = await browser.newPage({viewport:{width:780,height:1000},deviceScaleFactor:1});
    page.on('pageerror',e=>console.error('PAGE',e.message));
    await page.addInitScript(()=>{let seed=410;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};});
    await page.goto('http://localhost:'+PORT);
    await page.waitForFunction(()=>!!window.__game,null,{timeout:15000});
    await page.click('#btn-start');
    await page.evaluate(()=>{
      const g=window.__game;g.paused=true;g.squad.reset(1);g.squad.z=0;
      for(let i=0;i<120;i++)g.squad.update(1/60,1,0);
      g.world.scene.fog=null;
      // Hide gameplay overlays for asset inspection; keep the real street, lighting and renderer.
      document.querySelectorAll('#hud,.start-screen,#art-debug-panel').forEach(n=>n.style.visibility='hidden');
    });
    for (const [name,position] of [['front',[0,1.23,-2.85]],['back',[.75,1.4,2.7]],['side',[2.7,1.15,-.02]],['shoot',[1.7,1.4,-2.5]]]) {
      await page.evaluate(({name,position})=>{
        const g=window.__game;
        const s=g.squad.soldiers[0];s.rotY=0;s.x=0;s.z=0;
        if(g.squad.setAnimationState)g.squad.setAnimationState('Idle');
        g.squad.update(1/60,2,0);
        if(name==='shoot') {
          g.squad.getShootPositions(1);
          g.squad.update(.025,2.025,0);
          if(g.combat._fire)g.combat._fire(g.squad.getRandomSoldierPos(),1,null,false);
        }
        g.world.camera.position.set(...position);g.world.camera.lookAt(0,.70,-.05);
        g.world.camera.updateProjectionMatrix();g.world.render();
      },{name,position});
      await page.screenshot({path:path.join(OUT,'soldier-'+name+'.png')});
      console.log('captured soldier-'+name);
    }
    if(process.argv.includes('--single')) return;
    await page.close();
    for(const [width,height] of [[360,800],[390,844],[430,932],[1080,1920]]) {
      const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:true});
      await p.addInitScript(()=>{let seed=410;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};});
      await p.goto('http://localhost:'+PORT);
      await p.waitForFunction(()=>!!window.__game);
      await p.click('#btn-start');
      for(const n of [1,12,31,100,300,500]) {
        await p.evaluate(n=>{
          const g=window.__game;g.paused=true;g.squad.reset(n);
          for(let i=0;i<180;i++){
            g.squad.update(1/60,3+i/60,0);
            g.world.updateCamera(0,0,1/60,n);
          }
          g.squad.renderer.update(0,4,g.squad,true,.1,0);
          g._updateUI();g.world.render();
        },n);
        await p.screenshot({path:path.join(OUT,`${width}-squad-${n}.png`)});
      }
      if(width===390) {
        await p.evaluate(()=>{const g=window.__game;g.start();g.squad.setCount(31);g.squad.invulnT=5;g.enemies.spawnEnemy('normal',0,-16.5,500);});
        await p.waitForTimeout(1000);
        await p.screenshot({path:path.join(OUT,'390-live-combat.png')});
      }
      await p.close();
      console.log('captured squads '+width+'x'+height);
    }
  } finally { if(browser)await browser.close();server.kill(); }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
