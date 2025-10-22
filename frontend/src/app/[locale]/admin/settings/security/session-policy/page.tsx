'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/shared/components/common/PageHeader';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import { getSessionPolicyApi, saveSessionPolicyApi, SessionPolicyPayload } from '@/shared/services/settings';

const defaultState: SessionPolicyPayload = {
  id: undefined,
  idle_timeout_minutes: 15,
  absolute_session_minutes: 1440,
  remember_me_days: 7,
  lock_after_failed_attempts: 5,
  lock_window_minutes: 15,
  lock_duration_minutes: 30,
  is_active: true,
  status: true,
};

export default function SessionPolicyPage() {
  const t = useTranslations('Settings.SessionPolicy');
  const { notify } = useAlerts();
  const { empresaId } = useEnterprise();

  const [form, setForm] = useState<SessionPolicyPayload>(defaultState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => true, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getSessionPolicyApi(empresaId ?? null);
        if (data) {
          setForm({
            id: data.id,
            client_id: data.client_id,
            idle_timeout_minutes: data.idle_timeout_minutes ?? 15,
            absolute_session_minutes: data.absolute_session_minutes ?? 1440,
            remember_me_days: data.remember_me_days ?? 7,
            lock_after_failed_attempts: data.lock_after_failed_attempts ?? 5,
            lock_window_minutes: data.lock_window_minutes ?? 15,
            lock_duration_minutes: data.lock_duration_minutes ?? 30,
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
    if (!canSubmit) return;

    const payload: SessionPolicyPayload = {
      ...form,
      client_id: empresaId ?? null,
    };

    try {
      setSaving(true);
      const saved = await saveSessionPolicyApi(payload);
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
              <label htmlFor="idle_timeout" className="block text-sm font-medium text-slate-700">
                {t('fields.idle.label')}
              </label>
              <input
                id="idle_timeout"
                type="number"
                value={form.idle_timeout_minutes ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, idle_timeout_minutes: Number(event.target.value) }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                placeholder="15"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="absolute_session" className="block text-sm font-medium text-slate-700">
                {t('fields.absolute.label')}
              </label>
              <input
                id="absolute_session"
                type="number"
                value={form.absolute_session_minutes ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, absolute_session_minutes: Number(event.target.value) }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                placeholder="1440"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="remember_me" className="block text-sm font-medium text-slate-700">
                {t('fields.remember.label')}
              </label>
              <input
                id="remember_me"
                type="number"
                value={form.remember_me_days ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, remember_me_days: Number(event.target.value) }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                placeholder="7"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="lock_attempts" className="block text-sm font-medium text-slate-700">
                {t('fields.lockAttempts.label')}
              </label>
              <input
                id="lock_attempts"
                type="number"
                value={form.lock_after_failed_attempts ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, lock_after_failed_attempts: Number(event.target.value) }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                placeholder="5"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="lock_window" className="block text-sm font-medium text-slate-700">
                {t('fields.lockWindow.label')}
              </label>
              <input
                id="lock_window"
                type="number"
                value={form.lock_window_minutes ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, lock_window_minutes: Number(event.target.value) }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                placeholder="15"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="lock_duration" className="block text-sm font-medium text-slate-700">
                {t('fields.lockDuration.label')}
              </label>
              <input
                id="lock_duration"
                type="number"
                value={form.lock_duration_minutes ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, lock_duration_minutes: Number(event.target.value) }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                placeholder="30"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                checked={form.is_active !== false}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              {t('fields.active.label')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
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
              className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-cyan-300"
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
