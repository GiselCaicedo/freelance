import React from 'react';
import type { AdminDashboardSummary } from '@/panels/admin/data/dashboard';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';

interface UpcomingExpirationsCardProps {
  locale: string;
  items: AdminDashboardSummary['upcomingExpirations'];
  labels: {
    empty: string;
    dueToday: string;
    dueTomorrow: string;
    dueIn: (days: number) => string;
    clientFallback: string;
    invoiceFallback: string;
  };
}

function buildDueLabel(days: number | null | undefined, labels: UpcomingExpirationsCardProps['labels']) {
  if (days === null || days === undefined) return labels.dueIn(0);
  if (days <= 0) return labels.dueToday;
  if (days === 1) return labels.dueTomorrow;
  return labels.dueIn(days);
}

export function UpcomingExpirationsCard({ locale, items, labels }: UpcomingExpirationsCardProps) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500">{labels.empty}</p>;
  }

  return (
    <ul className="space-y-4">
      {items.slice(0, 5).map((item) => {
        const statusLabel = item.status ? `${item.status.charAt(0).toUpperCase()}${item.status.slice(1)}` : '';

        return (
          <li key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-900">
                  {item.invoiceNumber ?? labels.invoiceFallback}
                </p>
                <p className="text-xs text-gray-500">{formatCurrency(item.amount ?? 0, locale)}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                {buildDueLabel(item.daysUntilExpiry, labels)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{item.clientName ?? labels.clientFallback}</span>
              <span>{formatDate(item.expiry, locale)}</span>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                item.status === 'pagada'
                  ? 'bg-emerald-100 text-emerald-700'
                  : item.status === 'vencida'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {statusLabel || '—'}
            </span>
          </div>
          </li>
        );
      })}
    </ul>
  );
}
