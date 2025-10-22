import type { Request, Response } from 'express'
import {
  fetchInvoices,
  fetchInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmail,
  generateInvoiceArtifact,
  fetchInvoiceCatalog,
  type InvoiceArtifactFormat,
  type PersistInvoiceInput,
  type PersistInvoiceDetailInput,
} from '../services/invoiceService.js'

const INVOICE_STATUSES: PersistInvoiceInput['status'][] = ['paid', 'pending', 'cancelled']

const isInvoiceStatus = (value: unknown): value is PersistInvoiceInput['status'] =>
  typeof value === 'string' && INVOICE_STATUSES.includes(value as PersistInvoiceInput['status'])

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.')
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const sanitizeDetails = (input: unknown): PersistInvoiceDetailInput[] => {
  if (!Array.isArray(input)) return []
  return input
    .map((detail) => ({
      serviceId: typeof detail?.serviceId === 'string' ? detail.serviceId.trim() : '',
      quantity: parseNumber(detail?.quantity) ?? 0,
      total: parseNumber(detail?.total) ?? 0,
      item: parseNumber(detail?.item) ?? null,
    }))
    .filter((detail) => detail.serviceId)
}

const parseInvoicePayload = (body: any): { data: PersistInvoiceInput } | { error: string } => {
  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : ''
  const number = typeof body?.number === 'string' ? body.number.trim() : ''
  const amount = parseNumber(body?.amount)
  const status = isInvoiceStatus(body?.status) ? (body.status as PersistInvoiceInput['status']) : 'pending'
  const issuedAt = typeof body?.issuedAt === 'string' ? body.issuedAt : undefined
  const dueAt = typeof body?.dueAt === 'string' ? body.dueAt : undefined
  const url = typeof body?.url === 'string' ? body.url.trim() || null : undefined
  const details = sanitizeDetails(body?.details)

  if (!clientId) {
    return { error: 'El cliente es obligatorio' }
  }

  if (!number) {
    return { error: 'El número de factura es obligatorio' }
  }

  if (amount === null) {
    return { error: 'El monto de la factura es inválido' }
  }

  const payload: PersistInvoiceInput = {
    clientId,
    number,
    amount,
    status,
    issuedAt: issuedAt ?? null,
    dueAt: dueAt ?? null,
    url: url ?? null,
    details,
  }

  return { data: payload }
}

const parseRecipient = (body: any): string => {
  if (typeof body?.recipient === 'string') return body.recipient.trim()
  if (typeof body?.email === 'string') return body.email.trim()
  if (typeof body?.to === 'string') return body.to.trim()
  return ''
}

export async function listInvoicesCtrl(_req: Request, res: Response) {
  const invoices = await fetchInvoices()
  res.json({ success: true, data: { invoices } })
}

export async function getInvoiceByIdCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' })
  }

  const invoice = await fetchInvoiceById(id)
  if (!invoice) {
    return res.status(404).json({ success: false, message: 'Factura no encontrada' })
  }

  res.json({ success: true, data: { invoice } })
}

export async function getInvoiceCatalogCtrl(_req: Request, res: Response) {
  const catalog = await fetchInvoiceCatalog()
  res.json({ success: true, data: catalog })
}

export async function createInvoiceCtrl(req: Request, res: Response) {
  const parsed = parseInvoicePayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const invoice = await createInvoice(parsed.data)
    return res.status(201).json({ success: true, data: { invoice } })
  } catch (error) {
    console.error('createInvoiceCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible crear la factura' })
  }
}

export async function updateInvoiceCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' })
  }

  const parsed = parseInvoicePayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const invoice = await updateInvoice(id, parsed.data)
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' })
    }
    return res.json({ success: true, data: { invoice } })
  } catch (error) {
    console.error('updateInvoiceCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible actualizar la factura' })
  }
}

export async function deleteInvoiceCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' })
  }

  try {
    await deleteInvoice(id)
    return res.status(204).send()
  } catch (error) {
    console.error('deleteInvoiceCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible eliminar la factura' })
  }
}

export async function sendInvoiceEmailCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' })
  }

  const recipient = parseRecipient(req.body)
  if (!recipient) {
    return res.status(400).json({ success: false, message: 'El destinatario es obligatorio' })
  }

  try {
    const result = await sendInvoiceEmail(id, recipient)
    return res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('sendInvoiceEmailCtrl error', error)
    const message = typeof error?.message === 'string' ? error.message : 'No fue posible enviar la factura'
    if (message === 'Factura no encontrada') {
      return res.status(404).json({ success: false, message })
    }
    if (message === 'Destinatario inválido') {
      return res.status(400).json({ success: false, message })
    }
    return res.status(500).json({ success: false, message: 'No fue posible enviar la factura' })
  }
}

export async function downloadInvoiceArtifactCtrl(req: Request, res: Response) {
  const { id, format } = req.params as { id?: string; format?: string }
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' })
  }

  const normalizedFormat = (format ?? '').toLowerCase()
  if (!['pdf', 'xml', 'zip'].includes(normalizedFormat)) {
    return res.status(400).json({ success: false, message: 'Formato de descarga inválido' })
  }

  try {
    const artifact = await generateInvoiceArtifact(id, normalizedFormat as InvoiceArtifactFormat)
    res.setHeader('Content-Type', artifact.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`)
    return res.send(artifact.content)
  } catch (error: any) {
    console.error('downloadInvoiceArtifactCtrl error', error)
    const message = typeof error?.message === 'string' ? error.message : 'No fue posible generar la descarga'
    if (message === 'Factura no encontrada') {
      return res.status(404).json({ success: false, message })
    }
    return res.status(500).json({ success: false, message: 'No fue posible generar la descarga' })
  }
}
