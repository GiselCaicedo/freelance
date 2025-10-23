import type { Request, Response } from 'express'
import {
  convertQuoteToInvoice,
  generateQuotePdf,
  getQuoteById,
  listQuotes,
  sendQuoteByEmail,
  type SendQuoteEmailPayload,
} from '../services/quoteService.js'

export async function listQuotesCtrl(_req: Request, res: Response) {
  const data = await listQuotes()
  res.json({ success: true, data })
}

export async function getQuoteByIdCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
  }

  const quote = await getQuoteById(id)
  if (!quote) {
    return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
  }

  return res.json({ success: true, data: quote })
}

export async function generateQuotePdfCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
  }

  try {
    const payload = await generateQuotePdf(id)
    if (!payload) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
    }
    return res.json({ success: true, data: payload })
  } catch (error) {
    console.error('generateQuotePdfCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible generar el PDF de la cotización' })
  }
}

const parseSendQuotePayload = (body: any): SendQuoteEmailPayload | { error: string } => {
  const recipients = Array.isArray(body?.recipients) ? body.recipients : []
  const normalized = recipients
    .map((recipient) => (typeof recipient === 'string' ? recipient.trim() : ''))
    .filter((recipient) => recipient.length > 0)

  if (normalized.length === 0) {
    return { error: 'Debe indicar al menos un destinatario' }
  }

  const message = typeof body?.message === 'string' ? body.message : undefined
  return { recipients: normalized, message }
}

export async function sendQuoteEmailCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
  }

  const payload = parseSendQuotePayload(req.body)
  if ('error' in payload) {
    return res.status(400).json({ success: false, message: payload.error })
  }

  try {
    const result = await sendQuoteByEmail(id, payload)
    if (!result) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
    }
    return res.json({ success: true, data: result })
  } catch (error) {
    console.error('sendQuoteEmailCtrl error', error)
    const message = error instanceof Error ? error.message : 'No fue posible enviar la cotización'
    return res.status(400).json({ success: false, message })
  }
}

export async function convertQuoteToInvoiceCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
  }

  try {
    const payload = await convertQuoteToInvoice(id)
    if (!payload) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
    }

    if (payload.alreadyConverted) {
      return res.status(200).json({ success: true, data: payload })
    }

    return res.status(201).json({ success: true, data: payload })
  } catch (error) {
    console.error('convertQuoteToInvoiceCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible convertir la cotización en factura' })
  }
}
