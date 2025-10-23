import type { ServiceCategory, ServiceListPayload, ServiceRecord } from '@admin/services/types';
import type { TaxRecord } from '@admin/settings/taxes/types';
import type { Metadata } from 'next';
import ServiceListView from '@admin/services/components/ServiceListView';

import { getAdminServicesListApi, getAdminTaxesApi } from '@shared/services/conexion';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Servicios',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function ServicesPage(props: { params: Promise<{ locale: string }> }) {
  await props.params; // mantener compatibilidad con el layout

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let services: ServiceRecord[] = [];
  let categories: ServiceCategory[] = [];
  let taxes: TaxRecord[] = [];
  let error: string | null = null;

  try {
    const payload: ServiceListPayload = await getAdminServicesListApi(token);
    services = Array.isArray(payload.services) ? payload.services : [];
    categories = Array.isArray(payload.categories) ? payload.categories : [];
  } catch (err: any) {
    console.error('Failed to load services', err);
    error = err?.message ?? 'No fue posible cargar los servicios.';
  }

  try {
    taxes = await getAdminTaxesApi(token);
  } catch (err: any) {
    console.error('Failed to load taxes', err);
  }

  return (
    <div className="lg:px-8">
      <div className="mx-auto w-full space-y-6">
        <ServiceListView
          initialServices={services}
          initialCategories={categories}
          initialTaxes={taxes}
          initialError={error}
        />
      </div>
    </div>
  );
}
