// Asset-source contract: every archive entry is inventoried and every unique
// original is preserved byte-for-byte. Run after --audit-only or --process.
const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SOURCE_ROOT = path.join(ROOT, 'assets', 'art-source');
const manifestPath = path.join(SOURCE_ROOT, 'manifest.json');

assert(fs.existsSync(manifestPath), 'run tools/import-art-assets.py --audit-only first');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.equal(manifest.schema_version, 1);
assert.equal(manifest.archive.entry_count, 90);
assert.equal(manifest.archive.unique_asset_count, 86);
assert.equal(manifest.entries.length, 90);

const ids = new Set();
const uniqueTargets = new Set();
let duplicateCount = 0;
for (const entry of manifest.entries) {
  assert(!ids.has(entry.id), `duplicate id ${entry.id}`);
  ids.add(entry.id);
  assert(Number.isInteger(entry.width) && entry.width > 0, `bad width for ${entry.id}`);
  assert(Number.isInteger(entry.height) && entry.height > 0, `bad height for ${entry.id}`);
  assert.equal(entry.format, 'JPEG', `unexpected format for ${entry.id}`);
  assert.match(entry.sha256, /^[0-9a-f]{64}$/);
  assert(entry.original_name && entry.target_name && entry.category);

  if (entry.duplicate_of !== null) {
    duplicateCount++;
    const canonical = manifest.entries.find(candidate => candidate.id === entry.duplicate_of);
    assert(canonical, `missing canonical entry ${entry.duplicate_of}`);
    assert.equal(entry.sha256, canonical.sha256, `duplicate hash mismatch for ${entry.id}`);
    assert.equal(entry.target_name, canonical.target_name, `duplicate target mismatch for ${entry.id}`);
    continue;
  }

  assert(!uniqueTargets.has(entry.target_name), `duplicate target ${entry.target_name}`);
  uniqueTargets.add(entry.target_name);
  const originalPath = path.join(SOURCE_ROOT, 'original', entry.target_name);
  assert(fs.existsSync(originalPath), `missing original ${entry.target_name}`);
  const bytes = fs.readFileSync(originalPath);
  assert.equal(bytes.length, entry.bytes, `byte count mismatch for ${entry.id}`);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256,
    `original bytes changed for ${entry.id}`);
}

assert.equal(ids.size, 90);
assert.equal(uniqueTargets.size, 86);
assert.equal(duplicateCount, 4);
assert.deepEqual(
  manifest.entries.filter(entry => entry.duplicate_of !== null).map(entry => entry.id),
  [52, 53, 54, 58]
);
console.log('PASS art source audit: 90 entries, 86 originals, 4 exact duplicates');
