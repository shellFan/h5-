const assert = require('assert/strict');
const fs = require('fs'), vm = require('vm');
const context = vm.createContext({ console, setTimeout, clearTimeout, setInterval, clearInterval });
for(const file of ['html-parser','css-parser','minidom']) vm.runInContext(fs.readFileSync('tools/wechat-lib/'+file+'.js','utf8'),context);
const draws=[], images=[];
const ctx = new Proxy({measureText:t=>({width:String(t).length*8}),drawImage:(...args)=>draws.push(args)}, {get:(obj,key)=>key in obj?obj[key]:(()=>{})});
const runtime=context.MiniDOM.createRuntime({width:390,height:844,dpr:1,
    domSpec:{tag:'body',attrs:{},children:[{tag:'img',attrs:{id:'initial',src:'initial.png'},children:[]},{tag:'div',attrs:{id:'dynamic'},children:[]}]},
    cssTexts:['body {width:390px;height:844px} img {width:64px}'],
    createCanvas:()=>({getContext:()=>ctx}),
    createImage:()=>{const image={width:128,height:64};Object.defineProperty(image,'src',{get(){return this._src},set(v){this._src=v;images.push(this);}});return image;}
});
runtime.tick(0);
assert.equal(images.length,1,'initial parsed img requests its source');
images[0].onload();runtime.tick(16);
const initial=runtime.document.getElementById('initial');
assert.equal(initial._imgState,'loaded');
assert.equal(initial._box.h,32,'width-only images preserve their natural aspect ratio');
assert(draws.some(args=>args[0]===images[0]),'decoded image is painted');
runtime.document.getElementById('dynamic').innerHTML='<img id="inserted" src="dynamic.png">';
runtime.tick(32);assert.equal(images.length,2,'innerHTML img requests its source');
images[1].onload();runtime.tick(48);runtime.tick(64);
assert.equal(images.length,2,'repeated ticks do not restart image downloads');
const inserted=runtime.document.getElementById('inserted');
inserted.setAttribute('src','replacement.png');assert.equal(images.length,3);
images[2].onerror();runtime.tick(80);assert.equal(inserted._imgState,'failed');
console.log('PASS native parsed images: initial/dynamic decode, aspect ratio, draw, cache and failure');
