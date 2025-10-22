import type { Request, Response } from 'express'
import {
  createClient,
  deleteClient,
  fetchClientById,
  fetchClientsWithDetails,
  updateClient,
  type ClientStatus,
  type ClientType,
} from '../services/clientService.js'

const CLIENT_STATUSES: ClientStatus[] = ['active', 'inactive', 'onboarding']
const CLIENT_TYPES: ClientType[] = ['natural', 'juridica']

const isClientStatus = (value: unknown): value is ClientStatus =>
  typeof value === 'string' && CLIENT_STATUSES.includes(value as ClientStatus)

const isClientType = (value: unknown): value is ClientType =>
  typeof value === 'string' && CLIENT_TYPES.includes(value as ClientType)

const parseClientDetails = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value
    .map((detail) => ({
      parameterId: typeof detail?.parameterId === 'string' ? detail.parameterId : '',
      value: typeof detail?.value === 'string' ? detail.value : '',
    }))
    .filter((detail) => detail.parameterId && detail.value)
}

const buildPayload = (body: any) => {
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const status = isClientStatus(body?.status) ? body.status : null
  const type = isClientType(body?.type) ? body.type : undefined
  const details = parseClientDetails(body?.details)

  if (!name) {
    return { error: 'El nombre del cliente es obligatorio' }
  }

  if (!status) {
    return { error: 'El estado del cliente es inválido' }
  }

  return { data: { name, status, type, details } }
}

export async function listClientsCtrl(_req: Request, res: Response) {
  const payload = await fetchClientsWithDetails()
  res.json({ success: true, data: payload })
}

export async function getClientByIdCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del cliente' })
  }

  const payload = await fetchClientById(id)
  if (!payload) {
    return res.status(404).json({ success: false, message: 'Cliente no encontrado' })
  }

  res.json({ success: true, data: payload })
}

export async function createClientCtrl(req: Request, res: Response) {
  const parsed = buildPayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const payload = await createClient(parsed.data)
    return res.status(201).json({ success: true, data: payload })
  } catch (error) {
    console.error('createClientCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible crear el cliente' })
  }
}

export async function updateClientCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del cliente' })
  }

  const parsed = buildPayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const payload = await updateClient(id, parsed.data)
    if (!payload) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' })
    }
    return res.json({ success: true, data: payload })
  } catch (error) {
    console.error('updateClientCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible actualizar el cliente' })
  }
}

export async function deleteClientCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del cliente' })
  }

  try {
    await deleteClient(id)
    return res.status(204).send()
  } catch (error) {
    console.error('deleteClientCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible eliminar el cliente' })
  }
}
