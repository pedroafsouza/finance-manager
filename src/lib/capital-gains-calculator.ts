/**
 * Danish Capital Gains Calculator (Box 454 - Rubrik 454)
 * Calculates net profit/loss from stock sales for Danish tax returns
 * Supports both Gennemsnitsmetoden (Average Cost) and Lot-Based methods
 */

import { getDb } from './db';
import { convertUsdToDkk } from './exchange-rates';
import { getYearDateRange } from './utils/date-filters';

export interface SaleTransaction {
  id: number;
  entry_date: string;
  activity_type: string;
  ticker: string;
  lot_number?: number;
  num_shares: number;
  share_price: number;
  cash_value: number;
  sale_value_dkk?: number;
  cost_basis_dkk?: number;
  gain_loss_dkk?: number;
  exchange_rate?: number;
  cost_basis_method?: string;
}

export interface PortfolioPosition {
  ticker: string;
  total_shares: number;
  cost_basis_method: string;
  weighted_average_cost_per_share?: number;
  lots: {
    lot_number: number;
    acquisition_date: string;
    shares: number;
    cost_per_share: number;
    capital_gain_impact: string; // 'Short Term' or 'Long Term'
  }[];
}

export interface CapitalGainsReport {
  year: number;

  // Box 454: Net capital gains (positive) or losses (negative)
  netGainLossDkk: number;
  netGainLossUsd: number;

  // Breakdown by term
  shortTermGainLossDkk: number;
  shortTermGainLossUsd: number;
  longTermGainLossDkk: number;
  longTermGainLossUsd: number;

  // Breakdown by ticker
  byTicker: {
    [ticker: string]: {
      netGainLossDkk: number;
      netGainLossUsd: number;
      sharesSold: number;
      transactionCount: number;
      costBasisMethod: string;
    };
  };

  // Transaction details
  salesTransactions: SaleTransaction[];
}

/**
 * Get current portfolio positions with cost basis method
 */
export async function getPortfolioPositions(): Promise<PortfolioPosition[]> {
  const db = await getDb();

  try {
    const holdings = db.prepare(`
      SELECT
        ticker,
        lot_number,
        acquisition_date,
        total_shares,
        adjusted_cost_basis_per_share,
        capital_gain_impact,
        cost_basis_method,
        weighted_average_cost_per_share
      FROM holdings
      WHERE total_shares > 0
      ORDER BY ticker, acquisition_date ASC
    `).all() as any[];

    // Group by ticker
    const positionsByTicker: { [ticker: string]: PortfolioPosition } = {};

    for (const holding of holdings) {
      const ticker = holding.ticker;

      if (!positionsByTicker[ticker]) {
        positionsByTicker[ticker] = {
          ticker,
          total_shares: 0,
          cost_basis_method: holding.cost_basis_method || 'lot-based',
          weighted_average_cost_per_share: holding.weighted_average_cost_per_share,
          lots: [],
        };
      }

      positionsByTicker[ticker].total_shares += holding.total_shares;
      positionsByTicker[ticker].lots.push({
        lot_number: holding.lot_number,
        acquisition_date: holding.acquisition_date,
        shares: holding.total_shares,
        cost_per_share: holding.adjusted_cost_basis_per_share,
        capital_gain_impact: holding.capital_gain_impact,
      });
    }

    return Object.values(positionsByTicker);
  } finally {
    db.close();
  }
}

/**
 * Get all sale transactions for a specific year
 */
export async function getSaleTransactions(year: number): Promise<SaleTransaction[]> {
  const db = await getDb();

  try {
    const { startDate, endDate } = getYearDateRange(year);

    const sales = db.prepare(`
      SELECT * FROM transactions
      WHERE activity_type IN ('Sale', 'Sold')
        AND entry_date >= ?
        AND entry_date <= ?
      ORDER BY entry_date ASC
    `).all(startDate, endDate) as SaleTransaction[];

    // Convert USD to DKK for each transaction
    for (const sale of sales) {
      const { amountDkk, rate } = await convertUsdToDkk(
        Math.abs(sale.cash_value),
        sale.entry_date
      );
      sale.sale_value_dkk = amountDkk;
      sale.exchange_rate = rate;
    }

    return sales;
  } finally {
    db.close();
  }
}

/**
 * Calculate cost basis for a sale using Gennemsnitsmetoden (Average Cost Method)
 */
function calculateAverageCostBasis(
  position: PortfolioPosition,
  sharesSold: number
): number {
  if (!position.weighted_average_cost_per_share) {
    // If no average calculated, compute from lots
    const totalCost = position.lots.reduce(
      (sum, lot) => sum + lot.shares * lot.cost_per_share,
      0
    );
    const totalShares = position.total_shares;
    position.weighted_average_cost_per_share = totalCost / totalShares;
  }

  return position.weighted_average_cost_per_share * sharesSold;
}

/**
 * Calculate cost basis for a sale using Lot-Based Method (FIFO)
 */
function calculateLotBasedCostBasis(
  position: PortfolioPosition,
  sharesSold: number,
  lotNumber?: number
): { costBasis: number; term: 'Short Term' | 'Long Term' } {
  let remainingShares = sharesSold;
  let totalCost = 0;
  let term: 'Short Term' | 'Long Term' = 'Long Term';

  // If lot number specified, use that lot
  if (lotNumber !== undefined) {
    const lot = position.lots.find((l) => l.lot_number === lotNumber);
    if (lot) {
      totalCost = lot.cost_per_share * sharesSold;
      term = lot.capital_gain_impact === 'Short Term' ? 'Short Term' : 'Long Term';
      return { costBasis: totalCost, term };
    }
  }

  // Otherwise use FIFO (First In, First Out)
  for (const lot of position.lots) {
    if (remainingShares <= 0) break;

    const sharesToUse = Math.min(remainingShares, lot.shares);
    totalCost += sharesToUse * lot.cost_per_share;
    term = lot.capital_gain_impact === 'Short Term' ? 'Short Term' : 'Long Term';
    remainingShares -= sharesToUse;
  }

  return { costBasis: totalCost, term };
}

/**
 * Calculate capital gains report for Danish tax return
 */
export async function calculateCapitalGainsReport(year: number): Promise<CapitalGainsReport> {
  // Get portfolio positions and cost basis methods
  const positions = await getPortfolioPositions();
  const positionsByTicker: { [ticker: string]: PortfolioPosition } = {};
  for (const position of positions) {
    positionsByTicker[position.ticker] = position;
  }

  // Get all sale transactions
  const salesTransactions = await getSaleTransactions(year);

  // Calculate gains/losses for each sale
  let netGainLossDkk = 0;
  let netGainLossUsd = 0;
  let shortTermGainLossDkk = 0;
  let shortTermGainLossUsd = 0;
  let longTermGainLossDkk = 0;
  let longTermGainLossUsd = 0;

  const byTicker: CapitalGainsReport['byTicker'] = {};

  for (const sale of salesTransactions) {
    const ticker = sale.ticker;
    const position = positionsByTicker[ticker];

    if (!position) {
      console.warn(`No position found for ticker ${ticker}`);
      continue;
    }

    const sharesSold = Math.abs(sale.num_shares);
    const saleValueUsd = Math.abs(sale.cash_value);
    const saleValueDkk = sale.sale_value_dkk || 0;
    const exchangeRate = sale.exchange_rate || 6.9;

    let costBasisUsd = 0;
    let costBasisDkk = 0;
    let term: 'Short Term' | 'Long Term' = 'Long Term';

    // Calculate cost basis based on method
    if (position.cost_basis_method === 'average-cost') {
      costBasisUsd = calculateAverageCostBasis(position, sharesSold);
      costBasisDkk = costBasisUsd * exchangeRate;
      sale.cost_basis_method = 'average-cost';
    } else {
      const result = calculateLotBasedCostBasis(position, sharesSold, sale.lot_number);
      costBasisUsd = result.costBasis;
      costBasisDkk = costBasisUsd * exchangeRate;
      term = result.term;
      sale.cost_basis_method = 'lot-based';
    }

    // Calculate gain/loss
    const gainLossUsd = saleValueUsd - costBasisUsd;
    const gainLossDkk = saleValueDkk - costBasisDkk;

    sale.cost_basis_dkk = costBasisDkk;
    sale.gain_loss_dkk = gainLossDkk;

    // Aggregate
    netGainLossUsd += gainLossUsd;
    netGainLossDkk += gainLossDkk;

    if (term === 'Short Term') {
      shortTermGainLossUsd += gainLossUsd;
      shortTermGainLossDkk += gainLossDkk;
    } else {
      longTermGainLossUsd += gainLossUsd;
      longTermGainLossDkk += gainLossDkk;
    }

    // By ticker
    if (!byTicker[ticker]) {
      byTicker[ticker] = {
        netGainLossDkk: 0,
        netGainLossUsd: 0,
        sharesSold: 0,
        transactionCount: 0,
        costBasisMethod: position.cost_basis_method,
      };
    }

    byTicker[ticker].netGainLossDkk += gainLossDkk;
    byTicker[ticker].netGainLossUsd += gainLossUsd;
    byTicker[ticker].sharesSold += sharesSold;
    byTicker[ticker].transactionCount += 1;
  }

  return {
    year,
    netGainLossDkk,
    netGainLossUsd,
    shortTermGainLossDkk,
    shortTermGainLossUsd,
    longTermGainLossDkk,
    longTermGainLossUsd,
    byTicker,
    salesTransactions,
  };
}

/**
 * Update cost basis method for a ticker
 */
export async function updateCostBasisMethod(
  ticker: string,
  method: 'lot-based' | 'average-cost'
): Promise<void> {
  const db = await getDb();

  try {
    // If switching to average-cost, calculate the weighted average
    if (method === 'average-cost') {
      const holdings = db.prepare(`
        SELECT total_shares, adjusted_cost_basis_per_share
        FROM holdings
        WHERE ticker = ? AND total_shares > 0
      `).all(ticker) as any[];

      let totalCost = 0;
      let totalShares = 0;

      for (const holding of holdings) {
        totalCost += holding.total_shares * holding.adjusted_cost_basis_per_share;
        totalShares += holding.total_shares;
      }

      const weightedAverage = totalShares > 0 ? totalCost / totalShares : 0;

      // Update all holdings for this ticker
      db.prepare(`
        UPDATE holdings
        SET cost_basis_method = ?,
            weighted_average_cost_per_share = ?,
            weighted_average_updated_at = CURRENT_TIMESTAMP
        WHERE ticker = ?
      `).run(method, weightedAverage, ticker);
    } else {
      // Just update the method
      db.prepare(`
        UPDATE holdings
        SET cost_basis_method = ?
        WHERE ticker = ?
      `).run(method, ticker);
    }
  } finally {
    db.close();
  }
}
