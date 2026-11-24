"""V15-ART-005 Modular 3D Military Base Environment GLB Pack (Blender 4.2 LTS).
Generates assets/game/v15/env_military_pack.glb containing 6 sculpted beveled
Toy-Military Cartoon architectural & natural prop meshes sharing 1 PBR atlas:
  - PineTree (3-tier stylized pine tree with tapered bark trunk)
  - Watchtower (X-braced wooden guard tower + parapet + pitched roof)
  - ToyTank (beveled hull + track skirts + road wheels + rounded turret + gun barrel)
  - MilitaryTent (peaked olive canvas field tent + dark doorway + corner poles)
  - BunkerGate (fortified fortress gatehouse + crenellations + gold star + red banners)
  - SandbagBunker (curved stack of sculpted rounded sandbags + banded ammo crate)
"""
import bpy, math, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUT_GLB = os.path.join(ROOT, 'assets', 'game', 'v15', 'env_military_pack.glb')
TEX_DIR = os.path.join(ROOT, 'tools', 'art-pipeline', 'textures')
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
os.makedirs(TEX_DIR, exist_ok=True)
random.seed(1509)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

PALETTE = [
    ('pine_dk',   (0.08, 0.28, 0.09), 0.84, 0.00),  # 0: deep pine green
    ('pine_lt',   (0.16, 0.42, 0.14), 0.80, 0.00),  # 1: sunlit pine green
    ('wood',      (0.36, 0.21, 0.09), 0.82, 0.00),  # 2: warm watchtower timber
    ('wood_dk',   (0.22, 0.12, 0.05), 0.86, 0.00),  # 3: dark wood beams / trunk
    ('tank_olv',  (0.18, 0.28, 0.10), 0.50, 0.22),  # 4: olive military tank hull
    ('tank_trk',  (0.05, 0.06, 0.07), 0.72, 0.25),  # 5: dark rubber/steel treads
    ('tent',      (0.22, 0.30, 0.13), 0.88, 0.00),  # 6: matte olive canvas tent
    ('tent_dk',   (0.04, 0.06, 0.05), 0.90, 0.00),  # 7: dark tent interior / gate void
    ('stone',     (0.46, 0.45, 0.40), 0.84, 0.00),  # 8: warm fortress concrete/stone
    ('stone_dk',  (0.30, 0.31, 0.28), 0.86, 0.02),  # 9: fortress trim / parapet
    ('gold',      (0.95, 0.68, 0.12), 0.28, 0.72),  # 10: fortress gold star & trim
    ('red',       (0.72, 0.10, 0.09), 0.66, 0.00),  # 11: military red banners
    ('sandbag',   (0.62, 0.50, 0.30), 0.90, 0.00),  # 12: warm burlap sandbags
    ('crate',     (0.26, 0.36, 0.14), 0.74, 0.05),  # 13: olive military ammo crate
    ('steel',     (0.22, 0.26, 0.30), 0.34, 0.72),  # 14: gun barrel / hinges / ladder
    ('lamp',      (1.00, 0.92, 0.55), 0.18, 0.00),  # 15: searchlight glow
]

def make_atlas(name, orm=False):
    w, h = 256, 256
    im = bpy.data.images.new(name, width=w, height=h, alpha=True)
    if orm: im.colorspace_settings.name = 'Non-Color'
    pix = []
    for yy in range(h):
        for xx in range(w):
            cell = (yy // 64) * 4 + (xx // 64)
            _, col, rough, metal = PALETTE[cell]
            if orm:
                rgb = (1.0, rough, metal)
            else:
                ly = (yy % 64) / 63.0
                f = 0.88 + 0.16 * ly + random.uniform(-0.004, 0.004)
                rgb = tuple(max(0.0, min(1.0, c * f)) for c in col)
            pix.extend((*rgb, 1.0))
    im.pixels = pix
    im.filepath_raw = os.path.join(TEX_DIR, name + '.png')
    im.file_format = 'PNG'
    im.save()
    return im

c_img = make_atlas('V15_EnvPack-basecolor', False)
orm_img = make_atlas('V15_EnvPack-orm', True)
mat = bpy.data.materials.new('V15_EnvPack_PBR')
mat.use_nodes = True
nodes = mat.node_tree.nodes; links = mat.node_tree.links
bsdf = nodes.get('Principled BSDF')
tc = nodes.new('ShaderNodeTexImage'); tc.image = c_img
links.new(tc.outputs['Color'], bsdf.inputs['Base Color'])
to = nodes.new('ShaderNodeTexImage'); to.image = orm_img
sep = nodes.new('ShaderNodeSeparateColor')
links.new(to.outputs['Color'], sep.inputs[0])
links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])

def xyz(p): return (p[0], -p[2], p[1])

def tag_uv(obj, col_id, smooth=True):
    obj.data.materials.clear(); obj.data.materials.append(mat)
    uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
    idx = next(i for i, p in enumerate(PALETTE) if p[0] == col_id)
    for poly in obj.data.polygons:
        poly.use_smooth = smooth
        for li in poly.loop_indices:
            co = obj.data.vertices[obj.data.loops[li].vertex_index].co
            vb = max(-0.18, min(0.18, (co.z - 0.8) * 0.12))
            uv.data[li].uv = ((idx % 4 + 0.5 + 0.12 * math.sin(co.x * 3.0)) / 4.0, (idx // 4 + 0.5 + vb) / 4.0)
    return obj

def rbox(lst, p, scale, col, bevel=0.04, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
    o = bpy.context.object; o.scale = (scale[0], scale[2], scale[1]); o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if bevel:
        m = o.modifiers.new('B', 'BEVEL'); m.width = min(bevel, min(scale) * 0.35); m.segments = 1
        bpy.ops.object.modifier_apply(modifier=m.name)
    lst.append(tag_uv(o, col))

def cyl(lst, p, r, depth, col, seg=10, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=depth, location=xyz(p))
    o = bpy.context.object; o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    lst.append(tag_uv(o, col))

def cone(lst, p, r1, depth, col, seg=10, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r1, depth=depth, location=xyz(p))
    o = bpy.context.object; o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    lst.append(tag_uv(o, col))

def ell(lst, p, scale, col, seg=10, rings=7):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=xyz(p))
    o = bpy.context.object; o.scale = (scale[0], scale[2], scale[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    lst.append(tag_uv(o, col))

def join_prop(name, objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.object; o.name = name
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    for p in o.data.polygons: p.material_index = 0
    o.data.materials.clear(); o.data.materials.append(mat)
    return o

# 1. Stylized 3-Tier Pine Tree
pts = []
cyl(pts, (0, 0.7, 0), 0.22, 1.4, 'wood_dk', 8)
cone(pts, (0, 1.85, 0), 1.35, 1.65, 'pine_dk', 9)
cone(pts, (0, 2.75, 0), 1.05, 1.45, 'pine_lt', 9)
cone(pts, (0, 3.55, 0), 0.72, 1.25, 'pine_lt', 9)
join_prop('PineTree', pts)

# 2. Wooden X-Braced Military Watchtower
wt = []
for sx in [-0.85, 0.85]:
    for sz in [-0.85, 0.85]:
        rbox(wt, (sx, 2.1, sz), (0.20, 4.2, 0.20), 'wood_dk', 0.02)
# Cross X-bracing beams
for sz in [-0.85, 0.85]:
    rbox(wt, (0, 1.4, sz), (1.85, 0.14, 0.14), 'wood', 0.02, (0, 0.68, 0))
    rbox(wt, (0, 1.4, sz), (1.85, 0.14, 0.14), 'wood', 0.02, (0, -0.68, 0))
# Platform deck + wooden guard parapet walls + pitched roof + searchlight
rbox(wt, (0, 2.95, 0), (2.25, 0.24, 2.25), 'wood', 0.04)
rbox(wt, (0, 3.45, 0.98), (2.15, 0.78, 0.16), 'wood', 0.03)
rbox(wt, (0, 3.45, -0.98), (2.15, 0.78, 0.16), 'wood', 0.03)
rbox(wt, (-0.98, 3.45, 0), (0.16, 0.78, 2.15), 'wood', 0.03)
rbox(wt, (0.98, 3.45, 0), (0.16, 0.78, 2.15), 'wood', 0.03)
cone(wt, (0, 4.68, 0), 1.82, 1.15, 'wood_dk', 4, (0, 0, math.pi * 0.25))
ell(wt, (0.95, 3.92, 0.65), (0.20, 0.20, 0.20), 'lamp', 8, 6)
join_prop('Watchtower', wt)

# 3. Sculpted Toy Military Tank
tk = []
rbox(tk, (0, 0.72, 0), (2.10, 0.68, 3.15), 'tank_olv', 0.12)
rbox(tk, (0, 0.96, -0.75), (1.65, 0.34, 0.95), 'tank_olv', 0.08)
for sx in [-1.05, 1.05]:
    rbox(tk, (sx, 0.44, 0), (0.50, 0.64, 3.35), 'tank_trk', 0.14)
    for wz in [-1.15, -0.38, 0.38, 1.15]:
        cyl(tk, (sx * 1.04, 0.36, wz), 0.26, 0.54, 'steel', 10, (0, math.pi * 0.5, 0))
# Rounded beveled turret + cupola + barrel with muzzle brake
rbox(tk, (0, 1.38, -0.10), (1.42, 0.62, 1.65), 'tank_olv', 0.16)
cyl(tk, (-0.25, 1.76, -0.25), 0.28, 0.18, 'tank_olv', 10)
cyl(tk, (0, 1.42, 1.55), 0.12, 2.15, 'steel', 10, (math.pi * 0.5, 0, 0))
rbox(tk, (0, 1.42, 2.65), (0.30, 0.28, 0.34), 'tank_trk', 0.05)
join_prop('ToyTank', tk)

# 4. Peaked Olive Canvas Military Tent
tn = []
rbox(tn, (0, 0.95, 0), (3.8, 1.9, 4.6), 'tent', 0.08)
# Pitched prism roof (4-sided stretched cone)
cone(tn, (0, 2.45, 0), 3.1, 1.35, 'tent', 4, (0, 0, math.pi * 0.25))
rbox(tn, (0, 0.78, 2.28), (1.25, 1.55, 0.16), 'tent_dk', 0.04)
for sx in [-1.95, 1.95]:
    for sz in [-2.25, 2.25]:
        cyl(tn, (sx, 1.05, sz), 0.08, 2.1, 'wood_dk', 6)
join_prop('MilitaryTent', tn)

# 5. Fortified Sunlit Military Base Gatehouse (Landmark Horizon!)
bg = []
# Left & right fortified battlement walls
rbox(bg, (-12.5, 2.8, 0), (12.0, 5.6, 2.8), 'stone', 0.12)
rbox(bg, (12.5, 2.8, 0), (12.0, 5.6, 2.8), 'stone', 0.12)
# Crenellations along top of walls
for cx in [-16.5, -13.5, -10.5, 10.5, 13.5, 16.5]:
    rbox(bg, (cx, 6.0, 0), (1.6, 1.0, 3.0), 'stone_dk', 0.08)
# Central gatehouse arch & twin heavy bastions
rbox(bg, (0, 6.8, 0), (11.5, 3.4, 3.4), 'stone', 0.14)
rbox(bg, (0, 8.8, 0), (12.2, 0.7, 3.9), 'stone_dk', 0.08)
rbox(bg, (0, 2.6, -0.3), (7.6, 5.2, 2.2), 'tent_dk', 0.06)
for sx in [-5.6, 5.6]:
    rbox(bg, (sx, 5.0, 0.25), (3.8, 10.0, 4.0), 'stone', 0.16)
    rbox(bg, (sx, 10.2, 0.25), (4.3, 0.9, 4.5), 'stone_dk', 0.10)
    rbox(bg, (sx, 8.9, 0.25), (4.0, 0.45, 4.2), 'gold', 0.05)
    # Hanging red banners with gold bars
    rbox(bg, (sx * 0.72, 6.0, 2.05), (1.45, 2.8, 0.12), 'red', 0.03)
    rbox(bg, (sx * 0.72, 7.35, 2.10), (1.65, 0.26, 0.16), 'gold', 0.03)
# Giant 3D raised gold 5-point star emblem above gate!
cyl(bg, (0, 6.8, 1.78), 1.55, 0.30, 'stone_dk', 16, (math.pi * 0.5, 0, 0))
verts = [xyz((0, 6.8, 2.18))]
for j in range(10):
    a = math.pi / 2 + j * math.pi / 5
    r = 1.25 if j % 2 == 0 else 0.54
    verts.append(xyz((math.cos(a) * r, 6.8 + math.sin(a) * r, 2.02)))
faces = [(0, j + 1, (j + 1) % 10 + 1) for j in range(10)]
sm = bpy.data.meshes.new('GateStar'); sm.from_pydata(verts, [], faces); sm.update()
so = bpy.data.objects.new('GateStar', sm); bpy.context.collection.objects.link(so)
bg.append(tag_uv(so, 'gold', False))
join_prop('BunkerGate', bg)

# 6. Sculpted Sandbag Bunker + Olive Military Ammo Crate
sb = []
for i in range(4):
    ell(sb, (-0.9 + i * 0.6, 0.22, 0), (0.34, 0.20, 0.24), 'sandbag', 10, 6)
for i in range(3):
    ell(sb, (-0.6 + i * 0.6, 0.52, -0.02), (0.34, 0.19, 0.23), 'sandbag', 10, 6)
rbox(sb, (1.15, 0.42, -0.15), (0.88, 0.78, 0.78), 'crate', 0.06)
rbox(sb, (1.15, 0.78, -0.15), (0.94, 0.14, 0.84), 'tank_olv', 0.03)
rbox(sb, (1.15, 0.42, 0.25), (0.24, 0.14, 0.05), 'gold', 0.01)
join_prop('SandbagBunker', sb)

bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', export_yup=True, export_apply=True)
total_tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')
print('V15_ENV_PACK_DONE', 'file=', OUT_GLB, 'size=', os.path.getsize(OUT_GLB), 'tris=', total_tris)
