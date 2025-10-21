// src/controllers/configController.ts
import { Request, Response } from 'express'
import {
  fetchUsers,
  fetchRoles,
  fetchPermisosByRole,
  getUserById,
  updateUserById,
  deleteUserById,
  fetchAllPermissions,
  fetchPermissionsGrouped,
  fetchRoleByIdSvc,
  createRoleSvc,
  updateRoleSvc,
  deleteRoleSvc,
  fetchRolePermissionsSvc,
  replaceRolePermissionsSvc,
} from '../services/configService.js'

export async function getUsers(req: Request, res: Response) {
  try {
    const { empresaId } = req.params
    const users = await fetchUsers(empresaId)
    res.json({ success: true, data: users })
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' })
  }
}

export async function getRoles(_req: Request, res: Response) {
  try {
    const roles = await fetchRoles()
    res.json({ success: true, data: roles })
  } catch (error) {
    console.error('Error al obtener roles:', error)
    res.status(500).json({ success: false, message: 'Error al obtener roles' })
  }
}

export async function getPermisos(req: Request, res: Response) {
  try {
    const { id } = req.params
    const permisos = await fetchPermisosByRole(id)
    const permisosMap = permisos.map((p) => p.permission)
    res.json({ success: true, data: permisosMap })
  } catch (error) {
    console.error('Error al obtener permisos:', error)
    res.status(500).json({ success: false, message: 'Error al obtener permisos' })
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    const user = await getUserById(id)
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(user)
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Error obteniendo usuario' })
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, role_id, status, password } = req.body as {
      name?: string; role_id?: string; status?: boolean; password?: string
    }
    await updateUserById(id, { name, role_id, status, password })
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Error actualizando usuario' })
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    await deleteUserById(id)
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Error eliminando usuario' })
  }
}

// =================== Roles ===================
export async function listRolesRest(_req: Request, res: Response) {
  const roles = await fetchRoles()
  return res.json(roles)
}

export async function getRoleById(req: Request, res: Response) {
  const { id } = req.params
  const role = await fetchRoleByIdSvc(id)
  if (!role) return res.status(404).json({ message: 'Rol no encontrado' })
  return res.json(role)
}

export async function createRole(req: Request, res: Response) {
  const { name, description, status } = req.body as {
    name: string; description?: string | null; status?: boolean
  }
  const created = await createRoleSvc({ name, description, status })
  return res.status(201).json(created)
}

export async function updateRoleCtrl(req: Request, res: Response) {
  const { id } = req.params
  const { name, description, status } = req.body as {
    name?: string; description?: string | null; status?: boolean
  }
  const updated = await updateRoleSvc(id, { name, description, status })
  return res.json(updated)
}

export async function deleteRoleCtrl(req: Request, res: Response) {
  const { id } = req.params
  await deleteRoleSvc(id)
  return res.json({ success: true })
}

// ======= permisos =======
export async function listAllPermissions(_req: Request, res: Response) {
  const perms = await fetchAllPermissions()
  return res.json(perms)
}

export async function listPermissionsGrouped(_req: Request, res: Response) {
  const grouped = await fetchPermissionsGrouped()
  return res.json(grouped)
}

export async function getRolePermissionsCtrl(req: Request, res: Response) {
  const { id } = req.params
  const result = await fetchRolePermissionsSvc(id) 
  return res.json(result)
}

export async function replaceRolePermissionsCtrl(req: Request, res: Response) {
  const { id } = req.params
  const { permissionIds } = req.body as { permissionIds: string[] }
  await replaceRolePermissionsSvc(id, permissionIds ?? [])
  return res.json({ success: true })
}
