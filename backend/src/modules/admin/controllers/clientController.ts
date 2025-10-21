import type { Request, Response } from 'express'
import {
  assignServiceToClient,
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

const parseServiceAssignmentPayload = (body: any) => {
  const serviceId = typeof body?.serviceId === 'string' ? body.serviceId.trim() : ''
  const started = typeof body?.started === 'string' ? body.started : null
  const delivery = typeof body?.delivery === 'string' ? body.delivery : null
  const expiry = typeof body?.expiry === 'string' ? body.expiry : null
  const frequencyValue = typeof body?.frequencyValue === 'string' ? body.frequencyValue : null
  const frequencyUnit = typeof body?.frequencyUnit === 'string' ? body.frequencyUnit : null
  const urlApi = typeof body?.urlApi === 'string' ? body.urlApi : null
  const tokenApi = typeof body?.tokenApi === 'string' ? body.tokenApi : null

  if (!serviceId) {
    return { error: 'El servicio a asignar es obligatorio' }
  }

  return {
    data: {
      serviceId,
      started,
      delivery,
      expiry,
      frequencyValue,
      frequencyUnit,
      urlApi,
      tokenApi,
    },
  }
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

  const parsed = parseServiceAssignmentPayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const result = await assignServiceToClient(id, parsed.data)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    console.error('assignClientServiceCtrl error', error)
    if (error instanceof Error) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Cliente no encontrado' })
      }
      if (error.message === 'SERVICE_NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Servicio no encontrado' })
      }
      if (error.message === 'SERVICE_ALREADY_ASSIGNED') {
        return res.status(409).json({ success: false, message: 'El servicio ya está asignado al cliente' })
      }
      if (error.message === 'SERVICE_ID_REQUIRED') {
        return res.status(400).json({ success: false, message: 'El servicio es obligatorio' })
      }
    }
    return res.status(500).json({ success: false, message: 'No fue posible asignar el servicio' })
  }
}
