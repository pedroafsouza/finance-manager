'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasVisited', 'true');
    localStorage.setItem('visitedAt', new Date().toISOString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl animate-in fade-in zoom-in rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to Skatly! 🇩🇰
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your personal assistant for managing RSU stock grants and Danish taxes
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="mb-2 text-2xl">📊</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Import Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload Morgan Stanley Excel files and track your RSU grants
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="mb-2 text-2xl">💰</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Tax Calculations</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Calculate Danish taxes on stock compensation and capital gains
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
              <div className="mb-2 text-2xl">📈</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Track Portfolio</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor your vesting schedules and portfolio value over time
              </p>
            </div>

            <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
              <div className="mb-2 text-2xl">🔒</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Private & Secure</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All data stays local on your device, nothing sent to servers
              </p>
            </div>
          </div>

          {/* Demo Mode Info */}
          <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              👁️ Try Demo Mode First
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Not ready to import your data? Toggle <strong>Demo Mode</strong> in the top right corner to explore the app with sample anonymized data. You can switch back anytime!
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-white font-medium">
                👁️ Demo
              </span>
              <span>= Sample data</span>
              <span className="mx-1">|</span>
              <span className="inline-flex items-center gap-1 rounded bg-gray-300 px-2 py-1 text-gray-700 font-medium">
                👤 Live
              </span>
              <span>= Your data</span>
            </div>
          </div>

          {/* Quick Start */}
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
              🚀 Quick Start Guide
            </h3>
            <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 font-semibold">1.</span>
                <span>Toggle <strong>Demo Mode</strong> to try the app with sample data, or</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">2.</span>
                <span>Navigate to <strong>Import Data</strong> to upload your Morgan Stanley PDF file</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 font-semibold">3.</span>
                <span>View your grants, transactions, and tax reports across the app</span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/imports"
              onClick={handleClose}
              className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700"
            >
              Get Started - Import Data
            </Link>
            <button
              onClick={handleClose}
              className="rounded-lg border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Explore App
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-500">
            This dialog will only show once. You can always access help from the Settings page.
          </p>
        </div>
      </div>
    </div>
  );
}
