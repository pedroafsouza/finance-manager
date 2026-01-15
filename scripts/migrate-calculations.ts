#!/usr/bin/env bun
/**
 * Migration script to move tax_calculations table from main databases
 * to dedicated calculation databases
 */

import { Database } from 'bun:sqlite';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  console.error('❌ Data directory does not exist!');
  process.exit(1);
}

function migrateTaxCalculations(
  sourceDbName: string,
  targetDbName: string,
  mode: 'live' | 'demo'
) {
  console.log(`\n📦 Migrating ${mode} mode: ${sourceDbName} → ${targetDbName}`);

  const sourceDbPath = path.join(dataDir, sourceDbName);
  const targetDbPath = path.join(dataDir, targetDbName);

  // Check if source database exists
  if (!fs.existsSync(sourceDbPath)) {
    console.log(`⚠️  Source database ${sourceDbName} does not exist, skipping...`);
    return;
  }

  // Open source database
  const sourceDb = new Database(sourceDbPath);

  // Check if tax_calculations table exists in source
  const tables = sourceDb
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='tax_calculations'"
    )
    .all();

  if (tables.length === 0) {
    console.log(`ℹ️  No tax_calculations table found in ${sourceDbName}, skipping...`);
    sourceDb.close();
    return;
  }

  // Get all tax calculation records
  const taxCalculations = sourceDb
    .prepare('SELECT * FROM tax_calculations ORDER BY year')
    .all();

  console.log(`📊 Found ${taxCalculations.length} tax calculation records`);

  if (taxCalculations.length === 0) {
    console.log(`ℹ️  No data to migrate from ${sourceDbName}`);
    sourceDb.close();
    return;
  }

  // Initialize target database
  const targetDb = new Database(targetDbPath);
  targetDb.exec("PRAGMA journal_mode = WAL");

  // Create tax_calculations table in target database
  targetDb.exec(`
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

  // Insert data into target database
  const insertStmt = targetDb.prepare(`
    INSERT OR REPLACE INTO tax_calculations (
      id, year, yearly_salary_dkk, fradrag_dkk, amount_on_7p_dkk,
      amount_not_on_7p_dkk, microsoft_allowance_7p_dkk, preferred_currency,
      usd_to_dkk_rate, calculated_tax_dkk, am_bidrag_dkk, bottom_tax_dkk,
      top_tax_dkk, municipal_tax_dkk, total_tax_dkk, notes, created_at, updated_at
    ) VALUES (
      @id, @year, @yearly_salary_dkk, @fradrag_dkk, @amount_on_7p_dkk,
      @amount_not_on_7p_dkk, @microsoft_allowance_7p_dkk, @preferred_currency,
      @usd_to_dkk_rate, @calculated_tax_dkk, @am_bidrag_dkk, @bottom_tax_dkk,
      @top_tax_dkk, @municipal_tax_dkk, @total_tax_dkk, @notes, @created_at, @updated_at
    )
  `);

  const insertMany = targetDb.transaction((records: any[]) => {
    for (const record of records) {
      insertStmt.run(record);
    }
  });

  insertMany(taxCalculations);

  console.log(`✅ Successfully migrated ${taxCalculations.length} records to ${targetDbName}`);

  // Verify data was copied correctly
  const targetCount = targetDb
    .prepare('SELECT COUNT(*) as count FROM tax_calculations')
    .get() as { count: number };

  console.log(`✓ Verified: ${targetCount.count} records in target database`);

  // Close target database
  targetDb.close();

  // Drop tax_calculations table from source database
  console.log(`🗑️  Dropping tax_calculations table from ${sourceDbName}...`);
  sourceDb.exec('DROP TABLE IF EXISTS tax_calculations');

  // Close source database
  sourceDb.close();

  console.log(`✅ Migration complete for ${mode} mode`);
}

// Run migrations
console.log('🚀 Starting tax calculations migration...');
console.log('═'.repeat(60));

try {
  // Migrate live database
  migrateTaxCalculations('finance.db', 'finance-calculations.db', 'live');

  // Migrate demo database
  migrateTaxCalculations('demo.db', 'demo-calculations.db', 'demo');

  console.log('\n═'.repeat(60));
  console.log('🎉 All migrations completed successfully!');
  console.log('\n📝 Summary:');
  console.log('  • Tax calculations moved to dedicated databases');
  console.log('  • Old tax_calculations tables removed from main databases');
  console.log('  • New databases: finance-calculations.db & demo-calculations.db');
} catch (error) {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
}
