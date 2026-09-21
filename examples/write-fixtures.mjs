// Purpose: Write fictional CLI input documents without overwriting any existing file.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { products, proposed } from './fixtures.mjs';
const destination = resolve(process.argv[2] ?? 'local-data');
await mkdir(destination, { recursive: true });
const fixtures = { 'products.json': products, 'proposal.json': proposed, 'review.json': { actor: 'demo-reviewer', note: 'Synthetic product specifications checked.' }, 'options.json': { useCase: 'office-printing', quantity: 2, requiredAttributes: { format: 'A4' } } };
for (const [name, value] of Object.entries(fixtures)) await writeFile(resolve(destination, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(`Fictional fixtures written to ${destination}`);
