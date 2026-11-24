"""V15-ART-004 Sculpted Purple Cartoon Monster & Independent Heavy Mecha Iron-Fist Boss GLB Generator.
Builds true standalone 3D sculpted GLBs (NOT recolored cubes!) preserving the exact 5-part
(Body, Head, Arms, LegL, LegR) + 2-PNG PBR contract required by js/enemy-models.js.
Exports directly into assets/game/models/zombies/normal/ and assets/game/models/bosses/{bruiser,overlord,bulwark,titan}/.
"""
import bpy, math, os, random, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
GAME_MODELS = os.path.join(ROOT, 'assets', 'game', 'models')
TEX_DIR = os.path.join(ROOT, 'tools', 'art-pipeline', 'textures')
os.makedirs(TEX_DIR, exist_ok=True)
random.seed(1505)

def reset_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)
    for mat in list(bpy.data.materials): bpy.data.materials.remove(mat)
    for im in list(bpy.data.images): bpy.data.images.remove(im)

def build_pbr_material(name, palette):
    def make_atlas(fname, orm=False):
        w, h = 256, 256
        im = bpy.data.images.new(fname, width=w, height=h, alpha=True)
        if orm: im.colorspace_settings.name = 'Non-Color'
        pix = []
        for yy in range(h):
            for xx in range(w):
                cell = (yy // 64) * 4 + (xx // 64)
                _, col, rough, metal = palette[cell % len(palette)]
                if orm:
                    rgb = (1.0, rough, metal)
                else:
                    ly = (yy % 64) / 63.0
                    f = 0.88 + 0.16 * ly + random.uniform(-0.004, 0.004)
                    rgb = tuple(max(0.0, min(1.0, c * f)) for c in col)
                pix.extend((*rgb, 1.0))
        im.pixels = pix
        im.filepath_raw = os.path.join(TEX_DIR, fname + '.png')
        im.file_format = 'PNG'
        im.save()
        return im

    c_img = make_atlas(name + '-basecolor', False)
    orm_img = make_atlas(name + '-orm', True)
    mat = bpy.data.materials.new(name + '_PBR')
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
    return mat

def xyz(p): return (p[0], -p[2], p[1])

class Builder:
    def __init__(self, mat, palette):
        self.mat = mat
        self.palette = palette
        self.parts = {k: [] for k in ['Body', 'Head', 'Arms', 'LegL', 'LegR']}

    def finish(self, obj, part, col_id, smooth=True):
        obj.data.materials.clear(); obj.data.materials.append(self.mat)
        uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
        idx = next(i for i, p in enumerate(self.palette) if p[0] == col_id)
        for poly in obj.data.polygons:
            poly.use_smooth = smooth
            for li in poly.loop_indices:
                co = obj.data.vertices[obj.data.loops[li].vertex_index].co
                vb = max(-0.18, min(0.18, (co.z - 0.5) * 0.22))
                uv.data[li].uv = ((idx % 4 + 0.5 + 0.12 * math.sin(co.x * 5.0)) / 4.0, (idx // 4 + 0.5 + vb) / 4.0)
        self.parts[part].append(obj)
        return obj

    def surface(self, name, rings, part, col, seg=20):
        verts = []
        for y, rx, rz, zc in rings:
            for j in range(seg):
                a = j * 2 * math.pi / seg
                verts.append(xyz((math.cos(a) * rx, y, zc + math.sin(a) * rz)))
        faces = []
        for r in range(len(rings) - 1):
            for j in range(seg):
                a = r * seg + j; b = r * seg + (j + 1) % seg
                faces.append((a, b, b + seg, a + seg))
        faces.append(tuple(reversed(range(seg))))
        faces.append(tuple((len(rings) - 1) * seg + j for j in range(seg)))
        m = bpy.data.meshes.new(name); m.from_pydata(verts, [], faces); m.update()
        o = bpy.data.objects.new(name, m); bpy.context.collection.objects.link(o)
        bpy.context.view_layer.objects.active = o; o.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')
        o.select_set(False)
        return self.finish(o, part, col)

    def ell(self, name, p, scale, part, col, seg=14, rings=9, rot=(0, 0, 0)):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=xyz(p))
        o = bpy.context.object; o.name = name
        o.scale = (scale[0], scale[2], scale[1])
        o.rotation_euler = rot
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        return self.finish(o, part, col)

    def cone(self, name, p, r1, depth, part, col, seg=10, rot=(0, 0, 0)):
        bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r1, depth=depth, location=xyz(p))
        o = bpy.context.object; o.name = name
        o.rotation_euler = rot
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        return self.finish(o, part, col)

    def rbox(self, name, p, scale, part, col, bevel=0.03):
        bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
        o = bpy.context.object; o.name = name
        o.scale = (scale[0], scale[2], scale[1])
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel:
            m = o.modifiers.new('Bevel', 'BEVEL')
            m.width = min(bevel, min(scale) * 0.40); m.segments = 2
            bpy.ops.object.modifier_apply(modifier=m.name)
        return self.finish(o, part, col)

    def finalize_and_export(self, origins, out_paths, lod_ratio=0.35):
        joined = {}
        for part, objs in self.parts.items():
            bpy.ops.object.select_all(action='DESELECT')
            for o in objs: o.select_set(True)
            bpy.context.view_layer.objects.active = objs[0]
            bpy.ops.object.join()
            o = bpy.context.object; o.name = part
            bpy.context.scene.cursor.location = xyz(origins[part])
            bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
            for p in o.data.polygons: p.material_index = 0
            o.data.materials.clear(); o.data.materials.append(self.mat)
            joined[part] = o
        hero_tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in joined.values())
        for folder, key in out_paths:
            os.makedirs(folder, exist_ok=True)
            bpy.ops.export_scene.gltf(filepath=os.path.join(folder, f'{key}.glb'), export_format='GLB', export_yup=True, export_apply=True)
        for o in joined.values():
            bpy.context.view_layer.objects.active = o
            m = o.modifiers.new('LOD', 'DECIMATE'); m.ratio = lod_ratio
            bpy.ops.object.modifier_apply(modifier=m.name)
        lod_tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in joined.values())
        for folder, key in out_paths:
            bpy.ops.export_scene.gltf(filepath=os.path.join(folder, f'{key}-lod.glb'), export_format='GLB', export_yup=True, export_apply=True)
        return hero_tris, lod_tris

# ==============================================================================
# 1. SCULPTED PURPLE CARTOON MONSTER (normal.glb) — facing +Z toward player!
# ==============================================================================
def build_purple_monster():
    reset_scene()
    pal = [
        ('skin',     (0.36, 0.12, 0.62), 0.56, 0.00),  # 0: vibrant cartoon purple skin
        ('belly',    (0.50, 0.24, 0.74), 0.62, 0.00),  # 1: lighter lavender belly
        ('dark',     (0.18, 0.06, 0.34), 0.65, 0.05),  # 2: deep violet claws / spikes
        ('eye',      (1.00, 0.84, 0.12), 0.20, 0.00),  # 3: glowing bright yellow monster eyes
        ('ink',      (0.03, 0.02, 0.05), 0.50, 0.00),  # 4: pupils & mouth cavity
        ('fang',     (0.98, 0.97, 0.90), 0.36, 0.00),  # 5: sharp white fangs & horns
        ('mouth_in', (0.68, 0.10, 0.24), 0.55, 0.00),  # 6: red monster tongue
        ('strap',    (0.24, 0.18, 0.14), 0.72, 0.15),  # 7: leather belt / wristbands
        ('steel',    (0.32, 0.36, 0.42), 0.35, 0.65),  # 8: iron studs
        ('gold',     (0.90, 0.65, 0.16), 0.32, 0.65),  # 9: belt buckle
    ] + [('pad', (0.3, 0.1, 0.5), 0.6, 0.0)] * 6
    mat = build_pbr_material('V15_PurpleMonster', pal)
    b = Builder(mat, pal)

    # Chunky muscular pear-shaped monster torso (NO CUBE!)
    b.surface('MonsterTorso', [
        (0.26, 0.20, 0.17, 0.0),
        (0.36, 0.29, 0.25, 0.02),
        (0.54, 0.31, 0.26, 0.03),
        (0.68, 0.25, 0.21, 0.02),
        (0.76, 0.16, 0.14, 0.0)
    ], 'Body', 'skin', 20)
    b.ell('Belly', (0, 0.48, 0.16), (0.21, 0.18, 0.12), 'Body', 'belly', 14, 8)
    b.surface('Belt', [(0.30, 0.27, 0.23, 0.01), (0.37, 0.295, 0.255, 0.02)], 'Body', 'strap', 18)
    b.rbox('Buckle', (0, 0.335, 0.255), (0.11, 0.075, 0.04), 'Body', 'gold', 0.015)

    # Expressive big round monster head facing +Z (player side!)
    b.ell('MonsterHead', (0, 0.94, 0.04), (0.28, 0.24, 0.25), 'Head', 'skin', 20, 12)
    # Sculpted angry brow ridge
    b.ell('Brow', (0, 1.03, 0.22), (0.22, 0.055, 0.08), 'Head', 'dark', 14, 7)
    # Bright yellow eyes + pupils
    for s in [-1, 1]:
        b.ell('Eye', (s * 0.105, 0.98, 0.245), (0.068, 0.064, 0.036), 'Head', 'eye', 12, 8)
        b.ell('Pupil', (s * 0.105, 0.98, 0.276), (0.028, 0.036, 0.018), 'Head', 'ink', 10, 6)
        # Curved ivory horns + pointed side ears
        b.cone('Horn', (s * 0.18, 1.17, 0.05), 0.068, 0.22, 'Head', 'fang', 10, (0.15, s * 0.45, 0))
        b.cone('Ear', (s * 0.31, 0.96, 0.02), 0.058, 0.16, 'Head', 'skin', 8, (0, s * 1.25, 0))
    # Wide grinning cartoon monster mouth with sharp white fangs!
    b.ell('MouthCavity', (0, 0.85, 0.23), (0.18, 0.072, 0.06), 'Head', 'ink', 14, 7)
    b.ell('Tongue', (0, 0.825, 0.25), (0.11, 0.032, 0.04), 'Head', 'mouth_in', 10, 6)
    for fx in [-0.11, -0.04, 0.04, 0.11]:
        b.cone('TopFang', (fx, 0.895, 0.268), 0.026, 0.062, 'Head', 'fang', 6, (math.pi, 0, 0))
    for fx in [-0.08, 0.08]:
        b.cone('BotFang', (fx, 0.815, 0.268), 0.028, 0.065, 'Head', 'fang', 6, (0, 0, 0))

    # Muscular clawed monster arms reaching forward (+Z)
    for s in [-1, 1]:
        b.ell('Shoulder', (s * 0.33, 0.62, 0.03), (0.12, 0.11, 0.11), 'Arms', 'skin', 12, 7)
        b.ell('Forearm', (s * 0.37, 0.50, 0.18), (0.10, 0.10, 0.17), 'Arms', 'skin', 12, 7)
        b.ell('Wristband', (s * 0.38, 0.48, 0.26), (0.105, 0.105, 0.04), 'Arms', 'strap', 12, 6)
        b.ell('ClawHand', (s * 0.38, 0.46, 0.33), (0.11, 0.095, 0.095), 'Arms', 'dark', 12, 7)
        for ci in [-0.045, 0.0, 0.045]:
            b.cone('Claw', (s * 0.38 + ci, 0.45, 0.42), 0.022, 0.085, 'Arms', 'fang', 6, (math.pi * 0.5, 0, 0))

    # Stubby powerful monster legs + clawed feet
    for s, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = s * 0.165
        b.ell('Thigh', (x, 0.22, 0.0), (0.11, 0.13, 0.11), part, 'skin', 12, 7)
        b.ell('Foot', (x, 0.075, 0.07), (0.125, 0.075, 0.155), part, 'dark', 12, 7)
        for ci in [-0.055, 0.0, 0.055]:
            b.cone('ToeClaw', (x + ci, 0.055, 0.21), 0.022, 0.07, part, 'fang', 6, (math.pi * 0.5, 0, 0))

    origins = {'Body': (0, 0, 0), 'Head': (0, 0.74, 0), 'Arms': (0, 0.62, 0), 'LegL': (-0.165, 0.30, 0), 'LegR': (0.165, 0.30, 0)}
    out = [(os.path.join(GAME_MODELS, 'zombies', 'normal'), 'normal')]
    return b.finalize_and_export(origins, out, lod_ratio=0.36)

# ==============================================================================
# 2. INDEPENDENT HEAVY MECHA IRON-FIST BOSS (bruiser, overlord, bulwark, titan)
# ==============================================================================
def build_ironfist_boss():
    reset_scene()
    pal = [
        ('skin',      (0.34, 0.11, 0.58), 0.52, 0.00),  # 0: hulking purple beast skin
        ('steel',     (0.18, 0.22, 0.27), 0.32, 0.72),  # 1: heavy dark gunmetal armor
        ('steel_lt',  (0.34, 0.40, 0.46), 0.28, 0.78),  # 2: beveled steel trim & rivets
        ('gold',      (0.92, 0.62, 0.12), 0.30, 0.72),  # 3: heavy gold hazard trim
        ('core',      (1.00, 0.36, 0.05), 0.16, 0.10),  # 4: glowing orange reactor core
        ('core_hot',  (1.00, 0.85, 0.28), 0.12, 0.00),  # 5: hot inner core & eyes
        ('red_lamp',  (0.96, 0.14, 0.12), 0.18, 0.00),  # 6: danger warning beacons
        ('ink',       (0.03, 0.03, 0.05), 0.55, 0.00),  # 7: mouth cavity / pupils / vents
        ('fang',      (0.98, 0.96, 0.90), 0.35, 0.00),  # 8: horns & fangs
        ('tongue',    (0.72, 0.12, 0.26), 0.55, 0.00),  # 9: beast mouth
        ('hazard',    (0.96, 0.72, 0.10), 0.42, 0.20),  # 10: hazard yellow stripes
        ('glow_em',   (1.00, 0.42, 0.08), 0.15, 0.00),  # 11: emissive cell for boss shader
    ] + [('pad', (0.2, 0.2, 0.25), 0.5, 0.5)] * 4
    mat = build_pbr_material('V15_IronFistBoss', pal)
    b = Builder(mat, pal)

    # Hulking armored mecha-beast torso (independent silhouette!)
    b.surface('BeastCore', [
        (0.32, 0.24, 0.20, 0.0),
        (0.48, 0.36, 0.29, 0.02),
        (0.74, 0.44, 0.34, 0.04),
        (0.92, 0.36, 0.28, 0.02),
        (1.02, 0.22, 0.18, 0.0)
    ], 'Body', 'skin', 22)
    # Multi-layered riveted steel chestplate + glowing orange energy reactor core
    b.rbox('ChestMain', (0, 0.70, 0.24), (0.64, 0.44, 0.24), 'Body', 'steel', 0.055)
    b.rbox('ChestTrim', (0, 0.87, 0.28), (0.58, 0.08, 0.18), 'Body', 'gold', 0.025)
    b.rbox('AbPlate', (0, 0.44, 0.22), (0.48, 0.18, 0.18), 'Body', 'steel_lt', 0.035)
    b.rbox('WaistBelt', (0, 0.33, 0.02), (0.62, 0.13, 0.48), 'Body', 'steel', 0.035)
    b.rbox('WaistBuckle', (0, 0.33, 0.27), (0.18, 0.12, 0.07), 'Body', 'gold', 0.020)
    # Central glowing orange energy reactor
    b.ell('ReactorRim', (0, 0.68, 0.35), (0.16, 0.16, 0.065), 'Body', 'steel_lt', 16, 8)
    b.ell('ReactorGlow', (0, 0.68, 0.385), (0.115, 0.115, 0.055), 'Body', 'core', 14, 8)
    b.ell('ReactorHot', (0, 0.68, 0.415), (0.058, 0.058, 0.035), 'Body', 'core_hot', 10, 6)
    # Back jet/exhaust reactor packs
    for s in [-1, 1]:
        b.rbox('BackPack', (s * 0.20, 0.72, -0.26), (0.22, 0.36, 0.20), 'Body', 'steel', 0.04)
        b.ell('BackVent', (s * 0.20, 0.88, -0.26), (0.08, 0.06, 0.08), 'Body', 'core', 10, 6)
    # Massive layered armored shoulder pauldrons with steel spikes & red warning beacons!
    for s in [-1, 1]:
        b.ell('PauldronMain', (s * 0.50, 0.88, 0.02), (0.26, 0.21, 0.26), 'Body', 'steel', 16, 10)
        b.rbox('PauldronTrim', (s * 0.52, 0.81, 0.02), (0.28, 0.07, 0.34), 'Body', 'gold', 0.02)
        b.cone('PauldronSpike1', (s * 0.62, 1.04, 0.04), 0.055, 0.22, 'Body', 'steel_lt', 8, (0, s * -0.55, 0))
        b.cone('PauldronSpike2', (s * 0.54, 1.07, -0.10), 0.045, 0.18, 'Body', 'steel_lt', 8, (-0.35, s * -0.35, 0))
        b.ell('WarnBeacon', (s * 0.38, 1.04, 0.16), (0.055, 0.055, 0.055), 'Body', 'red_lamp', 10, 6)

    # Fierce independent horned Boss head with armored jaw guard
    b.ell('BossHead', (0, 1.18, 0.08), (0.27, 0.23, 0.25), 'Head', 'skin', 18, 10)
    b.rbox('HelmetCrown', (0, 1.32, 0.06), (0.36, 0.12, 0.34), 'Head', 'steel', 0.04)
    b.ell('BrowRidge', (0, 1.25, 0.26), (0.24, 0.065, 0.08), 'Head', 'steel', 14, 7)
    for s in [-1, 1]:
        b.ell('BossEye', (s * 0.10, 1.21, 0.285), (0.062, 0.052, 0.032), 'Head', 'core_hot', 12, 7)
        b.ell('BossPupil', (s * 0.10, 1.21, 0.312), (0.024, 0.030, 0.015), 'Head', 'ink', 8, 6)
        b.cone('BossHorn', (s * 0.23, 1.40, 0.08), 0.075, 0.28, 'Head', 'fang', 10, (0.22, s * 0.52, 0))
    b.ell('BossMouth', (0, 1.08, 0.25), (0.19, 0.075, 0.06), 'Head', 'ink', 14, 7)
    for fx in [-0.12, -0.04, 0.04, 0.12]:
        b.cone('BossFang', (fx, 1.125, 0.29), 0.028, 0.072, 'Head', 'fang', 6, (math.pi, 0, 0))

    # GIANT Mechanical Iron-Fist Gauntlets & Heavy Piston Arms!
    for s in [-1, 1]:
        b.ell('UpperArm', (s * 0.54, 0.66, 0.04), (0.14, 0.16, 0.14), 'Arms', 'skin', 12, 8)
        b.rbox('ElbowJoint', (s * 0.56, 0.54, 0.10), (0.20, 0.14, 0.20), 'Arms', 'steel_lt', 0.04)
        # Giant Iron Fist Gauntlet
        b.rbox('IronGauntlet', (s * 0.58, 0.40, 0.26), (0.34, 0.32, 0.38), 'Arms', 'steel', 0.065)
        b.rbox('GauntletCuff', (s * 0.58, 0.44, 0.12), (0.36, 0.34, 0.10), 'Arms', 'gold', 0.025)
        b.rbox('KnuckleGlow', (s * 0.58, 0.40, 0.44), (0.28, 0.10, 0.08), 'Arms', 'core', 0.025)
        for ki in [-0.09, 0.0, 0.09]:
            b.rbox('KnuckleStud', (s * 0.58 + ki, 0.33, 0.45), (0.065, 0.085, 0.06), 'Arms', 'steel_lt', 0.015)

    # Thick armored mechanical piston legs & stomper boots
    for s, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = s * 0.22
        b.ell('BossThigh', (x, 0.26, 0.0), (0.14, 0.16, 0.14), part, 'skin', 12, 7)
        b.rbox('KneeArmor', (x, 0.22, 0.13), (0.20, 0.16, 0.10), part, 'gold', 0.03)
        b.rbox('StomperBoot', (x, 0.09, 0.08), (0.26, 0.17, 0.34), part, 'steel', 0.045)
        b.rbox('BootTrim', (x, 0.04, 0.09), (0.28, 0.06, 0.36), part, 'steel_lt', 0.015)

    origins = {'Body': (0, 0, 0), 'Head': (0, 0.98, 0), 'Arms': (0, 0.78, 0), 'LegL': (-0.22, 0.34, 0), 'LegR': (0.22, 0.34, 0)}
    out = [
        (os.path.join(GAME_MODELS, 'bosses', 'bruiser'), 'bruiser'),
        (os.path.join(GAME_MODELS, 'bosses', 'overlord'), 'overlord'),
        (os.path.join(GAME_MODELS, 'bosses', 'bulwark'), 'bulwark'),
        (os.path.join(GAME_MODELS, 'bosses', 'titan'), 'titan'),
    ]
    return b.finalize_and_export(origins, out, lod_ratio=0.35)

m_hero, m_lod = build_purple_monster()
print('V15_MONSTER_DONE', 'hero_tris=', m_hero, 'lod_tris=', m_lod)
b_hero, b_lod = build_ironfist_boss()
print('V15_BOSS_DONE', 'hero_tris=', b_hero, 'lod_tris=', b_lod)
