import { Router } from 'express'
import { getClientByIdCtrl, listClientsCtrl } from '../controllers/clientController.js'

const clientRoutes = Router()

clientRoutes.get('/', listClientsCtrl)
clientRoutes.get('/:id', getClientByIdCtrl)

export default clientRoutes
