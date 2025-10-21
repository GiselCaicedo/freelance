import type { Request, Response } from 'express'
import { fetchClientById, fetchClientsWithDetails } from '../services/clientService.js'

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
