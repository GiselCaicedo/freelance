'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Combobox } from '@headlessui/react';
import { useTranslations } from 'next-intl';
import {
  getRolesApi,
  getClientsApi,
  registerUser,
  Role,
  Client,
} from '@/shared/services/conexion';
import { useAlerts } from '@/shared/components/common/AlertsProvider';

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
  defaultClientId?: string;
};

type FormData = {
  user: string;
  name: string;
  password: string;
  role_id: string;
  client_id: string;
};

export default function CreateUserForm({ onClose, onSuccess, defaultClientId }: Props) {
  const t = useTranslations('Users.CreateForm');
  const { notify } = useAlerts();
  const [form, setForm] = useState<FormData>({
    user: '',
    name: '',
    password: '',
    role_id: '',
    client_id: defaultClientId ?? '',
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [queryRole, setQueryRole] = useState('');
  const [queryClient, setQueryClient] = useState('');
  const [formKey, setFormKey] = useState(0);

  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingLists(true);
        const [rolesResponse, clientsResponse] = await Promise.all([getRolesApi(), getClientsApi()]);
        setRoles(rolesResponse);
        setClients(clientsResponse);
      } catch (e: any) {
        const message = e?.message || t('errors.loadLists');
        setError(message);
        notify({ type: 'error', title: t('alerts.loadError.title'), description: message });
      } finally {
        setLoadingLists(false);
      }
    })();
  }, [notify, t]);

  useEffect(() => {
    if (defaultClientId && !form.client_id) {
      setForm((current) => ({ ...current, client_id: defaultClientId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultClientId]);

  const filteredRoles =
    queryRole === '' ? roles : roles.filter((role) => role.name.toLowerCase().includes(queryRole.toLowerCase()));

  const filteredClients =
    queryClient === '' ? clients : clients.filter((item) => item.name.toLowerCase().includes(queryClient.toLowerCase()));

  const valid = useMemo(
    () =>
      form.user.trim().length >= 3 &&
      form.name.trim().length >= 3 &&
      form.password.trim().length >= 8 &&
      !!form.role_id &&
      !!form.client_id,
    [form],
  );

  const resetForm = () => {
    setForm({
      user: '',
      name: '',
      password: '',
      role_id: '',
      client_id: defaultClientId ?? '',
    });
    setQueryRole('');
    setQueryClient('');
    setFormKey((key) => key + 1);
    requestAnimationFrame(() => userRef.current?.focus());
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) {
      notify({
        type: 'warning',
        title: t('alerts.invalid.title'),
        description: t('alerts.invalid.description'),
      });
      return;
    }

    try {
      setLoading(true);
      const response = await registerUser({ ...form, status: true });
      const ok =
        response?.success ??
        response?.ok ??
        response?.status === true ??
        (typeof response?.statusCode === 'number' && response.statusCode < 300);

      if (ok) {
        notify({ type: 'success', title: t('alerts.success.title'), description: t('alerts.success.description') });
        resetForm();
        onSuccess?.();
      } else {
        notify({ type: 'error', title: t('alerts.createError.title'), description: response?.message ?? t('errors.unexpected') });
      }
    } catch (error: any) {
      notify({ type: 'error', title: t('alerts.createError.title'), description: error?.message ?? t('errors.unexpected') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      key={formKey}
      onSubmit={onSubmit}
      className="p-5 space-y-4"
      autoComplete="off"
    >
      <div className="space-y-1">
        <label htmlFor="user" className="block text-sm font-medium">
          {t('fields.username.label')}
        </label>
        <input
          ref={userRef}
          id="user"
          name="username"
          type="text"
          value={form.user}
          onChange={(event) => setForm((current) => ({ ...current, user: event.target.value }))}
          required
          autoComplete="username"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder={t('fields.username.placeholder')}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          {t('fields.name.label')}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          required
          autoComplete="name"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder={t('fields.name.placeholder')}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          {t('fields.password.label')}
        </label>
        <input
          id="password"
          name="new-password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder={t('fields.password.placeholder')}
        />
        <p className="text-xs text-gray-500">{t('fields.password.help')}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t('fields.role.label')}</label>
          <Combobox
            value={roles.find((role) => role.id === form.role_id) ?? null}
            onChange={(value: Role | null) => setForm((current) => ({ ...current, role_id: value?.id ?? '' }))}
          >
            <div className="relative">
              <Combobox.Input
                key={`role-${formKey}`}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                displayValue={(role: Role) => role?.name ?? ''}
                onChange={(event) => setQueryRole(event.target.value)}
                placeholder={t('fields.role.searchPlaceholder')}
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
                {filteredRoles.length === 0 && <div className="px-3 py-2 text-gray-500">{t('fields.role.empty')}</div>}
                {filteredRoles.map((role) => (
                  <Combobox.Option
                    key={role.id}
                    value={role}
                    className={({ active }) =>
                      `cursor-pointer select-none px-3 py-2 text-sm ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`
                    }
                  >
                    {role.name}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">{t('fields.client.label')}</label>
          <Combobox
            value={clients.find((item) => item.id === form.client_id) ?? null}
            onChange={(value: Client | null) => setForm((current) => ({ ...current, client_id: value?.id ?? '' }))}
          >
            <div className="relative">
              <Combobox.Input
                key={`client-${formKey}`}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                displayValue={(item: Client) => item?.name ?? ''}
                onChange={(event) => setQueryClient(event.target.value)}
                placeholder={t('fields.client.searchPlaceholder')}
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
                {filteredClients.length === 0 && <div className="px-3 py-2 text-gray-500">{t('fields.client.empty')}</div>}
                {filteredClients.map((item) => (
                  <Combobox.Option
                    key={item.id}
                    value={item}
                    className={({ active }) =>
                      `cursor-pointer select-none px-3 py-2 text-sm ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`
                    }
                  >
                    {item.name}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {loadingLists && <p className="text-xs text-gray-500">{t('states.loadingLists')}</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
        >
          {t('actions.cancel')}
        </button>
        <button
          type="submit"
          disabled={!valid || loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t('actions.creating') : t('actions.create')}
        </button>
      </div>
    </form>
  );
}

