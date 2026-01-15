import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { cookies } from 'next/headers';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const getDb = async () => {
  // Check if demo mode is enabled via cookie
  let isDemoMode = false;
  try {
    const cookieStore = await cookies();
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

// Get analysis database (separate for both demo and live modes)
export const getAnalysisDb = async () => {
  // Check if demo mode is enabled via cookie
  let isDemoMode = false;
  try {
    const cookieStore = await cookies();
    const demoModeCookie = cookieStore.get('demoMode');
    isDemoMode = demoModeCookie?.value === 'true';
  } catch (error) {
    // If cookies() fails (e.g., in non-request context), use default
    isDemoMode = false;
  }

  const dbName = isDemoMode ? 'demo-analysis.db' : 'finance-analysis.db';
  const dbPath = path.join(process.cwd(), 'data', dbName);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
};

// Get secrets database (separate for both demo and live modes)
export const getSecretsDb = async () => {
  // Check if demo mode is enabled via cookie
  let isDemoMode = false;
  try {
    const cookieStore = await cookies();
    const demoModeCookie = cookieStore.get('demoMode');
    isDemoMode = demoModeCookie?.value === 'true';
  } catch (error) {
    // If cookies() fails (e.g., in non-request context), use default
    isDemoMode = false;
  }

  const dbName = isDemoMode ? 'demo-secrets.db' : 'finance-secrets.db';
  const dbPath = path.join(process.cwd(), 'data', dbName);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
};

export const initDb = async () => {
  const db = await getDb();

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

  // Create tax_calculations table - Danish tax calculations by year
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

// Initialize analysis databases (both demo and live)
export const initAnalysisDb = (dbName: 'demo-analysis.db' | 'finance-analysis.db') => {
  const dbPath = path.join(process.cwd(), 'data', dbName);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create LLM analysis reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS llm_analysis_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      llm_provider TEXT NOT NULL,
      analysis_type TEXT DEFAULT 'portfolio',
      prompt_tokens INTEGER,
      completion_tokens INTEGER,
      recommendation TEXT,
      reasoning TEXT NOT NULL,
      confidence_level TEXT,
      risk_factors TEXT,
      opportunities TEXT,
      data_snapshot TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_error BOOLEAN DEFAULT 0,
      error_type TEXT
    )
  `);

  // Add new columns if they don't exist (for backwards compatibility)
  const tableInfo = db.pragma(`table_info(llm_analysis_reports)`);
  const columnNames = tableInfo.map((col: any) => col.name);

  if (!columnNames.includes('is_error')) {
    db.exec(`ALTER TABLE llm_analysis_reports ADD COLUMN is_error BOOLEAN DEFAULT 0`);
  }

  if (!columnNames.includes('error_type')) {
    db.exec(`ALTER TABLE llm_analysis_reports ADD COLUMN error_type TEXT`);
  }

  // Create index
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_llm_reports_created
    ON llm_analysis_reports(created_at DESC, is_read);
  `);

  db.close();
};

// Convenience functions
export const initDemoAnalysisDb = () => initAnalysisDb('demo-analysis.db');
export const initLiveAnalysisDb = () => initAnalysisDb('finance-analysis.db');

// Initialize secrets databases (both demo and live)
export const initSecretsDb = (dbName: 'demo-secrets.db' | 'finance-secrets.db') => {
  const dbPath = path.join(process.cwd(), 'data', dbName);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create LLM settings table - stores API keys in plain text
  db.exec(`
    CREATE TABLE IF NOT EXISTS llm_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anthropic_api_key TEXT,
      gemini_api_key TEXT,
      preferred_llm TEXT DEFAULT 'claude',
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.close();
};

// Convenience functions
export const initDemoSecretsDb = () => initSecretsDb('demo-secrets.db');
export const initLiveSecretsDb = () => initSecretsDb('finance-secrets.db');
