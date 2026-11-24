"""
V15-ART-007: Blender 4.2.3 LTS 3D-Lit Military Room Backdrops Generator
Renders three 540x960 portrait commercial mobile game backgrounds:
  1. assets/game/v15/bg_armory.jpg  (Weapon Armory Room with lit pedestal & racks)
  2. assets/game/v15/bg_shop.jpg    (Logistics Supply Depot with crates & canopy)
  3. assets/game/v15/bg_train.jpg   (Tactical Barracks Training Bay with spotlight)
"""
import math
import os
import bpy

OUT_DIR = r"d:\git\fan\AI项目\h5\assets\game\v15"
os.makedirs(OUT_DIR, exist_ok=True)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 4
    scene.cycles.diffuse_bounces = 2
    scene.cycles.glossy_bounces = 2
    scene.render.resolution_x = 540
    scene.render.resolution_y = 960
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 86
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.exposure = 0.25

    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.04, 0.08, 0.05, 1.0)
        bg.inputs[1].default_value = 0.5
    return scene


def mat(name, color, rough=0.65, metal=0.1, emit=None, emit_str=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emit and emit_str > 0:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emit_str
    return m


def add_box(name, loc, scale, material, rot=(0, 0, 0), bevel=0.04):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    if bevel > 0:
        mod = obj.modifiers.new("Bevel", 'BEVEL')
        mod.width = bevel
        mod.segments = 2
    obj.data.materials.append(material)
    return obj


def add_cyl(name, loc, radius, depth, material, verts=32, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def add_light(name, kind, loc, energy, color, size=1.5, rot=(0, 0, 0), spot_size=0.9):
    ld = bpy.data.lights.new(name, type=kind)
    ld.energy = energy
    ld.color = color
    if kind == 'AREA':
        ld.size = size
    elif kind == 'SPOT':
        ld.spot_size = spot_size
        ld.spot_blend = 0.45
        ld.shadow_soft_size = size
    obj = bpy.data.objects.new(name, ld)
    obj.location = loc
    obj.rotation_euler = rot
    bpy.context.collection.objects.link(obj)
    return obj


def add_camera(loc, target, lens=34):
    cd = bpy.data.cameras.new("Cam")
    cd.lens = lens
    cam = bpy.data.objects.new("Cam", cd)
    cam.location = loc
    bpy.context.collection.objects.link(cam)
    direction = (target[0] - loc[0], target[1] - loc[1], target[2] - loc[2])
    import mathutils
    rot_quat = mathutils.Vector(direction).to_track_quat('-Z', 'Y')
    cam.rotation_euler = rot_quat.to_euler()
    bpy.context.scene.camera = cam
    return cam


def render_armory():
    scene = clear_scene()
    m_wall = mat("Wall", (0.11, 0.19, 0.13), rough=0.72, metal=0.22)
    m_pillar = mat("Pillar", (0.16, 0.25, 0.17), rough=0.58, metal=0.35)
    m_floor = mat("Floor", (0.08, 0.13, 0.10), rough=0.36, metal=0.45)
    m_steel = mat("Steel", (0.20, 0.24, 0.23), rough=0.42, metal=0.65)
    m_crate = mat("Crate", (0.36, 0.27, 0.14), rough=0.78, metal=0.05)
    m_gold = mat("Gold", (0.85, 0.64, 0.18), rough=0.30, metal=0.75)
    m_glow = mat("Glow", (1.0, 0.82, 0.35), rough=0.2, metal=0.0, emit=(1.0, 0.78, 0.28), emit_str=4.5)
    m_cyan = mat("Cyan", (0.35, 0.85, 0.65), rough=0.2, metal=0.0, emit=(0.35, 0.90, 0.65), emit_str=2.2)

    # Room shell
    add_box("Floor", (0, 0, -0.2), (10, 10, 0.4), m_floor, bevel=0)
    add_box("BackWall", (0, 3.2, 3.2), (10, 0.4, 7.2), m_wall, bevel=0)
    add_box("LeftWall", (-3.8, 0.5, 3.2), (0.4, 8, 7.2), m_wall, bevel=0)
    add_box("RightWall", (3.8, 0.5, 3.2), (0.4, 8, 7.2), m_wall, bevel=0)

    # Architectural armored pillars & caution bands
    for sx in (-2.5, -1.1, 1.1, 2.5):
        add_box(f"Pillar_{sx}", (sx, 2.85, 3.2), (0.38, 0.42, 6.8), m_pillar, bevel=0.03)
    add_box("BackHeaderBeam", (0, 2.75, 5.2), (7.6, 0.5, 0.45), m_steel, bevel=0.03)
    add_box("WallTrimGold", (0, 2.95, 2.35), (7.4, 0.12, 0.10), m_gold, bevel=0.01)

    # Pegboard weapon rack panels on left & right back wall
    for sx in (-1.8, 1.8):
        add_box(f"RackPanel_{sx}", (sx, 2.92, 3.35), (1.15, 0.12, 1.65), m_steel, bevel=0.02)
        for ry in (2.8, 3.25, 3.7):
            add_box(f"GunSil_{sx}_{ry}", (sx, 2.80, ry), (0.85, 0.08, 0.14), m_floor, bevel=0.02)

    # Central elevated tactical pedestal (positioned in upper-mid frame where weapon sits)
    add_cyl("PedBase", (0, 0.4, 0.22), 1.45, 0.44, m_steel, verts=40)
    add_cyl("PedTop", (0, 0.4, 0.48), 1.22, 0.10, m_pillar, verts=40)
    add_cyl("PedRingGlow", (0, 0.4, 0.46), 1.28, 0.05, m_glow, verts=48)
    add_cyl("PedInnerRing", (0, 0.4, 0.54), 0.88, 0.03, m_cyan, verts=48)

    # Side ammo crates & oil drums
    add_box("CrateL1", (-2.1, 1.5, 0.42), (0.95, 0.85, 0.84), m_crate, rot=(0, 0, 0.18), bevel=0.04)
    add_box("CrateL2", (-2.2, 1.6, 1.15), (0.72, 0.65, 0.62), m_pillar, rot=(0, 0, -0.12), bevel=0.03)
    add_box("CrateR1", (2.15, 1.45, 0.40), (0.98, 0.82, 0.80), m_crate, rot=(0, 0, -0.22), bevel=0.04)
    add_cyl("DrumR", (2.45, 0.35, 0.55), 0.36, 1.10, m_pillar, verts=20)
    add_cyl("DrumBand", (2.45, 0.35, 0.55), 0.37, 0.16, m_gold, verts=20)

    # Overhead industrial lamp fixtures
    add_box("LampBar", (0, 0.5, 5.1), (2.2, 0.35, 0.18), m_steel, bevel=0.02)
    add_box("LampEmit", (0, 0.5, 4.98), (1.8, 0.22, 0.06), m_glow, bevel=0.01)

    # Warm dramatic studio lighting
    add_light("KeySpot", 'SPOT', (0, -0.4, 5.4), 520, (1.0, 0.90, 0.72), size=0.8, rot=(0.18, 0, 0), spot_size=1.05)
    add_light("RimLeft", 'AREA', (-3.0, 1.5, 3.2), 140, (0.55, 0.95, 0.72), size=1.8, rot=(1.2, 0, -1.1))
    add_light("RimRight", 'AREA', (3.0, 1.2, 3.2), 160, (1.0, 0.80, 0.42), size=1.8, rot=(1.2, 0, 1.1))
    add_light("BackFill", 'AREA', (0, 2.2, 4.2), 90, (0.85, 0.92, 0.80), size=2.4, rot=(0.5, 0, 0))

    add_camera((0, -4.6, 2.35), (0, 0.6, 1.55), lens=32)
    scene.render.filepath = os.path.join(OUT_DIR, "bg_armory.jpg")
    bpy.ops.render.render(write_still=True)


def render_shop():
    scene = clear_scene()
    m_canvas = mat("Canvas", (0.14, 0.24, 0.15), rough=0.84, metal=0.05)
    m_wood = mat("Wood", (0.42, 0.29, 0.14), rough=0.76, metal=0.04)
    m_wood_dk = mat("WoodDk", (0.24, 0.16, 0.08), rough=0.82, metal=0.05)
    m_floor = mat("Floor", (0.12, 0.16, 0.11), rough=0.65, metal=0.10)
    m_gold = mat("Gold", (0.92, 0.68, 0.18), rough=0.28, metal=0.78)
    m_olive = mat("Olive", (0.20, 0.33, 0.19), rough=0.62, metal=0.22)
    m_glow = mat("WarmLamp", (1.0, 0.85, 0.45), rough=0.2, metal=0.0, emit=(1.0, 0.82, 0.36), emit_str=5.0)

    # Tent/Depot room
    add_box("Floor", (0, 0, -0.2), (10, 10, 0.4), m_floor, bevel=0)
    add_box("BackWall", (0, 3.3, 3.2), (10, 0.4, 7.2), m_canvas, bevel=0)
    add_box("LeftWall", (-3.8, 0.5, 3.2), (0.4, 8, 7.2), m_canvas, bevel=0)
    add_box("RightWall", (3.8, 0.5, 3.2), (0.4, 8, 7.2), m_canvas, bevel=0)

    # Wooden support beams & shelving
    for sx in (-2.4, 2.4):
        add_box(f"Post_{sx}", (sx, 2.7, 3.2), (0.30, 0.30, 6.6), m_wood_dk, bevel=0.03)
    add_box("AwningBeam", (0, 2.3, 4.9), (6.4, 0.65, 0.45), m_wood, bevel=0.04)
    add_box("GoldTrim", (0, 2.0, 4.65), (6.2, 0.12, 0.12), m_gold, bevel=0.01)

    # Supply shelves on back wall
    for sz in (1.6, 2.8, 4.0):
        add_box(f"Shelf_{sz}", (0, 2.85, sz), (4.8, 0.65, 0.14), m_wood, bevel=0.02)
    # Crates & gold supply boxes on shelves
    shelf_items = [
        (-1.6, 2.8, 2.0, (0.75, 0.55, 0.65), m_wood),
        (-0.6, 2.8, 1.95, (0.65, 0.50, 0.55), m_olive),
        (0.7, 2.8, 2.0, (0.80, 0.55, 0.65), m_wood),
        (1.65, 2.8, 1.95, (0.60, 0.48, 0.55), m_gold),
        (-1.4, 2.8, 3.18, (0.70, 0.52, 0.60), m_olive),
        (0.0, 2.8, 3.20, (0.88, 0.56, 0.64), m_wood),
        (1.4, 2.8, 3.15, (0.68, 0.50, 0.54), m_olive),
    ]
    for i, (x, y, z, sc, m) in enumerate(shelf_items):
        add_box(f"Supply_{i}", (x, y, z), sc, m, rot=(0, 0, (i % 3 - 1) * 0.08), bevel=0.03)

    # Foreground crates left & right
    add_box("CrateFG_L", (-2.2, 0.8, 0.5), (1.05, 0.95, 1.0), m_wood, rot=(0, 0, 0.25), bevel=0.04)
    add_box("CrateFG_R", (2.2, 0.9, 0.48), (1.0, 0.9, 0.96), m_olive, rot=(0, 0, -0.20), bevel=0.04)

    # Hanging warm depot lanterns
    for sx in (-1.3, 1.3):
        add_cyl(f"Lantern_{sx}", (sx, 1.5, 4.35), 0.22, 0.28, m_glow, verts=18)

    add_light("WarmKey", 'AREA', (0, -0.8, 4.8), 380, (1.0, 0.86, 0.58), size=2.6, rot=(0.45, 0, 0))
    add_light("GoldBounce", 'AREA', (2.6, 0.5, 2.5), 150, (1.0, 0.78, 0.35), size=1.6, rot=(1.1, 0, 1.2))
    add_light("CampCool", 'AREA', (-2.8, 0.5, 2.8), 110, (0.62, 0.90, 0.68), size=1.6, rot=(1.1, 0, -1.2))

    add_camera((0, -4.6, 2.4), (0, 0.8, 1.9), lens=32)
    scene.render.filepath = os.path.join(OUT_DIR, "bg_shop.jpg")
    bpy.ops.render.render(write_still=True)


def render_train():
    scene = clear_scene()
    m_wall = mat("Wall", (0.10, 0.18, 0.12), rough=0.68, metal=0.25)
    m_panel = mat("Panel", (0.18, 0.28, 0.18), rough=0.55, metal=0.30)
    m_floor = mat("Floor", (0.09, 0.14, 0.10), rough=0.40, metal=0.35)
    m_gold = mat("Gold", (0.88, 0.66, 0.20), rough=0.30, metal=0.72)
    m_sand = mat("Sandbag", (0.48, 0.42, 0.28), rough=0.88, metal=0.02)
    m_glow = mat("Glow", (0.55, 1.0, 0.55), rough=0.2, metal=0.0, emit=(0.55, 1.0, 0.55), emit_str=3.5)
    m_warm = mat("Warm", (1.0, 0.88, 0.52), rough=0.2, metal=0.0, emit=(1.0, 0.85, 0.45), emit_str=4.0)

    add_box("Floor", (0, 0, -0.2), (10, 10, 0.4), m_floor, bevel=0)
    add_box("BackWall", (0, 3.2, 3.2), (10, 0.4, 7.2), m_wall, bevel=0)
    for sx in (-2.2, 0, 2.2):
        add_box(f"Rib_{sx}", (sx, 2.9, 3.2), (0.45, 0.35, 6.8), m_panel, bevel=0.04)
    # Tactical command crest ring on back wall
    add_cyl("CrestRing", (0, 2.85, 3.8), 1.05, 0.12, m_gold, verts=36, rot=(math.pi / 2, 0, 0))
    add_cyl("CrestCore", (0, 2.88, 3.8), 0.88, 0.14, m_wall, verts=36, rot=(math.pi / 2, 0, 0))

    # Central training stage
    add_cyl("StageBase", (0, 0.3, 0.20), 1.55, 0.40, m_panel, verts=40)
    add_cyl("StageGlow", (0, 0.3, 0.42), 1.42, 0.05, m_glow, verts=48)
    # Sandbag barricades at sides
    for sx in (-2.1, 2.1):
        add_box(f"Sand_{sx}", (sx, 1.2, 0.32), (1.1, 0.65, 0.64), m_sand, rot=(0, 0, sx * 0.12), bevel=0.14)

    add_box("TopBar", (0, 0.4, 5.1), (2.4, 0.3, 0.16), m_warm, bevel=0.02)
    add_light("KeySpot", 'SPOT', (0, -0.5, 5.3), 480, (1.0, 0.94, 0.78), size=0.8, rot=(0.15, 0, 0), spot_size=1.1)
    add_light("GreenRim", 'AREA', (-2.8, 1.4, 3.0), 140, (0.45, 0.95, 0.55), size=1.8, rot=(1.1, 0, -1.1))
    add_light("GoldRim", 'AREA', (2.8, 1.4, 3.0), 150, (1.0, 0.82, 0.42), size=1.8, rot=(1.1, 0, 1.1))

    add_camera((0, -4.6, 2.35), (0, 0.6, 1.75), lens=32)
    scene.render.filepath = os.path.join(OUT_DIR, "bg_train.jpg")
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    render_armory()
    render_shop()
    render_train()
    print("[v15_ui_bgs] Rendered bg_armory.jpg, bg_shop.jpg, bg_train.jpg OK")
