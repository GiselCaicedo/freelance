'use client';

<<<<<<< HEAD
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ColDef, RowClassRules } from 'ag-grid-community';
import { Plus, Search } from 'lucide-react';

import AgTable from '@/components/datagrid/AgTable';
import ActionsCell from '@/components/common/ActionsCell';
import SidePanel from '@/components/common/SidePanel';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAlerts } from '@/components/common/AlertsProvider';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import CreateUserForm from '@/components/users/CreateUserForm';
import EditUserForm from '@/components/users/EditUserForm';
import { BackendUser, deleteUserApi, getUsersApi } from '@/services/conexion';

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
=======
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { ColDef, RowClassRules, GridApi } from 'ag-grid-community';
import { Plus, Search } from 'lucide-react';
import AgTable from '@/components/datagrid/AgTable';
import ActionsCell from '@/components/common/ActionsCell';
import SidePanel from '@/components/common/SidePanel';
import { BackendUser, deleteUserApi, getUsersApi } from '@/services/conexion';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import CreateUserForm from '@/components/users/CreateUserForm';
import EditUserForm from '@/components/users/EditUserForm';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { useParams } from 'next/navigation';

type UserRow = {
  id: string;
  usuario: string;
  nombre: string;
  perfil: string;
  estado: 'Activo' | 'Inactivo' | string;
  ultimaActualizacion: string;
};

export default function UsersPage() {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [quick, setQuick] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useParams() as { locale: string };
  const { empresaId } = useEnterprise();
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
<<<<<<< HEAD
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
=======


  const containerRef = useRef<HTMLDivElement>(null);

  const normalize = (list: BackendUser[]): UserRow[] =>
    list.map((u) => {
      const username = (u.user ?? (u as any).usuario ?? '') as string;
      const updatedIso = (u.updated ?? (u as any).updatedAt ?? new Date().toISOString()).slice(0, 10);
      return {
        id: u.id,
        usuario: username,
        nombre: (u.name ?? '') as string,
        perfil: u.role?.name ?? '—',
        estado: u.status ? 'Activo' : 'Inactivo',
        ultimaActualizacion: updatedIso,
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
      };
    });

  const fetchUsers = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const data = await getUsersApi(empresaId);
<<<<<<< HEAD
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
=======
      setRows(normalize(data));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleEdit = (row: UserRow) => {
    setEditUserId(row.id);
    setOpenCreate(false);
    setOpenEdit(true);
  };

  const handleDelete = async (row: UserRow) => {
    const ok = window.confirm(`¿Eliminar al usuario "${row.nombre}" (${row.usuario})?`);
    if (!ok) return;
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== row.id));
    try { await deleteUserApi(row.id); }
    catch (e: any) { setRows(prev); alert(e?.message || 'No fue posible eliminar el usuario'); }
  };

  const columns = useMemo<ColDef<UserRow>[]>(() => [
    {
      headerName: 'Usuario',
      field: 'usuario',
      flex: 1,
      minWidth: 160,
      cellRenderer: (p: any) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 shrink-0 rounded-full bg-gray-100 ring-1 ring-gray-200 inline-flex items-center justify-center text-[11px] font-semibold text-gray-700">
            {String(p.value ?? '').slice(0, 2).toUpperCase()}
          </div>
          <span className="font-medium text-gray-900">{p.value}</span>
        </div>
      ),
    },
    { headerName: 'Nombre', field: 'nombre', flex: 1.4, minWidth: 200, cellClass: 'text-gray-700' },
    {
      headerName: 'Perfil',
      field: 'perfil',
      flex: 1,
      minWidth: 140,
      cellRenderer: (p: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
          {p.value}
        </span>
      ),
    },
    {
      headerName: 'Estado',
      field: 'estado',
      flex: 0.9,
      minWidth: 140,
      cellRenderer: (p: any) => {
        const active = p.value === 'Activo';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${active ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-600' : 'bg-red-600'}`} />
            {p.value}
          </span>
        );
      },
    },
    {
      headerName: 'Últ. Actualización',
      field: 'ultimaActualizacion',
      flex: 1,
      minWidth: 170,
      valueFormatter: (p) => {
        const d = new Date(p.value as string);
        if (Number.isNaN(d.getTime())) return p.value ?? '';
        return new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      },
      cellClass: 'text-gray-600',
    },
    {
      headerName: 'Acciones',
      width: 160,
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => (
        <ActionsCell
          onEdit={() => handleEdit(p.data)}
          onDelete={() => handleDelete(p.data)}
        />
      ),
    },
  ], [rows]);

  const rowClassRules = useMemo<RowClassRules>(() => ({
    'row-inactive': (p) => p.data?.estado === 'Inactivo',
  }), []);

  return (
    <div ref={containerRef} className="relative p-8 transition-[padding-right] duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Breadcrumbs items={[
            { label: 'Seguridad y Accesos', href: `/${locale}/settings` },
            { label: 'Usuarios' },
          ]} />
          <div className="border border-gray-200 my-5" />
          <h2 className="text-xl font-semibold text-gray-900">Usuarios</h2>
          <p className="text-sm text-gray-500">Gestión de usuarios del sistema</p>
        </div>
        <button
          onClick={() => { setOpenEdit(false); setEditUserId(null); setOpenCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 ring-1 ring-inset ring-gray-200 rounded-lg hover:bg-gray-50 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            className="w-full ps-9 pe-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white text-gray-900"
            placeholder="Buscar por usuario, nombre, perfil…"
          />
        </div>
        {loading && <span className="text-xs text-gray-500">Cargando usuarios…</span>}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      <AgTable<UserRow>
        rows={rows}
        columns={columns}
<<<<<<< HEAD
        quickFilterText={quickFilter}
        rowClassRules={rowClassRules}
        getRowId={(row) => row.id}
=======
        quickFilterText={quick}
        rowClassRules={rowClassRules}
        onReady={(api) => setGridApi(api)}
        getRowId={(r) => r.id}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        height={440}
        pageSize={10}
      />

<<<<<<< HEAD
      <SidePanel
        title={t('panels.createTitle')}
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        reserveRef={containerRef}
      >
        <CreateUserForm
          defaultBusinessId={empresaId ?? undefined}
          onClose={() => setOpenCreate(false)}
          onSuccess={async () => {
            await fetchUsers();
            setOpenCreate(false);
          }}
=======
      <SidePanel title="Crear nuevo usuario" open={openCreate} onClose={() => setOpenCreate(false)} reserveRef={containerRef}>
        <CreateUserForm
          defaultBusinessId={empresaId ?? undefined}
          onClose={() => setOpenCreate(false)}
          onSuccess={async () => { await fetchUsers(); setOpenCreate(false); }}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        />
      </SidePanel>

      <SidePanel
<<<<<<< HEAD
        title={t('panels.editTitle')}
=======
        title="Editar usuario"
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setEditUserId(null);
        }}
<<<<<<< HEAD
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

=======
        reserveRef={containerRef}>
        {editUserId && (
          <EditUserForm
            userId={editUserId}
            onCancel={() => { setOpenEdit(false); setEditUserId(null); }}
            onSuccess={async () => { await fetchUsers(); setOpenEdit(false); setEditUserId(null); }}
          />
        )}
      </SidePanel>
    </div>
  );
}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
