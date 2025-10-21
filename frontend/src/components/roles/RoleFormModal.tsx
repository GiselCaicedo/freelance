'use client'
import { useEffect, useState } from 'react';
<<<<<<< HEAD
import { useTranslations } from 'next-intl';
=======
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
import { Role, updateRoleApi, createRoleApi } from '@/services/conexion';

type Props = {
  role: Role | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Role) => void;
};

export default function RoleFormModal({ role, open, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ name: '', description: '', status: true });
  const [saving, setSaving] = useState(false);
<<<<<<< HEAD
  const t = useTranslations('Roles.Form');
=======
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8

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
<<<<<<< HEAD
  const statusLabel = form.status ? t('status.active') : t('status.inactive');
=======
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div>
<<<<<<< HEAD
        <label className="block text-sm font-medium text-gray-700">{t('nameLabel')}</label>
=======
        <label className="block text-sm font-medium text-gray-700">Nombre del rol</label>
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        <input
          className={field}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
<<<<<<< HEAD
          placeholder={t('namePlaceholder')}
=======
          placeholder="Ej. Administrador"
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
          required
        />
      </div>

      <div>
<<<<<<< HEAD
        <label className="block text-sm font-medium text-gray-700">{t('descriptionLabel')}</label>
=======
        <label className="block text-sm font-medium text-gray-700">Descripción</label>
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        <textarea
          className={field}
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
<<<<<<< HEAD
          placeholder={t('descriptionPlaceholder')}
=======
          placeholder="Descripción breve (opcional)"
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
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
<<<<<<< HEAD
        <label htmlFor="status" className="text-sm text-gray-700 select-none">{statusLabel}</label>
=======
        <label htmlFor="status" className="text-sm text-gray-700 select-none">Activo</label>
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
<<<<<<< HEAD
          {saving
            ? t('actions.saving')
            : role?.id
              ? t('actions.update')
              : t('actions.create')}
=======
          {saving ? 'Guardando…' : role?.id ? 'Guardar cambios' : 'Crear rol'}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
<<<<<<< HEAD
          {t('actions.cancel')}
=======
          Cancelar
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        </button>
      </div>
    </form>
  );
}
