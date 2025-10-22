import type { Request, Response } from 'express'
import {
  createService,
  deleteService,
  fetchServiceById,
  fetchServiceCategories,
  listServices,
  ServiceHasAssignmentsError,
  type ServiceStatus,
  updateService,
} from '../services/serviceService.js'

const isServiceStatus = (value: unknown): value is ServiceStatus => value === 'active' || value === 'inactive'

const sanitizeOptionalText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const parsePersistPayload = (body: any) => {
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const status = isServiceStatus(body?.status) ? body.status : 'active'
  const description = sanitizeOptionalText(body?.description)
  const unit = sanitizeOptionalText(body?.unit)
  const categoryId = sanitizeOptionalText(body?.categoryId)

  if (name.length === 0) {
    return { error: 'El nombre del servicio es obligatorio' }
  }

  return {
    data: {
      name,
      status,
      description,
      unit,
      categoryId,
    },
  }
}

export async function listServicesCtrl(_req: Request, res: Response) {
  try {
    const [services, categories] = await Promise.all([listServices(), fetchServiceCategories()])
    res.json({ success: true, data: { services, categories } })
  } catch (error) {
    console.error('listServicesCtrl error', error)
    res.status(500).json({ success: false, message: 'No fue posible obtener los servicios' })
  }
}

export async function getServiceByIdCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' })
  }

  const service = await fetchServiceById(id)
  if (!service) {
    return res.status(404).json({ success: false, message: 'Servicio no encontrado' })
  }

  return res.json({ success: true, data: { service } })
}

export async function createServiceCtrl(req: Request, res: Response) {
  const parsed = parsePersistPayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const service = await createService(parsed.data)
    return res.status(201).json({ success: true, data: { service } })
  } catch (error) {
    console.error('createServiceCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible crear el servicio' })
  }
}

export async function updateServiceCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' })
  }

  const parsed = parsePersistPayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const service = await updateService(id, parsed.data)
    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' })
    }
    return res.json({ success: true, data: { service } })
  } catch (error) {
    console.error('updateServiceCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible actualizar el servicio' })
  }
}

export async function deleteServiceCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' })
  }

  try {
    await deleteService(id)
    return res.status(204).send()
  } catch (error: any) {
    if (error instanceof ServiceHasAssignmentsError) {
      return res.status(409).json({ success: false, message: error.message })
    }
    if (error instanceof Error && error.message === 'SERVICE_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' })
    }

    console.error('deleteServiceCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible eliminar el servicio' })
  }
}

export async function listServiceCategoriesCtrl(_req: Request, res: Response) {
  try {
    const categories = await fetchServiceCategories()
    return res.json({ success: true, data: { categories } })
  } catch (error) {
    console.error('listServiceCategoriesCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener las categorías de servicio' })
  }
}
