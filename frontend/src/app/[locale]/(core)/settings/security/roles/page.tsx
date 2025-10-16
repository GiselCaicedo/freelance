'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { ColDef, RowClassRules, GridApi } from 'ag-grid-community';
import { Plus, Search } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import AgTable from '@/components/datagrid/AgTable';
import ActionsCell from '@/components/common/ActionsCell';
import SidePanel from '@/components/common/SidePanel';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

import { listRolesApi, deleteRoleApi, Role } from '@/services/conexion';
import RoleFormModal from '@/components/roles/RoleFormModal';

type RoleRow = {
  id: string;
  rol: string;
  comentario: string;
  estado: 'Activo' | 'Inactivo' | string;
  ultimaActualizacion: string;
};

export default function RolesPage() {
   const { locale } = useParams() as { locale: string };
  const router = useRouter();

  // contenedor al abrir el panel
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Tabla
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [quick, setQuick] = useState('');
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Panels
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openPerms, setOpenPerms] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  const normalize = (list: Role[]): RoleRow[] =>
    list.map((r) => ({
      id: r.id,
      rol: r.name,
      comentario: (r as any).description ?? '',
      estado: (r.status ?? true) ? 'Activo' : 'Inactivo',
      ultimaActualizacion: (r.updated ?? (r as any).updatedAt ?? new Date().toISOString()).slice(0, 10),
    }));

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listRolesApi();
      setRows(normalize(data));
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Error cargando roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleEdit = (row: RoleRow) => {
    setCurrentRole({
      id: row.id,
      name: row.rol,
      description: row.comentario,
      status: row.estado === 'Activo',
      updated: row.ultimaActualizacion,
    } as Role);
    setOpenCreate(false);
    setOpenPerms(false);
    setOpenEdit(true);
  };

  const handlePermissions = (row: RoleRow) => {
    router.push(`/${locale}/settings/security/roles/${row.id}/permissions`);
  };

  const handleDelete = async (row: RoleRow) => {
    const ok = window.confirm(`¿Eliminar el rol "${row.rol}"?`);
    if (!ok) return;
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== row.id));
    try { await deleteRoleApi(row.id); }
    catch (e: any) { setRows(prev); alert(e?.message || 'No fue posible eliminar el rol'); }
  };

  const columns = useMemo<ColDef<RoleRow>[]>(() => [
    {
      headerName: 'Rol',
      field: 'rol',
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
    { headerName: 'Comentario', field: 'comentario', flex: 1.4, minWidth: 200, cellClass: 'text-gray-700' },
    {
      headerName: 'Estado',
      field: 'estado',
      flex: 0.9,
      minWidth: 140,
      cellRenderer: (p: any) => {
        const active = p.value === 'Activo';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${active ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'
              }`}
          >
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
      width: 200,
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => (
        <ActionsCell
          onEdit={() => handleEdit(p.data)}
          onPermissions={() => handlePermissions(p.data)}
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Seguridad y Accesos', href: `/${locale}/settings` },
              { label: 'Roles' },
            ]}
          />
          <div className="border border-gray-200 my-5" />
          <h2 className="text-xl font-semibold text-gray-900">Roles</h2>
          <p className="text-sm text-gray-500">Gestión de roles y permisos</p>
        </div>

        <button
          onClick={() => { setCurrentRole(null); setOpenEdit(false); setOpenPerms(false); setOpenCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 ring-1 ring-inset ring-gray-200 rounded-lg hover:bg-gray-50 transition-all"
        >


          <Plus className="w-4 h-4" />
          <span>Nuevo Rol</span>
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
             className="w-full ps-9 pe-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white text-gray-900"
            placeholder="Buscar por rol, comentario…"
          />
        </div>
        {loading && <span className="text-xs text-gray-500">Cargando roles…</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      <AgTable<RoleRow>
        rows={rows}
        columns={columns}
        quickFilterText={quick}

        
        rowClassRules={rowClassRules}
        onReady={(api) => setGridApi(api)}
        getRowId={(r) => r.id}
        height={440}
        pageSize={10}
      />

      <SidePanel
        title="Crear nuevo rol"
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        reserveRef={containerRef}
      >
        <RoleFormModal
          role={null as any}
          open={true}
          onClose={() => setOpenCreate(false)}
          onSaved={async () => { await fetchRoles(); setOpenCreate(false); }}
        />
      </SidePanel>

      <SidePanel
        title="Editar rol"
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        reserveRef={containerRef}
      >
        {currentRole && (
          <RoleFormModal
            role={currentRole}
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            onSaved={async () => { await fetchRoles(); setOpenEdit(false); }}
          />
        )}
      </SidePanel>


    </div>
  );
}
