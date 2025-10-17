import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const TOKEN_STORAGE_KEY = 'auth_token';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return (
      window.sessionStorage.getItem(TOKEN_STORAGE_KEY) ??
      window.localStorage.getItem(TOKEN_STORAGE_KEY) ??
      null
    );
  } catch (error) {
    console.warn('Unable to read auth token from storage:', error);
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Sattus 401 (sesion expirada)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/es/sign-in';
    }
    return Promise.reject(error);
  }
);

export interface BackendUser {
  id: string;
  user?: string | null;
  usuario?: string | null;
  name?: string | null;
  status: boolean;
  updated?: string | null;
  updatedAt?: string | null;
  role?: { id?: string; name: string };
  business?: { id: string; name: string } | null;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  status?: boolean;
  updated?: string | null;
}

export interface Permission {
  id: string;
  name: string;
  description?: string | null;
}

export interface Business {
  id: string;
  name: string;
}

export interface RegisterUserDto {
  user: string;
  name: string;
  password: string;
  role_id: string;
  business_id: string;
  status: boolean;
}

export async function getUsersApi(empresaId: string): Promise<BackendUser[]> {
  const { data } = await api.get(`/config/get-users/${empresaId}`);
  if (!data?.success) throw new Error('No fue posible obtener usuarios');
  return data.data;
}

export async function getUserByIdApi(id: string): Promise<BackendUser> {
  const { data } = await api.get(`/config/users/${id}`);
  if (!data) throw new Error('Usuario no encontrado');
  return data;
}

export async function registerUser(
  dto: RegisterUserDto
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
  payload: { name?: string; role_id?: string; status?: boolean; password?: string }
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data } = await api.put(`/config/users/${id}`, payload);
    if (!data?.success) throw new Error(data?.message || 'No fue posible actualizar');
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
    if (!data?.success) throw new Error(data?.message || 'No fue posible eliminar el usuario');
    return true;
  } catch (error: any) {
    console.error('deleteUserApi error:', error);
    throw new Error(error?.response?.data?.message || 'No fue posible eliminar el usuario');
  }
}

export async function listRolesApi(): Promise<Role[]> {
  try {
    const { data } = await api.get('/config/roles');
    if (Array.isArray(data)) return data;
    if (data?.success && Array.isArray(data?.data)) return data.data;
    throw new Error('Formato inesperado en /config/roles');
  } catch (err) {
    // Fallback al endpoint legado
    const { data } = await api.get('/config/get-roles');
    if (data?.success && Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    throw err;
  }
}

export const getRolesApi = listRolesApi;


// Obtener un rol
export async function getRoleApi(id: string): Promise<Role> {
  const { data } = await api.get(`/config/roles/${id}`);
  return data as Role;
}

// Crear rol
export async function createRoleApi(payload: {
  name: string; description?: string | null; status?: boolean;
}): Promise<Role> {
  const { data } = await api.post('/config/roles', payload);
  return data as Role;
}

// Actualizar rol
export async function updateRoleApi(id: string, payload: {
  name?: string; description?: string | null; status?: boolean;
}): Promise<Role> {
  const { data } = await api.put(`/config/roles/${id}`, payload);
  return data as Role;
}

// Eliminar rol
export async function deleteRoleApi(id: string): Promise<void> {
  await api.delete(`/config/roles/${id}`);
}

// Catálogo de permisos (array directo)
export async function listPermissionsApi(): Promise<Permission[]> {
  const { data } = await api.get('/config/permissions');
  if (!Array.isArray(data)) throw new Error('Respuesta inesperada al listar permisos');
  return data as Permission[];
}

// Permisos asignados a un rol
export async function getRolePermissionsApi(roleId: string): Promise<Permission[]> {
  const { data } = await api.get(`/config/roles/${roleId}/permissions`);
  if (!Array.isArray(data)) throw new Error('Respuesta inesperada al listar permisos del rol');
  return data as Permission[];
}

// Guardar permisos del rol (replace all)
export async function saveRolePermissionsApi(roleId: string, permissionIds: string[]) {
  const { data } = await api.put(`/config/roles/${roleId}/permissions`, { permissionIds })
  return data as { success: boolean }
}


/* ============================================================
 * 🏢 Empresas (utils)
 * ============================================================ */
export async function getBusinessApi(): Promise<Business[]> {
  try {
    const { data } = await api.get('/utils/get-business');
    if (!Array.isArray(data)) throw new Error('Respuesta inesperada del servidor');
    return data;
  } catch (error: any) {
    console.error('getBusinessApi error:', error);
    throw new Error(error?.response?.data?.message || 'Error al obtener empresas');
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
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, message: error?.response?.data?.message || 'Error al cerrar sesión' };
  }
}


export interface Permission {
  id: string
  name: string
  description?: string | null
  module?: string | null
}

export async function getRoleByIdApi(id: string) {
  const { data } = await api.get(`/config/roles/${id}`)
  return data as { id: string; name: string; description?: string | null; status: boolean }
}

export async function getRolePermissionIdsApi(roleId: string) {
  const { data } = await api.get(`/config/roles/${roleId}/permissions`)
  return data as string[]
}

export async function getPermissionsGroupedApi() {
  const { data } = await api.get(`/config/permissions/grouped`)
  return data as Record<string, Permission[]>
}

