'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import PageHeader from '@/shared/components/common/PageHeader';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import { getCompanyProfileApi, saveCompanyProfileApi, CompanyProfile } from '@/shared/services/settings';

export default function CompanySettingsPage() {
  const t = useTranslations('Settings.Company');
  const { notify } = useAlerts();
  const { empresaId, empresaName } = useEnterprise();

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => name.trim().length >= 3, [name]);

  useEffect(() => {
    if (!empresaId) {
      setProfile(null);
      setName(empresaName ?? '');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await getCompanyProfileApi(empresaId);
        if (data) {
          setProfile(data);
          setName(data.name ?? empresaName ?? '');
          setStatus(data.status !== false);
        } else {
          setProfile(null);
          setName(empresaName ?? '');
          setStatus(true);
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
  }, [empresaId, empresaName, notify, t]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!empresaId) {
      notify({ type: 'warning', title: t('alerts.noCompanyTitle'), description: t('alerts.noCompanyDescription') });
      return;
    }
    if (!canSubmit) {
      notify({ type: 'warning', title: t('alerts.invalidTitle'), description: t('alerts.invalidDescription') });
      return;
    }

    try {
      setSaving(true);
      const data = await saveCompanyProfileApi(empresaId, { name, status });
      setProfile(data);
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

      <div className="mx-auto mt-6 max-w-2xl">
        {!empresaId && (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
            {t('states.noCompany')}
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={onSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <label htmlFor="company_name" className="block text-sm font-medium text-slate-700">
              {t('fields.name.label')}
            </label>
            <input
              id="company_name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder={t('fields.name.placeholder')}
              disabled={!empresaId}
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{t('fields.status.label')}</p>
              <p className="text-xs text-slate-500">{t('fields.status.help')}</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={status}
                onChange={(event) => setStatus(event.target.checked)}
                disabled={!empresaId}
              />
              {status ? t('fields.status.active') : t('fields.status.inactive')}
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={!empresaId || !canSubmit || saving}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {saving ? t('actions.saving') : t('actions.save')}
            </button>
          </div>

          {loading && <p className="text-sm text-slate-500">{t('states.loading')}</p>}
          {profile && profile.updated && (
            <p className="text-xs text-slate-500">{t('states.updatedAt', { value: profile.updated })}</p>
          )}
        </form>
      </div>
    </div>
  );
}
