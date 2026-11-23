# Art asset processing

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
