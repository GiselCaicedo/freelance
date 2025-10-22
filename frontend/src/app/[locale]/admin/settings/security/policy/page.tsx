'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/shared/components/common/PageHeader';
import { SettingsTabs } from '@/shared/components/settings/SettingsTabs';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { getSecurityPolicyApi, saveSecurityPolicyApi, SecurityPolicyPayload } from '@/shared/services/settings';
import { getSettingsBasePath } from '@/shared/settings/navigation';

const defaultState: SecurityPolicyPayload = {
  id: undefined,
  require_2fa_all: false,
  require_2fa_admin: true,
  allowed_2fa_methods: ['totp', 'email'],
  allowed_ips: [],
  max_concurrent_sessions: null,
};

export default function SecurityPolicyPage() {
  const t = useTranslations('Settings.SecurityPolicy');
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

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const payload: SecurityPolicyPayload = {
      ...form,
      allowed_ips: (form.allowed_ips ?? []).filter((ip) => typeof ip === 'string' && ip.trim().length > 0),
      allowed_2fa_methods: form.allowed_2fa_methods ?? ['totp', 'email'],
    };

    try {
      setSaving(true);
      const saved = await saveSecurityPolicyApi(payload);
      setForm((current) => ({ ...current, id: saved.id }));
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

      <form onSubmit={onSubmit} className="mt-8 space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="allowed_ips" className="block text-sm font-medium text-slate-700">
              {t('fields.allowedIps.label')}
            </label>
            <textarea
              id="allowed_ips"
              value={(form.allowed_ips ?? []).join('\n')}
              onChange={(event) =>
                setForm((current) => ({ ...current, allowed_ips: event.target.value.split('\n').map((value) => value.trim()) }))
              }
              rows={8}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              placeholder="192.168.0.1\n10.0.0.0/24"
            />
            <p className="text-xs text-slate-500">{t('fields.allowedIps.help')}</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="max_sessions" className="block text-sm font-medium text-slate-700">
                {t('fields.maxSessions.label')}
              </label>
              <input
                id="max_sessions"
                type="number"
                min={1}
                value={form.max_concurrent_sessions ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    max_concurrent_sessions: event.target.value === '' ? null : Number(event.target.value),
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                placeholder="5"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              {t('fields.policyNote')}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-violet-300"
          >
            {saving ? t('actions.saving') : t('actions.save')}
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">{t('states.loading')}</p>}
      </form>
    </div>
  );
}
