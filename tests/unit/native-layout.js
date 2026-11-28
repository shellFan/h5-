const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const context=vm.createContext({console,setTimeout,clearTimeout,setInterval,clearInterval});
for(const file of ['html-parser','css-parser','minidom'])vm.runInContext(fs.readFileSync('tools/wechat-lib/'+file+'.js','utf8'),context);
const ctx=new Proxy({measureText:t=>({width:String(t).length*8})},{get:(o,k)=>k in o?o[k]:(()=>{})});
const children=Array.from({length:5},(_,i)=>({tag:'button',attrs:{id:'tab'+i},text:'导航'}));
const runtime=context.MiniDOM.createRuntime({width:390,height:844,dpr:1,createCanvas:()=>({getContext:()=>ctx}),createImage:()=>({}),
 domSpec:{tag:'body',attrs:{},children:[{tag:'div',attrs:{id:'screen'},children:[{tag:'div',attrs:{id:'column'},children:[{tag:'span',attrs:{id:'label'},text:'地图'}]},{tag:'div',attrs:{id:'grid'},children}]}]},
 cssTexts:['body{width:390px;height:844px} #screen{position:absolute;left:0;right:0;top:0;bottom:0} #column{display:flex;flex-direction:column;width:100px;height:80px} #grid{display:grid;width:250px;grid-template-columns:repeat(5,1fr)} button{height:44px}']});
runtime.relayout();let failures=0;
function check(name,fn){try{fn();console.log('PASS '+name)}catch(e){failures++;console.error('FAIL '+name+': '+e.message)}}
check('paired vertical insets stretch an auto-height absolute screen',()=>assert.equal(runtime.document.getElementById('screen')._box.h,844));
check('auto-size column flex labels retain positive text height',()=>assert(runtime.document.getElementById('label')._box.h>0));
check('repeat grid creates five equal columns on one row',()=>{const boxes=children.map((_,i)=>runtime.document.getElementById('tab'+i)._box);assert.equal(new Set(boxes.map(b=>b.y)).size,1);for(const b of boxes)assert.equal(b.w,50)});
process.exitCode=failures?1:0;
