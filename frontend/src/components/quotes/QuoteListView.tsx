'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { Eye, FileText, Search } from 'lucide-react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import AgTable from '@/components/datagrid/AgTable';
import SidePanel from '@/shared/components/common/SidePanel';
import {
  convertAdminQuoteToInvoiceApi,
  generateAdminQuotePdfApi,
  getAdminQuoteDetailApi,
  sendAdminQuoteEmailApi,
} from '@/shared/services/conexion';
import QuoteDetailInspector from './QuoteDetailInspector';
import type {
  QuoteActionType,
  QuoteDetail,
  QuoteSummary,
  SendQuoteEmailInput,
} from './types';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';

type QuoteListViewProps = {
  initialQuotes: QuoteSummary[];
  initialError?: string | null;
};

type QuoteRow = QuoteSummary;

const statusTone: Record<QuoteSummary['status'], { label: string; tone: string }> = {
  aprobada: { label: 'Aprobada', tone: 'bg-emerald-100 text-emerald-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  rechazada: { label: 'Rechazada', tone: 'bg-red-100 text-red-700' },
};

const cloneSummary = (quote: QuoteSummary): QuoteSummary => ({ ...quote });

export default function QuoteListView({ initialQuotes, initialError = null }: QuoteListViewProps) {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [quotes, setQuotes] = useState<QuoteSummary[]>(() => initialQuotes.map(cloneSummary));
  const [quickFilter, setQuickFilter] = useState('');
  const [errorMessage] = useState<string | null>(initialError);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [quoteDetail, setQuoteDetail] = useState<QuoteDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailSuccess, setDetailSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<QuoteActionType | null>(null);

  const rows = useMemo<QuoteRow[]>(() => quotes.map(cloneSummary), [quotes]);

  const updateSummaryFromDetail = useCallback((detail: QuoteDetail) => {
    setQuotes((prev) =>
      prev.map((quote) =>
        quote.id === detail.id
          ? {
              ...quote,
              reference: detail.reference,
              status: detail.status,
              services: detail.services.length,
              amount: detail.amount,
              updatedAt: detail.updatedAt,
            }
          : quote,
      ),
    );
  }, []);

  const fetchQuoteDetail = useCallback(
    async (quoteId: string, showLoader = true) => {
      setDetailError(null);
      setDetailSuccess(null);
      if (showLoader) {
        setIsDetailLoading(true);
      }
      try {
        const detail = await getAdminQuoteDetailApi(quoteId);
        if (!detail) {
          setQuoteDetail(null);
          setDetailError('No se encontró la cotización solicitada.');
          return null;
        }
        setQuoteDetail(detail);
        updateSummaryFromDetail(detail);
        return detail;
      } catch (error) {
        console.error('Failed to fetch quote detail', error);
        const message =
          error instanceof Error ? error.message : 'No fue posible obtener el detalle de la cotización.';
        setDetailError(message);
        return null;
      } finally {
        if (showLoader) {
          setIsDetailLoading(false);
        }
      }
    },
    [updateSummaryFromDetail],
  );

  const openDetailPanel = useCallback(
    async (quoteId: string) => {
      setSelectedQuoteId(quoteId);
      setIsPanelOpen(true);
      await fetchQuoteDetail(quoteId);
    },
    [fetchQuoteDetail],
  );

  const closeDetailPanel = () => {
    setIsPanelOpen(false);
    setSelectedQuoteId(null);
    setQuoteDetail(null);
    setDetailError(null);
    setDetailSuccess(null);
    setActionLoading(null);
  };

  const handleGeneratePdf = useCallback(async () => {
    if (!selectedQuoteId) return;
    setActionLoading('pdf');
    setDetailError(null);
    setDetailSuccess(null);
    try {
      const result = await generateAdminQuotePdfApi(selectedQuoteId);
      setQuotes((prev) =>
        prev.map((quote) =>
          quote.id === selectedQuoteId
            ? {
                ...quote,
                pdfUrl: result.url ?? quote.pdfUrl,
                updatedAt: result.generatedAt ?? quote.updatedAt,
              }
            : quote,
        ),
      );
      setQuoteDetail((prev) =>
        prev
          ? {
              ...prev,
              updatedAt: result.generatedAt ?? prev.updatedAt,
              actions: prev.actions.map((action) =>
                action.type === 'pdf'
                  ? { ...action, url: result.url ?? action.url ?? null }
                  : action,
              ),
            }
          : prev,
      );
      setDetailSuccess('PDF generado correctamente.');
    } catch (error) {
      console.error('Failed to generate quote PDF', error);
      const message =
        error instanceof Error ? error.message : 'No fue posible generar el PDF de la cotización.';
      setDetailError(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setActionLoading(null);
    }
  }, [selectedQuoteId]);

  const handleSendEmail = useCallback(
    async (payload: SendQuoteEmailInput) => {
      if (!selectedQuoteId) return;
      setActionLoading('email');
      setDetailError(null);
      setDetailSuccess(null);
      try {
        const result = await sendAdminQuoteEmailApi(selectedQuoteId, payload);
        const recipients = result.recipients.join(', ');
        setDetailSuccess(`Cotización enviada correctamente a ${recipients}.`);
      } catch (error) {
        console.error('Failed to send quote email', error);
        const message =
          error instanceof Error ? error.message : 'No fue posible enviar la cotización por correo.';
        setDetailError(message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setActionLoading(null);
      }
    },
    [selectedQuoteId],
  );

  const handleConvertToInvoice = useCallback(async () => {
    if (!selectedQuoteId) return;
    setActionLoading('invoice');
    setDetailError(null);
    setDetailSuccess(null);
    try {
      const result = await convertAdminQuoteToInvoiceApi(selectedQuoteId);
      if (result.alreadyConverted) {
        setDetailSuccess('La cotización ya estaba convertida en factura.');
      } else {
        setDetailSuccess('Factura generada correctamente a partir de la cotización.');
      }
      const detail = await fetchQuoteDetail(selectedQuoteId, false);
      if (detail) {
        updateSummaryFromDetail(detail);
      }
    } catch (error) {
      console.error('Failed to convert quote to invoice', error);
      const message =
        error instanceof Error ? error.message : 'No fue posible convertir la cotización en factura.';
      setDetailError(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setActionLoading(null);
      setIsDetailLoading(false);
    }
  }, [fetchQuoteDetail, selectedQuoteId, updateSummaryFromDetail]);

  const columns = useMemo<ColDef<QuoteRow>[]>(() => {
    const navigateToDetail = (id: string) => openDetailPanel(id);

    const baseColumns: ColDef<QuoteRow>[] = [
      {
        headerName: 'Referencia',
        field: 'reference',
        flex: 1.3,
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<QuoteRow>) => (
          <button
            type="button"
            onClick={() => navigateToDetail(params.data.id)}
            className="inline-flex items-center gap-2 text-left text-sm font-semibold text-emerald-700 hover:underline"
          >
            <FileText className="h-4 w-4" />
            {params.data.reference}
          </button>
        ),
      },
      {
        headerName: 'Cliente',
        field: 'client.name',
        minWidth: 200,
        valueGetter: (params) => params.data.client.name,
      },
      {
        headerName: 'Servicios',
        field: 'services',
        minWidth: 120,
        valueFormatter: (params) => `${params.value ?? 0}`,
      },
      {
        headerName: 'Monto',
        field: 'amount',
        minWidth: 140,
        valueFormatter: (params) => formatCurrency(params.value as number, locale),
      },
      {
        headerName: 'Estado',
        field: 'status',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<QuoteRow>) => {
          const tone = statusTone[params.data.status] ?? { label: params.data.status, tone: 'bg-gray-100 text-gray-600' };
          return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone.tone}`}>
              {tone.label}
            </span>
          );
        },
      },
      {
        headerName: 'Emitida',
        field: 'issuedAt',
        minWidth: 140,
        valueFormatter: (params) => formatDate(params.value as string | null, locale),
      },
      {
        headerName: 'Actualizada',
        field: 'updatedAt',
        minWidth: 140,
        valueFormatter: (params) => formatDate(params.value as string | null, locale),
      },
      {
        headerName: 'PDF',
        field: 'pdfUrl',
        minWidth: 120,
        cellRenderer: (params: ICellRendererParams<QuoteRow>) =>
          params.data.pdfUrl ? (
            <Link
              href={params.data.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
            >
              <FileText className="h-3.5 w-3.5" />
              Abrir
            </Link>
          ) : (
            <span className="text-xs text-gray-400">Sin PDF</span>
          ),
      },
    ];

    const actionsColumn: ColDef<QuoteRow> = {
      headerName: 'Acciones',
      field: 'actions',
      minWidth: 180,
      maxWidth: 200,
      pinned: 'right',
      suppressMenu: true,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<QuoteRow>) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateToDetail(params.data.id)}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            <Eye className="h-3.5 w-3.5" /> Detalle
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/admin/quotes/${params.data.id}`)}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Abrir
          </button>
        </div>
      ),
    };

    return [...baseColumns, actionsColumn];
  }, [locale, openDetailPanel, router]);

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
              { label: 'Cotizaciones' },
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900">Gestión de cotizaciones</h1>
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
              placeholder="Buscar cotización..."
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>
        <AgTable<QuoteRow>
          rows={rows}
          columns={columns}
          quickFilterText={quickFilter}
          getRowId={(data) => data.id}
          height={520}
        />
      </div>

      <SidePanel
        open={isPanelOpen}
        title={quoteDetail ? `Cotización ${quoteDetail.reference}` : 'Detalle de cotización'}
        onClose={closeDetailPanel}
        reserveRef={containerRef}
      >
        <div className="h-full overflow-y-auto px-5 py-6">
          <QuoteDetailInspector
            quote={quoteDetail}
            loading={isDetailLoading}
            locale={locale}
            onGeneratePdf={handleGeneratePdf}
            onSendEmail={handleSendEmail}
            onConvertToInvoice={handleConvertToInvoice}
            actionLoading={actionLoading}
            errorMessage={detailError}
            successMessage={detailSuccess}
            mode="panel"
          />
        </div>
      </SidePanel>
    </div>
  );
}