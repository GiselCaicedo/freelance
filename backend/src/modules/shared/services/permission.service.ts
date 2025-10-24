import { prisma } from '../../../config/db.js'

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
    if (typeof r.name !== 'string') continue
    grouped[key].push({ id: r.id, name: r.name })
  }
  return grouped
}

export async function fetchRolePermissionsSvc(roleId: string) {
  const rows = await prisma.role_permission.findMany({
    where: { role_id: roleId },
    select: { permission_id: true },
  })
  return rows.map((r) => r.permission_id)
}

export async function replaceRolePermissionsSvc(roleId: string, permissionIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const incoming = Array.from(new Set(permissionIds.filter((id) => typeof id === 'string' && id.trim().length > 0)))

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
      await tx.role_permission.deleteMany({ where: { role_id: roleId, permission_id: { in: toDelete } } })
    }

    if (toCreate.length > 0) {
      await tx.role_permission.createMany({
        data: toCreate.map((permissionId) => ({ role_id: roleId, permission_id: permissionId })),
        skipDuplicates: true,
      })
    }

    await tx.role.update({ where: { id: roleId }, data: { updated: new Date() } })
  })
}

