'use client';

import { useCallback, useMemo } from 'react';
import { convertUsdToDkk } from '@/lib/tax-calculator-danish';

/**
 * Hook for currency conversion utilities
 * Provides consistent conversion functions across components
 */
export function useCurrencyConversion(
  selectedCurrency: 'DKK' | 'USD',
  usdToDkkRate: number
) {
  /**
   * Convert value to DKK if needed
   * If already in DKK, returns the value unchanged
   */
  const convertToDkk = useCallback(
    (value: number): number => {
      if (selectedCurrency === 'USD') {
        return convertUsdToDkk(value, usdToDkkRate);
      }
      return value;
    },
    [selectedCurrency, usdToDkkRate]
  );

  /**
   * Convert value from DKK to selected currency
   * If selected currency is DKK, returns the value unchanged
   */
  const convertFromDkk = useCallback(
    (valueDkk: number): number => {
      if (selectedCurrency === 'USD') {
        return valueDkk / usdToDkkRate;
      }
      return valueDkk;
    },
    [selectedCurrency, usdToDkkRate]
  );

  /**
   * Get currency label for display
   */
  const currencyLabel = useMemo(() => selectedCurrency, [selectedCurrency]);

  /**
   * Check if currently using USD
   */
  const isUsingUsd = useMemo(
    () => selectedCurrency === 'USD',
    [selectedCurrency]
  );

  /**
   * Get current exchange rate (or 1 if using DKK)
   */
  const exchangeRate = useMemo(
    () => (selectedCurrency === 'USD' ? usdToDkkRate : 1),
    [selectedCurrency, usdToDkkRate]
  );

  return {
    convertToDkk,
    convertFromDkk,
    currencyLabel,
    isUsingUsd,
    exchangeRate,
  };
}

/**
 * Hook specifically for form data conversion
 * Provides a convenience wrapper for tax calculator forms
 */
export function useFormCurrencyConversion(formData: {
  currency: 'DKK' | 'USD';
  usdToDkkRate: number;
}) {
  const { convertToDkk, convertFromDkk, currencyLabel, isUsingUsd } =
    useCurrencyConversion(formData.currency, formData.usdToDkkRate);

  /**
   * Convert a value to DKK for calculations
   * Handles null/undefined by returning 0
   */
  const valueInDkk = useCallback(
    (value: number | undefined | null): number => {
      if (value === null || value === undefined) {
        return 0;
      }
      return convertToDkk(value);
    },
    [convertToDkk]
  );

  /**
   * Convert multiple values at once
   */
  const valuesToDkk = useCallback(
    (values: Record<string, number>): Record<string, number> => {
      const result: Record<string, number> = {};
      for (const [key, value] of Object.entries(values)) {
        result[key] = convertToDkk(value);
      }
      return result;
    },
    [convertToDkk]
  );

  return {
    valueInDkk,
    valuesToDkk,
    convertToDkk,
    convertFromDkk,
    currencyLabel,
    isUsingUsd,
  };
}
