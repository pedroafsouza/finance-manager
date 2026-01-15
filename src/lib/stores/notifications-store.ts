import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: number;
  llm_provider: string;
  analysis_type: string;
  recommendation: string | null;
  reasoning: string;
  confidence_level: string | null;
  risk_factors: string[];
  opportunities: string[];
  is_read: boolean;
  created_at: string;
  is_error?: boolean;
  error_type?: string;
}

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,

      fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/llm/reports');
          const data = await response.json();

          if (data.success) {
            set({
              notifications: data.data,
              unreadCount: data.unreadCount,
              isLoading: false,
            });
          } else {
            set({ error: data.error, isLoading: false });
          }
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false
          });
        }
      },

      markAsRead: async (id: number) => {
        try {
          const response = await fetch(`/api/llm/reports?id=${id}`, {
            method: 'PATCH',
          });

          if (response.ok) {
            // Update local state
            set((state) => ({
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, is_read: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            }));
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({
        // Only persist essential data
        unreadCount: state.unreadCount,
      }),
    }
  )
);
