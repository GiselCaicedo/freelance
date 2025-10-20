import { prisma } from '../../../config/db.ts'
import bcrypt from 'bcrypt'

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

// =================== Roles y permisos ===================
export async function fetchRoles() {
  return prisma.role.findMany({
    select: { id: true, name: true, description: true, status: true, updated: true },
    orderBy: { name: 'asc' },
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
    select: { id: true, name: true, module: true },
    orderBy: [{ module: 'asc' }, { name: 'asc' }],
  })
}

export async function fetchPermissionsGrouped() {
  const rows = await prisma.permission.findMany({
    select: { id: true, name: true, module: true },
    orderBy: [{ module: 'asc' }, { name: 'asc' }],
  })

  const grouped: Record<string, { id: string; name: string }[]> = {}
  for (const r of rows) {
    const key = r.module ?? 'General'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push({ id: r.id, name: r.name })
  }
  return grouped
}

// =================== CRUD de Roles ===================
export function fetchRoleByIdSvc(id: string) {
  return prisma.role.findUnique({
    where: { id },
    select: { id: true, name: true, description: true, status: true, updated: true },
  })
}

export function createRoleSvc(data: { name: string; description?: string | null; status?: boolean }) {
  return prisma.role.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      status: typeof data.status === 'boolean' ? data.status : true,
      created: new Date(),
      updated: new Date(),
    },
    select: { id: true, name: true, description: true, status: true, updated: true },
  })
}

export function updateRoleSvc(
  id: string,
  payload: { name?: string; description?: string | null; status?: boolean },
) {
  const data: any = { updated: new Date() }
  if (typeof payload.name !== 'undefined') data.name = payload.name
  if (typeof payload.description !== 'undefined') data.description = payload.description
  if (typeof payload.status !== 'undefined') data.status = payload.status

  return prisma.role.update({
    where: { id },
    data,
    select: { id: true, name: true, description: true, status: true, updated: true },
  })
}

export async function deleteRoleSvc(id: string) {
  await prisma.role_permission.deleteMany({ where: { role_id: id } })
  await prisma.role.delete({ where: { id } })
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
  const incoming = Array.from(new Set(permissionIds))

  // Valida que existan en BD
  const validIds = new Set(
    (await prisma.permission.findMany({
      where: { id: { in: incoming } },
      select: { id: true },
    })).map(p => p.id)
  )
  const validArray = [...validIds]

  const existing = await prisma.role_permission.findMany({
    where: { role_id: roleId },
    select: { permission_id: true },
  })
  const existingIds = new Set(existing.map(e => e.permission_id))

  const toDelete = [...existingIds].filter(id => !validIds.has(id))
  const toCreate = validArray.filter(id => !existingIds.has(id))

  await prisma.$transaction([
    ...(toDelete.length
      ? [prisma.role_permission.deleteMany({
        where: { role_id: roleId, permission_id: { in: toDelete } },
      })]
      : []),
    ...(toCreate.length
      ? [prisma.role_permission.createMany({
        data: toCreate.map(pid => ({ role_id: roleId, permission_id: pid })),
        skipDuplicates: true,
      })]
      : []),
    prisma.role.update({ where: { id: roleId }, data: { updated: new Date() } }),
  ])

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
