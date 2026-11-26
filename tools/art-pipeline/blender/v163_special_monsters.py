"""V16.3-P1 Independent Sculpted 3D Monster GLBs for spitter, thrower, and flanker.
Builds true standalone Q-version 3D sculpted GLBs preserving the exact 5-part
(Body, Head, Arms, LegL, LegR) + 2-PNG PBR contract required by js/enemy-models.js.
Exports directly into:
  - assets/game/models/zombies/spitter/spitter(.glb | -lod.glb)
  - assets/game/models/zombies/thrower/thrower(.glb | -lod.glb)
  - assets/game/models/zombies/flanker/flanker(.glb | -lod.glb)
"""
import bpy, math, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
GAME_MODELS = os.path.join(ROOT, 'assets', 'game', 'models', 'zombies')
TEX_DIR = os.path.join(ROOT, 'tools', 'art-pipeline', 'textures')
os.makedirs(TEX_DIR, exist_ok=True)
random.seed(1630)

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
                vb = max(-0.16, min(0.16, (co.z - 0.5) * 0.20))
                uv.data[li].uv = ((idx % 4 + 0.5 + 0.10 * math.sin(co.x * 5.0)) / 4.0, (idx // 4 + 0.5 + vb) / 4.0)
        self.parts[part].append(obj)
        return obj

    def surface(self, name, rings, part, col, seg=18):
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

    def cyl(self, name, p, r, depth, part, col, seg=12, rot=(0, 0, 0)):
        bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=depth, location=xyz(p))
        o = bpy.context.object; o.name = name
        o.rotation_euler = rot
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        return self.finish(o, part, col)

    def rbox(self, name, p, scale, part, col, bevel=0.025):
        bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
        o = bpy.context.object; o.name = name
        o.scale = (scale[0], scale[2], scale[1])
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel:
            m = o.modifiers.new('Bevel', 'BEVEL')
            m.width = min(bevel, min(scale) * 0.40); m.segments = 2
            bpy.ops.object.modifier_apply(modifier=m.name)
        return self.finish(o, part, col)

    def finalize_and_export(self, origins, folder, key, lod_ratio=0.38):
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
        os.makedirs(folder, exist_ok=True)
        bpy.ops.export_scene.gltf(filepath=os.path.join(folder, f'{key}.glb'), export_format='GLB', export_yup=True, export_apply=True)
        for o in joined.values():
            bpy.context.view_layer.objects.active = o
            m = o.modifiers.new('LOD', 'DECIMATE'); m.ratio = lod_ratio
            bpy.ops.object.modifier_apply(modifier=m.name)
        lod_tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in joined.values())
        bpy.ops.export_scene.gltf(filepath=os.path.join(folder, f'{key}-lod.glb'), export_format='GLB', export_yup=True, export_apply=True)
        return hero_tris, lod_tris

# ==============================================================================
# 1. SPITTER — Hunched Toxic Acid Monster with Oversized Glowing Acid Sacs
#    Note: cell 11 ('glow') is auto-picked by enemy-models.js emissive mask!
# ==============================================================================
def build_spitter():
    reset_scene()
    pal = [
        ('skin',   (0.32, 0.56, 0.16), 0.56, 0.00),  # 0: yellow-green toxic skin
        ('belly',  (0.54, 0.72, 0.24), 0.58, 0.00),  # 1: pale acid belly
        ('dark',   (0.14, 0.28, 0.09), 0.65, 0.05),  # 2: dark moss spikes & claws
        ('eye',    (0.98, 0.96, 0.22), 0.18, 0.00),  # 3: glowing yellow eyes
        ('ink',    (0.03, 0.05, 0.03), 0.50, 0.00),  # 4: pupils & mouth depth
        ('fang',   (0.94, 0.96, 0.84), 0.36, 0.00),  # 5: sharp fangs
        ('strap',  (0.24, 0.20, 0.14), 0.72, 0.12),  # 6: tattered band
        ('pad7',   (0.3, 0.5, 0.2), 0.6, 0.0),
        ('pad8',   (0.3, 0.5, 0.2), 0.6, 0.0),
        ('pad9',   (0.3, 0.5, 0.2), 0.6, 0.0),
        ('pad10',  (0.3, 0.5, 0.2), 0.6, 0.0),
        ('glow',   (0.55, 1.00, 0.18), 0.14, 0.00),  # 11: EMISSIVE neon acid sacs!
    ] + [('pad', (0.3, 0.5, 0.2), 0.6, 0.0)] * 4
    mat = build_pbr_material('V163_Spitter', pal)
    b = Builder(mat, pal)

    # Hunched forward torso (distinct curved spine!)
    b.surface('SpitterTorso', [
        (0.24, 0.17, 0.16, -0.02),
        (0.38, 0.24, 0.22, 0.02),
        (0.56, 0.25, 0.24, 0.07),
        (0.70, 0.20, 0.19, 0.11),
        (0.78, 0.13, 0.13, 0.14),
    ], 'Body', 'skin', 18)
    b.ell('Belly', (0, 0.44, 0.19), (0.16, 0.14, 0.10), 'Body', 'belly', 12, 8)
    # Oversized glowing acid sacs on back & shoulders (high silhouette contrast!)
    b.ell('AcidSacMain', (0, 0.76, -0.14), (0.24, 0.26, 0.22), 'Body', 'glow', 16, 10)
    for s in [-1, 1]:
        b.ell('AcidSacSide', (s * 0.22, 0.68, -0.08), (0.15, 0.17, 0.14), 'Body', 'glow', 12, 8)
        b.ell('AcidPustule', (s * 0.12, 0.88, -0.06), (0.08, 0.08, 0.08), 'Body', 'glow', 10, 6)

    # Forward-jutting wide-jawed head
    b.ell('HeadMain', (0, 0.86, 0.22), (0.24, 0.20, 0.23), 'Head', 'skin', 18, 10)
    b.ell('SwollenCheekL', (-0.18, 0.82, 0.28), (0.10, 0.09, 0.09), 'Head', 'glow', 10, 7)
    b.ell('SwollenCheekR', (0.18, 0.82, 0.28), (0.10, 0.09, 0.09), 'Head', 'glow', 10, 7)
    for s in [-1, 1]:
        b.ell('Eye', (s * 0.095, 0.92, 0.39), (0.058, 0.052, 0.032), 'Head', 'eye', 10, 7)
        b.ell('Pupil', (s * 0.095, 0.92, 0.415), (0.022, 0.028, 0.015), 'Head', 'ink', 8, 6)
        b.cone('SpineHorn', (s * 0.12, 1.04, 0.14), 0.042, 0.15, 'Head', 'dark', 8, (-0.45, s * 0.25, 0))
    # Wide gaping acid mouth
    b.ell('MouthGlow', (0, 0.77, 0.39), (0.15, 0.075, 0.065), 'Head', 'glow', 12, 7)
    for fx in [-0.09, -0.03, 0.03, 0.09]:
        b.cone('Fang', (fx, 0.82, 0.43), 0.02, 0.055, 'Head', 'fang', 6, (math.pi, 0, 0))

    # Lean dripping arms reaching forward
    for s in [-1, 1]:
        b.ell('Shoulder', (s * 0.26, 0.60, 0.10), (0.09, 0.09, 0.09), 'Arms', 'skin', 10, 6)
        b.ell('Forearm', (s * 0.28, 0.44, 0.24), (0.07, 0.075, 0.16), 'Arms', 'skin', 10, 6)
        b.ell('Hand', (s * 0.27, 0.36, 0.36), (0.075, 0.065, 0.08), 'Arms', 'dark', 10, 6)

    for s, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = s * 0.15
        b.ell('Thigh', (x, 0.22, 0.0), (0.095, 0.13, 0.10), part, 'skin', 10, 6)
        b.ell('Foot', (x, 0.065, 0.07), (0.105, 0.065, 0.14), part, 'dark', 10, 6)

    origins = {'Body': (0, 0, 0), 'Head': (0, 0.76, 0.14), 'Arms': (0, 0.60, 0.10), 'LegL': (-0.15, 0.28, 0), 'LegR': (0.15, 0.28, 0)}
    return b.finalize_and_export(origins, os.path.join(GAME_MODELS, 'spitter'), 'spitter', 0.40)

# ==============================================================================
# 2. THROWER — Stocky Orange Bomb-Lobber with Armored Bomb Backpack & Heavy Arms
# ==============================================================================
def build_thrower():
    reset_scene()
    pal = [
        ('skin',     (0.92, 0.44, 0.08), 0.54, 0.00),  # 0: vibrant orange-amber skin
        ('belly',    (0.98, 0.64, 0.22), 0.58, 0.00),  # 1: lighter amber belly
        ('iron',     (0.14, 0.17, 0.22), 0.34, 0.72),  # 2: dark gunmetal iron bombs & pack
        ('red',      (0.92, 0.16, 0.14), 0.38, 0.15),  # 3: hazard red bomb stripes
        ('brass',    (0.88, 0.66, 0.18), 0.30, 0.70),  # 4: brass collars & buckles
        ('strap',    (0.24, 0.16, 0.11), 0.74, 0.10),  # 5: heavy leather harness
        ('eye',      (1.00, 0.90, 0.24), 0.18, 0.00),  # 6: fierce eyes
        ('ink',      (0.03, 0.03, 0.04), 0.50, 0.00),  # 7: pupils / mouth
        ('fang',     (0.96, 0.95, 0.88), 0.36, 0.00),  # 8: tusks
        ('fuse',     (0.88, 0.78, 0.56), 0.75, 0.00),  # 9: rope fuse
        ('pad10',    (0.9, 0.5, 0.1), 0.5, 0.0),
        ('spark',    (1.00, 0.72, 0.12), 0.12, 0.00),  # 11: EMISSIVE burning fuse spark!
    ] + [('pad', (0.9, 0.5, 0.1), 0.5, 0.0)] * 4
    mat = build_pbr_material('V163_Thrower', pal)
    b = Builder(mat, pal)

    # Broad stocky muscular torso + cross-chest bomb harness
    b.surface('ThrowerTorso', [
        (0.26, 0.22, 0.19, 0.0),
        (0.40, 0.32, 0.27, 0.02),
        (0.60, 0.34, 0.28, 0.03),
        (0.74, 0.27, 0.23, 0.02),
        (0.80, 0.18, 0.15, 0.0),
    ], 'Body', 'skin', 18)
    b.ell('Belly', (0, 0.48, 0.18), (0.22, 0.18, 0.12), 'Body', 'belly', 12, 8)
    b.surface('Belt', [(0.31, 0.30, 0.25, 0.01), (0.39, 0.32, 0.27, 0.02)], 'Body', 'strap', 16)
    b.rbox('Buckle', (0, 0.35, 0.28), (0.12, 0.08, 0.045), 'Body', 'brass', 0.015)

    # Armored Bomb Backpack with 2 visible iron bombs poking above shoulders!
    b.rbox('BombPack', (0, 0.62, -0.28), (0.42, 0.44, 0.24), 'Body', 'iron', 0.04)
    b.rbox('PackTrim', (0, 0.62, -0.39), (0.36, 0.10, 0.04), 'Body', 'red', 0.01)
    for s in [-1, 1]:
        b.ell('PackBomb', (s * 0.15, 0.90, -0.26), (0.12, 0.12, 0.12), 'Body', 'iron', 12, 8)
        b.cyl('PackBombCollar', (s * 0.15, 1.02, -0.26), 0.045, 0.04, 'Body', 'brass', 8)
        b.ell('PackSpark', (s * 0.15, 1.09, -0.26), (0.045, 0.045, 0.045), 'Body', 'spark', 8, 6)

    # Stocky head with demolitions goggles & tusks
    b.ell('Head', (0, 0.96, 0.05), (0.26, 0.23, 0.24), 'Head', 'skin', 18, 10)
    b.rbox('GoggleBand', (0, 1.04, 0.06), (0.50, 0.075, 0.44), 'Head', 'strap', 0.02)
    for s in [-1, 1]:
        b.cyl('GoggleRim', (s * 0.105, 1.04, 0.27), 0.078, 0.055, 'Head', 'iron', 12, (math.pi * 0.5, 0, 0))
        b.ell('GoggleLens', (s * 0.105, 1.04, 0.295), (0.06, 0.055, 0.025), 'Head', 'eye', 10, 6)
    b.ell('Mouth', (0, 0.87, 0.24), (0.16, 0.065, 0.055), 'Head', 'ink', 12, 6)
    for s in [-1, 1]:
        b.cone('Tusk', (s * 0.095, 0.84, 0.285), 0.028, 0.075, 'Head', 'fang', 6, (0.2, 0, 0))

    # Thick heavy throwing arms + primed iron bomb in right hand!
    for s in [-1, 1]:
        b.ell('Shoulder', (s * 0.38, 0.66, 0.03), (0.15, 0.14, 0.14), 'Arms', 'skin', 12, 7)
        b.ell('HeavyArm', (s * 0.44, 0.54, 0.19), (0.135, 0.13, 0.19), 'Arms', 'skin', 12, 7)
        b.ell('WristCuff', (s * 0.44, 0.52, 0.29), (0.13, 0.13, 0.05), 'Arms', 'iron', 12, 6)
        b.ell('Fist', (s * 0.43, 0.50, 0.37), (0.13, 0.115, 0.115), 'Arms', 'skin', 12, 7)
    # Primed cartoon bomb held in right hand (+X)
    b.ell('HandBomb', (0.43, 0.62, 0.44), (0.15, 0.15, 0.15), 'Arms', 'iron', 12, 8)
    b.cyl('HandBombStripe', (0.43, 0.62, 0.44), 0.154, 0.045, 'Arms', 'red', 12)
    b.cyl('HandBombCap', (0.43, 0.77, 0.44), 0.05, 0.045, 'Arms', 'brass', 8)
    b.ell('HandBombSpark', (0.46, 0.86, 0.44), (0.058, 0.058, 0.058), 'Arms', 'spark', 8, 6)

    for s, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = s * 0.18
        b.ell('Thigh', (x, 0.22, 0.0), (0.125, 0.135, 0.125), part, 'skin', 12, 7)
        b.ell('Boot', (x, 0.08, 0.06), (0.135, 0.08, 0.165), part, 'iron', 12, 7)

    origins = {'Body': (0, 0, 0), 'Head': (0, 0.78, 0), 'Arms': (0, 0.66, 0), 'LegL': (-0.18, 0.30, 0), 'LegR': (0.18, 0.30, 0)}
    return b.finalize_and_export(origins, os.path.join(GAME_MODELS, 'thrower'), 'thrower', 0.38)

# ==============================================================================
# 3. FLANKER — Low-Center-of-Gravity Cyan Agile Stalker with Long Claws & Fins
# ==============================================================================
def build_flanker():
    reset_scene()
    pal = [
        ('skin',   (0.08, 0.62, 0.76), 0.46, 0.05),  # 0: vibrant cyan-teal skin
        ('belly',  (0.32, 0.84, 0.92), 0.50, 0.00),  # 1: bright aqua underbelly
        ('dark',   (0.04, 0.24, 0.36), 0.52, 0.15),  # 2: deep navy-teal fins & armor plates
        ('claw',   (0.92, 0.99, 1.00), 0.24, 0.25),  # 3: razor-sharp icy white long claws
        ('eye',    (1.00, 0.94, 0.28), 0.14, 0.00),  # 4: fierce predatory glowing eyes
        ('ink',    (0.02, 0.04, 0.06), 0.50, 0.00),  # 5: mouth / pupils
        ('stripe', (0.06, 0.92, 0.88), 0.22, 0.05),  # 6: electric cyan markings
    ] + [('pad', (0.08, 0.62, 0.76), 0.5, 0.0)] * 9
    mat = build_pbr_material('V163_Flanker', pal)
    b = Builder(mat, pal)

    # Low-slung forward-crouched agile torso + dorsal predator fins
    b.surface('FlankerTorso', [
        (0.24, 0.15, 0.15, -0.04),
        (0.38, 0.21, 0.20, 0.02),
        (0.54, 0.22, 0.21, 0.09),
        (0.66, 0.17, 0.17, 0.15),
        (0.72, 0.12, 0.12, 0.18),
    ], 'Body', 'skin', 16)
    b.ell('Chest', (0, 0.48, 0.19), (0.14, 0.14, 0.09), 'Body', 'belly', 12, 7)
    # 3 sharp dorsal fins along back
    for fi, (fy, fz, fd) in enumerate([(0.68, -0.02, 0.22), (0.54, -0.11, 0.18), (0.40, -0.15, 0.14)]):
        b.cone(f'DorsalFin{fi}', (0, fy, fz), 0.05, fd, 'Body', 'dark', 6, (-0.75, 0, 0))

    # Sleek forward-lunging predatory head + swept-back ears
    b.ell('Head', (0, 0.78, 0.28), (0.21, 0.17, 0.23), 'Head', 'skin', 16, 10)
    b.ell('Snout', (0, 0.74, 0.45), (0.13, 0.09, 0.10), 'Head', 'belly', 12, 7)
    for s in [-1, 1]:
        b.ell('Eye', (s * 0.09, 0.83, 0.44), (0.056, 0.036, 0.028), 'Head', 'eye', 10, 6, (0, 0, s * -0.28))
        b.cone('SweptEar', (s * 0.18, 0.90, 0.16), 0.05, 0.22, 'Head', 'dark', 6, (-0.85, s * 0.45, 0))
    b.ell('Jaw', (0, 0.69, 0.45), (0.11, 0.045, 0.06), 'Head', 'ink', 10, 6)

    # Agile slashing arms + LONG wicked curved claws (signature flanker silhouette!)
    for s in [-1, 1]:
        b.ell('Shoulder', (s * 0.25, 0.56, 0.12), (0.09, 0.085, 0.09), 'Arms', 'dark', 10, 6)
        b.ell('Forearm', (s * 0.30, 0.44, 0.28), (0.072, 0.072, 0.17), 'Arms', 'skin', 10, 6)
        b.ell('ClawWrist', (s * 0.31, 0.39, 0.41), (0.08, 0.075, 0.085), 'Arms', 'dark', 10, 6)
        for ci, cx in enumerate([-0.048, 0.0, 0.048]):
            b.cone(f'LongClaw{s}_{ci}', (s * 0.31 + cx, 0.36, 0.56), 0.022, 0.22, 'Arms', 'claw', 6, (math.pi * 0.56, 0, 0))

    # Springy runner legs
    for s, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = s * 0.15
        b.ell('Thigh', (x, 0.23, -0.02), (0.09, 0.135, 0.105), part, 'skin', 10, 6)
        b.ell('Foot', (x, 0.065, 0.09), (0.095, 0.06, 0.15), part, 'dark', 10, 6)
        for cx in [-0.035, 0.035]:
            b.cone('Toe', (x + cx, 0.045, 0.22), 0.018, 0.08, part, 'claw', 6, (math.pi * 0.5, 0, 0))

    origins = {'Body': (0, 0, 0), 'Head': (0, 0.70, 0.18), 'Arms': (0, 0.56, 0.12), 'LegL': (-0.15, 0.28, 0), 'LegR': (0.15, 0.28, 0)}
    return b.finalize_and_export(origins, os.path.join(GAME_MODELS, 'flanker'), 'flanker', 0.40)

print('SPITTER', build_spitter())
print('THROWER', build_thrower())
print('FLANKER', build_flanker())
