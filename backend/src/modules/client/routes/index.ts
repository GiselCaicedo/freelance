import { Router } from 'express'

const clientRoutes = Router()

clientRoutes.get('/health', (_req, res) => {
  res.json({ status: 'OK', scope: 'client' })
})

export default clientRoutes
