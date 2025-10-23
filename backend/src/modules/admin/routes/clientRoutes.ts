import { Router } from 'express'
import {
  assignClientServiceCtrl,
  createClientCtrl,
  deleteClientCtrl,
  getClientByIdCtrl,
  listClientsCtrl,
  updateClientCtrl,
  updateClientServiceCtrl,
} from '../controllers/clientController.js'

const clientRoutes = Router()

clientRoutes.get('/', listClientsCtrl)
clientRoutes.post('/', createClientCtrl)
clientRoutes.get('/:id', getClientByIdCtrl)
clientRoutes.put('/:id', updateClientCtrl)
clientRoutes.post('/:id/services', assignClientServiceCtrl)
clientRoutes.put('/:id/services/:serviceId', updateClientServiceCtrl)
clientRoutes.delete('/:id', deleteClientCtrl)

export default clientRoutes
