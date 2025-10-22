'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, FileText, PencilLine, ShieldAlert, ShieldCheck, Trash2, Zap } from 'lucide-react';
import ClientFormModal, { type ClientFormResult } from './ClientFormModal';
import DeleteClientModal from './DeleteClientModal';
import AssignServicePanel from './AssignServicePanel';
import type {
  ClientParameter,
  ClientRecord,
  ServiceCatalogEntry,
  ClientStatus,
  ClientReminderStatus,
  AssignServiceInput,
} from './types';
import SidePanel from '@/shared/components/common/SidePanel';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { formatCurrency as formatCurrencyIntl } from '@/shared/utils/formatters';
import { assignClientServiceApi, updateAdminClientApi, deleteAdminClientApi } from '@/shared/services/conexion';
import { useAlerts } from '@/shared/components/common/AlertsProvider';

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
  const { notify } = useAlerts();
  const [clientState, setClientState] = useState<ClientRecord>(() => cloneClientRecord(client));
  const [parametersState] = useState<ClientParameter[]>(() => parameters.map((parameter) => ({ ...parameter })));
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAssignServiceOpen, setIsAssignServiceOpen] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

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
      const service = await assignClientServiceApi(clientState.id, payload);
      setClientState((prev) => {
        const nextServices = prev.services.filter((item) => item.id !== service.id);
        return {
          ...prev,
          services: [...nextServices, service],
          updatedAt: service.updatedAt ?? new Date().toISOString(),
        };
      });
      setServiceError(null);
      notify({
        type: 'success',
        title: 'Servicio asignado',
        description: 'El servicio fue vinculado correctamente al cliente.',
      });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'No fue posible asignar el servicio.';
      setServiceError(message);
      notify({
        type: 'error',
        title: 'No fue posible asignar el servicio',
        description: message,
      });
      throw error instanceof Error ? error : new Error(message);
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
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
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
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <Zap className="h-3.5 w-3.5" /> Asignar nuevo servicio
          </button>
        </div>

        {serviceError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serviceError}
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          {clientState.services.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">Servicio</th>
                  <th scope="col" className="px-4 py-3 text-left">Inicio</th>
                  <th scope="col" className="px-4 py-3 text-left">Entrega</th>
                  <th scope="col" className="px-4 py-3 text-left">Expira</th>
                  <th scope="col" className="px-4 py-3 text-left">Frecuencia</th>
                  <th scope="col" className="px-4 py-3 text-left">Integración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientState.services.map((service) => (
                  <tr key={service.id} className="bg-white">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{service.name}</span>
                        <span className="text-xs text-gray-500">{service.serviceId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(service.started, locale)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(service.delivery, locale)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(service.expiry, locale)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {service.frequency ? `${service.frequency} ${service.unit ?? ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {service.urlApi ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          <ShieldCheck className="h-3.5 w-3.5" /> API
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          servicesCatalog={serviceCatalog}
        />
      </SidePanel>

      <SidePanel title="Eliminar cliente" open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} width={420} className="border-gray-300">
        <DeleteClientModal
          open={isDeleteOpen}
          clientName={clientState.name}
          onConfirm={handleDelete}
          onClose={() => setIsDeleteOpen(false)}
          confirmLabel="Eliminar definitivamente"
        />
      </SidePanel>


    </div>
  );
}

