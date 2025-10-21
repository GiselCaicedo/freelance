import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAdminDashboardSummary } from '@/panels/admin/data/dashboard';
import { MetricCard } from '@/panels/admin/components/dashboard/MetricCard';
import { SectionCard } from '@/panels/admin/components/dashboard/SectionCard';
import { UpcomingExpirationsCard } from '@/panels/admin/components/dashboard/UpcomingExpirationsCard';
import { ClientStatusCard } from '@/panels/admin/components/dashboard/ClientStatusCard';
import { TopServicesCard } from '@/panels/admin/components/dashboard/TopServicesCard';
import { MonthlyComparisonCard } from '@/panels/admin/components/dashboard/MonthlyComparisonCard';
import { DashboardFilters } from '@/panels/admin/components/dashboard/DashboardFilters';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';

function toDateInput(value: string | null | undefined, adjustDays = 0): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  if (adjustDays !== 0) {
    date.setDate(date.getDate() + adjustDays);
  }
  return date.toISOString().slice(0, 10);
}

function shiftIso(value: string | null | undefined, days: number): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

type SearchParams = { from?: string | string[]; to?: string | string[] };

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
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

        <section className="rounded-3xl border border-gray-200 bg-white px-8 py-10 space-y-6">
          <DashboardFilters
            initialFrom={initialFromInput}
            initialTo={initialToInput}
            defaultFrom={fallbackFromInput}
            defaultTo={fallbackToInput}
          />

          {summary ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard title={t('metrics.totalBilled')} value={billed} hint={periodHint ?? undefined} />
              <MetricCard
                title={t('metrics.pendingCollection')}
                value={pending}
                hint={t('metrics.pendingHint')}
                tone="secondary"
              />
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </section>

        {summary ? (
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
                    serviceFallback: t('expirations.serviceFallback'),
                  }}
                />
              </SectionCard>

              <SectionCard title={t('clientStatus.title')} description={t('clientStatus.description')}>
                <ClientStatusCard
                  locale={locale}
                  status={summary.clientStatus}
                  labels={{
                    active: t('clientStatus.active'),
                    inactive: t('clientStatus.inactive'),
                    unknown: t('clientStatus.unknown'),
                    total: (count: number) => t('clientStatus.total', { count }),
                  }}
                />
              </SectionCard>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
