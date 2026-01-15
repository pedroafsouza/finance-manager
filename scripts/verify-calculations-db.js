#!/usr/bin/env bun
/**
 * Verify the calculations databases structure
 */

import { Database } from 'bun:sqlite';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

function verifyDb(dbName) {
  console.log(`\n📊 Verifying ${dbName}...`);

  const dbPath = path.join(dataDir, dbName);
  const db = new Database(dbPath, { readonly: true });

  // Get table info
  const tableInfo = db.prepare('PRAGMA table_info(tax_calculations)').all();

  console.log('\n✓ Table: tax_calculations');
  console.log('  Columns:');
  tableInfo.forEach((col) => {
    const nullable = col.notnull ? 'NOT NULL' : 'NULL';
    const defaultVal = col.dflt_value ? `DEFAULT ${col.dflt_value}` : '';
    console.log(`    - ${col.name} (${col.type}) ${nullable} ${defaultVal}`.trim());
  });

  // Count records
  const count = db.prepare('SELECT COUNT(*) as count FROM tax_calculations').get();
  console.log(`\n  Records: ${count.count}`);

  db.close();
  console.log(`\n✅ ${dbName} verified successfully`);
}

console.log('🔍 Verifying calculations databases...');
console.log('═'.repeat(60));

try {
  verifyDb('finance-calculations.db');
  verifyDb('demo-calculations.db');

  console.log('\n═'.repeat(60));
  console.log('🎉 All databases verified successfully!');
} catch (error) {
  console.error('\n❌ Verification failed:', error);
  process.exit(1);
}
