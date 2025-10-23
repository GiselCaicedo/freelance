import type { AdminDashboardSummary } from '@admin/data/dashboard';
import { formatNumber } from '@shared/utils/formatters';
import React from 'react';

type ClientStatusCardProps = {
  locale: string;
  status: AdminDashboardSummary['clientStatus'];
  labels: {
    active: string;
    inactive: string;
    unknown: string;
    total: (count: number) => string;
  };
};

const STATUS_ORDER = [
  { key: 'active', color: 'bg-emerald-500' },
  { key: 'inactive', color: 'bg-amber-500' },
  { key: 'unknown', color: 'bg-gray-300' },
] as const;

type StatusKey = (typeof STATUS_ORDER)[number]['key'];

type StatusRecord = Record<StatusKey, number>;

function asRecord(status: AdminDashboardSummary['clientStatus']): StatusRecord {
  return {
    active: status.active ?? 0,
    inactive: status.inactive ?? 0,
    unknown: status.unknown ?? 0,
  };
}

export function ClientStatusCard({ locale, status, labels }: ClientStatusCardProps) {
  const record = asRecord(status);
  const total = status.total || STATUS_ORDER.reduce((acc, item) => acc + record[item.key], 0);
  const safeTotal = total === 0 ? 1 : total;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{labels.total(total)}</p>
      <div className="flex gap-2">
        {STATUS_ORDER.map((item) => {
          const value = record[item.key];
          const percentage = Math.round((value / safeTotal) * 100);
          return (
            <div key={item.key} className="flex-1">
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${percentage}%` }}
                  aria-hidden
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                <span className="font-medium capitalize">{labels[item.key]}</span>
                <span>{formatNumber(value, locale)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
