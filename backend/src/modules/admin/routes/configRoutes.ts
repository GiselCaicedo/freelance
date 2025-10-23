import { Router } from 'express'
import {
  getUsers,
  getRoles, getPermisos, getUser, updateUser, deleteUser,
  listRolesRest, getRoleById, createRole, updateRoleCtrl, deleteRoleCtrl,
  listAllPermissions, listPermissionsGrouped,    // ← nuevo
  getRolePermissionsCtrl, replaceRolePermissionsCtrl,
  getGeneralSettingsCtrl, saveGeneralSettingsCtrl,
  getSmtpConfigCtrl, saveSmtpConfigCtrl,
  listAlertRulesCtrl, saveAlertRuleCtrl, deleteAlertRuleCtrl,
  getSecurityPolicyCtrl, saveSecurityPolicyCtrl,
  getSessionPolicyCtrl, saveSessionPolicyCtrl,
  getPasswordPolicyCtrl, savePasswordPolicyCtrl,
  getCompanyProfileCtrl, updateCompanyProfileCtrl,
} from '../controllers/configController.js'

const configRoutes = Router()

// Usuarios
configRoutes.get('/get-users', getUsers)

// Endpoint para obtener usuarios por empresa (Panel Cliente)
//configRoutes.get('/get-users/:empresaId', getUsers)

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
configRoutes.get('/permissions/grouped', listPermissionsGrouped)   

// Permisos del rol
configRoutes.get('/roles/:id/permissions', getRolePermissionsCtrl)
configRoutes.put('/roles/:id/permissions', replaceRolePermissionsCtrl)

// General settings
configRoutes.get('/settings/general', getGeneralSettingsCtrl)
configRoutes.post('/settings/general', saveGeneralSettingsCtrl)

// SMTP config
configRoutes.get('/settings/smtp', getSmtpConfigCtrl)
configRoutes.post('/settings/smtp', saveSmtpConfigCtrl)

// Alerta reglas
configRoutes.get('/settings/alerts', listAlertRulesCtrl)
configRoutes.post('/settings/alerts', saveAlertRuleCtrl)
configRoutes.delete('/settings/alerts/:id', deleteAlertRuleCtrl)

// Security 
configRoutes.get('/settings/security/policy', getSecurityPolicyCtrl)
configRoutes.post('/settings/security/policy', saveSecurityPolicyCtrl)
configRoutes.get('/settings/security/session', getSessionPolicyCtrl)
configRoutes.post('/settings/security/session', saveSessionPolicyCtrl)
configRoutes.get('/settings/security/password', getPasswordPolicyCtrl)
configRoutes.post('/settings/security/password', savePasswordPolicyCtrl)


configRoutes.get('/settings/company/:clientId', getCompanyProfileCtrl)
configRoutes.post('/settings/company/:clientId', updateCompanyProfileCtrl)

export default configRoutes
