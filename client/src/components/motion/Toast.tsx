import React, { createContext, useContext, useState, useCallback } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; description?: string }) => void;
  addToast: (title: string, type?: ToastType, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerToast = useCallback((options: { type?: ToastType; title: string; description?: string }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      id,
      type: options.type || 'info',
      title: options.title,
      description: options.description,
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const addToast = useCallback((title: string, type?: ToastType, description?: string) => {
    triggerToast({ title, type, description });
  }, [triggerToast]);

  const success = useCallback((title: string, description?: string) => {
    triggerToast({ type: 'success', title, description });
  }, [triggerToast]);

  const error = useCallback((title: string, description?: string) => {
    triggerToast({ type: 'error', title, description });
  }, [triggerToast]);

  const info = useCallback((title: string, description?: string) => {
    triggerToast({ type: 'info', title, description });
  }, [triggerToast]);

  return (
    <ToastContext.Provider value={{ toast: triggerToast, addToast, success, error, info }}>
      {children}
      <LazyMotion features={domAnimation}>
        <div
          className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
          dir="rtl"
        >
          <AnimatePresence>
            {toasts.map((t) => (
              <m.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
                className={`pointer-events-auto p-4 rounded-xl bg-white dark:bg-black text-black dark:text-white shadow-xl flex items-start gap-3 ${
                  t.type === 'error'
                    ? 'border-2 border-black dark:border-white'
                    : t.type === 'success'
                    ? 'border-2 border-black dark:border-white'
                    : 'border border-neutral-400 dark:border-neutral-600'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {t.type === 'success' && <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
                  {t.type === 'error' && <AlertCircle className="w-5 h-5 stroke-[2.5]" />}
                  {t.type === 'info' && <Info className="w-5 h-5 stroke-[2]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black">{t.title}</h4>
                  {t.description && (
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-bold mt-0.5">
                      {t.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </LazyMotion>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
