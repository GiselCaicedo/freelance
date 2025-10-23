import { Router } from 'express'
import { createTaxCtrl, listTaxesCtrl } from '../controllers/taxController.js'

const taxRoutes = Router()

taxRoutes.get('/', listTaxesCtrl)
taxRoutes.post('/', createTaxCtrl)

export default taxRoutes
