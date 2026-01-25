import { create } from 'zustand';

export interface StockPrice {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  source: 'yahoo-finance';
}

interface StockPricesStore {
  prices: Map<string, StockPrice>;
  portfolioValueUSD: number;
  portfolioValueDKK: number;
  exchangeRate: number;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;

  // Actions
  fetchPrices: (tickers?: string[], forceRefresh?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
}

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export const useStockPricesStore = create<StockPricesStore>((set, get) => ({
  prices: new Map(),
  portfolioValueUSD: 0,
  portfolioValueDKK: 0,
  exchangeRate: 6.9,
  isLoading: false,
  error: null,
  lastFetch: null,

  fetchPrices: async (tickers?: string[], forceRefresh = false) => {
    console.log('=== fetchPrices called ===');
    console.log('tickers:', tickers);
    console.log('forceRefresh:', forceRefresh);

    const { lastFetch } = get();

    // Don't refetch if we recently fetched and not forcing refresh
    if (!forceRefresh && lastFetch && Date.now() - lastFetch < REFRESH_INTERVAL) {
      console.log('Skipping fetch - recently fetched');
      return;
    }

    set({ isLoading: true, error: null });
    console.log('Starting fetch...');

    try {
      // Build query params
      const params = new URLSearchParams();
      if (tickers && tickers.length > 0) {
        params.set('tickers', tickers.join(','));
      } else {
        params.set('all', 'true');
      }
      if (forceRefresh) {
        params.set('refresh', 'true');
      }

      const url = `/api/stock-prices?${params.toString()}`;
      console.log('Fetching URL:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        // Convert object back to Map
        const pricesMap = new Map<string, StockPrice>();
        Object.entries(data.data).forEach(([ticker, price]) => {
          console.log(`Adding ${ticker} to map:`, price);
          pricesMap.set(ticker, price as StockPrice);
        });

        console.log('Final pricesMap size:', pricesMap.size);
        console.log('Portfolio data:', data.portfolio);

        set({
          prices: pricesMap,
          portfolioValueUSD: data.portfolio?.totalValueUSD || 0,
          portfolioValueDKK: data.portfolio?.totalValueDKK || 0,
          exchangeRate: data.portfolio?.exchangeRate || 6.9,
          isLoading: false,
          lastFetch: Date.now(),
        });

        console.log('Store updated successfully');
      } else {
        console.error('Fetch failed:', data.error);
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  refresh: async () => {
    const { fetchPrices } = get();
    await fetchPrices(undefined, true);
  },

  clear: () => {
    set({ prices: new Map(), lastFetch: null, error: null });
  },
}));
