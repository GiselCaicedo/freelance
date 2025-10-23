'use client';

import type { BackendUser } from '@shared/services/conexion';
import type {
  UserNotificationSettingPayload,
  UserSettingPayload,
} from '@shared/services/settings';
import { useEnterprise } from '@core/libs/acl/EnterpriseProvider';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import PageHeader from '@shared/components/common/PageHeader';
import { getUsersApi } from '@shared/services/conexion';
import {
  getUserNotificationSettingsApi,
  getUserSettingsApi,
  saveUserNotificationSettingsApi,
  saveUserSettingsApi,
} from '@shared/services/settings';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

type PreferencesForm = {
  locale: string;
  timezone: string;
  theme: string;
  date_format: string;
  time_format: string;
  notify_email: boolean;
  notify_push: boolean;
  notify_whatsapp: boolean;
  reminder_default_minutes: string;
  digest_daily_hour: string;
  session_timeout_minutes: string;
};

type NotificationsForm = {
  channel_email: boolean;
  channel_push: boolean;
  channel_whatsapp: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  digest_daily_hour: string;
};

const defaultPreferences: PreferencesForm = {
  locale: '',
  timezone: '',
  theme: 'system',
  date_format: 'DD/MM/YYYY',
  time_format: 'HH:mm',
  notify_email: true,
  notify_push: true,
  notify_whatsapp: false,
  reminder_default_minutes: '',
  digest_daily_hour: '',
  session_timeout_minutes: '',
};

const defaultNotifications: NotificationsForm = {
  channel_email: true,
  channel_push: true,
  channel_whatsapp: false,
  quiet_hours_start: '',
  quiet_hours_end: '',
  digest_daily_hour: '',
};

export default function ProfileSettingsPage() {
  const t = useTranslations('Settings.Profile');
  const { notify } = useAlerts();
  const { empresaId } = useEnterprise();

  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [preferences, setPreferences] = useState<PreferencesForm>(defaultPreferences);
  const [notifications, setNotifications] = useState<NotificationsForm>(defaultNotifications);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => selectedUser.trim().length > 0, [selectedUser]);

  useEffect(() => {
    if (!empresaId) {
      setUsers([]);
      setSelectedUser('');
      return;
    }
    const load = async () => {
      try {
        setLoadingUsers(true);
        const data = await getUsersApi(empresaId);
        setUsers(data);
        if (data.length > 0) {
          setSelectedUser(current => current || data[0].id);
        }
      } catch (err: any) {
        notify({ type: 'error', title: t('alerts.loadUsersTitle'), description: err?.message ?? t('alerts.loadUsersDescription') });
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, [empresaId, notify, t]);

  useEffect(() => {
    const loadSettings = async (userId: string) => {
      try {
        setLoadingSettings(true);
        const [prefs, notifs] = await Promise.all([getUserSettingsApi(userId), getUserNotificationSettingsApi(userId)]);
        setPreferences({
          locale: prefs?.locale ?? '',
          timezone: prefs?.timezone ?? '',
          theme: prefs?.theme ?? 'system',
          date_format: prefs?.date_format ?? 'DD/MM/YYYY',
          time_format: prefs?.time_format ?? 'HH:mm',
          notify_email: prefs?.notify_email !== false,
          notify_push: prefs?.notify_push !== false,
          notify_whatsapp: prefs?.notify_whatsapp === true,
          reminder_default_minutes: prefs?.reminder_default_minutes ? String(prefs.reminder_default_minutes) : '',
          digest_daily_hour: prefs?.digest_daily_hour ? String(prefs.digest_daily_hour) : '',
          session_timeout_minutes: prefs?.session_timeout_minutes ? String(prefs.session_timeout_minutes) : '',
        });
        setNotifications({
          channel_email: notifs?.channel_email !== false,
          channel_push: notifs?.channel_push !== false,
          channel_whatsapp: notifs?.channel_whatsapp === true,
          quiet_hours_start: notifs?.quiet_hours_start ? String(notifs.quiet_hours_start) : '',
          quiet_hours_end: notifs?.quiet_hours_end ? String(notifs.quiet_hours_end) : '',
          digest_daily_hour: notifs?.digest_daily_hour ? String(notifs.digest_daily_hour) : '',
        });
      } catch (err: any) {
        notify({ type: 'error', title: t('alerts.loadSettingsTitle'), description: err?.message ?? t('alerts.loadSettingsDescription') });
      } finally {
        setLoadingSettings(false);
      }
    };

    if (selectedUser) {
      loadSettings(selectedUser);
    }
  }, [selectedUser, notify, t]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      notify({ type: 'warning', title: t('alerts.invalidTitle'), description: t('alerts.invalidDescription') });
      return;
    }

    const preferencePayload: UserSettingPayload = {
      locale: preferences.locale,
      timezone: preferences.timezone,
      theme: preferences.theme,
      date_format: preferences.date_format,
      time_format: preferences.time_format,
      notify_email: preferences.notify_email,
      notify_push: preferences.notify_push,
      notify_whatsapp: preferences.notify_whatsapp,
      reminder_default_minutes:
        preferences.reminder_default_minutes.trim().length > 0 ? Number(preferences.reminder_default_minutes) : null,
      digest_daily_hour: preferences.digest_daily_hour.trim().length > 0 ? Number(preferences.digest_daily_hour) : null,
      session_timeout_minutes:
        preferences.session_timeout_minutes.trim().length > 0 ? Number(preferences.session_timeout_minutes) : null,
    };

    const notificationsPayload: UserNotificationSettingPayload = {
      channel_email: notifications.channel_email,
      channel_push: notifications.channel_push,
      channel_whatsapp: notifications.channel_whatsapp,
      quiet_hours_start: notifications.quiet_hours_start.trim().length > 0 ? Number(notifications.quiet_hours_start) : null,
      quiet_hours_end: notifications.quiet_hours_end.trim().length > 0 ? Number(notifications.quiet_hours_end) : null,
      digest_daily_hour: notifications.digest_daily_hour.trim().length > 0 ? Number(notifications.digest_daily_hour) : null,
    };

    try {
      setSaving(true);
      await Promise.all([
        saveUserSettingsApi(selectedUser, preferencePayload),
        saveUserNotificationSettingsApi(selectedUser, notificationsPayload),
      ]);
      notify({ type: 'success', title: t('alerts.successTitle'), description: t('alerts.successDescription') });
    } catch (err: any) {
      notify({ type: 'error', title: t('alerts.saveErrorTitle'), description: err?.message ?? t('alerts.saveErrorDescription') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbs={[{ label: t('breadcrumbs.section'), href: '/settings' }, { label: t('breadcrumbs.current') }]}
      />

      <div className="mx-auto mt-6 max-w-3xl">
        <form onSubmit={onSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <label htmlFor="user_select" className="block text-sm font-medium text-slate-700">
              {t('fields.user.label')}
            </label>
            <select
              id="user_select"
              value={selectedUser}
              onChange={event => setSelectedUser(event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
              disabled={loadingUsers || users.length === 0}
            >
              <option value="" disabled>
                {loadingUsers ? t('fields.user.loading') : t('fields.user.placeholder')}
              </option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || user.user || user.usuario || user.id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="locale" className="block text-sm font-medium text-slate-700">
                {t('fields.locale.label')}
              </label>
              <input
                id="locale"
                type="text"
                value={preferences.locale}
                onChange={event => setPreferences(current => ({ ...current, locale: event.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
                placeholder="es-CO"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="timezone" className="block text-sm font-medium text-slate-700">
                {t('fields.timezone.label')}
              </label>
              <input
                id="timezone"
                type="text"
                value={preferences.timezone}
                onChange={event => setPreferences(current => ({ ...current, timezone: event.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
                placeholder="America/Bogota"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="theme" className="block text-sm font-medium text-slate-700">
                {t('fields.theme.label')}
              </label>
              <select
                id="theme"
                value={preferences.theme}
                onChange={event => setPreferences(current => ({ ...current, theme: event.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
              >
                <option value="system">{t('fields.theme.options.system')}</option>
                <option value="light">{t('fields.theme.options.light')}</option>
                <option value="dark">{t('fields.theme.options.dark')}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="date_format" className="block text-sm font-medium text-slate-700">
                {t('fields.dateFormat.label')}
              </label>
              <input
                id="date_format"
                type="text"
                value={preferences.date_format}
                onChange={event => setPreferences(current => ({ ...current, date_format: event.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="time_format" className="block text-sm font-medium text-slate-700">
                {t('fields.timeFormat.label')}
              </label>
              <input
                id="time_format"
                type="text"
                value={preferences.time_format}
                onChange={event => setPreferences(current => ({ ...current, time_format: event.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="reminder" className="block text-sm font-medium text-slate-700">
                {t('fields.reminder.label')}
              </label>
              <input
                id="reminder"
                type="number"
                value={preferences.reminder_default_minutes}
                onChange={event => setPreferences(current => ({ ...current, reminder_default_minutes: event.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
                placeholder="30"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="digest" className="block text-sm font-medium text-slate-700">
                {t('fields.digest.label')}
              </label>
              <input
                id="digest"
                type="number"
                min={0}
                max={23}
                value={preferences.digest_daily_hour}
                onChange={event => setPreferences(current => ({ ...current, digest_daily_hour: event.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
                placeholder="8"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="session_timeout" className="block text-sm font-medium text-slate-700">
                {t('fields.sessionTimeout.label')}
              </label>
              <input
                id="session_timeout"
                type="number"
                value={preferences.session_timeout_minutes}
                onChange={event => setPreferences(current => ({ ...current, session_timeout_minutes: event.target.value }))}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
                placeholder="30"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                checked={preferences.notify_email}
                onChange={event => setPreferences(current => ({ ...current, notify_email: event.target.checked }))}
              />
              {t('fields.notify.email')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                checked={preferences.notify_push}
                onChange={event => setPreferences(current => ({ ...current, notify_push: event.target.checked }))}
              />
              {t('fields.notify.push')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                checked={preferences.notify_whatsapp}
                onChange={event => setPreferences(current => ({ ...current, notify_whatsapp: event.target.checked }))}
              />
              {t('fields.notify.whatsapp')}
            </label>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-700">{t('notifications.title')}</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="quiet_start" className="block text-sm font-medium text-slate-700">
                  {t('notifications.quietStart')}
                </label>
                <input
                  id="quiet_start"
                  type="number"
                  min={0}
                  max={23}
                  value={notifications.quiet_hours_start}
                  onChange={event => setNotifications(current => ({ ...current, quiet_hours_start: event.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
                  placeholder="22"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="quiet_end" className="block text-sm font-medium text-slate-700">
                  {t('notifications.quietEnd')}
                </label>
                <input
                  id="quiet_end"
                  type="number"
                  min={0}
                  max={23}
                  value={notifications.quiet_hours_end}
                  onChange={event => setNotifications(current => ({ ...current, quiet_hours_end: event.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
                  placeholder="7"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="digest_notifications" className="block text-sm font-medium text-slate-700">
                  {t('notifications.digestHour')}
                </label>
                <input
                  id="digest_notifications"
                  type="number"
                  min={0}
                  max={23}
                  value={notifications.digest_daily_hour}
                  onChange={event => setNotifications(current => ({ ...current, digest_daily_hour: event.target.value }))}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-200 focus:outline-none"
                  placeholder="9"
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{t('notifications.channelsTitle')}</span>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      checked={notifications.channel_email}
                      onChange={event =>
                        setNotifications(current => ({ ...current, channel_email: event.target.checked }))}
                    />
                    {t('fields.notify.email')}
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      checked={notifications.channel_push}
                      onChange={event =>
                        setNotifications(current => ({ ...current, channel_push: event.target.checked }))}
                    />
                    {t('fields.notify.push')}
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      checked={notifications.channel_whatsapp}
                      onChange={event =>
                        setNotifications(current => ({ ...current, channel_whatsapp: event.target.checked }))}
                    />
                    {t('fields.notify.whatsapp')}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-teal-300"
            >
              {saving ? t('actions.saving') : t('actions.save')}
            </button>
          </div>

          {loadingSettings && <p className="text-sm text-slate-500">{t('states.loading')}</p>}
        </form>
      </div>
    </div>
  );
}
