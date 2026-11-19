import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const additions = JSON.parse(await readFile(new URL('../data/new-aircraft.json', import.meta.url), 'utf8'));
const base = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null;
assert.ok(base, 'REPLIT_DEV_DOMAIN must be set to verify the running preview');
assert.equal(additions.length, 5);
assert.equal(new Set(additions.map(a => a.slug)).size, 5);

for (const expected of additions) {
  const response = await fetch(`${base}/api/aircraft/${expected.slug}`);
  assert.equal(response.status, 200, expected.slug);
  const body = await response.json();
  const actual = body.aircraft;
  assert.equal(actual.name, expected.name);
  for (const field of ['topSpeedKmh', 'serviceCeilingFt', 'maxRangeNm']) {
    assert.equal(actual[field], expected[field], `${expected.slug}: ${field}`);
  }
  const image = await fetch(`${base}${expected.images[0].url}`);
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type'), /^image\//);
  const detail = await fetch(`${base}/fleet/${expected.slug}`);
  assert.equal(detail.status, 200);
  console.log(`Verified ${expected.name}: API, specifications, image, detail route`);
}

for (const sort of ['speed_desc', 'range_desc', 'ceiling_desc']) {
  const response = await fetch(`${base}/api/aircraft?sort=${sort}&pageSize=100`);
  assert.equal(response.status, 200);
  const { data } = await response.json();
  const key = { speed_desc: 'topSpeedKmh', range_desc: 'maxRangeNm', ceiling_desc: 'serviceCeilingFt' }[sort];
  let unknownSeen = false;
  for (const aircraft of data) {
    if (aircraft[key] == null) unknownSeen = true;
    else assert.equal(unknownSeen, false, `${sort}: known values must precede unknowns`);
  }
  assert.equal(data.filter(a => additions.some(n => n.slug === a.slug)).length, 5);
}
console.log('All five aircraft appear in fleet; unknown values sort last.');
