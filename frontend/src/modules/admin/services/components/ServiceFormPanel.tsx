'use client';

import type { PersistServiceInput, ServiceCategory, ServiceRecord, ServiceStatus } from './types';
import type { TaxRecord } from '@admin/settings/taxes/types';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  mode: 'create' | 'edit';
  service: ServiceRecord | null;
  categories: ServiceCategory[];
  taxes: TaxRecord[];
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
  price: string;
  subtotal: string;
  frequency: string;
  startDate: string;
  endDate: string;
  taxOneId: string;
  taxTwoId: string;
};

const defaultState: FormState = {
  name: '',
  description: '',
  unit: '',
  status: 'active',
  categoryId: '',
  price: '',
  subtotal: '',
  frequency: '',
  startDate: '',
  endDate: '',
  taxOneId: '',
  taxTwoId: '',
};

const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }
  if (value.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return '';
};

const parseDecimal = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const normalized = trimmed.replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

export default function ServiceFormPanel({
  mode,
  service,
  categories,
  taxes,
  open,
  onSubmit,
  onCancel,
  onDelete,
  saving = false,
  deleting = false,
}: Props) {
  const t = useTranslations('Servicios.Form');
  const [form, setForm] = useState<FormState>(defaultState);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (service) {
      setForm({
        name: service.name ?? '',
        description: service.description ?? '',
        unit: service.unit ?? '',
        status: service.status,
        categoryId: service.category?.id ?? '',
        price: service.price != null ? String(service.price) : '',
        subtotal: service.subtotal != null ? String(service.subtotal) : '',
        frequency: service.frequency ?? '',
        startDate: toDateInputValue(service.startDate),
        endDate: toDateInputValue(service.endDate),
        taxOneId: service.taxOne?.id ?? '',
        taxTwoId: service.taxTwo?.id ?? '',
      });
    } else {
      setForm(defaultState);
    }
    setPriceError(null);
  }, [open, service]);

  const isEdit = mode === 'edit';
  const priceValue = parseDecimal(form.price);
  const canSubmit =
    form.name.trim().length > 0 && priceValue !== null && priceValue >= 0 && !saving && !deleting;

  const categoryOptions = useMemo(
    () => [{ id: '', name: t('categoryPlaceholder') }, ...categories],
    [categories, t],
  );
  const taxOptions = useMemo(
    () => [{ id: '', name: t('noTaxOption') }, ...taxes.map(tax => ({ id: tax.id, name: tax.name }))],
    [taxes, t],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      if (priceValue === null || priceValue < 0) {
        setPriceError(t('errors.priceRequired'));
      }
      return;
    }

    const subtotalValue = parseDecimal(form.subtotal);
    const payload: PersistServiceInput = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      unit: form.unit.trim() || null,
      status: form.status,
      categoryId: form.categoryId.trim() || null,
      price: priceValue ?? 0,
      subtotal: subtotalValue ?? null,
      frequency: form.frequency.trim() || null,
      startDate: form.startDate.trim() || null,
      endDate: form.endDate.trim() || null,
      taxOneId: form.taxOneId.trim() || null,
      taxTwoId: form.taxTwoId.trim() || null,
    };

    setPriceError(null);
    await onSubmit(payload);
  };

  const handleDelete = async () => {
    if (!onDelete || deleting) {
      return;
    }
    await onDelete();
  };

  const actionLabel = saving
    ? t('actions.saving')
    : isEdit
      ? t('actions.update')
      : t('actions.create');

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('nameLabel')}</label>
        <input
          type="text"
          value={form.name}
          onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
          placeholder={t('namePlaceholder')}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('descriptionLabel')}</label>
        <textarea
          value={form.description}
          onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
          placeholder={t('descriptionPlaceholder')}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('unitLabel')}</label>
        <input
          type="text"
          value={form.unit}
          onChange={event => setForm(prev => ({ ...prev, unit: event.target.value }))}
          placeholder={t('unitPlaceholder')}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('priceLabel')}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={event => {
              setForm(prev => ({ ...prev, price: event.target.value }));
              setPriceError(null);
            }}
            placeholder={t('pricePlaceholder')}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            required
          />
          {priceError && <p className="mt-1 text-xs font-medium text-red-600">{priceError}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('subtotalLabel')}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.subtotal}
            onChange={event => setForm(prev => ({ ...prev, subtotal: event.target.value }))}
            placeholder={t('subtotalPlaceholder')}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">{t('subtotalHelper')}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('frequencyLabel')}</label>
          <input
            type="text"
            value={form.frequency}
            onChange={event => setForm(prev => ({ ...prev, frequency: event.target.value }))}
            placeholder={t('frequencyPlaceholder')}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('categoryLabel')}</label>
          <select
            value={form.categoryId}
            onChange={event => setForm(prev => ({ ...prev, categoryId: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          >
            {categoryOptions.map(category => (
              <option key={category.id} value={category.id}>
                {category.id ? category.name : t('categoryPlaceholder')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('startDateLabel')}</label>
          <input
            type="date"
            value={form.startDate}
            onChange={event => setForm(prev => ({ ...prev, startDate: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('endDateLabel')}</label>
          <input
            type="date"
            value={form.endDate}
            onChange={event => setForm(prev => ({ ...prev, endDate: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('taxOneLabel')}</label>
          <select
            value={form.taxOneId}
            onChange={event => setForm(prev => ({ ...prev, taxOneId: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          >
            {taxOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('taxTwoLabel')}</label>
          <select
            value={form.taxTwoId}
            onChange={event => setForm(prev => ({ ...prev, taxTwoId: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          >
            {taxOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="service-status"
          type="checkbox"
          checked={form.status === 'active'}
          onChange={event =>
            setForm(prev => ({ ...prev, status: event.target.checked ? 'active' : 'inactive' }))
          }
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="service-status" className="select-none text-sm text-gray-700">
          {form.status === 'active' ? t('statusActive') : t('statusInactive')}
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
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
