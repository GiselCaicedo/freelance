'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

type DashboardFiltersProps = {
  initialFrom?: string;
  initialTo?: string;
  defaultFrom?: string;
  defaultTo?: string;
};

function isValidRange(from: string, to: string): boolean {
  if (!from || !to) {
    return false;
  }
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }
  return start <= end;
}

export function DashboardFilters({ initialFrom = '', initialTo = '', defaultFrom = '', defaultTo = '' }: DashboardFiltersProps) {
  const t = useTranslations('Dashboard.filters');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFrom(initialFrom);
    setTo(initialTo);
  }, [initialFrom, initialTo]);

  const hasCustomRange = useMemo(() => {
    const currentFrom = searchParams?.get('from') ?? '';
    const currentTo = searchParams?.get('to') ?? '';
    return Boolean(currentFrom || currentTo);
  }, [searchParams]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!from || !to) {
      setError(t('error.required'));
      return;
    }

    if (!isValidRange(from, to)) {
      setError(t('error.range'));
      return;
    }

    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('from', from);
    params.set('to', to);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleReset = () => {
    setError(null);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('from');
    params.delete('to');

    startTransition(() => {
      router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
    });

    setFrom(defaultFrom);
    setTo(defaultTo);
  };

  const disabled = isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900">{t('title')}</h2>
        <p className="text-sm text-gray-600">{t('hint')}</p>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-col text-sm text-gray-700">
          <span className="font-medium">{t('from')}</span>
          <input
            type="date"
            value={from}
            onChange={event => setFrom(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
            max={to || undefined}
            disabled={disabled}
          />
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          <span className="font-medium">{t('to')}</span>
          <input
            type="date"
            value={to}
            onChange={event => setTo(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
            min={from || undefined}
            disabled={disabled}
          />
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending ? t('applying') : t('apply')}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || (!defaultFrom && !defaultTo && !hasCustomRange)}
            className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {t('reset')}
          </button>
        </div>
      </div>
    </form>
  );
}
