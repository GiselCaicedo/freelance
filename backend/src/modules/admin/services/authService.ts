
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../config/db.ts'

export const loginUser = async (identifier: string, password: string) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ user: identifier }, { name: identifier }],
    },
    include: {
      role: {
        include: {
          role_permission: {
            include: {
              permission: true,
            },
          },
        },
      },
      client: true,
    },
  });

  if (!user) throw new Error('Usuario no encontrado');

  const valid = await bcrypt.compare(password, user.pass);
  if (!valid) throw new Error('Contraseña incorrecta');

  const permissions =
    user.role?.role_permission.map((rp) => rp.permission.name) ?? [];

  console.log(user.client)

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role?.name,
      permissions,
      empresaid: user.client?.id || null,
      empresa: user.client?.name || null,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' }
  )


  await prisma.user.update({
    where: { id: user.id },
    data: { updated: new Date() },
  });

  return {
    token,
    user: {
      id: user.id,
      user: user.user,
      name: user.name,
      role: user.role?.name,
      client_id: user.client_id,
      client_name: user.client?.name,
      permissions,
    },
  };
};


export const registerUser = async (data: {
  user: string
  name: string
  password: string
  role_id?: number
  client_id?: number
}) => {
  const { user, name, password, role_id, client_id, ...rest } = data

  const existing = await prisma.user.findFirst({
    where: { OR: [{ user }, { name }] },
  })
  if (existing) throw new Error('El usuario ya existe')

  const hash = await bcrypt.hash(password, 10)

  const newUser = await prisma.user.create({
    data: {
      user,
      name,
      pass: hash,
      role_id,
      client_id,
      created: new Date(),
      updated: new Date(),
      status: true,
      ...rest,
    },
  })

  return {
    id: newUser.id,
    user: newUser.user,
    name: newUser.name,
  }
}
