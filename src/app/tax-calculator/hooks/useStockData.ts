'use client';

import { useState, useEffect } from 'react';

export interface DividendData {
  grossDividendsDkk: number;
  grossDividendsUsd: number;
  foreignTaxCreditDkk: number;
  foreignTaxCreditUsd: number;
  dividendTransactions?: any[];
}

export interface CapitalGainsData {
  netGainLossDkk: number;
  netGainLossUsd: number;
  salesTransactions?: any[];
}

/**
 * Hook to fetch stock data (dividends, capital gains, portfolio value) for a specific year
 */
export function useStockData(year: number, isUsPerson: boolean, irsTaxPaidUsd: number) {
  const [dividendData, setDividendData] = useState<DividendData | null>(null);
  const [capitalGainsData, setCapitalGainsData] = useState<CapitalGainsData | null>(null);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch dividends (with US Person status)
        const divUrl = `/api/dividend-report?year=${year}&is_us_person=${isUsPerson}&irs_tax_paid=${irsTaxPaidUsd}`;
        const divResponse = await fetch(divUrl);
        if (divResponse.ok) {
          const divData = await divResponse.json();
          if (divData.success) {
            setDividendData(divData.data);
          }
        } else {
          console.error('Failed to fetch dividend data');
        }

        // Fetch capital gains
        const cgResponse = await fetch(`/api/capital-gains?year=${year}`);
        if (cgResponse.ok) {
          const cgData = await cgResponse.json();
          if (cgData.success) {
            setCapitalGainsData(cgData.data);
          }
        } else {
          console.error('Failed to fetch capital gains data');
        }

        // Fetch portfolio value
        const grantsResponse = await fetch('/api/grants');
        if (grantsResponse.ok) {
          const grantsData = await grantsResponse.json();
          if (grantsData.success) {
            const totalValue = grantsData.data.reduce(
              (sum: number, grant: any) => sum + (grant.current_value || 0),
              0
            );
            setPortfolioValue(totalValue);
          }
        } else {
          console.error('Failed to fetch portfolio value');
        }
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock transaction data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [year, isUsPerson, irsTaxPaidUsd]);

  return {
    dividendData,
    capitalGainsData,
    portfolioValue,
    loading,
    error,
  };
}
