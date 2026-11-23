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
import os
import re
import stat
import sys
import unicodedata
import zipfile
from collections import defaultdict
from pathlib import Path, PurePosixPath

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARCHIVE = ROOT / "《膨胀小队》H5全套美术资产库.zip"
DEFAULT_INVENTORY = Path.home() / ".codex" / "tmp" / "h5-art-audit" / "inventory.json"
SOURCE_ROOT = ROOT / "assets" / "art-source"
MANIFEST_PATH = SOURCE_ROOT / "manifest.json"
CSV_PATH = SOURCE_ROOT / "manifest.csv"
ORIGINALS_ROOT = SOURCE_ROOT / "original"


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
        raise NotImplementedError("processing stage is added after audit review")
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
