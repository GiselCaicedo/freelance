'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { FileText, Search } from 'lucide-react';

import AgTable from '@/components/datagrid/AgTable';
import PageHeader from '@/shared/components/common/PageHeader';
import type { QuoteSummary } from './types';
import { formatCurrency, formatDate } from '@/shared/utils/formatters';

type QuoteListViewProps = {
  initialQuotes: QuoteSummary[];
  initialError?: string | null;
};

type QuoteRow = QuoteSummary;

type StatusInfo = { label: string; tone: string };

const statusTone: Record<QuoteSummary['status'], StatusInfo> = {
  aprobada: { label: 'Aprobada', tone: 'bg-emerald-100 text-emerald-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  rechazada: { label: 'Rechazada', tone: 'bg-red-100 text-red-700' },
};

const cloneSummary = (quote: QuoteSummary): QuoteSummary => ({ ...quote });

const headerDescription = 'Gestiona las cotizaciones de tus clientes, descarga PDFs y conviértelas en facturas cuando sea necesario.';

export default function QuoteListView({ initialQuotes, initialError = null }: QuoteListViewProps) {
  const { locale } = useParams() as { locale: string };
  const containerRef = useRef<HTMLDivElement>(null);

  const [quotes] = useState<QuoteSummary[]>(() => initialQuotes.map(cloneSummary));
  const [quickFilter, setQuickFilter] = useState('');

  const rows = useMemo<QuoteRow[]>(() => quotes.map(cloneSummary), [quotes]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel admin', href: `/${locale}/admin/dashboard` },
      { label: 'Cotizaciones' },
    ],
    [locale],
  );

  const columns = useMemo<ColDef<QuoteRow>[]>(
    () => [
      {
        headerName: 'Referencia',
        field: 'reference',
        flex: 1.4,
        minWidth: 220,
        cellRenderer: (params: ICellRendererParams<QuoteRow>) => (
          <Link
            href={`/${locale}/admin/quotes/${params.data.id}`}
            className="inline-flex items-center gap-2 text-left text-sm font-semibold text-emerald-700 hover:underline"
          >
            <FileText className="h-4 w-4" />
            {params.data.reference}
          </Link>
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
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<QuoteRow>) =>
          params.data.pdfUrl ? (
            <Link
              href={params.data.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
            >
              <FileText className="h-3.5 w-3.5" />
              Abrir PDF
            </Link>
          ) : (
            <span className="text-xs text-gray-400">Sin PDF</span>
          ),
      },
      {
        headerName: 'Acciones',
        field: 'actions',
        minWidth: 160,
        maxWidth: 180,
        pinned: 'right',
        suppressMenu: true,
        sortable: false,
        cellRenderer: (params: ICellRendererParams<QuoteRow>) => (
          <Link
            href={`/${locale}/admin/quotes/${params.data.id}`}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            Ver detalle
          </Link>
        ),
      },
    ],
    [locale],
  );

  return (
    <div className="space-y-6" ref={containerRef}>
      <PageHeader breadcrumbs={breadcrumbs} title="Gestión de cotizaciones" description={headerDescription} />

      {initialError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{initialError}</div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={quickFilter}
              onChange={(event) => setQuickFilter(event.target.value)}
              placeholder="Buscar cotización…"
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        <div className="mt-4">
          <AgTable<QuoteRow>
            rows={rows}
            columns={columns}
            quickFilterText={quickFilter}
            getRowId={(data) => data.id}
            height={520}
          />
        </div>
      </div>
    </div>
  );
}
