// Purpose: Record scoped product relationships with explicit evidence, review and revision checks.
import { randomUUID } from 'node:crypto';
import { fingerprint } from '@gbesse/decisionpacks';
const ensure = (ok, message) => { if (!ok) throw new Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;
function timestamp(value) { ensure(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)), 'Expected timezone-qualified timestamp'); return Date.parse(value); }
function productValid(p) {
  for (const key of ['id', 'supplierId', 'sku', 'description', 'unit']) ensure(text(p?.[key]), `Product requires ${key}`);
  ensure(Number.isSafeInteger(p.packSize) && p.packSize > 0, 'packSize must be a positive integer base-unit count');
  ensure(p.attributes && typeof p.attributes === 'object' && !Array.isArray(p.attributes), 'Product attributes are required');
  for (const value of Object.values(p.attributes)) ensure(['string', 'boolean'].includes(typeof value) || Number.isFinite(value), 'Attributes must be finite scalars');
  ensure(typeof p.active === 'boolean', 'Product requires active boolean');
}
export function validateGraph(graph) {
  ensure(graph?.schemaVersion === 1 && Array.isArray(graph.products) && Array.isArray(graph.relationships) && Array.isArray(graph.audit), 'Invalid graph document');
  graph.products.forEach(productValid);
  ensure(new Set(graph.products.map(p => p.id)).size === graph.products.length, 'Duplicate product ids');
  ensure(new Set(graph.products.map(p => JSON.stringify([p.supplierId, p.sku]))).size === graph.products.length, 'Duplicate supplier/SKU');
  ensure(new Set(graph.relationships.map(r => r.id)).size === graph.relationships.length, 'Duplicate relationship ids');
  for (const r of graph.relationships) {
    ensure(text(r.id) && ['identical', 'substitute', 'incompatible'].includes(r.relation), 'Invalid relationship');
    ensure(graph.products.some(p => p.id === r.from) && graph.products.some(p => p.id === r.to) && r.from !== r.to, 'Relationship endpoints are invalid');
    ensure(text(r.useCase) && ['proposed', 'approved', 'revoked'].includes(r.status), 'Invalid relationship scope or status');
    ensure(text(r.evidence?.reference) && text(r.evidence?.note), 'Evidence is required');
    timestamp(r.expiresAt);
    if (r.status === 'approved') ensure(text(r.review?.actor) && text(r.review?.note) && text(r.review?.fromFingerprint) && text(r.review?.toFingerprint), 'Approved edge requires review provenance');
  }
  return graph;
}
function product(graph, id) { const p = graph.products.find(p => p.id === id); ensure(p, `Unknown product: ${id}`); return p; }
function audit(graph, type, actor, details) { graph.audit.push({ id: randomUUID(), at: new Date().toISOString(), type, actor, details }); }
export function createGraph(products) { return validateGraph({ schemaVersion: 1, products: structuredClone(products), relationships: [], audit: [] }); }
export function replaceProduct(graph, replacement, actor) {
  validateGraph(graph); productValid(replacement); ensure(text(actor), 'Actor required'); product(graph, replacement.id);
  const next = structuredClone(graph); next.products[next.products.findIndex(p => p.id === replacement.id)] = structuredClone(replacement);
  audit(next, 'product.replaced', actor, { id: replacement.id }); return validateGraph(next);
}
export function propose(graph, { from, to, relation, useCase, evidence, expiresAt, actor } = {}) {
  validateGraph(graph); ensure(text(actor), 'Actor required');
  const next = structuredClone(graph);
  next.relationships.push({ id: randomUUID(), from, to, relation, useCase, evidence: structuredClone(evidence), expiresAt, status: 'proposed' });
  audit(next, 'relationship.proposed', actor, { id: next.relationships.at(-1).id }); return validateGraph(next);
}
function hardCompatible(a, b, relation) {
  ensure(a.active && b.active && a.unit === b.unit, 'Products must be active with the same base unit');
  if (relation === 'identical') {
    ensure(a.packSize === b.packSize && fingerprint(a.attributes) === fingerprint(b.attributes), 'Identical products require matching pack size and attributes');
  }
}
export function approve(graph, relationshipId, { actor, note, now = Date.now() } = {}) {
  validateGraph(graph); ensure(text(actor) && text(note), 'Review requires actor and note');
  const next = structuredClone(graph), r = next.relationships.find(r => r.id === relationshipId);
  ensure(r?.status === 'proposed', 'Only a proposed relationship can be approved');
  ensure(timestamp(r.expiresAt) > now, 'Cannot approve expired evidence');
  const a = product(next, r.from), b = product(next, r.to);
  if (r.relation !== 'incompatible') hardCompatible(a, b, r.relation);
  r.status = 'approved'; r.review = { actor, note, at: new Date(now).toISOString(), fromFingerprint: fingerprint(a), toFingerprint: fingerprint(b) };
  audit(next, 'relationship.approved', actor, { id: r.id }); return next;
}
export function revoke(graph, relationshipId, { actor, reason } = {}) {
  validateGraph(graph); ensure(text(actor) && text(reason), 'Revocation requires actor and reason');
  const next = structuredClone(graph), r = next.relationships.find(r => r.id === relationshipId);
  ensure(r && r.status !== 'revoked', 'Unknown or already revoked relationship');
  r.status = 'revoked'; audit(next, 'relationship.revoked', actor, { id: r.id, reason }); return next;
}
function current(graph, edge, now) {
  return edge.status === 'approved' && timestamp(edge.expiresAt) > now && edge.review.fromFingerprint === fingerprint(product(graph, edge.from)) && edge.review.toFingerprint === fingerprint(product(graph, edge.to));
}
function links(edge, source) {
  if (edge.from === source) return edge.to;
  // Substitution can be directional; equivalence and explicit incompatibility are symmetric.
  if (edge.to === source && edge.relation !== 'substitute') return edge.from;
  return null;
}
export function alternatives(graph, sourceId, { useCase, quantity = 1, requiredAttributes = {}, now = Date.now() } = {}) {
  validateGraph(graph); ensure(text(useCase), 'Exact useCase is required');
  ensure(Number.isSafeInteger(quantity) && quantity > 0, 'Quantity must be a positive number of source packs');
  ensure(requiredAttributes && typeof requiredAttributes === 'object' && !Array.isArray(requiredAttributes), 'Required attributes must be an object');
  const source = product(graph, sourceId); ensure(source.active, 'Source product is inactive');
  const baseUnits = quantity * source.packSize; ensure(Number.isSafeInteger(baseUnits), 'Quantity overflows safe integer range');
  const edges = graph.relationships.filter(r => r.useCase === useCase && current(graph, r, now));
  const positive = edges.filter(r => r.relation !== 'incompatible' && links(r, sourceId));
  const results = [];
  for (const id of new Set(positive.map(r => links(r, sourceId)))) {
    if (edges.some(r => r.relation === 'incompatible' && links(r, sourceId) === id)) continue;
    const target = product(graph, id);
    if (!target.active || target.unit !== source.unit || !Object.entries(requiredAttributes).every(([key, value]) => Object.hasOwn(target.attributes, key) && target.attributes[key] === value)) continue;
    const packs = Math.ceil(baseUnits / target.packSize);
    ensure(Number.isSafeInteger(packs * target.packSize), 'Target quantity overflows safe integer range');
    results.push({ product: structuredClone(target), targetPacks: packs, excessBaseUnits: packs * target.packSize - baseUnits, relationshipIds: positive.filter(r => links(r, sourceId) === id).map(r => r.id) });
  }
  // Only direct reviewed edges are used: A→B and B→C never certify A→C.
  return results.sort((a, b) => a.excessBaseUnits - b.excessBaseUnits || a.product.id.localeCompare(b.product.id));
}
export function candidatePairs(graph, sourceId, limit = 20) {
  validateGraph(graph); ensure(Number.isSafeInteger(limit) && limit > 0 && limit <= 100, 'limit must be 1–100');
  const source = product(graph, sourceId), words = new Set(source.description.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  return graph.products.filter(p => p.id !== sourceId && p.active && p.unit === source.unit).map(p => ({ from: sourceId, to: p.id, lexicalOverlap: [...new Set(p.description.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])].filter(w => words.has(w)).length, reviewRequired: true })).sort((a, b) => b.lexicalOverlap - a.lexicalOverlap || a.to.localeCompare(b.to)).slice(0, limit);
}
