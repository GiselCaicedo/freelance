
import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'


export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err)

  // 1. Validacion Zod
  if (err instanceof ZodError) {
  const zodError = err as ZodError<any>
  const formattedErrors = zodError.issues.map((e) => ({
    campo: e.path.join('.'),
    detalle: e.message,
  }))

  console.log('Errores de validación Zod:', formattedErrors)

  res.status(400).json({
    message: 'Error de validación',
    errors: formattedErrors,
  })
  return
}

// 2. Errores de Prisma
if (err instanceof PrismaClientKnownRequestError) {
  let message = 'Error en base de datos'

  if (err.code === 'P2002') {
    message = 'Ya existe un registro con ese valor único'
  } else if (err.code === 'P2025') {
    message = 'El registro solicitado no existe'
  }

  res.status(400).json({
    message,
    code: err.code,
  })
  return
}

// 3. Otros 
if (err.statusCode) {
  res.status(err.statusCode).json({
    message: err.message || 'Error interno del servidor',
  })
  return
}

// ---------------------------
// 💥 4. Error genérico no controlado
// ---------------------------
res.status(500).json({
  message:
    process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message || 'Error desconocido',
})
}
