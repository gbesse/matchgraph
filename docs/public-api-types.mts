// Purpose: Compile public imports and reject representative invalid calls without executing them.
import { createGraph, propose, alternatives, type Product } from '@gbesse/matchgraph';
import { classifyPair } from '@gbesse/matchgraph/jev';
const products: Product[] = []; const graph = createGraph(products);
const result = alternatives(graph, 'a', { useCase: 'office', quantity: 2, requiredAttributes: { size: 'A4' } });
void result; void classifyPair;
// @ts-expect-error Scoped use case is required.
alternatives(graph, 'a', {});
void propose;
