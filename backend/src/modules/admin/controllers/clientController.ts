import type { Request, Response } from 'express'
import {
  assignServiceToClient,
  createClient,
  deleteClient,
  fetchClientById,
  fetchClientsWithDetails,
  updateClient,
  updateClientServiceAssignment,
  type ClientStatus,
  type ClientType,
  type AssignServicePayload,
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

const buildServiceAssignmentPayload = (body: any) => {
  const serviceId = typeof body?.serviceId === 'string' ? body.serviceId.trim() : ''
  if (!serviceId) {
    return { error: 'El servicio es obligatorio' }
  }

  const normalize = (value: any) => (typeof value === 'string' ? value.trim() : '')
  const nullable = (value: any) => {
    const normalized = normalize(value)
    return normalized.length > 0 ? normalized : null
  }

  const payload: AssignServicePayload = {
    serviceId,
    started: nullable(body?.started),
    delivery: nullable(body?.delivery),
    expiry: nullable(body?.expiry),
    frequency: nullable(body?.frequency),
    unit: nullable(body?.unit),
    urlApi: nullable(body?.urlApi),
    tokenApi: nullable(body?.tokenApi),
  }

  return { data: payload }
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

export async function assignClientServiceCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del cliente' })
  }

  const parsed = buildServiceAssignmentPayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const service = await assignServiceToClient(id, parsed.data)
    return res.status(201).json({ success: true, data: { service } })
  } catch (error: any) {
    console.error('assignClientServiceCtrl error', error)
    const message = typeof error?.message === 'string' ? error.message : 'No fue posible asignar el servicio'
    if (message === 'Cliente no encontrado' || message === 'Servicio no encontrado') {
      return res.status(404).json({ success: false, message })
    }
    return res.status(500).json({ success: false, message: 'No fue posible asignar el servicio' })
  }
}

export async function updateClientServiceCtrl(req: Request, res: Response) {
  const { id, serviceId } = req.params
  if (!id || !serviceId) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del cliente o del servicio' })
  }

  const parsed = buildServiceAssignmentPayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const service = await updateClientServiceAssignment(id, serviceId, parsed.data)
    return res.json({ success: true, data: { service } })
  } catch (error: any) {
    console.error('updateClientServiceCtrl error', error)
    const message = typeof error?.message === 'string' ? error.message : 'No fue posible actualizar el servicio del cliente'
    if (message === 'Asignación de servicio no encontrada' || message === 'Servicio no encontrado') {
      return res.status(404).json({ success: false, message })
    }
    return res.status(500).json({ success: false, message: 'No fue posible actualizar el servicio del cliente' })
  }
}
