'use client';

import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { cn } from '@/lib/utils';

export function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebarStore();

  return (
    <div className={cn('transition-all duration-300 ease-in-out', isOpen ? 'ml-64' : 'ml-0')}>
      <div className="h-16" /> {/* Spacer for fixed navbar */}
      {children}
    </div>
  );
}
