'use client';

import { useEffect, useState } from 'react';
import type { BackendUser } from '@/features/users/types';
import { getUserByIdApi, updateUserApi } from '@/features/users/services/userService';
import { getRolesApi } from '@/features/roles/services/roleService';
import { getClientsApi } from '@/features/clients/services/clientService';
import type { Role } from '@/features/roles/types';
import type { Client } from '@/features/clients/types';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { useTranslations } from 'next-intl';

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

  if (loading) return <div className="pl-2 text-sm text-gray-600">{t('states.loading')}</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (!user) return null;

  const statusLabel = status ? t('status.active') : t('status.inactive');

  return (
    <form onSubmit={submit} className="p-5 space-y-4">
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
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          placeholder={t('fields.name.placeholder')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('fields.role.label')}</label>
        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
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
          onChange={(e) => setStatus(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="status" className="text-sm text-gray-700 select-none">{statusLabel}</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('fields.password.label')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          placeholder={t('fields.password.placeholder')}
        />
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? t('actions.saving') : t('actions.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
          {t('actions.cancel')}
        </button>
      </div>
    </form>
  );
}
