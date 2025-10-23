import type { Request, Response } from 'express'
import {
  createPayment,
  deletePayment,
  fetchPaymentById,
  fetchPaymentsList,
  updatePayment,
  type PersistPaymentPayload,
} from '../services/paymentService.js'

type ParsedAttachment = {
  id?: string
  url: string
  invoiceId?: string | null
}

const parseAttachments = (value: unknown): ParsedAttachment[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => ({
      id: typeof entry?.id === 'string' ? entry.id : undefined,
      url: typeof entry?.url === 'string' ? entry.url.trim() : '',
      invoiceId: typeof entry?.invoiceId === 'string' ? entry.invoiceId.trim() : null,
    }))
    .filter((attachment) => attachment.url.length > 0)
}

const parseBoolean = (value: unknown): boolean | null => {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return null
}

const buildPayload = (body: any): { data?: PersistPaymentPayload; error?: string } => {
  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : ''
  const value = typeof body?.value === 'string' ? body.value.trim() : ''
  const status = typeof body?.status === 'string' ? body.status.trim() : null
  const reference = typeof body?.reference === 'string' ? body.reference.trim() : null
  const methodId = typeof body?.methodId === 'string' ? body.methodId.trim() : null
  const methodName = typeof body?.methodName === 'string' ? body.methodName.trim() : null
  const receiptUrl = typeof body?.receiptUrl === 'string' ? body.receiptUrl.trim() : null
  const type = typeof body?.type === 'string' ? body.type.trim() : null
  const paidAt = typeof body?.paidAt === 'string' ? body.paidAt.trim() : null
  const confirmed = parseBoolean(body?.confirmed)
  const attachments = parseAttachments(body?.attachments)

  if (!clientId) {
    return { error: 'El cliente es obligatorio' }
  }

  if (!value) {
    return { error: 'El valor del pago es obligatorio' }
  }

  if (!methodId && !(methodName && methodName.length > 0)) {
    return { error: 'Debes seleccionar o ingresar un método de pago' }
  }

  const payload: PersistPaymentPayload = {
    clientId,
    value,
    status,
    reference,
    methodId: methodId || undefined,
    methodName: methodName || undefined,
    receiptUrl,
    type,
    paidAt,
    confirmed,
    attachments,
  }

  return { data: payload }
}

export async function listPaymentsCtrl(_req: Request, res: Response) {
  const data = await fetchPaymentsList()
  res.json({ success: true, data })
}

export async function getPaymentByIdCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del pago' })
  }

  const payment = await fetchPaymentById(id)
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Pago no encontrado' })
  }

  return res.json({ success: true, data: { payment } })
}

export async function createPaymentCtrl(req: Request, res: Response) {
  const parsed = buildPayload(req.body)
  if (parsed.error) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const result = await createPayment(parsed.data!)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    console.error('createPaymentCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible registrar el pago' })
  }
}

export async function updatePaymentCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del pago' })
  }

  const parsed = buildPayload(req.body)
  if (parsed.error) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const result = await updatePayment(id, parsed.data!)
    if (!result) {
      return res.status(404).json({ success: false, message: 'Pago no encontrado' })
    }
    return res.json({ success: true, data: result })
  } catch (error) {
    console.error('updatePaymentCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible actualizar el pago' })
  }
}

export async function deletePaymentCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del pago' })
  }

  try {
    await deletePayment(id)
    return res.status(204).send()
  } catch (error) {
    console.error('deletePaymentCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible eliminar el pago' })
  }
}

