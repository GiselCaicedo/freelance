'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/shared/components/common/PageHeader';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import { getPasswordPolicyApi, savePasswordPolicyApi, PasswordPolicyPayload } from '@/shared/services/settings';

const defaultState: PasswordPolicyPayload = {
  id: undefined,
  min_length: 10,
  require_uppercase: true,
  require_lowercase: true,
  require_number: true,
  require_special: true,
  disallow_common_passwords: true,
  expire_days: null,
  history_last_n: 5,
  is_active: true,
  status: true,
};

export default function PasswordPolicyPage() {
  const t = useTranslations('Settings.PasswordPolicy');
  const { notify } = useAlerts();
  const { empresaId } = useEnterprise();

  const [form, setForm] = useState<PasswordPolicyPayload>(defaultState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => (form.min_length ?? 0) >= 6, [form.min_length]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPasswordPolicyApi(empresaId ?? null);
        if (data) {
          setForm({
            id: data.id,
            client_id: data.client_id,
            min_length: data.min_length ?? 10,
            require_uppercase: data.require_uppercase !== false,
            require_lowercase: data.require_lowercase !== false,
            require_number: data.require_number !== false,
            require_special: data.require_special !== false,
            disallow_common_passwords: data.disallow_common_passwords !== false,
            expire_days: data.expire_days ?? null,
            history_last_n: data.history_last_n ?? 5,
            is_active: data.is_active !== false,
            status: data.status !== false,
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
  }, [empresaId, notify, t]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      notify({ type: 'warning', title: t('alerts.invalidTitle'), description: t('alerts.invalidDescription') });
      return;
    }

    const payload: PasswordPolicyPayload = {
      ...form,
      client_id: empresaId ?? null,
      min_length: form.min_length ?? 10,
      history_last_n: form.history_last_n ?? 5,
      expire_days: form.expire_days === null ? null : Number(form.expire_days),
    };

    try {
      setSaving(true);
      const saved = await savePasswordPolicyApi(payload);
      setForm((current) => ({ ...current, id: saved.id }));
      notify({ type: 'success', title: t('alerts.successTitle'), description: t('alerts.successDescription') });
    } catch (err: any) {
      notify({ type: 'error', title: t('alerts.saveErrorTitle'), description: err?.message ?? t('alerts.saveErrorDescription') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbs={[{ label: t('breadcrumbs.section'), href: '/settings' }, { label: t('breadcrumbs.current') }]}
      />

      <div className="mx-auto mt-6 max-w-3xl">
        {error && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={onSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="min_length" className="block text-sm font-medium text-slate-700">
                {t('fields.minLength.label')}
              </label>
              <input
                id="min_length"
                type="number"
                min={4}
                value={form.min_length ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, min_length: Number(event.target.value) }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="history_last_n" className="block text-sm font-medium text-slate-700">
                {t('fields.history.label')}
              </label>
              <input
                id="history_last_n"
                type="number"
                min={1}
                value={form.history_last_n ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, history_last_n: Number(event.target.value) }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="expire_days" className="block text-sm font-medium text-slate-700">
                {t('fields.expire.label')}
              </label>
              <input
                id="expire_days"
                type="number"
                min={0}
                value={form.expire_days ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, expire_days: event.target.value === '' ? null : Number(event.target.value) }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                placeholder="90"
              />
              <p className="text-xs text-slate-500">{t('fields.expire.help')}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={form.require_uppercase !== false}
                onChange={(event) => setForm((current) => ({ ...current, require_uppercase: event.target.checked }))}
              />
              {t('fields.require.uppercase')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={form.require_lowercase !== false}
                onChange={(event) => setForm((current) => ({ ...current, require_lowercase: event.target.checked }))}
              />
              {t('fields.require.lowercase')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={form.require_number !== false}
                onChange={(event) => setForm((current) => ({ ...current, require_number: event.target.checked }))}
              />
              {t('fields.require.number')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={form.require_special !== false}
                onChange={(event) => setForm((current) => ({ ...current, require_special: event.target.checked }))}
              />
              {t('fields.require.special')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={form.disallow_common_passwords !== false}
                onChange={(event) => setForm((current) => ({ ...current, disallow_common_passwords: event.target.checked }))}
              />
              {t('fields.require.common')}
            </label>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={form.is_active !== false}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              {t('fields.active.label')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={form.status !== false}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.checked }))}
              />
              {t('fields.status.label')}
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {saving ? t('actions.saving') : t('actions.save')}
            </button>
          </div>

          {loading && <p className="text-sm text-slate-500">{t('states.loading')}</p>}
        </form>
      </div>
    </div>
  );
}
