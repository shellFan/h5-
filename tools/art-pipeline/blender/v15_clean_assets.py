"""
V15-ART-009 Asset Cleanup & Compression Tool (Blender 4.2 embedded Python + numpy)
1. Removes trapped white background hole between legs/arms in assets/game/characters/soldier_portrait.png
2. Removes light-grey/white ground-shadow smear underneath all assets/game/weapons/*.png
3. Resizes & optimizes bg_armory.jpg, bg_shop.jpg, bg_train.jpg to crisp 720x1280 JPEG (~140KB each)
"""
import glob
import os
import bpy
import numpy as np

ROOT = r"d:\git\fan\AI项目\h5"


def load_rgba(path):
    img = bpy.data.images.load(path, check_existing=False)
    w, h = img.size
    arr = np.array(img.pixels[:], dtype=np.float32).reshape((h, w, 4))
    bpy.data.images.remove(img)
    return arr, w, h


def save_rgba(path, arr):
    h, w, _ = arr.shape
    img = bpy.data.images.new("out_tmp", width=w, height=h, alpha=True)
    img.pixels.foreach_set(arr.ravel().tolist())
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)


def clean_soldier_portrait():
    p = os.path.join(ROOT, "assets", "game", "characters", "soldier_portrait.png")
    arr, w, h = load_rgba(p)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    # Trapped white background between legs/arms: very bright & low saturation in lower 55% of image (note y=0 is bottom in Blender!)
    yy = np.arange(h)[:, None]
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    # Remove near-white low-saturation background pockets in lower 58% (below head/eyes!)
    is_white_hole = (yy < int(h * 0.58)) & (lum > 0.80) & (sat < 0.09)
    # Soft feather fringe
    is_white_fringe = (yy < int(h * 0.58)) & (lum > 0.72) & (sat < 0.11) & (~is_white_hole)
    arr[is_white_hole, 3] = 0.0
    arr[is_white_fringe, 3] *= 0.25
    # Also remove any faint white halo along outer transparent borders everywhere
    outer_white = (a < 0.85) & (lum > 0.76) & (sat < 0.10)
    arr[outer_white, 3] = 0.0
    save_rgba(p, arr)
    print(f"[clean_soldier_portrait] cleaned {int(is_white_hole.sum())} white-hole pixels in {w}x{h}")


def clean_weapons():
    wdir = os.path.join(ROOT, "assets", "game", "weapons")
    for p in sorted(glob.glob(os.path.join(wdir, "*.png"))):
        arr, w, h = load_rgba(p)
        r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
        sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        # The weapon PNGs have a bright grey/white painted smudge shadow underneath (high lum > 0.68, very low sat < 0.09, or semi-transparent white-grey)
        is_smudge = ((lum > 0.74) & (sat < 0.085)) | ((a < 0.92) & (lum > 0.58) & (sat < 0.10))
        # Protect small specular highlights strictly inside solid dark metal by checking 3x3 neighborhood:
        # Actually ground smudge is large & connected to transparent background! Let's flood-fill from transparent border!
        from collections import deque
        cand = is_smudge | (a < 0.05)
        visited = np.zeros((h, w), dtype=bool)
        q = deque()
        # Seed from all transparent pixels (a < 0.05)
        ys, xs = np.where(a < 0.05)
        for y, x in zip(ys.tolist(), xs.tolist()):
            visited[y, x] = True
            q.append((y, x))
        while q:
            cy, cx = q.popleft()
            for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and cand[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))
        removed = visited & (a >= 0.05)
        arr[removed, 3] = 0.0
        # Soft 1px defringe on newly exposed border
        pad = np.pad(visited, 1, mode='constant', constant_values=True)
        border = (~visited) & (pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:])
        fringe = border & (lum > 0.62) & (sat < 0.12)
        arr[fringe, 3] *= 0.25
        save_rgba(p, arr)
        print(f"[clean_weapons] {os.path.basename(p)}: removed {int(removed.sum())} smudge pixels")


def compress_bgs():
    scene = bpy.context.scene
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 82
    for name in ("bg_armory.jpg", "bg_shop.jpg", "bg_train.jpg"):
        p = os.path.join(ROOT, "assets", "game", "v15", name)
        if not os.path.exists(p):
            continue
        old_kb = os.path.getsize(p) // 1024
        img = bpy.data.images.load(p, check_existing=False)
        w, h = img.size
        if w > 720:
            new_w = 720
            new_h = int(round(h * (720.0 / w)))
            img.scale(new_w, new_h)
        img.save_render(p, scene=scene)
        bpy.data.images.remove(img)
        new_kb = os.path.getsize(p) // 1024
        print(f"[compress_bgs] {name}: {old_kb}KB -> {new_kb}KB")


if __name__ == "__main__":
    clean_soldier_portrait()
    clean_weapons()
    compress_bgs()
    print("[v15_clean_assets] DONE")
