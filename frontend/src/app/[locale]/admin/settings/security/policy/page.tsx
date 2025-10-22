'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/shared/components/common/PageHeader';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import { getSecurityPolicyApi, saveSecurityPolicyApi, SecurityPolicyPayload } from '@/shared/services/settings';

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
  is_active: true,
  status: true,
};

export default function SecurityPolicyPage() {
  const t = useTranslations('Settings.SecurityPolicy');
  const { notify } = useAlerts();
  const { empresaId } = useEnterprise();

  const [form, setForm] = useState<SecurityPolicyPayload>(defaultState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => true, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getSecurityPolicyApi(empresaId ?? null);
        if (data) {
          setForm({
            id: data.id,
            client_id: data.client_id,
            require_2fa_all: data.require_2fa_all ?? false,
            require_2fa_admin: data.require_2fa_admin ?? true,
            allowed_2fa_methods: Array.isArray(data.allowed_2fa_methods) ? data.allowed_2fa_methods : ['totp', 'email'],
            allowed_ips: Array.isArray(data.allowed_ips) ? data.allowed_ips : [],
            max_concurrent_sessions: data.max_concurrent_sessions ?? null,
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

  const toggleMethod = (method: string) => {
    setForm((current) => {
      const currentMethods = new Set(current.allowed_2fa_methods ?? []);
      if (currentMethods.has(method)) currentMethods.delete(method);
      else currentMethods.add(method);
      return { ...current, allowed_2fa_methods: Array.from(currentMethods) };
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const payload: SecurityPolicyPayload = {
      ...form,
      client_id: empresaId ?? null,
      allowed_ips: (form.allowed_ips ?? []).filter((ip) => typeof ip === 'string' && ip.trim().length > 0),
      max_concurrent_sessions:
        typeof form.max_concurrent_sessions === 'number'
          ? form.max_concurrent_sessions
          : form.max_concurrent_sessions === null || form.max_concurrent_sessions === undefined
          ? null
          : Number(form.max_concurrent_sessions),
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
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                checked={form.require_2fa_all === true}
                onChange={(event) => setForm((current) => ({ ...current, require_2fa_all: event.target.checked }))}
              />
              {t('fields.requireAll')}
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                checked={form.require_2fa_admin !== false}
                onChange={(event) => setForm((current) => ({ ...current, require_2fa_admin: event.target.checked }))}
              />
              {t('fields.requireAdmin')}
            </label>

            <div className="space-y-1 md:col-span-2">
              <p className="text-sm font-medium text-slate-700">{t('fields.methods.label')}</p>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_METHODS.map((method) => (
                  <label key={method.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      checked={(form.allowed_2fa_methods ?? []).includes(method.id)}
                      onChange={() => toggleMethod(method.id)}
                    />
                    {t(`fields.methods.options.${method.labelKey}`)}
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500">{t('fields.methods.help')}</p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="allowed_ips" className="block text-sm font-medium text-slate-700">
                {t('fields.allowedIps.label')}
              </label>
              <textarea
                id="allowed_ips"
                value={(form.allowed_ips ?? []).join('\n')}
                onChange={(event) =>
                  setForm((current) => ({ ...current, allowed_ips: event.target.value.split('\n').map((value) => value.trim()) }))
                }
                rows={4}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                placeholder="192.168.0.1\n10.0.0.0/24"
              />
              <p className="text-xs text-slate-500">{t('fields.allowedIps.help')}</p>
            </div>

            <div className="space-y-1">
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
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                placeholder="5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                checked={form.is_active !== false}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              {t('fields.active.label')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                checked={form.status !== false}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.checked }))}
              />
              {t('fields.status.label')}
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-violet-300"
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
