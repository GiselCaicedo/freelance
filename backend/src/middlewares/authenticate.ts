import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  const cookieToken = (req as any).cookies?.auth_token as string | undefined

  return cookieToken ?? null
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req)

    if (!token) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET as string)

    ;(req as any).user = payload

    return next()
  } catch (error) {
    console.error('Error validando token JWT:', error)
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

