// Purpose: Demonstrate approval, quantity conversion and exact use-case scoping with synthetic products.
import { createGraph, propose, approve, alternatives } from '../src/index.mjs';
import { products, proposed } from './fixtures.mjs';
let graph = propose(createGraph(products), proposed);
const before = alternatives(graph, 'paper-a', { useCase: 'office-printing', quantity: 2 });
graph = approve(graph, graph.relationships[0].id, { actor: 'demo-reviewer', note: 'Reviewed the synthetic specifications.' });
console.log(JSON.stringify({ source: 'synthetic example, not a real compatibility claim', beforeReview: before, afterReview: alternatives(graph, 'paper-a', { useCase: 'office-printing', quantity: 2, requiredAttributes: { format: 'A4' } }) }, null, 2));
