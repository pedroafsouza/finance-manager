'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  onStartTour: () => void;
  onSkip: () => void;
}

/**
 * Welcome modal shown to first-time users
 */
export default function WelcomeModal({ onStartTour, onSkip }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome modal
    const seen = localStorage.getItem('finance-manager-welcome-seen');
    if (seen !== 'true') {
      setIsOpen(true);
    }
  }, []);

  const handleStartTour = () => {
    localStorage.setItem('finance-manager-welcome-seen', 'true');
    setIsOpen(false);
    onStartTour();
  };

  const handleSkip = () => {
    localStorage.setItem('finance-manager-welcome-seen', 'true');
    setIsOpen(false);
    onSkip();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Finance Manager
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your comprehensive tool for Danish tax calculations
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Calculate Danish Taxes
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Accurately calculate your Danish income tax, including AM-bidrag, municipal
                tax, bottom tax, and top tax brackets.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Track Stock Investments
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your RSU income, dividends, and capital gains with support for §7P
                tax benefits and both Gennemsnitsmetoden and FIFO cost basis methods.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Generate Tax Reports
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get ready-to-use values for your Danish tax return (Selvangivelse), including
                all required boxes (Rubrik 454, 452, 496, 490).
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleStartTour}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Take a Quick Tour
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            Skip and Explore
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          You can restart the tour anytime from Settings
        </p>
      </div>
    </div>
  );
}
