import type { Prisma } from '@prisma/client'

export const PANEL_ROLE_CATEGORIES = ['admin', 'client'] as const
export type PanelRoleCategory = (typeof PANEL_ROLE_CATEGORIES)[number]

const PANEL_PERMISSION_NAME_ALIASES: Record<PanelRoleCategory, string[]> = {
  admin: ['admin', 'panel_admin'],
  client: ['client', 'cliente', 'panel_client'],
}

const PANEL_PERMISSION_FILTER = Object.values(PANEL_PERMISSION_NAME_ALIASES).flat()

export const buildPanelPermissionWhere = (category?: PanelRoleCategory) => {
  const aliases = category ? PANEL_PERMISSION_NAME_ALIASES[category] : PANEL_PERMISSION_FILTER
  return {
    OR: aliases.map((name) => ({
      name: { equals: name, mode: 'insensitive' as const },
    })),
  }
}

export const normalizeRoleCategory = (raw?: string | null): PanelRoleCategory => {
  const value = (raw ?? '').trim().toLowerCase()
  for (const category of PANEL_ROLE_CATEGORIES) {
    if (PANEL_PERMISSION_NAME_ALIASES[category].some((alias) => alias.toLowerCase() === value)) {
      return category
    }
  }
  if (PANEL_ROLE_CATEGORIES.includes(value as PanelRoleCategory)) {
    return value as PanelRoleCategory
  }
  throw new Error('Categoría de rol inválida. Debe ser "admin" o "client".')
}

export const detectCategoryFromPermissionName = (name?: string | null): PanelRoleCategory | null => {
  if (!name) return null
  const normalized = name.trim().toLowerCase()
  for (const category of PANEL_ROLE_CATEGORIES) {
    if (PANEL_PERMISSION_NAME_ALIASES[category].some((alias) => alias.toLowerCase() === normalized)) {
      return category
    }
  }
  return null
}

export const safeNormalizeRoleCategory = (raw?: string | null): PanelRoleCategory | null => {
  if (!raw) return null
  try {
    return normalizeRoleCategory(raw)
  } catch {
    return null
  }
}

export const resolvePanelPermissionId = async (
  tx: Prisma.TransactionClient,
  category: PanelRoleCategory,
): Promise<string> => {
  const permission = await tx.permission.findFirst({
    where: buildPanelPermissionWhere(category),
    select: { id: true },
  })

  if (!permission) {
    throw new Error(`No se encontró el permiso del panel para la categoría "${category}".`)
  }

  return permission.id
}

