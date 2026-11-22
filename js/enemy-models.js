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
        // V11.6: 启动关键集 — 2士兵+普通/快速僵尸×2LOD = 6 GLB
        if (typeof window !== 'undefined' && window.__BootProgress) window.__BootProgress.total = 6;
        return this.load(['normal', 'fast']);
    }
    static _loadKeys(keys) {
        var loaded = [], loader = new THREE.GLTFLoader();
        this.status = 'loading';
        if (typeof window !== 'undefined' && window.__BootProgress && keys.length === this.KEYS.length) {
            window.__BootProgress.total = 2 + this.KEYS.length * 2; // 士兵2 + 全部僵尸/Boss
        }
        return Promise.allSettled(keys.flatMap(key => ['hero','lod'].map(lod=>new Promise((resolve,reject)=>{
            var category=['normal','fast','shield','split','spitter','elite'].includes(key)?'zombies':'bosses';
            var url='assets/models/'+category+'/'+key+'/'+key+(lod==='lod'?'-lod':'')+'.glb';
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
                if(['spitter','spitking','hivelord','overlord'].includes(key)) {
                    var image=h.material.map.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
                    var ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);var pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
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
                h.material.customProgramCacheKey=function(){return 'v42-pbr-display';};
            }
            return styles;
        }).catch(e=>{loaded.forEach(s=>SoldierModelLoader._disposeScene(s));throw e;});
    }
    static get(){return this._data;}
};
EnemyModelLoader.PARTS=['Body','Head','Arms','LegL','LegR'];
EnemyModelLoader.KEYS=['normal','fast','shield','split','spitter','elite','bruiser','bulwark','spitking','hivelord','titan','overlord'];
EnemyModelLoader.status='idle';EnemyModelLoader.loadMs=0;
// V14: 感染者外观变体 — 确定性实例染色族(乘法系数, 以e.phase为种子, 同一怪每帧一致)。
// 只做轻微色偏保持贴图质感与全局风格统一; 精英/自爆/冰冻等状态染色在其后覆盖。
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
        this.shieldMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,20,12),new THREE.MeshBasicMaterial({color:0x57cfff,transparent:true,opacity:.14,depthWrite:false}),8);
        this.shieldMesh.count=0;this.shieldMesh.frustumCulled=false;this.shieldMesh.userData.artSource='V42 boss shield energy shell';scene.add(this.shieldMesh);
        this._shieldLocal=new THREE.Matrix4().makeScale(.65,.85,.60);this._shieldLocal.setPosition(0,.65,0);
    }
    /** V14: 附件几何(头局部空间) — 程序化军盔/便帽/肩甲, 全部共享单材质(顶点色) */
    static _accGeometry(name) {
        if (EnemyArmyRenderer._accGeos && EnemyArmyRenderer._accGeos[name]) return EnemyArmyRenderer._accGeos[name];
        if (!EnemyArmyRenderer._accGeos) EnemyArmyRenderer._accGeos={};
        var geos=[], mat;
        if (name === 'helmet') {
            // 军绿战术盔: 半球壳+帽檐+护目沿(贴头顶, 头局部原点在颈位)
            geos.push(colorize(new THREE.SphereGeometry(0.21, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), 0x5A6B4A));
            geos.push(colorize(new THREE.CylinderGeometry(0.215, 0.23, 0.04, 10), 0x46523C).translate(0, -0.015, 0));
            geos.push(colorize(new THREE.BoxGeometry(0.24, 0.04, 0.09), 0x37402E).translate(0, -0.04, 0.17));
            mat = { color: 0xFFFFFF, roughness: 0.55, metalness: 0.35, vertexColors: true };
        } else if (name === 'cap') {
            // 便帽: 扁圆柱+前檐(快速型幸存者遗留)
            geos.push(colorize(new THREE.CylinderGeometry(0.17, 0.185, 0.10, 9), 0x3C4658));
            geos.push(colorize(new THREE.BoxGeometry(0.17, 0.025, 0.13), 0x2F3745).translate(0, -0.04, 0.20));
            mat = { color: 0xFFFFFF, roughness: 0.8, metalness: 0.05, vertexColors: true };
        } else if (name === 'pauldron') {
            // 肩甲(盾尸/分裂体重装变体) — 注意: 此几何在**Body局部空间**
            geos.push(colorize(new THREE.SphereGeometry(0.16, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), 0x51626E));
            mat = { color: 0xFFFFFF, roughness: 0.45, metalness: 0.5, vertexColors: true };
        }
        var merged = mergeGeometries(geos);
        merged.userData = { artSource: 'V14 enemy accessory procedural: ' + name };
        EnemyArmyRenderer._accGeos[name] = { geo: merged, matParams: mat };
        return EnemyArmyRenderer._accGeos[name];
    }
    _accBank(style, lod, name) {
        var key = style + ':' + lod + ':' + name;
        if (this.accBanks[key]) return this.accBanks[key];
        var acc = EnemyArmyRenderer._accGeometry(name);
        var mat = new THREE.MeshLambertMaterial(acc.matParams);
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
        var shieldCount=0;
        for(var k in this.banks)this.banks[k].count=0;
        for(var k2 in this.accBanks)this.accBanks[k2].count=0;
        for(var e of enemies) {
            if(e.removeReady || e.model.scale.x<.005)continue;
            var style=e.artStyle||e.type;
            var lod=e.isBoss?(Math.abs(e.z-squadZ)>42?'lod':'hero'):((enemies.length>40||Math.abs(e.z-squadZ)>22)?'lod':'hero');
            var bank=this._bank(style,lod),slot=bank.count++;
            if(slot>=448){bank.count=448;continue;}
            e.model.updateMatrix();this._root.copy(e.model.matrix);
            if(e.alive && e.shieldT>0 && shieldCount<8) {this._matrix.copy(this._root).multiply(this._shieldLocal);this.shieldMesh.setMatrixAt(shieldCount++,this._matrix);}
            var speed=e.type==='fast'?10:(e.isBoss?3:4.5),phase=time*speed+e.phase;
            var walk=e.dying?0:Math.sin(phase)*(.45*(e.frozenT>0?.3:1));
            var attack=e.attackT||0,charge=e.chargeT||0;
            this._color.setRGB(1,1,1);
            // V14: 外观变体族染色(确定性, e.phase为种子; 精英/自爆/冰冻等状态染色随后覆盖)
            var tints=EnemyModelLoader.VARIANT_TINTS[style];
            if(tints && !e.isBoss && e.type!=='elite' && e.type!=='bomber') {
                var vt=tints[Math.floor(((e.phase||0)*13.37)%1*tints.length)%tints.length];
                this._color.setRGB(vt[0],vt[1],vt[2]);
            }
            // V12视觉: 特殊体型染色(冰冻/受击闪烁随后覆盖)
            if(e.type==='elite')this._color.setRGB(1.22,1.08,.72);          // 精英金染
            else if(e.type==='bomber')this._color.setRGB(1.5,.55,.5);       // 自爆尸红染(fast模型区分)
            if(e.frozenT>0)this._color.setRGB(.50,.85,1.35);
            if(e.phaseIndex>=3)this._color.setRGB(1.35,.72,.75);
            else if(e.phaseIndex===2)this._color.setRGB(1.12,.85,1.2);
            if(e.hitFlash>0)this._color.setRGB(2.8,2.4,1.8);
            // V14: 轮廓变体 — 体宽±5% + 前倾±9°(只动躯干/头/臂, 腿不动避免脚底悬空)
            var vw=1,lean=0;
            if(!e.isBoss && e.type!=='elite' && !e.dying) {
                vw=1+((((e.phase||0)*5.51)%1)-0.5)*0.10;
                lean=((((e.phase||0)*9.13)%1)-0.5)*0.18;
            }
            for(var part of this.data.parts) {
                this._pose.identity();
                if(part==='LegL'||part==='LegR')this._pose.makeRotationX(walk*(part==='LegL'?1:-1));
                else if(part==='Arms') {
                    this._e.set(-.12-Math.sin(phase)*.05-attack*.65-charge*.4+lean*.5,0,Math.sin(phase)*.04);
                    this._pose.makeRotationFromEuler(this._e);
                } else if(part==='Head') {
                    this._e.set(charge*.12+lean*.6,Math.sin(phase*.5)*.09,Math.sin(phase)*.025);
                    this._pose.makeRotationFromEuler(this._e);
                } else if(part==='Body'&&e.isBoss) {
                    this._pose.makeScale(1+charge*.035,1+charge*.05,1+charge*.035);
                } else if(part==='Body') {
                    // V14: 躯干宽度变体+前倾(感染者驼背/壮硕差异)
                    this._e.set(lean,0,0);
                    this._pose.makeRotationFromEuler(this._e);
                    this._pose.scale(this._v14.set(vw,1,vw));
                }
                this._matrix.copy(this._root).multiply(bank.source.restMatrices[part]).multiply(this._pose);
                bank.meshes[part].setMatrixAt(slot,this._matrix);
                bank.meshes[part].setColorAt(slot,this._color);
            }
            // V14: 头部/肩部附件(军盔/便帽/肩甲) — 复用对应部件姿态, 附件随动
            if(!e.isBoss && !e.dying && e.type!=='elite') {
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
                    g.world.shake(.5);
                    g.effects.shockwave(e.x,.06,e.z,0xFF5A4E);
                    g.effects.flash(e.x,1.6,e.z,0xFF6A55,2.8);
                    g.effects.burst(e.x,1.3,e.z,0xFF6A55,20,4.6,.7);
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
    }
    /** V14: 附件分配 — 按体型确定性(普通=军盔, 快速=便帽, 盾/分裂=肩甲) */
    _pickAccessory(style,e) {
        var r=((e.phase||0)*7.77)%1;
        if(style==='normal')return r<0.24?'helmet':null;
        if(style==='fast')return r<0.18?'cap':null;
        if(style==='shield')return r<0.5?'pauldron':null;
        if(style==='split')return r<0.35?'pauldron':null;
        return null;
    }
    /** V14: 附件局部偏移(预建, 热循环零分配) — 头顶/躯干肩位 */
    static _accLocal(name) {
        if(!EnemyArmyRenderer._accLocals) {
            EnemyArmyRenderer._accLocals={
                helmet:new THREE.Matrix4().setPosition(0,0.26,0),
                cap:new THREE.Matrix4().setPosition(0,0.28,0),
                pauldron:new THREE.Matrix4().setPosition(-0.34,0.30,0)
            };
        }
        return EnemyArmyRenderer._accLocals[name];
    }
    clear(){for(var key in this.banks)for(var p of this.data.parts)this.banks[key].meshes[p].count=0;for(var ak in this.accBanks)this.accBanks[ak].mesh.count=0;this.shieldMesh.count=0;}
};
