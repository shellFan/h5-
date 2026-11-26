// V4.2: local Blender assets, cached immutable resources and rigid-part batches.
var EnemyModelLoader = class EnemyModelLoader {
    static load(keys) {
        // V11.6: 子集加载+后台续载 — 启动只等关键资源(士兵+normal/fast), 其余模型战斗中后台补齐
        // (_bank 有 normal 回退, 未就绪体格短暂降级不崩溃)
        if (keys === undefined) keys = this.KEYS;
        if (this._data) {
            var missing = keys.filter(function(k) { return !this._data.styles[k]; }, this);
            if (!missing.length) return Promise.resolve(this._data);
            // V12: 续载并发去重 — 同一缺键集合已有在途续载时复用, 防重复加载
            if (this._contPromise && this._contKeys === missing.join(',')) return this._contPromise;
            this._contKeys = missing.join(',');
            // V11.6: 错峰续载 — 逐体型串行+间隔; 战斗中自动拉长间隔(解码不与实时玩法抢主线程)
            var contPromise = missing.reduce(function(p, k) {
                return p.then(function() {
                    var playing = typeof window !== 'undefined' && window.__game && window.__game.state === 'playing';
                    var gap = playing ? 1500 : 400;
                    return new Promise(function(res) { setTimeout(res, gap); })
                        .then(function() { return this._loadKeys([k]); }.bind(this))
                        .then(function(styles) { for (var mk in styles) this._data.styles[mk] = styles[mk]; }.bind(this));
                }.bind(this));
            }.bind(this), Promise.resolve()).then(function() {
                this.status = 'loaded';
                this._contPromise = null; // V12: 在途标记清理
                return this._data;
            }.bind(this)).catch(function(e) { this.status = 'partial_failed'; this._contPromise = null; throw e; }.bind(this));
            this._contPromise = contPromise;
            return contPromise;
        }
        if (this._promise) return this._promise;
        this._bootT0 = performance.now();
        this._promise = this._loadKeys(keys).then(function(styles) {
            this._data = { parts: this.PARTS, styles: styles };
            this.status = keys.length === this.KEYS.length ? 'loaded' : 'partial';
            this.loadMs = performance.now() - this._bootT0;
            return this._data;
        }.bind(this)).catch(function(e) {
            this._promise = null; this._data = null; this.status = 'failed'; throw e;
        }.bind(this));
        return this._promise;
    }
    static loadCritical() {
        // V16.3-P1: 启动关键集包含普通/快速/重装/酸液/投弹/伏击(均为独立Blender雕塑GLB)/精英/Boss
        if (typeof window !== 'undefined' && window.__BootProgress) window.__BootProgress.total = 22;
        return this.load(['normal', 'fast', 'shield', 'spitter', 'thrower', 'flanker', 'bomber', 'elite', 'bruiser', 'overlord']);
    }
    static _loadKeys(keys) {
        var loaded = [], loader = new THREE.GLTFLoader();
        this.status = 'loading';
        if (typeof window !== 'undefined' && window.__BootProgress && keys.length === this.KEYS.length) {
            window.__BootProgress.total = 2 + this.KEYS.length * 2; // 士兵2 + 全部僵尸/Boss
        }
        return Promise.allSettled(keys.flatMap(key => ['hero','lod'].map(lod=>new Promise((resolve,reject)=>{
            var category=['normal','fast','shield','split','spitter','thrower','flanker','elite','bomber'].includes(key)?'zombies':'bosses';
            var url='assets/game/models/'+category+'/'+key+'/'+key+(lod==='lod'?'-lod':'')+'.glb';
            if (typeof Platform === 'undefined' || Platform.id === 'h5') url += '?v=121';
            loader.load(url,g=>{
                try {
                    g.scene.updateMatrixWorld(true);
                    var bank={geometries:{},restMatrices:{},material:null,url:url};
                    for(var name of EnemyModelLoader.PARTS) {
                        var n=g.scene.getObjectByName(name);
                        if(!n || !n.isMesh || !n.geometry.index || !n.geometry.attributes.uv || !n.geometry.attributes.normal || Array.isArray(n.material)) throw Error(key+' invalid part '+name);
                        if(bank.material && bank.material!==n.material) throw Error(key+' material is not shared');
                        bank.material=n.material;
                        bank.geometries[name]=n.geometry;
                        bank.restMatrices[name]=n.matrixWorld.clone();
                    }
                    if(!bank.material.isMeshStandardMaterial || !bank.material.map || !bank.material.roughnessMap) throw Error(key+' missing PBR texture');
                    for(var tex of [bank.material.map,bank.material.roughnessMap]) if(!tex.image || !tex.image.width) throw Error(key+' image did not decode');
                    loaded.push(g.scene);
                    resolve({key,lod,bank});
                }catch(e){SoldierModelLoader._disposeScene(g.scene);reject(e);}
            },undefined,ev=>{
                if (window.__BootProgress && ev) window.__BootProgress.file(url, ev.loaded || 0, ev.total || 1);
            },e=>reject(Error('Enemy asset failed: '+url+' '+(e.message||e))));
        })))).then(results=>{
            var fail=results.find(r=>r.status==='rejected');
            if(fail)throw fail.reason;
            var styles={};
            for(var r of results) {var v=r.value;(styles[v.key]||(styles[v.key]={}))[v.lod]=v.bank;}
            for(var key of keys) {
                var h=styles[key].hero,l=styles[key].lod;
                if(l.material!==h.material)SoldierModelLoader._disposeMaterial(l.material);
                l.material=h.material;
                h.material.onBeforeCompile=function(shader){shader.fragmentShader=shader.fragmentShader.replace('#include <encodings_fragment>','gl_FragColor = LinearTosRGB( gl_FragColor );');};
                if(['spitter','thrower','spitking','hivelord','overlord','bomber'].includes(key)) {
                    var image=h.material.map.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
                    var ctx=canvas.getContext('2d');ctx.drawImage(image._impl || image,0,0);var pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
                    // Blender cell 11 is bottom-origin row 2; PNG/canvas flips it to top-origin row 1.
                    for(var py=0;py<canvas.height;py++)for(var px=0;px<canvas.width;px++) {
                        if(px<canvas.width*.75 || py<canvas.height*.25 || py>=canvas.height*.5) {
                            var off=(py*canvas.width+px)*4;pixels.data[off]=pixels.data[off+1]=pixels.data[off+2]=0;
                        }
                    }
                    ctx.putImageData(pixels,0,0);var emissive=new THREE.CanvasTexture(canvas);emissive.flipY=false;emissive.encoding=THREE.sRGBEncoding;
                    h.material.emissiveMap=emissive;h.material.emissive.setHex(0xffffff);h.material.emissiveIntensity=.65;
                    h.material.onBeforeCompile=function(shader){
                        shader.fragmentShader=shader.fragmentShader.replace('#include <encodings_fragment>','gl_FragColor = LinearTosRGB( gl_FragColor );');
                        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\n#ifdef USE_INSTANCING_COLOR\nfloat glowPower=max(totalEmissiveRadiance.r,max(totalEmissiveRadiance.g,totalEmissiveRadiance.b));\nif(vColor.r>1.25 && vColor.g<.8)totalEmissiveRadiance=vec3(1.,.08,.15)*glowPower;\nelse if(vColor.r>1.05 && vColor.g<.95 && vColor.b>1.15)totalEmissiveRadiance=vec3(.7,.15,1.)*glowPower;\n#endif');
                    };
                }
                h.material.customProgramCacheKey=function(){return 'v121-pbr-display';};
            }
            return styles;
        }).catch(e=>{loaded.forEach(s=>SoldierModelLoader._disposeScene(s));throw e;});
    }
    static get(){return this._data;}
};
EnemyModelLoader.PARTS=['Body','Head','Arms','LegL','LegR'];
EnemyModelLoader.KEYS=['normal','fast','shield','split','spitter','thrower','flanker','elite','bomber','bruiser','bulwark','spitking','hivelord','titan','overlord'];
EnemyModelLoader.status='idle';EnemyModelLoader.loadMs=0;
// V14.2: Boss 造型辨识表 — 每型专属染色/体态/入场特效色(表现层; GLB 资产不动)。
// 解决 hivelord/titan 等实机同形同色不可辨识的问题(逐型实机截图审计)。
EnemyModelLoader.BOSS_PRESENTATION={
    bruiser:  { tint:[1.0,1.0,1.0],    fx:0xFF8A4A },
    bulwark:  { tint:[0.96,1.0,1.08],  fx:0x57CFFF },
    hivelord: { tint:[1.18,1.28,0.72], fx:0xA8E84A,
                bodyScale:[1.30,1.02,1.30], headScale:[0.94,0.92,0.94], attach:'sacs' },
    overlord: { tint:[1.0,1.0,1.0],    fx:0xB26AE8 },
    spitking: { tint:[1.22,1.32,0.68], fx:0xC8E84A },
    titan:    { tint:[0.94,0.98,1.04], fx:0x9AA8B4 }
};
// V14: 感染者外观变体 — 确定性实例染色族(乘法系数, 以e.phase为种子, 同一怪每帧一致)。
// 只做轻微色偏保持贴图质感与全局风格统一; 精英/自爆/冰冻等状态染色在其后覆盖。
// V14.2: 体型 Rig 侧影家族 — 解决"变体只是颜色不同": 壮硕/驼背/瘦长/标准
// (仅躯干/头/臂, 腿不动防悬空; 与附件/染色正交叠加)
EnemyModelLoader.BODY_RIGS={
    standard:{ bodyW:1,    bodyH:1,    pitch:0,    armW:1,    armH:1,    headS:1,    headPitch:0    },
    brute:   { bodyW:1.22, bodyH:1.04, pitch:0.06, armW:1.30, armH:1.04, headS:0.92, headPitch:0.05 },
    huncher: { bodyW:1.06, bodyH:0.90, pitch:0.30, armW:1.02, armH:0.94, headS:1.0,  headPitch:0.34 },
    wiry:    { bodyW:0.88, bodyH:1.10, pitch:0.04, armW:0.82, armH:1.14, headS:0.96, headPitch:0.02 }
};
EnemyModelLoader.VARIANT_TINTS={
    normal:[[1,1,1],[1.08,.96,.88],[.89,1.06,.92],[.96,.98,1.12],[1.02,1.06,.82]],
    fast:  [[1,1,1],[1.12,.92,.84],[.90,1.03,.90],[1.04,1.00,.88]],
    shield:[[1,1,1],[.93,.99,1.13],[1.06,.94,.92]],
    split: [[1,1,1],[1.09,.92,1.06],[.92,1.06,.90]],
    spitter:[[1,1,1],[.88,1.12,.84],[1.07,1.10,.78],[.95,1.04,1.10]]
};

var EnemyArmyRenderer = class EnemyArmyRenderer {
    constructor(scene) {
        this.scene=scene;this.data=EnemyModelLoader.get();this.banks={};
        this._root=new THREE.Matrix4();this._matrix=new THREE.Matrix4();this._pose=new THREE.Matrix4();
        this._pose2=new THREE.Matrix4();this._e=new THREE.Euler();this._color=new THREE.Color();this._counts={};
        this._v14=new THREE.Vector3();
        // V14: 头部/肩部附件库(军盔/便帽/肩甲) — 每附件每(style,lod)一个InstancedMesh, 用到才可见
        this.accBanks={};
        // V15-ART-006: 极清透边缘发光六边形护盾 (常态内部近乎全透明, 绝不抢眼或遮挡Boss装甲与表情!)
        var hexCv = document.createElement('canvas'); hexCv.width = 256; hexCv.height = 128;
        var hctx = hexCv.getContext('2d');
        hctx.clearRect(0, 0, 256, 128);
        var hGrad = hctx.createLinearGradient(0, 0, 0, 128);
        hGrad.addColorStop(0.0, 'rgba(90, 235, 255, 0.28)');
        hGrad.addColorStop(0.22, 'rgba(70, 215, 255, 0.04)');
        hGrad.addColorStop(0.78, 'rgba(70, 215, 255, 0.04)');
        hGrad.addColorStop(1.0, 'rgba(90, 235, 255, 0.28)');
        hctx.fillStyle = hGrad; hctx.fillRect(0, 0, 256, 128);
        hctx.strokeStyle = 'rgba(130, 245, 255, 0.24)';
        hctx.lineWidth = 1.4;
        var hr = 22, dx = hr * 1.5, dy = hr * Math.sqrt(3);
        for (var row = -1; row < 7; row++) {
            for (var col = -1; col < 10; col++) {
                var cx = col * dx, cy = row * dy + (col % 2 ? dy * 0.5 : 0);
                hctx.beginPath();
                for (var si = 0; si < 6; si++) {
                    var ang = si * Math.PI / 3;
                    var px = cx + Math.cos(ang) * (hr - 1.2), py = cy + Math.sin(ang) * (hr - 1.2);
                    if (si === 0) hctx.moveTo(px, py); else hctx.lineTo(px, py);
                }
                hctx.closePath(); hctx.stroke();
            }
        }
        var hexTex = new THREE.CanvasTexture(hexCv);
        hexTex.wrapS = hexTex.wrapT = THREE.RepeatWrapping;
        hexTex.repeat.set(2, 1);
        this.shieldMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,24,14),new THREE.MeshBasicMaterial({map:hexTex,color:0x66E6FF,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),8);
        this.shieldMesh.count=0;this.shieldMesh.frustumCulled=false;this.shieldMesh.renderOrder=4;this.shieldMesh.userData.artSource='V15-ART-006 subtle Fresnel hex energy shield';scene.add(this.shieldMesh);
        this._shieldLocal=new THREE.Matrix4().makeScale(.96,1.10,.96);this._shieldLocal.setPosition(0,.80,0);

        // V15-ART-002: 怪物与Boss柔和接地阴影 (单 InstancedMesh, 彻底消除漂浮感)
        var shCv = document.createElement('canvas'); shCv.width = shCv.height = 64;
        var shCtx = shCv.getContext('2d');
        var shGrad = shCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
        shGrad.addColorStop(0, 'rgba(14, 18, 24, 0.52)');
        shGrad.addColorStop(0.6, 'rgba(14, 18, 24, 0.28)');
        shGrad.addColorStop(1, 'rgba(14, 18, 24, 0)');
        shCtx.fillStyle = shGrad; shCtx.fillRect(0, 0, 64, 64);
        var shPlane = new THREE.PlaneGeometry(1, 1); shPlane.rotateX(-Math.PI * 0.5);
        this.shadowMesh = new THREE.InstancedMesh(shPlane, new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(shCv), transparent: true, depthWrite: false
        }), 448);
        this.shadowMesh.count = 0; this.shadowMesh.frustumCulled = false; this.shadowMesh.renderOrder = 1;
        this.shadowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(this.shadowMesh);
    }
    /** V14+V15: 怪物/Boss附件几何(程序化共享顶点色材质) */
    static _accGeometry(name) {
        if (name === 'sacs' || name === 'horns' || name === 'plates' || name === 'ironfist' || name === 'bossGauntlets' || name === 'bossHorns') return EnemyArmyRenderer._bossAccGeometry(name);
        if (EnemyArmyRenderer._accGeos && EnemyArmyRenderer._accGeos[name]) return EnemyArmyRenderer._accGeos[name];
        if (!EnemyArmyRenderer._accGeos) EnemyArmyRenderer._accGeos={};
        var geos=[], mat;
        if (name === 'monsterHorns') {
            // V15: 紫色卡通怪兽标志性双角 + 尖耳 (取代普通方块僵尸感)
            geos.push(colorize(new THREE.ConeGeometry(0.068, 0.24, 7), 0xE6D8F5).rotateZ(0.46).translate(-0.15, 0.16, 0.02));
            geos.push(colorize(new THREE.ConeGeometry(0.068, 0.24, 7), 0xE6D8F5).rotateZ(-0.46).translate(0.15, 0.16, 0.02));
            geos.push(colorize(new THREE.ConeGeometry(0.052, 0.16, 6), 0x6A2CA8).rotateZ(1.15).translate(-0.22, -0.02, 0));
            geos.push(colorize(new THREE.ConeGeometry(0.052, 0.16, 6), 0x6A2CA8).rotateZ(-1.15).translate(0.22, -0.02, 0));
            mat = { color: 0xFFFFFF, roughness: 0.45, metalness: 0.12, vertexColors: true };
        } else if (name === 'fastSpikes') {
            // V15: 快速型怪兽背鳍/尖耳轮廓
            geos.push(colorize(new THREE.ConeGeometry(0.06, 0.26, 6), 0xFF9F43).rotateX(-0.35).translate(0, 0.19, -0.04));
            geos.push(colorize(new THREE.ConeGeometry(0.05, 0.20, 6), 0xF2D5FF).rotateZ(0.75).translate(-0.19, 0.08, 0));
            geos.push(colorize(new THREE.ConeGeometry(0.05, 0.20, 6), 0xF2D5FF).rotateZ(-0.75).translate(0.19, 0.08, 0));
            mat = { color: 0xFFFFFF, roughness: 0.45, metalness: 0.15, vertexColors: true };
        } else if (name === 'helmet') {
            geos.push(colorize(new THREE.SphereGeometry(0.21, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), 0x5A6B4A));
            geos.push(colorize(new THREE.CylinderGeometry(0.215, 0.23, 0.04, 10), 0x46523C).translate(0, -0.015, 0));
            geos.push(colorize(new THREE.BoxGeometry(0.24, 0.04, 0.09), 0x37402E).translate(0, -0.04, 0.17));
            mat = { color: 0xFFFFFF, roughness: 0.55, metalness: 0.35, vertexColors: true };
        } else if (name === 'cap') {
            geos.push(colorize(new THREE.CylinderGeometry(0.17, 0.185, 0.10, 9), 0x3C4658));
            geos.push(colorize(new THREE.BoxGeometry(0.17, 0.025, 0.13), 0x2F3745).translate(0, -0.04, 0.20));
            mat = { color: 0xFFFFFF, roughness: 0.8, metalness: 0.05, vertexColors: true };
        } else if (name === 'pauldron') {
            // V15: 重装怪兽双侧尖刺护肩 + 铁环项圈 (Body 局部空间)
            geos.push(colorize(new THREE.SphereGeometry(0.20, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.58), 0x495664).translate(-0.34, 0.28, 0));
            geos.push(colorize(new THREE.SphereGeometry(0.20, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.58), 0x495664).translate(0.34, 0.28, 0));
            geos.push(colorize(new THREE.ConeGeometry(0.055, 0.18, 6), 0xF5B82E).rotateZ(0.55).translate(-0.44, 0.40, 0));
            geos.push(colorize(new THREE.ConeGeometry(0.055, 0.18, 6), 0xF5B82E).rotateZ(-0.55).translate(0.44, 0.40, 0));
            mat = { color: 0xFFFFFF, roughness: 0.4, metalness: 0.55, vertexColors: true };
        }
        var merged = mergeGeometries(geos);
        merged.userData = { artSource: 'V14 enemy accessory procedural: ' + name };
        EnemyArmyRenderer._accGeos[name] = { geo: merged, matParams: mat };
        return EnemyArmyRenderer._accGeos[name];
    }
    _accBank(style, lod, name, geoKey) {
        var key = style + ':' + lod + ':' + name;
        if (this.accBanks[key]) return this.accBanks[key];
        var acc = EnemyArmyRenderer._accGeometry(geoKey || name);
        var lambertParams = { color: acc.matParams && acc.matParams.color !== undefined ? acc.matParams.color : 0xFFFFFF, vertexColors: !!(acc.matParams && acc.matParams.vertexColors) };
        var mat = new THREE.MeshLambertMaterial(lambertParams);
        mat.color.setHex(0xFFFFFF);
        var mesh = new THREE.InstancedMesh(acc.geo, mat, EnemyArmyRenderer.ACC_MAX || 448);
        mesh.name = 'Enemy_' + style + '_' + lod + '_acc_' + name;
        mesh.count = 0; mesh.frustumCulled = false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.visible = false;
        mesh.userData.artSource = 'V14 accessory ' + name + ' (head-local)';
        this.scene.add(mesh);
        return this.accBanks[key] = { mesh: mesh, count: 0 };
    }
    _bank(style,lod) {
        // V5.1.5 防御: 未知风格回退normal(避免渲染循环每帧崩溃), 并告警暴露根因
        if(!this.data.styles[style]) {
            if(!this._warnedStyles) this._warnedStyles = {};
            if(!this._warnedStyles[style]) { this._warnedStyles[style] = 1; console.warn('[EnemyArmyRenderer] unknown style:', style); }
            style = 'normal';
        }
        var key=style+':'+lod;
        if(this.banks[key])return this.banks[key];
        var source=this.data.styles[style][lod],meshes={};
        for(var part of this.data.parts) {
            var m=new THREE.InstancedMesh(source.geometries[part],source.material,448); // V5.1.5: 单类型可堆448(320+活敌全同类型)
            m.name='Enemy_'+style+'_'+lod+'_'+part;m.count=0;m.frustumCulled=false;
            m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.setColorAt(0,new THREE.Color(1,1,1));
            m.userData.artSource=source.url;m.userData.collidable=false;
            this.scene.add(m);meshes[part]=m;
        }
        return this.banks[key]={meshes,source,count:0};
    }
    update(dt,time,enemies,squadZ) {
        var shieldCount=0, shadowCount=0;
        for(var k in this.banks)this.banks[k].count=0;
        for(var k2 in this.accBanks)this.accBanks[k2].count=0;
        for(var e of enemies) {
            if(e.removeReady || e.model.scale.x<.005)continue;
            var style=e.artStyle||e.type;
            var lod=e.isBoss?(Math.abs(e.z-squadZ)>42?'lod':'hero'):((enemies.length>40||Math.abs(e.z-squadZ)>22)?'lod':'hero');
            var bank=this._bank(style,lod),slot=bank.count++;
            if(slot>=448){bank.count=448;continue;}
            e.model.updateMatrix();this._root.copy(e.model.matrix);
            // V15 / V16.2: 怪物/Boss柔和接地阴影 (浮空跃栏/龙卷风卷起时缩小阴影增强立体感)
            if (!e.dying && shadowCount < 448) {
                var liftScale = Math.max(0.45, Math.min(1.0, 1.0 - (e._liftY || 0) * 0.22));
                var shS = (e.visScale || 1) * (e.isBoss ? 1.55 : 0.96) * liftScale;
                this._pose.makeScale(shS, 1, shS * 0.86);
                this._pose.setPosition(e.x, 0.032, e.z);
                this.shadowMesh.setMatrixAt(shadowCount++, this._pose);
            }
            if(e.alive && e.shieldT>0 && shieldCount<8) {this._matrix.copy(this._root).multiply(this._shieldLocal);this.shieldMesh.setMatrixAt(shieldCount++,this._matrix);}
            var speed=e.type==='fast'?10:(e.isBoss?3:4.5),phase=time*speed+e.phase;
            var walk=e.dying?0:Math.sin(phase)*(.45*(e.frozenT>0?.3:1));
            var attack=e.attackT||0,charge=e.chargeT||0;
            this._color.setRGB(1,1,1);
            // V14.2: Boss 造型辨识染色(先于阶段/冰冻/受击覆盖)
            var bp = e.isBoss ? EnemyModelLoader.BOSS_PRESENTATION[style] : null;
            if (bp) this._color.setRGB(bp.tint[0], bp.tint[1], bp.tint[2]);
            // V14: 外观变体族染色(确定性, e.phase为种子; 精英/自爆/冰冻等状态染色随后覆盖)
            var tints=EnemyModelLoader.VARIANT_TINTS[style];
            if(tints && !e.isBoss && e.type!=='elite' && e.type!=='bomber') {
                var vt=tints[Math.floor(((e.phase||0)*13.37)%1*tints.length)%tints.length];
                this._color.setRGB(vt[0],vt[1],vt[2]);
            }
            // V12/V16.3 视觉: thrower/flanker/spitter 均已具备独立雕塑材质贴图, 仅保留精英金染与冰冻/受击状态覆盖
            if(e.type==='elite')this._color.setRGB(1.22,1.08,.72);          // 精英金染
            if(e.frozenT>0)this._color.setRGB(.50,.85,1.35);
            if(e.phaseIndex>=3)this._color.setRGB(1.35,.72,.75);
            else if(e.phaseIndex===2)this._color.setRGB(1.12,.85,1.2);
            if(e.hitFlash>0)this._color.setRGB(2.8,2.4,1.8);
            // V14: 轮廓变体 — 体宽±5% + 前倾±9°(只动躯干/头/臂, 腿不动避免脚底悬空)
            // V14.2: 体型 Rig 侧影家族 — 四种骨架姿态, 变体不再只有颜色差
            var vw=1,lean=0,rig=EnemyModelLoader.BODY_RIGS.standard;
            if(!e.isBoss && e.type!=='elite' && !e.dying) {
                var rigPool = (style==='fast') ? ['wiry','huncher','standard'] : (style==='shield'||style==='split') ? ['brute','standard'] : ['standard','brute','huncher','wiry'];
                rig = EnemyModelLoader.BODY_RIGS[rigPool[Math.floor(((e.phase||0)*17.77)%1*rigPool.length)%rigPool.length]] || rig;
                vw=1+((((e.phase||0)*5.51)%1)-0.5)*0.10;
                lean=((((e.phase||0)*9.13)%1)-0.5)*0.18;
            }
            for(var part of this.data.parts) {
                this._pose.identity();
                if(part==='LegL'||part==='LegR')this._pose.makeRotationX(walk*(part==='LegL'?1:-1));
                else if(part==='Arms') {
                    this._e.set(-.12-Math.sin(phase)*.05-attack*.65-charge*.4+lean*.5,0,Math.sin(phase)*.04);
                    this._pose.makeRotationFromEuler(this._e);
                    this._pose.scale(this._v14.set(rig.armW,rig.armH,rig.armW));
                } else if(part==='Head') {
                    this._e.set(charge*.12+lean*.6+rig.headPitch,Math.sin(phase*.5)*.09,Math.sin(phase)*.025);
                    this._pose.makeRotationFromEuler(this._e);
                    var hs = bp ? bp.headScale : null;
                    if (hs) this._pose.scale(this._v14.set(hs[0],hs[1],hs[2]));
                    else this._pose.scale(this._v14.set(rig.headS,rig.headS,rig.headS));
                } else if(part==='Body'&&e.isBoss) {
                    var bs = bp && bp.bodyScale;
                    this._pose.makeScale(
                        (bs ? bs[0] : 1) * (1+charge*.035),
                        (bs ? bs[1] : 1) * (1+charge*.05),
                        (bs ? bs[2] : 1) * (1+charge*.035));
                } else if(part==='Body') {
                    // V14+V14.2: 躯干宽度变体+前倾+Rig 侧影
                    this._e.set(lean + rig.pitch,0,0);
                    this._pose.makeRotationFromEuler(this._e);
                    this._pose.scale(this._v14.set(vw*rig.bodyW,rig.bodyH,vw*rig.bodyW));
                }
                this._matrix.copy(this._root).multiply(bank.source.restMatrices[part]).multiply(this._pose);
                bank.meshes[part].setMatrixAt(slot,this._matrix);
                bank.meshes[part].setColorAt(slot,this._color);
            }
            // V15-ART-004: 全新 Blender 独立重装 Boss 与普通怪兽 GLB 已内置雕塑尖角/机械拳套/肩甲/胸核, 仅保留特殊 Boss 背囊与精英重甲附件
            if(e.isBoss && !e.dying && bp && bp.attach) {
                var bb = this._accBank(style, lod, bp.attach);
                if (bb.count < 16) {
                    var bSlot = bb.count++;
                    var bs2 = bp.bodyScale;
                    this._pose.makeScale((bs2 ? bs2[0] : 1) * (1 + charge * .035), (bs2 ? bs2[1] : 1) * (1 + charge * .05), (bs2 ? bs2[2] : 1) * (1 + charge * .035));
                    this._matrix.copy(this._root).multiply(bank.source.restMatrices.Body).multiply(this._pose);
                    bb.mesh.setMatrixAt(bSlot, this._matrix);
                }
            } else if(!e.isBoss && !e.dying) {
                var accName=this._pickAccessory(style,e);
                if(accName) {
                    var ab=this._accBank(style,lod,accName);
                    if(ab.count<(EnemyArmyRenderer.ACC_MAX||448)) {
                        var aSlot=ab.count++;
                        this._pose.identity();
                        this._e.set(charge*.12+lean*.6,Math.sin(phase*.5)*.09,Math.sin(phase)*.025);
                        this._pose.makeRotationFromEuler(this._e);
                        var local=EnemyArmyRenderer._accLocal(accName);
                        if(local)this._matrix.copy(this._root).multiply(bank.source.restMatrices[accName==='pauldron'?'Body':'Head']).multiply(this._pose).multiply(local);
                        ab.mesh.setMatrixAt(aSlot,this._matrix);
                    }
                }
            }
            // V14: Boss入场演出(表现层一次性钩子 — spawnT弹性入场完成时触发, 不改状态机)
            if(e.isBoss && e.spawnT>=1 && !e._v14EntranceFx) {
                e._v14EntranceFx=true;
                var g=typeof window!=='undefined'?window.__game:null;
                if(g && g.effects && g.world && !e.dying) {
                    var fx = bp ? bp.fx : 0xFF6A55;
                    g.world.shake(.5);
                    g.effects.shockwave(e.x,.06,e.z,fx);
                    g.effects.flash(e.x,1.6,e.z,fx,2.8);
                    g.effects.burst(e.x,1.3,e.z,fx,20,4.6,.7);
                    g.effects.burst(e.x,.4,e.z,0x3A3F46,10,2.2,1.0);
                }
            }
            e.renderBank=style+':'+lod;e.renderSlot=slot;
        }
        // V11.6: 实例缓冲前缀上传 — 原每帧全量上传448槽×5部件矩阵/颜色, 怪多时GPU带宽浪费
        for(var key in this.banks)for(var part of this.data.parts) {
            var mesh=this.banks[key].meshes[part],used=this.banks[key].count;
            mesh.count=used;mesh.visible=used>0;
            mesh.instanceMatrix.updateRange.offset=0;
            mesh.instanceMatrix.updateRange.count=used*16;
            mesh.instanceMatrix.needsUpdate=true;
            if(mesh.instanceColor){mesh.instanceColor.updateRange.offset=0;mesh.instanceColor.updateRange.count=used*3;mesh.instanceColor.needsUpdate=true;}
            mesh.castShadow=mesh.visible&&enemies.length<=20;
        }
        // V14: 附件前缀上传(用到才可见)
        for(var akey in this.accBanks) {
            var amesh=this.accBanks[akey].mesh,aused=this.accBanks[akey].count;
            amesh.count=aused;amesh.visible=aused>0;
            amesh.instanceMatrix.updateRange.offset=0;
            amesh.instanceMatrix.updateRange.count=aused*16;
            amesh.instanceMatrix.needsUpdate=true;
        }
        this.shieldMesh.count=shieldCount; // V11.6: 前缀上传
        this.shieldMesh.instanceMatrix.updateRange.count=shieldCount*16;
        this.shieldMesh.instanceMatrix.needsUpdate=true;
        if (this.shadowMesh) {
            this.shadowMesh.count = shadowCount;
            this.shadowMesh.visible = shadowCount > 0;
            this.shadowMesh.instanceMatrix.updateRange.offset = 0;
            this.shadowMesh.instanceMatrix.updateRange.count = shadowCount * 16;
            this.shadowMesh.instanceMatrix.needsUpdate = true;
        }
    }
    /** V15-ART-004: normal.glb 已内置雕塑双角与尖耳, 仅对 fast/heavy/elite 保留差异化附件 */
    _pickAccessory(style,e) {
        if(e.type==='elite'||style==='shield'||style==='split')return 'pauldron';
        if(style==='fast')return 'fastSpikes';
        return null;
    }
    /** V15-ART-002: Boss 独立重装机械套装 (宽大肩甲+胸甲+发光核心+巨型机械拳套+皇冠角) */
    static _bossAccGeometry(name) {
        if (EnemyArmyRenderer._bossAccGeos && EnemyArmyRenderer._bossAccGeos[name]) return EnemyArmyRenderer._bossAccGeos[name];
        if (!EnemyArmyRenderer._bossAccGeos) EnemyArmyRenderer._bossAccGeos = {};
        var parts = [], matParams;
        if (name === 'ironfist') {
            // V15-ART-002 R2: 精校准贴合 Boss 躯干的重装护甲 (注意 Boss 根节点自带 ~2.4x 缩放!)
            for (var s = -1; s <= 1; s += 2) {
                parts.push(colorize(new THREE.SphereGeometry(0.13, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.62), 0x394452).scale(1.15, 0.90, 1.05).translate(s * 0.24, 0.20, 0));
                parts.push(colorize(new THREE.BoxGeometry(0.13, 0.04, 0.18), 0xE8A82C).translate(s * 0.24, 0.17, 0));
                parts.push(colorize(new THREE.ConeGeometry(0.035, 0.12, 6), 0xF0F4FA).rotateZ(s * -0.58).translate(s * 0.31, 0.28, 0));
                parts.push(colorize(new THREE.SphereGeometry(0.032, 8, 6), 0xFF4238).translate(s * 0.21, 0.26, 0.08));
            }
            // 贴合胸甲 + 发光红橙色反应堆核心
            parts.push(colorize(new THREE.BoxGeometry(0.32, 0.22, 0.08), 0x2F3844).translate(0, 0.10, 0.14));
            parts.push(colorize(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 12), 0x5A687A).rotateX(Math.PI * 0.5).translate(0, 0.11, 0.18));
            parts.push(colorize(new THREE.SphereGeometry(0.055, 10, 8), 0xFF5A26).scale(1, 1, 0.55).translate(0, 0.11, 0.195));
            // 战术腰带扣
            parts.push(colorize(new THREE.BoxGeometry(0.35, 0.06, 0.25), 0x2A323D).translate(0, -0.06, 0));
            parts.push(colorize(new THREE.BoxGeometry(0.09, 0.07, 0.05), 0xF5B82E).translate(0, -0.06, 0.13));
            matParams = { color: 0xFFFFFF, roughness: 0.36, metalness: 0.55, vertexColors: true };
        } else if (name === 'bossGauntlets') {
            // 精校准重装机械拳套 (紧贴 Boss 双拳, 附带金属指节与橙红充能条)
            for (var gs = -1; gs <= 1; gs += 2) {
                parts.push(colorize(new THREE.BoxGeometry(0.15, 0.16, 0.17), 0x3B4654).translate(gs * 0.25, -0.18, 0.08));
                parts.push(colorize(new THREE.BoxGeometry(0.16, 0.05, 0.18), 0xF2B233).translate(gs * 0.25, -0.12, 0.08));
                parts.push(colorize(new THREE.BoxGeometry(0.13, 0.045, 0.06), 0xFF5526).translate(gs * 0.25, -0.19, 0.16));
            }
            matParams = { color: 0xFFFFFF, roughness: 0.35, metalness: 0.60, vertexColors: true };
        } else if (name === 'bossHorns') {
            // 威慑力弯曲双巨角 + 中央红角
            parts.push(colorize(new THREE.ConeGeometry(0.05, 0.20, 7), 0xF0E6FF).rotateZ(0.55).translate(-0.13, 0.18, 0.01));
            parts.push(colorize(new THREE.ConeGeometry(0.05, 0.20, 7), 0xF0E6FF).rotateZ(-0.55).translate(0.13, 0.18, 0.01));
            parts.push(colorize(new THREE.ConeGeometry(0.04, 0.15, 6), 0xFF5A36).translate(0, 0.21, 0.02));
            matParams = { color: 0xFFFFFF, roughness: 0.4, metalness: 0.2, vertexColors: true };
        } else if (name === 'sacs') {
            parts.push(colorize(new THREE.SphereGeometry(0.24, 8, 6), 0x9ADE3E).translate(-0.26, 0.42, -0.16));
            parts.push(colorize(new THREE.SphereGeometry(0.29, 8, 6), 0x8AD03A).translate(0, 0.5, -0.2));
            parts.push(colorize(new THREE.SphereGeometry(0.22, 8, 6), 0x9ADE3E).translate(0.26, 0.4, -0.16));
            matParams = { color: 0xFFFFFF, roughness: 0.55, vertexColors: true };
        } else if (name === 'horns') {
            parts.push(colorize(new THREE.ConeGeometry(0.075, 0.34, 6), 0x3A2440).translate(-0.17, 0.2, 0).rotateZ(0.5));
            parts.push(colorize(new THREE.ConeGeometry(0.075, 0.34, 6), 0x3A2440).translate(0.17, 0.2, 0).rotateZ(-0.5));
            matParams = { color: 0xFFFFFF, roughness: 0.4, metalness: 0.3, vertexColors: true };
        } else if (name === 'plates') {
            parts.push(colorize(new THREE.BoxGeometry(0.3, 0.16, 0.34), 0x5E6A70).translate(-0.34, 0.42, 0).rotateZ(0.12));
            parts.push(colorize(new THREE.BoxGeometry(0.3, 0.16, 0.34), 0x5E6A70).translate(0.34, 0.42, 0).rotateZ(-0.12));
            matParams = { color: 0xFFFFFF, roughness: 0.6, metalness: 0.35, vertexColors: true };
        }
        var merged = mergeGeometries(parts);
        merged.userData = { artSource: 'V15 boss mecha attachment procedural: ' + name };
        EnemyArmyRenderer._bossAccGeos[name] = { geo: merged, matParams: matParams };
        return EnemyArmyRenderer._bossAccGeos[name];
    }
    /** V14.2: Boss 附件局部矩阵(Body/头 局部空间), sacs 附带呼吸脉动 */
    static _bossAccLocal(name, time, z) {
        if (!EnemyArmyRenderer._bossAccLocals) EnemyArmyRenderer._bossAccLocals = {};
        var cached = EnemyArmyRenderer._bossAccLocals[name];
        if (name === 'sacs') {
            var pulse = 1 + Math.sin(time * 2.4 + (z || 0) * 1.7) * 0.06;
            cached = cached || new THREE.Matrix4();
            cached.makeScale(pulse, pulse, pulse);
            EnemyArmyRenderer._bossAccLocals[name] = cached;
            return cached;
        }
        if (!cached) {
            cached = new THREE.Matrix4();
            if (name === 'horns') cached.setPosition(0, 0.22, 0);
            EnemyArmyRenderer._bossAccLocals[name] = cached;
        }
        return cached;
    }
    /** V14+V15: 附件局部偏移(预建, 热循环零分配) — 头顶/躯干肩位 */
    static _accLocal(name) {
        if(!EnemyArmyRenderer._accLocals) {
            EnemyArmyRenderer._accLocals={
                monsterHorns:new THREE.Matrix4().setPosition(0,0.20,0),
                fastSpikes:new THREE.Matrix4().setPosition(0,0.20,0),
                helmet:new THREE.Matrix4().setPosition(0,0.26,0),
                cap:new THREE.Matrix4().setPosition(0,0.28,0),
                pauldron:new THREE.Matrix4().setPosition(0,0,0)
            };
        }
        return EnemyArmyRenderer._accLocals[name];
    }
    clear(){for(var key in this.banks)for(var p of this.data.parts)this.banks[key].meshes[p].count=0;for(var ak in this.accBanks)this.accBanks[ak].mesh.count=0;this.shieldMesh.count=0;if(this.shadowMesh)this.shadowMesh.count=0;}
};
