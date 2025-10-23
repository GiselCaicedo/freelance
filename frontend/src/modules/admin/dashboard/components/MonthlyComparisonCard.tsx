import type { AdminDashboardSummary } from '@admin/dashboard/types';
import { formatCurrency, formatMonthLabel } from '@shared/utils/formatters';
import React from 'react';

type MonthlyComparisonCardProps = {
  locale: string;
  items: AdminDashboardSummary['monthlyComparison'];
  labels: {
    billed: string;
    pending: string;
    empty: string;
  };
};

export function MonthlyComparisonCard({ locale, items, labels }: MonthlyComparisonCardProps) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500">{labels.empty}</p>;
  }

  const maxValue = Math.max(
    ...items.map(item => Math.max(item.billed ?? 0, item.pending ?? 0)),
    1,
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-full justify-between gap-4">
        {items.map((item) => {
          const billedHeight = Math.round(((item.billed ?? 0) / maxValue) * 100);
          const pendingHeight = Math.round(((item.pending ?? 0) / maxValue) * 100);

          return (
            <div key={item.month} className="flex w-16 flex-col items-center">
              <div className="flex h-40 w-full items-end justify-center gap-1 rounded-2xl bg-gray-50 p-2">
                <div
                  className="w-5 rounded-full bg-emerald-500"
                  style={{ height: `${billedHeight}%` }}
                  title={`${labels.billed}: ${formatCurrency(item.billed ?? 0, locale)}`}
                />
                <div
                  className="w-5 rounded-full bg-sky-500"
                  style={{ height: `${pendingHeight}%` }}
                  title={`${labels.pending}: ${formatCurrency(item.pending ?? 0, locale)}`}
                />
              </div>
              <span className="mt-2 text-xs font-medium text-gray-500 uppercase">
                {formatMonthLabel(item.month, locale)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-end gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          {labels.billed}
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden />
          {labels.pending}
        </div>
      </div>
    </div>
  );
}
