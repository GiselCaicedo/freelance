'use client';

import type {
  BackendUser,
  Client,
  Role,
} from '@shared/services/conexion';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import {
  getClientsApi,
  getRolesApi,
  getUserByIdApi,
  updateUserApi,
} from '@shared/services/conexion';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type Props = {
  userId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export default function EditUserForm({ userId, onCancel, onSuccess }: Props) {
  const { notify } = useAlerts();
  const t = useTranslations('Users.EditForm');
  const [user, setUser] = useState<BackendUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [, setClients] = useState<Client[]>([]);
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
        const [u, r, c] = await Promise.all([
          getUserByIdApi(userId),
          getRolesApi(),
          getClientsApi(),
        ]);
        setUser(u);
        setRoles(r);
        setClients(c);

        setName(u.name || '');
        const initialRole = (u as any).role_id ?? u.role?.id ?? '';
        setRoleId(initialRole ? String(initialRole) : '');
        setStatus(!!u.status);
        setErr(null);
      } catch (e: any) {
        const message = e?.message || t('errors.load');
        setErr(message);
        notify({ type: 'error', title: t('alerts.loadError.title'), description: message });
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
        notify({ type: 'error', title: t('alerts.updateError.title'), description: response.message || t('alerts.updateError.description') });
        return;
      }
      notify({ type: 'success', title: t('alerts.success.title'), description: t('alerts.success.description') });
      onSuccess?.();
    } catch (e: any) {
      notify({ type: 'error', title: t('alerts.updateError.title'), description: e?.message || t('errors.unexpected') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="pl-2 text-sm text-gray-600">{t('states.loading')}</div>;
  }
  if (err) {
    return <div className="text-sm text-red-600">{err}</div>;
  }
  if (!user) {
    return null;
  }

  const statusLabel = status ? t('status.active') : t('status.inactive');

  return (
    <form onSubmit={submit} className="space-y-4 p-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('fields.username.label')}</label>
        <input
          value={user.user || (user as any).usuario || ''}
          disabled
          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('fields.name.label')}</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          placeholder={t('fields.name.placeholder')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('fields.role.label')}</label>
        <select
          value={roleId}
          onChange={e => setRoleId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          required
        >
          <option value="" disabled>{t('fields.role.placeholder')}</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="status"
          type="checkbox"
          checked={status}
          onChange={e => setStatus(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="status" className="text-sm text-gray-700 select-none">{statusLabel}</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('fields.password.label')}</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          placeholder={t('fields.password.placeholder')}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? t('actions.saving') : t('actions.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 hover:bg-gray-50"
        >
          {t('actions.cancel')}
        </button>
      </div>
    </form>
  );
}
