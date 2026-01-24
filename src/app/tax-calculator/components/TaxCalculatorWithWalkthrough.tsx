'use client';

import { useEffect } from 'react';
import { useWalkthrough } from '@/components/walkthrough/WalkthroughProvider';
import WelcomeModal from '@/components/walkthrough/WelcomeModal';

const TAX_CALCULATOR_TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Tax Calculator',
    content:
      'This tool helps you calculate your Danish taxes including income tax, AM-bidrag, and special §7P benefits for RSU income.',
    target: '[data-tour="header"]',
    position: 'bottom' as const,
  },
  {
    id: 'new-calculation',
    title: 'Create New Calculation',
    content:
      'Click here to start a new tax calculation. You will be guided through a step-by-step wizard to enter your income information.',
    target: '[data-tour="new-calculation"]',
    position: 'left' as const,
  },
  {
    id: 'saved-calculations',
    title: 'Saved Calculations',
    content:
      'All your tax calculations are saved here. You can view, edit, or delete them anytime. Each card shows a summary of the calculation.',
    target: '[data-tour="calculations-grid"]',
    position: 'top' as const,
  },
];

interface TaxCalculatorWithWalkthroughProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that adds walkthrough functionality to the tax calculator
 */
export default function TaxCalculatorWithWalkthrough({
  children,
}: TaxCalculatorWithWalkthroughProps) {
  const { startWalkthrough, skipWalkthrough } = useWalkthrough();

  useEffect(() => {
    // Check if this is the first visit
    const hasSeenWelcome = localStorage.getItem('finance-manager-welcome-seen');
    if (!hasSeenWelcome) {
      // Welcome modal will handle showing automatically
    }
  }, []);

  const handleStartTour = () => {
    startWalkthrough(TAX_CALCULATOR_TOUR_STEPS);
  };

  const handleSkipTour = () => {
    skipWalkthrough();
  };

  return (
    <>
      <WelcomeModal onStartTour={handleStartTour} onSkip={handleSkipTour} />
      {children}
    </>
  );
}
