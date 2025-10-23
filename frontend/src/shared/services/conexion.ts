import type {
  AssignServiceInput,
  ClientDetailValue,
  ClientParameter,
  ClientRecord,
  ClientService,
  ServiceCatalogEntry,
} from '@admin/clients/types';
import type { AdminDashboardSummary } from '@admin/dashboard/types';
import type {
  AdminInvoiceCatalog,
  AdminInvoiceListItem,
  AdminInvoiceRecord,
  PersistAdminInvoiceInput,
} from '@admin/data/invoices';
import type { PersistTaxInput, TaxRecord } from '@admin/settings/taxes/types';
import type {
  PaymentFormValues,
  PaymentListPayload,
  PaymentMethod,
  PaymentRecord,
} from '@admin/payments/types';
import type {
  QuoteDetail,
  QuoteEmailResult,
  QuoteInvoiceResult,
  QuotePdfResult,
  QuoteSummary,
  SendQuoteEmailInput,
} from '@admin/quotes/types';
import type {
  PersistServiceInput,
  ServiceCategory,
  ServiceDetail,
  ServiceListPayload,
  ServiceRecord,
} from '@admin/services/types';
import axios, { type AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const TOKEN_STORAGE_KEY = 'auth_token';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const AUTH_COOKIE = 'auth_token';

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return (
      window.sessionStorage.getItem(TOKEN_STORAGE_KEY)
      ?? window.localStorage.getItem(TOKEN_STORAGE_KEY)
      ?? null
    );
  } catch (error) {
    console.warn('Unable to read auth token from storage:', error);
    return null;
  }
};

const setAuthCookie = (token: string) => {
  if (typeof document === 'undefined') {
    return;
  }
  const oneDay = 60 * 60 * 24;
  const secure
    = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_COOKIE}=${token}; Path=/; Max-Age=${oneDay}; SameSite=Lax${secure}`;
};

const clearAuthCookie = () => {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Status 401 (sesión expirada)
api.interceptors.response.use(
  response => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/es/sign-in';
    }
    return Promise.reject(error);
  },
);

export type BackendUser = {
  id: string;
  user?: string | null;
  usuario?: string | null;
  name?: string | null;
  status: boolean;
  updated?: string | null;
  updatedAt?: string | null;
  role?: { id?: string; name: string };
  client?: { id: string; name: string } | null;
};

export type RoleCategory = 'admin' | 'client';

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  status?: boolean;
  updated?: string | null;
  panel?: RoleCategory | null;
};

const panel_ALIASES: Record<RoleCategory, string[]> = {
  admin: ['ADMIN', 'panel_admin'],
  client: ['CLIENT', 'cliente', 'panel_client'],
};

export async function getClientsApi(): Promise<Client[]> {
  try {
    const { data } = await api.get('/utils/get-client');
    if (!Array.isArray(data)) {
      throw new TypeError('Respuesta inesperada del servidor');
    }
    return data;
  } catch (error: any) {
    console.error('getClientsApi error:', error);
    throw new Error(error?.response?.data?.message || 'Error al obtener clientes');
  }
}

const parseTaxRecord = (payload: any): TaxRecord => {
  if (payload && typeof payload === 'object') {
    const rawId = (payload as any).id ?? (payload as any)._id;
    const fallbackId = `tax-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return {
      id: String(rawId ?? fallbackId),
      name: (payload as any).name ?? 'Sin nombre',
      description: (payload as any).description ?? null,
      rate: Number((payload as any).rate ?? 0),
      active: Boolean((payload as any).active ?? true),
      createdAt: (payload as any).createdAt ?? null,
      updatedAt: (payload as any).updatedAt ?? null,
    };
  }
  throw new Error('Respuesta inesperada al transformar impuesto');
};

const parseTaxList = (payload: any): TaxRecord[] => {
  if (Array.isArray(payload)) {
    return payload.map(parseTaxRecord);
  }
  if (Array.isArray(payload?.data)) {
    return payload.data.map(parseTaxRecord);
  }
  if (Array.isArray(payload?.taxes)) {
    return payload.taxes.map(parseTaxRecord);
  }
  return [];
};

export async function getAdminTaxesApi(token?: string): Promise<TaxRecord[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/settings/taxes', config);
    const result = parseTaxList(data);
    if (
      result.length === 0
      && !Array.isArray(data)
      && !Array.isArray(data?.data)
      && !Array.isArray(data?.taxes)
    ) {
      throw new Error('Respuesta inesperada al obtener los impuestos');
    }
    return result;
  } catch (error: any) {
    console.error('getAdminTaxesApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener los impuestos');
    }
    throw error;
  }
}

export async function createAdminTaxApi(payload: PersistTaxInput): Promise<TaxRecord> {
  try {
    const { data } = await api.post('/settings/taxes', payload);
    if (data) {
      return parseTaxRecord(data?.data ?? data?.tax ?? data);
    }
    throw new Error('Respuesta inesperada al crear el impuesto');
  } catch (error: any) {
    console.error('createAdminTaxApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear el impuesto');
    }
    throw error;
  }
}

export async function updateAdminTaxApi(id: string, payload: PersistTaxInput): Promise<TaxRecord> {
  try {
    const { data } = await api.put(`/settings/taxes/${id}`, payload);
    if (data) {
      return parseTaxRecord(data?.data ?? data?.tax ?? data);
    }
    throw new Error('Respuesta inesperada al actualizar el impuesto');
  } catch (error: any) {
    console.error('updateAdminTaxApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el impuesto');
    }
    throw error;
  }
}

export async function deleteAdminTaxApi(id: string): Promise<void> {
  try {
    await api.delete(`/settings/taxes/${id}`);
  } catch (error: any) {
    console.error('deleteAdminTaxApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar el impuesto');
    }
    throw error;
  }
}

export async function getAdminClientDetailApi(
  id: string,
  token?: string,
): Promise<AdminClientDetailPayload | null> {
  try {
    const config = token
      ? {
          headers: { Authorization: `Bearer ${token}` },
        }
      : undefined;
    const { data } = await api.get(`/clients/${id}`, config);
    if (data?.success === true && data?.data) {
      return data.data as AdminClientDetailPayload;
    }
    if (data?.client && data?.parameters) {
      return data as AdminClientDetailPayload;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener cliente');
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getAdminClientDetailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Error al obtener el cliente');
    }
    throw error;
  }
}

const normalizeRoleCategoryValue = (value: unknown): RoleCategory | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  for (const [category, aliases] of Object.entries(panel_ALIASES)) {
    if (aliases.some(alias => alias.toLowerCase() === normalized)) {
      return category as RoleCategory;
    }
  }
  return null;
};

const withNormalizedRole = <T extends Role>(role: T): T => ({
  ...role,
  panel: normalizeRoleCategoryValue((role as any).panel ?? null),
});

export type Permission = {
  id: string;
  name: string;
  description?: string | null;
  module?: string | null;
};

export type Client = {
  id: string;
  name: string;
};

export type AdminClientsPayload = {
  clients: ClientRecord[];
  parameters: ClientParameter[];
};

export type AdminClientDetailPayload = {
  client: ClientRecord;
  parameters: ClientParameter[];
  serviceCatalog: ServiceCatalogEntry[];
};

type AdminClientInput = {
  name: string;
  status: ClientRecord['status'];
  type: ClientRecord['type'];
  details: ClientDetailValue[];
};

type AdminClientMutationPayload = {
  client: ClientRecord;
};

export type AdminPaymentMutationResult = {
  payment: PaymentRecord;
  methods: PaymentMethod[];
};

export type AdminDashboardSummaryFilters = {
  locale: string;
  months?: number;
  monthsAhead?: number;
  limit?: number;
  from?: string;
  to?: string;
};



export type RegisterUserDto = {
  user: string;
  name: string;
  password: string;
  role_id: string;
  client_id: string;
  status: boolean;
};

export async function getUsersApi(empresaId?: string): Promise<BackendUser[]> {
  const endpoint = empresaId ? `/config/get-users/${empresaId}` : '/config/get-users';
  const { data } = await api.get(endpoint);
  if (!data?.success) {
    throw new Error('No fue posible obtener usuarios');
  }
  return data.data;
}

export async function getUserByIdApi(id: string): Promise<BackendUser> {
  const { data } = await api.get(`/config/users/${id}`);
  if (!data) {
    throw new Error('Usuario no encontrado');
  }
  return data;
}

export async function registerUser(
  dto: RegisterUserDto,
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await api.post('/auth/register', dto);
    return { success: true, data: res.data };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || 'No fue posible crear el usuario',
    };
  }
}

export async function updateUserApi(
  id: string,
  payload: { name?: string; role_id?: string; status?: boolean; password?: string },
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data } = await api.put(`/config/users/${id}`, payload);
    if (!data?.success) {
      throw new Error(data?.message || 'No fue posible actualizar');
    }
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || 'No fue posible actualizar el usuario',
    };
  }
}

// Eliminar usuario
export async function deleteUserApi(id: string): Promise<boolean> {
  try {
    const { data } = await api.delete(`/config/users/${id}`);
    if (!data?.success) {
      throw new Error(data?.message || 'No fue posible eliminar el usuario');
    }
    return true;
  } catch (error: any) {
    console.error('deleteUserApi error:', error);
    throw new Error(error?.response?.data?.message || 'No fue posible eliminar el usuario');
  }
}

export async function listRolesApi(): Promise<Role[]> {
  try {
    const { data } = await api.get('/config/roles');
    if (Array.isArray(data)) {
      return data.map(role => withNormalizedRole(role as Role));
    }
    if (data?.success && Array.isArray(data?.data)) {
      return data.data.map((role: Role) => withNormalizedRole(role));
    }
    throw new Error('Formato inesperado en /config/roles');
  } catch (err) {
    const { data } = await api.get('/config/get-roles');
    if (data?.success && Array.isArray(data?.data)) {
      return data.data.map((role: Role) => withNormalizedRole(role));
    }
    if (Array.isArray(data)) {
      return data.map(role => withNormalizedRole(role as Role));
    }
    throw err;
  }
}

export const getRolesApi = listRolesApi;

export async function getRoleApi(id: string): Promise<Role> {
  const { data } = await api.get(`/config/roles/${id}`);
  return withNormalizedRole(data as Role);
}

export async function createRoleApi(payload: {
  name: string;
  description?: string | null;
  status?: boolean;
  panel: RoleCategory;
}): Promise<Role> {
  const { data } = await api.post('/config/roles', payload);
  return withNormalizedRole(data as Role);
}

export async function updateRoleApi(
  id: string,
  payload: {
    name?: string;
    description?: string | null;
    status?: boolean;
    panel?: RoleCategory;
  },
): Promise<Role> {
  const { data } = await api.put(`/config/roles/${id}`, payload);
  return withNormalizedRole(data as Role);
}

export async function deleteRoleApi(id: string): Promise<void> {
  await api.delete(`/config/roles/${id}`);
}

export async function listPermissionsApi(): Promise<Permission[]> {
  const { data } = await api.get('/config/permissions');
  if (!Array.isArray(data)) {
    throw new TypeError('Respuesta inesperada al listar permisos');
  }
  return data as Permission[];
}

export async function getRolePermissionsApi(roleId: string): Promise<string[]> {
  const { data } = await api.get(`/config/roles/${roleId}/permissions`);
  if (!Array.isArray(data)) {
    throw new TypeError('Respuesta inesperada al listar permisos del rol');
  }
  return data as string[];
}

export async function saveRolePermissionsApi(roleId: string, permissionIds: string[]) {
  const { data } = await api.put(`/config/roles/${roleId}/permissions`, { permissionIds });
  return data as { success: boolean };
}

const buildAuthConfig = (token?: string) =>
  token
    ? {
        headers: { Authorization: `Bearer ${token}` },
      }
    : undefined;

export async function getAdminDashboardSummaryApi(
  filters: AdminDashboardSummaryFilters,
  token?: string,
): Promise<AdminDashboardSummary> {
  const { locale, months, monthsAhead, limit, from, to } = filters;

  const params = Object.fromEntries(
    Object.entries({ locale, months, monthsAhead, limit, from, to }).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  ) as Record<string, string | number>;

  const authConfig = buildAuthConfig(token);
  const headers: Record<string, string> = {
    'Accept-Language': locale,
    ...(authConfig?.headers as Record<string, string> | undefined),
  };

  try {
    const { data } = await api.get('/dashboard/summary', {
      params,
      headers,
    });

    if (data?.success === true && data?.data) {
      return data.data as AdminDashboardSummary;
    }

    if (data && typeof data === 'object' && 'period' in data && 'totals' in data) {
      return data as AdminDashboardSummary;
    }

    throw new Error(data?.message ?? 'No fue posible obtener el resumen del dashboard');
  } catch (error: any) {
    console.error('getAdminDashboardSummaryApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ?? 'No fue posible obtener el resumen del dashboard',
      );
    }
    throw error;
  }
}

export async function getRoleByIdApi(id: string): Promise<Role> {
  const { data } = await api.get(`/config/roles/${id}`);
  return withNormalizedRole(data as Role);
}

export async function getRolePermissionIdsApi(roleId: string) {
  const { data } = await api.get(`/config/roles/${roleId}/permissions`);
  return data as string[];
}

export async function getPermissionsGroupedApi() {
  const { data } = await api.get(`/config/permissions/grouped`);
  return data as Record<string, Permission[]>;
}

export async function createAdminClientApi(
  payload: AdminClientInput,
  token?: string,
): Promise<AdminClientMutationPayload> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      name: payload.name,
      status: payload.status,
      type: payload.type,
      details: payload.details.map(detail => ({
        parameterId: detail.parameterId,
        value: detail.value,
      })),
    };
    const { data } = await api.post('/clients', body, config);
    if (data?.success === true && data?.data?.client) {
      return data.data as AdminClientMutationPayload;
    }
    if (data?.client) {
      return { client: data.client } as AdminClientMutationPayload;
    }
    if (data?.data) {
      return data.data as AdminClientMutationPayload;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear el cliente');
  } catch (error: any) {
    console.error('createAdminClientApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear el cliente');
    }
    throw error;
  }
}

export async function getAdminClientsListApi(token?: string): Promise<AdminClientsPayload> {
  try {
    const config = token
      ? {
          headers: { Authorization: `Bearer ${token}` },
        }
      : undefined;
    const { data } = await api.get('/clients', config);
    if (data?.success === true && data?.data) {
      return data.data as AdminClientsPayload;
    }
    if (Array.isArray(data?.clients) && Array.isArray(data?.parameters)) {
      return data as AdminClientsPayload;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener clientes');
  } catch (error: any) {
    console.error('getAdminClientsListApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Error al obtener clientes');
    }
    throw error;
  }
}

export async function updateAdminClientApi(
  id: string,
  payload: AdminClientInput,
  token?: string,
): Promise<AdminClientMutationPayload> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      name: payload.name,
      status: payload.status,
      type: payload.type,
      details: payload.details.map(detail => ({
        parameterId: detail.parameterId,
        value: detail.value,
      })),
    };
    const { data } = await api.put(`/clients/${id}`, body, config);
    if (data?.success === true && data?.data?.client) {
      return data.data as AdminClientMutationPayload;
    }
    if (data?.client) {
      return { client: data.client } as AdminClientMutationPayload;
    }
    if (data?.data) {
      return data.data as AdminClientMutationPayload;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar el cliente');
  } catch (error: any) {
    console.error('updateAdminClientApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el cliente');
    }
    throw error;
  }
}

export async function deleteAdminClientApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/clients/${id}`, config);
  } catch (error: any) {
    console.error('deleteAdminClientApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar el cliente');
    }
    throw error;
  }
}

export async function getAdminPaymentsListApi(token?: string): Promise<PaymentListPayload> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/payments', config);
    if (data?.success === true && data?.data) {
      return data.data as PaymentListPayload;
    }
    if (data?.payments && data?.clients && data?.methods) {
      return data as PaymentListPayload;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener pagos');
  } catch (error: any) {
    console.error('getAdminPaymentsListApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Error al obtener pagos');
    }
    throw error;
  }
}

const mapPaymentPayload = (payload: PaymentFormValues) => ({
  clientId: payload.clientId,
  value: payload.value,
  status: payload.status ?? null,
  reference: payload.reference ?? null,
  methodId: payload.methodId ?? null,
  methodName: payload.methodName ?? null,
  receiptUrl: payload.receiptUrl ?? null,
  type: payload.type ?? null,
  paidAt: payload.paidAt ?? null,
  confirmed: payload.confirmed ?? null,
  attachments: Array.isArray(payload.attachments)
    ? payload.attachments.map(attachment => ({
        id: attachment.id ?? null,
        url: attachment.url,
        invoiceId: attachment.invoiceId ?? null,
      }))
    : [],
});

export async function createAdminPaymentApi(
  payload: PaymentFormValues,
  token?: string,
): Promise<AdminPaymentMutationResult> {
  try {
    const config = buildAuthConfig(token);
    const body = mapPaymentPayload(payload);
    const { data } = await api.post('/payments', body, config);
    if (data?.success === true && data?.data?.payment) {
      return data.data as AdminPaymentMutationResult;
    }
    if (data?.payment && data?.methods) {
      return data as AdminPaymentMutationResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear el pago');
  } catch (error: any) {
    console.error('createAdminPaymentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible registrar el pago');
    }
    throw error;
  }
}

export async function updateAdminPaymentApi(
  id: string,
  payload: PaymentFormValues,
  token?: string,
): Promise<AdminPaymentMutationResult> {
  try {
    const config = buildAuthConfig(token);
    const body = mapPaymentPayload(payload);
    const { data } = await api.put(`/payments/${id}`, body, config);
    if (data?.success === true && data?.data?.payment) {
      return data.data as AdminPaymentMutationResult;
    }
    if (data?.payment && data?.methods) {
      return data as AdminPaymentMutationResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar el pago');
  } catch (error: any) {
    console.error('updateAdminPaymentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el pago');
    }
    throw error;
  }
}

export async function deleteAdminPaymentApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/payments/${id}`, config);
  } catch (error: any) {
    console.error('deleteAdminPaymentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar el pago');
    }
    throw error;
  }
}

export async function assignClientServiceApi(
  clientId: string,
  payload: AssignServiceInput,
  token?: string,
): Promise<ClientService> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      serviceId: payload.serviceId,
      started: payload.started ?? null,
      delivery: payload.delivery ?? null,
      expiry: payload.expiry ?? null,
      frequency: payload.frequency ?? null,
      unit: payload.unit ?? null,
      urlApi: payload.urlApi ?? null,
      tokenApi: payload.tokenApi ?? null,
    };
    const { data } = await api.post(`/clients/${clientId}/services`, body, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ClientService;
    }
    if (data?.service) {
      return data.service as ClientService;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al asignar el servicio');
  } catch (error: any) {
    console.error('assignClientServiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible asignar el servicio');
    }
    throw error;
  }
}

export async function updateClientServiceApi(
  clientId: string,
  assignmentId: string,
  payload: AssignServiceInput,
  token?: string,
): Promise<ClientService> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      serviceId: payload.serviceId,
      started: payload.started ?? null,
      delivery: payload.delivery ?? null,
      expiry: payload.expiry ?? null,
      frequency: payload.frequency ?? null,
      unit: payload.unit ?? null,
      urlApi: payload.urlApi ?? null,
      tokenApi: payload.tokenApi ?? null,
    };
    const { data } = await api.put(`/clients/${clientId}/services/${assignmentId}`, body, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ClientService;
    }
    if (data?.service) {
      return data.service as ClientService;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar el servicio del cliente');
  } catch (error: any) {
    console.error('updateClientServiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el servicio del cliente');
    }
    throw error;
  }
}

export async function getAdminInvoicesApi(
  token?: string,
): Promise<{ invoices: AdminInvoiceListItem[] }> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/invoices', config);
    if (data?.success === true && Array.isArray(data?.data?.invoices)) {
      return { invoices: data.data.invoices as AdminInvoiceListItem[] };
    }
    if (Array.isArray(data?.invoices)) {
      return { invoices: data.invoices as AdminInvoiceListItem[] };
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener facturas');
  } catch (error: any) {
    console.error('getAdminInvoicesApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Error al obtener facturas');
    }
    throw error;
  }
}

export async function getAdminServicesListApi(token?: string): Promise<ServiceListPayload> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/services', config);
    if (data?.success === true && data?.data) {
      const services = Array.isArray(data.data.services) ? (data.data.services as ServiceRecord[]) : [];
      const categories = Array.isArray(data.data.categories) ? (data.data.categories as ServiceCategory[]) : [];
      return { services, categories };
    }
    if (Array.isArray(data?.services) || Array.isArray(data?.categories)) {
      return {
        services: Array.isArray(data?.services) ? (data.services as ServiceRecord[]) : [],
        categories: Array.isArray(data?.categories) ? (data.categories as ServiceCategory[]) : [],
      };
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener servicios');
  } catch (error: any) {
    console.error('getAdminServicesListApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener los servicios');
    }
    throw error;
  }
}

export async function getAdminInvoiceByIdApi(
  id: string,
  token?: string,
): Promise<AdminInvoiceRecord | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/invoices/${id}`, config);
    if (data?.success === true && data?.data?.invoice) {
      return data.data.invoice as AdminInvoiceRecord;
    }
    if (data?.invoice) {
      return data.invoice as AdminInvoiceRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener la factura');
  } catch (error: any) {
    console.error('getAdminInvoiceByIdApi error:', error);
  }
}

export async function getAdminServiceDetailApi(id: string, token?: string): Promise<ServiceDetail | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/services/${id}`, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ServiceDetail;
    }
    if (data?.service) {
      return data.service as ServiceDetail;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener el servicio');
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getAdminInvoiceByIdApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Error al obtener la factura');
    }
  }
}

export async function getAdminInvoiceCatalogApi(
  token?: string,
): Promise<AdminInvoiceCatalog> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/invoices/catalog', config);
    if (data?.success === true && data?.data) {
      return data.data as AdminInvoiceCatalog;
    }
    if (Array.isArray(data?.clients) && Array.isArray(data?.services)) {
      return data as AdminInvoiceCatalog;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener el catálogo de facturas');
  } catch (error: any) {
    console.error('getAdminInvoiceCatalogApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el catálogo de facturas');
    }
    throw error;
  }
}

const normalizeInvoiceDetailsPayload = (payload: PersistAdminInvoiceInput['details']) =>
  (Array.isArray(payload) ? payload : []).map((detail, index) => ({
    serviceId: detail.serviceId,
    quantity: detail.quantity,
    total: detail.total,
    item: detail.item ?? index + 1,
  }));

export async function createAdminInvoiceApi(
  payload: PersistAdminInvoiceInput,
  token?: string,
): Promise<AdminInvoiceRecord> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      clientId: payload.clientId,
      number: payload.number,
      amount: payload.amount,
      status: payload.status,
      issuedAt: payload.issuedAt ?? null,
      dueAt: payload.dueAt ?? null,
      url: payload.url ?? null,
      details: normalizeInvoiceDetailsPayload(payload.details),
    };
    const { data } = await api.post('/invoices', body, config);
    if (data?.success === true && data?.data?.invoice) {
      return data.data.invoice as AdminInvoiceRecord;
    }
    if (data?.invoice) {
      return data.invoice as AdminInvoiceRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear la factura');
  } catch (error: any) {
    console.error('createAdminInvoiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear la factura');
    }
    throw error;
  }
}

export async function createAdminServiceApi(payload: PersistServiceInput, token?: string): Promise<ServiceRecord> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      name: payload.name,
      description: payload.description ?? null,
      unit: payload.unit ?? null,
      status: payload.status,
      categoryId: payload.categoryId ?? null,
      price: payload.price,
      subtotal: payload.subtotal ?? null,
      frequency: payload.frequency ?? null,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      taxOneId: payload.taxOneId ?? null,
      taxTwoId: payload.taxTwoId ?? null,
    };
    const { data } = await api.post('/services', body, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ServiceRecord;
    }
    if (data?.service) {
      return data.service as ServiceRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear el servicio');
  } catch (error: any) {
    console.error('createAdminServiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear el servicio');
    }
    throw error;
  }
}

export async function updateAdminInvoiceApi(
  id: string,
  payload: PersistAdminInvoiceInput,
  token?: string,
): Promise<AdminInvoiceRecord> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      clientId: payload.clientId,
      number: payload.number,
      amount: payload.amount,
      status: payload.status,
      issuedAt: payload.issuedAt ?? null,
      dueAt: payload.dueAt ?? null,
      url: payload.url ?? null,
      details: normalizeInvoiceDetailsPayload(payload.details),
    };
    const { data } = await api.put(`/invoices/${id}`, body, config);
    if (data?.success === true && data?.data?.invoice) {
      return data.data.invoice as AdminInvoiceRecord;
    }
    if (data?.invoice) {
      return data.invoice as AdminInvoiceRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar la factura');
  } catch (error: any) {
    console.error('updateAdminInvoiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar la factura');
    }
    throw error;
  }
}

export async function updateAdminServiceApi(
  id: string,
  payload: PersistServiceInput,
  token?: string,
): Promise<ServiceRecord> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      name: payload.name,
      description: payload.description ?? null,
      unit: payload.unit ?? null,
      status: payload.status,
      categoryId: payload.categoryId ?? null,
      price: payload.price,
      subtotal: payload.subtotal ?? null,
      frequency: payload.frequency ?? null,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      taxOneId: payload.taxOneId ?? null,
      taxTwoId: payload.taxTwoId ?? null,
    };
    const { data } = await api.put(`/services/${id}`, body, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ServiceRecord;
    }
    if (data?.service) {
      return data.service as ServiceRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar el servicio');
  } catch (error: any) {
    console.error('updateAdminServiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el servicio');
    }
    throw error;
  }
}

export async function deleteAdminInvoiceApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/invoices/${id}`, config);
  } catch (error: any) {
    console.error('deleteAdminInvoiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar la factura');
    }
    throw error;
  }
}

export async function sendAdminInvoiceEmailApi(
  id: string,
  recipient: string,
  token?: string,
): Promise<string> {
  try {
    const config = buildAuthConfig(token);
    const body = { recipient };
    const { data } = await api.post(`/invoices/${id}/send-email`, body, config);
    if (data?.success === true && typeof data?.data?.message === 'string') {
      return data.data.message as string;
    }
    if (typeof data?.message === 'string') {
      return data.message as string;
    }
    if (typeof data?.data === 'string') {
      return data.data as string;
    }
    return 'Correo enviado';
  } catch (error: any) {
    console.error('sendAdminInvoiceEmailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible enviar la factura');
    }
    throw error;
  }
}

export type AdminInvoiceDownloadFormat = 'pdf' | 'xml' | 'zip';

export async function downloadAdminInvoiceArtifactApi(
  id: string,
  format: AdminInvoiceDownloadFormat,
  token?: string,
): Promise<Blob> {
  try {
    const authConfig = buildAuthConfig(token);
    const config = {
      ...(authConfig ?? {}),
      responseType: 'blob' as const,
    };
    const { data } = await api.get(`/invoices/${id}/download/${format}`, config);
    return data as Blob;
  } catch (error: any) {
    console.error('downloadAdminInvoiceArtifactApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible descargar la factura');
    }
    throw error;
  }
}

export async function deleteAdminServiceApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/services/${id}`, config);
  } catch (error: any) {
    console.error('deleteAdminServiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar el servicio');
    }
    throw error;
  }
}

export async function login(credentials: {
  identifier: string;
  password: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await api.post('/auth/login', credentials);
    const token: string | undefined = response?.data?.token;

    if (token && typeof window !== 'undefined') {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setAuthCookie(token);
    }
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, message: error?.response?.data?.message || 'Error al iniciar sesión' };
  }
}

export async function logout(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post('/auth/logout');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    delete api.defaults.headers.common.Authorization;
    clearAuthCookie();
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, message: error?.response?.data?.message || 'Error al cerrar sesión' };
  }
}

export async function getAdminQuotesListApi(token?: string): Promise<QuoteSummary[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/quotes', config);
    if (Array.isArray(data)) {
      return data as QuoteSummary[];
    }
    if (data?.success === true && Array.isArray(data?.data)) {
      return data.data as QuoteSummary[];
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener las cotizaciones');
  } catch (error: any) {
    console.error('getAdminQuotesListApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener las cotizaciones');
    }
    throw error;
  }
}

export async function getAdminQuoteDetailApi(
  id: string,
  token?: string,
): Promise<QuoteDetail | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/quotes/${id}`, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteDetail;
    }
    if (data?.id && data?.reference) {
      return data as QuoteDetail;
    }
    return null;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getAdminQuoteDetailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener la cotización');
    }
    throw error;
  }
}

export async function generateAdminQuotePdfApi(
  id: string,
  token?: string,
): Promise<QuotePdfResult> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post(`/quotes/${id}/pdf`, {}, config);
    if (data?.success === true && data?.data) {
      return data.data as QuotePdfResult;
    }
    if (data?.id && 'url' in data) {
      return data as QuotePdfResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al generar el PDF');
  } catch (error: any) {
    console.error('generateAdminQuotePdfApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible generar el PDF de la cotización');
    }
    throw error;
  }
}

export async function sendAdminQuoteEmailApi(
  id: string,
  payload: SendQuoteEmailInput,
  token?: string,
): Promise<QuoteEmailResult> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      recipients: payload.recipients,
      message: payload.message ?? null,
    };
    const { data } = await api.post(`/quotes/${id}/email`, body, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteEmailResult;
    }
    if (data?.id && Array.isArray(data?.recipients)) {
      return data as QuoteEmailResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al enviar la cotización');
  } catch (error: any) {
    console.error('sendAdminQuoteEmailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible enviar la cotización por correo');
    }
    throw error;
  }
}

export async function convertAdminQuoteToInvoiceApi(
  id: string,
  token?: string,
): Promise<QuoteInvoiceResult> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post(`/quotes/${id}/invoice`, {}, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteInvoiceResult;
    }
    if (data?.invoiceId) {
      return data as QuoteInvoiceResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al convertir la cotización');
  } catch (error: any) {
    console.error('convertAdminQuoteToInvoiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible convertir la cotización en factura');
    }
    throw error;
  }
}
