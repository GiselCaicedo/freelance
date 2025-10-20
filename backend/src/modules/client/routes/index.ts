import { Router } from 'express'
import { authenticate } from '../../../middlewares/authenticate.js'
import { listRoles, listUsers } from '../controllers/clientController.js'

const clientRoutes = Router()

clientRoutes.get('/health', (_req, res) => {
  res.json({ status: 'OK', scope: 'client' })
})

clientRoutes.use(authenticate)

// Endpoints cliente delegando en servicios compartidos
clientRoutes.get('/roles', listRoles)
clientRoutes.get('/users', listUsers)

export default clientRoutes
