'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { ArrowLeft, Calendar, Clock, FileText, ShieldAlert, ShieldCheck, Trash2, Zap } from 'lucide-react';
import ClientFormModal, { type ClientFormResult } from './ClientFormModal';
import DeleteClientModal from './DeleteClientModal';
import AssignServicePanel from './AssignServicePanel';
import type {
  AssignServiceInput,
  ClientParameter,
  ClientRecord,
  ClientService,
  ServiceCatalogEntry,
  ClientStatus,
  ClientReminderStatus,
} from './types';
import SidePanel from '@/shared/components/common/SidePanel';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { formatCurrency as formatCurrencyIntl } from '@/shared/utils/formatters';
import { updateAdminClientApi, deleteAdminClientApi, assignClientServiceApi } from '@/shared/services/conexion';
import AgTable from '@/components/datagrid/AgTable';

type ClientDetailViewProps = {
  client: ClientRecord;
  parameters: ClientParameter[];
  serviceCatalog: ServiceCatalogEntry[];
  locale: string;
};

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};

const formatDateTime = (value: string | null | undefined, locale: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const statusPalette: Record<ClientStatus, { label: string; tone: string; border: string }> = {
  active: { label: 'Activo', tone: 'text-emerald-700 bg-emerald-50', border: 'border-emerald-200' },
  onboarding: { label: 'Onboarding', tone: 'text-blue-700 bg-blue-50', border: 'border-blue-200' },
  inactive: { label: 'Inactivo', tone: 'text-amber-700 bg-amber-50', border: 'border-amber-200' },
};

const reminderStatusPalette: Record<ClientReminderStatus, { label: string; tone: string }> = {
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  enviado: { label: 'Enviado', tone: 'bg-blue-100 text-blue-700' },
  confirmado: { label: 'Confirmado', tone: 'bg-emerald-100 text-emerald-700' },
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

export default function ClientDetailView({ client, parameters, serviceCatalog, locale }: ClientDetailViewProps) {
  const router = useRouter();
  const [clientState, setClientState] = useState<ClientRecord>(() => cloneClientRecord(client));
  const [parametersState] = useState<ClientParameter[]>(() => parameters.map((parameter) => ({ ...parameter })));
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignServiceOpen, setIsAssignServiceOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const palette =
    statusPalette[clientState.status] ??
    ({ label: clientState.status, tone: 'text-gray-700  -100', border: 'border-gray-200' } as const);

  const customValues = useMemo(() => {
    const map: Record<string, string> = {};
    clientState.details.forEach((detail) => {
      map[detail.parameterId] = detail.value;
    });
    return map;
  }, [clientState.details]);

  const handleUpdateClient = async (payload: ClientFormResult) => {
    try {
      const result = await updateAdminClientApi(clientState.id, payload);
      setClientState(cloneClientRecord(result.client));
    } catch (error: any) {
      console.error('Failed to update client', error);
      throw error instanceof Error ? error : new Error('No fue posible actualizar el cliente.');
    }
  };

  // Fase 1: sin creación de nuevos parámetros desde esta vista

  const handleAssignService = async (payload: AssignServiceInput) => {
    try {
      const result = await assignClientServiceApi(clientState.id, payload);
      setClientState((prev) => ({
        ...prev,
        services: [...prev.services.filter((service) => service.id !== result.service.id), result.service],
        updatedAt: result.clientUpdatedAt ?? prev.updatedAt,
      }));
    } catch (error: any) {
      console.error('Failed to assign service', error);
      throw error instanceof Error ? error : new Error('No fue posible asignar el servicio.');
    }
  };

  const handleDelete = async (_authCode: string) => {
    try {
      await deleteAdminClientApi(clientState.id);
      setIsDeleteOpen(false);
      router.push(`/${locale}/admin/clients`);
    } catch (error: any) {
      console.error('Failed to delete client', error);
      throw error instanceof Error ? error : new Error('No fue posible eliminar el cliente.');
    }
  };

  const infoBlocks = [
    {
      label: 'Creado',
      value: formatDate(clientState.createdAt, locale),
      icon: Calendar,
    },
    {
      label: 'Actualizado',
      value: formatDateTime(clientState.updatedAt, locale),
      icon: Clock,
    },
    {
      label: 'Servicios activos',
      value: clientState.services.length.toString(),
      icon: Zap,
    },
    {
      label: 'Recordatorios',
      value: clientState.reminders.length.toString(),
      icon: ShieldAlert,
    },
  ];

  const formatCurrency = (value: number) => formatCurrencyIntl(value ?? 0, locale);

  const availableServiceCatalog = useMemo(
    () =>
      serviceCatalog.filter(
        (entry) => !clientState.services.some((service) => service.serviceId === entry.id),
      ),
    [serviceCatalog, clientState.services],
  );

  const canAssignService = availableServiceCatalog.length > 0;

  const serviceColumns = useMemo<ColDef<ClientService>[]>(
    () => [
      {
        headerName: 'Servicio',
        field: 'name',
        flex: 1.4,
        minWidth: 220,
        cellRenderer: (params: ICellRendererParams<ClientService>) => (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{params.data.name}</span>
            <span className="text-xs text-gray-500">{params.data.serviceId}</span>
          </div>
        ),
      },
      {
        headerName: 'Inicio',
        field: 'started',
        minWidth: 140,
        valueFormatter: (params) => formatDate(params.value as string | null | undefined, locale),
      },
      {
        headerName: 'Entrega',
        field: 'delivery',
        minWidth: 140,
        valueFormatter: (params) => formatDate(params.value as string | null | undefined, locale),
      },
      {
        headerName: 'Expira',
        field: 'expiry',
        minWidth: 140,
        valueFormatter: (params) => formatDate(params.value as string | null | undefined, locale),
      },
      {
        headerName: 'Frecuencia',
        field: 'frequency',
        minWidth: 160,
        valueGetter: (params) => {
          const frequency = params.data?.frequency ?? '';
          const unit = params.data?.unit ?? '';
          if (!frequency && !unit) return '—';
          return [frequency, unit].filter(Boolean).join(' ');
        },
      },
      {
        headerName: 'Integración',
        field: 'urlApi',
        minWidth: 150,
        cellRenderer: (params: ICellRendererParams<ClientService>) =>
          params.data?.urlApi ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> API
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          ),
      },
    ],
    [locale],
  );

  const serviceTableHeight = useMemo(() => {
    const rows = clientState.services.length;
    if (rows === 0) return 280;
    return Math.min(560, Math.max(280, 160 + rows * 46));
  }, [clientState.services.length]);

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/clients`)}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-emerald-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al listado
        </button>
        <Breadcrumbs
          items={[
            { label: 'Panel admin', href: `/${locale}/admin/dashboard` },
            { label: 'Clientes', href: `/${locale}/admin/clients` },
            { label: clientState.name },
          ]}
        />
      </div>
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 border border-gray-200 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">{clientState.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${palette.tone} ${palette.border}`}>
              {palette.label}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
              {clientState.type === 'juridica' ? 'Jurídico' : 'Natural'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setIsAssignServiceOpen(true)}
            disabled={!canAssignService}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            title={canAssignService ? undefined : 'Todos los servicios disponibles ya fueron asignados'}
          >
            Asignar servicio
          </button>
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-gray-200 bg-white p-6 border border-gray-200 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Información general</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {parametersState.map((parameter) => (
              <div key={parameter.id} className="rounded-2xl border border-gray-200  -50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{parameter.name}</p>
                <p className="mt-2 text-sm font-semibold text-gray-800">
                  {customValues[parameter.id] || '—'}
                </p>
                <p className="mt-1 text-xs text-gray-500">ID parámetro: <code className="rounded bg-white px-1">{parameter.id}</code></p>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-3 rounded-3xl border border-gray-200 bg-white p-6 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">Resumen</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            {infoBlocks.map((block) => (
              <li key={block.label} className="flex items-center gap-3 rounded-2xl border border-gray-100 px-3 py-3">
                <block.icon className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{block.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{block.value}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 border border-gray-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Servicios asociados</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsAssignServiceOpen(true)}
            disabled={!canAssignService}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            title={canAssignService ? undefined : 'Todos los servicios disponibles ya fueron asignados'}
          >
            <Zap className="h-3.5 w-3.5" /> Asignar nuevo servicio
          </button>
        </div>

        <div className="mt-4">
          {clientState.services.length > 0 ? (
            <AgTable<ClientService>
              rows={clientState.services}
              columns={serviceColumns}
              getRowId={(row) => row.id}
              height={serviceTableHeight}
              enableColumnFilters
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
              Aún no hay servicios asociados. Usa el botón “Asignar servicio” para vincular uno nuevo.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-gray-200 bg-white p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Cotizaciones</h2>
            <FileText className="h-5 w-5 text-emerald-500" />
          </div>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            {clientState.quotes.map((quote) => (
              <li key={quote.id} className="rounded-2xl border border-gray-200  -50 px-4 py-3">
                <p className="flex items-center justify-between text-sm font-semibold text-gray-800">
                  <span>{quote.reference}</span>
                  <span>{formatCurrency(quote.amount)}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">Emisión: {formatDate(quote.issuedAt, locale)}</p>
                <p className="mt-1 text-xs text-gray-500">Estado: {quote.status}</p>
              </li>
            ))}
            {clientState.quotes.length === 0 && <li className="rounded-2xl border border-dashed border-gray-200  -50 px-4 py-3 text-xs text-gray-500">Sin registros de cotizaciones.</li>}
          </ul>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Historial de pagos</h2>
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            {clientState.payments.map((payment) => (
              <li key={payment.id} className="rounded-2xl border border-gray-200  -50 px-4 py-3">
                <p className="flex items-center justify-between text-sm font-semibold text-gray-800">
                  <span>{payment.reference}</span>
                  <span>{formatCurrency(payment.amount)}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">Fecha: {formatDate(payment.paidAt, locale)}</p>
                <p className="mt-1 text-xs text-gray-500">Método: {payment.method}</p>
              </li>
            ))}
            {clientState.payments.length === 0 && <li className="rounded-2xl border border-dashed border-gray-200  -50 px-4 py-3 text-xs text-gray-500">Sin pagos registrados.</li>}
          </ul>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Facturas</h2>
            <FileText className="h-5 w-5 text-emerald-500" />
          </div>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            {clientState.invoices.map((invoice) => (
              <li key={invoice.id} className="rounded-2xl border border-gray-200  -50 px-4 py-3">
                <p className="flex items-center justify-between text-sm font-semibold text-gray-800">
                  <span>{invoice.number}</span>
                  <span>{formatCurrency(invoice.amount)}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">Emisión: {formatDate(invoice.issuedAt, locale)}</p>
                <p className="mt-1 text-xs text-gray-500">Vence: {formatDate(invoice.dueAt, locale)}</p>
                <p className="mt-1 text-xs text-gray-500">Estado: {invoice.status}</p>
              </li>
            ))}
            {clientState.invoices.length === 0 && <li className="rounded-2xl border border-dashed border-gray-200  -50 px-4 py-3 text-xs text-gray-500">Sin facturas emitidas.</li>}
          </ul>
        </article>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recordatorios</h2>
          <ShieldAlert className="h-5 w-5 text-amber-500" />
        </div>
        {clientState.reminders.length > 0 ? (
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {clientState.reminders.map((reminder) => {
              const palette = reminderStatusPalette[reminder.status] ?? {
                label: reminder.status,
                tone: 'bg-gray-100 text-gray-600',
              };
              return (
                <li key={reminder.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">{reminder.concept}</p>
                  <p className="mt-1 text-xs text-gray-500">Vence: {formatDate(reminder.dueAt, locale)}</p>
                  <p className="mt-1 text-xs text-gray-500">Monto: {formatCurrency(reminder.amount)}</p>
                  <span className={`mt-2 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${palette.tone}`}>
                    {palette.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
            Los recordatorios se generan automáticamente a partir de las facturas con fecha de vencimiento.
          </p>
        )}
      </section>

      <SidePanel
        open={isEditOpen}
        title="Editar cliente"
        onClose={() => setIsEditOpen(false)}
        reserveRef={containerRef}
      >
        <ClientFormModal
          open={isEditOpen}
          title="Editar cliente"
          submitLabel="Guardar cambios"
          parameters={parametersState}
          onSubmit={handleUpdateClient}
          onClose={() => setIsEditOpen(false)}
          defaultValues={{
            name: clientState.name,
            type: clientState.type,
            status: clientState.status,
            details: clientState.details,
          }}

        />
      </SidePanel>

      <SidePanel
        open={isAssignServiceOpen}
        title="Asignar servicio"
        onClose={() => setIsAssignServiceOpen(false)}
        reserveRef={containerRef}
      >
        <AssignServicePanel
          open={isAssignServiceOpen}
          onClose={() => setIsAssignServiceOpen(false)}
          onSubmit={handleAssignService}
          servicesCatalog={availableServiceCatalog}
        />
      </SidePanel>

      <DeleteClientModal
        open={isDeleteOpen}
        clientName={clientState.name}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteOpen(false)}
        confirmLabel="Eliminar definitivamente"
      />

    </div>
  );
}

