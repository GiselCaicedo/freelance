import type { Prisma } from '@prisma/client'
import { prisma } from '../../../config/db.ts'
import bcrypt from 'bcrypt'
import { normalizeRoleCategory, safeNormalizeRoleCategory } from '../../shared/services/panel.utils.js'

// =================== Usuarios ===================
export async function fetchUsers(empresaId: string) {
  return prisma.user.findMany({
    where: { client_id: empresaId },
    select: {
      id: true,
      user: true,
      name: true,
      status: true,
      updated: true,
      role: { select: { name: true } },
    },
  })
}

export async function fetchRoles() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      updated: true,
      role_category: true,
    },
    orderBy: { name: "asc" },
  });
  return roles.map((role) => {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      status: role.status,
      updated: role.updated,
      role_category: safeNormalizeRoleCategory(role.role_category),
    }
  })
}


export async function fetchPermisosByRole(roleId: string) {
  return prisma.role_permission.findMany({
    where: { role_id: roleId },
    include: {
      permission: { select: { id: true, name: true } },
    },
  })
}

// =================== Permisos (con modulo) ===================
export async function fetchAllPermissions() {
  return prisma.permission.findMany({
    select: { id: true, name: true, section: true },
    orderBy: [{ section: 'asc' }, { name: 'asc' }],
  })
}

export async function fetchPermissionsGrouped() {
  const rows = await prisma.permission.findMany({
    select: { id: true, name: true, section: true },
    orderBy: [{ section: 'asc' }, { name: 'asc' }],
  })

  const grouped: Record<string, { id: string; name: string }[]> = {}
  for (const r of rows) {
    const key = r.section ?? 'General'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push({ id: r.id, name: r.name })
  }
  return grouped
}

// =================== CRUD de Roles ===================
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
    },
  })

  if (!role) return null

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    status: role.status,
    updated: role.updated,
    role_category: safeNormalizeRoleCategory(role.role_category),
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

    if (typeof payload.role_category !== 'undefined') {
      data.role_category = normalizeRoleCategory(payload.role_category)
    }

    const updated = await tx.role.update({
      where: { id },
      data,
      select: { id: true, name: true, description: true, status: true, updated: true, role_category: true },
    })

    return updated
  })
}

export async function deleteRoleSvc(id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.role_permission.deleteMany({ where: { role_id: id } });
    await tx.role.delete({ where: { id } });
  });
}


// =================== Permisos por Rol ===================
export async function fetchRolePermissionsSvc(roleId: string) {
  const rows = await prisma.role_permission.findMany({
    where: { role_id: roleId },
    select: { permission_id: true },
  })
  return rows.map(r => r.permission_id)
}

export async function replaceRolePermissionsSvc(roleId: string, permissionIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const incoming = Array.from(
      new Set(permissionIds.filter((id) => typeof id === 'string' && id.trim().length > 0)),
    )

    if (incoming.length === 0) {
      throw new Error('Debes seleccionar al menos un permiso para el rol.')
    }

    const permissions = await tx.permission.findMany({
      where: { id: { in: incoming } },
      select: { id: true, name: true },
    })

    if (permissions.length !== incoming.length) {
      throw new Error('Algunos permisos seleccionados no existen o fueron eliminados.')
    }
    const validIds = new Set(permissions.map((permission) => permission.id))

    const existing = await tx.role_permission.findMany({
      where: { role_id: roleId },
      select: { permission_id: true },
    })

    const existingIds = new Set(existing.map((item) => item.permission_id).filter(Boolean) as string[])
    const toDelete = [...existingIds].filter((id) => !validIds.has(id))
    const toCreate = [...validIds].filter((id) => !existingIds.has(id))

    if (toDelete.length > 0) {
      await tx.role_permission.deleteMany({
        where: { role_id: roleId, permission_id: { in: toDelete } },
      })
    }

    if (toCreate.length > 0) {
      await tx.role_permission.createMany({
        data: toCreate.map((permissionId) => ({ role_id: roleId, permission_id: permissionId })),
        skipDuplicates: true,
      })
    }

    await tx.role.update({
      where: { id: roleId },
      data: { updated: new Date() },
    })
  })
}

// =================== Usuario puntual ===================
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      role: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  })
}

export async function updateUserById(
  id: string,
  payload: { name?: string; role_id?: string; status?: boolean; password?: string }
) {
  const data: any = {}
  if (typeof payload.name !== 'undefined') data.name = payload.name
  if (typeof payload.role_id !== 'undefined') data.role_id = payload.role_id
  if (typeof payload.status !== 'undefined') data.status = payload.status
  if (payload.password && payload.password.trim().length > 0) {
    const hash = await bcrypt.hash(payload.password, 10)
    data.pass = hash
  }
  data.updated = new Date()
  return prisma.user.update({ where: { id }, data })
}

export async function deleteUserById(id: string) {
  return prisma.user.delete({ where: { id } })
}