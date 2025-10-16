import { Router } from 'express'
import {
  getUsers,
  getRoles, getPermisos, getUser, updateUser, deleteUser,
  listRolesRest, getRoleById, createRole, updateRoleCtrl, deleteRoleCtrl,
  listAllPermissions, listPermissionsGrouped,    // ← nuevo
  getRolePermissionsCtrl, replaceRolePermissionsCtrl
} from '../controllers/configController.js'

const configRoutes = Router()

// Usuarios (legado + actual)
configRoutes.get('/get-users/:empresaId', getUsers)
configRoutes.get('/get-roles', getRoles)
configRoutes.get('/get-permisos/:id', getPermisos)
configRoutes.get('/users/:id', getUser)
configRoutes.put('/users/:id', updateUser)
configRoutes.delete('/users/:id', deleteUser)

// Roles REST
configRoutes.get('/roles', listRolesRest)
configRoutes.get('/roles/:id', getRoleById)
configRoutes.post('/roles', createRole)
configRoutes.put('/roles/:id', updateRoleCtrl)
configRoutes.delete('/roles/:id', deleteRoleCtrl)

// Permisos (catálogo)
configRoutes.get('/permissions', listAllPermissions)
configRoutes.get('/permissions/grouped', listPermissionsGrouped)   // ← NUEVO

// Permisos del rol
configRoutes.get('/roles/:id/permissions', getRolePermissionsCtrl)
configRoutes.put('/roles/:id/permissions', replaceRolePermissionsCtrl)

export default configRoutes
