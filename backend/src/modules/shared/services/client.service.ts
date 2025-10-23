import { prisma } from '../../../config/db.ts'

export const listActiveClients = async (minimal = true) => {
  const select = minimal ? { id: true, name: true } : undefined
  return prisma.client.findMany({
    select: select as any,
    where: { status: true },
  })
}

