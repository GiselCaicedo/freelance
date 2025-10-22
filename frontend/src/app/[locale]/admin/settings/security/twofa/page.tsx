'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/shared/components/common/PageHeader';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import { BackendUser, getUsersApi } from '@/shared/services/conexion';
import { getUserTwofaApi, saveUserTwofaApi, UserTwofaPayload } from '@/shared/services/settings';

const METHOD_OPTIONS = [
  { id: 'totp', labelKey: 'totp' },
  { id: 'email', labelKey: 'email' },
  { id: 'sms', labelKey: 'sms' },
  { id: 'none', labelKey: 'none' },
];

export default function TwofaSettingsPage() {
  const t = useTranslations('Settings.Twofa');
  const { notify } = useAlerts();
  const { empresaId } = useEnterprise();

  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [method, setMethod] = useState('totp');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [loadingTwofa, setLoadingTwofa] = useState(false);
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
          setSelectedUser((current) => current || data[0].id);
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
    const loadTwofa = async (userId: string) => {
      try {
        setLoadingTwofa(true);
        const data = await getUserTwofaApi(userId);
        setMethod(data?.type ?? 'totp');
        setSecret('');
        setBackupCodes(data?.backup_codes ? JSON.stringify(data.backup_codes, null, 2) : '');
        setEnabled(data?.enabled === true);
      } catch (err: any) {
        notify({ type: 'error', title: t('alerts.loadErrorTitle'), description: err?.message ?? t('alerts.loadErrorDescription') });
      } finally {
        setLoadingTwofa(false);
      }
    };

    if (selectedUser) {
      loadTwofa(selectedUser);
    }
  }, [selectedUser, notify, t]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      notify({ type: 'warning', title: t('alerts.invalidTitle'), description: t('alerts.invalidDescription') });
      return;
    }

    let parsedBackup: any = undefined;
    if (backupCodes.trim().length > 0) {
      try {
        parsedBackup = JSON.parse(backupCodes);
      } catch (error) {
        notify({ type: 'error', title: t('alerts.invalidTitle'), description: t('alerts.invalidBackup') });
        return;
      }
    }

    const payload: UserTwofaPayload = {
      type: method,
      secret_encrypted: secret.trim().length > 0 ? secret : undefined,
      backup_codes: parsedBackup,
      enabled,
    };

    try {
      setSaving(true);
      await saveUserTwofaApi(selectedUser, payload);
      notify({ type: 'success', title: t('alerts.successTitle'), description: t('alerts.successDescription') });
      setSecret('');
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

      <div className="mx-auto mt-6 max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <label htmlFor="user" className="block text-sm font-medium text-slate-700">
              {t('fields.user.label')}
            </label>
            <select
              id="user"
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={loadingUsers || users.length === 0}
            >
              <option value="" disabled>
                {loadingUsers ? t('fields.user.loading') : t('fields.user.placeholder')}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.user || user.usuario || user.id}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="method" className="block text-sm font-medium text-slate-700">
              {t('fields.method.label')}
            </label>
            <select
              id="method"
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              {METHOD_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {t(`fields.method.options.${option.labelKey}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="secret" className="block text-sm font-medium text-slate-700">
              {t('fields.secret.label')}
            </label>
            <input
              id="secret"
              type="text"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder={t('fields.secret.placeholder')}
            />
            <p className="text-xs text-slate-500">{t('fields.secret.help')}</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="backup_codes" className="block text-sm font-medium text-slate-700">
              {t('fields.backupCodes.label')}
            </label>
            <textarea
              id="backup_codes"
              rows={4}
              value={backupCodes}
              onChange={(event) => setBackupCodes(event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <p className="text-xs text-slate-500">{t('fields.backupCodes.help')}</p>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            {t('fields.enabled.label')}
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-purple-300"
            >
              {saving ? t('actions.saving') : t('actions.save')}
            </button>
          </div>

          {loadingTwofa && <p className="text-sm text-slate-500">{t('states.loading')}</p>}
        </form>
      </div>
    </div>
  );
}
