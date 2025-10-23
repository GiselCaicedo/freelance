import type { Request, Response } from 'express'
import { createTax, listTaxes } from '../services/taxService.js'

const parsePercentage = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.')
    if (normalized.length === 0) return null
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export async function listTaxesCtrl(_req: Request, res: Response) {
  const taxes = await listTaxes()
  return res.json({ success: true, data: { taxes } })
}

export async function createTaxCtrl(req: Request, res: Response) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : null
  const percentage = parsePercentage(req.body?.percentage)
  const active = typeof req.body?.active === 'boolean' ? req.body.active : true

  if (!name) {
    return res.status(400).json({ success: false, message: 'El nombre del impuesto es obligatorio' })
  }

  if (percentage === null) {
    return res.status(400).json({ success: false, message: 'El porcentaje del impuesto es inválido' })
  }

  try {
    const tax = await createTax({ name, description, percentage, active })
    return res.status(201).json({ success: true, data: { tax } })
  } catch (error) {
    console.error('createTaxCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible crear el impuesto' })
  }
}
