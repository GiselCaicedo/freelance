 
import express from 'express'
import authRoutes from './authRoutes.js'
import utilsRoutes from './utilsRoutes.js'
import configRoutes from './configRoutes.js'
import { authenticate } from '../../../middlewares/authenticate.js'

const indexRoutes = express.Router()

indexRoutes.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

indexRoutes.use('/auth', authRoutes)
indexRoutes.use(authenticate)
indexRoutes.use('/utils', utilsRoutes)

indexRoutes.use('/config', configRoutes)


export default indexRoutes
