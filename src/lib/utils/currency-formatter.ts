/**
 * Centralized currency formatting utilities
 * Used across the application for consistent display of monetary values
 */

/**
 * Format amount in Danish Krone (DKK)
 * @param amount - The amount to format
 * @param locale - Optional locale (defaults to 'da-DK')
 * @returns Formatted string like "1.234.567,89 DKK"
 */
export function formatDKK(amount: number, locale: string = 'da-DK'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0,00 DKK';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format amount in US Dollars (USD)
 * @param amount - The amount to format
 * @param locale - Optional locale (defaults to 'en-US')
 * @returns Formatted string like "$1,234,567.89"
 */
export function formatUSD(amount: number, locale: string = 'en-US'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format amount with generic currency code
 * @param amount - The amount to format
 * @param currency - Currency code (DKK, USD, EUR, etc.)
 * @param locale - Optional locale
 * @returns Formatted string with currency symbol/code
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `0.00 ${currency}`;
  }

  // Determine appropriate locale based on currency if not provided
  const effectiveLocale = locale || getCurrencyLocale(currency);

  return new Intl.NumberFormat(effectiveLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format amount as plain number with thousand separators (no currency symbol)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - Optional locale (defaults to 'en-US')
 * @returns Formatted string like "1,234,567.89"
 */
export function formatNumber(
  amount: number,
  decimals: number = 2,
  locale: string = 'en-US'
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Get appropriate locale for a currency code
 */
function getCurrencyLocale(currency: string): string {
  const localeMap: Record<string, string> = {
    DKK: 'da-DK',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    SEK: 'sv-SE',
    NOK: 'nb-NO',
  };

  return localeMap[currency] || 'en-US';
}

/**
 * Format percentage
 * @param value - The decimal value (0.15 for 15%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "15.0%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }

  return `${(value * 100).toFixed(decimals)}%`;
}
