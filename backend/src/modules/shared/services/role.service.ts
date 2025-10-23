import type { Prisma } from '@prisma/client'
import { prisma } from '../../../config/db.ts'
import { normalizeRoleCategory, safeNormalizeRoleCategory } from './panel.utils.js'

// Mantiene nombres compatibles con configService existente

export async function fetchRoles() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      updated: true,
       panel: true,
    },
    orderBy: { name: 'asc' },
  })

  return roles.map((role) => {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      status: role.status,
      updated: role.updated,
       panel: safeNormalizeRoleCategory(role. panel),
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
       panel: true,
    },
  })

  if (!role) return null

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    status: role.status,
    updated: role.updated,
     panel: safeNormalizeRoleCategory(role. panel),
  }
}

export async function createRoleSvc(data: {
  name: string
  description?: string | null
  status?: boolean
   panel?: string | null // "client" o "admin"
}) {
  return prisma.$transaction(async (tx) => {
    const category = normalizeRoleCategory(data. panel)

    const role = await tx.role.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        status: typeof data.status === 'boolean' ? data.status : true,
        updated: new Date(),
         panel: category,
      },
      select: { id: true, name: true, description: true, status: true, updated: true,  panel: true },
    })

    return role
  })
}

export async function updateRoleSvc(
  id: string,
  payload: { name?: string; description?: string | null; status?: boolean;  panel?: string | null },
) {
  return prisma.$transaction(async (tx) => {
    const data: Prisma.RoleUpdateInput = { updated: new Date() }

    if (typeof payload.name !== 'undefined') data.name = payload.name
    if (typeof payload.description !== 'undefined') data.description = payload.description
    if (typeof payload.status !== 'undefined') data.status = payload.status

    if (typeof payload. panel !== 'undefined') {
      data. panel = normalizeRoleCategory(payload. panel)
    }

    const updated = await tx.role.update({
      where: { id },
      data,
      select: { id: true, name: true, description: true, status: true, updated: true,  panel: true },
    })

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

