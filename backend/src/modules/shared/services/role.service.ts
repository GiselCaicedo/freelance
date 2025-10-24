import type { Prisma, RoleCategory } from '@prisma/client'
import { prisma } from '../../../config/db.js'
import { normalizeRoleCategory, safeNormalizeRoleCategory } from './panel.utils.js'

const mapRoleRecord = (role: {
  id: string
  name: string
  description: string | null
  status: boolean | null
  updated: Date | null
  panel: RoleCategory | null
}) => ({
  id: role.id,
  name: role.name,
  description: role.description,
  status: role.status,
  updated: role.updated,
  role_category: safeNormalizeRoleCategory(role.panel),
})

const toPrismaCategory = (category: string): RoleCategory =>
  category.toLowerCase() === 'admin' ? 'ADMIN' : 'CLIENT'

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

  return roles.map(mapRoleRecord)
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

  return mapRoleRecord(role)
}

export async function createRoleSvc(data: {
  name: string
  description?: string | null
  status?: boolean
  role_category?: string | null
}) {
  return prisma.$transaction(async (tx) => {
    const normalized = data.role_category
      ? normalizeRoleCategory(data.role_category)
      : 'client'
    const category = toPrismaCategory(normalized)

    const role = await tx.role.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        status: typeof data.status === 'boolean' ? data.status : true,
        updated: new Date(),
        panel: category,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        updated: true,
        panel: true,
      },
    })

    return mapRoleRecord(role)
  })
}

export async function updateRoleSvc(
  id: string,
  payload: { name?: string; description?: string | null; status?: boolean; role_category?: string | null },
) {
  return prisma.$transaction(async (tx) => {
    const data: Prisma.roleUpdateInput = { updated: new Date() }

    if (typeof payload.name !== 'undefined') data.name = payload.name
    if (typeof payload.description !== 'undefined') data.description = payload.description
    if (typeof payload.status !== 'undefined') data.status = payload.status

    if (typeof payload.role_category !== 'undefined') {
      const normalized = normalizeRoleCategory(payload.role_category)
      data.panel = toPrismaCategory(normalized)
    }

    const updated = await tx.role.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        updated: true,
        panel: true,
      },
    })

    return mapRoleRecord(updated)
  })
}

export async function deleteRoleSvc(id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.role_permission.deleteMany({ where: { role_id: id } })
    await tx.role.delete({ where: { id } })
  })
}

export async function fetchRolesMinimal() {
  return prisma.role.findMany({ select: { id: true, name: true } })
}
