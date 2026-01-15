import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

describe('API Endpoints', () => {
  const baseUrl = 'http://localhost:3000';
  const testDbPath = path.join(process.cwd(), 'data', 'finance.db');

  beforeEach(async () => {
    // Clear database before each test
    try {
      await fetch(`${baseUrl}/api/grants`, { method: 'DELETE' });
    } catch (error) {
      // Server might not be running, that's okay for these tests
    }
  });

  describe('POST /api/import', () => {
    test('should reject request without file', async () => {
      const formData = new FormData();

      const response = await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('No file provided');
    });

    test('should successfully import valid Excel file', async () => {
      // Create a test Excel file
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$8,392.63 USD', '$2,905.81 USD', '$121.05 USD', 24.005, '$470.67 USD', '$11,298.43 USD'],
        [43616, 7, 'Long Term', '$1,034.82 USD', '$377.19 USD', '$125.73 USD', 3, '$470.67 USD', '$1,412.01 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const formData = new FormData();
      formData.append('file', blob, 'test.xlsx');

      const response = await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.count).toBe(2);
      expect(responseData.message).toContain('Imported 2 stock grants');
    });

    test('should return error for invalid Excel file', async () => {
      const invalidData = Buffer.from('This is not an Excel file');
      const blob = new Blob([invalidData], { type: 'application/octet-stream' });

      const formData = new FormData();
      formData.append('file', blob, 'invalid.xlsx');

      const response = await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to import file');
    });

    test('should return error for Excel file with no data', async () => {
      // Create an Excel file with only headers
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const formData = new FormData();
      formData.append('file', blob, 'empty.xlsx');

      const response = await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('No data found in file');
    });

    test('should handle multiple imports (cumulative)', async () => {
      // First import
      const workbook1 = XLSX.utils.book_new();
      const data1 = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$100.00 USD', '$50.00 USD', '$10.00 USD', 5, '$20.00 USD', '$100.00 USD'],
      ];
      const worksheet1 = XLSX.utils.aoa_to_sheet(data1);
      XLSX.utils.book_append_sheet(workbook1, worksheet1, 'Sheet1');
      const buffer1 = XLSX.write(workbook1, { type: 'buffer', bookType: 'xlsx' });

      const blob1 = new Blob([buffer1], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const formData1 = new FormData();
      formData1.append('file', blob1, 'test1.xlsx');

      await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        body: formData1,
      });

      // Second import
      const workbook2 = XLSX.utils.book_new();
      const data2 = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: AAPL', '', '', '', '', '', '', '', ''],
        [43616, 7, 'Long Term', '$200.00 USD', '$100.00 USD', '$20.00 USD', 5, '$40.00 USD', '$200.00 USD'],
      ];
      const worksheet2 = XLSX.utils.aoa_to_sheet(data2);
      XLSX.utils.book_append_sheet(workbook2, worksheet2, 'Sheet1');
      const buffer2 = XLSX.write(workbook2, { type: 'buffer', bookType: 'xlsx' });

      const blob2 = new Blob([buffer2], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const formData2 = new FormData();
      formData2.append('file', blob2, 'test2.xlsx');

      await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        body: formData2,
      });

      // Check total count
      const response = await fetch(`${baseUrl}/api/grants`);
      const data = await response.json();

      expect(data.count).toBe(2);
    });
  });

  describe('GET /api/grants', () => {
    beforeEach(async () => {
      // Import some test data
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$100.00 USD', '$50.00 USD', '$10.00 USD', 5, '$20.00 USD', '$100.00 USD'],
        [43616, 7, 'Long Term', '$200.00 USD', '$100.00 USD', '$20.00 USD', 10, '$30.00 USD', '$300.00 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const formData = new FormData();
      formData.append('file', blob, 'test.xlsx');

      await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        body: formData,
      });
    });

    test('should return all grants', async () => {
      const response = await fetch(`${baseUrl}/api/grants`);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });

    test('should return grants with all fields', async () => {
      const response = await fetch(`${baseUrl}/api/grants`);
      const data = await response.json();

      const grant = data.data[0];

      expect(grant).toHaveProperty('id');
      expect(grant).toHaveProperty('ticker');
      expect(grant).toHaveProperty('acquisition_date');
      expect(grant).toHaveProperty('lot_number');
      expect(grant).toHaveProperty('capital_gain_impact');
      expect(grant).toHaveProperty('adjusted_gain_loss');
      expect(grant).toHaveProperty('adjusted_cost_basis');
      expect(grant).toHaveProperty('adjusted_cost_basis_per_share');
      expect(grant).toHaveProperty('total_shares');
      expect(grant).toHaveProperty('current_price_per_share');
      expect(grant).toHaveProperty('current_value');
      expect(grant).toHaveProperty('import_source');
      expect(grant).toHaveProperty('created_at');
    });

    test('should return grants ordered by acquisition_date DESC', async () => {
      const response = await fetch(`${baseUrl}/api/grants`);
      const data = await response.json();

      const grants = data.data;

      // Check if sorted by acquisition_date DESC
      for (let i = 0; i < grants.length - 1; i++) {
        const currentDate = new Date(grants[i].acquisition_date);
        const nextDate = new Date(grants[i + 1].acquisition_date);
        expect(currentDate >= nextDate).toBe(true);
      }
    });

    test('should return empty array when no data', async () => {
      // Clear all data
      await fetch(`${baseUrl}/api/grants`, { method: 'DELETE' });

      const response = await fetch(`${baseUrl}/api/grants`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.count).toBe(0);
    });
  });

  describe('DELETE /api/grants', () => {
    beforeEach(async () => {
      // Import some test data
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$100.00 USD', '$50.00 USD', '$10.00 USD', 5, '$20.00 USD', '$100.00 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const formData = new FormData();
      formData.append('file', blob, 'test.xlsx');

      await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        body: formData,
      });
    });

    test('should delete all grants', async () => {
      const response = await fetch(`${baseUrl}/api/grants`, { method: 'DELETE' });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toBe('All grants deleted');

      // Verify deletion
      const getResponse = await fetch(`${baseUrl}/api/grants`);
      const getData = await getResponse.json();
      expect(getData.count).toBe(0);
    });

    test('should succeed even when no data exists', async () => {
      // Delete once
      await fetch(`${baseUrl}/api/grants`, { method: 'DELETE' });

      // Delete again
      const response = await fetch(`${baseUrl}/api/grants`, { method: 'DELETE' });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await fetch(`${baseUrl}/api/nonexistent`);
      expect(response.status).toBe(404);
    });

    test('should handle malformed requests gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'data' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Content-Type Headers', () => {
    test('POST /api/import should accept multipart/form-data', async () => {
      const workbook = XLSX.utils.book_new();
      const data = [
        ['Acquisition Date', 'Lot', 'Capital Gain Impact', 'Adjusted Gain/Loss', 'Adjusted Cost Basis *', 'Adjusted Cost Basis Per Share *', 'Total Shares You Hold', 'Current Price per Share', 'Current Value'],
        ['Type of Money: MSFT', '', '', '', '', '', '', '', ''],
        [43571, 6, 'Long Term', '$100.00 USD', '$50.00 USD', '$10.00 USD', 5, '$20.00 USD', '$100.00 USD'],
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const formData = new FormData();
      formData.append('file', blob, 'test.xlsx');

      const response = await fetch(`${baseUrl}/api/import`, {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    test('GET /api/grants should return JSON', async () => {
      const response = await fetch(`${baseUrl}/api/grants`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
