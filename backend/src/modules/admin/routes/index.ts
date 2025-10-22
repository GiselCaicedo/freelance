 
import express from 'express'
import authRoutes from './authRoutes.js'
import utilsRoutes from './utilsRoutes.js'
import configRoutes from './configRoutes.js'
import dashboardRoutes from './dashboardRoutes.js'
import clientRoutes from './clientRoutes.js'
import quoteRoutes from './quoteRoutes.js'
import serviceRoutes from './serviceRoutes.js'
import { authenticate } from '../../../middlewares/authenticate.js'

const indexRoutes = express.Router()

indexRoutes.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

indexRoutes.use('/auth', authRoutes)
indexRoutes.use(authenticate)
indexRoutes.use('/utils', utilsRoutes)

indexRoutes.use('/config', configRoutes)
indexRoutes.use('/dashboard', dashboardRoutes)
indexRoutes.use('/clients', clientRoutes)
indexRoutes.use('/quotes', quoteRoutes)
indexRoutes.use('/services', serviceRoutes)


export default indexRoutes
