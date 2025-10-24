import { prisma } from '../../../config/db.js'

const PAID_KEYWORDS = ['paid', 'pagado', 'aprob', 'complet', 'success', 'cobrad']
const pendiente_KEYWORDS = ['pend', 'proces', 'waiting', 'hold', 'due', 'unpaid', 'por cobrar']

export interface DashboardPeriod {
  from: Date
  to: Date
}

export interface BillingTotalsResult {
  billed: number
  pendiente: number
  total: number
}

export interface UpcomingInvoiceResult {
  id: string
  clientId: string | null
  clientName: string | null
  invoiceNumber: string | null
  amount: number
  expiry: string | null
  daysUntilExpiry: number | null
  status: 'pendiente' | 'pagada' | 'vencida'
  url: string | null
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
  pendiente: number
}

export interface DashboardSummaryResult {
  period: { from: string; to: string }
  totals: BillingTotalsResult
  upcomingExpirations: UpcomingInvoiceResult[]
  clientStatus: ClientStatusOverview
  topServices: TopServiceResult[]
  monthlyComparison: MonthlyBillingBucket[]
}

function normalizeStatus(value?: string | null): string {
  return value ? value.trim().toLowerCase() : ''
}

function classifyPaymentStatus(statusPay?: string | null, statusFlag?: boolean | null): 'paid' | 'pendiente' | 'other' {
  const normalized = normalizeStatus(statusPay)

  if (normalized) {
    if (PAID_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      return 'paid'
    }

    if (pendiente_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      return 'pendiente'
    }
  }

  if (typeof statusFlag === 'boolean') {
    return statusFlag ? 'paid' : 'pendiente'
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

function normalizeText(value?: string | null, fallback = ''): string {
  const trimmed = value?.trim()
  if (trimmed && trimmed.length > 0) {
    return trimmed
  }
  return fallback || '—'
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

  const totals = payments.reduce(
    (acc, payment) => {
      const amount = parseCurrency(payment.value)
      const classification = classifyPaymentStatus(payment.status_pay, payment.status)

      if (classification === 'paid') {
        acc.billed += amount
      } else if (classification === 'pendiente') {
        acc.pendiente += amount
      }

      return acc
    },
    { billed: 0, pendiente: 0 },
  )

  return { ...totals, total: totals.billed + totals.pendiente }
}

function isPendingStatus(status?: string | null): boolean {
  return status?.trim().toLowerCase() === 'pendiente'
}

export async function fetchUpcomingInvoiceExpirations(
  referenceDate: Date,
  monthsAhead = 1,
  period?: { from: Date; to: Date },
): Promise<UpcomingInvoiceResult[]> {
  const safeMonths = Math.max(1, monthsAhead)
  const startBoundary = period ? new Date(period.from) : new Date(referenceDate)
  startBoundary.setHours(0, 0, 0, 0)
  const upperBoundary = (() => {
    if (period) {
      const limit = new Date(period.to)
      limit.setHours(0, 0, 0, 0)
      return limit
    }
    const limit = new Date(startBoundary)
    limit.setMonth(limit.getMonth() + safeMonths)
    return limit
  })()

  if (startBoundary >= upperBoundary) {
    upperBoundary.setTime(startBoundary.getTime() + 24 * 60 * 60 * 1000)
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      expiry: {
        gte: startBoundary,
        lt: upperBoundary,
      },
    },
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { expiry: 'asc' },
  })

  const pendienteInvoices = invoices.filter((invoice) =>
    isPendingStatus((invoice as { status_pay?: string | null }).status_pay),
  )

  return pendienteInvoices.map((invoice) => {
    const expiryDate = invoice.expiry ?? null
    const diff = expiryDate ? expiryDate.getTime() - referenceDate.getTime() : null
    const daysUntilExpiry = diff !== null ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : null
    let status: 'pendiente' | 'pagada' | 'vencida' = 'pendiente'

    if (invoice.status === true) {
      status = 'pagada'
    } else if (expiryDate && expiryDate < referenceDate) {
      status = 'vencida'
    }

    return {
      id: invoice.id,
      clientId: invoice.client?.id ?? null,
      clientName: invoice.client?.name ?? null,
      invoiceNumber: normalizeText(invoice.description, invoice.id),
      amount: parseCurrency(invoice.value),
      expiry: expiryDate ? expiryDate.toISOString() : null,
      daysUntilExpiry,
      status,
      url: invoice.url ?? null,
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

export async function fetchMonthlyBillingComparison(
  endDate: Date,
  months = 6,
  options?: { startDate?: Date },
): Promise<MonthlyBillingBucket[]> {
  const maxMonths = 24
  const end = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1)
  let start: Date

  if (options?.startDate) {
    const candidate = new Date(options.startDate.getFullYear(), options.startDate.getMonth(), 1)
    if (candidate >= end) {
      start = new Date(end)
      start.setMonth(start.getMonth() - 1)
    } else {
      start = candidate
    }

    const spanMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    if (spanMonths > maxMonths) {
      start = new Date(end)
      start.setMonth(start.getMonth() - maxMonths)
    }
  } else {
    const safeMonths = Math.min(Math.max(months, 1), maxMonths)
    start = new Date(end)
    start.setMonth(start.getMonth() - safeMonths)
  }

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
    buckets.set(key, { month: key, billed: 0, pendiente: 0 })
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
    } else if (classification === 'pendiente') {
      bucket.pendiente += amount
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
    comparisonStartDate?: Date
    expirationReferenceDate?: Date
    expirationMonthsAhead?: number
    expirationPeriod?: DashboardPeriod
  },
): Promise<DashboardSummaryResult> {
  const [totals, upcomingExpirations, clientStatus, topServices, monthlyComparison] = await Promise.all([
    fetchBillingTotals(period),
    fetchUpcomingInvoiceExpirations(
      options?.expirationReferenceDate ?? period.from,
      options?.expirationMonthsAhead,
      options?.expirationPeriod,
    ),
    fetchClientStatusOverview(),
    fetchTopServices(period, options?.topServicesLimit),
    fetchMonthlyBillingComparison(options?.comparisonEndDate ?? period.to, options?.comparisonMonths, {
      startDate: options?.comparisonStartDate ?? period.from,
    }),
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

