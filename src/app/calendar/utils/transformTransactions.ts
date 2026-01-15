import { Transaction, CalendarEvent } from '../types';
import { getActivityColor, getPrimaryActivityType } from './activityColors';

export function transformTransactionsToEvents(transactions: Transaction[]): CalendarEvent[] {
  // Group transactions by entry_date
  const groupedByDate = transactions.reduce((acc, transaction) => {
    const date = transaction.entry_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Convert grouped transactions to calendar events
  const events: CalendarEvent[] = Object.entries(groupedByDate).map(([date, transactions]) => {
    // Get unique activity types
    const activityTypes = [...new Set(transactions.map(t => t.activity_type))];

    // Get primary activity type for color
    const primaryActivity = getPrimaryActivityType(activityTypes);
    const color = getActivityColor(primaryActivity);

    // Calculate totals
    const totalValue = transactions.reduce((sum, t) => {
      return sum + (t.cash_value || t.market_value || 0);
    }, 0);

    const totalShares = transactions.reduce((sum, t) => {
      return sum + (t.num_shares || 0);
    }, 0);

    // Create title
    const eventCount = transactions.length;
    let title = '';
    if (eventCount === 1) {
      const trans = transactions[0];
      title = `${trans.activity_type}`;
    } else {
      title = `${eventCount} events`;
    }

    return {
      id: `${date}-${eventCount}`,
      title,
      start: date,
      allDay: true,
      backgroundColor: color.bg,
      borderColor: color.border,
      textColor: color.text,
      extendedProps: {
        transactions,
        totalValue,
        totalShares,
        activityTypes,
        date
      }
    };
  });

  // Sort events by date
  return events.sort((a, b) => a.start.localeCompare(b.start));
}
