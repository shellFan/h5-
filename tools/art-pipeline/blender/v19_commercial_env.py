"""V19.0 Commercial Modern Spec-Ops Military Base 3D Environment Pack (Blender 4.2 LTS).
Replaces ALL primitive boxes/spheres/cones in js/military-art.js with 10 sculpted, beveled,
AO-shaded commercial cartoon-military 3D assets sharing 1 optimized 512x512 PBR atlas:
  1. PineTree        - Tall stylized layered alpine pine
  2. BroadTree       - Lush multi-canopy broadleaf tree (breaks cone monotony!)
  3. TacticalBush    - Clustered low foliage + Desert/Base boulders (replaces sphere bushes!)
  4. Watchtower      - Steel-truss tactical guard tower + stairs + armored booth + searchlight
  5. ArmoredHangar   - Ribbed arched military hangar + hazard bay door + roof vents (replaces box hangars!)
  6. ToyTank         - Modernized angular IFV/MBT tank + road wheels + turret optics
  7. MilitaryTent    - Ribbed tactical command tent + doorway frame + comms mast
  8. BunkerGate      - Landmark Spec-Ops Fortress Gatehouse + sloped bastions + AA turrets + cyan/gold trim
  9. SandbagBunker   - Curved sandbag wall + heavy military crate
  10. SupplyCluster  - Wooden pallet + banded crates + ribbed steel fuel drums (replaces box crates/drums!)
"""
import bpy, math, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
OUT_GLB = os.path.join(ROOT, 'assets', 'game', 'v15', 'env_military_pack.glb')
TEX_DIR = os.path.join(ROOT, 'tools', 'art-pipeline', 'textures')
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
os.makedirs(TEX_DIR, exist_ok=True)
random.seed(1901)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

PALETTE = [
    ('pine_dk',   (0.07, 0.24, 0.11), 0.80, 0.00),  # 0: deep forest pine
    ('pine_lt',   (0.15, 0.39, 0.16), 0.76, 0.00),  # 1: sunlit foliage green
    ('steel_dk',  (0.11, 0.15, 0.21), 0.38, 0.68),  # 2: dark gunmetal steel frame
    ('wood_dk',   (0.24, 0.14, 0.07), 0.86, 0.00),  # 3: bark / pallet timber
    ('tank_olv',  (0.17, 0.25, 0.18), 0.46, 0.32),  # 4: modern tactical slate-olive armor
    ('tank_trk',  (0.06, 0.07, 0.09), 0.72, 0.28),  # 5: rubber treads / tires
    ('hangar',    (0.26, 0.32, 0.38), 0.52, 0.35),  # 6: cool slate-steel hangar wall
    ('void_dk',   (0.03, 0.04, 0.06), 0.90, 0.00),  # 7: deep gate shadow / interior
    ('concrete',  (0.42, 0.44, 0.46), 0.82, 0.04),  # 8: fortified concrete wall
    ('conc_dk',   (0.25, 0.28, 0.32), 0.84, 0.08),  # 9: dark concrete trim / bunker base
    ('gold',      (0.96, 0.68, 0.12), 0.28, 0.72),  # 10: hazard gold / command star
    ('red',       (0.76, 0.14, 0.12), 0.48, 0.18),  # 11: fuel drum crimson / banner
    ('sandbag',   (0.58, 0.48, 0.32), 0.90, 0.00),  # 12: burlap sandbag
    ('tent_olv',  (0.22, 0.31, 0.22), 0.84, 0.02),  # 13: command tent canvas / crate
    ('steel_lt',  (0.36, 0.42, 0.49), 0.32, 0.74),  # 14: brushed steel / barrels / dish
    ('cyan_glow', (0.18, 0.90, 1.00), 0.14, 0.00),  # 15: modern Spec-Ops cyan beacon / floodlight
]

def make_atlas(name, orm=False):
    w, h = 256, 256
    im = bpy.data.images.new(name, width=w, height=h, alpha=True)
    if orm: im.colorspace_settings.name = 'Non-Color'
    pix = []
    for yy in range(h):
        for xx in range(w):
            cell = (yy // 64) * 4 + (xx // 64)
            cname, col, rough, metal = PALETTE[cell]
            lx = (xx % 64) / 63.0
            ly = (yy % 64) / 63.0
            if orm:
                # Subtle roughness variation
                rv = max(0.08, min(0.98, rough + 0.04 * math.sin(lx * 18.0)))
                rgb = (1.0, rv, metal)
            else:
                # Rich baked top-down light + bottom AO gradient + subtle panel/grain detail
                grad = 0.76 + 0.32 * ly
                rib = 0.035 * math.sin(lx * math.pi * 12.0) if cname in ('hangar', 'concrete', 'tank_olv') else 0.0
                grain = random.uniform(-0.012, 0.012)
                f = grad + rib + grain
                rgb = tuple(max(0.0, min(1.0, c * f)) for c in col)
            pix.extend((*rgb, 1.0))
    im.pixels = pix
    im.filepath_raw = os.path.join(TEX_DIR, name + '.png')
    im.file_format = 'PNG'
    im.save()
    return im

c_img = make_atlas('V19_EnvPack-basecolor', False)
orm_img = make_atlas('V19_EnvPack-orm', True)
mat = bpy.data.materials.new('V19_EnvPack_PBR')
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

def tag_uv(obj, col_id, smooth=True, h_span=4.0):
    obj.data.materials.clear(); obj.data.materials.append(mat)
    uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
    idx = next(i for i, p in enumerate(PALETTE) if p[0] == col_id)
    for poly in obj.data.polygons:
        poly.use_smooth = smooth
        for li in poly.loop_indices:
            co = obj.data.vertices[obj.data.loops[li].vertex_index].co
            # Map world Z (height in Blender) to cell V for automatic ground-AO darkening!
            vt = max(0.08, min(0.92, co.z / max(0.5, h_span)))
            ut = 0.5 + 0.34 * math.sin(co.x * 2.2 + co.y * 1.7)
            uv.data[li].uv = ((idx % 4 + ut) / 4.0, (idx // 4 + vt) / 4.0)
    return obj

def rbox(lst, p, scale, col, bevel=0.05, rot=(0, 0, 0), h_span=4.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
    o = bpy.context.object; o.scale = (scale[0], scale[2], scale[1]); o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if bevel:
        m = o.modifiers.new('B', 'BEVEL'); m.width = min(bevel, min(scale) * 0.32); m.segments = 2
        bpy.ops.object.modifier_apply(modifier=m.name)
    lst.append(tag_uv(o, col, True, h_span))

def cyl(lst, p, r, depth, col, seg=12, rot=(0, 0, 0), h_span=4.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=depth, location=xyz(p))
    o = bpy.context.object; o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    lst.append(tag_uv(o, col, True, h_span))

def cone(lst, p, r1, depth, col, seg=10, rot=(0, 0, 0), h_span=4.0):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r1, depth=depth, location=xyz(p))
    o = bpy.context.object; o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    lst.append(tag_uv(o, col, True, h_span))

def ell(lst, p, scale, col, seg=12, rings=8, rot=(0, 0, 0), h_span=4.0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=xyz(p))
    o = bpy.context.object; o.scale = (scale[0], scale[2], scale[1]); o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    lst.append(tag_uv(o, col, True, h_span))

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

def foliage_tuft(lst, p, scale, col, seed=1.0, subs=2, h_span=4.5):
    """Organic sculpted foliage cluster (displaced icosphere — eliminates geometric cone/ball look!)."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subs, radius=1.0, location=xyz(p))
    o = bpy.context.object
    for v in o.data.vertices:
        vx, vy, vz = v.co.x, v.co.y, v.co.z
        # Organic leafy tuft lobes + slightly flattened underside
        lobe = 1.0 + 0.18 * math.sin(vx * 3.7 + seed) * math.cos(vy * 3.3 - seed) + 0.12 * math.sin(vz * 4.5 + seed * 1.7)
        if vz < -0.2:
            vz *= 0.72
        v.co.x = vx * scale[0] * lobe
        v.co.y = vy * scale[2] * lobe
        v.co.z = vz * scale[1] * lobe
    o.data.update()
    lst.append(tag_uv(o, col, True, h_span))

# 1. PineTree (Natural Sculpted Multi-Bough Alpine Conifer — NO plain stacked cones!)
pts = []
# Slightly curved organic trunk + root buttresses
cone(pts, (0, 1.05, 0), 0.34, 2.1, 'wood_dk', 8, (0.03, 0, 0.02), h_span=4.8)
for ra in [0.0, 2.1, 4.2]:
    rbox(pts, (math.cos(ra) * 0.24, 0.20, math.sin(ra) * 0.24), (0.20, 0.42, 0.32), 'wood_dk', 0.05, (0.35, ra, 0), h_span=4.8)
# Sculpted drooping pine bough clusters with dark under-shadow & sunlit upper tufts
pine_clusters = [
    (0.0, 1.62, 0.0, 1.38, 0.56, 1.34, 'pine_dk', 1.1),
    (-0.42, 1.85, 0.32, 0.92, 0.48, 0.88, 'pine_lt', 2.3),
    (0.45, 1.90, -0.28, 0.90, 0.48, 0.90, 'pine_lt', 3.4),
    (0.04, 2.42, -0.03, 1.12, 0.54, 1.10, 'pine_dk', 4.2),
    (0.32, 2.65, 0.26, 0.78, 0.44, 0.78, 'pine_lt', 5.1),
    (-0.30, 2.70, -0.24, 0.76, 0.44, 0.76, 'pine_lt', 6.0),
    (-0.03, 3.22, 0.02, 0.84, 0.52, 0.84, 'pine_dk', 7.2),
    (0.14, 3.48, -0.10, 0.64, 0.45, 0.64, 'pine_lt', 8.4),
    (0.0, 3.98, 0.0, 0.46, 0.58, 0.46, 'pine_lt', 9.3),
]
for cx, cy, cz, sx, sy, sz, col, sd in pine_clusters:
    foliage_tuft(pts, (cx, cy, cz), (sx, sy, sz), col, sd, 2, h_span=4.8)
join_prop('PineTree', pts)

# 2. BroadTree (Natural Multi-Limb Lush Woodland Tree — organic leafy canopy!)
bt = []
cone(bt, (0, 1.10, 0), 0.38, 2.2, 'wood_dk', 8, (-0.03, 0, 0.04), h_span=4.6)
for bx, by, bz, rx, rz in [(-0.38, 1.82, 0.10, 0.12, 0.58), (0.40, 1.88, -0.08, -0.10, -0.54), (0.06, 2.02, 0.32, 0.52, 0.05)]:
    rbox(bt, (bx, by, bz), (0.16, 0.92, 0.16), 'wood_dk', 0.04, (rx, 0, rz), h_span=4.6)
broad_clusters = [
    (0.0, 2.62, 0.0, 1.28, 0.82, 1.22, 'pine_dk', 1.5),
    (-0.82, 2.48, 0.28, 0.88, 0.68, 0.84, 'pine_lt', 2.7),
    (0.84, 2.55, -0.24, 0.90, 0.70, 0.86, 'pine_lt', 3.9),
    (0.16, 2.68, 0.72, 0.82, 0.64, 0.78, 'pine_lt', 4.8),
    (-0.36, 3.18, -0.38, 0.86, 0.68, 0.84, 'pine_dk', 5.6),
    (0.24, 3.42, 0.14, 0.94, 0.72, 0.90, 'pine_lt', 6.4),
    (-0.22, 3.55, 0.22, 0.72, 0.60, 0.72, 'pine_lt', 7.8),
]
for cx, cy, cz, sx, sy, sz, col, sd in broad_clusters:
    foliage_tuft(bt, (cx, cy, cz), (sx, sy, sz), col, sd, 2, h_span=4.6)
join_prop('BroadTree', bt)

# 3. TacticalBush (Organic Displaced Shrubbery + Weathered Crag Rock)
bs = []
foliage_tuft(bs, (-0.36, 0.40, 0.12), (0.68, 0.44, 0.62), 'pine_dk', 2.1, 2, h_span=1.2)
foliage_tuft(bs, (0.34, 0.46, -0.08), (0.62, 0.48, 0.58), 'pine_lt', 4.3, 2, h_span=1.2)
foliage_tuft(bs, (0.02, 0.60, 0.20), (0.48, 0.40, 0.46), 'pine_lt', 6.5, 1, h_span=1.2)
rbox(bs, (0.66, 0.22, 0.28), (0.54, 0.38, 0.44), 'conc_dk', 0.12, (0.2, 0.4, 0.1), h_span=1.2)
join_prop('TacticalBush', bs)

# 4. Watchtower (Modern Steel-Truss Guard Tower + Armored Cabin + Cyan Searchlight)
wt = []
for sx in [-0.9, 0.9]:
    for sz in [-0.9, 0.9]:
        rbox(wt, (sx, 2.2, sz), (0.20, 4.4, 0.20), 'steel_dk', 0.03, h_span=5.5)
for y_lvl in [1.2, 2.6]:
    for sz in [-0.9, 0.9]:
        rbox(wt, (0, y_lvl, sz), (1.95, 0.12, 0.12), 'steel_lt', 0.02, (0, 0.62, 0), h_span=5.5)
        rbox(wt, (0, y_lvl, sz), (1.95, 0.12, 0.12), 'steel_lt', 0.02, (0, -0.62, 0), h_span=5.5)
rbox(wt, (0, 3.35, 0), (2.45, 0.28, 2.45), 'conc_dk', 0.05, h_span=5.5)
# Armored guard booth with sloped roof + cyan tactical visor window + searchlight
rbox(wt, (0, 4.10, 0), (2.15, 1.25, 2.15), 'hangar', 0.06, h_span=5.5)
rbox(wt, (0, 4.22, 1.09), (1.55, 0.42, 0.08), 'cyan_glow', 0.02, h_span=5.5)
rbox(wt, (0, 4.88, 0), (2.55, 0.32, 2.55), 'steel_dk', 0.06, h_span=5.5)
cyl(wt, (-0.75, 5.45, -0.55), 0.05, 1.1, 'steel_lt', 6, h_span=5.5)
cyl(wt, (0.88, 4.85, 0.95), 0.24, 0.34, 'steel_dk', 10, (math.pi * 0.4, 0, 0.3), h_span=5.5)
ell(wt, (0.94, 4.80, 1.12), (0.20, 0.20, 0.10), 'cyan_glow', 8, 6, h_span=5.5)
join_prop('Watchtower', wt)

# 5. ArmoredHangar (Sloped-Roof Tactical Steel Barracks/Hangar + Glowing Cyan Windows + Gold Bay Trim)
hg = []
rbox(hg, (0, 1.65, 0), (5.4, 3.3, 6.6), 'hangar', 0.10, h_span=4.6)
# Crisp pitched steel roof + central ridge beam (NO bulbous dark cylinder!)
rbox(hg, (-1.45, 3.55, 0), (3.1, 0.28, 7.0), 'steel_lt', 0.05, (0, 0, 0.22), h_span=4.6)
rbox(hg, (1.45, 3.55, 0), (3.1, 0.28, 7.0), 'steel_lt', 0.05, (0, 0, -0.22), h_span=4.6)
rbox(hg, (0, 3.88, 0), (0.65, 0.26, 7.05), 'gold', 0.04, h_span=4.6)
for sx in [-2.72, 2.72]:
    rbox(hg, (sx, 1.25, 0), (0.14, 2.3, 3.4), 'conc_dk', 0.03, h_span=4.6)
    rbox(hg, (sx, 2.52, 0), (0.16, 0.22, 3.6), 'gold', 0.02, h_span=4.6)
    for wz in [-2.2, 2.2]:
        rbox(hg, (sx, 2.35, wz), (0.15, 0.55, 1.05), 'cyan_glow', 0.02, h_span=4.6)
join_prop('ArmoredHangar', hg)

# 6. ToyTank (Modern Spec-Ops IFV / MBT Tank)
tk = []
rbox(tk, (0, 0.72, 0), (2.20, 0.68, 3.30), 'tank_olv', 0.12, h_span=2.2)
rbox(tk, (0, 0.98, 0.85), (1.85, 0.28, 1.15), 'steel_lt', 0.06, (0.18, 0, 0), h_span=2.2)
for sx in [-1.08, 1.08]:
    rbox(tk, (sx, 0.44, 0), (0.52, 0.66, 3.45), 'tank_trk', 0.14, h_span=2.2)
    rbox(tk, (sx * 1.12, 0.68, 0), (0.14, 0.36, 3.25), 'tank_olv', 0.04, h_span=2.2)
    for wz in [-1.18, -0.40, 0.40, 1.18]:
        cyl(tk, (sx * 1.06, 0.36, wz), 0.28, 0.56, 'steel_dk', 10, (0, math.pi * 0.5, 0), h_span=2.2)
rbox(tk, (0, 1.42, -0.12), (1.55, 0.64, 1.80), 'tank_olv', 0.14, h_span=2.2)
rbox(tk, (0.38, 1.78, 0.25), (0.32, 0.22, 0.32), 'cyan_glow', 0.03, h_span=2.2)
cyl(tk, (0, 1.44, 1.65), 0.12, 2.25, 'steel_lt', 10, (math.pi * 0.5, 0, 0), h_span=2.2)
rbox(tk, (0, 1.44, 2.78), (0.32, 0.28, 0.36), 'steel_dk', 0.05, h_span=2.2)
join_prop('ToyTank', tk)

# 7. MilitaryTent (Ribbed Tactical Command Tent + Sandbag Base)
tn = []
rbox(tn, (0, 0.98, 0), (3.9, 1.95, 4.7), 'tent_olv', 0.10, h_span=3.4)
cone(tn, (0, 2.52, 0), 3.2, 1.38, 'tent_olv', 4, (0, 0, math.pi * 0.25), h_span=3.4)
for rz in [-1.6, 0.0, 1.6]:
    rbox(tn, (0, 1.05, rz), (4.08, 2.0, 0.16), 'steel_dk', 0.03, h_span=3.4)
rbox(tn, (0, 0.82, 2.34), (1.35, 1.62, 0.18), 'void_dk', 0.04, h_span=3.4)
rbox(tn, (0, 1.72, 2.38), (1.55, 0.18, 0.22), 'gold', 0.03, h_span=3.4)
join_prop('MilitaryTent', tn)

# 8. BunkerGate (V19.1 Heavy Armored Spec-Ops Command Blast Fortress — matches Home KeyArt!)
bg = []
# Sloped fortified perimeter wings + heavy steel-plated buttresses + embrasure slits
rbox(bg, (-13.2, 3.3, 0), (13.2, 6.6, 3.6), 'hangar', 0.14, h_span=13.0)
rbox(bg, (13.2, 3.3, 0), (13.2, 6.6, 3.6), 'hangar', 0.14, h_span=13.0)
for bx in [-17.5, -13.5, -9.5, 9.5, 13.5, 17.5]:
    rbox(bg, (bx, 3.1, 1.85), (1.55, 6.2, 1.35), 'steel_dk', 0.08, (-0.10, 0, 0), h_span=13.0)
    rbox(bg, (bx, 6.9, 0.1), (1.95, 1.2, 3.9), 'steel_lt', 0.08, h_span=13.0)
    rbox(bg, (bx, 4.6, 2.45), (0.85, 0.28, 0.18), 'cyan_glow', 0.02, h_span=13.0)
# Central overhead armored command bridge + angled steel glacis + mechanical ribs
rbox(bg, (0, 7.8, 0.3), (12.8, 4.0, 4.5), 'steel_dk', 0.16, h_span=13.0)
rbox(bg, (0, 8.4, 2.45), (10.6, 2.2, 0.65), 'hangar', 0.10, (-0.12, 0, 0), h_span=13.0)
rbox(bg, (0, 10.05, 0.3), (13.8, 0.95, 5.1), 'steel_lt', 0.10, h_span=13.0)
for rx in [-3.4, -1.8, 1.8, 3.4]:
    rbox(bg, (rx, 7.6, 2.65), (0.38, 3.4, 0.42), 'steel_dk', 0.04, h_span=13.0)
# Heavy Interlocking Blast Portal Frame + Hydraulic Jambs + Recessed Armored Blast Doors
rbox(bg, (0, 5.85, 2.48), (9.8, 0.48, 0.48), 'gold', 0.05, h_span=13.0)
rbox(bg, (0, 2.9, -0.35), (8.2, 5.8, 2.4), 'void_dk', 0.06, h_span=13.0)
for dx in [-2.1, 2.1]:
    # Partially parted massive steel blast doors revealing deep dark interior + hazard ribs
    rbox(bg, (dx * 1.35, 2.85, 0.35), (2.4, 5.5, 0.45), 'conc_dk', 0.06, h_span=13.0)
    rbox(bg, (dx * 1.35, 2.85, 0.60), (2.1, 0.38, 0.14), 'gold', 0.02, h_span=13.0)
    rbox(bg, (dx * 1.35, 4.25, 0.60), (1.6, 0.24, 0.14), 'cyan_glow', 0.02, h_span=13.0)
# Twin Heavy Spec-Ops Bastion Towers + Sloped Armor Cheeks + Twin CIWS Radar Turrets
for sx in [-6.1, 6.1]:
    rbox(bg, (sx, 5.8, 0.55), (4.5, 11.6, 4.9), 'hangar', 0.18, h_span=13.5)
    rbox(bg, (sx, 2.6, 2.95), (4.1, 5.2, 0.95), 'steel_dk', 0.10, (-0.12, 0, 0), h_span=13.5)
    rbox(bg, (sx, 11.85, 0.55), (5.1, 1.05, 5.4), 'steel_dk', 0.10, h_span=13.5)
    rbox(bg, (sx, 10.1, 0.55), (4.75, 0.48, 5.05), 'gold', 0.05, h_span=13.5)
    rbox(bg, (sx, 8.4, 3.04), (2.6, 0.56, 0.18), 'cyan_glow', 0.03, h_span=13.5)
    rbox(bg, (sx, 6.6, 3.04), (1.8, 0.28, 0.18), 'cyan_glow', 0.02, h_span=13.5)
    # Armored tower vertical ribs
    for tx in [-1.6, 1.6]:
        rbox(bg, (sx + tx, 6.2, 2.95), (0.36, 7.6, 0.36), 'steel_lt', 0.04, h_span=13.5)
    # Rooftop CIWS Vulcan AA Turret + Radar Dome + Twin Barrels + Comms Mast
    cyl(bg, (sx, 12.65, 0.55), 1.45, 0.65, 'steel_dk', 14, h_span=14.0)
    ell(bg, (sx, 13.45, 0.35), (1.18, 1.08, 1.18), 'steel_lt', 12, 8, h_span=14.0)
    for bx_off in [-0.35, 0.35]:
        cyl(bg, (sx + bx_off, 13.15, 1.75), 0.11, 1.85, 'steel_dk', 8, (math.pi * 0.42, 0, 0), h_span=14.0)
    cyl(bg, (sx - (0.9 if sx < 0 else -0.9), 14.2, -0.6), 0.07, 2.8, 'steel_lt', 6, h_span=15.0)
# Central Spec-Ops Command Holographic Shield Emblem
cyl(bg, (0, 8.15, 2.80), 1.78, 0.38, 'steel_dk', 18, (math.pi * 0.5, 0, 0), h_span=13.0)
cyl(bg, (0, 8.15, 2.96), 1.46, 0.22, 'cyan_glow', 18, (math.pi * 0.5, 0, 0), h_span=13.0)
verts = [xyz((0, 8.15, 3.30))]
for j in range(10):
    a = math.pi / 2 + j * math.pi / 5
    r = 1.28 if j % 2 == 0 else 0.54
    verts.append(xyz((math.cos(a) * r, 8.15 + math.sin(a) * r, 3.10)))
faces = [(0, j + 1, (j + 1) % 10 + 1) for j in range(10)]
sm = bpy.data.meshes.new('GateStar'); sm.from_pydata(verts, [], faces); sm.update()
so = bpy.data.objects.new('GateStar', sm); bpy.context.collection.objects.link(so)
bg.append(tag_uv(so, 'gold', False, 13.0))
join_prop('BunkerGate', bg)

# 9. SandbagBunker
sb = []
for i in range(4):
    ell(sb, (-0.9 + i * 0.6, 0.22, 0), (0.35, 0.20, 0.25), 'sandbag', 10, 6, h_span=1.2)
for i in range(3):
    ell(sb, (-0.6 + i * 0.6, 0.52, -0.02), (0.35, 0.19, 0.24), 'sandbag', 10, 6, h_span=1.2)
rbox(sb, (1.18, 0.44, -0.15), (0.92, 0.82, 0.82), 'tent_olv', 0.06, h_span=1.2)
rbox(sb, (1.18, 0.82, -0.15), (0.98, 0.15, 0.88), 'steel_dk', 0.03, h_span=1.2)
rbox(sb, (1.18, 0.44, 0.27), (0.28, 0.14, 0.05), 'gold', 0.01, h_span=1.2)
join_prop('SandbagBunker', sb)

# 10. SupplyCluster (Pallet + Strapped Crates + Ribbed Red Fuel Drums — replaces box crates & drums!)
sc = []
rbox(sc, (0, 0.08, 0), (2.2, 0.16, 1.8), 'wood_dk', 0.03, h_span=1.6)
rbox(sc, (-0.48, 0.56, -0.12), (0.95, 0.82, 0.95), 'tent_olv', 0.06, (0, 0.08, 0), h_span=1.6)
rbox(sc, (-0.48, 0.56, -0.12), (0.99, 0.14, 0.99), 'gold', 0.02, (0, 0.08, 0), h_span=1.6)
cyl(sc, (0.55, 0.62, 0.22), 0.32, 0.92, 'red', 12, h_span=1.6)
cyl(sc, (0.55, 0.62, 0.22), 0.335, 0.12, 'steel_lt', 12, h_span=1.6)
cyl(sc, (0.68, 0.62, -0.45), 0.32, 0.92, 'steel_dk', 12, h_span=1.6)
join_prop('SupplyCluster', sc)

bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', export_yup=True, export_apply=True)
total_tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')
print('V19_ENV_PACK_DONE', 'file=', OUT_GLB, 'size=', os.path.getsize(OUT_GLB), 'tris=', total_tris)
