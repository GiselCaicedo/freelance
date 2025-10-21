'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type AlertType = 'success' | 'info' | 'warning' | 'error';

type AlertRecord = {
  id: string;
  type: AlertType;
  title: string;
  description?: string;
  duration: number;
};

type NotifyArgs = {
  type?: AlertType;
  title: string;
  description?: string;
  duration?: number;
};

type AlertsContextValue = {
  notify: (args: NotifyArgs) => string;
  dismiss: (id: string) => void;
};

const AlertsContext = createContext<AlertsContextValue | null>(null);

const typeStyles: Record<AlertType, { wrapper: string; badge: string; icon: LucideIcon }> = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
    badge: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  info: {
    wrapper: 'border-blue-200 bg-blue-50/90 text-blue-900',
    badge: 'bg-blue-500',
    icon: Info,
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50/90 text-amber-900',
    badge: 'bg-amber-500',
    icon: TriangleAlert,
  },
  error: {
    wrapper: 'border-red-200 bg-red-50/90 text-red-900',
    badge: 'bg-red-500',
    icon: AlertCircle,
  },
};

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const timers = useRef<Record<string, number>>({});
  const translate = useTranslations();

  const resolveCopy = useCallback(
    (value?: string) => {
      if (!value) return value;
      if (!value.includes('.')) return value;
      try {
        return translate(value);
      } catch (error) {
        console.warn('Missing translation for alert copy:', value, error);
        return value;
      }
    },
    [translate],
  );

  const dismiss = useCallback((id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
    const timer = timers.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const notify = useCallback(({ type = 'info', title, description, duration = 4500 }: NotifyArgs) => {
    const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

    const resolvedTitle = resolveCopy(title);
    const resolvedDescription = resolveCopy(description);

    setAlerts((current) => [
      ...current,
      {
        id,
        type,
        title: resolvedTitle,
        description: resolvedDescription,
        duration,
      },
    ]);

    if (duration > 0 && typeof window !== 'undefined') {
      timers.current[id] = window.setTimeout(() => {
        setAlerts((current) => current.filter((alert) => alert.id !== id));
        delete timers.current[id];
      }, duration);
    }

    return id;
  }, [resolveCopy]);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <AlertsContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {alerts.map((alert) => {
          const config = typeStyles[alert.type];
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              role="status"
              className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border shadow-lg backdrop-blur transition-all ${config.wrapper}`}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <div className={`mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.badge}`}>
                  <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-snug">{alert.title}</p>
                  {alert.description && (
                    <p className="mt-1 text-sm text-gray-700">{alert.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(alert.id)}
                  className="mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-black/5 hover:text-gray-700"
                  aria-label="Cerrar alerta"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useAlerts must be used within an AlertsProvider');
  return context;
}
