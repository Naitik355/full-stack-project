import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(undefined);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (title, options) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = {
        id,
        title,
        type: options?.type || 'info',
        message: options?.message,
      };

      setToasts((prev) => [...prev, newToast]);

      const duration = options?.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title, message) => toast(title, { type: 'success', message }),
    [toast]
  );
  const error = useCallback(
    (title, message) => toast(title, { type: 'error', message }),
    [toast]
  );
  const info = useCallback(
    (title, message) => toast(title, { type: 'info', message }),
    [toast]
  );
  const warning = useCallback(
    (title, message) => toast(title, { type: 'warning', message }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => {
          const bgColors = {
            success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            error: 'bg-rose-50 border-rose-200 text-rose-900',
            warning: 'bg-amber-50 border-amber-200 text-amber-900',
            info: 'bg-indigo-50 border-indigo-200 text-indigo-900',
          }[t.type];

          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />,
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${bgColors}`}
            >
              {icons}
              <div className="flex-1 text-sm">
                <p className="font-semibold">{t.title}</p>
                {t.message && <p className="mt-0.5 opacity-90 text-xs leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
