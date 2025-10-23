import { Router } from 'express'
import adminRoutes from '../modules/admin/routes/index.js'
import clientRoutes from '../modules/client/routes/index.js'

const apiRoutes = Router()

apiRoutes.use('/', adminRoutes)
apiRoutes.use('/client', clientRoutes)

export default apiRoutes
