// Purpose: Declare catalog evidence, reviewed graph edges and quantity-aware alternatives.
export type Attributes = Record<string, string | number | boolean>;
export interface Product { id: string; supplierId: string; sku: string; description: string; unit: string; packSize: number; attributes: Attributes; active: boolean }
export type Relation = 'identical' | 'substitute' | 'incompatible';
export interface Proposal { from: string; to: string; relation: Relation; useCase: string; evidence: { reference: string; note: string }; expiresAt: string; actor: string }
export interface Relationship extends Omit<Proposal, 'actor'> { id: string; status: 'proposed' | 'approved' | 'revoked'; review?: { actor: string; note: string; at: string; fromFingerprint: string; toFingerprint: string } }
export interface Graph { schemaVersion: 1; products: Product[]; relationships: Relationship[]; audit: { id: string; at: string; type: string; actor: string; details: Record<string, string> }[] }
export interface Alternative { product: Product; targetPacks: number; excessBaseUnits: number; relationshipIds: string[] }
export function validateGraph(graph: unknown): Graph;
export function createGraph(products: Product[]): Graph;
export function replaceProduct(graph: Graph, replacement: Product, actor: string): Graph;
export function propose(graph: Graph, proposal: Proposal): Graph;
export function approve(graph: Graph, relationshipId: string, review: { actor: string; note: string; now?: number }): Graph;
export function revoke(graph: Graph, relationshipId: string, review: { actor: string; reason: string }): Graph;
export function alternatives(graph: Graph, sourceId: string, options: { useCase: string; quantity?: number; requiredAttributes?: Attributes; now?: number }): Alternative[];
export function candidatePairs(graph: Graph, sourceId: string, limit?: number): { from: string; to: string; lexicalOverlap: number; reviewRequired: boolean }[];
