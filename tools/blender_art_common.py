"""Small Blender-only toolkit for the original V121 enemy family."""
import bpy
import json
import math
import os
import random


PART_NAMES = ('Body', 'Head', 'Arms', 'LegL', 'LegR')


def xyz(p):
    """Game coordinates (X right, Y up, Z front) -> Blender coordinates."""
    return (p[0], -p[2], p[1])


class EnemyArt:
    def __init__(self, out_dir, key, palette, seed):
        self.out_dir = out_dir
        self.key = key
        self.palette = palette
        self.parts = {name: [] for name in PART_NAMES}
        self.random = random.Random(seed)
        self.material = None
        self.images = []
        self.joined = {}
        self._clear_scene()
        os.makedirs(os.path.join(out_dir, 'textures'), exist_ok=True)
        self._make_material()

    def _clear_scene(self):
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete(use_global=False)
        for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.images):
            for block in list(datablocks):
                datablocks.remove(block)

    def _atlas(self, suffix, orm=False):
        size = 256
        name = f'{self.key}-{suffix}'
        image = bpy.data.images.new(name, width=size, height=size, alpha=True)
        # Color space must be established before pixels are assigned.
        image.colorspace_settings.name = 'Non-Color' if orm else 'sRGB'
        pixels = []
        for yy in range(size):
            for xx in range(size):
                cell = (yy // 64) * 4 + xx // 64
                _, color, rough, metal = self.palette[cell]
                if orm:
                    rgb = (1.0, rough, metal)
                else:
                    # A broad, quantized hand-painted gradient reads as soft toy material while
                    # remaining highly compressible inside every GLB (continuous random noise in
                    # V42 made thirteen tiny atlases needlessly expensive on mobile).
                    band = (yy % 64) // 8
                    shade = .945 + .008 * band
                    rgb = tuple(max(0, min(1, c * shade)) for c in color)
                pixels.extend((*rgb, 1.0))
        image.pixels = pixels
        image.filepath_raw = os.path.join(self.out_dir, 'textures', name + '.png')
        image.file_format = 'PNG'
        image.save()
        self.images.append(image)
        return image

    def _make_material(self):
        base = self._atlas('basecolor')
        orm = self._atlas('orm', True)
        mat = bpy.data.materials.new(f'{self.key.title()}_SoftPBR_Atlas')
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        bsdf = nodes.get('Principled BSDF')
        bsdf.inputs['Specular IOR Level'].default_value = .28
        base_node = nodes.new('ShaderNodeTexImage')
        base_node.name = 'BaseColor_sRGB'
        base_node.image = base
        links.new(base_node.outputs['Color'], bsdf.inputs['Base Color'])
        packed = nodes.new('ShaderNodeTexImage')
        packed.name = 'ORM_NonColor'
        packed.image = orm
        separate = nodes.new('ShaderNodeSeparateColor')
        links.new(packed.outputs['Color'], separate.inputs[0])
        links.new(separate.outputs['Green'], bsdf.inputs['Roughness'])
        links.new(separate.outputs['Blue'], bsdf.inputs['Metallic'])
        self.material = mat

    def _finish(self, obj, part, color_id, smooth=True):
        obj.data.materials.clear()
        obj.data.materials.append(self.material)
        uv = obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
        index = next(i for i, item in enumerate(self.palette) if item[0] == color_id)
        for poly in obj.data.polygons:
            poly.use_smooth = smooth
            for loop_index in poly.loop_indices:
                vertex = obj.data.vertices[obj.data.loops[loop_index].vertex_index].co
                uv.data[loop_index].uv = (
                    (index % 4 + .5 + .14 * math.sin(vertex.x * 4.3 + vertex.z)) / 4,
                    (index // 4 + .5 + .14 * math.cos(vertex.z * 4.7 - vertex.x)) / 4,
                )
        self.parts[part].append(obj)
        return obj

    def surface(self, name, rings, part, color_id, segments=20, smooth=True):
        """Elliptical profile loft. Ring: (y, rx, rz, z-center[, x-center])."""
        vertices = []
        for ring in rings:
            y, rx, rz, zc = ring[:4]
            xc = ring[4] if len(ring) > 4 else 0
            for j in range(segments):
                angle = j * 2 * math.pi / segments
                vertices.append(xyz((xc + math.cos(angle) * rx, y, zc + math.sin(angle) * rz)))
        faces = []
        for r in range(len(rings) - 1):
            for j in range(segments):
                a = r * segments + j
                b = r * segments + (j + 1) % segments
                faces.append((a, b, b + segments, a + segments))
        faces.append(tuple(reversed(range(segments))))
        start = (len(rings) - 1) * segments
        faces.append(tuple(start + j for j in range(segments)))
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices, [], faces)
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
        return self._finish(obj, part, color_id, smooth)

    def ell(self, name, p, radii, part, color_id, segments=14, rings=8):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=xyz(p))
        obj = bpy.context.object
        obj.name = name
        obj.scale = (radii[0], radii[2], radii[1])
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        return self._finish(obj, part, color_id)

    def box(self, name, p, half, part, color_id, bevel=.018):
        bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
        obj = bpy.context.object
        obj.name = name
        obj.scale = (half[0] * 2, half[2] * 2, half[1] * 2)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel:
            modifier = obj.modifiers.new('Soft toy edge', 'BEVEL')
            modifier.width = bevel
            modifier.segments = 1
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        return self._finish(obj, part, color_id, False)

    def tube(self, name, points, radius, part, color_id, bevel_resolution=1):
        curve = bpy.data.curves.new(name, 'CURVE')
        curve.dimensions = '3D'
        curve.resolution_u = 1
        curve.bevel_depth = radius
        curve.bevel_resolution = bevel_resolution
        spline = curve.splines.new('POLY')
        spline.points.add(len(points) - 1)
        for point, p in zip(spline.points, points):
            point.co = (*xyz(p), 1)
        obj = bpy.data.objects.new(name, curve)
        bpy.context.collection.objects.link(obj)
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.convert(target='MESH')
        obj.select_set(False)
        return self._finish(obj, part, color_id)

    def cylinder(self, name, p, radius, depth, part, color_id, vertices=14):
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=xyz(p))
        obj = bpy.context.object
        obj.name = name
        return self._finish(obj, part, color_id)

    def cone(self, name, p, r1, r2, depth, part, color_id, vertices=12):
        bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=r1, radius2=r2, depth=depth, location=xyz(p))
        obj = bpy.context.object
        obj.name = name
        return self._finish(obj, part, color_id)

    def torus(self, name, p, major, minor, part, color_id, major_segments=16, minor_segments=6):
        bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                        major_segments=major_segments, minor_segments=minor_segments,
                                        location=xyz(p))
        obj = bpy.context.object
        obj.name = name
        return self._finish(obj, part, color_id)

    def join_parts(self, origins):
        for part, objects in self.parts.items():
            if not objects:
                raise RuntimeError(f'{self.key}: empty rigid part {part}')
            bpy.ops.object.select_all(action='DESELECT')
            for obj in objects:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = objects[0]
            bpy.ops.object.join()
            obj = bpy.context.object
            obj.name = part
            bpy.context.scene.cursor.location = xyz(origins[part])
            bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
            for polygon in obj.data.polygons:
                polygon.material_index = 0
            obj.data.materials.clear()
            obj.data.materials.append(self.material)
            self.joined[part] = obj

    def add_mouth_anchor(self, point):
        bpy.ops.object.empty_add(type='PLAIN_AXES', location=xyz(point))
        anchor = bpy.context.object
        anchor.name = 'MuzzleMouth'
        anchor.empty_display_size = .025
        anchor.parent = self.joined['Head']
        anchor.matrix_parent_inverse = self.joined['Head'].matrix_world.inverted()

    def triangle_count(self):
        return sum(sum(len(p.vertices) - 2 for p in obj.data.polygons) for obj in self.joined.values())

    def height(self):
        points = [obj.matrix_world @ vertex.co
                  for obj in self.joined.values() for vertex in obj.data.vertices]
        low = min(points, key=lambda point: point.z).z
        high = max(points, key=lambda point: point.z).z
        return high - low

    def export(self, origins, mouth_anchor=None, lod_ratio=.30):
        self.join_parts(origins)
        if mouth_anchor:
            self.add_mouth_anchor(mouth_anchor)
        bpy.context.scene['author'] = f'Original V121 {self.key} enemy; procedural profile sculpture, no external meshes'
        bpy.context.scene['assetVersion'] = 121
        bpy.context.scene['front'] = '+Z'
        hero_path = os.path.join(self.out_dir, f'{self.key}.glb')
        bpy.ops.export_scene.gltf(filepath=hero_path, export_format='GLB', export_yup=True,
                                  export_apply=True, export_extras=True)
        hero_triangles = self.triangle_count()
        hero_height = self.height()
        for obj in self.joined.values():
            bpy.context.view_layer.objects.active = obj
            modifier = obj.modifiers.new('Silhouette preserving LOD', 'DECIMATE')
            modifier.ratio = lod_ratio
            bpy.ops.object.modifier_apply(modifier=modifier.name)
            # Decimation can leave zero-area bookkeeping faces; remove them before glTF extraction.
            obj.data.validate(verbose=False, clean_customdata=True)
            obj.data.update()
        lod_path = os.path.join(self.out_dir, f'{self.key}-lod.glb')
        bpy.ops.export_scene.gltf(filepath=lod_path, export_format='GLB', export_yup=True,
                                  export_apply=True, export_extras=True)
        return hero_triangles, self.triangle_count(), hero_height


def write_json(path, value):
    with open(path, 'w', encoding='utf-8') as stream:
        json.dump(value, stream, indent=2, ensure_ascii=False)
        stream.write('\n')
