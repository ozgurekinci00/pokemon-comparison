// Container for displaying multiple toast notifications

import React from 'react';
import Toast from './Toast';
import { ToastMessage } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onHideToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onHideToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id}
          style={{ 
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index 
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={0} // Managed by useToast hook
            onClose={() => onHideToast(toast.id)}
            isVisible={true}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
