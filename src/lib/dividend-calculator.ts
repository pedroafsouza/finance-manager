/**
 * Danish Dividend Tax Calculator
 * Calculates Box 452 (Gross Foreign Dividends) and Box 496 (Foreign Tax Credit)
 * for Danish tax returns (Selvangivelse)
 */

import { getDb } from './db';
import { convertUsdToDkk } from './exchange-rates';
import { formatDKK, formatUSD } from './utils/currency-formatter';
import { getYearDateRange } from './utils/date-filters';

export interface DividendTransaction {
  id: number;
  entry_date: string;
  activity_type: string;
  ticker: string;
  cash_value: number;
  cash_value_dkk?: number;
  exchange_rate?: number;
}

export interface WithholdingTransaction {
  id: number;
  entry_date: string;
  activity_type: string;
  ticker: string;
  cash_value: number;
  cash_value_dkk?: number;
  exchange_rate?: number;
}

export interface DividendTaxReport {
  year: number;
  // Box 452: Gross Foreign Dividends (before withholding)
  grossDividendsDkk: number;
  grossDividendsUsd: number;

  // Box 496: Foreign Tax Credit (15% for non-US persons)
  foreignTaxCreditDkk: number;
  foreignTaxCreditUsd: number;

  // Actual US tax withheld
  actualWithheldDkk: number;
  actualWithheldUsd: number;

  // Breakdown by ticker
  byTicker: {
    [ticker: string]: {
      grossDividendsDkk: number;
      grossDividendsUsd: number;
      withheldDkk: number;
      withheldUsd: number;
      transactionCount: number;
    };
  };

  // Transaction details
  dividendTransactions: DividendTransaction[];
  withholdingTransactions: WithholdingTransaction[];
}

/**
 * Get all dividend transactions for a specific year
 */
export async function getDividendTransactions(year: number): Promise<DividendTransaction[]> {
  const db = await getDb();

  try {
    const { startDate, endDate } = getYearDateRange(year);

    const dividends = db.prepare(`
      SELECT * FROM transactions
      WHERE activity_type IN ('Dividend (Cash)', 'Dividend')
        AND entry_date >= ?
        AND entry_date <= ?
      ORDER BY entry_date ASC
    `).all(startDate, endDate) as DividendTransaction[];

    // Convert USD to DKK for each transaction
    for (const dividend of dividends) {
      const { amountDkk, rate } = await convertUsdToDkk(
        Math.abs(dividend.cash_value),
        dividend.entry_date
      );
      dividend.cash_value_dkk = amountDkk;
      dividend.exchange_rate = rate;
    }

    return dividends;
  } finally {
    db.close();
  }
}

/**
 * Get all withholding transactions for a specific year
 */
export async function getWithholdingTransactions(year: number): Promise<WithholdingTransaction[]> {
  const db = await getDb();

  try {
    const { startDate, endDate } = getYearDateRange(year);

    const withholdings = db.prepare(`
      SELECT * FROM transactions
      WHERE activity_type IN ('Withholding', 'IRS Nonresident Alien Withholding', 'Tax Withholding')
        AND entry_date >= ?
        AND entry_date <= ?
      ORDER BY entry_date ASC
    `).all(startDate, endDate) as WithholdingTransaction[];

    // Convert USD to DKK for each transaction
    for (const withholding of withholdings) {
      const { amountDkk, rate } = await convertUsdToDkk(
        Math.abs(withholding.cash_value),
        withholding.entry_date
      );
      withholding.cash_value_dkk = amountDkk;
      withholding.exchange_rate = rate;
    }

    return withholdings;
  } finally {
    db.close();
  }
}

/**
 * Calculate dividend tax report for Danish tax return
 *
 * @param year - Tax year
 * @param isUsPerson - Whether the taxpayer is a US Person (affects Box 496 calculation)
 * @param irsActualTaxPaid - If US Person, the actual tax paid to IRS (in USD)
 */
export async function calculateDividendTaxReport(
  year: number,
  isUsPerson: boolean = false,
  irsActualTaxPaid?: number
): Promise<DividendTaxReport> {
  // Get all transactions
  const dividendTransactions = await getDividendTransactions(year);
  const withholdingTransactions = await getWithholdingTransactions(year);

  // Calculate totals
  let grossDividendsUsd = 0;
  let grossDividendsDkk = 0;
  let actualWithheldUsd = 0;
  let actualWithheldDkk = 0;

  const byTicker: DividendTaxReport['byTicker'] = {};

  // Process dividend transactions
  for (const dividend of dividendTransactions) {
    const ticker = dividend.ticker;
    const amountUsd = Math.abs(dividend.cash_value);
    const amountDkk = dividend.cash_value_dkk || 0;

    grossDividendsUsd += amountUsd;
    grossDividendsDkk += amountDkk;

    if (!byTicker[ticker]) {
      byTicker[ticker] = {
        grossDividendsUsd: 0,
        grossDividendsDkk: 0,
        withheldUsd: 0,
        withheldDkk: 0,
        transactionCount: 0,
      };
    }

    byTicker[ticker].grossDividendsUsd += amountUsd;
    byTicker[ticker].grossDividendsDkk += amountDkk;
    byTicker[ticker].transactionCount += 1;
  }

  // Process withholding transactions
  for (const withholding of withholdingTransactions) {
    const ticker = withholding.ticker;
    const amountUsd = Math.abs(withholding.cash_value);
    const amountDkk = withholding.cash_value_dkk || 0;

    actualWithheldUsd += amountUsd;
    actualWithheldDkk += amountDkk;

    if (!byTicker[ticker]) {
      byTicker[ticker] = {
        grossDividendsUsd: 0,
        grossDividendsDkk: 0,
        withheldUsd: 0,
        withheldDkk: 0,
        transactionCount: 0,
      };
    }

    byTicker[ticker].withheldUsd += amountUsd;
    byTicker[ticker].withheldDkk += amountDkk;
  }

  // Calculate Box 496 (Foreign Tax Credit)
  let foreignTaxCreditDkk = 0;
  let foreignTaxCreditUsd = 0;

  if (isUsPerson && irsActualTaxPaid !== undefined) {
    // For US Persons: Use the LESSER of:
    // 1. Actual IRS tax paid
    // 2. 15% of gross dividends (treaty rate)
    const treatyMaxUsd = grossDividendsUsd * 0.15;
    foreignTaxCreditUsd = Math.min(irsActualTaxPaid, treatyMaxUsd);
    foreignTaxCreditDkk = Math.min(irsActualTaxPaid, treatyMaxUsd) * (grossDividendsDkk / grossDividendsUsd);
  } else {
    // For non-US Persons: Use 15% of gross dividends (US-Denmark tax treaty)
    foreignTaxCreditUsd = grossDividendsUsd * 0.15;
    foreignTaxCreditDkk = grossDividendsDkk * 0.15;
  }

  return {
    year,
    grossDividendsDkk,
    grossDividendsUsd,
    foreignTaxCreditDkk,
    foreignTaxCreditUsd,
    actualWithheldDkk,
    actualWithheldUsd,
    byTicker,
    dividendTransactions,
    withholdingTransactions,
  };
}

/**
 * Format DKK amount for display
 * @deprecated Use formatDKK from '@/lib/utils/currency-formatter' instead
 */
export function formatDkk(amount: number): string {
  return formatDKK(amount);
}

/**
 * Format USD amount for display
 * @deprecated Use formatUSD from '@/lib/utils/currency-formatter' instead
 */
export function formatUsd(amount: number): string {
  return formatUSD(amount);
}
