# MatchGraph

An evidence graph for product equivalence and substitution, scoped to a specific use case.

**Public alpha · Node.js 22+ · MIT · JavaScript SDK + CLI.** Propose a relationship between supplier catalog records, attach evidence, review it, and query alternatives with correct pack quantities. Catalog changes and expired evidence invalidate earlier approvals.

## Try it offline

```sh
git clone https://github.com/gbesse/matchgraph.git
cd matchgraph
npm ci --ignore-scripts
npm run demo
node examples/write-fixtures.mjs
node bin/matchgraph.mjs init local-data/products.json local-data/graph0.json
node bin/matchgraph.mjs propose local-data/graph0.json local-data/proposal.json local-data/graph1.json
node bin/matchgraph.mjs alternatives local-data/graph1.json paper-a local-data/options.json
```

The query returns `[]` until review. Copy the relationship `id` from `local-data/graph1.json`:

```sh
node bin/matchgraph.mjs approve local-data/graph1.json RELATIONSHIP_ID local-data/review.json local-data/graph2.json
node bin/matchgraph.mjs alternatives local-data/graph2.json paper-a local-data/options.json
```

The fictional catalog replaces two 500-sheet packs with four 250-sheet packs, reporting zero excess sheets. The one-command demo performs the same process automatically.

## Embed it

```sh
npm install github:gbesse/matchgraph#v0.1.1
```

```js
import { createGraph, propose, approve, alternatives } from '@gbesse/matchgraph';
let graph = createGraph(products);
graph = propose(graph, {
  from: 'paper-a', to: 'paper-b', relation: 'substitute',
  useCase: 'office-printing', actor: importerId,
  evidence: { reference: supplierDocumentId, note: evidenceSummary },
  expiresAt: evidenceExpiry,
});
// After your host authenticates a reviewer and collects their decision:
graph = approve(graph, graph.relationships.at(-1).id, {
  actor: reviewerId, note: reviewReason,
});
const results = alternatives(graph, 'paper-a', {
  useCase: 'office-printing', quantity: 2,
  requiredAttributes: { format: 'A4', weightGsm: 80 },
});
```

Supply the catalog, identities and evidence values from your application. [Public types](src/index.d.mts) define the record formats. Snapshots are immutable; the host owns storage and concurrent writes.

## Matching rules

`substitute` is directional; `identical` and `incompatible` are symmetric. Relationships apply only to an exact `useCase`. A current reviewed incompatibility takes precedence over a positive relationship. There is no transitive inference: A→B and B→C do not certify A→C.

An approval fingerprints both complete product records. Any changed field invalidates it. Revoke or expired evidence also removes it from results. Identical products must share base unit, pack size and all declared attributes. Substitutions need the same base unit; quantities are positive integer pack counts and results include unavoidable excess base units. The reviewer remains responsible for specification sufficiency and domain suitability.

## Optional Jev classification

Set `TYPESAFE_API_KEY`, then:

```sh
node bin/matchgraph.mjs jev local-data/graph0.json paper-a paper-b office-printing
```

`classifyPair` from `@gbesse/matchgraph/jev` returns `identical`, `substitute`, `incompatible` or `unknown`, always with `requiresReview: true`. Both catalog records and the use case are sent to TypeSafe. It creates no approved relationship. `candidatePairs` provides a local word-overlap shortlist, not a learned product matcher.

## Boundaries and adoption thesis

Evidence references and reviewer names are host assertions, not verified supplier attestations. This alpha has no supplier network, authenticated review UI, web crawler or production purchasing integration. Trusted snapshots and domain review are necessary; neither Jev nor matching units establishes real-world interchangeability.

A growing corpus of reviewed, versioned supplier relationships could become valuable to procurement integrations. The graph format and lifecycle are implemented here; acquiring legitimate evidence and adoption is the next step, not an existing network effect.

## Shareable demo report

Run `npm run demo:report` to capture this repository’s bundled example as one JSON object with the project purpose, version and complete demo output. The command fails if the demo fails, so the report is useful when sharing a reproducible first look or reporting unexpected behavior. The bundled demo’s data and safety boundaries still apply.

## Validation and Jev integration

```sh
npm run typecheck
npm run check
npm test
npm run demo
```

CI runs these checks on Node.js 22 and 24 without a build step. Tests use fictional fixtures and injected model responses. **No live Jev call or model-quality benchmark was performed for this release.** The default adapter targets `jev-1.13.0` through the pinned [DecisionPacks](https://github.com/gbesse/decisionpacks) dependency, with response validation and explicit timeouts. Live requests require your TypeSafe account and may incur charges. See [TypeSafe's API documentation](https://docs.typesafe.ai/api) and [model documentation](https://docs.typesafe.ai/models).

Library errors propagate; CLI failures print to stderr and exit nonzero. Embedding applications own error reporting and administrator alerts. There is no telemetry or configured email service. See [SECURITY.md](SECURITY.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Related projects

[DecisionPacks](https://github.com/gbesse/decisionpacks) · [Autonomy Meter](https://github.com/gbesse/autonomy-meter) · [IntentBus](https://github.com/gbesse/intentbus) · [ExceptionOS](https://github.com/gbesse/exceptionos) · [Agent Mandates](https://github.com/gbesse/agent-mandates) · [MatchGraph](https://github.com/gbesse/matchgraph) · [WorldKit](https://github.com/gbesse/worldkit)

Independent projects; no affiliation with TypeSafe. MIT licensed.
