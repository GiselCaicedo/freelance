'use client';

import { useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { CreditCard, Paperclip, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import AgTable from '@/components/datagrid/AgTable';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import SidePanel from '@/shared/components/common/SidePanel';
import PaymentFormDrawer from './PaymentFormDrawer';
import DeletePaymentModal from './DeletePaymentModal';
import type {
  PaymentClient,
  PaymentFormValues,
  PaymentMethod,
  PaymentRecord,
} from './types';
import {
  createAdminPaymentApi,
  deleteAdminPaymentApi,
  updateAdminPaymentApi,
  type AdminPaymentMutationResult,
} from '@/shared/services/conexion';

type PaymentListViewProps = {
  initialPayments: PaymentRecord[];
  initialClients: PaymentClient[];
  initialMethods: PaymentMethod[];
  initialError?: string | null;
};

type PaymentRow = PaymentRecord & { attachmentsCount: number };

const clonePayment = (payment: PaymentRecord): PaymentRecord => ({
  ...payment,
  attachments: Array.isArray(payment.attachments)
    ? payment.attachments.map((attachment) => ({ ...attachment }))
    : [],
});

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};

const statusTone: Record<PaymentRecord['status'], { label: string; tone: string }> = {
  pagado: { label: 'Pagado', tone: 'bg-emerald-100 text-emerald-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  anulado: { label: 'Anulado', tone: 'bg-gray-200 text-gray-700' },
  fallido: { label: 'Fallido', tone: 'bg-red-100 text-red-700' },
  otro: { label: 'Sin estado', tone: 'bg-gray-100 text-gray-600' },
};

const formatAmount = (payment: PaymentRecord, locale: string) => {
  if (payment.amountRaw && payment.amountRaw.trim().length > 0) {
    return payment.amountRaw;
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(payment.amount ?? 0);
};

export default function PaymentListView({
  initialPayments,
  initialClients,
  initialMethods,
  initialError = null,
}: PaymentListViewProps) {
  const { locale } = useParams() as { locale: string };
  const [payments, setPayments] = useState<PaymentRecord[]>(() => initialPayments.map(clonePayment));
  const [clients] = useState<PaymentClient[]>(() => initialClients.map((client) => ({ ...client })));
  const [methods, setMethods] = useState<PaymentMethod[]>(() => initialMethods.map((method) => ({ ...method })));
  const [quickFilter, setQuickFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<PaymentRecord | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rows: PaymentRow[] = useMemo(
    () =>
      payments.map((payment) => ({
        ...payment,
        attachmentsCount: Array.isArray(payment.attachments) ? payment.attachments.length : 0,
      })),
    [payments],
  );

  const handleMutationSuccess = (result: AdminPaymentMutationResult) => {
    setPayments((prev) => {
      const existingIndex = prev.findIndex((payment) => payment.id === result.payment.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = clonePayment(result.payment);
        return next;
      }
      return [...prev, clonePayment(result.payment)];
    });
    setMethods(result.methods.map((method) => ({ ...method })));
    setErrorMessage(null);
  };

  const handleCreatePayment = async (values: PaymentFormValues) => {
    try {
      const result = await createAdminPaymentApi(values);
      handleMutationSuccess(result);
    } catch (error: any) {
      console.error('Failed to create payment', error);
      const message = error instanceof Error ? error.message : 'No fue posible registrar el pago.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const handleUpdatePayment = async (values: PaymentFormValues) => {
    if (!paymentToEdit) return;
    try {
      const result = await updateAdminPaymentApi(paymentToEdit.id, values);
      handleMutationSuccess(result);
    } catch (error: any) {
      console.error('Failed to update payment', error);
      const message = error instanceof Error ? error.message : 'No fue posible actualizar el pago.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      await deleteAdminPaymentApi(paymentToDelete.id);
      setPayments((prev) => prev.filter((payment) => payment.id !== paymentToDelete.id));
      setPaymentToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete payment', error);
      const message = error instanceof Error ? error.message : 'No fue posible eliminar el pago.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const columns = useMemo<ColDef<PaymentRow>[]>(() => {
    const base: ColDef<PaymentRow>[] = [
      {
        headerName: 'Cliente',
        field: 'clientName',
        minWidth: 200,
        flex: 1.2,
        cellRenderer: (params: ICellRendererParams<PaymentRow>) => (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CreditCard className="h-4 w-4" />
            <span>{params.data.clientName}</span>
          </div>
        ),
      },
      {
        headerName: 'Fecha',
        field: 'updatedAt',
        minWidth: 140,
        valueFormatter: (params) => formatDate(params.value as string | null | undefined, locale),
      },
      {
        headerName: 'Valor',
        field: 'amount',
        minWidth: 140,
        valueFormatter: (params) => formatAmount(params.data, locale),
      },
      {
        headerName: 'Estado',
        field: 'status',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<PaymentRow>) => {
          const config = statusTone[params.data.status] ?? statusTone.otro;
          return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.tone}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        headerName: 'Método',
        field: 'methodName',
        minWidth: 160,
        flex: 1,
        valueFormatter: (params) => params.value ?? '—',
      },
      {
        headerName: 'Anexos',
        field: 'attachmentsCount',
        minWidth: 120,
        cellRenderer: (params: ICellRendererParams<PaymentRow>) => (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Paperclip className="h-4 w-4" />
            <span>{params.data.attachmentsCount}</span>
          </div>
        ),
      },
    ];

    const actions: ColDef<PaymentRow> = {
      headerName: 'Acciones',
      field: 'actions',
      minWidth: 160,
      maxWidth: 180,
      pinned: 'right',
      suppressMenu: true,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<PaymentRow>) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPaymentToEdit(clonePayment(params.data));
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            type="button"
            onClick={() => setPaymentToDelete(clonePayment(params.data))}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        </div>
      ),
    };

    return [...base, actions];
  }, [locale]);

  const handleSubmit = async (values: PaymentFormValues) => {
    if (paymentToEdit) {
      await handleUpdatePayment(values);
    } else {
      await handleCreatePayment(values);
    }
    setPaymentToEdit(null);
    setIsFormOpen(false);
  };

  const formTitle = paymentToEdit ? 'Editar pago' : 'Registrar pago';
  const formSubmitLabel = paymentToEdit ? 'Guardar cambios' : 'Guardar pago';

  return (
    <div className="space-y-6" ref={containerRef}>
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Breadcrumbs
            items={[
              { label: 'Panel admin', href: `/${locale}/admin/dashboard` },
              { label: 'Pagos' },
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900">Gestión de pagos</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setPaymentToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <Plus className="h-4 w-4" /> Registrar pago
          </button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={quickFilter}
              onChange={(event) => setQuickFilter(event.target.value)}
              placeholder="Buscar pago..."
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>
        <AgTable<PaymentRow>
          rows={rows}
          columns={columns}
          quickFilterText={quickFilter}
          getRowId={(data) => data.id}
          height={520}
        />
      </div>

      <SidePanel
        open={isFormOpen}
        title={formTitle}
        onClose={() => {
          setIsFormOpen(false);
          setPaymentToEdit(null);
        }}
        reserveRef={containerRef}
      >
        <PaymentFormDrawer
          open={isFormOpen}
          title={formTitle}
          submitLabel={formSubmitLabel}
          clients={clients}
          methods={methods}
          onSubmit={handleSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setPaymentToEdit(null);
          }}
          defaultValues={paymentToEdit}
        />
      </SidePanel>

      <DeletePaymentModal
        open={Boolean(paymentToDelete)}
        paymentLabel={paymentToDelete?.reference ?? paymentToDelete?.clientName ?? null}
        onConfirm={handleDeletePayment}
        onClose={() => setPaymentToDelete(null)}
      />
    </div>
  );
}

