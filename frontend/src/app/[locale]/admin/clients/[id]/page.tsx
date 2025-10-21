import { notFound } from 'next/navigation';
import ClientDetailView from '@/components/clients/ClientDetailView';
import { cloneClient, cloneParameters, cloneServiceCatalog, getClientById } from '@/components/clients/mockData';

export default async function ClientDetailPage(props: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await props.params;

  const existing = getClientById(id);
  if (!existing) {
    notFound();
  }

  const client = cloneClient(existing!);
  const parameters = cloneParameters();
  const serviceCatalog = cloneServiceCatalog();

  return (
    <div className="px-6 py-10 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <ClientDetailView
          client={client}
          parameters={parameters}
          serviceCatalog={serviceCatalog}
          locale={locale}
        />
      </div>
    </div>
  );
}

