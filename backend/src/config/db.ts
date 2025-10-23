 
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function connectDB() {
  try {
    await prisma.$connect()
    console.log('Conectado a la base de datos')
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error)
    process.exit(1)
  }
}

export { prisma, connectDB }
