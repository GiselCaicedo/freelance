import type { Request, Response } from 'express'
import { fetchRoles } from '../../shared/services/role.service.js'
import { fetchUsers } from '../../shared/services/user.service.js'

export async function listRoles(_req: Request, res: Response) {
  const roles = await fetchRoles()
  const filtered = roles.filter((r) => r.role_category === 'client')
  return res.json(filtered)
}

export async function listUsers(req: Request, res: Response) {
  const empresaId = (req as any)?.user?.empresaid as string | undefined
  if (!empresaId) return res.status(400).json({ message: 'Falta empresa en el token' })
  const users = await fetchUsers(empresaId)
  return res.json(users)
}

