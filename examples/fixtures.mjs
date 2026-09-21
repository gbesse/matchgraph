// Purpose: Supply a fictional office-paper catalog with explicit base units and pack counts.
export const products = [
  { id: 'paper-a', supplierId: 'supplier-a', sku: 'A4-500', description: 'White A4 office paper, 500 sheets', unit: 'sheet', packSize: 500, attributes: { format: 'A4', weightGsm: 80, color: 'white' }, active: true },
  { id: 'paper-b', supplierId: 'supplier-b', sku: 'A4-250', description: 'White A4 office paper, 250 sheets', unit: 'sheet', packSize: 250, attributes: { format: 'A4', weightGsm: 80, color: 'white' }, active: true },
  { id: 'paper-c', supplierId: 'supplier-c', sku: 'A3-500', description: 'White A3 office paper, 500 sheets', unit: 'sheet', packSize: 500, attributes: { format: 'A3', weightGsm: 80, color: 'white' }, active: true },
];
export const proposed = { from: 'paper-a', to: 'paper-b', relation: 'substitute', useCase: 'office-printing', evidence: { reference: 'synthetic-supplier-spec-v1', note: 'Fictional matching A4/80gsm specifications; different pack sizes.' }, expiresAt: '2099-01-01T00:00:00Z', actor: 'demo-importer' };
