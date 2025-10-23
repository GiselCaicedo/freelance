import type { ClientParameter, ClientRecord } from '@admin/clients/types';
import ClientListView from '@admin/clients/components/ClientListView';
import { getAdminClientsListApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function ClientsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let clients: ClientRecord[] = [];
  let parameters: ClientParameter[] = [];
  let error: string | null = null;

  if (!token) {
    error = 'No se encontró una sesión activa.';
  } else {
    try {
      const payload = await getAdminClientsListApi(token);
      clients = Array.isArray(payload.clients) ? payload.clients : [];
      parameters = Array.isArray(payload.parameters) ? payload.parameters : [];
    } catch (err) {
      console.error('Failed to load clients list', err);
      error = err instanceof Error ? err.message : 'No fue posible cargar los clientes.';
    }
  }

  return (
    <div className="  lg:px-8">
      <div className="mx-auto w-full space-y-6">
        <ClientListView initialClients={clients} initialParameters={parameters} initialError={error} />
      </div>
    </div>
  );
}
