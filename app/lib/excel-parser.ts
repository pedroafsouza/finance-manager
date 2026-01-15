import * as XLSX from 'xlsx';

export interface StockGrant {
  ticker: string;
  acquisitionDate: Date;
  lotNumber: number;
  capitalGainImpact: string;
  adjustedGainLoss: number;
  adjustedCostBasis: number;
  adjustedCostBasisPerShare: number;
  totalShares: number;
  currentPricePerShare: number;
  currentValue: number;
}

// Convert Excel serial date to JavaScript Date
const excelSerialToDate = (serial: number): Date => {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
};

// Parse monetary value like "$8,392.63 USD" to number
const parseMonetary = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;

  const cleaned = value.toString()
    .replace(/\$/g, '')
    .replace(/USD/g, '')
    .replace(/,/g, '')
    .trim();

  return parseFloat(cleaned) || 0;
};

// Parse shares value which can be a number or empty
const parseShares = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  return parseFloat(value.toString().replace(/,/g, '')) || 0;
};

export const parseMorganStanleyExcel = (buffer: Buffer): StockGrant[] => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  // Convert to array of arrays
  const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

  const grants: StockGrant[] = [];
  let currentTicker = '';

  // Skip header row (index 0) and process from index 1
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Check if this is a ticker row
    if (row[0] && typeof row[0] === 'string' && row[0].includes('Type of Money:')) {
      currentTicker = row[0].split(':')[1]?.trim() || '';
      continue;
    }

    // Skip empty rows
    if (!row[0] || row[0] === '') continue;

    // Parse data row
    try {
      const acquisitionDateRaw = row[0];
      let acquisitionDate: Date;

      // Handle date parsing
      if (typeof acquisitionDateRaw === 'number') {
        acquisitionDate = excelSerialToDate(acquisitionDateRaw);
      } else if (typeof acquisitionDateRaw === 'string') {
        acquisitionDate = new Date(acquisitionDateRaw);
      } else {
        continue; // Skip invalid rows
      }

      const grant: StockGrant = {
        ticker: currentTicker,
        acquisitionDate,
        lotNumber: parseInt(row[1]) || 0,
        capitalGainImpact: row[2] || '',
        adjustedGainLoss: parseMonetary(row[3]),
        adjustedCostBasis: parseMonetary(row[4]),
        adjustedCostBasisPerShare: parseMonetary(row[5]),
        totalShares: parseShares(row[6]),
        currentPricePerShare: parseMonetary(row[7]),
        currentValue: parseMonetary(row[8]),
      };

      grants.push(grant);
    } catch (error) {
      console.error(`Error parsing row ${i}:`, error);
      continue;
    }
  }

  return grants;
};
