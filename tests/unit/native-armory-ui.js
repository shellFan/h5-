// Exercise real UI renderers against the native MiniDOM, without a browser.
const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
const context = vm.createContext({ console, setTimeout, clearTimeout });
for (const file of ['tools/wechat-lib/html-parser.js','tools/wechat-lib/css-parser.js','tools/wechat-lib/minidom.js']) vm.runInContext(fs.readFileSync(file,'utf8'), context);
const VElement = context.MiniDOM.VElement;
const body = new VElement('body');
const doc = {
    createElement: tag => new VElement(tag),
    getElementById: id => body.querySelector('#' + id),
    querySelector: selector => body.querySelector(selector),
    querySelectorAll: selector => body.querySelectorAll(selector)
};
context.document = doc;
for (const file of ['js/weapons.js','js/growth.js','js/ui-v60.js','js/art-ui.js']) vm.runInContext(fs.readFileSync(file,'utf8'), context);
body.innerHTML = '<div id="v60-armory-page"><div id="v118-armory-hero"></div><div id="v60-armory-list"></div></div>';
const profile = { data: { weapon:'rifle', weaponLevel:1, unlockedLevel:10, tech:{pierce:0}, weaponAffix:{name:'射速 +8%', k:'rate',v:.08} }, coins:10000, save(){} };
const game = { profile, _sfx(){}, _refreshCoinDisplays(){} };
context.V60UI.renderArmory(game);
let failures = 0;
function check(name, fn) { try { fn(); console.log('PASS '+name); } catch(e) { failures++; console.error('FAIL '+name+': '+e.message); } }
check('native armory retains all eight element tiles and nine art owners', () => {
    assert.equal(body.querySelectorAll('.v15-weapon-tile').length,8);
    assert.equal(body.querySelectorAll('.v118-weapon-art').length,9);
});
check('native visible back control closes the armory', () => {
    const back=body.querySelector('.v15-page-back');
    assert.equal(typeof back.onclick,'function');
    back.click(); assert(body.querySelector('#v60-armory-page').classList.contains('hidden'));
});
check('armory identifies the active affix', () => {
    assert(body.querySelector('#v118-armory-hero').textContent.includes('词条：射速 +8%'));
});
// Independent standalone art fixture ensures crop test is not masked by missing tiles.
const standalone = new VElement('div'); standalone.className='v118-weapon-art';
for(const [k,v] of Object.entries({'data-weapon':'rifle','data-atlas-cols':'4','data-atlas-rows':'2','data-atlas-col':'3','data-atlas-row':'1'})) standalone.setAttribute(k,v);
body.appendChild(standalone); context.ArtUI.decorateWeapons();
check('standalone weapon PNG uses the complete image instead of an atlas crop', () => {
    for(const [k,v] of Object.entries({'data-atlas-cols':'1','data-atlas-rows':'1','data-atlas-col':'0','data-atlas-row':'0'})) assert.equal(standalone.getAttribute(k),v);
});
check('programmatic clicks forward listeners and onclick with bubbling; disabled buttons stay inert', () => {
    const parent = new VElement('div'), button = new VElement('button'); parent.appendChild(button);
    let hits = 0;
    button.addEventListener('click', ev => { assert.equal(ev.target,button); hits++; });
    button.onclick = () => hits++;
    parent.addEventListener('click', () => hits++);
    button.click(); assert.equal(hits,3);
    button.disabled=true; button.click(); assert.equal(hits,3);
});
check('native active skill buttons remain traversable elements', () => {
    const hud = new VElement('div'); hud.id='hud';body.appendChild(hud);
    const source = fs.readFileSync('js/game.js','utf8').split('// 启动 (')[0];
    vm.runInContext(source+'\nglobalThis.TestGame=Game;',context);
    const skills=Object.create(context.TestGame.prototype);
    skills._initActiveSkillBar();
    assert.equal(hud.querySelectorAll('.v15-skill-btn').length,4);
});
check('native training visible back control closes its page', () => {
    const training = new VElement('div'); training.id='v60-train-page';
    training.innerHTML='<div id="v60-train-header"></div>';
    body.appendChild(training); context.V60UI.renderTraining(game);
    training.querySelector('.v15-page-back').click();
    assert(training.classList.contains('hidden'));
});
check('rerendering armory replaces the affix label instead of duplicating it', () => {
    context.V60UI.renderArmory(game); context.V60UI.renderArmory(game);
    assert.equal(body.querySelector('#v118-armory-hero').querySelectorAll('.v15-armory-affix').length,1);
});
check('touch-generated clicks cannot activate disabled controls or their children', () => {
    const disabled = new VElement('button'), icon = new VElement('span');
    disabled.appendChild(icon); disabled.disabled = true;
    let hits=0; disabled.onclick=()=>hits++;
    // dispatchTouch uses _dispatch directly, without calling element.click().
    disabled._dispatch({type:'click'}); icon._dispatch({type:'click'});
    assert.equal(hits,0);
});
process.exitCode=failures?1:0;
