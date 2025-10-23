'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { ArrowUpRight, Pencil, PlusCircle, RefreshCcw, Search, Trash2 } from 'lucide-react';
import type {
  AdminInvoiceCatalog,
  AdminInvoiceListItem,
  AdminInvoiceRecord,
  AdminInvoiceStatus,
  PersistAdminInvoiceInput,
} from '@/panels/admin/data/invoices';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import AgTable from '@/components/datagrid/AgTable';
import SidePanel from '@/shared/components/common/SidePanel';
import PageHeader from '@/shared/components/common/PageHeader';
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

type InvoiceRow = AdminInvoiceListItem;

type PanelState = {
  open: boolean;
  mode: 'create' | 'edit';
  targetId: string | null;
};

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
  const { locale } = useParams() as { locale: string };
  const containerRef = useRef<HTMLDivElement>(null);

  const [invoices, setInvoices] = useState<AdminInvoiceListItem[]>(initialInvoices);
  const [catalog] = useState<AdminInvoiceCatalog>(initialCatalog);
  const [error, setError] = useState<string | null>(initialError);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [panel, setPanel] = useState<PanelState>({ open: false, mode: 'create', targetId: null });
  const [editingInvoice, setEditingInvoice] = useState<AdminInvoiceRecord | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [quickFilter, setQuickFilter] = useState('');

  const rows = useMemo<InvoiceRow[]>(() => invoices.map((invoice) => ({ ...invoice })), [invoices]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel admin', href: `/${locale}/admin/dashboard` },
      { label: 'Facturas' },
    ],
    [locale],
  );

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

  const openCreatePanel = () => {
    setPanel({ open: true, mode: 'create', targetId: null });
    setEditingInvoice(null);
    setSubmitting(false);
    setError(null);
  };

  const closePanel = () => {
    setPanel((prev) => ({ ...prev, open: false, targetId: null }));
    setEditingInvoice(null);
    setSubmitting(false);
    setLoadingInvoice(false);
  };

  const openEditPanel = async (id: string) => {
    setPanel({ open: true, mode: 'edit', targetId: id });
    setLoadingInvoice(true);
    setSubmitting(false);
    setError(null);
    try {
      const record = await getAdminInvoiceByIdApi(id);
      if (!record) {
        setError('No encontramos la factura seleccionada.');
        closePanel();
        return;
      }
      setEditingInvoice(record);
    } catch (loadError: any) {
      console.error('InvoiceListView load error', loadError);
      const message = loadError instanceof Error ? loadError.message : 'No fue posible cargar la factura.';
      setError(message);
      closePanel();
    } finally {
      setLoadingInvoice(false);
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
      closePanel();
    } catch (createError: any) {
      console.error('InvoiceListView create error', createError);
      const message = createError instanceof Error ? createError.message : 'No fue posible crear la factura.';
      setError(message);
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (payload: PersistAdminInvoiceInput) => {
    if (!panel.targetId) return;
    setSubmitting(true);
    try {
      const record = await updateAdminInvoiceApi(panel.targetId, payload);
      setInvoices((current) => {
        const mapped = mapRecordToListItem(record);
        const filtered = current.filter((invoice) => invoice.id !== mapped.id);
        return [mapped, ...filtered];
      });
      setError(null);
      closePanel();
    } catch (updateError: any) {
      console.error('InvoiceListView update error', updateError);
      const message = updateError instanceof Error ? updateError.message : 'No fue posible actualizar la factura.';
      setError(message);
      setSubmitting(false);
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

  const columns = useMemo<ColDef<InvoiceRow>>(
    () => [
      {
        headerName: 'Factura',
        field: 'number',
        flex: 1.2,
        minWidth: 160,
        cellRenderer: (params: ICellRendererParams<InvoiceRow>) => (
          <Link
            href={`/${locale}/admin/invoices/${params.data.id}`}
            className="inline-flex items-center gap-2 text-left text-sm font-semibold text-emerald-700 hover:underline"
          >
            <ArrowUpRight className="h-4 w-4" />
            {params.data.number}
          </Link>
        ),
      },
      {
        headerName: 'Cliente',
        field: 'clientName',
        minWidth: 200,
      },
      {
        headerName: 'Monto',
        field: 'amount',
        minWidth: 150,
        valueFormatter: (params) => formatCurrency(params.value as number),
      },
      {
        headerName: 'Emisión',
        field: 'issuedAt',
        minWidth: 150,
        valueFormatter: (params) => formatDate(params.value as string | null),
      },
      {
        headerName: 'Vencimiento',
        field: 'dueAt',
        minWidth: 150,
        valueFormatter: (params) => formatDate(params.value as string | null),
      },
      {
        headerName: 'Servicios',
        field: 'services',
        minWidth: 120,
        valueFormatter: (params) => `${params.value ?? 0}`,
      },
      {
        headerName: 'Estado',
        field: 'status',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<InvoiceRow>) => {
          const tone = STATUS_STYLES[params.data.status];
          return (
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
              {STATUS_LABELS[params.data.status]}
            </span>
          );
        },
      },
      {
        headerName: 'Acciones',
        field: 'actions',
        minWidth: 220,
        maxWidth: 240,
        pinned: 'right',
        suppressMenu: true,
        sortable: false,
        cellRenderer: (params: ICellRendererParams<InvoiceRow>) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/${locale}/admin/invoices/${params.data.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              Ver
            </Link>
            <button
              type="button"
              onClick={() => openEditPanel(params.data.id)}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(params.data.id)}
              className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          </div>
        ),
      },
    ],
    [locale, openEditPanel, handleDelete],
  );

  const actionButtons = (
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
        onClick={openCreatePanel}
        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Nueva factura
      </button>
    </div>
  );

  return (
    <div className="space-y-6" ref={containerRef}>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Facturas"
        description="Gestiona facturas, descargas y envíos a clientes desde un único lugar."
        actions={actionButtons}
      />

      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={quickFilter}
              onChange={(event) => setQuickFilter(event.target.value)}
              placeholder="Buscar factura…"
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        <div className="mt-4">
          <AgTable<InvoiceRow>
            rows={rows}
            columns={columns}
            quickFilterText={quickFilter}
            getRowId={(data) => data.id}
            height={520}
          />
        </div>
      </div>

      <SidePanel
        title={panel.mode === 'create' ? 'Crear factura' : 'Editar factura'}
        open={panel.open}
        onClose={closePanel}
        reserveRef={containerRef}
      >
        <div className="px-5 py-6">
          {panel.mode === 'edit' && loadingInvoice ? (
            <p className="text-sm text-gray-500">Cargando factura…</p>
          ) : (
            <InvoiceForm
              catalog={catalog}
              variant={panel.mode === 'create' ? 'create' : 'edit'}
              defaultValue={panel.mode === 'edit' ? editingInvoice : null}
              submitting={submitting}
              onSubmit={panel.mode === 'create' ? handleCreate : handleEditSubmit}
              onCancel={closePanel}
            />
          )}
        </div>
      </SidePanel>
    </div>
  );
}
