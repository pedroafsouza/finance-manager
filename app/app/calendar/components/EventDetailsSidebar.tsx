'use client';

import { CalendarEvent } from '../types';
import { getActivityColor } from '../utils/activityColors';

interface EventDetailsSidebarProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailsSidebar({ event, isOpen, onClose }: EventDetailsSidebarProps) {
  if (!event) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 h-full w-full md:w-[400px] bg-background shadow-2xl border-l border-border
                   transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto
                   ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {formatDate(event.extendedProps.date)}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {event.extendedProps.transactions.length} transaction{event.extendedProps.transactions.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="text-sm text-muted-foreground">Total Value</div>
              <div className="text-xl font-bold text-foreground mt-1">
                {formatCurrency(event.extendedProps.totalValue)}
              </div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="text-sm text-muted-foreground">Total Shares</div>
              <div className="text-xl font-bold text-foreground mt-1">
                {event.extendedProps.totalShares.toFixed(3)}
              </div>
            </div>
          </div>

          {/* Activity Types */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Activity Types</div>
            <div className="flex flex-wrap gap-2">
              {event.extendedProps.activityTypes.map((type) => {
                const color = getActivityColor(type);
                return (
                  <span
                    key={type}
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: color.bg }}
                  >
                    {type}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Transaction List */}
          <div className="mt-6">
            <div className="text-sm font-semibold text-muted-foreground mb-3">
              TRANSACTIONS
            </div>
            <div className="space-y-3">
              {event.extendedProps.transactions.map((transaction, index) => {
                const color = getActivityColor(transaction.activity_type);
                const value = transaction.cash_value || transaction.market_value || 0;

                return (
                  <div
                    key={index}
                    className="bg-card rounded-lg p-4 border border-border hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color.bg }}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {transaction.activity_type}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Ticker: <span className="font-semibold">{transaction.ticker}</span></div>
                          {transaction.num_shares !== undefined && transaction.num_shares !== null && (
                            <div>Shares: <span className="font-semibold">{transaction.num_shares.toFixed(3)}</span></div>
                          )}
                          {transaction.lot_number !== undefined && transaction.lot_number !== null && (
                            <div>Lot: <span className="font-semibold">{transaction.lot_number}</span></div>
                          )}
                          {transaction.share_price !== undefined && transaction.share_price !== null && (
                            <div>Price: <span className="font-semibold">{formatCurrency(transaction.share_price)}</span></div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(value)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
