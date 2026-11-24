#!/usr/bin/env python3
"""Audit and deterministically derive the user-provided art archive.

The audit stage preserves unique JPEG originals byte-for-byte. The processing
stage is intentionally separate so provenance can be reviewed before derived
runtime files are created.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import stat
import sys
import unicodedata
import zipfile
from collections import defaultdict, deque
from pathlib import Path, PurePosixPath

from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARCHIVE = ROOT / "《膨胀小队》H5全套美术资产库.zip"
DEFAULT_INVENTORY = Path.home() / ".codex" / "tmp" / "h5-art-audit" / "inventory.json"
SOURCE_ROOT = ROOT / "assets" / "art-source"
MANIFEST_PATH = SOURCE_ROOT / "manifest.json"
CSV_PATH = SOURCE_ROOT / "manifest.csv"
ORIGINALS_ROOT = SOURCE_ROOT / "original"
OPTIMIZED_ROOT = SOURCE_ROOT / "optimized"
QA_ROOT = SOURCE_ROOT / "qa"
GAME_ROOT = ROOT / "assets" / "game"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_zip_entry(info: zipfile.ZipInfo) -> None:
    raw = info.filename.replace("\\", "/")
    path = PurePosixPath(raw)
    if info.is_dir():
        raise ValueError(f"directories are not accepted: {info.filename!r}")
    if path.is_absolute() or ".." in path.parts or len(path.parts) != 1:
        raise ValueError(f"unsafe archive path: {info.filename!r}")
    if re.match(r"^[A-Za-z]:", raw):
        raise ValueError(f"drive-qualified archive path: {info.filename!r}")
    unix_mode = (info.external_attr >> 16) & 0xFFFF
    if unix_mode and stat.S_ISLNK(unix_mode):
        raise ValueError(f"symlink archive entry: {info.filename!r}")
    if path.suffix.lower() not in {".jpg", ".jpeg"}:
        raise ValueError(f"unsupported archive entry: {info.filename!r}")


def normalized_target_name(original_name: str) -> str:
    stem = Path(original_name).stem
    folded = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode("ascii")
    folded = re.sub(r"[^a-zA-Z0-9]+", "_", folded).strip("_").lower()
    if not folded:
        raise ValueError(f"cannot normalize filename: {original_name!r}")
    return folded + ".jpg"


def category_for(asset_id: int) -> str:
    if asset_id in {1, 6, 7, 8, 9, 10, 11, 12, 13}:
        return "effects"
    if asset_id == 2:
        return "gameplay"
    if 3 <= asset_id <= 5 or 14 <= asset_id <= 25:
        return "ui"
    if 26 <= asset_id <= 38:
        return "weapons"
    if 39 <= asset_id <= 50:
        return "enemies"
    if 51 <= asset_id <= 64:
        return "marketing"
    if 65 <= asset_id <= 82:
        return "environment"
    if 83 <= asset_id <= 90:
        return "characters"
    raise ValueError(f"unexpected asset id {asset_id}")


def write_exact(path: Path, data: bytes) -> None:
    """Create a preserved original, refusing to replace different bytes."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        current = path.read_bytes()
        if current != data:
            raise FileExistsError(f"refusing to overwrite mismatched original: {path}")
        return
    path.write_bytes(data)


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def audit_archive(archive: Path, inventory_path: Path) -> dict:
    if not archive.is_file():
        raise FileNotFoundError(archive)
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    if len(inventory) != 90:
        raise ValueError(f"expected 90 inventory rows, found {len(inventory)}")

    raw_rows: list[dict] = []
    with zipfile.ZipFile(archive) as bundle:
        infos = bundle.infolist()
        if len(infos) != 90:
            raise ValueError(f"expected 90 archive entries, found {len(infos)}")
        for index, (info, expected) in enumerate(zip(infos, inventory), start=1):
            validate_zip_entry(info)
            if expected.get("id") != index:
                raise ValueError(f"inventory order mismatch at row {index}")
            data = bundle.read(info)
            digest = sha256_bytes(data)
            if digest != expected.get("sha256"):
                raise ValueError(f"hash mismatch for archive entry {index}")
            if len(data) != expected.get("size"):
                raise ValueError(f"byte count mismatch for archive entry {index}")
            with Image.open(io.BytesIO(data)) as image:
                width, height = image.size
                image_format = image.format
                image.verify()
            if [width, height] != expected.get("dimensions"):
                raise ValueError(f"dimension mismatch for archive entry {index}")
            if image_format != "JPEG":
                raise ValueError(f"entry {index} is not JPEG")
            raw_rows.append({
                "id": index,
                "original_name": expected["name"],
                "sha256": digest,
                "width": width,
                "height": height,
                "format": image_format,
                "bytes": len(data),
                "category": category_for(index),
                "_data": data,
            })

    groups: dict[str, list[dict]] = defaultdict(list)
    for row in raw_rows:
        groups[row["sha256"]].append(row)

    used_targets: set[str] = set()
    entries: list[dict] = []
    for row in raw_rows:
        group = groups[row["sha256"]]
        canonical = group[0]
        target_name = normalized_target_name(canonical["original_name"])
        if row is canonical:
            if target_name in used_targets:
                target_name = f"{Path(target_name).stem}_{row['sha256'][:8]}.jpg"
            used_targets.add(target_name)
            write_exact(ORIGINALS_ROOT / target_name, row["_data"])
        else:
            # Canonical target was already made because archive order defines groups.
            target_name = next(
                entry["target_name"] for entry in entries if entry["id"] == canonical["id"]
            )

        entries.append({
            "id": row["id"],
            "original_name": row["original_name"],
            "sha256": row["sha256"],
            "width": row["width"],
            "height": row["height"],
            "format": row["format"],
            "bytes": row["bytes"],
            "category": row["category"],
            "target_name": target_name,
            "duplicate_of": None if row is canonical else canonical["id"],
            "merged_names": [member["original_name"] for member in group],
            "processing_status": "preserved" if row is canonical else "duplicate",
            "integration_status": "pending_review" if row is canonical else "deduplicated",
            "usage_refs": [],
            "crop_refs": [],
        })

    unique_count = sum(entry["duplicate_of"] is None for entry in entries)
    manifest = {
        "schema_version": 1,
        "provenance": {
            "kind": "user_provided_archive",
            "license": "not_externally_verified",
            "note": "User-provided source archive; usage rights require human verification.",
        },
        "archive": {
            "name": archive.name,
            "sha256": sha256_file(archive),
            "bytes": archive.stat().st_size,
            "entry_count": len(entries),
            "unique_asset_count": unique_count,
            "duplicate_entry_count": len(entries) - unique_count,
        },
        "entries": entries,
    }
    write_text(MANIFEST_PATH, json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    write_manifest_csv(entries)
    write_audit_documents(manifest)
    return manifest


CSV_FIELDS = [
    "id", "original_name", "sha256", "width", "height", "format", "bytes",
    "category", "target_name", "duplicate_of", "merged_names", "processing_status",
    "integration_status", "usage_refs", "crop_refs",
]


def write_manifest_csv(entries: list[dict]) -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS, lineterminator="\n")
        writer.writeheader()
        for entry in entries:
            row = dict(entry)
            for field in ("merged_names", "usage_refs", "crop_refs"):
                row[field] = json.dumps(row[field], ensure_ascii=False, separators=(",", ":"))
            writer.writerow(row)


def write_audit_documents(manifest: dict) -> None:
    duplicate_groups = []
    seen = set()
    for entry in manifest["entries"]:
        if len(entry["merged_names"]) > 1 and entry["sha256"] not in seen:
            seen.add(entry["sha256"])
            duplicate_groups.append(entry)
    duplicate_lines = []
    for entry in duplicate_groups:
        ids = [row["id"] for row in manifest["entries"] if row["sha256"] == entry["sha256"]]
        duplicate_lines.append(
            f"- Canonical `{ids[0]}`; duplicate entries `{', '.join(map(str, ids[1:]))}`; "
            f"SHA-256 `{entry['sha256']}`; stored once as `{entry['target_name']}`."
        )
    write_text(ROOT / "docs" / "art-assets" / "DEDUPLICATION_REPORT.md", """# Art archive deduplication report

The user-provided archive contains 90 JPEG entries and 86 unique byte streams. Deduplication is
strictly byte-hash based; no perceptual similarity merging was performed. All unique originals are
preserved byte-for-byte in `assets/art-source/original/`.

## Exact duplicate groups

""" + "\n".join(duplicate_lines) + "\n")
    write_text(ROOT / "docs" / "art-assets" / "ASSET_PROCESSING.md", """# Art asset processing

## Provenance and safety

- Source: user-provided ZIP archive. Its license and redistribution terms were not externally verified.
- Audit validates 90 flat JPEG entries and rejects directories, traversal, absolute paths, drive paths,
  symlinks, and non-JPEG entries.
- Unique originals are written byte-for-byte and are never overwritten if the existing bytes differ.
- Duplicate detection is exact SHA-256 equality only.

## Reproduce the audit

```powershell
python tools/import-art-assets.py --audit-only
node tests/unit/art-source-audit.js
```

The separate `--process` stage creates review and runtime derivatives. EXIF orientation normalization
is applied only to derivatives; preserved originals are not decoded or rewritten.
""")


def open_source(entry: dict) -> Image.Image:
    image = Image.open(ORIGINALS_ROOT / entry["target_name"])
    return ImageOps.exif_transpose(image).convert("RGB")


def resize_within(image: Image.Image, max_size: tuple[int, int]) -> Image.Image:
    result = image.copy()
    result.thumbnail(max_size, Image.Resampling.LANCZOS)
    return result


def remove_border_matte(image: Image.Image, tolerance: int = 72, feather: int = 24) -> Image.Image:
    """Remove only a border-connected light matte, preserving enclosed white details."""
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    corner_samples = [
        pixels[0, 0], pixels[width - 1, 0], pixels[0, height - 1], pixels[width - 1, height - 1]
    ]
    matte = tuple(sorted(sample[channel] for sample in corner_samples)[len(corner_samples) // 2]
                  for channel in range(3))

    def distance(pixel: tuple[int, int, int]) -> int:
        return max(abs(pixel[channel] - matte[channel]) for channel in range(3))

    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(1, height - 1):
        queue.append((0, y))
        queue.append((width - 1, y))

    alpha = Image.new("L", (width, height), 255)
    alpha_pixels = alpha.load()
    while queue:
        x, y = queue.popleft()
        offset = y * width + x
        if visited[offset]:
            continue
        visited[offset] = 1
        delta = distance(pixels[x, y])
        if delta > tolerance:
            continue
        alpha_pixels[x, y] = 0 if delta <= max(2, tolerance - feather) else round(
            255 * (delta - (tolerance - feather)) / feather
        )
        if x:
            queue.append((x - 1, y))
        if x + 1 < width:
            queue.append((x + 1, y))
        if y:
            queue.append((x, y - 1))
        if y + 1 < height:
            queue.append((x, y + 1))

    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha)
    return rgba


def remove_black_matte_unpremultiplied(image: Image.Image, cutoff: int = 3) -> Image.Image:
    """Convert black-composited glow art to straight alpha without dark fringes."""
    rgb = image.convert("RGB")
    output = Image.new("RGBA", rgb.size, (0, 0, 0, 0))
    source = rgb.load()
    target = output.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            red, green, blue = source[x, y]
            peak = max(red, green, blue)
            if peak <= cutoff:
                continue
            alpha = peak
            target[x, y] = (
                min(255, round(red * 255 / alpha)),
                min(255, round(green * 255 / alpha)),
                min(255, round(blue * 255 / alpha)),
                alpha,
            )
    return output


def trim_alpha(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    return image.crop(bbox) if bbox else image.crop((0, 0, 1, 1))


def fit_on_canvas(image: Image.Image, size: tuple[int, int], padding: int) -> Image.Image:
    trimmed = trim_alpha(image)
    available = (max(1, size[0] - padding * 2), max(1, size[1] - padding * 2))
    trimmed.thumbnail(available, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (size[0] - trimmed.width) // 2
    y = (size[1] - trimmed.height) // 2
    canvas.alpha_composite(trimmed, (x, y))
    return canvas


def save_png(image: Image.Image, relative_path: str) -> str:
    destination = GAME_ROOT / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, format="PNG", compress_level=9, optimize=False)
    return f"assets/game/{relative_path.replace(os_sep(), '/')}"


def os_sep() -> str:
    # Kept tiny so path serialization is explicit and platform independent.
    return str(Path("a") / "b")[1]


def relative_game_path(relative_path: str) -> str:
    return f"assets/game/{relative_path.replace(os_sep(), '/')}"


def add_recipe(
    recipes: list[dict], entry: dict, output: str, rect: tuple[int, int, int, int] | None,
    processing: list[str], consumer: str, pivot: tuple[float, float] = (0.5, 0.5), padding: int = 0,
) -> None:
    recipes.append({
        "output": relative_game_path(output),
        "source_id": entry["id"],
        "source_sha256": entry["sha256"],
        "source_rect": list(rect) if rect else [0, 0, entry["width"], entry["height"]],
        "processing": processing,
        "pivot": list(pivot),
        "padding_px": padding,
        "intended_consumer": consumer,
        "integration_status": "runtime_candidate_not_wired",
    })


def crop_white_asset(
    entry: dict, rect: tuple[int, int, int, int], size: tuple[int, int], padding: int,
    tolerance: int = 72, remove_sheet_number: bool = False,
) -> Image.Image:
    crop = open_source(entry).crop(rect)
    rgba = remove_border_matte(crop, tolerance=tolerance)
    if remove_sheet_number:
        # Sheet 23 has neutral-grey baked numbers in each tile's upper-left.
        # Remove only low-saturation pixels in this manually bounded label area,
        # leaving any saturated icon pixels that overlap the rectangle intact.
        pixels = rgba.load()
        for y in range(min(32, rgba.height)):
            for x in range(min(42, rgba.width)):
                red, green, blue, alpha = pixels[x, y]
                if alpha and max(red, green, blue) - min(red, green, blue) <= 70 and max(red, green, blue) < 250:
                    pixels[x, y] = (red, green, blue, 0)
    return fit_on_canvas(rgba, size, padding)


def crop_black_asset(
    entry: dict, rect: tuple[int, int, int, int], size: tuple[int, int], padding: int,
) -> Image.Image:
    crop = open_source(entry).crop(rect)
    return fit_on_canvas(remove_black_matte_unpremultiplied(crop), size, padding)


UI_CROPS = {
    "avatar": (1, (45, 135, 191, 296)),
    "coin": (7, (238, 360, 394, 513)),
    "diamond": (8, (439, 363, 589, 514)),
    "settings": (15, (835, 588, 981, 757)),
    "play": (17, (241, 828, 390, 978)),
    "pause": (16, (47, 830, 189, 978)),
    "trophy": (18, (451, 818, 573, 988)),
    "chest": (9, (635, 358, 789, 502)),
    "star": (12, (240, 600, 392, 750)),
    "shield": (11, (45, 588, 190, 754)),
    "medal": (19, (657, 814, 769, 991)),
}

PORTRAIT_SOURCES = {
    "soldier": (83, (45, 240, 360, 770)),
    "medic": (84, (0, 0, 1024, 1024)),
    "rocket": (85, (0, 0, 1024, 1024)),
    "shotgun": (86, (0, 0, 1024, 1024)),
    "rifle": (87, (0, 0, 1024, 1024)),
    "energy": (88, (0, 0, 1024, 1024)),
    "smg": (89, (0, 0, 1024, 1024)),
    "sniper": (90, (0, 0, 1024, 1024)),
}

WEAPON_CROPS = {
    "rifle": (18, 49, 245, 222),
    "smg": (274, 58, 494, 224),
    "shotgun": (525, 52, 748, 215),
    "sniper": (778, 52, 1010, 224),
    "mg": (13, 296, 247, 463),
    "rocket": (276, 296, 497, 476),
    "laser": (781, 307, 1009, 466),
    "plasma": (20, 554, 242, 744),
    "gatling": (527, 551, 752, 747),
    "railgun": (272, 555, 500, 742),
}

MAP_SOURCES = {"sunny": 68, "desert": 72, "city": 69, "forest": 70, "snow": 71}

EFFECT_SOURCES = {
    "muzzle": (7, (25, 35, 285, 225), (256, 128), 4),
    "hit": (11, (0, 0, 1024, 1024), (256, 256), 2),
    "explosion": (8, (0, 0, 1024, 1024), (256, 256), 2),
    "boss_explosion": (12, (0, 0, 1024, 1024), (256, 256), 2),
    "coins": (6, (0, 0, 1024, 1024), (256, 256), 2),
    "upgrade": (10, (0, 0, 1024, 1024), (256, 256), 2),
    "boss_entry": (13, (0, 0, 1024, 1024), (256, 256), 2),
    "trail": (9, (45, 35, 950, 115), (256, 64), 2),
}


def title_for(entry: dict) -> str:
    stem = Path(entry["original_name"]).stem
    stem = re.sub(r"_[0-9a-f]{8}$", "", stem, flags=re.IGNORECASE)
    return stem.replace("_", " ").replace("…", "").strip()


def reference_reason(entry: dict) -> str:
    reasons = {
        "marketing": "Composed promotional scene is unsuitable as a standalone runtime sprite.",
        "ui": "UI sheet or screen mockup retained for visual reference; dynamic labels stay code-native.",
        "enemies": "Design/reference art has no approved runtime animation or collision contract.",
        "environment": "Environment/reference art lacks a general runtime crop contract.",
        "weapons": "Weapon design sheet retained as reference unless a listed crop was derived.",
        "effects": "VFX reference retained unless a listed black-matte crop was derived.",
        "characters": "Character reference retained unless a listed portrait crop was derived.",
        "gameplay": "Gameplay design sheet retained as reference only.",
    }
    return reasons[entry["category"]]


def process_assets(manifest: dict) -> dict:
    canonical_entries = [entry for entry in manifest["entries"] if entry["duplicate_of"] is None]
    by_id = {entry["id"]: entry for entry in canonical_entries}
    optimized_total = 0
    catalog_total = 0
    catalog_items = []
    recipes: list[dict] = []

    for entry in canonical_entries:
        image = open_source(entry)
        optimized = resize_within(image, (768, 768))
        optimized_path = OPTIMIZED_ROOT / (Path(entry["target_name"]).stem + ".webp")
        optimized_path.parent.mkdir(parents=True, exist_ok=True)
        optimized.save(optimized_path, format="WEBP", quality=82, method=6)
        optimized_total += optimized_path.stat().st_size

        thumb = resize_within(image, (192, 192))
        stem = Path(entry["target_name"]).stem
        webp_relative = f"catalog/{stem}.webp"
        jpg_relative = f"catalog/{stem}.jpg"
        webp_path = GAME_ROOT / webp_relative
        jpg_path = GAME_ROOT / jpg_relative
        webp_path.parent.mkdir(parents=True, exist_ok=True)
        thumb.save(webp_path, format="WEBP", quality=72, method=6)
        thumb.save(jpg_path, format="JPEG", quality=72, optimize=False, progressive=False)
        catalog_total += webp_path.stat().st_size + jpg_path.stat().st_size
        catalog_items.append({
            "id": f"source-{entry['id']:02d}",
            "category": entry["category"],
            "title": title_for(entry),
            "path": relative_game_path(webp_relative),
            "fallbackPath": relative_game_path(jpg_relative),
            "role": "reference",
            "source_id": entry["id"],
        })
        entry["processing_status"] = "optimized_review_copy"
        entry["integration_status"] = "reference_only"
        entry["usage_refs"] = [relative_game_path(webp_relative), relative_game_path(jpg_relative)]
        entry["crop_refs"] = []

    for name, (source_slot, rect) in UI_CROPS.items():
        entry = by_id[23]
        relative = f"ui/{name}.png"
        save_png(crop_white_asset(entry, rect, (128, 128), 4, tolerance=68, remove_sheet_number=True), relative)
        add_recipe(recipes, entry, relative, rect, ["manual_crop", "border_connected_matte", "fit_128"],
                   f"UI icon: {name}", padding=4)

    atlas_columns = 4
    atlas_rows = (len(UI_CROPS) + atlas_columns - 1) // atlas_columns
    atlas_cell = 64
    atlas = Image.new("RGBA", (atlas_columns * atlas_cell, atlas_rows * atlas_cell), (0, 0, 0, 0))
    atlas_frames = {}
    for index, name in enumerate(UI_CROPS):
        x = (index % atlas_columns) * atlas_cell
        y = (index // atlas_columns) * atlas_cell
        icon = Image.open(GAME_ROOT / "ui" / f"{name}.png").convert("RGBA").resize(
            (atlas_cell, atlas_cell), Image.Resampling.LANCZOS
        )
        atlas.alpha_composite(icon, (x, y))
        atlas_frames[name] = {"x": x, "y": y, "w": atlas_cell, "h": atlas_cell, "pivot": [0.5, 0.5]}
    save_png(atlas, "ui/ui-atlas.png")
    write_text(GAME_ROOT / "ui" / "ui-atlas.json", json.dumps({
        "image": "assets/game/ui/ui-atlas.png",
        "width": atlas.width,
        "height": atlas.height,
        "cell": atlas_cell,
        "frames": atlas_frames,
    }, ensure_ascii=False, indent=2) + "\n")
    add_recipe(recipes, by_id[23], "ui/ui-atlas.png", None,
               ["pack_existing_ui_icons", "lanczos_64_cells", "png_rgba"],
               "CSS/canvas UI sprite atlas", padding=0)

    portrait_outputs = []
    for name, (source_id, rect) in PORTRAIT_SOURCES.items():
        entry = by_id[source_id]
        relative = f"characters/{name}_portrait.png"
        portrait = crop_white_asset(entry, rect, (256, 256), 5, tolerance=104)
        save_png(portrait, relative)
        portrait_outputs.append((name, portrait))
        add_recipe(recipes, entry, relative, rect,
                   ["manual_crop", "border_connected_white_matte", "fit_256"],
                   f"Character portrait: {name}", pivot=(0.5, 0.95), padding=5)

    weapon_entry = by_id[26]
    for name, rect in WEAPON_CROPS.items():
        relative = f"weapons/{name}.png"
        save_png(crop_white_asset(weapon_entry, rect, (256, 128), 5, tolerance=58), relative)
        add_recipe(recipes, weapon_entry, relative, rect,
                   ["manual_non_grid_crop", "border_connected_white_matte", "fit_256x128"],
                   f"Weapon presentation icon: {name}", pivot=(0.5, 0.5), padding=5)

    for name, source_id in MAP_SOURCES.items():
        entry = by_id[source_id]
        preview = resize_within(open_source(entry), (320, 320))
        webp_relative = f"maps/{name}.webp"
        jpg_relative = f"maps/{name}.jpg"
        webp_path = GAME_ROOT / webp_relative
        jpg_path = GAME_ROOT / jpg_relative
        webp_path.parent.mkdir(parents=True, exist_ok=True)
        preview.save(webp_path, format="WEBP", quality=78, method=6)
        preview.save(jpg_path, format="JPEG", quality=78, optimize=False, progressive=False)
        add_recipe(recipes, entry, webp_relative, None, ["exif_transpose", "resize_max_320", "webp_q78"],
                   f"Map preview: {name}")
        add_recipe(recipes, entry, jpg_relative, None, ["exif_transpose", "resize_max_320", "jpeg_q78"],
                   f"Map preview fallback: {name}")

    for name, (source_id, rect, size, padding) in EFFECT_SOURCES.items():
        entry = by_id[source_id]
        relative = f"effects/{name}.png"
        save_png(crop_black_asset(entry, rect, size, padding), relative)
        add_recipe(recipes, entry, relative, rect,
                   ["manual_crop", "black_matte_to_straight_alpha", f"fit_{size[0]}x{size[1]}"],
                   f"Canvas VFX candidate: {name}", pivot=(0.5, 0.5), padding=padding)

    grass_entry = by_id[75]
    grass_source_rect = (448, 420, 512, 484)
    grass_patch = open_source(grass_entry).crop(grass_source_rect).resize((64, 64), Image.Resampling.LANCZOS)
    grass = Image.new("RGB", (128, 128))
    grass.paste(grass_patch, (0, 0))
    grass.paste(ImageOps.mirror(grass_patch), (64, 0))
    grass.paste(ImageOps.flip(grass_patch), (0, 64))
    grass.paste(ImageOps.flip(ImageOps.mirror(grass_patch)), (64, 64))
    save_png(grass, "terrain/grass.png")
    add_recipe(recipes, grass_entry, "terrain/grass.png", grass_source_rect,
               ["manual_top_face_sample", "mirror_symmetrized_seam", "png_128"],
               "Repeatable grass texture", padding=0)

    runtime_by_source: dict[int, list[dict]] = defaultdict(list)
    for recipe in recipes:
        runtime_by_source[recipe["source_id"]].append(recipe)
    dispositions = []
    for entry in canonical_entries:
        outputs = runtime_by_source.get(entry["id"], [])
        if outputs:
            entry["processing_status"] = "runtime_derivative_and_review_copy"
            entry["integration_status"] = "runtime_candidate_not_wired"
            entry["usage_refs"].extend(recipe["output"] for recipe in outputs)
            entry["crop_refs"] = [recipe["source_rect"] for recipe in outputs]
            disposition = "runtime_candidate_and_reference"
            reason = "One or more deterministic derivatives exist; consumer wiring is tracked separately."
        else:
            disposition = "reference_only"
            reason = reference_reason(entry)
        dispositions.append({
            "source_id": entry["id"],
            "sha256": entry["sha256"],
            "disposition": disposition,
            "reason": reason,
            "outputs": [recipe["output"] for recipe in outputs],
            "integration_status": entry["integration_status"],
        })

    # Mirror canonical processing metadata to duplicate manifest rows without creating extra files.
    for entry in manifest["entries"]:
        if entry["duplicate_of"] is not None:
            canonical = next(row for row in manifest["entries"] if row["id"] == entry["duplicate_of"])
            entry["processing_status"] = "duplicate_of_processed_source"
            entry["integration_status"] = "deduplicated"
            entry["usage_refs"] = canonical["usage_refs"]
            entry["crop_refs"] = canonical["crop_refs"]

    write_text(GAME_ROOT / "catalog.json", json.dumps(catalog_items, ensure_ascii=False, indent=2) + "\n")
    write_text(GAME_ROOT / "catalog.js", "var ArtAssetCatalog = " +
               json.dumps(catalog_items, ensure_ascii=False, indent=2) + ";\n")
    write_text(GAME_ROOT / "asset-recipes.json", json.dumps({"schema_version": 1, "recipes": recipes},
               ensure_ascii=False, indent=2) + "\n")
    write_text(GAME_ROOT / "dispositions.json", json.dumps({"schema_version": 1, "entries": dispositions},
               ensure_ascii=False, indent=2) + "\n")
    write_portrait_checker(portrait_outputs)

    write_text(MANIFEST_PATH, json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    write_manifest_csv(manifest["entries"])
    source_total = sum(entry["bytes"] for entry in canonical_entries)
    runtime_total = sum(
        path.stat().st_size for path in GAME_ROOT.rglob("*")
        if path.is_file() and "models" not in path.relative_to(GAME_ROOT).parts
    )
    write_processing_report(manifest, source_total, optimized_total, runtime_total, catalog_total, recipes)
    return {
        "optimized_count": len(canonical_entries),
        "catalog_count": len(catalog_items),
        "recipe_count": len(recipes),
        "source_bytes": source_total,
        "optimized_bytes": optimized_total,
        "runtime_bytes": runtime_total,
    }


def write_portrait_checker(portraits: list[tuple[str, Image.Image]]) -> None:
    cell = 288
    sheet = Image.new("RGB", (cell * 4, cell * 2), "white")
    draw = ImageDraw.Draw(sheet)
    for index, (name, portrait) in enumerate(portraits):
        x0 = (index % 4) * cell
        y0 = (index // 4) * cell
        tile = Image.new("RGB", (256, 256), "white")
        checker = Image.new("RGB", (256, 256), "white")
        checker_draw = ImageDraw.Draw(checker)
        for y in range(0, 256, 16):
            for x in range(0, 256, 16):
                if (x // 16 + y // 16) % 2:
                    checker_draw.rectangle((x, y, x + 15, y + 15), fill=(54, 62, 74))
                else:
                    checker_draw.rectangle((x, y, x + 15, y + 15), fill=(218, 223, 230))
        checker.paste(portrait, (0, 0), portrait)
        sheet.paste(checker, (x0 + 16, y0 + 8))
        draw.text((x0 + 16, y0 + 266), name, fill=(10, 10, 10))
    QA_ROOT.mkdir(parents=True, exist_ok=True)
    sheet.save(QA_ROOT / "portraits-checker.png", format="PNG", compress_level=9)


def write_processing_report(
    manifest: dict, source_total: int, optimized_total: int, runtime_total: int,
    catalog_total: int, recipes: list[dict],
) -> None:
    def mib(value: int) -> str:
        return f"{value / 1024 / 1024:.2f} MiB"

    write_text(ROOT / "docs" / "art-assets" / "ASSET_PROCESSING.md", f"""# Art asset processing

## Provenance and safety

- Source: user-provided ZIP archive. Its license and redistribution terms were not externally verified.
- Audit validates 90 flat JPEG entries and rejects directories, traversal, absolute paths, drive paths,
  symlinks, and non-JPEG entries.
- The 86 unique originals are preserved byte-for-byte in `assets/art-source/original/` and are never
  overwritten if existing bytes differ. Exact SHA-256 equality is the only deduplication rule.
- EXIF orientation normalization is applied only to derivatives.

## Deterministic outputs

- 86 WebP review copies (`<=768 px`, quality 82) in `assets/art-source/optimized/`.
- 86 WebP plus 86 JPEG gallery thumbnails (`<=192 px`, quality 72) in `assets/game/catalog/`.
- Manually bounded UI, portrait, weapon, VFX, map, and terrain derivatives described in
  `assets/game/asset-recipes.json` ({len(recipes)} output recipes).
- `assets/game/dispositions.json` records a reasoned runtime-candidate or reference-only disposition
  for all 86 unique sources. `runtime_candidate_not_wired` is deliberately distinct from integrated.
- Portrait alpha edges are shown over a high-contrast checker in
  `assets/art-source/qa/portraits-checker.png`.

## Compression totals

| Set | Bytes | Size |
| --- | ---: | ---: |
| Unique preserved JPEG sources | {source_total} | {mib(source_total)} |
| Optimized WebP review copies | {optimized_total} | {mib(optimized_total)} |
| Runtime tree (including reference thumbnails and metadata) | {runtime_total} | {mib(runtime_total)} |
| Gallery thumbnails inside runtime tree | {catalog_total} | {mib(catalog_total)} |

Review-copy reduction versus the unique sources: `{(1 - optimized_total / source_total) * 100:.1f}%`.
Review copies and gallery thumbnails are reference assets, not combat sprites.

## Reproduce

```powershell
python tools/import-art-assets.py --audit-only
node tests/unit/art-source-audit.js
python tools/import-art-assets.py --process
node tests/unit/art-source-audit.js
```

The importer may overwrite derived files deterministically, but it refuses to overwrite a preserved
original whose bytes differ from the audited archive.
""")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--audit-only", action="store_true")
    mode.add_argument("--process", action="store_true")
    parser.add_argument("--archive", type=Path, default=DEFAULT_ARCHIVE)
    parser.add_argument("--inventory", type=Path, default=DEFAULT_INVENTORY)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = audit_archive(args.archive.resolve(), args.inventory.resolve())
    if args.process:
        stats = process_assets(manifest)
        print(
            f"PROCESS OK: {stats['optimized_count']} optimized, {stats['catalog_count']} catalog, "
            f"{stats['recipe_count']} runtime recipes; optimized={stats['optimized_bytes']} bytes, "
            f"runtime={stats['runtime_bytes']} bytes"
        )
        return 0
    print(
        f"AUDIT OK: {manifest['archive']['entry_count']} entries, "
        f"{manifest['archive']['unique_asset_count']} unique originals, "
        f"{manifest['archive']['duplicate_entry_count']} exact duplicates"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (FileNotFoundError, FileExistsError, ValueError, zipfile.BadZipFile) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(2)
