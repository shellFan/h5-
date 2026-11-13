const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
global.THREE=require('../../js/vendor/three.min.js');
vm.runInThisContext(['config','utils','effects'].map(n=>fs.readFileSync('js/'+n+'.js','utf8')).join('\n')+'\nglobalThis.Fx=Effects;globalThis.C=CONFIG;');
const scene=new THREE.Scene(),fx=new Fx(scene);
assert(fx.particleMesh&&fx.particleMesh.isInstancedMesh,'Particles must batch into one draw, not one Mesh per spark');
for(let i=0;i<20;i++)fx.burst(0,.5,0,0xffcc55,30,3,.4);
fx.update(.1);assert(fx.particles.length<=C.PARTICLE_MAX);assert.equal(fx.particleMesh.count,fx.particles.length);
fx.update(2);assert.equal(fx.particles.length,0);assert.equal(fx.pool.length,C.PARTICLE_MAX);
console.log('PASS V42 batched particle capacity and pool return');
