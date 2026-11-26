"""V19.1 Commercial Monster Sculpting & Weathered PBR Remake (Blender 4.2 LTS).
Eliminates spherical 'toy plastic ball' look across ALL 7 core battle monster families:
  1. normal  — Muscular Mutant Brute (V-taper pecs/lats, chiseled skull, dorsal osteoderms, spiked bracers)
  2. fast    — Lean Razor-Spined Stalker (hunched predator, swept dorsal blades, elongated fang jaw, scythe claws)
  3. flanker — Obsidian-Crimson Ambush Predator (twin shoulder blades, low stealth crouch, dual curved talons)
  4. shield  — Heavy Riot-Armored Juggernaut (layered steel chestplate, jaw-helmet, massive Gunmetal Riot Shield!)
  5. elite   — Warlord Armored Enforcer (crimson-gold battle armor, horned steel helm, heavy Riot Shield!)
  6. spitter — Bio-Venom Acid Mutant (ribbed veined luminescent dorsal venom glands, throat sac, split mandibles)
  7. thrower — Demolition Grenadier Brute (leather bandoliers, iron pauldron, steel bomb-cage backpack + hand bomb)

Preserves 100% compatibility with js/enemy-models.js:
  - 5 named mesh nodes: Body, Head, Arms, LegL, LegR
  - Single shared Principled BSDF material with BaseColor + ORM (G=Roughness, B=Metallic) 256x256 PNGs
  - Cell 11 reserved for emissive glow mask
"""
import bpy, math, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
ZOMBIES_DIR = os.path.join(ROOT, 'assets', 'game', 'models', 'zombies')
TEX_DIR = os.path.join(ROOT, 'tools', 'art-pipeline', 'textures')
os.makedirs(TEX_DIR, exist_ok=True)
random.seed(1910)

def reset_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)
    for mat in list(bpy.data.materials): bpy.data.materials.remove(mat)
    for im in list(bpy.data.images): bpy.data.images.remove(im)

def build_pbr_material(name, palette):
    """Generates rich weathered PBR BaseColor + ORM atlas (128x128 PNG-compressible procedural grain, zero white-noise bloat!)."""
    def make_atlas(fname, orm=False):
        w, h = 128, 128
        im = bpy.data.images.new(fname, width=w, height=h, alpha=True)
        if orm:
            im.colorspace_settings.name = 'Non-Color'
        pix = []
        for yy in range(h):
            for xx in range(w):
                cell = (yy // 32) * 4 + (xx // 32)
                cname, col, rough, metal = palette[cell % len(palette)]
                lx = (xx % 32) / 31.0
                ly = (yy % 32) / 31.0
                is_skin = cname in ('skin', 'belly', 'dark', 'tongue')
                is_metal = metal >= 0.55
                is_glow = (cell == 11 or 'glow' in cname or 'spark' in cname)
                if orm:
                    if is_skin:
                        dermal = 0.04 * math.sin(lx * 22.0) * math.cos(ly * 22.0)
                        rv = max(0.74, min(0.96, rough + dermal))
                    elif is_metal:
                        scratch = 0.08 * abs(math.sin((lx * 16.0 + ly * 10.0)))
                        rv = max(0.22, min(0.68, rough + scratch))
                    else:
                        rv = rough
                    rgb = (1.0, rv, metal)
                else:
                    ao = 0.72 + 0.36 * ly
                    if is_skin:
                        scales = 0.055 * math.sin(lx * 22.0 + math.sin(ly * 8.0)) * math.cos(ly * 20.0)
                        striation = 0.03 * math.sin(lx * 36.0)
                        f = ao + scales + striation
                    elif is_metal:
                        bevel_hi = 0.14 if (ly > 0.86 or ly < 0.09) else 0.0
                        wear = 0.06 * math.sin(lx * 18.0 - ly * 14.0)
                        f = (0.78 + 0.28 * ly) + bevel_hi + wear
                    elif is_glow:
                        vein = 0.22 * abs(math.sin(lx * 12.0 + math.cos(ly * 10.0) * 2.0))
                        f = 1.08 - vein * (1.0 - ly * 0.5)
                    else:
                        f = ao
                    rgb = tuple(max(0.0, min(1.0, round(c * f, 3))) for c in col)
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

class SculptBuilder:
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
                vt = max(0.08, min(0.92, 0.5 + (co.z - 0.45) * 0.48))
                ut = max(0.08, min(0.92, 0.5 + 0.36 * math.sin(co.x * 4.2 + co.y * 2.5)))
                uv.data[li].uv = ((idx % 4 + ut) / 4.0, (idx // 4 + vt) / 4.0)
        self.parts[part].append(obj)
        return obj

    def muscle_torso(self, name, rings, part, col, seg=22, pec_bulge=0.045, lat_flare=0.035):
        """Sculpted anatomical V-taper torso with pectoral cleft, rib/ab definition & spine groove (NO smooth lathe ball!)."""
        verts = []
        for ri, (y, rx, rz, zc) in enumerate(rings):
            t = ri / max(1, len(rings) - 1)
            for j in range(seg):
                a = j * 2 * math.pi / seg
                ca, sa = math.cos(a), math.sin(a)
                # Pectoral muscle lobes on front (+Z -> sin(a) > 0) with sternum cleft at ca ~ 0
                pec = pec_bulge * max(0.0, sa) * (0.35 + 0.65 * abs(ca)) * math.sin(t * math.pi)
                # Latissimus dorsi side flare
                lat = lat_flare * (ca * ca) * (t ** 0.7)
                # Dorsal spine ridge / groove on back
                spine = -0.018 * max(0.0, -sa) * (1.0 - abs(ca))
                vx = ca * (rx + lat)
                vz = zc + sa * (rz + pec + spine)
                verts.append(xyz((vx, y, vz)))
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

    def sculpt_skull(self, name, p, scale, part, col, jaw_jut=0.06, cheek_flare=0.045):
        """Chiseled angular monster skull: sunken temples, flared cheekbones, heavy jaw (NO round ball head!)."""
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=(0, 0, 0))
        o = bpy.context.object; o.name = name
        px, py, pz = xyz(p)
        for v in o.data.vertices:
            x, y_bl, z_bl = v.co.x, v.co.y, v.co.z
            # Note in Blender coords: x=right, -y_bl=forward(+Z game), z_bl=up(+Y game)
            fwd = -y_bl
            up = z_bl
            # Narrow cranium temples, flare cheekbones, square heavy lower jaw jutting forward
            w_mod = 1.0 + cheek_flare * 4.0 * max(0.0, fwd) * max(0.0, 0.35 - abs(up))
            if up > 0.35:
                w_mod *= 0.84
            if up < -0.20:
                w_mod *= 0.90
                fwd += jaw_jut * 3.2 * max(0.0, fwd + 0.2)
            # Furrowed brow overhang
            if 0.12 < up < 0.48 and fwd > 0.25:
                fwd += 0.14
            v.co.x = px + x * scale[0] * w_mod
            v.co.y = py - fwd * scale[2]
            v.co.z = pz + up * scale[1]
        o.data.update()
        return self.finish(o, part, col)

    def sculpt_limb(self, name, p1, p2, r1, r2, part, col, seg=10, bulge=0.022):
        """Tapered muscular limb segment between 3D points p1 and p2 (eliminates sausage/ball limbs!)."""
        dx, dy, dz = p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]
        length = max(0.001, math.sqrt(dx * dx + dy * dy + dz * dz))
        bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=1.0, depth=1.0, location=(0, 0, 0))
        o = bpy.context.object; o.name = name
        # Subdivide cylinder height for muscle belly curve
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.subdivide(number_cuts=1)
        bpy.ops.object.mode_set(mode='OBJECT')
        for v in o.data.vertices:
            t = v.co.z + 0.5  # 0..1 from bottom to top
            r = r1 * (1.0 - t) + r2 * t + bulge * math.sin(t * math.pi)
            # Slight angular facets for stylized commercial muscle planes
            v.co.x *= r
            v.co.y *= r * 1.08
            v.co.z = (t - 0.5) * length
        o.data.update()
        # Orient cylinder Z axis along p1->p2 in Blender space
        b1, b2 = xyz(p1), xyz(p2)
        mid = ((b1[0] + b2[0]) * 0.5, (b1[1] + b2[1]) * 0.5, (b1[2] + b2[2]) * 0.5)
        vx, vy, vz = b2[0] - b1[0], b2[1] - b1[1], b2[2] - b1[2]
        o.location = mid
        o.rotation_mode = 'QUATERNION'
        import mathutils
        vec = mathutils.Vector((vx, vy, vz)).normalized()
        o.rotation_quaternion = mathutils.Vector((0, 0, 1)).rotation_difference(vec)
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        o.rotation_mode = 'XYZ'
        return self.finish(o, part, col)

    def rbox(self, name, p, scale, part, col, bevel=0.035, rot=(0, 0, 0), smooth=True):
        bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
        o = bpy.context.object; o.name = name
        o.scale = (scale[0], scale[2], scale[1]); o.rotation_euler = rot
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        if bevel:
            m = o.modifiers.new('Bevel', 'BEVEL')
            m.width = min(bevel, min(scale) * 0.36); m.segments = 1
            bpy.ops.object.modifier_apply(modifier=m.name)
        return self.finish(o, part, col, smooth=smooth)

    def cone(self, name, p, r1, depth, part, col, seg=8, rot=(0, 0, 0)):
        bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r1, depth=depth, location=xyz(p))
        o = bpy.context.object; o.name = name; o.rotation_euler = rot
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        return self.finish(o, part, col)

    def cyl(self, name, p, r, depth, part, col, seg=12, rot=(0, 0, 0)):
        bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=depth, location=xyz(p))
        o = bpy.context.object; o.name = name; o.rotation_euler = rot
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
        return self.finish(o, part, col)

    def bio_sac(self, name, p, scale, part, col, seed=1.0):
        """Ribbed organic bio-sac / gland (displaced icosphere, NOT smooth toy sphere!)."""
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0, location=xyz(p))
        o = bpy.context.object; o.name = name
        for v in o.data.vertices:
            rib = 1.0 + 0.14 * math.sin(v.co.x * 6.0 + seed) * math.cos(v.co.z * 5.0)
            v.co.x *= scale[0] * rib
            v.co.y *= scale[2] * rib
            v.co.z *= scale[1] * rib
        o.data.update()
        return self.finish(o, part, col)

    def export_pair(self, origins, key, lod_ratio=0.38):
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
        folder = os.path.join(ZOMBIES_DIR, key)
        os.makedirs(folder, exist_ok=True)
        hero_path = os.path.join(folder, f'{key}.glb')
        lod_path = os.path.join(folder, f'{key}-lod.glb')
        bpy.ops.export_scene.gltf(filepath=hero_path, export_format='GLB', export_yup=True, export_apply=True)
        for o in joined.values():
            bpy.context.view_layer.objects.active = o
            m = o.modifiers.new('LOD', 'DECIMATE'); m.ratio = lod_ratio
            bpy.ops.object.modifier_apply(modifier=m.name)
        lod_tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in joined.values())
        bpy.ops.export_scene.gltf(filepath=lod_path, export_format='GLB', export_yup=True, export_apply=True)
        print(f'  [{key}] hero={os.path.getsize(hero_path)//1024}KB ({hero_tris} tris) | lod={os.path.getsize(lod_path)//1024}KB ({lod_tris} tris)')


# ==============================================================================
# 1. NORMAL — Fierce Muscular Mutant Brute (Deep Aubergine-Violet Hide + Iron Gear)
# ==============================================================================
def build_normal():
    reset_scene()
    pal = [
        ('skin',   (0.28, 0.13, 0.44), 0.84, 0.00),  # 0: rich matte mutant violet-slate hide
        ('belly',  (0.42, 0.24, 0.54), 0.86, 0.00),  # 1: scarred lighter chest/abs
        ('dark',   (0.13, 0.06, 0.22), 0.88, 0.04),  # 2: dark dorsal osteoderms & claws
        ('eye',    (1.00, 0.58, 0.08), 0.16, 0.00),  # 3: fierce glowing amber-orange eyes
        ('ink',    (0.03, 0.02, 0.04), 0.65, 0.00),  # 4: deep mouth cavity & pupils
        ('fang',   (0.95, 0.92, 0.82), 0.44, 0.00),  # 5: bone tusks, horns & claws
        ('tongue', (0.64, 0.10, 0.18), 0.72, 0.00),  # 6: crimson maw
        ('strap',  (0.22, 0.15, 0.10), 0.84, 0.06),  # 7: worn leather harness & bracers
        ('steel',  (0.22, 0.26, 0.32), 0.36, 0.82),  # 8: battle-worn gunmetal armor plates
        ('gold',   (0.86, 0.60, 0.16), 0.34, 0.76),  # 9: brass buckle & studs
    ] + [('pad', (0.25, 0.12, 0.40), 0.84, 0.0)] * 6
    mat = build_pbr_material('V191_Normal', pal)
    b = SculptBuilder(mat, pal)

    # Broad V-taper muscular mutant torso (narrow waist, wide lats & pecs!)
    b.muscle_torso('Torso', [
        (0.26, 0.17, 0.14, 0.00),
        (0.38, 0.21, 0.17, 0.01),
        (0.54, 0.31, 0.24, 0.03),
        (0.68, 0.33, 0.25, 0.04),
        (0.77, 0.20, 0.16, 0.02),
    ], 'Body', 'skin', 22, pec_bulge=0.055, lat_flare=0.045)
    # Abdominal muscle plates + tactical leather war-belt + iron skull buckle + dorsal spine spikes
    for ay, aw in [(0.44, 0.16), (0.52, 0.18)]:
        b.rbox('AbRidge', (0, ay, 0.20), (aw, 0.055, 0.06), 'Body', 'belly', 0.02, smooth=True)
    b.rbox('WarBelt', (0, 0.33, 0.01), (0.42, 0.09, 0.35), 'Body', 'strap', 0.025)
    b.rbox('BeltPlate', (0, 0.33, 0.19), (0.14, 0.10, 0.05), 'Body', 'steel', 0.015)
    b.rbox('BeltStud', (0, 0.33, 0.215), (0.06, 0.06, 0.03), 'Body', 'gold', 0.01)
    # Cross-chest leather strap + left iron shoulder pad
    b.rbox('ChestStrap', (0.02, 0.56, 0.03), (0.50, 0.065, 0.42), 'Body', 'strap', 0.015, (0, 0, 0.52))
    for sy, sz, ln in [(0.48, -0.20, 0.13), (0.60, -0.22, 0.16), (0.71, -0.19, 0.14)]:
        b.cone('BackSpike', (0, sy, sz), 0.045, ln, 'Body', 'dark', 7, (-1.15, 0, 0))

    # Chiseled ferocious monster skull + heavy scowling brow + lower jaw tusks + swept horns
    b.sculpt_skull('Skull', (0, 0.92, 0.06), (0.25, 0.22, 0.24), 'Head', 'skin', jaw_jut=0.075, cheek_flare=0.055)
    b.rbox('AngryBrow', (0, 0.99, 0.24), (0.26, 0.055, 0.09), 'Head', 'dark', 0.02, (0.12, 0, 0), smooth=True)
    b.rbox('MawCavity', (0, 0.83, 0.24), (0.19, 0.085, 0.08), 'Head', 'ink', 0.02)
    b.rbox('LowerJaw', (0, 0.77, 0.25), (0.21, 0.065, 0.12), 'Head', 'skin', 0.025, smooth=True)
    for s in [-1, 1]:
        b.rbox('EyeSlit', (s * 0.092, 0.95, 0.255), (0.072, 0.042, 0.035), 'Head', 'eye', 0.01, (0, 0, s * -0.24))
        b.cone('HornBase', (s * 0.19, 1.08, 0.02), 0.062, 0.22, 'Head', 'dark', 8, (-0.15, s * 0.58, 0))
        b.cone('HornTip', (s * 0.26, 1.19, 0.05), 0.040, 0.16, 'Head', 'fang', 8, (0.22, s * 0.35, 0))
        b.cone('EarFin', (s * 0.27, 0.93, 0.00), 0.048, 0.15, 'Head', 'dark', 6, (0, s * 1.32, 0))
        # Big fierce upward lower tusks + upper canines
        b.cone('LowerTusk', (s * 0.088, 0.83, 0.305), 0.028, 0.095, 'Head', 'fang', 7, (0.22, s * 0.12, 0))
        b.cone('UpperFang', (s * 0.055, 0.86, 0.295), 0.020, 0.065, 'Head', 'fang', 6, (math.pi - 0.15, 0, 0))

    # Muscular deltoids + forearms + iron-studded bracers + razor claws
    b.rbox('IronPauldronL', (-0.33, 0.70, 0.03), (0.18, 0.13, 0.20), 'Arms', 'steel', 0.03, (0, 0, 0.28))
    b.cone('PauldronSpike', (-0.41, 0.79, 0.03), 0.035, 0.13, 'Arms', 'gold', 6, (0, 0, 0.55))
    for s in [-1, 1]:
        b.sculpt_limb('UpperArm', (s * 0.30, 0.66, 0.02), (s * 0.37, 0.52, 0.14), 0.105, 0.085, 'Arms', 'skin', 10, 0.028)
        b.sculpt_limb('Forearm', (s * 0.37, 0.52, 0.14), (s * 0.38, 0.44, 0.32), 0.092, 0.082, 'Arms', 'skin', 10, 0.024)
        b.rbox('Bracer', (s * 0.38, 0.46, 0.26), (0.115, 0.115, 0.10), 'Arms', 'strap', 0.02, (0.35, 0, 0))
        b.rbox('Knuckle', (s * 0.38, 0.43, 0.34), (0.12, 0.09, 0.09), 'Arms', 'dark', 0.025, smooth=True)
        for ci in [-0.042, 0.0, 0.042]:
            b.cone('Claw', (s * 0.38 + ci, 0.42, 0.42), 0.022, 0.095, 'Arms', 'fang', 6, (math.pi * 0.52, 0, 0))

    for s, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = s * 0.155
        b.sculpt_limb('Thigh', (x, 0.30, 0.0), (x, 0.12, 0.03), 0.105, 0.085, part, 'skin', 10, 0.022)
        b.rbox('KneeGuard', (x, 0.17, 0.09), (0.11, 0.09, 0.06), part, 'steel', 0.02)
        b.rbox('Foot', (x, 0.06, 0.07), (0.13, 0.09, 0.18), part, 'dark', 0.03, smooth=True)
        for ci in [-0.045, 0.0, 0.045]:
            b.cone('ToeClaw', (x + ci, 0.04, 0.18), 0.020, 0.07, part, 'fang', 6, (math.pi * 0.5, 0, 0))

    origins = {'Body': (0, 0, 0), 'Head': (0, 0.75, 0.02), 'Arms': (0, 0.64, 0.02), 'LegL': (-0.155, 0.30, 0), 'LegR': (0.155, 0.30, 0)}
    b.export_pair(origins, 'normal', 0.38)


# ==============================================================================
# 2 & 3. FAST & FLANKER — Lean Razor-Clawed Stalker & Obsidian Ambush Predator
# ==============================================================================
def build_stalker(key, skin_col, belly_col, blade_col, eye_col):
    reset_scene()
    pal = [
        ('skin',   skin_col,  0.80, 0.00),
        ('belly',  belly_col, 0.84, 0.00),
        ('dark',   blade_col, 0.46, 0.35),  # chitinous razor blades
        ('eye',    eye_col,   0.14, 0.00),
        ('ink',    (0.02, 0.02, 0.03), 0.60, 0.00),
        ('fang',   (0.96, 0.94, 0.86), 0.38, 0.10),
        ('steel',  (0.20, 0.24, 0.30), 0.36, 0.80),
        ('strap',  (0.18, 0.12, 0.10), 0.82, 0.08),
    ] + [('pad', skin_col, 0.80, 0.0)] * 8
    mat = build_pbr_material('V191_' + key, pal)
    b = SculptBuilder(mat, pal)

    # Lean crouched forward predator torso
    b.muscle_torso('StalkerTorso', [
        (0.24, 0.13, 0.12, -0.04),
        (0.38, 0.17, 0.15, 0.00),
        (0.54, 0.23, 0.19, 0.06),
        (0.66, 0.22, 0.18, 0.11),
        (0.74, 0.14, 0.13, 0.15),
    ], 'Body', 'skin', 20, pec_bulge=0.04, lat_flare=0.035)
    # Swept-back chitinous dorsal blades!
    for sy, sz, ln in [(0.44, -0.14, 0.20), (0.58, -0.10, 0.26), (0.70, -0.03, 0.24)]:
        b.cone('DorsalBlade', (0, sy, sz), 0.052, ln, 'Body', 'dark', 6, (-1.05, 0, 0))
    if key == 'flanker':
        for s in [-1, 1]:
            b.cone('ShoulderCrest', (s * 0.24, 0.72, 0.04), 0.065, 0.28, 'Body', 'dark', 6, (-0.55, s * 0.48, 0))

    # Elongated reptilian/lupine predator skull jutting forward
    b.sculpt_skull('PredatorSkull', (0, 0.82, 0.24), (0.20, 0.17, 0.26), 'Head', 'skin', jaw_jut=0.09, cheek_flare=0.04)
    b.cone('CrownCrest', (0, 0.96, 0.10), 0.055, 0.26, 'Head', 'dark', 6, (-0.85, 0, 0))
    b.rbox('SnarlMaw', (0, 0.75, 0.40), (0.15, 0.065, 0.12), 'Head', 'ink', 0.015)
    for s in [-1, 1]:
        b.rbox('Eye', (s * 0.082, 0.86, 0.39), (0.065, 0.036, 0.04), 'Head', 'eye', 0.008, (0, s * 0.25, s * -0.28))
        b.cone('SweptHorn', (s * 0.14, 0.92, 0.12), 0.045, 0.24, 'Head', 'dark', 6, (-0.75, s * 0.42, 0))
        for fx in [0.36, 0.43]:
            b.cone('Fang', (s * 0.055, 0.78, fx), 0.018, 0.065, 'Head', 'fang', 6, (math.pi, 0, 0))

    # Long reaching arms + triple scythe talons!
    for s in [-1, 1]:
        b.sculpt_limb('ArmU', (s * 0.24, 0.62, 0.10), (s * 0.30, 0.46, 0.24), 0.082, 0.068, 'Arms', 'skin', 9, 0.02)
        b.sculpt_limb('ArmL', (s * 0.30, 0.46, 0.24), (s * 0.28, 0.34, 0.40), 0.072, 0.062, 'Arms', 'dark', 9, 0.018)
        for ci, cl in [(-0.04, 0.15), (0.0, 0.18), (0.04, 0.15)]:
            b.cone('ScytheTalon', (s * 0.28 + ci, 0.31, 0.49), 0.022, cl, 'Arms', 'fang', 6, (math.pi * 0.56, 0, 0))

    for s, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = s * 0.145
        b.sculpt_limb('LegU', (x, 0.28, -0.02), (x, 0.12, 0.05), 0.088, 0.068, part, 'skin', 9, 0.02)
        b.rbox('RaptorFoot', (x, 0.055, 0.08), (0.11, 0.07, 0.17), part, 'dark', 0.02, smooth=True)
        b.cone('RaptorClaw', (x, 0.04, 0.19), 0.022, 0.085, part, 'fang', 6, (math.pi * 0.5, 0, 0))

    origins = {'Body': (0, 0, 0), 'Head': (0, 0.74, 0.15), 'Arms': (0, 0.60, 0.10), 'LegL': (-0.145, 0.28, 0), 'LegR': (0.145, 0.28, 0)}
    b.export_pair(origins, key, 0.40)


# ==============================================================================
# 4 & 5. SHIELD & ELITE — Heavy Riot-Armored Juggernaut with Massive Gunmetal Shield
# ==============================================================================
def build_armored(key, skin_col, armor_col, trim_col, glow_col):
    reset_scene()
    pal = [
        ('skin',      skin_col,  0.84, 0.00),
        ('steel',     armor_col, 0.34, 0.84),  # heavy weathered gunmetal armor
        ('steel_lt',  (0.42, 0.48, 0.56), 0.28, 0.86),  # brushed bevel steel
        ('trim',      trim_col,  0.32, 0.78),  # hazard gold / crimson-gold trim
        ('dark',      (0.08, 0.10, 0.14), 0.58, 0.50),
        ('strap',     (0.20, 0.15, 0.11), 0.82, 0.08),
        ('fang',      (0.95, 0.93, 0.85), 0.40, 0.00),
        ('pad7',      armor_col, 0.36, 0.80),
        ('pad8',      armor_col, 0.36, 0.80),
        ('pad9',      armor_col, 0.36, 0.80),
        ('pad10',     armor_col, 0.36, 0.80),
        ('glow',      glow_col,  0.14, 0.00),  # 11: tactical visor & shield core
    ] + [('pad', armor_col, 0.36, 0.80)] * 4
    mat = build_pbr_material('V191_' + key, pal)
    b = SculptBuilder(mat, pal)

    # Hulking broad torso encased in riveted steel chestplate & waist tassets!
    b.muscle_torso('JuggernautTorso', [
        (0.26, 0.22, 0.19, 0.00),
        (0.42, 0.32, 0.26, 0.02),
        (0.62, 0.36, 0.29, 0.03),
        (0.76, 0.28, 0.23, 0.02),
        (0.84, 0.18, 0.15, 0.00),
    ], 'Body', 'skin', 20, pec_bulge=0.04, lat_flare=0.04)
    b.rbox('ChestCuirass', (0, 0.60, 0.18), (0.56, 0.36, 0.22), 'Body', 'steel', 0.045)
    b.rbox('ChestRib', (0, 0.62, 0.29), (0.42, 0.07, 0.06), 'Body', 'trim', 0.015)
    b.rbox('ChestCore', (0, 0.62, 0.31), (0.14, 0.10, 0.05), 'Body', 'glow', 0.01)
    b.rbox('BackPlate', (0, 0.60, -0.16), (0.50, 0.34, 0.16), 'Body', 'steel', 0.04)
    b.rbox('ArmoredBelt', (0, 0.36, 0.02), (0.56, 0.11, 0.42), 'Body', 'steel_lt', 0.025)
    for s in [-1, 1]:
        b.rbox('HipTasset', (s * 0.28, 0.28, 0.05), (0.12, 0.20, 0.28), 'Body', 'steel', 0.02, (0, 0, s * -0.18))

    # Armored Riot Helmet + Heavy Steel Jaw Guard + Glowing Visor Slit
    b.sculpt_skull('HeadCore', (0, 0.94, 0.04), (0.24, 0.22, 0.23), 'Head', 'skin', jaw_jut=0.06, cheek_flare=0.04)
    b.rbox('SteelHelm', (0, 1.03, 0.02), (0.50, 0.22, 0.48), 'Head', 'steel', 0.06)
    b.rbox('HelmCrest', (0, 1.15, 0.02), (0.12, 0.09, 0.44), 'Head', 'trim', 0.02)
    b.rbox('VisorSlit', (0, 0.96, 0.26), (0.34, 0.055, 0.06), 'Head', 'glow', 0.01)
    b.rbox('IronJawGuard', (0, 0.83, 0.20), (0.44, 0.15, 0.26), 'Head', 'steel_lt', 0.035)
    if key == 'elite':
        for s in [-1, 1]:
            b.cone('WarlordHorn', (s * 0.26, 1.16, 0.04), 0.065, 0.28, 'Head', 'trim', 8, (0.2, s * 0.55, 0))

    # Layered Heavy Pauldrons + MASSIVE GUNMETAL RIOT TOWER SHIELD on Left Arm + Mace/Claw Right Arm!
    for s in [-1, 1]:
        b.rbox('PauldronTop', (s * 0.38, 0.72, 0.03), (0.24, 0.16, 0.28), 'Arms', 'steel', 0.035, (0, 0, s * -0.25))
        b.rbox('PauldronTrim', (s * 0.40, 0.65, 0.03), (0.25, 0.05, 0.29), 'Arms', 'trim', 0.01, (0, 0, s * -0.25))
        b.sculpt_limb('UpperArm', (s * 0.35, 0.64, 0.03), (s * 0.39, 0.48, 0.18), 0.105, 0.09, 'Arms', 'skin', 10, 0.025)
        b.rbox('Gauntlet', (s * 0.39, 0.44, 0.26), (0.14, 0.14, 0.20), 'Arms', 'steel_lt', 0.025, (0.3, 0, 0))

    # Iconic Heavy Riot Shield held in front-left (+Z) — unmistakable silhouette!
    b.rbox('RiotShieldMain', (-0.20, 0.50, 0.40), (0.54, 0.78, 0.09), 'Arms', 'steel', 0.035, (-0.08, 0.22, 0))
    b.rbox('RiotShieldRimT', (-0.20, 0.87, 0.37), (0.58, 0.09, 0.12), 'Arms', 'steel_lt', 0.02, (-0.08, 0.22, 0))
    b.rbox('RiotShieldRimB', (-0.20, 0.13, 0.43), (0.58, 0.09, 0.12), 'Arms', 'trim', 0.02, (-0.08, 0.22, 0))
    b.rbox('ShieldViewport', (-0.20, 0.68, 0.44), (0.32, 0.075, 0.06), 'Arms', 'glow', 0.01, (-0.08, 0.22, 0))
    b.rbox('ShieldBoss', (-0.20, 0.44, 0.45), (0.20, 0.22, 0.07), 'Arms', 'trim', 0.02, (-0.08, 0.22, 0))
    # Right hand heavy iron war-club / spiked fist
    b.rbox('IronFistR', (0.40, 0.41, 0.38), (0.16, 0.16, 0.18), 'Arms', 'steel', 0.03)
    for cx in [0.35, 0.45]:
        b.cone('KnuckleSpike', (cx, 0.41, 0.50), 0.028, 0.10, 'Arms', 'trim', 6, (math.pi * 0.5, 0, 0))

    for s, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = s * 0.17
        b.sculpt_limb('Thigh', (x, 0.30, 0.0), (x, 0.14, 0.02), 0.115, 0.095, part, 'skin', 10, 0.02)
        b.rbox('Greave', (x, 0.16, 0.08), (0.14, 0.18, 0.12), part, 'steel', 0.025)
        b.rbox('SabatonBoot', (x, 0.06, 0.07), (0.15, 0.10, 0.20), part, 'steel_lt', 0.03)

    origins = {'Body': (0, 0, 0), 'Head': (0, 0.78, 0.02), 'Arms': (0, 0.66, 0.03), 'LegL': (-0.17, 0.30, 0), 'LegR': (0.17, 0.30, 0)}
    b.export_pair(origins, key, 0.38)


# ==============================================================================
# 6. SPITTER — Bio-Luminescent Acid Mutant (Veined Venom Glands + Split Mandibles)
# ==============================================================================
def build_spitter():
    reset_scene()
    pal = [
        ('skin',   (0.22, 0.42, 0.14), 0.82, 0.00),  # 0: dark swamp-reptile hide
        ('belly',  (0.46, 0.64, 0.22), 0.80, 0.00),  # 1: pale bilious underbelly
        ('dark',   (0.10, 0.22, 0.08), 0.78, 0.08),  # 2: dark chitin spines & vein cages
        ('eye',    (1.00, 0.94, 0.18), 0.14, 0.00),  # 3: toxic yellow compound eyes
        ('ink',    (0.02, 0.05, 0.02), 0.60, 0.00),
        ('fang',   (0.92, 0.96, 0.80), 0.38, 0.00),
        ('strap',  (0.18, 0.26, 0.12), 0.84, 0.04),
        ('pad7',   (0.22, 0.42, 0.14), 0.82, 0.0),
        ('pad8',   (0.22, 0.42, 0.14), 0.82, 0.0),
        ('pad9',   (0.22, 0.42, 0.14), 0.82, 0.0),
        ('pad10',  (0.22, 0.42, 0.14), 0.82, 0.0),
        ('glow',   (0.52, 1.00, 0.16), 0.16, 0.00),  # 11: EMISSIVE veined neon bio-venom!
    ] + [('pad', (0.22, 0.42, 0.14), 0.82, 0.0)] * 4
    mat = build_pbr_material('V191_Spitter', pal)
    b = SculptBuilder(mat, pal)

    b.muscle_torso('SpitterTorso', [
        (0.24, 0.16, 0.15, -0.03),
        (0.38, 0.22, 0.20, 0.01),
        (0.56, 0.25, 0.23, 0.07),
        (0.70, 0.20, 0.18, 0.12),
        (0.78, 0.13, 0.13, 0.16),
    ], 'Body', 'skin', 20, pec_bulge=0.03, lat_flare=0.03)
    # Ribbed organic bio-venom dorsal gland sacs caged in dark chitin ribs!
    b.bio_sac('VenomGlandMain', (0, 0.76, -0.14), (0.24, 0.25, 0.22), 'Body', 'glow', 1.7)
    for ra in [-0.14, 0.0, 0.14]:
        b.rbox('ChitinCage', (ra, 0.77, -0.26), (0.035, 0.34, 0.18), 'Body', 'dark', 0.01, (0.35, 0, ra * 1.5), smooth=True)
    for s in [-1, 1]:
        b.bio_sac('VenomSide', (s * 0.22, 0.67, -0.07), (0.14, 0.16, 0.13), 'Body', 'glow', 3.1 + s)
        b.cone('ChitinSpine', (s * 0.15, 0.90, -0.05), 0.04, 0.16, 'Body', 'dark', 6, (-0.5, s * 0.35, 0))

    # Insectoid-reptilian acid head + distended glowing throat sac + split outer mandibles!
    b.sculpt_skull('SpitterSkull', (0, 0.86, 0.23), (0.22, 0.18, 0.23), 'Head', 'skin', jaw_jut=0.08, cheek_flare=0.05)
    b.bio_sac('ThroatVenomSac', (0, 0.73, 0.30), (0.15, 0.12, 0.14), 'Head', 'glow', 5.2)
    b.rbox('AcidMaw', (0, 0.80, 0.40), (0.16, 0.075, 0.07), 'Head', 'glow', 0.015, smooth=True)
    for s in [-1, 1]:
        b.rbox('Eye', (s * 0.095, 0.92, 0.38), (0.065, 0.048, 0.035), 'Head', 'eye', 0.01, (0, 0, s * -0.2))
        b.cone('CrestSpine', (s * 0.12, 1.03, 0.14), 0.042, 0.18, 'Head', 'dark', 7, (-0.55, s * 0.28, 0))
        # Flared insectoid side mandibles gripping glowing venom!
        b.cone('Mandible', (s * 0.14, 0.79, 0.44), 0.035, 0.14, 'Head', 'dark', 7, (math.pi * 0.48, s * -0.42, 0))
        b.cone('InnerFang', (s * 0.05, 0.83, 0.43), 0.018, 0.06, 'Head', 'fang', 6, (math.pi, 0, 0))

    for s in [-1, 1]:
        b.sculpt_limb('ArmU', (s * 0.24, 0.60, 0.10), (s * 0.28, 0.46, 0.24), 0.08, 0.065, 'Arms', 'skin', 9, 0.02)
        b.sculpt_limb('ArmL', (s * 0.28, 0.46, 0.24), (s * 0.26, 0.36, 0.38), 0.068, 0.058, 'Arms', 'dark', 9, 0.016)
        b.bio_sac('VenomClawPod', (s * 0.26, 0.36, 0.39), (0.055, 0.048, 0.055), 'Arms', 'glow', 2.0)
        for ci in [-0.03, 0.03]:
            b.cone('Claw', (s * 0.26 + ci, 0.34, 0.45), 0.018, 0.08, 'Arms', 'fang', 6, (math.pi * 0.52, 0, 0))

    for s, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = s * 0.15
        b.sculpt_limb('Leg', (x, 0.26, 0.0), (x, 0.08, 0.04), 0.09, 0.07, part, 'skin', 9, 0.02)
        b.rbox('Foot', (x, 0.055, 0.07), (0.11, 0.07, 0.16), part, 'dark', 0.02, smooth=True)

    origins = {'Body': (0, 0, 0), 'Head': (0, 0.76, 0.14), 'Arms': (0, 0.60, 0.10), 'LegL': (-0.15, 0.28, 0), 'LegR': (0.15, 0.28, 0)}
    b.export_pair(origins, 'spitter', 0.40)


# ==============================================================================
# 7. THROWER — Scarred Demolition Grenadier (Leather Harness + Steel Bomb Rack + Iron Bomb)
# ==============================================================================
def build_thrower():
    reset_scene()
    pal = [
        ('skin',   (0.76, 0.36, 0.10), 0.82, 0.00),  # 0: weathered burnt-sienna/amber hide (NOT neon plastic orange!)
        ('belly',  (0.86, 0.52, 0.22), 0.84, 0.00),  # 1: muscular chest/belly
        ('iron',   (0.14, 0.17, 0.22), 0.34, 0.84),  # 2: heavy cast-iron bombs & armor rack
        ('red',    (0.86, 0.16, 0.12), 0.42, 0.25),  # 3: hazard crimson bomb bands
        ('brass',  (0.88, 0.64, 0.16), 0.30, 0.80),  # 4: brass buckles, bomb caps & rivets
        ('strap',  (0.22, 0.14, 0.09), 0.84, 0.06),  # 5: grained heavy leather bandoliers
        ('eye',    (1.00, 0.86, 0.20), 0.14, 0.00),
        ('ink',    (0.03, 0.03, 0.04), 0.60, 0.00),
        ('fang',   (0.95, 0.93, 0.85), 0.40, 0.00),
        ('steel',  (0.32, 0.37, 0.44), 0.32, 0.82),  # 9: steel helmet/pauldron plates
        ('pad10',  (0.76, 0.36, 0.10), 0.82, 0.0),
        ('spark',  (1.00, 0.68, 0.10), 0.12, 0.00),  # 11: EMISSIVE burning fuse sparks!
    ] + [('pad', (0.76, 0.36, 0.10), 0.82, 0.0)] * 4
    mat = build_pbr_material('V191_Thrower', pal)
    b = SculptBuilder(mat, pal)

    # Stocky powerhouse grenadier torso + crossed leather bandoliers + grenade pouches + steel bomb-cage backpack
    b.muscle_torso('ThrowerTorso', [
        (0.26, 0.21, 0.18, 0.00),
        (0.40, 0.29, 0.24, 0.02),
        (0.60, 0.34, 0.27, 0.03),
        (0.74, 0.28, 0.23, 0.02),
        (0.81, 0.18, 0.15, 0.00),
    ], 'Body', 'skin', 22, pec_bulge=0.055, lat_flare=0.045)
    b.rbox('HeavyBelt', (0, 0.34, 0.01), (0.52, 0.10, 0.40), 'Body', 'strap', 0.025)
    b.rbox('BrassBuckle', (0, 0.34, 0.22), (0.15, 0.11, 0.05), 'Body', 'brass', 0.015)
    for rz in [-0.52, 0.52]:
        b.rbox('Bandolier', (0, 0.56, 0.02), (0.56, 0.075, 0.44), 'Body', 'strap', 0.015, (0, 0, rz))
    for px, py in [(-0.14, 0.62), (0.0, 0.54), (0.14, 0.46)]:
        b.cyl('ChestShell', (px, py, 0.26), 0.038, 0.11, 'Body', 'brass', 8, (0.2, 0, 0.5))

    # Steel Bomb-Rack Cage on Back + 2 Heavy Iron Bombs with Crimson Bands & Glowing Fuse Sparks!
    b.rbox('BombRackFrame', (0, 0.62, -0.22), (0.48, 0.38, 0.22), 'Body', 'iron', 0.03)
    b.rbox('RackCrossbar', (0, 0.62, -0.34), (0.50, 0.07, 0.05), 'Body', 'steel', 0.015)
    for s in [-1, 1]:
        b.bio_sac('BackBomb', (s * 0.15, 0.85, -0.20), (0.14, 0.14, 0.14), 'Body', 'iron', 1.0)
        b.cyl('BombBand', (s * 0.15, 0.85, -0.20), 0.146, 0.045, 'Body', 'red', 12)
        b.cyl('BombCap', (s * 0.15, 0.99, -0.20), 0.05, 0.05, 'Body', 'brass', 10)
        b.bio_sac('FuseSpark', (s * 0.18, 1.06, -0.20), (0.048, 0.048, 0.048), 'Body', 'spark', 2.0)

    # Fierce scarred grenadier head + iron blast-goggles/helmet band + tusks
    b.sculpt_skull('ThrowerSkull', (0, 0.93, 0.05), (0.25, 0.22, 0.24), 'Head', 'skin', jaw_jut=0.075, cheek_flare=0.055)
    b.rbox('IronSkullBand', (0, 1.04, 0.04), (0.48, 0.10, 0.46), 'Head', 'steel', 0.03)
    b.rbox('Maw', (0, 0.83, 0.24), (0.19, 0.08, 0.08), 'Head', 'ink', 0.02)
    for s in [-1, 1]:
        # Iron blast-goggle rims around fierce glowing eyes!
        b.cyl('GoggleRim', (s * 0.10, 0.97, 0.25), 0.068, 0.05, 'Head', 'brass', 10, (math.pi * 0.5, 0, 0))
        b.cyl('GoggleEye', (s * 0.10, 0.97, 0.265), 0.046, 0.04, 'Head', 'eye', 10, (math.pi * 0.5, 0, 0))
        b.cone('Tusk', (s * 0.088, 0.83, 0.30), 0.028, 0.09, 'Head', 'fang', 7, (0.2, s * 0.12, 0))

    # Heavy spiked iron pauldron + leather gauntlets + live iron bomb gripped in right hand!
    b.rbox('PauldronR', (0.36, 0.71, 0.03), (0.22, 0.15, 0.24), 'Arms', 'iron', 0.03, (0, 0, -0.28))
    b.cone('PauldronSpikeR', (0.44, 0.80, 0.03), 0.038, 0.14, 'Arms', 'brass', 6, (0, 0, -0.55))
    for s in [-1, 1]:
        b.sculpt_limb('UpperArm', (s * 0.33, 0.65, 0.03), (s * 0.39, 0.50, 0.18), 0.11, 0.092, 'Arms', 'skin', 10, 0.028)
        b.sculpt_limb('Forearm', (s * 0.39, 0.50, 0.18), (s * 0.39, 0.43, 0.34), 0.098, 0.088, 'Arms', 'skin', 10, 0.024)
        b.rbox('LeatherWraps', (s * 0.39, 0.45, 0.27), (0.13, 0.12, 0.12), 'Arms', 'strap', 0.02, (0.3, 0, 0))
        b.rbox('Fist', (s * 0.39, 0.42, 0.37), (0.13, 0.11, 0.11), 'Arms', 'iron', 0.025)
    # Iron Bomb held ready to lob in right hand!
    b.bio_sac('HandBomb', (0.39, 0.48, 0.46), (0.12, 0.12, 0.12), 'Arms', 'iron', 3.0)
    b.cyl('HandBombBand', (0.39, 0.48, 0.46), 0.125, 0.038, 'Arms', 'red', 10)
    b.bio_sac('HandBombSpark', (0.39, 0.61, 0.46), (0.042, 0.042, 0.042), 'Arms', 'spark', 4.0)

    for s, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = s * 0.165
        b.sculpt_limb('Thigh', (x, 0.30, 0.0), (x, 0.13, 0.02), 0.11, 0.09, part, 'skin', 10, 0.022)
        b.rbox('IronBoot', (x, 0.065, 0.07), (0.14, 0.10, 0.19), part, 'iron', 0.03)
        b.rbox('BootCap', (x, 0.055, 0.14), (0.145, 0.07, 0.08), part, 'steel', 0.02)

    origins = {'Body': (0, 0, 0), 'Head': (0, 0.76, 0.02), 'Arms': (0, 0.64, 0.02), 'LegL': (-0.165, 0.30, 0), 'LegR': (0.165, 0.30, 0)}
    b.export_pair(origins, 'thrower', 0.38)


print('=== Building V19.1 Commercial Sculpted Monsters ===')
build_normal()
build_stalker('fast',    (0.58, 0.12, 0.24), (0.74, 0.26, 0.34), (0.18, 0.05, 0.12), (1.00, 0.88, 0.18))
build_stalker('flanker', (0.16, 0.14, 0.24), (0.28, 0.22, 0.36), (0.78, 0.12, 0.20), (1.00, 0.24, 0.22))
build_armored('shield',  (0.24, 0.28, 0.34), (0.15, 0.20, 0.27), (0.92, 0.66, 0.14), (0.22, 0.90, 1.00))
build_armored('elite',   (0.32, 0.12, 0.22), (0.22, 0.12, 0.16), (0.96, 0.70, 0.18), (1.00, 0.28, 0.20))
build_spitter()
build_thrower()
print('=== ALL 7 MONSTER FAMILIES EXPORTED ===')
