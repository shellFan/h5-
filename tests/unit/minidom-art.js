'use strict';

const assert = require('assert/strict');
const { VElement } = require('../../tools/wechat-lib/minidom');

function element(tag, id, classes) {
    const node = new VElement(tag);
    if (id) node.id = id;
    if (classes) node.className = classes;
    return node;
}

const body = element('body');
const game = element('div', 'game-container', 'art-military');
const start = element('div', 'start-screen');
const directPanel = element('div', null, 'title-panel primary');
const hero = element('div', null, 'art-home-hero');
const title = element('h1', null, 'game-title');
const wrapper = element('section', null, 'wrapper');
const nestedPanel = element('div', null, 'title-panel nested');
const win = element('div', 'win-screen');
const winPanel = element('div', null, 'title-panel result');

body.appendChild(game);
game.appendChild(start);
start.appendChild(directPanel);
directPanel.appendChild(hero);
hero.appendChild(title);
start.appendChild(wrapper);
wrapper.appendChild(nestedPanel);
game.appendChild(win);
win.appendChild(winPanel);

assert.equal(body.querySelector('#start-screen .title-panel'), directPanel,
    'descendant selector finds the first matching panel');
assert.equal(body.querySelector('#start-screen .title-panel .game-title'), title,
    'multi-level descendant selector follows the ancestor chain');
assert.equal(body.querySelector('#start-screen > .title-panel'), directPanel,
    'child combinator finds a direct child');
assert.deepEqual(body.querySelectorAll('#start-screen > .title-panel'), [directPanel],
    'child combinator excludes nested descendants');
assert.deepEqual(body.querySelectorAll('#game-container .title-panel'), [directPanel, nestedPanel, winPanel],
    'querySelectorAll preserves document order across descendants');
assert.equal(body.querySelector('#start-screen .title-panel.primary'), directPanel,
    'compound class matching remains supported inside a selector chain');
assert.equal(body.querySelector('#win-screen > .title-panel.result'), winPanel,
    'id, child combinator and compound class work together');
assert.equal(start.querySelector('#win-screen .title-panel'), null,
    'queries stay scoped to the receiver subtree');

console.log('PASS minidom art selectors: descendant and child combinators preserve scoped DOM order');
