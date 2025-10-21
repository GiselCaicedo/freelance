export const PANEL_ROLE_CATEGORIES = ['admin', 'client'] as const
export type PanelRoleCategory = (typeof PANEL_ROLE_CATEGORIES)[number]

const PANEL_CATEGORY_ALIASES: Record<PanelRoleCategory, string[]> = {
  admin: ['admin', 'panel_admin'],
  client: ['client', 'cliente', 'panel_client'],
}

export const normalizeRoleCategory = (raw?: string | null): PanelRoleCategory => {
  const value = (raw ?? '').trim().toLowerCase()
  if (!value) {
    throw new Error('Categoría de rol inválida. Debe ser "admin" o "client".')
  }

  for (const category of PANEL_ROLE_CATEGORIES) {
    if (PANEL_CATEGORY_ALIASES[category].some((alias) => alias.toLowerCase() === value)) {
      return category
    }
  }

  if (PANEL_ROLE_CATEGORIES.includes(value as PanelRoleCategory)) {
    return value as PanelRoleCategory
  }

  throw new Error('Categoría de rol inválida. Debe ser "admin" o "client".')
}

export const safeNormalizeRoleCategory = (raw?: string | null): PanelRoleCategory | null => {
  if (!raw) return null
  try {
    return normalizeRoleCategory(raw)
  } catch {
    return null
  }
}
