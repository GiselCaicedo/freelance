import bcrypt from 'bcrypt'
import { prisma } from '../../../config/db.ts'

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
  payload: { name?: string; role_id?: string; status?: boolean; password?: string },
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

