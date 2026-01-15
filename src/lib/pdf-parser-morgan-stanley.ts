/**
 * Morgan Stanley PDF Statement Parser
 * Parses PDF statements to extract holdings and transaction data
 */

export interface Holding {
  ticker: string;
  acquisition_date: string;
  lot_number: number;
  capital_gain_impact: string;
  adjusted_gain_loss: number;
  adjusted_cost_basis: number;
  adjusted_cost_basis_per_share: number;
  total_shares: number;
  current_price_per_share: number;
  current_value: number;
}

export interface Transaction {
  entry_date: string;
  activity_type: string;
  ticker: string;
  lot_number?: number;
  num_shares?: number;
  share_price?: number;
  book_value?: number;
  market_value?: number;
  cash_value?: number;
}

/**
 * Parse USD currency string to number
 */
function parseUSD(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[\$,USD\s]/g, '').trim()) || 0;
}

/**
 * Parse date in MM-DD-YYYY or DD-Mon-YYYY format to YYYY-MM-DD
 */
function parseDate(dateStr: string): string {
  if (!dateStr) return '';

  // Handle DD-Mon-YYYY format (e.g., "16-Apr-2019")
  const monthMap: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    May: '05', Jun: '06', Jul: '07', Aug: '08',
    Sep: '09', Oct: '10', Nov: '11', Dec: '12'
  };

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [day, monthStr, year] = parts;
    const month = monthMap[monthStr];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  // Handle MM/DD/YYYY or DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Assume MM/DD/YYYY format
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return dateStr;
}

/**
 * Parse holdings from the "Summary of Stock/Shares Holdings" section
 */
export function parseHoldings(pdfText: string): Holding[] {
  const holdings: Holding[] = [];
  const lines = pdfText.split('\n');

  console.log(`[parseHoldings] Processing ${lines.length} lines`);

  // Find the holdings section - look for "Summary of Stock/Shares Holdings"
  let inHoldingsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    // Detect holdings section start
    if (line.includes('Summary of Stock') || line.includes('Summary of Long Share Holding')) {
      inHoldingsSection = true;
      console.log(`[parseHoldings] Found holdings section at line ${i}`);
      continue;
    }

    // Skip page markers and headers that repeat across pages
    if (line.startsWith('Page ') ||
        line.includes('Current Value Current Price') ||
        line.includes('Microsoft Stock Awards')) {
      continue;
    }

    // Stop at Activity section (section header on its own line)
    if ((line === 'Activity' || line.startsWith('Activity Entry Date')) && inHoldingsSection) {
      console.log(`[parseHoldings] Stopping at Activity section at line ${i}`);
      break;
    }

    // Parse holding lines
    // Format: MSFT 13-Mar-2020 27 Long Term $67.72 USD $31.51 USD $145.88 USD 0.216 $459.38 USD $99.23 USD
    if (inHoldingsSection && line.startsWith('MSFT') && line.includes('USD')) {
      const parts = line.split(/\s+/);

      try {
        let idx = 0;
        const ticker = parts[idx++]; // MSFT
        const acquisitionDate = parseDate(parts[idx++]); // 13-Mar-2020
        const lotNumber = parseInt(parts[idx++]) || 0; // 27

        // Get Long/Short Term
        let capitalGainImpact = 'Long Term';
        if (parts[idx] === 'Short' && parts[idx + 1] === 'Term') {
          capitalGainImpact = 'Short Term';
          idx += 2;
        } else if (parts[idx] === 'Long' && parts[idx + 1] === 'Term') {
          idx += 2;
        }

        // Now parse the USD values in order
        const currentValue = parseUSD(parts[idx++] + ' ' + parts[idx++]); // $67.72 USD
        const adjustedCostBasis = parseUSD(parts[idx++] + ' ' + parts[idx++]); // $31.51 USD
        const adjustedCostBasisPerShare = parseUSD(parts[idx++] + ' ' + parts[idx++]); // $145.88 USD

        // Parse shares - should be a number without USD
        const sharesStr = parts[idx++];
        const totalShares = parseFloat(sharesStr) || 0; // 0.216

        const currentPricePerShare = parseUSD(parts[idx++] + ' ' + parts[idx++]); // $459.38 USD
        const adjustedGainLoss = parseUSD(parts[idx++] + ' ' + parts[idx++]); // $99.23 USD

        console.log(`[parseHoldings] Parsed: ${ticker} date ${acquisitionDate}, lot ${lotNumber}, ${totalShares} shares`);

        holdings.push({
          ticker,
          acquisition_date: acquisitionDate,
          lot_number: lotNumber,
          capital_gain_impact: capitalGainImpact,
          adjusted_gain_loss: adjustedGainLoss,
          adjusted_cost_basis: adjustedCostBasis,
          adjusted_cost_basis_per_share: adjustedCostBasisPerShare,
          total_shares: totalShares,
          current_price_per_share: currentPricePerShare,
          current_value: currentValue,
        });
      } catch (error) {
        console.error('Error parsing holding line:', line, error);
      }
    }
  }

  console.log(`[parseHoldings] Found ${holdings.length} holdings`);
  return holdings;
}

/**
 * Parse transactions from the "Activity" section
 */
export function parseTransactions(pdfText: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = pdfText.split('\n');

  console.log(`[parseTransactions] Processing ${lines.length} lines`);

  // Find the Activity section
  let inActivitySection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Detect Activity section start
    if (line === 'Activity' || line.startsWith('Activity Entry Date')) {
      inActivitySection = true;
      console.log(`[parseTransactions] Found Activity section at line ${i}`);
      continue;
    }

    // Skip page markers and headers
    if (line.startsWith('Page ') ||
        line.includes('Activity Entry Date') ||
        line.includes('Account Summary')) {
      continue;
    }

    // Parse transaction lines - they should contain a date and MSFT
    if (inActivitySection && line.includes('MSFT')) {
      // Extract date (DD-Mon-YYYY format)
      const dateMatch = line.match(/(\d{2}-[A-Za-z]{3}-\d{4})/);
      if (!dateMatch) {
        console.log(`[parseTransactions] No date found in line: ${line.substring(0, 80)}`);
        continue;
      }

      const entryDate = parseDate(dateMatch[1]);

      // Define activity types to look for
      const activityTypes = [
        'Opening Balance',
        'Opening Value',
        'Release',
        'Dividend (Cash)',
        'You bought (dividend)',
        'Withholding',
        'Sale',
        'Sold',
        'Closing Value',
        'IRS Nonresident Alien Withholding',
        'Historical Transaction',
        'Tax Withholding',
        'Stock Plan Activity'
      ];

      // Extract activity type
      let activityType = '';
      for (const type of activityTypes) {
        if (line.includes(type)) {
          activityType = type;
          break;
        }
      }

      if (!activityType) {
        console.log(`[parseTransactions] No activity type found in line: ${line.substring(0, 80)}`);
        continue;
      }

      try {
        // Extract all USD amounts
        const usdAmounts = [...line.matchAll(/\$(-?[\d,]+\.?\d*)\s*USD/g)].map(m => parseUSD(m[0]));

        // Extract shares (number followed by optional decimal)
        const sharesMatch = line.match(/([\d,]+\.?\d+)(?=\s*(?:\$|MSFT|shares?|shs?))/);
        const numShares = sharesMatch ? parseFloat(sharesMatch[1].replace(/,/g, '')) : undefined;

        const transaction: Transaction = {
          entry_date: entryDate,
          activity_type: activityType,
          ticker: 'MSFT',
          num_shares: numShares,
        };

        // Assign USD amounts based on activity type
        if (activityType.includes('Dividend') || activityType.includes('Withholding')) {
          // For dividends/withholding, usually just one cash value
          transaction.cash_value = usdAmounts[0];
        } else if (activityType.includes('Sale') || activityType.includes('Sold')) {
          // For sales: might have share price and total value
          if (usdAmounts.length >= 2) {
            transaction.share_price = usdAmounts[0];
            transaction.cash_value = usdAmounts[1];
          } else if (usdAmounts.length === 1) {
            transaction.cash_value = usdAmounts[0];
          }
        } else if (activityType.includes('bought')) {
          // For purchases
          if (usdAmounts.length >= 2) {
            transaction.share_price = usdAmounts[0];
            transaction.book_value = usdAmounts[1];
          }
        } else {
          // For other types, assign what we have
          if (usdAmounts.length > 0) {
            transaction.cash_value = usdAmounts[0];
          }
          if (usdAmounts.length > 1) {
            transaction.market_value = usdAmounts[1];
          }
        }

        console.log(`[parseTransactions] Parsed: ${entryDate} ${activityType} ${numShares || 0} shares, $${transaction.cash_value || 0}`);
        transactions.push(transaction);
      } catch (error) {
        console.error('Error parsing transaction line:', line, error);
      }
    }
  }

  console.log(`[parseTransactions] Found ${transactions.length} transactions`);
  return transactions;
}

/**
 * Main parser function - combines holdings and transactions
 */
export function parseMorganStanleyPDF(pdfText: string): {
  holdings: Holding[];
  transactions: Transaction[];
} {
  return {
    holdings: parseHoldings(pdfText),
    transactions: parseTransactions(pdfText),
  };
}
