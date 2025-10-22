import type { Prisma } from '@prisma/client'
import { prisma } from '../../../config/db.ts'
import bcrypt from 'bcrypt'
import { normalizeRoleCategory, safeNormalizeRoleCategory } from '../../shared/services/panel.utils.js'

type NullableString = string | null

const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []

  const unique = new Set<string>()
  const cleaned: string[] = []

  for (const item of value) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed) continue
    if (unique.has(trimmed)) continue
    unique.add(trimmed)
    cleaned.push(trimmed)
  }

  return cleaned
}

const sanitizeNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) return []

  const unique = new Set<number>()
  const cleaned: number[] = []

  for (const item of value) {
    let parsed: number | null = null

    if (typeof item === 'number' && Number.isFinite(item)) {
      parsed = item
    } else if (typeof item === 'string' && item.trim().length > 0) {
      const numeric = Number(item)
      parsed = Number.isFinite(numeric) ? numeric : null
    }

    if (parsed === null) continue
    if (unique.has(parsed)) continue
    unique.add(parsed)
    cleaned.push(parsed)
  }

  return cleaned
}

const normalizeClientId = (value: unknown): NullableString => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeJsonField = (value: unknown): Prisma.JsonValue | undefined => {
  if (typeof value === 'undefined' || value === null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) return {}
    try {
      return JSON.parse(trimmed)
    } catch (error) {
      throw new Error('El campo JSON tiene un formato inválido')
    }
  }
  return value as Prisma.JsonValue
}

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

// =================== General settings ===================
export async function getActiveGeneralSetting(clientId: string | null) {
  const target = normalizeClientId(clientId)
  return prisma.general_setting.findFirst({
    where: {
      client_id: target,
      is_active: true,
    },
    orderBy: { created: 'desc' },
  })
}

export async function saveGeneralSetting(payload: {
  id?: string
  client_id?: string | null
  company_timezone?: string | null
  company_locale?: string | null
  currency?: string | null
  first_day_of_week?: number | null
  number_decimals?: number | null
  date_format?: string | null
  time_format?: string | null
  branding_primary_color?: string | null
  logo_url?: string | null
  is_active?: boolean | null
  status?: boolean | null
}) {
  const clientId = normalizeClientId(payload.client_id)
  const baseData: any = {
    company_timezone: payload.company_timezone ?? null,
    company_locale: payload.company_locale ?? null,
    currency: payload.currency ?? null,
    first_day_of_week: typeof payload.first_day_of_week === 'number' ? payload.first_day_of_week : null,
    number_decimals: typeof payload.number_decimals === 'number' ? payload.number_decimals : null,
    date_format: payload.date_format ?? null,
    time_format: payload.time_format ?? null,
    branding_primary_color: payload.branding_primary_color ?? null,
    logo_url: payload.logo_url ?? null,
    status: typeof payload.status === 'boolean' ? payload.status : true,
    is_active: payload.is_active !== false,
  }

  return prisma.$transaction(async (tx) => {
    if (payload.id) {
      const existing = await tx.general_setting.findUnique({ where: { id: payload.id } })
      if (!existing) throw new Error('Configuración general no encontrada')
      const shouldActivate = payload.is_active !== false
      if (shouldActivate) {
        await tx.general_setting.updateMany({
          where: { client_id: clientId, id: { not: payload.id } },
          data: { is_active: false },
        })
      }

      return tx.general_setting.update({
        where: { id: payload.id },
        data: {
          ...baseData,
          client_id: clientId,
          is_active: shouldActivate,
          updated: new Date(),
        },
      })
    }

    if (baseData.is_active) {
      await tx.general_setting.updateMany({ where: { client_id: clientId }, data: { is_active: false } })
    }

    return tx.general_setting.create({
      data: {
        ...baseData,
        client_id: clientId,
        created: new Date(),
        updated: new Date(),
      },
    })
  })
}

// =================== SMTP ===================
export async function getActiveSmtpConfig(clientId: string | null) {
  const target = normalizeClientId(clientId)
  return prisma.smtp_config.findFirst({
    where: { client_id: target, is_active: true },
    orderBy: { created: 'desc' },
  })
}

export async function saveSmtpConfig(payload: {
  id?: string
  client_id?: string | null
  host?: string | null
  port?: number | null
  secure?: boolean | null
  username?: string | null
  password_encrypted?: string | null
  from_name?: string | null
  from_email?: string | null
  reply_to_email?: string | null
  rate_limit_per_minute?: number | null
  last_test_status?: string | null
  last_test_at?: Date | string | null
  is_active?: boolean | null
  status?: boolean | null
}) {
  const clientId = normalizeClientId(payload.client_id)
  const baseData: any = {
    host: payload.host ?? null,
    port: typeof payload.port === 'number' ? payload.port : null,
    secure: typeof payload.secure === 'boolean' ? payload.secure : null,
    username: payload.username ?? null,
    password_encrypted: payload.password_encrypted ?? null,
    from_name: payload.from_name ?? null,
    from_email: payload.from_email ?? null,
    reply_to_email: payload.reply_to_email ?? null,
    rate_limit_per_minute: typeof payload.rate_limit_per_minute === 'number' ? payload.rate_limit_per_minute : null,
    last_test_status: payload.last_test_status ?? null,
    last_test_at: payload.last_test_at ? new Date(payload.last_test_at) : null,
    is_active: payload.is_active !== false,
    status: typeof payload.status === 'boolean' ? payload.status : true,
  }

  return prisma.$transaction(async (tx) => {
    if (payload.id) {
      const existing = await tx.smtp_config.findUnique({ where: { id: payload.id } })
      if (!existing) throw new Error('Configuración SMTP no encontrada')
      const shouldActivate = payload.is_active !== false
      if (shouldActivate) {
        await tx.smtp_config.updateMany({
          where: { client_id: clientId, id: { not: payload.id } },
          data: { is_active: false },
        })
      }

      return tx.smtp_config.update({
        where: { id: payload.id },
        data: {
          ...baseData,
          client_id: clientId,
          is_active: shouldActivate,
          updated: new Date(),
        },
      })
    }

    if (baseData.is_active) {
      await tx.smtp_config.updateMany({ where: { client_id: clientId }, data: { is_active: false } })
    }

    return tx.smtp_config.create({
      data: {
        ...baseData,
        client_id: clientId,
        created: new Date(),
        updated: new Date(),
      },
    })
  })
}

// =================== Alert rules ===================
export async function listAlertRules(clientId: string) {
  return prisma.alert_rule.findMany({
    where: { client_id: clientId },
    orderBy: { name: 'asc' },
  })
}

export async function saveAlertRule(payload: {
  id?: string
  client_id: string
  name: string
  type: string
  conditions?: Prisma.JsonValue | string | null
  channels?: string[] | null
  remind_before_minutes?: number[] | null
  is_active?: boolean | null
}) {
  if (!payload.client_id || typeof payload.client_id !== 'string') {
    throw new Error('client_id es requerido para las alertas')
  }

  const channels = sanitizeStringArray(payload.channels ?? [])
  const remind = sanitizeNumberArray(payload.remind_before_minutes ?? [])
  const conditions = normalizeJsonField(payload.conditions) ?? {}

  if (payload.id) {
    return prisma.alert_rule.update({
      where: { id: payload.id },
      data: {
        name: payload.name,
        type: payload.type,
        conditions,
        channels,
        remind_before_minutes: remind,
        is_active: payload.is_active !== false,
        updated: new Date(),
      },
    })
  }

  return prisma.alert_rule.create({
    data: {
      client_id: payload.client_id,
      name: payload.name,
      type: payload.type,
      conditions,
      channels,
      remind_before_minutes: remind,
      is_active: payload.is_active !== false,
      created: new Date(),
      updated: new Date(),
    },
  })
}

export async function deleteAlertRule(id: string) {
  return prisma.alert_rule.delete({ where: { id } })
}

// =================== User preferences ===================
export async function getUserSettingsSvc(userId: string) {
  return prisma.user_setting.findUnique({ where: { user_id: userId } })
}

export async function saveUserSettingsSvc(
  userId: string,
  payload: {
    locale?: string | null
    timezone?: string | null
    theme?: string | null
    date_format?: string | null
    time_format?: string | null
    dashboard_config?: Prisma.JsonValue | string | null
    notify_email?: boolean | null
    notify_push?: boolean | null
    notify_whatsapp?: boolean | null
    reminder_default_minutes?: number | null
    digest_daily_hour?: number | null
    twofa_enabled?: boolean | null
    twofa_method?: string | null
    session_timeout_minutes?: number | null
    status?: boolean | null
  },
) {
  const data: any = {
    locale: payload.locale ?? null,
    timezone: payload.timezone ?? null,
    theme: payload.theme ?? null,
    date_format: payload.date_format ?? null,
    time_format: payload.time_format ?? null,
    dashboard_config: normalizeJsonField(payload.dashboard_config) ?? {},
    notify_email: typeof payload.notify_email === 'boolean' ? payload.notify_email : true,
    notify_push: typeof payload.notify_push === 'boolean' ? payload.notify_push : true,
    notify_whatsapp: typeof payload.notify_whatsapp === 'boolean' ? payload.notify_whatsapp : false,
    reminder_default_minutes:
      typeof payload.reminder_default_minutes === 'number' ? payload.reminder_default_minutes : null,
    digest_daily_hour: typeof payload.digest_daily_hour === 'number' ? payload.digest_daily_hour : null,
    twofa_enabled: typeof payload.twofa_enabled === 'boolean' ? payload.twofa_enabled : false,
    twofa_method: payload.twofa_method ?? null,
    session_timeout_minutes:
      typeof payload.session_timeout_minutes === 'number' ? payload.session_timeout_minutes : null,
    status: typeof payload.status === 'boolean' ? payload.status : true,
  }

  return prisma.user_setting.upsert({
    where: { user_id: userId },
    update: { ...data, updated: new Date() },
    create: {
      user_id: userId,
      ...data,
      created: new Date(),
      updated: new Date(),
    },
  })
}

export async function getUserNotificationSettingsSvc(userId: string) {
  return prisma.user_notification_setting.findUnique({ where: { user_id: userId } })
}

export async function saveUserNotificationSettingsSvc(
  userId: string,
  payload: {
    channel_email?: boolean | null
    channel_push?: boolean | null
    channel_whatsapp?: boolean | null
    quiet_hours_start?: number | null
    quiet_hours_end?: number | null
    digest_daily_hour?: number | null
  },
) {
  const data: any = {
    channel_email: typeof payload.channel_email === 'boolean' ? payload.channel_email : true,
    channel_push: typeof payload.channel_push === 'boolean' ? payload.channel_push : true,
    channel_whatsapp: typeof payload.channel_whatsapp === 'boolean' ? payload.channel_whatsapp : false,
    quiet_hours_start: typeof payload.quiet_hours_start === 'number' ? payload.quiet_hours_start : null,
    quiet_hours_end: typeof payload.quiet_hours_end === 'number' ? payload.quiet_hours_end : null,
    digest_daily_hour: typeof payload.digest_daily_hour === 'number' ? payload.digest_daily_hour : null,
  }

  return prisma.user_notification_setting.upsert({
    where: { user_id: userId },
    update: { ...data, updated: new Date() },
    create: {
      user_id: userId,
      ...data,
      created: new Date(),
      updated: new Date(),
    },
  })
}

export async function getUserTwofaSvc(userId: string) {
  return prisma.user_twofa.findUnique({ where: { user_id: userId } })
}

export async function saveUserTwofaSvc(
  userId: string,
  payload: {
    type?: string | null
    secret_encrypted?: string | null
    backup_codes?: Prisma.JsonValue | string | null
    enabled?: boolean | null
  },
) {
  const data: any = {
    type: payload.type ?? 'totp',
    secret_encrypted: payload.secret_encrypted ?? null,
    backup_codes: normalizeJsonField(payload.backup_codes) ?? null,
    enabled: typeof payload.enabled === 'boolean' ? payload.enabled : false,
  }

  return prisma.user_twofa.upsert({
    where: { user_id: userId },
    update: { ...data, updated: new Date() },
    create: {
      user_id: userId,
      ...data,
      created: new Date(),
      updated: new Date(),
    },
  })
}

// =================== Security policy ===================
export async function getSecurityPolicy(clientId: string | null) {
  const target = normalizeClientId(clientId)
  return prisma.security_policy.findFirst({
    where: { client_id: target, is_active: true },
    orderBy: { created: 'desc' },
  })
}

export async function saveSecurityPolicy(payload: {
  id?: string
  client_id?: string | null
  require_2fa_all?: boolean | null
  require_2fa_admin?: boolean | null
  allowed_2fa_methods?: string[] | null
  allowed_ips?: string[] | null
  max_concurrent_sessions?: number | null
  is_active?: boolean | null
  status?: boolean | null
}) {
  const clientId = normalizeClientId(payload.client_id)
  const baseData: any = {
    require_2fa_all: typeof payload.require_2fa_all === 'boolean' ? payload.require_2fa_all : false,
    require_2fa_admin: typeof payload.require_2fa_admin === 'boolean' ? payload.require_2fa_admin : true,
    allowed_2fa_methods: sanitizeStringArray(payload.allowed_2fa_methods ?? ['totp', 'email']),
    allowed_ips: sanitizeStringArray(payload.allowed_ips ?? []),
    max_concurrent_sessions:
      typeof payload.max_concurrent_sessions === 'number' ? payload.max_concurrent_sessions : null,
    is_active: payload.is_active !== false,
    status: typeof payload.status === 'boolean' ? payload.status : true,
  }

  return prisma.$transaction(async (tx) => {
    if (payload.id) {
      const shouldActivate = payload.is_active !== false
      if (shouldActivate) {
        await tx.security_policy.updateMany({
          where: { client_id: clientId, id: { not: payload.id } },
          data: { is_active: false },
        })
      }

      return tx.security_policy.update({
        where: { id: payload.id },
        data: {
          ...baseData,
          client_id: clientId,
          is_active: shouldActivate,
          updated: new Date(),
        },
      })
    }

    if (baseData.is_active) {
      await tx.security_policy.updateMany({ where: { client_id: clientId }, data: { is_active: false } })
    }

    return tx.security_policy.create({
      data: {
        ...baseData,
        client_id: clientId,
        created: new Date(),
        updated: new Date(),
      },
    })
  })
}

// =================== Session policy ===================
export async function getSessionPolicy(clientId: string | null) {
  const target = normalizeClientId(clientId)
  return prisma.session_policy.findFirst({
    where: { client_id: target, is_active: true },
    orderBy: { created: 'desc' },
  })
}

export async function saveSessionPolicy(payload: {
  id?: string
  client_id?: string | null
  idle_timeout_minutes?: number | null
  absolute_session_minutes?: number | null
  remember_me_days?: number | null
  lock_after_failed_attempts?: number | null
  lock_window_minutes?: number | null
  lock_duration_minutes?: number | null
  is_active?: boolean | null
  status?: boolean | null
}) {
  const clientId = normalizeClientId(payload.client_id)
  const baseData: any = {
    idle_timeout_minutes: typeof payload.idle_timeout_minutes === 'number' ? payload.idle_timeout_minutes : null,
    absolute_session_minutes:
      typeof payload.absolute_session_minutes === 'number' ? payload.absolute_session_minutes : null,
    remember_me_days: typeof payload.remember_me_days === 'number' ? payload.remember_me_days : null,
    lock_after_failed_attempts:
      typeof payload.lock_after_failed_attempts === 'number' ? payload.lock_after_failed_attempts : null,
    lock_window_minutes: typeof payload.lock_window_minutes === 'number' ? payload.lock_window_minutes : null,
    lock_duration_minutes: typeof payload.lock_duration_minutes === 'number' ? payload.lock_duration_minutes : null,
    is_active: payload.is_active !== false,
    status: typeof payload.status === 'boolean' ? payload.status : true,
  }

  return prisma.$transaction(async (tx) => {
    if (payload.id) {
      const shouldActivate = payload.is_active !== false
      if (shouldActivate) {
        await tx.session_policy.updateMany({
          where: { client_id: clientId, id: { not: payload.id } },
          data: { is_active: false },
        })
      }

      return tx.session_policy.update({
        where: { id: payload.id },
        data: {
          ...baseData,
          client_id: clientId,
          is_active: shouldActivate,
          updated: new Date(),
        },
      })
    }

    if (baseData.is_active) {
      await tx.session_policy.updateMany({ where: { client_id: clientId }, data: { is_active: false } })
    }

    return tx.session_policy.create({
      data: {
        ...baseData,
        client_id: clientId,
        created: new Date(),
        updated: new Date(),
      },
    })
  })
}

// =================== Password policy ===================
export async function getPasswordPolicy(clientId: string | null) {
  const target = normalizeClientId(clientId)
  return prisma.password_policy.findFirst({
    where: { client_id: target, is_active: true },
    orderBy: { created: 'desc' },
  })
}

export async function savePasswordPolicy(payload: {
  id?: string
  client_id?: string | null
  min_length?: number | null
  require_uppercase?: boolean | null
  require_lowercase?: boolean | null
  require_number?: boolean | null
  require_special?: boolean | null
  disallow_common_passwords?: boolean | null
  expire_days?: number | null
  history_last_n?: number | null
  is_active?: boolean | null
  status?: boolean | null
}) {
  const clientId = normalizeClientId(payload.client_id)
  const baseData: any = {
    min_length: typeof payload.min_length === 'number' ? payload.min_length : 10,
    require_uppercase: typeof payload.require_uppercase === 'boolean' ? payload.require_uppercase : true,
    require_lowercase: typeof payload.require_lowercase === 'boolean' ? payload.require_lowercase : true,
    require_number: typeof payload.require_number === 'boolean' ? payload.require_number : true,
    require_special: typeof payload.require_special === 'boolean' ? payload.require_special : true,
    disallow_common_passwords:
      typeof payload.disallow_common_passwords === 'boolean' ? payload.disallow_common_passwords : true,
    expire_days: typeof payload.expire_days === 'number' ? payload.expire_days : null,
    history_last_n: typeof payload.history_last_n === 'number' ? payload.history_last_n : 5,
    is_active: payload.is_active !== false,
    status: typeof payload.status === 'boolean' ? payload.status : true,
  }

  return prisma.$transaction(async (tx) => {
    if (payload.id) {
      const shouldActivate = payload.is_active !== false
      if (shouldActivate) {
        await tx.password_policy.updateMany({
          where: { client_id: clientId, id: { not: payload.id } },
          data: { is_active: false },
        })
      }

      return tx.password_policy.update({
        where: { id: payload.id },
        data: {
          ...baseData,
          client_id: clientId,
          is_active: shouldActivate,
          updated: new Date(),
        },
      })
    }

    if (baseData.is_active) {
      await tx.password_policy.updateMany({ where: { client_id: clientId }, data: { is_active: false } })
    }

    return tx.password_policy.create({
      data: {
        ...baseData,
        client_id: clientId,
        created: new Date(),
        updated: new Date(),
      },
    })
  })
}

// =================== Company profile ===================
export async function getCompanyProfile(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, status: true, created: true, updated: true },
  })
}

export async function updateCompanyProfile(
  clientId: string,
  payload: {
    name?: string | null
    status?: boolean | null
  },
) {
  const data: any = {}
  if (typeof payload.name !== 'undefined') data.name = payload.name
  if (typeof payload.status !== 'undefined') data.status = payload.status
  data.updated = new Date()

  return prisma.client.update({
    where: { id: clientId },
    data,
    select: { id: true, name: true, status: true, created: true, updated: true },
  })
}