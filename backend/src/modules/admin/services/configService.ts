import type { Prisma, RoleCategory } from '@prisma/client'
import bcrypt from 'bcrypt'
import { prisma } from '../../../config/db.js'
import { normalizeRoleCategory, safeNormalizeRoleCategory } from '../../shared/services/panel.utils.js'

const toPrismaPanel = (category: string): RoleCategory =>
  category.toLowerCase() === 'admin' ? 'ADMIN' : 'CLIENT'

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

export async function fetchRoles() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      updated: true,
      panel: true,
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
      role_category: safeNormalizeRoleCategory(role.panel),
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
    if (typeof r.name !== 'string') continue
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
      panel: true,
    },
  })

  if (!role) return null

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    status: role.status,
    updated: role.updated,
    role_category: safeNormalizeRoleCategory(role.panel),
  }
}

export async function createRoleSvc(data: {
  name: string
  description?: string | null
  status?: boolean
  role_category?: string | null // "client" o "admin"
}) {
  return prisma.$transaction(async (tx) => {
    const normalized = data.role_category
      ? normalizeRoleCategory(data.role_category)
      : 'client'
    const category = toPrismaPanel(normalized)

    const role = await tx.role.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        status: typeof data.status === 'boolean' ? data.status : true,
        updated: new Date(),
        panel: category,
      },
      select: { id: true, name: true, description: true, status: true, updated: true, panel: true },
    })

    return {
      ...role,
      role_category: safeNormalizeRoleCategory(role.panel),
    }
  })
}



export async function updateRoleSvc(
  id: string,
  payload: { name?: string; description?: string | null; status?: boolean; role_category?: string | null },
) {
  return prisma.$transaction(async (tx) => {
    const data: Prisma.roleUpdateInput = { updated: new Date() }

    if (typeof payload.name !== 'undefined') data.name = payload.name
    if (typeof payload.description !== 'undefined') data.description = payload.description
    if (typeof payload.status !== 'undefined') data.status = payload.status

    if (typeof payload.role_category !== 'undefined') {
      const normalized = normalizeRoleCategory(payload.role_category)
      data.panel = toPrismaPanel(normalized)
    }

    const updated = await tx.role.update({
      where: { id },
      data,
      select: { id: true, name: true, description: true, status: true, updated: true, panel: true },
    })

    return {
      ...updated,
      role_category: safeNormalizeRoleCategory(updated.panel),
    }
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
export async function getActiveGeneralSetting(_: string | null) {
  return prisma.general_setting.findFirst({ orderBy: { created: 'desc' } })
}

export async function saveGeneralSetting(payload: {
  id?: string
  company_timezone?: string | null
  company_locale?: string | null
  currency?: string | null
  first_day_of_week?: number | null
  number_decimals?: number | null
  date_format?: string | null
  time_format?: string | null
  branding_primary_color?: string | null
  logo_url?: string | null
}) {
  const data: any = {
    company_timezone: payload.company_timezone ?? null,
    company_locale: payload.company_locale ?? null,
    currency: payload.currency ?? null,
    first_day_of_week: typeof payload.first_day_of_week === 'number' ? payload.first_day_of_week : null,
    number_decimals: typeof payload.number_decimals === 'number' ? payload.number_decimals : null,
    date_format: payload.date_format ?? null,
    time_format: payload.time_format ?? null,
    branding_primary_color: payload.branding_primary_color ?? null,
    logo_url: payload.logo_url ?? null,
    status: true,
    is_active: true,
  }

  return prisma.$transaction(async (tx) => {
    const targetId =
      payload.id ||
      (
        await tx.general_setting.findFirst({
          select: { id: true },
          orderBy: { created: 'desc' },
        })
      )?.id

    if (targetId) {
      return tx.general_setting.update({
        where: { id: targetId },
        data: { ...data, updated: new Date() },
      })
    }

    const now = new Date()
    return tx.general_setting.create({
      data: {
        ...data,
        created: now,
        updated: now,
      },
    })
  })
}

// =================== SMTP ===================
export async function getActiveSmtpConfig(_: string | null) {
  return prisma.smtp_config.findFirst({ orderBy: { created: 'desc' } })
}

export async function saveSmtpConfig(payload: {
  id?: string
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
}) {
  const data: any = {
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
    is_active: true,
    status: true,
  }

  return prisma.$transaction(async (tx) => {
    const targetId =
      payload.id ||
      (
        await tx.smtp_config.findFirst({
          select: { id: true },
          orderBy: { created: 'desc' },
        })
      )?.id

    if (targetId) {
      return tx.smtp_config.update({
        where: { id: targetId },
        data: { ...data, updated: new Date() },
      })
    }

    const now = new Date()
    return tx.smtp_config.create({
      data: {
        ...data,
        created: now,
        updated: now,
      },
    })
  })
}

// =================== Alert rules ===================
export async function listAlertRules() {
  return prisma.alert_rule.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function saveAlertRule(payload: {
  id?: string
  name: string
  type: string
  conditions?: Prisma.JsonValue | string | null
  channels?: string[] | null
  remind_before_minutes?: number[] | null
  is_active?: boolean | null
}) {
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

// =================== Security policy ===================
export async function getSecurityPolicy(_: string | null) {
  return prisma.security_policy.findFirst({ orderBy: { created: 'desc' } })
}

export async function saveSecurityPolicy(payload: {
  id?: string
  require_2fa_all?: boolean | null
  require_2fa_admin?: boolean | null
  allowed_2fa_methods?: string[] | null
  allowed_ips?: string[] | null
  max_concurrent_sessions?: number | null
}) {
  const data: any = {
    require_2fa_all: typeof payload.require_2fa_all === 'boolean' ? payload.require_2fa_all : false,
    require_2fa_admin: typeof payload.require_2fa_admin === 'boolean' ? payload.require_2fa_admin : true,
    allowed_2fa_methods: sanitizeStringArray(payload.allowed_2fa_methods ?? ['totp', 'email']),
    allowed_ips: sanitizeStringArray(payload.allowed_ips ?? []),
    max_concurrent_sessions:
      typeof payload.max_concurrent_sessions === 'number' ? payload.max_concurrent_sessions : null,
    is_active: true,
    status: true,
  }

  return prisma.$transaction(async (tx) => {
    const targetId =
      payload.id ||
      (
        await tx.security_policy.findFirst({
          select: { id: true },
          orderBy: { created: 'desc' },
        })
      )?.id

    if (targetId) {
      return tx.security_policy.update({
        where: { id: targetId },
        data: { ...data, updated: new Date() },
      })
    }

    const now = new Date()
    return tx.security_policy.create({
      data: {
        ...data,
        created: now,
        updated: now,
      },
    })
  })
}

// =================== Session policy ===================
export async function getSessionPolicy(_: string | null) {
  return prisma.session_policy.findFirst({ orderBy: { created: 'desc' } })
}

export async function saveSessionPolicy(payload: {
  id?: string
  idle_timeout_minutes?: number | null
  absolute_session_minutes?: number | null
  remember_me_days?: number | null
  lock_after_failed_attempts?: number | null
  lock_window_minutes?: number | null
  lock_duration_minutes?: number | null
}) {
  const data: any = {
    idle_timeout_minutes: typeof payload.idle_timeout_minutes === 'number' ? payload.idle_timeout_minutes : null,
    absolute_session_minutes:
      typeof payload.absolute_session_minutes === 'number' ? payload.absolute_session_minutes : null,
    remember_me_days: typeof payload.remember_me_days === 'number' ? payload.remember_me_days : null,
    lock_after_failed_attempts:
      typeof payload.lock_after_failed_attempts === 'number' ? payload.lock_after_failed_attempts : null,
    lock_window_minutes: typeof payload.lock_window_minutes === 'number' ? payload.lock_window_minutes : null,
    lock_duration_minutes: typeof payload.lock_duration_minutes === 'number' ? payload.lock_duration_minutes : null,
    is_active: true,
    status: true,
  }

  return prisma.$transaction(async (tx) => {
    const targetId =
      payload.id ||
      (
        await tx.session_policy.findFirst({
          select: { id: true },
          orderBy: { created: 'desc' },
        })
      )?.id

    if (targetId) {
      return tx.session_policy.update({
        where: { id: targetId },
        data: { ...data, updated: new Date() },
      })
    }

    const now = new Date()
    return tx.session_policy.create({
      data: {
        ...data,
        created: now,
        updated: now,
      },
    })
  })
}

// =================== Password policy ===================
export async function getPasswordPolicy(_: string | null) {
  return prisma.password_policy.findFirst({ orderBy: { created: 'desc' } })
}

export async function savePasswordPolicy(payload: {
  id?: string
  min_length?: number | null
  require_uppercase?: boolean | null
  require_lowercase?: boolean | null
  require_number?: boolean | null
  require_special?: boolean | null
  disallow_common_passwords?: boolean | null
  expire_days?: number | null
  history_last_n?: number | null
}) {
  const data: any = {
    min_length: typeof payload.min_length === 'number' ? payload.min_length : 10,
    require_uppercase: typeof payload.require_uppercase === 'boolean' ? payload.require_uppercase : true,
    require_lowercase: typeof payload.require_lowercase === 'boolean' ? payload.require_lowercase : true,
    require_number: typeof payload.require_number === 'boolean' ? payload.require_number : true,
    require_special: typeof payload.require_special === 'boolean' ? payload.require_special : true,
    disallow_common_passwords:
      typeof payload.disallow_common_passwords === 'boolean' ? payload.disallow_common_passwords : true,
    expire_days: typeof payload.expire_days === 'number' ? payload.expire_days : null,
    history_last_n: typeof payload.history_last_n === 'number' ? payload.history_last_n : 5,
    is_active: true,
    status: true,
  }

  return prisma.$transaction(async (tx) => {
    const targetId =
      payload.id ||
      (
        await tx.password_policy.findFirst({
          select: { id: true },
          orderBy: { created: 'desc' },
        })
      )?.id

    if (targetId) {
      return tx.password_policy.update({
        where: { id: targetId },
        data: { ...data, updated: new Date() },
      })
    }

    const now = new Date()
    return tx.password_policy.create({
      data: {
        ...data,
        created: now,
        updated: now,
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