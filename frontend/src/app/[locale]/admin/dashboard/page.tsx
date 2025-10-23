import type { Metadata } from 'next';
import { DashboardFilters } from '@admin/dashboard/components/DashboardFilters';
import { MetricCard } from '@admin/dashboard/components/MetricCard';
import { MonthlyComparisonCard } from '@admin/dashboard/components/MonthlyComparisonCard';
import { SectionCard } from '@admin/dashboard/components/SectionCard';
import { TopServicesCard } from '@admin/dashboard/components/TopServicesCard';
import { UpcomingExpirationsCard } from '@admin/dashboard/components/UpcomingExpirationsCard';
import { getAdminDashboardSummary } from '@admin/data/dashboard';
import { formatCurrency, formatDate } from '@shared/utils/formatters';
import { getTranslations } from 'next-intl/server';

function toDateInput(value: string | null | undefined, adjustDays = 0): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  if (adjustDays !== 0) {
    date.setDate(date.getDate() + adjustDays);
  }
  return date.toISOString().slice(0, 10);
}

function shiftIso(value: string | null | undefined, days: number): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

type SearchParams = { from?: string | string[]; to?: string | string[] };

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function Dashboard(props: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const [{ locale }, rawSearchParams] = await Promise.all([
    props.params,
    props.searchParams ? Promise.resolve(props.searchParams) : Promise.resolve<SearchParams | undefined>(undefined),
  ]);

  const searchParams = rawSearchParams ?? {};
  const requestedFrom = firstValue(searchParams.from);
  const requestedTo = firstValue(searchParams.to);

  const t = await getTranslations({ locale, namespace: 'Dashboard' });

  let summary: Awaited<ReturnType<typeof getAdminDashboardSummary>> | null = null;
  let errorMessage: string | null = null;

  try {
    summary = await getAdminDashboardSummary({
      locale,
      months: 6,
      monthsAhead: 3,
      limit: 6,
      from: requestedFrom,
      to: requestedTo,
    });
  } catch (error) {
    console.error('Failed to load admin dashboard summary', error);
    errorMessage = t('errors.load');
  }

  const total = summary ? formatCurrency(summary.totals.total ?? 0, locale) : '—';
  const billed = summary ? formatCurrency(summary.totals.billed ?? 0, locale) : '—';
  const pending = summary ? formatCurrency(summary.totals.pending ?? 0, locale) : '—';
  const inclusiveToIso = summary ? shiftIso(summary.period.to, -1) : null;
  const periodHint = summary
    ? t('metrics.period', {
        from: formatDate(summary.period.from, locale),
        to: formatDate(inclusiveToIso, locale),
      })
    : null;

  const fallbackFromInput = summary ? toDateInput(summary.period.from) : '';
  const fallbackToInput = inclusiveToIso ? toDateInput(inclusiveToIso) : '';
  const queryFromInput = toDateInput(requestedFrom ?? null);
  const queryToInput = toDateInput(requestedTo ?? null);
  const initialFromInput = queryFromInput || fallbackFromInput;
  const initialToInput = queryToInput || fallbackToInput;

  return (
    <div className="px-6 py-10 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">

        <section className="space-y-6 rounded-3xl border border-gray-200 bg-white px-8 py-10">
          <DashboardFilters
            initialFrom={initialFromInput}
            initialTo={initialToInput}
            defaultFrom={fallbackFromInput}
            defaultTo={fallbackToInput}
          />

          {summary
            ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricCard title={t('metrics.totalBilling')} value={total} hint={periodHint ?? undefined} />
                  <MetricCard title={t('metrics.totalBilled')} value={billed} tone="secondary" />
                  <MetricCard
                    title={t('metrics.pendingCollection')}
                    value={pending}
                    hint={t('metrics.pendingHint')}
                    tone="warning"
                  />
                </div>
              )
            : null}

          {errorMessage
            ? (
                <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              )
            : null}
        </section>

        {summary
          ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="space-y-6">
                  <SectionCard title={t('billing.title')} description={t('billing.description')}>
                    <MonthlyComparisonCard
                      locale={locale}
                      items={summary.monthlyComparison}
                      labels={{
                        billed: t('billing.billed'),
                        pending: t('billing.pending'),
                        empty: t('billing.empty'),
                      }}
                    />
                  </SectionCard>

                  <SectionCard title={t('topServices.title')} description={t('topServices.description')}>
                    <TopServicesCard
                      locale={locale}
                      items={summary.topServices}
                      labels={{
                        empty: t('topServices.empty'),
                        fallbackName: (position: number) => t('topServices.fallback', { position }),
                        soldLabel: t('topServices.soldLabel'),
                      }}
                    />
                  </SectionCard>
                </div>

                <div className="space-y-6">
                  <SectionCard title={t('expirations.title')} description={t('expirations.description')}>
                    <UpcomingExpirationsCard
                      locale={locale}
                      items={summary.upcomingExpirations}
                      labels={{
                        empty: t('expirations.empty'),
                        dueToday: t('expirations.dueToday'),
                        dueTomorrow: t('expirations.dueTomorrow'),
                        dueIn: (days: number) => t('expirations.dueIn', { count: days }),
                        clientFallback: t('expirations.clientFallback'),
                        invoiceFallback: t('expirations.invoiceFallback'),
                      }}
                    />
                  </SectionCard>
                </div>
              </div>
            )
          : null}
      </div>
    </div>
  );
}
