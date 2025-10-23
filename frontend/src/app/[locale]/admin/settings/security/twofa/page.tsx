'use client';

import type { SecurityPolicyPayload } from '@shared/services/settings';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import PageHeader from '@shared/components/common/PageHeader';
import { SettingsTabs } from '@shared/components/settings/SettingsTabs';
import { getSecurityPolicyApi, saveSecurityPolicyApi } from '@shared/services/settings';
import { getSettingsBasePath } from '@shared/settings/navigation';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const AVAILABLE_METHODS = [
  { id: 'totp', labelKey: 'totp' },
  { id: 'email', labelKey: 'email' },
  { id: 'sms', labelKey: 'sms' },
];

const defaultState: SecurityPolicyPayload = {
  id: undefined,
  require_2fa_all: false,
  require_2fa_admin: true,
  allowed_2fa_methods: ['totp', 'email'],
  allowed_ips: [],
  max_concurrent_sessions: null,
};

export default function TwofaSettingsPage() {
  const t = useTranslations('Settings.Twofa');
  const { notify } = useAlerts();
  const pathname = usePathname();
  const settingsBase = getSettingsBasePath(pathname ?? undefined);

  const [form, setForm] = useState<SecurityPolicyPayload>(defaultState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getSecurityPolicyApi();
        if (data) {
          setForm({
            id: data.id,
            require_2fa_all: data.require_2fa_all ?? false,
            require_2fa_admin: data.require_2fa_admin ?? true,
            allowed_2fa_methods: Array.isArray(data.allowed_2fa_methods) ? data.allowed_2fa_methods : ['totp', 'email'],
            allowed_ips: Array.isArray(data.allowed_ips) ? data.allowed_ips : [],
            max_concurrent_sessions: data.max_concurrent_sessions ?? null,
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

  const canSubmit = useMemo(() => true, []);

  const toggleMethod = (method: string) => {
    setForm((current) => {
      const methods = new Set(current.allowed_2fa_methods ?? []);
      if (methods.has(method)) {
        methods.delete(method);
      } else {
        methods.add(method);
      }
      return { ...current, allowed_2fa_methods: Array.from(methods) };
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    try {
      setSaving(true);
      const payload: SecurityPolicyPayload = {
        ...form,
        allowed_2fa_methods: form.allowed_2fa_methods ?? ['totp', 'email'],
        allowed_ips: form.allowed_ips ?? [],
      };
      const saved = await saveSecurityPolicyApi(payload);
      setForm(current => ({ ...current, id: saved.id }));
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

      <form onSubmit={onSubmit} className="mt-8 space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2 ">
            <label className="inline-flex items-center gap-2 pr-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                checked={form.require_2fa_all === true}
                onChange={event => setForm(current => ({ ...current, require_2fa_all: event.target.checked }))}
              />
              {t('fields.requireAll')}
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                checked={form.require_2fa_admin !== false}
                onChange={event => setForm(current => ({ ...current, require_2fa_admin: event.target.checked }))}
              />
              {t('fields.requireAdmin')}
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">{t('fields.methods.label')}</p>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_METHODS.map(method => (
                <label
                  key={method.id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    checked={(form.allowed_2fa_methods ?? []).includes(method.id)}
                    onChange={() => toggleMethod(method.id)}
                  />
                  {t(`fields.methods.options.${method.labelKey}`)}
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500">{t('fields.methods.help')}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          {t('fields.policyNote')}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-purple-300"
          >
            {saving ? t('actions.saving') : t('actions.save')}
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">{t('states.loading')}</p>}
      </form>
    </div>
  );
}
