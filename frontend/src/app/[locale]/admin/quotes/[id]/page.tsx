import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import QuoteDetailPageView from '@/components/quotes/QuoteDetailPageView';
import { getAdminQuoteDetailApi } from '@/shared/services/conexion';

export default async function QuoteDetailPage(props: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    notFound();
  }

  try {
    const detail = await getAdminQuoteDetailApi(id, token);
    if (!detail) {
      notFound();
    }

    return (
      <div className="  lg:px-8">
        <div className="mx-auto w-full space-y-6">
          <QuoteDetailPageView initialQuote={detail} locale={locale} quoteId={id} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load quote detail', error);
    notFound();
  }
}

