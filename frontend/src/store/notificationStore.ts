import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type AppNotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  description?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const MAX_NOTIFICATIONS = 50;

export const useNotificationStore = create<NotificationState>()(
  devtools((set) => ({
    notifications: [],
    addNotification: (notification) =>
      set((state) => ({
        notifications: [
          {
            ...notification,
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...state.notifications,
        ].slice(0, MAX_NOTIFICATIONS),
      })),
    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      })),
    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((notification) => notification.id !== id),
      })),
    clearNotifications: () => set({ notifications: [] }),
  }))
);
