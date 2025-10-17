'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Combobox } from '@headlessui/react';
import {
  getRolesApi,
  getBusinessApi,
  registerUser,
  Role,
  Business,
} from '@/services/conexion';
import { useAlerts } from '@/components/common/AlertsProvider';

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
  /** Empresa preseleccionada (por contexto) */
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
  const { notify } = useAlerts();
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
  const [formKey, setFormKey] = useState(0); // remount interno

  const userRef = useRef<HTMLInputElement>(null);

  // Cargar listas
  useEffect(() => {
    (async () => {
      try {
        setLoadingLists(true);
        const [r, b] = await Promise.all([getRolesApi(), getBusinessApi()]);
        setRoles(r);
        setBusiness(b);
      } catch (e: any) {
        const message = e?.message || 'No fue posible cargar listas';
        setError(message);
        notify({ type: 'error', title: 'Error al cargar datos', description: message });
      } finally {
        setLoadingLists(false);
      }
    })();
  }, [notify]);

  // Si cambian defaults y no hay selección, aplicarlas
  useEffect(() => {
    if (defaultBusinessId && !form.business_id) {
      setForm((f) => ({ ...f, business_id: defaultBusinessId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultBusinessId]);

  const filteredRoles =
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
    setFormKey((k) => k + 1); // remount interno (Combobox/Input)
    requestAnimationFrame(() => userRef.current?.focus());
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!valid) {
      notify({
        type: 'warning',
        title: 'Formulario incompleto',
        description: 'Completa los campos obligatorios. La contraseña debe tener al menos 8 caracteres.',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await registerUser({ ...form, status: true });
      const ok =
        res?.success ?? res?.ok ?? res?.status === true ?? (typeof res?.statusCode === 'number' && res.statusCode < 300);

      if (ok) {
        notify({ type: 'success', title: 'Usuario creado', description: 'El usuario se registró correctamente.' });
        resetForm();        // para quedarte en el panel creando más
        onSuccess?.();      // para refrescar la tabla / cerrar si el padre así lo decide
      } else {
        notify({ type: 'error', title: 'No se pudo crear el usuario', description: res?.message ?? 'Ocurrió un error inesperado.' });
      }
    } catch (err: any) {
      notify({ type: 'error', title: 'Error al conectar con el servidor', description: err?.message ?? 'Inténtalo de nuevo más tarde.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      key={formKey}
      onSubmit={onSubmit}
      className="p-5 space-y-4"
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
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
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
        <input
          id="password"
          name="new-password"
          type="password"
          value={form.password}
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
                    className={({ active }) =>
                      `cursor-pointer select-none px-3 py-2 text-sm ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`
                    }
                  >
                    {r.name}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

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
                    className={({ active }) =>
                      `cursor-pointer select-none px-3 py-2 text-sm ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`
                    }
                  >
                    {b.name}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>
      </div>

      {/* Errores / estado */}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {loadingLists && <p className="text-xs text-gray-500">Cargando listas…</p>}

      {/* Botones */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!valid || loading}
          className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando…' : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}
