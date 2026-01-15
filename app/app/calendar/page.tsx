'use client';

import { useState, useEffect } from 'react';
import { Transaction, CalendarEvent } from './types';
import { transformTransactionsToEvents } from './utils/transformTransactions';
import FullCalendarView from './components/FullCalendarView';
import EventDetailsSidebar from './components/EventDetailsSidebar';

export default function CalendarPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Calculate summary stats
  const totalEvents = calendarEvents.length;
  const totalShares = calendarEvents.reduce((sum, event) => sum + event.extendedProps.totalShares, 0);
  const totalValue = calendarEvents.reduce((sum, event) => sum + event.extendedProps.totalValue, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Transaction Calendar
            </h1>
          </div>
          <div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>
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
              {formatCurrency(totalValue)}
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
