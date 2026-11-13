"""Generate twelve original five-part V42 cartoon enemies in Blender 4.2.15.

Run:
  D:/tools/blender-v41/blender-4.2.15-windows-x64/blender.exe --background --python tools/create-enemies.py

Authoring coordinates are game coordinates: X right, Y up, +Z faces the player.
Each enemy is profile-sculpted and assembled into five independently transformable rigid parts.
"""
import bpy
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blender_art_common import EnemyArt, PART_NAMES, write_json


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENEMY_ROOT = os.path.join(ROOT, 'assets', 'models', 'enemies')
os.makedirs(ENEMY_ROOT, exist_ok=True)

KEYS = ['normal', 'fast', 'shield', 'split', 'spitter', 'elite',
        'bruiser', 'bulwark', 'spitking', 'hivelord', 'titan', 'overlord']
BOSSES = {'bruiser', 'bulwark', 'spitking', 'hivelord', 'titan', 'overlord'}
ORIGINS = {
    'Body': (0, .48, 0), 'Head': (0, .94, .02), 'Arms': (0, .65, .02),
    'LegL': (-.105, .34, 0), 'LegR': (.105, .34, 0),
}

BASE_COLORS = {
    'normal': ((.18, .48, .20), (.20, .32, .13), (.48, .70, .32)),
    'fast': ((.36, .62, .25), (.72, .08, .06), (.96, .25, .12)),
    'shield': ((.28, .46, .25), (.31, .35, .38), (.64, .68, .70)),
    'split': ((.42, .23, .52), (.29, .10, .39), (.72, .32, .78)),
    'spitter': ((.38, .55, .18), (.27, .38, .12), (.40, .98, .12)),
    'elite': ((.25, .44, .22), (.42, .13, .10), (.91, .38, .12)),
    'bruiser': ((.30, .39, .25), (.48, .23, .09), (.94, .55, .12)),
    'bulwark': ((.27, .39, .28), (.25, .31, .35), (.80, .70, .24)),
    'spitking': ((.40, .50, .12), (.32, .23, .08), (.54, 1.0, .08)),
    'hivelord': ((.36, .20, .48), (.18, .08, .28), (.82, .25, .91)),
    'titan': ((.29, .36, .25), (.30, .30, .29), (.88, .43, .13)),
    'overlord': ((.22, .31, .27), (.13, .17, .20), (.08, .92, .85)),
}


def palette_for(key):
    skin, cloth, accent = BASE_COLORS[key]
    return [
        ('skin', skin, .78, 0), ('cloth', cloth, .88, 0), ('accent', accent, .67, .03),
        ('dark', (.045, .055, .055), .90, 0), ('armor', (.28, .32, .34), .50, .38),
        ('metal', (.48, .53, .54), .36, .68), ('leather', (.22, .10, .045), .85, 0),
        ('ivory', (.94, .90, .72), .65, 0), ('ink', (.012, .018, .018), .82, 0),
        ('mouth', (.30, .035, .045), .76, 0), ('gum', (.72, .18, .28), .72, 0),
        ('glow', accent, .33, .08), ('vein', (.18, .055, .24), .78, 0),
        ('sole', (.055, .045, .035), .96, 0), ('tooth', (.98, .96, .82), .57, 0),
        ('highlight', tuple(min(1, c * 1.28 + .06) for c in skin), .70, 0),
    ]


def body(art, width=.19, belly=0, lean=0, armored=False, ragged=False):
    z = lean
    art.surface('Profile torso', [
        (.35, width * .72, .11 + belly * .25, z - .01),
        (.45, width * (.90 + belly), .14 + belly * .32, z),
        (.60, width * (1.02 + belly * .65), .15 + belly * .42, z + .005),
        (.74, width * 1.18, .14, z + .005),
        (.79, width * .72, .09, z),
    ], 'Body', 'armor' if armored else 'cloth', 22)
    # Collar and jacket opening create clothing structure rather than a bare capsule.
    art.tube('Raised collar', [(-width * .62, .74, z + .055), (0, .70, z + .13),
                               (width * .62, .74, z + .055)], .025, 'Body', 'accent')
    art.box('Jacket placket', (0, .56, z + .145 + belly * .04), (.025, .17, .018),
            'Body', 'accent', .007)
    if ragged:
        for x, drop in [(-.14, .02), (-.07, .055), (.02, .025), (.11, .065)]:
            art.cone('Ragged jacket tail', (x * width / .19, .345 - drop, z + .03),
                     .035, .065, .12, 'Body', 'cloth', 7)
    art.box('Belt', (0, .40, z), (width * 1.03, .035, .14 + belly * .18),
            'Body', 'leather', .012)
    art.box('Belt clasp', (0, .40, z + .15 + belly * .19), (.052, .045, .018),
            'Body', 'metal', .008)


def legs(art, thin=False, heavy=False, crouch=0):
    leg_r = .055 if thin else (.085 if heavy else .068)
    for side, part in [(-1, 'LegL'), (1, 'LegR')]:
        x = side * (.095 if thin else .11)
        art.surface('Bent trouser leg', [
            (.11, leg_r * 1.06, leg_r, .015 + crouch),
            (.22, leg_r, leg_r * .95, 0 + crouch),
            (.35, leg_r * 1.12, leg_r, -.005),
            (.42, leg_r * 1.04, leg_r, -.005),
        ], part, 'cloth', 12)
        art.box('Boot ankle', (x, .11, .025 + crouch),
                (leg_r * 1.18, .085, .085), part, 'leather', .026)
        art.box('Recognizable boot toe', (x, .045, .105 + crouch),
                (leg_r * 1.28, .045, .145), part, 'dark', .03)
        art.box('Boot sole', (x, .012, .105 + crouch),
                (leg_r * 1.34, .012, .15), part, 'sole', .007)
        art.tube('Boot lace', [(x - leg_r * .62, .115, .112 + crouch),
                               (x + leg_r * .62, .115, .112 + crouch)],
                 .008, part, 'accent', 0)


def face(art, skin='skin', thin=False, wide=False, z=.03, jaw=.11, toothy=True,
         asym=0, long_jaw=False):
    rx = .145 if thin else (.225 if wide else .18)
    art.surface('Sculpted face', [
        (.79, .065, .065, z - .015),
        (.82, rx * .76, .105, z + .005),
        (.90, rx * (1.0 + asym * .08), .145 + (jaw if long_jaw else 0), z + .035, asym * .025),
        (1.02, rx, .15, z + .02),
        (1.11, rx * .80, .12, z),
        (1.16, .055, .045, z - .01),
    ], 'Head', skin, 24)
    for side in (-1, 1):
        ex = side * rx * .43
        art.ell('Eye white', (ex, 1.015, z + .144), (.050, .044, .022), 'Head', 'ivory', 12, 7)
        art.ell('Pupil', (ex + side * .006, 1.014, z + .165), (.024, .030, .012), 'Head', 'ink', 10, 6)
        brow_y = 1.072 + (-.006 if side < 0 else .006) * asym
        art.tube('Heavy eyebrow', [(ex - .044, brow_y, z + .153),
                                   (ex, brow_y + .012, z + .169),
                                   (ex + .042, brow_y, z + .155)], .010, 'Head', 'dark')
    art.ell('Nose', (0, .966, z + .188), (.036 if thin else .044, .035, .040),
            'Head', 'highlight', 12, 7)
    mouth_y = .895 if long_jaw else .915
    mouth_z = z + (.215 if long_jaw else .171)
    art.ell('Open mouth', (0, mouth_y, mouth_z),
            (.095 if wide or long_jaw else .072, .042 if toothy else .028, .020),
            'Head', 'mouth', 14, 7)
    if toothy:
        for x in (-.050, 0, .050):
            art.box('Individual tooth', (x, mouth_y + .018, mouth_z + .020),
                    (.020, .020, .010), 'Head', 'tooth', .005)
    art.ell('Lower lip', (0, mouth_y - .035, mouth_z + .014),
            (.09 if long_jaw else .072, .018, .018), 'Head', 'gum', 12, 6)
    for side in (-1, 1):
        art.ell('Ear', (side * rx * 1.02, .995, z), (.032, .052, .034), 'Head', skin, 10, 6)


def arms(art, width=.19, huge=False, forward=.12, armored=False, asymmetric=0):
    shoulder = width * 1.35
    for side in (-1, 1):
        sx = side * shoulder
        hand_scale = .092 if huge else .060
        y_hand = .52 + (.02 if side > 0 else -.01) * asymmetric
        z_hand = forward + (.04 if side > 0 else -.02) * asymmetric
        art.ell('Shoulder', (sx, .70, .015),
                (.105 if huge else .078, .105, .090), 'Arms', 'armor' if armored else 'cloth', 12, 7)
        art.tube('Sleeved arm', [(sx, .68, .03), (side * (shoulder + .045), .58, .07),
                                 (side * (shoulder + .015), y_hand, z_hand)],
                 .072 if huge else .052, 'Arms', 'cloth')
        art.ell('Readable hand', (side * (shoulder + .012), y_hand, z_hand + .035),
                (hand_scale, hand_scale * .82, hand_scale * 1.08),
                'Arms', 'skin', 12, 7)
        for finger in (-.028, 0, .028):
            art.ell('Knuckle', (side * (shoulder + .012) + finger, y_hand + .025,
                                z_hand + .09), (.020, .018, .028), 'Arms', 'highlight', 9, 5)


def headgear(art, key, z=.03):
    if key == 'normal':
        art.surface('Torn hood', [(1.075, .18, .13, z - .02), (1.14, .14, .09, z - .02),
                                  (1.20, .03, .02, z - .01)], 'Head', 'cloth', 18)
    elif key == 'fast':
        art.surface('Backwards red cap', [(1.09, .17, .13, z), (1.15, .13, .08, z),
                                          (1.19, .025, .018, z)], 'Head', 'accent', 18)
        art.box('Backward cap bill', (0, 1.105, z - .16), (.12, .022, .09), 'Head', 'accent', .015)
        art.torus('Cap strap', (0, 1.105, z - .13), .055, .012, 'Head', 'dark', 12, 5)
    elif key in ('shield', 'bulwark'):
        art.surface('Armored helmet', [(1.06, .21, .15, z), (1.14, .18, .13, z),
                                       (1.22, .04, .03, z)], 'Head', 'armor', 20)
        art.box('Helmet brow', (0, 1.075, z + .15), (.215, .035, .035), 'Head', 'metal', .012)
        if key == 'bulwark':
            for y, h in [(1.14, .09), (1.20, .065), (1.24, .045)]:
                art.box('Massive helmet crest', (0, y, z - .02), (.035, h, .11),
                        'Head', 'accent', .015)
    elif key == 'titan':
        art.surface('Titan helm', [(1.06, .22, .16, z), (1.15, .19, .13, z),
                                   (1.22, .06, .04, z)], 'Head', 'armor', 20)
        art.tube('Left horn', [(-.15, 1.15, z), (-.25, 1.19, z - .02), (-.31, 1.23, z + .01)],
                 .035, 'Head', 'ivory')
        art.tube('Right horn', [(.15, 1.15, z), (.25, 1.19, z - .02), (.31, 1.23, z + .01)],
                 .035, 'Head', 'ivory')
    elif key in ('hivelord', 'overlord'):
        for side in (-1, 0, 1):
            x = side * .10
            height = .15 if side == 0 else .11
            art.cone('Organic crown', (x, 1.16 + height * .25, z - .015),
                     .012, .055, height, 'Head', 'accent', 8)


def shield_prop(art, massive=False):
    radius = .30 if massive else .25
    z = .28
    art.cylinder('Single-piece shield', (-.02, .57, z), radius, .055, 'Arms', 'armor', 24)
    # Cylinder points along author Y; flatten/rotate manually so its face looks +Z.
    obj = art.parts['Arms'][-1]
    obj.rotation_euler[0] = math.radians(90)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    art.torus('Shield rim', (-.02, .57, z + .035), radius * .82, .030,
              'Arms', 'metal', 24, 6)
    rim = art.parts['Arms'][-1]
    rim.rotation_euler[0] = math.radians(90)
    bpy.context.view_layer.objects.active = rim
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    art.ell('Shield medallion', (-.02, .57, z + .078),
            (radius * .27, radius * .27, .035), 'Arms', 'accent', 14, 8)
    for angle in range(0, 360, 90):
        a = math.radians(angle)
        art.ell('Shield rivet', (-.02 + math.cos(a) * radius * .60,
                                 .57 + math.sin(a) * radius * .60, z + .073),
                (.018, .018, .010), 'Arms', 'metal', 8, 5)


def variant_details(art, key):
    if key == 'split':
        for p, r in [((.19, .77, .02), .10), ((.23, .90, -.01), .075),
                     ((.15, 1.10, .00), .065), ((.26, .60, -.03), .055)]:
            art.ell('Asymmetric mutant growth', p, (r, r * .86, r * .80),
                    'Head' if p[1] > .82 else 'Body', 'accent', 12, 7)
        art.tube('Raised purple vein', [(.20, .52, .13), (.15, .67, .16),
                                        (.20, .81, .12), (.14, .94, .14)],
                 .012, 'Body', 'vein')
    elif key in ('spitter', 'spitking'):
        cans = (-.12, .12) if key == 'spitking' else (0,)
        for x in cans:
            visible_x = x * 1.75 if key == 'spitking' else x
            art.cylinder('Back canister', (visible_x, .61, -.17), .075 if key == 'spitking' else .09,
                         .32, 'Body', 'metal', 14)
            art.torus('Canister band', (visible_x, .69, -.17), .078, .012, 'Body', 'accent', 14, 5)
        art.tube('Feeding hose', [(.10, .52, -.18), (.23, .62, -.09),
                                  (.22, .78, .04), (.12, .86, .12)],
                 .022, 'Body', 'dark')
        for x in (-.045, 0, .045):
            art.ell('Glowing mouth gland', (x, .87, .275), (.028, .023, .018),
                    'Head', 'glow', 9, 5)
        if key == 'spitking':
            art.box('Jaw canister cradle', (0, .825, .205), (.13, .045, .035),
                    'Head', 'metal', .016)
            art.ell('Jaw canister window', (0, .825, .246), (.072, .032, .018),
                    'Head', 'glow', 12, 7)
            art.tube('Left jaw hose', [(-.075, .83, .20), (-.16, .86, .14), (-.22, .79, .02)],
                     .016, 'Head', 'dark')
            art.tube('Right jaw hose', [(.075, .83, .20), (.16, .86, .14), (.22, .79, .02)],
                     .016, 'Head', 'dark')
    elif key in ('elite', 'titan'):
        slab = .15 if key == 'titan' else .115
        for side in (-1, 1):
            art.box('Heavy shoulder plate', (side * .25, .73, .00),
                    (slab, .09, .13), 'Arms', 'armor', .026)
            art.box('Shoulder stripe', (side * .25, .77, .13),
                    (slab * .65, .025, .018), 'Arms', 'accent', .008)
    elif key == 'bruiser':
        for side in (-1, 1):
            x = side * .33
            art.box('Industrial glove cuff', (x, .52, .11), (.11, .09, .10),
                    'Arms', 'metal', .028)
            art.ell('Oversized industrial fist', (x, .49, .23), (.145, .12, .15),
                    'Arms', 'armor', 14, 8)
            for dx in (-.07, -.023, .023, .07):
                art.ell('Metal glove knuckle', (x + dx, .54, .35), (.027, .026, .032),
                        'Arms', 'accent', 9, 5)
    elif key == 'hivelord':
        art.surface('Back cocoon', [(.39, .16, .11, -.15), (.55, .29, .15, -.19),
                                    (.75, .25, .13, -.17), (.83, .07, .04, -.12)],
                    'Body', 'accent', 18)
        for side in (-1, 1):
            art.ell('Cocoon side growth', (side * .25, .60, -.12), (.095, .14, .08),
                    'Body', 'accent', 12, 7)
            art.tube('Swept cocoon spine', [(side * .20, .48, -.15),
                                             (side * .33, .58, -.13),
                                             (side * .43, .70, -.08)],
                     .026, 'Body', 'vein')
            art.tube('Upper cocoon spine', [(side * .18, .68, -.14),
                                             (side * .30, .78, -.10),
                                             (side * .37, .88, -.04)],
                     .021, 'Body', 'accent')
        art.tube('Cocoon seam', [(-.12, .42, -.28), (0, .57, -.34),
                                 (.12, .76, -.27)], .014, 'Body', 'glow')
    elif key == 'overlord':
        art.torus('Glowing chest core ring', (0, .62, .19), .105, .028,
                  'Body', 'metal', 20, 7)
        art.ell('Glowing chest core', (0, .62, .225), (.072, .072, .030),
                'Body', 'glow', 16, 9)
        art.box('Back reactor', (0, .61, -.20), (.18, .22, .105), 'Body', 'armor', .045)
        for side in (-1, 1):
            art.cylinder('Reactor coil', (side * .12, .62, -.32), .045, .27,
                         'Body', 'metal', 12)
            art.tube('Reactor conduit', [(side * .12, .75, -.30),
                                         (side * .24, .81, -.10),
                                         (side * .26, .70, .04)], .020, 'Body', 'glow')


def make_enemy(key, index):
    out = os.path.join(ENEMY_ROOT, key)
    os.makedirs(out, exist_ok=True)
    art = EnemyArt(out, key, palette_for(key), 4200 + index)
    if key == 'normal':
        body(art, .18, ragged=True); legs(art); face(art, toothy=True); arms(art, .18); headgear(art, key)
    elif key == 'fast':
        body(art, .145, lean=.075); legs(art, thin=True, crouch=.025)
        face(art, thin=True, z=.105, jaw=.07); arms(art, .145, forward=.23); headgear(art, key, .105)
    elif key == 'shield':
        body(art, .22, armored=True); legs(art, heavy=True); face(art, wide=True)
        arms(art, .22, armored=True); headgear(art, key); shield_prop(art)
    elif key == 'split':
        body(art, .20, belly=.12, ragged=True); legs(art); face(art, wide=True, asym=1)
        arms(art, .20, asymmetric=1); variant_details(art, key)
    elif key == 'spitter':
        body(art, .20, belly=.52); legs(art); face(art, wide=True, long_jaw=True)
        arms(art, .20, forward=.18); variant_details(art, key)
    elif key == 'elite':
        body(art, .23, armored=True); legs(art, heavy=True); face(art, wide=True)
        arms(art, .23, huge=True, armored=True); variant_details(art, key)
    elif key == 'bruiser':
        body(art, .25, belly=.10); legs(art, heavy=True); face(art, wide=True)
        arms(art, .25, huge=True); variant_details(art, key)
    elif key == 'bulwark':
        body(art, .26, armored=True); legs(art, heavy=True); face(art, wide=True)
        arms(art, .26, armored=True); headgear(art, key); shield_prop(art, True)
    elif key == 'spitking':
        body(art, .25, belly=.65); legs(art, heavy=True); face(art, wide=True, long_jaw=True, jaw=.16)
        arms(art, .25, forward=.20); variant_details(art, key)
    elif key == 'hivelord':
        body(art, .22, belly=.18, ragged=True); legs(art); face(art, wide=True, asym=1)
        arms(art, .22, asymmetric=1); headgear(art, key); variant_details(art, key)
    elif key == 'titan':
        body(art, .27, armored=True); legs(art, heavy=True); face(art, wide=True)
        arms(art, .27, huge=True, armored=True); headgear(art, key); variant_details(art, key)
    elif key == 'overlord':
        body(art, .26, belly=.16, armored=True); legs(art, heavy=True); face(art, wide=True, asym=1)
        arms(art, .26, huge=True, armored=True); headgear(art, key); variant_details(art, key)

    mouth = (0, .87 if key in ('spitter', 'spitking') else .915,
             .305 if key in ('spitter', 'spitking') else .205)
    has_mouth_anchor = key in ('spitter', 'spitking', 'hivelord')
    hero, lod, height = art.export(ORIGINS, mouth if has_mouth_anchor else None,
                                   .27 if key in BOSSES else .29)
    stats = {
        'key': key, 'blender': bpy.app.version_string, 'generator': 'tools/create-enemies.py',
        'triangles': hero, 'lodTriangles': lod, 'height': round(height, 4),
        'forward': '+Z', 'up': '+Y', 'parts': list(PART_NAMES), 'origins': ORIGINS,
        'frontAnchor': [0, mouth[1], mouth[2]],
        'muzzleMouth': list(mouth) if has_mouth_anchor else None,
        'glowCells': [11] if key in ('spitter', 'spitking', 'hivelord', 'overlord') else [],
        'originalReferenceAvailable': False,
    }
    write_json(os.path.join(out, 'model-stats.json'), stats)
    print('V42_ASSET', key, hero, lod, round(height, 4))
    return stats


all_stats = [make_enemy(key, i) for i, key in enumerate(KEYS)]
catalog = {
    'version': 42,
    'generator': {
        'script': 'tools/create-enemies.py', 'helper': 'tools/blender_art_common.py',
        'blender': bpy.app.version_string,
        'provenance': 'Original procedural profile sculpture; no downloaded or baseline soldier meshes',
    },
    'parts': list(PART_NAMES),
    'enemies': [],
}
for stats in all_stats:
    key = stats['key']
    catalog['enemies'].append({
        'key': key, 'hero': f'{key}/{key}.glb', 'lod': f'{key}/{key}-lod.glb',
        'textures': [f'{key}/textures/{key}-basecolor.png', f'{key}/textures/{key}-orm.png'],
        'triangles': stats['triangles'], 'lodTriangles': stats['lodTriangles'],
        'budgets': {'hero': 15000 if key in BOSSES else 7000,
                    'lod': 4500 if key in BOSSES else 2000},
        'palette': {name: list(color) for name, color, _, _ in palette_for(key)},
        'parts': list(PART_NAMES), 'origins': ORIGINS,
        'height': stats['height'], 'up': '+Y', 'forward': '+Z',
        'frontAnchor': stats['frontAnchor'], 'muzzleMouth': stats['muzzleMouth'],
        'glowCells': stats['glowCells'],
        'boss': key in BOSSES,
        'phaseTint': ['teal', 'amber', 'magenta'] if key == 'overlord' else None,
    })
write_json(os.path.join(ENEMY_ROOT, 'catalog.json'), catalog)
print('V42_ENEMY_CATALOG', len(catalog['enemies']))
