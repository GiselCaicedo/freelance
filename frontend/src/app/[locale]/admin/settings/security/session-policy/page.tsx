'use client';

import type { SessionPolicyPayload } from '@shared/services/settings';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import PageHeader from '@shared/components/common/PageHeader';
import { SettingsTabs } from '@shared/components/settings/SettingsTabs';
import { getSessionPolicyApi, saveSessionPolicyApi } from '@shared/services/settings';
import { getSettingsBasePath } from '@shared/settings/navigation';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type FormState = {
  id?: string;
  idle_timeout_minutes: string;
  absolute_session_minutes: string;
  remember_me_days: string;
  lock_after_failed_attempts: string;
  lock_window_minutes: string;
  lock_duration_minutes: string;
};

const defaultState: FormState = {
  id: undefined,
  idle_timeout_minutes: '15',
  absolute_session_minutes: '1440',
  remember_me_days: '7',
  lock_after_failed_attempts: '5',
  lock_window_minutes: '15',
  lock_duration_minutes: '30',
};

export default function SessionPolicyPage() {
  const t = useTranslations('Settings.SessionPolicy');
  const { notify } = useAlerts();
  const pathname = usePathname();
  const settingsBase = getSettingsBasePath(pathname ?? undefined);

  const [form, setForm] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => true, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getSessionPolicyApi();
        if (data) {
          setForm({
            id: data.id,
            idle_timeout_minutes: data.idle_timeout_minutes?.toString() ?? defaultState.idle_timeout_minutes,
            absolute_session_minutes: data.absolute_session_minutes?.toString() ?? defaultState.absolute_session_minutes,
            remember_me_days: data.remember_me_days?.toString() ?? defaultState.remember_me_days,
            lock_after_failed_attempts:
              data.lock_after_failed_attempts?.toString() ?? defaultState.lock_after_failed_attempts,
            lock_window_minutes: data.lock_window_minutes?.toString() ?? defaultState.lock_window_minutes,
            lock_duration_minutes: data.lock_duration_minutes?.toString() ?? defaultState.lock_duration_minutes,
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

  const parseNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const payload: SessionPolicyPayload = {
      id: form.id,
      idle_timeout_minutes: parseNumber(form.idle_timeout_minutes),
      absolute_session_minutes: parseNumber(form.absolute_session_minutes),
      remember_me_days: parseNumber(form.remember_me_days),
      lock_after_failed_attempts: parseNumber(form.lock_after_failed_attempts),
      lock_window_minutes: parseNumber(form.lock_window_minutes),
      lock_duration_minutes: parseNumber(form.lock_duration_minutes),
    };

    try {
      setSaving(true);
      const saved = await saveSessionPolicyApi(payload);
      setForm(current => ({ ...current, id: saved.id ?? current.id }));
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
            <label htmlFor="idle_timeout" className="block text-sm font-medium text-slate-700">
              {t('fields.idle.label')}
            </label>
            <input
              id="idle_timeout"
              type="number"
              value={form.idle_timeout_minutes}
              onChange={event => setForm(current => ({ ...current, idle_timeout_minutes: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              placeholder="15"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="absolute_session" className="block text-sm font-medium text-slate-700">
              {t('fields.absolute.label')}
            </label>
            <input
              id="absolute_session"
              type="number"
              value={form.absolute_session_minutes}
              onChange={event => setForm(current => ({ ...current, absolute_session_minutes: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              placeholder="1440"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="remember_me" className="block text-sm font-medium text-slate-700">
              {t('fields.remember.label')}
            </label>
            <input
              id="remember_me"
              type="number"
              value={form.remember_me_days}
              onChange={event => setForm(current => ({ ...current, remember_me_days: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              placeholder="7"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lock_attempts" className="block text-sm font-medium text-slate-700">
              {t('fields.lockAttempts.label')}
            </label>
            <input
              id="lock_attempts"
              type="number"
              value={form.lock_after_failed_attempts}
              onChange={event => setForm(current => ({ ...current, lock_after_failed_attempts: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lock_window" className="block text-sm font-medium text-slate-700">
              {t('fields.lockWindow.label')}
            </label>
            <input
              id="lock_window"
              type="number"
              value={form.lock_window_minutes}
              onChange={event => setForm(current => ({ ...current, lock_window_minutes: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              placeholder="15"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lock_duration" className="block text-sm font-medium text-slate-700">
              {t('fields.lockDuration.label')}
            </label>
            <input
              id="lock_duration"
              type="number"
              value={form.lock_duration_minutes}
              onChange={event => setForm(current => ({ ...current, lock_duration_minutes: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              placeholder="30"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {saving ? t('actions.saving') : t('actions.save')}
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">{t('states.loading')}</p>}
      </form>
    </div>
  );
}
