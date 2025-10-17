import { Router } from 'express'
import { getRoles, getBusiness } from '../controllers/utilsController.js'

const utilsRoutes = Router()

utilsRoutes.get('/get-roles', getRoles)
utilsRoutes.get('/get-business', getBusiness)

export default utilsRoutes
