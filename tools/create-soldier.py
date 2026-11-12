"""Original Blue Vanguard rigid character. Blender 4.2.15 --background --python tools/create-soldier.py.
All authoring coordinates below are game coordinates: X right, Y up, -Z forward.
No downloaded character meshes. PBR atlas images are embedded into both GLBs.
"""
import bpy, math, os, json, random
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'models', 'soldier')
os.makedirs(os.path.join(OUT, 'textures'), exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
random.seed(410)

# Color, roughness, metallic. Atlas cell interiors avoid filtering bleed.
PALETTE = [
 ('helmet',(0.035,.29,.72),.44,.12), ('edge',(.022,.105,.29),.48,.12),
 ('cloth',(.07,.42,.88),.82,0), ('trousers',(.035,.21,.47),.85,0),
 ('skin',(.96,.65,.40),.72,0), ('cheek',(.94,.37,.29),.8,0),
 ('ivory',(.95,.96,.89),.5,0), ('ink',(.018,.026,.045),.7,0),
 ('leather',(.38,.19,.075),.78,0), ('flap',(.61,.34,.13),.72,0),
 ('strap',(.23,.11,.045),.86,0), ('brass',(.92,.64,.20),.4,.58),
 ('gun',(.095,.14,.19),.4,.55), ('steel',(.24,.33,.39),.38,.62),
 ('rubber',(.027,.048,.07),.92,0), ('lightblue',(.22,.64,.98),.58,.05),
]
def image_atlas(name, orm=False):
    w,h=256,256
    im=bpy.data.images.new(name,width=w,height=h,alpha=True)
    if orm: im.colorspace_settings.name='Non-Color'
    pix=[]
    for yy in range(h):
        for xx in range(w):
            cell=(yy//64)*4+xx//64
            _,col,rough,metal=PALETTE[cell]
            if orm: rgb=(1,rough,metal)
            else:
                # Subtle broad cell shading; no shiny random noise on the skin.
                f=.95+.05*(yy%64)/63 + random.uniform(-.005,.005)
                rgb=tuple(max(0,min(1,c*f)) for c in col)
            pix.extend((*rgb,1))
    im.pixels=pix
    im.filepath_raw=os.path.join(OUT,'textures',name+'.png')
    im.file_format='PNG'
    im.save()
    return im
color=image_atlas('soldier-basecolor')
orm=image_atlas('soldier-orm',True)
mat=bpy.data.materials.new('Vanguard_PBR_Atlas'); mat.use_nodes=True
nodes=mat.node_tree.nodes; links=mat.node_tree.links
bs=nodes.get('Principled BSDF')
tex=nodes.new('ShaderNodeTexImage'); tex.image=color
links.new(tex.outputs['Color'],bs.inputs['Base Color'])
packed=nodes.new('ShaderNodeTexImage'); packed.image=orm
sep=nodes.new('ShaderNodeSeparateColor'); links.new(packed.outputs['Color'],sep.inputs[0])
links.new(sep.outputs['Green'],bs.inputs['Roughness']); links.new(sep.outputs['Blue'],bs.inputs['Metallic'])
parts={k:[] for k in ['Body','Head','Arms','LegL','LegR']}
def xyz(p): return (p[0],-p[2],p[1])
def finish(obj,part,color_id,smooth=True):
    obj.data.materials.clear();obj.data.materials.append(mat)
    uv=obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
    idx=next(i for i,p in enumerate(PALETTE) if p[0]==color_id)
    for poly in obj.data.polygons:
        poly.use_smooth=smooth
        for li in poly.loop_indices:
            # Small stable island in the relevant palette cell.
            co=obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=((idx%4+.5+.13*math.sin(co.x*4))/4,
                            (idx//4+.5+.13*math.cos(co.z*4))/4)
    parts[part].append(obj)
    return obj
def surface(name,rings,part,col,segments=24):
    # Hand-authored elliptical loft profiles, not stacked runtime spheres.
    verts=[]
    for y,rx,rz,zc in rings:
        for j in range(segments):
            a=j*2*math.pi/segments
            verts.append(xyz((math.cos(a)*rx,y,zc+math.sin(a)*rz)))
    faces=[]
    for r in range(len(rings)-1):
        for j in range(segments):
            a=r*segments+j;b=r*segments+(j+1)%segments
            faces.append((a,b,b+segments,a+segments))
    faces.append(tuple(reversed(range(segments))))
    faces.append(tuple((len(rings)-1)*segments+j for j in range(segments)))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    # Consistent normals after authoring coordinate conversion.
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');obj.select_set(False)
    return finish(obj,part,col)
def ell(name,p,scale,part,col,seg=16,rings=10):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=xyz(p))
    o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,part,col)
def box(name,p,scale,part,col,bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p))
    o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('Tailored rounded edges','BEVEL');m.width=bevel;m.segments=2
        bpy.ops.object.modifier_apply(modifier=m.name)
        m=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');m.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=m.name)
    return finish(o,part,col)
def tube(name,points,radius,part,col):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=2;c.bevel_depth=radius;c.bevel_resolution=1
    s=c.splines.new('POLY');s.points.add(len(points)-1)
    for pt,p in zip(s.points,points):pt.co=(*xyz(p),1)
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True)
    bpy.ops.object.convert(target='MESH');o.select_set(False)
    return finish(o,part,col)

# Broad shoulders, pinched belt, soft cloth lapels. Height 1.43 game units.
surface('Tailored jacket',[(.34,.16,.12,0),(.39,.22,.15,0),(.58,.255,.17,0),(.70,.24,.15,0),(.76,.145,.105,0)],'Body','cloth')
surface('Webbing belt',[(.345,.20,.145,0),(.40,.224,.157,0)],'Body','edge')
box('Belt buckle',(0,.378,-.162),(.10,.065,.028),'Body','brass',.01)
box('Chest placket',(0,.59,-.172),(.055,.27,.025),'Body','lightblue',.012)
for x in [-.105,.105]:
    box('Chest pocket',(x,.59,-.169),(.105,.105,.035),'Body','trousers',.015)
    box('Pocket flap',(x,.64,-.193),(.115,.03,.025),'Body','lightblue',.008)
    ell('Pocket snap',(x,.636,-.211),(.012,.012,.009),'Body','brass',8,5)
    tube('Shoulder harness',[(x*1.55,.39,-.13),(x*1.55,.65,-.15),(x*1.55,.747,-.03),(x*1.4,.66,.20)],.022,'Body','strap')
# Backpack is sculpted silhouette with padded flap, twin pockets, sleeping roll.
box('Rucksack',(0,.58,.225),(.38,.36,.20),'Body','leather',.065)
box('Padded lid',(0,.77,.24),(.41,.12,.23),'Body','flap',.045)
for x in [-.10,.10]:
    box('Pack front pocket',(x,.52,.347),(.145,.14,.055),'Body','flap',.025)
    box('Leather fastening',(x,.66,.354),(.036,.19,.023),'Body','strap',.008)
    box('Pack buckle',(x,.605,.373),(.06,.05,.018),'Body','brass',.008)
tube('Pack seam',[(-.17,.77,.34),(-.17,.43,.34),(.17,.43,.34),(.17,.77,.34)],.007,'Body','flap')
ell('Bedroll',(0,.87,.23),(.24,.065,.073),'Body','flap',20,8)
for x in [-.14,.14]:box('Roll ties',(x,.87,.23),(.025,.137,.15),'Body','strap',.012)

# Pear-shaped cheeks / jaw and intentionally open face under a raised front brim.
surface('Sculpted face',[(.76,.07,.08,-.015),(.80,.15,.13,-.025),(.88,.22,.187,-.015),(.99,.235,.205,0),(1.11,.224,.18,.015),(1.18,.16,.135,.02),(1.21,.04,.035,.02)],'Head','skin',32)
for x in [-.232,.232]:
    ell('Ear',(x,.99,.004),(.044,.07,.045),'Head','skin')
    ell('Ear inset',(x*1.06,.99,-.024),(.020,.037,.013),'Head','cheek',12,6)
for x in [-.088,.088]:
    ell('Eye white',(x,.995,-.185),(.059,.060,.025),'Head','ivory',20,12)
    ell('Dark expressive eye',(x,.996,-.207),(.032,.043,.012),'Head','ink',16,10)
    ell('Eye sparkle',(x-.010,1.015,-.219),(.010,.013,.005),'Head','ivory',10,6)
    tube('Resolute eyebrow',[(x-.048,1.067,-.191),(x,1.077,-.207),(x+.042,1.067,-.195)],.011,'Head','strap')
    ell('Warm cheek',(x*1.65,.932,-.166),(.040,.022,.012),'Head','cheek',12,7)
ell('Button nose',(0,.951,-.218),(.036,.036,.040),'Head','skin',18,10)
tube('Smile',[(-.059,.904,-.180),(-.025,.891,-.196),(.015,.89,-.199),(.051,.907,-.187)],.009,'Head','strap')
box('Tooth glint',(0,.897,-.205),(.047,.014,.008),'Head','ivory',.004)
# Helmet profile with volume higher than face: readable shell and pronounced rim.
helmet_profile=[]
for i in range(13):
    a=(i/12)*math.pi/2
    helmet_profile.append((1.10+.32*math.sin(a),max(.006,.27*math.cos(a)),max(.006,.238*math.cos(a)),.02))
surface('Helmet crown',helmet_profile,'Head','helmet',32)
surface('Helmet rolled rim',[(1.078,.262,.25,.0),(1.092,.29,.277,-.008),(1.121,.289,.277,-.008),(1.137,.263,.24,.008)],'Head','edge',32)
surface('Blue rim top',[(1.117,.289,.277,-.008),(1.135,.269,.247,.008)],'Head','helmet',32)
# White raised five-point star placed on curved front-facing forehead, tip UP.
verts=[xyz((0,1.255,-.231))]
for j in range(10):
    a=math.pi/2+j*math.pi/5;r=.080 if j%2==0 else .036
    verts.append(xyz((math.cos(a)*r,1.255+math.sin(a)*r,-.239)))
faces=[(0,(j+1)%10+1,j+1) for j in range(10)]
me=bpy.data.meshes.new('Star');me.from_pydata(verts,[],faces);me.update()
ob=bpy.data.objects.new('Raised white star',me);bpy.context.collection.objects.link(ob);finish(ob,'Head','ivory',False)
for x in [-.245,.245]:
    box('Chin strap side',(x,.987,.026),(.025,.19,.035),'Head','strap',.009)
    ell('Helmet rivet',(x*1.10,1.123,.026),(.014,.018,.018),'Head','brass',10,6)
box('Rear helmet label',(0,1.23,.249),(.115,.052,.013),'Head','ivory',.012)

# Both hands support rifle. Gun deliberately offset from torso for in-game readability.
for x in [-.27,.27]:
    ell('Jacket sleeve',(x,.647,-.015),(.092,.12,.10),'Arms','cloth',16,10)
tube('Left supporting sleeve',[(-.27,.62,-.05),(-.23,.53,-.18),(-.08,.50,-.34),(.10,.53,-.44)],.064,'Arms','cloth')
ell('Right forearm',(.24,.55,-.13),(.07,.072,.13),'Arms','cloth')
ell('Support glove',(.12,.55,-.46),(.072,.060,.070),'Arms','ivory')
ell('Trigger glove',(.19,.552,-.21),(.067,.064,.065),'Arms','ivory')
gx=.16
box('Rifle receiver',(gx,.622,-.31),(.15,.125,.31),'Arms','gun',.02)
box('Stock',(gx,.61,-.065),(.12,.14,.22),'Arms','strap',.025)
box('Stock butt',(gx,.61,.05),(.14,.16,.035),'Arms','rubber',.012)
box('Barrel jacket',(gx,.637,-.51),(.11,.095,.17),'Arms','steel',.018)
box('Barrel',(gx,.64,-.645),(.058,.058,.15),'Arms','gun',.012)
box('Muzzle brake',(gx,.64,-.737),(.083,.082,.07),'Arms','steel',.015)
box('Dark bore',(gx,.64,-.775),(.045,.044,.008),'Arms','ink',.008)
box('Magazine',(gx,.501,-.32),(.082,.15,.09),'Arms','gun',.012)
box('Trigger grip',(gx,.52,-.18),(.075,.14,.07),'Arms','rubber',.015)
box('Sight rail',(gx,.703,-.34),(.06,.035,.22),'Arms','ink',.008)
box('Front sight',(gx,.727,-.56),(.023,.07,.025),'Arms','ink',.005)
box('Rear sight',(gx,.726,-.27),(.066,.04,.03),'Arms','steel',.006)
for z in [-.45,-.49,-.53]:box('Handguard vent',(gx+.058,.643,z),(.008,.025,.022),'Arms','ink',.003)
for side,part in [(-1,'LegL'),(1,'LegR')]:
    x=side*.12
    o=surface('Trousers',[(.13,.078,.078,0),(.21,.083,.080,0),(.36,.094,.092,0),(.40,.08,.08,0)],part,'trousers',16)
    o.location.x=x
    box('Knee patch',(x,.225,-.073),(.115,.11,.03),part,'cloth',.025)
    box('Boot upper',(x,.105,-.018),(.17,.17,.20),part,'leather',.04)
    box('Boot toe',(x,.065,-.08),(.18,.11,.29),part,'rubber',.04)
    box('Sole',(x,.025,-.07),(.188,.045,.30),part,'edge',.012)
    box('Boot cuff',(x,.17,.005),(.175,.045,.19),part,'strap',.015)

origins={'Body':(0,0,0),'Head':(0,.78,0),'Arms':(0,.67,0),'LegL':(-.12,.38,0),'LegR':(.12,.38,0)}
joined={}
for part,objects in parts.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
    o=bpy.context.object;o.name=part
    bpy.context.scene.cursor.location=xyz(origins[part]);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    # Collapse duplicate material slots created by join (same atlas, five draws).
    for p in o.data.polygons:p.material_index=0
    o.data.materials.clear();o.data.materials.append(mat)
    joined[part]=o
bpy.ops.object.empty_add(location=xyz((gx,.64,-.78)))
muzzle=bpy.context.object;muzzle.name='Muzzle'
muzzle.parent=joined['Arms'];muzzle.matrix_parent_inverse=joined['Arms'].matrix_world.inverted()
bpy.context.scene['author']='Original Blue Vanguard / generated in Blender, no external character assets'
def export(name):
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name),export_format='GLB',export_yup=True,export_apply=True,export_extras=True)
export('soldier.glb')
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in joined.values())
# Offline decimated LOD keeps the same five attachment contracts/materials.
for o in joined.values():
    bpy.context.view_layer.objects.active=o
    m=o.modifiers.new('Dense rank LOD','DECIMATE');m.ratio=.30
    bpy.ops.object.modifier_apply(modifier=m.name)
export('soldier-lod.glb')
lodtris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in joined.values())
with open(os.path.join(OUT,'model-stats.json'),'w',encoding='utf-8') as f:
    json.dump({'blender':bpy.app.version_string,'triangles':triangles,'lodTriangles':lodtris,'height':1.42,'forward':'-Z','up':'+Y','parts':list(joined),'muzzle':[gx,.64,-.78],'animations':'Six procedural rigid-part states in js/soldier-renderer.js','originalReferenceAvailable':False},f,indent=2)
print('V41_MODEL_STATS',triangles,lodtris)
