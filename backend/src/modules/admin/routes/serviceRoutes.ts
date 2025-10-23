import { Router } from 'express'
import {
  createServiceCtrl,
  deleteServiceCtrl,
  getServiceByIdCtrl,
  listServiceCategoriesCtrl,
  listServicesCtrl,
  updateServiceCtrl,
} from '../controllers/serviceController.js'

const serviceRoutes = Router()

serviceRoutes.get('/', listServicesCtrl)
serviceRoutes.get('/categories', listServiceCategoriesCtrl)
serviceRoutes.post('/', createServiceCtrl)
serviceRoutes.get('/:id', getServiceByIdCtrl)
serviceRoutes.put('/:id', updateServiceCtrl)
serviceRoutes.delete('/:id', deleteServiceCtrl)

export default serviceRoutes
