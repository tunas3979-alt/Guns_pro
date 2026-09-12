import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  description: string;
}

interface ToastNotificationProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';

  return (
    <AnimatePresence>
      <div className="fixed top-4 right-4 z-50 max-w-md w-full px-3 sm:px-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`pointer-events-auto rounded-xl border p-4 shadow-lg flex items-start gap-3 bg-white ${
            isSuccess
              ? 'border-emerald-300 ring-1 ring-emerald-400/20'
              : isWarning
              ? 'border-amber-300 ring-1 ring-amber-400/20'
              : 'border-slate-300 ring-1 ring-slate-400/20'
          }`}
        >
          {/* Icon */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              isSuccess
                ? 'bg-emerald-100 text-emerald-700'
                : isWarning
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5" />}
            {isWarning && <AlertCircle className="w-5 h-5" />}
            {!isSuccess && !isWarning && <Info className="w-5 h-5" />}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-bold text-slate-900 leading-snug">
              {toast.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {toast.description}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
