// Purpose: Test evidence review, direct-only graph traversal, scope, expiry and integer quantity conversion.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGraph, propose, approve, revoke, alternatives, replaceProduct, candidatePairs } from '../src/index.mjs';
import { classifyPair } from '../src/jev.mjs';
import { products, proposed } from '../examples/fixtures.mjs';
const review = { actor: 'reviewer', note: 'Verified synthetic specifications.' };
const ready = () => { const graph = propose(createGraph(products), proposed); return approve(graph, graph.relationships[0].id, review); };
test('unreviewed candidates cannot become verified alternatives', () => {
  const graph = propose(createGraph(products), proposed);
  assert.equal(alternatives(graph, 'paper-a', { useCase: 'office-printing' }).length, 0);
  assert.ok(candidatePairs(graph, 'paper-a').every(p => p.reviewRequired));
});
test('confirmed substitutions convert integer pack counts explicitly', () => {
  const result = alternatives(ready(), 'paper-a', { useCase: 'office-printing', quantity: 2 });
  assert.equal(result[0].targetPacks, 4); assert.equal(result[0].excessBaseUnits, 0);
});
test('substitution is directional and scoped to the approved use case', () => {
  assert.equal(alternatives(ready(), 'paper-b', { useCase: 'office-printing' }).length, 0);
  assert.equal(alternatives(ready(), 'paper-a', { useCase: 'food-packaging' }).length, 0);
});
test('required attributes are exact, including absent values', () => {
  assert.equal(alternatives(ready(), 'paper-a', { useCase: 'office-printing', requiredAttributes: { format: 'A3' } }).length, 0);
  assert.equal(alternatives(ready(), 'paper-a', { useCase: 'office-printing', requiredAttributes: { certified: true } }).length, 0);
});
test('identical relationships require matching specifications and packaging', () => {
  const graph = propose(createGraph(products), { ...proposed, relation: 'identical' });
  assert.throws(() => approve(graph, graph.relationships[0].id, review), /matching pack/);
  const same = structuredClone(products); same[1].packSize = 500;
  let g = propose(createGraph(same), { ...proposed, relation: 'identical' }); g = approve(g, g.relationships[0].id, review);
  assert.equal(alternatives(g, 'paper-b', { useCase: 'office-printing' })[0].product.id, 'paper-a');
});
test('graph does not infer transitive compatibility', () => {
  let graph = ready(); graph = propose(graph, { ...proposed, from: 'paper-b', to: 'paper-c' }); graph = approve(graph, graph.relationships.at(-1).id, review);
  assert.deepEqual(alternatives(graph, 'paper-a', { useCase: 'office-printing' }).map(r => r.product.id), ['paper-b']);
});
test('a reviewed incompatibility takes precedence over a positive edge', () => {
  let graph = propose(ready(), { ...proposed, relation: 'incompatible', from: 'paper-b', to: 'paper-a' }); graph = approve(graph, graph.relationships.at(-1).id, review);
  assert.equal(alternatives(graph, 'paper-a', { useCase: 'office-printing' }).length, 0);
});
test('product revisions invalidate old approvals', () => {
  const graph = replaceProduct(ready(), { ...products[1], description: 'Revised product' }, 'importer');
  assert.equal(alternatives(graph, 'paper-a', { useCase: 'office-printing' }).length, 0);
});
test('expired and revoked evidence is not used', () => {
  assert.equal(alternatives(ready(), 'paper-a', { useCase: 'office-printing', now: Date.parse('2100-01-01T00:00:00Z') }).length, 0);
  const graph = ready(); assert.equal(alternatives(revoke(graph, graph.relationships[0].id, { actor: 'reviewer', reason: 'Withdrawn' }), 'paper-a', { useCase: 'office-printing' }).length, 0);
});
test('unsafe quantities and duplicate identities fail', () => {
  assert.throws(() => alternatives(ready(), 'paper-a', { useCase: 'office-printing', quantity: Number.MAX_SAFE_INTEGER }), /overflows/);
  assert.throws(() => createGraph([products[0], products[0]]), /Duplicate/);
});
test('Jev classification remains a proposal and preserves the graph', async () => {
  const graph = createGraph(products), before = JSON.stringify(graph);
  const result = await classifyPair(graph, 'paper-a', 'paper-b', 'office-printing', { provider: async ({ model }) => ({ model, answers: { relation: { type: 'choice', choice: 'substitute', probabilities: { identical: 0, substitute: 1, incompatible: 0, unknown: 0 }, confidence: 1 } } }) });
  assert.equal(result.requiresReview, true); assert.equal(result.proposedRelation, 'substitute'); assert.equal(JSON.stringify(graph), before);
});
