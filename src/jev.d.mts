// Purpose: Type the optional Jev adapter and injected provider contract.
import type { Provider, DecisionRecord } from '@gbesse/decisionpacks';
export interface JevOptions { provider?: Provider; signal?: AbortSignal }
import type { Graph, Relation } from './index.mjs';
export function classifyPair(graph: Graph, from: string, to: string, useCase: string, options?: JevOptions): Promise<{ from: string; to: string; useCase: string; proposedRelation: Relation | 'unknown'; requiresReview: true; record: DecisionRecord }>;
