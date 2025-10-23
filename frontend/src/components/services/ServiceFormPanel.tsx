'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PersistServiceInput, ServiceCategory, ServiceRecord, ServiceStatus } from './types';

type Props = {
  mode: 'create' | 'edit';
  service: ServiceRecord | null;
  categories: ServiceCategory[];
  open: boolean;
  onSubmit: (payload: PersistServiceInput) => Promise<void> | void;
  onCancel: () => void;
  onDelete?: () => Promise<void> | void;
  saving?: boolean;
  deleting?: boolean;
};

type FormState = {
  name: string;
  description: string;
  unit: string;
  status: ServiceStatus;
  categoryId: string;
};

const defaultState: FormState = {
  name: '',
  description: '',
  unit: '',
  status: 'active',
  categoryId: '',
};

export default function ServiceFormPanel({
  mode,
  service,
  categories,
  open,
  onSubmit,
  onCancel,
  onDelete,
  saving = false,
  deleting = false,
}: Props) {
  const t = useTranslations('Servicios.Form');
  const [form, setForm] = useState<FormState>(defaultState);

  useEffect(() => {
    if (!open) return;
    if (service) {
      setForm({
        name: service.name ?? '',
        description: service.description ?? '',
        unit: service.unit ?? '',
        status: service.status,
        categoryId: service.category?.id ?? '',
      });
    } else {
      setForm(defaultState);
    }
  }, [open, service]);

  const isEdit = mode === 'edit';
  const canSubmit = form.name.trim().length > 0 && !saving && !deleting;

  const categoryOptions = useMemo(() => [{ id: '', name: t('categoryPlaceholder') }, ...categories], [categories, t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const payload: PersistServiceInput = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      unit: form.unit.trim() || null,
      status: form.status,
      categoryId: form.categoryId.trim() || null,
    };

    await onSubmit(payload);
  };

  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    await onDelete();
  };

  const actionLabel = saving
    ? t('actions.saving')
    : isEdit
      ? t('actions.update')
      : t('actions.create');

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('nameLabel')}</label>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder={t('namePlaceholder')}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('descriptionLabel')}</label>
        <textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder={t('descriptionPlaceholder')}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('unitLabel')}</label>
        <input
          type="text"
          value={form.unit}
          onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
          placeholder={t('unitPlaceholder')}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('categoryLabel')}</label>
        <select
          value={form.categoryId}
          onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.id ? category.name : t('categoryPlaceholder')}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="service-status"
          type="checkbox"
          checked={form.status === 'active'}
          onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.checked ? 'active' : 'inactive' }))}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="service-status" className="text-sm text-gray-700 select-none">
          {form.status === 'active' ? t('statusActive') : t('statusInactive')}
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {actionLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          {t('actions.cancel')}
        </button>
        {isEdit && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? t('actions.deleting') : t('actions.delete')}
          </button>
        )}
      </div>
    </form>
  );
}
