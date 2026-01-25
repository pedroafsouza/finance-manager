'use client';

import { CalendarEvent } from '../types';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyStore } from '@/lib/stores/currency-store';

interface ListViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export default function ListView({ events, onEventClick }: ListViewProps) {
  const { currency, exchangeRate } = useCurrencyStore();

  const formatCurrencyValue = (value: number) => {
    return formatCurrency(value, currency, exchangeRate);
  };

  // Sort events by date, most recent first
  const sortedEvents = [...events].sort((a, b) =>
    new Date(b.start).getTime() - new Date(a.start).getTime()
  );

  // Group events by month
  const eventsByMonth = sortedEvents.reduce((acc, event) => {
    const date = new Date(event.start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    if (!acc[monthKey]) {
      acc[monthKey] = { name: monthName, events: [] };
    }
    acc[monthKey].events.push(event);
    return acc;
  }, {} as Record<string, { name: string; events: CalendarEvent[] }>);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="space-y-6">
        {Object.entries(eventsByMonth).map(([monthKey, { name, events }]) => (
          <div key={monthKey}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 sticky top-0 bg-white dark:bg-gray-800 py-2">
              {name}
            </h3>
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  style={{ borderLeftWidth: '4px', borderLeftColor: event.borderColor }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {new Date(event.start).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-base font-semibold text-gray-900 dark:text-white">
                        {event.title}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {event.extendedProps.activityTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: event.backgroundColor,
                            color: event.textColor
                          }}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {event.extendedProps.totalShares.toFixed(3)} shares
                    </div>
                    <div className="text-base font-semibold text-gray-900 dark:text-white">
                      {formatCurrencyValue(event.extendedProps.totalValue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
