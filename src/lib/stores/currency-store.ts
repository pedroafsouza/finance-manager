import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'USD' | 'DKK';

interface CurrencyStore {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number; // DKK per USD
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: 'USD',
      exchangeRate: 7.0, // Approximate DKK per USD
      setCurrency: (currency: Currency) => {
        set({ currency });
      },
    }),
    {
      name: 'currency-storage',
    }
  )
);
