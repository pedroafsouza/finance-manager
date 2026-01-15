import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { cookies } from 'next/headers';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const getDb = () => {
  // Check if demo mode is enabled via cookie
  let isDemoMode = false;
  try {
    const cookieStore = cookies();
    const demoModeCookie = cookieStore.get('demoMode');
    isDemoMode = demoModeCookie?.value === 'true';
  } catch (error) {
    // If cookies() fails (e.g., in non-request context), use default
    isDemoMode = false;
  }

  const dbName = isDemoMode ? 'demo.db' : 'finance.db';
  const dbPath = path.join(process.cwd(), 'data', dbName);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
};

export const initDb = () => {
  const db = getDb();

  // Create transactions table - stores all activities
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      ticker TEXT NOT NULL,
      lot_number INTEGER,
      num_shares REAL,
      share_price REAL,
      book_value REAL,
      market_value REAL,
      cash_value REAL,
      import_source TEXT DEFAULT 'morgan-stanley-pdf',
      import_date TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create holdings table - current positions with cost basis
  db.exec(`
    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      acquisition_date TEXT NOT NULL,
      lot_number INTEGER,
      capital_gain_impact TEXT,
      adjusted_gain_loss REAL,
      adjusted_cost_basis REAL,
      adjusted_cost_basis_per_share REAL,
      total_shares REAL,
      current_price_per_share REAL,
      current_value REAL,
      import_source TEXT DEFAULT 'morgan-stanley-pdf',
      import_date TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Keep old stock_grants table for backward compatibility
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker TEXT NOT NULL,
      acquisition_date TEXT NOT NULL,
      lot_number INTEGER,
      capital_gain_impact TEXT,
      adjusted_gain_loss REAL,
      adjusted_cost_basis REAL,
      adjusted_cost_basis_per_share REAL,
      total_shares REAL,
      current_price_per_share REAL,
      current_value REAL,
      import_source TEXT DEFAULT 'morgan-stanley',
      import_date TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date
    ON transactions(entry_date, ticker);

    CREATE INDEX IF NOT EXISTS idx_transactions_type
    ON transactions(activity_type);

    CREATE INDEX IF NOT EXISTS idx_holdings_ticker
    ON holdings(ticker, acquisition_date);

    CREATE INDEX IF NOT EXISTS idx_grants_ticker_date
    ON stock_grants(ticker, acquisition_date);
  `);

  db.close();
};
