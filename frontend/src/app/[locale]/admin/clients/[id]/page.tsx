import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ClientDetailView from '@/components/clients/ClientDetailView';
import { getAdminClientDetailApi } from '@/shared/services/conexion';

export default async function ClientDetailPage(props: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await props.params;
  const token = cookies().get('auth_token')?.value;

  if (!token) {
    notFound();
  }

  try {
    const detail = await getAdminClientDetailApi(id, token);
    if (!detail) {
      notFound();
    }

    const { client, parameters, serviceCatalog } = detail;

    return (
      <div className="  lg:px-8">
        <div className="mx-auto w-full">
          <ClientDetailView
            client={client}
            parameters={parameters}
            serviceCatalog={serviceCatalog}
            locale={locale}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load client detail', error);
    notFound();
  }
}
