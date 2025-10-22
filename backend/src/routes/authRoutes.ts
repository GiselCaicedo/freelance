import { Router } from 'express'
import { login, register, logOut } from '../controllers/authController.js'
import { validate } from '../middlewares/validateRequest.js'
import { loginSchema, registerSchema } from '../schemas/authSchema.js'

const authRoutes = Router()

authRoutes.post('/login', validate(loginSchema), login)

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado
 */

authRoutes.post('/register', validate(registerSchema), register)

// Pendiente ZOD
authRoutes.post('/logout', logOut)

export default authRoutes