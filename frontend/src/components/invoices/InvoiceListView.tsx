'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Pencil, PlusCircle, RefreshCcw, Trash2 } from 'lucide-react';
import type {
  AdminInvoiceCatalog,
  AdminInvoiceListItem,
  AdminInvoiceRecord,
  AdminInvoiceStatus,
  PersistAdminInvoiceInput,
} from '@/panels/admin/data/invoices';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import {
  createAdminInvoiceApi,
  deleteAdminInvoiceApi,
  getAdminInvoiceByIdApi,
  getAdminInvoicesApi,
  updateAdminInvoiceApi,
} from '@/shared/services/conexion';

type InvoiceListViewProps = {
  initialInvoices: AdminInvoiceListItem[];
  initialCatalog: AdminInvoiceCatalog;
  initialError?: string | null;
};

type MutationState = 'idle' | 'creating' | 'editing';

const STATUS_LABELS: Record<AdminInvoiceStatus, string> = {
  paid: 'Pagada',
  pending: 'Pendiente',
  overdue: 'Vencida',
  cancelled: 'Anulada',
};

const STATUS_STYLES: Record<AdminInvoiceStatus, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  overdue: 'bg-rose-50 text-rose-700 border-rose-100',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const formatCurrency = (value: number) =>
  value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
};

const mapRecordToListItem = (record: AdminInvoiceRecord): AdminInvoiceListItem => ({
  id: record.id,
  number: record.number,
  clientId: record.clientId,
  clientName: record.clientName,
  amount: record.amount,
  issuedAt: record.issuedAt,
  dueAt: record.dueAt,
  status: record.status,
  services: Array.isArray(record.details) ? record.details.length : 0,
});

export default function InvoiceListView({
  initialInvoices,
  initialCatalog,
  initialError = null,
}: InvoiceListViewProps) {
  const [invoices, setInvoices] = useState<AdminInvoiceListItem[]>(initialInvoices);
  const [catalog] = useState<AdminInvoiceCatalog>(initialCatalog);
  const [error, setError] = useState<string | null>(initialError);
  const [mutationState, setMutationState] = useState<MutationState>('idle');
  const [editingInvoice, setEditingInvoice] = useState<AdminInvoiceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const hasInvoices = useMemo(() => invoices.length > 0, [invoices]);

  const closeForm = () => {
    setMutationState('idle');
    setEditingInvoice(null);
    setSubmitting(false);
    setLoadingInvoice(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const payload = await getAdminInvoicesApi();
      setInvoices(payload.invoices ?? []);
      setError(null);
    } catch (refreshError: any) {
      console.error('InvoiceListView refresh error', refreshError);
      const message = refreshError instanceof Error ? refreshError.message : 'No fue posible actualizar el listado.';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreate = async (payload: PersistAdminInvoiceInput) => {
    setSubmitting(true);
    try {
      const record = await createAdminInvoiceApi(payload);
      setInvoices((current) => {
        const mapped = mapRecordToListItem(record);
        const filtered = current.filter((invoice) => invoice.id !== mapped.id);
        return [mapped, ...filtered];
      });
      setError(null);
      closeForm();
    } catch (createError: any) {
      console.error('InvoiceListView create error', createError);
      const message = createError instanceof Error ? createError.message : 'No fue posible crear la factura.';
      setError(message);
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (payload: PersistAdminInvoiceInput) => {
    if (!editingInvoice) return;
    setSubmitting(true);
    try {
      const record = await updateAdminInvoiceApi(editingInvoice.id, payload);
      setInvoices((current) => {
        const mapped = mapRecordToListItem(record);
        const filtered = current.filter((invoice) => invoice.id !== mapped.id);
        return [mapped, ...filtered];
      });
      setError(null);
      closeForm();
    } catch (updateError: any) {
      console.error('InvoiceListView update error', updateError);
      const message = updateError instanceof Error ? updateError.message : 'No fue posible actualizar la factura.';
      setError(message);
      setSubmitting(false);
    }
  };

  const openCreate = () => {
    setMutationState('creating');
    setEditingInvoice(null);
    setError(null);
  };

  const openEdit = async (id: string) => {
    setMutationState('editing');
    setLoadingInvoice(true);
    try {
      const record = await getAdminInvoiceByIdApi(id);
      if (!record) {
        setError('No encontramos la factura seleccionada.');
        closeForm();
        return;
      }
      setEditingInvoice(record);
      setError(null);
    } catch (loadError: any) {
      console.error('InvoiceListView load error', loadError);
      const message = loadError instanceof Error ? loadError.message : 'No fue posible cargar la factura.';
      setError(message);
      closeForm();
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmation = window.confirm('¿Deseas eliminar esta factura? Esta acción no se puede deshacer.');
    if (!confirmation) return;
    try {
      await deleteAdminInvoiceApi(id);
      setInvoices((current) => current.filter((invoice) => invoice.id !== id));
      setError(null);
    } catch (deleteError: any) {
      console.error('InvoiceListView delete error', deleteError);
      const message = deleteError instanceof Error ? deleteError.message : 'No fue posible eliminar la factura.';
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Facturas</h1>
          <p className="text-sm text-gray-500">Gestiona facturas, descargas y envíos a clientes desde un único lugar.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Actualizar
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Nueva factura
          </button>
        </div>
      </div>

      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {mutationState === 'creating' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <InvoiceForm
            catalog={catalog}
            variant="create"
            submitting={submitting}
            onSubmit={handleCreate}
            onCancel={closeForm}
          />
        </div>
      )}

      {mutationState === 'editing' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {loadingInvoice ? (
            <p className="text-sm text-gray-500">Cargando factura…</p>
          ) : (
            <InvoiceForm
              catalog={catalog}
              variant="edit"
              defaultValue={editingInvoice}
              submitting={submitting}
              onSubmit={handleEditSubmit}
              onCancel={closeForm}
            />
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Factura</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Monto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Emisión</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Vencimiento</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Servicios</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {hasInvoices ? (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.number}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{invoice.clientName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(invoice.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(invoice.issuedAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(invoice.dueAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{invoice.services}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[invoice.status]}`}>
                      {STATUS_LABELS[invoice.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`./${invoice.id}`}
                        className="inline-flex items-center rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-50"
                      >
                        <ArrowUpRight className="mr-1 h-4 w-4" /> Ver
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEdit(invoice.id)}
                        className="inline-flex items-center rounded-md border border-emerald-200 px-2 py-1 text-xs text-emerald-700 transition hover:bg-emerald-50"
                      >
                        <Pencil className="mr-1 h-4 w-4" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(invoice.id)}
                        className="inline-flex items-center rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                  No hay facturas registradas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
