'use client';

import { ReactNode } from 'react';
import { DemoModeProvider } from '../contexts/DemoModeContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DemoModeProvider>
      {children}
    </DemoModeProvider>
  );
}
