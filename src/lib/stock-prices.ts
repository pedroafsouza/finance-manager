import { getDb } from './db';
import YahooFinance from 'yahoo-finance2';
import { getCurrentExchangeRate } from './exchange-rates';

// Create YahooFinance instance with suppressed notices
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
});

export interface StockPrice {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  source: 'yahoo-finance';
}

interface CacheEntry {
  data: StockPrice;
  expiresAt: number;
}

// In-memory cache with 10-minute TTL
const priceCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCacheKey(ticker: string, isDemoMode: boolean): string {
  return `${ticker}:${isDemoMode ? 'demo' : 'live'}`;
}

function getFromCache(ticker: string, isDemoMode: boolean): StockPrice | null {
  const key = getCacheKey(ticker, isDemoMode);
  const entry = priceCache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    priceCache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(ticker: string, isDemoMode: boolean, data: StockPrice): void {
  const key = getCacheKey(ticker, isDemoMode);
  priceCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function fetchFromYahooFinance(ticker: string): Promise<StockPrice | null> {
  try {
    console.log(`Fetching Yahoo Finance data for ${ticker}`);

    const quote = await yahooFinance.quote(ticker);
    console.log(`Yahoo Finance response for ${ticker}:`, quote);

    if (!quote || !quote.regularMarketPrice) {
      console.warn(`No price data available for ${ticker}`);
      return null;
    }

    const price = quote.regularMarketPrice;
    const previousClose = quote.regularMarketPreviousClose || price;
    const change = quote.regularMarketChange || (price - previousClose);
    const changePercent = quote.regularMarketChangePercent || ((change / previousClose) * 100);

    const result: StockPrice = {
      ticker,
      price,
      change,
      changePercent,
      timestamp: Date.now(),
      source: 'yahoo-finance',
    };

    console.log(`Processed data for ${ticker}:`, result);
    return result;
  } catch (error) {
    console.error(`Yahoo Finance fetch error for ${ticker}:`, error);
    return null;
  }
}

export async function getStockPrice(
  ticker: string,
  isDemoMode: boolean,
  forceRefresh = false
): Promise<StockPrice | null> {
  console.log(`getStockPrice called for ${ticker}, demo: ${isDemoMode}, force: ${forceRefresh}`);

  // Check cache first
  if (!forceRefresh) {
    const cached = getFromCache(ticker, isDemoMode);
    if (cached) {
      console.log(`Using cached price for ${ticker}:`, cached);
      return cached;
    }
  }

  // Fetch from Yahoo Finance
  const price = await fetchFromYahooFinance(ticker);

  // Cache the result
  if (price) {
    setCache(ticker, isDemoMode, price);
    console.log(`Cached price for ${ticker}`);
  } else {
    console.warn(`Failed to fetch price for ${ticker}`);
  }

  return price;
}

export interface HoldingWithShares {
  ticker: string;
  total_shares: number;
}

export async function getUserTickers(isDemoMode: boolean): Promise<string[]> {
  const db = await getDb();

  try {
    const result = db
      .prepare(`SELECT DISTINCT ticker FROM holdings ORDER BY ticker`)
      .all() as { ticker: string }[];

    return result.map(row => row.ticker);
  } finally {
    db.close();
  }
}

export async function getUserHoldings(isDemoMode: boolean): Promise<HoldingWithShares[]> {
  const db = await getDb();

  try {
    const result = db
      .prepare(`
        SELECT
          ticker,
          SUM(total_shares) as total_shares
        FROM holdings
        WHERE total_shares > 0
        GROUP BY ticker
        ORDER BY ticker
      `)
      .all() as HoldingWithShares[];

    console.log(`getUserHoldings (demo: ${isDemoMode}):`, result);
    return result;
  } finally {
    db.close();
  }
}

export async function getStockPrices(
  tickers: string[],
  isDemoMode: boolean,
  forceRefresh = false
): Promise<Map<string, StockPrice>> {
  const prices = new Map<string, StockPrice>();

  // Fetch prices in parallel with some throttling
  const results = await Promise.allSettled(
    tickers.map(ticker => getStockPrice(ticker, isDemoMode, forceRefresh))
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      prices.set(tickers[index], result.value);
    }
  });

  return prices;
}

export interface PortfolioValue {
  totalValueUSD: number;
  totalValueDKK: number;
  exchangeRate: number;
  holdings: Array<{
    ticker: string;
    shares: number;
    currentPrice: number;
    valueUSD: number;
    valueDKK: number;
  }>;
}

export async function getPortfolioValue(
  isDemoMode: boolean,
  forceRefresh = false
): Promise<PortfolioValue> {
  console.log('=== getPortfolioValue START ===');
  console.log('isDemoMode:', isDemoMode);
  console.log('forceRefresh:', forceRefresh);

  // Get user holdings
  const holdings = await getUserHoldings(isDemoMode);
  console.log('Holdings from database:', holdings);

  if (holdings.length === 0) {
    console.log('No holdings found - returning zero portfolio');
    return {
      totalValueUSD: 0,
      totalValueDKK: 0,
      exchangeRate: 6.9,
      holdings: [],
    };
  }

  console.log(`Found ${holdings.length} unique tickers in holdings`);

  // Get current exchange rate
  const exchangeRate = await getCurrentExchangeRate();
  console.log('Current USD to DKK exchange rate:', exchangeRate);

  // Get prices for all tickers
  const tickers = holdings.map(h => h.ticker);
  console.log('Fetching prices for tickers:', tickers);
  const prices = await getStockPrices(tickers, isDemoMode, forceRefresh);
  console.log('Prices fetched:', Object.fromEntries(prices));

  // Calculate portfolio value
  let totalValueUSD = 0;
  console.log('\n--- Portfolio Calculation ---');
  const portfolioHoldings = holdings.map(holding => {
    const price = prices.get(holding.ticker);
    const currentPrice = price?.price || 0;
    const shares = holding.total_shares;
    const valueUSD = shares * currentPrice;
    const valueDKK = valueUSD * exchangeRate;

    totalValueUSD += valueUSD;

    console.log(`${holding.ticker}:`);
    console.log(`  Shares: ${shares}`);
    console.log(`  Price: $${currentPrice}`);
    console.log(`  Value USD: $${valueUSD.toFixed(2)}`);
    console.log(`  Value DKK: kr. ${valueDKK.toFixed(2)}`);

    return {
      ticker: holding.ticker,
      shares: shares,
      currentPrice,
      valueUSD,
      valueDKK,
    };
  });

  const totalValueDKK = totalValueUSD * exchangeRate;

  console.log('\n--- TOTAL PORTFOLIO VALUE ---');
  console.log(`USD: $${totalValueUSD.toFixed(2)}`);
  console.log(`DKK: kr. ${totalValueDKK.toFixed(2)}`);
  console.log(`Exchange Rate: ${exchangeRate}`);
  console.log('=== getPortfolioValue END ===\n');

  return {
    totalValueUSD,
    totalValueDKK,
    exchangeRate,
    holdings: portfolioHoldings,
  };
}

// Clear expired entries from cache periodically
setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;
  for (const [key, entry] of priceCache.entries()) {
    if (now > entry.expiresAt) {
      priceCache.delete(key);
      deletedCount++;
    }
  }
  if (deletedCount > 0) {
    console.log(`Cache cleanup: removed ${deletedCount} expired entries`);
  }
}, 2 * 60 * 1000); // Clean up every 2 minutes
