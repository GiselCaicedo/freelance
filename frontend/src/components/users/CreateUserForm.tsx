'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Combobox } from '@headlessui/react';
<<<<<<< HEAD
import { useTranslations } from 'next-intl';
=======
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
import {
  getRolesApi,
  getBusinessApi,
  registerUser,
  Role,
  Business,
} from '@/services/conexion';
<<<<<<< HEAD
import { useAlerts } from '@/components/common/AlertsProvider';
=======
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
<<<<<<< HEAD
=======
  /** Empresa preseleccionada (por contexto) */
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
  defaultBusinessId?: string;
};

type FormData = {
  user: string;
  name: string;
  password: string;
  role_id: string;
  business_id: string;
};

export default function CreateUserForm({ onClose, onSuccess, defaultBusinessId }: Props) {
<<<<<<< HEAD
  const t = useTranslations('Users.CreateForm');
  const { notify } = useAlerts();
=======
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
  const [form, setForm] = useState<FormData>({
    user: '',
    name: '',
    password: '',
    role_id: '',
    business_id: defaultBusinessId ?? '',
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [business, setBusiness] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [queryRole, setQueryRole] = useState('');
  const [queryBusiness, setQueryBusiness] = useState('');
<<<<<<< HEAD
  const [formKey, setFormKey] = useState(0);

  const userRef = useRef<HTMLInputElement>(null);

=======
  const [formKey, setFormKey] = useState(0); // remount interno

  const userRef = useRef<HTMLInputElement>(null);

  // Cargar listas
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
  useEffect(() => {
    (async () => {
      try {
        setLoadingLists(true);
<<<<<<< HEAD
        const [rolesResponse, businessResponse] = await Promise.all([getRolesApi(), getBusinessApi()]);
        setRoles(rolesResponse);
        setBusiness(businessResponse);
      } catch (e: any) {
        const message = e?.message || t('errors.loadLists');
        setError(message);
        notify({ type: 'error', title: t('alerts.loadError.title'), description: message });
=======
        const [r, b] = await Promise.all([getRolesApi(), getBusinessApi()]);
        setRoles(r);
        setBusiness(b);
      } catch (e: any) {
        setError(e?.message || 'No fue posible cargar listas');
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
      } finally {
        setLoadingLists(false);
      }
    })();
<<<<<<< HEAD
  }, [notify, t]);

  useEffect(() => {
    if (defaultBusinessId && !form.business_id) {
      setForm((current) => ({ ...current, business_id: defaultBusinessId }));
=======
  }, []);

  // Si cambian defaults y no hay selección, aplicarlas
  useEffect(() => {
    if (defaultBusinessId && !form.business_id) {
      setForm((f) => ({ ...f, business_id: defaultBusinessId }));
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultBusinessId]);

  const filteredRoles =
<<<<<<< HEAD
    queryRole === '' ? roles : roles.filter((role) => role.name.toLowerCase().includes(queryRole.toLowerCase()));

  const filteredBusiness =
    queryBusiness === '' ? business : business.filter((item) => item.name.toLowerCase().includes(queryBusiness.toLowerCase()));

  const valid = useMemo(
    () =>
      form.user.trim().length >= 3 &&
      form.name.trim().length >= 3 &&
      form.password.trim().length >= 8 &&
      !!form.role_id &&
      !!form.business_id,
    [form],
  );
=======
    queryRole === '' ? roles : roles.filter((r) => r.name.toLowerCase().includes(queryRole.toLowerCase()));

  const filteredBusiness =
    queryBusiness === '' ? business : business.filter((b) => b.name.toLowerCase().includes(queryBusiness.toLowerCase()));

  const valid = useMemo(() => (
    form.user.trim().length >= 3 &&
    form.name.trim().length >= 3 &&
    form.password.trim().length >= 8 &&
    !!form.role_id &&
    !!form.business_id
  ), [form]);
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8

  const resetForm = () => {
    setForm({
      user: '',
      name: '',
      password: '',
      role_id: '',
      business_id: defaultBusinessId ?? '',
    });
    setQueryRole('');
    setQueryBusiness('');
<<<<<<< HEAD
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
=======
    setFormKey((k) => k + 1); // remount interno (Combobox/Input)
    requestAnimationFrame(() => userRef.current?.focus());
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!valid) {
      alert('Completa los campos obligatorios (contraseña mínimo 8 caracteres).');
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
      return;
    }

    try {
      setLoading(true);
<<<<<<< HEAD
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
=======
      const res = await registerUser({ ...form, status: true });
      const ok =
        res?.success ?? res?.ok ?? res?.status === true ?? (typeof res?.statusCode === 'number' && res.statusCode < 300);

      if (ok) {
        alert('Usuario creado correctamente.');
        resetForm();        // para quedarte en el panel creando más
        onSuccess?.();      // para refrescar la tabla / cerrar si el padre así lo decide
      } else {
        alert(res?.message ?? 'No fue posible crear el usuario.');
      }
    } catch (err: any) {
      alert(err?.message ?? 'Error al conectar con el servidor.');
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      key={formKey}
      onSubmit={onSubmit}
      className="p-5 space-y-4"
<<<<<<< HEAD
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
=======
      autoComplete="off"             // evita rellenado agresivo
    >
      {/* Usuario */}
      <div className="space-y-1">
        <label htmlFor="user" className="block text-sm font-medium">Usuario</label>
        <input
          ref={userRef}
          id="user"
          name="username"            // nombre estándar
          type="text"
          value={form.user}
          onChange={(e) => setForm((f) => ({ ...f, user: e.target.value }))}
          required
          autoComplete="username"    // guía correcta para Chrome
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Nombre de usuario"
        />
      </div>

      {/* Nombre completo */}
      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">Nombre completo</label>
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
<<<<<<< HEAD
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
=======
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          autoComplete="name"
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Ej: Juan Pérez"
        />
      </div>

      {/* Contraseña */}
      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">Contraseña</label>
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        <input
          id="password"
          name="new-password"
          type="password"
          value={form.password}
<<<<<<< HEAD
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
=======
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
          minLength={8}
          autoComplete="new-password" // clave para que no reinyecte
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="••••••••"
        />
        <p className="text-xs text-gray-500">Mínimo 8 caracteres.</p>
      </div>

      {/* Selects con búsqueda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Rol */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Rol</label>
          <Combobox
            value={roles.find((r) => r.id === form.role_id) ?? null}
            onChange={(value: Role | null) => setForm((f) => ({ ...f, role_id: value?.id ?? '' }))}
          >
            <div className="relative">
              <Combobox.Input
                key={`role-${formKey}`}  // limpia input interno
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                displayValue={(role: Role) => role?.name ?? ''}
                onChange={(e) => setQueryRole(e.target.value)}
                placeholder="Buscar o seleccionar rol"
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md bg-white border border-gray-200 shadow-md">
                {filteredRoles.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                )}
                {filteredRoles.map((r) => (
                  <Combobox.Option
                    key={r.id}
                    value={r}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
                    className={({ active }) =>
                      `cursor-pointer select-none px-3 py-2 text-sm ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`
                    }
                  >
<<<<<<< HEAD
                    {role.name}
=======
                    {r.name}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

<<<<<<< HEAD
        <div className="space-y-1">
          <label className="block text-sm font-medium">{t('fields.business.label')}</label>
          <Combobox
            value={business.find((item) => item.id === form.business_id) ?? null}
            onChange={(value: Business | null) => setForm((current) => ({ ...current, business_id: value?.id ?? '' }))}
          >
            <div className="relative">
              <Combobox.Input
                key={`business-${formKey}`}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                displayValue={(item: Business) => item?.name ?? ''}
                onChange={(event) => setQueryBusiness(event.target.value)}
                placeholder={t('fields.business.searchPlaceholder')}
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
                {filteredBusiness.length === 0 && <div className="px-3 py-2 text-gray-500">{t('fields.business.empty')}</div>}
                {filteredBusiness.map((item) => (
                  <Combobox.Option
                    key={item.id}
                    value={item}
=======
        {/* Empresa */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Empresa</label>
          <Combobox
            value={business.find((b) => b.id === form.business_id) ?? null}
            onChange={(value: Business | null) => setForm((f) => ({ ...f, business_id: value?.id ?? '' }))}
          >
            <div className="relative">
              <Combobox.Input
                key={`biz-${formKey}`}   // limpia input interno
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                displayValue={(b: Business) => b?.name ?? ''}
                onChange={(e) => setQueryBusiness(e.target.value)}
                placeholder="Buscar o seleccionar empresa"
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md bg-white border border-gray-200 shadow-md">
                {filteredBusiness.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                )}
                {filteredBusiness.map((b) => (
                  <Combobox.Option
                    key={b.id}
                    value={b}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
                    className={({ active }) =>
                      `cursor-pointer select-none px-3 py-2 text-sm ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`
                    }
                  >
<<<<<<< HEAD
                    {item.name}
=======
                    {b.name}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>
      </div>

<<<<<<< HEAD
      {error && <p className="text-xs text-red-600">{error}</p>}
      {loadingLists && <p className="text-xs text-gray-500">{t('states.loadingLists')}</p>}

=======
      {/* Errores / estado */}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {loadingLists && <p className="text-xs text-gray-500">Cargando listas…</p>}

      {/* Botones */}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
<<<<<<< HEAD
          className="rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
        >
          {t('actions.cancel')}
=======
          className="px-3 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
        >
          Cancelar
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        </button>
        <button
          type="submit"
          disabled={!valid || loading}
<<<<<<< HEAD
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t('actions.creating') : t('actions.create')}
=======
          className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando…' : 'Crear usuario'}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
        </button>
      </div>
    </form>
  );
}
<<<<<<< HEAD

=======
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
