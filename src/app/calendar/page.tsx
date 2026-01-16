'use client';

import { useState, useEffect } from 'react';
import { Transaction, CalendarEvent } from './types';
import { transformTransactionsToEvents } from './utils/transformTransactions';
import FullCalendarView from './components/FullCalendarView';
import EventDetailsSidebar from './components/EventDetailsSidebar';
import { useCurrencyStore } from '@/lib/stores/currency-store';
import { formatCurrency } from '@/lib/currency';
import Spinner from '../components/Spinner';

export default function CalendarPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currency, exchangeRate } = useCurrencyStore();

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      const events = transformTransactionsToEvents(transactions);
      setCalendarEvents(events);
    }
  }, [transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transactions');
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    // Delay clearing selection until animation completes
    setTimeout(() => setSelectedEvent(null), 300);
  };

  const formatCurrencyValue = (value: number) => {
    return formatCurrency(value, currency, exchangeRate);
  };

  // Calculate summary stats
  const totalEvents = calendarEvents.length;
  const totalShares = calendarEvents.reduce((sum, event) => sum + event.extendedProps.totalShares, 0);
  const totalValue = calendarEvents.reduce((sum, event) => sum + event.extendedProps.totalValue, 0);

  // Calculate transaction type breakdown
  const transactionTypeCount = transactions.reduce((acc, t) => {
    acc[t.activity_type] = (acc[t.activity_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count dividends and reinvestments specifically
  const dividendCount = transactionTypeCount['Dividend (Cash)'] || 0;
  const reinvestmentCount = transactionTypeCount['You bought (dividend)'] || 0;
  const vestingCount = (transactionTypeCount['Release'] || 0) + (transactionTypeCount['Opening Balance'] || 0);
  const saleCount = (transactionTypeCount['Sale'] || 0) + (transactionTypeCount['Sold'] || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Transaction Calendar
            </h1>
          </div>
          <div className="flex justify-center">
            <Spinner size={32} />
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Transaction Calendar
            </h1>
          </div>
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No transaction data available. Import your data to see your transaction history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Transaction Calendar
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            View your vesting events, dividends, and transactions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Events
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {totalEvents}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Shares
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {totalShares.toFixed(3)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Value
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrencyValue(totalValue)}
            </div>
          </div>
        </div>

        {/* Transaction Type Breakdown */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Transaction Breakdown
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-blue-500"></div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Vesting Events</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{vestingCount}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Dividends</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{dividendCount}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-purple-500"></div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Reinvestments</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{reinvestmentCount}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-red-500"></div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sales</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{saleCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* FullCalendar */}
        <FullCalendarView
          events={calendarEvents}
          onEventClick={handleEventClick}
        />

        {/* Event Details Sidebar */}
        <EventDetailsSidebar
          event={selectedEvent}
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
        />
      </div>
    </div>
  );
}
