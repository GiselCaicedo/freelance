import express from 'express'
import helmet from 'helmet'
import xss from 'xss-clean'
import hpp from 'hpp'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { errorHandler } from './middlewares/errorHandler.js'
import indexRoutes from './routes/index.js'
import { swaggerSpec, swaggerUi } from './config/swagger.js'

const app = express()

app.use(express.json({ limit: '25mb' }))
app.use(cookieParser())

// Seguridad 

app.use(helmet()) // Para proteger cabeceras HTTP
// Para proteger contra ataques XSS, se implemento /services/sanitize.ts
app.use(hpp()) // Para proteger contra ataques de inyección HTTP Parameter Pollution

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100
})

app.use(limiter)

app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true, 
  })
)

const uploadsDir = path.resolve('uploads')
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true })
}

app.use('/uploads', express.static(uploadsDir))

app.use('/', indexRoutes)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// connectDB().then(() => {
//   app.listen(3000, () => {
//     console.log('Servidor http://localhost:3000')
//   })
// })


app.use(errorHandler)

export { app }