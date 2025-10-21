'use client';

import { useMemo, useState } from 'react';
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
} from './mockData';

type ClientListViewProps = {
  initialClients: ClientRecord[];
  initialParameters: ClientParameter[];
};

type ClientRow = ClientRecord & {
  parameterValues: Record<string, string>;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(value));

const statusLabel: Record<ClientStatus, { label: string; tone: string }> = {
  active: { label: 'Activo', tone: 'bg-emerald-100 text-emerald-700' },
  onboarding: { label: 'Onboarding', tone: 'bg-blue-100 text-blue-700' },
  inactive: { label: 'Inactivo', tone: 'bg-amber-100 text-amber-700' },
};

const typeLabel: Record<ClientType, string> = {
  natural: 'Natural',
  juridica: 'Jurídica',
};

export default function ClientListView({ initialClients, initialParameters }: ClientListViewProps) {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const [clients, setClients] = useState<ClientRecord[]>(() =>
    initialClients.map((client) => ({
      ...client,
      details: client.details.map((detail) => ({ ...detail })),
      services: client.services.map((service) => ({ ...service })),
      quotes: client.quotes.map((quote) => ({ ...quote })),
      payments: client.payments.map((payment) => ({ ...payment })),
      invoices: client.invoices.map((invoice) => ({ ...invoice })),
      reminders: client.reminders.map((reminder) => ({ ...reminder })),
    })),
  );
  const [parameters, setParameters] = useState<ClientParameter[]>(() => initialParameters.map((parameter) => ({ ...parameter })));
  const [quickFilter, setQuickFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);
  // Fase 1: sin creación/edición de estructura de parámetros desde esta vista

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

  // Nota: creación de parámetros se implementará en Fase 2

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
        valueFormatter: (params) => formatDate(params.value as string),
      },
      {
        headerName: 'Actualizado',
        field: 'updatedAt',
        minWidth: 140,
        valueFormatter: (params) => formatDate(params.value as string),
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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Clientes</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Gestión y seguimiento de clientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Administra la relación con cada cliente, sus campos personalizados y servicios asociados usando estructuras compatibles con las tablas <code className="rounded bg-gray-100 px-1">client</code>, <code className="rounded bg-gray-100 px-1">client_details</code> y <code className="rounded bg-gray-100 px-1">client_service</code>.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={quickFilter}
              onChange={(event) => setQuickFilter(event.target.value)}
              placeholder="Filtrar clientes..."
              className="w-full rounded-full border border-gray-200 px-3 py-2 pl-9 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <Plus className="h-4 w-4" /> Agregar cliente
          </button>
        </div>
      </header>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
            <span>La tabla soporta filtros, ordenamiento y búsqueda en vivo.</span>
          </div>
          <span className="text-xs text-gray-500">{clients.length} clientes registrados</span>
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

      {/* Sección de estructura de campos personalizados se habilitará en Fase 2 */}

      <ClientFormModal
        open={isAddModalOpen}
        title="Agregar nuevo cliente"
        submitLabel="Guardar cliente"
        parameters={parameters}        onSubmit={handleCreateClient}
        onClose={() => setIsAddModalOpen(false)}
      />

      <DeleteClientModal
        open={Boolean(clientToDelete)}
        clientName={clientToDelete?.name ?? ''}
        onConfirm={handleDeleteClient}
        onClose={() => setClientToDelete(null)}
      />
    </div>
  );
}


