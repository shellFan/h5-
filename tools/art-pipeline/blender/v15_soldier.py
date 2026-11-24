"""V15-ART-004 Sculpted Toy Military Rifleman GLB Generator (Blender 4.2 LTS).
Matches the V15 Homepage Hero aesthetic: rounded olive helmet with star & strap,
sculpted tactical vest & shoulder armor, khaki-tan rucksack with bedroll & buckles,
rounded combat boots, chunky M4 assault rifle, baked PBR albedo + ORM atlas.
Authoring coordinates: X right, Y up, -Z forward.
"""
import bpy, math, os, json, random, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUT_SRC = os.path.join(ROOT, 'assets', 'models', 'soldier')
OUT_GAME = os.path.join(ROOT, 'assets', 'game', 'models', 'soldier')
os.makedirs(os.path.join(OUT_SRC, 'textures'), exist_ok=True)
os.makedirs(OUT_GAME, exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
random.seed(1504)

# V15-ART-005 Matte Toy Military PBR Palette (clear cloth/leather/metal separation, soft matte helmet)
PALETTE = [
    ('helmet',   (0.155, 0.285, 0.095), 0.58, 0.05),  # 0: soft matte olive toy helmet (no harsh plastic glare!)
    ('helm_rim', (0.095, 0.185, 0.058), 0.52, 0.12),  # 1: thicker matte-satin helmet rim
    ('cloth',    (0.175, 0.290, 0.112), 0.86, 0.00),  # 2: matte woven olive tactical jacket
    ('trousers', (0.125, 0.210, 0.082), 0.88, 0.00),  # 3: matte combat trousers
    ('skin',     (0.920, 0.560, 0.330), 0.68, 0.00),  # 4: warm cartoon skin
    ('cheek',    (0.880, 0.340, 0.240), 0.74, 0.00),  # 5: warm rosy cheek
    ('ivory',    (0.960, 0.955, 0.890), 0.52, 0.00),  # 6: crisp star / chevron / eye white
    ('ink',      (0.028, 0.034, 0.044), 0.65, 0.00),  # 7: dark pupils / bore / rubber sole
    ('pack',     (0.390, 0.305, 0.155), 0.84, 0.00),  # 8: matte woven khaki-tan canvas rucksack
    ('pack_hi',  (0.510, 0.415, 0.220), 0.80, 0.00),  # 9: lighter canvas flap / pouches
    ('strap',    (0.185, 0.125, 0.065), 0.68, 0.04),  # 10: satin-matte dark leather straps
    ('brass',    (0.900, 0.650, 0.180), 0.26, 0.78),  # 11: metallic brass buckles & rivets
    ('gun',      (0.095, 0.118, 0.140), 0.30, 0.70),  # 12: brushed gunmetal receiver
    ('steel',    (0.240, 0.285, 0.320), 0.26, 0.80),  # 13: metallic steel barrel & rail
    ('boot',     (0.165, 0.118, 0.065), 0.64, 0.05),  # 14: leather combat boot
    ('vest',     (0.240, 0.330, 0.145), 0.78, 0.02),  # 15: lighter olive tactical vest & knee pads
]

def image_atlas(name, orm=False):
    w, h = 256, 256
    im = bpy.data.images.new(name, width=w, height=h, alpha=True)
    if orm:
        im.colorspace_settings.name = 'Non-Color'
    pix = []
    for yy in range(h):
        for xx in range(w):
            cell = (yy // 64) * 4 + (xx // 64)
            _, col, rough, metal = PALETTE[cell]
            if orm:
                rgb = (1.0, rough, metal)
            else:
                # Soft vertical AO-like gradient inside each palette cell for richer 3D shading
                ly = (yy % 64) / 63.0
                f = 0.90 + 0.14 * ly + random.uniform(-0.004, 0.004)
                rgb = tuple(max(0.0, min(1.0, c * f)) for c in col)
            pix.extend((*rgb, 1.0))
    im.pixels = pix
    im.filepath_raw = os.path.join(OUT_SRC, 'textures', name + '.png')
    im.file_format = 'PNG'
    im.save()
    return im

color_img = image_atlas('soldier-basecolor', orm=False)
orm_img = image_atlas('soldier-orm', orm=True)

mat = bpy.data.materials.new('V15_ToyMilitary_PBR')
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links
bsdf = nodes.get('Principled BSDF')
tex_c = nodes.new('ShaderNodeTexImage'); tex_c.image = color_img
links.new(tex_c.outputs['Color'], bsdf.inputs['Base Color'])
tex_orm = nodes.new('ShaderNodeTexImage'); tex_orm.image = orm_img
sep = nodes.new('ShaderNodeSeparateColor')
links.new(tex_orm.outputs['Color'], sep.inputs[0])
links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])

parts = {k: [] for k in ['Body', 'Head', 'Arms', 'LegL', 'LegR']}

def xyz(p):
    return (p[0], -p[2], p[1])

def finish(obj, part, color_id, smooth=True):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
    idx = next(i for i, p in enumerate(PALETTE) if p[0] == color_id)
    for poly in obj.data.polygons:
        poly.use_smooth = smooth
        for li in poly.loop_indices:
            co = obj.data.vertices[obj.data.loops[li].vertex_index].co
            # Height-biased UV sampling within palette cell for subtle baked top-lit shading
            v_bias = max(-0.18, min(0.18, (co.z - 0.55) * 0.22))
            uv.data[li].uv = (
                (idx % 4 + 0.5 + 0.12 * math.sin(co.x * 5.0)) / 4.0,
                (idx // 4 + 0.5 + v_bias) / 4.0
            )
    parts[part].append(obj)
    return obj

def surface(name, rings, part, col, segments=22):
    verts = []
    for y, rx, rz, zc in rings:
        for j in range(segments):
            a = j * 2 * math.pi / segments
            verts.append(xyz((math.cos(a) * rx, y, zc + math.sin(a) * rz)))
    faces = []
    for r in range(len(rings) - 1):
        for j in range(segments):
            a = r * segments + j
            b = r * segments + (j + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces.append(tuple(reversed(range(segments))))
    faces.append(tuple((len(rings) - 1) * segments + j for j in range(segments)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)
    return finish(obj, part, col)

def ell(name, p, scale, part, col, seg=14, rings=9):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=xyz(p))
    o = bpy.context.object; o.name = name
    o.scale = (scale[0], scale[2], scale[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(o, part, col)

def rbox(name, p, scale, part, col, bevel=0.032):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
    o = bpy.context.object; o.name = name
    o.scale = (scale[0], scale[2], scale[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        m = o.modifiers.new('Bevel', 'BEVEL')
        m.width = min(bevel, min(scale) * 0.42)
        m.segments = 2
        bpy.ops.object.modifier_apply(modifier=m.name)
    return finish(o, part, col)

def tube(name, points, radius, part, col):
    c = bpy.data.curves.new(name, 'CURVE')
    c.dimensions = '3D'; c.resolution_u = 2; c.bevel_depth = radius; c.bevel_resolution = 2
    s = c.splines.new('POLY'); s.points.add(len(points) - 1)
    for pt, p in zip(s.points, points):
        pt.co = (*xyz(p), 1)
    o = bpy.data.objects.new(name, c)
    bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.convert(target='MESH'); o.select_set(False)
    return finish(o, part, col)

# === 1. BODY: Rounded Tactical Vest, Shoulder Armor, Sculpted Khaki Rucksack (Back-Hero!) ===
surface('Torso', [
    (0.35, 0.17, 0.13, 0.0),
    (0.42, 0.23, 0.16, 0.0),
    (0.58, 0.26, 0.18, 0.0),
    (0.71, 0.24, 0.16, 0.0),
    (0.78, 0.14, 0.11, 0.0)
], 'Body', 'cloth', 22)
# Layered tactical vest shell + utility belt
surface('TacticalVest', [
    (0.44, 0.24, 0.17, 0.0),
    (0.58, 0.275, 0.19, 0.0),
    (0.69, 0.255, 0.175, 0.0)
], 'Body', 'vest', 20)
surface('Belt', [(0.35, 0.22, 0.155, 0.0), (0.415, 0.242, 0.168, 0.0)], 'Body', 'strap', 20)
rbox('BeltBuckle', (0, 0.382, -0.172), (0.095, 0.062, 0.03), 'Body', 'brass', 0.012)
# Back & side belt ammo pouches (prominent from rear battle camera!)
for x in [-0.15, 0.15]:
    rbox('RearBeltPouch', (x, 0.385, 0.165), (0.11, 0.09, 0.065), 'Body', 'pack', 0.024)
    ell('PouchSnap', (x, 0.405, 0.198), (0.014, 0.014, 0.010), 'Body', 'brass', 8, 5)
# Rounded domed tactical shoulder pauldrons
for s in [-1, 1]:
    ell('ShoulderArmor', (s * 0.265, 0.69, 0.01), (0.115, 0.088, 0.115), 'Body', 'vest', 14, 8)
    rbox('ShoulderStrap', (s * 0.18, 0.72, 0.02), (0.055, 0.032, 0.24), 'Body', 'strap', 0.012)
# Sculpted rounded khaki-tan military rucksack (visible from behind!)
surface('RucksackBody', [
    (0.43, 0.17, 0.085, 0.23),
    (0.50, 0.20, 0.105, 0.235),
    (0.66, 0.195, 0.105, 0.235),
    (0.75, 0.17, 0.085, 0.23)
], 'Body', 'pack', 20)
# Curved padded top flap + rolled olive sleeping mat
ell('PackLid', (0, 0.735, 0.245), (0.205, 0.075, 0.115), 'Body', 'pack_hi', 16, 8)
ell('Bedroll', (0, 0.825, 0.235), (0.215, 0.062, 0.068), 'Body', 'helmet', 16, 8)
for x in [-0.115, 0.115]:
    rbox('PackStrap', (x, 0.62, 0.335), (0.036, 0.22, 0.022), 'Body', 'strap', 0.008)
    rbox('PackBuckle', (x, 0.57, 0.348), (0.056, 0.044, 0.020), 'Body', 'brass', 0.008)
    ell('SidePouch', (x * 1.65, 0.54, 0.235), (0.055, 0.088, 0.062), 'Body', 'pack_hi', 12, 7)
    rbox('RollTie', (x, 0.825, 0.235), (0.028, 0.132, 0.142), 'Body', 'strap', 0.010)
# Crisp white 5-point star patch on back of rucksack!
rverts = [xyz((0, 0.62, 0.352))]
for j in range(10):
    a = math.pi / 2 + j * math.pi / 5
    r = 0.058 if j % 2 == 0 else 0.026
    rverts.append(xyz((math.cos(a) * r, 0.62 + math.sin(a) * r, 0.356)))
rfaces = [(0, j + 1, (j + 1) % 10 + 1) for j in range(10)]
rm = bpy.data.meshes.new('PackStar'); rm.from_pydata(rverts, [], rfaces); rm.update()
ro = bpy.data.objects.new('PackStar', rm); bpy.context.collection.objects.link(ro); finish(ro, 'Body', 'ivory', False)

# === 2. HEAD: Smooth Toy Head + Glossy Olive Helmet with Front Star & Rear Chevrons ===
surface('Face', [
    (0.76, 0.08, 0.085, -0.01),
    (0.81, 0.155, 0.135, -0.02),
    (0.90, 0.222, 0.190, -0.01),
    (1.01, 0.236, 0.206, 0.0),
    (1.12, 0.220, 0.180, 0.015),
    (1.19, 0.145, 0.125, 0.02)
], 'Head', 'skin', 24)
for x in [-0.232, 0.232]:
    ell('Ear', (x, 0.99, 0.005), (0.044, 0.068, 0.044), 'Head', 'skin', 10, 6)
for x in [-0.086, 0.086]:
    ell('EyeWhite', (x, 1.00, -0.186), (0.056, 0.058, 0.024), 'Head', 'ivory', 14, 8)
    ell('Pupil', (x, 1.00, -0.207), (0.030, 0.040, 0.012), 'Head', 'ink', 12, 8)
    tube('Brow', [(x - 0.045, 1.068, -0.192), (x, 1.078, -0.208), (x + 0.042, 1.066, -0.195)], 0.012, 'Head', 'strap')
    ell('Cheek', (x * 1.62, 0.935, -0.168), (0.038, 0.022, 0.012), 'Head', 'cheek', 10, 6)
ell('Nose', (0, 0.955, -0.216), (0.034, 0.034, 0.036), 'Head', 'skin', 12, 7)
# Glossy rounded military helmet dome + rolled brim
h_prof = []
for i in range(11):
    a = (i / 10.0) * math.pi / 2.0
    h_prof.append((1.10 + 0.33 * math.sin(a), max(0.008, 0.278 * math.cos(a)), max(0.008, 0.248 * math.cos(a)), 0.018))
surface('HelmetDome', h_prof, 'Head', 'helmet', 26)
surface('HelmetBrim', [
    (1.075, 0.268, 0.256, 0.002),
    (1.094, 0.298, 0.285, -0.006),
    (1.124, 0.296, 0.284, -0.006),
    (1.140, 0.268, 0.248, 0.010)
], 'Head', 'helm_rim', 26)
# Helmet chin strap & brass rivets
for x in [-0.245, 0.245]:
    rbox('ChinStrap', (x, 0.985, 0.025), (0.024, 0.185, 0.032), 'Head', 'strap', 0.008)
    ell('HelmRivet', (x * 1.11, 1.13, 0.025), (0.016, 0.018, 0.018), 'Head', 'brass', 8, 6)
# Raised white star on front + crisp double white chevrons on back of helmet!
fverts = [xyz((0, 1.26, -0.242))]
for j in range(10):
    a = math.pi / 2 + j * math.pi / 5
    r = 0.082 if j % 2 == 0 else 0.036
    fverts.append(xyz((math.cos(a) * r, 1.26 + math.sin(a) * r, -0.250)))
ffaces = [(0, (j + 1) % 10 + 1, j + 1) for j in range(10)]
fm = bpy.data.meshes.new('FrontStar'); fm.from_pydata(fverts, [], ffaces); fm.update()
fo = bpy.data.objects.new('FrontStar', fm); bpy.context.collection.objects.link(fo); finish(fo, 'Head', 'ivory', False)
tube('RearChevron1', [(-0.070, 1.24, 0.248), (0, 1.208, 0.264), (0.070, 1.24, 0.248)], 0.011, 'Head', 'ivory')
tube('RearChevron2', [(-0.052, 1.192, 0.258), (0, 1.168, 0.268), (0.052, 1.192, 0.258)], 0.009, 'Head', 'ivory')

# === 3. ARMS & CHUNKY STYLIZED ASSAULT RIFLE ===
for x in [-0.275, 0.275]:
    ell('SleeveUpper', (x, 0.64, -0.015), (0.090, 0.115, 0.095), 'Arms', 'cloth', 14, 8)
tube('LeftArm', [(-0.27, 0.61, -0.05), (-0.22, 0.52, -0.19), (0.02, 0.50, -0.35), (0.31, 0.54, -0.45)], 0.062, 'Arms', 'cloth')
ell('RightForearm', (0.33, 0.55, -0.13), (0.072, 0.072, 0.135), 'Arms', 'cloth', 12, 8)
ell('GloveL', (0.35, 0.55, -0.46), (0.074, 0.062, 0.072), 'Arms', 'strap', 12, 7)
ell('GloveR', (0.38, 0.555, -0.21), (0.068, 0.064, 0.066), 'Arms', 'strap', 12, 7)
gx = 0.40
rbox('Receiver', (gx, 0.625, -0.31), (0.145, 0.125, 0.32), 'Arms', 'gun', 0.024)
rbox('Stock', (gx, 0.61, -0.065), (0.115, 0.135, 0.22), 'Arms', 'helmet', 0.026)
rbox('StockPad', (gx, 0.61, 0.052), (0.128, 0.150, 0.036), 'Arms', 'ink', 0.012)
rbox('Handguard', (gx, 0.638, -0.51), (0.108, 0.096, 0.18), 'Arms', 'helmet', 0.022)
ell('BarrelCyl', (gx, 0.64, -0.66), (0.034, 0.034, 0.11), 'Arms', 'steel', 10, 6)
rbox('MuzzleBrake', (gx, 0.64, -0.742), (0.078, 0.078, 0.068), 'Arms', 'steel', 0.016)
rbox('Magazine', (gx, 0.498, -0.32), (0.076, 0.155, 0.088), 'Arms', 'gun', 0.016)
rbox('PistolGrip', (gx, 0.52, -0.18), (0.072, 0.135, 0.068), 'Arms', 'ink', 0.016)
rbox('TopRail', (gx, 0.708, -0.33), (0.056, 0.038, 0.24), 'Arms', 'steel', 0.010)
rbox('FrontSight', (gx, 0.73, -0.56), (0.024, 0.068, 0.026), 'Arms', 'gun', 0.006)

# === 4. LEGS: Sculpted Tapered Trousers, Rounded Knee Pads, Sculpted Combat Boots ===
for side, part in [(-1, 'LegL'), (1, 'LegR')]:
    x = side * 0.122
    leg = surface('Trousers', [
        (0.14, 0.080, 0.080, 0.0),
        (0.22, 0.088, 0.086, 0.0),
        (0.36, 0.098, 0.095, 0.0),
        (0.41, 0.084, 0.082, 0.0)
    ], part, 'trousers', 16)
    leg.location.x = x
    # Rounded knee pad
    ell('KneePad', (x, 0.23, -0.072), (0.064, 0.060, 0.034), part, 'vest', 12, 7)
    # Sculpted combat boot (rounded ankle shaft + domed toe cap + chunky rubber sole, ZERO cubes!)
    bshaft = surface('BootShaft', [
        (0.04, 0.085, 0.092, -0.01),
        (0.10, 0.086, 0.094, -0.005),
        (0.165, 0.090, 0.096, 0.002)
    ], part, 'boot', 16)
    bshaft.location.x = x
    ell('BootToe', (x, 0.068, -0.085), (0.088, 0.056, 0.125), part, 'boot', 14, 8)
    ell('BootSole', (x, 0.026, -0.055), (0.096, 0.028, 0.148), part, 'ink', 14, 6)
    ell('BootCuff', (x, 0.168, 0.002), (0.094, 0.026, 0.098), part, 'strap', 14, 6)

# === 5. JOIN PARTS, SET PIVOTS & EXPORT HERO + LOD GLB ===
origins = {'Body': (0, 0, 0), 'Head': (0, 0.78, 0), 'Arms': (0, 0.67, 0), 'LegL': (-0.122, 0.38, 0), 'LegR': (0.122, 0.38, 0)}
joined = {}
for part, objs in parts.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = part
    bpy.context.scene.cursor.location = xyz(origins[part])
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    for p in o.data.polygons:
        p.material_index = 0
    o.data.materials.clear()
    o.data.materials.append(mat)
    joined[part] = o

bpy.ops.object.empty_add(location=xyz((gx, 0.64, -0.78)))
muzzle = bpy.context.object
muzzle.name = 'Muzzle'
muzzle.parent = joined['Arms']
muzzle.matrix_parent_inverse = joined['Arms'].matrix_world.inverted()

def export_glb(name):
    src_path = os.path.join(OUT_SRC, name)
    bpy.ops.export_scene.gltf(filepath=src_path, export_format='GLB', export_yup=True, export_apply=True, export_extras=True)
    shutil.copy2(src_path, os.path.join(OUT_GAME, name))

export_glb('soldier.glb')
hero_tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in joined.values())

for o in joined.values():
    bpy.context.view_layer.objects.active = o
    m = o.modifiers.new('V15_LOD', 'DECIMATE')
    m.ratio = 0.28
    bpy.ops.object.modifier_apply(modifier=m.name)

export_glb('soldier-lod.glb')
lod_tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in joined.values())

with open(os.path.join(OUT_SRC, 'model-stats.json'), 'w', encoding='utf-8') as f:
    json.dump({'version': 'V15-ART-004', 'blender': bpy.app.version_string, 'heroTriangles': hero_tris, 'lodTriangles': lod_tris, 'parts': list(joined)}, f, indent=2)
print('V15_SOLDIER_DONE', 'hero_tris=', hero_tris, 'lod_tris=', lod_tris)
