import { app } from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'

const startServer = async (): Promise<void> => {
  try {
    await connectDB()
    app.listen(Number(env.PORT), () => {
      console.log(`Servidor ${env.PORT}`)
    })
  } catch (error) {
    console.error('Error al iniciar el servidor:', error)
    process.exit(1)
  }
}

startServer()
