'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { ColDef, RowClassRules } from 'ag-grid-community';
import { Plus, Search } from 'lucide-react';
import AgTable from '@/components/datagrid/AgTable';
import ActionsCell from '@/components/common/ActionsCell';
import SidePanel from '@/components/common/SidePanel';
import { BackendUser, deleteUserApi, getUsersApi } from '@/services/conexion';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import CreateUserForm from '@/components/users/CreateUserForm';
import EditUserForm from '@/components/users/EditUserForm';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { useAlerts } from '@/components/common/AlertsProvider';

type UserRow = {
  id: string;
  usuario: string;
  nombre: string;
  perfil: string;
  estado: 'Activo' | 'Inactivo' | string;
  ultimaActualizacion: string;
};

export default function UsersPage() {
  const [quick, setQuick] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useParams() as { locale: string };
  const { empresaId } = useEnterprise();
  const { notify } = useAlerts();

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);


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
      };
    });

  const fetchUsers = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const data = await getUsersApi(empresaId);
      setRows(normalize(data));
      setError(null);
    } catch (e: any) {
      const message = e?.message || 'Error cargando usuarios';
      setError(message);
      notify({ type: 'error', title: 'No se pudieron cargar los usuarios', description: message });
    } finally {
      setLoading(false);
    }
  }, [empresaId, notify]);

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
    try {
      await deleteUserApi(row.id);
      notify({
        type: 'success',
        title: 'Usuario eliminado',
        description: `${row.nombre || row.usuario} fue eliminado correctamente`,
      });
    } catch (e: any) {
      setRows(prev);
      notify({ type: 'error', title: 'No se pudo eliminar el usuario', description: e?.message || 'Ocurrió un error inesperado' });
    }
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
      <PageHeader
        className="mb-6"
        breadcrumbs={[
          { label: 'Seguridad y Accesos', href: `/${locale}/settings` },
          { label: 'Usuarios' },
        ]}
        title="Usuarios"
        description="Gestión de usuarios del sistema"
        actions={(
          <button
            type="button"
            onClick={() => { setOpenEdit(false); setEditUserId(null); setOpenCreate(true); }}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo usuario</span>
          </button>
        )}
      />

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
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      <AgTable<UserRow>
        rows={rows}
        columns={columns}
        quickFilterText={quick}
        rowClassRules={rowClassRules}
        getRowId={(r) => r.id}
        height={440}
        pageSize={10}
      />

      <SidePanel title="Crear nuevo usuario" open={openCreate} onClose={() => setOpenCreate(false)} reserveRef={containerRef}>
        <CreateUserForm
          defaultBusinessId={empresaId ?? undefined}
          onClose={() => setOpenCreate(false)}
          onSuccess={async () => { await fetchUsers(); setOpenCreate(false); }}
        />
      </SidePanel>

      <SidePanel
        title="Editar usuario"
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setEditUserId(null);
        }}
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
