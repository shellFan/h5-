// V4.2: local Blender assets, cached immutable resources and rigid-part batches.
var EnemyModelLoader = class EnemyModelLoader {
    static load() {
        if (this._promise) return this._promise;
        var start=performance.now(), loaded=[], loader=new THREE.GLTFLoader();
        this.status='loading';
        this._promise=Promise.allSettled(this.KEYS.flatMap(key=>['hero','lod'].map(lod=>new Promise((resolve,reject)=>{
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
            },undefined,e=>reject(Error('Enemy asset failed: '+url+' '+(e.message||e))));
        })))).then(results=>{
            var fail=results.find(r=>r.status==='rejected');
            if(fail)throw fail.reason;
            var styles={};
            for(var r of results) {var v=r.value;(styles[v.key]||(styles[v.key]={}))[v.lod]=v.bank;}
            for(var key of this.KEYS) {
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
                        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\nfloat glowPower=max(totalEmissiveRadiance.r,max(totalEmissiveRadiance.g,totalEmissiveRadiance.b));\nif(vColor.r>1.25 && vColor.g<.8)totalEmissiveRadiance=vec3(1.,.08,.15)*glowPower;\nelse if(vColor.r>1.05 && vColor.g<.95 && vColor.b>1.15)totalEmissiveRadiance=vec3(.7,.15,1.)*glowPower;\n#endif');
                    };
                }
                h.material.customProgramCacheKey=function(){return 'v42-pbr-display';};
            }
            this._data={parts:this.PARTS,styles:styles};this.status='loaded';this.loadMs=performance.now()-start;
            return this._data;
        }).catch(e=>{loaded.forEach(s=>SoldierModelLoader._disposeScene(s));this._promise=null;this._data=null;this.status='failed';throw e;});
        return this._promise;
    }
    static get(){return this._data;}
};
EnemyModelLoader.PARTS=['Body','Head','Arms','LegL','LegR'];
EnemyModelLoader.KEYS=['normal','fast','shield','split','spitter','elite','bruiser','bulwark','spitking','hivelord','titan','overlord'];
EnemyModelLoader.status='idle';EnemyModelLoader.loadMs=0;

var EnemyArmyRenderer = class EnemyArmyRenderer {
    constructor(scene) {
        this.scene=scene;this.data=EnemyModelLoader.get();this.banks={};
        this._root=new THREE.Matrix4();this._matrix=new THREE.Matrix4();this._pose=new THREE.Matrix4();
        this._e=new THREE.Euler();this._color=new THREE.Color();this._counts={};
        this.shieldMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,20,12),new THREE.MeshBasicMaterial({color:0x57cfff,transparent:true,opacity:.14,depthWrite:false}),8);
        this.shieldMesh.count=0;this.shieldMesh.frustumCulled=false;this.shieldMesh.userData.artSource='V42 boss shield energy shell';scene.add(this.shieldMesh);
        this._shieldLocal=new THREE.Matrix4().makeScale(.65,.85,.60);this._shieldLocal.setPosition(0,.65,0);
    }
    _bank(style,lod) {
        var key=style+':'+lod;
        if(this.banks[key])return this.banks[key];
        var source=this.data.styles[style][lod],meshes={};
        for(var part of this.data.parts) {
            var m=new THREE.InstancedMesh(source.geometries[part],source.material,160);
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
        for(var e of enemies) {
            if(e.removeReady || e.model.scale.x<.005)continue;
            var style=e.artStyle||e.type;
            var lod=e.isBoss?(Math.abs(e.z-squadZ)>42?'lod':'hero'):((enemies.length>40||Math.abs(e.z-squadZ)>22)?'lod':'hero');
            var bank=this._bank(style,lod),slot=bank.count++;
            if(slot>=160){bank.count=160;continue;}
            e.model.updateMatrix();this._root.copy(e.model.matrix);
            if(e.alive && e.shieldT>0 && shieldCount<8) {this._matrix.copy(this._root).multiply(this._shieldLocal);this.shieldMesh.setMatrixAt(shieldCount++,this._matrix);}
            var speed=e.type==='fast'?10:(e.isBoss?3:4.5),phase=time*speed+e.phase;
            var walk=e.dying?0:Math.sin(phase)*(.45*(e.frozenT>0?.3:1));
            var attack=e.attackT||0,charge=e.chargeT||0;
            this._color.setRGB(1,1,1);
            if(e.frozenT>0)this._color.setRGB(.50,.85,1.35);
            if(e.hitFlash>0)this._color.setRGB(1.65,1.4,1.1);
            if(e.phaseIndex>=3)this._color.setRGB(1.35,.72,.75);
            else if(e.phaseIndex===2)this._color.setRGB(1.12,.85,1.2);
            for(var part of this.data.parts) {
                this._pose.identity();
                if(part==='LegL'||part==='LegR')this._pose.makeRotationX(walk*(part==='LegL'?1:-1));
                else if(part==='Arms') {
                    this._e.set(-.12-Math.sin(phase)*.05-attack*.65-charge*.4,0,Math.sin(phase)*.04);
                    this._pose.makeRotationFromEuler(this._e);
                } else if(part==='Head') {
                    this._e.set(charge*.12,Math.sin(phase*.5)*.09,Math.sin(phase)*.025);
                    this._pose.makeRotationFromEuler(this._e);
                } else if(part==='Body'&&e.isBoss) {
                    this._pose.makeScale(1+charge*.035,1+charge*.05,1+charge*.035);
                }
                this._matrix.copy(this._root).multiply(bank.source.restMatrices[part]).multiply(this._pose);
                bank.meshes[part].setMatrixAt(slot,this._matrix);
                bank.meshes[part].setColorAt(slot,this._color);
            }
            e.renderBank=style+':'+lod;e.renderSlot=slot;
        }
        for(var key in this.banks)for(var part of this.data.parts) {
            var mesh=this.banks[key].meshes[part];mesh.count=this.banks[key].count;mesh.visible=mesh.count>0;
            mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;
            mesh.castShadow=mesh.visible&&enemies.length<=20;
        }
        this.shieldMesh.count=shieldCount;this.shieldMesh.instanceMatrix.needsUpdate=true;
    }
    clear(){for(var key in this.banks)for(var p of this.data.parts)this.banks[key].meshes[p].count=0;this.shieldMesh.count=0;}
};
