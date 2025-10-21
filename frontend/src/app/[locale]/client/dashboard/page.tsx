import { getTranslations } from 'next-intl/server';
import { getClientDashboardSummary } from '@/panels/client/data/dashboard';
import { formatDate } from '@/shared/utils/formatters';

export default async function ClientDashboard(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Client.Dashboard' });

  let summary: Awaited<ReturnType<typeof getClientDashboardSummary>> | null = null;
  let errorMessage: string | null = null;

  try {
    summary = await getClientDashboardSummary(locale);
  } catch (error) {
    console.error('Failed to load client dashboard summary', error);
    errorMessage = t('status.error');
  }

  return (
    <div className="px-6 py-10 lg:px-8">
      {summary && (
        <div>
          <p>Mensaje: {summary.message}</p>
          <p>Fecha: {formatDate(summary.fetchedAt)}</p>
          {summary.notices.map((notice) => (
            <div key={notice.id} className="mt-4">
              <h3 className="font-semibold">{notice.title}</h3>
              <p>{notice.description}</p>
            </div>
          ))}
        </div>
      )}
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
    </div>
  );
}
