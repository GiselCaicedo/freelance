import type { Request, Response } from 'express'
import { prisma } from '../../../config/db.js'
import { parseServicePayload } from '../../admin/controllers/serviceController.js'
import { updateService } from '../../admin/services/serviceService.js'

export async function updateClientServiceCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' })
  }

  const clientId = (req as any)?.user?.empresaid as string | undefined
  if (!clientId) {
    return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
  }

  const assignment = await prisma.client_service.findFirst({
    where: { client_id: clientId, service_id: id },
    select: { id: true },
  })

  if (!assignment) {
    return res.status(403).json({ success: false, message: 'El servicio no está asignado al cliente' })
  }

  const parsed = parseServicePayload(req.body)
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
    console.error('updateClientServiceCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible actualizar el servicio' })
  }
}
