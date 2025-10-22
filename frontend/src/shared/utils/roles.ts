import { RoleCategory } from '@/shared/services/conexion';

export const PANEL_CATEGORY_ALIASES: Record<RoleCategory, string[]> = {
  admin: ['admin', 'panel_admin'],
  client: ['client', 'cliente', 'panel_client'],
};

export const normalizeRoleCategory = (value?: string | null): RoleCategory | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  for (const [category, aliases] of Object.entries(PANEL_CATEGORY_ALIASES)) {
    if (aliases.some((alias) => alias.toLowerCase() === normalized)) {
      return category as RoleCategory;
    }
  }
  return null;
};

export const normalizeRoleCategoryOrEmpty = (value?: string | null): RoleCategory | '' => {
  const cat = normalizeRoleCategory(value);
  return cat ?? '';
};

