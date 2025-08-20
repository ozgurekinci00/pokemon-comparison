// Custom hook for managing toast notifications

import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

interface UseToastReturn {
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type'], duration?: number) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    message: string, 
    type: ToastMessage['type'] = 'info', 
    duration: number = 4000
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration (if duration > 0)
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    hideToast,
    clearAllToasts
  };
};
