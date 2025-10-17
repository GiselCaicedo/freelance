'use client';

import { useEffect, useState } from 'react';
import {
  BackendUser,
  getUserByIdApi,
  getRolesApi,
  getBusinessApi,
  updateUserApi,
  Role,
  Business
} from '@/services/conexion';
import { useAlerts } from '@/components/common/AlertsProvider';

type Props = {
  userId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export default function EditUserForm({ userId, onCancel, onSuccess }: Props) {
  const { notify } = useAlerts();
  const [user, setUser] = useState<BackendUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [business, setBusiness] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState(true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [u, r, b] = await Promise.all([
          getUserByIdApi(userId),
          getRolesApi(),
          getBusinessApi(),
        ]);
        setUser(u);
        setRoles(r);
        setBusiness(b);

        setName(u.name || '');
        const initialRole = (u as any).role_id ?? u.role?.id ?? '';
        setRoleId(initialRole ? String(initialRole) : '');
        setStatus(!!u.status);
        setErr(null);
      } catch (e: any) {
        const message = e?.message || 'No se pudo cargar la información';
        setErr(message);
        notify({ type: 'error', title: 'Error al cargar el usuario', description: message });
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, notify]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await updateUserApi(userId, {
        name,
        role_id: roleId || undefined,
        status,
        password: password || undefined, // opcional
      });
      if (!response.success) {
        notify({ type: 'error', title: 'No se pudo actualizar el usuario', description: response.message || 'Inténtalo nuevamente.' });
        return;
      }
      notify({ type: 'success', title: 'Usuario actualizado', description: 'Los cambios se guardaron correctamente.' });
      onSuccess?.();
    } catch (e: any) {
      notify({ type: 'error', title: 'No se pudo actualizar el usuario', description: e?.message || 'Ocurrió un error inesperado.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pl-2 text-sm text-gray-600">Cargando…</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (!user) return null;

  return (
    <form onSubmit={submit} className="p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Usuario</label>
        <input
          value={user.user || (user as any).usuario || ''}
          disabled
          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          placeholder="Nombre completo"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Rol</label>
        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          required
        >
          <option value="" disabled>Selecciona un rol…</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="status"
          type="checkbox"
          checked={status}
          onChange={(e) => setStatus(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="status" className="text-sm text-gray-700 select-none">Activo</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nuevo password (opcional)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          placeholder="Dejar vacío para no cambiar"
        />
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
