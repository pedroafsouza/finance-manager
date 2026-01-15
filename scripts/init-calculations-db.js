#!/usr/bin/env node
/**
 * Initialize the calculations databases
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function initCalculationsDb(dbName) {
  console.log(`\n📦 Initializing ${dbName}...`);

  const dbPath = path.join(dataDir, dbName);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create tax_calculations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tax_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL UNIQUE,
      yearly_salary_dkk REAL NOT NULL,
      fradrag_dkk REAL NOT NULL,
      amount_on_7p_dkk REAL NOT NULL,
      amount_not_on_7p_dkk REAL NOT NULL,
      microsoft_allowance_7p_dkk REAL NOT NULL,
      preferred_currency TEXT DEFAULT 'DKK',
      usd_to_dkk_rate REAL DEFAULT 6.9,
      calculated_tax_dkk REAL,
      am_bidrag_dkk REAL,
      bottom_tax_dkk REAL,
      top_tax_dkk REAL,
      municipal_tax_dkk REAL,
      total_tax_dkk REAL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.close();
  console.log(`✅ Successfully initialized ${dbName}`);
}

console.log('🚀 Initializing calculations databases...');
console.log('═'.repeat(60));

try {
  initCalculationsDb('finance-calculations.db');
  initCalculationsDb('demo-calculations.db');

  console.log('\n═'.repeat(60));
  console.log('🎉 All databases initialized successfully!');
} catch (error) {
  console.error('\n❌ Initialization failed:', error);
  process.exit(1);
}
