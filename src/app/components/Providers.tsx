'use client';

import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { WalkthroughProvider } from '@/components/walkthrough/WalkthroughProvider';
import WalkthroughOverlay from '@/components/walkthrough/WalkthroughOverlay';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WalkthroughProvider>
      {children}
      <WalkthroughOverlay />
      <Toaster position="top-right" richColors closeButton />
    </WalkthroughProvider>
  );
}
