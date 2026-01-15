#!/usr/bin/env bun
/**
 * Check that tax_calculations table was removed from main databases
 */

import { Database } from 'bun:sqlite';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

function checkDb(dbName) {
  console.log(`\n📊 Checking ${dbName}...`);

  const dbPath = path.join(dataDir, dbName);
  const db = new Database(dbPath, { readonly: true });

  // Check for tax_calculations table
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tax_calculations'")
    .all();

  if (tables.length > 0) {
    console.log('  ❌ tax_calculations table still exists (should have been removed)');
  } else {
    console.log('  ✅ tax_calculations table successfully removed');
  }

  // List all tables
  const allTables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();

  console.log('\n  Current tables:');
  allTables.forEach((table) => {
    console.log(`    - ${table.name}`);
  });

  db.close();
}

console.log('🔍 Checking main databases...');
console.log('═'.repeat(60));

try {
  checkDb('finance.db');
  checkDb('demo.db');

  console.log('\n═'.repeat(60));
  console.log('🎉 Main databases checked successfully!');
} catch (error) {
  console.error('\n❌ Check failed:', error);
  process.exit(1);
}
