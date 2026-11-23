"""Normalize the generated 4x2 diffuse atlas using Blender's image pipeline.

Run with Blender --background --python tools/prepare-world-art-v121.py.
The full-resolution generated source remains under docs/design/art-v121-source.
"""
import bpy
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
source = os.path.join(root, 'docs', 'design', 'art-v121-source', 'world-materials.png')
output = os.path.join(root, 'assets', 'art-v121', 'world-materials.jpg')
os.makedirs(os.path.dirname(output), exist_ok=True)
image = bpy.data.images.load(source, check_existing=False)
image.scale(1024, 512)
image.file_format = 'JPEG'
image.filepath_raw = output
image.save()
print('WORLD_ATLAS', output, tuple(image.size), os.path.getsize(output))
