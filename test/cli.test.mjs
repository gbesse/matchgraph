// Purpose: Exercise the installed-style CLI workflow, invalid commands and non-overwriting output files.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const bin = join(root, 'bin/matchgraph.mjs');
const env = { ...process.env, MANDATE_SIGNING_KEY: 'fictional-cli-test-secret-at-least-32-bytes' };
delete env.TYPESAFE_API_KEY;
function run(...args) { return execFileSync(process.execPath, [bin, ...args], { cwd: root, env, timeout: 10_000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
function fixtures(t) {
  const dir = mkdtempSync(join(tmpdir(), 'matchgraph-cli-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  execFileSync(process.execPath, [join(root, 'examples/write-fixtures.mjs'), dir], { env, timeout: 10_000, stdio: 'pipe' });
  return name => join(dir, name);
}
const read = path => JSON.parse(readFileSync(path, 'utf8'));
test('help works and unknown commands fail visibly', () => {
  assert.match(run('--help'), /matchgraph/);
  assert.throws(() => run('unknown'), error => error.status === 1 && error.stderr.includes('Invalid'));
});
test('CLI keeps proposals unavailable until review and calculates replacement quantities', t => {
  const f = fixtures(t);
  run('init', f('products.json'), f('graph0.json'));
  run('propose', f('graph0.json'), f('proposal.json'), f('graph1.json'));
  assert.deepEqual(JSON.parse(run('alternatives', f('graph1.json'), 'paper-a', f('options.json'))), []);
  const id = read(f('graph1.json')).relationships[0].id;
  run('approve', f('graph1.json'), id, f('review.json'), f('graph2.json'));
  const alternatives = JSON.parse(run('alternatives', f('graph2.json'), 'paper-a', f('options.json')));
  assert.equal(alternatives[0].targetPacks, 4);
  assert.throws(() => run('init', f('products.json'), f('graph0.json')), error => error.stderr.includes('EEXIST'));
});
