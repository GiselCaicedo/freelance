import { Router } from 'express'
import { authenticate } from '../../../middlewares/authenticate.js'
import { getDashboardSummary, listRoles, listUsers } from '../controllers/clientController.js'
import { updateClientServiceCtrl } from '../controllers/serviceController.js'

const clientRoutes = Router()

clientRoutes.get('/health', (_req, res) => {
  res.json({ status: 'OK', scope: 'client' })
})

clientRoutes.use(authenticate)

// Endpoints cliente delegando en servicios compartidos
clientRoutes.get('/dashboard/summary', getDashboardSummary)
clientRoutes.get('/roles', listRoles)
clientRoutes.get('/users', listUsers)
clientRoutes.put('/services/:id', updateClientServiceCtrl)

export default clientRoutes
