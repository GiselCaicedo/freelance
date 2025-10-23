import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../config/db.ts'

export type TaxRecord = {
  id: string
  name: string
  description: string | null
  percentage: number
  active: boolean
  createdAt: string | null
  updatedAt: string | null
}

const toIso = (value: Date | null | undefined): string | null => (value ? value.toISOString() : null)

const decimalToNumber = (value: any): number => {
  if (value === null || typeof value === 'undefined') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === 'object' && typeof value?.toString === 'function') {
    const parsed = Number.parseFloat(value.toString())
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const normalizeText = (value: string | null | undefined, fallback: string): string => {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

const mapTaxRecord = (tax: any): TaxRecord => ({
  id: tax.id,
  name: normalizeText(tax.name ?? null, 'Impuesto sin nombre'),
  description: tax.description ?? null,
  percentage: decimalToNumber(tax.percentage),
  active: tax.active ?? false,
  createdAt: toIso(tax.created),
  updatedAt: toIso(tax.updated),
})

const decimalFromNumber = (value: number): Prisma.Decimal => new Prisma.Decimal(value.toFixed(2))

export async function listTaxes(): Promise<TaxRecord[]> {
  const taxes = await prisma.tax.findMany({ orderBy: [{ name: 'asc' }] })
  return taxes.map(mapTaxRecord)
}

export async function createTax(payload: {
  name: string
  description?: string | null
  percentage: number
  active?: boolean
}): Promise<TaxRecord> {
  const now = new Date()
  const tax = await prisma.tax.create({
    data: {
      id: randomUUID(),
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      percentage: decimalFromNumber(payload.percentage),
      active: typeof payload.active === 'boolean' ? payload.active : true,
      created: now,
      updated: now,
    },
  })

  return mapTaxRecord(tax)
}
