import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { getDb, initDb } from '../lib/db';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Operations', () => {
  const testDbPath = path.join(process.cwd(), 'data', 'test-finance.db');

  beforeEach(() => {
    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Mock the dbPath for testing
    process.env.TEST_DB = 'true';
  });

  afterEach(() => {
    // Cleanup test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('initDb', () => {
    test('should create database file', async () => {
      await initDb();

      expect(fs.existsSync(path.join(process.cwd(), 'data', 'finance.db'))).toBe(true);
    });

    test('should create stock_grants table', async () => {
      await initDb();
      const db = await getDb();

      // Query to check if table exists
      const result = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='stock_grants'
      `).get();

      expect(result).toBeDefined();
      expect((result as any).name).toBe('stock_grants');

      db.close();
    });

    test('should create index on ticker and acquisition_date', async () => {
      await initDb();
      const db = await getDb();

      const result = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND name='idx_grants_ticker_date'
      `).get();

      expect(result).toBeDefined();
      expect((result as any).name).toBe('idx_grants_ticker_date');

      db.close();
    });

    test('should be idempotent (safe to run multiple times)', async () => {
      await initDb();
      await initDb();
      await initDb();

      const db = await getDb();
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM sqlite_master
        WHERE type='table' AND name='stock_grants'
      `).get();

      expect((result as any).count).toBe(1);

      db.close();
    });
  });

  describe('getDb', () => {
    test('should return database instance', async () => {
      await initDb();
      const db = await getDb();

      expect(db).toBeDefined();
      expect(typeof db.prepare).toBe('function');
      expect(typeof db.close).toBe('function');

      db.close();
    });

    test('should enable WAL mode', async () => {
      await initDb();
      const db = await getDb();

      const result = db.prepare('PRAGMA journal_mode').get() as any;
      expect(result.journal_mode).toBe('wal');

      db.close();
    });
  });

  describe('Stock Grants Table Schema', () => {
    beforeEach(async () => {
      await initDb();
      // Clear the table
      const db = await getDb();
      db.prepare('DELETE FROM stock_grants').run();
      db.close();
    });

    test('should have all required columns', async () => {
      const db = await getDb();

      const columns = db.prepare('PRAGMA table_info(stock_grants)').all() as any[];

      const columnNames = columns.map(col => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('ticker');
      expect(columnNames).toContain('acquisition_date');
      expect(columnNames).toContain('lot_number');
      expect(columnNames).toContain('capital_gain_impact');
      expect(columnNames).toContain('adjusted_gain_loss');
      expect(columnNames).toContain('adjusted_cost_basis');
      expect(columnNames).toContain('adjusted_cost_basis_per_share');
      expect(columnNames).toContain('total_shares');
      expect(columnNames).toContain('current_price_per_share');
      expect(columnNames).toContain('current_value');
      expect(columnNames).toContain('import_source');
      expect(columnNames).toContain('import_date');
      expect(columnNames).toContain('created_at');

      db.close();
    });

    test('should have id as primary key', async () => {
      const db = await getDb();

      const columns = db.prepare('PRAGMA table_info(stock_grants)').all() as any[];
      const idColumn = columns.find(col => col.name === 'id');

      expect(idColumn).toBeDefined();
      expect(idColumn.pk).toBe(1);

      db.close();
    });

    test('should have NOT NULL constraints on required fields', async () => {
      const db = await getDb();

      const columns = db.prepare('PRAGMA table_info(stock_grants)').all() as any[];

      const tickerColumn = columns.find(col => col.name === 'ticker');
      const acquisitionDateColumn = columns.find(col => col.name === 'acquisition_date');

      expect(tickerColumn.notnull).toBe(1);
      expect(acquisitionDateColumn.notnull).toBe(1);

      db.close();
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      await initDb();
      // Clear the table
      const db = await getDb();
      db.prepare('DELETE FROM stock_grants').run();
      db.close();
    });

    test('should insert a stock grant', async () => {
      const db = await getDb();

      const insert = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insert.run(
        'MSFT',
        '2019-04-16T00:00:00.000Z',
        6,
        'Long Term',
        8392.63,
        2905.81,
        121.05,
        24.005,
        470.67,
        11298.43
      );

      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBeGreaterThan(0);

      db.close();
    });

    test('should retrieve inserted stock grant', async () => {
      const db = await getDb();

      // Insert
      db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('MSFT', '2019-04-16T00:00:00.000Z', 6, 'Long Term', 8392.63, 2905.81, 121.05, 24.005, 470.67, 11298.43);

      // Retrieve
      const grant = db.prepare('SELECT * FROM stock_grants WHERE ticker = ?').get('MSFT') as any;

      expect(grant).toBeDefined();
      expect(grant.ticker).toBe('MSFT');
      expect(grant.lot_number).toBe(6);
      expect(grant.capital_gain_impact).toBe('Long Term');
      expect(grant.total_shares).toBe(24.005);

      db.close();
    });

    test('should handle batch inserts with transaction', async () => {
      const db = await getDb();

      const insert = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((grants: any[]) => {
        for (const grant of grants) {
          insert.run(...grant);
        }
      });

      const grants = [
        ['MSFT', '2019-04-16T00:00:00.000Z', 6, 'Long Term', 100, 50, 10, 5, 20, 100],
        ['AAPL', '2020-05-20T00:00:00.000Z', 7, 'Long Term', 200, 100, 20, 5, 40, 200],
        ['GOOGL', '2021-06-15T00:00:00.000Z', 8, 'Short Term', 300, 150, 30, 5, 60, 300],
      ];

      insertMany(grants);

      const count = db.prepare('SELECT COUNT(*) as count FROM stock_grants').get() as any;
      expect(count.count).toBe(3);

      db.close();
    });

    test('should delete stock grants', async () => {
      const db = await getDb();

      // Insert
      db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('MSFT', '2019-04-16T00:00:00.000Z', 6, 'Long Term', 100, 50, 10, 5, 20, 100);

      // Delete
      const result = db.prepare('DELETE FROM stock_grants').run();
      expect(result.changes).toBe(1);

      // Verify
      const count = db.prepare('SELECT COUNT(*) as count FROM stock_grants').get() as any;
      expect(count.count).toBe(0);

      db.close();
    });

    test('should query by ticker', async () => {
      const db = await getDb();

      // Insert multiple records
      const insert = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insert.run('MSFT', '2019-04-16T00:00:00.000Z', 6, 'Long Term', 100, 50, 10, 5, 20, 100);
      insert.run('AAPL', '2020-05-20T00:00:00.000Z', 7, 'Long Term', 200, 100, 20, 5, 40, 200);
      insert.run('MSFT', '2021-06-15T00:00:00.000Z', 8, 'Short Term', 300, 150, 30, 5, 60, 300);

      // Query
      const msftGrants = db.prepare('SELECT * FROM stock_grants WHERE ticker = ?').all('MSFT');

      expect(msftGrants.length).toBe(2);

      db.close();
    });

    test('should order by acquisition_date DESC', async () => {
      const db = await getDb();

      // Insert records
      const insert = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insert.run('MSFT', '2021-06-15T00:00:00.000Z', 8, 'Short Term', 300, 150, 30, 5, 60, 300);
      insert.run('MSFT', '2019-04-16T00:00:00.000Z', 6, 'Long Term', 100, 50, 10, 5, 20, 100);
      insert.run('MSFT', '2020-05-20T00:00:00.000Z', 7, 'Long Term', 200, 100, 20, 5, 40, 200);

      // Query with order
      const grants = db.prepare('SELECT * FROM stock_grants ORDER BY acquisition_date DESC').all() as any[];

      expect(grants[0].lot_number).toBe(8); // 2021
      expect(grants[1].lot_number).toBe(7); // 2020
      expect(grants[2].lot_number).toBe(6); // 2019

      db.close();
    });
  });

  describe('Data Integrity', () => {
    beforeEach(() => {
      initDb();
    });

    test('should enforce NOT NULL constraint on ticker', async () => {
      const db = await getDb();

      expect(() => {
        db.prepare(`
          INSERT INTO stock_grants (
            ticker, acquisition_date, lot_number, capital_gain_impact,
            adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
            total_shares, current_price_per_share, current_value
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(null, '2019-04-16T00:00:00.000Z', 6, 'Long Term', 100, 50, 10, 5, 20, 100);
      }).toThrow();

      db.close();
    });

    test('should enforce NOT NULL constraint on acquisition_date', async () => {
      const db = await getDb();

      expect(() => {
        db.prepare(`
          INSERT INTO stock_grants (
            ticker, acquisition_date, lot_number, capital_gain_impact,
            adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
            total_shares, current_price_per_share, current_value
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run('MSFT', null, 6, 'Long Term', 100, 50, 10, 5, 20, 100);
      }).toThrow();

      db.close();
    });

    test('should auto-generate id', async () => {
      const db = await getDb();

      const result1 = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('MSFT', '2019-04-16T00:00:00.000Z', 6, 'Long Term', 100, 50, 10, 5, 20, 100);

      const result2 = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('AAPL', '2020-05-20T00:00:00.000Z', 7, 'Long Term', 200, 100, 20, 5, 40, 200);

      expect(result2.lastInsertRowid).toBeGreaterThan(result1.lastInsertRowid);

      db.close();
    });
  });
});
