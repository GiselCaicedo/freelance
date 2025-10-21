import React from 'react';
import type { AdminDashboardSummary } from '@/panels/admin/data/dashboard';
import { formatDate } from '@/shared/utils/formatters';

interface UpcomingExpirationsCardProps {
  locale: string;
  items: AdminDashboardSummary['upcomingExpirations'];
  labels: {
    empty: string;
    dueToday: string;
    dueTomorrow: string;
    dueIn: (days: number) => string;
    clientFallback: string;
    serviceFallback: string;
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
      {items.slice(0, 5).map((item) => (
        <li key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-900">
                {item.serviceName ?? labels.serviceFallback}
              </p>
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                {buildDueLabel(item.daysUntilExpiry, labels)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {item.clientName ?? labels.clientFallback} · {formatDate(item.expiry, locale)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
