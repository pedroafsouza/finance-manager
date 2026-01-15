import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DemoModeStore {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  setDemoMode: (mode: boolean) => void;
}

export const useDemoModeStore = create<DemoModeStore>()(
  persist(
    (set, get) => ({
      isDemoMode: false,
      toggleDemoMode: () => {
        const newMode = !get().isDemoMode;
        set({ isDemoMode: newMode });

        // Set cookie for server-side
        if (typeof document !== 'undefined') {
          document.cookie = `demoMode=${newMode}; path=/; max-age=31536000; SameSite=Lax`;
          // Reload to switch databases
          window.location.reload();
        }
      },
      setDemoMode: (mode: boolean) => {
        set({ isDemoMode: mode });

        // Set cookie for server-side
        if (typeof document !== 'undefined') {
          document.cookie = `demoMode=${mode}; path=/; max-age=31536000; SameSite=Lax`;
        }
      },
    }),
    {
      name: 'demo-mode-storage',
    }
  )
);
