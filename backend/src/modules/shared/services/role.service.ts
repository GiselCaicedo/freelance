import type { Prisma } from '@prisma/client'
import { prisma } from '../../../config/db.ts'
import {
  buildPanelPermissionWhere,
  detectCategoryFromPermissionName,
  resolvePanelPermissionId,
  safeNormalizeRoleCategory,
  normalizeRoleCategory,
  type PanelRoleCategory,
} from './panel.utils.js'

// Mantiene nombres compatibles con configService existente

export async function fetchRoles() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      updated: true,
      role_category: true,
      role_permission: {
        where: { permission: buildPanelPermissionWhere() },
        select: { permission: { select: { id: true, name: true } } },
      },
    },
    orderBy: { name: 'asc' },
  })

  return roles.map((role) => {
    const storedCategory = safeNormalizeRoleCategory(role.role_category)
    const permissionCategory = detectCategoryFromPermissionName(role.role_permission[0]?.permission?.name)
    const roleCategory = storedCategory ?? permissionCategory ?? null

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      status: role.status,
      updated: role.updated,
      role_category: roleCategory,
    }
  })
}

export async function fetchRoleByIdSvc(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      updated: true,
      role_category: true,
      role_permission: {
        where: { permission: { is: buildPanelPermissionWhere() } },
        select: { permission: { select: { id: true, name: true } } },
      },
    },
  })

  if (!role) return null

  const storedCategory = safeNormalizeRoleCategory(role.role_category)
  const permissionCategory = detectCategoryFromPermissionName(role.role_permission[0]?.permission?.name)

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    status: role.status,
    updated: role.updated,
    role_category: storedCategory ?? permissionCategory ?? null,
  }
}

export async function createRoleSvc(data: {
  name: string
  description?: string | null
  status?: boolean
  role_category?: string | null // "client" o "admin"
}) {
  return prisma.$transaction(async (tx) => {
    const category = normalizeRoleCategory(data.role_category)

    const role = await tx.role.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        status: typeof data.status === 'boolean' ? data.status : true,
        updated: new Date(),
        role_category: category,
      },
      select: { id: true, name: true, description: true, status: true, updated: true, role_category: true },
    })

    const permissionId = await resolvePanelPermissionId(tx, category)

    await tx.role_permission.create({
      data: { role_id: role.id, permission_id: permissionId },
    })

    return role
  })
}

export async function updateRoleSvc(
  id: string,
  payload: { name?: string; description?: string | null; status?: boolean; role_category?: string | null },
) {
  return prisma.$transaction(async (tx) => {
    const data: Prisma.RoleUpdateInput = { updated: new Date() }

    if (typeof payload.name !== 'undefined') data.name = payload.name
    if (typeof payload.description !== 'undefined') data.description = payload.description
    if (typeof payload.status !== 'undefined') data.status = payload.status

    let category: PanelRoleCategory | null = null

    if (typeof payload.role_category !== 'undefined') {
      category = normalizeRoleCategory(payload.role_category)
      data.role_category = category
    }

    const updated = await tx.role.update({
      where: { id },
      data,
      select: { id: true, name: true, description: true, status: true, updated: true, role_category: true },
    })

    if (category) {
      const permissionId = await resolvePanelPermissionId(tx, category)

      await tx.role_permission.deleteMany({
        where: { role_id: id, permission: { is: buildPanelPermissionWhere() } },
      })

      await tx.role_permission.create({ data: { role_id: id, permission_id: permissionId } })
    }

    return updated
  })
}

export async function deleteRoleSvc(id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.role_permission.deleteMany({ where: { role_id: id } })
    await tx.role.delete({ where: { id } })
  })
}

// Variante minimal usada por selects
export async function fetchRolesMinimal() {
  return prisma.role.findMany({ select: { id: true, name: true } })
}

