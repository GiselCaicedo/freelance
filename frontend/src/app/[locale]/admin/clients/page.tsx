import ClientListView from '@/components/clients/ClientListView';
import { cloneClient, cloneParameters, mockClients } from '@/components/clients/mockData';

export default async function ClientsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;

  const clients = mockClients.map(cloneClient);
  const parameters = cloneParameters();

  return (
    <div className="px-6 py-10 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <ClientListView initialClients={clients} initialParameters={parameters} />
      </div>
    </div>
  );
}

