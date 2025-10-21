'use client';

import { use, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Search, SlidersHorizontal, Users, Eye, Trash2 } from 'lucide-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import AgTable from '@/components/datagrid/AgTable';
import ClientFormModal, { type ClientFormResult } from './ClientFormModal';
import DeleteClientModal from './DeleteClientModal';
import type {
  ClientParameter,
  ClientRecord,
  ClientDetailValue,
  ClientStatus,
  ClientType,
} from './types';
import SidePanel from '@/shared/components/common/SidePanel';

type ClientListViewProps = {
  initialClients: ClientRecord[];
  initialParameters: ClientParameter[];
  initialError?: string | null;
};

type ClientRow = ClientRecord & {
  parameterValues: Record<string, string>;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
};

const statusLabel: Record<ClientStatus, { label: string; tone: string }> = {
  active: { label: 'Activo', tone: 'bg-emerald-100 text-emerald-700' },
  onboarding: { label: 'Onboarding', tone: 'bg-blue-100 text-blue-700' },
  inactive: { label: 'Inactivo', tone: 'bg-amber-100 text-amber-700' },
};

const typeLabel: Record<ClientType, string> = {
  natural: 'Natural',
  juridica: 'Jurídica',
};

const cloneClientRecord = (client: ClientRecord): ClientRecord => ({
  ...client,
  details: Array.isArray(client.details) ? client.details.map((detail) => ({ ...detail })) : [],
  services: Array.isArray(client.services) ? client.services.map((service) => ({ ...service })) : [],
  quotes: Array.isArray(client.quotes) ? client.quotes.map((quote) => ({ ...quote })) : [],
  payments: Array.isArray(client.payments) ? client.payments.map((payment) => ({ ...payment })) : [],
  invoices: Array.isArray(client.invoices) ? client.invoices.map((invoice) => ({ ...invoice })) : [],
  reminders: Array.isArray(client.reminders) ? client.reminders.map((reminder) => ({ ...reminder })) : [],
});

export default function ClientListView({ initialClients, initialParameters, initialError = null }: ClientListViewProps) {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const [clients, setClients] = useState<ClientRecord[]>(() => initialClients.map(cloneClientRecord));
  const [parameters] = useState<ClientParameter[]>(() => initialParameters.map((parameter) => ({ ...parameter })));
  const [quickFilter, setQuickFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);


  const containerRef = useRef<HTMLDivElement>(null);

  const rows: ClientRow[] = useMemo(
    () =>
      clients.map((client) => {
        const map: Record<string, string> = {};
        client.details.forEach((detail) => {
          map[detail.parameterId] = detail.value;
        });
        return {
          ...client,
          parameterValues: map,
        };
      }),
    [clients],
  );

  const navigateToDetail = (clientId: string) => {
    router.push(`/${locale}/admin/clients/${clientId}`);
  };


  const handleCreateClient = (payload: ClientFormResult) => {
    const now = new Date().toISOString();
    const newClient: ClientRecord = {
      id: `client-${Date.now()}`,
      name: payload.name,
      type: payload.type,
      status: payload.status,
      createdAt: now,
      updatedAt: now,
      details: parameters.map<ClientDetailValue>((parameter) => ({
        parameterId: parameter.id,
        value: payload.details.find((detail) => detail.parameterId === parameter.id)?.value ?? '',
      })),
      services: [],
      quotes: [],
      payments: [],
      invoices: [],
      reminders: [],
    };
    setClients((prev) => [...prev, newClient]);
    setErrorMessage(null);
  };

  const handleDeleteClient = (authCode: string) => {
    console.info('Autenticación verificada con código', authCode);
    if (!clientToDelete) return;
    setClients((prev) => prev.filter((client) => client.id !== clientToDelete.id));
    setClientToDelete(null);
  };

  const columns = useMemo<ColDef<ClientRow>[]>(() => {
    const baseColumns: ColDef<ClientRow>[] = [
      {
        headerName: 'Nombre',
        field: 'name',
        flex: 1.2,
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<ClientRow>) => (
          <button
            type="button"
            onClick={() => navigateToDetail(params.data.id)}
            className="flex items-center gap-2 text-left text-sm font-semibold text-emerald-600 hover:underline"
          >
            <Users className="h-4 w-4" />
            {params.data.name}
          </button>
        ),
      },
      {
        headerName: 'Tipo',
        field: 'type',
        minWidth: 120,
        valueFormatter: (params) => typeLabel[params.value as ClientType],
      },
      {
        headerName: 'Estado',
        field: 'status',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<ClientRow>) => {
          const tone = statusLabel[params.data.status];
          if (!tone) {
            return (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {params.data.status}
              </span>
            );
          }
          return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone.tone}`}>
              {tone.label}
            </span>
          );
        },
      },
      {
        headerName: 'Creado',
        field: 'createdAt',
        minWidth: 140,
        valueFormatter: (params) => formatDate(params.value as string | null | undefined),
      },
      {
        headerName: 'Actualizado',
        field: 'updatedAt',
        minWidth: 140,
        valueFormatter: (params) => formatDate(params.value as string | null | undefined),
      },
    ];

    const dynamicColumns: ColDef<ClientRow>[] = parameters.map((parameter) => ({
      headerName: parameter.name,
      field: parameter.id,
      minWidth: 160,
      flex: 1,
      valueGetter: (params) => params.data.parameterValues[parameter.id] ?? '—',
      tooltipValueGetter: (params) => params.data.parameterValues[parameter.id] ?? '',
    }));

    const actionsColumn: ColDef<ClientRow> = {
      headerName: 'Acciones',
      field: 'actions',
      minWidth: 160,
      maxWidth: 180,
      pinned: 'right',
      suppressMenu: true,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<ClientRow>) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateToDetail(params.data.id)}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            <Eye className="h-3.5 w-3.5" /> Ver
          </button>
          <button
            type="button"
            onClick={() => setClientToDelete(params.data)}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        </div>
      ),
    };

    return [...baseColumns, ...dynamicColumns, actionsColumn];
  }, [navigateToDetail, parameters]);

  return (
    <div className="space-y-6" ref={containerRef}>
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 border border-gray-200 lg:flex-row lg:items-center lg:justify-between">
        <div>

          Gestion Clientes
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Crear Cliente
          </button>
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">

        </div>
        <AgTable<ClientRow>
          rows={rows}
          columns={columns}
          quickFilterText={quickFilter}
          enableColumnFilters
          getRowId={(data) => data.id}
          height={520}
        />
      </div>



      <SidePanel
        open={isAddModalOpen}
        title="Agregar nuevo cliente"
        onClose={() => setIsAddModalOpen(false)}
        reserveRef={containerRef}
      >
        <ClientFormModal
          open={isAddModalOpen}
          title="Agregar nuevo cliente"
          submitLabel="Guardar cliente"
          parameters={parameters}
          onSubmit={handleCreateClient}
          onClose={() => setIsAddModalOpen(false)}
        />

      </SidePanel>
      <DeleteClientModal
        open={Boolean(clientToDelete)}
        clientName={clientToDelete?.name ?? ''}
        onConfirm={handleDeleteClient}
        onClose={() => setClientToDelete(null)}
      />
    </div>
  );
}


