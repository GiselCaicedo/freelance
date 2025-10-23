'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/shared/components/common/PageHeader';
import { SettingsTabs } from '@/shared/components/settings/SettingsTabs';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { getPasswordPolicyApi, savePasswordPolicyApi, PasswordPolicyPayload } from '@/shared/services/settings';
import { getSettingsBasePath } from '@/shared/settings/navigation';

type FormState = {
  id?: string;
  min_length: string;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_number: boolean;
  require_special: boolean;
  disallow_common_passwords: boolean;
  expire_days: string;
  history_last_n: string;
};

const defaultState: FormState = {
  id: undefined,
  min_length: '10',
  require_uppercase: true,
  require_lowercase: true,
  require_number: true,
  require_special: true,
  disallow_common_passwords: true,
  expire_days: '',
  history_last_n: '5',
};

export default function PasswordPolicyPage() {
  const t = useTranslations('Settings.PasswordPolicy');
  const { notify } = useAlerts();
  const pathname = usePathname();
  const settingsBase = getSettingsBasePath(pathname ?? undefined);

  const [form, setForm] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => Number(form.min_length) >= 6, [form.min_length]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPasswordPolicyApi();
        if (data) {
          setForm({
            id: data.id,
            min_length: (data.min_length ?? 10).toString(),
            require_uppercase: data.require_uppercase !== false,
            require_lowercase: data.require_lowercase !== false,
            require_number: data.require_number !== false,
            require_special: data.require_special !== false,
            disallow_common_passwords: data.disallow_common_passwords !== false,
            expire_days: data.expire_days?.toString() ?? '',
            history_last_n: (data.history_last_n ?? 5).toString(),
          });
        } else {
          setForm(defaultState);
        }
        setError(null);
      } catch (err: any) {
        const message = err?.message ?? t('alerts.loadErrorDescription');
        setError(message);
        notify({ type: 'error', title: t('alerts.loadErrorTitle'), description: message });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [notify, t]);

  const parseNumber = (value: string, fallback: number | null = null): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : fallback;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      notify({ type: 'warning', title: t('alerts.invalidTitle'), description: t('alerts.invalidDescription') });
      return;
    }

    const payload: PasswordPolicyPayload = {
      id: form.id,
      min_length: parseNumber(form.min_length, 10),
      require_uppercase: form.require_uppercase,
      require_lowercase: form.require_lowercase,
      require_number: form.require_number,
      require_special: form.require_special,
      disallow_common_passwords: form.disallow_common_passwords,
      history_last_n: parseNumber(form.history_last_n, 5),
      expire_days: parseNumber(form.expire_days, null),
    };

    try {
      setSaving(true);
      const saved = await savePasswordPolicyApi(payload);
      setForm((current) => ({ ...current, id: saved.id ?? current.id }));
      notify({ type: 'success', title: t('alerts.successTitle'), description: t('alerts.successDescription') });
    } catch (err: any) {
      notify({ type: 'error', title: t('alerts.saveErrorTitle'), description: err?.message ?? t('alerts.saveErrorDescription') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-12">
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
            <label htmlFor="min_length" className="block text-sm font-medium text-slate-700">
              {t('fields.minLength.label')}
            </label>
            <input
              id="min_length"
              type="number"
              min={4}
              value={form.min_length}
              onChange={(event) => setForm((current) => ({ ...current, min_length: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="history_last_n" className="block text-sm font-medium text-slate-700">
              {t('fields.history.label')}
            </label>
            <input
              id="history_last_n"
              type="number"
              min={1}
              value={form.history_last_n}
              onChange={(event) => setForm((current) => ({ ...current, history_last_n: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="expire_days" className="block text-sm font-medium text-slate-700">
              {t('fields.expire.label')}
            </label>
            <input
              id="expire_days"
              type="number"
              min={0}
              value={form.expire_days}
              onChange={(event) => setForm((current) => ({ ...current, expire_days: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="90"
            />
            <p className="text-xs text-slate-500">{t('fields.expire.help')}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={form.require_uppercase}
              onChange={(event) => setForm((current) => ({ ...current, require_uppercase: event.target.checked }))}
            />
            {t('fields.require.uppercase')}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={form.require_lowercase}
              onChange={(event) => setForm((current) => ({ ...current, require_lowercase: event.target.checked }))}
            />
            {t('fields.require.lowercase')}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={form.require_number}
              onChange={(event) => setForm((current) => ({ ...current, require_number: event.target.checked }))}
            />
            {t('fields.require.number')}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={form.require_special}
              onChange={(event) => setForm((current) => ({ ...current, require_special: event.target.checked }))}
            />
            {t('fields.require.special')}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={form.disallow_common_passwords}
              onChange={(event) => setForm((current) => ({ ...current, disallow_common_passwords: event.target.checked }))}
            />
            {t('fields.require.common')}
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {saving ? t('actions.saving') : t('actions.save')}
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">{t('states.loading')}</p>}
      </form>
    </div>
  );
}
