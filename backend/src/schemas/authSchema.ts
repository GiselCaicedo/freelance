 
import { z } from 'zod'
import { sanitizeString } from '../utils/sanitize.js'

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, { message: 'El usuario o correo es obligatorio' })
    .trim(),
  password: z
    .string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    .trim(),
})

export const registerSchema = z.object({
  user: z
    .string()
    .min(3, { message: 'El nombre de usuario es obligatorio' })
    .trim(),

  name: z
    .string()
    .min(3, { message: 'El nombre es obligatorio' })
    .trim(),

  password: z
    .string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    .trim(),

  role_id: z.string(),
  client_id: z.string(),
})



export const commentSchema = z.object({
  text: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .transform(sanitizeString),
})

