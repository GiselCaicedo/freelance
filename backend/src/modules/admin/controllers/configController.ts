// backend/src/modules/admin/controllers/configController.ts
import { Request, Response } from 'express'
import { fetchUsers, getUserById, updateUserById, deleteUserById } from '../../shared/services/user.service.js'
import { fetchAllPermissions, fetchPermissionsGrouped, fetchRolePermissionsSvc, replaceRolePermissionsSvc } from '../../shared/services/permission.service.js'
import { fetchRoles, fetchRoleByIdSvc, createRoleSvc, updateRoleSvc, deleteRoleSvc } from '../../shared/services/role.service.js'
import {
  fetchPermisosByRole,
  getActiveGeneralSetting,
  saveGeneralSetting,
  getActiveSmtpConfig,
  saveSmtpConfig,
  listAlertRules,
  saveAlertRule,
  deleteAlertRule,
  getSecurityPolicy,
  saveSecurityPolicy,
  getSessionPolicy,
  saveSessionPolicy,
  getPasswordPolicy,
  savePasswordPolicy,
  getCompanyProfile,
  updateCompanyProfile,
} from '../services/configService.js'

export async function getUsers(req: Request, res: Response) {
  try {
    const { empresaId } = req.params as { empresaId?: string }
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
  try {
    const { name, description, status, role_category } = req.body as {
      name: string
      description?: string | null
      status?: boolean
      role_category?: string | null
    }

    const created = await createRoleSvc({ name, description, status, role_category })
    return res.status(201).json(created)
  } catch (error: any) {
    const message = error?.message ?? 'No fue posible crear el rol'
    return res.status(400).json({ message })
  }
}

export async function updateRoleCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { name, description, status, role_category } = req.body as {
      name?: string
      description?: string | null
      status?: boolean
      role_category?: string | null
    }

    const updated = await updateRoleSvc(id, { name, description, status, role_category })
    return res.json(updated)
  } catch (error: any) {
    const message = error?.message ?? 'No fue posible actualizar el rol'
    return res.status(400).json({ message })
  }
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
  try {
    const { id } = req.params
    const { permissionIds } = req.body as { permissionIds: string[] }
    await replaceRolePermissionsSvc(id, permissionIds ?? [])
    return res.json({ success: true })
  } catch (error: any) {
    const message = error?.message ?? 'No fue posible actualizar los permisos del rol'
    return res.status(400).json({ message })
  }
}

// =================== General settings ===================
export async function getGeneralSettingsCtrl(req: Request, res: Response) {
  try {
    const data = await getActiveGeneralSetting(null)
    return res.json({ success: true, data })
  } catch (error) {
    console.error('Error al obtener configuración general:', error)
    return res.status(500).json({ success: false, message: 'Error al obtener configuración general' })
  }
}

export async function saveGeneralSettingsCtrl(req: Request, res: Response) {
  try {
    const payload = req.body as any
    const data = await saveGeneralSetting(payload)
    return res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error al guardar configuración general:', error)
    return res.status(400).json({ success: false, message: error?.message ?? 'Error al guardar la configuración' })
  }
}

// =================== SMTP ===================
export async function getSmtpConfigCtrl(req: Request, res: Response) {
  try {
    const data = await getActiveSmtpConfig(null)
    return res.json({ success: true, data })
  } catch (error) {
    console.error('Error al obtener configuración SMTP:', error)
    return res.status(500).json({ success: false, message: 'Error al obtener configuración SMTP' })
  }
}

export async function saveSmtpConfigCtrl(req: Request, res: Response) {
  try {
    const payload = req.body as any
    const data = await saveSmtpConfig(payload)
    return res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error al guardar configuración SMTP:', error)
    return res.status(400).json({ success: false, message: error?.message ?? 'Error al guardar configuración SMTP' })
  }
}

// =================== Alert rules ===================
export async function listAlertRulesCtrl(_req: Request, res: Response) {
  try {
    const data = await listAlertRules()
    return res.json({ success: true, data })
  } catch (error) {
    console.error('Error al listar alertas:', error)
    return res.status(500).json({ success: false, message: 'Error al obtener alertas y recordatorios' })
  }
}

export async function saveAlertRuleCtrl(req: Request, res: Response) {
  try {
    const payload = req.body as any
    const data = await saveAlertRule(payload)
    return res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error al guardar alerta:', error)
    return res.status(400).json({ success: false, message: error?.message ?? 'Error al guardar la alerta' })
  }
}

export async function deleteAlertRuleCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params
    await deleteAlertRule(id)
    return res.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar alerta:', error)
    return res.status(500).json({ success: false, message: 'Error al eliminar la alerta' })
  }
}

// =================== Security policy ===================
export async function getSecurityPolicyCtrl(req: Request, res: Response) {
  try {
    const data = await getSecurityPolicy(null)
    return res.json({ success: true, data })
  } catch (error) {
    console.log('Error al obtener política de seguridad:', error)
    return res.status(500).json({ success: false, message: 'Error al obtener política de seguridad' })
  }
}

export async function saveSecurityPolicyCtrl(req: Request, res: Response) {
  try {
    const payload = req.body as any
    const data = await saveSecurityPolicy(payload)
    return res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error al guardar política de seguridad:', error)
    return res.status(400).json({ success: false, message: error?.message ?? 'Error al guardar política de seguridad' })
  }
}

// =================== Session policy ===================
export async function getSessionPolicyCtrl(req: Request, res: Response) {
  try {
    const data = await getSessionPolicy(null)
    return res.json({ success: true, data })
  } catch (error) {
    console.error('Error al obtener política de sesión:', error)
    return res.status(500).json({ success: false, message: 'Error al obtener política de sesión' })
  }
}

export async function saveSessionPolicyCtrl(req: Request, res: Response) {
  try {
    const payload = req.body as any
    const data = await saveSessionPolicy(payload)
    return res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error al guardar política de sesión:', error)
    return res.status(400).json({ success: false, message: error?.message ?? 'Error al guardar política de sesión' })
  }
}

// =================== Password policy ===================
export async function getPasswordPolicyCtrl(req: Request, res: Response) {
  try {
    const data = await getPasswordPolicy(null)
    return res.json({ success: true, data })
  } catch (error) {
    console.error('Error al obtener política de contraseñas:', error)
    return res.status(500).json({ success: false, message: 'Error al obtener política de contraseñas' })
  }
}

export async function savePasswordPolicyCtrl(req: Request, res: Response) {
  try {
    const payload = req.body as any
    const data = await savePasswordPolicy(payload)
    return res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error al guardar política de contraseñas:', error)
    return res.status(400).json({ success: false, message: error?.message ?? 'Error al guardar política de contraseñas' })
  }
}

// =================== Company profile ===================
export async function getCompanyProfileCtrl(req: Request, res: Response) {
  try {
    const { clientId } = req.params
    const data = await getCompanyProfile(clientId)
    if (!data) return res.status(404).json({ success: false, message: 'Empresa no encontrada' })
    return res.json({ success: true, data })
  } catch (error) {
    console.error('Error al obtener datos de la empresa:', error)
    return res.status(500).json({ success: false, message: 'Error al obtener datos de la empresa' })
  }
}

export async function updateCompanyProfileCtrl(req: Request, res: Response) {
  try {
    const { clientId } = req.params
    const payload = req.body as any
    const data = await updateCompanyProfile(clientId, payload)
    return res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error al actualizar datos de la empresa:', error)
    return res.status(400).json({ success: false, message: error?.message ?? 'Error al actualizar la empresa' })
  }
}
