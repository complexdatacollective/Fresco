/**
 * Generates mock roster JSON files for Storybook NameGeneratorRoster stories.
 * Run: node scripts/generate-roster-data.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { faker } from '@faker-js/faker';

const SEED = 42;

function generateNodes(count) {
  faker.seed(SEED);

  const nodes = [];

  for (let i = 0; i < count; i++) {
    nodes.push({
      name: faker.person.fullName(),
      age: faker.number.int({ min: 18, max: 80 }),
      location: faker.location.city(),
    });
  }

  return nodes;
}

const sizes = [50, 100, 1000, 5000, 50000];
const outDir = join(import.meta.dirname, '..', 'public', 'storybook');

mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const data = { nodes: generateNodes(size) };
  const path = join(outDir, `roster-${size}.json`);
  writeFileSync(path, JSON.stringify(data));
  const kb = (Buffer.byteLength(JSON.stringify(data)) / 1024).toFixed(0);
  // eslint-disable-next-line no-console
  console.log(`wrote ${path} (${size} nodes, ${kb} KB)`);
}
