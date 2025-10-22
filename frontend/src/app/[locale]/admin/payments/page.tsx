import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import PaymentListView from '@/components/payments/PaymentListView';
import { getAdminPaymentsListApi } from '@/shared/services/conexion';
import type { PaymentClient, PaymentMethod, PaymentRecord } from '@/components/payments/types';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Pagos',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function PagosPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let payments: PaymentRecord[] = [];
  let clients: PaymentClient[] = [];
  let methods: PaymentMethod[] = [];
  let error: string | null = null;

  if (!token) {
    error = 'No se encontró una sesión activa.';
  } else {
    try {
      const payload = await getAdminPaymentsListApi(token);
      payments = Array.isArray(payload.payments) ? payload.payments : [];
      clients = Array.isArray(payload.clients) ? payload.clients : [];
      methods = Array.isArray(payload.methods) ? payload.methods : [];
    } catch (err) {
      console.error('Failed to load payments list', err);
      error = err instanceof Error ? err.message : 'No fue posible cargar los pagos.';
    }
  }

  return (
    <div className="lg:px-8">
      <div className="mx-auto w-full space-y-6">
        <PaymentListView
          initialPayments={payments}
          initialClients={clients}
          initialMethods={methods}
          initialError={error}
        />
      </div>
    </div>
  );
}

