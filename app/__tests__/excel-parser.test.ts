import { describe, expect, test, beforeAll } from 'vitest';
import { parseMorganStanleyExcel } from '../lib/excel-parser';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

describe('Excel Parser', () => {
  let testBuffer: Buffer;

  beforeAll(() => {
    // Read the actual test file
    const filePath = path.resolve(__dirname, '../../data/morgan-stanley.xlsx');
    testBuffer = fs.readFileSync(filePath);
  });

  describe('parseMorganStanleyExcel', () => {
    test('should successfully parse Morgan Stanley Excel file', () => {
      const grants = parseMorganStanleyExcel(testBuffer);

      expect(grants).toBeDefined();
      expect(Array.isArray(grants)).toBe(true);
      expect(grants.length).toBeGreaterThan(0);
    });

    test('should parse correct number of records', () => {
      const grants = parseMorganStanleyExcel(testBuffer);

      // Based on the actual file, we know it has 151 records
      expect(grants.length).toBe(151);
    });

    test('should extract all required fields', () => {
      const grants = parseMorganStanleyExcel(testBuffer);
      const firstGrant = grants[0];

      expect(firstGrant).toHaveProperty('ticker');
      expect(firstGrant).toHaveProperty('acquisitionDate');
      expect(firstGrant).toHaveProperty('lotNumber');
      expect(firstGrant).toHaveProperty('capitalGainImpact');
      expect(firstGrant).toHaveProperty('adjustedGainLoss');
      expect(firstGrant).toHaveProperty('adjustedCostBasis');
      expect(firstGrant).toHaveProperty('adjustedCostBasisPerShare');
      expect(firstGrant).toHaveProperty('totalShares');
      expect(firstGrant).toHaveProperty('currentPricePerShare');
      expect(firstGrant).toHaveProperty('currentValue');
    });

    test('should parse ticker correctly', () => {
      const grants = parseMorganStanleyExcel(testBuffer);

      // All records should have MSFT ticker based on the test file
      grants.forEach(grant => {
        expect(grant.ticker).toBe('MSFT');
      });
    });

    test('should parse dates as Date objects', () => {
      const grants = parseMorganStanleyExcel(testBuffer);
      const firstGrant = grants[0];

      expect(firstGrant.acquisitionDate).toBeInstanceOf(Date);
      expect(firstGrant.acquisitionDate.getFullYear()).toBeGreaterThan(2000);
    });

    test('should parse monetary values as numbers', () => {
      const grants = parseMorganStanleyExcel(testBuffer);
      const firstGrant = grants[0];

      expect(typeof firstGrant.adjustedGainLoss).toBe('number');
      expect(typeof firstGrant.adjustedCostBasis).toBe('number');
      expect(typeof firstGrant.adjustedCostBasisPerShare).toBe('number');
      expect(typeof firstGrant.currentPricePerShare).toBe('number');
      expect(typeof firstGrant.currentValue).toBe('number');
    });

    test('should parse shares as numbers', () => {
      const grants = parseMorganStanleyExcel(testBuffer);
      const firstGrant = grants[0];

      expect(typeof firstGrant.totalShares).toBe('number');
      expect(firstGrant.totalShares).toBeGreaterThan(0);
    });

    test('should parse lot numbers as integers', () => {
      const grants = parseMorganStanleyExcel(testBuffer);
      const firstGrant = grants[0];

      expect(typeof firstGrant.lotNumber).toBe('number');
      expect(Number.isInteger(firstGrant.lotNumber)).toBe(true);
    });

    test('should parse capital gain impact correctly', () => {
      const grants = parseMorganStanleyExcel(testBuffer);

      grants.forEach(grant => {
        expect(['Long Term', 'Short Term', '']).toContain(grant.capitalGainImpact);
      });
    });

    test('should handle empty rows gracefully', () => {
      // Create a test buffer with empty rows
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$8,392.63 USD', '$2,905.81 USD', '$121.05 USD', 24.005, '$470.67 USD', '$11,298.43 USD'],
        ['', '', '', '', '', '', '', '', ''], // Empty row
        [43616, 7, 'Long Term', '$1,034.82 USD', '$377.19 USD', '$125.73 USD', 3, '$470.67 USD', '$1,412.01 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const grants = parseMorganStanleyExcel(buffer);

      // Should skip empty rows
      expect(grants.length).toBe(2);
    });

    test('should parse all numeric values as numbers', () => {
      const grants = parseMorganStanleyExcel(testBuffer);
      const firstGrant = grants[0];

      // Verify all numeric fields are properly parsed
      expect(typeof firstGrant.totalShares).toBe('number');
      expect(typeof firstGrant.currentPricePerShare).toBe('number');
      expect(typeof firstGrant.currentValue).toBe('number');
      expect(typeof firstGrant.adjustedCostBasis).toBe('number');
      expect(typeof firstGrant.adjustedGainLoss).toBe('number');

      // Verify values are positive (after anonymization, they should still be positive)
      expect(firstGrant.totalShares).toBeGreaterThan(0);
      expect(firstGrant.currentValue).toBeGreaterThan(0);
    });

    test('should handle invalid buffer gracefully', () => {
      const invalidBuffer = Buffer.from('invalid data');

      // Should either throw or return empty array
      try {
        const grants = parseMorganStanleyExcel(invalidBuffer);
        expect(Array.isArray(grants)).toBe(true);
      } catch (error) {
        // This is also acceptable behavior
        expect(error).toBeDefined();
      }
    });

    test('should handle multiple ticker sections', () => {
      // Create a test buffer with multiple tickers
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$100.00 USD', '$50.00 USD', '$10.00 USD', 5, '$30.00 USD', '$150.00 USD'],
        ['Type of Money: AAPL', '', '', '', '', '', '', '', ''],
        [43616, 7, 'Long Term', '$200.00 USD', '$100.00 USD', '$20.00 USD', 5, '$60.00 USD', '$300.00 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const grants = parseMorganStanleyExcel(buffer);

      expect(grants.length).toBe(2);
      expect(grants[0].ticker).toBe('MSFT');
      expect(grants[1].ticker).toBe('AAPL');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very small share amounts', () => {
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$1.00 USD', '$0.50 USD', '$5.00 USD', 0.1, '$10.00 USD', '$1.00 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const grants = parseMorganStanleyExcel(buffer);

      expect(grants.length).toBe(1);
      expect(grants[0].totalShares).toBe(0.1);
    });

    test('should handle large monetary values', () => {
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$1,000,000.00 USD', '$500,000.00 USD', '$100.00 USD', 10000, '$150.00 USD', '$1,500,000.00 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const grants = parseMorganStanleyExcel(buffer);

      expect(grants.length).toBe(1);
      expect(grants[0].currentValue).toBe(1500000);
    });

    test('should handle negative gain/loss values', () => {
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Short Term', '-$100.00 USD', '$150.00 USD', '$15.00 USD', 10, '$5.00 USD', '$50.00 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const grants = parseMorganStanleyExcel(buffer);

      expect(grants.length).toBe(1);
      expect(grants[0].adjustedGainLoss).toBe(-100);
    });
  });
});
