#!/usr/bin/env node
// Purpose: Create versioned catalog snapshots and review product relationships from JSON files.
import { readFile, writeFile } from 'node:fs/promises';
import { createGraph, propose, approve, revoke, alternatives, candidatePairs, replaceProduct } from '../src/index.mjs';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === '--help') { console.log('matchgraph init PRODUCTS.json OUTPUT.json\nmatchgraph propose GRAPH.json PROPOSAL.json OUTPUT.json\nmatchgraph approve GRAPH.json EDGE_ID REVIEW.json OUTPUT.json\nmatchgraph revoke GRAPH.json EDGE_ID REVIEW.json OUTPUT.json\nmatchgraph replace GRAPH.json PRODUCT.json ACTOR OUTPUT.json\nmatchgraph alternatives GRAPH.json PRODUCT_ID OPTIONS.json\nmatchgraph candidates GRAPH.json PRODUCT_ID\nmatchgraph jev GRAPH.json FROM_ID TO_ID USE_CASE'); return; }
  const counts = { init: 2, propose: 3, approve: 4, revoke: 4, replace: 4, alternatives: 3, candidates: 2, jev: 4 };
  if (!Object.hasOwn(counts, command) || args.length !== counts[command]) throw new Error('Invalid arguments; use --help');
  let result, output;
  if (command === 'init') { result = createGraph(await read(args[0])); output = args[1]; }
  else {
    const graph = await read(args[0]);
    if (command === 'propose') { result = propose(graph, await read(args[1])); output = args[2]; }
    if (command === 'approve') { result = approve(graph, args[1], await read(args[2])); output = args[3]; }
    if (command === 'revoke') { result = revoke(graph, args[1], await read(args[2])); output = args[3]; }
    if (command === 'replace') { result = replaceProduct(graph, await read(args[1]), args[2]); output = args[3]; }
    if (command === 'alternatives') result = alternatives(graph, args[1], await read(args[2]));
    if (command === 'candidates') result = candidatePairs(graph, args[1]);
    if (command === 'jev') { const { classifyPair } = await import('../src/jev.mjs'); result = await classifyPair(graph, args[1], args[2], args[3]); }
  }
  if (output) await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  else console.log(JSON.stringify(result, null, 2));
}
main().catch(error => { console.error(`matchgraph: ${error.message}`); process.exitCode = 1; });
