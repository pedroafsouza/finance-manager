#!/usr/bin/env node
/**
 * Remove tax_calculations table from demo.db
 */

const Database = require('better-sqlite3');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'demo.db');

console.log('🧹 Cleaning up demo.db...');

const db = new Database(dbPath);

// Drop the table
db.exec('DROP TABLE IF EXISTS tax_calculations');

console.log('✅ Successfully removed tax_calculations table from demo.db');

db.close();
