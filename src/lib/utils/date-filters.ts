/**
 * Date filtering utilities for tax calculations
 * Provides consistent date range generation for queries
 */

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Get date range for an entire year
 * @param year - The tax year
 * @returns Object with startDate (Jan 1) and endDate (Dec 31) in YYYY-MM-DD format
 */
export function getYearDateRange(year: number): DateRange {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

/**
 * Get date range for a specific month
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Object with startDate and endDate in YYYY-MM-DD format
 */
export function getMonthDateRange(year: number, month: number): DateRange {
  // Validate month
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12');
  }

  const monthStr = month.toString().padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate(); // Day 0 of next month = last day of current month

  return {
    startDate: `${year}-${monthStr}-01`,
    endDate: `${year}-${monthStr}-${lastDay}`,
  };
}

/**
 * Get date range for a quarter
 * @param year - The year
 * @param quarter - The quarter (1-4)
 * @returns Object with startDate and endDate in YYYY-MM-DD format
 */
export function getQuarterDateRange(year: number, quarter: number): DateRange {
  if (quarter < 1 || quarter > 4) {
    throw new Error('Quarter must be between 1 and 4');
  }

  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;

  const startDate = `${year}-${startMonth.toString().padStart(2, '0')}-01`;
  const lastDay = new Date(year, endMonth, 0).getDate();
  const endDate = `${year}-${endMonth.toString().padStart(2, '0')}-${lastDay}`;

  return {
    startDate,
    endDate,
  };
}

/**
 * Check if a date string is within a date range
 * @param date - Date string in YYYY-MM-DD format
 * @param range - Date range object
 * @returns True if date is within range (inclusive)
 */
export function isDateInRange(date: string, range: DateRange): boolean {
  return date >= range.startDate && date <= range.endDate;
}

/**
 * Check if a date is in a specific year
 * @param date - Date string in YYYY-MM-DD format
 * @param year - The year to check
 * @returns True if date is in the specified year
 */
export function isDateInYear(date: string, year: number): boolean {
  return date.startsWith(`${year}-`);
}

/**
 * Format date range for display
 * @param range - Date range object
 * @param locale - Optional locale (defaults to 'en-US')
 * @returns Formatted string like "Jan 1, 2024 - Dec 31, 2024"
 */
export function formatDateRange(
  range: DateRange,
  locale: string = 'en-US'
): string {
  const startDate = new Date(range.startDate);
  const endDate = new Date(range.endDate);

  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

/**
 * Get current tax year based on current date
 * @returns Current year or previous year if before tax filing deadline
 */
export function getCurrentTaxYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();

  // If before May 1st, might still be filing for previous year
  // Users can adjust this logic as needed
  return currentYear;
}

/**
 * Get array of recent tax years for dropdown/selection
 * @param count - Number of years to include (default: 10)
 * @returns Array of years in descending order
 */
export function getRecentTaxYears(count: number = 10): number[] {
  const currentYear = getCurrentTaxYear();
  return Array.from({ length: count }, (_, i) => currentYear - i);
}
