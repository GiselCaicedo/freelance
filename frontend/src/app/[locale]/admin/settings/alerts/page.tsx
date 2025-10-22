'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trash2, Edit, Plus } from 'lucide-react';
import AgTable from '@/shared/components/datagrid/AgTable';
import type { ColDef } from 'ag-grid-community';
import PageHeader from '@/shared/components/common/PageHeader';
import { SettingsTabs } from '@/shared/components/settings/SettingsTabs';
import { useAlerts } from '@/shared/components/common/AlertsProvider';
import {
  listAlertRulesApi,
  saveAlertRuleApi,
  deleteAlertRuleApi,
  AlertRule,
  AlertRulePayload,
} from '@/shared/services/settings';
import { getSettingsBasePath } from '@/shared/settings/navigation';

const CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'push', label: 'Push' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

type FormState = {
  id?: string;
  name: string;
  type: string;
  channels: Record<string, boolean>;
  remind: string;
  conditions: string;
  is_active: boolean;
};

const defaultState: FormState = {
  id: undefined,
  name: '',
  type: '',
  channels: { email: true, push: false, whatsapp: false },
  remind: '',
  conditions: '{"threshold":0}',
  is_active: true,
};

export default function AlertsSettingsPage() {
  const t = useTranslations('Settings.Alerts');
  const { notify } = useAlerts();
  const pathname = usePathname();
  const settingsBase = getSettingsBasePath(pathname ?? undefined);

  const [rules, setRules] = useState<AlertRule[]>([]);
  const [form, setForm] = useState<FormState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => form.name.trim().length > 2 && form.type.trim().length > 2, [form.name, form.type]);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await listAlertRulesApi();
      setRules(data);
      setError(null);
    } catch (err: any) {
      const message = err?.message ?? t('alerts.loadErrorDescription');
      setError(message);
      notify({ type: 'error', title: t('alerts.loadErrorTitle'), description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(defaultState);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      notify({ type: 'warning', title: t('alerts.invalidTitle'), description: t('alerts.invalidDescription') });
      return;
    }

    const channels = CHANNELS.filter((channel) => form.channels[channel.id]).map((channel) => channel.id);
    if (channels.length === 0) {
      notify({ type: 'warning', title: t('alerts.invalidTitle'), description: t('alerts.channelWarning') });
      return;
    }

    const remind = form.remind
      .split(',')
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value));

    const payload: AlertRulePayload = {
      id: form.id,
      name: form.name,
      type: form.type,
      channels,
      remind_before_minutes: remind,
      conditions: form.conditions,
      is_active: form.is_active,
    };

    try {
      setSaving(true);
      const saved = await saveAlertRuleApi(payload);
      setRules((current) => {
        const exists = current.some((rule) => rule.id === saved.id);
        if (exists) return current.map((rule) => (rule.id === saved.id ? saved : rule));
        return [...current, saved];
      });
      resetForm();
      notify({ type: 'success', title: t('alerts.successTitle'), description: t('alerts.successDescription') });
    } catch (err: any) {
      notify({ type: 'error', title: t('alerts.saveErrorTitle'), description: err?.message ?? t('alerts.saveErrorDescription') });
    } finally {
      setSaving(false);
    }
  };

  const editRule = (rule: AlertRule) => {
    const channels: Record<string, boolean> = {
      email: rule.channels.includes('email'),
      push: rule.channels.includes('push'),
      whatsapp: rule.channels.includes('whatsapp'),
    };
    setForm({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      channels,
      remind: rule.remind_before_minutes?.join(', ') ?? '',
      conditions: JSON.stringify(rule.conditions ?? {}, null, 2),
      is_active: rule.is_active !== false,
    });
  };

  const deleteRule = async (rule: AlertRule) => {
    const confirmed = window.confirm(t('confirm.delete', { name: rule.name }));
    if (!confirmed) return;

    const previous = rules;
    setRules((current) => current.filter((item) => item.id !== rule.id));
    try {
      await deleteAlertRuleApi(rule.id);
      notify({ type: 'success', title: t('alerts.deleteSuccessTitle'), description: t('alerts.deleteSuccessDescription') });
    } catch (err: any) {
      setRules(previous);
      notify({ type: 'error', title: t('alerts.deleteErrorTitle'), description: err?.message ?? t('alerts.deleteErrorDescription') });
    }
  };

  const columns = useMemo<ColDef<AlertRule>[]>(() => [
    {
      headerName: t('table.columns.name'),
      field: 'name',
      flex: 1,
      minWidth: 180,
    },
    {
      headerName: t('table.columns.type'),
      field: 'type',
      flex: 1,
      minWidth: 140,
    },
    {
      headerName: t('table.columns.channels'),
      valueGetter: (p) => p.data?.channels?.join(', ') ?? '',
      flex: 1,
      minWidth: 160,
    },
    {
      headerName: t('table.columns.remind'),
      valueGetter: (p) =>
        p.data?.remind_before_minutes?.length
          ? p.data.remind_before_minutes.map((v: number) => `${v} min`).join(', ')
          : t('table.remind.none'),
      flex: 1,
      minWidth: 160,
    },
    {
      headerName: t('table.columns.status'),
      cellRenderer: (p: any) => {
        const isActive = Boolean(p.data?.is_active);
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            {isActive ? t('table.status.active') : t('table.status.inactive')}
          </span>
        );
      },
      minWidth: 140,
      sortable: true,
      filter: true,
    },
    {
      headerName: t('table.columns.actions'),
      sortable: false,
      filter: false,
      minWidth: 170,
      cellStyle: { textAlign: 'right' },
      cellRenderer: (p: any) => (
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={() => editRule(p.data as AlertRule)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <Edit className="mr-1 inline h-4 w-4" />
            {t('table.actions.edit')}
          </button>
          <button
            type="button"
            onClick={() => deleteRule(p.data as AlertRule)}
            className="text-xs font-medium text-red-600 hover:text-red-700"
          >
            <Trash2 className="mr-1 inline h-4 w-4" />
            {t('table.actions.delete')}
          </button>
        </div>
      ),
    },
  ], [t, editRule, deleteRule]);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-12">
      <PageHeader
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbs={[{ label: t('breadcrumbs.section'), href: settingsBase }, { label: t('breadcrumbs.current') }]}
      />

      <SettingsTabs className="mt-8" />

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">{t('table.title')}</h2>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <Plus className="h-4 w-4" />
              {t('table.new')}
            </button>
          </div>
          <AgTable<AlertRule>
            rows={rules}
            columns={columns}
            getRowId={(r) => r.id as string}
            height={520}
            className="ring-0 rounded-none border-t border-slate-100"
          />
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              {t('form.fields.name.label')}
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder={t('form.fields.name.placeholder')}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="type" className="block text-sm font-medium text-slate-700">
              {t('form.fields.type.label')}
            </label>
            <input
              id="type"
              type="text"
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder={t('form.fields.type.placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">{t('form.fields.channels.label')}</p>
            <div className="flex flex-col gap-2">
              {CHANNELS.map((channel) => (
                <label key={channel.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    checked={form.channels[channel.id]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        channels: { ...current.channels, [channel.id]: event.target.checked },
                      }))
                    }
                  />
                  {channel.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="remind" className="block text-sm font-medium text-slate-700">
              {t('form.fields.remind.label')}
            </label>
            <input
              id="remind"
              type="text"
              value={form.remind}
              onChange={(event) => setForm((current) => ({ ...current, remind: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder={t('form.fields.remind.placeholder')}
            />
            <p className="text-xs text-slate-500">{t('form.fields.remind.help')}</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="conditions" className="block text-sm font-medium text-slate-700">
              {t('form.fields.conditions.label')}
            </label>
            <textarea
              id="conditions"
              value={form.conditions}
              onChange={(event) => setForm((current) => ({ ...current, conditions: event.target.value }))}
              rows={6}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder={t('form.fields.conditions.placeholder')}
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              checked={form.is_active}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
            {t('form.fields.active.label')}
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {t('form.actions.reset')}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              {saving ? t('form.actions.saving') : form.id ? t('form.actions.update') : t('form.actions.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
