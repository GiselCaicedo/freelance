'use client';

import type { GeneralSettingPayload } from '@shared/services/settings';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import PageHeader from '@shared/components/common/PageHeader';
import { SettingsTabs } from '@shared/components/settings/SettingsTabs';
import { getGeneralSettingApi, saveGeneralSettingApi } from '@shared/services/settings';
import { getSettingsBasePath } from '@shared/settings/navigation';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

type FormState = {
  id?: string;
  company_timezone: string;
  company_locale: string;
  currency: string;
  first_day_of_week: number | '';
  number_decimals: number | '';
  date_format: string;
  time_format: string;
  branding_primary_color: string;
  logo_url: string;
  updated?: string | null;
};

const emptyState: FormState = {
  id: undefined,
  company_timezone: '',
  company_locale: '',
  currency: '',
  first_day_of_week: 1,
  number_decimals: 2,
  date_format: 'DD/MM/YYYY',
  time_format: 'HH:mm',
  branding_primary_color: '#0ea5e9',
  logo_url: '',
  updated: null,
};

export default function GeneralSettingsPage() {
  const t = useTranslations('Settings.General');
  const { notify } = useAlerts();
  const pathname = usePathname();
  const settingsBase = getSettingsBasePath(pathname ?? undefined);

  const [form, setForm] = useState<FormState>(emptyState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getGeneralSettingApi();
        if (data) {
          setForm({
            id: data.id,
            company_timezone: data.company_timezone ?? '',
            company_locale: data.company_locale ?? '',
            currency: data.currency ?? '',
            first_day_of_week: typeof data.first_day_of_week === 'number' ? data.first_day_of_week : 1,
            number_decimals: typeof data.number_decimals === 'number' ? data.number_decimals : 2,
            date_format: data.date_format ?? 'DD/MM/YYYY',
            time_format: data.time_format ?? 'HH:mm',
            branding_primary_color: data.branding_primary_color ?? '#0ea5e9',
            logo_url: data.logo_url ?? '',
            updated: data.updated ?? null,
          });
        } else {
          setForm(emptyState);
        }
        setError(null);
      } catch (err: any) {
        const message = err?.message ?? t('alerts.loadError');
        setError(message);
        notify({ type: 'error', title: t('alerts.loadErrorTitle'), description: message });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [notify, t]);

  const canSubmit = useMemo(() => {
    return form.company_timezone.trim().length > 0 && form.company_locale.trim().length > 0;
  }, [form.company_locale, form.company_timezone]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      notify({ type: 'warning', title: t('alerts.invalidTitle'), description: t('alerts.invalidDescription') });
      return;
    }

    const payload: GeneralSettingPayload = {
      id: form.id,
      company_timezone: form.company_timezone,
      company_locale: form.company_locale,
      currency: form.currency,
      first_day_of_week:
        form.first_day_of_week === '' ? null : Number.isNaN(Number(form.first_day_of_week)) ? null : Number(form.first_day_of_week),
      number_decimals:
        form.number_decimals === '' ? null : Number.isNaN(Number(form.number_decimals)) ? null : Number(form.number_decimals),
      date_format: form.date_format,
      time_format: form.time_format,
      branding_primary_color: form.branding_primary_color,
      logo_url: form.logo_url,
    };

    try {
      setSaving(true);
      const response = await saveGeneralSettingApi(payload);
      setForm(current => ({
        ...current,
        id: response.id,
        updated: response.updated ?? new Date().toISOString(),
      }));
      notify({ type: 'success', title: t('alerts.successTitle'), description: t('alerts.successDescription') });
    } catch (err: any) {
      notify({ type: 'error', title: t('alerts.saveErrorTitle'), description: err?.message ?? t('alerts.saveErrorDescription') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-12">
      <PageHeader
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbs={[{ label: t('breadcrumbs.section'), href: settingsBase }, { label: t('breadcrumbs.current') }]}
      />

      <SettingsTabs className="mt-8" />

      {error && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="company_timezone">
              {t('fields.timezone.label')}
            </label>
            <input
              id="company_timezone"
              type="text"
              value={form.company_timezone}
              onChange={event => setForm(current => ({ ...current, company_timezone: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              placeholder={t('fields.timezone.placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="company_locale">
              {t('fields.locale.label')}
            </label>
            <input
              id="company_locale"
              type="text"
              value={form.company_locale}
              onChange={event => setForm(current => ({ ...current, company_locale: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              placeholder={t('fields.locale.placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="currency">
              {t('fields.currency.label')}
            </label>
            <input
              id="currency"
              type="text"
              value={form.currency}
              onChange={event => setForm(current => ({ ...current, currency: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              placeholder={t('fields.currency.placeholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="branding_primary_color">
              {t('fields.primaryColor.label')}
            </label>
            <input
              id="branding_primary_color"
              type="color"
              value={form.branding_primary_color}
              onChange={event => setForm(current => ({ ...current, branding_primary_color: event.target.value }))}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="date_format">
              {t('fields.dateFormat.label')}
            </label>
            <input
              id="date_format"
              type="text"
              value={form.date_format}
              onChange={event => setForm(current => ({ ...current, date_format: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="time_format">
              {t('fields.timeFormat.label')}
            </label>
            <input
              id="time_format"
              type="text"
              value={form.time_format}
              onChange={event => setForm(current => ({ ...current, time_format: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="logo_url">
              {t('fields.logoUrl.label')}
            </label>
            <input
              id="logo_url"
              type="url"
              value={form.logo_url}
              onChange={event => setForm(current => ({ ...current, logo_url: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              placeholder={t('fields.logoUrl.placeholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="first_day_of_week">
              {t('fields.firstDay.label')}
            </label>
            <select
              id="first_day_of_week"
              value={form.first_day_of_week}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  first_day_of_week: event.target.value === '' ? '' : Number(event.target.value),
                }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
            >
              {weekDays.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="number_decimals">
              {t('fields.decimals.label')}
            </label>
            <input
              id="number_decimals"
              type="number"
              min={0}
              max={6}
              value={form.number_decimals}
              onChange={event =>
                setForm(current => ({
                  ...current,
                  number_decimals: event.target.value === '' ? '' : Number(event.target.value),
                }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-slate-500">
          {loading && <span>{t('states.loading')}</span>}
          {form.updated && (
            <span>{t('states.updatedAt', { value: form.updated })}</span>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {saving ? t('actions.saving') : t('actions.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
