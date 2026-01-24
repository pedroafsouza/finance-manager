'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
  title: string;
  content: string;
  className?: string;
}

/**
 * Help tooltip component for contextual assistance
 */
export default function HelpTooltip({ title, content, className = '' }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Help"
        type="button"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{content}</p>
        </div>
      )}
    </div>
  );
}
