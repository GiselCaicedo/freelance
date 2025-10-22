import { Router } from 'express'
import {
  createClientCtrl,
  deleteClientCtrl,
  getClientByIdCtrl,
  listClientsCtrl,
  updateClientCtrl,
} from '../controllers/clientController.js'

const clientRoutes = Router()

clientRoutes.get('/', listClientsCtrl)
clientRoutes.post('/', createClientCtrl)
clientRoutes.get('/:id', getClientByIdCtrl)
clientRoutes.put('/:id', updateClientCtrl)
clientRoutes.delete('/:id', deleteClientCtrl)

export default clientRoutes
