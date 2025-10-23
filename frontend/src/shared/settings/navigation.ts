export type SettingsNavItem = {
  id: string;
  label: string;
  path: string;
};

export type SettingsNavGroup = {
  id: string;
  title: string;
  items: SettingsNavItem[];
};

export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    id: 'configuracion',
    title: 'Configuración',
    items: [
      { id: 'generales', label: 'Generales', path: 'general' },
      { id: 'alertas', label: 'Alertas y recordatorios', path: 'alerts' },
      { id: 'smtp', label: 'Correo SMTP', path: 'smtp' },
    ],
  },
  {
    id: 'seguridad',
    title: 'Seguridad',
    items: [
      { id: 'seguridad', label: 'Generales', path: 'security/policy' },
      { id: 'twofa', label: 'Autenticación 2FA', path: 'security/twofa' },
      { id: 'password', label: 'Política de contraseñas', path: 'security/password-policy' },
      { id: 'inactividad', label: 'Inactividad', path: 'security/session-policy' },
    ],
  },
  {
    id: 'acceso',
    title: 'Configuración de acceso',
    items: [
      { id: 'usuarios', label: 'Usuarios', path: 'security/users' },
      { id: 'roles', label: 'Roles', path: 'security/roles' },
    ],
  },
];

export function getSettingsBasePath(pathname?: string | null): string {
  if (!pathname) {
    return '/admin/settings';
  }

  const segments = pathname
    .split('/')
    .filter(Boolean);

  const settingsIndex = segments.indexOf('settings');
  if (settingsIndex === -1) {
    return segments.length > 0 ? `/${segments.join('/')}` : '/admin/settings';
  }

  const baseSegments = segments.slice(0, settingsIndex + 1);
  return baseSegments.length > 0 ? `/${baseSegments.join('/')}` : '/admin/settings';
}

export function buildSettingsHref(pathname: string | null | undefined, path: string): string {
  const base = getSettingsBasePath(pathname);
  const cleaned = path.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!cleaned) {
    return base;
  }
  return `${base}/${cleaned}`;
}
