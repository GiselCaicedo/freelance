import type { Request, Response } from 'express'
import type { Request, Response } from 'express'
import * as authService from '../services/authService.js'

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body
    if (!identifier || !password)
      return res.status(400).json({ message: 'Faltan credenciales' })

    const { token, user } = await authService.loginUser(identifier, password)

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    })

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      user,
    })
  } catch (error: any) {
    console.error('Error en login:', error)
    
    return res.status(500).json({ message: error.message || 'Error interno del servidor' })

  }
}


export const register = async (req: Request, res: Response) => {
  try {
    const { user, name, password, role_id, business_id, ...rest } = req.body

    if (!user || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son obligatorios' })
    }

    const newUser = await authService.registerUser({ user, name, password, role_id, business_id, ...rest })

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: {
        id: newUser.id,
        user: newUser.user,
        name: newUser.name,
      },
    })
  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}


export const logOut = (req: Request, res: Response) => {
  console.log('Cerrando sesión del usuario')
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
  res.status(200).json({ message: 'Cierre de sesión exitoso' })
}