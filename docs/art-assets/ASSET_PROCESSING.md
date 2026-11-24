# Art asset processing

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
  `assets/game/asset-recipes.json` (49 output recipes).
- `assets/game/dispositions.json` records a reasoned runtime-candidate or reference-only disposition
  for all 86 unique sources. `runtime_candidate_not_wired` is deliberately distinct from integrated.
- Portrait alpha edges are shown over a high-contrast checker in
  `assets/art-source/qa/portraits-checker.png`.

## Compression totals

| Set | Bytes | Size |
| --- | ---: | ---: |
| Unique preserved JPEG sources | 59418362 | 56.67 MiB |
| Optimized WebP review copies | 5345978 | 5.10 MiB |
| Runtime tree (including reference thumbnails and metadata) | 3395626 | 3.24 MiB |
| Gallery thumbnails inside runtime tree | 1169278 | 1.12 MiB |

Review-copy reduction versus the unique sources: `91.0%`.
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
