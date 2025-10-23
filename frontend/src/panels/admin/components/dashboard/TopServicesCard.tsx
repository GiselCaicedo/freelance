import React from 'react';
import type { AdminDashboardSummary } from '@/panels/admin/data/dashboard';
import { formatNumber } from '@/shared/utils/formatters';

interface TopServicesCardProps {
  locale: string;
  items: AdminDashboardSummary['topServices'];
  labels: {
    empty: string;
    fallbackName: (index: number) => string;
    soldLabel: string;
  };
}

export function TopServicesCard({ locale, items, labels }: TopServicesCardProps) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500">{labels.empty}</p>;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 6).map((service, index) => (
        <div
          key={service.serviceId || index}
          className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              {service.serviceName ?? labels.fallbackName(index + 1)}
            </p>
            <p className="text-xs text-gray-500">{labels.soldLabel}</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {formatNumber(service.timesSold, locale)}
          </span>
        </div>
      ))}
    </div>
  );
}
