'use client'
import { useEffect, useMemo, useState } from 'react';
import {
  Permission,
  listPermissionsApi,
  getRolePermissionsApi,
  saveRolePermissionsApi,
  Role
} from '@/shared/services/conexion';
import { useAlerts } from '@/shared/components/common/AlertsProvider';

type Props = {
  role: Role | null;
  open: boolean;
  onClose: () => void;
};

export default function RolePermissionsModal({ role, open, onClose }: Props) {
  const [all, setAll] = useState<Permission[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const { notify } = useAlerts();

  useEffect(() => {
    if (!open || !role?.id) return;
    (async () => {
      setLoading(true);
      try {
        const [catalog, current] = await Promise.all([
          listPermissionsApi(),
          getRolePermissionsApi(role.id),
        ]);
        setAll(catalog);
        setChecked(new Set(current));
      } finally {
        setLoading(false);
      }
    })();
  }, [open, role?.id]);

  if (!open || !role) return null;

  const toggle = (id: string) =>
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    try {
      await saveRolePermissionsApi(role.id, Array.from(checked));
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? 'Unable to save permissions.';
      notify({ type: 'error', title: 'Error', description: message });
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description ?? '').toLowerCase().includes(term)
    );
  }, [all, q]);

  return (
    // Igual: sin overlay. Contenido para SidePanel.
    <div className="p-5">
      {/* Buscador (mismo look que Usuarios/Roles) */}
      <div className="mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full ps-3 pe-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white text-gray-900"
          placeholder={`Buscar permisos… (${all.length})`}
        />
      </div>

      {/* Lista de permisos */}
      <div className="max-h-[55vh] overflow-auto rounded-lg border border-gray-200 bg-white p-3 space-y-2">
        {loading ? (
          <div className="text-sm text-gray-600">Cargando permisos…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No hay permisos que coincidan.</div>
        ) : (
          filtered.map(p => (
            <label key={p.id} className="flex items-start gap-3 text-sm px-2 py-1 rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={checked.has(p.id)}
                onChange={() => toggle(p.id)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <span className="leading-5">
                <span className="font-medium text-gray-900">{p.name}</span>
                {p.description ? <span className="text-gray-500"> — {p.description}</span> : null}
              </span>
            </label>
          ))
        )}
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onClose}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          disabled={saving}
          onClick={save}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
