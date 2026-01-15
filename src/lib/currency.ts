import type { Currency } from './stores/currency-store';

export const EXCHANGE_RATE_DKK_PER_USD = 7.0;

export function convertCurrency(
  amount: number,
  fromCurrency: 'USD',
  toCurrency: Currency,
  exchangeRate: number = EXCHANGE_RATE_DKK_PER_USD
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === 'USD' && toCurrency === 'DKK') {
    return amount * exchangeRate;
  }

  return amount;
}

export function formatCurrency(
  amount: number,
  currency: Currency,
  exchangeRate: number = EXCHANGE_RATE_DKK_PER_USD
): string {
  // Convert from USD to target currency
  const convertedAmount = convertCurrency(amount, 'USD', currency, exchangeRate);

  if (currency === 'DKK') {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(convertedAmount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(convertedAmount);
}
