'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load demo mode preference from localStorage
    const savedDemoMode = localStorage.getItem('demoMode');
    const demoModeEnabled = savedDemoMode === 'true';
    setIsDemoMode(demoModeEnabled);

    // Sync cookie with localStorage
    document.cookie = `demoMode=${demoModeEnabled}; path=/; max-age=31536000; SameSite=Lax`;

    setIsLoaded(true);
  }, []);

  const toggleDemoMode = () => {
    const newMode = !isDemoMode;
    setIsDemoMode(newMode);
    localStorage.setItem('demoMode', String(newMode));

    // Set a cookie so the server can read it
    document.cookie = `demoMode=${newMode}; path=/; max-age=31536000; SameSite=Lax`;

    // Reload the page to switch databases
    window.location.reload();
  };

  // Don't render children until we've loaded the preference
  if (!isLoaded) {
    return null;
  }

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
