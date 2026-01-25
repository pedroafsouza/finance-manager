/**
 * Exchange Rate Utilities
 * Fetches and caches official USD to DKK exchange rates from Danmarks Nationalbank
 */

import { getDb } from './db';

export interface ExchangeRate {
  date: string; // YYYY-MM-DD format
  usd_to_dkk: number;
  source: string;
  fetched_at: string;
}

/**
 * Fetch exchange rate from Danmarks Nationalbank API
 * API docs: https://www.nationalbanken.dk/en/statistics/exchange-rates
 */
export async function fetchRateFromNationalbank(date: string): Promise<number | null> {
  try {
    // Format: YYYY-MM-DD
    const url = `https://www.nationalbanken.dk/api/currencyrates?date=${date}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Danmarks Nationalbank API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Find USD rate in the response
    // The API returns an array of currency rates
    const usdRate = data.find((rate: any) => rate.code === 'USD');

    if (!usdRate || !usdRate.rate) {
      console.error('USD rate not found in response');
      return null;
    }

    // The API returns rate as "how many DKK per 100 USD"
    // Convert to "how many DKK per 1 USD"
    const dkkPerUsd = usdRate.rate / 100;

    return dkkPerUsd;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

/**
 * Get exchange rate for a specific date, with caching
 * Falls back to manual rate if API fails
 */
export async function getExchangeRate(
  date: string,
  manualRate?: number
): Promise<number> {
  const db = await getDb();

  try {
    // Check if we have cached rate
    const cached = db.prepare(`
      SELECT usd_to_dkk FROM exchange_rates
      WHERE date = ?
      LIMIT 1
    `).get(date) as { usd_to_dkk: number } | undefined;

    if (cached) {
      return cached.usd_to_dkk;
    }

    // Try to fetch from API
    const fetchedRate = await fetchRateFromNationalbank(date);

    if (fetchedRate) {
      // Cache the rate
      db.prepare(`
        INSERT INTO exchange_rates (date, usd_to_dkk, source)
        VALUES (?, ?, 'nationalbanken')
        ON CONFLICT(date) DO UPDATE SET usd_to_dkk = excluded.usd_to_dkk
      `).run(date, fetchedRate);

      return fetchedRate;
    }

    // If API fails and manual rate provided, use it
    if (manualRate) {
      db.prepare(`
        INSERT INTO exchange_rates (date, usd_to_dkk, source)
        VALUES (?, ?, 'manual')
        ON CONFLICT(date) DO UPDATE SET usd_to_dkk = excluded.usd_to_dkk
      `).run(date, manualRate);

      return manualRate;
    }

    // Last resort: use default rate of 6.9
    console.warn(`Using default exchange rate 6.9 for date ${date}`);
    return 6.9;
  } finally {
    db.close();
  }
}

/**
 * Convert USD to DKK using official exchange rate for a specific date
 */
export async function convertUsdToDkk(
  amountUsd: number,
  date: string,
  manualRate?: number
): Promise<{ amountDkk: number; rate: number }> {
  const rate = await getExchangeRate(date, manualRate);
  const amountDkk = amountUsd * rate;

  return { amountDkk, rate };
}

/**
 * Get all cached exchange rates
 */
export async function getCachedRates(limit: number = 100): Promise<ExchangeRate[]> {
  const db = await getDb();

  try {
    const rates = db.prepare(`
      SELECT date, usd_to_dkk, source, fetched_at
      FROM exchange_rates
      ORDER BY date DESC
      LIMIT ?
    `).all(limit) as ExchangeRate[];

    return rates;
  } finally {
    db.close();
  }
}

/**
 * Get the current/latest exchange rate (for today)
 */
export async function getCurrentExchangeRate(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  return await getExchangeRate(today);
}

/**
 * Prefetch exchange rates for a date range
 * Useful for bulk processing transactions
 */
export async function prefetchRatesForRange(
  startDate: string,
  endDate: string
): Promise<number> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let fetchedCount = 0;

  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Skip weekends (Danmarks Nationalbank doesn't publish rates on weekends)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      await getExchangeRate(dateStr);
      fetchedCount++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return fetchedCount;
}
