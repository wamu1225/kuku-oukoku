// Validate that data files are consistent before build.
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src');
const errors = [];

function read(rel) {
  return fs.readFileSync(path.join(SRC, rel), 'utf-8');
}

// 1. KUKU_READINGS must contain 81 entries (1x1 .. 9x9)
const readings = read('data/kukuReadings.ts');
const readingKeys = [...readings.matchAll(/'(\d)x(\d)'/g)];
const uniqueReadings = new Set(readingKeys.map((m) => m[0]));
if (uniqueReadings.size !== 81) {
  errors.push(`KUKU_READINGS expects 81 entries, found ${uniqueReadings.size}`);
}

// 2. COMPANIONS must have levels 1..20
const companions = read('data/companions.ts');
for (let lv = 1; lv <= 20; lv++) {
  if (!companions.includes(`level: ${lv},`)) {
    errors.push(`COMPANIONS missing level ${lv}`);
  }
}

// 3. DAN_LEVELS rank 1..23 must exist
const danFile = read('data/danLevels.ts');
const ranks = new Set();
// Capture both standardLevel(rank, ...) helper calls and inline { rank: N }
for (const m of danFile.matchAll(/standardLevel\((\d+),/g)) ranks.add(parseInt(m[1]));
for (const m of danFile.matchAll(/rank:\s*(\d+)/g)) ranks.add(parseInt(m[1]));
for (let r = 1; r <= 23; r++) {
  if (!ranks.has(r)) errors.push(`DAN_LEVELS missing rank ${r}`);
}

// 4. COLLECTION_ITEMS unique ids
const coll = read('data/collectionData.ts');
const ids = [...coll.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
const dupe = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupe.length) errors.push(`COLLECTION_ITEMS duplicate ids: ${[...new Set(dupe)].join(', ')}`);

if (errors.length) {
  console.error('Validation failed:');
  errors.forEach((e) => console.error('  -', e));
  process.exit(1);
}
console.log(`✓ Data validation passed (readings ${uniqueReadings.size}, dan ${ranks.size}, items ${ids.length})`);
