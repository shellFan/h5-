"""Build runtime combat-model variants without altering model structure.

Only the embedded base-colour PNG is replaced. Mesh/accessor bytes, rigid-part
nodes, materials, ORM maps and procedural-animation contracts remain untouched.
The source assets under assets/models are immutable inputs.
"""
from __future__ import annotations

import colorsys
import hashlib
import json
from pathlib import Path
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "models"
OUTPUT = ROOT / "assets" / "game" / "models"
KEYS = ["soldier", "normal", "fast", "shield", "split", "spitter", "elite", "bomber",
        "bruiser", "bulwark", "spitking", "hivelord", "titan", "overlord"]
BOSSES = {"bruiser", "bulwark", "spitking", "hivelord", "titan", "overlord"}

# Cell indices match the authored 4x4 PBR atlases. Unlisted cells (face detail,
# leather, ivory, ink, teeth, soles) retain their exact source appearance.
PALETTES = {
    "soldier": {0: "#456b2f", 1: "#21391f", 2: "#567d35", 3: "#364b27",
                8: "#405b2e", 9: "#61743a", 10: "#2f3d27", 15: "#b7cf68"},
    "normal": {0: "#8c55c7", 1: "#4f276f", 2: "#f2a340"},
    "fast": {0: "#ed6658", 1: "#5e2433", 2: "#ffd05a"},
    "shield": {0: "#4ea6d8", 1: "#315d85", 2: "#ffe16a", 4: "#42687f"},
    "split": {0: "#bc62dd", 1: "#67257d", 2: "#ff82df", 12: "#6c247f"},
    "spitter": {0: "#94cf3d", 1: "#416b28", 2: "#d9ff54", 11: "#a8ff25"},
    "elite": {0: "#ee5b42", 1: "#78283a", 2: "#ffc04c", 4: "#5b3638"},
    "bomber": {0: "#f28535", 1: "#753522", 2: "#ffe23f", 11: "#ff9a22"},
    "bruiser": {0: "#505960", 1: "#394149", 2: "#ff8841", 4: "#59646c", 5: "#a7b0b4"},
    "bulwark": {0: "#425d68", 1: "#293c48", 2: "#ffd24a", 4: "#526b75", 5: "#b9c3c7"},
    "spitking": {0: "#53646c", 1: "#28373e", 2: "#a7f044", 4: "#66767c", 5: "#b7c0bd", 11: "#b8ff42"},
    "hivelord": {0: "#4a4d65", 1: "#292b3f", 2: "#d85cff", 4: "#5c6273", 5: "#acb3c4", 11: "#ef65ff"},
    "titan": {0: "#4e5960", 1: "#313a3f", 2: "#ff713d", 4: "#66747a", 5: "#c2c8c8"},
    "overlord": {0: "#3e5860", 1: "#25353b", 2: "#37e5d1", 4: "#536a72", 5: "#b8c9c8", 11: "#43ffe0"},
}


def source_paths(key: str) -> list[Path]:
    if key == "soldier":
        folder = SOURCE / "soldier"
    else:
        folder = SOURCE / ("bosses" if key in BOSSES else "zombies") / key
    return [folder / f"{key}.glb", folder / f"{key}-lod.glb"]


def parse_glb(data: bytes) -> tuple[dict, bytes]:
    if data[:4] != b"glTF" or struct.unpack_from("<I", data, 4)[0] != 2:
        raise ValueError("expected GLB 2")
    json_len = struct.unpack_from("<I", data, 12)[0]
    if data[16:20] != b"JSON":
        raise ValueError("missing JSON chunk")
    document = json.loads(data[20:20 + json_len].decode("utf-8"))
    bin_header = 20 + json_len
    if data[bin_header + 4:bin_header + 8] != b"BIN\0":
        raise ValueError("missing BIN chunk")
    bin_len = struct.unpack_from("<I", data, bin_header)[0]
    return document, data[bin_header + 8:bin_header + 8 + bin_len]


def png_for_image(document: dict, binary: bytes, image_index: int) -> bytes:
    view = document["bufferViews"][document["images"][image_index]["bufferView"]]
    start = view.get("byteOffset", 0)
    return binary[start:start + view["byteLength"]]


def _paeth(a: int, b: int, c: int) -> int:
    value = a + b - c
    da, db, dc = abs(value - a), abs(value - b), abs(value - c)
    return a if da <= db and da <= dc else (b if db <= dc else c)


def decode_png(source: bytes) -> tuple[int, int, bytearray]:
    if source[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("embedded base colour is not PNG")
    offset, idat = 8, bytearray()
    width = height = None
    while offset < len(source):
        size = struct.unpack_from(">I", source, offset)[0]
        kind = source[offset + 4:offset + 8]
        payload = source[offset + 8:offset + 8 + size]
        offset += 12 + size
        if kind == b"IHDR":
            width, height, depth, color, compression, filtering, interlace = struct.unpack(">IIBBBBB", payload)
            if (depth, color, compression, filtering, interlace) != (8, 6, 0, 0, 0):
                raise ValueError("expected non-interlaced 8-bit RGBA PNG")
        elif kind == b"IDAT":
            idat.extend(payload)
        elif kind == b"IEND":
            break
    raw = zlib.decompress(idat)
    stride, bpp = width * 4, 4
    pixels = bytearray(width * height * 4)
    previous = bytearray(stride)
    position = 0
    for y in range(height):
        filter_type = raw[position]
        position += 1
        encoded = raw[position:position + stride]
        position += stride
        row = bytearray(stride)
        for x, value in enumerate(encoded):
            left = row[x - bpp] if x >= bpp else 0
            above = previous[x]
            upper_left = previous[x - bpp] if x >= bpp else 0
            predictor = (0 if filter_type == 0 else left if filter_type == 1 else above if filter_type == 2
                         else (left + above) // 2 if filter_type == 3 else _paeth(left, above, upper_left))
            row[x] = (value + predictor) & 255
        pixels[y * stride:(y + 1) * stride] = row
        previous = row
    return width, height, pixels


def _chunk(kind: bytes, payload: bytes) -> bytes:
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload) & 0xffffffff)


def encode_png(width: int, height: int, pixels: bytearray) -> bytes:
    stride, bpp = width * 4, 4
    filtered = bytearray()
    previous = bytearray(stride)
    for y in range(height):
        row = pixels[y * stride:(y + 1) * stride]
        candidates = []
        for filter_type in range(5):
            encoded = bytearray(stride)
            for x, value in enumerate(row):
                left = row[x - bpp] if x >= bpp else 0
                above = previous[x]
                upper_left = previous[x - bpp] if x >= bpp else 0
                predictor = (0 if filter_type == 0 else left if filter_type == 1 else above if filter_type == 2
                             else (left + above) // 2 if filter_type == 3 else _paeth(left, above, upper_left))
                encoded[x] = (value - predictor) & 255
            score = sum(min(value, 256 - value) for value in encoded)
            candidates.append((score, filter_type, encoded))
        _, filter_type, encoded = min(candidates, key=lambda item: item[0])
        filtered.append(filter_type)
        filtered.extend(encoded)
        previous = row
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", zlib.compress(filtered, 9)) + _chunk(b"IEND", b"")


def recolor_atlas(source_png: bytes, remap: dict[int, str]) -> bytes:
    width, height, pixels = decode_png(source_png)
    if width != height or width % 4:
        raise ValueError(f"expected square 4x4 atlas, got {image.size}")
    cell_w, cell_h = width // 4, height // 4
    for authored_cell, target_hex in remap.items():
        # Blender image pixels and PNG scanlines have opposite row origins.
        # The authored UV palette index remains the public manifest value.
        cell = (3 - authored_cell // 4) * 4 + authored_cell % 4
        cx, cy = cell % 4, cell // 4
        target = tuple(int(target_hex[i:i + 2], 16) / 255 for i in (1, 3, 5))
        target_h, target_s, target_v = colorsys.rgb_to_hsv(*target)
        x0, y0 = cx * cell_w, cy * cell_h
        values = []
        for y in range(y0, y0 + cell_h):
            for x in range(x0, x0 + cell_w):
                offset = (y * width + x) * 4
                values.append(colorsys.rgb_to_hsv(*(pixels[offset + channel] / 255 for channel in range(3)))[2])
        mean_v = max(sum(values) / len(values), .001)
        for y in range(y0, y0 + cell_h):
            for x in range(x0, x0 + cell_w):
                offset = (y * width + x) * 4
                old = pixels[offset:offset + 4]
                old_v = colorsys.rgb_to_hsv(*(channel / 255 for channel in old[:3]))[2]
                # Hue/saturation move to the new art direction while broad baked
                # shading and authored cell variation remain visible.
                new_v = max(0, min(1, target_v * old_v / mean_v))
                rgb = colorsys.hsv_to_rgb(target_h, target_s, new_v)
                pixels[offset:offset + 3] = bytes(round(channel * 255) for channel in rgb)
    return encode_png(width, height, pixels)


def rebuild_glb(document: dict, binary: bytes, image_index: int, replacement: bytes) -> bytes:
    base_view_index = document["images"][image_index]["bufferView"]
    base_view = document["bufferViews"][base_view_index]
    start = base_view.get("byteOffset", 0)
    end = start + base_view["byteLength"]
    padded = replacement + b"\0" * ((4 - len(replacement) % 4) % 4)
    delta = len(padded) - (end - start)
    updated_bin = binary[:start] + padded + binary[end:]
    base_view["byteLength"] = len(replacement)
    for index, view in enumerate(document["bufferViews"]):
        if index != base_view_index and view.get("byteOffset", 0) >= end:
            view["byteOffset"] = view.get("byteOffset", 0) + delta
    document["buffers"][0]["byteLength"] = len(updated_bin)
    json_bytes = json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
    total = 12 + 8 + len(json_bytes) + 8 + len(updated_bin)
    return (b"glTF" + struct.pack("<II", 2, total) + struct.pack("<I4s", len(json_bytes), b"JSON") +
            json_bytes + struct.pack("<I4s", len(updated_bin), b"BIN\0") + updated_bin)


def build_one(source: Path, target: Path, remap: dict[int, str]) -> dict:
    source_bytes = source.read_bytes()
    document, binary = parse_glb(source_bytes)
    base_texture = document["materials"][0]["pbrMetallicRoughness"]["baseColorTexture"]["index"]
    image_index = document["textures"][base_texture]["source"]
    replacement = recolor_atlas(png_for_image(document, binary, image_index), remap)
    target.parent.mkdir(parents=True, exist_ok=True)
    target_bytes = rebuild_glb(document, binary, image_index, replacement)
    if len(target_bytes) > len(source_bytes):
        raise ValueError(f"{target}: variant exceeds source byte budget")
    target.write_bytes(target_bytes)
    return {
        "source": source.relative_to(ROOT).as_posix(),
        "target": target.relative_to(ROOT).as_posix(),
        "sourceSha256": hashlib.sha256(source_bytes).hexdigest(),
        "variantSha256": hashlib.sha256(target_bytes).hexdigest(),
        "sourceBytes": len(source_bytes),
        "variantBytes": len(target_bytes),
    }


def main() -> None:
    models = []
    totals = {"sourceBytes": 0, "variantBytes": 0}
    for key in KEYS:
        records = []
        for source in source_paths(key):
            relative = source.relative_to(SOURCE)
            record = build_one(source, OUTPUT / relative, PALETTES[key])
            records.append(record)
            totals["sourceBytes"] += record["sourceBytes"]
            totals["variantBytes"] += record["variantBytes"]
        models.append({"key": key, "remappedCells": sorted(PALETTES[key]), "files": records})
    manifest = {
        "version": 1,
        "policy": "basecolor-atlas-only",
        "keys": KEYS,
        "models": models,
        "totals": totals,
    }
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "presentation.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Built {sum(len(item['files']) for item in models)} GLBs: "
          f"{totals['variantBytes'] / 1048576:.2f} MiB / {totals['sourceBytes'] / 1048576:.2f} MiB source")


if __name__ == "__main__":
    main()
