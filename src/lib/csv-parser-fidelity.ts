/**
 * Fidelity CSV Parser
 * Parses Fidelity CSV exports for currently held and previously held shares
 */

export interface FidelityCurrentHolding {
  ticker: string;
  acquisition_date: string;
  quantity: number;
  cost_basis: number;
  cost_basis_per_share: number;
  current_value: number;
  gain_loss: number;
  holding_period: string; // "Short" or "Long"
  share_source: string;
}

export interface FidelityPreviousHolding {
  ticker: string;
  acquisition_date: string;
  quantity: number;
  date_sold: string;
  proceeds: number;
  cost_basis: number;
  gain_loss: number;
  term: string; // "SHORT" or "LONG"
}

/**
 * Parse date in various Fidelity formats to YYYY-MM-DD
 * Handles: "Dec-15-2025", "OCT/16/2023"
 */
function parseDate(dateStr: string): string {
  if (!dateStr || dateStr === '-') return '';

  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04',
    may: '05', jun: '06', jul: '07', aug: '08',
    sep: '09', oct: '10', nov: '11', dec: '12'
  };

  // Handle "Dec-15-2025" format (Mon-DD-YYYY)
  const dashMatch = dateStr.match(/^([A-Za-z]{3})-(\d{2})-(\d{4})$/);
  if (dashMatch) {
    const [, monthStr, day, year] = dashMatch;
    const month = monthMap[monthStr.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Handle "OCT/16/2023" format (MON/DD/YYYY)
  const slashMatch = dateStr.match(/^([A-Za-z]{3})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, monthStr, day, year] = slashMatch;
    const month = monthMap[monthStr.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  return dateStr;
}

/**
 * Parse numeric value from CSV (handles commas and empty values)
 */
function parseNumber(value: string): number {
  if (!value || value === '-') return 0;
  return parseFloat(value.replace(/,/g, '')) || 0;
}

/**
 * Parse CSV content into rows
 */
function parseCSV(content: string): string[][] {
  const lines = content.split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Simple CSV parsing (handles basic cases)
    const cells = trimmed.split(',').map(cell => cell.trim());
    rows.push(cells);
  }

  return rows;
}

/**
 * Parse currently held shares CSV
 * Headers: Date acquired,Quantity,Cost basis,Cost basis/share,Value,Gain/loss,Sale availability date,Transfer availability date,Grant date,Share source,Holding period
 */
export function parseCurrentHoldings(csvContent: string, ticker: string = 'UNKNOWN'): FidelityCurrentHolding[] {
  const rows = parseCSV(csvContent);
  const holdings: FidelityCurrentHolding[] = [];

  if (rows.length < 2) return holdings;

  // Skip header row and footer rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows, footer notes, or rows that don't have data
    if (row.length < 6 || !row[0] || row[0].startsWith('The values')) continue;
    
    // Check if first column looks like a date
    if (!row[0].match(/^[A-Za-z]{3}[-\/]\d{2}[-\/]\d{4}$/)) continue;

    try {
      const holding: FidelityCurrentHolding = {
        ticker,
        acquisition_date: parseDate(row[0]),
        quantity: parseNumber(row[1]),
        cost_basis: parseNumber(row[2]),
        cost_basis_per_share: parseNumber(row[3]),
        current_value: parseNumber(row[4]),
        gain_loss: parseNumber(row[5]),
        share_source: row[9] || '',
        holding_period: row[10] || 'Short',
      };

      if (holding.quantity > 0) {
        holdings.push(holding);
      }
    } catch (error) {
      console.error('Error parsing current holding row:', row, error);
    }
  }

  return holdings;
}

/**
 * Parse previously held shares CSV
 * Headers: Date acquired,Quantity,Date sold or transferred,Proceeds,Cost basis,Gain/loss,Term
 */
export function parsePreviousHoldings(csvContent: string, ticker: string = 'UNKNOWN'): FidelityPreviousHolding[] {
  const rows = parseCSV(csvContent);
  const holdings: FidelityPreviousHolding[] = [];

  if (rows.length < 2) return holdings;

  // Skip header row and footer rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows, footer notes, or rows without enough columns
    if (row.length < 6 || !row[0] || row[0].startsWith('The values')) continue;
    
    // Check if first column looks like a date
    if (!row[0].match(/^[A-Za-z]{3}[-\/]\d{2}[-\/]\d{4}$/)) continue;

    try {
      const holding: FidelityPreviousHolding = {
        ticker,
        acquisition_date: parseDate(row[0]),
        quantity: parseNumber(row[1]),
        date_sold: parseDate(row[2]),
        proceeds: parseNumber(row[3]),
        cost_basis: parseNumber(row[4]),
        gain_loss: parseNumber(row[5]),
        term: (row[6] || 'SHORT').toUpperCase(),
      };

      if (holding.quantity > 0) {
        holdings.push(holding);
      }
    } catch (error) {
      console.error('Error parsing previous holding row:', row, error);
    }
  }

  return holdings;
}

/**
 * Convert Fidelity holding period to capital gain impact string
 */
export function toCapitalGainImpact(holdingPeriod: string): string {
  const period = holdingPeriod.toLowerCase();
  if (period === 'long') return 'Long Term';
  return 'Short Term';
}
