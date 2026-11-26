// V16.3 战斗特效生命周期、对象池、预警边界、独立怪物 GLB 契约与新存档解锁回归测试
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
let pass = 0, fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  ✓ ' + msg); }
    else { fail++; console.error('  ✗ FAIL: ' + msg); }
}

function parseGLB(filePath) {
    const buf = fs.readFileSync(filePath);
    if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error('Invalid GLB magic: ' + filePath);
    const jsonLen = buf.readUInt32LE(12);
    const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
    return { size: buf.length, gltf };
}

console.log('\n■ V16.3 独立雕塑怪物 GLB 资产契约 (spitter / thrower / flanker)');
const REQUIRED_PARTS = ['Body', 'Head', 'Arms', 'LegL', 'LegR'];
for (const key of ['spitter', 'thrower', 'flanker']) {
    for (const suffix of ['', '-lod']) {
        const p = path.join(ROOT, 'assets', 'game', 'models', 'zombies', key, key + suffix + '.glb');
        const exists = fs.existsSync(p);
        assert(exists, `${key}${suffix}.glb 存在`);
        if (!exists) continue;
        const { size, gltf } = parseGLB(p);
        const nodeNames = (gltf.nodes || []).map(n => n.name);
        const hasAllParts = REQUIRED_PARTS.every(pt => nodeNames.includes(pt));
        const hasTwoImgs = (gltf.images || []).length >= 2;
        const singleMat = (gltf.materials || []).length === 1;
        assert(hasAllParts && hasTwoImgs && singleMat && size < 450 * 1024,
            `${key}${suffix}.glb 满足5部件+单共享PBR材质+2内嵌PNG+体积<450KB (${Math.round(size/1024)}KB)`);
    }
}

console.log('\n■ V16.3 EnemyModelLoader 注册与关键预加载');
const emSrc = fs.readFileSync(path.join(ROOT, 'js/enemy-models.js'), 'utf8');
assert(emSrc.includes("'thrower'") && emSrc.includes("'flanker'") && emSrc.includes("'spitter'"),
    'EnemyModelLoader.KEYS 与 loadCritical 注册了 spitter/thrower/flanker');
assert(emSrc.includes("['spitter','thrower'"), 'spitter 酸液囊与 thrower 引线火花开启自发光');

console.log('\n■ V16.3 炸弹对象池上限、预警边界与清理无泄漏');
const stubObj = () => ({
    position: { x: 0, y: 0, z: 0, set(x,y,z){this.x=x;this.y=y;this.z=z;} },
    rotation: { x: 0, y: 0, z: 0, set(x,y,z){this.x=x;this.y=y;this.z=z;} },
    scale: { x: 1, y: 1, z: 1, set(x,y,z){this.x=x;this.y=y;this.z=z;}, setScalar(s){this.x=this.y=this.z=s;}, multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;} },
    userData: {},
    add() {}, remove() {}, traverse(fn) { fn(this); }, updateMatrix() {}
});
const stubMesh = () => Object.assign(stubObj(), {
    count: 0, frustumCulled: false, renderOrder: 0,
    setMatrixAt() {}, instanceMatrix: { needsUpdate: false }
});
const stubGeo = () => ({
    attributes: { position: { count: 4, array: new Float32Array(12) }, normal: { array: new Float32Array(12) }, uv: { array: new Float32Array(8) } },
    index: { count: 6, array: new Uint16Array(6) },
    translate() { return this; }, rotateX() { return this; }, rotateZ() { return this; },
    setAttribute() {}, setIndex() {}
});
const ctx = {
    console, Math, Date, Object, Array, Number, String, Boolean, JSON, Float32Array, Uint16Array, Uint32Array,
    clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
    randRange: (a, b) => (a + b) * 0.5,
    easeOutBack: (t) => t,
    BattleKinematics: { enemyApproachZ: (z, spd, dt) => z + spd * dt },
    colorize: (g) => g,
    mergeGeometries: () => stubGeo(),
    EnemyArmyRenderer: class { update() {} clear() {} },
    THREE: {
        Group: class { constructor() { return stubObj(); } },
        Object3D: class { constructor() { return stubObj(); } },
        InstancedMesh: class { constructor() { return stubMesh(); } },
        SphereGeometry: class { constructor() { return stubGeo(); } },
        CylinderGeometry: class { constructor() { return stubGeo(); } },
        OctahedronGeometry: class { constructor() { return stubGeo(); } },
        CircleGeometry: class { constructor() { return stubGeo(); } },
        RingGeometry: class { constructor() { return stubGeo(); } },
        BufferGeometry: class { constructor() { return stubGeo(); } },
        BufferAttribute: class { constructor(a) { this.array = a; this.count = a.length / 3; } },
        MeshBasicMaterial: class {},
        MeshLambertMaterial: class {},
        Matrix4: class { compose() {} makeScale() {} setPosition() {} },
        Quaternion: class { setFromEuler() {} },
        Euler: class { set() {} },
        Vector3: class { set() { return this; } },
        Color: class { constructor() { this.r=1; this.g=1; this.b=1; } },
        DoubleSide: 2
    }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/enemies.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/upgrades.js'), 'utf8'), ctx);

const sceneStub = { add() {}, remove() {} };
const effectsStub = { burst() {}, shockwave() {}, boom() {}, explosion() {}, impact() {}, splat() {}, spawnShards() {}, floatText() {} };
const EnemyManager = vm.runInContext('EnemyManager', ctx);
const em = new EnemyManager(sceneStub, effectsStub);
const initBombPool = em._bombPool.length;
em.spawnBomb(0, 1, -10, -5.0, -2);
em.spawnBomb(0, 1, -10, 5.0, -2);
em.spawnBomb(0, 1, -10, 0, -2);
em.spawnBomb(0, 1, -10, 1, -2); // should be ignored (max 3)
assert(em.bombs.length === 3, '投弹怪场上炸弹严格限制最多 3 枚');
assert(em.bombs[0].tx === -3.1 && em.bombs[1].tx === 3.1, '炸弹目标落点严格钳制在道路内 [-3.1, 3.1]');
assert(em.bombs[0].dur === 1.3, '炸弹地面预警时间严格为 1.3 秒');

// Simulate 1.35s explosion & pool recycling
let killedByBomb = 0;
const mockSquad = { x: 0, z: -2, alive: true, count: 20, getHalfWidth: () => 0.8, killSoldiers(n) { killedByBomb += n; } };
em.update(1.35, 1.35, mockSquad);
assert(em.bombs.length === 0 && em._bombPool.length === initBombPool, '炸弹引爆后 100% 归还对象池无泄漏');
assert(killedByBomb > 0 && killedByBomb <= 3, '单枚命中炸弹最多伤害 3 名士兵 (实际=' + killedByBomb + ')');

console.log('\n■ V16.3 路边伏击怪 flanker 翻栏完整生命周期');
const fl = em.spawnEnemy('flanker', -5.2, -10);
assert(fl._vaulting === true && fl.x === -5.2, 'flanker 初始于护栏外侧 x=-5.2 且处于翻栏状态');
fl.update(0.36, 0.36, mockSquad, em, effectsStub);
assert(fl._vaulting === true && fl._liftY > 1.0, 'flanker 翻栏中段明显腾空跃过护栏 (_liftY=' + fl._liftY.toFixed(2) + ')');
fl.update(0.40, 0.76, mockSquad, em, effectsStub);
assert(fl._vaulting === false && fl._liftY === 0 && Math.abs(fl.x) <= 3.0, 'flanker 落地后归零浮空高度并进入道路内冲锋');

console.log('\n■ V16.3 正式新存档解锁顺序与关卡出怪洁净性');
const LEVELS = vm.runInContext('LEVELS', ctx);
const l1Wave1Types = LEVELS[0].segments.filter(s => s.type === 'wave')[0].enemies.map(e => e.type);
const l1AllTypes = new Set(LEVELS[0].segments.filter(s => s.type === 'wave').flatMap(s => s.enemies.map(e => e.type)));
assert(l1Wave1Types.every(t => t === 'normal' || t === 'fast'), 'L1 首波仅出普通/快速怪, 新手平滑上手');
assert(!l1AllTypes.has('thrower') && !l1AllTypes.has('spitter'), 'L1 全关不提前刷出 thrower/spitter (严格留在 L2+)');

const UDEFS = vm.runInContext('UPGRADE_DEFS', ctx);
const freshProfile = { coins: 0, data: { upgrades: {} }, spend: () => false, save: () => {} };
assert(ctx.UpgradeShop.levelOf(freshProfile, 'skill_tornado') === 0, '新存档龙卷风初始 Lv.0 未解锁');
assert(UDEFS.skill_tornado.levels[0] === 300 && UDEFS.skill_tornado.levels[4] === 1500, '龙卷风 5 级金币阶梯 [300..1500] 锁定不变');

console.log('\n======================');
console.log('V16.3 特效/资产/边界测试: 通过 ' + pass + ' / 失败 ' + fail);
if (fail > 0) process.exit(1);
