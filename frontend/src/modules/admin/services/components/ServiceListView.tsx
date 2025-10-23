'use client';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import type { PersistServiceInput, ServiceCategory, ServiceRecord, ServiceStatus } from './types';
import type { TaxRecord } from '@admin/settings/taxes/types';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import ConfirmDialog from '@shared/components/common/ConfirmDialog';
import PageHeader from '@shared/components/common/PageHeader';

import SidePanel from '@shared/components/common/SidePanel';
import AgTable from '@shared/components/datagrid/AgTable';
import {
  createAdminServiceApi,
  deleteAdminServiceApi,
  updateAdminServiceApi,
} from '@shared/services/conexion';
import { formatCurrency } from '@shared/utils/formatters';
import { Layers3, PencilLine, Plus, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import ServiceFormPanel from './ServiceFormPanel';

type Props = {
  initialServices: ServiceRecord[];
  initialCategories: ServiceCategory[];
  initialTaxes: TaxRecord[];
  initialError?: string | null;
};

type ServiceRow = ServiceRecord;

type PanelState = {
  mode: 'create' | 'edit';
  open: boolean;
  target: ServiceRecord | null;
};

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};

const statusTone: Record<ServiceStatus, string> = {
  active: 'bg-primary-100 text-primary-700',
  inactive: 'bg-amber-100 text-amber-700',
};

export default function ServiceListView({
  initialServices,
  initialCategories,
  initialTaxes,
  initialError = null,
}: Props) {
  const { locale } = useParams() as { locale: string };
  const listT = useTranslations('Servicios.List');
  const formT = useTranslations('Servicios.Form');
  const alertsT = useTranslations('Servicios.Alerts');
  const confirmT = useTranslations('Servicios.ConfirmDelete');
  const { notify } = useAlerts();

  const containerRef = useRef<HTMLDivElement>(null);

  const [services, setServices] = useState<ServiceRecord[]>(() =>
    initialServices.map(service => ({ ...service })),
  );
  const [categories] = useState<ServiceCategory[]>(() => initialCategories.map(category => ({ ...category })));
  const [taxes] = useState<TaxRecord[]>(() => initialTaxes.map(tax => ({ ...tax })));
  const [quickFilter, setQuickFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);

  const [panel, setPanel] = useState<PanelState>({ mode: 'create', open: false, target: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rows = useMemo<ServiceRow[]>(
    () => services.map(service => ({ ...service })),
    [services],
  );

  const breadcrumbs = useMemo(
    () => [
      { label: listT('breadcrumbs.home'), href: `/${locale}/admin/dashboard` },
      { label: listT('breadcrumbs.section') },
    ],
    [listT, locale],
  );

  const openCreatePanel = () => {
    setPanel({ mode: 'create', open: true, target: null });
    setSaving(false);
    setDeleting(false);
  };

  const openEditPanel = (service: ServiceRecord) => {
    setPanel({ mode: 'edit', open: true, target: service });
    setSaving(false);
    setDeleting(false);
  };

  const closePanel = () => {
    setPanel(prev => ({ ...prev, open: false }));
    setSaving(false);
    setDeleting(false);
  };

  const handleCreate = async (payload: PersistServiceInput) => {
    try {
      setSaving(true);
      const created = await createAdminServiceApi(payload);
      setServices(current => [...current, { ...created }]);
      setErrorMessage(null);
      notify({ type: 'success', title: alertsT('created.title'), description: alertsT('created.description') });
      closePanel();
    } catch (error: any) {
      console.error('create service error', error);
      const message = error?.message ?? alertsT('saveError.description');
      setErrorMessage(message);
      notify({ type: 'error', title: alertsT('saveError.title'), description: message });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload: PersistServiceInput) => {
    if (!panel.target) {
      return;
    }
    try {
      setSaving(true);
      const updated = await updateAdminServiceApi(panel.target.id, payload);
      setServices(current => current.map(service => (service.id === updated.id ? { ...updated } : service)));
      setErrorMessage(null);
      notify({ type: 'success', title: alertsT('updated.title'), description: alertsT('updated.description') });
      closePanel();
    } catch (error: any) {
      console.error('update service error', error);
      const message = error?.message ?? alertsT('saveError.description');
      setErrorMessage(message);
      notify({ type: 'error', title: alertsT('saveError.title'), description: message });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!panel.target) {
      return;
    }
    try {
      setDeleting(true);
      await deleteAdminServiceApi(panel.target.id);
      setServices(current => current.filter(service => service.id !== panel.target?.id));
      notify({ type: 'success', title: alertsT('deleted.title'), description: alertsT('deleted.description') });
      setConfirmDelete(false);
      closePanel();
    } catch (error: any) {
      console.error('delete service error', error);
      const statusMessage = error?.response?.data?.message ?? error?.message;
      const message = statusMessage ?? alertsT('deleteError.description');
      setErrorMessage(message);
      const isAssigned = typeof statusMessage === 'string' && statusMessage.toLowerCase().includes('asignado');
      notify({
        type: 'error',
        title: isAssigned ? alertsT('assignedError.title') : alertsT('deleteError.title'),
        description: isAssigned ? alertsT('assignedError.description') : message,
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatTaxLabel = (tax: ServiceRecord['taxOne']) => {
    if (!tax) {
      return listT('table.noTax');
    }
    return `${tax.name} (${tax.percentage.toFixed(2)}%)`;
  };

  const columns = useMemo<ColDef<ServiceRow>[]>(() => [
    {
      headerName: listT('table.name'),
      field: 'name',
      flex: 1.4,
      minWidth: 220,
      cellRenderer: (params: ICellRendererParams<ServiceRow>) => (
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-semibold text-primary-700">{params.data.name}</span>
        </div>
      ),
    },
    {
      headerName: listT('table.category'),
      field: 'category',
      minWidth: 160,
      valueGetter: params => params.data.category?.name ?? listT('table.uncategorized'),
    },
    {
      headerName: listT('table.unit'),
      field: 'unit',
      minWidth: 120,
      valueGetter: params => params.data.unit ?? '—',
    },
    {
      headerName: listT('table.price'),
      field: 'price',
      minWidth: 140,
      valueFormatter: params => formatCurrency((params.value as number) ?? 0, locale),
    },
    {
      headerName: listT('table.subtotal'),
      field: 'subtotal',
      minWidth: 140,
      valueFormatter: params => formatCurrency((params.value as number) ?? 0, locale),
    },
    {
      headerName: listT('table.taxOne'),
      field: 'taxOne',
      minWidth: 180,
      valueFormatter: params => formatTaxLabel(params.data.taxOne),
    },
    {
      headerName: listT('table.taxTwo'),
      field: 'taxTwo',
      minWidth: 180,
      valueFormatter: params => formatTaxLabel(params.data.taxTwo),
    },
    {
      headerName: listT('table.status'),
      field: 'status',
      minWidth: 140,
      cellRenderer: (params: ICellRendererParams<ServiceRow>) => {
        const tone = statusTone[params.data.status];
        const label = listT(`table.status.${params.data.status}`);
        return (
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
            {label}
          </span>
        );
      },
    },
    {
      headerName: listT('table.clients'),
      field: 'clientsCount',
      minWidth: 120,
      valueFormatter: params => `${params.value ?? 0}`,
    },
    {
      headerName: listT('table.created'),
      field: 'createdAt',
      minWidth: 150,
      valueFormatter: params => formatDate(params.value as string | null | undefined, locale),
    },
    {
      headerName: listT('table.updated'),
      field: 'updatedAt',
      minWidth: 150,
      valueFormatter: params => formatDate(params.value as string | null | undefined, locale),
    },
    {
      headerName: listT('table.actions'),
      field: 'actions',
      minWidth: 160,
      maxWidth: 180,
      pinned: 'right',
      sortable: false,
      suppressMenu: true,
      cellRenderer: (params: ICellRendererParams<ServiceRow>) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openEditPanel(params.data)}
            className="inline-flex items-center gap-1 rounded-full border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700 transition hover:bg-primary-50"
          >
            <PencilLine className="h-3.5 w-3.5" />
            {listT('table.edit')}
          </button>
          <button
            type="button"
            onClick={() => {
              setPanel(prev => ({ mode: 'edit', open: prev.open, target: params.data }));
              setConfirmDelete(true);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {listT('table.delete')}
          </button>
        </div>
      ),
    },
  ], [listT, locale]);

  const actionButtons = (
    <button
      type="button"
      onClick={openCreatePanel}
      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
    >
      <Plus className="h-4 w-4" />
      {listT('createButton')}
    </button>
  );

  return (
    <div className="space-y-6" ref={containerRef}>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={listT('title')}
        description={listT('description')}
        actions={actionButtons}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={quickFilter}
              onChange={event => setQuickFilter(event.target.value)}
              placeholder={listT('searchPlaceholder')}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            />
          </div>
          {errorMessage && (
            <span className="text-sm font-medium text-red-600">{errorMessage}</span>
          )}
        </div>

        <div className="mt-4">
          <AgTable<ServiceRow>
            rows={rows}
            columns={columns}
            quickFilterText={quickFilter}
            getRowId={data => data.id}
            height={520}
            pageSize={10}
          />
        </div>
      </div>

      <SidePanel
        title={panel.mode === 'create' ? formT('createTitle') : formT('editTitle')}
        open={panel.open}
        onClose={closePanel}
        reserveRef={containerRef}
      >
        <ServiceFormPanel
          mode={panel.mode}
          service={panel.target}
          categories={categories}
          taxes={taxes}
          open={panel.open}
          onSubmit={panel.mode === 'create' ? handleCreate : handleUpdate}
          onCancel={closePanel}
          onDelete={panel.mode === 'edit' ? () => setConfirmDelete(true) : undefined}
          saving={saving}
          deleting={deleting}
        />
      </SidePanel>

      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => {
          setConfirmDelete(false);
          setDeleting(false);
        }}
        onConfirm={handleDelete}
        title={confirmT('title')}
        description={confirmT('description')}
        confirmLabel={confirmT('confirm')}
        cancelLabel={confirmT('cancel')}
        variant="danger"
      />
    </div>
  );
}
