import { Request, Response } from 'express'
import {
  DashboardPeriod,
  fetchBillingTotals,
  fetchClientStatusOverview,
  fetchDashboardSummary,
  fetchMonthlyBillingComparison,
  fetchTopServices,
  fetchUpcomingExpirations,
} from '../services/dashboardService.js'

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null
  const parsed = new Date(value)
  return isValidDate(parsed) ? parsed : null
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function nextMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

const MAX_PERIOD_DAYS = 366

function addDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
}

function buildPeriod(from?: string, to?: string): DashboardPeriod {
  const now = new Date()
  const defaultFrom = startOfMonth(now)
  const defaultTo = nextMonthStart(defaultFrom)

  const parsedFrom = from ? parseDate(from) : null
  const parsedTo = to ? parseDate(to) : null

  if ((from && !parsedFrom) || (to && !parsedTo)) {
    throw new Error('Rango de fechas inválido')
  }

  const periodFrom = parsedFrom ?? defaultFrom
  const rawTo = parsedTo ? addDay(parsedTo) : parsedFrom ? nextMonthStart(parsedFrom) : defaultTo
  const periodTo = rawTo

  if (periodFrom >= periodTo) {
    throw new Error('La fecha de inicio debe ser menor a la fecha fin')
  }

  const diffInDays = Math.ceil((periodTo.getTime() - periodFrom.getTime()) / (1000 * 60 * 60 * 24))
  if (diffInDays > MAX_PERIOD_DAYS) {
    throw new Error('El rango seleccionado no puede superar los 12 meses')
  }

  return { from: periodFrom, to: periodTo }
}

function parsePositiveInteger(value: unknown, fallback: number, options?: { min?: number; max?: number }): number {
  const raw = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN
  const candidate = Number.isFinite(raw) ? raw : fallback
  const min = options?.min ?? Number.NEGATIVE_INFINITY
  const max = options?.max ?? Number.POSITIVE_INFINITY
  return Math.min(Math.max(candidate, min), max)
}

export async function getDashboardSummaryCtrl(req: Request, res: Response) {
  try {
    const period = buildPeriod(req.query.from as string | undefined, req.query.to as string | undefined)

    const topLimit = parsePositiveInteger(req.query.limit, 5, { min: 1, max: 50 })
    const months = parsePositiveInteger(req.query.months, 6, { min: 1, max: 24 })
    const monthsAhead = parsePositiveInteger(req.query.monthsAhead, 1, { min: 1, max: 12 })
    const referenceDate = parseDate(req.query.referenceDate) ?? period.from

    const summary = await fetchDashboardSummary(period, {
      topServicesLimit: topLimit,
      comparisonMonths: months,
      comparisonEndDate: period.to,
      comparisonStartDate: period.from,
      expirationMonthsAhead: monthsAhead,
      expirationReferenceDate: referenceDate,
      expirationPeriod: period,
    })

    res.json({ success: true, data: summary })
  } catch (error: any) {
    const message = error?.message ?? 'No fue posible generar el resumen del dashboard'
    res.status(400).json({ success: false, message })
  }
}

export async function getBillingTotalsCtrl(req: Request, res: Response) {
  try {
    const period = buildPeriod(req.query.from as string | undefined, req.query.to as string | undefined)
    const totals = await fetchBillingTotals(period)
    res.json({ success: true, data: { period: { from: period.from.toISOString(), to: period.to.toISOString() }, totals } })
  } catch (error: any) {
    const message = error?.message ?? 'No fue posible obtener los totales de facturación'
    res.status(400).json({ success: false, message })
  }
}

export async function getUpcomingExpirationsCtrl(req: Request, res: Response) {
  try {
    const period = (req.query.from || req.query.to)
      ? buildPeriod(req.query.from as string | undefined, req.query.to as string | undefined)
      : null
    const referenceDate = parseDate(req.query.referenceDate) ?? new Date()
    const monthsAhead = parsePositiveInteger(req.query.monthsAhead, 1, { min: 1, max: 12 })

    const expirations = await fetchUpcomingExpirations(referenceDate, monthsAhead, period ?? undefined)
    res.json({
      success: true,
      data: {
        referenceDate: referenceDate.toISOString(),
        monthsAhead,
        period: period
          ? { from: period.from.toISOString(), to: period.to.toISOString() }
          : undefined,
        items: expirations,
      },
    })
  } catch (error: any) {
    const message = error?.message ?? 'No fue posible obtener los próximos vencimientos'
    res.status(400).json({ success: false, message })
  }
}

export async function getClientStatusCtrl(_req: Request, res: Response) {
  try {
    const status = await fetchClientStatusOverview()
    res.json({ success: true, data: status })
  } catch (error: any) {
    const message = error?.message ?? 'No fue posible obtener el estado de los clientes'
    res.status(500).json({ success: false, message })
  }
}

export async function getTopServicesCtrl(req: Request, res: Response) {
  try {
    const period = buildPeriod(req.query.from as string | undefined, req.query.to as string | undefined)
    const limit = parsePositiveInteger(req.query.limit, 5, { min: 1, max: 50 })

    const topServices = await fetchTopServices(period, limit)
    res.json({
      success: true,
      data: {
        period: { from: period.from.toISOString(), to: period.to.toISOString() },
        items: topServices,
      },
    })
  } catch (error: any) {
    const message = error?.message ?? 'No fue posible obtener los servicios más vendidos'
    res.status(400).json({ success: false, message })
  }
}

export async function getMonthlyComparisonCtrl(req: Request, res: Response) {
  try {
    const now = new Date()
    const endDate = parseDate(req.query.to) ?? now
    const months = parsePositiveInteger(req.query.months, 6, { min: 1, max: 24 })

    const comparison = await fetchMonthlyBillingComparison(endDate, months)
    res.json({
      success: true,
      data: {
        endDate: endDate.toISOString(),
        months,
        items: comparison,
      },
    })
  } catch (error: any) {
    const message = error?.message ?? 'No fue posible obtener la comparativa de facturación'
    res.status(400).json({ success: false, message })
  }
}

