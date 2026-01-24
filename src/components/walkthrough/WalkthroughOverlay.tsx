'use client';

import { useEffect, useState } from 'react';
import { useWalkthrough } from './WalkthroughProvider';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Walkthrough overlay component that displays step-by-step guidance
 */
export default function WalkthroughOverlay() {
  const { currentStep, totalSteps, isActive, steps, nextStep, prevStep, skipWalkthrough } =
    useWalkthrough();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData?.target) return;

    // Find the target element and position the tooltip
    const targetElement = document.querySelector(currentStepData.target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      // Calculate position based on preferred position
      let top = rect.top + scrollTop;
      let left = rect.left + scrollLeft;

      switch (currentStepData.position) {
        case 'bottom':
          top = rect.bottom + scrollTop + 10;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case 'top':
          top = rect.top + scrollTop - 10;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case 'left':
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.left + scrollLeft - 10;
          break;
        case 'right':
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.right + scrollLeft + 10;
          break;
        default:
          top = rect.bottom + scrollTop + 10;
          left = rect.left + scrollLeft;
      }

      setPosition({ top, left });

      // Highlight the target element
      targetElement.classList.add('walkthrough-highlight');

      // Scroll to element
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return () => {
        targetElement.classList.remove('walkthrough-highlight');
      };
    }
  }, [isActive, currentStepData]);

  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={skipWalkthrough} />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md p-6 transform -translate-x-1/2"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentStepData.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
          <button
            onClick={skipWalkthrough}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close walkthrough"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {currentStepData.content}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={skipWalkthrough}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Skip Tour
          </button>

          <button
            onClick={nextStep}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add styles for highlighting */}
      <style jsx global>{`
        .walkthrough-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 0.375rem;
        }
      `}</style>
    </>
  );
}
