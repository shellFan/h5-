# User-provided art source

This directory is the provenance-preserving import of the user-provided
`《膨胀小队》H5全套美术资产库.zip` archive.

- `manifest.json` and `manifest.csv` inventory all 90 archive entries.
- `original/` contains the 86 unique JPEG byte streams without decoding or rewriting.
- Exact duplicates are represented by `duplicate_of` and `merged_names` in the manifest.
- The archive license and redistribution terms were not externally verified.
- Later review derivatives belong in `optimized/`; runtime derivatives belong in
  `assets/game/`, not in `original/`.

Reproduce the audit with:

```powershell
python tools/import-art-assets.py --audit-only
node tests/unit/art-source-audit.js
```
