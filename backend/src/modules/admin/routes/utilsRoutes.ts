import { Router } from 'express'
import { getRoles, getclient } from '../controllers/utilsController.js'

const utilsRoutes = Router()

utilsRoutes.get('/get-roles', getRoles)
utilsRoutes.get('/get-client', getclient)

export default utilsRoutes
