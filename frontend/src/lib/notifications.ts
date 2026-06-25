import { toast as sonnerToast } from 'sonner';
import { useNotificationStore, AppNotificationType } from '../store/notificationStore';

type ToastMessage = string | number;

const notify = (type: AppNotificationType, message: ToastMessage, description?: string) => {
  const title = String(message);
  useNotificationStore.getState().addNotification({
    type,
    title,
    description,
  });
};

export const toast = Object.assign(
  (message: ToastMessage, options?: { description?: string }) => {
    notify('info', message, options?.description);
    return sonnerToast(message, options);
  },
  sonnerToast,
  {
    success: (message: ToastMessage, options?: { description?: string }) => {
      notify('success', message, options?.description);
      return sonnerToast.success(message, options);
    },
    error: (message: ToastMessage, options?: { description?: string }) => {
      notify('error', message, options?.description);
      return sonnerToast.error(message, options);
    },
    warning: (message: ToastMessage, options?: { description?: string }) => {
      notify('warning', message, options?.description);
      return sonnerToast.warning(message, options);
    },
    info: (message: ToastMessage, options?: { description?: string }) => {
      notify('info', message, options?.description);
      return sonnerToast.info(message, options);
    },
  }
);
