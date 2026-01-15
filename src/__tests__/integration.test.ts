import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseMorganStanleyExcel } from '../lib/excel-parser';
import { getDb, initDb } from '../lib/db';
import * as XLSX from 'xlsx';

describe('Integration Tests', () => {
  const testDbPath = path.join(process.cwd(), 'data', 'finance.db');

  beforeAll(async () => {
    // Ensure clean state
    if (fs.existsSync(testDbPath)) {
      const db = await getDb();
      db.prepare('DELETE FROM stock_grants').run();
      db.close();
    } else {
      initDb();
    }
  });

  afterAll(async () => {
    // Cleanup test data
    const db = await getDb();
    db.prepare('DELETE FROM stock_grants').run();
    db.close();
  });

  describe('End-to-End Import Flow', () => {
    test('should complete full import workflow', async () => {
      // Step 1: Create Excel file
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$8,392.63 USD', '$2,905.81 USD', '$121.05 USD', 24.005, '$470.67 USD', '$11,298.43 USD'],
        [43616, 7, 'Long Term', '$1,034.82 USD', '$377.19 USD', '$125.73 USD', 3, '$470.67 USD', '$1,412.01 USD'],
        ['Type of Money: AAPL', '', '', '', '', '', '', '', ''],
        [43630, 10, 'Long Term', '$500.00 USD', '$200.00 USD', '$40.00 USD', 5, '$140.00 USD', '$700.00 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Step 2: Parse Excel
      const grants = parseMorganStanleyExcel(buffer);
      expect(grants.length).toBe(3);
      expect(grants[0].ticker).toBe('MSFT');
      expect(grants[2].ticker).toBe('AAPL');

      // Step 3: Store in database
      initDb();
      const db = await getDb();

      const insertStmt = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((grants: any) => {
        for (const grant of grants) {
          insertStmt.run(
            grant.ticker,
            grant.acquisitionDate.toISOString(),
            grant.lotNumber,
            grant.capitalGainImpact,
            grant.adjustedGainLoss,
            grant.adjustedCostBasis,
            grant.adjustedCostBasisPerShare,
            grant.totalShares,
            grant.currentPricePerShare,
            grant.currentValue
          );
        }
      });

      insertMany(grants);

      // Step 4: Verify data in database
      const storedGrants = db.prepare('SELECT * FROM stock_grants ORDER BY acquisition_date DESC').all();
      expect(storedGrants.length).toBe(3);

      // Step 5: Verify data integrity
      const msftGrants = db.prepare('SELECT * FROM stock_grants WHERE ticker = ?').all('MSFT');
      expect(msftGrants.length).toBe(2);

      const aaplGrants = db.prepare('SELECT * FROM stock_grants WHERE ticker = ?').all('AAPL');
      expect(aaplGrants.length).toBe(1);

      // Step 6: Verify calculations
      const firstGrant = storedGrants[0] as any;
      const calculatedValue = firstGrant.total_shares * firstGrant.current_price_per_share;
      expect(Math.abs(firstGrant.current_value - calculatedValue)).toBeLessThan(0.1);

      db.close();
    });

    test('should handle real Morgan Stanley file if available', async () => {
      const realFilePath = path.resolve(__dirname, '../../data/morgan-stanley.xlsx');

      // Skip if real file doesn't exist
      if (!fs.existsSync(realFilePath)) {
        console.log('Skipping real file test - file not found');
        return;
      }

      // Read real file
      const buffer = fs.readFileSync(realFilePath);

      // Parse
      const grants = parseMorganStanleyExcel(buffer);
      expect(grants.length).toBeGreaterThan(0);

      // Store
      initDb();
      const db = await getDb();

      // Clear existing data first
      db.prepare('DELETE FROM stock_grants').run();

      const insertStmt = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((grants: any) => {
        for (const grant of grants) {
          insertStmt.run(
            grant.ticker,
            grant.acquisitionDate.toISOString(),
            grant.lotNumber,
            grant.capitalGainImpact,
            grant.adjustedGainLoss,
            grant.adjustedCostBasis,
            grant.adjustedCostBasisPerShare,
            grant.totalShares,
            grant.currentPricePerShare,
            grant.currentValue
          );
        }
      });

      insertMany(grants);

      // Verify
      const count = db.prepare('SELECT COUNT(*) as count FROM stock_grants').get() as any;
      expect(count.count).toBe(grants.length);

      db.close();
    });
  });

  describe('Data Aggregation', () => {
    beforeAll(async () => {
      // Setup test data
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$1000.00 USD', '$500.00 USD', '$100.00 USD', 5, '$200.00 USD', '$1000.00 USD'],
        [43616, 7, 'Long Term', '$2000.00 USD', '$1000.00 USD', '$100.00 USD', 10, '$200.00 USD', '$2000.00 USD'],
        ['Type of Money: AAPL', '', '', '', '', '', '', '', ''],
        [43630, 10, 'Short Term', '$500.00 USD', '$200.00 USD', '$40.00 USD', 5, '$140.00 USD', '$700.00 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const grants = parseMorganStanleyExcel(buffer);
      initDb();
      const db = await getDb();

      db.prepare('DELETE FROM stock_grants').run();

      const insertStmt = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((grants: any) => {
        for (const grant of grants) {
          insertStmt.run(
            grant.ticker,
            grant.acquisitionDate.toISOString(),
            grant.lotNumber,
            grant.capitalGainImpact,
            grant.adjustedGainLoss,
            grant.adjustedCostBasis,
            grant.adjustedCostBasisPerShare,
            grant.totalShares,
            grant.currentPricePerShare,
            grant.currentValue
          );
        }
      });

      insertMany(grants);
      db.close();
    });

    test('should calculate total portfolio value', async () => {
      const db = await getDb();

      const result = db.prepare(`
        SELECT SUM(current_value) as total_value
        FROM stock_grants
      `).get() as any;

      expect(result.total_value).toBe(3700);

      db.close();
    });

    test('should calculate total shares by ticker', async () => {
      const db = await getDb();

      const result = db.prepare(`
        SELECT ticker, SUM(total_shares) as total_shares
        FROM stock_grants
        GROUP BY ticker
        ORDER BY ticker
      `).all() as any[];

      expect(result.length).toBe(2);
      expect(result[0].ticker).toBe('AAPL');
      expect(result[0].total_shares).toBe(5);
      expect(result[1].ticker).toBe('MSFT');
      expect(result[1].total_shares).toBe(15);

      db.close();
    });

    test('should calculate gains by capital gain type', async () => {
      const db = await getDb();

      const result = db.prepare(`
        SELECT capital_gain_impact, SUM(adjusted_gain_loss) as total_gain
        FROM stock_grants
        GROUP BY capital_gain_impact
      `).all() as any[];

      const longTermGain = result.find(r => r.capital_gain_impact === 'Long Term');
      const shortTermGain = result.find(r => r.capital_gain_impact === 'Short Term');

      expect(longTermGain.total_gain).toBe(3000);
      expect(shortTermGain.total_gain).toBe(500);

      db.close();
    });

    test('should calculate average cost basis per share by ticker', async () => {
      const db = await getDb();

      const result = db.prepare(`
        SELECT ticker, AVG(adjusted_cost_basis_per_share) as avg_cost_basis
        FROM stock_grants
        GROUP BY ticker
        ORDER BY ticker
      `).all() as any[];

      expect(result.length).toBe(2);
      expect(result[0].ticker).toBe('AAPL');
      expect(result[0].avg_cost_basis).toBe(40);
      expect(result[1].ticker).toBe('MSFT');
      expect(result[1].avg_cost_basis).toBe(100);

      db.close();
    });
  });

  describe('Error Recovery', () => {
    test('should rollback transaction on error', async () => {
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$100.00 USD', '$50.00 USD', '$10.00 USD', 5, '$20.00 USD', '$100.00 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const grants = parseMorganStanleyExcel(buffer);

      const db = await getDb();
      const countBefore = db.prepare('SELECT COUNT(*) as count FROM stock_grants').get() as any;

      try {
        const insertStmt = db.prepare(`
          INSERT INTO stock_grants (
            ticker, acquisition_date, lot_number, capital_gain_impact,
            adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
            total_shares, current_price_per_share, current_value
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = db.transaction((grants: any) => {
          for (const grant of grants) {
            insertStmt.run(
              grant.ticker,
              grant.acquisitionDate.toISOString(),
              grant.lotNumber,
              grant.capitalGainImpact,
              grant.adjustedGainLoss,
              grant.adjustedCostBasis,
              grant.adjustedCostBasisPerShare,
              grant.totalShares,
              grant.currentPricePerShare,
              grant.currentValue
            );
          }
          // Simulate error
          throw new Error('Simulated error');
        });

        insertMany(grants);
      } catch (error) {
        // Expected error
      }

      const countAfter = db.prepare('SELECT COUNT(*) as count FROM stock_grants').get() as any;

      // Count should be the same (transaction rolled back)
      expect(countAfter.count).toBe(countBefore.count);

      db.close();
    });
  });
});
