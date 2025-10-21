'use client'
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Props = {
  role: Role | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Role) => void;
};

export default function RoleFormModal({ role, open, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ name: '', description: '', status: true });
  const [saving, setSaving] = useState(false);
  const t = useTranslations('Roles.Form');

  useEffect(() => {
    if (!open) return;
    if (role?.id) {
      setForm({
        name: role.name ?? '',
        description: role.description ?? '',
        status: role.status ?? true,
      });
    } else {
      setForm({ name: '', description: '', status: true });
    }
  }, [open, role]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
      };
      const result = role?.id
        ? await updateRoleApi(role.id, payload)
        : await createRoleApi(payload);

      onSaved(result);
      onClose();
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
          disabled={saving}
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
