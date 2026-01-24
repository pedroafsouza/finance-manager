'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalkthroughStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface WalkthroughContextType {
  currentStep: number;
  totalSteps: number;
  isActive: boolean;
  steps: WalkthroughStep[];
  nextStep: () => void;
  prevStep: () => void;
  skipWalkthrough: () => void;
  startWalkthrough: (steps: WalkthroughStep[]) => void;
  restartWalkthrough: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextType | null>(null);

export function useWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within WalkthroughProvider');
  }
  return context;
}

interface WalkthroughProviderProps {
  children: ReactNode;
}

export function WalkthroughProvider({ children }: WalkthroughProviderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<WalkthroughStep[]>([]);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(false);

  useEffect(() => {
    // Check if user has seen walkthrough
    const seen = localStorage.getItem('finance-manager-walkthrough-seen');
    if (seen === 'true') {
      setHasSeenWalkthrough(true);
    }
  }, []);

  const startWalkthrough = (newSteps: WalkthroughStep[]) => {
    setSteps(newSteps);
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finished walkthrough
      skipWalkthrough();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipWalkthrough = () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('finance-manager-walkthrough-seen', 'true');
    setHasSeenWalkthrough(true);
  };

  const restartWalkthrough = () => {
    localStorage.removeItem('finance-manager-walkthrough-seen');
    setHasSeenWalkthrough(false);
  };

  return (
    <WalkthroughContext.Provider
      value={{
        currentStep,
        totalSteps: steps.length,
        isActive,
        steps,
        nextStep,
        prevStep,
        skipWalkthrough,
        startWalkthrough,
        restartWalkthrough,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
}
