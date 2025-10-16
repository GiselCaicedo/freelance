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

type Props = {
  userId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export default function EditUserForm({ userId, onCancel, onSuccess }: Props) {
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
        setRoleId((u as any).role_id || u.role?.name || '');
        setStatus(!!u.status);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || 'No se pudo cargar la información');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateUserApi(userId, {
        name,
        role_id: roleId || undefined,
        status,
        password: password || undefined, // opcional
      });
      onSuccess?.();
    } catch (e: any) {
      alert(e?.message || 'No fue posible actualizar el usuario');
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
