"use client";
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Role, RoleCategory, updateRoleApi, createRoleApi } from '@/shared/services/conexion';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { normalizeRoleCategoryOrEmpty } from '@/shared/utils/roles';

type Props = {
  role: Role | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Role) => void;
};

export default function RoleFormModal({ role, open, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ name: '', description: '', status: true, role_category: '' as '' | RoleCategory });
  const [saving, setSaving] = useState(false);
  const t = useTranslations('Roles.Form');
  const { notify } = useAlerts();

  useEffect(() => {
    if (!open) return;
    if (role?.id) {
      setForm({
        name: role.name ?? '',
        description: role.description ?? '',
        status: role.status ?? true,
        role_category: normalizeRoleCategoryOrEmpty(role.role_category),
      });
    } else {
      setForm({ name: '', description: '', status: true, role_category: '' });
    }
  }, [open, role]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (!form.role_category) {
      setSaving(false);
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        role_category: form.role_category,
      };

      const result = role?.id
        ? await updateRoleApi(role.id, payload)
        : await createRoleApi(payload);

      onSaved(result);
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? t('alerts.saveError.description');
      notify({ type: 'error', title: t('alerts.saveError.title'), description: message });
    } finally {
      setSaving(false);
    }
  };

  const field = 'mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900';
  const statusLabel = form.status ? t('status.active') : t('status.inactive');

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('nameLabel')}</label>
        <input
          className={field}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t('namePlaceholder')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('descriptionLabel')}</label>
        <textarea
          className={field}
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder={t('descriptionPlaceholder')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('panel.label')}</label>
        <select
          className={field}
          value={form.role_category}
          onChange={(e) => setForm({ ...form, role_category: e.target.value as RoleCategory | '' })}
          required
        >
          <option value="" disabled hidden>
            {t('panel.placeholder')}
          </option>
          <option value="admin">{t('panel.options.admin')}</option>
          <option value="client">{t('panel.options.client')}</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="status"
          type="checkbox"
          checked={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="status" className="text-sm text-gray-700 select-none">{statusLabel}</label>
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          disabled={saving || !form.role_category || !form.name.trim()}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving
            ? t('actions.saving')
            : role?.id
              ? t('actions.update')
              : t('actions.create')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
          {t('actions.cancel')}
        </button>
      </div>
    </form>
  );
}
