'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ColDef, RowClassRules } from 'ag-grid-community';
import { Plus, Search } from 'lucide-react';

import AgTable from '@/panels/admin/components/datagrid/AgTable';
import ActionsCell from '@/shared/components/common/ActionsCell';
import SidePanel from '@/shared/components/common/SidePanel';
import PageHeader from '@/shared/components/common/PageHeader';
import ConfirmDialog from '@/shared/components/common/ConfirmDialog';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import RoleFormModal from '@/panels/admin/components/roles/RoleFormModal';
import { listRolesApi, deleteRoleApi, Role, RoleCategory } from '@/shared/services/conexion';

type RoleRow = {
  id: string
  name: string
  description: string
  isActive: boolean
  updatedAt: string
  role_category: RoleCategory | null
};

type ConfirmState = {
  open: boolean;
  role: RoleRow | null;
};

const PANEL_CATEGORY_ALIASES: Record<RoleCategory, string[]> = {
  admin: ['admin', 'panel_admin'],
  client: ['client', 'cliente', 'panel_client'],
};

const normalizeCategory = (value?: string | null): RoleCategory | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  for (const [category, aliases] of Object.entries(PANEL_CATEGORY_ALIASES)) {
    if (aliases.some((alias) => alias.toLowerCase() === normalized)) {
      return category as RoleCategory;
    }
  }
  return null;
};

export default function RolesPage() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const t = useTranslations('Settings.Roles');
  const commonT = useTranslations('Common');
  const { notify } = useAlerts();

  const containerRef = useRef<HTMLDivElement>(null);

  const [quickFilter, setQuickFilter] = useState('');
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, role: null });

  const normalizeRoles = (list: Role[]): RoleRow[] =>
    list.map((role) => ({
      id: role.id,
      name: role.name,
      description: (role as any).description ?? '',
      isActive: (role.status ?? true) === true,
      updatedAt: (role.updated ?? (role as any).updatedAt ?? new Date().toISOString()).slice(0, 10),
      role_category: normalizeCategory(role.role_category),
    }));

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listRolesApi();
      setRows(normalizeRoles(response));
      setError(null);
    } catch (error: any) {
      const message = error?.message || t('alerts.loadError.description');
      setError(message);
      notify({ type: 'error', title: t('alerts.loadError.title'), description: message });
    } finally {
      setLoading(false);
    }
  }, [notify, t]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleEdit = useCallback((row: RoleRow) => {
    setCurrentRole({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.isActive,
      updated: row.updatedAt,
      role_category: row.role_category,
    } as Role);
    setOpenCreate(false);
    setOpenEdit(true);
  }, []);

  const handlePermissions = useCallback(
    (row: RoleRow) => {
      router.push(`/${locale}/settings/security/roles/${row.id}/permissions`);
    },
    [router, locale],
  );

  const requestDelete = useCallback((row: RoleRow) => {
    setConfirm({ open: true, role: row });
  }, []);

  const confirmDelete = async () => {
    const target = confirm.role;
    if (!target) return;
    setConfirm({ open: false, role: null });

    const previous = rows;
    setRows((current) => current.filter((row) => row.id !== target.id));

    try {
      await deleteRoleApi(target.id);
      notify({ type: 'success', title: t('alerts.deleteSuccess.title'), description: t('alerts.deleteSuccess.description', { role: target.name }) });
    } catch (error: any) {
      setRows(previous);
      notify({ type: 'error', title: t('alerts.deleteError.title'), description: error?.message || t('alerts.deleteError.description') });
    }
  };

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }), [locale]);

  const columns = useMemo<ColDef<RoleRow>[]>(
    () => [
      {
        headerName: t('table.columns.role'),
        field: 'name',
        flex: 1,
        minWidth: 160,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2">
            <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200">
              {String(params.value ?? '').slice(0, 2).toUpperCase()}
            </div>
            <span className="font-medium text-gray-900">{params.value}</span>
          </div>
        ),
      },
      {
        headerName: t('table.columns.description'),
        field: 'description',
        flex: 1.4,
        minWidth: 200,
        cellClass: 'text-gray-700',
      },
      {
        headerName: t('table.columns.panel'),
        field: 'role_category',
        flex: 0.9,
        minWidth: 150,
        cellRenderer: (params: any) => {
          const category = params.value as RoleCategory | null;
          if (!category) {
            return <span className="text-gray-500">—</span>;
          }
          const isAdmin = category === 'admin';
          const badgeClasses = isAdmin
            ? 'bg-slate-100 text-slate-700 ring-slate-200'
            : 'bg-emerald-50 text-emerald-700 ring-emerald-200';
          const dotClass = isAdmin ? 'bg-slate-500' : 'bg-emerald-500';
          const label = isAdmin ? t('table.panelBadges.admin') : t('table.panelBadges.client');
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badgeClasses}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
              {label}
            </span>
          );
        },
      },
      {
        headerName: t('table.columns.status'),
        field: 'isActive',
        flex: 0.9,
        minWidth: 140,
        cellRenderer: (params: any) => {
          const active = params.value === true;
          return (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
              active ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'
            }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-600' : 'bg-red-600'}`} />
              {active ? t('status.active') : t('status.inactive')}
            </span>
          );
        },
      },
      {
        headerName: t('table.columns.updatedAt'),
        field: 'updatedAt',
        flex: 1,
        minWidth: 170,
        valueFormatter: (params) => {
          const value = params.value as string;
          const parsed = new Date(value);
          if (Number.isNaN(parsed.getTime())) return value ?? '';
          return dateFormatter.format(parsed);
        },
        cellClass: 'text-gray-600',
      },
      {
        headerName: t('table.columns.actions'),
        width: 200,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => (
          <ActionsCell
            onEdit={() => handleEdit(params.data)}
            onPermissions={() => handlePermissions(params.data)}
            onDelete={() => requestDelete(params.data)}
          />
        ),
      },
    ],
    [dateFormatter, handleEdit, handlePermissions, requestDelete, t],
  );

  const rowClassRules = useMemo<RowClassRules>(
    () => ({
      'row-inactive': (params) => params.data?.isActive === false,
    }),
    [],
  );

  return (
    <div ref={containerRef} className="relative p-8 transition-[padding-right] duration-300">
      <PageHeader
        className="mb-6"
        breadcrumbs={[
          { label: t('breadcrumbs.section'), href: `/${locale}/settings` },
          { label: t('breadcrumbs.current') },
        ]}
        title={t('pageTitle')}
        description={t('pageDescription')}
        actions={(
          <button
            type="button"
            onClick={() => {
              setCurrentRole(null);
              setOpenEdit(false);
              setOpenCreate(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            <span>{t('actions.newRole')}</span>
          </button>
        )}
      />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={quickFilter}
            onChange={(event) => setQuickFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder={t('table.searchPlaceholder')}
          />
        </div>
        {loading && <span className="text-xs text-gray-500">{t('states.loading')}</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      <AgTable<RoleRow>
        rows={rows}
        columns={columns}
        quickFilterText={quickFilter}
        rowClassRules={rowClassRules}
        getRowId={(row) => row.id}
        height={440}
        pageSize={10}
      />

      <SidePanel title={t('panels.createTitle')} open={openCreate} onClose={() => setOpenCreate(false)} reserveRef={containerRef}>
        <RoleFormModal
          role={null}
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSaved={async () => {
            await fetchRoles();
            setOpenCreate(false);
          }}
        />
      </SidePanel>

      <SidePanel title={t('panels.editTitle')} open={openEdit} onClose={() => setOpenEdit(false)} reserveRef={containerRef}>
        {currentRole && (
          <RoleFormModal
            role={currentRole}
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            onSaved={async () => {
              await fetchRoles();
              setOpenEdit(false);
            }}
          />
        )}
      </SidePanel>

      <ConfirmDialog
        open={confirm.open}
        title={t('confirm.deleteTitle', { role: confirm.role?.name ?? '' })}
        description={t('confirm.deleteDescription')}
        confirmLabel={commonT('confirm.confirm')}
        cancelLabel={commonT('confirm.cancel')}
        variant="danger"
        onCancel={() => setConfirm({ open: false, role: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

