'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ColDef, RowClassRules } from 'ag-grid-community';
import { Plus, Search } from 'lucide-react';

import AgTable from '@/panels/admin/components/datagrid/AgTable';
import ActionsCell from '@/shared/components/common/ActionsCell';
import SidePanel from '@/shared/components/common/SidePanel';
import PageHeader from '@/shared/components/common/PageHeader';
import ConfirmDialog from '@/shared/components/common/ConfirmDialog';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import CreateUserForm from '@/panels/admin/components/users/CreateUserForm';
import EditUserForm from '@/panels/admin/components/users/EditUserForm';
import { BackendUser, deleteUserApi, getUsersApi } from '@/shared/services/conexion';

type UserRow = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  updatedAt: string;
};

type ConfirmState = {
  open: boolean;
  user: UserRow | null;
};

export default function UsersPage() {
  const { locale } = useParams() as { locale: string };
  const t = useTranslations('Settings.Users');
  const commonT = useTranslations('Common');
  const { empresaId } = useEnterprise();
  const { notify } = useAlerts();

  const containerRef = useRef<HTMLDivElement>(null);

  const [quickFilter, setQuickFilter] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, user: null });

  const normalizeUsers = (list: BackendUser[]): UserRow[] =>
    list.map((user) => {
      const username = (user.user ?? (user as any).usuario ?? '') as string;
      const updatedIso = (user.updated ?? (user as any).updatedAt ?? new Date().toISOString()).slice(0, 10);
      return {
        id: user.id,
        username,
        fullName: (user.name ?? '') as string,
        role: user.role?.name ?? '—',
        isActive: Boolean(user.status),
        updatedAt: updatedIso,
      };
    });

  const fetchUsers = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const data = await getUsersApi(empresaId);
      setRows(normalizeUsers(data));
      setError(null);
    } catch (error: any) {
      const message = error?.message || t('alerts.loadError.description');
      setError(message);
      notify({ type: 'error', title: t('alerts.loadError.title'), description: message });
    } finally {
      setLoading(false);
    }
  }, [empresaId, notify, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = useCallback((row: UserRow) => {
    setEditUserId(row.id);
    setOpenCreate(false);
    setOpenEdit(true);
  }, []);

  const requestDelete = useCallback((row: UserRow) => {
    setConfirm({ open: true, user: row });
  }, []);

  const confirmDelete = async () => {
    const target = confirm.user;
    if (!target) return;
    setConfirm({ open: false, user: null });

    const previous = rows;
    setRows((current) => current.filter((row) => row.id !== target.id));

    try {
      await deleteUserApi(target.id);
      notify({ type: 'success', title: t('alerts.deleteSuccess.title'), description: t('alerts.deleteSuccess.description', { user: target.fullName || target.username }) });
    } catch (error: any) {
      setRows(previous);
      notify({ type: 'error', title: t('alerts.deleteError.title'), description: error?.message || t('alerts.deleteError.description') });
    }
  };

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }), [locale]);

  const columns = useMemo<ColDef<UserRow>[]>(
    () => [
      {
        headerName: t('table.columns.username'),
        field: 'username',
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
        headerName: t('table.columns.name'),
        field: 'fullName',
        flex: 1.4,
        minWidth: 200,
        cellClass: 'text-gray-700',
      },
      {
        headerName: t('table.columns.role'),
        field: 'role',
        flex: 1,
        minWidth: 140,
        cellRenderer: (params: any) => (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
            {params.value}
          </span>
        ),
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
        width: 180,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => (
          <ActionsCell
            onEdit={() => handleEdit(params.data)}
            onDelete={() => requestDelete(params.data)}
          />
        ),
      },
    ],
    [dateFormatter, handleEdit, requestDelete, t],
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
              setOpenEdit(false);
              setEditUserId(null);
              setOpenCreate(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            <span>{t('actions.newUser')}</span>
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

      <AgTable<UserRow>
        rows={rows}
        columns={columns}
        quickFilterText={quickFilter}
        rowClassRules={rowClassRules}
        getRowId={(row) => row.id}
        height={440}
        pageSize={10}
      />

      <SidePanel
        title={t('panels.createTitle')}
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        reserveRef={containerRef}
      >
        <CreateUserForm
          defaultClientId={empresaId ?? undefined}
          onClose={() => setOpenCreate(false)}
          onSuccess={async () => {
            await fetchUsers();
            setOpenCreate(false);
          }}
        />
      </SidePanel>

      <SidePanel
        title={t('panels.editTitle')}
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setEditUserId(null);
        }}
        reserveRef={containerRef}
      >
        {editUserId && (
          <EditUserForm
            userId={editUserId}
            onCancel={() => {
              setOpenEdit(false);
              setEditUserId(null);
            }}
            onSuccess={async () => {
              await fetchUsers();
              setOpenEdit(false);
              setEditUserId(null);
            }}
          />
        )}
      </SidePanel>

      <ConfirmDialog
        open={confirm.open}
        title={t('confirm.deleteTitle', { user: confirm.user?.fullName || confirm.user?.username || '' })}
        description={t('confirm.deleteDescription')}
        confirmLabel={commonT('confirm.confirm')}
        cancelLabel={commonT('confirm.cancel')}
        variant="danger"
        onCancel={() => setConfirm({ open: false, user: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

