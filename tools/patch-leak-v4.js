// V4.0 泄漏修复: ①门几何体未dispose ②合并僵尸共享几何被误dispose(导致GPU反复重传)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// ---- gates.js: clear() 补几何体释放 ----
var gf = path.join(ROOT, 'js', 'gates.js');
var g = fs.readFileSync(gf, 'utf8').replace(/\r\n/g, '\n');
const oldClear = [
    "    clear() {",
    "        for (const g of this.gates) {",
    "            this.scene.remove(g.model);",
    "            // 释放纹理",
    "            g.model.traverse(function(obj) {",
    "                if (obj.material && obj.material.map) obj.material.map.dispose();",
    "                if (obj.material) obj.material.dispose();",
    "            });",
    "        }",
    "        this.gates = [];",
    "    }"
].join('\n');
const newClear = [
    "    clear() {",
    "        for (const g of this.gates) {",
    "            this.scene.remove(g.model);",
    "            // V4.0: 释放纹理+材质+几何体(每局重建, 不释放会累积GPU缓冲)",
    "            g.model.traverse(function(obj) {",
    "                if (obj.geometry) obj.geometry.dispose();",
    "                if (obj.material && obj.material.map) obj.material.map.dispose();",
    "                if (obj.material) obj.material.dispose();",
    "            });",
    "        }",
    "        this.gates = [];",
    "    }"
].join('\n');
if (g.indexOf(oldClear) < 0) { console.error('gates clear pattern not found'); process.exit(1); }
g = g.replace(oldClear, newClear);
// refreshAhead 中同样补几何体释放
const oldRr = [
    "            this.scene.remove(g.model);",
    "            g.model.traverse(function(obj) {",
    "                if (obj.material && obj.material.map) obj.material.map.dispose();",
    "                if (obj.material) obj.material.dispose();",
    "            });"
].join('\n');
const newRr = [
    "            this.scene.remove(g.model);",
    "            g.model.traverse(function(obj) {",
    "                if (obj.geometry) obj.geometry.dispose();",
    "                if (obj.material && obj.material.map) obj.material.map.dispose();",
    "                if (obj.material) obj.material.dispose();",
    "            });"
].join('\n');
if (g.indexOf(oldRr) < 0) { console.error('gates refreshAhead pattern not found'); process.exit(1); }
g = g.replace(oldRr, newRr);
fs.writeFileSync(gf, g);
console.log('gates.js: geometry dispose added');

// ---- enemies.js: 合并僵尸共享几何不dispose(缓存复用), Boss/精英独立模型照常释放 ----
var ef = path.join(ROOT, 'js', 'enemies.js');
var e = fs.readFileSync(ef, 'utf8').replace(/\r\n/g, '\n');
const oldD = [
    "    destroy(scene) {",
    "        scene.remove(this.model);",
    "        this.model.traverse(function(obj) {",
    "            if (obj.geometry) obj.geometry.dispose();",
    "            if (obj.material) obj.material.dispose();",
    "        });",
    "    }"
].join('\n');
const newD = [
    "    destroy(scene) {",
    "        scene.remove(this.model);",
    "        var merged = !!this.model.userData.merged; // V4.0: 合并僵尸几何为全类型共享缓存, 不可dispose",
    "        this.model.traverse(function(obj) {",
    "            if (obj.geometry && !merged) obj.geometry.dispose();",
    "            if (obj.material && !merged) obj.material.dispose();",
    "        });",
    "    }"
].join('\n');
if (e.indexOf(oldD) < 0) { console.error('enemies destroy pattern not found'); process.exit(1); }
e = e.replace(oldD, newD);
fs.writeFileSync(ef, e);
console.log('enemies.js: shared merged geometry protected');
