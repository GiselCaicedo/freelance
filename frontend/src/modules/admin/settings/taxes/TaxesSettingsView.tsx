'use client';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import type { PersistTaxInput, TaxRecord } from './types';
import PageHeader from '@shared/components/common/PageHeader';
import SidePanel from '@shared/components/common/SidePanel';
import AgTable from '@shared/components/datagrid/AgTable';
import {
  createAdminTaxApi,
  deleteAdminTaxApi,
  getAdminTaxesApi,
  updateAdminTaxApi,
} from '@shared/services/conexion';
import { formatDate } from '@shared/utils/formatters';
import { PlusCircle, RefreshCcw, Pencil, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type PanelMode = 'create' | 'edit';

type PanelState = {
  open: boolean;
  mode: PanelMode;
  target: TaxRecord | null;
};

type FormState = {
  name: string;
  description: string;
  rate: string;
  active: boolean;
};

const emptyForm: FormState = {
  name: '',
  description: '',
  rate: '0',
  active: true,
};

const normalizeRateToPercent = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return value <= 1 ? value * 100 : value;
};

const denormalizeRateToDecimal = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value > 1 ? value / 100 : value;
};

const formatPercentage = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  const percent = normalizeRateToPercent(value);
  return `${percent.toFixed(2)}%`;
};

type TaxesSettingsViewProps = {
  initialTaxes?: TaxRecord[];
  initialError?: string | null;
};

export default function TaxesSettingsView({ initialTaxes = [], initialError = null }: TaxesSettingsViewProps) {
  const { locale } = useParams() as { locale: string };
  const containerRef = useRef<HTMLDivElement>(null);

  const [taxes, setTaxes] = useState<TaxRecord[]>(initialTaxes);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelState>({ open: false, mode: 'create', target: null });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quickFilter, setQuickFilter] = useState('');

  useEffect(() => {
    const loadTaxes = async () => {
      setLoading(true);
      try {
        const data = await getAdminTaxesApi();
        setTaxes(data ?? []);
        setError(null);
      } catch (loadError: any) {
        const message = loadError instanceof Error ? loadError.message : 'No fue posible obtener los impuestos configurados.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (!initialTaxes || initialTaxes.length === 0) {
      loadTaxes().catch(() => {});
    }
  }, [initialTaxes]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel admin', href: `/${locale}/admin/dashboard` },
      { label: 'Configuración', href: `/${locale}/admin/settings` },
      { label: 'Impuestos' },
    ],
    [locale],
  );

  const rows = useMemo(() => taxes.map(tax => ({ ...tax })), [taxes]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getAdminTaxesApi();
      setTaxes(data ?? []);
      setError(null);
      setFeedback('Lista de impuestos actualizada.');
    } catch (refreshError: any) {
      const message = refreshError instanceof Error ? refreshError.message : 'No fue posible actualizar los impuestos.';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  const closePanel = () => {
    setPanel(prev => ({ ...prev, open: false, target: null }));
    setForm(emptyForm);
    setFormError(null);
    setSubmitting(false);
  };

  const openCreatePanel = () => {
    setPanel({ open: true, mode: 'create', target: null });
    setForm(emptyForm);
    setFormError(null);
    setFeedback(null);
  };

  const openEditPanel = (record: TaxRecord) => {
    setPanel({ open: true, mode: 'edit', target: record });
    setForm({
      name: record.name,
      description: record.description ?? '',
      rate: normalizeRateToPercent(record.rate).toString(),
      active: Boolean(record.active),
    });
    setFormError(null);
    setFeedback(null);
  };

  const handleDelete = async (record: TaxRecord) => {
    const confirmation = window.confirm(`¿Eliminar el impuesto "${record.name}"?`);
    if (!confirmation) {
      return;
    }
    try {
      await deleteAdminTaxApi(record.id);
      setTaxes(current => current.filter(item => item.id !== record.id));
      setFeedback('Impuesto eliminado correctamente.');
      setError(null);
    } catch (deleteError: any) {
      const message = deleteError instanceof Error ? deleteError.message : 'No fue posible eliminar el impuesto.';
      setError(message);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const parsedRate = Number.parseFloat(form.rate.replace(',', '.'));
    if (!form.name.trim()) {
      setFormError('Agrega un nombre para identificar el impuesto.');
      setSubmitting(false);
      return;
    }
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      setFormError('El porcentaje debe ser un número válido mayor o igual a cero.');
      setSubmitting(false);
      return;
    }

    const payload: PersistTaxInput = {
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      rate: denormalizeRateToDecimal(parsedRate),
      active: form.active,
    };

    try {
      if (panel.mode === 'create') {
        const created = await createAdminTaxApi(payload);
        setTaxes(current => [created, ...current.filter(item => item.id !== created.id)]);
        setFeedback('Impuesto creado correctamente.');
      } else if (panel.mode === 'edit' && panel.target) {
        const updated = await updateAdminTaxApi(panel.target.id, payload);
        setTaxes(current => current.map(item => (item.id === updated.id ? updated : item)));
        setFeedback('Impuesto actualizado correctamente.');
      }
      closePanel();
      setError(null);
    } catch (submitError: any) {
      const message = submitError instanceof Error ? submitError.message : 'No fue posible guardar el impuesto.';
      setFormError(message);
      setSubmitting(false);
    }
  };

  const columns = useMemo<ColDef<TaxRecord>[]>(
    () => [
      {
        headerName: 'Impuesto',
        field: 'name',
        flex: 1.2,
        minWidth: 200,
      },
      {
        headerName: 'Descripción',
        field: 'description',
        flex: 1.4,
        minWidth: 220,
        valueFormatter: params => (params.value ? (params.value as string) : '—'),
      },
      {
        headerName: 'Porcentaje',
        field: 'rate',
        minWidth: 140,
        cellClass: 'text-center',
        valueFormatter: params => formatPercentage(params.value as number),
      },
      {
        headerName: 'Estado',
        field: 'active',
        minWidth: 140,
        cellClass: 'text-center',
        cellRenderer: (params: ICellRendererParams<TaxRecord>) => (
          <span
            className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
              params.data.active ? 'border border-sky-200 bg-sky-50 text-sky-700' : 'border border-gray-200 bg-gray-100 text-gray-500'
            }`}
          >
            {params.data.active ? 'Activo' : 'Inactivo'}
          </span>
        ),
      },
      {
        headerName: 'Actualizado',
        field: 'updatedAt',
        minWidth: 160,
        valueFormatter: params => formatDate(params.value as string | null, locale),
      },
      {
        headerName: 'Acciones',
        field: 'actions',
        minWidth: 200,
        maxWidth: 220,
        pinned: 'right',
        suppressMenu: true,
        sortable: false,
        cellClass: 'text-center',
        cellRenderer: (params: ICellRendererParams<TaxRecord>) => (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => openEditPanel(params.data)}
              className="inline-flex items-center gap-1 rounded-full border border-sky-200 px-3 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleDelete(params.data)}
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
        <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        {' '}
        Actualizar
      </button>
      <button
        type="button"
        onClick={openCreatePanel}
        className="inline-flex items-center rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        {' '}
        Nuevo impuesto
      </button>
    </div>
  );

  return (
    <div className="space-y-6" ref={containerRef}>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Impuestos"
        description="Administra los impuestos disponibles para cálculos de facturación y cotizaciones."
        actions={actionButtons}
      />

      {feedback && <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">{feedback}</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <input
              type="search"
              value={quickFilter}
              onChange={event => setQuickFilter(event.target.value)}
              placeholder="Buscar impuesto…"
              className="w-full rounded-full border border-gray-200 bg-white py-2 pr-3 pl-4 text-sm text-gray-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
            />
          </div>
          {loading && <span className="text-sm text-gray-500">Cargando…</span>}
        </div>

        <div className="mt-4">
          <AgTable<TaxRecord>
            rows={rows}
            columns={columns}
            quickFilterText={quickFilter}
            getRowId={data => data.id}
            height={480}
          />
        </div>
      </div>

      <SidePanel
        open={panel.open}
        onClose={closePanel}
        reserveRef={containerRef}
        title={panel.mode === 'create' ? 'Agregar impuesto' : 'Editar impuesto'}
      >
        <div className="px-5 py-6">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="tax-name">
                Nombre
              </label>
              <input
                id="tax-name"
                type="text"
                value={form.name}
                onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                placeholder="IVA, Retefuente…"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="tax-description">
                Descripción
              </label>
              <textarea
                id="tax-description"
                value={form.description}
                onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                placeholder="Detalle opcional para este impuesto"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-xs font-medium text-gray-600">
                <span className="mb-1">Porcentaje (%)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate}
                  onChange={event => setForm(current => ({ ...current, rate: event.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                  placeholder="19"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={event => setForm(current => ({ ...current, active: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                Activo en cálculos
              </label>
            </div>

            {formError && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{formError}</p>}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closePanel}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Guardando…' : panel.mode === 'create' ? 'Crear impuesto' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </SidePanel>
    </div>
  );
}
