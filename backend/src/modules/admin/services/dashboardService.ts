import { prisma } from '../../../config/db.ts'

const PAID_KEYWORDS = ['paid', 'pagado', 'aprob', 'complet', 'success', 'cobrad']
const PENDING_KEYWORDS = ['pend', 'proces', 'waiting', 'hold', 'due', 'unpaid', 'por cobrar']

export interface DashboardPeriod {
  from: Date
  to: Date
}

export interface BillingTotalsResult {
  billed: number
  pending: number
}

export interface UpcomingServiceResult {
  id: string
  clientId: string | null
  clientName: string | null
  serviceId: string | null
  serviceName: string | null
  expiry: string | null
  daysUntilExpiry: number | null
  frequency: string | null
  unit: string | null
  started: string | null
}

export interface ClientStatusOverview {
  total: number
  active: number
  inactive: number
  unknown: number
}

export interface TopServiceResult {
  serviceId: string
  serviceName: string | null
  timesSold: number
}

export interface MonthlyBillingBucket {
  month: string
  billed: number
  pending: number
}

export interface DashboardSummaryResult {
  period: { from: string; to: string }
  totals: BillingTotalsResult
  upcomingExpirations: UpcomingServiceResult[]
  clientStatus: ClientStatusOverview
  topServices: TopServiceResult[]
  monthlyComparison: MonthlyBillingBucket[]
}

function normalizeStatus(value?: string | null): string {
  return value ? value.trim().toLowerCase() : ''
}

function classifyPaymentStatus(statusPay?: string | null, statusFlag?: boolean | null): 'paid' | 'pending' | 'other' {
  const normalized = normalizeStatus(statusPay)

  if (normalized) {
    if (PAID_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      return 'paid'
    }

    if (PENDING_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      return 'pending'
    }
  }

  if (typeof statusFlag === 'boolean') {
    return statusFlag ? 'paid' : 'pending'
  }

  return 'other'
}

function parseCurrency(value?: string | null): number {
  if (!value) return 0

  const cleaned = value.replace(/[^0-9,.-]/g, '')
  const commaCount = (cleaned.match(/,/g) ?? []).length
  const dotCount = (cleaned.match(/\./g) ?? []).length

  let normalized = cleaned

  if (commaCount > 0 && dotCount > 0) {
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized.replace(/\./g, '').replace(/,/g, '.')
    } else {
      normalized = normalized.replace(/,/g, '')
    }
  } else if (commaCount > 0) {
    normalized = normalized.replace(/,/g, '.')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function fetchBillingTotals(period: DashboardPeriod): Promise<BillingTotalsResult> {
  const payments = await prisma.payment.findMany({
    where: {
      created: {
        gte: period.from,
        lt: period.to,
      },
    },
    select: {
      value: true,
      status_pay: true,
      status: true,
    },
  })

  return payments.reduce<BillingTotalsResult>((acc, payment) => {
    const amount = parseCurrency(payment.value)
    const classification = classifyPaymentStatus(payment.status_pay, payment.status)

    if (classification === 'paid') {
      acc.billed += amount
    } else if (classification === 'pending') {
      acc.pending += amount
    }

    return acc
  }, { billed: 0, pending: 0 })
}

export async function fetchUpcomingExpirations(referenceDate: Date, monthsAhead = 1): Promise<UpcomingServiceResult[]> {
  const limitDate = new Date(referenceDate)
  limitDate.setHours(0, 0, 0, 0)
  const searchLimit = new Date(limitDate)
  searchLimit.setMonth(searchLimit.getMonth() + Math.max(1, monthsAhead))

  const services = await prisma.client_service.findMany({
    where: {
      expiry: {
        gte: limitDate,
        lt: searchLimit,
      },
    },
    include: {
      client: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
    },
    orderBy: { expiry: 'asc' },
  })

  return services.map((service) => {
    const expiryDate = service.expiry ?? null
    const diff = expiryDate ? expiryDate.getTime() - referenceDate.getTime() : null
    const daysUntilExpiry = diff !== null ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : null

    return {
      id: service.id,
      clientId: service.client?.id ?? null,
      clientName: service.client?.name ?? null,
      serviceId: service.service?.id ?? null,
      serviceName: service.service?.name ?? null,
      expiry: expiryDate ? expiryDate.toISOString() : null,
      daysUntilExpiry,
      frequency: service.frequency ?? null,
      unit: service.unit ?? null,
      started: service.started ? service.started.toISOString() : null,
    }
  })
}

export async function fetchClientStatusOverview(): Promise<ClientStatusOverview> {
  const [total, active, inactive] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: true } }),
    prisma.client.count({ where: { status: false } }),
  ])

  const unknown = Math.max(0, total - active - inactive)

  return {
    total,
    active,
    inactive,
    unknown,
  }
}

export async function fetchTopServices(period: DashboardPeriod, limit = 5): Promise<TopServiceResult[]> {
  const group = await prisma.client_service.groupBy({
    by: ['service_id'],
    where: {
      service_id: { not: null },
      created: {
        gte: period.from,
        lt: period.to,
      },
    },
    _count: { service_id: true },
    orderBy: {
      _count: {
        service_id: 'desc',
      },
    },
    take: Math.max(1, limit),
  })

  const serviceIds = group.map((row) => row.service_id!).filter(Boolean)

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true },
  })

  const serviceNameById = new Map(services.map((service) => [service.id, service.name ?? null]))

  return group.map((row) => ({
    serviceId: row.service_id!,
    serviceName: serviceNameById.get(row.service_id!) ?? null,
    timesSold: row._count.service_id,
  }))
}

function formatMonthKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

export async function fetchMonthlyBillingComparison(endDate: Date, months = 6): Promise<MonthlyBillingBucket[]> {
  const safeMonths = Math.min(Math.max(months, 1), 24)
  const end = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1)
  const start = new Date(end)
  start.setMonth(start.getMonth() - safeMonths)

  const payments = await prisma.payment.findMany({
    where: {
      created: {
        gte: start,
        lt: end,
      },
    },
    select: {
      created: true,
      value: true,
      status_pay: true,
      status: true,
    },
  })

  const buckets = new Map<string, MonthlyBillingBucket>()
  const cursor = new Date(start)

  while (cursor < end) {
    const key = formatMonthKey(cursor)
    buckets.set(key, { month: key, billed: 0, pending: 0 })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  for (const payment of payments) {
    if (!payment.created) continue

    const key = formatMonthKey(payment.created)
    const bucket = buckets.get(key)
    if (!bucket) continue

    const amount = parseCurrency(payment.value)
    const classification = classifyPaymentStatus(payment.status_pay, payment.status)

    if (classification === 'paid') {
      bucket.billed += amount
    } else if (classification === 'pending') {
      bucket.pending += amount
    }
  }

  return Array.from(buckets.values()).sort((a, b) => (a.month < b.month ? -1 : 1))
}

export async function fetchDashboardSummary(
  period: DashboardPeriod,
  options?: {
    topServicesLimit?: number
    comparisonEndDate?: Date
    comparisonMonths?: number
    expirationReferenceDate?: Date
    expirationMonthsAhead?: number
  },
): Promise<DashboardSummaryResult> {
  const [totals, upcomingExpirations, clientStatus, topServices, monthlyComparison] = await Promise.all([
    fetchBillingTotals(period),
    fetchUpcomingExpirations(options?.expirationReferenceDate ?? period.to, options?.expirationMonthsAhead),
    fetchClientStatusOverview(),
    fetchTopServices(period, options?.topServicesLimit),
    fetchMonthlyBillingComparison(options?.comparisonEndDate ?? period.to, options?.comparisonMonths),
  ])

  return {
    period: { from: period.from.toISOString(), to: period.to.toISOString() },
    totals,
    upcomingExpirations,
    clientStatus,
    topServices,
    monthlyComparison,
  }
}

