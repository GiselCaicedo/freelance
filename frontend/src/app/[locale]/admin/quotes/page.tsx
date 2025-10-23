import { cookies } from 'next/headers';
import QuoteListView from '@/components/quotes/QuoteListView';
import type { QuoteSummary } from '@/components/quotes/types';
import { getAdminQuotesListApi } from '@/shared/services/conexion';

export default async function QuotesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let quotes: QuoteSummary[] = [];
  let error: string | null = null;

  if (!token) {
    error = 'No se encontró una sesión activa.';
  } else {
    try {
      quotes = await getAdminQuotesListApi(token);
    } catch (err) {
      console.error('Failed to load quotes list', err);
      error = err instanceof Error ? err.message : 'No fue posible cargar las cotizaciones.';
    }
  }

  return (
    <div className="  lg:px-8">
      <div className="mx-auto w-full space-y-6">
        <QuoteListView initialQuotes={quotes} initialError={error} />
      </div>
    </div>
  );
}