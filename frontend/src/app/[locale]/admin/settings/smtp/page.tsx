'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import PageHeader from '@/shared/components/common/PageHeader';
import { SettingsTabs } from '@/shared/components/settings/SettingsTabs';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { getSmtpConfigApi, saveSmtpConfigApi, SmtpConfigPayload } from '@/shared/services/settings';
import { getSettingsBasePath } from '@/shared/settings/navigation';

const defaultState: SmtpConfigPayload = {
  id: undefined,
  host: '',
  port: 587,
  secure: false,
  username: '',
  password_encrypted: '',
  from_name: '',
  from_email: '',
  reply_to_email: '',
  rate_limit_per_minute: null,
};

export default function SmtpSettingsPage() {
  const t = useTranslations('Settings.Smtp');
  const { notify } = useAlerts();
  const pathname = usePathname();
  const settingsBase = getSettingsBasePath(pathname ?? undefined);

  const [form, setForm] = useState<SmtpConfigPayload>(defaultState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => form.host?.trim().length && form.from_email?.trim().length,
    [form.host, form.from_email],
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getSmtpConfigApi();
        if (data) {
          setForm({
            id: data.id,
            host: data.host ?? '',
            port: data.port ?? 587,
            secure: data.secure ?? false,
            username: data.username ?? '',
            password_encrypted: '',
            from_name: data.from_name ?? '',
            from_email: data.from_email ?? '',
            reply_to_email: data.reply_to_email ?? '',
            rate_limit_per_minute: data.rate_limit_per_minute ?? null,
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

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      notify({ type: 'warning', title: t('alerts.invalidTitle'), description: t('alerts.invalidDescription') });
      return;
    }

    const payload: SmtpConfigPayload = {
      ...form,
      port: typeof form.port === 'number' ? form.port : Number(form.port),
      rate_limit_per_minute:
        typeof form.rate_limit_per_minute === 'number' || form.rate_limit_per_minute === null
          ? form.rate_limit_per_minute
          : Number(form.rate_limit_per_minute),
    };

    try {
      setSaving(true);
      const saved = await saveSmtpConfigApi(payload);
      setForm((current) => ({
        ...current,
        id: saved.id,
        password_encrypted: '',
      }));
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
            <label htmlFor="host" className="block text-sm font-medium text-slate-700">
              {t('fields.host.label')}
            </label>
            <input
              id="host"
              type="text"
              value={form.host ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, host: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder={t('fields.host.placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="port" className="block text-sm font-medium text-slate-700">
              {t('fields.port.label')}
            </label>
            <input
              id="port"
              type="number"
              value={form.port ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, port: Number(event.target.value) }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="587"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
              {t('fields.username.label')}
            </label>
            <input
              id="username"
              type="text"
              value={form.username ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder={t('fields.username.placeholder')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              {t('fields.password.label')}
            </label>
            <input
              id="password"
              type="password"
              value={form.password_encrypted ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, password_encrypted: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder={t('fields.password.placeholder')}
              autoComplete="new-password"
            />
            <p className="text-xs text-slate-500">{t('fields.password.help')}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="from_name" className="block text-sm font-medium text-slate-700">
              {t('fields.fromName.label')}
            </label>
            <input
              id="from_name"
              type="text"
              value={form.from_name ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, from_name: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder={t('fields.fromName.placeholder')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="from_email" className="block text-sm font-medium text-slate-700">
              {t('fields.fromEmail.label')}
            </label>
            <input
              id="from_email"
              type="email"
              value={form.from_email ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, from_email: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="notificaciones@empresa.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reply_to_email" className="block text-sm font-medium text-slate-700">
              {t('fields.replyTo.label')}
            </label>
            <input
              id="reply_to_email"
              type="email"
              value={form.reply_to_email ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, reply_to_email: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="respuestas@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="rate_limit" className="block text-sm font-medium text-slate-700">
              {t('fields.rateLimit.label')}
            </label>
            <input
              id="rate_limit"
              type="number"
              value={form.rate_limit_per_minute ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rate_limit_per_minute: event.target.value === '' ? null : Number(event.target.value),
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="60"
            />
            <p className="text-xs text-slate-500">{t('fields.rateLimit.help')}</p>
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={form.secure ?? false}
                onChange={(event) => setForm((current) => ({ ...current, secure: event.target.checked }))}
              />
              {t('fields.secure.label')}
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-slate-500">
          {loading && <span>{t('states.loading')}</span>}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {saving ? t('actions.saving') : t('actions.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
